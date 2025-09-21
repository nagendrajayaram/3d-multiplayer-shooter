import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { useVehicles, Vehicle } from '@/lib/stores/useVehicles';
import { usePlayer } from '@/lib/stores/usePlayer';
import { Controls } from '@/lib/controls';
import { createAABB, checkAABBCollision, type AABB } from '@/lib/collision';
import { generateCollisionAABBs } from '@/lib/environmentData';

// Individual Car component
function Car({ vehicle }: { vehicle: Vehicle }) {
  const vehicleRef = useRef<THREE.Group>(null);

  // Update visual position/rotation to match vehicle state
  useEffect(() => {
    if (vehicleRef.current) {
      vehicleRef.current.position.copy(vehicle.position);
      vehicleRef.current.rotation.copy(vehicle.rotation);
    }
  }, [vehicle.position, vehicle.rotation]);

  const carSize = vehicle.type === 'truck' ? { width: 2.5, height: 1.8, length: 5 } : { width: 2, height: 1.5, length: 4 };
  const isPlayerVehicle = vehicle.isPlayerControlled;

  return (
    <group ref={vehicleRef} position={vehicle.position.toArray()}>
      {/* Futuristic main body - sleek and aerodynamic */}
      <mesh position={[0, carSize.height/2, 0]} castShadow receiveShadow>
        <capsuleGeometry args={[carSize.width/2, carSize.length - carSize.width/2]} />
        <meshLambertMaterial 
          color={vehicle.color}
          emissive={vehicle.color}
          emissiveIntensity={isPlayerVehicle ? 0.3 : 0.15}
        />
      </mesh>
      
      {/* Sleek body accent lines */}
      <mesh position={[0, carSize.height/2 + 0.05, 0]} castShadow>
        <capsuleGeometry args={[carSize.width/3, carSize.length - carSize.width/3]} />
        <meshLambertMaterial 
          color="#00ffff"
          emissive="#00ffff"
          emissiveIntensity={0.6}
          transparent
          opacity={0.8}
        />
      </mesh>
      
      {/* Futuristic windshield - panoramic */}
      <mesh position={[0, carSize.height * 0.9, carSize.length * 0.1]} castShadow>
        <sphereGeometry args={[carSize.width * 0.6, 8, 6]} />
        <meshLambertMaterial 
          color="#001133" 
          transparent 
          opacity={0.4}
          emissive="#0088ff"
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Hover-style wheels with glowing rims */}
      <group>
        <mesh position={[carSize.width/2 + 0.2, 0.4, carSize.length/3]} castShadow>
          <torusGeometry args={[0.5, 0.15, 8, 16]} />
          <meshLambertMaterial 
            color="#222222"
            emissive="#00ff88"
            emissiveIntensity={0.4}
          />
        </mesh>
        <mesh position={[-carSize.width/2 - 0.2, 0.4, carSize.length/3]} castShadow>
          <torusGeometry args={[0.5, 0.15, 8, 16]} />
          <meshLambertMaterial 
            color="#222222"
            emissive="#00ff88"
            emissiveIntensity={0.4}
          />
        </mesh>
        <mesh position={[carSize.width/2 + 0.2, 0.4, -carSize.length/3]} castShadow>
          <torusGeometry args={[0.5, 0.15, 8, 16]} />
          <meshLambertMaterial 
            color="#222222"
            emissive="#00ff88"
            emissiveIntensity={0.4}
          />
        </mesh>
        <mesh position={[-carSize.width/2 - 0.2, 0.4, -carSize.length/3]} castShadow>
          <torusGeometry args={[0.5, 0.15, 8, 16]} />
          <meshLambertMaterial 
            color="#222222"
            emissive="#00ff88"
            emissiveIntensity={0.4}
          />
        </mesh>
      </group>

      {/* Advanced LED headlights */}
      <mesh position={[carSize.width/4, carSize.height/2, carSize.length/2 + 0.3]} castShadow>
        <cylinderGeometry args={[0.2, 0.15, 0.1]} />
        <meshLambertMaterial 
          color="#ffffff" 
          emissive="#ffffff"
          emissiveIntensity={0.8}
        />
      </mesh>
      <mesh position={[-carSize.width/4, carSize.height/2, carSize.length/2 + 0.3]} castShadow>
        <cylinderGeometry args={[0.2, 0.15, 0.1]} />
        <meshLambertMaterial 
          color="#ffffff" 
          emissive="#ffffff"
          emissiveIntensity={0.8}
        />
      </mesh>

      {/* Neon underglow */}
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <ringGeometry args={[carSize.length/2, carSize.length/2 + 0.3]} />
        <meshLambertMaterial 
          color="#ff00ff" 
          emissive="#ff00ff"
          emissiveIntensity={0.5}
          transparent 
          opacity={0.6} 
        />
      </mesh>

      {/* Engine exhaust glows */}
      <mesh position={[carSize.width/4, carSize.height/3, -carSize.length/2 - 0.2]} castShadow>
        <cylinderGeometry args={[0.1, 0.08, 0.3]} />
        <meshLambertMaterial 
          color="#ff4400" 
          emissive="#ff4400"
          emissiveIntensity={0.7}
        />
      </mesh>
      <mesh position={[-carSize.width/4, carSize.height/3, -carSize.length/2 - 0.2]} castShadow>
        <cylinderGeometry args={[0.1, 0.08, 0.3]} />
        <meshLambertMaterial 
          color="#ff4400" 
          emissive="#ff4400"
          emissiveIntensity={0.7}
        />
      </mesh>

      {/* Player interaction hologram */}
      {!isPlayerVehicle && (
        <mesh position={[0, carSize.height + 1.5, 0]} rotation={[-Math.PI/2, 0, 0]}>
          <ringGeometry args={[1.0, 1.5]} />
          <meshLambertMaterial 
            color="#00ffff" 
            emissive="#00ffff"
            emissiveIntensity={0.8}
            transparent 
            opacity={0.4} 
          />
        </mesh>
      )}
    </group>
  );
}

