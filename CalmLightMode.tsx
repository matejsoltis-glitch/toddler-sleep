import React, { useState, useEffect } from 'react';
import { SunMedium, Maximize2, Sparkles, Check, Play, Pause, RefreshCw, ArrowLeft } from 'lucide-react';
import { getPalettes } from '../constants/palettes';
import { LightPalette, LightSpeed, Language } from '../types';
import { translations } from '../i18n/translations';
import { triggerHaptic } from '../utils/haptics';

interface CalmLightModeProps {
  language: Language;
  isLightOn: boolean;
  onToggleLight: () => void;
  selectedPalette: LightPalette;
  onSelectPalette: (palette: LightPalette) => void;
  speed: LightSpeed;
  onSelectSpeed: (speed: LightSpeed) => void;
  brightness: number; // 10 to 100
  onChangeBrightness: (b: number) => void;
  onOpenFullScreen: () => void;
  colorIndex?: number;
}

export const CalmLightMode: React.FC<CalmLightModeProps> = ({
  language,
  isLightOn,
  onToggleLight,
  selectedPalette,
  onSelectPalette,
  speed,
  onSelectSpeed,
  brightness,
  onChangeBrightness,
  onOpenFullScreen,
  colorIndex: externalColorIndex,
}) => {
  const [internalColorIndex, setInternalColorIndex] = useState(0);
  const t = translations[language].modes.light;
  const palettes = getPalettes(language);

  // Speed timings in milliseconds
  const speedDurations: Record<LightSpeed, number> = {
    'very-slow': 16000,
    slow: 9000,
    medium: 5000,
    breathing: 6000,
  };

  useEffect(() => {
    if (!isLightOn || externalColorIndex !== undefined) return;
    const interval = setInterval(() => {
      setInternalColorIndex((prev) => (prev + 1) % selectedPalette.colors.length);
    }, speedDurations[speed]);
    return () => clearInterval(interval);
  }, [isLightOn, speed, selectedPalette, externalColorIndex]);

  const activeIdx = externalColorIndex !== undefined ? externalColorIndex : internalColorIndex;
  const currentColor = selectedPalette.colors[activeIdx % selectedPalette.colors.length];

  return (
    <div className="flex flex-col gap-4 w-full max-w-md mx-auto">
      {/* Mode Header badge */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold tracking-wider text-amber-300/90 uppercase">
          {t.tabTitle}
        </span>
        <span className="text-[11px] text-white/40">
          {t.tabSubtitle}
        </span>
      </div>

      {/* Visual Glowing Sphere / Night Light Preview */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900/70 border border-white/10 p-5 sm:p-6 flex flex-col items-center justify-center text-center shadow-2xl backdrop-blur-md">
        {/* Ambient background glow */}
        <div
          className="absolute inset-0 pointer-events-none transition-colors duration-[3500ms] ease-in-out opacity-35 blur-3xl"
          style={{
            background: isLightOn
              ? `radial-gradient(circle at center, ${currentColor} 0%, transparent 70%)`
              : 'transparent',
          }}
        />

        {/* Central glowing light disc */}
        <div className="relative z-10 flex flex-col items-center my-2">
          <div
            className={`w-36 h-36 rounded-full shadow-2xl transition-all duration-[3000ms] ease-in-out flex items-center justify-center border-4 border-white/20 ${
              isLightOn ? 'scale-100' : 'scale-90 opacity-30 grayscale'
            } ${speed === 'breathing' && isLightOn ? 'animate-pulse' : ''}`}
            style={{
              backgroundColor: isLightOn ? currentColor : '#334155',
              boxShadow: isLightOn
                ? `0 0 60px ${currentColor}99, inset 0 0 25px #ffffff66`
                : 'none',
              filter: `brightness(${brightness / 100})`,
            }}
          >
            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 text-white drop-shadow">
              <Sparkles className="w-7 h-7 text-white/90 animate-spin-slow" />
            </div>
          </div>

          <div className="mt-4 text-center">
            <h3 className="text-lg font-medium text-white tracking-wide">
              {isLightOn ? selectedPalette.name : t.turnOff}
            </h3>
            <p className="text-xs text-white/60 max-w-xs mt-1">
              {isLightOn ? selectedPalette.description : t.lightOffDesc}
            </p>
          </div>
        </div>

        {/* Big Touch Action Controls */}
        <div className="relative z-10 flex items-center justify-center gap-2.5 mt-3 w-full">
          <button
            onClick={() => {
              triggerHaptic(12);
              onToggleLight();
            }}
            className={`flex-1 min-h-[52px] px-4 rounded-2xl flex items-center justify-center gap-2 font-semibold text-sm transition-all active:scale-95 touch-manipulation shadow-lg ${
              isLightOn
                ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-amber-400/20'
                : 'bg-white/15 text-white hover:bg-white/25 border border-white/20'
            }`}
          >
            {isLightOn ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>{t.turnOff}</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>{t.turnOn}</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              triggerHaptic(10);
              onOpenFullScreen();
            }}
            disabled={!isLightOn}
            title={t.fullScreen}
            className="min-h-[52px] px-3.5 rounded-2xl bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white border border-white/15 flex items-center justify-center gap-1.5 text-xs font-medium transition-all active:scale-95 touch-manipulation"
          >
            <Maximize2 className="w-4 h-4" />
            <span>{t.fullScreen}</span>
          </button>
        </div>
      </div>

      {/* Brightness & Speed Settings */}
      <div className="grid grid-cols-1 gap-3">
        {/* Brightness control */}
        <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-white/90">
              <SunMedium className="w-4 h-4 text-amber-300" />
              <span>{t.brightness}</span>
            </span>
            <span className="font-mono text-amber-300 font-semibold">{brightness}%</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onChangeBrightness(Math.max(10, brightness - 10))}
              className="w-11 h-11 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center active:scale-95 touch-manipulation text-lg"
              aria-label="Znížiť jas"
            >
              -
            </button>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={brightness}
              onChange={(e) => onChangeBrightness(Number(e.target.value))}
              className="flex-1 accent-amber-400 h-2 rounded-lg bg-white/20 cursor-pointer touch-manipulation"
            />
            <button
              onClick={() => onChangeBrightness(Math.min(100, brightness + 10))}
              className="w-11 h-11 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center active:scale-95 touch-manipulation text-lg"
              aria-label="Zvýšiť jas"
            >
              +
            </button>
          </div>
        </div>

        {/* Speed of transition */}
        <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-white/90">
              <RefreshCw className="w-4 h-4 text-sky-300" />
              <span>{t.speed}</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {(
              [
                { id: 'very-slow', label: t.speeds.verySlow },
                { id: 'slow', label: t.speeds.slow },
                { id: 'medium', label: t.speeds.medium },
                { id: 'breathing', label: t.speeds.breathing },
              ] as const
            ).map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  triggerHaptic(8);
                  onSelectSpeed(s.id);
                }}
                className={`py-2.5 px-2 rounded-xl text-center font-medium transition-all active:scale-95 touch-manipulation ${
                  speed === s.id
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-md'
                    : 'bg-white/5 hover:bg-white/10 text-white/70 border border-white/10'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Palette Selection List */}
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold tracking-wider text-white/70 uppercase">
          {t.palettesTitle}
        </h3>

        <div className="grid grid-cols-1 gap-2">
          {palettes.map((palette) => {
            const isSelected = selectedPalette.id === palette.id;
            return (
              <button
                key={palette.id}
                onClick={() => {
                  triggerHaptic(8);
                  onSelectPalette(palette);
                }}
                className={`text-left p-3.5 rounded-2xl border transition-all duration-200 active:scale-[0.98] touch-manipulation flex flex-col gap-2 ${
                  isSelected
                    ? 'bg-white/10 border-amber-400/80 ring-1 ring-amber-400/50 text-white shadow-md'
                    : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/10 text-white/80'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold text-xs text-white truncate">
                    {palette.name}
                  </span>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* Color swatches strip */}
                <div className="flex items-center h-2.5 w-full rounded-full overflow-hidden shadow-inner">
                  {palette.colors.map((c, i) => (
                    <div
                      key={i}
                      className="flex-1 h-full"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-[11px] text-white/50">
                  <span className="truncate">{palette.mood}</span>
                  <span className="text-[10px] text-amber-200/70 font-mono">
                    {palette.colors.length} {t.shadesCount}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
