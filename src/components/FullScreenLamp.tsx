import React, { useState, useEffect, useRef } from 'react';
import { Minimize2, Lock, Unlock, Volume2 } from 'lucide-react';
import { LightPalette, LightSpeed, Language } from '../types';
import { translations } from '../i18n/translations';
import { BatteryIndicator } from './BatteryIndicator';
import { triggerHaptic } from '../utils/haptics';

interface FullScreenLampProps {
  language: Language;
  palette: LightPalette;
  speed: LightSpeed;
  brightness: number;
  onClose: () => void;
  redFilter: boolean;
  timerRemaining: number | null;
  isSoundPlaying: boolean;
}

export const FullScreenLamp: React.FC<FullScreenLampProps> = ({
  language,
  palette,
  speed,
  brightness,
  onClose,
  redFilter,
  timerRemaining,
  isSoundPlaying,
}) => {
  const [colorIndex, setColorIndex] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockBadgeVisible, setLockBadgeVisible] = useState(false);
  const [unlockProgress, setUnlockProgress] = useState(0); // 0 to 100%
  const [touchCoord, setTouchCoord] = useState<{ x: number; y: number } | null>(null);

  const t = translations[language];

  const lockFadeTimeoutRef = useRef<number | null>(null);
  const holdStartTimeRef = useRef<number | null>(null);
  const holdAnimFrameRef = useRef<number | null>(null);

  const speedDurations: Record<LightSpeed, number> = {
    'very-slow': 16000,
    slow: 9000,
    medium: 5000,
    breathing: 6000,
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setColorIndex((prev) => (prev + 1) % palette.colors.length);
    }, speedDurations[speed]);
    return () => clearInterval(interval);
  }, [palette, speed]);

  // Handle 5-second auto-fadeout of the lock notification
  useEffect(() => {
    if (isLocked) {
      setLockBadgeVisible(true);
      if (lockFadeTimeoutRef.current) {
        window.clearTimeout(lockFadeTimeoutRef.current);
      }
      lockFadeTimeoutRef.current = window.setTimeout(() => {
        setLockBadgeVisible(false);
      }, 5000);
    } else {
      setLockBadgeVisible(false);
      setUnlockProgress(0);
      setTouchCoord(null);
    }

    return () => {
      if (lockFadeTimeoutRef.current) {
        window.clearTimeout(lockFadeTimeoutRef.current);
      }
    };
  }, [isLocked]);

  // Cancel hold animation if unmounting or unlocked
  useEffect(() => {
    return () => {
      if (holdAnimFrameRef.current) {
        cancelAnimationFrame(holdAnimFrameRef.current);
      }
    };
  }, []);

  const currentColor = redFilter
    ? '#b91c1c'
    : palette.colors[colorIndex % palette.colors.length];
  const nextColor = redFilter
    ? '#991b1b'
    : palette.colors[(colorIndex + 1) % palette.colors.length];

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Lock explanation text localized
  const lockDescriptions: Record<Language, { desc: string; holdText: string; activeText: string }> = {
    sk: {
      desc: 'Detský zámok obrazovky: Dotyky budú zablokované. Pre odomknutie podržte prst 1,5 sekundy kdekoľvek na obrazovke.',
      holdText: 'Podržte prst 1,5 s pre odomknutie',
      activeText: 'Detský zámok aktívny',
    },
    cs: {
      desc: 'Dětský zámek obrazovky: Dotyky budou zablokovány. Pro odemknutí podržte prst 1,5 sekundy kdekoliv na obrazovce.',
      holdText: 'Podržte prst 1,5 s pro odemknutí',
      activeText: 'Dětský zámek aktivní',
    },
    en: {
      desc: 'Child screen lock: Touches will be locked. Hold finger anywhere on screen for 1.5 seconds to unlock.',
      holdText: 'Hold for 1.5s to unlock',
      activeText: 'Child lock active',
    },
    pl: {
      desc: 'Blokada ekranu dla dzieci: Dotyk zostanie zablokowany. Przytrzymaj palec przez 1,5 sekundy w dowolnym miejscu ekranu, aby odblokować.',
      holdText: 'Przytrzymaj 1,5 s aby odblokować',
      activeText: 'Blokada dziecięca aktywna',
    },
    hu: {
      desc: 'Gyerekzár: Az érintések le lesznek tiltva. A feloldáshoz tartsa az ujját 1,5 másodpercig a képernyőn.',
      holdText: 'Tartsa lenyomva 1,5 mp-ig a feloldáshoz',
      activeText: 'Gyerekzár aktív',
    },
    uk: {
      desc: 'Дитяче блокування екрана: Дотики буде заблоковано. Утримуйте палець 1,5 секунди на екрані для розблокування.',
      holdText: 'Утримуйте 1,5 с для розблокування',
      activeText: 'Дитяче блокування активне',
    },
    it: {
      desc: 'Blocco schermo per bambini: I tocchi saranno bloccati. Tieni premuto per 1,5 secondi ovunque sullo schermo per sbloccare.',
      holdText: 'Tieni premuto 1,5 s per sbloccare',
      activeText: 'Blocco bambini attivo',
    },
  };

  const currentLockInfo = lockDescriptions[language] || lockDescriptions.sk;

  // Pointer down: If locked, start 1.5s (1500ms) unlock countdown
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isLocked) return;

    // Wake up the lock badge and restart 5s fadeout
    setLockBadgeVisible(true);
    if (lockFadeTimeoutRef.current) {
      window.clearTimeout(lockFadeTimeoutRef.current);
    }
    lockFadeTimeoutRef.current = window.setTimeout(() => {
      setLockBadgeVisible(false);
    }, 5000);

    const rect = e.currentTarget.getBoundingClientRect();
    setTouchCoord({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });

    holdStartTimeRef.current = performance.now();
    const HOLD_DURATION = 1500; // Exact 1.5 seconds as requested

    const updateHoldProgress = (now: number) => {
      if (!holdStartTimeRef.current) return;
      const elapsed = now - holdStartTimeRef.current;
      const progress = Math.min(100, (elapsed / HOLD_DURATION) * 100);
      setUnlockProgress(progress);

      if (progress >= 100) {
        // Successfully unlocked after 1.5s!
        triggerHaptic('heavy');
        setIsLocked(false);
        setUnlockProgress(0);
        setTouchCoord(null);
        setShowControls(true);
        holdStartTimeRef.current = null;
        return;
      }

      holdAnimFrameRef.current = requestAnimationFrame(updateHoldProgress);
    };

    holdAnimFrameRef.current = requestAnimationFrame(updateHoldProgress);
  };

  const handlePointerUpOrCancel = () => {
    if (!isLocked) return;
    if (holdAnimFrameRef.current) {
      cancelAnimationFrame(holdAnimFrameRef.current);
      holdAnimFrameRef.current = null;
    }
    holdStartTimeRef.current = null;
    setUnlockProgress(0);
    setTouchCoord(null);
  };

  const handleScreenClick = (e: React.MouseEvent) => {
    if (isLocked) {
      e.stopPropagation();
      return;
    }
    setShowControls((prev) => !prev);
  };

  return (
    <div
      onClick={handleScreenClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUpOrCancel}
      onPointerCancel={handlePointerUpOrCancel}
      onPointerLeave={handlePointerUpOrCancel}
      className="fixed inset-0 z-50 bg-[#030712] flex flex-col justify-between p-6 select-none cursor-pointer overflow-hidden touch-none"
    >
      {/* Dedicated ambient glowing light layer */}
      <div
        className={`absolute inset-0 pointer-events-none transition-colors duration-[4000ms] ease-in-out ${
          speed === 'breathing' ? 'animate-rhythmic-breathing' : ''
        }`}
        style={{
          background: `radial-gradient(circle at 50% 45%, ${currentColor} 0%, ${nextColor} 65%, #030712 100%)`,
          filter: `brightness(${brightness / 100})`,
        }}
      />

      {/* Top bar without distracting clock, day, or date */}
      <div className="relative z-10 flex items-center justify-between w-full pointer-events-none">
        <div className="flex flex-col">
          <span className="text-xs sm:text-sm font-medium text-white/40 tracking-widest uppercase">
            Toddler sleep assistant
          </span>
          <span className="text-[11px] text-white/30 tracking-wide mt-0.5">
            {palette.name} {redFilter ? `· ${t.redLightFilter}` : ''}
          </span>
        </div>

        {/* Upper right indicators */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center px-1">
            <BatteryIndicator className="text-white/35" />
          </div>

          {timerRemaining !== null && timerRemaining > 0 && (
            <div className="px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white/50 text-xs font-mono">
              {t.timer.remaining}: {formatTimer(timerRemaining)}
            </div>
          )}

          {isSoundPlaying && (
            <div className="w-8 h-8 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white/50 flex items-center justify-center">
              <Volume2 className="w-3.5 h-3.5 animate-pulse opacity-60" />
            </div>
          )}
        </div>
      </div>

      {/* Touch/Hold Visual Indicator when holding to unlock */}
      {isLocked && unlockProgress > 0 && (
        <div
          className="fixed z-40 pointer-events-none flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2"
          style={{
            left: touchCoord ? `${touchCoord.x}px` : '50%',
            top: touchCoord ? `${touchCoord.y}px` : '50%',
          }}
        >
          <div className="relative w-20 h-20 flex items-center justify-center">
            {/* Outer radial progress SVG */}
            <svg className="w-20 h-20 -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="34"
                className="stroke-white/20"
                strokeWidth="4"
                fill="none"
              />
              <circle
                cx="40"
                cy="40"
                r="34"
                className="stroke-amber-400"
                strokeWidth="5"
                strokeDasharray={213.6}
                strokeDashoffset={213.6 - (213.6 * unlockProgress) / 100}
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Lock className="w-6 h-6 text-amber-300 animate-pulse" />
            </div>
          </div>
          <span className="text-[11px] font-semibold text-amber-300 bg-black/70 px-2.5 py-1 rounded-full mt-2 backdrop-blur-md whitespace-nowrap border border-amber-400/30">
            {Math.round(unlockProgress)}%
          </span>
        </div>
      )}

      {/* Auto-fading Lock Notification (Requirement 1: fades out after 5s) */}
      {isLocked && (
        <div
          className={`relative z-10 mx-auto max-w-sm text-center px-4 py-2.5 rounded-2xl bg-black/60 backdrop-blur-md border border-white/15 text-white/80 transition-opacity duration-1000 ease-out pointer-events-none ${
            lockBadgeVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="flex items-center justify-center gap-2 text-xs font-medium text-amber-300">
            <Lock className="w-3.5 h-3.5" />
            <span>{currentLockInfo.activeText}</span>
          </div>
          <p className="text-[11px] text-white/60 mt-0.5">
            {currentLockInfo.holdText}
          </p>
        </div>
      )}

      {/* Subtle center tap cue if unlocked & controls hidden */}
      {!isLocked && !showControls && (
        <div className="relative z-10 text-center text-xs text-white/20 tracking-widest uppercase transition-opacity">
          {t.fullScreen.tapToToggle}
        </div>
      )}

      {/* Overlay Controls Bar (appears on tap) with explicit lock description */}
      {showControls && !isLocked && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="mx-auto w-full max-w-sm p-4 rounded-3xl bg-black/85 backdrop-blur-xl border border-white/20 flex flex-col gap-3 text-white shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        >
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => {
                triggerHaptic('heavy');
                setIsLocked(true);
                setShowControls(false);
              }}
              className="px-4 py-2.5 rounded-2xl border border-amber-400/40 bg-amber-400/15 hover:bg-amber-400/25 active:scale-95 transition-all flex items-center gap-2 text-amber-300 font-semibold text-xs touch-manipulation shadow-md"
            >
              <Lock className="w-4 h-4 text-amber-300" />
              <span>{t.touchLock}</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl bg-white text-slate-950 font-semibold text-xs flex items-center gap-2 hover:bg-white/90 active:scale-95 touch-manipulation shadow-lg"
            >
              <Minimize2 className="w-4 h-4" />
              <span>{t.fullScreen.backToMenu}</span>
            </button>
          </div>

          {/* Prominent explanation clearly visible in this window as requested */}
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[11px] text-white/70 leading-relaxed">
            <p>{currentLockInfo.desc}</p>
          </div>
        </div>
      )}

      {/* Subtle bottom note */}
      <div className="relative z-10 flex items-center justify-between text-[11px] text-white/25 pointer-events-none">
        <span>{t.fullScreen.nightLamp}</span>
        <span>{speedDurations[speed] / 1000}s {t.fullScreen.colorCycle}</span>
      </div>
    </div>
  );
};
