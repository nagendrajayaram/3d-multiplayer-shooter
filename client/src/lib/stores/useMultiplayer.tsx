import { create } from 'zustand';
import * as THREE from 'three';
import { usePlayer } from './usePlayer';
import { useEffects } from './useEffects';
import { useEconomy } from './useEconomy';

export type Team = 'red' | 'blue';

interface Player {
  id: string;
  name: string;
  position: [number, number, number];
  rotation: [number, number, number];
  health: number;
  color: string;
  team?: Team; // Optional for backward compatibility
}

interface Bullet {
  id: string;
  position: THREE.Vector3;
  direction: THREE.Vector3;
  speed: number;
  playerId: string;
  weapon: string;
}

interface KillFeedEntry {
  killer: string;
  victim: string;
  weapon: string;
  timestamp: number;
}

interface MultiplayerState {
  isConnected: boolean;
  roomCode: string | null;
  playerId: string | null;
  otherPlayers: Record<string, Player>;
  bullets: Bullet[];
  killFeed: KillFeedEntry[];
  playerCount: number;
  socket: WebSocket | null;
  playerTeam: Team | null;
  playerColor: string | null;
  teamScores: { red: number; blue: number };
  gameEnded: boolean;
  winningTeam: Team | null;

  // Actions
  connect: () => void;
  disconnect: () => void;
  createRoom: (playerName: string) => Promise<string | null>;
  joinRoom: (code: string, playerName: string) => Promise<boolean>;
  sendPlayerUpdate: (data: { position: THREE.Vector3; rotation: THREE.Euler; health: number }) => void;
  sendBullet: (data: { position: THREE.Vector3; direction: THREE.Vector3; weapon: string; playerId: string }) => void;
  addLocalBullet: (bulletData: Bullet) => void;
  removeBullet: (bulletId: string) => void;
}

