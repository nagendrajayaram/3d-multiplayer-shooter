import { create } from 'zustand';
import * as THREE from 'three';

export interface Vehicle {
  id: string;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  speed: number;
  isPlayerControlled: boolean;
  type: 'car' | 'truck';
  color: string;
  maxSpeed: number;
  steerAngle: number;
  currentLane: number;
  waypointIndex: number;
}

export interface TrafficSignal {
  id: string;
  position: THREE.Vector3;
  state: 'red' | 'yellow' | 'green';
  direction: 'ns' | 'ew'; // North-South or East-West
}

interface VehiclesState {
  vehicles: Vehicle[];
  signals: TrafficSignal[];
  signalPhase: 'ns-green' | 'ns-yellow' | 'ns-red' | 'ew-green' | 'ew-yellow' | 'ew-red';
  phaseTimer: number;
  waypoints: {
    lane0: THREE.Vector3[];
    lane1: THREE.Vector3[];
    lane2: THREE.Vector3[];
    lane3: THREE.Vector3[];
  };

  // Actions
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => string;
  removeVehicle: (id: string) => void;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void;
  getVehicle: (id: string) => Vehicle | undefined;
  updateSignalPhase: (deltaMs: number) => void;
  initializeTrafficSignals: () => void;
  spawnNPCVehicles: (count: number) => void;
}

const PHASE_TIMINGS = {
  'ns-green': 8000, // 8 seconds
  'ns-yellow': 2000, // 2 seconds 
  'ns-red': 1000, // 1 second all-red
  'ew-green': 8000, // 8 seconds
  'ew-yellow': 2000, // 2 seconds
  'ew-red': 1000 // 1 second all-red
};

const VEHICLE_COLORS = ['#ff4757', '#3742fa', '#2ed573', '#ffa726', '#ab47bc', '#26c6da'];

