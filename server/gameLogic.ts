import { AIBot } from './aiBot';

export type Team = 'red' | 'blue';

interface GamePlayer {
  id: string;
  name: string;
  ws: any;
  position: [number, number, number];
  rotation: [number, number, number];
  health: number;
  color: string;
  score: number;
  isAlive: boolean;
  lastShotTime: number;
  team: Team;
}

interface Bullet {
  id: string;
  playerId: string;
  position: [number, number, number];
  direction: [number, number, number];
  weapon: string;
  startTime: number;
  lastUpdateTime: number;
  speed: number;
  damage?: number;
}

export class GameRoom {
  private code: string;
  private players: Map<string, GamePlayer> = new Map();
  private bullets: Map<string, Bullet> = new Map();
  private bots: Map<string, AIBot> = new Map();
  private maxBots = 0; // Bots disabled
  private targetTotalPlayers = 6; // Target total players (humans + bots)
  private teamScores = { red: 0, blue: 0 };
  private scoreLimit = 50; // First team to 50 kills wins
  private gameEnded = false;

  constructor(code: string) {
    this.code = code;
    // Bots disabled - no initial bot spawning
  }

  private assignPlayerTeam(): Team {
    const playerCount = this.players.size;
    // Alternate teams: even players go to red, odd to blue
    return playerCount % 2 === 0 ? 'red' : 'blue';
  }

  private getTeamColor(team: Team): string {
    return team === 'red' ? '#ff4444' : '#4444ff';
  }

  private checkForVictory() {
    if (this.gameEnded) return;

    const { red, blue } = this.teamScores;
    let winningTeam: Team | null = null;

    if (red >= this.scoreLimit) {
      winningTeam = 'red';
    } else if (blue >= this.scoreLimit) {
      winningTeam = 'blue';
    }

    if (winningTeam) {
      this.gameEnded = true;
      this.broadcast({
        type: 'team_victory',
        winningTeam,
        finalScores: { red, blue },
        message: `${winningTeam.toUpperCase()} TEAM WINS!`
      });

      // Award victory bonus to winning team members
      this.players.forEach(player => {
        if (player.team === winningTeam) {
          player.score += 500; // Victory bonus
        }
      });
    }
  }

  getTeamScores() {
    return { ...this.teamScores };
  }

  addPlayer(player: any) {
    const team = this.assignPlayerTeam();
    const teamColor = this.getTeamColor(team);
    
    const gamePlayer: GamePlayer = {
      id: player.id,
      name: player.name,
      ws: player.ws,
      position: player.position,
      rotation: player.rotation,
      health: player.health,
      color: teamColor, // Use team color instead of random color
      score: 0,
      isAlive: true,
      lastShotTime: 0,
      team
    };

    this.players.set(player.id, gamePlayer);

    // Send player their own team and color information
    player.ws.send(JSON.stringify({
      type: 'team_assigned',
      team: gamePlayer.team,
      color: gamePlayer.color
    }));

    // Send current team scores to new player
    player.ws.send(JSON.stringify({
      type: 'team_scores_update',
      scores: this.teamScores
    }));
    
    // If game has ended, inform new player of victory state
    if (this.gameEnded && (this.teamScores.red >= this.scoreLimit || this.teamScores.blue >= this.scoreLimit)) {
      const winningTeam = this.teamScores.red >= this.scoreLimit ? 'red' : 'blue';
      player.ws.send(JSON.stringify({
        type: 'team_victory',
        winningTeam,
        finalScores: this.teamScores,
        message: `${winningTeam.toUpperCase()} TEAM WINS!`
      }));
    }
    
    // Notify other players
    this.broadcast({
      type: 'player_joined',
      playerId: player.id,
      playerName: player.name,
      position: player.position,
      rotation: player.rotation,
      health: player.health,
      color: gamePlayer.color,
      team: gamePlayer.team
    }, player.id);

    // Send existing players to new player
    this.players.forEach((existingPlayer, id) => {
      if (id !== player.id) {
        player.ws.send(JSON.stringify({
          type: 'player_joined',
          playerId: id,
          playerName: existingPlayer.name,
          position: existingPlayer.position,
          rotation: existingPlayer.rotation,
          health: existingPlayer.health,
          color: existingPlayer.color,
          team: existingPlayer.team
        }));
      }
    });

    // Bots disabled - no bot data to send
    
    console.log(`Player ${player.name} joined room ${this.code} on team ${team}. Players: ${this.players.size}`);
    
    // Bots disabled - no bot adjustment needed
  }

