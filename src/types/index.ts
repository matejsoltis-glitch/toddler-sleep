export type Language = 'sk' | 'cs' | 'en' | 'pl' | 'hu' | 'uk' | 'it';

export type AppMode = 'menu' | 'light' | 'white-noise' | 'nature';

export type WhiteNoiseLevel = 'gentle' | 'balanced' | 'deep';

export type NatureSoundType = 'forest' | 'rain' | 'ocean' | 'night-birds' | 'heartbeat';

export interface LightPalette {
  id: string;
  name: string;
  description: string;
  colors: string[]; // CSS color values for soft transitions
  mood: string;
}

export type LightSpeed = 'very-slow' | 'slow' | 'medium' | 'breathing';

export interface TimerConfig {
  durationMinutes: number; // 0 for unlimited
  remainingSeconds: number;
  isRunning: boolean;
  fadeMinutes: number; // e.g. 5, 10, 15 minutes gradual fade-out
  isFadeEnabled: boolean;
}

export interface NightModeState {
  isAutoSunset: boolean;
  isAfterSunset: boolean;
  forceDark: boolean;
  redFilter: boolean;
  screenDimPercent: number; // 0 to 80% extra dimming overlay
}
