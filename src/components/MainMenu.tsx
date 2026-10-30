import React from 'react';
import { Sparkles, Radio, Trees, Calendar, ChevronRight, Square, Play, Volume2, SunMedium } from 'lucide-react';
import { AppMode, Language } from '../types';
import { translations } from '../i18n/translations';
import { triggerHaptic } from '../utils/haptics';
import { LiquidSlider } from './LiquidSlider';

interface MainMenuProps {
  language: Language;
  onSelectMode: (mode: AppMode) => void;
  isLightActive: boolean;
  isWhiteNoiseActive: boolean;
  isNatureActive: boolean;
  onStopAll: () => void;
  onResumePrevious: () => void;
  timerRemaining: number | null;
  durationMinutes: number;
  volume: number;
  onChangeVolume: (volume: number) => void;
  brightness: number;
  onChangeBrightness: (brightness: number) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  language,
  onSelectMode,
  isLightActive,
  isWhiteNoiseActive,
  isNatureActive,
  onStopAll,
  onResumePrevious,
  timerRemaining,
  volume,
  onChangeVolume,
  brightness,
  onChangeBrightness,
}) => {
  const t = translations[language];

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isAnyPlaying = isLightActive || isWhiteNoiseActive || isNatureActive;

  // Strictly single-word labels for the master sliders as requested
  const sliderLabels: Record<Language, { volume: string; brightness: string }> = {
    sk: { volume: 'Hlasitosť', brightness: 'Jas' },
    cs: { volume: 'Hlasitost', brightness: 'Jas' },
    en: { volume: 'Volume', brightness: 'Brightness' },
    pl: { volume: 'Głośność', brightness: 'Jasność' },
    hu: { volume: 'Hangerő', brightness: 'Fényerő' },
    uk: { volume: 'Гучність', brightness: 'Яскравість' },
    it: { volume: 'Volume', brightness: 'Luminosità' },
  };
  const sliderNames = sliderLabels[language] || sliderLabels.en;

  const modeCards = [
    {
      id: 'light' as AppMode,
      title: t.modes.light.tabTitle,
      subtitle: t.modes.light.tabSubtitle,
      icon: Sparkles,
      gradient: 'from-amber-500/20 via-orange-500/15 to-rose-500/10 border-amber-500/30 text-amber-300',
      iconBg: 'bg-amber-400 text-slate-950 shadow-amber-400/30',
      isActive: isLightActive,
      activeBadge: t.modes.light.activeBadge,
    },
    {
      id: 'white-noise' as AppMode,
      title: t.modes.whiteNoise.tabTitle,
      subtitle: t.modes.whiteNoise.tabSubtitle,
      icon: Radio,
      gradient: 'from-sky-500/20 via-blue-500/15 to-indigo-500/10 border-sky-500/30 text-sky-300',
      iconBg: 'bg-sky-400 text-slate-950 shadow-sky-400/30',
      isActive: isWhiteNoiseActive,
      activeBadge: t.modes.whiteNoise.activeBadge,
    },
    {
      id: 'nature' as AppMode,
      title: t.modes.nature.tabTitle,
      subtitle: t.modes.nature.tabSubtitle,
      icon: Trees,
      gradient: 'from-emerald-500/20 via-teal-500/15 to-cyan-500/10 border-emerald-500/30 text-emerald-300',
      iconBg: 'bg-emerald-400 text-slate-950 shadow-emerald-400/30',
      isActive: isNatureActive,
      activeBadge: t.modes.nature.activeBadge,
    },
    {
      id: 'schedule' as AppMode,
      title: t.modes.schedule?.tabTitle || (language === 'sk' ? 'Asistent spánkového režimu' : 'Schedule Assistant'),
      subtitle: t.modes.schedule?.tabSubtitle || (language === 'sk' ? 'Sledovanie bdelosti, spánku a história' : 'Track naps, wake windows & export'),
      icon: Calendar,
      gradient: 'from-violet-500/20 via-purple-500/15 to-indigo-500/10 border-violet-500/30 text-violet-300',
      iconBg: 'bg-violet-400 text-slate-950 shadow-violet-400/30',
      isActive: false,
      activeBadge: t.modes.schedule?.activeBadge || 'Aktívny',
    },
  ];

  return (
    <div
      className={`w-full max-w-md mx-auto flex flex-col gap-3 py-0.5 select-none transition-opacity duration-700 ease-out ${
        isLightActive ? 'opacity-50' : 'opacity-100'
      }`}
    >
      {/* Master Sliders: Stacked vertically, full width matching menu cards, elegant silver-gray liquid water ripple */}
      <div className="w-full flex flex-col gap-3 px-0.5 pt-0.5 pb-1">
        {/* 1. Master Volume Slider */}
        <LiquidSlider
          label={sliderNames.volume}
          icon={<Volume2 className="w-4 h-4 text-slate-300 shrink-0" />}
          value={volume}
          min={0}
          max={1}
          step={0.01}
          onChange={onChangeVolume}
          ariaLabel={sliderNames.volume}
        />

        {/* 2. Master Brightness Slider */}
        <LiquidSlider
          label={sliderNames.brightness}
          icon={<SunMedium className="w-4 h-4 text-slate-300 shrink-0" />}
          value={brightness}
          min={10}
          max={100}
          step={1}
          onChange={onChangeBrightness}
          ariaLabel={sliderNames.brightness}
        />
      </div>

      {/* Permanent Status Window (does not move or disappear, preventing any menu jump) */}
      <div
        className={`min-h-[56px] py-2.5 px-3.5 rounded-2xl border flex items-center justify-between gap-3 shadow-md transition-all duration-300 ${
          isAnyPlaying
            ? 'bg-slate-900/90 border-emerald-500/40 shadow-emerald-950/20'
            : 'bg-slate-900/60 border-white/10 shadow-black/20'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {isAnyPlaying ? (
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
            </span>
          ) : (
            <span className="w-2.5 h-2.5 rounded-full bg-white/25 shrink-0" />
          )}
          <div className="truncate text-xs">
            <span
              className={`font-semibold block ${
                isAnyPlaying ? 'text-emerald-300' : 'text-white/80'
              }`}
            >
              {isAnyPlaying ? t.statusCard.activeTitle : t.statusCard.inactiveTitle}
            </span>
            <span className="text-white/50 truncate block text-[11px]">
              {isAnyPlaying
                ? timerRemaining !== null && timerRemaining > 0
                  ? `${t.timer.remaining}: ${formatTimer(timerRemaining)}`
                  : t.timer.unlimitedDesc
                : t.statusCard.readyDesc}
            </span>
          </div>
        </div>

        {isAnyPlaying ? (
          <button
            onClick={() => {
              triggerHaptic(12);
              onStopAll();
            }}
            className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/40 text-xs font-semibold flex items-center gap-1.5 active:scale-95 touch-manipulation shrink-0 transition-colors"
            title={t.statusCard.stopBtn}
            aria-label={t.statusCard.stopBtn}
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>{t.statusCard.stopBtn}</span>
          </button>
        ) : (
          <button
            onClick={() => {
              triggerHaptic(12);
              onResumePrevious();
            }}
            className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 border border-emerald-400/50 text-xs font-bold flex items-center gap-1.5 active:scale-95 touch-manipulation shrink-0 shadow-md transition-colors"
            title={t.statusCard.startBtn}
            aria-label={t.statusCard.startBtn}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{t.statusCard.startBtn}</span>
          </button>
        )}
      </div>

      {/* 3 Main Mode Selection Cards - Refined, tactile, non-massive */}
      <div className="flex flex-col gap-2.5">
        {modeCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              onClick={() => {
                triggerHaptic(12);
                onSelectMode(card.id);
              }}
              className={`group relative text-left py-3 px-3.5 rounded-2xl border transition-all duration-200 active:scale-[0.98] touch-manipulation flex items-center justify-between bg-gradient-to-br ${card.gradient} shadow-md shadow-black/20`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-sm shrink-0 ${card.iconBg}`}
                >
                  <Icon className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="truncate">
                  <h3 className="text-sm font-semibold text-white tracking-wide leading-tight">
                    {card.title}
                  </h3>
                  <p className="text-[11px] text-white/65 leading-tight mt-0.5">
                    {card.subtitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                {card.isActive && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
                    {card.activeBadge}
                  </span>
                )}
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white/70 group-hover:translate-x-0.5 transition-transform">
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
