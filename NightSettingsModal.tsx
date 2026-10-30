import React from 'react';
import { X, Moon, Sun, Shield, Eye, Flame, Info } from 'lucide-react';
import { NightModeState } from '../types';

interface NightSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  nightMode: NightModeState;
  onUpdateNightMode: (updates: Partial<NightModeState>) => void;
}

export const NightSettingsModal: React.FC<NightSettingsModalProps> = ({
  isOpen,
  onClose,
  nightMode,
  onUpdateNightMode,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-3xl bg-slate-900 border border-white/20 p-6 flex flex-col gap-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-400/30">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Nočný režim a ochrana očí
              </h3>
              <p className="text-xs text-white/60">
                Šetrí zrak v tme a chráni hlboký spánok bábätka
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center active:scale-95 touch-manipulation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sunset Auto Mode */}
        <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-300" />
              <span className="text-sm font-medium text-white">
                Automaticky po západe slnka
              </span>
            </div>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                nightMode.isAfterSunset
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                  : 'bg-white/10 text-white/60'
              }`}
            >
              {nightMode.isAfterSunset ? 'Aktuálne: Po západe slnka' : 'Aktuálne: Deň'}
            </span>
          </div>

          <p className="text-xs text-white/60">
            Aplikácia po 18:00 hodine automaticky stlmí rozhranie, zníži kontrast a odstráni rušivé elementy, aby nerozptyľovala zaspávajúce dieťa.
          </p>

          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              onClick={() => onUpdateNightMode({ isAutoSunset: true, forceDark: false })}
              className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all touch-manipulation ${
                nightMode.isAutoSunset && !nightMode.forceDark
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'bg-white/5 hover:bg-white/10 text-white/70 border border-white/10'
              }`}
            >
              Automaticky (18:00 - 07:00)
            </button>
            <button
              onClick={() =>
                onUpdateNightMode({ isAutoSunset: false, forceDark: !nightMode.forceDark })
              }
              className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all touch-manipulation ${
                nightMode.forceDark
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'bg-white/5 hover:bg-white/10 text-white/70 border border-white/10'
              }`}
            >
              Vynútiť nočný režim
            </button>
          </div>
        </div>

        {/* Red Melatonin Filter (0% blue light) */}
        <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-400" />
              <span className="text-sm font-medium text-white">
                Ochranný červený nočný filter
              </span>
            </div>
            <button
              onClick={() => onUpdateNightMode({ redFilter: !nightMode.redFilter })}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all touch-manipulation ${
                nightMode.redFilter
                  ? 'bg-red-500 text-white shadow-lg ring-2 ring-red-400/50'
                  : 'bg-white/10 text-white/70'
              }`}
            >
              {nightMode.redFilter ? 'ZAPNUTÝ' : 'VYPNUTÝ'}
            </button>
          </div>
          <p className="text-xs text-white/60">
            Úplne eliminuje modré svetlo, ktoré zastavuje tvorbu melatonínu. Odporúčané pre nočné kŕmenie, prebaľovanie alebo kontrolu bábätka bez prerušenia spánkového rytmu.
          </p>
        </div>

        {/* Extra Screen Dimming Slider */}
        <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col gap-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-sky-300" />
              <span className="font-medium text-white">
                Extra nočné stlmenie obrazovky
              </span>
            </div>
            <span className="font-mono text-sky-300 font-semibold">
              {nightMode.screenDimPercent}%
            </span>
          </div>
          <p className="text-xs text-white/60">
            Pridá softvérové stmavenie cez celú obrazovku pre prípady, kedy je aj minimálny jas displeja v úplnej tme príliš silný.
          </p>

          <input
            type="range"
            min="0"
            max="75"
            step="5"
            value={nightMode.screenDimPercent}
            onChange={(e) =>
              onUpdateNightMode({ screenDimPercent: Number(e.target.value) })
            }
            className="w-full accent-amber-400 h-2.5 rounded-lg bg-white/20 cursor-pointer touch-manipulation"
          />
          <div className="flex justify-between text-[11px] text-white/40">
            <span>0% (Bez stmavenia)</span>
            <span>75% (Maximálne nočné tlmenie)</span>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full min-h-[50px] rounded-2xl bg-white text-slate-950 font-semibold text-sm hover:bg-white/90 active:scale-95 touch-manipulation shadow-lg"
        >
          Uložiť a zavrieť
        </button>
      </div>
    </div>
  );
};
