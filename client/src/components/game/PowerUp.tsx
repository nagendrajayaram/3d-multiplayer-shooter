import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface PowerUpProps {
  id: string;
  type: 'health' | 'ammo' | 'weapon' | 'armor';
  position: THREE.Vector3;
  onCollect: (id: string) => void;
  playerPosition: THREE.Vector3;
}

export default function PowerUp({ id, type, position, onCollect, playerPosition }: PowerUpProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const bobOffset = useRef(Math.random() * Math.PI * 2);
  
  useFrame((state) => {
    if (!meshRef.current) return;

    // Floating animation
    const time = state.clock.getElapsedTime();
    meshRef.current.position.y = position.y + Math.sin(time * 2 + bobOffset.current) * 0.2;
    
    // Rotation animation
    meshRef.current.rotation.y = time * 1.5;

    // Check for collision with player
    const distance = meshRef.current.position.distanceTo(playerPosition);
    if (distance < 1.5) { // Collection radius
      onCollect(id);
    }
  });

  const getColor = () => {
    switch (type) {
      case 'health': return '#ff4444'; // Red
      case 'ammo': return '#44ff44';   // Green  
      case 'weapon': return '#4444ff'; // Blue
      case 'armor': return '#ffaa44';  // Orange
      default: return '#ffffff';
    }
  };

  const getSize = (): [number, number, number] => {
    switch (type) {
      case 'health': return [0.4, 0.4, 0.4];
      case 'ammo': return [0.3, 0.5, 0.3];
      case 'weapon': return [0.6, 0.3, 0.3];
      case 'armor': return [0.5, 0.5, 0.2];
      default: return [0.4, 0.4, 0.4];
    }
  };

  const getShape = () => {
    switch (type) {
      case 'health':
        return (
          <>
            {/* Health pack cross shape */}
            <boxGeometry args={[0.6, 0.2, 0.2]} />
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.2, 0.6, 0.2]} />
              <meshStandardMaterial color={getColor()} emissive={getColor()} emissiveIntensity={0.2} />
            </mesh>
          </>
        );
      case 'ammo':
        return <cylinderGeometry args={[0.2, 0.2, 0.6, 8]} />;
      case 'weapon':
        return <boxGeometry args={getSize()} />;
      case 'armor':
        return <cylinderGeometry args={[0.4, 0.3, 0.3, 6]} />;
      default:
        return <boxGeometry args={[0.4, 0.4, 0.4]} />;
    }
  };

  return (
    <mesh ref={meshRef} position={position} castShadow>
      {getShape()}
      <meshStandardMaterial 
        color={getColor()} 
        emissive={getColor()} 
        emissiveIntensity={0.3}
        roughness={0.3}
        metalness={0.1}
      />
      
      {/* Glow effect */}
      <mesh position={[0, 0, 0]} scale={1.2}>
        <sphereGeometry args={[0.5]} />
        <meshBasicMaterial 
          color={getColor()} 
          transparent 
          opacity={0.1}
        />
      </mesh>
    </mesh>
  );
}