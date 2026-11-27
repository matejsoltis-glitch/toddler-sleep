import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Moon,
  Sun,
  Plus,
  Trash2,
  ChevronDown,
  Sparkles,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Pencil,
  Check,
  SlidersHorizontal,
  Cake,
  BellRing,
  Bell,
  BellOff,
  Smartphone,
  History,
} from 'lucide-react';
import { Language, SleepSession, SleepQuality, SleepType, SleepScheduleBounds } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { getPersonalizedCopy, getPersonalizedSchedulePhrases } from '../utils/babyName';
import {
  evaluateWakeWindow,
  formatShortAge,
  formatWakeDuration,
  getWakeWindowCopy,
} from '../utils/wakeWindow';
import { getLockScreenCopy } from '../services/lockScreenSleep';
import {
  SESSIONS_UPDATED_EVENT,
  ScheduledWakeReminderInfo,
  getWakeReminderCopy,
} from '../services/wakeWindowReminder';
import { BACKUP_RESTORED_EVENT } from '../utils/backupData';
import { WeeklySleepMiniChart } from './WeeklySleepMiniChart';
import { PediatricSummarySection } from './PediatricSummarySection';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

interface ScheduleAssistantModeProps {
  language: Language;
  babyName?: string;
  babyBirthDate?: string;
  onChangeBabyBirthDate?: (dateStr: string) => void;
  lockScreenSleepEnabled?: boolean;
  wakeReminderEnabled?: boolean;
  onToggleWakeReminder?: (enabled: boolean) => void;
  scheduledWakeReminder?: ScheduledWakeReminderInfo | null;
  activeSleepStart?: string | null;
  sleepElapsedSeconds?: number;
  onUpdateActiveSleepStart?: (nextIso: string | null) => void;
}

const STORAGE_KEY_SESSIONS = 'toddler_sleep_sessions';
const STORAGE_KEY_ACTIVE_SLEEP = 'toddler_active_sleep_start';
const STORAGE_KEY_BOUNDS = 'toddler_sleep_schedule_bounds';
const DEFAULT_SCHEDULE_BOUNDS: SleepScheduleBounds = {
  dayStart: '07:00',
  nightStart: '19:00',
};

const toLocalDateStr = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const toLocalTimeStr = (d: Date) => {
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
};

const timeStrToMinutes = (hhmm: string): number => {
  const [hStr, mStr] = hhmm.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return ((h * 60 + m) % 1440 + 1440) % 1440;
};

const classifySleepTypeByBounds = (
  startIsoOrDate: string | Date,
  bounds: SleepScheduleBounds
): SleepType => {
  const d = typeof startIsoOrDate === 'string' ? new Date(startIsoOrDate) : startIsoOrDate;
  if (Number.isNaN(d.getTime())) return 'day-nap';
  const mins = d.getHours() * 60 + d.getMinutes();
  const dayStartMins = timeStrToMinutes(bounds.dayStart);
  const nightStartMins = timeStrToMinutes(bounds.nightStart);
  if (dayStartMins === nightStartMins) return 'day-nap';
  if (dayStartMins < nightStartMins) {
    return mins >= dayStartMins && mins < nightStartMins ? 'day-nap' : 'night-sleep';
  }
  return mins >= dayStartMins || mins < nightStartMins ? 'day-nap' : 'night-sleep';
};

const getSessionCalendarDate = (session: SleepSession): string => {
  // Night sleep starting the previous evening belongs to the day it finishes (morning summary)
  const refDate =
    session.type === 'night-sleep' ? new Date(session.endTime) : new Date(session.startTime);
  if (Number.isNaN(refDate.getTime())) {
    return session.startTime.split('T')[0];
  }
  return toLocalDateStr(refDate);
};

const getSessionDurationMinutes = (session: SleepSession): number => {
  if (Number.isFinite(session.durationMinutes) && session.durationMinutes > 0) {
    return Math.round(session.durationMinutes);
  }
  const startMs = new Date(session.startTime).getTime();
  const endMs = new Date(session.endTime).getTime();
  if (!Number.isNaN(startMs) && !Number.isNaN(endMs) && endMs > startMs) {
    return Math.max(1, Math.round((endMs - startMs) / 60000));
  }
  return 0;
};

const buildSessionDateRange = (
  dateStr: string,
  startHHMM: string,
  endHHMM: string,
  shiftOvernightBackIfFuture = false
): { startDateTime: Date; endDateTime: Date; durationMinutes: number } | null => {
  const startDateTime = new Date(`${dateStr}T${startHHMM}:00`);
  const endDateTime = new Date(`${dateStr}T${endHHMM}:00`);
  if (Number.isNaN(startDateTime.getTime()) || Number.isNaN(endDateTime.getTime())) {
    return null;
  }

  // Handle overnight spans using calendar setDate (DST-safe, preserves exact wall-clock time)
  const isOvernight = endDateTime.getTime() <= startDateTime.getTime();
  if (isOvernight) {
    endDateTime.setDate(endDateTime.getDate() + 1);

    // If parent logs last night's sleep in the morning while leaving the date on today
    // (e.g. today 20:00 -> tomorrow 06:30), shift both back by 1 day so it saves as yesterday 20:00 -> today 06:30
    if (shiftOvernightBackIfFuture && endDateTime.getTime() > Date.now()) {
      const shiftedEnd = new Date(endDateTime);
      shiftedEnd.setDate(shiftedEnd.getDate() - 1);
      if (shiftedEnd.getTime() <= Date.now()) {
        startDateTime.setDate(startDateTime.getDate() - 1);
        endDateTime.setDate(endDateTime.getDate() - 1);
      }
    }
  }

  const durationMinutes = Math.max(
    1,
    Math.round((endDateTime.getTime() - startDateTime.getTime()) / 60000)
  );
  return { startDateTime, endDateTime, durationMinutes };
};

interface ScheduleTexts {
  currentStatus: string;
  babySleeping: string;
  babyAwake: string;
  fellAsleepAt: string;
  timerBackgroundHint: string;
  babyWokeUpBtn: string;
  heroTitle: string;
  heroSubtitle: string;
  babyFellAsleepBtn: string;
  wakeWindow: string;
  sinceLastSleep: string;
  todayTotal: string;
  todayNaps: string;
  sessionsCount: string;
  dayNap: string;
  nightSleep: string;
  average: string;
  addManualBtn: string;
  date: string;
  from: string;
  to: string;
  qualityLabel: string;
  qualityPeaceful: string;
  qualityNormal: string;
  qualityRestless: string;
  notePlaceholder: string;
  saveSessionBtn: string;
  exportCardTitle: string;
  exportCardSubtitle: string;
  exportShareBtn: string;
  copyCSVBtn: string;
  copySummaryBtn: string;
  exportInfo: string;
  historyTitle: string;
  latestFirst: string;
  noHistory: string;
  deleteTitle: string;
  deleteConfirmTitle: string;
  deleteConfirmDesc: string;
  deleteConfirmBtn: string;
  saveWakeUpModal: string;
  howWasSleep: string;
  discard: string;
  saveToHistory: string;
  noteModalPlaceholder: string;
  toastTrackingStarted: string;
  toastSessionSaved: string;
  toastSessionAdded: string;
  toastSessionRemoved: string;
  toastCsvStarted: string;
  toastCsvShared: string;
  toastShared: string;
  toastCsvDownloaded: string;
  toastCsvCopied: string;
  toastSummaryCopied: string;
  csvHeaders: {
    date: string;
    startTime: string;
    endTime: string;
    durationMinutes: string;
    durationFormat: string;
    sleepType: string;
    sleepQuality: string;
    note: string;
  };
  csvSummary: {
    title: string;
    todayTotal: string;
    napsCount: string;
    recentRecords: string;
  };
  // New calendar & history keys
  calendarTitle: string;
  allDays: string;
  today: string;
  yesterday: string;
  pickDate: string;
  noSessionsForDate: string;
  showAllDaysBtn: string;
  showMoreSessions: string;
  showLessSessions: string;
  scrollHint: string;
  dayTotalLabel: string;
  calendarModalTitle: string;
  calendarAllDaysBtn: string;
  calendarTodayBtn: string;
  calendarCloseBtn: string;
  monthNames: string[];
  weekDaysShort: string[];
  // Edit saved & ongoing sleep keys
  editTitle: string;
  editSessionModalTitle: string;
  toastSessionUpdated: string;
  toastStartTimeUpdated: string;
  editStartTimeBtn: string;
  customStartTimeLabel: string;
  applyBtn: string;
  cancelBtn: string;
  // Custom day/night sleep window keys
  sleepBoundsBtn: string;
  sleepBoundsModalTitle: string;
  sleepBoundsModalDesc: string;
  daySleepFrom: string;
  nightSleepFrom: string;
  dayWindowPreview: string;
  nightWindowPreview: string;
  saveBoundsBtn: string;
  toastBoundsUpdated: string;
  sampleNote1: string;
  sampleNote2: string;
}

