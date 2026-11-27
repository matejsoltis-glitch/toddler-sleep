import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Globe,
  Sun,
  Flame,
  Eye,
  ChevronDown,
  Contrast,
  Feather,
  Baby,
  Cake,
  Smartphone,
  HardDriveDownload,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  Bell,
} from 'lucide-react';
import { Language, NightModeState, ColorMode } from '../types';
import { translations } from '../i18n/translations';
import { triggerHaptic } from '../utils/haptics';
import { getPersonalizedCopy } from '../utils/babyName';
import { getChildAgeSummary, formatShortAge, getWakeWindowCopy } from '../utils/wakeWindow';
import { getLockScreenCopy } from '../services/lockScreenSleep';
import {
  WAKE_REMINDER_LEAD_OPTIONS,
  WakeReminderLeadMins,
  getWakeReminderCopy,
  sendTestWakeReminder,
} from '../services/wakeWindowReminder';
import {
  BackupImportMode,
  BackupRestoreResult,
  ToddlerSleepBackup,
  applyBackupRestore,
  exportBackupFile,
  getBackupCopy,
  parseAndValidateBackup,
  readStoredSessionsCount,
} from '../utils/backupData';

type SettingsSectionId =
  | 'language'
  | 'profile'
  | 'wakeReminder'
  | 'lockScreen'
  | 'nightMode'
  | 'colorMode'
  | 'redFilter'
  | 'dimming'
  | 'backup';

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
  wakeReminderEnabled: boolean;
  onToggleWakeReminder: (enabled: boolean) => void;
  wakeReminderLeadMins: WakeReminderLeadMins;
  onChangeWakeReminderLeadMins: (mins: WakeReminderLeadMins) => void;
  nightMode: NightModeState;
  onUpdateNightMode: (updates: Partial<NightModeState>) => void;
  colorMode: ColorMode;
  onChangeColorMode: (mode: ColorMode) => void;
  onBackupRestored?: (result: BackupRestoreResult) => void;
  hapticsEnabled?: boolean;
  onToggleHaptics?: (enabled: boolean) => void;
}

const LANGUAGE_LABELS: Record<Language, string> = {
  ar: 'العربية',
  cs: 'Čeština',
  en: 'English',
  es: 'Español',
  it: 'Italiano',
  hu: 'Magyar',
  pl: 'Polski',
  ro: 'Română',
  sk: 'Slovenčina',
  uk: 'Українська',
};

const LOCALE_MAP: Record<Language, string> = {
  sk: 'sk-SK',
  cs: 'cs-CZ',
  en: 'en-US',
  pl: 'pl-PL',
  hu: 'hu-HU',
  uk: 'uk-UA',
  it: 'it-IT',
  es: 'es-ES',
  ro: 'ro-RO',
  ar: 'ar-SA',
};

const STATE_LABELS: Record<Language, { on: string; off: string; notSet: string }> = {
  sk: { on: 'Zapnuté', off: 'Vypnuté', notSet: 'Nenastavené' },
  cs: { on: 'Zapnuto', off: 'Vypnuto', notSet: 'Nenastaveno' },
  en: { on: 'On', off: 'Off', notSet: 'Not set' },
  pl: { on: 'Włączone', off: 'Wyłączone', notSet: 'Nie ustawiono' },
  hu: { on: 'Be', off: 'Ki', notSet: 'Nincs beállítva' },
  uk: { on: 'Увімк.', off: 'Вимк.', notSet: 'Не вказано' },
  it: { on: 'Attivo', off: 'Disattivo', notSet: 'Non impostato' },
  es: { on: 'Activo', off: 'Inactivo', notSet: 'Sin configurar' },
  ro: { on: 'Pornit', off: 'Oprit', notSet: 'Nesetat' },
  ar: { on: 'مفعّل', off: 'متوقف', notSet: 'غير محدد' },
};

interface AccordionRowProps {
  id: SettingsSectionId;
  openSection: SettingsSectionId | null;
  onToggle: (id: SettingsSectionId) => void;
  icon: React.ReactNode;
  title: string;
  summary: string;
  summaryHighlight?: boolean;
  children: React.ReactNode;
}

