import { create } from 'zustand';
import * as THREE from 'three';

interface ParticleEffect {
  id: string;
  type: 'muzzleFlash' | 'bulletImpact' | 'explosion' | 'death';
  position: THREE.Vector3;
  intensity: number;
  timestamp: number;
}

interface EffectsState {
  particles: ParticleEffect[];
  
  // Actions
  addEffect: (type: ParticleEffect['type'], position: THREE.Vector3, intensity?: number) => string;
  removeEffect: (id: string) => void;
  clearOldEffects: () => void;
}

export const useEffects = create<EffectsState>((set, get) => ({
  particles: [],

  addEffect: (type, position, intensity = 1.0) => {
    const id = `${type}_${Date.now()}_${Math.random()}`;
    const effect: ParticleEffect = {
      id,
      type,
      position: position.clone(),
      intensity,
      timestamp: Date.now()
    };

    set((state) => ({
      particles: [...state.particles, effect]
    }));

    return id;
  },

  removeEffect: (id) => {
    set((state) => ({
      particles: state.particles.filter(effect => effect.id !== id)
    }));
  },

  clearOldEffects: () => {
    const now = Date.now();
    set((state) => ({
      particles: state.particles.filter(effect => 
        now - effect.timestamp < 5000 // Keep effects for max 5 seconds
      )
    }));
  }
}));