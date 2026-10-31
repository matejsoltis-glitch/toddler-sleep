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
} from 'lucide-react';
import { Language, SleepSession, SleepQuality, SleepType } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

interface ScheduleAssistantModeProps {
  language: Language;
}

const STORAGE_KEY_SESSIONS = 'toddler_sleep_sessions';
const STORAGE_KEY_ACTIVE_SLEEP = 'toddler_active_sleep_start';

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
};

export const ScheduleAssistantMode: React.FC<ScheduleAssistantModeProps> = ({ language }) => {
  const texts = scheduleTexts[language] || scheduleTexts.en;
  const currentLocale = dateLocales[language] || 'en-US';

  const todayDateStr = new Date().toISOString().split('T')[0];
  const yesterdayDate = new Date(Date.now() - 24 * 3600 * 1000);
  const yesterdayDateStr = yesterdayDate.toISOString().split('T')[0];

  // Selected date filter (null = 'all' days, or specific ISO string 'YYYY-MM-DD')
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);

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

  // Load sessions from localStorage or seed initial sample
  const [sessions, setSessions] = useState<SleepSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SESSIONS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    // Initial sample sessions so parents immediately see the structure
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const yesterday = new Date(now.getTime() - 24 * 3600 * 1000);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    return [
      {
        id: 'sample-1',
        startTime: `${todayStr}T12:30:00`,
        endTime: `${todayStr}T14:15:00`,
        durationMinutes: 105,
        type: 'day-nap',
        quality: 'peaceful',
        notes: language === 'sk' ? 'Zaspal rýchlo po prechádzke' : 'Fell asleep quickly after a walk',
      },
      {
        id: 'sample-2',
        startTime: `${yesterdayStr}T20:00:00`,
        endTime: `${todayStr}T06:30:00`,
        durationMinutes: 630,
        type: 'night-sleep',
        quality: 'normal',
        notes: language === 'sk' ? 'Kľudná noc' : 'Peaceful night',
      },
    ];
  });

  // Active ongoing sleep start time (if baby is currently asleep)
  const [activeSleepStart, setActiveSleepStart] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_ACTIVE_SLEEP);
    } catch {
      return null;
    }
  });

  // Current elapsed seconds for active ongoing sleep
  const [activeElapsedSec, setActiveElapsedSec] = useState<number>(0);

  // Manual entry form expand state
  const [showManualForm, setShowManualForm] = useState(false);

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
  const [manualDate, setManualDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [manualStartTime, setManualStartTime] = useState('13:00');
  const [manualEndTime, setManualEndTime] = useState('14:30');
  const [manualType, setManualType] = useState<SleepType>('day-nap');
  const [manualQuality, setManualQuality] = useState<SleepQuality>('peaceful');
  const [manualNotes, setManualNotes] = useState('');

  // Toast / feedback message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Save sessions to localStorage whenever changed
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
    } catch {
      // ignore
    }
  }, [sessions]);

  // Live timer tick for ongoing sleep
  useEffect(() => {
    if (!activeSleepStart) {
      setActiveElapsedSec(0);
      return;
    }

    const calcElapsed = () => {
      const startMs = new Date(activeSleepStart).getTime();
      const diffSec = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
      setActiveElapsedSec(diffSec);
    };

    calcElapsed();
    const interval = setInterval(calcElapsed, 1000);
    return () => clearInterval(interval);
  }, [activeSleepStart]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
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
        return texts.qualityPeaceful.replace(/^[^\w\u00C0-\u024F\u0400-\u04FF]+\s*/, '');
      case 'normal':
        return texts.qualityNormal.replace(/^[^\w\u00C0-\u024F\u0400-\u04FF]+\s*/, '');
      case 'restless':
        return texts.qualityRestless.replace(/^[^\w\u00C0-\u024F\u0400-\u04FF]+\s*/, '');
    }
  };

  // 1. Live Sleep: Baby fell asleep
  const handleBabyFellAsleep = () => {
    triggerHaptic('heavy');
    const nowIso = new Date().toISOString();
    setActiveSleepStart(nowIso);
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_SLEEP, nowIso);
    } catch {
      // ignore
    }
    showToast(texts.toastTrackingStarted);
  };

  // 2. Live Sleep: Baby woke up
  const handleBabyWokeUp = () => {
    if (!activeSleepStart) return;
    triggerHaptic('heavy');
    const endIso = new Date().toISOString();
    const startMs = new Date(activeSleepStart).getTime();
    const endMs = new Date(endIso).getTime();
    const durationMin = Math.max(1, Math.round((endMs - startMs) / 60000));

    // Guess day nap vs night sleep based on time of day (19:00 - 07:00 is night)
    const hour = new Date().getHours();
    const defaultType: SleepType = hour >= 19 || hour < 7 ? 'night-sleep' : 'day-nap';

    setPendingEndSession({
      startIso: activeSleepStart,
      endIso,
      durationMin,
    });
    setModalType(defaultType);
    setModalQuality('peaceful');
    setModalNotes('');
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

    setSessions((prev) => [newSession, ...prev]);
    setActiveSleepStart(null);
    try {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_SLEEP);
    } catch {
      // ignore
    }
    setWakeModalOpen(false);
    setPendingEndSession(null);
    showToast(texts.toastSessionSaved);
  };

  // Cancel ongoing sleep without saving
  const handleCancelLiveSession = () => {
    triggerHaptic('light');
    setActiveSleepStart(null);
    try {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_SLEEP);
    } catch {
      // ignore
    }
    setWakeModalOpen(false);
    setPendingEndSession(null);
  };

  // 3. Manual Entry submission
  const handleSaveManualSession = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('medium');

    const startDateTime = new Date(`${manualDate}T${manualStartTime}:00`);
    let endDateTime = new Date(`${manualDate}T${manualEndTime}:00`);

    // Handle overnight spans (e.g. 21:00 to 07:00 next day)
    if (endDateTime.getTime() <= startDateTime.getTime()) {
      endDateTime = new Date(endDateTime.getTime() + 24 * 3600 * 1000);
    }

    const durationMin = Math.max(1, Math.round((endDateTime.getTime() - startDateTime.getTime()) / 60000));

    const newSession: SleepSession = {
      id: 'sleep-' + Date.now(),
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      durationMinutes: durationMin,
      type: manualType,
      quality: manualQuality,
      notes: manualNotes.trim() || undefined,
    };

    setSessions((prev) => [newSession, ...prev]);
    setShowManualForm(false);
    setManualNotes('');
    showToast(texts.toastSessionAdded);
  };

  // Delete a session
  const handleDeleteSession = (id: string) => {
    triggerHaptic('light');
    setSessions((prev) => prev.filter((s) => s.id !== id));
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

  // Calculate Wake Window: Time elapsed since the last finished sleep session ended
  const lastSession = sessions.length > 0 ? sessions[0] : null;
  const calculateWakeWindowMinutes = () => {
    if (!lastSession || activeSleepStart) return null;
    const endMs = new Date(lastSession.endTime).getTime();
    const nowMs = Date.now();
    const diffMin = Math.floor((nowMs - endMs) / 60000);
    return diffMin >= 0 ? diffMin : 0;
  };

  const wakeWindowMins = calculateWakeWindowMinutes();

  // Calculate today's total sleep & breakdown
  const todaySessions = sessions.filter((s) => s.startTime.startsWith(todayDateStr));
  const todayTotalMins = todaySessions.reduce((acc, curr) => acc + curr.durationMinutes, 0);
  const todayNapSessions = todaySessions.filter((s) => s.type === 'day-nap');
  const todayNightSessions = todaySessions.filter((s) => s.type === 'night-sleep');
  const todayNapMins = todayNapSessions.reduce((acc, curr) => acc + curr.durationMinutes, 0);
  const todayNightMins = todayNightSessions.reduce((acc, curr) => acc + curr.durationMinutes, 0);
  const todayAvgMins = todaySessions.length > 0 ? Math.round(todayTotalMins / todaySessions.length) : 0;

  // Calendar Day Navigation helpers
  const handleShiftDay = (daysDelta: number) => {
    triggerHaptic('light');
    const baseDate = selectedDateFilter ? new Date(selectedDateFilter) : new Date();
    const nextDate = new Date(baseDate.getTime() + daysDelta * 24 * 3600 * 1000);
    const nextDateStr = nextDate.toISOString().split('T')[0];

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
    if (dateStr === todayDateStr) {
      const formatted = new Date(dateStr).toLocaleDateString(currentLocale, {
        day: 'numeric',
        month: 'short',
      });
      return `${texts.today} (${formatted})`;
    }
    if (dateStr === yesterdayDateStr) {
      const formatted = new Date(dateStr).toLocaleDateString(currentLocale, {
        day: 'numeric',
        month: 'short',
      });
      return `${texts.yesterday} (${formatted})`;
    }
    return new Date(dateStr).toLocaleDateString(currentLocale, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Filtered sessions based on calendar day selector
  const filteredSessions = selectedDateFilter
    ? sessions.filter((s) => s.startTime.startsWith(selectedDateFilter))
    : sessions;

  // Calculate day metrics for filtered date
  const filteredDayTotalMins = filteredSessions.reduce((acc, curr) => acc + curr.durationMinutes, 0);

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
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <span className="text-xs text-indigo-200/70 mb-1">
              {texts.fellAsleepAt}{' '}
              {new Date(activeSleepStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-mono drop-shadow">
              {formatLiveClock(activeElapsedSec)}
            </div>
            <p className="text-[11px] text-white/50 mt-1 max-w-xs">
              {texts.timerBackgroundHint}
            </p>

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

        {/* Wake Window & Pediatric Sweet Spot Tip */}
        {!activeSleepStart && wakeWindowMins !== null && (
          <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-white/70">
              <Clock className="w-3.5 h-3.5 text-indigo-300" />
              <span>{texts.wakeWindow}</span>
              <strong className="text-white font-semibold">{formatDuration(wakeWindowMins)}</strong>
            </div>

            <span className="text-[10px] text-white/50 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
              {texts.sinceLastSleep}
            </span>
          </div>
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

        {/* Subtle sub-metrics breakdown row if there are sessions today */}
        {todaySessions.length > 0 && (
          <div className="pt-2.5 border-t border-white/5 grid grid-cols-3 gap-1 text-[11px] text-white/60">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-white/40">
                {texts.dayNap}
              </span>
              <span className="font-semibold text-white/80">
                {formatDuration(todayNapMins)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-white/40">
                {texts.nightSleep}
              </span>
              <span className="font-semibold text-white/80">
                {formatDuration(todayNightMins)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-white/40">
                {texts.average}
              </span>
              <span className="font-semibold text-white/80">
                {formatDuration(todayAvgMins)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Manual Entry Toggle */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/50 overflow-hidden">
        <button
          onClick={() => {
            triggerHaptic('light');
            setShowManualForm(!showManualForm);
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
                  onChange={(e) => setManualStartTime(e.target.value)}
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

      {/* History Section Header with Day/Calendar Switcher */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/70">
              {texts.historyTitle}
            </h3>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 font-bold text-white/80">
              {filteredSessions.length}
            </span>
          </div>

          {selectedDateFilter ? (
            <span className="text-[11px] text-amber-300/80 font-medium">
              {texts.dayTotalLabel} {formatDuration(filteredDayTotalMins)}
            </span>
          ) : (
            sessions.length > 0 && (
              <span className="text-[11px] text-white/40">{texts.latestFirst}</span>
            )
          )}
        </div>

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
                            {formatDuration(s.durationMinutes)}
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

                    <button
                      onClick={() => handleDeleteSession(s.id)}
                      className="p-2 rounded-xl text-white/30 hover:text-red-400 hover:bg-red-500/10 active:scale-95 transition-all shrink-0"
                      title={texts.deleteTitle}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
                  const hasSessions = sessions.some((s) => s.startTime.startsWith(dayDateStr));

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
    </div>
  );
};
