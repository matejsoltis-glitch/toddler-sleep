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
}

export const LiquidSlider: React.FC<LiquidSliderProps> = ({
  label,
  icon,
  value,
  min,
  max,
  step,
  onChange,
  ariaLabel,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  // Normalize percentage from min to max strictly between 0 and 100
  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  // Thumb radius in pixels
  const thumbRadius = 10; // for 20px diameter thumb

  return (
    <div className="w-full flex flex-col gap-1.5 select-none">
      {/* Slider Label: Strictly single-word label with icon (percentage deleted) */}
      <div className="flex items-center text-xs px-0.5">
        <span className="flex items-center gap-2 text-white/80 font-medium text-xs">
          {icon}
          <span className="tracking-wide text-slate-200">{label}</span>
        </span>
      </div>

      {/* Interactive Liquid Slider Track */}
      <div
        ref={trackRef}
        className="relative w-full h-7 flex items-center cursor-pointer touch-none group"
      >
        {/* Visual Track Channel */}
        <div className="relative w-full h-3.5 rounded-full bg-white/[0.08] border border-white/10 overflow-hidden shadow-inner">
          {/* Filled Liquid Water Container */}
          <div
            className="absolute top-0 bottom-0 left-0 overflow-hidden transition-[width] duration-75 ease-out rounded-l-full"
            style={{
              width:
                percentage === 0
                  ? '0%'
                  : `calc(${thumbRadius}px + ${(percentage / 100)} * (100% - ${thumbRadius * 2}px))`,
            }}
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

        {/* Sleek Silver Circular Handle (Ball) - Exactly aligned */}
        <div
          className={`absolute top-1/2 w-5 h-5 rounded-full bg-slate-100 border border-white/80 shadow-[0_2px_8px_rgba(0,0,0,0.5)] pointer-events-none transition-transform duration-100 -translate-y-1/2 flex items-center justify-center ${
            isDragging ? 'scale-110 shadow-[0_0_12px_rgba(255,255,255,0.4)]' : ''
          }`}
          style={{
            left: `calc(${thumbRadius}px + ${(percentage / 100)} * (100% - ${thumbRadius * 2}px))`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Subtle center tactile pip */}
          <div className="w-1.5 h-1.5 rounded-full bg-slate-400/60" />
        </div>

        {/* Real Accessible Range Input Overlay */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            const nextVal = step < 1 ? parseFloat(e.target.value) : parseInt(e.target.value, 10);
            onChange(nextVal);
            triggerHaptic(5);
          }}
          onPointerDown={() => {
            setIsDragging(true);
            triggerHaptic(8);
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
