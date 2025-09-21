import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { usePlayer } from '@/lib/stores/usePlayer';
import { useCamera } from '@/lib/stores/useCamera';
import { useVehicles } from '@/lib/stores/useVehicles';
import { Controls } from '@/lib/controls';

// Store player rotation globally so it can be accessed across components
let globalPlayerYaw = 0;
let globalPlayerPitch = 0;

// Functions to get and update global rotation
export const getGlobalPlayerYaw = () => globalPlayerYaw;
export const getGlobalPlayerPitch = () => globalPlayerPitch;
export const setGlobalPlayerYaw = (yaw: number) => { globalPlayerYaw = yaw; };
export const setGlobalPlayerPitch = (pitch: number) => { globalPlayerPitch = pitch; };

// Function to turn head 180 degrees
export const turnHead180 = () => {
  globalPlayerYaw += Math.PI; // Add 180 degrees in radians
  console.log('Head turned 180 degrees. New yaw:', globalPlayerYaw.toFixed(3));
};

export { globalPlayerYaw, globalPlayerPitch };

export default function Camera() {
  const { camera } = useThree();
  const { position, inVehicle, vehicleId } = usePlayer();
  const { currentView, switchToNextView } = useCamera();
  const vehicles = useVehicles(state => state.vehicles);
  const [, getKeyboardState] = useKeyboardControls<Controls>();
  
  const mouseRef = useRef({ x: 0, y: 0 });
  const pitchRef = useRef(0);
  const yawRef = useRef(0);
  const isLockedRef = useRef(false);
  const lastCameraSwitchRef = useRef(0);

  useEffect(() => {
    const handlePointerLockChange = () => {
      isLockedRef.current = document.pointerLockElement === document.body;
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isLockedRef.current) return;

      const sensitivity = 0.003; // Increased sensitivity
      
      // Always update both camera and global rotation for consistency
      yawRef.current -= event.movementX * sensitivity;
      pitchRef.current -= event.movementY * sensitivity;
      
      globalPlayerYaw -= event.movementX * sensitivity;
      globalPlayerPitch -= event.movementY * sensitivity;
      
      // Allow full 360-degree rotation - no clamping
      // pitchRef.current and globalPlayerPitch can now rotate freely
      
      console.log('Mouse move - yaw:', globalPlayerYaw.toFixed(3), 'pitch:', globalPlayerPitch.toFixed(3));
    };

    const handleClick = () => {
      if (!isLockedRef.current) {
        document.body.requestPointerLock();
      }
    };

    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'KeyT') { // T key to turn head 180 degrees
        turnHead180();
      }
    };

    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyPress);

    // Request pointer lock on start
    document.body.requestPointerLock();

    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  useFrame(() => {
    if (!camera) return;

    // Handle camera view switching
    const controls = getKeyboardState();
    const now = Date.now();
    if (controls[Controls.cameraView] && now - lastCameraSwitchRef.current > 300) {
      switchToNextView();
      lastCameraSwitchRef.current = now;
    }

    // Determine camera target based on player state
    let targetPosition = position;
    let targetRotation = { yaw: globalPlayerYaw, pitch: globalPlayerPitch };
    
    if (inVehicle && vehicleId) {
      // Find the player's vehicle
      const playerVehicle = vehicles.find(v => v.id === vehicleId);
      if (playerVehicle) {
        targetPosition = playerVehicle.position;
        targetRotation = { yaw: playerVehicle.rotation.y, pitch: globalPlayerPitch }; // Use vehicle yaw, keep mouse pitch
        console.log('Vehicle camera - position:', targetPosition.toArray(), 'rotation:', playerVehicle.rotation.y.toFixed(2));
      }
    }

    // Sync yawRef with globalPlayerYaw for immediate rotation updates
    yawRef.current = globalPlayerYaw;
    pitchRef.current = globalPlayerPitch;

    // Update camera based on current view and target
    if (currentView === 'first-person') {
      updateCameraView(camera, targetPosition, currentView, yawRef.current, pitchRef.current, inVehicle);
    } else {
      updateCameraView(camera, targetPosition, currentView, targetRotation.yaw, targetRotation.pitch, inVehicle);
    }
  });

  return null;
}