const scheduleTexts: Record<Language, ScheduleTexts> = {
  sk: {
    currentStatus: 'Aktuálny stav',
    babySleeping: 'Dieťatko spí',
    babyAwake: 'Bdie',
    fellAsleepAt: 'Zaspalo o',
    timerBackgroundHint: 'Časovač beží na pozadí, pokojne môžete aplikáciu zatvoriť.',
    babyWokeUpBtn: 'Dieťatko sa zobudilo',
    heroTitle: 'Zaznamenať spánok jedným ťuknutím',
    heroSubtitle: 'Hneď ako uložíte dieťatko, spustite stopky spánku.',
    babyFellAsleepBtn: 'Dieťatko práve zaspalo',
    wakeWindow: 'Bdelé okno:',
    sinceLastSleep: 'Od posledného spánku',
    todayTotal: 'Dnes naspaté',
    todayNaps: 'Dnešné spánky',
    sessionsCount: 'záznamy',
    dayNap: 'Denný spánok',
    nightSleep: 'Nočný spánok',
    average: 'Priemer',
    addManualBtn: 'Pridať spánok ručne',
    date: 'Dátum',
    from: 'Od',
    to: 'Do',
    qualityLabel: 'Kvalita spánku',
    qualityPeaceful: '🌿 Kľudný',
    qualityNormal: '😴 Normálny',
    qualityRestless: '🌪️ Nepokojný',
    notePlaceholder: 'Poznámka (voliteľné, napr. zúbky)',
    saveSessionBtn: 'Uložiť záznam',
    exportCardTitle: 'Export do Google Drive & Tabuliek',
    exportCardSubtitle: 'Stiahnite alebo zdieľajte dáta vo formáte CSV',
    exportShareBtn: 'Uložiť / Zdieľať CSV',
    copyCSVBtn: 'Kopírovať CSV',
    copySummaryBtn: 'Súhrn',
    exportInfo: 'Vygenerovaný súbor CSV obsahuje UTF-8 diakritiku a dá sa priamo nahrať na Google Drive alebo otvoriť v Google Tabuľkách.',
    historyTitle: 'História spánkov',
    latestFirst: 'Najnovšie hore',
    noHistory: 'Zatiaľ nemáte zaznamenaný žiadny spánok. Ťuknite vyššie na "Dieťatko práve zaspalo".',
    deleteTitle: 'Vymazať',
    deleteConfirmTitle: 'Vymazať tento spánok?',
    deleteConfirmDesc: 'Záznam bude natrvalo odstránený z histórie spánkov aj z denných štatistík.',
    deleteConfirmBtn: 'Áno, vymazať',
    saveWakeUpModal: 'Uložiť prebudenie',
    howWasSleep: 'Ako dieťatko spalo?',
    discard: 'Zahodiť',
    saveToHistory: 'Uložiť do histórie',
    noteModalPlaceholder: 'Napr. bez nočného budenia',
    toastTrackingStarted: 'Spánok sa začal zaznamenávať 🌙',
    toastSessionSaved: 'Spánok bol úspešne uložený! ✨',
    toastSessionAdded: 'Záznam pridaný do histórie',
    toastSessionRemoved: 'Záznam vymazaný',
    toastCsvStarted: 'Ukladanie CSV spustené',
    toastCsvShared: 'Zdieľané do Google Drive / aplikácie',
    toastShared: 'Zdieľané do aplikácie',
    toastCsvDownloaded: 'CSV stiahnuté – pripravené pre Google Drive / Tabuľky',
    toastCsvCopied: 'CSV skopírované (môžete vložiť do Tabuliek)',
    toastSummaryCopied: 'Súhrn skopírovaný do schránky',
    csvHeaders: {
      date: 'Dátum',
      startTime: 'Čas začiatku',
      endTime: 'Čas konca',
      durationMinutes: 'Trvanie (minúty)',
      durationFormat: 'Trvanie (formát)',
      sleepType: 'Typ spánku',
      sleepQuality: 'Kvalita spánku',
      note: 'Poznámka',
    },
    csvSummary: {
      title: '📊 Súhrn spánkového režimu',
      todayTotal: 'Dnes celkovo:',
      napsCount: 'spánkov',
      recentRecords: 'Posledné záznamy:',
    },
    calendarTitle: 'Prepínanie histórie podľa dní',
    allDays: 'Všetky dni',
    today: 'Dnes',
    yesterday: 'Včera',
    pickDate: 'Vybrať dátum',
    noSessionsForDate: 'Pre vybraný deň nie sú zaznamenané žiadne spánky.',
    showAllDaysBtn: 'Zobraziť všetky dni',
    showMoreSessions: 'Zobraziť ďalšie spánky',
    showLessSessions: 'Zobraziť menej',
    scrollHint: 'Potiahnutím prstom rolujte staršie spánky',
    dayTotalLabel: 'V tento deň:',
    calendarModalTitle: 'Vybrať deň z kalendára',
    calendarAllDaysBtn: 'Všetky dni',
    calendarTodayBtn: 'Dnes',
    calendarCloseBtn: 'Zavrieť',
    monthNames: [
      'Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún',
      'Júl', 'August', 'September', 'Október', 'November', 'December',
    ],
    weekDaysShort: ['Po', 'Ut', 'St', 'Št', 'Pi', 'So', 'Ne'],
    editTitle: 'Upraviť',
    editSessionModalTitle: 'Upraviť záznam spánku',
    toastSessionUpdated: 'Záznam spánku bol upravený ✨',
    toastStartTimeUpdated: 'Začiatočný čas zaspatia bol upravený',
    editStartTimeBtn: 'Upraviť čas',
    customStartTimeLabel: 'Presný čas zaspatia:',
    applyBtn: 'Použiť',
    cancelBtn: 'Zrušiť',
    sleepBoundsBtn: 'Časy spánku',
    sleepBoundsModalTitle: 'Časy denného a nočného spánku',
    sleepBoundsModalDesc: 'Nastavte, od ktorej hodiny vaše dieťatko bežne máva denný a od ktorej nočný spánok. Nočný spánok začatý pred polnocou sa automaticky správne priradí do dnešného prehľadu.',
    daySleepFrom: 'Denný spánok od',
    nightSleepFrom: 'Nočný spánok od',
    dayWindowPreview: 'Denný:',
    nightWindowPreview: 'Nočný:',
    saveBoundsBtn: 'Uložiť časy',
    toastBoundsUpdated: 'Časy denného a nočného spánku boli uložené ✨',
    sampleNote1: 'Zaspalo rýchlo po prechádzke',
    sampleNote2: 'Kľudná noc',
  },
  cs: {
    currentStatus: 'Aktuální stav',
    babySleeping: 'Děťátko spí',
    babyAwake: 'Bdí',
    fellAsleepAt: 'Usnulo v',
    timerBackgroundHint: 'Časovač běží na pozadí, klidně můžete aplikaci zavřít.',
    babyWokeUpBtn: 'Děťátko se probudilo',
    heroTitle: 'Zaznamenat spánek jedním klepnutím',
    heroSubtitle: 'Jakmile uložíte děťátko, spusťte stopky spánku.',
    babyFellAsleepBtn: 'Děťátko právě usnulo',
    wakeWindow: 'Bdělý interval:',
    sinceLastSleep: 'Od posledního spánku',
    todayTotal: 'Dnes naspáno',
    todayNaps: 'Dnešní spánky',
    sessionsCount: 'záznamy',
    dayNap: 'Denní spánek',
    nightSleep: 'Noční spánek',
    average: 'Průměr',
    addManualBtn: 'Přidat spánek ručně',
    date: 'Datum',
    from: 'Od',
    to: 'Do',
    qualityLabel: 'Kvalita spánku',
    qualityPeaceful: '🌿 Klidný',
    qualityNormal: '😴 Normální',
    qualityRestless: '🌪️ Neklidný',
    notePlaceholder: 'Poznámka (volitelné, např. zoubky)',
    saveSessionBtn: 'Uložit záznam',
    exportCardTitle: 'Export do Google Drive & Tabulek',
    exportCardSubtitle: 'Stáhněte nebo sdílejte data ve formátu CSV',
    exportShareBtn: 'Uložit / Sdílet CSV',
    copyCSVBtn: 'Kopírovat CSV',
    copySummaryBtn: 'Souhrn',
    exportInfo: 'Vygenerovaný soubor CSV obsahuje UTF-8 kódování a lze jej přímo nahrát na Google Drive nebo otevřít v Google Tabulkách.',
    historyTitle: 'Historie spánků',
    latestFirst: 'Nejnovější nahoře',
    noHistory: 'Zatím nemáte zaznamenaný žádný spánek. Klepněte výše na "Děťátko právě usnulo".',
    deleteTitle: 'Smazat',
    deleteConfirmTitle: 'Smazat tento spánek?',
    deleteConfirmDesc: 'Záznam bude trvale odstraněn z historie spánků i z denních statistik.',
    deleteConfirmBtn: 'Ano, smazat',
    saveWakeUpModal: 'Uložit probuzení',
    howWasSleep: 'Jak děťátko spalo?',
    discard: 'Zahodit',
    saveToHistory: 'Uložit do historie',
    noteModalPlaceholder: 'Např. klidný spánek bez buzení',
    toastTrackingStarted: 'Spánek se začal zaznamenávat 🌙',
    toastSessionSaved: 'Spánek byl úspěšně uložen! ✨',
    toastSessionAdded: 'Záznam přidán do historie',
    toastSessionRemoved: 'Záznam smazán',
    toastCsvStarted: 'Ukládání CSV spuštěno',
    toastCsvShared: 'Sdíleno do Google Drive / aplikace',
    toastShared: 'Sdíleno do aplikace',
    toastCsvDownloaded: 'CSV staženo – připraveno pro Google Drive / Tabulky',
    toastCsvCopied: 'CSV zkopírováno (můžete vložit do Tabulek)',
    toastSummaryCopied: 'Souhrn zkopírován do schránky',
    csvHeaders: {
      date: 'Datum',
      startTime: 'Čas začátku',
      endTime: 'Čas konce',
      durationMinutes: 'Trvání (minuty)',
      durationFormat: 'Trvání (formát)',
      sleepType: 'Typ spánku',
      sleepQuality: 'Kvalita spánku',
      note: 'Poznámka',
    },
    csvSummary: {
      title: '📊 Souhrn spánkového režimu',
      todayTotal: 'Dnes celkem:',
      napsCount: 'spánků',
      recentRecords: 'Poslední záznamy:',
    },
    calendarTitle: 'Přepínání historie podle dnů',
    allDays: 'Všechny dny',
    today: 'Dnes',
    yesterday: 'Včera',
    pickDate: 'Vybrat datum',
    noSessionsForDate: 'Pro vybraný den nejsou zaznamenány žádné spánky.',
    showAllDaysBtn: 'Zobrazit všechny dny',
    showMoreSessions: 'Zobrazit další spánky',
    showLessSessions: 'Zobrazit méně',
    scrollHint: 'Potažením prstem rolujte starší spánky',
    dayTotalLabel: 'V tento den:',
    calendarModalTitle: 'Vybrat den z kalendáře',
    calendarAllDaysBtn: 'Všechny dny',
    calendarTodayBtn: 'Dnes',
    calendarCloseBtn: 'Zavřít',
    monthNames: [
      'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
      'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec',
    ],
    weekDaysShort: ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'],
    editTitle: 'Upravit',
    editSessionModalTitle: 'Upravit záznam spánku',
    toastSessionUpdated: 'Záznam spánku byl upraven ✨',
    toastStartTimeUpdated: 'Počáteční čas usnutí byl upraven',
    editStartTimeBtn: 'Upravit čas',
    customStartTimeLabel: 'Přesný čas usnutí:',
    applyBtn: 'Použít',
    cancelBtn: 'Zrušit',
    sleepBoundsBtn: 'Časy spánku',
    sleepBoundsModalTitle: 'Časy denního a nočního spánku',
    sleepBoundsModalDesc: 'Nastavte, od které hodiny má vaše miminko obvykle denní a od které noční spánek. Noční spánek započatý před půlnocí se správně započítá do dnešního přehledu.',
    daySleepFrom: 'Denní spánek od',
    nightSleepFrom: 'Noční spánek od',
    dayWindowPreview: 'Denní:',
    nightWindowPreview: 'Noční:',
    saveBoundsBtn: 'Uložit časy',
    toastBoundsUpdated: 'Časy denního a nočního spánku byly uloženy ✨',
    sampleNote1: 'Usnulo rychle po procházce',
    sampleNote2: 'Klidná noc',
  },
  en: {
    currentStatus: 'Current Status',
    babySleeping: 'Baby is sleeping',
    babyAwake: 'Awake',
    fellAsleepAt: 'Fell asleep at',
    timerBackgroundHint: 'Timer keeps running in background even if you close the app.',
    babyWokeUpBtn: 'Baby woke up',
    heroTitle: 'One-tap Sleep Tracker',
    heroSubtitle: 'Start the sleep timer as soon as baby falls asleep.',
    babyFellAsleepBtn: 'Baby just fell asleep',
    wakeWindow: 'Wake window:',
    sinceLastSleep: 'Since last sleep',
    todayTotal: 'Today total',
    todayNaps: 'Naps today',
    sessionsCount: 'sessions',
    dayNap: 'Day nap',
    nightSleep: 'Night sleep',
    average: 'Average',
    addManualBtn: 'Add sleep session manually',
    date: 'Date',
    from: 'From',
    to: 'To',
    qualityLabel: 'Sleep quality',
    qualityPeaceful: '🌿 Calm',
    qualityNormal: '😴 Normal',
    qualityRestless: '🌪️ Restless',
    notePlaceholder: 'Note (optional, e.g. teething)',
    saveSessionBtn: 'Save session',
    exportCardTitle: 'Export to Google Drive & Sheets',
    exportCardSubtitle: 'Download or share sessions as CSV',
    exportShareBtn: 'Save / Share CSV',
    copyCSVBtn: 'Copy CSV',
    copySummaryBtn: 'Summary',
    exportInfo: 'Exported CSV includes UTF-8 encoding and can be opened directly in Google Drive or Google Sheets.',
    historyTitle: 'Sleep History',
    latestFirst: 'Latest first',
    noHistory: 'No sleep sessions recorded yet. Tap "Baby just fell asleep" above.',
    deleteTitle: 'Delete',
    deleteConfirmTitle: 'Delete this sleep record?',
    deleteConfirmDesc: 'This session will be permanently removed from your sleep history and daily totals.',
    deleteConfirmBtn: 'Yes, delete',
    saveWakeUpModal: 'Save wake up',
    howWasSleep: 'How was the sleep?',
    discard: 'Discard',
    saveToHistory: 'Save to history',
    noteModalPlaceholder: 'e.g. slept peacefully without waking',
    toastTrackingStarted: 'Sleep tracking started 🌙',
    toastSessionSaved: 'Sleep session saved! ✨',
    toastSessionAdded: 'Session added to history',
    toastSessionRemoved: 'Session removed',
    toastCsvStarted: 'CSV export started',
    toastCsvShared: 'Export shared to Google Drive / app',
    toastShared: 'Shared to app',
    toastCsvDownloaded: 'CSV downloaded – ready for Google Drive / Sheets',
    toastCsvCopied: 'CSV copied to clipboard',
    toastSummaryCopied: 'Summary copied to clipboard',
    csvHeaders: {
      date: 'Date',
      startTime: 'Start time',
      endTime: 'End time',
      durationMinutes: 'Duration (minutes)',
      durationFormat: 'Duration (formatted)',
      sleepType: 'Sleep type',
      sleepQuality: 'Sleep quality',
      note: 'Note',
    },
    csvSummary: {
      title: '📊 Sleep Schedule Summary',
      todayTotal: 'Today total:',
      napsCount: 'naps',
      recentRecords: 'Recent records:',
    },
    calendarTitle: 'Switch history by days',
    allDays: 'All days',
    today: 'Today',
    yesterday: 'Yesterday',
    pickDate: 'Pick date',
    noSessionsForDate: 'No sleep sessions recorded for this day.',
    showAllDaysBtn: 'Show all days',
    showMoreSessions: 'Show more sessions',
    showLessSessions: 'Show less',
    scrollHint: 'Scroll down with finger for older sessions',
    dayTotalLabel: 'On this day:',
    calendarModalTitle: 'Select Day from Calendar',
    calendarAllDaysBtn: 'All days',
    calendarTodayBtn: 'Today',
    calendarCloseBtn: 'Close',
    monthNames: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ],
    weekDaysShort: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
    editTitle: 'Edit',
    editSessionModalTitle: 'Edit Sleep Record',
    toastSessionUpdated: 'Sleep record updated ✨',
    toastStartTimeUpdated: 'Sleep start time updated',
    editStartTimeBtn: 'Edit time',
    customStartTimeLabel: 'Exact start time:',
    applyBtn: 'Apply',
    cancelBtn: 'Cancel',
    sleepBoundsBtn: 'Sleep hours',
    sleepBoundsModalTitle: 'Day & Night Sleep Hours',
    sleepBoundsModalDesc: 'Set when your baby typically has daytime naps vs. nighttime sleep. Overnight sleep starting before midnight is accurately counted in today’s summary.',
    daySleepFrom: 'Day sleep from',
    nightSleepFrom: 'Night sleep from',
    dayWindowPreview: 'Day:',
    nightWindowPreview: 'Night:',
    saveBoundsBtn: 'Save Hours',
    toastBoundsUpdated: 'Day & night sleep hours saved ✨',
    sampleNote1: 'Fell asleep quickly after a walk',
    sampleNote2: 'Peaceful night',
  },
  pl: {
    currentStatus: 'Aktualny stan',
    babySleeping: 'Dzidziuś śpi',
    babyAwake: 'Czuwa',
    fellAsleepAt: 'Zasnął o',
    timerBackgroundHint: 'Stoper działa w tle, możesz spokojnie zamknąć aplikację.',
    babyWokeUpBtn: 'Dzidziuś się obudził',
    heroTitle: 'Rejestracja snu jednym dotknięciem',
    heroSubtitle: 'Gdy tylko ułożysz malucha, włącz stoper snu.',
    babyFellAsleepBtn: 'Dzidziuś właśnie zasnął',
    wakeWindow: 'Czas czuwania:',
    sinceLastSleep: 'Od ostatniego snu',
    todayTotal: 'Dzisiaj przespane',
    todayNaps: 'Dzisiejsze drzemki',
    sessionsCount: 'sesje',
    dayNap: 'Drzemka dzienna',
    nightSleep: 'Sen nocny',
    average: 'Średnia',
    addManualBtn: 'Dodaj sen ręcznie',
    date: 'Data',
    from: 'Od',
    to: 'Do',
    qualityLabel: 'Jakość snu',
    qualityPeaceful: '🌿 Spokojny',
    qualityNormal: '😴 Normalny',
    qualityRestless: '🌪️ Niespokojny',
    notePlaceholder: 'Notatka (opcjonalnie, np. ząbkowanie)',
    saveSessionBtn: 'Zapisz wpis',
    exportCardTitle: 'Eksport do Dysku Google i Arkuszy',
    exportCardSubtitle: 'Pobierz lub udostępnij dane w formacie CSV',
    exportShareBtn: 'Zapisz / Udostępnij CSV',
    copyCSVBtn: 'Kopiuj CSV',
    copySummaryBtn: 'Podsumowanie',
    exportInfo: 'Wygenerowany plik CSV ma kodowanie UTF-8 i można go bezpośrednio przesłać na Dysk Google lub otworzyć w Arkuszach.',
    historyTitle: 'Historia snu',
    latestFirst: 'Najnowsze na górze',
    noHistory: 'Nie zarejestrowano jeszcze snu. Dotknij wyżej "Dzidziuś właśnie zasnął".',
    deleteTitle: 'Usuń',
    deleteConfirmTitle: 'Usunąć ten wpis snu?',
    deleteConfirmDesc: 'Wpis zostanie trwale usunięty z historii snu oraz z dziennych statystyk.',
    deleteConfirmBtn: 'Tak, usuń',
    saveWakeUpModal: 'Zapisz wybudzenie',
    howWasSleep: 'Jak spał maluch?',
    discard: 'Odrzuć',
    saveToHistory: 'Zapisz do historii',
    noteModalPlaceholder: 'Np. spokojny sen bez wybudzeń',
    toastTrackingStarted: 'Rozpoczęto rejestrowanie snu 🌙',
    toastSessionSaved: 'Sen został pomyślnie zapisany! ✨',
    toastSessionAdded: 'Wpis dodany do historii',
    toastSessionRemoved: 'Wpis usunięty',
    toastCsvStarted: 'Rozpoczęto eksport CSV',
    toastCsvShared: 'Udostępniono do Dysku Google / aplikacji',
    toastShared: 'Udostępniono do aplikacji',
    toastCsvDownloaded: 'CSV pobrane – gotowe do Dysku Google / Arkuszy',
    toastCsvCopied: 'CSV skopiowane (możesz wkleić do Arkuszy)',
    toastSummaryCopied: 'Podsumowanie skopiowane do schowka',
    csvHeaders: {
      date: 'Data',
      startTime: 'Czas rozpoczęcia',
      endTime: 'Czas zakończenia',
      durationMinutes: 'Czas trwania (minuty)',
      durationFormat: 'Czas trwania (format)',
      sleepType: 'Rodzaj snu',
      sleepQuality: 'Jakość snu',
      note: 'Notatka',
    },
    csvSummary: {
      title: '📊 Podsumowanie harmonogramu snu',
      todayTotal: 'Dzisiaj łącznie:',
      napsCount: 'drzemek',
      recentRecords: 'Ostatnie wpisy:',
    },
    calendarTitle: 'Przełączanie historii według dni',
    allDays: 'Wszystkie dni',
    today: 'Dzisiaj',
    yesterday: 'Wczoraj',
    pickDate: 'Wybierz datę',
    noSessionsForDate: 'Brak zapisanych snów dla tego dnia.',
    showAllDaysBtn: 'Pokaż wszystkie dni',
    showMoreSessions: 'Pokaż więcej snów',
    showLessSessions: 'Pokaż mniej',
    scrollHint: 'Przesuń palcem, aby zobaczyć starsze sny',
    dayTotalLabel: 'W ten dzień:',
    calendarModalTitle: 'Wybierz dzień z kalendarza',
    calendarAllDaysBtn: 'Wszystkie dni',
    calendarTodayBtn: 'Dzisiaj',
    calendarCloseBtn: 'Zamknij',
    monthNames: [
      'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
      'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień',
    ],
    weekDaysShort: ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'],
    editTitle: 'Edytuj',
    editSessionModalTitle: 'Edytuj wpis snu',
    toastSessionUpdated: 'Wpis snu zaktualizowany ✨',
    toastStartTimeUpdated: 'Zmieniono godzinę zaśnięcia',
    editStartTimeBtn: 'Zmień czas',
    customStartTimeLabel: 'Dokładna godzina zaśnięcia:',
    applyBtn: 'Zastosuj',
    cancelBtn: 'Anuluj',
    sleepBoundsBtn: 'Godziny snu',
    sleepBoundsModalTitle: 'Godziny snu dziennego i nocnego',
    sleepBoundsModalDesc: 'Ustaw, od której godziny maluszek zazwyczaj ma drzemki dzienne, a od której sen nocny. Sen nocny rozpoczęty przed północą zostanie poprawnie wliczony do dzisiejszych statystyk.',
    daySleepFrom: 'Sen dzienny od',
    nightSleepFrom: 'Sen nocny od',
    dayWindowPreview: 'Dzień:',
    nightWindowPreview: 'Noc:',
    saveBoundsBtn: 'Zapisz godziny',
    toastBoundsUpdated: 'Zapisano godziny snu dziennego i nocnego ✨',
    sampleNote1: 'Szybko zasnęło po spacerze',
    sampleNote2: 'Spokojna noc',
  },
  hu: {
    currentStatus: 'Jelenlegi állapot',
    babySleeping: 'A baba alszik',
    babyAwake: 'Ébren van',
    fellAsleepAt: 'Elaludt:',
    timerBackgroundHint: 'Az időzítő a háttérben fut, bezárhatja az alkalmazást.',
    babyWokeUpBtn: 'A baba felébredt',
    heroTitle: 'Alvás rögzítése egy érintéssel',
    heroSubtitle: 'Amint lefekteti a babát, indítsa el az alvásidőzítőt.',
    babyFellAsleepBtn: 'A baba épp most aludt el',
    wakeWindow: 'Ébrenléti ablak:',
    sinceLastSleep: 'Legutóbbi alvás óta',
    todayTotal: 'Ma átaludt idő',
    todayNaps: 'Mai alvások',
    sessionsCount: 'alkalom',
    dayNap: 'Nappali alvás',
    nightSleep: 'Éjszakai alvás',
    average: 'Átlag',
    addManualBtn: 'Alvás hozzáadása manuálisan',
    date: 'Dátum',
    from: 'Ettől',
    to: 'Eddig',
    qualityLabel: 'Alvás minősége',
    qualityPeaceful: '🌿 Nyugodt',
    qualityNormal: '😴 Normál',
    qualityRestless: '🌪️ Nyugtalan',
    notePlaceholder: 'Megjegyzés (pl. fogzás)',
    saveSessionBtn: 'Bejegyzés mentése',
    exportCardTitle: 'Exportálás Google Drive-ra és Táblázatokba',
    exportCardSubtitle: 'Adatok letöltése vagy megosztása CSV formátumban',
    exportShareBtn: 'CSV mentése / megosztása',
    copyCSVBtn: 'CSV másolása',
    copySummaryBtn: 'Összegzés',
    exportInfo: 'A CSV fájl UTF-8 kódolású, közvetlenül feltölthető a Google Drive-ra vagy megnyitható a Google Táblázatokban.',
    historyTitle: 'Alvástörténet',
    latestFirst: 'Legfrissebb felül',
    noHistory: 'Még nincs rögzített alvás. Érintse meg fent a "A baba épp most aludt el" gombot.',
    deleteTitle: 'Törlés',
    deleteConfirmTitle: 'Törli ezt az alvásbejegyzést?',
    deleteConfirmDesc: 'A bejegyzés véglegesen törlődik az alvástörténetből és a napi statisztikákból.',
    deleteConfirmBtn: 'Igen, törlés',
    saveWakeUpModal: 'Ébredés mentése',
    howWasSleep: 'Hogy aludt a baba?',
    discard: 'Elvetés',
    saveToHistory: 'Mentés a történetbe',
    noteModalPlaceholder: 'Pl. ébredés nélkül, nyugodtan aludt',
    toastTrackingStarted: 'Alváskövetés elindítva 🌙',
    toastSessionSaved: 'Alvás sikeresen elmentve! ✨',
    toastSessionAdded: 'Bejegyzés hozzáadva a történethez',
    toastSessionRemoved: 'Bejegyzés törölve',
    toastCsvStarted: 'CSV exportálás elindítva',
    toastCsvShared: 'Megosztva Google Drive-ra / alkalmazásba',
    toastShared: 'Megosztva alkalmazásba',
    toastCsvDownloaded: 'CSV letöltve – készen áll a Google Drive / Táblázatokhoz',
    toastCsvCopied: 'CSV másolva (beilleszthető a Táblázatokba)',
    toastSummaryCopied: 'Összegzés másolva a vágólapra',
    csvHeaders: {
      date: 'Dátum',
      startTime: 'Kezdési idő',
      endTime: 'Befejezési idő',
      durationMinutes: 'Időtartam (perc)',
      durationFormat: 'Időtartam (formázott)',
      sleepType: 'Alvás típusa',
      sleepQuality: 'Alvás minősége',
      note: 'Megjegyzés',
    },
    csvSummary: {
      title: '📊 Alvási rend összegzése',
      todayTotal: 'Ma összesen:',
      napsCount: 'alvás',
      recentRecords: 'Legutóbbi bejegyzések:',
    },
    calendarTitle: 'Történet váltása napok szerint',
    allDays: 'Minden nap',
    today: 'Ma',
    yesterday: 'Tegnap',
    pickDate: 'Dátum választása',
    noSessionsForDate: 'Ehhez a naphoz nincs rögzített alvás.',
    showAllDaysBtn: 'Minden nap megjelenítése',
    showMoreSessions: 'További alvások',
    showLessSessions: 'Kevesebb',
    scrollHint: 'Görgessen az ujjával a régebbi alvásokhoz',
    dayTotalLabel: 'Ezen a napon:',
    calendarModalTitle: 'Válasszon napot a naptárból',
    calendarAllDaysBtn: 'Minden nap',
    calendarTodayBtn: 'Ma',
    calendarCloseBtn: 'Bezárás',
    monthNames: [
      'Január', 'Február', 'Március', 'Április', 'Május', 'Június',
      'Július', 'Augusztus', 'Szeptember', 'Október', 'November', 'December',
    ],
    weekDaysShort: ['Hé', 'Ke', 'Sze', 'Csü', 'Pén', 'Szo', 'Vas'],
    editTitle: 'Szerkesztés',
    editSessionModalTitle: 'Alvás szerkesztése',
    toastSessionUpdated: 'Alvásadatok frissítve ✨',
    toastStartTimeUpdated: 'Elalvás ideje frissítve',
    editStartTimeBtn: 'Idő módosítása',
    customStartTimeLabel: 'Pontos elalvási idő:',
    applyBtn: 'Alkalmaz',
    cancelBtn: 'Mégse',
    sleepBoundsBtn: 'Alvási idősáv',
    sleepBoundsModalTitle: 'Nappali és éjszakai alvás ideje',
    sleepBoundsModalDesc: 'Állítsd be, hány órától számít nappali, illetve éjszakai alvásnak a baba pihenése. Az éjfél előtt megkezdett éjszakai alvás így pontosan a mai összesítésbe kerül.',
    daySleepFrom: 'Nappali alvás ettől',
    nightSleepFrom: 'Éjszakai alvás ettől',
    dayWindowPreview: 'Nappal:',
    nightWindowPreview: 'Éjszaka:',
    saveBoundsBtn: 'Idők mentése',
    toastBoundsUpdated: 'Nappali és éjszakai idősáv elmentve ✨',
    sampleNote1: 'Séta után gyorsan elaludt',
    sampleNote2: 'Nyugodt éjszaka',
  },
  uk: {
    currentStatus: 'Поточний стан',
    babySleeping: 'Дитина спить',
    babyAwake: 'Не спить',
    fellAsleepAt: 'Заснув о',
    timerBackgroundHint: 'Таймер працює у фоновому режимі, можна згорнути додаток.',
    babyWokeUpBtn: 'Дитина прокинулася',
    heroTitle: 'Запис сну в один дотик',
    heroSubtitle: 'Щойно покладете малюка, запустіть таймер сну.',
    babyFellAsleepBtn: 'Дитина щойно заснула',
    wakeWindow: 'Вікно неспання:',
    sinceLastSleep: 'З останнього сну',
    todayTotal: 'Сьогодні поспав',
    todayNaps: 'Сни за сьогодні',
    sessionsCount: 'записів',
    dayNap: 'Денний сон',
    nightSleep: 'Нічний сон',
    average: 'Середнє',
    addManualBtn: 'Додати сон вручну',
    date: 'Дата',
    from: 'З',
    to: 'До',
    qualityLabel: 'Якість сну',
    qualityPeaceful: '🌿 Спокійний',
    qualityNormal: '😴 Нормальний',
    qualityRestless: '🌪️ Неспокійний',
    notePlaceholder: 'Примітка (напр., ріжуться зубки)',
    saveSessionBtn: 'Зберегти запис',
    exportCardTitle: 'Експорт у Google Диск та Таблиці',
    exportCardSubtitle: 'Завантажити або поділитися даними CSV',
    exportShareBtn: 'Зберегти / Поділитися CSV',
    copyCSVBtn: 'Копіювати CSV',
    copySummaryBtn: 'Підсумок',
    exportInfo: 'Створений CSV файл має кодування UTF-8 і може бути завантажений на Google Диск чи відкритий у Google Таблицях.',
    historyTitle: 'Історія сну',
    latestFirst: 'Спочатку найновіші',
    noHistory: 'Ще немає записів сну. Натисніть вище "Дитина щойно заснула".',
    deleteTitle: 'Видалити',
    deleteConfirmTitle: 'Видалити цей запис сну?',
    deleteConfirmDesc: 'Запис буде остаточно видалено з історії сну та денної статистики.',
    deleteConfirmBtn: 'Так, видалити',
    saveWakeUpModal: 'Зберегти пробудження',
    howWasSleep: 'Як спала дитина?',
    discard: 'Скасувати',
    saveToHistory: 'Зберегти в історію',
    noteModalPlaceholder: 'Напр., спокійний сон без прокидань',
    toastTrackingStarted: 'Відстеження сну розпочато 🌙',
    toastSessionSaved: 'Сон успішно збережено! ✨',
    toastSessionAdded: 'Запис додано до історії',
    toastSessionRemoved: 'Запис видалено',
    toastCsvStarted: 'Експорт CSV розпочато',
    toastCsvShared: 'Поділилися в Google Диск / додаток',
    toastShared: 'Поділилися в додаток',
    toastCsvDownloaded: 'CSV завантажено – готово для Google Диска / Таблиць',
    toastCsvCopied: 'CSV скопійовано (можна вставити в Таблиці)',
    toastSummaryCopied: 'Підсумок скопійовано в буфер',
    csvHeaders: {
      date: 'Дата',
      startTime: 'Час початку',
      endTime: 'Час закінчення',
      durationMinutes: 'Тривалість (хвилини)',
      durationFormat: 'Тривалість (формат)',
      sleepType: 'Тип сну',
      sleepQuality: 'Якість сну',
      note: 'Примітка',
    },
    csvSummary: {
      title: '📊 Підсумок режиму сну',
      todayTotal: 'Сьогодні разом:',
      napsCount: 'снів',
      recentRecords: 'Останні записи:',
    },
    calendarTitle: 'Перемикання історії за днями',
    allDays: 'Всі дні',
    today: 'Сьогодні',
    yesterday: 'Вчора',
    pickDate: 'Обрати дату',
    noSessionsForDate: 'Для обраного дня немає записів сну.',
    showAllDaysBtn: 'Показати всі дні',
    showMoreSessions: 'Показати більше снів',
    showLessSessions: 'Показати менше',
    scrollHint: 'Прокрутіть пальцем для старіших снів',
    dayTotalLabel: 'У цей день:',
    calendarModalTitle: 'Обрати день у календарі',
    calendarAllDaysBtn: 'Всі дні',
    calendarTodayBtn: 'Сьогодні',
    calendarCloseBtn: 'Закрити',
    monthNames: [
      'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
      'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень',
    ],
    weekDaysShort: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'],
    editTitle: 'Редагувати',
    editSessionModalTitle: 'Редагувати запис сну',
    toastSessionUpdated: 'Запис сну оновлено ✨',
    toastStartTimeUpdated: 'Час засинання змінено',
    editStartTimeBtn: 'Змінити час',
    customStartTimeLabel: 'Точний час засинання:',
    applyBtn: 'Застосувати',
    cancelBtn: 'Скасувати',
    sleepBoundsBtn: 'Час сну',
    sleepBoundsModalTitle: 'Години денного та нічного сну',
    sleepBoundsModalDesc: 'Вкажіть, з якої години у малюка зазвичай денний, а з якої — нічний сон. Нічний сон, що почався до опівночі, коректно врахується в сьогоднішній статистиці.',
    daySleepFrom: 'Денний сон з',
    nightSleepFrom: 'Нічний сон з',
    dayWindowPreview: 'День:',
    nightWindowPreview: 'Ніч:',
    saveBoundsBtn: 'Зберегти години',
    toastBoundsUpdated: 'Години денного та нічного сну збережено ✨',
    sampleNote1: 'Швидко заснуло після прогулянки',
    sampleNote2: 'Спокійна ніч',
  },
  it: {
    currentStatus: 'Stato attuale',
    babySleeping: 'Il bimbo dorme',
    babyAwake: 'Sveglio',
    fellAsleepAt: 'Si è addormentato alle',
    timerBackgroundHint: "Il timer funziona in background, puoi chiudere l'app.",
    babyWokeUpBtn: 'Il bimbo si è svegliato',
    heroTitle: 'Registra sonno con un tocco',
    heroSubtitle: 'Appena metti a letto il bimbo, avvia il timer.',
    babyFellAsleepBtn: 'Il bimbo si è appena addormentato',
    wakeWindow: 'Finestra di veglia:',
    sinceLastSleep: "Dall'ultimo sonno",
    todayTotal: 'Dormito oggi',
    todayNaps: 'Sonni di oggi',
    sessionsCount: 'sessioni',
    dayNap: 'Pisolino diurno',
    nightSleep: 'Sonno notturno',
    average: 'Media',
    addManualBtn: 'Aggiungi sonno manualmente',
    date: 'Data',
    from: 'Dalle',
    to: 'Alle',
    qualityLabel: 'Qualità del sonno',
    qualityPeaceful: '🌿 Tranquillo',
    qualityNormal: '😴 Normale',
    qualityRestless: '🌪️ Agitato',
    notePlaceholder: 'Nota (opzionale, es. dentizione)',
    saveSessionBtn: 'Salva sessione',
    exportCardTitle: 'Esporta su Google Drive e Fogli',
    exportCardSubtitle: 'Scarica o condividi dati in CSV',
    exportShareBtn: 'Salva / Condividi CSV',
    copyCSVBtn: 'Copia CSV',
    copySummaryBtn: 'Riepilogo',
    exportInfo: 'Il file CSV generato include codifica UTF-8 ed è pronto per Google Drive o Fogli Google.',
    historyTitle: 'Cronologia del sonno',
    latestFirst: 'I più recenti in alto',
    noHistory: 'Nessun sonno registrato finora. Tocca sopra "Il bimbo si è appena addormentato".',
    deleteTitle: 'Elimina',
    deleteConfirmTitle: 'Eliminare questa sessione di sonno?',
    deleteConfirmDesc: 'La sessione verrà rimossa definitivamente dalla cronologia e dalle statistiche giornaliere.',
    deleteConfirmBtn: 'Sì, elimina',
    saveWakeUpModal: 'Salva risveglio',
    howWasSleep: 'Come ha dormito il bimbo?',
    discard: 'Annulla',
    saveToHistory: 'Salva nella cronologia',
    noteModalPlaceholder: 'Es. sonno tranquillo senza risvegli',
    toastTrackingStarted: 'Registrazione sonno avviata 🌙',
    toastSessionSaved: 'Sonno salvato con successo! ✨',
    toastSessionAdded: 'Sessione aggiunta alla cronologia',
    toastSessionRemoved: 'Sessione eliminata',
    toastCsvStarted: 'Esportazione CSV avviata',
    toastCsvShared: 'Condiviso su Google Drive / app',
    toastShared: "Condiviso con l'app",
    toastCsvDownloaded: 'CSV scaricato – pronto per Google Drive / Fogli',
    toastCsvCopied: 'CSV copiato negli appunti',
    toastSummaryCopied: 'Riepilogo copiato negli appunti',
    csvHeaders: {
      date: 'Data',
      startTime: 'Ora inizio',
      endTime: 'Ora fine',
      durationMinutes: 'Durata (minuti)',
      durationFormat: 'Durata (formattata)',
      sleepType: 'Tipo di sonno',
      sleepQuality: 'Qualità del sonno',
      note: 'Nota',
    },
    csvSummary: {
      title: '📊 Riepilogo del sonno',
      todayTotal: 'Oggi totale:',
      napsCount: 'sonni',
      recentRecords: 'Registrazioni recenti:',
    },
    calendarTitle: 'Cambia cronologia per giorno',
    allDays: 'Tutti i giorni',
    today: 'Oggi',
    yesterday: 'Ieri',
    pickDate: 'Scegli data',
    noSessionsForDate: 'Nessun sonno registrato per questo giorno.',
    showAllDaysBtn: 'Mostra tutti i giorni',
    showMoreSessions: 'Mostra altri sonni',
    showLessSessions: 'Mostra meno',
    scrollHint: 'Scorri con il dito per i sonni precedenti',
    dayTotalLabel: 'In questo giorno:',
    calendarModalTitle: 'Seleziona giorno dal calendario',
    calendarAllDaysBtn: 'Tutti i giorni',
    calendarTodayBtn: 'Oggi',
    calendarCloseBtn: 'Chiudi',
    monthNames: [
      'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
      'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
    ],
    weekDaysShort: ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'],
    editTitle: 'Modifica',
    editSessionModalTitle: 'Modifica sessione',
    toastSessionUpdated: 'Sessione aggiornata ✨',
    toastStartTimeUpdated: 'Ora di inizio aggiornata',
    editStartTimeBtn: 'Modifica ora',
    customStartTimeLabel: 'Ora esatta di addormentamento:',
    applyBtn: 'Applica',
    cancelBtn: 'Annulla',
    sleepBoundsBtn: 'Orari sonno',
    sleepBoundsModalTitle: 'Orari sonno diurno e notturno',
    sleepBoundsModalDesc: 'Imposta da che ora il bambino fa abitualmente i riposini diurni e da che ora inizia il sonno notturno. Il sonno iniziato prima di mezzanotte verrà conteggiato correttamente oggi.',
    daySleepFrom: 'Sonno diurno dalle',
    nightSleepFrom: 'Sonno notturno dalle',
    dayWindowPreview: 'Giorno:',
    nightWindowPreview: 'Notte:',
    saveBoundsBtn: 'Salva orari',
    toastBoundsUpdated: 'Orari diurni e notturni salvati ✨',
    sampleNote1: 'Addormentato subito dopo la passeggiata',
    sampleNote2: 'Notte serena',
  },
  es: {
    currentStatus: 'Estado actual',
    babySleeping: 'El bebé duerme',
    babyAwake: 'Despierto',
    fellAsleepAt: 'Se durmió a las',
    timerBackgroundHint: 'El cronómetro sigue en segundo plano, puedes cerrar la app con tranquilidad.',
    babyWokeUpBtn: 'El bebé se despertó',
    heroTitle: 'Registra el sueño con un toque',
    heroSubtitle: 'En cuanto acuestes a tu bebé, inicia el cronómetro de sueño.',
    babyFellAsleepBtn: 'El bebé acaba de dormirse',
    wakeWindow: 'Ventana de vigilia:',
    sinceLastSleep: 'Desde el último sueño',
    todayTotal: 'Total de hoy',
    todayNaps: 'Sueños de hoy',
    sessionsCount: 'registros',
    dayNap: 'Siesta diurna',
    nightSleep: 'Sueño nocturno',
    average: 'Promedio',
    addManualBtn: 'Añadir sueño manualmente',
    date: 'Fecha',
    from: 'Desde',
    to: 'Hasta',
    qualityLabel: 'Calidad del sueño',
    qualityPeaceful: '🌿 Tranquilo',
    qualityNormal: '😴 Normal',
    qualityRestless: '🌪️ Inquieto',
    notePlaceholder: 'Nota (opcional, ej. dentición)',
    saveSessionBtn: 'Guardar registro',
    exportCardTitle: 'Exportar a Google Drive y Hojas',
    exportCardSubtitle: 'Descarga o comparte los datos en formato CSV',
    exportShareBtn: 'Guardar / Compartir CSV',
    copyCSVBtn: 'Copiar CSV',
    copySummaryBtn: 'Resumen',
    exportInfo: 'El archivo CSV incluye codificación UTF-8 listo para Google Drive o Google Sheets.',
    historyTitle: 'Historial de sueño',
    latestFirst: 'Más recientes arriba',
    noHistory: 'Aún no hay ningún sueño registrado. Toca arriba en "El bebé acaba de dormirse".',
    deleteTitle: 'Eliminar',
    deleteConfirmTitle: '¿Eliminar este registro de sueño?',
    deleteConfirmDesc: 'El registro se eliminará de forma permanente del historial y de las estadísticas diarias.',
    deleteConfirmBtn: 'Sí, eliminar',
    saveWakeUpModal: 'Guardar despertar',
    howWasSleep: '¿Cómo durmió el bebé?',
    discard: 'Descartar',
    saveToHistory: 'Guardar en historial',
    noteModalPlaceholder: 'Ej. sin despertares nocturnos',
    toastTrackingStarted: 'Seguimiento del sueño iniciado 🌙',
    toastSessionSaved: '¡Sueño guardado correctamente! ✨',
    toastSessionAdded: 'Registro añadido al historial',
    toastSessionRemoved: 'Registro eliminado',
    toastCsvStarted: 'Guardado de CSV iniciado',
    toastCsvShared: 'Compartido a Google Drive / app',
    toastShared: 'Compartido a la aplicación',
    toastCsvDownloaded: 'CSV descargado y listo para Google Drive / Hojas',
    toastCsvCopied: 'CSV copiado (listo para pegar en Hojas)',
    toastSummaryCopied: 'Resumen copiado al portapapeles',
    csvHeaders: {
      date: 'Fecha',
      startTime: 'Hora de inicio',
      endTime: 'Hora de fin',
      durationMinutes: 'Duración (minutos)',
      durationFormat: 'Duración (formato)',
      sleepType: 'Tipo de sueño',
      sleepQuality: 'Calidad del sueño',
      note: 'Nota',
    },
    csvSummary: {
      title: '📊 Resumen del horario de sueño',
      todayTotal: 'Total de hoy:',
      napsCount: 'sueños',
      recentRecords: 'Registros recientes:',
    },
    calendarTitle: 'Filtrar historial por día',
    allDays: 'Todos los días',
    today: 'Hoy',
    yesterday: 'Ayer',
    pickDate: 'Elegir fecha',
    noSessionsForDate: 'No hay registros de sueño para el día seleccionado.',
    showAllDaysBtn: 'Mostrar todos los días',
    showMoreSessions: 'Mostrar más registros',
    showLessSessions: 'Mostrar menos',
    scrollHint: 'Desliza con el dedo para ver registros anteriores',
    dayTotalLabel: 'En este día:',
    calendarModalTitle: 'Elegir día del calendario',
    calendarAllDaysBtn: 'Todos los días',
    calendarTodayBtn: 'Hoy',
    calendarCloseBtn: 'Cerrar',
    monthNames: [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ],
    weekDaysShort: ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'],
    editTitle: 'Editar',
    editSessionModalTitle: 'Editar registro de sueño',
    toastSessionUpdated: 'Registro de sueño actualizado ✨',
    toastStartTimeUpdated: 'Hora de inicio actualizada',
    editStartTimeBtn: 'Editar hora',
    customStartTimeLabel: 'Hora exacta en que se durmió:',
    applyBtn: 'Aplicar',
    cancelBtn: 'Cancelar',
    sleepBoundsBtn: 'Horarios',
    sleepBoundsModalTitle: 'Horario de sueño diurno y nocturno',
    sleepBoundsModalDesc: 'Configura a qué hora suele hacer siestas diurnas y a qué hora empieza el sueño nocturno de tu bebé. El sueño nocturno iniciado antes de medianoche se contará correctamente en el resumen de hoy.',
    daySleepFrom: 'Sueño diurno desde',
    nightSleepFrom: 'Sueño nocturno desde',
    dayWindowPreview: 'Día:',
    nightWindowPreview: 'Noche:',
    saveBoundsBtn: 'Guardar horarios',
    toastBoundsUpdated: 'Horarios de día y noche guardados ✨',
    sampleNote1: 'Se durmió rápido tras el paseo',
    sampleNote2: 'Noche tranquila',
  },
  ro: {
    currentStatus: 'Stare curentă',
    babySleeping: 'Bebelușul doarme',
    babyAwake: 'Treaz',
    fellAsleepAt: 'A adormit la',
    timerBackgroundHint: 'Cronometrul rulează în fundal, poți închide liniștit aplicația.',
    babyWokeUpBtn: 'Bebelușul s-a trezit',
    heroTitle: 'Înregistrează somnul cu o atingere',
    heroSubtitle: 'Imediat ce culci bebelușul, pornește cronometrul de somn.',
    babyFellAsleepBtn: 'Bebelușul tocmai a adormit',
    wakeWindow: 'Fereastră de veghe:',
    sinceLastSleep: 'De la ultimul somn',
    todayTotal: 'Total azi',
    todayNaps: 'Somnuri azi',
    sessionsCount: 'sesiuni',
    dayNap: 'Somn de zi',
    nightSleep: 'Somn de noapte',
    average: 'Medie',
    addManualBtn: 'Adaugă somn manual',
    date: 'Data',
    from: 'De la',
    to: 'Până la',
    qualityLabel: 'Calitatea somnului',
    qualityPeaceful: '🌿 Liniștit',
    qualityNormal: '😴 Normal',
    qualityRestless: '🌪️ Agitat',
    notePlaceholder: 'Notă (opțional, ex. dințișori)',
    saveSessionBtn: 'Salvează sesiunea',
    exportCardTitle: 'Export în Google Drive și Sheets',
    exportCardSubtitle: 'Descarcă sau distribuie datele în format CSV',
    exportShareBtn: 'Salvează / Distribuie CSV',
    copyCSVBtn: 'Copiază CSV',
    copySummaryBtn: 'Rezumat',
    exportInfo: 'Fișierul CSV folosește UTF-8 și poate fi încărcat direct în Google Drive sau Google Sheets.',
    historyTitle: 'Istoric somn',
    latestFirst: 'Cele mai noi sus',
    noHistory: 'Nu există încă niciun somn înregistrat. Apasă mai sus pe „Bebelușul tocmai a adormit”.',
    deleteTitle: 'Șterge',
    deleteConfirmTitle: 'Ștergi această sesiune de somn?',
    deleteConfirmDesc: 'Înregistrarea va fi ștearsă definitiv din istoric și din statisticile zilnice.',
    deleteConfirmBtn: 'Da, șterge',
    saveWakeUpModal: 'Salvează trezirea',
    howWasSleep: 'Cum a dormit bebelușul?',
    discard: 'Renunță',
    saveToHistory: 'Salvează în istoric',
    noteModalPlaceholder: 'Ex. fără treziri nocturne',
    toastTrackingStarted: 'Monitorizarea somnului a început 🌙',
    toastSessionSaved: 'Somnul a fost salvat cu succes! ✨',
    toastSessionAdded: 'Sesiune adăugată în istoric',
    toastSessionRemoved: 'Sesiune ștearsă',
    toastCsvStarted: 'Salvarea CSV a început',
    toastCsvShared: 'Distribuit în Google Drive / aplicație',
    toastShared: 'Distribuit în aplicație',
    toastCsvDownloaded: 'CSV descărcat – gata pentru Google Drive / Sheets',
    toastCsvCopied: 'CSV copiat (poți lipi în Sheets)',
    toastSummaryCopied: 'Rezumat copiat în clipboard',
    csvHeaders: {
      date: 'Data',
      startTime: 'Ora de început',
      endTime: 'Ora de sfârșit',
      durationMinutes: 'Durată (minute)',
      durationFormat: 'Durată (format)',
      sleepType: 'Tip somn',
      sleepQuality: 'Calitate somn',
      note: 'Notă',
    },
    csvSummary: {
      title: '📊 Rezumat program de somn',
      todayTotal: 'Total azi:',
      napsCount: 'somnuri',
      recentRecords: 'Înregistrări recente:',
    },
    calendarTitle: 'Filtrează istoricul pe zile',
    allDays: 'Toate zilele',
    today: 'Azi',
    yesterday: 'Ieri',
    pickDate: 'Alege data',
    noSessionsForDate: 'Nu există sesiuni de somn pentru ziua selectată.',
    showAllDaysBtn: 'Arată toate zilele',
    showMoreSessions: 'Arată mai multe sesiuni',
    showLessSessions: 'Arată mai puțin',
    scrollHint: 'Glisează cu degetul pentru sesiuni mai vechi',
    dayTotalLabel: 'În această zi:',
    calendarModalTitle: 'Alege ziua din calendar',
    calendarAllDaysBtn: 'Toate zilele',
    calendarTodayBtn: 'Azi',
    calendarCloseBtn: 'Închide',
    monthNames: [
      'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
      'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie',
    ],
    weekDaysShort: ['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ', 'Du'],
    editTitle: 'Editează',
    editSessionModalTitle: 'Editează sesiunea de somn',
    toastSessionUpdated: 'Sesiunea de somn a fost actualizată ✨',
    toastStartTimeUpdated: 'Ora de adormire a fost actualizată',
    editStartTimeBtn: 'Modifică ora',
    customStartTimeLabel: 'Ora exactă a adormirii:',
    applyBtn: 'Aplică',
    cancelBtn: 'Anulează',
    sleepBoundsBtn: 'Intervale',
    sleepBoundsModalTitle: 'Orele de somn de zi și de noapte',
    sleepBoundsModalDesc: 'Stabilește de la ce oră doarme de obicei bebelușul ziua și de la ce oră începe somnul de noapte. Somnul de noapte început înainte de miezul nopții va fi inclus corect în rezumatul de azi.',
    daySleepFrom: 'Somn de zi de la',
    nightSleepFrom: 'Somn de noapte de la',
    dayWindowPreview: 'Zi:',
    nightWindowPreview: 'Noapte:',
    saveBoundsBtn: 'Salvează orele',
    toastBoundsUpdated: 'Intervalele de zi și noapte au fost salvate ✨',
    sampleNote1: 'A adormit rapid după plimbare',
    sampleNote2: 'Noapte liniștită',
  },
  ar: {
    currentStatus: 'الحالة الحالية',
    babySleeping: 'الطفل نائم',
    babyAwake: 'مستيقظ',
    fellAsleepAt: 'نام في الساعة',
    timerBackgroundHint: 'يعمل المؤقت في الخلفية، يمكنك إغلاق التطبيق بأمان.',
    babyWokeUpBtn: 'استيقظ الطفل',
    heroTitle: 'سجّل النوم بلمسة واحدة',
    heroSubtitle: 'شغّل مؤقت النوم فور وضع طفلك للنوم.',
    babyFellAsleepBtn: 'نام الطفل الآن',
    wakeWindow: 'فترة اليقظة:',
    sinceLastSleep: 'منذ آخر نوم',
    todayTotal: 'مجموع اليوم',
    todayNaps: 'جلسات اليوم',
    sessionsCount: 'جلسات',
    dayNap: 'نوم النهار',
    nightSleep: 'نوم الليل',
    average: 'المتوسط',
    addManualBtn: 'إضافة نوم يدوياً',
    date: 'التاريخ',
    from: 'من',
    to: 'إلى',
    qualityLabel: 'جودة النوم',
    qualityPeaceful: '🌿 هادئ',
    qualityNormal: '😴 عادي',
    qualityRestless: '🌪️ متقطع',
    notePlaceholder: 'ملاحظة (اختياري، مثل التسنين)',
    saveSessionBtn: 'حفظ السجل',
    exportCardTitle: 'تصدير إلى Google Drive وجداول البيانات',
    exportCardSubtitle: 'تنزيل أو مشاركة البيانات بصيغة CSV',
    exportShareBtn: 'حفظ / مشاركة CSV',
    copyCSVBtn: 'نسخ CSV',
    copySummaryBtn: 'ملخص',
    exportInfo: 'ملف CSV يدعم UTF-8 وجاهز للرفع إلى Google Drive أو Google Sheets.',
    historyTitle: 'سجل النوم',
    latestFirst: 'الأحدث أولاً',
    noHistory: 'لا توجد جلسات نوم مسجلة بعد. اضغط أعلاه على «نام الطفل الآن».',
    deleteTitle: 'حذف',
    deleteConfirmTitle: 'هل تريد حذف سجل النوم هذا؟',
    deleteConfirmDesc: 'سيتم حذف الجلسة نهائياً من سجل النوم ومن إحصاءات اليوم.',
    deleteConfirmBtn: 'نعم، احذف',
    saveWakeUpModal: 'حفظ الاستيقاظ',
    howWasSleep: 'كيف كان نوم الطفل؟',
    discard: 'تجاهل',
    saveToHistory: 'حفظ في السجل',
    noteModalPlaceholder: 'مثال: دون استيقاظ ليلي',
    toastTrackingStarted: 'بدأ تسجيل النوم 🌙',
    toastSessionSaved: 'تم حفظ جلسة النوم بنجاح! ✨',
    toastSessionAdded: 'تمت إضافة السجل إلى التاريخ',
    toastSessionRemoved: 'تم حذف السجل',
    toastCsvStarted: 'بدأ حفظ ملف CSV',
    toastCsvShared: 'تمت المشاركة إلى التطبيق',
    toastShared: 'تمت المشاركة',
    toastCsvDownloaded: 'تم تنزيل CSV بنجاح',
    toastCsvCopied: 'تم نسخ CSV',
    toastSummaryCopied: 'تم نسخ الملخص',
    csvHeaders: {
      date: 'التاريخ',
      startTime: 'وقت البداية',
      endTime: 'وقت النهاية',
      durationMinutes: 'المدة (دقائق)',
      durationFormat: 'المدة (صيغة)',
      sleepType: 'نوع النوم',
      sleepQuality: 'جودة النوم',
      note: 'ملاحظة',
    },
    csvSummary: {
      title: '📊 ملخص جدول النوم',
      todayTotal: 'مجموع اليوم:',
      napsCount: 'جلسات',
      recentRecords: 'أحدث السجلات:',
    },
    calendarTitle: 'تصفية السجل حسب اليوم',
    allDays: 'كل الأيام',
    today: 'اليوم',
    yesterday: 'أمس',
    pickDate: 'اختر تاريخاً',
    noSessionsForDate: 'لا توجد جلسات نوم مسجلة لهذا اليوم.',
    showAllDaysBtn: 'عرض كل الأيام',
    showMoreSessions: 'عرض المزيد',
    showLessSessions: 'عرض أقل',
    scrollHint: 'اسحب بإصبعك لتصفح الجلسات الأقدم',
    dayTotalLabel: 'في هذا اليوم:',
    calendarModalTitle: 'اختر يوماً من التقويم',
    calendarAllDaysBtn: 'كل الأيام',
    calendarTodayBtn: 'اليوم',
    calendarCloseBtn: 'إغلاق',
    monthNames: [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
    ],
    weekDaysShort: ['ن', 'ث', 'ر', 'خ', 'ج', 'س', 'ح'],
    editTitle: 'تعديل',
    editSessionModalTitle: 'تعديل سجل النوم',
    toastSessionUpdated: 'تم تحديث سجل النوم ✨',
    toastStartTimeUpdated: 'تم تحديث وقت بداية النوم',
    editStartTimeBtn: 'تعديل الوقت',
    customStartTimeLabel: 'الوقت الدقيق لبداية النوم:',
    applyBtn: 'تطبيق',
    cancelBtn: 'إلغاء',
    sleepBoundsBtn: 'أوقات النوم',
    sleepBoundsModalTitle: 'أوقات نوم النهار والليل',
    sleepBoundsModalDesc: 'حدّد متى يبدأ عادةً نوم النهار ومتى يبدأ نوم الليل لطفلك. سيُحتسب نوم الليل الذي بدأ قبل منتصف الليل بدقة ضمن إحصاءات اليوم.',
    daySleepFrom: 'نوم النهار من',
    nightSleepFrom: 'نوم الليل من',
    dayWindowPreview: 'النهار:',
    nightWindowPreview: 'الليل:',
    saveBoundsBtn: 'حفظ الأوقات',
    toastBoundsUpdated: 'تم حفظ أوقات النهار والليل ✨',
    sampleNote1: 'نام سريعاً بعد النزهة',
    sampleNote2: 'ليلة هادئة',
  },
};

