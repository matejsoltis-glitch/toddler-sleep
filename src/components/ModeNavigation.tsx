import React from 'react';
import { Sparkles, Radio, Trees, Volume2 } from 'lucide-react';
import { AppMode } from '../types';

interface ModeNavigationProps {
  activeMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  isLightActive: boolean;
  isSoundPlaying: boolean;
  soundType: 'none' | 'white-noise' | 'nature';
}

export const ModeNavigation: React.FC<ModeNavigationProps> = ({
  activeMode,
  onSelectMode,
  isLightActive,
  isSoundPlaying,
  soundType,
}) => {
  const modes = [
    {
      id: 'light' as AppMode,
      title: '1. Pokojné svetlo',
      subtitle: 'Postupná zmena jemných farieb',
      icon: Sparkles,
      color: 'from-amber-400 to-rose-400',
      activeBorder: 'border-amber-400/50 bg-amber-400/10 text-amber-200',
      isActiveNow: isLightActive,
      badgeText: 'Svetlo svieti',
    },
    {
      id: 'white-noise' as AppMode,
      title: '2. Biely šum',
      subtitle: '3 úrovne intenzity v slučke',
      icon: Radio,
      color: 'from-sky-400 to-indigo-400',
      activeBorder: 'border-sky-400/50 bg-sky-400/10 text-sky-200',
      isActiveNow: isSoundPlaying && soundType === 'white-noise',
      badgeText: 'Hrá šum',
    },
    {
      id: 'nature' as AppMode,
      title: '3. Zvuky prírody',
      subtitle: 'Les, dážď & morské vlny',
      icon: Trees,
      color: 'from-emerald-400 to-teal-400',
      activeBorder: 'border-emerald-400/50 bg-emerald-400/10 text-emerald-200',
      isActiveNow: isSoundPlaying && soundType === 'nature',
      badgeText: 'Hrajú zvuky',
    },
  ];

  return (
    <nav className="w-full grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4 p-2 sm:p-0 select-none" aria-label="Výber módu uspávania">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isCurrentTab = activeMode === mode.id;

        return (
          <button
            key={mode.id}
            onClick={() => onSelectMode(mode.id)}
            className={`relative flex items-center sm:flex-col sm:items-start text-left p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 touch-manipulation active:scale-[0.98] ${
              isCurrentTab
                ? `${mode.activeBorder} shadow-lg shadow-black/30 ring-1 ring-white/20`
                : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/10 text-white/80'
            }`}
          >
            {/* Left/Top Icon + Active sound pulse */}
            <div className="flex items-center gap-3 w-full">
              <div
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform ${
                  isCurrentTab
                    ? 'bg-gradient-to-br shadow-inner text-slate-950 font-bold ' + mode.color
                    : 'bg-white/10 text-white/90'
                }`}
              >
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h2 className="text-sm sm:text-base font-semibold tracking-wide truncate text-white">
                    {mode.title}
                  </h2>
                  {mode.isActiveNow && (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      {mode.badgeText}
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/60 truncate mt-0.5">
                  {mode.subtitle}
                </p>
              </div>
            </div>

            {/* Bottom active tab indicator bar */}
            {isCurrentTab && (
              <div
                className={`hidden sm:block absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-gradient-to-r ${mode.color}`}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
};
