import React, { useState, useRef } from 'react';
import { Unlock, ShieldAlert } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../i18n/translations';

interface TouchLockOverlayProps {
  language: Language;
  isLocked: boolean;
  onUnlock: () => void;
}

export const TouchLockOverlay: React.FC<TouchLockOverlayProps> = ({
  language,
  isLocked,
  onUnlock,
}) => {
  const [holdProgress, setHoldProgress] = useState(0); // 0 to 100
  const timerRef = useRef<number | null>(null);
  const t = translations[language];

  if (!isLocked) return null;

  const startHold = () => {
    let progress = 0;
    setHoldProgress(0);
    const interval = window.setInterval(() => {
      progress += 5; // ~20 ticks to 100 => 1000ms
      setHoldProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        timerRef.current = null;
        onUnlock();
      }
    }, 50);
    timerRef.current = interval;
  };

  const endHold = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setHoldProgress(0);
  };

  return (
    <div
      className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 select-none touch-manipulation"
      onPointerDown={(e) => {
        e.stopPropagation();
      }}
    >
      <div className="p-6 rounded-3xl bg-slate-950/90 border border-amber-400/50 flex flex-col items-center text-center shadow-2xl max-w-xs w-full">
        <div className="w-14 h-14 rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center justify-center mb-3">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <h3 className="text-lg font-bold text-white tracking-wide">
          {t.touchLocked}
        </h3>
        <p className="text-xs text-white/70 mt-1 leading-relaxed">
          {t.touchLockSubtitle}
        </p>

        {/* Hold to unlock button */}
        <div className="relative mt-5 w-full">
          <button
            onPointerDown={startHold}
            onPointerUp={endHold}
            onPointerLeave={endHold}
            onTouchStart={startHold}
            onTouchEnd={endHold}
            className="w-full min-h-[52px] rounded-2xl bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 touch-manipulation relative overflow-hidden shadow-lg select-none"
          >
            {/* Hold progress bar */}
            <div
              className="absolute left-0 top-0 bottom-0 bg-amber-300 transition-all duration-75"
              style={{ width: `${holdProgress}%` }}
            />
            <span className="relative z-10 flex items-center gap-1.5">
              <Unlock className="w-3.5 h-3.5" />
              {holdProgress > 0 ? `${t.unlockingProgress} (${holdProgress}%)` : t.touchLockHoldInstruction}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
