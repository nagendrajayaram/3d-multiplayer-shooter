import { useState, useEffect } from 'react';
import * as THREE from 'three';
import { usePlayer } from '@/lib/stores/usePlayer';
import { useWeapons } from '@/lib/stores/useWeapons';
import { useMultiplayer } from '@/lib/stores/useMultiplayer';
import { useGame } from '@/lib/stores/useGame';
import { useCamera } from '@/lib/stores/useCamera';
import { useEconomy } from '@/lib/stores/useEconomy';
import { useInventory } from '@/lib/stores/useInventory';
import WeaponShop from './WeaponShop';
import Inventory from './Inventory';

export default function GameHUD() {
  const { health, armor, score, inVehicle, updatePosition } = usePlayer();
  const { currentWeapon, ammo, isReloading } = useWeapons();
  const { killFeed, playerCount, playerTeam, teamScores, gameEnded, winningTeam } = useMultiplayer();
  const { restart } = useGame();
  const { currentView } = useCamera();
  const { money } = useEconomy();
  const { initializeInventory } = useInventory();
  
  const [showShop, setShowShop] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  
  // Initialize inventory on mount
  useEffect(() => {
    initializeInventory();
  }, [initializeInventory]);
  
  // Keyboard controls for shop, inventory, and teleport
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      console.log('GameHUD Key pressed:', event.key, 'Code:', event.code);
      
      // Prevent default and stop propagation for our handled keys
      const handledKeys = ['b', 'i', 'escape', 't'];
      if (handledKeys.includes(event.key.toLowerCase())) {
        event.preventDefault();
        event.stopPropagation();
      }
      
      switch (event.key.toLowerCase()) {
        case 'b':
          console.log('Opening/closing shop');
          setShowShop(!showShop);
          break;
        case 'i':
          console.log('Opening/closing inventory');
          setShowInventory(!showInventory);
          break;
        case 'escape':
          console.log('Closing shop and inventory');
          setShowShop(false);
          setShowInventory(false);
          break;
        case 't':
          console.log('TELEPORT: T key pressed - attempting to teleport to shooting ground');
          try {
            const newPosition = new THREE.Vector3(68, 0.9, 68);
            console.log('TELEPORT: New position created:', newPosition.toArray());
            updatePosition(newPosition);
            console.log('TELEPORT: updatePosition called successfully - should be at:', newPosition.toArray());
          } catch (error) {
            console.error('TELEPORT ERROR:', error);
          }
          break;
      }
    };
    
    console.log('GameHUD: Adding keydown event listener');
    window.addEventListener('keydown', handleKeyPress, true); // Use capture phase
    return () => {
      console.log('GameHUD: Removing keydown event listener');
      window.removeEventListener('keydown', handleKeyPress, true);
    };
  }, [showShop, showInventory, updatePosition]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Health and Armor Bars */}
      <div className="absolute bottom-4 left-4 pointer-events-auto">
        <div className="bg-black bg-opacity-70 p-4 rounded">
          <div className="text-white text-lg font-bold mb-2">Health: {health}</div>
          <div className="w-48 h-4 bg-gray-600 rounded mb-3">
            <div 
              className="h-full bg-red-500 rounded transition-all duration-300"
              style={{ width: `${(health / 100) * 100}%` }}
            />
          </div>
          {armor > 0 && (
            <>
              <div className="text-white text-lg font-bold mb-2">Armor: {armor}</div>
              <div className="w-48 h-4 bg-gray-600 rounded">
                <div 
                  className="h-full bg-blue-500 rounded transition-all duration-300"
                  style={{ width: `${(armor / 100) * 100}%` }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Ammo Counter */}
      <div className="absolute bottom-4 right-4 pointer-events-auto">
        <div className="bg-black bg-opacity-70 p-4 rounded text-white">
          <div className="text-lg font-bold">{currentWeapon.toUpperCase()}</div>
          <div className="text-2xl">
            {isReloading ? 'RELOADING...' : `${ammo[currentWeapon]} / ∞`}
          </div>
        </div>
      </div>

      {/* Money, Score, Stats and Camera View */}
      <div className="absolute top-4 left-4 pointer-events-auto">
        <div className="bg-black bg-opacity-70 p-4 rounded text-white">
          <div className="text-xl font-bold text-green-400 mb-2">
            ${money}
          </div>
          <div className="text-lg font-bold">Score: {score}</div>
          <div className="text-sm">Players: {playerCount}</div>
          <div className="text-sm mt-2 text-cyan-400">
            Camera: {currentView.replace('-', ' ').toUpperCase()}
          </div>
          <div className="text-xs text-gray-400">Press V to switch view</div>
        </div>
      </div>

      {/* Team Information */}
      {playerTeam && (
        <div className="absolute top-4 left-80 pointer-events-auto">
          <div className="bg-black bg-opacity-70 p-4 rounded text-white">
            <div className="text-lg font-bold mb-2">Team Info</div>
            <div className="flex items-center mb-2">
              <div 
                className="w-4 h-4 rounded mr-2"
                style={{ backgroundColor: playerTeam === 'red' ? '#ff4444' : '#4444ff' }}
              />
              <span className="text-lg font-bold" style={{ color: playerTeam === 'red' ? '#ff4444' : '#4444ff' }}>
                {playerTeam.toUpperCase()} TEAM
              </span>
            </div>
            <div className="text-sm space-y-2">
              <div>
                <div className="flex justify-between mb-1">
                  <span style={{ color: '#ff4444' }}>Red Team:</span>
                  <span className="font-bold">{teamScores.red}/50</span>
                </div>
                <div className="w-full h-2 bg-gray-600 rounded">
                  <div 
                    className="h-full rounded transition-all duration-300"
                    style={{ 
                      backgroundColor: '#ff4444',
                      width: `${Math.min((teamScores.red / 50) * 100, 100)}%`
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span style={{ color: '#4444ff' }}>Blue Team:</span>
                  <span className="font-bold">{teamScores.blue}/50</span>
                </div>
                <div className="w-full h-2 bg-gray-600 rounded">
                  <div 
                    className="h-full rounded transition-all duration-300"
                    style={{ 
                      backgroundColor: '#4444ff',
                      width: `${Math.min((teamScores.blue / 50) * 100, 100)}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Crosshair */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-4 h-4 border-2 border-white rounded-full opacity-70" />
        <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white transform -translate-x-1/2 -translate-y-1/2 rounded-full" />
      </div>

      {/* Instructions moved to right side */}
      <div className="absolute top-4 right-4 pointer-events-auto">
        <div className="bg-black bg-opacity-70 p-4 rounded text-white max-w-xs">
          <div className="text-sm font-bold text-yellow-400 mb-2">Controls</div>
          <div className="text-xs space-y-1">
            {inVehicle ? (
              <>
                {/* Vehicle Controls */}
                <div className="text-orange-400 font-bold">🚗 DRIVING</div>
                <div>W/↑: Accelerate</div>
                <div>S/↓: Reverse</div>
                <div>A/←: Turn Left</div>
                <div>D/→: Turn Right</div>
                <div>E: Exit Vehicle</div>
                <div>V: Switch camera</div>
                <div className="text-green-400 mt-2">B: Shop</div>
                <div className="text-purple-400">I: Inventory</div>
                <div className="text-cyan-400">T: Teleport to Shooting Ground</div>
              </>
            ) : (
              <>
                {/* On-foot Controls */}
                <div>WASD: Move</div>
                <div>Mouse: Look around</div>
                <div>Right Click: Shoot</div>
                <div>R: Reload</div>
                <div>E: Enter Vehicle</div>
                <div>V: Switch camera</div>
                <div className="text-green-400 mt-2">B: Shop</div>
                <div className="text-purple-400">I: Inventory</div>
                <div className="text-cyan-400">T: Teleport to Shooting Ground</div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Kill Feed moved to top center */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 pointer-events-auto">
        <div className="bg-black bg-opacity-70 p-4 rounded text-white w-80">
          <div className="text-lg font-bold mb-2">Kill Feed</div>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {killFeed.slice(-5).map((kill, i) => (
              <div key={i} className="text-sm">
                <span className="text-red-400">{kill.killer}</span>
                <span className="text-gray-400"> eliminated </span>
                <span className="text-blue-400">{kill.victim}</span>
                <span className="text-gray-500"> with {kill.weapon}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weapon Selection */}
      <div className="absolute bottom-20 left-4 pointer-events-auto">
        <div className="bg-black bg-opacity-70 p-2 rounded text-white">
          <div className="text-sm">Weapons (1-3):</div>
          <div className="flex space-x-2 mt-1">
            <div className={`p-2 rounded ${currentWeapon === 'pistol' ? 'bg-blue-600' : 'bg-gray-600'}`}>1. Pistol</div>
            <div className={`p-2 rounded ${currentWeapon === 'rifle' ? 'bg-blue-600' : 'bg-gray-600'}`}>2. Rifle</div>
            <div className={`p-2 rounded ${currentWeapon === 'shotgun' ? 'bg-blue-600' : 'bg-gray-600'}`}>3. Shotgun</div>
          </div>
        </div>
      </div>


      {/* Team Victory Screen */}
      {gameEnded && winningTeam && (
        <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center pointer-events-auto z-[60]">
          <div className="bg-black bg-opacity-90 p-12 rounded-lg text-white text-center border-4" 
               style={{ borderColor: winningTeam === 'red' ? '#ff4444' : '#4444ff' }}>
            <div className="text-6xl font-bold mb-6" 
                 style={{ color: winningTeam === 'red' ? '#ff4444' : '#4444ff' }}>
              {winningTeam.toUpperCase()} TEAM WINS!
            </div>
            <div className="text-2xl mb-4">Final Scores:</div>
            <div className="flex justify-center space-x-8 text-xl mb-6">
              <div style={{ color: '#ff4444' }}>Red: {teamScores.red}</div>
              <div style={{ color: '#4444ff' }}>Blue: {teamScores.blue}</div>
            </div>
            {playerTeam === winningTeam && (
              <div className="text-lg text-green-400 mb-4">
                🎉 Victory Bonus: +500 points! 🎉
              </div>
            )}
            <div className="text-lg mb-6">Your Final Score: {score}</div>
            <button 
              onClick={() => {
                // Reset victory state (this would ideally be handled by server)
                console.log('Victory screen dismissed - waiting for server reset');
              }}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded text-white font-bold transition-colors"
            >
              Continue Playing
            </button>
          </div>
        </div>
      )}

      {/* Death Screen */}
      {health <= 0 && !gameEnded && (
        <div className="absolute inset-0 bg-red-900 bg-opacity-50 flex items-center justify-center pointer-events-auto">
          <div className="bg-black bg-opacity-90 p-8 rounded text-white text-center">
            <div className="text-4xl font-bold mb-4">YOU DIED</div>
            <div className="text-lg mb-4">Final Score: {score}</div>
            <button 
              onClick={restart}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-bold"
            >
              Respawn
            </button>
          </div>
        </div>
      )}
      
      {/* Shop and Inventory Modals */}
      <WeaponShop 
        isOpen={showShop} 
        onClose={() => setShowShop(false)} 
      />
      <Inventory 
        isOpen={showInventory} 
        onClose={() => setShowInventory(false)} 
      />
    </div>
  );
}
