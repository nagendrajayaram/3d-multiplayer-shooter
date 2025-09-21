import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from 'ws';
import { GameServer } from './gameServer';

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Create WebSocket server
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/ws'
  });

  // Initialize game server
  const gameServer = new GameServer();

  wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection from:', req.socket.remoteAddress);
    
    gameServer.handleConnection(ws);

    ws.on('close', () => {
      console.log('WebSocket connection closed');
      gameServer.handleDisconnection(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      players: gameServer.getPlayerCount(),
      rooms: gameServer.getRoomCount()
    });
  });

  return httpServer;
}
