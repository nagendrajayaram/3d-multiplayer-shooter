import { create } from 'zustand';

export interface InventoryWeapon {
  id: string;
  type: 'pistol' | 'rifle' | 'shotgun';
  name: string;
  owned: boolean;
  equipped: boolean;
}

export interface ShopItem {
  id: string;
  type: 'weapon';
  name: string;
  description: string;
  price: number;
  weaponType: 'pistol' | 'rifle' | 'shotgun';
  damage: number;
  fireRate: number;
  range: number;
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'pistol',
    type: 'weapon',
    name: 'Combat Pistol',
    description: 'Standard sidearm with good accuracy',
    price: 0, // Free starter weapon
    weaponType: 'pistol',
    damage: 25,
    fireRate: 3,
    range: 50
  },
  {
    id: 'rifle',
    type: 'weapon',
    name: 'Assault Rifle',
    description: 'Versatile automatic weapon',
    price: 150,
    weaponType: 'rifle',
    damage: 35,
    fireRate: 8,
    range: 100
  },
  {
    id: 'shotgun',
    type: 'weapon',
    name: 'Combat Shotgun',
    description: 'High damage close-range weapon',
    price: 200,
    weaponType: 'shotgun',
    damage: 15, // per pellet
    fireRate: 1.2,
    range: 30
  }
];

interface InventoryState {
  weapons: InventoryWeapon[];
  equippedWeapon: string;
  
  // Actions
  purchaseWeapon: (weaponId: string) => boolean; // Returns success
  equipWeapon: (weaponId: string) => void;
  getOwnedWeapons: () => InventoryWeapon[];
  isWeaponOwned: (weaponId: string) => boolean;
  initializeInventory: () => void;
}

export const useInventory = create<InventoryState>((set, get) => ({
  weapons: [],
  equippedWeapon: 'pistol',

  purchaseWeapon: (weaponId: string) => {
    const { weapons } = get();
    const weapon = weapons.find(w => w.id === weaponId);
    
    if (weapon && !weapon.owned) {
      set((state) => ({
        weapons: state.weapons.map(w =>
          w.id === weaponId ? { ...w, owned: true } : w
        )
      }));
      return true;
    }
    return false;
  },

  equipWeapon: (weaponId: string) => {
    const { weapons } = get();
    const weapon = weapons.find(w => w.id === weaponId);
    
    if (weapon && weapon.owned) {
      set((state) => ({
        weapons: state.weapons.map(w => ({
          ...w,
          equipped: w.id === weaponId
        })),
        equippedWeapon: weaponId
      }));
    }
  },

  getOwnedWeapons: () => {
    return get().weapons.filter(w => w.owned);
  },

  isWeaponOwned: (weaponId: string) => {
    const weapon = get().weapons.find(w => w.id === weaponId);
    return weapon?.owned || false;
  },

  initializeInventory: () => {
    const weapons: InventoryWeapon[] = SHOP_ITEMS.map(item => ({
      id: item.id,
      type: item.weaponType,
      name: item.name,
      owned: item.id === 'pistol', // Start with pistol
      equipped: item.id === 'pistol'
    }));

    set({ weapons, equippedWeapon: 'pistol' });
  }
}));