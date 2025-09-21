import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import RoadLayer from './RoadLayer';
import { generateEnvironmentData } from '@/lib/environmentData';
import { usePlayer } from '@/lib/stores/usePlayer';
import { useTargets } from '@/lib/stores/useTargets';
import ShootingTarget from './ShootingTarget';

export default function Environment() {
  const asphaltTexture = useTexture('/textures/asphalt.png');
  const grassTexture = useTexture('/textures/grass.png');
  const { position, updatePosition } = usePlayer();
  const lastTeleportTime = useRef(0);

  // Prepare textures
  asphaltTexture.wrapS = asphaltTexture.wrapT = THREE.RepeatWrapping;
  asphaltTexture.repeat.set(20, 20);
  
  grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
  grassTexture.repeat.set(10, 10);

  // Colorful palette for buildings
  const colors = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7',
    '#dda0dd', '#98d8c8', '#f7dc6f', '#bb8fce', '#85c1e9',
    '#f8c471', '#82e0aa', '#f1948a', '#85c1e9', '#d7bde2'
  ];

  // Get shared environment data for consistent collision and rendering
  const { skyscrapers, houses: environmentHouses } = useMemo(() => generateEnvironmentData(), []);

  // Use shared house data for consistent collision detection
  const houses = environmentHouses;

  // Generate colorful tunnel entrances and underground passages
  const tunnels = useMemo(() => {
    const tunnelPositions = [];
    const tunnelSpacing = 40;
    
    // Create tunnel network
    for (let x = -2; x <= 2; x++) {
      for (let z = -2; z <= 2; z++) {
        if (x === 0 && z === 0) continue;
        
        tunnelPositions.push({
          position: [x * tunnelSpacing, -2, z * tunnelSpacing] as [number, number, number],
          color: colors[Math.floor(Math.random() * colors.length)]
        });
      }
    }
    
    return tunnelPositions;
  }, []);

  // Underground tunnel connections
  const tunnelConnections = useMemo(() => {
    const connections = [];
    
    // Horizontal tunnels
    for (let x = -80; x <= 80; x += 40) {
      connections.push({
        position: [x, -2.5, 0] as [number, number, number],
        dimensions: [35, 4, 6] as [number, number, number],
        color: '#555555'
      });
    }
    
    // Vertical tunnels  
    for (let z = -80; z <= 80; z += 40) {
      connections.push({
        position: [0, -2.5, z] as [number, number, number],
        dimensions: [6, 4, 35] as [number, number, number],
        color: '#555555'
      });
    }
    
    return connections;
  }, []);

  // Generate street light positions along roads (properly positioned)
  const streetLights = useMemo(() => {
    const lightPositions = [];
    
    // Street lights along North-South road - positioned on sidewalks
    for (let z = -35; z <= 35; z += 10) {
      if (Math.abs(z) > 8) { // Skip intersection area
        lightPositions.push({ x: -7.5, z: z }); // On west sidewalk
        lightPositions.push({ x: 7.5, z: z });  // On east sidewalk
      }
    }
    
    // Street lights along East-West road - positioned on sidewalks
    for (let x = -35; x <= 35; x += 10) {
      if (Math.abs(x) > 8) { // Skip intersection area
        lightPositions.push({ x: x, z: -7.5 }); // On south sidewalk
        lightPositions.push({ x: x, z: 7.5 });  // On north sidewalk
      }
    }
    
    // Corner street lights at intersection - on sidewalk corners
    lightPositions.push({ x: -7.5, z: -7.5 });
    lightPositions.push({ x: 7.5, z: -7.5 });
    lightPositions.push({ x: -7.5, z: 7.5 });
    lightPositions.push({ x: 7.5, z: 7.5 });
    
    return lightPositions;
  }, []);

  // Generate vehicle positions (pre-calculated to prevent glitching)
  const vehicles = useMemo(() => {
    const vehiclePositions = [];
    
    for (let i = 0; i < 15; i++) {
      vehiclePositions.push({
        x: (Math.random() - 0.5) * 120,
        z: (Math.random() - 0.5) * 120,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    
    return vehiclePositions;
  }, []);

  // Generate park bench positions (pre-calculated to prevent glitching)
  const parkBenches = useMemo(() => {
    const benchPositions = [];
    
    for (let i = 0; i < 10; i++) {
      benchPositions.push({
        x: (Math.random() - 0.5) * 100,
        z: (Math.random() - 0.5) * 100,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    
    return benchPositions;
  }, []);

  // Additional road network
  const additionalRoads = useMemo(() => {
    return [
      // Additional North-South roads
      { position: [-30, 0, 0] as [number, number, number], size: [6, 0.02, 100] as [number, number, number], rotation: [0, 0, 0] as [number, number, number] },
      { position: [30, 0, 0] as [number, number, number], size: [6, 0.02, 100] as [number, number, number], rotation: [0, 0, 0] as [number, number, number] },
      // Additional East-West roads  
      { position: [0, 0.001, -30] as [number, number, number], size: [100, 0.02, 6] as [number, number, number], rotation: [0, 0, 0] as [number, number, number] },
      { position: [0, 0.001, 30] as [number, number, number], size: [100, 0.02, 6] as [number, number, number], rotation: [0, 0, 0] as [number, number, number] },
      // Diagonal connecting roads (properly rotated)
      { position: [-15, 0.001, -15] as [number, number, number], size: [42, 0.02, 6] as [number, number, number], rotation: [0, Math.PI/4, 0] as [number, number, number] },
      { position: [15, 0.001, 15] as [number, number, number], size: [42, 0.02, 6] as [number, number, number], rotation: [0, Math.PI/4, 0] as [number, number, number] },
    ];
  }, []);

  // Get targets from store
  const { targets } = useTargets();

  // Tunnel traversal logic - check 2D distance to tunnel entrance at ground level
  useFrame(() => {
    if (!position) return;
    
    const now = Date.now();
    if (now - lastTeleportTime.current < 2000) return; // 2 second cooldown
    
    // Check if player is near any tunnel entrance (2D distance for ground alignment)
    tunnels.forEach((tunnel, index) => {
      const tunnelPos = new THREE.Vector2(tunnel.position[0], tunnel.position[2]);
      const playerPos = new THREE.Vector2(position.x, position.z);
      const distance = playerPos.distanceTo(tunnelPos);
      
      if (distance < 3) { // Within tunnel entrance radius
        // Find a different tunnel to teleport to
        const targetTunnelIndex = (index + 1) % tunnels.length;
        const targetTunnel = tunnels[targetTunnelIndex];
        const targetPos = new THREE.Vector3(
          targetTunnel.position[0] + 5, // Offset to avoid immediate re-trigger
          0.9, // Ground level
          targetTunnel.position[2] + 5
        );
        
        updatePosition(targetPos);
        lastTeleportTime.current = now;
        console.log(`Teleported from tunnel ${index} to tunnel ${targetTunnelIndex}`);
      }
    });
  });

  return (
    <>
      {/* Road System with Traffic Signals */}
      <RoadLayer />
      {/* Colorful Ground with patterns - positioned below roads to prevent z-fighting */}
      <mesh position={[0, -0.5, 0]} receiveShadow>
        <boxGeometry args={[300, 0.8, 300]} />
        <meshLambertMaterial map={asphaltTexture} color="#4a90e2" />
      </mesh>

      {/* Sidewalks for pedestrian movement */}
      {/* North-South sidewalks */}
      <mesh position={[-8, 0.05, 0]} receiveShadow>
        <boxGeometry args={[3, 0.1, 80]} />
        <meshLambertMaterial color="#cccccc" />
      </mesh>
      <mesh position={[8, 0.05, 0]} receiveShadow>
        <boxGeometry args={[3, 0.1, 80]} />
        <meshLambertMaterial color="#cccccc" />
      </mesh>

      {/* East-West sidewalks */}
      <mesh position={[0, 0.05, -8]} receiveShadow>
        <boxGeometry args={[80, 0.1, 3]} />
        <meshLambertMaterial color="#cccccc" />
      </mesh>
      <mesh position={[0, 0.05, 8]} receiveShadow>
        <boxGeometry args={[80, 0.1, 3]} />
        <meshLambertMaterial color="#cccccc" />
      </mesh>

      {/* Grass patches for parks */}
      <mesh position={[50, -0.05, 50]} receiveShadow>
        <boxGeometry args={[20, 0.1, 20]} />
        <meshLambertMaterial map={grassTexture} color="#7ed321" />
      </mesh>
      <mesh position={[-50, -0.05, -50]} receiveShadow>
        <boxGeometry args={[25, 0.1, 25]} />
        <meshLambertMaterial map={grassTexture} color="#7ed321" />
      </mesh>

      {/* Tall Colorful Skyscrapers */}
      {skyscrapers.map((building, i) => (
        <group key={`skyscraper-${i}`}>
          {/* Main building */}
          <mesh 
            position={[building.position[0], building.height / 2, building.position[2]]} 
            castShadow 
            receiveShadow
          >
            <boxGeometry args={[building.width, building.height, building.depth]} />
            <meshLambertMaterial color={building.color} />
          </mesh>
          
          {/* Building windows on all 4 sides - front, back, left, right */}
          {building.windowData?.map((windowInfo, floor) => (
            <group key={`windows-${i}-${floor}`}>
              {/* Front windows */}
              <mesh 
                position={[
                  building.position[0], 
                  (floor * 3) + 2, 
                  building.position[2] + building.depth / 2 + 0.01
                ]}
              >
                <boxGeometry args={[building.width * 0.8, 0.6, 0.05]} />
                <meshLambertMaterial 
                  color={windowInfo.windowColor} 
                  emissive={windowInfo.isEmissive ? windowInfo.windowColor : "#000000"}
                  emissiveIntensity={windowInfo.isEmissive ? 0.4 : 0}
                />
              </mesh>
              
              {/* Back windows */}
              <mesh 
                position={[
                  building.position[0], 
                  (floor * 3) + 2, 
                  building.position[2] - building.depth / 2 - 0.01
                ]}
              >
                <boxGeometry args={[building.width * 0.8, 0.6, 0.05]} />
                <meshLambertMaterial 
                  color={windowInfo.windowColor} 
                  emissive={windowInfo.isEmissive ? windowInfo.windowColor : "#000000"}
                  emissiveIntensity={windowInfo.isEmissive ? 0.3 : 0}
                />
              </mesh>
              
              {/* Left side windows */}
              <mesh 
                position={[
                  building.position[0] - building.width / 2 - 0.01, 
                  (floor * 3) + 2, 
                  building.position[2]
                ]}
              >
                <boxGeometry args={[0.05, 0.6, building.depth * 0.8]} />
                <meshLambertMaterial 
                  color={windowInfo.windowColor} 
                  emissive={windowInfo.isEmissive ? windowInfo.windowColor : "#000000"}
                  emissiveIntensity={windowInfo.isEmissive ? 0.3 : 0}
                />
              </mesh>
              
              {/* Right side windows */}
              <mesh 
                position={[
                  building.position[0] + building.width / 2 + 0.01, 
                  (floor * 3) + 2, 
                  building.position[2]
                ]}
              >
                <boxGeometry args={[0.05, 0.6, building.depth * 0.8]} />
                <meshLambertMaterial 
                  color={windowInfo.windowColor} 
                  emissive={windowInfo.isEmissive ? windowInfo.windowColor : "#000000"}
                  emissiveIntensity={windowInfo.isEmissive ? 0.3 : 0}
                />
              </mesh>
            </group>
          ))}
          
          {/* Colorful roof (using pre-calculated color) */}
          <mesh 
            position={[building.position[0], building.height + 0.3, building.position[2]]} 
            castShadow
          >
            <boxGeometry args={[building.width + 0.5, 0.6, building.depth + 0.5]} />
            <meshLambertMaterial color={building.roofColor} />
          </mesh>
          
          {/* Rooftop details */}
          <mesh 
            position={[building.position[0], building.height + 1, building.position[2]]} 
            castShadow
          >
            <boxGeometry args={[1, 1.5, 1]} />
            <meshLambertMaterial color="#ff4757" />
          </mesh>
        </group>
      ))}

      {/* Small Colorful Houses */}
      {houses.map((house, i) => (
        <group key={`house-${i}`}>
          {/* Main house */}
          <mesh 
            position={[house.position[0], house.height / 2, house.position[2]]} 
            castShadow 
            receiveShadow
          >
            <boxGeometry args={[house.width, house.height, house.depth]} />
            <meshLambertMaterial color={house.color} />
          </mesh>
          
          {/* House roof (properly positioned and using pre-calculated color) */}
          <mesh 
            position={[house.position[0], house.height + (house.roofHeight ?? 1.5) / 2, house.position[2]]} 
            castShadow
          >
            <coneGeometry args={[house.width * 0.7, house.roofHeight ?? 1.5]} />
            <meshLambertMaterial color={house.roofColor} />
          </mesh>
          
          {/* Door */}
          <mesh 
            position={[
              house.position[0], 
              house.height / 3, 
              house.position[2] + house.depth / 2 + 0.1
            ]} 
            castShadow
          >
            <boxGeometry args={[0.8, 1.5, 0.1]} />
            <meshLambertMaterial color="#8B4513" />
          </mesh>
          
          {/* House windows on multiple sides */}
          <group>
            {/* Front windows (2 windows flanking the door) */}
            <mesh 
              position={[
                house.position[0] - house.width / 3, 
                house.height * 0.6, 
                house.position[2] + house.depth / 2 + 0.01
              ]} 
            >
              <boxGeometry args={[0.7, 0.7, 0.05]} />
              <meshLambertMaterial 
                color="#87ceeb" 
                emissive="#87ceeb"
                emissiveIntensity={(house.position[0] * 3 + i) % 5 > 3 ? 0.2 : 0}
              />
            </mesh>
            <mesh 
              position={[
                house.position[0] + house.width / 3, 
                house.height * 0.6, 
                house.position[2] + house.depth / 2 + 0.01
              ]} 
            >
              <boxGeometry args={[0.7, 0.7, 0.05]} />
              <meshLambertMaterial 
                color="#87ceeb"
                emissive="#87ceeb"
                emissiveIntensity={(house.position[2] * 7 + i) % 4 > 2 ? 0.2 : 0}
              />
            </mesh>
            
            {/* Side windows */}
            <mesh 
              position={[
                house.position[0] - house.width / 2 - 0.01, 
                house.height * 0.6, 
                house.position[2]
              ]}
            >
              <boxGeometry args={[0.05, 0.6, 0.6]} />
              <meshLambertMaterial color="#87ceeb" />
            </mesh>
            <mesh 
              position={[
                house.position[0] + house.width / 2 + 0.01, 
                house.height * 0.6, 
                house.position[2]
              ]}
            >
              <boxGeometry args={[0.05, 0.6, 0.6]} />
              <meshLambertMaterial color="#87ceeb" />
            </mesh>
            
            {/* Back window */}
            <mesh 
              position={[
                house.position[0], 
                house.height * 0.6, 
                house.position[2] - house.depth / 2 - 0.01
              ]}
            >
              <boxGeometry args={[0.6, 0.6, 0.05]} />
              <meshLambertMaterial color="#87ceeb" />
            </mesh>
          </group>
        </group>
      ))}

      {/* Underground Tunnel Network */}
      {tunnelConnections.map((tunnel, i) => (
        <mesh 
          key={`tunnel-connection-${i}`}
          position={tunnel.position} 
          receiveShadow
        >
          <boxGeometry args={tunnel.dimensions} />
          <meshLambertMaterial color={tunnel.color} />
        </mesh>
      ))}

      {/* Futuristic Tunnel Entrances */}
      {tunnels.map((tunnel, i) => (
        <group key={`futuristic-tunnel-${i}`}>
          {/* Main tunnel structure - sleek and angular */}
          <mesh 
            position={tunnel.position} 
            receiveShadow
          >
            <octahedronGeometry args={[4]} />
            <meshLambertMaterial 
              color={tunnel.color} 
              emissive={tunnel.color}
              emissiveIntensity={0.3}
            />
          </mesh>
          
          {/* Glowing rim around entrance */}
          <mesh 
            position={[tunnel.position[0], tunnel.position[1] + 1, tunnel.position[2]]} 
            receiveShadow
          >
            <torusGeometry args={[2.8, 0.3, 8, 16]} />
            <meshLambertMaterial 
              color="#00ffff" 
              emissive="#00ffff"
              emissiveIntensity={0.8}
            />
          </mesh>
          
          {/* Tunnel opening with inner glow */}
          <mesh 
            position={[tunnel.position[0], tunnel.position[1] + 1, tunnel.position[2]]} 
            receiveShadow
          >
            <cylinderGeometry args={[2.2, 2.2, 5.5]} />
            <meshLambertMaterial 
              color="#001122" 
              emissive="#004488"
              emissiveIntensity={0.4}
            />
          </mesh>
          
          {/* Holographic entrance sign */}
          <mesh 
            position={[tunnel.position[0], tunnel.position[1] + 4, tunnel.position[2]]} 
            castShadow
          >
            <planeGeometry args={[5, 1.5]} />
            <meshLambertMaterial 
              color="#00ff00" 
              emissive="#00ff00"
              emissiveIntensity={0.7}
              transparent
              opacity={0.8}
            />
          </mesh>
          
          {/* Energy field effect */}
          <mesh 
            position={[tunnel.position[0], tunnel.position[1] + 1, tunnel.position[2]]} 
            rotation={[0, 0, 0]}
          >
            <ringGeometry args={[2.2, 3.5, 16]} />
            <meshLambertMaterial 
              color="#ff00ff" 
              emissive="#ff00ff"
              emissiveIntensity={0.6}
              transparent 
              opacity={0.3} 
            />
          </mesh>
          
          {/* Floating light orbs around entrance */}
          <mesh position={[tunnel.position[0] + 3, tunnel.position[1] + 2, tunnel.position[2]]}>
            <sphereGeometry args={[0.2]} />
            <meshLambertMaterial 
              color="#ffffff" 
              emissive="#ffffff"
              emissiveIntensity={1}
            />
          </mesh>
          <mesh position={[tunnel.position[0] - 3, tunnel.position[1] + 2, tunnel.position[2]]}>
            <sphereGeometry args={[0.2]} />
            <meshLambertMaterial 
              color="#ffffff" 
              emissive="#ffffff"
              emissiveIntensity={1}
            />
          </mesh>
          <mesh position={[tunnel.position[0], tunnel.position[1] + 2, tunnel.position[2] + 3]}>
            <sphereGeometry args={[0.2]} />
            <meshLambertMaterial 
              color="#ffffff" 
              emissive="#ffffff"
              emissiveIntensity={1}
            />
          </mesh>
          <mesh position={[tunnel.position[0], tunnel.position[1] + 2, tunnel.position[2] - 3]}>
            <sphereGeometry args={[0.2]} />
            <meshLambertMaterial 
              color="#ffffff" 
              emissive="#ffffff"
              emissiveIntensity={1}
            />
          </mesh>
        </group>
      ))}

      {/* Colorful decorative elements */}
      
      {/* Park benches */}
      {parkBenches.map((bench, i) => (
        <mesh key={`bench-${i}`} position={[bench.x, 0.4, bench.z]} castShadow receiveShadow>
          <boxGeometry args={[2, 0.8, 0.5]} />
          <meshLambertMaterial color={bench.color} />
        </mesh>
      ))}

      {/* Street lights */}
      {streetLights.map((light, i) => (
        <group key={`streetlight-${i}`}>
          <mesh position={[light.x, 4.1, light.z]} castShadow>
            <cylinderGeometry args={[0.1, 0.1, 8]} />
            <meshLambertMaterial color="#666666" />
          </mesh>
          <mesh position={[light.x, 8.1, light.z]} castShadow>
            <sphereGeometry args={[0.5]} />
            <meshLambertMaterial 
              color="#ffff00" 
              emissive="#ffff00"
              emissiveIntensity={0.5}
            />
          </mesh>
        </group>
      ))}

      {/* Futuristic parked vehicles */}
      {vehicles.map((vehicle, i) => (
        <group key={`futuristic-car-${i}`}>
          {/* Sleek main body */}
          <mesh position={[vehicle.x, 0.8, vehicle.z]} castShadow receiveShadow>
            <capsuleGeometry args={[0.8, 3]} />
            <meshLambertMaterial 
              color={vehicle.color} 
              emissive={vehicle.color}
              emissiveIntensity={0.2}
            />
          </mesh>
          
          {/* Glowing accent stripe */}
          <mesh position={[vehicle.x, 0.85, vehicle.z]} castShadow>
            <capsuleGeometry args={[0.4, 2.5]} />
            <meshLambertMaterial 
              color="#00ffff" 
              emissive="#00ffff"
              emissiveIntensity={0.6}
              transparent
              opacity={0.7}
            />
          </mesh>
          
          {/* Futuristic windshield */}
          <mesh position={[vehicle.x, 1.3, vehicle.z + 0.2]} castShadow>
            <sphereGeometry args={[0.9, 8, 6]} />
            <meshLambertMaterial 
              color="#001133" 
              transparent 
              opacity={0.3}
              emissive="#0088ff"
              emissiveIntensity={0.15}
            />
          </mesh>
          
          {/* Hover wheels with glow */}
          <mesh position={[vehicle.x + 0.9, 0.4, vehicle.z + 0.8]} castShadow>
            <torusGeometry args={[0.3, 0.1, 6, 12]} />
            <meshLambertMaterial 
              color="#111111"
              emissive="#00ff88"
              emissiveIntensity={0.5}
            />
          </mesh>
          <mesh position={[vehicle.x - 0.9, 0.4, vehicle.z + 0.8]} castShadow>
            <torusGeometry args={[0.3, 0.1, 6, 12]} />
            <meshLambertMaterial 
              color="#111111"
              emissive="#00ff88"
              emissiveIntensity={0.5}
            />
          </mesh>
          <mesh position={[vehicle.x + 0.9, 0.4, vehicle.z - 0.8]} castShadow>
            <torusGeometry args={[0.3, 0.1, 6, 12]} />
            <meshLambertMaterial 
              color="#111111"
              emissive="#00ff88"
              emissiveIntensity={0.5}
            />
          </mesh>
          <mesh position={[vehicle.x - 0.9, 0.4, vehicle.z - 0.8]} castShadow>
            <torusGeometry args={[0.3, 0.1, 6, 12]} />
            <meshLambertMaterial 
              color="#111111"
              emissive="#00ff88"
              emissiveIntensity={0.5}
            />
          </mesh>
          
          {/* LED headlights */}
          <mesh position={[vehicle.x + 0.3, 0.7, vehicle.z + 1.6]} castShadow>
            <cylinderGeometry args={[0.12, 0.1, 0.08]} />
            <meshLambertMaterial 
              color="#ffffff" 
              emissive="#ffffff"
              emissiveIntensity={0.9}
            />
          </mesh>
          <mesh position={[vehicle.x - 0.3, 0.7, vehicle.z + 1.6]} castShadow>
            <cylinderGeometry args={[0.12, 0.1, 0.08]} />
            <meshLambertMaterial 
              color="#ffffff" 
              emissive="#ffffff"
              emissiveIntensity={0.9}
            />
          </mesh>
          
          {/* Neon underglow */}
          <mesh position={[vehicle.x, 0.15, vehicle.z]} rotation={[-Math.PI/2, 0, 0]}>
            <ringGeometry args={[1.5, 1.8]} />
            <meshLambertMaterial 
              color="#ff00ff" 
              emissive="#ff00ff"
              emissiveIntensity={0.4}
              transparent 
              opacity={0.5} 
            />
          </mesh>
        </group>
      ))}

      {/* Additional Roads */}
      {additionalRoads.map((road, i) => (
        <mesh 
          key={`additional-road-${i}`} 
          position={road.position} 
          rotation={road.rotation}
          receiveShadow
        >
          <boxGeometry args={road.size} />
          <meshLambertMaterial map={asphaltTexture} />
        </mesh>
      ))}

      {/* Shooting Ground */}
      {/* Shooting range floor */}
      <mesh position={[68, 0, 68]} receiveShadow>
        <boxGeometry args={[40, 0.1, 30]} />
        <meshLambertMaterial color="#8B4513" />
      </mesh>
      
      {/* Shooting ground sign */}
      <mesh position={[50, 3, 68]} rotation={[0, Math.PI/2, 0]}>
        <planeGeometry args={[8, 3]} />
        <meshLambertMaterial 
          color="#FFD700" 
          emissive="#FFD700"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Shooting Targets with smooth animation */}
      {targets.map((target) => (
        <ShootingTarget key={target.id} target={target} />
      ))}

      {/* Shooting position markers */}
      {Array.from({ length: 4 }).map((_, i) => (
        <mesh key={`shooting-pos-${i}`} position={[45, 0.01, 60 + i * 5]} receiveShadow>
          <boxGeometry args={[3, 0.02, 2]} />
          <meshLambertMaterial color="#FFFFFF" />
        </mesh>
      ))}

      {/* Colorful sky */}
      <mesh position={[0, 60, 0]}>
        <sphereGeometry args={[200, 32, 32]} />
        <meshBasicMaterial 
          color="#ff9ff3" 
          side={THREE.BackSide} 
          transparent 
          opacity={0.8}
        />
      </mesh>
    </>
  );
}