  removePlayer(playerId: string) {
    const player = this.players.get(playerId);
    if (player) {
      this.players.delete(playerId);
      
      this.broadcast({
        type: 'player_left',
        playerId
      });
      
      console.log(`Player ${player.name} left room ${this.code}. Remaining players: ${this.players.size}`);
      
      // Bots disabled - no bot adjustment needed
    }
  }

  broadcastPlayerUpdate(player: any) {
    const gamePlayer = this.players.get(player.id);
    if (!gamePlayer) return;

    gamePlayer.position = player.position;
    gamePlayer.rotation = player.rotation;
    gamePlayer.health = player.health;

    this.broadcast({
      type: 'player_update',
      playerId: player.id,
      position: player.position,
      rotation: player.rotation,
      health: player.health
    }, player.id);
  }

  handleBullet(bulletData: any) {
    // Check rate limiting
    const player = this.players.get(bulletData.playerId);
    if (player) {
      const now = Date.now();
      const minTimeBetweenShots = 100; // 10 shots per second maximum
      if (now - player.lastShotTime < minTimeBetweenShots) {
        console.warn(`Rate limit exceeded for player ${bulletData.playerId}`);
        return;
      }
      player.lastShotTime = now;
    }
    
    // Normalize direction vector to ensure consistent bullet speed
    const dirLength = Math.sqrt(
      bulletData.direction[0] * bulletData.direction[0] +
      bulletData.direction[1] * bulletData.direction[1] +
      bulletData.direction[2] * bulletData.direction[2]
    );
    
    // Guard against zero-length direction vectors
    if (dirLength <= 1e-6) {
      console.warn('Invalid bullet direction received, dropping bullet');
      return;
    }
    
    const normalizedDirection: [number, number, number] = [
      bulletData.direction[0] / dirLength,
      bulletData.direction[1] / dirLength,
      bulletData.direction[2] / dirLength
    ];

    const now = Date.now();
    const bullet: Bullet = {
      id: bulletData.id,
      playerId: bulletData.playerId,
      position: bulletData.position,
      direction: normalizedDirection,
      weapon: bulletData.weapon,
      startTime: now,
      lastUpdateTime: now,
      speed: 100
    };

    this.bullets.set(bullet.id, bullet);

    // Broadcast bullet to all players with weapon-specific properties
    this.broadcast({
      type: 'bullet_fired',
      id: bullet.id,
      playerId: bullet.playerId,
      position: bullet.position,
      direction: bullet.direction,
      weapon: bullet.weapon,
      speed: this.getWeaponSpeed(bullet.weapon),
      damage: this.getWeaponDamage(bullet.weapon)
    });
  }

  update() {
    this.updateBullets();
    this.updateBots();
  }

  private updateBullets() {
    const now = Date.now();
    const bulletsToRemove: string[] = [];

    this.bullets.forEach((bullet, bulletId) => {
      const elapsed = now - bullet.startTime;
      
      // Remove bullets after 3 seconds
      if (elapsed > 3000) {
        bulletsToRemove.push(bulletId);
        return;
      }

      // Update bullet position using per-tick delta time
      const deltaTime = (now - bullet.lastUpdateTime) / 1000;
      bullet.position[0] += bullet.direction[0] * bullet.speed * deltaTime;
      bullet.position[1] += bullet.direction[1] * bullet.speed * deltaTime;
      bullet.position[2] += bullet.direction[2] * bullet.speed * deltaTime;
      bullet.lastUpdateTime = now;

      // Check for hits - stop checking other targets once we get a hit
      let bulletHit = false;
      
      // Check hits on players
      if (!bulletHit) {
        for (const [playerId, player] of this.players) {
          if (playerId === bullet.playerId || !player.isAlive) continue;
          
          // Skip friendly fire - check if shooter and target are on same team
          const shooter = this.players.get(bullet.playerId) || { team: 'red' }; // Bots are red team
          if (shooter.team === player.team) continue;

          const dx = bullet.position[0] - player.position[0];
          const dy = bullet.position[1] - player.position[1];
          const dz = bullet.position[2] - player.position[2];
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (distance < 1.0) { // Hit radius
            const damage = bullet.damage || this.getWeaponDamage(bullet.weapon);
            player.health -= damage;

            this.broadcast({
              type: 'player_hit',
              victimId: playerId,
              damage,
              weapon: bullet.weapon,
              bulletId: bullet.id // Send bullet ID for client removal
            });

            if (player.health <= 0) {
              player.isAlive = false;
              
              // Award points to shooter (only for enemy team kills)
              const shooter = this.players.get(bullet.playerId);
              const isBot = this.bots.has(bullet.playerId);
              
              if (shooter && shooter.team !== player.team) {
                // Human shooter killed enemy player
                if (!this.gameEnded) {
                  shooter.score += 100;
                  this.teamScores[shooter.team] += 1;
                  
                  // Broadcast updated team scores
                  this.broadcast({
                    type: 'team_scores_update',
                    scores: this.teamScores
                  });
                  
                  this.checkForVictory();
                }
              }

              const shooterName = shooter?.name || 'Unknown';

              this.broadcast({
                type: 'player_eliminated',
                victimId: playerId,
                victimName: player.name,
                killerId: bullet.playerId,
                killerName: shooterName,
                weapon: bullet.weapon
              });

              // Schedule respawn
              setTimeout(() => {
                if (this.players.has(playerId)) {
                  player.health = 100;
                  player.isAlive = true;
                  player.position = this.getRandomSpawnPoint();
                  
                  this.broadcast({
                    type: 'player_respawned',
                    playerId,
                    position: player.position
                  });
                }
              }, 3000);
            }

            bulletHit = true;
            bulletsToRemove.push(bulletId);
            break;
          }
        }
      }

      // Bots disabled - no bot hit detection needed
    });

    // Remove expired/hit bullets
    for (const bulletId of bulletsToRemove) {
      this.bullets.delete(bulletId);
    }
  }

