# Technical Documentation

## Architecture Overview

This 3D multiplayer shooting game is built with a modern web stack optimized for real-time gameplay and 3D rendering performance.

### System Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client (Web)  │    │   Game Server   │    │   PostgreSQL    │
│                 │    │                 │    │    Database     │
│  React Three    │◄──►│   Express.js    │◄──►│                 │
│     Fiber       │    │   + WebSocket   │    │   Drizzle ORM   │
│                 │    │                 │    │                 │
│  State Stores   │    │   Game Logic    │    │   User Data     │
│   (Zustand)     │    │   AI Bots       │    │   Game State    │
│                 │    │   Room System   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Frontend Architecture

### React Three Fiber Integration

The frontend uses React Three Fiber (R3F) to declaratively manage 3D scenes:

```typescript
// Core 3D scene structure
<Canvas>
  <GameWorld>
    <Player />
    <AIBots />
    <Vehicles />
    <Environment />
    <Effects />
  </GameWorld>
</Canvas>
```

### State Management with Zustand

Multiple specialized stores handle different aspects of the game:

- **usePlayer**: Player position, health, weapons, stats
- **useMultiplayer**: Room connections, other players, network state  
- **useWeapons**: Weapon types, ammo, shooting mechanics
- **useVehicles**: Vehicle physics, interactions, traffic system
- **useEffects**: Particle systems, visual effects, animations
- **useAudio**: Sound effects, music, audio settings
- **useCamera**: View modes, rotation, follow mechanics

### Component Architecture

```typescript
// Game component hierarchy
GameWorld
├── Player
│   ├── FirstPersonHands
│   ├── Weapon (forwardRef for anchor points)
│   └── Movement
├── AIBot[]
├── Vehicle[]
├── Environment
│   ├── Buildings
│   ├── Roads
│   ├── TrafficSignals
│   └── PowerUps
├── Effects
│   ├── ParticleSystem
│   ├── MuzzleFlash
│   └── BulletTrails
└── Camera
    ├── FirstPersonCamera
    ├── ThirdPersonCamera
    └── SecondPersonCamera
```

### Key Technical Implementations

#### Weapon System with Anchor Points

```typescript
// Weapon component exposes anchor points via forwardRef
const Weapon = forwardRef<WeaponRef>((props, ref) => {
  const gripAnchor = useRef<THREE.Object3D>(null!)
  const supportAnchor = useRef<THREE.Object3D>(null!)
  const muzzleAnchor = useRef<THREE.Object3D>(null!)
  
  useImperativeHandle(ref, () => ({
    getGripAnchor: () => gripAnchor.current,
    getSupportAnchor: () => supportAnchor.current,
    getMuzzleAnchor: () => muzzleAnchor.current,
  }))
  
  // Weapon model with anchor positioning
  return (
    <group>
      <primitive object={model} />
      <object3D ref={gripAnchor} position={[-0.1, -0.3, 0]} />
      <object3D ref={supportAnchor} position={[0.4, -0.1, 0]} />  
      <object3D ref={muzzleAnchor} position={[0.8, 0.05, 0]} />
    </group>
  )
})
```

#### First-Person Hands

```typescript
// Hands positioned relative to weapon anchor points
export function FirstPersonHands({ weaponRef }: { weaponRef: WeaponRef }) {
  useFrame(() => {
    if (weaponRef && rightHand.current && leftHand.current) {
      // Position hands at weapon anchor points
      const gripAnchor = weaponRef.getGripAnchor()
      const supportAnchor = weaponRef.getSupportAnchor()
      
      if (gripAnchor && supportAnchor) {
        const gripWorldPos = new THREE.Vector3()
        const supportWorldPos = new THREE.Vector3()
        
        gripAnchor.getWorldPosition(gripWorldPos)
        supportAnchor.getWorldPosition(supportWorldPos)
        
        rightHand.current.position.copy(gripWorldPos)
        leftHand.current.position.copy(supportWorldPos)
      }
    }
  })
}
```

#### Camera System

