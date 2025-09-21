import { create } from 'zustand';

export type CameraView = 'first-person' | 'second-person' | 'third-person';

interface CameraState {
  currentView: CameraView;
  
  // Actions
  switchToNextView: () => void;
  setView: (view: CameraView) => void;
}

const viewOrder: CameraView[] = ['first-person', 'second-person', 'third-person'];

export const useCamera = create<CameraState>((set, get) => ({
  currentView: 'first-person',

  switchToNextView: () => {
    const { currentView } = get();
    const currentIndex = viewOrder.indexOf(currentView);
    const nextIndex = (currentIndex + 1) % viewOrder.length;
    const nextView = viewOrder[nextIndex];
    
    console.log(`Switching camera from ${currentView} to ${nextView}`);
    set({ currentView: nextView });
  },

  setView: (view) => {
    set({ currentView: view });
    console.log(`Camera view set to ${view}`);
  }
}));