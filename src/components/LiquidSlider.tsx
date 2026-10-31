import React, { useState, useRef } from 'react';
import { triggerHaptic } from '../utils/haptics';

interface LiquidSliderProps {
  label: string;
  icon: React.ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
  ariaLabel: string;
  compact?: boolean;
}

export const LiquidSlider: React.FC<LiquidSliderProps> = ({
  label,
  icon,
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  ariaLabel,
  compact = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  // Safe numeric normalization guaranteed never to be NaN or produce runtime exceptions
  const numMin = typeof min === 'number' && isFinite(min) ? min : 0;
  const numMax = typeof max === 'number' && isFinite(max) && max > numMin ? max : numMin + 1;
  const numValue =
    typeof value === 'number' && isFinite(value)
      ? Math.max(numMin, Math.min(numMax, value))
      : numMin;
  const range = numMax - numMin;
  const percentage = Math.max(0, Math.min(100, ((numValue - numMin) / range) * 100));

  return (
    <div className={`w-full flex flex-col ${compact ? 'gap-0.5' : 'gap-1'} select-none`}>
      {/* Slider Label Row: Icon + Label on left, Percentage value on right (30% more compact) */}
      <div className="flex items-center justify-between text-[11px] px-0.5">
        <span className="flex items-center gap-1.5 text-white/80 font-medium text-[11px]">
          {icon}
          <span className="tracking-wide text-slate-200">{label}</span>
        </span>
        <span className="font-mono text-[9px] text-white/50">
          {Math.round(percentage)}%
        </span>
      </div>

      {/* Interactive Liquid Slider Track (No Ball/Knob, sleek water ripple) */}
      <div
        ref={trackRef}
        className={`relative w-full ${compact ? 'h-4.5' : 'h-5.5'} flex items-center cursor-pointer touch-none group`}
      >
        {/* Visual Track Channel */}
        <div className={`relative w-full ${compact ? 'h-2' : 'h-2.5'} rounded-full bg-white/[0.08] border border-white/10 overflow-hidden shadow-inner`}>
          {/* Filled Liquid Water Container */}
          <div
            className="absolute top-0 bottom-0 left-0 overflow-hidden transition-[width] duration-75 ease-out rounded-full"
            style={{ width: `${percentage}%` }}
          >
            {/* Base liquid silver-gray gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-600/50 via-slate-400/60 to-slate-300/70" />

            {/* Moving Water Wave Layer 1 (Back wave, subtle darker gray) */}
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
                  fill="rgba(148, 163, 184, 0.75)"
                />
              </svg>
            </div>

            {/* Moving Water Wave Layer 2 (Front wave, bright silver water ripple) */}
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
                  fill="rgba(226, 232, 240, 0.85)"
                />
              </svg>
            </div>

            {/* Surface Shimmer */}
            <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/50 to-white/70" />
          </div>
        </div>

        {/* Real Accessible Range Input Overlay */}
        <input
          type="range"
          min={numMin}
          max={numMax}
          step={step}
          value={numValue}
          onChange={(e) => {
            try {
              const raw = e.target.value;
              const nextVal = step < 1 ? parseFloat(raw) : parseInt(raw, 10);
              if (!isNaN(nextVal) && isFinite(nextVal)) {
                onChange(nextVal);
              }
            } catch {
              // ignore
            }
            triggerHaptic(4);
          }}
          onPointerDown={() => {
            setIsDragging(true);
            triggerHaptic(6);
          }}
          onPointerUp={() => setIsDragging(false)}
          onPointerCancel={() => setIsDragging(false)}
          aria-label={ariaLabel}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 m-0 p-0"
        />
      </div>
    </div>
  );
};