const SettingsAccordionRow: React.FC<AccordionRowProps> = ({
  id,
  openSection,
  onToggle,
  icon,
  title,
  summary,
  summaryHighlight = false,
  children,
}) => {
  const isOpen = openSection === id;

  return (
    <div
      className={`rounded-2xl border transition-colors overflow-hidden ${
        isOpen
          ? 'bg-white/[0.06] border-white/20'
          : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.05]'
      }`}
    >
      <button
        type="button"
        onClick={() => {
          triggerHaptic(6);
          onToggle(id);
        }}
        aria-expanded={isOpen}
        className="w-full min-h-[48px] px-3.5 py-2.5 flex items-center justify-between gap-2.5 text-left active:bg-white/10 transition-colors touch-manipulation"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="shrink-0 flex items-center justify-center">{icon}</span>
          <span className="text-xs sm:text-[13px] font-medium text-white truncate">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0 max-w-[46%]">
          <span
            className={`text-[11px] truncate tabular-nums ${
              summaryHighlight ? 'text-amber-300 font-semibold' : 'text-white/50 font-medium'
            }`}
          >
            {summary}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-white/50 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isOpen ? 'rotate-180 text-amber-300' : ''
            }`}
          />
        </div>
      </button>

      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-3.5 pb-3.5 pt-2.5 border-t border-white/10 flex flex-col gap-2.5">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

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
  wakeReminderEnabled,
  onToggleWakeReminder,
  wakeReminderLeadMins,
  onChangeWakeReminderLeadMins,
  nightMode,
  onUpdateNightMode,
  colorMode,
  onChangeColorMode,
  onBackupRestored,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [openSection, setOpenSection] = useState<SettingsSectionId | null>(null);
  const [storedSessionsCount, setStoredSessionsCount] = useState<number>(0);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [pendingImport, setPendingImport] = useState<ToddlerSleepBackup | null>(null);
  const [backupFeedback, setBackupFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [testReminderSent, setTestReminderSent] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setOpenSection(null);
      setStoredSessionsCount(readStoredSessionsCount());
      setPendingImport(null);
      setBackupFeedback(null);
      setTestReminderSent(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const t = translations[language];
  const personalized = getPersonalizedCopy(babyName, language);
  const wakeCopy = getWakeWindowCopy(language, babyName);
  const lockCopy = getLockScreenCopy(language);
  const reminderCopy = getWakeReminderCopy(language, babyName);
  const backupCopy = getBackupCopy(language);
  const ageSummary = getChildAgeSummary(babyBirthDate);
  const nowLocal = new Date();
  const todayIsoDate = `${nowLocal.getFullYear()}-${String(nowLocal.getMonth() + 1).padStart(2, '0')}-${String(nowLocal.getDate()).padStart(2, '0')}`;
  const isRtl = language === 'ar';
  const toggleLabel = STATE_LABELS[language] || STATE_LABELS.en;

  const handleToggleSection = (id: SettingsSectionId) => {
    setOpenSection((prev) => (prev === id ? null : id));
  };

  const handleExportBackup = async () => {
    triggerHaptic(10);
    setIsExporting(true);
    setBackupFeedback(null);
    try {
      const outcome = await exportBackupFile(
        backupCopy.shareTitle,
        backupCopy.shareText,
        backupCopy.shareDialogTitle
      );
      if (outcome === 'shared') {
        setBackupFeedback({ type: 'success', message: backupCopy.exportSuccessShared });
      } else if (outcome === 'downloaded') {
        setBackupFeedback({ type: 'success', message: backupCopy.exportSuccessDownloaded });
      } else if (outcome === 'saved_documents') {
        setBackupFeedback({ type: 'success', message: backupCopy.exportSuccessSaved });
      }
    } catch {
      setBackupFeedback({ type: 'error', message: backupCopy.exportError });
    } finally {
      setIsExporting(false);
    }
  };

  const handlePickImportFile = () => {
    triggerHaptic(8);
    setBackupFeedback(null);
    fileInputRef.current?.click();
  };

  const handleImportFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = parseAndValidateBackup(text);
      if (!parsed.ok) {
        setPendingImport(null);
        setBackupFeedback({ type: 'error', message: backupCopy.importErrorInvalid });
        return;
      }
      setBackupFeedback(null);
      setPendingImport(parsed.data);
    } catch {
      setPendingImport(null);
      setBackupFeedback({ type: 'error', message: backupCopy.importErrorInvalid });
    }
  };

  const handleConfirmImport = (mode: BackupImportMode) => {
    if (!pendingImport) return;
    triggerHaptic(14);
    const result = applyBackupRestore(pendingImport, mode);
    setStoredSessionsCount(result.totalSessionsAfter);
    setPendingImport(null);
    onBackupRestored?.(result);
    setBackupFeedback({
      type: 'success',
      message:
        mode === 'merge'
          ? backupCopy.importSuccessMerge(result.addedCount, result.totalSessionsAfter)
          : backupCopy.importSuccessReplace(result.totalSessionsAfter),
    });
  };

  const handleSendTestReminder = async () => {
    triggerHaptic(8);
    await sendTestWakeReminder(language, babyName);
    setTestReminderSent(true);
    window.setTimeout(() => setTestReminderSent(false), 2600);
  };

  // Concise unboxed summaries for collapsed headers
  const profileParts: string[] = [];
  if (babyName.trim()) profileParts.push(babyName.trim());
  if (ageSummary) profileParts.push(formatShortAge(ageSummary, language));
  const profileSummary = profileParts.length > 0 ? profileParts.join(' · ') : toggleLabel.notSet;

  const nightSummary = nightMode.isAutoSunset
    ? t.nightSettingsModal.autoSunsetBtn
    : nightMode.forceDark
    ? t.nightMode
    : t.dayActive;

  const colorModeSummary =
    colorMode === 'grayscale'
      ? t.nightSettingsModal.colorModeGrayscaleBadge
      : colorMode === 'lite'
      ? t.nightSettingsModal.colorModeLiteBadge
      : t.nightSettingsModal.colorModeColorBadge;

  const reminderSummary = wakeReminderEnabled
    ? `${toggleLabel.on} · -${wakeReminderLeadMins}m`
    : toggleLabel.off;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-slate-900 border border-white/20 p-4 sm:p-5 flex flex-col gap-3 shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-400/30 shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-white truncate">
                {t.nightSettingsModal.title}
              </h3>
              <p className="text-[11px] text-white/55 truncate">
                {personalized?.settingsSubtitle ?? t.nightSettingsModal.subtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center active:scale-95 touch-manipulation shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Compact Collapsible Settings List (all collapsed by default) */}
        <div className="flex flex-col gap-2">
          {/* 1. Language */}
          <SettingsAccordionRow
            id="language"
            openSection={openSection}
            onToggle={handleToggleSection}
            icon={<Globe className="w-4 h-4 text-amber-300" />}
            title={t.selectLanguage}
            summary={LANGUAGE_LABELS[language]}
          >
            <div className="relative w-full">
              <select
                id="language-dropdown"
                value={language}
                onChange={(e) => onSelectLanguage(e.target.value as Language)}
                className={`w-full h-11 px-3.5 py-2 ${isRtl ? 'pl-10' : 'pr-10'} rounded-xl bg-slate-800 border border-white/20 text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 appearance-none cursor-pointer touch-manipulation`}
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
              <div
                className={`pointer-events-none absolute inset-y-0 ${isRtl ? 'left-3.5' : 'right-3.5'} flex items-center text-white/60`}
              >
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </SettingsAccordionRow>

          {/* 2. Child Profile (Name + Birth Date) */}
          <SettingsAccordionRow
            id="profile"
            openSection={openSection}
            onToggle={handleToggleSection}
            icon={<Baby className="w-4 h-4 text-rose-300" />}
            title={t.nightSettingsModal.babyNameHeading}
            summary={profileSummary}
            summaryHighlight={profileParts.length > 0}
          >
            <p className="text-xs text-white/60 leading-relaxed">
              {t.nightSettingsModal.babyNameDesc}
            </p>
            <div className="flex items-center gap-2">
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

            <div className="pt-2.5 mt-0.5 border-t border-white/10 flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="settings-baby-birthdate"
                  className="flex items-center gap-1.5 text-xs font-semibold text-white/85"
                >
                  <Cake className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span>{wakeCopy.birthDateLabel}</span>
                </label>
                {ageSummary && (
                  <span className="text-[11px] font-semibold text-amber-300 shrink-0 tabular-nums">
                    {formatShortAge(ageSummary, language)}
                  </span>
                )}
              </div>

              <p className="text-[11px] text-white/55 leading-relaxed">
                {wakeCopy.birthDateHint}
              </p>

              <div className="flex items-center gap-2">
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
          </SettingsAccordionRow>

          {/* 3. Silent Wake-Window Reminder (Local offline notification) */}
          <SettingsAccordionRow
            id="wakeReminder"
            openSection={openSection}
            onToggle={handleToggleSection}
            icon={<Bell className="w-4 h-4 text-emerald-300" />}
            title={reminderCopy.settingsHeading}
            summary={reminderSummary}
            summaryHighlight={wakeReminderEnabled}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-white/65 leading-relaxed flex-1">
                {reminderCopy.settingsDesc}
              </p>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(10);
                  onToggleWakeReminder(!wakeReminderEnabled);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all touch-manipulation shrink-0 ${
                  wakeReminderEnabled
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                    : 'bg-white/10 text-white/75 hover:bg-white/15'
                }`}
              >
                {wakeReminderEnabled ? toggleLabel.on : toggleLabel.off}
              </button>
            </div>

            {!babyBirthDate && (
              <p className="text-[11px] text-amber-200/85 leading-snug">
                {reminderCopy.needBirthDateHint}
              </p>
            )}

            <div className="flex flex-col gap-1.5 pt-1">
              <span className="text-[11px] font-medium text-white/60">
                {reminderCopy.leadTimeLabel}
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {WAKE_REMINDER_LEAD_OPTIONS.map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => {
                      triggerHaptic(8);
                      onChangeWakeReminderLeadMins(mins);
                    }}
                    className={`py-2 px-1.5 rounded-xl text-xs font-semibold tabular-nums transition-all touch-manipulation ${
                      wakeReminderLeadMins === mins
                        ? 'bg-emerald-400 text-slate-950 font-bold shadow-sm'
                        : 'bg-white/5 hover:bg-white/10 text-white/70 border border-white/10'
                    }`}
                  >
                    {reminderCopy.leadOptionLabel(mins)}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSendTestReminder}
              className="w-full py-2 px-3 rounded-xl bg-white/[0.07] hover:bg-white/[0.13] border border-white/10 text-xs font-medium text-white/85 flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all touch-manipulation"
            >
              <Bell className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <span>
                {testReminderSent ? reminderCopy.testSentFeedback : reminderCopy.testBtn}
              </span>
            </button>
          </SettingsAccordionRow>

          {/* 4. Android Lock Screen Ongoing Sleep Display */}
          <SettingsAccordionRow
            id="lockScreen"
            openSection={openSection}
            onToggle={handleToggleSection}
            icon={<Smartphone className="w-4 h-4 text-indigo-300" />}
            title={lockCopy.settingsHeading}
            summary={lockScreenSleepEnabled ? toggleLabel.on : toggleLabel.off}
            summaryHighlight={lockScreenSleepEnabled}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-white/60 leading-relaxed flex-1">
                {lockCopy.settingsDesc}
              </p>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(10);
                  onToggleLockScreenSleep(!lockScreenSleepEnabled);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all touch-manipulation shrink-0 ${
                  lockScreenSleepEnabled
                    ? 'bg-indigo-500 text-white shadow-md ring-2 ring-indigo-400/50'
                    : 'bg-white/10 text-white/70 hover:bg-white/15'
                }`}
              >
                {lockScreenSleepEnabled ? toggleLabel.on : toggleLabel.off}
              </button>
            </div>
          </SettingsAccordionRow>

          {/* 5. Sunset & Night Mode */}
          <SettingsAccordionRow
            id="nightMode"
            openSection={openSection}
            onToggle={handleToggleSection}
            icon={<Sun className="w-4 h-4 text-amber-300" />}
            title={t.nightSettingsModal.sunsetHeading}
            summary={nightSummary}
            summaryHighlight={
              nightMode.forceDark || (nightMode.isAutoSunset && nightMode.isAfterSunset)
            }
          >
            <p className="text-xs text-white/60 leading-relaxed">
              {personalized?.sunsetDetailDesc ?? t.nightSettingsModal.sunsetDetailDesc}
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
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
                type="button"
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
                type="button"
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
          </SettingsAccordionRow>

          {/* 6. Color Mode (Color / Lite / Grayscale) */}
          <SettingsAccordionRow
            id="colorMode"
            openSection={openSection}
            onToggle={handleToggleSection}
            icon={<Contrast className="w-4 h-4 text-indigo-300" />}
            title={t.nightSettingsModal.colorModeHeading}
            summary={colorModeSummary}
          >
            <p className="text-xs text-white/60 leading-relaxed">
              {t.nightSettingsModal.colorModeDesc}
            </p>
            <div className="grid grid-cols-3 gap-2">
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
          </SettingsAccordionRow>

          {/* 7. Red Melatonin Filter */}
          <SettingsAccordionRow
            id="redFilter"
            openSection={openSection}
            onToggle={handleToggleSection}
            icon={<Flame className="w-4 h-4 text-red-400" />}
            title={t.nightSettingsModal.redFilterHeading}
            summary={nightMode.redFilter ? toggleLabel.on : toggleLabel.off}
            summaryHighlight={nightMode.redFilter}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-white/60 leading-relaxed flex-1">
                {t.nightSettingsModal.redFilterDesc}
              </p>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(8);
                  onUpdateNightMode({ redFilter: !nightMode.redFilter });
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all touch-manipulation shrink-0 ${
                  nightMode.redFilter
                    ? 'bg-red-500 text-white shadow-md ring-2 ring-red-400/50'
                    : 'bg-white/10 text-white/70 hover:bg-white/15'
                }`}
              >
                {nightMode.redFilter ? toggleLabel.on : toggleLabel.off}
              </button>
            </div>
          </SettingsAccordionRow>

          {/* 8. Extra Screen Dimming */}
          <SettingsAccordionRow
            id="dimming"
            openSection={openSection}
            onToggle={handleToggleSection}
            icon={<Eye className="w-4 h-4 text-sky-300" />}
            title={t.nightSettingsModal.dimHeading}
            summary={`${nightMode.screenDimPercent}%`}
            summaryHighlight={nightMode.screenDimPercent > 0}
          >
            <p className="text-xs text-white/60 leading-relaxed">
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
          </SettingsAccordionRow>

          {/* 9. Backup & Data Transfer */}
          <SettingsAccordionRow
            id="backup"
            openSection={openSection}
            onToggle={handleToggleSection}
            icon={<HardDriveDownload className="w-4 h-4 text-emerald-300" />}
            title={backupCopy.heading}
            summary={backupCopy.savedCountBadge(storedSessionsCount)}
          >
            <div className="flex flex-col gap-1.5 text-xs text-white/65 leading-relaxed">
              <p>{backupCopy.plainExplanation}</p>
              <p className="text-white/50">{backupCopy.migrationHint}</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImportFileSelected}
              className="hidden"
            />

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isExporting}
                onClick={handleExportBackup}
                className="py-2.5 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/35 text-emerald-100 font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all touch-manipulation disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span className="truncate">{backupCopy.exportBtn}</span>
              </button>

              <button
                type="button"
                onClick={handlePickImportFile}
                className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white/90 font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all touch-manipulation"
              >
                <Upload className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span className="truncate">{backupCopy.importBtn}</span>
              </button>
            </div>

            {/* Import Preview & Merge/Replace Decision Card */}
            {pendingImport && (
              <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-amber-400/35 flex flex-col gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-amber-200">
                    {backupCopy.importPreviewTitle}
                  </span>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-white/75">
                    <span>{backupCopy.importPreviewRecords(pendingImport.sessions.length)}</span>
                    <span>
                      {backupCopy.importPreviewDate(
                        new Date(pendingImport.exportedAt).toLocaleDateString(
                          LOCALE_MAP[language] || 'en-US',
                          { day: 'numeric', month: 'short', year: 'numeric' }
                        )
                      )}
                    </span>
                    {pendingImport.profile.babyName && (
                      <span>{backupCopy.importPreviewChild(pendingImport.profile.babyName)}</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleConfirmImport('merge')}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs active:scale-[0.98] transition-all text-center shadow-md"
                  >
                    {backupCopy.importMergeBtn}
                  </button>
                  <p className="text-[10px] text-white/50 text-center">
                    {backupCopy.importMergeHint}
                  </p>

                  <div className="grid grid-cols-2 gap-2 mt-0.5">
                    <button
                      type="button"
                      onClick={() => handleConfirmImport('replace')}
                      className="py-2 px-2.5 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/30 text-amber-200 font-semibold text-[11px] active:scale-95 transition-all"
                    >
                      {backupCopy.importReplaceBtn}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic(6);
                        setPendingImport(null);
                      }}
                      className="py-2 px-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/75 font-semibold text-[11px] active:scale-95 transition-all"
                    >
                      {backupCopy.importCancelBtn}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Export / Import Feedback Banner */}
            {backupFeedback && (
              <div
                className={`p-2.5 rounded-xl border text-[11px] font-medium flex items-start gap-2 animate-in fade-in duration-200 ${
                  backupFeedback.type === 'success'
                    ? 'bg-emerald-500/15 border-emerald-400/35 text-emerald-200'
                    : 'bg-red-500/15 border-red-400/35 text-red-200'
                }`}
              >
                {backupFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-300 shrink-0 mt-0.5" />
                )}
                <span className="leading-snug">{backupFeedback.message}</span>
              </div>
            )}
          </SettingsAccordionRow>
        </div>

        {/* Save & Close Button */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic(10);
            onClose();
          }}
          className="w-full min-h-[48px] rounded-2xl bg-white text-slate-950 font-semibold text-sm hover:bg-white/90 active:scale-95 touch-manipulation shadow-lg mt-0.5"
        >
          {t.nightSettingsModal.saveClose}
        </button>
      </div>
    </div>
  );
};
