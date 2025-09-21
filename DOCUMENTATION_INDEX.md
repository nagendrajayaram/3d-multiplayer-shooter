# Documentation Index

This project includes comprehensive documentation to help you understand, install, and develop the 3D multiplayer shooting game.

## 📖 Documentation Files

### 1. [README.md](./README.md)
**Main project documentation** - Start here!
- Complete game overview and features
- Installation guide for local development
- Game controls and gameplay tips
- System requirements and troubleshooting
- Project structure and development guidelines

### 2. [TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md)
**Detailed technical reference** - For developers
- Architecture overview and system design
- Frontend React Three Fiber implementation
- Backend Express.js and WebSocket server
- Database schema and Drizzle ORM usage
- Real-time communication protocols
- Graphics rendering and performance optimization
- Security considerations and testing strategies

### 3. [replit.md](./replit.md)
**Project architecture summary** - System overview
- User preferences and communication style
- Frontend and backend architecture decisions
- Database and external dependencies
- Game systems architecture (Player, AI, Vehicles, Weapons)
- Real-time communication design

### 4. [install.sh](./install.sh)
**Automated installation script** - One-click setup
- Checks system requirements (Node.js, npm, PostgreSQL)
- Installs dependencies automatically  
- Creates .env file with default configuration
- Runs build verification
- Provides step-by-step next actions

## 🎮 Game Features Summary

### Core Systems
- **Multiplayer Gameplay**: Real-time WebSocket-based multiplayer with room system
- **AI Bots**: Intelligent AI opponents with pathfinding and combat AI
- **Weapon Systems**: Multiple weapons (pistol, rifle, shotgun) with realistic mechanics
- **Vehicle System**: Interactive cars and trucks with physics simulation
- **Urban Environment**: Detailed cityscape with buildings, roads, and traffic
- **Advanced Graphics**: Particle effects, realistic lighting, and post-processing

### Technical Highlights
- **First-Person Hands**: Realistic hand models that grip weapons using anchor points
- **180-Degree Head Turn**: Instant camera rotation (T key) for tactical gameplay
- **Multi-Camera System**: First-person, third-person, and second-person views
- **Weapon Anchor System**: Precise positioning of hands, muzzle effects, and bullet spawning
- **Spatial Audio**: 3D positioned weapon sounds and environmental audio
- **Performance Optimized**: Object pooling, LOD, frustum culling for smooth gameplay

## 🚀 Quick Start Guide

### From Replit (Recommended)
1. Click project name → "Download as Zip"
2. Extract the zip file
3. Run: `./install.sh` (automated installation)
4. Follow the prompts for database setup
5. Start with: `npm run dev`
6. Play at: `http://localhost:5000`

### Manual Installation
1. Install Node.js 18+ and PostgreSQL 13+
2. Extract project and run: `npm install`
3. Create `.env` file with database credentials
4. Setup database: `npm run db:push`
5. Start server: `npm run dev`
6. Open browser: `http://localhost:5000`

## 🛠 Development Workflow

1. **Read README.md** for game overview and basic setup
2. **Check TECHNICAL_DOCUMENTATION.md** for implementation details
3. **Use install.sh** for automated local setup
4. **Reference replit.md** for architecture decisions
5. **Follow project structure** outlined in documentation
6. **Test changes** with `npm run dev`

## 📋 File Structure

```
├── README.md                     # Main project documentation
├── TECHNICAL_DOCUMENTATION.md    # Detailed technical reference  
├── DOCUMENTATION_INDEX.md        # This file - documentation guide
├── replit.md                     # Architecture summary
├── install.sh                    # Automated installation script
├── client/                       # Frontend React application
├── server/                       # Backend Express.js server
├── shared/                       # Shared types and schemas
└── package.json                  # Dependencies and scripts
```

## 🎯 Key Technologies

- **Frontend**: React, Three.js, React Three Fiber, Zustand, Tailwind CSS
- **Backend**: Express.js, WebSocket, Drizzle ORM, PostgreSQL  
- **Build**: Vite, TypeScript, ESBuild
- **3D Graphics**: Three.js with custom shaders and particle systems
- **Real-time**: WebSocket protocol for multiplayer communication

---

**Start with README.md for the complete experience!** 🎮

Each documentation file serves a specific purpose:
- **README.md**: Everything you need to get started
- **TECHNICAL_DOCUMENTATION.md**: Deep-dive technical details  
- **install.sh**: Automated setup script
- **replit.md**: Architecture and design decisions

Happy gaming and developing! 🚀