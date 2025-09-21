# Overview

This is a multiplayer 3D first-person shooter game built with React Three Fiber for the 3D rendering and Express.js with WebSocket for the backend. The application features real-time multiplayer gameplay with AI bots, vehicle interaction, weapon systems, and a comprehensive urban environment with buildings, roads, and interactive elements.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client uses a React-based architecture with Three.js integration through React Three Fiber. The UI is built with Radix UI components and styled with Tailwind CSS. State management is handled through multiple Zustand stores for different game aspects (player, multiplayer, weapons, vehicles, etc.).

**Key Design Decisions:**
- **React Three Fiber**: Chosen for seamless integration of 3D graphics with React's component model, enabling declarative 3D scene management
- **Multiple Zustand Stores**: Separates concerns across different game systems (player state, multiplayer connection, weapons, vehicles) for better maintainability and performance
- **Component-Based 3D Architecture**: Each game element (Player, AIBot, Bullet, Vehicle) is a separate React component for modularity

## Backend Architecture
The server uses Express.js with WebSocket integration for real-time communication. Game logic is centralized in server-side classes that manage rooms, players, AI bots, and game state synchronization.

**Key Design Decisions:**
- **WebSocket for Real-time Communication**: Enables low-latency multiplayer gameplay with immediate state updates
- **Room-Based Architecture**: Players are organized into game rooms for scalability and isolated game sessions
- **Server-Authoritative Logic**: All game logic runs on the server to prevent cheating and ensure consistent state

## Data Storage
The application uses Drizzle ORM with PostgreSQL for persistent data storage. Currently implements a basic user system with plans for expanded functionality.

**Key Design Decisions:**
- **Drizzle ORM**: Provides type-safe database operations with good TypeScript integration
- **PostgreSQL**: Chosen for reliability and advanced features needed for multiplayer game data
- **Minimal Schema**: Currently focuses on core user management with room for expansion

## Game Systems Architecture
The game implements several interconnected systems:

**Player System**: Handles movement, health, weapons, and vehicle interaction with collision detection and physics simulation.

**AI Bot System**: Server-managed AI entities with pathfinding, target acquisition, and combat behaviors.

**Vehicle System**: Interactive cars and trucks with physics simulation, traffic management, and player control capabilities.

**Weapon System**: Multiple weapon types (pistol, rifle, shotgun) with different characteristics, ammo management, and shooting mechanics.

**Effects System**: Particle effects for muzzle flashes, bullet impacts, and other visual feedback.

## Real-time Communication
Uses WebSocket protocol for bidirectional communication between client and server. Messages handle player updates, shooting events, game state synchronization, and room management.

# External Dependencies

## Core Framework Dependencies
- **React Three Fiber**: 3D rendering and scene management
- **React**: UI framework and component architecture
- **Express.js**: Web server framework
- **WebSocket (ws)**: Real-time bidirectional communication
- **Three.js**: 3D graphics library and mathematical utilities

## Database and ORM
- **Drizzle ORM**: Type-safe database operations
- **@neondatabase/serverless**: Serverless PostgreSQL database connection
- **PostgreSQL**: Primary database (configured via Drizzle)

## State Management and Utilities
- **Zustand**: Lightweight state management for game stores
- **TanStack Query**: Server state management and caching
- **Zod**: Runtime type validation and schema definition

## UI and Styling
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for UI elements

## Development and Build Tools
- **Vite**: Build tool and development server
- **TypeScript**: Type safety and development tooling
- **ESBuild**: Fast JavaScript bundler for server code