import { create } from 'zustand';
import * as THREE from 'three';
import { useWeapons } from './useWeapons';

interface PlayerState {
  position: THREE.Vector3;
  health: number;
  armor: number;
  score: number;
  skin: string;
  isAlive: boolean;
  inVehicle: boolean;
  vehicleId: string | null;

  // Actions
  updatePosition: (position: THREE.Vector3) => void;
  takeDamage: (damage: number) => void;
  heal: (amount: number) => void;
  addArmor: (amount: number) => void;
  addScore: (points: number) => void;
  setSkin: (skinId: string) => void;
  respawn: () => void;
  collectPowerUp: (type: string, value: number, weaponType?: string) => void;
  enterVehicle: (vehicleId: string) => void;
  exitVehicle: () => void;
}

export const usePlayer = create<PlayerState>((set, get) => ({
  position: new THREE.Vector3(0, 0.9, 0),
  health: 100,
  armor: 0,
  score: 0,
  skin: 'blue',
  isAlive: true,
  inVehicle: false,
  vehicleId: null,

  updatePosition: (position) => {
    set({ position: position.clone() });
  },

  takeDamage: (damage) => {
    set((state) => {
      // Armor absorbs some damage
      let actualDamage = damage;
      let newArmor = state.armor;
      
      if (state.armor > 0) {
        const armorAbsorption = Math.min(state.armor, damage * 0.5); // Armor blocks 50% of damage
        actualDamage = damage - armorAbsorption;
        newArmor = Math.max(0, state.armor - armorAbsorption * 2); // Armor degrades
      }

      const newHealth = Math.max(0, state.health - actualDamage);
      return {
        health: newHealth,
        armor: newArmor,
        isAlive: newHealth > 0
      };
    });
  },

  heal: (amount) => {
    set((state) => ({
      health: Math.min(100, state.health + amount)
    }));
  },

  addArmor: (amount) => {
    set((state) => ({
      armor: Math.min(100, state.armor + amount)
    }));
  },

  addScore: (points) => {
    set((state) => ({
      score: state.score + points
    }));
  },

  setSkin: (skinId) => {
    set({ skin: skinId });
  },

  respawn: () => {
    // Find a random spawn point
    const spawnPoints = [
      new THREE.Vector3(10, 0.9, 10),
      new THREE.Vector3(-10, 0.9, 10),
      new THREE.Vector3(10, 0.9, -10),
      new THREE.Vector3(-10, 0.9, -10),
      new THREE.Vector3(0, 0.9, 15),
      new THREE.Vector3(0, 0.9, -15)
    ];
    
    const randomSpawn = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
    
    set({
      position: randomSpawn,
      health: 100,
      armor: 0,
      isAlive: true,
      inVehicle: false,
      vehicleId: null
    });
  },

  collectPowerUp: (type, value, weaponType) => {
    const { heal, addArmor, addScore } = get();
    
    switch (type) {
      case 'health':
        heal(value);
        console.log(`Collected health pack: +${value} health`);
        break;
      case 'armor':
        addArmor(value);
        console.log(`Collected armor: +${value} armor`);
        break;
      case 'ammo':
        // Add ammo to weapons store
        // Note: This will need to be implemented when ammo system is added
        // const weaponsStore = useWeapons.getState();
        // weaponsStore.addAmmo(value);
        console.log(`Collected ammo: +${value} ammo`);
        break;
      case 'weapon':
        if (weaponType) {
          // Unlock/switch to weapon
          // Note: This will need to be implemented when weapon switching is added
          // const weaponsStore = useWeapons.getState();
          // weaponsStore.switchWeapon(weaponType);
          console.log(`Collected weapon: ${weaponType}`);
        }
        break;
    }
    
    // Award points for collection
    addScore(10);
  },

  enterVehicle: (vehicleId) => {
    console.log(`Entering vehicle: ${vehicleId}`);
    set({ inVehicle: true, vehicleId });
  },

  exitVehicle: () => {
    console.log('Exiting vehicle');
    set({ inVehicle: false, vehicleId: null });
  }
}));
