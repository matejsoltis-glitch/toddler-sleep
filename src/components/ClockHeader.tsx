import React from 'react';
import { Moon, Sun, ShieldAlert, Settings, ArrowLeft } from 'lucide-react';
import { NightModeState, Language, AppMode } from '../types';
import { translations } from '../i18n/translations';
import { BatteryIndicator } from './BatteryIndicator';

interface ClockHeaderProps {
  language: Language;
  activeMode: AppMode;
  onBackToMenu: () => void;
  nightMode: NightModeState;
  onToggleNightMode: () => void;
  onToggleRedFilter: () => void;
  isTouchLocked: boolean;
  onToggleTouchLock: () => void;
  activeSoundMode: 'none' | 'white-noise' | 'nature';
  isPlaying: boolean;
  timerRemaining: number | null;
  onOpenSettings: () => void;
}

export const ClockHeader: React.FC<ClockHeaderProps> = ({
  language,
  activeMode,
  onBackToMenu,
  nightMode,
  isTouchLocked,
  onToggleTouchLock,
  isPlaying,
  timerRemaining,
  onOpenSettings,
}) => {
  const t = translations[language];

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <header className="w-full border-b border-white/10 select-none bg-slate-950/70 backdrop-blur-md sticky top-0 z-30 pt-[8mm]">
      {/* Main Top Header without any distracting clock, day or date */}
      <div className="w-full max-w-md mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Left side: Day/Night status or Back button, with remaining timer positioned cleanly underneath */}
        <div className="flex flex-col items-start justify-center min-w-0">
          {activeMode !== 'menu' ? (
            <button
              onClick={onBackToMenu}
              className="h-8 px-2.5 -ml-1 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white/95 flex items-center gap-1.5 text-xs font-semibold transition-all touch-manipulation border border-white/15 shadow-sm"
              title="Späť do hlavného menu"
              aria-label="Späť do menu"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{language === 'sk' ? 'Hlavné menu' : language === 'cs' ? 'Hlavní menu' : 'Main Menu'}</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-white/70">
              {nightMode.isAfterSunset ? (
                <span className="flex items-center gap-1.5 text-amber-300/90 font-medium">
                  <Moon className="w-3.5 h-3.5 text-amber-300" />
                  <span>{t.sunsetActive}</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-amber-100/70 font-medium">
                  <Sun className="w-3.5 h-3.5 text-amber-200" />
                  <span>{t.dayActive}</span>
                </span>
              )}
            </div>
          )}

          {/* Active timer placed elegantly underneath left label, away from camera cutouts */}
          {isPlaying && timerRemaining !== null && timerRemaining > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono leading-none mt-1 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold">{formatTimer(timerRemaining)}</span>
              <span className="text-[10px] text-emerald-300/60 font-sans tracking-wide">
                {t.timer.remaining}
              </span>
            </div>
          )}
        </div>

        {/* Right side: Gentle Battery indicator, Child lock button, Settings Gear */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Gentle Battery Indicator */}
          <div className="flex items-center px-1">
            <BatteryIndicator className="text-white/45" />
          </div>

          {/* Child Lock button */}
          <button
            onClick={onToggleTouchLock}
            title={isTouchLocked ? t.touchLocked : t.touchLock}
            aria-label={t.touchLock}
            className={`h-10 w-10 sm:w-auto sm:px-2.5 flex items-center justify-center gap-1.5 rounded-xl text-xs font-medium transition-all active:scale-95 touch-manipulation ${
              isTouchLocked
                ? 'bg-amber-400 text-slate-950 font-bold ring-2 ring-amber-300 shadow-md'
                : 'bg-white/5 hover:bg-white/10 text-white/70 border border-white/10'
            }`}
          >
            <ShieldAlert className={`w-4 h-4 ${isTouchLocked ? 'text-slate-950' : 'text-amber-400'}`} />
            <span className="hidden sm:inline">{isTouchLocked ? t.touchLocked : t.touchLock}</span>
          </button>

          {/* Settings Gear ("koliesko") */}
          <button
            onClick={onOpenSettings}
            title={t.settings}
            aria-label={t.settings}
            className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white/90 border border-white/15 transition-all touch-manipulation shadow-sm"
          >
            <Settings className="w-4 h-4 text-amber-200" />
          </button>
        </div>
      </div>
    </header>
  );
};
