import React, { useState, useRef } from 'react';
import { Timer, VolumeX, Plus, Minus, RotateCcw, ChevronDown } from 'lucide-react';
import { getTimerPresets } from '../constants/palettes';
import { Language } from '../types';
import { translations } from '../i18n/translations';
import { triggerHaptic } from '../utils/haptics';

interface SleepTimerControlsProps {
  language: Language;
  durationMinutes: number;
  remainingSeconds: number;
  isRunning: boolean;
  onSetDuration: (minutes: number) => void;
  onResetTimer: () => void;
  onAddMinutes: (minutes: number) => void;
  onSubtractMinutes: (minutes: number) => void;
  onSeekSeconds: (seconds: number) => void;
  isFadeEnabled: boolean;
  onToggleFade: () => void;
  fadeMinutes: number;
  onSetFadeMinutes: (m: number) => void;
  isLightActive?: boolean;
}

const timerI18n: Record<
  Language,
  {
    subtract5: string;
    add5: string;
    fadeDisabledHint: string;
  }
> = {
  sk: {
    subtract5: '-5 min',
    add5: '+5 min',
    fadeDisabledHint: 'Stlmenie pred vypnutím vypnuté',
  },
  cs: {
    subtract5: '-5 min',
    add5: '+5 min',
    fadeDisabledHint: 'Ztišení před vypnutím vypnuto',
  },
  en: {
    subtract5: '-5 min',
    add5: '+5 min',
    fadeDisabledHint: 'Fade-out before timer stops is disabled',
  },
  pl: {
    subtract5: '-5 min',
    add5: '+5 min',
    fadeDisabledHint: 'Wyciszenie przed wyłączeniem wyłączone',
  },
  hu: {
    subtract5: '-5 perc',
    add5: '+5 perc',
    fadeDisabledHint: 'Lekeverés a kikapcsolás előtt kikapcsolva',
  },
  uk: {
    subtract5: '-5 хв',
    add5: '+5 хв',
    fadeDisabledHint: 'Згасання перед вимкненням вимкнено',
  },
  it: {
    subtract5: '-5 min',
    add5: '+5 min',
    fadeDisabledHint: 'Dissolvenza prima dello spegnimento disattivata',
  },
};

