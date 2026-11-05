import React from 'react';
import { X, Globe, Moon, Sun, Flame, Eye, ChevronDown } from 'lucide-react';
import { Language, NightModeState } from '../types';
import { translations } from '../i18n/translations';
import { triggerHaptic } from '../utils/haptics';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onSelectLanguage: (lang: Language) => void;
  nightMode: NightModeState;
  onUpdateNightMode: (updates: Partial<NightModeState>) => void;
  hapticsEnabled?: boolean;
  onToggleHaptics?: (enabled: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  language,
  onSelectLanguage,
  nightMode,
  onUpdateNightMode,
}) => {
  if (!isOpen) return null;

  const t = translations[language];

  const stateLabels: Record<Language, { on: string; off: string }> = {
    sk: { on: 'ZAPNUTÝ', off: 'VYPNUTÝ' },
    cs: { on: 'ZAPNUTO', off: 'VYPNUTO' },
    en: { on: 'ON', off: 'OFF' },
    pl: { on: 'WŁĄCZONY', off: 'WYŁĄCZONY' },
    hu: { on: 'BE', off: 'KI' },
    uk: { on: 'УВІМКНЕНО', off: 'ВИМКНЕНО' },
    it: { on: 'ATTIVO', off: 'DISATTIVO' },
  };
  const toggleLabel = stateLabels[language] || stateLabels.en;



  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-slate-900 border border-white/20 p-5 sm:p-6 flex flex-col gap-4 shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-400/30">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-white">
                {t.nightSettingsModal.title}
              </h3>
              <p className="text-xs text-white/60">
                {t.nightSettingsModal.subtitle}
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

        {/* 1. Language Personalization via simplified dropdown menu */}
        <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col gap-2.5">
          <label htmlFor="language-dropdown" className="flex items-center gap-2 text-xs font-semibold text-white/80">
            <Globe className="w-4 h-4 text-amber-300" />
            <span>{t.selectLanguage}</span>
          </label>

          <div className="relative w-full">
            <select
              id="language-dropdown"
              value={language}
              onChange={(e) => onSelectLanguage(e.target.value as Language)}
              className="w-full h-12 px-4 py-2 pr-10 rounded-xl bg-slate-800 border border-white/20 text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 appearance-none cursor-pointer touch-manipulation"
            >
              <option value="cs">🇨🇿 Čeština (Czech)</option>
              <option value="en">🇬🇧 English (English)</option>
              <option value="it">🇮🇹 Italiano (Italian)</option>
              <option value="hu">🇭🇺 Magyar (Hungarian)</option>
              <option value="pl">🇵🇱 Polski (Polish)</option>
              <option value="sk">🇸🇰 Slovenčina (Slovak)</option>
              <option value="uk">🇺🇦 Українська (Ukrainian)</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-white/60">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* 2. Sunset & Night Mode Settings */}
        <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-300" />
              <span className="text-sm font-medium text-white">
                {t.nightSettingsModal.sunsetHeading}
              </span>
            </div>
            <span
              className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                nightMode.forceDark || (nightMode.isAutoSunset && nightMode.isAfterSunset)
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                  : 'bg-white/10 text-white/60'
              }`}
            >
              {nightMode.forceDark || (nightMode.isAutoSunset && nightMode.isAfterSunset)
                ? (nightMode.isAutoSunset ? t.nightSettingsModal.currentSunset : t.nightModeActive)
                : t.nightSettingsModal.currentDay}
            </span>
          </div>

          <p className="text-xs text-white/60 leading-relaxed">
            {language === 'sk'
              ? 'Nočný režim automaticky zníži jas (25%) a stlmí priehľadnosť prvkov (35%), aby svetlo neoslňovalo dieťatko v izbe. Denný režim vráti plný jas (85%) a 100% kontrast.'
              : language === 'cs'
              ? 'Noční režim automaticky sníží jas (25%) a ztlumí průhlednost prvků (35%), aby světlo neoslňovalo miminko. Denní režim vrátí plný jas (85%) a 100% kontrast.'
              : language === 'pl'
              ? 'Tryb nocny automatycznie zmniejsza jasność (25%) i przezroczystość (35%), chroniąc wzrok dziecka w ciemnym pokoju.'
              : language === 'hu'
              ? 'Az éjszakai mód automatikusan 25%-ra csökkenti a fényerőt és 35%-ra az átlátszóságot a nyugodt alvásért.'
              : language === 'uk'
              ? 'Нічний режим автоматично знижує яскравість (25%) та прозорість (35%), щоб світло не заважало дитині спати.'
              : language === 'it'
              ? 'La modalità notte riduce automaticamente luminosità (25%) e trasparenza (35%) per non abbagliare il bambino.'
              : 'Night mode automatically dims brightness (25%) and softens components opacity (35%) for undisturbed sleep.'}
          </p>

          <div className="grid grid-cols-3 gap-2 mt-1">
            <button
              onClick={() => {
                triggerHaptic(8);
                onUpdateNightMode({ isAutoSunset: false, forceDark: false });
              }}
              className={`py-2.5 px-1.5 rounded-xl text-xs font-semibold transition-all touch-manipulation text-center ${
                !nightMode.forceDark && !nightMode.isAutoSunset
                  ? 'bg-amber-400 text-slate-950 shadow-md font-bold'
                  : 'bg-white/5 hover:bg-white/10 text-white/70 border border-white/10'
              }`}
            >
              {t.dayActive}
            </button>
            <button
              onClick={() => {
                triggerHaptic(8);
                onUpdateNightMode({ isAutoSunset: false, forceDark: true });
              }}
              className={`py-2.5 px-1.5 rounded-xl text-xs font-semibold transition-all touch-manipulation text-center ${
                nightMode.forceDark && !nightMode.isAutoSunset
                  ? 'bg-amber-400 text-slate-950 shadow-md font-bold'
                  : 'bg-white/5 hover:bg-white/10 text-white/70 border border-white/10'
              }`}
            >
              {t.nightMode}
            </button>
            <button
              onClick={() => {
                triggerHaptic(8);
                onUpdateNightMode({ isAutoSunset: true, forceDark: false });
              }}
              className={`py-2.5 px-1.5 rounded-xl text-xs font-semibold transition-all touch-manipulation text-center ${
                nightMode.isAutoSunset
                  ? 'bg-amber-400 text-slate-950 shadow-md font-bold'
                  : 'bg-white/5 hover:bg-white/10 text-white/70 border border-white/10'
              }`}
            >
              {t.nightSettingsModal.autoSunsetBtn}
            </button>
          </div>
        </div>

        {/* 3. Red Melatonin Filter */}
        <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-400" />
              <span className="text-sm font-medium text-white">
                {t.nightSettingsModal.redFilterHeading}
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
              {nightMode.redFilter ? toggleLabel.on : toggleLabel.off}
            </button>
          </div>
          <p className="text-xs text-white/60">
            {t.nightSettingsModal.redFilterDesc}
          </p>
        </div>

        {/* 4. Extra Screen Dimming for Mobile in Complete Darkness */}
        <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-sky-300" />
              <span className="font-medium text-white">
                {t.nightSettingsModal.dimHeading}
              </span>
            </div>
            <span className="font-mono text-sky-300 font-semibold">
              {nightMode.screenDimPercent}%
            </span>
          </div>
          <p className="text-xs text-white/60">
            {t.nightSettingsModal.dimDesc}
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
          <div className="flex justify-between text-[10px] text-white/40">
            <span>{t.nightSettingsModal.dimZero}</span>
            <span>{t.nightSettingsModal.dimMax}</span>
          </div>
        </div>



        {/* Save & Close Button */}
        <button
          onClick={() => {
            triggerHaptic(10);
            onClose();
          }}
          className="w-full min-h-[50px] rounded-2xl bg-white text-slate-950 font-semibold text-sm hover:bg-white/90 active:scale-95 touch-manipulation shadow-lg mt-1"
        >
          {t.nightSettingsModal.saveClose}
        </button>
      </div>
    </div>
  );
};
