import { create } from 'zustand';
import * as THREE from 'three';

export interface TargetData {
  id: string;
  position: THREE.Vector3;
  isStanding: boolean;
  rotation: number; // Rotation angle when fallen
  hitTime?: number; // When the target was hit
}

interface TargetsState {
  targets: TargetData[];
  
  // Actions
  initializeTargets: () => void;
  hitTarget: (targetId: string) => void;
  resetTarget: (targetId: string) => void;
  resetAllTargets: () => void;
}

// Generate initial target positions (same as Environment.tsx)
const generateTargetPositions = (): TargetData[] => {
  const targets: TargetData[] = [];
  for (let i = 0; i < 8; i++) {
    targets.push({
      id: `target-${i}`,
      position: new THREE.Vector3(60 + (i % 4) * 8, 1.5, 60 + Math.floor(i / 4) * 10),
      isStanding: true,
      rotation: 0
    });
  }
  return targets;
};

export const useTargets = create<TargetsState>((set, get) => ({
  targets: generateTargetPositions(),

  initializeTargets: () => {
    set({ targets: generateTargetPositions() });
    console.log('Initialized shooting targets');
  },

  hitTarget: (targetId) => {
    set((state) => ({
      targets: state.targets.map(target => 
        target.id === targetId 
          ? { 
              ...target, 
              isStanding: false, 
              rotation: Math.PI / 2, // Fall 90 degrees forward
              hitTime: Date.now()
            }
          : target
      )
    }));
    console.log(`Target ${targetId} was hit and fell down!`);
  },

  resetTarget: (targetId) => {
    set((state) => ({
      targets: state.targets.map(target => 
        target.id === targetId 
          ? { ...target, isStanding: true, rotation: 0, hitTime: undefined }
          : target
      )
    }));
    console.log(`Target ${targetId} reset to standing position`);
  },

  resetAllTargets: () => {
    set((state) => ({
      targets: state.targets.map(target => ({
        ...target,
        isStanding: true,
        rotation: 0,
        hitTime: undefined
      }))
    }));
    console.log('All targets reset to standing position');
  }
}));