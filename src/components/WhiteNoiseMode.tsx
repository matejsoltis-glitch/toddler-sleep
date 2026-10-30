import React from 'react';
import { Play, Pause, Volume2, Wind, Waves, Heart, ArrowLeft } from 'lucide-react';
import { WhiteNoiseLevel, Language } from '../types';
import { translations } from '../i18n/translations';
import { triggerHaptic } from '../utils/haptics';

interface WhiteNoiseModeProps {
  language: Language;
  isPlaying: boolean;
  activeLevel: WhiteNoiseLevel;
  onSelectLevel: (level: WhiteNoiseLevel) => void;
  onTogglePlay: () => void;
  volume: number; // 0 to 1
  onChangeVolume: (vol: number) => void;
  isFading: boolean;
  fadeMultiplier: number;
}

export const WhiteNoiseMode: React.FC<WhiteNoiseModeProps> = ({
  language,
  isPlaying,
  activeLevel,
  onSelectLevel,
  onTogglePlay,
  volume,
  onChangeVolume,
  isFading,
  fadeMultiplier,
}) => {
  const t = translations[language].modes.whiteNoise;

  const levels: {
    id: WhiteNoiseLevel;
    title: string;
    levelNum: string;
    icon: typeof Wind;
    pitch: string;
    description: string;
    idealFor: string;
    frequencyInfo: string;
    gradient: string;
  }[] = [
    {
      id: 'gentle',
      title: t.levels.gentle.title,
      levelNum: t.levels.gentle.levelNum,
      icon: Wind,
      pitch: t.levels.gentle.pitch,
      description: t.levels.gentle.description,
      idealFor: t.levels.gentle.idealFor,
      frequencyInfo: t.levels.gentle.frequency,
      gradient: 'from-teal-500/20 to-sky-500/20 border-teal-400/40',
    },
    {
      id: 'balanced',
      title: t.levels.balanced.title,
      levelNum: t.levels.balanced.levelNum,
      icon: Waves,
      pitch: t.levels.balanced.pitch,
      description: t.levels.balanced.description,
      idealFor: t.levels.balanced.idealFor,
      frequencyInfo: t.levels.balanced.frequency,
      gradient: 'from-sky-500/20 to-indigo-500/20 border-sky-400/40',
    },
    {
      id: 'deep',
      title: t.levels.deep.title,
      levelNum: t.levels.deep.levelNum,
      icon: Heart,
      pitch: t.levels.deep.pitch,
      description: t.levels.deep.description,
      idealFor: t.levels.deep.idealFor,
      frequencyInfo: t.levels.deep.frequency,
      gradient: 'from-amber-500/20 to-orange-500/20 border-amber-400/40',
    },
  ];

  const currentLevelObj = levels.find((l) => l.id === activeLevel) || levels[0];
  const IconComponent = currentLevelObj.icon;

  return (
    <div className="flex flex-col gap-4 w-full max-w-md mx-auto">
      {/* Mode Header badge */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold tracking-wider text-sky-300/90 uppercase">
          {t.tabTitle}
        </span>
        <span className="text-[11px] text-white/40">
          {t.tabSubtitle}
        </span>
      </div>

      {/* Central Visual & Status Panel */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900/70 border border-white/10 p-5 sm:p-6 flex flex-col items-center justify-center text-center shadow-2xl backdrop-blur-md">
        {/* Soft background waveform animation */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
          <div
            className={`w-60 h-60 rounded-full border border-sky-400/30 transition-all duration-1000 ${
              isPlaying ? 'animate-ping' : 'scale-75'
            }`}
          />
        </div>

        {/* Central interactive orb */}
        <div className="relative z-10 flex flex-col items-center my-2">
          <div
            className={`w-28 h-28 rounded-3xl flex items-center justify-center border-2 transition-all duration-500 ${
              isPlaying
                ? 'bg-sky-500/20 border-sky-400 text-sky-200 shadow-[0_0_40px_rgba(56,189,248,0.35)] scale-100'
                : 'bg-white/5 border-white/10 text-white/40 scale-95'
            }`}
          >
            <IconComponent className={`w-12 h-12 ${isPlaying ? 'animate-pulse' : ''}`} />
          </div>

          <div className="mt-3.5">
            <span className="text-[11px] uppercase tracking-widest font-semibold text-sky-300">
              {currentLevelObj.levelNum} · {currentLevelObj.pitch}
            </span>
            <h3 className="text-xl sm:text-2xl font-light text-white tracking-wide mt-0.5">
              {currentLevelObj.title}
            </h3>
            <p className="text-xs text-white/60 max-w-xs mt-1">
              {currentLevelObj.description}
            </p>
          </div>

          {/* Sound animation waves */}
          {isPlaying && (
            <div className="flex items-center gap-1.5 h-5 mt-3">
              {[40, 75, 55, 90, 60, 80, 45, 95, 70, 50, 85, 65].map((h, i) => (
                <span
                  key={i}
                  className="w-1 bg-sky-400/80 rounded-full animate-pulse"
                  style={{
                    height: `${h}%`,
                    animationDelay: `${(i * 0.1).toFixed(1)}s`,
                    animationDuration: '0.8s',
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
                ? 'bg-sky-400 text-slate-950 hover:bg-sky-300 shadow-sky-400/25 ring-2 ring-sky-300/40 font-bold'
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

      {/* 3 Distinct Intensity Level Cards */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <h3 className="font-semibold tracking-wider text-white/70 uppercase">
            {t.levelsTitle}
          </h3>
          <span className="text-white/40">{t.levelsTip}</span>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {levels.map((lvl) => {
            const isSelected = activeLevel === lvl.id;
            const LvlIcon = lvl.icon;

            return (
              <button
                key={lvl.id}
                onClick={() => {
                  triggerHaptic(8);
                  onSelectLevel(lvl.id);
                }}
                className={`text-left p-3.5 rounded-2xl border transition-all duration-200 active:scale-[0.98] touch-manipulation flex items-center justify-between gap-3 ${
                  isSelected
                    ? `bg-white/10 ${lvl.gradient} ring-2 ring-sky-400/50 shadow-md text-white`
                    : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/10 text-white/80'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-sky-400 text-slate-950' : 'bg-white/10 text-white/80'
                    }`}
                  >
                    <LvlIcon className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-sky-300">
                        {lvl.levelNum}
                      </span>
                      <h4 className="font-semibold text-sm text-white truncate">{lvl.title}</h4>
                    </div>
                    <p className="text-[11px] text-white/60 truncate mt-0.5">
                      {lvl.idealFor}
                    </p>
                  </div>
                </div>

                {isSelected && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-400 text-slate-950 shrink-0">
                    {t.activeLevelBadge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Volume Control Bar */}
      <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 font-medium text-white/90">
            <Volume2 className="w-4 h-4 text-sky-300" />
            <span>{t.volume}</span>
          </span>
          <span className="font-mono text-sky-300 font-semibold">
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
            className="flex-1 accent-sky-400 h-2 rounded-lg bg-white/20 cursor-pointer touch-manipulation"
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
