import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMultiplayer } from '@/lib/stores/useMultiplayer';
import { useCamera } from '@/lib/stores/useCamera';
import { useTargets } from '@/lib/stores/useTargets';
import { useAudio } from '@/lib/stores/useAudio';
import { useEffects } from '@/lib/stores/useEffects';

interface BulletProps {
  id: string;
  position: THREE.Vector3;
  direction: THREE.Vector3;
  speed: number;
  playerId: string;
  weapon: string;
}

export default function Bullet({ id, position, direction, speed, playerId, weapon }: BulletProps) {
  const bulletRef = useRef<THREE.Group>(null);
  const { removeBullet } = useMultiplayer();
  const { currentView } = useCamera();
  const { targets, hitTarget } = useTargets();
  const { playHit } = useAudio();
  const startTime = useRef(Date.now());
  const hasHitTarget = useRef(false);
  
  // Orient the bullet group to face its travel direction (for rifle triangles)
  useEffect(() => {
    if (!bulletRef.current || weapon !== 'rifle') return;
    
    // Normalize the direction to ensure consistent rotation
    const normalizedDirection = direction.clone().normalize();
    
    // Create quaternion that rotates from default +Y direction to bullet direction
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0), // Default cone direction (+Y)
      normalizedDirection         // Actual bullet travel direction
    );
    
    // Apply rotation to the entire bullet group
    bulletRef.current.quaternion.copy(quaternion);
    
    console.log('Rifle bullet oriented towards:', normalizedDirection.toArray());
  }, [direction, weapon]);
  
  // Get weapon-specific bullet properties
  const getBulletProperties = (weapon: string) => {
    const baseSize = {
      'first-person': 0.4,
      'third-person': 0.25,
      'default': 0.3
    };
    
    const currentBaseSize = baseSize[currentView as keyof typeof baseSize] || baseSize.default;
    
    switch (weapon) {
      case 'pistol':
        return {
          size: currentBaseSize * 0.8, // Smaller bullets
          color: '#FFD700', // Gold color
          metalness: 0.9,
          roughness: 0.1,
          geometry: 'sphere',
          trail: false
        };
      case 'rifle':
        return {
          size: currentBaseSize * 1.2, // Larger bullets
          color: '#FF4444', // Red color
          metalness: 0.7,
          roughness: 0.3,
          geometry: 'triangle',
          trail: true
        };
      case 'shotgun':
        return {
          size: currentBaseSize * 1.5, // Biggest bullets
          color: '#4444FF', // Blue color
          metalness: 0.6,
          roughness: 0.4,
          geometry: 'box',
          trail: false
        };
      default:
        return {
          size: currentBaseSize,
          color: '#444444',
          metalness: 0.8,
          roughness: 0.2,
          geometry: 'sphere',
          trail: false
        };
    }
  };
  
  const bulletProps = getBulletProperties(weapon);

  useFrame((state, delta) => {
    if (!bulletRef.current) return;

    // Move bullet with weapon-specific speed modifications
    let actualSpeed = speed;
    switch (weapon) {
      case 'pistol':
        actualSpeed = speed * 0.8; // Slower pistol bullets
        break;
      case 'rifle':
        actualSpeed = speed * 1.3; // Faster rifle bullets
        break;
      case 'shotgun':
        actualSpeed = speed * 0.6; // Slower shotgun bullets
        break;
    }
    
    const movement = direction.clone().multiplyScalar(actualSpeed * delta);
    bulletRef.current.position.add(movement);

    // Remove bullet after certain time or if it goes too far
    const elapsed = Date.now() - startTime.current;
    const distance = bulletRef.current.position.distanceTo(position);
    
    if (elapsed > 3000 || distance > 200) {
      removeBullet(id);
    }

    // Collision detection with shooting targets - improved loop with early exit
    if (!hasHitTarget.current) {
      for (const target of targets) {
        if (target.isStanding) {
          const targetPos = target.position;
          const bulletPos = bulletRef.current!.position;
          const distance = bulletPos.distanceTo(targetPos);
          
          // Check if bullet is within target radius (1 unit radius for the circular target)
          if (distance < 1.0) {
            console.log(`Bullet hit target ${target.id}!`);
            
            // Add explosion particle effect at target location
            const effectsStore = useEffects.getState();
            effectsStore.addEffect('explosion', targetPos.clone(), 1.2);
            
            hitTarget(target.id);
            playHit(); // Play hit sound
            hasHitTarget.current = true;
            removeBullet(id);
            return; // Exit useFrame early after hit
          }
        }
      }
    }

    // Enhanced collision detection with environment (ground and bounds)
    const bulletPos = bulletRef.current.position;
    const effectsStore = useEffects.getState();
    
    if (bulletPos.y < 0) {
      // Bullet hit ground - add impact effect
      effectsStore.addEffect('bulletImpact', new THREE.Vector3(bulletPos.x, 0.1, bulletPos.z), 0.8);
      removeBullet(id);
    } else if (Math.abs(bulletPos.x) > 100 || Math.abs(bulletPos.z) > 100) {
      // Bullet went out of bounds
      removeBullet(id);
    }
  });

  // Render different geometry based on weapon
  const renderBulletGeometry = () => {
    const size = bulletProps.size;
    switch (bulletProps.geometry) {
      case 'triangle':
        return <coneGeometry args={[size * 0.5, size * 1.8, 3]} />;
      case 'box':
        return <boxGeometry args={[size, size, size]} />;
      default:
        return <sphereGeometry args={[size]} />;
    }
  };

  return (
    <group ref={bulletRef} position={position}>
      {/* Main bullet */}
      <mesh castShadow>
        {renderBulletGeometry()}
        <meshStandardMaterial 
          color={bulletProps.color}
          metalness={bulletProps.metalness}
          roughness={bulletProps.roughness}
          emissive={bulletProps.color}
          emissiveIntensity={0.1}
        />
      </mesh>
      
      {/* Trail effect for rifle bullets - positioned behind the tip in local coordinates */}
      {bulletProps.trail && (
        <mesh position={[0, -bulletProps.size * 1.2, 0]}>
          <cylinderGeometry args={[bulletProps.size * 0.1, bulletProps.size * 0.2, bulletProps.size * 1.5]} />
          <meshBasicMaterial 
            color={bulletProps.color}
            transparent
            opacity={0.6}
          />
        </mesh>
      )}
    </group>
  );
}
