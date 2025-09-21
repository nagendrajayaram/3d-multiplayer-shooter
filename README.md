# 3D Multiplayer Shooting Game

A comprehensive 3D multiplayer first-person shooter built with React Three Fiber and Express.js, featuring real-time multiplayer gameplay, AI bots, vehicles, advanced weapon systems, and an immersive urban environment.

## 🎮 Game Features

### Core Gameplay
- **Real-time Multiplayer**: WebSocket-based multiplayer with room system
- **AI Bot Integration**: Intelligent AI opponents with pathfinding and combat behavior
- **First-Person Shooter Mechanics**: Realistic FPS controls and combat system
- **Team-Based Gameplay**: Organized team battles and objectives

### Weapon Systems
- **Multiple Weapon Types**: Pistol, rifle, shotgun with unique characteristics
- **Realistic Visual Effects**: Muzzle flashes, particle systems, bullet trails
- **Advanced Weapon Mechanics**: Recoil, damage systems, ammo management
- **Custom Tactical Rifle**: 3D modeled tactical rifle with realistic handling
- **First-Person Hands**: Realistic hand models that grip and hold weapons

### Environment & World
- **Urban Cityscape**: Detailed city environment with buildings and roads
- **Interactive Vehicles**: Cars and trucks with physics simulation
- **Traffic System**: Dynamic traffic with functioning traffic signals
- **Strategic Power-ups**: Strategically placed power-ups throughout the map
- **Teleportation System**: Fast travel system for tactical movement

### Technical Features
- **Cross-Device Compatibility**: Optimized for desktop and mobile devices
- **Advanced Camera System**: Multiple camera views (first-person, third-person, second-person)
- **180-Degree Head Turn**: Instant 180° camera rotation (T key)
- **Realistic Audio**: Weapon-specific sound effects and environmental audio
- **Enhanced Visual Effects**: Particle systems, lighting, and post-processing effects

## 🛠 Technical Stack

### Frontend
- **React 18** - Component-based UI framework
- **React Three Fiber** - Declarative 3D graphics with Three.js
- **Three.js** - 3D graphics library
- **Zustand** - State management
- **TanStack Query** - Server state management
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **TypeScript** - Type safety and development tooling

### Backend
- **Express.js** - Web server framework
- **WebSocket (ws)** - Real-time bidirectional communication
- **Drizzle ORM** - Type-safe database operations
- **PostgreSQL** - Primary database
- **Node.js** - JavaScript runtime

### Build & Development Tools
- **Vite** - Build tool and development server
- **ESBuild** - Fast JavaScript bundler
- **TypeScript** - Static type checking

## 🎯 Game Controls

### Movement
- **WASD** or **Arrow Keys** - Move forward/backward/left/right
- **Space** - Jump
- **Mouse** - Look around/aim

### Combat
- **Left Click** - Shoot
- **Right Click** - Aim down sights
- **R** - Reload weapon
- **1-3** - Switch weapons

### Special Actions
- **T** - 180-degree head turn (instant camera flip)
- **F** - Interact with vehicles/objects
- **Tab** - Show game menu/HUD
- **Escape** - Pause menu

## 🚀 Local Installation Guide

### Prerequisites
Ensure you have the following installed on your machine:
- **Node.js** (version 18 or higher)
- **npm** (version 8 or higher)
- **PostgreSQL** (version 13 or higher)

### Download from Replit
1. Open your Replit project
2. Click on the project name in the top-left corner
3. Select **"Download as Zip"**
4. Extract the zip file to your desired location

### Installation Steps

1. **Navigate to the project directory**
   ```bash
   cd your-project-folder
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   # Database Configuration
   DATABASE_URL="postgresql://username:password@localhost:5432/shooter_game"
   
   # Session Secret (generate a secure random string)
   SESSION_SECRET="your-secure-session-secret-here"
   
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   ```