function updateCameraView(
  camera: THREE.Camera, 
  playerPosition: THREE.Vector3, 
  view: string, 
  yaw: number, 
  pitch: number,
  inVehicle: boolean = false
) {
  const eyeHeight = inVehicle ? 1.7 : 1.6; // Optimal eye height for better ground clearance
  const thirdPersonDistance = inVehicle ? 5.5 : 4.5; // Balanced distance - not too close, not too far

  camera.rotation.order = 'YXZ';
  
  // Use provided rotation values (vehicle or player)
  const actualYaw = yaw;
  const actualPitch = pitch;

  switch (view) {
    case 'first-person':
      // Camera at optimal player eye level - not too high, not too low
      const firstPersonPos = playerPosition.clone();
      firstPersonPos.y += eyeHeight;
      // Enhanced forward offset for better positioning
      const forwardOffset = new THREE.Vector3(
        Math.sin(actualYaw) * 0.25,
        0,
        Math.cos(actualYaw) * 0.25
      );
      firstPersonPos.add(forwardOffset);
      camera.position.copy(firstPersonPos);
      camera.rotation.y = actualYaw;
      camera.rotation.x = actualPitch;
      break;

    case 'second-person':
      // Camera in front of player/vehicle, looking back at them
      const secondPersonPos = playerPosition.clone();
      secondPersonPos.y += eyeHeight;
      
      const secondPersonDistance = inVehicle ? 6.0 : 5.0; // Increased distance for better overview
      const secondPersonVerticalOffset = inVehicle ? 2.5 : 2.8; // Higher elevation for better perspective
      
      let secondPersonOffset;
      if (inVehicle) {
        // Position camera behind vehicle for second-person view
        secondPersonOffset = new THREE.Vector3(
          Math.sin(actualYaw + Math.PI) * secondPersonDistance,
          secondPersonVerticalOffset,
          Math.cos(actualYaw + Math.PI) * secondPersonDistance
        );
      } else {
        // Position camera in front of player (second-person view)
        secondPersonOffset = new THREE.Vector3(
          Math.sin(actualYaw) * secondPersonDistance,
          secondPersonVerticalOffset,
          Math.cos(actualYaw) * secondPersonDistance
        );
      }
      
      const secondPersonDesiredPos = secondPersonPos.clone().add(secondPersonOffset);
      
      // Add smoothing for better follow
      camera.position.lerp(secondPersonDesiredPos, 0.1);
      
      // Always look at the player/vehicle position
      camera.lookAt(secondPersonPos);
      break;

    case 'third-person':
      // Camera behind player/vehicle, following target rotation
      const thirdPersonPos = playerPosition.clone();
      thirdPersonPos.y += eyeHeight;
      
      const verticalOffset = inVehicle ? 2.5 : 3.0; // Optimal height - good ground visibility and player overview
      
      let cameraOffset;
      if (inVehicle) {
        // Position camera in front of vehicle
        cameraOffset = new THREE.Vector3(
          Math.sin(actualYaw) * thirdPersonDistance,
          verticalOffset,
          Math.cos(actualYaw) * thirdPersonDistance
        );
      } else {
        // Position camera behind player (traditional third-person)
        cameraOffset = new THREE.Vector3(
          Math.sin(actualYaw + Math.PI) * thirdPersonDistance,
          verticalOffset,
          Math.cos(actualYaw + Math.PI) * thirdPersonDistance
        );
      }
      
      const desiredPos = thirdPersonPos.clone().add(cameraOffset);
      
      // Add smoothing for better vehicle follow
      camera.position.lerp(desiredPos, 0.1);
      
      // For front view, make camera look at the vehicle
      if (inVehicle) {
        camera.lookAt(thirdPersonPos);
      } else {
        // Camera rotation uses actual yaw (player yaw) and pitch (mouse pitch)
        camera.rotation.y = actualYaw;
        camera.rotation.x = actualPitch;
      }
      break;
  }
}