export const SleepTimerControls: React.FC<SleepTimerControlsProps> = ({
  language,
  durationMinutes,
  remainingSeconds,
  isRunning,
  onSetDuration,
  onResetTimer,
  onAddMinutes,
  onSubtractMinutes,
  onSeekSeconds,
  isFadeEnabled,
  onToggleFade,
  fadeMinutes,
  onSetFadeMinutes,
  isLightActive = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragSeconds, setDragSeconds] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const t = translations[language].timer;
  const localTexts = timerI18n[language] || timerI18n.en;
  const presets = getTimerPresets(language);

  const formatTime = (totalSeconds: number) => {
    if (totalSeconds <= 0) return '00:00';
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hrs > 0) {
      return `${hrs}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const effectiveSeconds = dragSeconds !== null ? dragSeconds : remainingSeconds;
  const totalMaxSeconds = durationMinutes > 0 ? durationMinutes * 60 : 60 * 60;

  const progressPercent =
    totalMaxSeconds > 0
      ? Math.max(0, Math.min(100, (effectiveSeconds / totalMaxSeconds) * 100))
      : 0;

  // Touch & Pointer Scrubber handlers: stepped sensitively by 10 SECONDS as requested
  const calcSecondsFromEvent = (clientX: number): number => {
    if (!trackRef.current) return effectiveSeconds;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const maxSec = durationMinutes > 0 ? Math.max(durationMinutes * 60, 60) : 60 * 60;
    // Step by 10-second increments for high sensitivity and precision
    const steppedSec = Math.round((ratio * maxSec) / 10) * 10;
    return Math.max(0, steppedSec);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    setIsDragging(true);
    const nextSec = calcSecondsFromEvent(e.clientX);
    setDragSeconds(nextSec);
    triggerHaptic(8);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.stopPropagation();
    const nextSec = calcSecondsFromEvent(e.clientX);
    setDragSeconds(nextSec);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.stopPropagation();
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    const finalSec = calcSecondsFromEvent(e.clientX);
    setIsDragging(false);
    setDragSeconds(null);
    onSeekSeconds(finalSec);
    triggerHaptic(12);
  };

  return (
    <div
      onClick={() => {
        triggerHaptic(8);
        setIsExpanded((prev) => !prev);
      }}
      className={`w-full max-w-md mx-auto rounded-3xl bg-slate-900/70 border border-white/10 p-4 backdrop-blur-md flex flex-col gap-2.5 select-none shadow-xl cursor-pointer transition-all duration-700 ease-out hover:border-white/20 active:scale-[0.99] touch-manipulation ${
        isLightActive ? 'opacity-50' : 'opacity-100'
      }`}
    >
      {/* Tier 1: Header Row - Full room for Title and Status without squeezing */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-400/30 shrink-0 shadow-sm">
            <Timer className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-sm text-white tracking-wide leading-tight">
              {t.title}
            </h3>
          </div>
        </div>

        {/* Live Remaining Time Badge + Accordion Chevron */}
        <div className="flex items-center gap-2 shrink-0">
          {durationMinutes > 0 && (
            <div className="px-2.5 py-1 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="font-mono text-sm sm:text-base font-bold text-amber-300 tracking-tight">
                {formatTime(effectiveSeconds)}
              </span>
            </div>
          )}

          <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-white/50 shrink-0">
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-500 ease-out ${
                isExpanded ? 'rotate-180 text-amber-300' : ''
              }`}
            />
          </div>
        </div>
      </div>

      {/* Tier 2: Quick Action Bar (-5m, +5m, Reset) */}
      {durationMinutes > 0 && (
        <div
          className="flex items-center gap-1.5 pt-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Quick -5 min button */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic(8);
              onSubtractMinutes(5);
            }}
            title={localTexts.subtract5}
            className="h-7 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/25 text-white text-xs font-semibold flex items-center gap-1 active:scale-95 touch-manipulation border border-white/15 transition-all shadow-sm"
          >
            <Minus className="w-3 h-3 text-amber-300" />
            <span>5m</span>
          </button>

          {/* Quick +5 min button */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic(8);
              onAddMinutes(5);
            }}
            title={localTexts.add5}
            className="h-7 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/25 text-white text-xs font-semibold flex items-center gap-1 active:scale-95 touch-manipulation border border-white/15 transition-all shadow-sm"
          >
            <Plus className="w-3 h-3 text-emerald-300" />
            <span>5m</span>
          </button>

          {/* Reset button */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic(10);
              onResetTimer();
            }}
            title={t.reset}
            className="h-7 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/25 text-white/70 hover:text-white flex items-center justify-center active:scale-95 touch-manipulation border border-white/15 transition-all shadow-sm"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Tier 3: Interactive Liquid Water Progress Bar (Sensitive to 10s, No Ball, No Sub-Text) */}
      <div
        ref={trackRef}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative w-full h-7 flex items-center cursor-pointer touch-none group -my-1"
        role="slider"
        aria-label={t.title}
        aria-valuenow={effectiveSeconds}
        aria-valuemin={0}
        aria-valuemax={totalMaxSeconds}
      >
        {/* Visual Track Channel */}
        <div className="relative w-full h-3.5 rounded-full bg-white/[0.08] border border-white/10 overflow-hidden shadow-inner">
          {/* Filled Liquid Water Container */}
          <div
            className="absolute top-0 bottom-0 left-0 overflow-hidden transition-[width] duration-75 ease-out rounded-full"
            style={{ width: `${progressPercent}%` }}
          >
            {/* Base liquid amber gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-600/50 via-amber-400/60 to-emerald-400/70" />

            {/* Moving Water Wave Layer 1 (Back wave, subtle warm ripple) */}
            <div
              className={`absolute inset-0 w-[200%] h-full pointer-events-none opacity-45 ${
                isDragging ? 'animate-liquid-slow-active' : 'animate-liquid-slow'
              }`}
            >
              <svg
                viewBox="0 0 1000 40"
                preserveAspectRatio="none"
                className="w-full h-full"
              >
                <path
                  d="M 0 20 Q 125 8 250 20 T 500 20 Q 625 8 750 20 T 1000 20 L 1000 40 L 0 40 Z"
                  fill="rgba(245, 158, 11, 0.75)"
                />
              </svg>
            </div>

            {/* Moving Water Wave Layer 2 (Front wave, bright water ripple) */}
            <div
              className={`absolute inset-0 w-[200%] h-full pointer-events-none opacity-70 ${
                isDragging ? 'animate-liquid-active' : 'animate-liquid-fast'
              }`}
            >
              <svg
                viewBox="0 0 1000 40"
                preserveAspectRatio="none"
                className="w-full h-full"
              >
                <path
                  d="M 0 20 Q 125 10 250 20 T 500 20 Q 625 10 750 20 T 1000 20 L 1000 40 L 0 40 Z"
                  fill="rgba(254, 240, 138, 0.85)"
                />
              </svg>
            </div>

            {/* Surface Shimmer */}
            <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/50 to-white/70" />
          </div>
        </div>
      </div>

      {/* Expanded Controls: Presets & Fade-out Settings (Gentle slow sliding accordion drawer) */}
      <div className={`timer-drawer-collapse ${isExpanded ? 'timer-drawer-expand' : ''}`}>
        <div className="timer-drawer-inner">
          <div
            onClick={(e) => e.stopPropagation()}
            className={`flex flex-col gap-3.5 pt-3 border-t border-white/10 transition-all duration-500 ease-out ${
              isExpanded ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
            }`}
          >
            {/* Preset Buttons for Mobile */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-medium text-white/70">{t.presetsTitle}</span>
              <div className="grid grid-cols-4 gap-1.5">
                {presets.map((preset) => {
                  const isSelected = durationMinutes === preset.value;
                  return (
                    <button
                      key={preset.value}
                      onClick={() => {
                        triggerHaptic(8);
                        onSetDuration(preset.value);
                      }}
                      className={`py-2 px-1 rounded-xl text-center text-[11px] font-medium transition-all active:scale-95 touch-manipulation border truncate ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950 font-bold border-amber-300 shadow-md ring-1 ring-amber-300/40'
                          : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Gradual Fade-out Section (Postupné stlmenie zvuku pri zaspávaní) */}
            <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col gap-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isFadeEnabled ? 'bg-amber-400/20 text-amber-300' : 'bg-white/10 text-white/40'
                    }`}
                  >
                    <VolumeX className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-semibold text-white">{t.fadeTitle}</h4>
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-300 font-medium">
                        {t.fadeRecommended}
                      </span>
                    </div>
                    <p className="text-[10px] text-white/60 mt-0.5 leading-tight">{t.fadeDesc}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
                {isFadeEnabled ? (
                  <div className="flex items-center gap-1 bg-white/10 p-0.5 rounded-xl">
                    {[5, 10, 15].map((mins) => (
                      <button
                        key={mins}
                        onClick={() => {
                          triggerHaptic(8);
                          onSetFadeMinutes(mins);
                        }}
                        className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all touch-manipulation ${
                          fadeMinutes === mins
                            ? 'bg-amber-400 text-slate-950 shadow-sm'
                            : 'text-white/70 hover:text-white'
                        }`}
                      >
                        {mins} {t.minsLabel}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="text-[10px] text-white/40">{localTexts.fadeDisabledHint}</span>
                )}

                <button
                  onClick={() => {
                    triggerHaptic(10);
                    onToggleFade();
                  }}
                  className={`min-h-[34px] px-3 rounded-xl text-[11px] font-semibold transition-all active:scale-95 touch-manipulation flex items-center gap-1.5 ${
                    isFadeEnabled
                      ? 'bg-amber-400 text-slate-950 font-bold ring-1 ring-amber-300/40'
                      : 'bg-white/10 hover:bg-white/15 text-white/70 border border-white/15'
                  }`}
                >
                  {isFadeEnabled ? t.fadeOn : t.fadeOff}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
