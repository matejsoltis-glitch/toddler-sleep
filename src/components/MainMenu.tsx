import React from 'react';
import { Sparkles, Radio, Trees, Calendar, ChevronRight, Square, Play, Volume2, SunMedium, Layers } from 'lucide-react';
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
  componentsOpacity: number;
  onChangeComponentsOpacity: (opacity: number) => void;
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
  componentsOpacity,
  onChangeComponentsOpacity,
}) => {
  const t = translations[language];

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isAnyPlaying = isLightActive || isWhiteNoiseActive || isNatureActive;

  // Single-word labels for master sliders localized across 7 languages
  const sliderLabels: Record<Language, { volume: string; brightness: string; opacity: string }> = {
    sk: { volume: 'Hlasitosť', brightness: 'Jas', opacity: 'Priehľadnosť' },
    cs: { volume: 'Hlasitost', brightness: 'Jas', opacity: 'Průhlednost' },
    en: { volume: 'Volume', brightness: 'Brightness', opacity: 'Opacity' },
    pl: { volume: 'Głośność', brightness: 'Jasność', opacity: 'Przezroczystość' },
    hu: { volume: 'Hangerő', brightness: 'Fényerő', opacity: 'Átlátszóság' },
    uk: { volume: 'Гучність', brightness: 'Яскравість', opacity: 'Прозорість' },
    it: { volume: 'Volume', brightness: 'Luminosità', opacity: 'Trasparenza' },
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
    <div className="w-full max-w-md mx-auto flex flex-col gap-3 py-0.5 select-none transition-opacity duration-300 ease-out">
      {/* Master Sliders: 30% more compact, intuitive 3-slider control panel */}
      <div className="w-full p-2 sm:p-2.5 rounded-2xl bg-slate-900/70 border border-white/10 flex flex-col gap-1.5 shadow-sm">
        {/* 1. Master Volume Slider */}
        <LiquidSlider
          label={sliderNames.volume}
          icon={<Volume2 className="w-3 h-3 text-slate-300 shrink-0" />}
          value={volume}
          min={0}
          max={1}
          step={0.01}
          onChange={onChangeVolume}
          ariaLabel={sliderNames.volume}
          compact={true}
        />

        {/* 2. Master Brightness Slider */}
        <LiquidSlider
          label={sliderNames.brightness}
          icon={<SunMedium className="w-3 h-3 text-slate-300 shrink-0" />}
          value={brightness}
          min={10}
          max={100}
          step={1}
          onChange={onChangeBrightness}
          ariaLabel={sliderNames.brightness}
          compact={true}
        />

        {/* 3. Components Opacity Slider (5% to 100%) */}
        <LiquidSlider
          label={sliderNames.opacity}
          icon={<Layers className="w-3 h-3 text-slate-300 shrink-0" />}
          value={componentsOpacity}
          min={5}
          max={100}
          step={1}
          onChange={onChangeComponentsOpacity}
          ariaLabel={sliderNames.opacity}
          compact={true}
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

        {/* Action button */}
        {isAnyPlaying ? (
          <button
            onClick={() => {
              triggerHaptic(12);
              onStopAll();
            }}
            className="h-10 px-3.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/40 text-xs font-semibold flex items-center gap-1.5 active:scale-95 touch-manipulation transition-all shrink-0"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>{t.statusCard.stopBtn}</span>
          </button>
        ) : (
          <button
            onClick={() => {
              triggerHaptic(10);
              onResumePrevious();
            }}
            className="h-10 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold flex items-center gap-1.5 active:scale-95 touch-manipulation transition-all shadow-md shadow-amber-400/20 shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{t.statusCard.startBtn}</span>
          </button>
        )}
      </div>

      {/* 4 Mode Grid Cards */}
      <div className="flex flex-col gap-2.5">
        {modeCards.map((mode) => {
          const Icon = mode.icon;
          return (
            <button
              key={mode.id}
              onClick={() => {
                triggerHaptic(8);
                onSelectMode(mode.id);
              }}
              className={`w-full p-4 rounded-3xl border bg-gradient-to-r ${mode.gradient} bg-slate-900/60 hover:bg-slate-900/90 active:scale-[0.98] transition-all duration-200 flex items-center justify-between text-left touch-manipulation shadow-lg group backdrop-blur-sm`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className={`w-12 h-12 rounded-2xl ${mode.iconBg} flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm text-white truncate">
                      {mode.title}
                    </h3>
                    {mode.isActive && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 shrink-0">
                        {mode.activeBadge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/60 truncate mt-0.5">
                    {mode.subtitle}
                  </p>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 group-hover:text-white group-hover:bg-white/10 transition-colors shrink-0 ml-2">
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
