import { create } from 'zustand';
import * as THREE from 'three';

export interface PowerUpData {
  id: string;
  type: 'health' | 'ammo' | 'weapon' | 'armor';
  position: THREE.Vector3;
  value: number; // Amount of health/ammo/etc
  weaponType?: string; // For weapon power-ups
  spawnTime: number;
}

interface PowerUpsState {
  powerUps: PowerUpData[];
  lastCollectionTime: number;
  
  // Actions
  addPowerUp: (type: PowerUpData['type'], position: THREE.Vector3, value: number, weaponType?: string) => void;
  removePowerUp: (id: string) => void;
  collectPowerUp: (id: string) => PowerUpData | null;
  spawnRandomPowerUps: (count: number) => void;
  clearPowerUps: () => void;
}

// Predefined spawn locations across the map
const SPAWN_LOCATIONS = [
  // Central city intersections
  new THREE.Vector3(0, 1, 0),
  new THREE.Vector3(12, 1, 12),
  new THREE.Vector3(-12, 1, 12),
  new THREE.Vector3(12, 1, -12),
  new THREE.Vector3(-12, 1, -12),
  
  // Building rooftops (elevated positions)
  new THREE.Vector3(8, 6, 15),
  new THREE.Vector3(-8, 6, 15),
  new THREE.Vector3(15, 6, 8),
  new THREE.Vector3(-15, 6, 8),
  new THREE.Vector3(20, 6, -10),
  new THREE.Vector3(-20, 6, -10),
  
  // Street corners and alleyways
  new THREE.Vector3(25, 1, 5),
  new THREE.Vector3(-25, 1, 5),
  new THREE.Vector3(5, 1, 25),
  new THREE.Vector3(5, 1, -25),
  new THREE.Vector3(-5, 1, -25),
  
  // Near vehicle spawn areas
  new THREE.Vector3(18, 1, 3),
  new THREE.Vector3(-18, 1, 3),
  new THREE.Vector3(3, 1, 18),
  new THREE.Vector3(3, 1, -18),
  
  // City outskirts
  new THREE.Vector3(30, 1, 15),
  new THREE.Vector3(-30, 1, 15),
  new THREE.Vector3(15, 1, 30),
  new THREE.Vector3(15, 1, -30),
  new THREE.Vector3(-15, 1, 30),
  new THREE.Vector3(-15, 1, -30),
  
  // Elevated platforms and bridges
  new THREE.Vector3(10, 4, 20),
  new THREE.Vector3(-10, 4, 20),
  new THREE.Vector3(20, 4, 10),
  new THREE.Vector3(-20, 4, 10),
  
  // Hidden spots in buildings
  new THREE.Vector3(22, 2, 8),
  new THREE.Vector3(-22, 2, 8),
  new THREE.Vector3(8, 2, 22),
  new THREE.Vector3(8, 2, -22),
  
  // Plaza and open areas
  new THREE.Vector3(35, 1, 0),
  new THREE.Vector3(-35, 1, 0),
  new THREE.Vector3(0, 1, 35),
  new THREE.Vector3(0, 1, -35),
  
  // Underground tunnel entrances
  new THREE.Vector3(28, 1, 28),
  new THREE.Vector3(-28, 1, 28),
  new THREE.Vector3(28, 1, -28),
  new THREE.Vector3(-28, 1, -28),
  
  // Industrial district
  new THREE.Vector3(40, 1, 20),
  new THREE.Vector3(-40, 1, 20),
  new THREE.Vector3(20, 1, 40),
  new THREE.Vector3(20, 1, -40),
  
  // Shooting ground area
  new THREE.Vector3(68, 2, 68),
  new THREE.Vector3(65, 2, 70),
  new THREE.Vector3(70, 2, 65),
  
  // Highway overpasses
  new THREE.Vector3(45, 5, 0),
  new THREE.Vector3(-45, 5, 0),
  new THREE.Vector3(0, 5, 45),
  new THREE.Vector3(0, 5, -45)
];

export const usePowerUps = create<PowerUpsState>((set, get) => ({
  powerUps: [],
  lastCollectionTime: 0,

  addPowerUp: (type, position, value, weaponType) => {
    const powerUp: PowerUpData = {
      id: `${type}_${Date.now()}_${Math.random()}`,
      type,
      position: position.clone(),
      value,
      weaponType,
      spawnTime: Date.now()
    };

    set((state) => ({
      powerUps: [...state.powerUps, powerUp]
    }));
  },

  removePowerUp: (id) => {
    set((state) => ({
      powerUps: state.powerUps.filter(powerUp => powerUp.id !== id)
    }));
  },

  collectPowerUp: (id) => {
    const state = get();
    const powerUp = state.powerUps.find(p => p.id === id);
    
    if (powerUp) {
      set((state) => ({
        powerUps: state.powerUps.filter(p => p.id !== id),
        lastCollectionTime: Date.now()
      }));
      return powerUp;
    }
    
    return null;
  },

  spawnRandomPowerUps: (count) => {
    const { addPowerUp } = get();
    const availableLocations = [...SPAWN_LOCATIONS];
    
    for (let i = 0; i < count && availableLocations.length > 0; i++) {
      // Random spawn location
      const locationIndex = Math.floor(Math.random() * availableLocations.length);
      const position = availableLocations.splice(locationIndex, 1)[0];
      
      // Random power-up type with weighted distribution
      const rand = Math.random();
      let type: PowerUpData['type'];
      let value: number;
      let weaponType: string | undefined;
      
      if (rand < 0.4) {
        // 40% chance for health
        type = 'health';
        value = 25 + Math.floor(Math.random() * 26); // 25-50 health
      } else if (rand < 0.7) {
        // 30% chance for ammo
        type = 'ammo';
        value = 30 + Math.floor(Math.random() * 21); // 30-50 ammo
      } else if (rand < 0.9) {
        // 20% chance for armor
        type = 'armor';
        value = 20 + Math.floor(Math.random() * 31); // 20-50 armor
      } else {
        // 10% chance for weapon
        type = 'weapon';
        value = 1;
        const weapons = ['rifle', 'shotgun', 'pistol'];
        weaponType = weapons[Math.floor(Math.random() * weapons.length)];
      }
      
      addPowerUp(type, position, value, weaponType);
    }
  },

  clearPowerUps: () => {
    set({ powerUps: [] });
  }
}));