import { create } from 'zustand';

interface Kill {
  timestamp: number;
  victim: string;
}

interface EconomyState {
  money: number;
  recentKills: Kill[];
  totalKills: number;
  
  // Actions
  addKill: (victim: string) => number; // Returns money earned
  getMoney: () => number;
  spendMoney: (amount: number) => boolean; // Returns if transaction was successful
  resetMoney: () => void;
}

// Double kill timeframe (in milliseconds)
const DOUBLE_KILL_WINDOW = 3000; // 3 seconds

export const useEconomy = create<EconomyState>((set, get) => ({
  money: 100, // Starting money
  recentKills: [],
  totalKills: 0,

  addKill: (victim: string) => {
    const now = Date.now();
    const currentKill: Kill = { timestamp: now, victim };
    
    // Get recent kills within the double kill window
    const { recentKills } = get();
    const validRecentKills = recentKills.filter(
      kill => now - kill.timestamp <= DOUBLE_KILL_WINDOW
    );
    
    let moneyEarned = 10; // Base money for a kill
    
    // Check if this is a double kill (2 kills within timeframe)
    if (validRecentKills.length >= 1) {
      moneyEarned = 20; // Double kill bonus
      console.log(`Double kill! Earned $${moneyEarned}`);
    } else {
      console.log(`Kill! Earned $${moneyEarned}`);
    }
    
    // Update state
    set((state) => ({
      money: state.money + moneyEarned,
      recentKills: [...validRecentKills, currentKill],
      totalKills: state.totalKills + 1
    }));
    
    return moneyEarned;
  },

  getMoney: () => {
    return get().money;
  },

  spendMoney: (amount) => {
    const { money } = get();
    if (money >= amount) {
      set((state) => ({
        money: state.money - amount
      }));
      return true;
    }
    return false;
  },

  resetMoney: () => {
    set({
      money: 100,
      recentKills: [],
      totalKills: 0
    });
  }
}));