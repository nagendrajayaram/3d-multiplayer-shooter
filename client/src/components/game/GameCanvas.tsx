import { useEffect } from 'react';
import * as THREE from 'three';
import Player from './Player';
import Environment from './Environment';
import Camera from './Camera';
import AIBot from './AIBot';
import Bullet from './Bullet';
import PowerUp from './PowerUp';
import ParticleSystem from '../effects/ParticleSystem';
import VehicleManager from './VehicleManager';
import { useMultiplayer } from '@/lib/stores/useMultiplayer';
import { useEffects } from '@/lib/stores/useEffects';
import { usePowerUps } from '@/lib/stores/usePowerUps';
import { usePlayer } from '@/lib/stores/usePlayer';
import { useAudio } from '@/lib/stores/useAudio';

export default function GameCanvas() {
  const { otherPlayers, bullets } = useMultiplayer();
  const { particles, removeEffect } = useEffects();
  const { powerUps, collectPowerUp, spawnRandomPowerUps } = usePowerUps();
  const { position: playerPosition, collectPowerUp: handlePowerUpCollection } = usePlayer();
  const { setHitSound, setSuccessSound } = useAudio();
  
  const handleCollectPowerUp = (id: string) => {
    const collectedPowerUp = collectPowerUp(id);
    if (collectedPowerUp) {
      handlePowerUpCollection(collectedPowerUp.type, collectedPowerUp.value, collectedPowerUp.weaponType);
    }
  };

  useEffect(() => {
    // Initialize audio files
    const hitAudio = new Audio('/sounds/hit.mp3');
    const successAudio = new Audio('/sounds/success.mp3');
    
    hitAudio.preload = 'auto';
    successAudio.preload = 'auto';
    
    hitAudio.oncanplaythrough = () => {
      console.log('Hit sound loaded successfully');
      setHitSound(hitAudio);
    };
    
    successAudio.oncanplaythrough = () => {
      console.log('Success sound loaded successfully');
      setSuccessSound(successAudio);
    };
    
    hitAudio.onerror = (e) => console.log('Hit sound loading failed:', e);
    successAudio.onerror = (e) => console.log('Success sound loading failed:', e);
    
    // Load the audio files
    hitAudio.load();
    successAudio.load();
    
    // Spawn initial power-ups
    spawnRandomPowerUps(8);
    
    // Respawn power-ups periodically
    const respawnInterval = setInterval(() => {
      if (powerUps.length < 5) {
        spawnRandomPowerUps(3);
      }
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(respawnInterval);
  }, []);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[50, 50, 50]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={200}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />

      {/* Game Camera Controller */}
      <Camera />

      {/* Game Environment */}
      <Environment />

      {/* Vehicle System */}
      <VehicleManager />

      {/* Current Player */}
      <Player />

      {/* Other Players and Bots */}
      {Object.entries(otherPlayers).map(([id, player]) => {
        // Check if this is a bot (ID starts with 'bot_')
        if (id.startsWith('bot_')) {
          return (
            <AIBot
              key={id}
              id={id}
              position={new THREE.Vector3(player.position[0], player.position[1], player.position[2])}
              rotation={new THREE.Euler(player.rotation[0], player.rotation[1], player.rotation[2])}
              color={player.color || '#ff8800'}
              health={player.health}
              isAlive={player.health > 0}
            />
          );
        } else {
          // Regular player
          return (
            <mesh key={id} position={[player.position[0], player.position[1], player.position[2]]} rotation={[player.rotation[0], player.rotation[1], player.rotation[2]]}>
              <boxGeometry args={[0.6, 1.8, 0.3]} />
              <meshLambertMaterial color={player.color || '#ff4444'} />
            </mesh>
          );
        }
      })}

      {/* Bullets */}
      {bullets.map((bullet) => (
        <Bullet
          key={bullet.id}
          id={bullet.id}
          position={bullet.position}
          direction={bullet.direction}
          speed={bullet.speed}
          playerId={bullet.playerId}
          weapon={bullet.weapon || 'pistol'}
        />
      ))}

      {/* Power-ups */}
      {powerUps.map((powerUp) => (
        <PowerUp
          key={powerUp.id}
          id={powerUp.id}
          type={powerUp.type}
          position={powerUp.position}
          playerPosition={playerPosition}
          onCollect={handleCollectPowerUp}
        />
      ))}

      {/* Particle Effects */}
      {particles.map((effect) => (
        <ParticleSystem
          key={effect.id}
          position={effect.position}
          type={effect.type}
          intensity={effect.intensity}
          onComplete={() => removeEffect(effect.id)}
        />
      ))}
    </>
  );
}
