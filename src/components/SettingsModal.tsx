import React from 'react';
import { X, Globe, Moon, Sun, Flame, Eye, ChevronDown, Smartphone } from 'lucide-react';
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
  hapticsEnabled: boolean;
  onToggleHaptics: (enabled: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  language,
  onSelectLanguage,
  nightMode,
  onUpdateNightMode,
  hapticsEnabled,
  onToggleHaptics,
}) => {
  if (!isOpen) return null;

  const t = translations[language];

  const hapticLabels: Record<Language, { title: string; desc: string; on: string; off: string }> = {
    sk: {
      title: 'Haptická odozva (vibrácie)',
      desc: 'Jemné potvrdenie dotyku pri stlačení tlačidiel a kariet módov.',
      on: 'ZAPNUTÁ',
      off: 'VYPNUTÁ',
    },
    cs: {
      title: 'Haptická odezva (vibrace)',
      desc: 'Jemné potvrzení dotyku při stisku tlačítek a karet módů.',
      on: 'ZAPNUTO',
      off: 'VYPNUTO',
    },
    en: {
      title: 'Haptic Feedback (Vibration)',
      desc: 'Gentle touch confirmation when tapping buttons and mode cards.',
      on: 'ON',
      off: 'OFF',
    },
    pl: {
      title: 'Wibracje i haptyka',
      desc: 'Delikatne potwierdzenie dotyku przycisków i kart trybów.',
      on: 'WŁĄCZONE',
      off: 'WYŁĄCZONE',
    },
    hu: {
      title: 'Haptikus visszajelzés (rezgés)',
      desc: 'Finom rezgés gombok és üzemmódkártyák érintésekor.',
      on: 'BE',
      off: 'KI',
    },
    uk: {
      title: 'Тактильний відгук (вібрація)',
      desc: 'Легка вібрація при натисканні на кнопки та картки режимів.',
      on: 'УВІМКНЕНО',
      off: 'ВИМКНЕНО',
    },
    it: {
      title: 'Feedback aptico (vibrazione)',
      desc: 'Leggera vibrazione al tocco di pulsanti e schede modalità.',
      on: 'ATTIVO',
      off: 'DISATTIVO',
    },
  };

  const hapticText = hapticLabels[language] || hapticLabels.en;

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
          <label htmlFor="language-dropdown" className="flex items-center justify-between text-xs font-semibold text-white/80">
            <span className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-amber-300" />
              <span>{t.selectLanguage}</span>
            </span>
            <span className="text-white/40 text-[11px] font-normal">7 jazykov / 7 languages</span>
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
                nightMode.isAfterSunset
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                  : 'bg-white/10 text-white/60'
              }`}
            >
              {nightMode.isAfterSunset
                ? t.nightSettingsModal.currentSunset
                : t.nightSettingsModal.currentDay}
            </span>
          </div>

          <p className="text-xs text-white/60">
            {t.nightSettingsModal.sunsetDesc}
          </p>

          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              onClick={() => onUpdateNightMode({ isAutoSunset: true, forceDark: false })}
              className={`py-2.5 px-2 rounded-xl text-xs font-semibold transition-all touch-manipulation text-center ${
                nightMode.isAutoSunset && !nightMode.forceDark
                  ? 'bg-amber-400 text-slate-950 shadow-md font-bold'
                  : 'bg-white/5 hover:bg-white/10 text-white/70 border border-white/10'
              }`}
            >
              {t.nightSettingsModal.autoSunsetBtn}
            </button>
            <button
              onClick={() =>
                onUpdateNightMode({ isAutoSunset: false, forceDark: !nightMode.forceDark })
              }
              className={`py-2.5 px-2 rounded-xl text-xs font-semibold transition-all touch-manipulation text-center ${
                nightMode.forceDark
                  ? 'bg-amber-400 text-slate-950 shadow-md font-bold'
                  : 'bg-white/5 hover:bg-white/10 text-white/70 border border-white/10'
              }`}
            >
              {t.nightSettingsModal.forceNightBtn}
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
              {nightMode.redFilter ? 'ZAPNUTÝ' : 'VYPNUTÝ'}
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

        {/* 5. Haptic Feedback (Vibration) Toggle */}
        <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-300" />
              <span className="text-sm font-medium text-white">
                {hapticText.title}
              </span>
            </div>
            <button
              onClick={() => {
                const next = !hapticsEnabled;
                if (next) triggerHaptic(14);
                onToggleHaptics(next);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all touch-manipulation ${
                hapticsEnabled
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md ring-2 ring-emerald-400/40'
                  : 'bg-white/10 text-white/70'
              }`}
            >
              {hapticsEnabled ? hapticText.on : hapticText.off}
            </button>
          </div>
          <p className="text-xs text-white/60">
            {hapticText.desc}
          </p>
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