export const useMultiplayer = create<MultiplayerState>((set, get) => ({
  isConnected: false,
  roomCode: null,
  playerId: null,
  otherPlayers: {},
  bullets: [],
  killFeed: [],
  playerCount: 1,
  socket: null,
  playerTeam: null,
  playerColor: null,
  teamScores: { red: 0, blue: 0 },
  gameEnded: false,
  winningTeam: null,

  connect: () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}/ws`);

    socket.onopen = () => {
      console.log('Connected to game server');
      set({ isConnected: true, socket });
    };

    socket.onclose = () => {
      console.log('Disconnected from game server');
      set({ isConnected: false, socket: null });
      
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        const { connect } = get();
        connect();
      }, 3000);
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleMessage(message, set, get);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.close();
    }
    set({ 
      isConnected: false, 
      socket: null, 
      otherPlayers: {}, 
      bullets: [],
      teamScores: { red: 0, blue: 0 },
      gameEnded: false,
      winningTeam: null,
      playerTeam: null,
      playerColor: null
    });
  },

  createRoom: async (playerName: string) => {
    const { socket } = get();
    if (!socket) return null;

    return new Promise((resolve) => {
      const tempHandler = (event: MessageEvent) => {
        const message = JSON.parse(event.data);
        if (message.type === 'room_created') {
          socket.removeEventListener('message', tempHandler);
          set({ 
            roomCode: message.code, 
            playerId: message.playerId,
            // Reset team state for new room
            teamScores: { red: 0, blue: 0 },
            gameEnded: false,
            winningTeam: null,
            playerTeam: null,
            playerColor: null
          });
          resolve(message.code);
        }
      };

      socket.addEventListener('message', tempHandler);
      socket.send(JSON.stringify({
        type: 'create_room',
        playerName
      }));

      // Timeout after 5 seconds
      setTimeout(() => {
        socket.removeEventListener('message', tempHandler);
        resolve(null);
      }, 5000);
    });
  },

  joinRoom: async (code: string, playerName: string) => {
    const { socket } = get();
    if (!socket) return false;

    return new Promise((resolve) => {
      const tempHandler = (event: MessageEvent) => {
        const message = JSON.parse(event.data);
        if (message.type === 'room_joined') {
          socket.removeEventListener('message', tempHandler);
          set({ 
            roomCode: code, 
            playerId: message.playerId,
            // Reset team state for new room
            teamScores: { red: 0, blue: 0 },
            gameEnded: false,
            winningTeam: null,
            playerTeam: null,
            playerColor: null
          });
          resolve(true);
        } else if (message.type === 'error') {
          socket.removeEventListener('message', tempHandler);
          resolve(false);
        }
      };

      socket.addEventListener('message', tempHandler);
      socket.send(JSON.stringify({
        type: 'join_room',
        code,
        playerName
      }));

      // Timeout after 5 seconds
      setTimeout(() => {
        socket.removeEventListener('message', tempHandler);
        resolve(false);
      }, 5000);
    });
  },

  sendPlayerUpdate: (data) => {
    const { socket, playerId } = get();
    if (!socket || !playerId) return;

    socket.send(JSON.stringify({
      type: 'player_update',
      playerId,
      position: data.position.toArray(),
      rotation: [data.rotation.x, data.rotation.y, data.rotation.z],
      health: data.health
    }));
  },

  sendBullet: (data) => {
    const { socket, playerId } = get();
    if (!socket || !playerId) return;

    const bulletData = {
      type: 'bullet_fired',
      playerId,
      position: data.position.toArray(),
      direction: data.direction.toArray(),
      weapon: data.weapon,
      id: `${playerId}_${Date.now()}_${Math.random()}`
    };

    socket.send(JSON.stringify(bulletData));
  },
  
  addLocalBullet: (bulletData: Bullet) => {
    console.log('Adding local bullet immediately:', bulletData);
    set((state: MultiplayerState) => ({
      bullets: [
        ...state.bullets,
        bulletData
      ]
    }));
  },

  removeBullet: (bulletId) => {
    set((state) => ({
      bullets: state.bullets.filter(bullet => bullet.id !== bulletId)
    }));
  }
}));

function handleMessage(message: any, set: any, get: any) {
  switch (message.type) {
    case 'team_assigned':
      console.log('Team assigned:', message.team, 'Color:', message.color);
      set({ playerTeam: message.team, playerColor: message.color });
      break;
      
    case 'team_scores_update':
      console.log('Team scores updated:', message.scores);
      set({ teamScores: message.scores });
      break;
      
    case 'team_victory':
      console.log('Team victory:', message.winningTeam, 'Final scores:', message.finalScores);
      set({ 
        gameEnded: true, 
        winningTeam: message.winningTeam,
        teamScores: message.finalScores 
      });
      break;
      
    case 'player_joined':
      set((state: MultiplayerState) => ({
        otherPlayers: {
          ...state.otherPlayers,
          [message.playerId]: {
            id: message.playerId,
            name: message.playerName,
            position: message.position,
            rotation: message.rotation,
            health: message.health,
            color: message.color,
            team: message.team || 'red' // Default to red if no team specified
          }
        },
        playerCount: state.playerCount + 1
      }));
      break;

    case 'player_left':
      set((state: MultiplayerState) => {
        const newPlayers = { ...state.otherPlayers };
        delete newPlayers[message.playerId];
        return {
          otherPlayers: newPlayers,
          playerCount: state.playerCount - 1
        };
      });
      break;

    case 'player_update':
      set((state: MultiplayerState) => ({
        otherPlayers: {
          ...state.otherPlayers,
          [message.playerId]: {
            ...state.otherPlayers[message.playerId],
            position: message.position,
            rotation: message.rotation,
            health: message.health
          }
        }
      }));
      break;

    case 'bullet_fired':
      console.log('Received bullet_fired message:', message);
      
      // Add muzzle flash effect for the shooter
      const bulletPos = new THREE.Vector3(message.position[0], message.position[1], message.position[2]);
      const effectsStore = useEffects.getState();
      effectsStore.addEffect('muzzleFlash', bulletPos, 1.5);
      
      const newBullet = {
        id: message.id,
        position: new THREE.Vector3(message.position[0], message.position[1], message.position[2]),
        direction: new THREE.Vector3(message.direction[0], message.direction[1], message.direction[2]),
        speed: message.speed || 50, // Use server's weapon-specific speed
        playerId: message.playerId,
        weapon: message.weapon
      };
      
      console.log('Adding bullet to render array:', newBullet);
      
      set((state: MultiplayerState) => ({
        bullets: [
          ...state.bullets,
          newBullet
        ]
      }));
      break;

    case 'player_hit':
      // Handle player hit
      if (message.victimId === get().playerId) {
        // Local player was hit - update their health
        const playerStore = usePlayer.getState();
        playerStore.takeDamage(message.damage);
      }
      
      // Add bullet impact effect
      if (message.victimId === get().playerId) {
        const playerPos = usePlayer.getState().position;
        const effectsStore = useEffects.getState();
        effectsStore.addEffect('bulletImpact', playerPos, 1.0);
      } else {
        // Impact on other player/bot
        const otherPlayer = get().otherPlayers[message.victimId];
        if (otherPlayer) {
          const effectsStore = useEffects.getState();
          effectsStore.addEffect('bulletImpact', new THREE.Vector3(otherPlayer.position[0], otherPlayer.position[1], otherPlayer.position[2]), 1.0);
        }
      }
      
      // Remove bullet that caused the hit from client visuals
      if (message.bulletId) {
        set((state: MultiplayerState) => ({
          bullets: state.bullets.filter(bullet => bullet.id !== message.bulletId)
        }));
      }
      break;

    case 'player_eliminated':
      // Check if local player is the killer and reward money
      if (message.killerId === get().playerId) {
        const economyStore = useEconomy.getState();
        const moneyEarned = economyStore.addKill(message.victimName);
        console.log(`You killed ${message.victimName} and earned $${moneyEarned}!`);
      }
      
      // Add death effect
      if (message.victimId === get().playerId) {
        const playerStore = usePlayer.getState();
        playerStore.takeDamage(1000); // Ensure player is dead
        
        // Add death effect for local player
        const effectsStore = useEffects.getState();
        effectsStore.addEffect('death', playerStore.position, 1.5);
      } else {
        // Death effect for other player/bot
        const otherPlayer = get().otherPlayers[message.victimId];
        if (otherPlayer) {
          const effectsStore = useEffects.getState();
          effectsStore.addEffect('death', new THREE.Vector3(otherPlayer.position[0], otherPlayer.position[1], otherPlayer.position[2]), 1.5);
        }
      }
      
      set((state: MultiplayerState) => ({
        killFeed: [
          ...state.killFeed,
          {
            killer: message.killerName,
            victim: message.victimName,
            weapon: message.weapon,
            timestamp: Date.now()
          }
        ].slice(-10) // Keep only last 10 entries
      }));
      break;

    default:
      console.log('Unknown message type:', message.type);
  }
}