export default function VehicleManager() {
  // Use selectors to prevent unnecessary re-renders
  const vehicles = useVehicles(state => state.vehicles);
  const signals = useVehicles(state => state.signals);
  const waypoints = useVehicles(state => state.waypoints);
  const signalPhase = useVehicles(state => state.signalPhase);
  
  // Create environment collision obstacles using shared deterministic data
  const environmentObstacles = useRef<AABB[]>([]);
  
  useEffect(() => {
    // Use shared environment data for consistent collision detection
    const obstacles = generateCollisionAABBs();
    environmentObstacles.current = obstacles;
    console.log(`Generated ${obstacles.length} shared collision obstacles for vehicles`);
  }, []);

  // Function to check vehicle collision with environment
  const checkVehicleCollision = (newPosition: THREE.Vector3, vehicle: Vehicle): boolean => {
    const vehicleSize = vehicle.type === 'truck' 
      ? new THREE.Vector3(2.5, 1.8, 5) 
      : new THREE.Vector3(2, 1.5, 4);
    
    // First check if vehicle is going completely out of reasonable bounds (safety check)
    const roadBounds = 50; // Allow some buffer beyond the 40-unit road
    if (Math.abs(newPosition.x) > roadBounds || Math.abs(newPosition.z) > roadBounds) {
      return true; // Block vehicles from going too far out
    }
    
    const vehicleAABB = createAABB(newPosition.clone().add(new THREE.Vector3(0, vehicleSize.y/2, 0)), vehicleSize);
    
    // Check collision with environment obstacles (only close ones for performance)
    for (const obstacle of environmentObstacles.current) {
      // Skip collision check if obstacle is very far away
      const obstacleCenter = obstacle.min.clone().add(obstacle.max).multiplyScalar(0.5);
      if (newPosition.distanceTo(obstacleCenter) > 15) continue;
      
      if (checkAABBCollision(vehicleAABB, obstacle)) {
        return true;
      }
    }
    
    // Check collision with other vehicles (only nearby ones)
    for (const otherVehicle of vehicles) {
      if (otherVehicle.id === vehicle.id) continue;
      if (newPosition.distanceTo(otherVehicle.position) > 10) continue; // Skip far vehicles
      
      const otherSize = otherVehicle.type === 'truck' 
        ? new THREE.Vector3(2.5, 1.8, 5) 
        : new THREE.Vector3(2, 1.5, 4);
      const otherAABB = createAABB(
        otherVehicle.position.clone().add(new THREE.Vector3(0, otherSize.y/2, 0)), 
        otherSize
      );
      
      if (checkAABBCollision(vehicleAABB, otherAABB)) {
        return true;
      }
    }
    
    return false;
  };

  // Function to resolve collision by reverting to safe position
  const resolveCollision = (vehicle: Vehicle, oldPosition: THREE.Vector3, newPosition: THREE.Vector3): THREE.Vector3 => {
    // Simple and safe: just revert to the old position
    console.log(`Reverting vehicle ${vehicle.id} from collision at`, newPosition.toArray(), 'to', oldPosition.toArray());
    return oldPosition.clone();
  };
  const addVehicle = useVehicles(state => state.addVehicle);
  const updateVehicle = useVehicles(state => state.updateVehicle);
  const spawnNPCVehicles = useVehicles(state => state.spawnNPCVehicles);

  const { position: playerPosition, inVehicle, vehicleId, enterVehicle, exitVehicle, updatePosition } = usePlayer();
  const lastInteractRef = useRef(0); // For debouncing interact key
  const [, getKeyboardState] = useKeyboardControls<Controls>();

  // Initialize vehicles on mount
  useEffect(() => {
    // Spawn some NPC vehicles
    spawnNPCVehicles(6);
    
    // Add some parked cars for player interaction
    const parkedCars = [
      { position: new THREE.Vector3(8, 0.5, 8), lane: 0, color: '#ff4757' },
      { position: new THREE.Vector3(-8, 0.5, -8), lane: 1, color: '#3742fa' },
      { position: new THREE.Vector3(15, 0.5, -8), lane: 2, color: '#2ed573' }
    ];

    parkedCars.forEach(car => {
      addVehicle({
        position: car.position,
        rotation: new THREE.Euler(0, 0, 0),
        speed: 0,
        isPlayerControlled: false,
        type: 'car',
        color: car.color,
        maxSpeed: 12,
        steerAngle: 0,
        currentLane: car.lane,
        waypointIndex: 0
      });
    });

    console.log('Vehicle system initialized');
  }, [spawnNPCVehicles, addVehicle]);

  // Main vehicle update loop
  useFrame((_, delta) => {
    const controls = getKeyboardState();
    
    vehicles.forEach(vehicle => {
      if (vehicle.isPlayerControlled && vehicleId === vehicle.id) {
        // Handle player-controlled vehicle
        handlePlayerVehicle(vehicle, controls, delta);
      } else if (!vehicle.isPlayerControlled) {
        // Handle NPC vehicle AI (removed speed > 0 guard so they start moving)
        handleNPCVehicle(vehicle, delta);
      }
    });

    // Check for vehicle interaction and exit handling
    if (!inVehicle) {
      checkVehicleInteraction(controls);
    } else if (inVehicle && controls.interact) {
      // Handle vehicle exit in frame loop with debouncing
      const now = Date.now();
      if (now - lastInteractRef.current > 500) { // 500ms debounce
        console.log('Player exiting vehicle');
        if (vehicleId) {
          // Position player next to the vehicle
          const vehicle = vehicles.find(v => v.id === vehicleId);
          if (vehicle) {
            const exitPosition = vehicle.position.clone().add(new THREE.Vector3(3, 0.9, 0));
            updatePosition(exitPosition); // Actually update player position
          }
          updateVehicle(vehicleId, { isPlayerControlled: false, speed: 0 });
        }
        exitVehicle();
        lastInteractRef.current = now;
      }
    }
  });

  const handlePlayerVehicle = (vehicle: Vehicle, controls: any, delta: number) => {
    const throttle = controls.forward ? 1 : 0;
    const reverse = (controls.backward || controls.back) ? -0.5 : 0; // Handle both control names
    const steering = controls.left ? 1 : controls.right ? -1 : 0;
    const brake = controls.brake ? 1 : 0;

    // Update speed with throttle/brake
    const acceleration = (throttle + reverse) * 15 - brake * 20;
    let newSpeed = vehicle.speed + acceleration * delta;
    
    // Apply friction when no input
    if (throttle === 0 && reverse === 0 && brake === 0) {
      newSpeed *= Math.pow(0.95, delta * 60); // Friction
    }
    
    // Allow negative speeds for backward movement
    newSpeed = Math.max(-vehicle.maxSpeed * 0.6, Math.min(vehicle.maxSpeed, newSpeed));

    // Update position and rotation
    const newRotation = vehicle.rotation.clone();
    if (Math.abs(newSpeed) > 0.1 && Math.abs(steering) > 0.1) {
      newRotation.y += steering * 2 * delta;
    }

    const forward = new THREE.Vector3(0, 0, 1).applyEuler(newRotation);
    const newPosition = vehicle.position.clone().add(forward.multiplyScalar(newSpeed * delta));
    
    // Keep vehicle on ground
    newPosition.y = 0.5;
    
    // Check for collision before updating position
    const oldPosition = vehicle.position.clone();
    let finalPosition = newPosition;
    let finalSpeed = newSpeed;
    
    // COMPLETELY DISABLED - Testing vehicle movement
    // if (checkVehicleCollision(newPosition, vehicle)) {
    //   console.log(`Player Vehicle ${vehicle.id} collision detected at`, newPosition.toArray());
    //   finalPosition = resolveCollision(vehicle, oldPosition, newPosition);
    //   finalSpeed = 0;
    // }

    updateVehicle(vehicle.id, {
      position: finalPosition,
      rotation: newRotation,
      speed: finalSpeed,
      steerAngle: steering
    });

    // Log player controls for debugging
    if (throttle || reverse || steering || brake) {
      console.log('Player vehicle controls:', { throttle, reverse, steering, brake, speed: newSpeed.toFixed(1) });
    }
  };

  const handleNPCVehicle = (vehicle: Vehicle, delta: number) => {
    // Get current lane waypoints
    const laneKey = `lane${vehicle.currentLane}` as keyof typeof waypoints;
    const currentWaypoints = waypoints[laneKey];
    
    if (!currentWaypoints || currentWaypoints.length === 0) return;

    // Check traffic signals - stop if red/yellow and close to intersection
    const shouldStop = checkTrafficSignal(vehicle);
    
    if (shouldStop) {
      // Gradually slow down
      const newSpeed = Math.max(0, vehicle.speed - 8 * delta);
      updateVehicle(vehicle.id, { speed: newSpeed });
      return;
    }

    // Follow waypoints
    const targetWaypoint = currentWaypoints[vehicle.waypointIndex];
    if (!targetWaypoint) return;

    const direction = targetWaypoint.clone().sub(vehicle.position).normalize();
    const distance = vehicle.position.distanceTo(targetWaypoint);

    // Move towards waypoint
    if (distance < 2) {
      // Reached waypoint, move to next
      const nextIndex = (vehicle.waypointIndex + 1) % currentWaypoints.length;
      updateVehicle(vehicle.id, { waypointIndex: nextIndex });
    }

    // Update speed towards target (start with small speed if stopped)
    const targetSpeed = Math.min(vehicle.maxSpeed, 8);
    const currentSpeed = vehicle.speed === 0 ? 2 : vehicle.speed; // Give initial speed if stopped
    const newSpeed = THREE.MathUtils.lerp(currentSpeed, targetSpeed, delta * 2);
    
    // Calculate new position
    const newPosition = vehicle.position.clone().add(direction.multiplyScalar(newSpeed * delta));
    newPosition.y = 0.5; // Keep on ground
    
    // Check for collision before updating position
    const oldPosition = vehicle.position.clone();
    let finalPosition = newPosition;
    
    // COMPLETELY DISABLED - Testing vehicle movement - just update position directly
    const newRotation = new THREE.Euler(0, Math.atan2(direction.x, direction.z), 0);
    
    updateVehicle(vehicle.id, {
      position: finalPosition,
      rotation: newRotation,
      speed: newSpeed
    });
  };

  const checkTrafficSignal = (vehicle: Vehicle): boolean => {
    // Check if vehicle is approaching intersection and should stop for signal
    const intersectionBounds = { x: 6, z: 6 }; // Stop line positions
    
    // Determine signal direction based on lane
    let signalDirection: 'ns' | 'ew';
    if (vehicle.currentLane === 0 || vehicle.currentLane === 1) {
      signalDirection = 'ns';
    } else {
      signalDirection = 'ew';
    }

    // Find relevant signal
    const relevantSignal = signals.find(signal => signal.direction === signalDirection);
    if (!relevantSignal) return false;

    // Check if approaching intersection
    const toIntersection = Math.abs(vehicle.position.x) < 15 && Math.abs(vehicle.position.z) < 15;
    const nearStopLine = signalDirection === 'ns' ? 
      Math.abs(vehicle.position.z) < intersectionBounds.z + 3 :
      Math.abs(vehicle.position.x) < intersectionBounds.x + 3;

    // Stop if red or yellow and approaching
    return toIntersection && nearStopLine && (relevantSignal.state === 'red' || relevantSignal.state === 'yellow');
  };

  const checkVehicleInteraction = (controls: any) => {
    // Add debouncing to prevent immediate re-enter after exit
    const now = Date.now();
    if (controls.interact && now - lastInteractRef.current > 500) {
      // Find nearby parked vehicles
      const nearbyVehicle = vehicles.find(vehicle => 
        !vehicle.isPlayerControlled && 
        vehicle.speed === 0 && 
        vehicle.position.distanceTo(playerPosition) < 3
      );

      if (nearbyVehicle) {
        console.log(`Player entering vehicle: ${nearbyVehicle.id}`);
        enterVehicle(nearbyVehicle.id);
        updateVehicle(nearbyVehicle.id, { isPlayerControlled: true, speed: 0 }); // Ensure player control and reset speed
        lastInteractRef.current = now; // Update debounce timer to prevent immediate exit
      }
    }
  };

  // Vehicle exit is now handled in the main useFrame loop above

  return (
    <group>
      {vehicles.map(vehicle => (
        <Car key={vehicle.id} vehicle={vehicle} />
      ))}
    </group>
  );
}