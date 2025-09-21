import { create } from "zustand";

interface AudioState {
  backgroundMusic: HTMLAudioElement | null;
  hitSound: HTMLAudioElement | null;
  successSound: HTMLAudioElement | null;
  isMuted: boolean;
  audioContext: AudioContext | null;
  
  // Setter functions
  setBackgroundMusic: (music: HTMLAudioElement) => void;
  setHitSound: (sound: HTMLAudioElement) => void;
  setSuccessSound: (sound: HTMLAudioElement) => void;
  
  // Control functions
  toggleMute: () => void;
  playHit: () => void;
  playSuccess: () => void;
  playShoot: (weaponType?: string) => Promise<void>;
}

export const useAudio = create<AudioState>((set, get) => ({
  backgroundMusic: null,
  hitSound: null,
  successSound: null,
  isMuted: false, // Start unmuted for testing
  audioContext: null,
  
  setBackgroundMusic: (music) => set({ backgroundMusic: music }),
  setHitSound: (sound) => set({ hitSound: sound }),
  setSuccessSound: (sound) => set({ successSound: sound }),
  
  toggleMute: () => {
    const { isMuted } = get();
    const newMutedState = !isMuted;
    
    // Just update the muted state
    set({ isMuted: newMutedState });
    
    // Log the change
    console.log(`Sound ${newMutedState ? 'muted' : 'unmuted'}`);
  },
  
  playHit: () => {
    const { hitSound, isMuted } = get();
    if (hitSound) {
      // If sound is muted, don't play anything
      if (isMuted) {
        console.log("Hit sound skipped (muted)");
        return;
      }
      
      // Clone the sound to allow overlapping playback
      const soundClone = hitSound.cloneNode() as HTMLAudioElement;
      soundClone.volume = 0.3;
      soundClone.play().catch(error => {
        console.log("Hit sound play prevented:", error);
      });
    }
  },
  
  playSuccess: () => {
    const { successSound, isMuted } = get();
    if (successSound) {
      // If sound is muted, don't play anything
      if (isMuted) {
        console.log("Success sound skipped (muted)");
        return;
      }
      
      successSound.currentTime = 0;
      successSound.play().catch(error => {
        console.log("Success sound play prevented:", error);
      });
    }
  },

  playShoot: async (weaponType?: string) => {
    const { isMuted } = get();
    if (isMuted) {
      console.log("Shoot sound skipped (muted)");
      return;
    }
    
    console.log(`Playing ${weaponType || 'default'} gunshot sound`);
    
    // Create realistic gunshot sound using Web Audio API
    try {
      let { audioContext } = get();
      
      // Create shared AudioContext if needed
      if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        set({ audioContext });
      }
      
      // Resume context if suspended (required by browsers)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      const now = audioContext.currentTime;
      
      // Main gunshot crack with sharp attack
      const crack = audioContext.createOscillator();
      const crackGain = audioContext.createGain();
      const crackFilter = audioContext.createBiquadFilter();
      
      crack.connect(crackFilter);
      crackFilter.connect(crackGain);
      crackGain.connect(audioContext.destination);
      
      // Weapon-specific sound characteristics
      let startFreq = 2200, endFreq = 80, volume = 0.25, duration = 0.18;
      
      switch (weaponType) {
        case 'pistol':
          startFreq = 1800; endFreq = 120; volume = 0.18; duration = 0.12;
          break;
        case 'rifle':
          startFreq = 2400; endFreq = 60; volume = 0.28; duration = 0.22;
          break;
        case 'shotgun':
          startFreq = 1400; endFreq = 40; volume = 0.32; duration = 0.25;
          break;
      }
      
      crack.frequency.setValueAtTime(startFreq, now);
      crack.frequency.exponentialRampToValueAtTime(endFreq, now + 0.06);
      crack.type = 'sawtooth';
      
      crackFilter.type = 'highpass';
      crackFilter.frequency.setValueAtTime(900, now);
      
      crackGain.gain.setValueAtTime(volume, now);
      crackGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      
      // Noise burst for texture
      const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.25, audioContext.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseData.length; i++) {
        noiseData[i] = (Math.random() * 2 - 1) * 0.08;
      }
      
      const noiseSource = audioContext.createBufferSource();
      const noiseGain = audioContext.createGain();
      const noiseFilter = audioContext.createBiquadFilter();
      
      noiseSource.buffer = noiseBuffer;
      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(audioContext.destination);
      
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(1800, now);
      noiseFilter.Q.setValueAtTime(2, now);
      
      noiseGain.gain.setValueAtTime(0.18, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      
      // Low thump for body
      const thump = audioContext.createOscillator();
      const thumpGain = audioContext.createGain();
      
      thump.connect(thumpGain);
      thumpGain.connect(audioContext.destination);
      
      thump.frequency.setValueAtTime(55, now);
      thump.type = 'sine';
      
      thumpGain.gain.setValueAtTime(0.12, now);
      thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      
      // Start all sound components
      crack.start(now);
      crack.stop(now + 0.18);
      
      noiseSource.start(now);
      noiseSource.stop(now + 0.25);
      
      thump.start(now);
      thump.stop(now + 0.09);
      
    } catch (error) {
      console.log('Enhanced gunshot sound failed, falling back to hit sound:', error);
      
      // Fallback to modified hit sound if Web Audio fails
      const { hitSound } = get();
      if (hitSound) {
        try {
          const soundClone = hitSound.cloneNode() as HTMLAudioElement;
          soundClone.volume = 0.4;
          soundClone.playbackRate = weaponType === 'shotgun' ? 1.2 : weaponType === 'rifle' ? 1.6 : 1.4;
          soundClone.play().catch(playError => {
            console.log('Fallback gunshot sound play prevented:', playError);
          });
        } catch (fallbackError) {
          console.log('All gunshot audio generation failed:', fallbackError);
        }
      }
    }
  }
}));
