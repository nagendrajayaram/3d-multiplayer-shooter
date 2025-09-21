import { useState } from 'react';
import { useGame } from '@/lib/stores/useGame';
import { useMultiplayer } from '@/lib/stores/useMultiplayer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy } from 'lucide-react';

export default function GameMenu() {
  const { start } = useGame();
  const { createRoom, joinRoom, isConnected } = useMultiplayer();
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('Player' + Math.floor(Math.random() * 1000));
  const [createdRoomCode, setCreatedRoomCode] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleQuickPlay = () => {
    start();
  };

  const handleCreateRoom = async () => {
    const code = await createRoom(playerName);
    if (code) {
      setCreatedRoomCode(code);
      // Don't auto-start the game, let the user share the code first
    }
  };

  const handleStartWithRoom = () => {
    start();
  };

  const copyRoomCode = async () => {
    if (createdRoomCode) {
      try {
        await navigator.clipboard.writeText(createdRoomCode);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (error) {
        console.error('Failed to copy room code:', error);
      }
    }
  };

  const handleJoinRoom = async () => {
    if (roomCode.trim()) {
      const success = await joinRoom(roomCode.trim(), playerName);
      if (success) {
        start();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-blue-900 to-black flex items-center justify-center z-50">
      <div className="max-w-md w-full mx-4">
        <Card className="bg-black bg-opacity-80 border-blue-500">
          <CardHeader className="text-center">
            <CardTitle className="text-4xl font-bold text-white mb-2">
              3D SHOOTER
            </CardTitle>
            <p className="text-blue-300">Multiplayer Deathmatch</p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Player Name */}
            <div>
              <label className="block text-white text-sm mb-2">Player Name</label>
              <Input
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
                placeholder="Enter your name"
              />
            </div>

            {/* Quick Play */}
            <Button 
              onClick={handleQuickPlay}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3"
              disabled={!isConnected}
            >
              {isConnected ? 'QUICK PLAY' : 'Connecting...'}
            </Button>

            {/* Create Room */}
            {!createdRoomCode ? (
              <Button 
                onClick={handleCreateRoom}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3"
                disabled={!isConnected}
              >
                CREATE PRIVATE ROOM
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="bg-green-900 bg-opacity-50 border border-green-500 rounded-lg p-4">
                  <h3 className="text-green-300 font-bold mb-2">Room Created!</h3>
                  <p className="text-white text-sm mb-3">Share this code with your friends:</p>
                  <div className="flex items-center space-x-2">
                    <div className="bg-black bg-opacity-60 rounded px-3 py-2 flex-1">
                      <span className="text-yellow-400 font-mono text-xl tracking-wider">{createdRoomCode}</span>
                    </div>
                    <Button
                      onClick={copyRoomCode}
                      size="sm"
                      className={`${copySuccess ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                      {copySuccess ? (
                        <span className="text-xs">Copied!</span>
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button
                  onClick={handleStartWithRoom}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3"
                >
                  START GAME
                </Button>
              </div>
            )}

            {/* Join Room */}
            <div className="space-y-2">
              <Input
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
                placeholder="Enter room code"
              />
              <Button 
                onClick={handleJoinRoom}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3"
                disabled={!isConnected || !roomCode.trim()}
              >
                JOIN ROOM
              </Button>
            </div>

            {/* Connection Status */}
            <div className="text-center text-sm">
              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-gray-300">
                {isConnected ? 'Connected to server' : 'Connecting to server...'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Game Instructions */}
        <Card className="mt-4 bg-black bg-opacity-60 border-gray-600">
          <CardContent className="p-4">
            <h3 className="text-white font-bold mb-2">How to Play</h3>
            <div className="text-gray-300 text-sm space-y-1">
              <div>• WASD: Move around</div>
              <div>• Mouse: Look around</div>
              <div>• Left Click: Shoot</div>
              <div>• 1,2,3: Switch weapons</div>
              <div>• R: Reload</div>
              <div>• T: Teleport to shooting ground</div>
              <div>• Eliminate enemies to score points!</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
