import { create } from 'zustand';

interface WeaponStats {
  damage: number;
  fireRate: number; // rounds per second
  reloadTime: number; // seconds
  maxAmmo: number;
  range: number;
  spread: number; // bullet spread in radians
}

const WEAPON_STATS: Record<string, WeaponStats> = {
  pistol: {
    damage: 25,
    fireRate: 3,
    reloadTime: 1.5,
    maxAmmo: 12,
    range: 50,
    spread: 0.02
  },
  rifle: {
    damage: 35,
    fireRate: 8,
    reloadTime: 2.5,
    maxAmmo: 30,
    range: 100,
    spread: 0.01
  },
  shotgun: {
    damage: 15, // per pellet, fires multiple
    fireRate: 1.2,
    reloadTime: 3,
    maxAmmo: 8,
    range: 30,
    spread: 0.15
  }
};

interface WeaponsState {
  currentWeapon: keyof typeof WEAPON_STATS;
  ammo: Record<string, number>;
  isReloading: boolean;
  lastShotTime: number;
  recoil: number;

  // Actions
  switchWeapon: (weapon: keyof typeof WEAPON_STATS) => void;
  shoot: () => boolean;
  reload: () => void;
  canShoot: () => boolean;
  getWeaponStats: (weapon?: keyof typeof WEAPON_STATS) => WeaponStats;
}

export const useWeapons = create<WeaponsState>((set, get) => ({
  currentWeapon: 'pistol',
  ammo: {
    pistol: 12,
    rifle: 30,
    shotgun: 8
  },
  isReloading: false,
  lastShotTime: 0,
  recoil: 0,

  switchWeapon: (weapon) => {
    const { isReloading } = get();
    if (isReloading) return;
    
    set({ currentWeapon: weapon });
  },

  shoot: () => {
    const { currentWeapon, ammo, canShoot } = get();
    
    if (!canShoot()) return false;
    
    const currentAmmo = ammo[currentWeapon];
    if (currentAmmo <= 0) return false;

    // Update ammo and last shot time
    set((state) => ({
      ammo: {
        ...state.ammo,
        [currentWeapon]: currentAmmo - 1
      },
      lastShotTime: Date.now(),
      recoil: 1.0
    }));

    // Reduce recoil over time
    setTimeout(() => {
      set((state) => ({ recoil: Math.max(0, state.recoil - 0.1) }));
    }, 50);

    // Auto-reload if empty
    if (currentAmmo - 1 <= 0) {
      setTimeout(() => {
        get().reload();
      }, 500);
    }

    return true;
  },

  reload: () => {
    const { currentWeapon, isReloading } = get();
    if (isReloading) return;

    const stats = WEAPON_STATS[currentWeapon];
    
    set({ isReloading: true });

    setTimeout(() => {
      set((state) => ({
        ammo: {
          ...state.ammo,
          [currentWeapon]: stats.maxAmmo
        },
        isReloading: false
      }));
    }, stats.reloadTime * 1000);
  },

  canShoot: () => {
    const { currentWeapon, isReloading, lastShotTime, ammo } = get();
    const stats = WEAPON_STATS[currentWeapon];
    const timeSinceLastShot = Date.now() - lastShotTime;
    const minTimeBetweenShots = 1000 / stats.fireRate;

    return !isReloading && 
           ammo[currentWeapon] > 0 && 
           timeSinceLastShot >= minTimeBetweenShots;
  },

  getWeaponStats: (weapon) => {
    const { currentWeapon } = get();
    return WEAPON_STATS[weapon || currentWeapon];
  }
}));

// Handle weapon switching and teleport with keyboard
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (event) => {
    const { switchWeapon } = useWeapons.getState();
    console.log('Weapon handler key pressed:', event.key, event.code);
    
    switch (event.code) {
      case 'Digit1':
        console.log('Switching to pistol');
        switchWeapon('pistol');
        break;
      case 'Digit2':
        console.log('Switching to rifle');
        switchWeapon('rifle');
        break;
      case 'Digit3':
        console.log('Switching to shotgun');
        switchWeapon('shotgun');
        break;
      case 'KeyR':
        console.log('Reloading weapon');
        useWeapons.getState().reload();
        break;
      case 'KeyT':
        console.log('TELEPORT: T key detected in weapon handler - attempting teleport');
        event.preventDefault();
        event.stopPropagation();
        try {
          // Import usePlayer dynamically to avoid circular dependencies
          import('../stores/usePlayer').then(({ usePlayer }) => {
            const { updatePosition } = usePlayer.getState();
            console.log('TELEPORT: Creating position vector');
            const newPosition = new (window as any).THREE.Vector3(68, 0.9, 68);
            console.log('TELEPORT: Position created:', newPosition.toArray ? newPosition.toArray() : [newPosition.x, newPosition.y, newPosition.z]);
            updatePosition(newPosition);
            console.log('TELEPORT: Successfully called updatePosition - player should be at shooting ground!');
          }).catch(error => {
            console.error('TELEPORT: Failed to import usePlayer:', error);
          });
        } catch (error) {
          console.error('TELEPORT: Error during teleportation:', error);
        }
        break;
    }
  });
}