const dateLocales: Record<Language, string> = {
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

export const ScheduleAssistantMode: React.FC<ScheduleAssistantModeProps> = ({
  language,
  babyName = '',
  babyBirthDate = '',
  onChangeBabyBirthDate,
  lockScreenSleepEnabled = true,
  wakeReminderEnabled = false,
  onToggleWakeReminder,
  scheduledWakeReminder = null,
  activeSleepStart: controlledActiveSleepStart,
  sleepElapsedSeconds: controlledElapsedSeconds,
  onUpdateActiveSleepStart,
}) => {
  const baseTexts = scheduleTexts[language] || scheduleTexts.en;
  const personalized = getPersonalizedSchedulePhrases(babyName, language);
  const personalizedCopy = getPersonalizedCopy(babyName, language);
  const wakeCopy = getWakeWindowCopy(language, babyName);
  const lockCopy = getLockScreenCopy(language);
  const reminderCopy = getWakeReminderCopy(language, babyName);
  const texts: ScheduleTexts = personalized
    ? {
        ...baseTexts,
        ...personalized,
      }
    : baseTexts;
  const currentLocale = dateLocales[language] || 'en-US';
  const [isBirthDateModalOpen, setIsBirthDateModalOpen] = useState<boolean>(false);
  const [draftBirthDate, setDraftBirthDate] = useState<string>(babyBirthDate);
  const [wakeClockTick, setWakeClockTick] = useState<number>(() => Date.now());

  const nowForDates = new Date(wakeClockTick);
  const todayDateStr = toLocalDateStr(nowForDates);
  const yesterdayDate = new Date(
    nowForDates.getFullYear(),
    nowForDates.getMonth(),
    nowForDates.getDate() - 1,
    12,
    0,
    0
  );
  const yesterdayDateStr = toLocalDateStr(yesterdayDate);

  // Customizable Day / Night sleep schedule window (persisted in localStorage)
  const [scheduleBounds, setScheduleBounds] = useState<SleepScheduleBounds>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BOUNDS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed?.dayStart === 'string' && typeof parsed?.nightStart === 'string') {
          return { dayStart: parsed.dayStart, nightStart: parsed.nightStart };
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_SCHEDULE_BOUNDS;
  });
  const [isBoundsModalOpen, setIsBoundsModalOpen] = useState<boolean>(false);
  const [draftDayStart, setDraftDayStart] = useState<string>(scheduleBounds.dayStart);
  const [draftNightStart, setDraftNightStart] = useState<string>(scheduleBounds.nightStart);

  const handleOpenBoundsModal = () => {
    triggerHaptic('light');
    setDraftDayStart(scheduleBounds.dayStart);
    setDraftNightStart(scheduleBounds.nightStart);
    setIsBoundsModalOpen(true);
  };

  const handleSaveScheduleBounds = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftDayStart || !draftNightStart) return;
    triggerHaptic('medium');
    const nextBounds: SleepScheduleBounds = {
      dayStart: draftDayStart,
      nightStart: draftNightStart,
    };
    setScheduleBounds(nextBounds);
    try {
      localStorage.setItem(STORAGE_KEY_BOUNDS, JSON.stringify(nextBounds));
    } catch {
      // ignore
    }
    // Re-classify existing saved sessions based on the parent's updated day/night schedule
    setSessions((prev) =>
      prev.map((session) => ({
        ...session,
        type: classifySleepTypeByBounds(session.startTime, nextBounds),
      }))
    );
    setIsBoundsModalOpen(false);
    showToast(texts.toastBoundsUpdated);
  };

  // Selected date filter (null = 'all' days, or specific ISO string 'YYYY-MM-DD')
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);

  // History section visibility: collapsed by default, smoothly unrolls on tap
  const [isHistorySectionOpen, setIsHistorySectionOpen] = useState<boolean>(false);

  // History expanded state: default false (shows max 6), expands to 10 + touch scrolling
  const [isHistoryExpanded, setIsHistoryExpanded] = useState<boolean>(false);

  // Interactive Month Calendar Modal state
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState<boolean>(false);
  const [calendarViewingYear, setCalendarViewingYear] = useState<number>(() => new Date().getFullYear());
  const [calendarViewingMonth, setCalendarViewingMonth] = useState<number>(() => new Date().getMonth());

  const handleOpenCalendarModal = () => {
    triggerHaptic('light');
    if (selectedDateFilter) {
      const parts = selectedDateFilter.split('-');
      if (parts.length === 3) {
        setCalendarViewingYear(parseInt(parts[0], 10));
        setCalendarViewingMonth(parseInt(parts[1], 10) - 1);
      }
    } else {
      const now = new Date();
      setCalendarViewingYear(now.getFullYear());
      setCalendarViewingMonth(now.getMonth());
    }
    setIsCalendarModalOpen(true);
  };

  const handlePrevMonth = () => {
    triggerHaptic('light');
    setCalendarViewingMonth((prev) => {
      if (prev === 0) {
        setCalendarViewingYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    triggerHaptic('light');
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    if (
      calendarViewingYear > currentYear ||
      (calendarViewingYear === currentYear && calendarViewingMonth >= currentMonth)
    ) {
      return;
    }
    setCalendarViewingMonth((prev) => {
      if (prev === 11) {
        setCalendarViewingYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  const handleSelectDay = (dayStr: string) => {
    triggerHaptic('medium');
    setSelectedDateFilter(dayStr);
    setIsCalendarModalOpen(false);
  };

  // Load sessions from localStorage (fresh new users start with an empty sleep history)
  const [sessions, setSessions] = useState<SleepSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SESSIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed
            .filter(
              (item): item is SleepSession =>
                Boolean(item && typeof item.id === 'string' && item.startTime && item.endTime)
            )
            .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
        }
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Active ongoing sleep start time (controlled by App.tsx if provided, with fallback local state)
  const [internalActiveSleepStart, setInternalActiveSleepStart] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_ACTIVE_SLEEP);
    } catch {
      return null;
    }
  });
  const [internalElapsedSec, setInternalElapsedSec] = useState<number>(0);

  const isControlled = controlledActiveSleepStart !== undefined && onUpdateActiveSleepStart !== undefined;
  const activeSleepStart = isControlled ? controlledActiveSleepStart : internalActiveSleepStart;
  const setActiveSleepStartUnified = (nextIso: string | null) => {
    if (isControlled && onUpdateActiveSleepStart) {
      onUpdateActiveSleepStart(nextIso);
    } else {
      setInternalActiveSleepStart(nextIso);
      try {
        if (nextIso) {
          localStorage.setItem(STORAGE_KEY_ACTIVE_SLEEP, nextIso);
        } else {
          localStorage.removeItem(STORAGE_KEY_ACTIVE_SLEEP);
        }
      } catch {
        // ignore
      }
    }
  };

  // Manual entry form expand state
  const [showManualForm, setShowManualForm] = useState(false);

  // Ongoing sleep start time adjustment dropdown state
  const [isEditingStartTimeOpen, setIsEditingStartTimeOpen] = useState(false);
  const [customStartTimeInput, setCustomStartTimeInput] = useState('12:00');

  // Edit saved sleep session modal state
  const [editingSession, setEditingSession] = useState<SleepSession | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('13:00');
  const [editEndTime, setEditEndTime] = useState('14:30');
  const [editType, setEditType] = useState<SleepType>('day-nap');
  const [editQuality, setEditQuality] = useState<SleepQuality>('peaceful');
  const [editNotes, setEditNotes] = useState('');

  // Pending delete confirmation modal state (prevents accidental 1-tap deletion)
  const [sessionPendingDelete, setSessionPendingDelete] = useState<SleepSession | null>(null);

  // Quick finish modal state when waking up from live timer
  const [wakeModalOpen, setWakeModalOpen] = useState(false);
  const [pendingEndSession, setPendingEndSession] = useState<{
    startIso: string;
    endIso: string;
    durationMin: number;
  } | null>(null);

  // Completion modal form inputs
  const [modalType, setModalType] = useState<SleepType>('day-nap');
  const [modalQuality, setModalQuality] = useState<SleepQuality>('peaceful');
  const [modalNotes, setModalNotes] = useState('');

  // Manual entry form states
  const [manualDate, setManualDate] = useState(() => toLocalDateStr(new Date()));
  const [manualStartTime, setManualStartTime] = useState('13:00');
  const [manualEndTime, setManualEndTime] = useState('14:30');
  const [manualType, setManualType] = useState<SleepType>('day-nap');
  const [manualQuality, setManualQuality] = useState<SleepQuality>('peaceful');
  const [manualNotes, setManualNotes] = useState('');

  // Toast / feedback message
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  // Save sessions to localStorage whenever changed & notify reminder scheduler
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
      window.dispatchEvent(new CustomEvent(SESSIONS_UPDATED_EVENT));
    } catch {
      // ignore
    }
  }, [sessions]);

  // Refresh sessions & day/night schedule live whenever user restores a backup in Settings
  useEffect(() => {
    const handleBackupRestored = () => {
      try {
        const savedSessions = localStorage.getItem(STORAGE_KEY_SESSIONS);
        if (savedSessions) {
          const parsed = JSON.parse(savedSessions);
          if (Array.isArray(parsed)) {
            setSessions(
              parsed
                .filter(
                  (item): item is SleepSession =>
                    Boolean(item && typeof item.id === 'string' && item.startTime && item.endTime)
                )
                .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
            );
          }
        }
        const savedBounds = localStorage.getItem(STORAGE_KEY_BOUNDS);
        if (savedBounds) {
          const parsedBounds = JSON.parse(savedBounds);
          if (
            typeof parsedBounds?.dayStart === 'string' &&
            typeof parsedBounds?.nightStart === 'string'
          ) {
            setScheduleBounds({
              dayStart: parsedBounds.dayStart,
              nightStart: parsedBounds.nightStart,
            });
          }
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener(BACKUP_RESTORED_EVENT, handleBackupRestored);
    return () => window.removeEventListener(BACKUP_RESTORED_EVENT, handleBackupRestored);
  }, []);

  // Fallback live timer tick if uncontrolled
  useEffect(() => {
    if (isControlled) return;
    if (!internalActiveSleepStart) {
      setInternalElapsedSec(0);
      return;
    }

    const calcElapsed = () => {
      const startMs = new Date(internalActiveSleepStart).getTime();
      const diffSec = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
      setInternalElapsedSec(diffSec);
    };

    calcElapsed();
    const interval = setInterval(calcElapsed, 1000);
    return () => clearInterval(interval);
  }, [isControlled, internalActiveSleepStart]);

  const activeElapsedSec = isControlled ? (controlledElapsedSeconds ?? 0) : internalElapsedSec;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      toastTimerRef.current = null;
      setToastMessage(null);
    }, 3500);
  };

  // Helper for quality badge labels
  const getQualityText = (q: SleepQuality) => {
    switch (q) {
      case 'peaceful':
        return texts.qualityPeaceful;
      case 'normal':
        return texts.qualityNormal;
      case 'restless':
        return texts.qualityRestless;
    }
  };

  // Helper for quality name without emoji for CSV
  const getQualityPlain = (q: SleepQuality) => {
    switch (q) {
      case 'peaceful':
        return texts.qualityPeaceful.replace(/^[^\w\u00C0-\u024F\u0400-\u04FF\u0600-\u06FF]+\s*/, '');
      case 'normal':
        return texts.qualityNormal.replace(/^[^\w\u00C0-\u024F\u0400-\u04FF\u0600-\u06FF]+\s*/, '');
      case 'restless':
        return texts.qualityRestless.replace(/^[^\w\u00C0-\u024F\u0400-\u04FF\u0600-\u06FF]+\s*/, '');
    }
  };

  // 1. Live Sleep: Baby fell asleep
  const handleBabyFellAsleep = () => {
    triggerHaptic('heavy');
    const nowIso = new Date().toISOString();
    setActiveSleepStartUnified(nowIso);
    setIsEditingStartTimeOpen(false);
    showToast(texts.toastTrackingStarted);
  };

  // Open/toggle panel to adjust ongoing sleep start time
  const handleToggleEditStartTime = () => {
    triggerHaptic('light');
    if (!isEditingStartTimeOpen && activeSleepStart) {
      setCustomStartTimeInput(toLocalTimeStr(new Date(activeSleepStart)));
    }
    setIsEditingStartTimeOpen((prev) => !prev);
  };

  // Adjust ongoing sleep start time via exact time input
  const handleApplyCustomStartTime = () => {
    if (!customStartTimeInput) return;
    const [hhStr, mmStr] = customStartTimeInput.split(':');
    const hh = parseInt(hhStr, 10);
    const mm = parseInt(mmStr, 10);
    if (Number.isNaN(hh) || Number.isNaN(mm)) return;

    triggerHaptic('medium');
    const candidate = new Date();
    candidate.setHours(hh, mm, 0, 0);
    // If selected time is later than current time (e.g. after midnight editing 23:30), assume yesterday
    if (candidate.getTime() > Date.now()) {
      candidate.setDate(candidate.getDate() - 1);
    }

    setActiveSleepStartUnified(candidate.toISOString());
    setIsEditingStartTimeOpen(false);
    showToast(texts.toastStartTimeUpdated);
  };

  // 2. Live Sleep: Baby woke up
  const handleBabyWokeUp = () => {
    if (!activeSleepStart) return;
    triggerHaptic('heavy');
    const endIso = new Date().toISOString();
    const startMs = new Date(activeSleepStart).getTime();
    const endMs = new Date(endIso).getTime();
    const durationMin = Math.max(1, Math.round((endMs - startMs) / 60000));

    // Classify day nap vs night sleep based on parent's custom day/night schedule and sleep start time
    const defaultType: SleepType = classifySleepTypeByBounds(activeSleepStart, scheduleBounds);

    setPendingEndSession({
      startIso: activeSleepStart,
      endIso,
      durationMin,
    });
    setModalType(defaultType);
    setModalQuality('peaceful');
    setModalNotes('');
    setIsEditingStartTimeOpen(false);
    setWakeModalOpen(true);
  };

  // Confirm saving the session from live tracker
  const handleSaveLiveSession = () => {
    if (!pendingEndSession) return;
    triggerHaptic('medium');

    const newSession: SleepSession = {
      id: 'sleep-' + Date.now(),
      startTime: pendingEndSession.startIso,
      endTime: pendingEndSession.endIso,
      durationMinutes: pendingEndSession.durationMin,
      type: modalType,
      quality: modalQuality,
      notes: modalNotes.trim() || undefined,
    };

    setSessions((prev) =>
      [newSession, ...prev].sort(
        (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      )
    );
    setActiveSleepStartUnified(null);
    setIsEditingStartTimeOpen(false);
    setWakeModalOpen(false);
    setPendingEndSession(null);
    showToast(texts.toastSessionSaved);
  };

  // Cancel ongoing sleep without saving
  const handleCancelLiveSession = () => {
    triggerHaptic('light');
    setActiveSleepStartUnified(null);
    setIsEditingStartTimeOpen(false);
    setWakeModalOpen(false);
    setPendingEndSession(null);
  };

  // 3. Manual Entry submission
  const handleSaveManualSession = (e: React.FormEvent) => {
    e.preventDefault();
    const range = buildSessionDateRange(manualDate, manualStartTime, manualEndTime, true);
    if (!range) return;
    triggerHaptic('medium');

    const newSession: SleepSession = {
      id: 'sleep-' + Date.now(),
      startTime: range.startDateTime.toISOString(),
      endTime: range.endDateTime.toISOString(),
      durationMinutes: range.durationMinutes,
      type: manualType,
      quality: manualQuality,
      notes: manualNotes.trim() || undefined,
    };

    setSessions((prev) =>
      [newSession, ...prev].sort(
        (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      )
    );
    setShowManualForm(false);
    setManualNotes('');
    showToast(texts.toastSessionAdded);
  };

  // Open modal to edit an existing saved sleep session
  const handleOpenEditModal = (session: SleepSession) => {
    triggerHaptic('light');
    const startD = new Date(session.startTime);
    const endD = new Date(session.endTime);
    setEditingSession(session);
    setEditDate(toLocalDateStr(startD));
    setEditStartTime(toLocalTimeStr(startD));
    setEditEndTime(toLocalTimeStr(endD));
    setEditType(session.type);
    setEditQuality(session.quality);
    setEditNotes(session.notes || '');
  };

  // Save changes to an existing sleep session
  const handleSaveEditedSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;
    const range = buildSessionDateRange(editDate, editStartTime, editEndTime, false);
    if (!range) return;
    triggerHaptic('medium');

    setSessions((prev) =>
      prev
        .map((item) =>
          item.id === editingSession.id
            ? {
                ...item,
                startTime: range.startDateTime.toISOString(),
                endTime: range.endDateTime.toISOString(),
                durationMinutes: range.durationMinutes,
                type: editType,
                quality: editQuality,
                notes: editNotes.trim() || undefined,
              }
            : item
        )
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    );

    setEditingSession(null);
    showToast(texts.toastSessionUpdated);
  };

  // Compute live preview duration for Edit modal
  const getEditDurationPreview = () => {
    if (!editDate || !editStartTime || !editEndTime) return 0;
    const range = buildSessionDateRange(editDate, editStartTime, editEndTime, false);
    return range ? range.durationMinutes : 0;
  };

  // Open confirmation dialog before deleting a session
  const handleRequestDeleteSession = (session: SleepSession) => {
    triggerHaptic('light');
    setSessionPendingDelete(session);
  };

  // Confirmed deletion
  const handleConfirmDeleteSession = () => {
    if (!sessionPendingDelete) return;
    triggerHaptic('medium');
    const targetId = sessionPendingDelete.id;
    setSessions((prev) => prev.filter((s) => s.id !== targetId));
    setSessionPendingDelete(null);
    showToast(texts.toastSessionRemoved);
  };

  // Format minutes into "1h 30m"
  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  // Format seconds into "HH:MM:SS" or "MM:SS"
  const formatLiveClock = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) {
      return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
    }
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  };

  // Keep wake window & optimal sweet-spot indicator ticking live every 30s while awake
  useEffect(() => {
    if (activeSleepStart) return;
    setWakeClockTick(Date.now());
    const interval = window.setInterval(() => setWakeClockTick(Date.now()), 30000);
    return () => clearInterval(interval);
  }, [activeSleepStart, sessions.length]);

  // Calculate Wake Window: Time elapsed since the most recent completed sleep session ended
  const lastSession =
    sessions
      .filter((s) => {
        const endMs = new Date(s.endTime).getTime();
        return !Number.isNaN(endMs) && endMs <= wakeClockTick;
      })
      .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime())[0] ?? null;
  const calculateWakeWindowMinutes = () => {
    if (!lastSession || activeSleepStart) return null;
    const endMs = new Date(lastSession.endTime).getTime();
    const diffMin = Math.floor((wakeClockTick - endMs) / 60000);
    return diffMin >= 0 ? diffMin : 0;
  };

  const wakeWindowMins = calculateWakeWindowMinutes();
  const wakeEval =
    !activeSleepStart && lastSession && wakeWindowMins !== null
      ? evaluateWakeWindow(wakeWindowMins, lastSession.endTime, babyBirthDate)
      : null;

  const handleOpenBirthDateModal = () => {
    triggerHaptic('light');
    setDraftBirthDate(babyBirthDate || '');
    setIsBirthDateModalOpen(true);
  };

  const handleSaveBirthDate = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('medium');
    onChangeBabyBirthDate?.(draftBirthDate);
    setIsBirthDateModalOpen(false);
  };

  // Calculate today's total sleep & breakdown (using local calendar date; overnight sleep counts on wake-up morning)
  const todaySessions = sessions.filter((s) => getSessionCalendarDate(s) === todayDateStr);
  const todayTotalMins = todaySessions.reduce((acc, curr) => acc + getSessionDurationMinutes(curr), 0);
  const todayNapSessions = todaySessions.filter((s) => s.type === 'day-nap');
  const todayNightSessions = todaySessions.filter((s) => s.type === 'night-sleep');
  const todayNapMins = todayNapSessions.reduce((acc, curr) => acc + getSessionDurationMinutes(curr), 0);
  const todayNightMins = todayNightSessions.reduce((acc, curr) => acc + getSessionDurationMinutes(curr), 0);
  const todayAvgMins = todaySessions.length > 0 ? Math.round(todayTotalMins / todaySessions.length) : 0;

  // Calendar Day Navigation helpers
  const handleShiftDay = (daysDelta: number) => {
    triggerHaptic('light');
    const baseDate = selectedDateFilter ? new Date(`${selectedDateFilter}T12:00:00`) : new Date();
    const nextDate = new Date(baseDate.getTime() + daysDelta * 24 * 3600 * 1000);
    const nextDateStr = toLocalDateStr(nextDate);

    // Don't step into future
    if (nextDateStr > todayDateStr) {
      setSelectedDateFilter(todayDateStr);
    } else {
      setSelectedDateFilter(nextDateStr);
    }
  };

  // Format date display for calendar header (e.g. "Dnes (31. okt)")
  const formatCalendarDateLabel = (dateStr: string | null) => {
    if (!dateStr) return texts.allDays;
    const localMidday = new Date(`${dateStr}T12:00:00`);
    if (dateStr === todayDateStr) {
      const formatted = localMidday.toLocaleDateString(currentLocale, {
        day: 'numeric',
        month: 'short',
      });
      return `${texts.today} (${formatted})`;
    }
    if (dateStr === yesterdayDateStr) {
      const formatted = localMidday.toLocaleDateString(currentLocale, {
        day: 'numeric',
        month: 'short',
      });
      return `${texts.yesterday} (${formatted})`;
    }
    return localMidday.toLocaleDateString(currentLocale, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Filtered sessions based on calendar day selector
  const filteredSessions = selectedDateFilter
    ? sessions.filter((s) => getSessionCalendarDate(s) === selectedDateFilter)
    : sessions;

  // Calculate day metrics for filtered date
  const filteredDayTotalMins = filteredSessions.reduce(
    (acc, curr) => acc + getSessionDurationMinutes(curr),
    0
  );

  // History display limitation:
  // - Default: max 6 items
  // - Expanded: all items rendered inside a scrollable box (height ~10 items) so user scrolls with finger
  const displayedSessions = isHistoryExpanded
    ? filteredSessions
    : filteredSessions.slice(0, 6);

  /* ========================================================================= */
  /* KONCEPTY / DRAFTS - Export do Google Drive & CSV (nateraz nezobrazované v UI) */
  /* ========================================================================= */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _generateCSVContentDraft = () => {
    const headers = [
      texts.csvHeaders.date,
      texts.csvHeaders.startTime,
      texts.csvHeaders.endTime,
      texts.csvHeaders.durationMinutes,
      texts.csvHeaders.durationFormat,
      texts.csvHeaders.sleepType,
      texts.csvHeaders.sleepQuality,
      texts.csvHeaders.note,
    ];

    const rows = sessions.map((s) => {
      const startDate = new Date(s.startTime);
      const endDate = new Date(s.endTime);
      const dateStr = startDate.toLocaleDateString(currentLocale);
      const startStr = startDate.toLocaleTimeString(currentLocale, { hour: '2-digit', minute: '2-digit' });
      const endStr = endDate.toLocaleTimeString(currentLocale, { hour: '2-digit', minute: '2-digit' });
      const durationFmt = formatDuration(s.durationMinutes);
      const typeStr = s.type === 'day-nap' ? texts.dayNap : texts.nightSleep;
      const qualityStr = getQualityPlain(s.quality);
      const noteClean = (s.notes || '').replace(/"/g, '""');

      return [
        `"${dateStr}"`,
        `"${startStr}"`,
        `"${endStr}"`,
        s.durationMinutes,
        `"${durationFmt}"`,
        `"${typeStr}"`,
        `"${qualityStr}"`,
        `"${noteClean}"`,
      ].join(',');
    });

    return '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleExportCSVDraft = async () => {
    const csvContent = _generateCSVContentDraft();
    const filename = `baby-sleep-tracker-${todayDateStr}.csv`;

    if (Capacitor.isNativePlatform()) {
      try {
        const writtenFile = await Filesystem.writeFile({
          path: filename,
          data: csvContent,
          directory: Directory.Cache,
          encoding: Encoding.UTF8,
        });

        await Share.share({
          title: texts.exportCardTitle,
          text: texts.exportCardSubtitle,
          url: writtenFile.uri,
          dialogTitle: texts.exportShareBtn,
        });
        return;
      } catch (nativeErr) {
        console.warn('Draft export error:', nativeErr);
      }
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 select-none pb-4">
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-slate-950 font-bold px-4 py-2 rounded-2xl shadow-2xl text-xs flex items-center gap-2 border border-emerald-300 animate-in fade-in slide-in-from-top-4">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero: Active Live Tracker Card */}
      <div className="relative rounded-3xl p-5 border border-indigo-500/30 bg-gradient-to-br from-indigo-950/60 via-slate-900/90 to-purple-950/40 shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-44 h-44 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>{texts.currentStatus}</span>
          </div>

          {activeSleepStart ? (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              {texts.babySleeping}
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/10 text-white/70 border border-white/10 flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-300" />
              {texts.babyAwake}
            </span>
          )}
        </div>

        {/* Live timer display or Idle status */}
        {activeSleepStart ? (
          <div className="flex flex-col items-center justify-center py-3 text-center">
            <button
              type="button"
              onClick={handleToggleEditStartTime}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-xs text-indigo-100 mb-2 transition-all active:scale-95 touch-manipulation"
              title={texts.editStartTimeBtn}
            >
              <span>
                {texts.fellAsleepAt}{' '}
                <strong className="text-amber-300 font-semibold">
                  {new Date(activeSleepStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </strong>
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-amber-300 transition-transform duration-200 ${
                  isEditingStartTimeOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Exact start time editor for ongoing sleep */}
            {isEditingStartTimeOpen && (
              <div className="w-full mb-3 p-3 rounded-2xl bg-slate-950/85 border border-indigo-400/30 flex flex-col gap-2 text-left shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="text-[10px] uppercase tracking-wider text-indigo-200/70 font-semibold block">
                  {texts.customStartTimeLabel}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={customStartTimeInput}
                    onChange={(e) => setCustomStartTimeInput(e.target.value)}
                    className="flex-1 h-9 px-3 rounded-xl bg-slate-900 border border-white/15 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCustomStartTime}
                    className="h-9 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1 active:scale-95 transition-all shrink-0"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{texts.applyBtn}</span>
                  </button>
                </div>
              </div>
            )}

            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-mono drop-shadow">
              {formatLiveClock(activeElapsedSec)}
            </div>
            <p className="text-[11px] text-white/50 mt-1 max-w-xs">
              {texts.timerBackgroundHint}
            </p>
            {lockScreenSleepEnabled && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-400/25 text-[10px] font-medium text-indigo-200/90">
                <Smartphone className="w-3 h-3 text-indigo-300 shrink-0" />
                <span>{lockCopy.activeHint}</span>
              </div>
            )}

            <button
              onClick={handleBabyWokeUp}
              className="mt-5 w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 active:scale-95 touch-manipulation transition-all"
            >
              <Sun className="w-5 h-5 fill-slate-950" />
              <span>{texts.babyWokeUpBtn}</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col py-1">
            <h2 className="text-lg font-bold text-white tracking-wide">
              {texts.heroTitle}
            </h2>
            <p className="text-xs text-white/60 mt-0.5 mb-4">
              {texts.heroSubtitle}
            </p>

            <button
              onClick={handleBabyFellAsleep}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 active:scale-95 touch-manipulation transition-all"
            >
              <Moon className="w-5 h-5 fill-indigo-200" />
              <span>{texts.babyFellAsleepBtn}</span>
            </button>
          </div>
        )}

        {/* Wake Window & Age-Based Optimal Sweet Spot Alert */}
        {!activeSleepStart && wakeWindowMins !== null && (
          <div className="mt-3.5 pt-3 border-t border-white/10 flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-white/75 min-w-0">
                <Clock className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
                <span className="truncate">{texts.wakeWindow}</span>
                <strong className="text-white font-semibold shrink-0">{formatDuration(wakeWindowMins)}</strong>
              </div>

              {wakeEval ? (
                <button
                  type="button"
                  onClick={handleOpenBirthDateModal}
                  title={wakeCopy.editAgeTitle}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-amber-200 flex items-center gap-1 shrink-0 active:scale-95 transition-all"
                >
                  <Cake className="w-2.5 h-2.5 text-amber-300" />
                  <span>{formatShortAge(wakeEval.age, language)}</span>
                </button>
              ) : (
                <span className="text-[10px] text-white/50 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 shrink-0">
                  {texts.sinceLastSleep}
                </span>
              )}
            </div>

            {wakeEval ? (
              <div
                className={`p-3 rounded-2xl border flex flex-col gap-2 transition-all ${
                  wakeEval.status === 'overtired'
                    ? 'bg-rose-500/15 border-rose-400/40'
                    : wakeEval.status === 'sweet-spot'
                    ? 'bg-emerald-500/15 border-emerald-400/40'
                    : wakeEval.status === 'approaching'
                    ? 'bg-amber-400/15 border-amber-400/35'
                    : 'bg-white/[0.04] border-white/10'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${
                      wakeEval.status === 'overtired'
                        ? 'text-rose-200'
                        : wakeEval.status === 'sweet-spot'
                        ? 'text-emerald-200'
                        : wakeEval.status === 'approaching'
                        ? 'text-amber-200'
                        : 'text-indigo-200'
                    }`}
                  >
                    <BellRing
                      className={`w-3.5 h-3.5 shrink-0 ${
                        wakeEval.status === 'sweet-spot' || wakeEval.status === 'overtired'
                          ? 'animate-pulse'
                          : ''
                      }`}
                    />
                    <span>
                      {wakeEval.status === 'overtired'
                        ? wakeCopy.badgeOvertired
                        : wakeEval.status === 'sweet-spot'
                        ? wakeCopy.badgeSweetSpot
                        : wakeEval.status === 'approaching'
                        ? wakeCopy.badgeApproaching
                        : wakeCopy.badgeFresh}
                    </span>
                  </span>

                  <span className="text-[10px] font-mono text-white/65 shrink-0" dir="ltr">
                    {formatWakeDuration(wakeEval.minWakeMins)} – {formatWakeDuration(wakeEval.maxWakeMins)}
                  </span>
                </div>

                {/* Progress bar with highlighted optimal sweet-spot window */}
                <div className="relative h-2 rounded-full bg-slate-950/80 border border-white/10 overflow-hidden" dir="ltr">
                  {/* Optimal Sweet Spot zone highlight */}
                  <div
                    className="absolute top-0 bottom-0 bg-emerald-400/25 border-x border-emerald-300/40"
                    style={{
                      left: `${wakeEval.sweetSpotStartPercent}%`,
                      width: `${Math.max(4, wakeEval.sweetSpotEndPercent - wakeEval.sweetSpotStartPercent)}%`,
                    }}
                  />
                  {/* Current wake progress fill */}
                  <div
                    className={`absolute top-0 bottom-0 left-0 rounded-full transition-all duration-700 ${
                      wakeEval.status === 'overtired'
                        ? 'bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400'
                        : wakeEval.status === 'sweet-spot'
                        ? 'bg-gradient-to-r from-indigo-400 to-emerald-400'
                        : wakeEval.status === 'approaching'
                        ? 'bg-gradient-to-r from-indigo-400 to-amber-300'
                        : 'bg-gradient-to-r from-indigo-400 to-sky-400'
                    }`}
                    style={{ width: `${wakeEval.progressPercent}%` }}
                  />
                </div>

                <p className="text-[11px] text-white/80 leading-relaxed">
                  {wakeEval.status === 'overtired'
                    ? wakeCopy.msgOvertired(formatWakeDuration(Math.max(1, wakeEval.minutesOverdue)))
                    : wakeEval.status === 'sweet-spot'
                    ? wakeCopy.msgSweetSpot(wakeEval.sweetSpotStartTime, wakeEval.sweetSpotEndTime)
                    : wakeEval.status === 'approaching'
                    ? wakeCopy.msgApproaching(
                        formatWakeDuration(Math.max(1, wakeEval.minutesUntilSweetSpot)),
                        wakeEval.sweetSpotStartTime
                      )
                    : wakeCopy.msgFresh(
                        formatWakeDuration(Math.max(1, wakeEval.minutesUntilSweetSpot)),
                        wakeEval.sweetSpotStartTime,
                        wakeEval.sweetSpotEndTime
                      )}
                </p>

                <div className="pt-1.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 text-[10px] text-white/50">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="font-medium text-white/65">
                      {wakeCopy.dailyTargetLabel(wakeEval.age.dailySleepRangeHours, wakeEval.age.guidelineSource)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{wakeCopy.sleepCuesHint}</span>
                  </div>

                  {onToggleWakeReminder && (
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        onToggleWakeReminder(!wakeReminderEnabled);
                      }}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all active:scale-95 touch-manipulation shrink-0 ${
                        wakeReminderEnabled
                          ? 'bg-emerald-500/20 border border-emerald-400/35 text-emerald-200'
                          : 'bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white/65'
                      }`}
                    >
                      {wakeReminderEnabled ? (
                        <Bell className="w-3 h-3 text-emerald-300 shrink-0" />
                      ) : (
                        <BellOff className="w-3 h-3 text-white/50 shrink-0" />
                      )}
                      <span className="whitespace-nowrap tabular-nums">
                        {wakeReminderEnabled
                          ? scheduledWakeReminder
                            ? reminderCopy.scheduledAtBadge(scheduledWakeReminder.triggerTimeLabel)
                            : reminderCopy.toggleOnChip
                          : reminderCopy.toggleOffChip}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              onChangeBabyBirthDate && (
                <button
                  type="button"
                  onClick={handleOpenBirthDateModal}
                  className="w-full py-2 px-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-dashed border-amber-400/35 text-amber-200/90 text-[11px] font-medium flex items-center justify-center gap-1.5 active:scale-[0.99] transition-all touch-manipulation"
                >
                  <Cake className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span className="truncate">{wakeCopy.setupPromptBtn}</span>
                </button>
              )
            )}
          </div>
        )}

        {/* Quick Birth Date Setup when no prior sleep session exists yet */}
        {!activeSleepStart && wakeWindowMins === null && !babyBirthDate && onChangeBabyBirthDate && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={handleOpenBirthDateModal}
              className="w-full py-2 px-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-dashed border-amber-400/35 text-amber-200/90 text-[11px] font-medium flex items-center justify-center gap-1.5 active:scale-[0.99] transition-all touch-manipulation"
            >
              <Cake className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span className="truncate">{wakeCopy.setupPromptBtn}</span>
            </button>
          </div>
        )}
      </div>

      {/* Manual Entry Toggle (placed right below Current Status) */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/50 overflow-hidden">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            const nextOpen = !showManualForm;
            if (nextOpen) {
              const currentToday = toLocalDateStr(new Date());
              setManualDate(currentToday);
              setManualType(
                classifySleepTypeByBounds(`${currentToday}T${manualStartTime}:00`, scheduleBounds)
              );
            }
            setShowManualForm(nextOpen);
          }}
          className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-semibold text-white/80 hover:bg-white/5 active:bg-white/10 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-400" />
            <span>{texts.addManualBtn}</span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-white/50 transition-transform duration-200 ${
              showManualForm ? 'rotate-180' : ''
            }`}
          />
        </button>

        {showManualForm && (
          <form onSubmit={handleSaveManualSession} className="p-4 pt-1 flex flex-col gap-3 border-t border-white/5">
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1">
                <label className="text-[10px] uppercase tracking-wider text-white/50 block mb-1">
                  {texts.date}
                </label>
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-xl bg-slate-950 border border-white/15 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider text-white/50 block mb-1">
                  {texts.from}
                </label>
                <input
                  type="time"
                  value={manualStartTime}
                  onChange={(e) => {
                    const nextStart = e.target.value;
                    setManualStartTime(nextStart);
                    if (nextStart) {
                      setManualType(
                        classifySleepTypeByBounds(
                          `${manualDate || todayDateStr}T${nextStart}:00`,
                          scheduleBounds
                        )
                      );
                    }
                  }}
                  className="w-full px-2 py-1.5 rounded-xl bg-slate-950 border border-white/15 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider text-white/50 block mb-1">
                  {texts.to}
                </label>
                <input
                  type="time"
                  value={manualEndTime}
                  onChange={(e) => setManualEndTime(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-xl bg-slate-950 border border-white/15 text-xs text-white"
                  required
                />
              </div>
            </div>

            {/* Type selector */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setManualType('day-nap')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-colors ${
                  manualType === 'day-nap'
                    ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold'
                    : 'bg-white/5 border-white/10 text-white/70'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>{texts.dayNap}</span>
              </button>

              <button
                type="button"
                onClick={() => setManualType('night-sleep')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-colors ${
                  manualType === 'night-sleep'
                    ? 'bg-indigo-500 text-white border-indigo-400 font-bold'
                    : 'bg-white/5 border-white/10 text-white/70'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>{texts.nightSleep}</span>
              </button>
            </div>

            {/* Quality selector */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-white/50 block mb-1">
                {texts.qualityLabel}
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                {(['peaceful', 'normal', 'restless'] as SleepQuality[]).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setManualQuality(q)}
                    className={`py-1.5 px-1 rounded-xl text-center border text-[11px] font-medium transition-colors ${
                      manualQuality === q
                        ? 'bg-white/20 border-white/40 text-white font-bold'
                        : 'bg-white/5 border-white/10 text-white/60'
                    }`}
                  >
                    {getQualityText(q)}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional note */}
            <div>
              <input
                type="text"
                placeholder={texts.notePlaceholder}
                value={manualNotes}
                onChange={(e) => setManualNotes(e.target.value)}
                maxLength={100}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white placeholder-white/30"
              />
            </div>

            <button
              type="submit"
              className="mt-1 py-2 rounded-xl bg-white text-slate-950 font-bold text-xs hover:bg-white/90 active:scale-95 transition-all shadow"
            >
              {texts.saveSessionBtn}
            </button>
          </form>
        )}
      </div>

      {/* Statistics Window (No title, sleek unified container holding today total, naps count, and subtle breakdown) */}
      <div className="p-4 rounded-3xl bg-slate-900/60 border border-white/10 flex flex-col gap-3 shadow-md backdrop-blur-sm">
        {/* Main Stats Row: Dnes naspaté & Dnešné spánky */}
        <div className="grid grid-cols-2 gap-3 items-center">
          {/* Stat 1: Dnes naspaté */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-400/25 text-indigo-300 flex items-center justify-center shrink-0 shadow-sm">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase tracking-wider text-white/50 block font-semibold truncate">
                {texts.todayTotal}
              </span>
              <span className="text-base sm:text-lg font-bold text-white tracking-tight truncate block">
                {todayTotalMins > 0 ? formatDuration(todayTotalMins) : '0 min'}
              </span>
            </div>
          </div>

          {/* Stat 2: Dnešné spánky */}
          <div className="flex items-center gap-3 min-w-0 pl-2 sm:pl-3 border-l border-white/10">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-400/25 text-purple-300 flex items-center justify-center shrink-0 shadow-sm">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase tracking-wider text-white/50 block font-semibold truncate">
                {texts.todayNaps}
              </span>
              <span className="text-base sm:text-lg font-bold text-white tracking-tight truncate block">
                {todaySessions.length}{' '}
                <span className="text-xs font-normal text-white/50">
                  {texts.sessionsCount}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Subtle sub-metrics breakdown row (Day Sleep, Night Sleep, Average) + small Day/Night schedule button */}
        <div className="pt-2.5 border-t border-white/5 flex items-end justify-between gap-2 text-[11px] text-white/60">
          <div className="flex-1 grid grid-cols-3 gap-1.5 min-w-0">
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] uppercase tracking-wider text-white/40 truncate">
                {texts.dayNap}
              </span>
              <span className="font-semibold text-white/85">
                {formatDuration(todayNapMins)}
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] uppercase tracking-wider text-white/40 truncate">
                {texts.nightSleep}
              </span>
              <span className="font-semibold text-white/85">
                {formatDuration(todayNightMins)}
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] uppercase tracking-wider text-white/40 truncate">
                {texts.average}
              </span>
              <span className="font-semibold text-white/85">
                {formatDuration(todayAvgMins)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenBoundsModal}
            title={texts.sleepBoundsModalTitle}
            aria-label={texts.sleepBoundsModalTitle}
            className="h-8 px-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.14] active:scale-95 border border-white/10 text-amber-200/85 hover:text-amber-200 flex items-center gap-1 text-[10px] font-medium transition-all touch-manipulation shrink-0"
          >
            <SlidersHorizontal className="w-3 h-3 text-amber-300 shrink-0" />
            <span className="font-mono tracking-tight" dir="ltr">
              {scheduleBounds.dayStart}–{scheduleBounds.nightStart}
            </span>
          </button>
        </div>
      </div>

      {/* Collapsible 7-Day Sleep Trend Mini-Chart (collapsed by default) */}
      <WeeklySleepMiniChart
        sessions={sessions}
        language={language}
        babyBirthDate={babyBirthDate}
      />

      {/* Collapsible Sleep History Section (collapsed by default, smooth unroll on click) */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/50 overflow-hidden transition-colors">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setIsHistorySectionOpen((prev) => !prev);
          }}
          aria-expanded={isHistorySectionOpen}
          className="w-full px-4 py-3 flex items-center justify-between gap-2 text-left hover:bg-white/5 active:bg-white/10 transition-colors touch-manipulation"
        >
          <div className="flex items-center gap-2 min-w-0">
            <History className="w-4 h-4 text-indigo-400 shrink-0" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/80 truncate">
              {texts.historyTitle}
            </h3>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 font-bold text-white/85 shrink-0">
              {filteredSessions.length}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {selectedDateFilter ? (
              <span className="text-[11px] text-amber-300/85 font-medium">
                {texts.dayTotalLabel} {formatDuration(filteredDayTotalMins)}
              </span>
            ) : (
              sessions.length > 0 && isHistorySectionOpen && (
                <span className="text-[11px] text-white/40 hidden xs:inline">{texts.latestFirst}</span>
              )
            )}
            <ChevronDown
              className={`w-4 h-4 text-white/60 transition-transform duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isHistorySectionOpen ? 'rotate-180 text-amber-300' : ''
              }`}
            />
          </div>
        </button>

        {/* Smooth CSS Grid accordion unroll container */}
        <div
          className={`grid transition-[grid-template-rows,opacity] duration-[460ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isHistorySectionOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden">
            <div
              className={`p-3 pt-2.5 border-t border-white/5 flex flex-col gap-2.5 transition-transform duration-[460ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isHistorySectionOpen ? 'translate-y-0' : '-translate-y-2'
              }`}
            >
        {/* Calendar Day Switcher Toolbar */}
        <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/10 flex flex-col gap-2 shadow-sm">
          {/* Quick preset chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setSelectedDateFilter(null);
              }}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all touch-manipulation flex items-center gap-1 shrink-0 ${
                selectedDateFilter === null
                  ? 'bg-indigo-500 text-white shadow-sm font-bold'
                  : 'bg-white/5 text-white/60 hover:text-white/80 border border-white/10'
              }`}
            >
              <Filter className="w-3 h-3" />
              <span>{texts.allDays}</span>
            </button>

            {/* Calendar modal date picker opener */}
            <button
              type="button"
              onClick={handleOpenCalendarModal}
              className={`ml-auto px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all touch-manipulation flex items-center gap-1 shrink-0 ${
                selectedDateFilter &&
                selectedDateFilter !== todayDateStr &&
                selectedDateFilter !== yesterdayDateStr
                  ? 'bg-amber-400 text-slate-950 shadow-sm font-bold'
                  : 'bg-white/10 hover:bg-white/15 text-white/80 border border-white/15'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>{texts.pickDate}</span>
            </button>
          </div>

          {/* Stepper bar: ◀ Selected Day Display ▶ */}
          {selectedDateFilter && (
            <div className="flex items-center justify-between pt-1 border-t border-white/5">
              <button
                type="button"
                onClick={() => handleShiftDay(-1)}
                className="h-8 px-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-white/70 flex items-center gap-1 text-xs transition-all touch-manipulation border border-white/10"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden xs:inline text-[11px]">-1d</span>
              </button>

              <button
                type="button"
                onClick={handleOpenCalendarModal}
                className="flex items-center gap-1.5 text-xs font-semibold text-white hover:text-amber-300 transition-colors py-1 px-2 rounded-lg hover:bg-white/5 active:scale-95"
              >
                <CalendarIcon className="w-3.5 h-3.5 text-amber-300" />
                <span>{formatCalendarDateLabel(selectedDateFilter)}</span>
              </button>

              <button
                type="button"
                onClick={() => handleShiftDay(1)}
                disabled={selectedDateFilter >= todayDateStr}
                className={`h-8 px-2 rounded-xl text-xs flex items-center gap-1 transition-all touch-manipulation border ${
                  selectedDateFilter >= todayDateStr
                    ? 'opacity-30 pointer-events-none border-white/5 text-white/30'
                    : 'bg-white/5 hover:bg-white/10 active:scale-95 text-white/70 border-white/10'
                }`}
              >
                <span className="hidden xs:inline text-[11px]">+1d</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* History List: Max 6 items default, expandable to 10 + finger scroll */}
        {filteredSessions.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/5 text-center text-white/50 text-xs flex flex-col items-center gap-2">
            <span>
              {selectedDateFilter ? texts.noSessionsForDate : texts.noHistory}
            </span>
            {selectedDateFilter && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedDateFilter(null);
                }}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-[11px] font-semibold transition-all mt-1"
              >
                {texts.showAllDaysBtn}
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {/* Scrollable container when expanded */}
            <div
              className={`flex flex-col gap-2 transition-all ${
                isHistoryExpanded
                  ? 'max-h-[580px] overflow-y-auto pr-1 scrollbar-thin'
                  : ''
              }`}
            >
              {displayedSessions.map((s) => {
                const startDate = new Date(s.startTime);
                const endDate = new Date(s.endTime);
                const dateStr = startDate.toLocaleDateString(currentLocale, {
                  day: 'numeric',
                  month: 'short',
                });
                const startStr = startDate.toLocaleTimeString(currentLocale, {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const endStr = endDate.toLocaleTimeString(currentLocale, {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={s.id}
                    className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/10 flex items-center justify-between gap-3 shadow-sm hover:border-white/20 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          s.type === 'night-sleep'
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                        }`}
                      >
                        {s.type === 'night-sleep' ? (
                          <Moon className="w-4 h-4" />
                        ) : (
                          <Sun className="w-4 h-4" />
                        )}
                      </div>

                      <div className="min-w-0 truncate">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">
                            {startStr} – {endStr}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 font-bold text-white/80">
                            {formatDuration(getSessionDurationMinutes(s))}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-white/50 mt-0.5">
                          <span>{dateStr}</span>
                          <span>·</span>
                          <span>{getQualityText(s.quality)}</span>
                          {s.notes && (
                            <>
                              <span>·</span>
                              <span className="italic truncate text-white/60">
                                "{s.notes}"
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(s)}
                        className="p-2 rounded-xl text-white/40 hover:text-amber-300 hover:bg-amber-400/10 active:scale-95 transition-all shrink-0"
                        title={texts.editTitle}
                        aria-label={texts.editTitle}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRequestDeleteSession(s)}
                        className="p-2 rounded-xl text-white/30 hover:text-red-400 hover:bg-red-500/10 active:scale-95 transition-all shrink-0"
                        title={texts.deleteTitle}
                        aria-label={texts.deleteTitle}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Expand / Collapse Button when more than 6 sessions */}
            {filteredSessions.length > 6 && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setIsHistoryExpanded(!isHistoryExpanded);
                }}
                className="w-full py-2.5 px-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm mt-0.5"
              >
                <span>
                  {isHistoryExpanded
                    ? texts.showLessSessions
                    : `${texts.showMoreSessions} (${filteredSessions.length - 6})`}
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isHistoryExpanded ? 'rotate-180 text-amber-300' : ''
                  }`}
                />
              </button>
            )}

            {/* Scroll indicator when expanded with more than 10 sessions */}
            {isHistoryExpanded && filteredSessions.length > 10 && (
              <p className="text-[10px] text-center text-white/40 italic">
                {texts.scrollHint}
              </p>
            )}
          </div>
        )}
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Shareable Summary for Pediatrician / Sleep Consultant (placed below Sleep History) */}
      <PediatricSummarySection
        sessions={sessions}
        language={language}
        babyName={babyName}
        babyBirthDate={babyBirthDate}
        onNotify={showToast}
      />

      {/* Completion Modal when stopping Live Sleep Timer */}
      {wakeModalOpen && pendingEndSession && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-white/20 p-5 flex flex-col gap-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sun className="w-5 h-5 text-amber-400" />
                <span>{texts.saveWakeUpModal}</span>
              </h3>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/10 text-white font-bold">
                {formatDuration(pendingEndSession.durationMin)}
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {/* Type */}
              <div>
                <label className="text-[10px] uppercase tracking-wider text-white/50 block mb-1">
                  {texts.qualityLabel}
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setModalType('day-nap')}
                    className={`flex-1 py-2 px-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-colors ${
                      modalType === 'day-nap'
                        ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold'
                        : 'bg-white/5 border-white/10 text-white/70'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>{texts.dayNap}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalType('night-sleep')}
                    className={`flex-1 py-2 px-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-colors ${
                      modalType === 'night-sleep'
                        ? 'bg-indigo-500 text-white border-indigo-400 font-bold'
                        : 'bg-white/5 border-white/10 text-white/70'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>{texts.nightSleep}</span>
                  </button>
                </div>
              </div>

              {/* Quality */}
              <div>
                <label className="text-[10px] uppercase tracking-wider text-white/50 block mb-1">
                  {texts.howWasSleep}
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {(['peaceful', 'normal', 'restless'] as SleepQuality[]).map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setModalQuality(q)}
                      className={`py-2 px-1 rounded-xl text-center border text-[11px] font-medium transition-colors ${
                        modalQuality === q
                          ? 'bg-white/20 border-white/40 text-white font-bold'
                          : 'bg-white/5 border-white/10 text-white/60'
                      }`}
                    >
                      {getQualityText(q)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-[10px] uppercase tracking-wider text-white/50 block mb-1">
                  {texts.notePlaceholder}
                </label>
                <input
                  type="text"
                  placeholder={texts.noteModalPlaceholder}
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  maxLength={100}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white placeholder-white/30"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-1">
              <button
                type="button"
                onClick={handleCancelLiveSession}
                className="py-2.5 px-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white/70 font-semibold text-xs active:scale-95 transition-all"
              >
                {texts.discard}
              </button>

              <button
                type="button"
                onClick={handleSaveLiveSession}
                className="flex-1 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-950/40 active:scale-95 transition-all"
              >
                {texts.saveToHistory}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Saved Sleep Session Modal */}
      {editingSession && (
        <div
          onClick={() => setEditingSession(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <form
            onSubmit={handleSaveEditedSession}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-slate-900 border border-white/20 p-5 flex flex-col gap-3.5 shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Pencil className="w-4 h-4 text-amber-400" />
                <span>{texts.editSessionModalTitle}</span>
              </h3>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-white/10 text-amber-300 font-bold">
                {formatDuration(getEditDurationPreview())}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1">
                <label className="text-[10px] uppercase tracking-wider text-white/50 block mb-1">
                  {texts.date}
                </label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-xl bg-slate-950 border border-white/15 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider text-white/50 block mb-1">
                  {texts.from}
                </label>
                <input
                  type="time"
                  value={editStartTime}
                  onChange={(e) => setEditStartTime(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-xl bg-slate-950 border border-white/15 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider text-white/50 block mb-1">
                  {texts.to}
                </label>
                <input
                  type="time"
                  value={editEndTime}
                  onChange={(e) => setEditEndTime(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-xl bg-slate-950 border border-white/15 text-xs text-white"
                  required
                />
              </div>
            </div>

            {/* Type */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditType('day-nap')}
                className={`flex-1 py-2 px-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-colors ${
                  editType === 'day-nap'
                    ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold'
                    : 'bg-white/5 border-white/10 text-white/70'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>{texts.dayNap}</span>
              </button>

              <button
                type="button"
                onClick={() => setEditType('night-sleep')}
                className={`flex-1 py-2 px-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-colors ${
                  editType === 'night-sleep'
                    ? 'bg-indigo-500 text-white border-indigo-400 font-bold'
                    : 'bg-white/5 border-white/10 text-white/70'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>{texts.nightSleep}</span>
              </button>
            </div>

            {/* Quality */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-white/50 block mb-1">
                {texts.qualityLabel}
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                {(['peaceful', 'normal', 'restless'] as SleepQuality[]).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setEditQuality(q)}
                    className={`py-2 px-1 rounded-xl text-center border text-[11px] font-medium transition-colors ${
                      editQuality === q
                        ? 'bg-white/20 border-white/40 text-white font-bold'
                        : 'bg-white/5 border-white/10 text-white/60'
                    }`}
                  >
                    {getQualityText(q)}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-white/50 block mb-1">
                {texts.notePlaceholder}
              </label>
              <input
                type="text"
                placeholder={texts.noteModalPlaceholder}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                maxLength={100}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white placeholder-white/30"
              />
            </div>

            <div className="flex gap-2 mt-1">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setEditingSession(null);
                }}
                className="py-2.5 px-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white/70 font-semibold text-xs active:scale-95 transition-all"
              >
                {texts.cancelBtn}
              </button>

              <button
                type="submit"
                className="flex-1 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-md active:scale-95 transition-all"
              >
                {texts.saveSessionBtn}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Interactive Month Calendar Modal for picking specific day */}
      {isCalendarModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-white/20 p-5 flex flex-col gap-4 shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-1 border-b border-white/10">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-amber-300" />
                <h3 className="text-sm font-bold text-white">
                  {texts.calendarModalTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setIsCalendarModalOpen(false);
                }}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                title={texts.calendarCloseBtn}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Month & Year Navigation */}
            <div className="flex items-center justify-between px-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="h-8 w-8 rounded-xl bg-white/5 hover:bg-white/15 active:scale-95 text-white/80 flex items-center justify-center transition-all border border-white/10"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-sm font-bold text-white tracking-wide">
                {texts.monthNames[calendarViewingMonth]} {calendarViewingYear}
              </span>

              <button
                type="button"
                onClick={handleNextMonth}
                disabled={
                  calendarViewingYear > new Date().getFullYear() ||
                  (calendarViewingYear === new Date().getFullYear() &&
                    calendarViewingMonth >= new Date().getMonth())
                }
                className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all border ${
                  calendarViewingYear > new Date().getFullYear() ||
                  (calendarViewingYear === new Date().getFullYear() &&
                    calendarViewingMonth >= new Date().getMonth())
                    ? 'opacity-25 pointer-events-none border-white/5 text-white/30'
                    : 'bg-white/5 hover:bg-white/15 active:scale-95 text-white/80 border-white/10'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Week days header (Mon - Sun) */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {texts.weekDaysShort.map((day) => (
                <span key={day} className="text-[10px] font-bold text-white/40 uppercase">
                  {day}
                </span>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {(() => {
                const daysInMonth = new Date(calendarViewingYear, calendarViewingMonth + 1, 0).getDate();
                // Monday is 0, Sunday is 6
                const firstDayIndex = (new Date(calendarViewingYear, calendarViewingMonth, 1).getDay() + 6) % 7;
                const cells = [];

                // Blank cells for preceding days
                for (let i = 0; i < firstDayIndex; i++) {
                  cells.push(<div key={`blank-${i}`} className="h-9 w-9" />);
                }

                // Month days 1..daysInMonth
                for (let d = 1; d <= daysInMonth; d++) {
                  const mStr = String(calendarViewingMonth + 1).padStart(2, '0');
                  const dStr = String(d).padStart(2, '0');
                  const dayDateStr = `${calendarViewingYear}-${mStr}-${dStr}`;
                  const isSelected = selectedDateFilter === dayDateStr;
                  const isToday = todayDateStr === dayDateStr;
                  const isFuture = dayDateStr > todayDateStr;
                  const hasSessions = sessions.some((s) => getSessionCalendarDate(s) === dayDateStr);

                  cells.push(
                    <button
                      key={dayDateStr}
                      type="button"
                      disabled={isFuture}
                      onClick={() => handleSelectDay(dayDateStr)}
                      className={`h-9 w-9 rounded-xl flex flex-col items-center justify-center relative transition-all touch-manipulation text-xs font-semibold ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-400/30 scale-105'
                          : isToday
                          ? 'border border-amber-400/80 text-amber-300 bg-amber-400/10'
                          : isFuture
                          ? 'opacity-20 pointer-events-none text-white/30'
                          : 'bg-white/5 hover:bg-white/15 text-white/90 active:scale-95'
                      }`}
                    >
                      <span>{d}</span>
                      {hasSessions && (
                        <span
                          className={`w-1 h-1 rounded-full absolute bottom-1 ${
                            isSelected ? 'bg-slate-950' : 'bg-amber-400'
                          }`}
                        />
                      )}
                    </button>
                  );
                }

                return cells;
              })()}
            </div>

            {/* Modal Quick Actions Footer */}
            <div className="flex items-center gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedDateFilter(todayDateStr);
                  setIsCalendarModalOpen(false);
                }}
                className="flex-1 py-2 px-2.5 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-white/90 font-semibold text-xs transition-all text-center"
              >
                {texts.calendarTodayBtn}
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedDateFilter(null);
                  setIsCalendarModalOpen(false);
                }}
                className="flex-1 py-2 px-2.5 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-white/90 font-semibold text-xs transition-all text-center"
              >
                {texts.calendarAllDaysBtn}
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setIsCalendarModalOpen(false);
                }}
                className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-white/60 font-medium text-xs transition-all"
              >
                {texts.calendarCloseBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Day & Night Sleep Hours Configuration Modal */}
      {isBoundsModalOpen && (
        <div
          onClick={() => setIsBoundsModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <form
            onSubmit={handleSaveScheduleBounds}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-slate-900 border border-white/20 p-5 flex flex-col gap-4 shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/30 text-amber-300 flex items-center justify-center">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">
                  {texts.sleepBoundsModalTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setIsBoundsModalOpen(false);
                }}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-white/65 leading-relaxed">
              {personalizedCopy?.sleepBoundsModalDesc ?? texts.sleepBoundsModalDesc}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-amber-400/10 border border-amber-400/25 flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-wider text-amber-200/80 font-semibold flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-300" />
                  <span>{texts.daySleepFrom}</span>
                </label>
                <input
                  type="time"
                  value={draftDayStart}
                  onChange={(e) => setDraftDayStart(e.target.value)}
                  className="w-full h-10 px-2.5 rounded-xl bg-slate-950 border border-white/15 text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  required
                />
              </div>

              <div className="p-3 rounded-2xl bg-indigo-500/15 border border-indigo-400/30 flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-wider text-indigo-200/80 font-semibold flex items-center gap-1.5">
                  <Moon className="w-3.5 h-3.5 text-indigo-300" />
                  <span>{texts.nightSleepFrom}</span>
                </label>
                <input
                  type="time"
                  value={draftNightStart}
                  onChange={(e) => setDraftNightStart(e.target.value)}
                  className="w-full h-10 px-2.5 rounded-xl bg-slate-950 border border-white/15 text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  required
                />
              </div>
            </div>

            {/* Visual preview bar */}
            <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between text-[11px] gap-2">
              <div className="flex items-center gap-1.5 text-amber-200">
                <Sun className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>{texts.dayWindowPreview}</span>
                <strong className="font-mono" dir="ltr">
                  {draftDayStart} – {draftNightStart}
                </strong>
              </div>
              <div className="flex items-center gap-1.5 text-indigo-200">
                <Moon className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
                <span>{texts.nightWindowPreview}</span>
                <strong className="font-mono" dir="ltr">
                  {draftNightStart} – {draftDayStart}
                </strong>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setIsBoundsModalOpen(false);
                }}
                className="py-2.5 px-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white/75 font-semibold text-xs active:scale-95 transition-all"
              >
                {texts.cancelBtn}
              </button>

              <button
                type="submit"
                className="flex-1 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-md active:scale-95 transition-all"
              >
                {texts.saveBoundsBtn}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Child Birth Date Quick Modal for Age-Based Optimal Wake Window */}
      {isBirthDateModalOpen && (
        <div
          onClick={() => setIsBirthDateModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <form
            onSubmit={handleSaveBirthDate}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-slate-900 border border-white/20 p-5 flex flex-col gap-4 shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/30 text-amber-300 flex items-center justify-center">
                  <Cake className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">
                  {wakeCopy.modalTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setIsBirthDateModalOpen(false);
                }}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-white/65 leading-relaxed">
              {wakeCopy.modalDesc}
            </p>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="schedule-baby-birthdate"
                className="text-[10px] uppercase tracking-wider text-amber-200/80 font-semibold"
              >
                {wakeCopy.birthDateLabel}
              </label>
              <input
                id="schedule-baby-birthdate"
                type="date"
                value={draftBirthDate}
                max={todayDateStr}
                onChange={(e) => setDraftBirthDate(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-slate-950 border border-white/20 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div className="flex gap-2">
              {draftBirthDate && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setDraftBirthDate('');
                    onChangeBabyBirthDate?.('');
                    setIsBirthDateModalOpen(false);
                  }}
                  className="py-2.5 px-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white/75 font-semibold text-xs active:scale-95 transition-all"
                >
                  {wakeCopy.birthDateClear}
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setIsBirthDateModalOpen(false);
                }}
                className="py-2.5 px-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white/75 font-semibold text-xs active:scale-95 transition-all"
              >
                {wakeCopy.cancelBtn}
              </button>

              <button
                type="submit"
                className="flex-1 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-md active:scale-95 transition-all"
              >
                {wakeCopy.saveBtn}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirm Delete Sleep Session Modal (prevents accidental 1-tap deletion) */}
      {sessionPendingDelete && (
        <div
          onClick={() => setSessionPendingDelete(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-slate-900 border border-red-400/25 p-5 flex flex-col gap-4 shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/15 border border-red-400/30 text-red-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white leading-snug">
                  {texts.deleteConfirmTitle}
                </h3>
                <p className="text-[11px] text-white/60 mt-0.5 leading-relaxed">
                  {texts.deleteConfirmDesc}
                </p>
              </div>
            </div>

            {(() => {
              const startD = new Date(sessionPendingDelete.startTime);
              const endD = new Date(sessionPendingDelete.endTime);
              const datePreview = startD.toLocaleDateString(currentLocale, {
                day: 'numeric',
                month: 'short',
              });
              const startPreview = startD.toLocaleTimeString(currentLocale, {
                hour: '2-digit',
                minute: '2-digit',
              });
              const endPreview = endD.toLocaleTimeString(currentLocale, {
                hour: '2-digit',
                minute: '2-digit',
              });
              return (
                <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      sessionPendingDelete.type === 'night-sleep'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                    }`}
                  >
                    {sessionPendingDelete.type === 'night-sleep' ? (
                      <Moon className="w-4 h-4" />
                    ) : (
                      <Sun className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">
                        {startPreview} – {endPreview}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 font-bold text-white/80">
                        {formatDuration(getSessionDurationMinutes(sessionPendingDelete))}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-white/50 mt-0.5 truncate">
                      <span>{datePreview}</span>
                      <span>·</span>
                      <span>
                        {sessionPendingDelete.type === 'night-sleep'
                          ? texts.nightSleep
                          : texts.dayNap}
                      </span>
                      {sessionPendingDelete.notes && (
                        <>
                          <span>·</span>
                          <span className="italic truncate">"{sessionPendingDelete.notes}"</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setSessionPendingDelete(null);
                }}
                className="flex-1 py-2.5 px-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white/85 font-semibold text-xs active:scale-95 transition-all"
              >
                {texts.cancelBtn}
              </button>

              <button
                type="button"
                onClick={handleConfirmDeleteSession}
                className="flex-1 py-2.5 px-4 rounded-2xl bg-red-500 hover:bg-red-400 text-white font-bold text-xs shadow-md shadow-red-950/40 active:scale-95 transition-all"
              >
                {texts.deleteConfirmBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
