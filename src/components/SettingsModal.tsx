import React from 'react';
import { X, Globe, Sun, Flame, Eye, ChevronDown, Contrast, Feather, Baby, Cake, Smartphone } from 'lucide-react';
import { Language, NightModeState, ColorMode } from '../types';
import { translations } from '../i18n/translations';
import { triggerHaptic } from '../utils/haptics';
import { getPersonalizedCopy } from '../utils/babyName';
import { getChildAgeSummary, formatShortAge, getWakeWindowCopy } from '../utils/wakeWindow';
import { getLockScreenCopy } from '../services/lockScreenSleep';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onSelectLanguage: (lang: Language) => void;
  babyName: string;
  onChangeBabyName: (name: string) => void;
  babyBirthDate: string;
  onChangeBabyBirthDate: (dateStr: string) => void;
  lockScreenSleepEnabled: boolean;
  onToggleLockScreenSleep: (enabled: boolean) => void;
  nightMode: NightModeState;
  onUpdateNightMode: (updates: Partial<NightModeState>) => void;
  colorMode: ColorMode;
  onChangeColorMode: (mode: ColorMode) => void;
  hapticsEnabled?: boolean;
  onToggleHaptics?: (enabled: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  language,
  onSelectLanguage,
  babyName,
  onChangeBabyName,
  babyBirthDate,
  onChangeBabyBirthDate,
  lockScreenSleepEnabled,
  onToggleLockScreenSleep,
  nightMode,
  onUpdateNightMode,
  colorMode,
  onChangeColorMode,
}) => {
  if (!isOpen) return null;

  const t = translations[language];
  const personalized = getPersonalizedCopy(babyName, language);
  const wakeCopy = getWakeWindowCopy(language, babyName);
  const lockCopy = getLockScreenCopy(language);
  const ageSummary = getChildAgeSummary(babyBirthDate);
  const todayIsoDate = new Date().toISOString().split('T')[0];
  const isRtl = language === 'ar';

  const stateLabels: Record<Language, { on: string; off: string }> = {
    sk: { on: 'ZAPNUTÝ', off: 'VYPNUTÝ' },
    cs: { on: 'ZAPNUTO', off: 'VYPNUTO' },
    en: { on: 'ON', off: 'OFF' },
    pl: { on: 'WŁĄCZONY', off: 'WYŁĄCZONY' },
    hu: { on: 'BE', off: 'KI' },
    uk: { on: 'УВІМКНЕНО', off: 'ВИМКНЕНО' },
    it: { on: 'ATTIVO', off: 'DISATTIVO' },
    es: { on: 'ACTIVO', off: 'INACTIVO' },
    ro: { on: 'PORNIT', off: 'OPRIT' },
    ar: { on: 'مفعّل', off: 'متوقف' },
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
                {personalized?.settingsSubtitle ?? t.nightSettingsModal.subtitle}
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
              className={`w-full h-12 px-4 py-2 ${isRtl ? 'pl-10' : 'pr-10'} rounded-xl bg-slate-800 border border-white/20 text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 appearance-none cursor-pointer touch-manipulation`}
            >
              <option value="ar">🇸🇦 العربية (Arabic)</option>
              <option value="cs">🇨🇿 Čeština (Czech)</option>
              <option value="en">🇬🇧 English (English)</option>
              <option value="es">🇪🇸 Español (Spanish)</option>
              <option value="it">🇮🇹 Italiano (Italian)</option>
              <option value="hu">🇭🇺 Magyar (Hungarian)</option>
              <option value="pl">🇵🇱 Polski (Polish)</option>
              <option value="ro">🇷🇴 Română (Romanian)</option>
              <option value="sk">🇸🇰 Slovenčina (Slovak)</option>
              <option value="uk">🇺🇦 Українська (Ukrainian)</option>
            </select>
            <div className={`pointer-events-none absolute inset-y-0 ${isRtl ? 'left-3.5' : 'right-3.5'} flex items-center text-white/60`}>
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* 1.5. Baby Name Personalization */}
        <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="settings-baby-name" className="flex items-center gap-2 text-xs font-semibold text-white/85">
              <Baby className="w-4 h-4 text-rose-300 shrink-0" />
              <span>{t.nightSettingsModal.babyNameHeading}</span>
            </label>
            {babyName.trim().length > 0 && (
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-rose-400/20 text-rose-200 border border-rose-400/30 truncate max-w-[140px]">
                {babyName.trim()}
              </span>
            )}
          </div>

          <p className="text-xs text-white/60 leading-relaxed">
            {t.nightSettingsModal.babyNameDesc}
          </p>

          <div className="flex items-center gap-2 mt-0.5">
            <input
              id="settings-baby-name"
              type="text"
              value={babyName}
              onChange={(e) => onChangeBabyName(e.target.value)}
              placeholder={t.nightSettingsModal.babyNamePlaceholder}
              maxLength={24}
              className="flex-1 h-11 px-3.5 rounded-xl bg-slate-800 border border-white/20 text-white text-sm font-medium placeholder-white/35 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            {babyName.trim().length > 0 && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(6);
                  onChangeBabyName('');
                }}
                className="h-11 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white/75 text-xs font-semibold active:scale-95 transition-all shrink-0"
              >
                {t.nightSettingsModal.babyNameClear}
              </button>
            )}
          </div>

          {/* Child Birth Date for Optimal Wake Window Alerts */}
          <div className="pt-3 mt-1 border-t border-white/10 flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="settings-baby-birthdate" className="flex items-center gap-2 text-xs font-semibold text-white/85">
                <Cake className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>{wakeCopy.birthDateLabel}</span>
              </label>
              {ageSummary && (
                <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-amber-400/20 text-amber-200 border border-amber-400/30 shrink-0">
                  {formatShortAge(ageSummary, language)}
                </span>
              )}
            </div>

            <p className="text-[11px] text-white/55 leading-relaxed">
              {wakeCopy.birthDateHint}
            </p>

            <div className="flex items-center gap-2 mt-0.5">
              <input
                id="settings-baby-birthdate"
                type="date"
                value={babyBirthDate}
                max={todayIsoDate}
                onChange={(e) => onChangeBabyBirthDate(e.target.value)}
                className="flex-1 h-11 px-3.5 rounded-xl bg-slate-800 border border-white/20 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              {babyBirthDate && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(6);
                    onChangeBabyBirthDate('');
                  }}
                  className="h-11 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white/75 text-xs font-semibold active:scale-95 transition-all shrink-0"
                >
                  {wakeCopy.birthDateClear}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 1.8. Android Lock Screen Ongoing Sleep Display */}
        <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Smartphone className="w-4 h-4 text-indigo-300 shrink-0" />
              <span className="text-sm font-medium text-white leading-snug">
                {lockCopy.settingsHeading}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic(10);
                onToggleLockScreenSleep(!lockScreenSleepEnabled);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all touch-manipulation shrink-0 ${
                lockScreenSleepEnabled
                  ? 'bg-indigo-500 text-white shadow-lg ring-2 ring-indigo-400/50'
                  : 'bg-white/10 text-white/70'
              }`}
            >
              {lockScreenSleepEnabled ? toggleLabel.on : toggleLabel.off}
            </button>
          </div>
          <p className="text-xs text-white/60 leading-relaxed">
            {lockCopy.settingsDesc}
          </p>
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
            {personalized?.sunsetDetailDesc ?? t.nightSettingsModal.sunsetDetailDesc}
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

        {/* 2.5. App Color Mode: Color vs Lite vs Black & White */}
        <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Contrast className="w-4 h-4 text-indigo-300 shrink-0" />
              <span className="text-sm font-medium text-white truncate">
                {t.nightSettingsModal.colorModeHeading}
              </span>
            </div>
            <span
              className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium shrink-0 ${
                colorMode === 'grayscale'
                  ? 'bg-white/20 text-white border border-white/30'
                  : colorMode === 'lite'
                  ? 'bg-sky-400/20 text-sky-200 border border-sky-400/30'
                  : 'bg-indigo-400/20 text-indigo-200 border border-indigo-400/30'
              }`}
            >
              {colorMode === 'grayscale'
                ? t.nightSettingsModal.colorModeGrayscaleBadge
                : colorMode === 'lite'
                ? t.nightSettingsModal.colorModeLiteBadge
                : t.nightSettingsModal.colorModeColorBadge}
            </span>
          </div>

          <p className="text-xs text-white/60 leading-relaxed">
            {t.nightSettingsModal.colorModeDesc}
          </p>

          <div className="grid grid-cols-3 gap-2 mt-1">
            <button
              type="button"
              onClick={() => {
                triggerHaptic(10);
                onChangeColorMode('color');
              }}
              className={`py-2.5 px-2 rounded-xl text-xs font-semibold transition-all duration-300 touch-manipulation flex items-center justify-center gap-1.5 ${
                colorMode === 'color'
                  ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 shadow-lg shadow-amber-500/20 font-bold'
                  : 'bg-white/5 hover:bg-white/10 text-white/75 border border-white/10'
              }`}
            >
              <span className="w-3 h-3 rounded-full bg-gradient-to-tr from-amber-300 via-rose-400 to-indigo-500 ring-1 ring-black/20 shrink-0" />
              <span className="truncate">{t.nightSettingsModal.colorModeColor}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic(10);
                onChangeColorMode('lite');
              }}
              className={`py-2.5 px-2 rounded-xl text-xs font-semibold transition-all duration-300 touch-manipulation flex items-center justify-center gap-1.5 ${
                colorMode === 'lite'
                  ? 'bg-gradient-to-r from-sky-300 to-emerald-300 text-slate-950 shadow-lg shadow-sky-400/20 font-bold'
                  : 'bg-white/5 hover:bg-white/10 text-white/75 border border-white/10'
              }`}
            >
              <Feather className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{t.nightSettingsModal.colorModeLite}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic(10);
                onChangeColorMode('grayscale');
              }}
              className={`py-2.5 px-2 rounded-xl text-xs font-semibold transition-all duration-300 touch-manipulation flex items-center justify-center gap-1.5 ${
                colorMode === 'grayscale'
                  ? 'bg-gradient-to-r from-zinc-100 to-zinc-300 text-slate-950 shadow-lg shadow-white/15 font-bold'
                  : 'bg-white/5 hover:bg-white/10 text-white/75 border border-white/10'
              }`}
            >
              <span
                className="w-3 h-3 rounded-full border border-white/40 shrink-0"
                style={{ background: 'linear-gradient(90deg, #ffffff 50%, #1e293b 50%)' }}
              />
              <span className="truncate">{t.nightSettingsModal.colorModeGrayscale}</span>
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
