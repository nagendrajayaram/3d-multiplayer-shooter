import * as THREE from 'three';
import { AABB, createAABB } from './collision';

export interface BuildingData {
  position: [number, number, number];
  height: number;
  width: number;
  depth: number;
  color: string;
  roofColor?: string;
  roofHeight?: number;
  windowData?: Array<{
    windowColor: string;
    isEmissive: boolean;
  }>;
}

// Deterministic random using seed
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }
}

// Shared color palette
const COLORS = [
  '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7',
  '#dda0dd', '#98d8c8', '#f7dc6f', '#bb8fce', '#85c1e9',
  '#f8c471', '#82e0aa', '#f1948a', '#85c1e9', '#d7bde2'
];

export function generateEnvironmentData() {
  const skyscraperRng = new SeededRandom(12345); // Fixed seed for consistent generation
  const houseRng = new SeededRandom(67890);

  // Generate skyscrapers with deterministic positions
  const skyscrapers: BuildingData[] = [];
  const spacing = 25;
  
  for (let x = -4; x <= 4; x++) {
    for (let z = -4; z <= 4; z++) {
      if (Math.abs(x) <= 1 && Math.abs(z) <= 1) continue; // Leave center clear
      
      const height = 15 + skyscraperRng.next() * 25;
      const floors = Math.floor(height / 3);
      const windowData = [];
      
      // Pre-calculate window colors and lighting
      for (let floor = 0; floor < floors; floor++) {
        windowData.push({
          windowColor: skyscraperRng.next() > 0.5 ? "#ffff00" : "#87ceeb",
          isEmissive: skyscraperRng.next() > 0.7
        });
      }
      
      skyscrapers.push({
        position: [x * spacing, 0, z * spacing] as [number, number, number],
        height: height,
        width: 4 + skyscraperRng.next() * 6,
        depth: 4 + skyscraperRng.next() * 6,
        color: COLORS[Math.floor(skyscraperRng.next() * COLORS.length)],
        roofColor: COLORS[Math.floor(skyscraperRng.next() * COLORS.length)],
        windowData: windowData
      });
    }
  }

  // Generate houses with deterministic positions
  const houses: BuildingData[] = [];
  
  for (let i = 0; i < 30; i++) {
    let x, z;
    let attempts = 0;
    
    // Keep trying until we find a spot not on the main roads
    do {
      x = (houseRng.next() - 0.5) * 150;
      z = (houseRng.next() - 0.5) * 150;
      attempts++;
    } while (attempts < 10 && (
      // Avoid North-South road (x between -6 and 6)
      (Math.abs(x) < 8) ||
      // Avoid East-West road (z between -6 and 6)  
      (Math.abs(z) < 8)
    ));
    
    houses.push({
      position: [x, 0, z] as [number, number, number],
      height: 3 + houseRng.next() * 4,
      width: 3 + houseRng.next() * 3,
      depth: 3 + houseRng.next() * 3,
      color: COLORS[Math.floor(houseRng.next() * COLORS.length)],
      roofHeight: 1.5,
      roofColor: COLORS[Math.floor(houseRng.next() * COLORS.length)]
    });
  }

  return { skyscrapers, houses };
}

// Convert building data to collision AABBs
export function generateCollisionAABBs(): AABB[] {
  const { skyscrapers, houses } = generateEnvironmentData();
  const obstacles: AABB[] = [];

  // Add skyscraper collisions
  skyscrapers.forEach(building => {
    const position = new THREE.Vector3(...building.position);
    const size = new THREE.Vector3(building.width, building.height, building.depth);
    // Center the AABB properly at building center
    const centerPosition = position.clone().add(new THREE.Vector3(0, building.height / 2, 0));
    obstacles.push(createAABB(centerPosition, size));
  });

  // Add house collisions
  houses.forEach(building => {
    const position = new THREE.Vector3(...building.position);
    const size = new THREE.Vector3(building.width, building.height, building.depth);
    // Center the AABB properly at building center
    const centerPosition = position.clone().add(new THREE.Vector3(0, building.height / 2, 0));
    obstacles.push(createAABB(centerPosition, size));
  });

  return obstacles;
}