```typescript
// Multiple camera modes with smooth transitions
export function GameCamera() {
  const { cameraMode, playerPosition, playerRotation } = useCamera()
  
  useFrame(() => {
    switch (cameraMode) {
      case 'first-person':
        // Camera at player eye level
        camera.position.copy(playerPosition)
        camera.position.y += 1.7 // Eye height
        break
        
      case 'third-person':
        // Camera behind and above player
        const offset = new THREE.Vector3(0, 2, -5)
        offset.applyQuaternion(playerRotation)
        camera.position.copy(playerPosition).add(offset)
        break
        
      case 'second-person':
        // Camera in front of player
        const frontOffset = new THREE.Vector3(0, 1.7, 3)
        frontOffset.applyQuaternion(playerRotation)
        camera.position.copy(playerPosition).add(frontOffset)
        break
    }
  })
}
```

### Performance Optimizations

1. **Object Pooling**: Bullets and particles use object pools
2. **Level-of-Detail (LOD)**: Distance-based model complexity
3. **Frustum Culling**: Only render visible objects
4. **Texture Atlasing**: Combined textures reduce draw calls
5. **Instanced Rendering**: Efficient rendering of similar objects

## Backend Architecture

### Express.js Server

```typescript
// Main server setup
const app = express()
const server = createServer(app)
const wss = new WebSocketServer({ server })

// Game state management
const gameRooms = new Map<string, GameRoom>()
const aiManager = new AIBotManager()
```

### WebSocket Communication Protocol

```typescript
// Message types for client-server communication
type GameMessage = 
  | { type: 'player_move', position: Vector3, rotation: Euler }
  | { type: 'player_shoot', weaponId: string, direction: Vector3 }
  | { type: 'vehicle_enter', vehicleId: string }
  | { type: 'chat_message', message: string }
  | { type: 'room_join', roomId: string }

// Server message handling
ws.on('message', (data) => {
  const message: GameMessage = JSON.parse(data.toString())
  
  switch (message.type) {
    case 'player_move':
      updatePlayerPosition(playerId, message.position, message.rotation)
      broadcastToRoom(roomId, message)
      break
      
    case 'player_shoot':
      processBullet(playerId, message.weaponId, message.direction)
      break
  }
})
```

### Game Room System

```typescript
class GameRoom {
  private players = new Map<string, Player>()
  private aiBots = new Map<string, AIBot>()
  private vehicles = new Map<string, Vehicle>()
  private bullets = new Set<Bullet>()
  
  update(deltaTime: number) {
    // Update AI bots
    this.aiBots.forEach(bot => bot.update(deltaTime))
    
    // Update bullets
    this.bullets.forEach(bullet => {
      bullet.update(deltaTime)
      this.checkBulletCollisions(bullet)
    })
    
    // Update vehicles
    this.vehicles.forEach(vehicle => vehicle.update(deltaTime))
    
    // Broadcast state to all players
    this.broadcastGameState()
  }
}
```

### AI Bot Implementation

```typescript
class AIBot {
  private pathfinding: AStarPathfinder
  private target: Player | null = null
  private state: 'idle' | 'patrolling' | 'chasing' | 'combat' = 'idle'
  
  update(deltaTime: number) {
    switch (this.state) {
      case 'patrolling':
        this.patrol(deltaTime)
        this.checkForPlayers()
        break
        
      case 'chasing':
        if (this.target) {
          this.moveToTarget(this.target.position)
          if (this.canShoot(this.target)) {
            this.state = 'combat'
          }
        }
        break
        
      case 'combat':
        if (this.target) {
          this.aimAndShoot(this.target)
        }
        break
    }
  }
}
```

## Database Schema

### User Management

```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  stats JSONB DEFAULT '{}'
);

-- Player statistics
CREATE TABLE player_stats (
  user_id INTEGER REFERENCES users(id),
  kills INTEGER DEFAULT 0,
  deaths INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  time_played INTEGER DEFAULT 0, -- seconds
  favorite_weapon VARCHAR(100),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Drizzle ORM Integration

```typescript
// Schema definition with Drizzle
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  lastLogin: timestamp('last_login'),
  stats: json('stats').default({})
})

