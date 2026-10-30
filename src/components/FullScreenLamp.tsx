import React, { useState, useEffect } from 'react';
import { Minimize2, Lock, Unlock, Sparkles, Volume2 } from 'lucide-react';
import { LightPalette, LightSpeed, Language } from '../types';
import { translations } from '../i18n/translations';
import { BatteryIndicator } from './BatteryIndicator';

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
  const t = translations[language];

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

  const handleScreenTap = () => {
    if (isLocked) return;
    setShowControls((prev) => !prev);
  };

  return (
    <div
      onClick={handleScreenTap}
      className="fixed inset-0 z-50 bg-[#030712] flex flex-col justify-between p-6 select-none cursor-pointer overflow-hidden"
    >
      {/* Dedicated ambient glowing light layer (breathes internally without ever revealing underlying menu) */}
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
      <div className="relative z-10 flex items-center justify-between w-full">
        {/* Subtle, soft non-distracting lamp tag with gentle transparency */}
        <div className="flex flex-col">
          <span className="text-xs sm:text-sm font-medium text-white/40 tracking-widest uppercase">
            Toddler sleep assistant
          </span>
          <span className="text-[11px] text-white/30 tracking-wide mt-0.5">
            {palette.name} {redFilter ? `· ${t.redLightFilter}` : ''}
          </span>
        </div>

        {/* Upper right indicators (battery / sound / timer) with subtle matching transparency */}
        <div className="flex items-center gap-2.5">
          {/* Gentle battery indicator matching text transparency without background container */}
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

      {/* Gentle center glow cue if controls hidden */}
      {!showControls && (
        <div className="relative z-10 text-center text-xs text-white/15 tracking-widest uppercase transition-opacity">
          {isLocked ? t.fullScreen.lockedNotice : t.fullScreen.tapToToggle}
        </div>
      )}

      {/* Overlay Controls Bar (appears on tap) */}
      {showControls && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="mx-auto w-full max-w-sm p-4 rounded-3xl bg-black/75 backdrop-blur-xl border border-white/20 flex items-center justify-between gap-3 text-white shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        >
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLocked(!isLocked)}
              className={`p-3 rounded-2xl border transition-all active:scale-95 touch-manipulation ${
                isLocked
                  ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold'
                  : 'bg-white/10 hover:bg-white/20 border-white/20'
              }`}
              title={isLocked ? t.touchLocked : t.touchLock}
            >
              {isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
            </button>
            <span className="text-xs text-white/50">
              {isLocked ? t.touchLocked : t.touchLock}
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-3 rounded-2xl bg-white text-slate-950 font-semibold text-xs flex items-center gap-2 hover:bg-white/90 active:scale-95 touch-manipulation shadow-lg"
          >
            <Minimize2 className="w-4 h-4" />
            <span>{t.fullScreen.backToMenu}</span>
          </button>
        </div>
      )}

      {/* Subtle bottom note */}
      <div className="relative z-10 flex items-center justify-between text-[11px] text-white/25">
        <span>{t.fullScreen.nightLamp}</span>
        <span>{speedDurations[speed] / 1000}s {t.fullScreen.colorCycle}</span>
      </div>
    </div>
  );
};