  private getWeaponDamage(weapon: string): number {
    switch (weapon) {
      case 'pistol': return 25;
      case 'rifle': return 35;
      case 'shotgun': return 60; // Higher damage for closer range
      default: return 25;
    }
  }

  private getWeaponSpeed(weapon: string): number {
    switch (weapon) {
      case 'pistol': return 80;  // Slower bullets
      case 'rifle': return 120;  // Fast bullets
      case 'shotgun': return 60; // Slowest bullets
      default: return 100;
    }
  }

  private getRandomSpawnPoint(): [number, number, number] {
    const spawnPoints: [number, number, number][] = this.getSpawnPoints();
    return spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
  }

  private broadcast(message: any, excludePlayerId?: string) {
    this.players.forEach((player, playerId) => {
      if (playerId !== excludePlayerId && player.ws.readyState === 1) {
        try {
          player.ws.send(JSON.stringify(message));
        } catch (error) {
          console.error('Error sending message to player:', error);
        }
      }
    });
  }

  getPlayerCount(): number {
    return this.players.size;
  }

  getCode(): string {
    return this.code;
  }

  private adjustBotCount() {
    // Bots disabled - no bot management needed
    console.log('Bot adjustment disabled - no bots will be spawned');
  }

  private spawnBots(count: number = this.maxBots) {
    const spawnPoints = this.getSpawnPoints();
    
    let botsSpawned = 0;
    for (let i = 0; i < 10 && botsSpawned < count; i++) { // Try up to 10 bot IDs
      const botId = `bot_${this.bots.size + i + 1}`;
      
      // Only spawn if bot with this ID doesn't already exist
      if (!this.bots.has(botId)) {
        const spawnPoint = spawnPoints[(this.bots.size + i) % spawnPoints.length];
        const bot = new AIBot(botId, spawnPoint);
        this.bots.set(botId, bot);
        
        // Broadcast bot as a player to all clients
        this.broadcast({
          type: 'player_joined',
          playerId: botId,
          playerName: bot.getState().name,
          position: bot.getState().position,
          rotation: bot.getState().rotation,
          health: bot.getState().health,
          color: bot.getState().color,
          team: 'red' // All bots are on red team
        });
        
        botsSpawned++;
        console.log(`Spawned bot ${botId} at position`, spawnPoint);
      }
    }
    console.log(`Spawned ${botsSpawned} bots. Total bots: ${this.bots.size}`);
  }

  private removeBots(count: number) {
    const botIds = Array.from(this.bots.keys());
    const botsToRemove = botIds.slice(0, count);
    
    botsToRemove.forEach(botId => {
      this.bots.delete(botId);
      
      // Broadcast bot removal to all clients
      this.broadcast({
        type: 'player_left',
        playerId: botId
      });
      
      console.log(`Removed bot ${botId}`);
    });
    
    console.log(`Removed ${botsToRemove.length} bots. Total bots: ${this.bots.size}`);
  }

  private updateBots() {
    // Bots disabled - no bot updates needed
    return;
  }

  private handleBotBullet(action: any) {
    // Bots disabled - no bot bullets needed
    return;
  }

  private getSpawnPoints(): [number, number, number][] {
    return [
      [10, 0.9, 10],
      [-10, 0.9, 10],
      [10, 0.9, -10],
      [-10, 0.9, -10],
      [0, 0.9, 15],
      [0, 0.9, -15],
      [15, 0.9, 0],
      [-15, 0.9, 0],
      [25, 0.9, 5],
      [-25, 0.9, -5]
    ];
  }
}