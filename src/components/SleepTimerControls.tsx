import React, { useState } from 'react';
import { Timer, VolumeX, Plus, RotateCcw, ChevronDown } from 'lucide-react';
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
  isFadeEnabled: boolean;
  onToggleFade: () => void;
  fadeMinutes: number;
  onSetFadeMinutes: (m: number) => void;
  isLightActive?: boolean;
}

export const SleepTimerControls: React.FC<SleepTimerControlsProps> = ({
  language,
  durationMinutes,
  remainingSeconds,
  isRunning,
  onSetDuration,
  onResetTimer,
  onAddMinutes,
  isFadeEnabled,
  onToggleFade,
  fadeMinutes,
  onSetFadeMinutes,
  isLightActive = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const t = translations[language].timer;
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

  const progressPercent =
    durationMinutes > 0 && remainingSeconds > 0
      ? Math.max(0, Math.min(100, (remainingSeconds / (durationMinutes * 60)) * 100))
      : 0;

  return (
    <div
      onClick={() => {
        triggerHaptic(8);
        setIsExpanded((prev) => !prev);
      }}
      className={`w-full max-w-md mx-auto rounded-3xl bg-slate-900/60 border border-white/10 p-3.5 sm:p-4 backdrop-blur-md flex flex-col gap-3 select-none shadow-xl cursor-pointer transition-all duration-700 ease-out hover:border-white/20 active:scale-[0.99] touch-manipulation ${
        isLightActive ? 'opacity-50' : 'opacity-100'
      }`}
    >
      {/* Header with status */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-400/30 shrink-0">
            <Timer className="w-4 h-4" />
          </div>
          <div className="truncate">
            <h3 className="font-semibold text-sm text-white">
              {t.title}
            </h3>
            <p className="text-[11px] text-white/60 truncate">
              {durationMinutes === 0
                ? t.unlimitedDesc
                : t.setDurationDesc.replace('{mins}', durationMinutes.toString())}
            </p>
          </div>
        </div>

        {/* Live Remaining Badge + Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {durationMinutes > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="text-right">
                <span className="text-[10px] text-white/50 block leading-tight">{t.remaining}</span>
                <span className="font-mono text-sm sm:text-base font-bold text-amber-300">
                  {formatTime(remainingSeconds)}
                </span>
              </div>

              {/* Quick +15 min extend button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic(8);
                  onAddMinutes(15);
                }}
                title={t.add15m}
                className="h-8 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-0.5 active:scale-95 touch-manipulation border border-white/15"
              >
                <Plus className="w-3 h-3" />
                <span>15m</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic(10);
                  onResetTimer();
                }}
                title={t.reset}
                className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 flex items-center justify-center active:scale-95 touch-manipulation border border-white/15"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
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

      {/* Progress Bar (The colored line) - Always visible right below the header */}
      <div className="w-full">
        <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
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
        <span className="text-[11px] font-medium text-white/70">
          {t.presetsTitle}
        </span>
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
                <h4 className="text-xs font-semibold text-white">
                  {t.fadeTitle}
                </h4>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-300 font-medium">
                  {t.fadeRecommended}
                </span>
              </div>
              <p className="text-[10px] text-white/60 mt-0.5 leading-tight">
                {t.fadeDesc}
              </p>
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
            <span className="text-[10px] text-white/40">Stlmenie pred vypnutím vypnuté</span>
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
