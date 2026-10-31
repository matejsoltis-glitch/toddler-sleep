import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Plus, X, Palette, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { Language } from '../types';
import { translations } from '../i18n/translations';

interface ColorWheelPickerProps {
  colors: string[];
  onChangeColors: (newColors: string[]) => void;
  language: Language;
}

// Helper: HSL to HEX string
function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Helper: HEX to HSL
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map((char) => char + char).join('');
  }
  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h = Math.round(h * 60);
  }
  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

// Curated baby-soothing quick palette presets
const QUICK_BABY_PRESETS = [
  '#f97316', // Sunset orange
  '#ea580c', // Deep amber
  '#eab308', // Honey yellow
  '#f43f5e', // Warm rose
  '#ec4899', // Gentle pink
  '#a855f7', // Lavender
  '#6366f1', // Twilight indigo
  '#06b6d4', // Cyan
  '#10b981', // Forest green
  '#dc2626', // Red
];

export const ColorWheelPicker: React.FC<ColorWheelPickerProps> = ({
  colors,
  onChangeColors,
  language,
}) => {
  const t = translations[language].modes.light;
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);
  const wheelContainerRef = useRef<HTMLDivElement>(null);

  // Active color parsed
  const activeColor = colors[selectedSlotIndex] || colors[0] || '#f97316';
  const initialHsl = hexToHsl(activeColor);
  const [hue, setHue] = useState(initialHsl.h);
  const [sat, setSat] = useState(initialHsl.s);
  const [lightness, setLightness] = useState(Math.max(30, Math.min(75, initialHsl.l)));

  // Sync state when slot changes or external colors update
  useEffect(() => {
    const hsl = hexToHsl(activeColor);
    setHue(hsl.h);
    setSat(hsl.s);
    setLightness(Math.max(30, Math.min(75, hsl.l)));
  }, [selectedSlotIndex, activeColor]);

  // Update active slot color
  const commitColor = useCallback(
    (newHex: string) => {
      const updated = [...colors];
      updated[selectedSlotIndex] = newHex;
      onChangeColors(updated);
    },
    [colors, selectedSlotIndex, onChangeColors]
  );

  // Handle pointer tracking on the responsive color wheel
  const handlePointerInteraction = useCallback(
    (clientX: number, clientY: number) => {
      const container = wheelContainerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const radius = rect.width / 2;
      const cx = rect.left + radius;
      const cy = rect.top + radius;

      const dx = clientX - cx;
      const dy = clientY - cy;
      const dist = Math.hypot(dx, dy);

      let angle = Math.atan2(dy, dx) * (180 / Math.PI);
      if (angle < 0) angle += 360;

      const newSat = Math.min(100, Math.round((Math.min(dist, radius) / radius) * 100));
      const newHue = Math.round(angle);

      setHue(newHue);
      setSat(newSat);

      const newHex = hslToHex(newHue, newSat, lightness);
      commitColor(newHex);
      triggerHaptic(4);
    },
    [lightness, commitColor]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsInteracting(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    handlePointerInteraction(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isInteracting) return;
    handlePointerInteraction(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsInteracting(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    triggerHaptic(8);
  };

  // Add new color slot (max 6)
  const handleAddSlot = () => {
    if (colors.length >= 6) return;
    const nextPreset = QUICK_BABY_PRESETS.find((p) => !colors.includes(p)) || hslToHex((hue + 45) % 360, 80, 50);
    const updated = [...colors, nextPreset];
    onChangeColors(updated);
    setSelectedSlotIndex(updated.length - 1);
    triggerHaptic(10);
  };

  // Remove slot (min 2)
  const handleRemoveSlot = (indexToRemove: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (colors.length <= 2) return;
    const updated = colors.filter((_, idx) => idx !== indexToRemove);
    onChangeColors(updated);
    if (selectedSlotIndex >= updated.length) {
      setSelectedSlotIndex(updated.length - 1);
    }
    triggerHaptic(10);
  };

  // Quick preset tap
  const handleSelectPreset = (presetHex: string) => {
    const hsl = hexToHsl(presetHex);
    setHue(hsl.h);
    setSat(hsl.s);
    setLightness(Math.max(30, Math.min(75, hsl.l)));
    commitColor(presetHex);
    triggerHaptic(8);
  };

  // Percentage-based marker calculation (0-100% inside container, always centered and responsive)
  const markerDistancePercent = (sat / 100) * 46; // keeps thumb safely inside the circle edge
  const markerRad = (hue * Math.PI) / 180;
  const markerLeftPercent = 50 + markerDistancePercent * Math.cos(markerRad);
  const markerTopPercent = 50 + markerDistancePercent * Math.sin(markerRad);

  return (
    <div className="flex flex-col gap-3 p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 shadow-lg select-none">
      {/* Title & Slot Counter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
          <Palette className="w-3.5 h-3.5" />
          <span>{t.customColorsTitle || 'Vlastné farby spektra'}</span>
        </div>
        <span className="text-[10px] font-mono text-white/50">
          {colors.length} / 6 ({t.shadesCount || 'odtieňov'})
        </span>
      </div>

      {/* Swatches Slots (2 to 6 colors) */}
      <div className="flex items-center gap-2 flex-wrap justify-center py-1">
        {colors.map((c, idx) => {
          const isSelected = idx === selectedSlotIndex;
          return (
            <div
              key={idx}
              onClick={() => {
                setSelectedSlotIndex(idx);
                triggerHaptic(6);
              }}
              className="relative group cursor-pointer"
            >
              <div
                className={`w-9 h-9 rounded-full border-2 transition-all flex items-center justify-center shadow-md active:scale-95 ${
                  isSelected
                    ? 'border-white scale-110 ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-950'
                    : 'border-white/30 hover:border-white/60'
                }`}
                style={{ backgroundColor: c }}
              >
                {isSelected && (
                  <Sparkles className="w-3.5 h-3.5 text-white drop-shadow stroke-[2.5]" />
                )}
              </div>

              {/* Remove (X) button: only if more than 2 colors */}
              {colors.length > 2 && (
                <button
                  onClick={(e) => handleRemoveSlot(idx, e)}
                  title={t.removeColor || 'Odstrániť'}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-slate-800 text-slate-200 border border-white/30 hover:bg-rose-600 hover:text-white flex items-center justify-center text-[10px] shadow"
                  aria-label="Odstrániť farbu"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          );
        })}

        {/* Add Color Button (up to 6) */}
        {colors.length < 6 && (
          <button
            onClick={handleAddSlot}
            title={t.addColor || 'Pridať farbu'}
            className="w-9 h-9 rounded-full border border-dashed border-white/30 hover:border-amber-400/80 hover:bg-white/5 text-white/60 hover:text-amber-300 flex items-center justify-center transition-all active:scale-95 shadow-sm"
            aria-label="Pridať farbu do spektra"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Interactive Color Wheel (Pure Hardware-Accelerated Vector Gradients - 100% responsive, never misaligned) */}
      <div className="flex flex-col items-center justify-center py-2">
        <div
          ref={wheelContainerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative w-44 h-44 sm:w-48 sm:h-48 max-w-[210px] aspect-square rounded-full shadow-2xl cursor-crosshair touch-none border-2 border-white/30 overflow-visible select-none"
          style={{
            background: `
              radial-gradient(circle at 50% 50%, #ffffff 0%, rgba(255, 255, 255, 0.75) 18%, transparent 100%),
              conic-gradient(from 90deg at 50% 50%, 
                #ff0000 0deg, 
                #ffff00 60deg, 
                #00ff00 120deg, 
                #00ffff 180deg, 
                #0000ff 240deg, 
                #ff00ff 300deg, 
                #ff0000 360deg
              )
            `,
          }}
        >
          {/* Pointer Target Indicator Thumb */}
          <div
            className="absolute w-6 h-6 rounded-full border-2 border-white shadow-2xl pointer-events-none transition-transform duration-75"
            style={{
              left: `${markerLeftPercent}%`,
              top: `${markerTopPercent}%`,
              transform: 'translate(-50%, -50%)',
              backgroundColor: activeColor,
              boxShadow: `0 0 12px rgba(0,0,0,0.7), inset 0 0 4px rgba(255,255,255,0.9)`,
            }}
          />
        </div>

        <p className="text-[10px] text-white/40 mt-2 text-center">
          {t.pickColorOnWheel || 'Dotknite sa alebo potiahnite po koliesku pre výber odtieňa'}
        </p>
      </div>

      {/* Lightness / Softness Adjuster */}
      <div className="flex flex-col gap-1 px-1">
        <div className="flex items-center justify-between text-[11px] text-white/70">
          <span>{language === 'sk' ? 'Svetlosť / Jemnosť' : 'Softness / Lightness'}</span>
          <span className="font-mono text-[10px] text-amber-300">{lightness}%</span>
        </div>
        <input
          type="range"
          min="25"
          max="75"
          step="1"
          value={lightness}
          onChange={(e) => {
            const newL = parseInt(e.target.value, 10);
            setLightness(newL);
            const newHex = hslToHex(hue, sat, newL);
            commitColor(newHex);
          }}
          className="w-full accent-amber-400 h-2 rounded-full cursor-pointer touch-none bg-white/20"
        />
      </div>

      {/* Quick curated baby-friendly presets */}
      <div className="flex flex-col gap-1.5 pt-1">
        <span className="text-[10px] text-white/50 px-1">
          {language === 'sk' ? 'Rýchle upokojujúce tóny' : 'Quick soothing shades'}
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none px-0.5">
          {QUICK_BABY_PRESETS.map((preset) => (
            <button
              key={preset}
              onClick={() => handleSelectPreset(preset)}
              className="w-6 h-6 rounded-full border border-white/20 shrink-0 hover:scale-110 active:scale-95 transition-transform"
              style={{ backgroundColor: preset }}
              title={preset}
              aria-label={`Vybrať farbu ${preset}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
