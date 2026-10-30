/**
 * Multi-platform haptic feedback engine for mobile phones (Android & iOS).
 * - Android: Uses navigator.vibrate() with calibrated durations (35ms - 60ms)
 *   that overcome physical ERM motor inertia so it is genuinely felt.
 * - iOS Safari: Uses zero-latency Web Audio physical acoustic thump (65Hz transient)
 *   which actuates the iPhone bottom speaker/transducer against fingertips.
 * - Auto-resumes WebAudio on first user gesture (pointerdown/touchstart).
 * - Respects the user's toggle setting in SettingsModal.
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
  // Graceful fallback
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

// Shared lightweight AudioContext for tactile physical feedback
let hapticAudioCtx: AudioContext | null = null;

function getHapticAudioContext(): AudioContext | null {
  try {
    if (!hapticAudioCtx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        hapticAudioCtx = new AudioCtx();
      }
    }
    if (hapticAudioCtx && hapticAudioCtx.state === 'suspended') {
      hapticAudioCtx.resume().catch(() => {});
    }
    return hapticAudioCtx;
  } catch {
    return null;
  }
}

// Ensure AudioContext is primed on first physical touch on mobile
if (typeof window !== 'undefined') {
  const primeAudio = () => {
    getHapticAudioContext();
    window.removeEventListener('pointerdown', primeAudio);
    window.removeEventListener('touchstart', primeAudio);
  };
  window.addEventListener('pointerdown', primeAudio, { passive: true, once: true });
  window.addEventListener('touchstart', primeAudio, { passive: true, once: true });
}

/**
 * Produces an ultra-short tactile physical transient impulse on mobile speaker (essential for iOS Safari).
 */
function playTactileAudioPulse(strength = 1): void {
  try {
    const ctx = getHapticAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // 60Hz sub-bass transient produces physical mechanical transducer excursion felt by fingers
    osc.type = 'sine';
    osc.frequency.setValueAtTime(65, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.025);

    const peakGain = Math.min(0.25, 0.12 * strength);
    gain.gain.setValueAtTime(peakGain, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.03);
  } catch {
    // Graceful no-op
  }
}

/**
 * Cross-platform haptic trigger.
 * @param duration Duration in ms or intensity level ('light' | 'medium' | 'heavy' | number)
 */
export function triggerHaptic(duration: number | 'light' | 'medium' | 'heavy' = 'medium'): void {
  if (!hapticsEnabled) return;

  // Calibrate duration: Standard Android ERM vibration motors need at least 35-50ms to physically spin
  let androidMs = 40;
  let pulseStrength = 1.0;

  if (typeof duration === 'number') {
    // If passed a small number like 10 or 12, scale it up to an effective 35-45ms
    androidMs = duration < 25 ? Math.max(30, duration * 3) : duration;
    pulseStrength = Math.min(1.8, Math.max(0.6, duration / 15));
  } else if (duration === 'light') {
    androidMs = 30;
    pulseStrength = 0.8;
  } else if (duration === 'heavy') {
    androidMs = 70;
    pulseStrength = 1.6;
  } else {
    // medium
    androidMs = 45;
    pulseStrength = 1.1;
  }

  // 1. Android Vibration API
  let vibrated = false;
  try {
    if (
      typeof window !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      'vibrate' in navigator &&
      typeof navigator.vibrate === 'function'
    ) {
      // Support both array and scalar forms for maximum Android device compatibility
      vibrated = navigator.vibrate([androidMs]);
      if (!vibrated) {
        vibrated = navigator.vibrate(androidMs);
      }
    }
  } catch {
    vibrated = false;
  }

  // 2. iOS Safari & fallback:
  // On iOS Safari, navigator.vibrate is undefined, so playTactileAudioPulse provides the physical tactile bump.
  // We also trigger it if vibrated is false.
  if (!vibrated) {
    playTactileAudioPulse(pulseStrength);
  }
}
