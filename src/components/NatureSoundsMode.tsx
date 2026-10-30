import React from 'react';
import { Play, Pause, Volume2, Trees, CloudRain, Waves, Bird, Heart } from 'lucide-react';
import { NatureSoundType, Language } from '../types';
import { translations } from '../i18n/translations';
import { triggerHaptic } from '../utils/haptics';

interface NatureSoundsModeProps {
  language: Language;
  isPlaying: boolean;
  activeNature: NatureSoundType;
  onSelectNature: (nature: NatureSoundType) => void;
  onTogglePlay: () => void;
  volume: number; // 0 to 1
  onChangeVolume: (vol: number) => void;
  isFading: boolean;
  fadeMultiplier: number;
}

export const NatureSoundsMode: React.FC<NatureSoundsModeProps> = ({
  language,
  isPlaying,
  activeNature,
  onSelectNature,
  onTogglePlay,
  volume,
  onChangeVolume,
  isFading,
  fadeMultiplier,
}) => {
  const t = translations[language].modes.nature;

  const natureOptions: {
    id: NatureSoundType;
    title: string;
    subtitle: string;
    icon: typeof Trees;
    description: string;
    rhythm: string;
    gradient: string;
    themeBg: string;
  }[] = [
    {
      id: 'heartbeat',
      title: t.sounds.heartbeat.title,
      subtitle: t.sounds.heartbeat.subtitle,
      icon: Heart,
      description: t.sounds.heartbeat.description,
      rhythm: t.sounds.heartbeat.rhythm,
      gradient: 'from-rose-500/20 to-red-500/20 border-rose-500/40',
      themeBg: 'rgba(244, 63, 94, 0.25)',
    },
    {
      id: 'forest',
      title: t.sounds.forest.title,
      subtitle: t.sounds.forest.subtitle,
      icon: Trees,
      description: t.sounds.forest.description,
      rhythm: t.sounds.forest.rhythm,
      gradient: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/40',
      themeBg: 'rgba(16, 185, 129, 0.25)',
    },
    {
      id: 'rain',
      title: t.sounds.rain.title,
      subtitle: t.sounds.rain.subtitle,
      icon: CloudRain,
      description: t.sounds.rain.description,
      rhythm: t.sounds.rain.rhythm,
      gradient: 'from-sky-500/20 to-cyan-500/20 border-sky-500/40',
      themeBg: 'rgba(14, 165, 233, 0.25)',
    },
    {
      id: 'ocean',
      title: t.sounds.ocean.title,
      subtitle: t.sounds.ocean.subtitle,
      icon: Waves,
      description: t.sounds.ocean.description,
      rhythm: t.sounds.ocean.rhythm,
      gradient: 'from-teal-500/20 to-blue-500/20 border-teal-500/40',
      themeBg: 'rgba(20, 184, 166, 0.25)',
    },
    {
      id: 'night-birds',
      title: t.sounds.nightBirds.title,
      subtitle: t.sounds.nightBirds.subtitle,
      icon: Bird,
      description: t.sounds.nightBirds.description,
      rhythm: t.sounds.nightBirds.rhythm,
      gradient: 'from-indigo-500/20 to-purple-500/20 border-indigo-500/40',
      themeBg: 'rgba(99, 102, 241, 0.25)',
    },
  ];

  const current = natureOptions.find((o) => o.id === activeNature) || natureOptions[0];
  const IconComponent = current.icon;

  return (
    <div className="flex flex-col gap-4 w-full max-w-md mx-auto">
      {/* Mode Header badge */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold tracking-wider text-emerald-300/90 uppercase">
          {t.tabTitle}
        </span>
        <span className="text-[11px] text-white/40">
          {t.tabSubtitle}
        </span>
      </div>

      {/* Visual Ambient Player */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900/70 border border-white/10 p-5 sm:p-6 flex flex-col items-center justify-center text-center shadow-2xl backdrop-blur-md">
        {/* Ambient colored background pulse */}
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-1000 opacity-25 blur-3xl"
          style={{
            background: isPlaying
              ? `radial-gradient(circle at center, ${current.themeBg} 0%, transparent 75%)`
              : 'transparent',
          }}
        />

        {/* Central interactive orb */}
        <div className="relative z-10 flex flex-col items-center my-2">
          <div
            className={`w-28 h-28 rounded-3xl flex items-center justify-center border-2 transition-all duration-700 ${
              isPlaying
                ? 'border-emerald-400/80 text-emerald-200 shadow-[0_0_40px_rgba(16,185,129,0.35)] scale-100 bg-emerald-500/15'
                : 'bg-white/5 border-white/10 text-white/40 scale-95'
            }`}
          >
            <IconComponent
              className={`w-12 h-12 ${isPlaying ? 'animate-pulse' : ''}`}
            />
          </div>

          <div className="mt-3.5">
            <span className="text-[11px] uppercase tracking-widest font-semibold text-emerald-300">
              {t.natureSoundPrefix} · {current.rhythm}
            </span>
            <h3 className="text-xl sm:text-2xl font-light text-white tracking-wide mt-0.5">
              {current.title}
            </h3>
            <p className="text-xs text-white/60 max-w-xs mt-1">
              {current.description}
            </p>
          </div>

          {/* Calming visual pulse */}
          {isPlaying && (
            <div className="flex items-center gap-1.5 h-5 mt-3">
              {[35, 60, 45, 80, 50, 70, 40, 85, 60, 40, 75, 55].map((h, i) => (
                <span
                  key={i}
                  className="w-1 bg-emerald-400/80 rounded-full animate-pulse"
                  style={{
                    height: `${h}%`,
                    animationDelay: `${(i * 0.12).toFixed(1)}s`,
                    animationDuration: '1.2s',
                  }}
                />
              ))}
            </div>
          )}

          {isFading && (
            <div className="mt-2.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              <span>{t.fadeActiveNotice} ({Math.round(fadeMultiplier * 100)}%)</span>
            </div>
          )}
        </div>

        {/* Big Touch Play/Pause */}
        <div className="relative z-10 w-full mt-2.5">
          <button
            onClick={() => {
              triggerHaptic(12);
              onTogglePlay();
            }}
            className={`w-full min-h-[54px] px-5 rounded-2xl flex items-center justify-center gap-2.5 font-semibold text-sm transition-all active:scale-95 touch-manipulation shadow-lg ${
              isPlaying
                ? 'bg-emerald-400 text-slate-950 hover:bg-emerald-300 shadow-emerald-400/25 ring-2 ring-emerald-300/40 font-bold'
                : 'bg-white/15 text-white hover:bg-white/25 border border-white/20'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>{t.stop}</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>{t.play}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3 Nature Sound Choices */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <h3 className="font-semibold tracking-wider text-white/70 uppercase">
            {t.selectionTitle}
          </h3>
          <span className="text-white/40">{t.selectionTip}</span>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {natureOptions.map((opt) => {
            const isSelected = activeNature === opt.id;
            const OptIcon = opt.icon;

            return (
              <button
                key={opt.id}
                onClick={() => {
                  triggerHaptic(8);
                  onSelectNature(opt.id);
                }}
                className={`text-left p-3.5 rounded-2xl border transition-all duration-200 active:scale-[0.98] touch-manipulation flex items-center justify-between gap-3 ${
                  isSelected
                    ? `bg-white/10 ${opt.gradient} ring-2 ring-emerald-400/50 shadow-md text-white`
                    : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/10 text-white/80'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-emerald-400 text-slate-950' : 'bg-white/10 text-white/80'
                    }`}
                  >
                    <OptIcon className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <h4 className="font-semibold text-sm text-white truncate">{opt.title}</h4>
                    <span className="text-[11px] text-white/60 block truncate">{opt.subtitle}</span>
                  </div>
                </div>

                {isSelected && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 shrink-0">
                    {t.selectedBadge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Nature Volume Control Bar */}
      <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 font-medium text-white/90">
            <Volume2 className="w-4 h-4 text-emerald-300" />
            <span>{t.volume}</span>
          </span>
          <span className="font-mono text-emerald-300 font-semibold">
            {Math.round(volume * 100)}%
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onChangeVolume(Math.max(0, volume - 0.1))}
            className="w-11 h-11 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center active:scale-95 touch-manipulation text-lg"
            aria-label="Znížiť hlasitosť"
          >
            -
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => onChangeVolume(parseFloat(e.target.value))}
            className="flex-1 accent-emerald-400 h-2 rounded-lg bg-white/20 cursor-pointer touch-manipulation"
          />
          <button
            onClick={() => onChangeVolume(Math.min(1, volume + 0.1))}
            className="w-11 h-11 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center active:scale-95 touch-manipulation text-lg"
            aria-label="Zvýšiť hlasitosť"
          >
            +
          </button>
        </div>
        <p className="text-[11px] text-white/50">
          {t.volumeTip}
        </p>
      </div>
    </div>
  );
};