4. **Set up the database**
   ```bash
   # Create the database
   createdb shooter_game
   
   # Push the database schema
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the game**
   Open your browser and navigate to:
   ```
   http://localhost:5000
   ```

### Production Build

To create a production build:

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

## 📁 Project Structure

```
├── client/                 # Frontend React application
│   ├── public/            # Static assets (textures, models, sounds)
│   └── src/
│       ├── components/    # React components
│       │   ├── game/     # Game-specific components
│       │   ├── ui/       # UI components
│       │   └── effects/  # Visual effects components
│       ├── lib/          # Utilities and stores
│       │   └── stores/   # Zustand state stores
│       └── pages/        # Page components
├── server/                # Backend Express.js application
│   ├── index.ts          # Main server entry point
│   ├── gameServer.ts     # WebSocket game server
│   ├── gameLogic.ts      # Core game logic
│   ├── aiBot.ts          # AI bot implementation
│   └── routes.ts         # API routes
├── shared/                # Shared types and schemas
└── package.json          # Project dependencies
```

## 🎨 Assets

The game includes various assets located in `client/public/`:
- **Textures**: Surface materials for buildings, roads, and terrain
- **3D Models**: Custom tactical rifle and other game objects
- **Audio**: Weapon sounds, environmental audio, and effects
- **Fonts**: Custom typography for UI elements

## 🔧 Development

### Adding New Features
1. **Game Components**: Add new components in `client/src/components/game/`
2. **UI Components**: Create UI elements in `client/src/components/ui/`
3. **State Management**: Add stores in `client/src/lib/stores/`
4. **Server Logic**: Extend server functionality in `server/`

### Database Schema
The application uses Drizzle ORM with PostgreSQL. Schema definitions are in `shared/schema.ts`.

### WebSocket Communication
Real-time multiplayer communication is handled through WebSocket messages defined in the shared schema.

## 🎮 Gameplay Tips

1. **Master the Controls**: Practice movement and aiming in training mode
2. **Use Cover**: Take advantage of buildings and vehicles for protection
3. **Team Coordination**: Work with teammates for strategic advantages
4. **Weapon Selection**: Choose weapons based on combat situation
5. **Map Knowledge**: Learn power-up locations and strategic positions
6. **Vehicle Usage**: Use cars for fast movement and cover
7. **Audio Cues**: Listen for enemy footsteps and reload sounds

## 🐛 Troubleshooting

### Common Issues

**Game won't start:**
- Ensure all dependencies are installed: `npm install`
- Check that PostgreSQL is running
- Verify database connection string in `.env`

**WebSocket connection errors:**
- Check if port 5000 is available
- Ensure firewall isn't blocking the connection
- Verify server is running: `npm run dev`

**Performance issues:**
- Lower graphics settings in game menu
- Close other browser tabs
- Check system requirements

**Audio not working:**
- Check browser audio permissions
- Ensure audio files exist in `client/public/audio/`
- Verify browser supports Web Audio API

## 📋 System Requirements

### Minimum Requirements
- **OS**: Windows 10, macOS 10.14, or Ubuntu 18.04
- **Processor**: Intel Core i3 or AMD equivalent
- **Memory**: 4 GB RAM
- **Graphics**: DirectX 11 compatible card
- **Network**: Broadband internet connection
- **Browser**: Chrome 90+, Firefox 85+, Safari 14+

### Recommended Requirements
- **OS**: Windows 11, macOS 12, or Ubuntu 20.04
- **Processor**: Intel Core i5 or AMD Ryzen 5
- **Memory**: 8 GB RAM
- **Graphics**: Dedicated graphics card
- **Network**: Stable broadband connection
- **Browser**: Latest Chrome or Firefox

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -m 'Add new feature'`
5. Push to the branch: `git push origin feature/new-feature`
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎯 Future Roadmap

- [ ] Additional weapon types and attachments
- [ ] More map environments and game modes
- [ ] Enhanced AI bot behaviors
- [ ] Mobile app versions
- [ ] Ranking and progression system
- [ ] Clan and guild features
- [ ] Tournament and competitive modes
- [ ] VR support integration

---

**Enjoy the game!** 🎮🔫

For support or questions, please open an issue in the repository.