export const useVehicles = create<VehiclesState>((set, get) => ({
  vehicles: [],
  signals: [],
  signalPhase: 'ns-green',
  phaseTimer: 0,
  waypoints: {
    // Lane 0: North to South (left lane)
    lane0: [
      new THREE.Vector3(-2, 0.5, 30),
      new THREE.Vector3(-2, 0.5, 15),
      new THREE.Vector3(-2, 0.5, 5),
      new THREE.Vector3(-2, 0.5, -5),
      new THREE.Vector3(-2, 0.5, -15),
      new THREE.Vector3(-2, 0.5, -30)
    ],
    // Lane 1: South to North (right lane)
    lane1: [
      new THREE.Vector3(2, 0.5, -30),
      new THREE.Vector3(2, 0.5, -15),
      new THREE.Vector3(2, 0.5, -5),
      new THREE.Vector3(2, 0.5, 5),
      new THREE.Vector3(2, 0.5, 15),
      new THREE.Vector3(2, 0.5, 30)
    ],
    // Lane 2: West to East (bottom lane)
    lane2: [
      new THREE.Vector3(-30, 0.5, -2),
      new THREE.Vector3(-15, 0.5, -2),
      new THREE.Vector3(-5, 0.5, -2),
      new THREE.Vector3(5, 0.5, -2),
      new THREE.Vector3(15, 0.5, -2),
      new THREE.Vector3(30, 0.5, -2)
    ],
    // Lane 3: East to West (top lane)  
    lane3: [
      new THREE.Vector3(30, 0.5, 2),
      new THREE.Vector3(15, 0.5, 2),
      new THREE.Vector3(5, 0.5, 2),
      new THREE.Vector3(-5, 0.5, 2),
      new THREE.Vector3(-15, 0.5, 2),
      new THREE.Vector3(-30, 0.5, 2)
    ]
  },

  addVehicle: (vehicle) => {
    const id = `vehicle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newVehicle: Vehicle = { ...vehicle, id };
    
    set((state) => ({
      vehicles: [...state.vehicles, newVehicle]
    }));
    
    console.log(`Vehicle ${id} added at position:`, vehicle.position.toArray());
    return id;
  },

  removeVehicle: (id) => {
    set((state) => ({
      vehicles: state.vehicles.filter(v => v.id !== id)
    }));
    console.log(`Vehicle ${id} removed`);
  },

  updateVehicle: (id, updates) => {
    set((state) => ({
      vehicles: state.vehicles.map(v => 
        v.id === id ? { ...v, ...updates } : v
      )
    }));
  },

  getVehicle: (id) => {
    return get().vehicles.find(v => v.id === id);
  },

  updateSignalPhase: (deltaMs: number) => {
    const { signalPhase, phaseTimer } = get();
    const newTimer = phaseTimer + deltaMs * 1000; // Convert to milliseconds
    const currentTiming = PHASE_TIMINGS[signalPhase];
    
    if (newTimer >= currentTiming) {
      let nextPhase: typeof signalPhase;
      
      switch (signalPhase) {
        case 'ns-green': nextPhase = 'ns-yellow'; break;
        case 'ns-yellow': nextPhase = 'ns-red'; break;
        case 'ns-red': nextPhase = 'ew-green'; break;
        case 'ew-green': nextPhase = 'ew-yellow'; break;
        case 'ew-yellow': nextPhase = 'ew-red'; break;
        case 'ew-red': nextPhase = 'ns-green'; break;
        default: nextPhase = 'ns-green';
      }
      
      // Update signal states
      const updatedSignals = get().signals.map(signal => ({
        ...signal,
        state: getSignalState(nextPhase, signal.direction)
      }));
      
      set({ 
        signalPhase: nextPhase, 
        phaseTimer: 0,
        signals: updatedSignals
      });
      
      console.log(`Traffic signal phase changed to: ${nextPhase}`);
    } else {
      set({ phaseTimer: newTimer });
    }
  },

  initializeTrafficSignals: () => {
    const signals: TrafficSignal[] = [
      {
        id: 'signal_ns_north',
        position: new THREE.Vector3(10, 4, 15),
        state: 'green',
        direction: 'ns'
      },
      {
        id: 'signal_ns_south', 
        position: new THREE.Vector3(10, 4, -15),
        state: 'green',
        direction: 'ns'
      },
      {
        id: 'signal_ew_east',
        position: new THREE.Vector3(25, 4, 0),
        state: 'red',
        direction: 'ew'
      },
      {
        id: 'signal_ew_west',
        position: new THREE.Vector3(-5, 4, 0),
        state: 'red',
        direction: 'ew'
      }
    ];
    
    set({ signals });
    console.log('Traffic signals initialized');
  },

  spawnNPCVehicles: (count) => {
    const { addVehicle } = get();
    const spawnPoints = [
      { position: new THREE.Vector3(-2, 0.5, 30), rotation: new THREE.Euler(0, 0, 0), lane: 0 },
      { position: new THREE.Vector3(2, 0.5, -30), rotation: new THREE.Euler(0, Math.PI, 0), lane: 1 },
      { position: new THREE.Vector3(30, 0.5, 2), rotation: new THREE.Euler(0, -Math.PI/2, 0), lane: 2 },
      { position: new THREE.Vector3(-30, 0.5, -2), rotation: new THREE.Euler(0, Math.PI/2, 0), lane: 3 }
    ];
    
    for (let i = 0; i < count; i++) {
      const spawnPoint = spawnPoints[i % spawnPoints.length];
      const vehicleType = Math.random() > 0.7 ? 'truck' : 'car';
      const maxSpeed = vehicleType === 'truck' ? 8 : 12;
      
      addVehicle({
        position: spawnPoint.position.clone(),
        rotation: spawnPoint.rotation.clone(),
        speed: 3 + Math.random() * 2, // Give NPCs initial speed (3-5 units/sec)
        isPlayerControlled: false,
        type: vehicleType,
        color: VEHICLE_COLORS[Math.floor(Math.random() * VEHICLE_COLORS.length)],
        maxSpeed,
        steerAngle: 0,
        currentLane: spawnPoint.lane,
        waypointIndex: 0
      });
    }
    
    console.log(`Spawned ${count} NPC vehicles`);
  }
}));

// Helper function to determine signal state based on phase and direction
function getSignalState(phase: string, direction: 'ns' | 'ew'): 'red' | 'yellow' | 'green' {
  if (phase.startsWith('ns-')) {
    return direction === 'ns' ? phase.split('-')[1] as any : 'red';
  } else {
    return direction === 'ew' ? phase.split('-')[1] as any : 'red';
  }
}