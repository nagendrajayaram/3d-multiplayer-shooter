import { useRef, forwardRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useWeapons } from '@/lib/stores/useWeapons';
import { useCamera } from '@/lib/stores/useCamera';

interface WeaponProps {
  type: 'pistol' | 'rifle' | 'shotgun';
}

// First-person hands content for anchoring
function RightHandMeshes() {
  return (
    <group name="RightHand" position={[0.3, -0.2, 0.5]} rotation={[-0.4, 0.1, 0.3]}>
      {/* Palm gripping the pistol grip */}
      <mesh castShadow>
        <boxGeometry args={[0.15, 0.25, 0.08]} />
        <meshStandardMaterial color="#fdbcb4" />
      </mesh>
      
      {/* Fingers wrapping around grip */}
      <mesh position={[0.06, -0.15, 0]} rotation={[0, 0, 0.4]} castShadow>
        <boxGeometry args={[0.12, 0.18, 0.04]} />
        <meshStandardMaterial color="#fdbcb4" />
      </mesh>
      
      {/* Thumb positioned on grip */}
      <mesh position={[-0.08, -0.05, 0.04]} rotation={[0, 0, -0.6]} castShadow>
        <boxGeometry args={[0.06, 0.12, 0.04]} />
        <meshStandardMaterial color="#fdbcb4" />
      </mesh>
      
      {/* Wrist extending back */}
      <mesh position={[0, 0.3, 0]} rotation={[0.3, 0, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 0.5, 8]} />
        <meshStandardMaterial color="#fdbcb4" />
      </mesh>
    </group>
  );
}

function LeftHandMeshes() {
  return (
    <group name="LeftHand" position={[-0.1, -0.1, 1.4]} rotation={[-0.3, 0.2, -0.3]}>
      {/* Palm supporting underneath the forend */}
      <mesh castShadow>
        <boxGeometry args={[0.15, 0.25, 0.08]} />
        <meshStandardMaterial color="#fdbcb4" />
      </mesh>
      
      {/* Fingers wrapping over the forend */}
      <mesh position={[0, -0.18, 0]} rotation={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.12, 0.15, 0.04]} />
        <meshStandardMaterial color="#fdbcb4" />
      </mesh>
      
      {/* Thumb on side of forend */}
      <mesh position={[-0.08, -0.05, -0.04]} rotation={[0, 0, -0.4]} castShadow>
        <boxGeometry args={[0.06, 0.12, 0.04]} />
        <meshStandardMaterial color="#fdbcb4" />
      </mesh>
      
      {/* Left wrist/forearm */}
      <mesh position={[0, 0.3, 0]} rotation={[-0.2, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 0.5, 8]} />
        <meshStandardMaterial color="#fdbcb4" />
      </mesh>
    </group>
  );
}

// Tactical rifle model component
function TacticalRifleModel() {
  const gltf = useGLTF('/models/tactical_rifle.glb');
  
  return (
    <group scale={[0.18, 0.18, 0.18]} rotation={[0, Math.PI, 0]} position={[0, 0, -0.1]}>
      <primitive object={gltf.scene} />
    </group>
  );
}

// Preload the model for better performance
useGLTF.preload('/models/tactical_rifle.glb');

const Weapon = forwardRef<THREE.Group, WeaponProps>(({ type }, ref) => {
  const internalRef = useRef<THREE.Group>(null);
  const { isReloading, recoil } = useWeapons();
  const { currentView } = useCamera();

  useFrame((state) => {
    const groupRef = (ref && typeof ref === 'object' && 'current' in ref) ? ref.current : internalRef.current;
    if (!groupRef) return;

    // Basic weapon bob animation
    const time = state.clock.elapsedTime;
    groupRef.position.y = Math.sin(time * 4) * 0.01;
    
    // Recoil animation
    if (recoil > 0) {
      groupRef.rotation.x = -recoil * 0.1;
      groupRef.position.z = -recoil * 0.05;
    }
  });

  const getWeaponGeometry = () => {
    switch (type) {
      case 'pistol':
        return (
          <group>
            <mesh position={[0, 0, -0.2]}>
              <boxGeometry args={[0.05, 0.1, 0.3]} />
              <meshLambertMaterial color="#333333" />
            </mesh>
            <mesh position={[0, -0.05, -0.1]}>
              <boxGeometry args={[0.03, 0.08, 0.15]} />
              <meshLambertMaterial color="#222222" />
            </mesh>
          </group>
        );
      case 'rifle':
        return <TacticalRifleModel />;
      case 'shotgun':
        return (
          <group>
            <mesh position={[0, 0, -0.35]}>
              <boxGeometry args={[0.06, 0.1, 0.7]} />
              <meshLambertMaterial color="#444444" />
            </mesh>
            <mesh position={[0, -0.05, 0.05]}>
              <boxGeometry args={[0.04, 0.08, 0.25]} />
              <meshLambertMaterial color="#333333" />
            </mesh>
          </group>
        );
      default:
        return null;
    }
  };

  return (
    <group 
      ref={(node) => {
        // Set both the forwarded ref and internal ref
        if (ref) {
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref && 'current' in ref) {
            // Use try-catch to safely set the ref
            try {
              // @ts-ignore - Handle both mutable and readonly refs
              ref.current = node;
            } catch {
              // Ignore read-only ref errors
            }
          }
        }
        internalRef.current = node;
      }}
      position={[0.3, -0.3, -0.5]}
      scale={[2, 2, 2]}
    >
      {getWeaponGeometry()}
      
      {/* Weapon anchor points with first-person hands */}
      <group name="GripAnchor" position={[0, 0, 0]}>
        {/* Right hand attached to grip anchor - only in first-person */}
        {currentView === 'first-person' && <RightHandMeshes />}
      </group>
      <group name="SupportAnchor" position={[-0.3, 0.1, 0.4]}>
        {/* Left hand attached to support anchor - only in first-person */}
        {currentView === 'first-person' && <LeftHandMeshes />}
      </group>
      <group name="MuzzleAnchor" position={[0, 0, -0.9]} />
    </group>
  );
});

export default Weapon;
