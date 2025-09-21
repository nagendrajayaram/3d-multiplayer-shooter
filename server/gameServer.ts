import { WebSocket } from 'ws';
import { GameRoom } from './gameLogic';

interface Player {
  id: string;
  name: string;
  ws: WebSocket;
  position: [number, number, number];
  rotation: [number, number, number];
  health: number;
  color: string;
  roomId?: string;
}

export class GameServer {
  private players: Map<WebSocket, Player> = new Map();
  private rooms: Map<string, GameRoom> = new Map();
  private playerCounter = 0;

  constructor() {
    // Start game update loop
    setInterval(() => {
      this.updateAllRooms();
    }, 1000 / 60); // 60 FPS
  }

  handleConnection(ws: WebSocket) {
    const playerId = `player_${++this.playerCounter}`;
    const colors = ['#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff', '#44ffff'];
    
    const player: Player = {
      id: playerId,
      name: `Player ${this.playerCounter}`,
      ws,
      position: [0, 0.9, 0],
      rotation: [0, 0, 0],
      health: 100,
      color: colors[this.playerCounter % colors.length]
    };

    this.players.set(ws, player);

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(ws, message);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });

    console.log(`Player ${playerId} connected`);
  }

  handleDisconnection(ws: WebSocket) {
    const player = this.players.get(ws);
    if (player) {
      if (player.roomId) {
        const room = this.rooms.get(player.roomId);
        if (room) {
          room.removePlayer(player.id);
          
          // Remove empty rooms
          if (room.getPlayerCount() === 0) {
            this.rooms.delete(player.roomId);
          }
        }
      }
      
      this.players.delete(ws);
      console.log(`Player ${player.id} disconnected`);
    }
  }

  private handleMessage(ws: WebSocket, message: any) {
    const player = this.players.get(ws);
    if (!player) return;

    switch (message.type) {
      case 'create_room':
        this.handleCreateRoom(ws, message);
        break;
      
      case 'join_room':
        this.handleJoinRoom(ws, message);
        break;
      
      case 'player_update':
        this.handlePlayerUpdate(ws, message);
        break;
      
      case 'bullet_fired':
        this.handleBulletFired(ws, message);
        break;
      
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  private handleCreateRoom(ws: WebSocket, message: any) {
    const player = this.players.get(ws);
    if (!player) return;

    const roomCode = this.generateRoomCode();
    const room = new GameRoom(roomCode);
    
    player.name = message.playerName || player.name;
    room.addPlayer(player);
    player.roomId = roomCode;
    
    this.rooms.set(roomCode, room);

    ws.send(JSON.stringify({
      type: 'room_created',
      code: roomCode,
      playerId: player.id
    }));

    console.log(`Room ${roomCode} created by ${player.id}`);
  }

  private handleJoinRoom(ws: WebSocket, message: any) {
    const player = this.players.get(ws);
    if (!player) return;

    const room = this.rooms.get(message.code);
    if (!room) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Room not found'
      }));
      return;
    }

    if (room.getPlayerCount() >= 8) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Room is full'
      }));
      return;
    }

    player.name = message.playerName || player.name;
    room.addPlayer(player);
    player.roomId = message.code;

    ws.send(JSON.stringify({
      type: 'room_joined',
      playerId: player.id
    }));

    console.log(`Player ${player.id} joined room ${message.code}`);
  }

  private handlePlayerUpdate(ws: WebSocket, message: any) {
    const player = this.players.get(ws);
    if (!player || !player.roomId) return;

    player.position = message.position;
    player.rotation = message.rotation;
    player.health = message.health;

    const room = this.rooms.get(player.roomId);
    if (room) {
      room.broadcastPlayerUpdate(player);
    }
  }

  private handleBulletFired(ws: WebSocket, message: any) {
    const player = this.players.get(ws);
    if (!player || !player.roomId) return;

    const room = this.rooms.get(player.roomId);
    if (room) {
      room.handleBullet({
        id: message.id,
        playerId: player.id,
        position: message.position,
        direction: message.direction,
        weapon: message.weapon
      });
    }
  }

  private updateAllRooms() {
    this.rooms.forEach(room => {
      room.update();
    });
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  getPlayerCount(): number {
    return this.players.size;
  }

  getRoomCount(): number {
    return this.rooms.size;
  }
}
