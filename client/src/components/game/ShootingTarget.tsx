import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TargetData } from '@/lib/stores/useTargets';

interface ShootingTargetProps {
  target: TargetData;
}

export default function ShootingTarget({ target }: ShootingTargetProps) {
  const groupRef = useRef<THREE.Group>(null);
  const currentRotation = useRef(0);
  const animationStartTime = useRef<number | null>(null);
  
  const FALL_DURATION = 400; // milliseconds to complete the fall
  
  useFrame(() => {
    if (!groupRef.current) return;
    
    // Handle falling animation
    if (!target.isStanding && target.hitTime) {
      if (animationStartTime.current === null) {
        animationStartTime.current = target.hitTime;
      }
      
      const elapsed = Date.now() - animationStartTime.current;
      const progress = Math.min(elapsed / FALL_DURATION, 1);
      
      // Smooth easing function for natural fall
      const easedProgress = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      currentRotation.current = easedProgress * (Math.PI / 2);
      
      groupRef.current.rotation.x = currentRotation.current;
    } else if (target.isStanding) {
      // Reset animation state when target is reset
      animationStartTime.current = null;
      currentRotation.current = 0;
      groupRef.current.rotation.x = 0;
    }
  });
  
  // Add visual feedback when hit (emissive flash)
  const boardColor = target.isStanding ? "#FF0000" : "#CC0000";
  const emissiveIntensity = target.hitTime && (Date.now() - target.hitTime) < 200 ? 0.8 : 0;
  
  return (
    <group 
      ref={groupRef}
      position={[target.position.x, target.position.y, target.position.z]}
    >
      {/* Target stand */}
      <mesh position={[0, -0.5, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 3]} />
        <meshLambertMaterial color="#8B4513" />
      </mesh>
      
      {/* Target board with hit flash effect */}
      <mesh position={[0, 0, 0]}>
        <circleGeometry args={[1, 16]} />
        <meshLambertMaterial 
          color={boardColor}
          emissive={boardColor}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      
      {/* Bullseye rings */}
      <mesh position={[0, 0, 0.01]}>
        <ringGeometry args={[0.3, 0.5, 16]} />
        <meshLambertMaterial color="#FFFFFF" />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
        <circleGeometry args={[0.3, 16]} />
        <meshLambertMaterial color="#000000" />
      </mesh>
    </group>
  );
}