export const playerStats = pgTable('player_stats', {
  userId: integer('user_id').references(() => users.id),
  kills: integer('kills').default(0),
  deaths: integer('deaths').default(0),
  wins: integer('wins').default(0),
  losses: integer('losses').default(0),
  timePlayed: integer('time_played').default(0),
  favoriteWeapon: varchar('favorite_weapon', { length: 100 }),
  updatedAt: timestamp('updated_at').defaultNow()
})
```

## Real-time Communication

### WebSocket Message Flow

```
Client                     Server                    Other Clients
  │                          │                           │
  │──── player_move ────────►│                           │
  │                          │────── broadcast ────────►│
  │                          │                           │
  │◄──── enemy_move ─────────│◄───── player_move ───────│
  │                          │                           │
  │──── shoot_bullet ───────►│                           │
  │                          │────── process_hit ──────►│
  │                          │────── update_health ────►│
```

### Network Optimization

1. **Delta Compression**: Only send changed data
2. **Client Prediction**: Immediate local updates
3. **Server Reconciliation**: Authoritative server state
4. **Lag Compensation**: Rollback for hit detection

## Graphics and Rendering

### Three.js Rendering Pipeline

```typescript
// Custom shader materials for enhanced visuals
const bulletMaterial = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0 },
    color: { value: new THREE.Color(0xffff00) }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float time;
    uniform vec3 color;
    varying vec2 vUv;
    
    void main() {
      float alpha = 1.0 - distance(vUv, vec2(0.5)) * 2.0;
      gl_FragColor = vec4(color, alpha * (0.5 + 0.5 * sin(time * 10.0)));
    }
  `
})
```

### Particle Systems

```typescript
class ParticleSystem {
  private particles: Particle[] = []
  private geometry = new THREE.BufferGeometry()
  private material = new THREE.PointsMaterial()
  
  emit(position: THREE.Vector3, type: 'muzzle' | 'impact' | 'smoke') {
    const config = this.getParticleConfig(type)
    
    for (let i = 0; i < config.count; i++) {
      this.particles.push(new Particle({
        position: position.clone(),
        velocity: this.randomVelocity(config),
        life: config.lifetime,
        color: config.color
      }))
    }
  }
  
  update(deltaTime: number) {
    this.particles = this.particles.filter(particle => {
      particle.update(deltaTime)
      return particle.isAlive()
    })
    
    this.updateGeometry()
  }
}
```

## Audio System

### Spatial Audio Implementation

```typescript
class AudioManager {
  private listener = new THREE.AudioListener()
  private sounds = new Map<string, THREE.Audio>()
  
  playWeaponSound(weaponType: string, position: THREE.Vector3) {
    const audioConfig = this.weaponSounds[weaponType]
    if (!audioConfig) return
    
    const sound = new THREE.PositionalAudio(this.listener)
    sound.setBuffer(audioConfig.buffer)
    sound.setVolume(audioConfig.volume)
    sound.setDistanceModel('inverse')
    sound.setRefDistance(10)
    
    // Position the sound in 3D space
    const soundObject = new THREE.Object3D()
    soundObject.position.copy(position)
    soundObject.add(sound)
    
    sound.play()
  }
}
```

## Physics and Collision Detection

### AABB Collision System

```typescript
class CollisionDetector {
  checkAABB(boxA: THREE.Box3, boxB: THREE.Box3): boolean {
    return (
      boxA.max.x >= boxB.min.x && boxA.min.x <= boxB.max.x &&
      boxA.max.y >= boxB.min.y && boxA.min.y <= boxB.max.y &&
      boxA.max.z >= boxB.min.z && boxA.min.z <= boxB.max.z
    )
  }
  
  raycast(origin: THREE.Vector3, direction: THREE.Vector3, objects: THREE.Object3D[]): Intersection[] {
    const raycaster = new THREE.Raycaster(origin, direction)
    return raycaster.intersectObjects(objects, true)
  }
}
```

### Vehicle Physics

