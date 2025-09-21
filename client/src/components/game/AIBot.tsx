import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AIBotProps {
  id: string;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  color: string;
  health: number;
  isAlive: boolean;
}

export default function AIBot({ id, position, rotation, color, health, isAlive }: AIBotProps) {
  const botRef = useRef<THREE.Mesh>(null);
  const healthBarRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!botRef.current || !healthBarRef.current) return;

    // Update bot position and rotation
    botRef.current.position.copy(position);
    botRef.current.rotation.copy(rotation);

    // Update health bar position
    healthBarRef.current.position.copy(position);
    healthBarRef.current.position.y += 2.2;

    // Health bar scale based on health
    const healthPercent = Math.max(0, health / 100);
    healthBarRef.current.scale.x = healthPercent;
  });

  if (!isAlive) return null;

  return (
    <group>
      {/* Bot Body */}
      <mesh ref={botRef} position={position} rotation={rotation} castShadow>
        <boxGeometry args={[0.6, 1.8, 0.3]} />
        <meshLambertMaterial color={color} />
      </mesh>

      {/* Bot Head */}
      <mesh position={[position.x, position.y + 1.2, position.z]} castShadow>
        <sphereGeometry args={[0.2]} />
        <meshLambertMaterial color={color} />
      </mesh>

      {/* Health Bar Background */}
      <mesh position={[position.x, position.y + 2.2, position.z]}>
        <boxGeometry args={[0.8, 0.1, 0.02]} />
        <meshBasicMaterial color="#333333" />
      </mesh>

      {/* Health Bar */}
      <mesh ref={healthBarRef} position={[position.x, position.y + 2.2, position.z]}>
        <boxGeometry args={[0.8, 0.1, 0.02]} />
        <meshBasicMaterial color={health > 50 ? "#00ff00" : health > 25 ? "#ffff00" : "#ff0000"} />
      </mesh>

      {/* Bot Name Tag */}
      <mesh position={[position.x, position.y + 2.5, position.z]}>
        <planeGeometry args={[1, 0.3]} />
        <meshBasicMaterial color="#000000" opacity={0.7} transparent />
      </mesh>
    </group>
  );
}