import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { usePlayer } from '@/lib/stores/usePlayer';
import { useMultiplayer } from '@/lib/stores/useMultiplayer';
import { useWeapons } from '@/lib/stores/useWeapons';
import { useEffects } from '@/lib/stores/useEffects';
import { useAudio } from '@/lib/stores/useAudio';
import { useCamera } from '@/lib/stores/useCamera';
import { Controls } from '@/lib/controls';
import { checkCollision } from '@/lib/collision';
import { PLAYER_SPEED, JUMP_FORCE, GRAVITY } from '@/lib/constants';
import { getGlobalPlayerYaw, getGlobalPlayerPitch, setGlobalPlayerYaw, setGlobalPlayerPitch } from './Camera';
import Weapon from './Weapon';

export default function Player() {
  const playerRef = useRef<THREE.Group>(null);
  const weaponRef = useRef<THREE.Group>(null);
  const weaponComponentRef = useRef<THREE.Group>(null);
  const velocityRef = useRef(new THREE.Vector3());
  const isGroundedRef = useRef(true);
  const cameraRef = useRef<THREE.Camera | null>(null);
  
  // Animation states for moving parts
  const [walkCycle, setWalkCycle] = useState(0);
  const [isWalking, setIsWalking] = useState(false);
  const [walkAmount, setWalkAmount] = useState(0); // Smooth animation amplitude
  
  // Precomputed animation values for performance
  const walkSin = Math.sin(walkCycle);
  const walkSinPI = Math.sin(walkCycle + Math.PI);
  const walkSin2 = Math.sin(2 * walkCycle);
  const walkCos2 = Math.cos(2 * walkCycle);
  
  const { position, health, updatePosition, takeDamage, inVehicle } = usePlayer();
  const { sendPlayerUpdate, sendBullet, addLocalBullet } = useMultiplayer();
  const { currentWeapon, shoot, canShoot, recoil } = useWeapons();
  const { addEffect } = useEffects();
  const { playShoot } = useAudio();
  const { currentView } = useCamera();
  
  // Reduce animation amplitude in first-person view
  const amplitudeMultiplier = currentView === 'first-person' ? 0.5 : 1.0;
  const [, getKeyboardState] = useKeyboardControls<Controls>();
  
  const handleShoot = () => {
    if (!canShoot()) return;
    
    let bulletDirection: THREE.Vector3;
    
    if (currentView === 'first-person') {
      // In first-person, use camera direction
      if (!cameraRef.current) return;
      bulletDirection = cameraRef.current.getWorldDirection(new THREE.Vector3());
    } else {
      // In third-person and second-person, use camera direction for consistency
      if (!cameraRef.current) return;
      bulletDirection = cameraRef.current.getWorldDirection(new THREE.Vector3());
      
      console.log('Using camera direction for shooting:', {
        direction: bulletDirection.toArray(),
        view: currentView
      });
    }
    
    // Use muzzle anchor position if available, fallback to view-based positioning
    let bulletStart;
    const muzzleAnchor = weaponComponentRef.current?.getObjectByName('MuzzleAnchor');
    
    if (muzzleAnchor) {
      // Use muzzle anchor world position for accurate bullet spawn
      const worldPos = new THREE.Vector3();
      muzzleAnchor.getWorldPosition(worldPos);
      bulletStart = worldPos.clone();
      console.log('Using muzzle anchor position:', bulletStart.toArray());
    } else {
      // Fallback to view-based positioning
      if (currentView === 'first-person') {
        bulletStart = position.clone().add(bulletDirection.clone().multiplyScalar(0.5));
      } else {
        // In third/second person, spawn from gun position
        const gunOffset = new THREE.Vector3(0.4, 0.5, -0.3);
        bulletStart = position.clone().add(gunOffset).add(bulletDirection.clone().multiplyScalar(0.5));
      }
      console.log('Using fallback bullet position:', bulletStart.toArray());
    }
    
    console.log('Shooting bullet:', { 
      position: bulletStart.toArray(), 
      direction: bulletDirection.toArray(),
      weapon: currentWeapon
    });
    
    // Play shooting sound with debug info
    console.log('Playing shoot sound...');
    playShoot(currentWeapon);
    
    // Audio handled by audio store to respect mute settings and avoid duplication
    
    // Add muzzle flash effect
    addEffect('muzzleFlash', bulletStart, 1.0);
    
    // Add bullet locally for immediate feedback
    const bulletId = `local_${Date.now()}_${Math.random()}`;
    addLocalBullet({
      id: bulletId,
      position: bulletStart,
      direction: bulletDirection,
      speed: 50,
      playerId: 'current',
      weapon: currentWeapon
    });
    
    shoot();
    sendBullet({
      position: bulletStart,
      direction: bulletDirection,
      weapon: currentWeapon,
      playerId: 'current'
    });
  };
  
  // Add mouse click handler for shooting
  useEffect(() => {
    const handleMouseClick = (event: MouseEvent) => {
      if (event.button === 2) { // Right mouse button
        event.preventDefault();
        handleShoot();
      }
    };
    
    document.addEventListener('mousedown', handleMouseClick);
    return () => {
      document.removeEventListener('mousedown', handleMouseClick);
    };
  }, [handleShoot]);

  useFrame((state, delta) => {
    if (!playerRef.current) return;
    
    // Skip movement updates when in vehicle to prevent position desync
    if (inVehicle) {
      return;
    }

    const controls = getKeyboardState();
    const camera = state.camera;
    cameraRef.current = camera; // Store camera reference for shooting
    const velocity = velocityRef.current;

    // Movement
    const moveVector = new THREE.Vector3();
    
    if (controls[Controls.forward]) {
      moveVector.add(camera.getWorldDirection(new THREE.Vector3()).setY(0).normalize());
    }
    if (controls[Controls.backward]) {
      moveVector.sub(camera.getWorldDirection(new THREE.Vector3()).setY(0).normalize());
    }
    if (controls[Controls.left]) {
      const right = new THREE.Vector3().crossVectors(camera.up, camera.getWorldDirection(new THREE.Vector3()));
      moveVector.add(right.normalize());
    }
    if (controls[Controls.right]) {
      const right = new THREE.Vector3().crossVectors(camera.up, camera.getWorldDirection(new THREE.Vector3()));
      moveVector.sub(right.normalize());
    }

    // Apply movement and update walking animation
    let moveSpeed2D = 0;
    if (moveVector.length() > 0) {
      moveSpeed2D = moveVector.length();
      moveVector.normalize().multiplyScalar(PLAYER_SPEED * delta);
      velocity.x = moveVector.x;
      velocity.z = moveVector.z;
      console.log('Player moving:', { velocity: velocity.toArray(), moveVector: moveVector.toArray() });
      
      setIsWalking(true);
    } else {
      velocity.x *= 0.9; // Friction
      velocity.z *= 0.9;
      setIsWalking(false);
    }
    
    // Speed-driven animation system - use per-second speed
    const frameSpeed = new THREE.Vector2(velocity.x, velocity.z).length();
    const actualSpeed = frameSpeed / Math.max(delta, 1e-6); // Convert to per-second speed
    const targetWalkAmount = Math.min(actualSpeed / PLAYER_SPEED, 1.0);
    setWalkAmount(prev => {
      // Smooth transition using exponential decay
      const smoothFactor = 1 - Math.exp(-delta * 10);
      return prev + (targetWalkAmount - prev) * smoothFactor;
    });
    
    // Update walk cycle with variable speed
    if (walkAmount > 0.01) {
      const walkSpeed = 4 + walkAmount * 4; // 4-8 Hz based on speed
      setWalkCycle(prev => (prev + delta * walkSpeed) % (Math.PI * 2));
    }

    // Jumping
    if (controls[Controls.jump] && isGroundedRef.current) {
      velocity.y = JUMP_FORCE;
      isGroundedRef.current = false;
    }

    // Teleport to shooting ground
    if (controls[Controls.teleport]) {
      console.log('TELEPORT: T key detected in Player component - teleporting to shooting ground!');
      const shootingGroundPosition = new THREE.Vector3(68, 0.9, 68);
      console.log('TELEPORT: Teleporting to position:', shootingGroundPosition.toArray());
      updatePosition(shootingGroundPosition);
      console.log('TELEPORT: Successfully teleported to shooting ground!');
    }

    // Gravity
    if (!isGroundedRef.current) {
      velocity.y -= GRAVITY * delta;
    }

    // Update position
    const newPosition = position.clone().add(velocity);
    
    // Ground collision (simplified)
    if (newPosition.y <= 1.0) {
      newPosition.y = 1.0;
      velocity.y = 0;
      isGroundedRef.current = true;
    }

    // Update position in store
    updatePosition(newPosition);
    
    // Update player group position and rotation
    if (playerRef.current) {
      playerRef.current.position.copy(newPosition);
      
      // In third-person and second-person views, show player facing direction
      if (currentView !== 'first-person') {
        const yaw = getGlobalPlayerYaw();
        playerRef.current.rotation.y = yaw;
        console.log('Player rotation updated:', yaw);
      } else {
        // In first-person, sync camera rotation to global rotation for consistency
        if (cameraRef.current) {
          setGlobalPlayerYaw(cameraRef.current.rotation.y);
          setGlobalPlayerPitch(cameraRef.current.rotation.x);
        }
      }
    }
    
    // Send update to server
    sendPlayerUpdate({
      position: newPosition,
      rotation: camera.rotation,
      health
    });

    // Alternative keyboard shooting (for testing)
    if (controls[Controls.shoot] && canShoot()) {
      const bulletDirection = camera.getWorldDirection(new THREE.Vector3());
      
      // Use muzzle anchor position for keyboard shooting too
      let bulletStart;
      const muzzleAnchor = weaponComponentRef.current?.getObjectByName('MuzzleAnchor');
      
      if (muzzleAnchor) {
        const worldPos = new THREE.Vector3();
        muzzleAnchor.getWorldPosition(worldPos);
        bulletStart = worldPos.clone();
      } else {
        bulletStart = newPosition.clone().add(bulletDirection.clone().multiplyScalar(0.5));
      }
      
      console.log('Keyboard shooting bullet:', { position: bulletStart, direction: bulletDirection });
      
      // Play realistic gunshot sound
      playShoot(currentWeapon);
      
      // Add muzzle flash effect  
      addEffect('muzzleFlash', bulletStart, 1.0);
      
      shoot();
      sendBullet({
        position: bulletStart,
        direction: bulletDirection,
        weapon: currentWeapon,
        playerId: 'current'
      });
    }

    // Position is already updated above in the playerRef.current check
  });

  // Hide player model when in vehicle to prevent overlap
  if (inVehicle) {
    return null;
  }

  return (
    <group ref={playerRef} position={position}>
      {/* Main body - Human torso */}
      <mesh position={[0, 0.75 + walkAmount * 0.03 * (1 - walkCos2) * amplitudeMultiplier, 0]} castShadow>
        <capsuleGeometry args={[0.25, 0.8]} />
        <meshStandardMaterial 
          color="#4a90e2" 
          metalness={0.1}
          roughness={0.8}
        />
      </mesh>
      
      {/* Shirt/clothing detail */}
      <mesh position={[0, 0.85, 0.15]} castShadow>
        <boxGeometry args={[0.45, 0.3, 0.02]} />
        <meshStandardMaterial 
          color="#ffffff" 
          metalness={0.0}
          roughness={0.9}
        />
      </mesh>
      
      {/* Belt */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[0.65, 0.1, 0.35]} />
        <meshStandardMaterial 
          color="#654321" 
          metalness={0.1}
          roughness={0.9}
        />
      </mesh>
      
      {/* Belt buckle */}
      <mesh position={[0, 0.35, 0.18]} castShadow>
        <boxGeometry args={[0.15, 0.08, 0.03]} />
        <meshStandardMaterial 
          color="#ffaa00" 
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      
      {/* Head - hide in first-person to avoid blocking view */}
      {currentView !== 'first-person' && (
        <group>
          <mesh position={[0, 1.55, 0]} castShadow>
            <sphereGeometry args={[0.25]} />
            <meshStandardMaterial 
              color="#fdbcb4" 
              metalness={0.05}
              roughness={0.9}
            />
          </mesh>
          
          {/* Eyes */}
          <mesh position={[-0.1, 1.6, 0.2]} castShadow>
            <sphereGeometry args={[0.04]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0.1, 1.6, 0.2]} castShadow>
            <sphereGeometry args={[0.04]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          
          {/* Pupils */}
          <mesh position={[-0.1, 1.6, 0.23]} castShadow>
            <sphereGeometry args={[0.02]} />
            <meshStandardMaterial color="#333333" />
          </mesh>
          <mesh position={[0.1, 1.6, 0.23]} castShadow>
            <sphereGeometry args={[0.02]} />
            <meshStandardMaterial color="#333333" />
          </mesh>
          
          {/* Hair */}
          <mesh position={[0, 1.7, -0.05]} castShadow>
            <sphereGeometry args={[0.28, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
            <meshStandardMaterial 
              color="#8B4513" 
              metalness={0.1}
              roughness={0.9}
            />
          </mesh>
        </group>
      )}
      
      {/* Animated Arms - More human-like cylinders - hide in first-person */}
      {currentView !== 'first-person' && (
        <>
          <mesh 
        position={[
          -0.4, 
          0.95 + walkAmount * 0.05 * (1 - walkCos2) * amplitudeMultiplier, // Subtle Y bob
          walkAmount * walkSin * 0.3 * amplitudeMultiplier
        ]} 
        rotation={[
          walkAmount * walkSin * 0.8 * amplitudeMultiplier, // Enhanced arm swing
          0,
          Math.PI / 2 + walkAmount * walkSin2 * 0.15 * amplitudeMultiplier // Natural sway
        ]}
        castShadow
      >
        <cylinderGeometry args={[0.08, 0.08, 0.8]} />
        <meshStandardMaterial color="#fdbcb4" metalness={0.05} roughness={0.9} />
      </mesh>
      <mesh 
        position={[
          0.4, 
          0.95 + walkAmount * 0.05 * (1 - walkCos2) * amplitudeMultiplier, // Subtle Y bob
          walkAmount * walkSinPI * 0.3 * amplitudeMultiplier
        ]} 
        rotation={[
          walkAmount * walkSinPI * 0.8 * amplitudeMultiplier, // Enhanced arm swing (opposite phase)
          0,
          Math.PI / 2 + walkAmount * walkSin2 * 0.15 * amplitudeMultiplier // Natural sway
        ]}
        castShadow
      >
        <cylinderGeometry args={[0.08, 0.08, 0.8]} />
        <meshStandardMaterial color="#fdbcb4" metalness={0.05} roughness={0.9} />
          </mesh>
          
          {/* Animated Hands */}
          <mesh 
            position={[
              -0.4 + walkAmount * walkSin * 0.05 * amplitudeMultiplier, // Slight in/out movement
              0.5 + walkAmount * 0.05 * (1 - walkCos2) * amplitudeMultiplier, // Y bob with arms
              walkAmount * walkSin * 0.4 * amplitudeMultiplier
            ]} 
            castShadow
          >
            <sphereGeometry args={[0.1]} />
            <meshStandardMaterial color="#fdbcb4" />
          </mesh>
          <mesh 
            position={[
              0.4 + walkAmount * walkSinPI * 0.05 * amplitudeMultiplier, // Slight in/out movement (opposite)
              0.5 + walkAmount * 0.05 * (1 - walkCos2) * amplitudeMultiplier, // Y bob with arms
              walkAmount * walkSinPI * 0.4 * amplitudeMultiplier
            ]} 
            castShadow
          >
            <sphereGeometry args={[0.1]} />
            <meshStandardMaterial color="#fdbcb4" />
          </mesh>
      
      {/* Fingers for hands */}
          <mesh position={[-0.45, 0.45, 0]} castShadow>
            <boxGeometry args={[0.03, 0.08, 0.03]} />
            <meshStandardMaterial color="#fdbcb4" />
          </mesh>
          <mesh position={[-0.42, 0.43, 0]} castShadow>
            <boxGeometry args={[0.03, 0.08, 0.03]} />
            <meshStandardMaterial color="#fdbcb4" />
          </mesh>
          <mesh position={[-0.38, 0.43, 0]} castShadow>
            <boxGeometry args={[0.03, 0.08, 0.03]} />
            <meshStandardMaterial color="#fdbcb4" />
          </mesh>
          <mesh position={[-0.35, 0.45, 0]} castShadow>
            <boxGeometry args={[0.03, 0.08, 0.03]} />
            <meshStandardMaterial color="#fdbcb4" />
          </mesh>
          
          <mesh position={[0.45, 0.45, 0]} castShadow>
            <boxGeometry args={[0.03, 0.08, 0.03]} />
            <meshStandardMaterial color="#fdbcb4" />
          </mesh>
          <mesh position={[0.42, 0.43, 0]} castShadow>
            <boxGeometry args={[0.03, 0.08, 0.03]} />
            <meshStandardMaterial color="#fdbcb4" />
          </mesh>
          <mesh position={[0.38, 0.43, 0]} castShadow>
            <boxGeometry args={[0.03, 0.08, 0.03]} />
            <meshStandardMaterial color="#fdbcb4" />
          </mesh>
          <mesh position={[0.35, 0.45, 0]} castShadow>
            <boxGeometry args={[0.03, 0.08, 0.03]} />
            <meshStandardMaterial color="#fdbcb4" />
          </mesh>
        </>
      )}
      
      {/* Animated Thighs - Human-like pants */}
      <mesh 
        position={[
          -0.15, 
          0.25 + walkAmount * 0.03 * (1 - walkCos2) * amplitudeMultiplier, // Body bob
          walkAmount * walkSinPI * 0.2 * amplitudeMultiplier
        ]} 
        rotation={[
          walkAmount * (-walkSin) * 0.6 * amplitudeMultiplier, // Enhanced leg swing
          0,
          walkAmount * walkSin2 * 0.1 * amplitudeMultiplier // Slight Z sway
        ]}
        castShadow
      >
        <cylinderGeometry args={[0.11, 0.11, 0.6]} />
        <meshStandardMaterial color="#2c3e50" metalness={0.1} roughness={0.8} />
      </mesh>
      <mesh 
        position={[
          0.15, 
          0.25 + walkAmount * 0.03 * (1 - walkCos2) * amplitudeMultiplier, // Body bob
          walkAmount * walkSin * 0.2 * amplitudeMultiplier
        ]} 
        rotation={[
          walkAmount * walkSin * 0.6 * amplitudeMultiplier, // Enhanced leg swing (opposite phase)
          0,
          walkAmount * walkSin2 * 0.1 * amplitudeMultiplier // Slight Z sway
        ]}
        castShadow
      >
        <cylinderGeometry args={[0.11, 0.11, 0.6]} />
        <meshStandardMaterial color="#2c3e50" metalness={0.1} roughness={0.8} />
      </mesh>
      
      {/* Animated Knees */}
      <mesh 
        position={[
          -0.15, 
          0.1 + walkAmount * 0.03 * (1 - walkCos2) * amplitudeMultiplier, // Y movement with body
          walkAmount * walkSinPI * 0.15 * amplitudeMultiplier
        ]} 
        castShadow
      >
        <sphereGeometry args={[0.12]} />
        <meshStandardMaterial color="#444488" />
      </mesh>
      <mesh 
        position={[
          0.15, 
          0.1 + walkAmount * 0.03 * (1 - walkCos2) * amplitudeMultiplier, // Y movement with body
          walkAmount * walkSin * 0.15 * amplitudeMultiplier
        ]} 
        castShadow
      >
        <sphereGeometry args={[0.12]} />
        <meshStandardMaterial color="#444488" />
      </mesh>
      
      {/* Animated Lower legs - Human-like shins */}
      <mesh 
        position={[
          -0.15, 
          -0.45 + walkAmount * 0.03 * (1 - walkCos2) * amplitudeMultiplier, // Y movement with body
          walkAmount * walkSinPI * 0.25 * amplitudeMultiplier
        ]} 
        rotation={[
          walkAmount * Math.max(0, -walkSin) * 0.6 * amplitudeMultiplier, // Knee flex on forward swing
          0,
          walkAmount * walkSin2 * 0.1 * amplitudeMultiplier // Match thigh sway
        ]}
        castShadow
      >
        <cylinderGeometry args={[0.09, 0.09, 0.7]} />
        <meshStandardMaterial color="#2c3e50" metalness={0.1} roughness={0.8} />
      </mesh>
      <mesh 
        position={[
          0.15, 
          -0.45 + walkAmount * 0.03 * (1 - walkCos2) * amplitudeMultiplier, // Y movement with body
          walkAmount * walkSin * 0.25 * amplitudeMultiplier
        ]} 
        rotation={[
          walkAmount * Math.max(0, -walkSinPI) * 0.6 * amplitudeMultiplier, // Knee flex on forward swing (opposite)
          0,
          walkAmount * walkSin2 * 0.1 * amplitudeMultiplier // Match thigh sway
        ]}
        castShadow
      >
        <cylinderGeometry args={[0.09, 0.09, 0.7]} />
        <meshStandardMaterial color="#2c3e50" metalness={0.1} roughness={0.8} />
      </mesh>
      
      {/* Ankles */}
      <mesh position={[-0.15, -0.8 + walkAmount * 0.03 * (1 - walkCos2) * amplitudeMultiplier, 0]} castShadow>
        <sphereGeometry args={[0.08]} />
        <meshStandardMaterial color="#444488" />
      </mesh>
      <mesh position={[0.15, -0.8 + walkAmount * 0.03 * (1 - walkCos2) * amplitudeMultiplier, 0]} castShadow>
        <sphereGeometry args={[0.08]} />
        <meshStandardMaterial color="#444488" />
      </mesh>
      
      {/* Feet/Boots */}
      <mesh 
        position={[-0.15, -0.9 + walkAmount * 0.03 * (1 - walkCos2) * amplitudeMultiplier, 0.1]} 
        rotation={[-0.4 * walkAmount * Math.max(0, -walkSin) * 0.6 * amplitudeMultiplier, 0, 0]} // Foot pitch to keep level
        castShadow
      >
        <boxGeometry args={[0.28, 0.2, 0.45]} />
        <meshStandardMaterial color="#222222" metalness={0.1} roughness={0.9} />
      </mesh>
      <mesh 
        position={[0.15, -0.9 + walkAmount * 0.03 * (1 - walkCos2) * amplitudeMultiplier, 0.1]} 
        rotation={[-0.4 * walkAmount * Math.max(0, -walkSinPI) * 0.6 * amplitudeMultiplier, 0, 0]} // Foot pitch to keep level (opposite)
        castShadow
      >
        <boxGeometry args={[0.28, 0.2, 0.45]} />
        <meshStandardMaterial color="#222222" metalness={0.1} roughness={0.9} />
      </mesh>
      
      {/* Boot laces/details */}
      <mesh position={[-0.15, -0.85, 0.25]} castShadow>
        <boxGeometry args={[0.15, 0.05, 0.05]} />
        <meshStandardMaterial color="#555555" />
      </mesh>
      <mesh position={[0.15, -0.85, 0.25]} castShadow>
        <boxGeometry args={[0.15, 0.05, 0.05]} />
        <meshStandardMaterial color="#555555" />
      </mesh>
      
      {/* Enhanced Gun/Weapon - visible in all views */}
      <group 
        ref={weaponRef}
        position={[
          0.4 + recoil * 0.02, // Slight horizontal recoil
          0.5 + recoil * 0.01, // Slight vertical recoil  
          -0.3 - recoil * 0.08 // Backward recoil motion
        ]}
        rotation={[
          -recoil * 0.15, // Gun kicks up when shooting
          recoil * 0.05,  // Slight side rotation
          walkAmount * walkSin2 * 0.1 * amplitudeMultiplier // Walking sway
        ]}
      >
        {/* Use the proper Weapon component which shows tactical rifle model with ref */}
        <Weapon ref={weaponComponentRef} type={currentWeapon as 'pistol' | 'rifle' | 'shotgun'} />
        
        {/* Muzzle flash handled by effects system using muzzle anchor */}
      </group>
      
      
    </group>
  );
}
