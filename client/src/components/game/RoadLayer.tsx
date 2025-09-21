import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useVehicles } from '@/lib/stores/useVehicles';

export default function RoadLayer() {
  // Use selectors to prevent unnecessary re-renders
  const signals = useVehicles(state => state.signals);
  const updateSignalPhase = useVehicles(state => state.updateSignalPhase);
  const initializeTrafficSignals = useVehicles(state => state.initializeTrafficSignals);
  const waypoints = useVehicles(state => state.waypoints);
  const asphaltTexture = useTexture('/textures/asphalt.png');
  
  // Configure texture tiling
  useEffect(() => {
    asphaltTexture.wrapS = asphaltTexture.wrapT = THREE.RepeatWrapping;
    asphaltTexture.repeat.set(4, 4);
  }, [asphaltTexture]);

  // Initialize traffic signals on mount
  useEffect(() => {
    initializeTrafficSignals();
  }, [initializeTrafficSignals]);

  // Update signal phases every frame using actual delta time
  useFrame((_, delta) => {
    updateSignalPhase(delta);
  });

  // Waypoints are now managed by the store

  // Waypoints are now stored in the useVehicles store instead of window global

  return (
    <group>
      {/* Main Road Intersection - North-South road */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[8, 0.02, 80]} />
        <meshLambertMaterial map={asphaltTexture} />
      </mesh>

      {/* Main Road Intersection - East-West road */}
      <mesh position={[0, 0.001, 0]} receiveShadow>
        <boxGeometry args={[80, 0.02, 8]} />
        <meshLambertMaterial map={asphaltTexture} />
      </mesh>

      {/* Lane markings - North-South center line */}
      {Array.from({ length: 16 }).map((_, i) => {
        const z = -35 + (i * 5);
        // Skip center intersection area
        if (z > -5 && z < 5) return null;
        return (
          <mesh key={`ns-line-${i}`} position={[0, 0.012, z]} receiveShadow>
            <boxGeometry args={[0.2, 0.002, 2]} />
            <meshLambertMaterial color="#ffffff" />
          </mesh>
        );
      })}

      {/* Lane markings - East-West center line */}
      {Array.from({ length: 16 }).map((_, i) => {
        const x = -35 + (i * 5);
        // Skip center intersection area
        if (x > -5 && x < 5) return null;
        return (
          <mesh key={`ew-line-${i}`} position={[x, 0.013, 0]} receiveShadow>
            <boxGeometry args={[2, 0.002, 0.2]} />
            <meshLambertMaterial color="#ffffff" />
          </mesh>
        );
      })}

      {/* Stop lines at intersection */}
      {/* North approach stop line */}
      <mesh position={[0, 0.012, 6]} receiveShadow>
        <boxGeometry args={[8, 0.002, 0.3]} />
        <meshLambertMaterial color="#ffffff" />
      </mesh>
      
      {/* South approach stop line */}
      <mesh position={[0, 0.012, -6]} receiveShadow>
        <boxGeometry args={[8, 0.002, 0.3]} />
        <meshLambertMaterial color="#ffffff" />
      </mesh>

      {/* East approach stop line */}
      <mesh position={[6, 0.013, 0]} receiveShadow>
        <boxGeometry args={[0.3, 0.002, 8]} />
        <meshLambertMaterial color="#ffffff" />
      </mesh>

      {/* West approach stop line */}
      <mesh position={[-6, 0.013, 0]} receiveShadow>
        <boxGeometry args={[0.3, 0.002, 8]} />
        <meshLambertMaterial color="#ffffff" />
      </mesh>

      {/* Traffic Signal Posts and Lights */}
      {signals.map((signal) => (
        <group key={signal.id} position={signal.position.toArray()}>
          {/* Signal post */}
          <mesh position={[0, -2, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.1, 4]} />
            <meshLambertMaterial color="#333333" />
          </mesh>

          {/* Signal housing */}
          <mesh position={[0, 0, 0]} castShadow>
            <boxGeometry args={[0.8, 2.5, 0.3]} />
            <meshLambertMaterial color="#222222" />
          </mesh>

          {/* Red light */}
          <mesh position={[0, 0.8, 0.2]} castShadow>
            <sphereGeometry args={[0.25]} />
            <meshLambertMaterial 
              color={signal.state === 'red' ? '#ff0000' : '#660000'}
              emissive={signal.state === 'red' ? '#ff0000' : '#000000'}
              emissiveIntensity={signal.state === 'red' ? 0.5 : 0}
            />
          </mesh>

          {/* Yellow light */}
          <mesh position={[0, 0, 0.2]} castShadow>
            <sphereGeometry args={[0.25]} />
            <meshLambertMaterial 
              color={signal.state === 'yellow' ? '#ffff00' : '#666600'}
              emissive={signal.state === 'yellow' ? '#ffff00' : '#000000'}
              emissiveIntensity={signal.state === 'yellow' ? 0.5 : 0}
            />
          </mesh>

          {/* Green light */}
          <mesh position={[0, -0.8, 0.2]} castShadow>
            <sphereGeometry args={[0.25]} />
            <meshLambertMaterial 
              color={signal.state === 'green' ? '#00ff00' : '#006600'}
              emissive={signal.state === 'green' ? '#00ff00' : '#000000'}
              emissiveIntensity={signal.state === 'green' ? 0.5 : 0}
            />
          </mesh>
        </group>
      ))}

      {/* Curbs and sidewalks */}
      {/* North curb */}
      <mesh position={[0, 0.1, 4.2]} castShadow receiveShadow>
        <boxGeometry args={[8.5, 0.2, 0.4]} />
        <meshLambertMaterial color="#cccccc" />
      </mesh>

      {/* South curb */}
      <mesh position={[0, 0.1, -4.2]} castShadow receiveShadow>
        <boxGeometry args={[8.5, 0.2, 0.4]} />
        <meshLambertMaterial color="#cccccc" />
      </mesh>

      {/* East curb */}
      <mesh position={[4.2, 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.4, 0.2, 8.5]} />
        <meshLambertMaterial color="#cccccc" />
      </mesh>

      {/* West curb */}
      <mesh position={[-4.2, 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.4, 0.2, 8.5]} />
        <meshLambertMaterial color="#cccccc" />
      </mesh>

      {/* Debug waypoints (optional - for development) */}
      {process.env.NODE_ENV === 'development' && (
        <>
          {Object.entries(waypoints).map(([laneId, points]) =>
            points.map((point, i) => (
              <mesh key={`waypoint-${laneId}-${i}`} position={point.toArray()}>
                <sphereGeometry args={[0.2]} />
                <meshBasicMaterial 
                  color={laneId.includes('0') ? '#ff0000' : 
                         laneId.includes('1') ? '#00ff00' : 
                         laneId.includes('2') ? '#0000ff' : '#ffff00'} 
                  transparent 
                  opacity={0.5}
                />
              </mesh>
            ))
          )}
        </>
      )}
    </group>
  );
}