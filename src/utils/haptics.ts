/**
 * Short and gentle haptic feedback (vibration) for tactile confirmation on touch.
 * Gracefully handled when the Vibration API is not supported or restricted.
 * Can be enabled or disabled via user settings.
 */

const STORAGE_KEY = 'toddler_haptics_enabled';

let hapticsEnabled = true;

try {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      hapticsEnabled = saved === 'true';
    }
  }
} catch {
  // Gracefully fallback to enabled
}

export function isHapticsEnabled(): boolean {
  return hapticsEnabled;
}

export function setHapticsEnabled(enabled: boolean): void {
  hapticsEnabled = enabled;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, String(enabled));
    }
  } catch {
    // Ignore storage errors
  }
}

export function triggerHaptic(duration = 10): void {
  if (!hapticsEnabled) return;
  try {
    if (
      typeof window !== 'undefined' &&
      'vibrate' in navigator &&
      typeof navigator.vibrate === 'function'
    ) {
      navigator.vibrate(duration);
    }
  } catch {
    // Graceful no-op on platforms without vibration support
  }
}
