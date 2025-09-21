import * as THREE from 'three';

interface AIBotState {
  id: string;
  name: string;
  position: [number, number, number];
  rotation: [number, number, number];
  health: number;
  isAlive: boolean;
  color: string;
  target?: string; // Target player ID
  lastShotTime: number;
  moveTarget: [number, number, number];
  lastMoveUpdate: number;
}

export class AIBot {
  private state: AIBotState;
  private weaponStats = {
    damage: 30,
    fireRate: 2, // shots per second
    range: 50,
    accuracy: 0.8
  };

  constructor(id: string, spawnPosition: [number, number, number]) {
    this.state = {
      id,
      name: `Bot_${id.slice(-3)}`,
      position: spawnPosition,
      rotation: [0, 0, 0],
      health: 100,
      isAlive: true,
      color: '#ff8800', // Orange color for bots
      lastShotTime: 0,
      moveTarget: spawnPosition,
      lastMoveUpdate: 0
    };
  }

  update(players: Map<string, any>, obstacles: any[]): any[] {
    if (!this.state.isAlive) return [];

    const now = Date.now();
    const actions: any[] = [];

    // Update movement
    if (now - this.state.lastMoveUpdate > 2000) { // Change direction every 2 seconds
      this.selectNewMoveTarget();
      this.state.lastMoveUpdate = now;
    }

    this.updateMovement();

    // Find and engage targets
    const nearestPlayer = this.findNearestPlayer(players);
    if (nearestPlayer && this.canSeeTarget(nearestPlayer, obstacles)) {
      this.state.target = nearestPlayer.id;
      
      // Aim at target
      this.aimAtTarget(nearestPlayer);

      // Shoot if conditions are met
      if (this.canShoot(nearestPlayer, now)) {
        const bulletAction = this.shoot(nearestPlayer);
        if (bulletAction) {
          actions.push(bulletAction);
        }
      }
    } else {
      this.state.target = undefined;
    }

    return actions;
  }

  private selectNewMoveTarget() {
    // Choose a random position within the map bounds
    const mapSize = 90; // Slightly smaller than full map to avoid edges
    const x = (Math.random() - 0.5) * mapSize;
    const z = (Math.random() - 0.5) * mapSize;
    this.state.moveTarget = [x, 0.9, z];
  }

  private updateMovement() {
    const speed = 0.05; // Bot movement speed
    const currentPos = new THREE.Vector3(...this.state.position);
    const targetPos = new THREE.Vector3(...this.state.moveTarget);
    
    const direction = targetPos.sub(currentPos);
    const distance = direction.length();
    
    if (distance > 1) {
      direction.normalize().multiplyScalar(speed);
      this.state.position[0] += direction.x;
      this.state.position[2] += direction.z;
      
      // Update rotation to face movement direction
      this.state.rotation[1] = Math.atan2(direction.x, direction.z);
    }
  }

  private findNearestPlayer(players: Map<string, any>): any | null {
    let nearest = null;
    let nearestDistance = Infinity;
    
    const botPos = new THREE.Vector3(...this.state.position);
    
    players.forEach(player => {
      if (!player.isAlive) return;
      
      // Bots only target enemy teams (bots are red, so target blue players only)
      if (player.team === 'red') return;
      
      const playerPos = new THREE.Vector3(...player.position);
      const distance = botPos.distanceTo(playerPos);
      
      if (distance < nearestDistance && distance < this.weaponStats.range) {
        nearest = player;
        nearestDistance = distance;
      }
    });
    
    return nearest;
  }

  private canSeeTarget(target: any, obstacles: any[]): boolean {
    // Simplified line-of-sight check
    const botPos = new THREE.Vector3(...this.state.position);
    const targetPos = new THREE.Vector3(...target.position);
    
    // For now, assume clear line of sight if within range
    // In a more sophisticated version, we'd check for obstacles
    return botPos.distanceTo(targetPos) < this.weaponStats.range;
  }

  private aimAtTarget(target: any) {
    const botPos = new THREE.Vector3(...this.state.position);
    const targetPos = new THREE.Vector3(...target.position);
    
    const direction = targetPos.sub(botPos);
    this.state.rotation[1] = Math.atan2(direction.x, direction.z);
  }

  private canShoot(target: any, now: number): boolean {
    const minTimeBetweenShots = 1000 / this.weaponStats.fireRate;
    const timeSinceLastShot = now - this.state.lastShotTime;
    
    return timeSinceLastShot >= minTimeBetweenShots;
  }

  private shoot(target: any): any | null {
    this.state.lastShotTime = Date.now();
    
    const botPos = new THREE.Vector3(...this.state.position);
    const targetPos = new THREE.Vector3(...target.position);
    
    // Add some inaccuracy to make bots less perfect
    const inaccuracy = (1 - this.weaponStats.accuracy) * 0.2;
    const direction = targetPos.sub(botPos).normalize();
    direction.x += (Math.random() - 0.5) * inaccuracy;
    direction.y += (Math.random() - 0.5) * inaccuracy;
    direction.z += (Math.random() - 0.5) * inaccuracy;
    direction.normalize();
    
    const bulletStart = new THREE.Vector3(...this.state.position);
    bulletStart.y += 1.6; // Eye height
    
    return {
      type: 'bot_bullet',
      botId: this.state.id,
      position: bulletStart.toArray(),
      direction: direction.toArray(),
      weapon: 'rifle',
      damage: this.weaponStats.damage
    };
  }

  takeDamage(damage: number): boolean {
    if (!this.state.isAlive) return false;
    
    this.state.health -= damage;
    
    if (this.state.health <= 0) {
      this.state.isAlive = false;
      this.state.health = 0;
      return true; // Bot died
    }
    
    return false;
  }

  respawn(spawnPosition: [number, number, number]) {
    this.state.position = spawnPosition;
    this.state.health = 100;
    this.state.isAlive = true;
    this.state.target = undefined;
    this.state.lastShotTime = 0;
    this.selectNewMoveTarget();
  }

  getState(): AIBotState {
    return { ...this.state };
  }

  getId(): string {
    return this.state.id;
  }

  isAlive(): boolean {
    return this.state.isAlive;
  }
}