```typescript
class Vehicle {
  private velocity = new THREE.Vector3()
  private acceleration = new THREE.Vector3()
  private friction = 0.95
  
  update(deltaTime: number) {
    // Apply forces
    this.velocity.add(this.acceleration.clone().multiplyScalar(deltaTime))
    
    // Apply friction
    this.velocity.multiplyScalar(this.friction)
    
    // Update position
    this.position.add(this.velocity.clone().multiplyScalar(deltaTime))
    
    // Ground collision
    if (this.position.y < 0) {
      this.position.y = 0
      this.velocity.y = 0
    }
  }
}
```

## Security Considerations

### Client-Server Validation

```typescript
// Server-side validation for all player actions
function validatePlayerMove(playerId: string, newPosition: THREE.Vector3): boolean {
  const player = getPlayer(playerId)
  const distance = player.position.distanceTo(newPosition)
  const maxSpeed = 10 // meters per second
  const deltaTime = getCurrentTime() - player.lastUpdate
  
  // Check if movement is physically possible
  if (distance > maxSpeed * deltaTime) {
    console.warn(`Player ${playerId} attempted invalid movement`)
    return false
  }
  
  return true
}
```

### Rate Limiting

```typescript
class RateLimiter {
  private actions = new Map<string, number[]>()
  
  checkRate(playerId: string, action: string, limit: number, windowMs: number): boolean {
    const now = Date.now()
    const key = `${playerId}:${action}`
    
    if (!this.actions.has(key)) {
      this.actions.set(key, [])
    }
    
    const timestamps = this.actions.get(key)!
    const validTimestamps = timestamps.filter(time => now - time < windowMs)
    
    if (validTimestamps.length >= limit) {
      return false // Rate limit exceeded
    }
    
    validTimestamps.push(now)
    this.actions.set(key, validTimestamps)
    return true
  }
}
```

## Performance Monitoring

### Client-side Performance Tracking

```typescript
class PerformanceMonitor {
  private frameRate = 0
  private lastFrameTime = 0
  
  update() {
    const now = performance.now()
    const deltaTime = now - this.lastFrameTime
    this.frameRate = 1000 / deltaTime
    
    // Log performance warnings
    if (this.frameRate < 30) {
      console.warn('Low framerate detected:', this.frameRate)
    }
    
    this.lastFrameTime = now
  }
  
  getStats() {
    return {
      fps: this.frameRate,
      memory: performance.memory?.usedJSHeapSize || 0,
      triangles: this.getTriangleCount()
    }
  }
}
```

## Build and Deployment

### Vite Configuration

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          three: ['three', '@react-three/fiber', '@react-three/drei']
        }
      }
    }
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
})
```

### Production Optimizations

1. **Code Splitting**: Dynamic imports for routes
2. **Asset Optimization**: Compressed textures and models
3. **Bundle Analysis**: Webpack bundle analyzer
4. **CDN Integration**: Static asset delivery
5. **Caching Strategy**: Browser and server caching

## Testing Strategy

### Unit Tests

```typescript
// Example test for collision detection
describe('CollisionDetector', () => {
  it('should detect AABB collision', () => {
    const boxA = new THREE.Box3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(1, 1, 1)
    )
    const boxB = new THREE.Box3(
      new THREE.Vector3(0.5, 0.5, 0.5),
      new THREE.Vector3(1.5, 1.5, 1.5)
    )
    
    const detector = new CollisionDetector()
    expect(detector.checkAABB(boxA, boxB)).toBe(true)
  })
})
```

### Integration Tests

```typescript
// WebSocket communication test
describe('Game Server', () => {
  it('should handle player movement messages', async () => {
    const client = new WebSocket('ws://localhost:5000')
    
    client.send(JSON.stringify({
      type: 'player_move',
      position: [1, 0, 1],
      rotation: [0, Math.PI / 2, 0]
    }))
    
    const response = await waitForMessage(client)
    expect(response.type).toBe('player_updated')
  })
})
```

This technical documentation provides a comprehensive overview of the game's architecture, implementation details, and development practices. It serves as a reference for developers working on the project and helps maintain code quality and consistency.