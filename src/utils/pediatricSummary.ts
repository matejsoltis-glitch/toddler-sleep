import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Language, SleepQuality, SleepSession } from '../types';
import { normalizeBabyName } from './babyName';
import { AgeSummary, formatShortAge, getChildAgeSummary } from './wakeWindow';

export type SummaryPeriodDays = 7 | 14;

export interface DailySleepBucket {
  dateStr: string; // YYYY-MM-DD (local)
  dayNapMinutes: number;
  nightSleepMinutes: number;
  totalMinutes: number;
  napCount: number;
  nightCount: number;
  sessionCount: number;
  sessions: SleepSession[];
  isToday: boolean;
}

export interface WeeklyTrendSummary {
  days: DailySleepBucket[];
  loggedDaysCount: number;
  avgDailyTotalMinutes: number;
  avgDayNapMinutes: number;
  avgNightSleepMinutes: number;
  maxDayMinutes: number;
  ageTargetMinHours: number | null;
  ageTargetMaxHours: number | null;
  ageTargetRangeText: string | null;
}

export interface PediatricSleepReport {
  periodDays: SummaryPeriodDays;
  fromDateStr: string;
  toDateStr: string;
  babyName: string;
  ageSummary: AgeSummary | null;
  days: DailySleepBucket[];
  sessionsInPeriod: SleepSession[];
  loggedDaysCount: number;
  totalSessionsCount: number;
  avgDailyTotalMinutes: number;
  avgDayNapMinutes: number;
  avgNapsPerLoggedDay: number;
  avgNightSleepMinutes: number;
  typicalBedtime: string | null; // HH:mm
  typicalWakeTime: string | null; // HH:mm
  qualityCounts: Record<SleepQuality, number>;
  qualityPercents: Record<SleepQuality, number>;
}

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

export function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getSessionDurationMinutesSafe(session: SleepSession): number {
  if (Number.isFinite(session.durationMinutes) && session.durationMinutes > 0) {
    return Math.round(session.durationMinutes);
  }
  const startMs = new Date(session.startTime).getTime();
  const endMs = new Date(session.endTime).getTime();
  if (!Number.isNaN(startMs) && !Number.isNaN(endMs) && endMs > startMs) {
    return Math.max(1, Math.round((endMs - startMs) / 60000));
  }
  return 0;
}

/**
 * Matches Mode 4 attribution: overnight night-sleep belongs to the morning calendar date it finishes.
 */
export function getSessionLocalCalendarDate(session: SleepSession): string {
  const refDate =
    session.type === 'night-sleep' ? new Date(session.endTime) : new Date(session.startTime);
  if (Number.isNaN(refDate.getTime())) {
    return session.startTime.split('T')[0];
  }
  return toLocalDateStr(refDate);
}

export function formatMinutesCompact(mins: number): string {
  const rounded = Math.max(0, Math.round(mins));
  const h = Math.floor(rounded / 60);
  const m = rounded % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Circular mean of time-of-day (HH:mm) so midnight wrap-around (e.g. 23:45 and 00:15) averages to 00:00.
 */
export function computeCircularMeanHHMM(isoTimestamps: string[]): string | null {
  let sinSum = 0;
  let cosSum = 0;
  let count = 0;

  for (const iso of isoTimestamps) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) continue;
    const minsOfDay = d.getHours() * 60 + d.getMinutes();
    const angle = (minsOfDay / 1440) * 2 * Math.PI;
    sinSum += Math.sin(angle);
    cosSum += Math.cos(angle);
    count += 1;
  }

  if (count === 0) return null;
  if (Math.hypot(sinSum, cosSum) < 1e-6) return null;

  let avgAngle = Math.atan2(sinSum / count, cosSum / count);
  if (avgAngle < 0) avgAngle += 2 * Math.PI;

  const avgMins = Math.round((avgAngle / (2 * Math.PI)) * 1440) % 1440;
  const hh = String(Math.floor(avgMins / 60)).padStart(2, '0');
  const mm = String(avgMins % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function buildDailyBuckets(
  sessions: SleepSession[],
  numDays: number,
  referenceDate: Date = new Date()
): DailySleepBucket[] {
  const todayStr = toLocalDateStr(referenceDate);
  const buckets: DailySleepBucket[] = [];
  const bucketMap = new Map<string, DailySleepBucket>();

  for (let offset = numDays - 1; offset >= 0; offset--) {
    const d = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      referenceDate.getDate() - offset,
      12,
      0,
      0,
      0
    );
    const dateStr = toLocalDateStr(d);
    const bucket: DailySleepBucket = {
      dateStr,
      dayNapMinutes: 0,
      nightSleepMinutes: 0,
      totalMinutes: 0,
      napCount: 0,
      nightCount: 0,
      sessionCount: 0,
      sessions: [],
      isToday: dateStr === todayStr,
    };
    buckets.push(bucket);
    bucketMap.set(dateStr, bucket);
  }

  for (const session of sessions) {
    const calDate = getSessionLocalCalendarDate(session);
    const bucket = bucketMap.get(calDate);
    if (!bucket) continue;
    const mins = getSessionDurationMinutesSafe(session);
    if (mins <= 0) continue;

    bucket.sessions.push(session);
    bucket.sessionCount += 1;
    bucket.totalMinutes += mins;
    if (session.type === 'night-sleep') {
      bucket.nightSleepMinutes += mins;
      bucket.nightCount += 1;
    } else {
      bucket.dayNapMinutes += mins;
      bucket.napCount += 1;
    }
  }

  return buckets;
}

export function buildLast7DaysTrend(
  sessions: SleepSession[],
  babyBirthDate?: string | null,
  referenceDate: Date = new Date()
): WeeklyTrendSummary {
  const days = buildDailyBuckets(sessions, 7, referenceDate);
  const loggedDays = days.filter((d) => d.totalMinutes > 0);
  const loggedDaysCount = loggedDays.length;

  const totalSum = loggedDays.reduce((acc, d) => acc + d.totalMinutes, 0);
  const napSum = loggedDays.reduce((acc, d) => acc + d.dayNapMinutes, 0);
  const nightDays = days.filter((d) => d.nightSleepMinutes > 0);
  const nightSum = nightDays.reduce((acc, d) => acc + d.nightSleepMinutes, 0);
  const maxDayMinutes = days.reduce((m, d) => Math.max(m, d.totalMinutes), 0);

  const ageSummary = getChildAgeSummary(babyBirthDate);

  return {
    days,
    loggedDaysCount,
    avgDailyTotalMinutes: loggedDaysCount > 0 ? Math.round(totalSum / loggedDaysCount) : 0,
    avgDayNapMinutes: loggedDaysCount > 0 ? Math.round(napSum / loggedDaysCount) : 0,
    avgNightSleepMinutes: nightDays.length > 0 ? Math.round(nightSum / nightDays.length) : 0,
    maxDayMinutes,
    ageTargetMinHours: ageSummary ? ageSummary.dailySleepMinHours : null,
    ageTargetMaxHours: ageSummary ? ageSummary.dailySleepMaxHours : null,
    ageTargetRangeText: ageSummary ? ageSummary.dailySleepRangeHours : null,
  };
}

export function buildPediatricSummary(
  sessions: SleepSession[],
  periodDays: SummaryPeriodDays,
  babyName?: string | null,
  babyBirthDate?: string | null,
  referenceDate: Date = new Date()
): PediatricSleepReport {
  const days = buildDailyBuckets(sessions, periodDays, referenceDate);
  const fromDateStr = days[0]?.dateStr ?? toLocalDateStr(referenceDate);
  const toDateStr = days[days.length - 1]?.dateStr ?? toLocalDateStr(referenceDate);

  const sessionsInPeriod = days
    .flatMap((d) => d.sessions)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  const loggedDays = days.filter((d) => d.totalMinutes > 0);
  const loggedDaysCount = loggedDays.length;

  const totalMinsSum = loggedDays.reduce((acc, d) => acc + d.totalMinutes, 0);
  const napMinsSum = loggedDays.reduce((acc, d) => acc + d.dayNapMinutes, 0);
  const napCountSum = loggedDays.reduce((acc, d) => acc + d.napCount, 0);

  const nightDays = days.filter((d) => d.nightSleepMinutes > 0);
  const nightMinsSum = nightDays.reduce((acc, d) => acc + d.nightSleepMinutes, 0);

  const nightSessions = sessionsInPeriod.filter((s) => s.type === 'night-sleep');
  const typicalBedtime = computeCircularMeanHHMM(nightSessions.map((s) => s.startTime));
  const typicalWakeTime = computeCircularMeanHHMM(nightSessions.map((s) => s.endTime));

  const qualityCounts: Record<SleepQuality, number> = {
    peaceful: 0,
    normal: 0,
    restless: 0,
  };
  for (const s of sessionsInPeriod) {
    qualityCounts[s.quality] = (qualityCounts[s.quality] || 0) + 1;
  }

  const totalCount = sessionsInPeriod.length;
  const qualityPercents: Record<SleepQuality, number> = {
    peaceful: totalCount > 0 ? Math.round((qualityCounts.peaceful / totalCount) * 100) : 0,
    normal: totalCount > 0 ? Math.round((qualityCounts.normal / totalCount) * 100) : 0,
    restless: totalCount > 0 ? Math.round((qualityCounts.restless / totalCount) * 100) : 0,
  };

  return {
    periodDays,
    fromDateStr,
    toDateStr,
    babyName: normalizeBabyName(babyName),
    ageSummary: getChildAgeSummary(babyBirthDate),
    days,
    sessionsInPeriod,
    loggedDaysCount,
    totalSessionsCount: totalCount,
    avgDailyTotalMinutes: loggedDaysCount > 0 ? Math.round(totalMinsSum / loggedDaysCount) : 0,
    avgDayNapMinutes: loggedDaysCount > 0 ? Math.round(napMinsSum / loggedDaysCount) : 0,
    avgNapsPerLoggedDay:
      loggedDaysCount > 0 ? Math.round((napCountSum / loggedDaysCount) * 10) / 10 : 0,
    avgNightSleepMinutes:
      nightDays.length > 0 ? Math.round(nightMinsSum / nightDays.length) : 0,
    typicalBedtime,
    typicalWakeTime,
    qualityCounts,
    qualityPercents,
  };
}

export interface PediatricSummaryCopy {
  sectionTitle: string;
  sectionSubtitle: string;
  period7d: string;
  period14d: string;
  avg24hLabel: string;
  avgDayLabel: string;
  avgNightLabel: string;
  bedtimeLabel: string;
  wakeupLabel: string;
  daysRecordedMeta: (logged: number, total: number, sessions: number) => string;
  noDataInPeriod: (days: number) => string;
  previewToggleShow: string;
  previewToggleHide: string;
  shareTextBtn: string;
  copyTextBtn: string;
  exportCsvBtn: string;
  toastShared: string;
  toastCopied: string;
  toastCsvShared: string;
  toastCsvDownloaded: string;
  toastCsvSaved: string;
  toastError: string;
  reportTitle: (days: number) => string;
  reportChildLabel: string;
  reportAgeLabel: string;
  reportPeriodLabel: string;
  reportTargetLabel: string;
  reportAveragesHeading: string;
  reportNapsPerDay: (count: number) => string;
  reportQualityHeading: string;
  qualityPeaceful: string;
  qualityNormal: string;
  qualityRestless: string;
  reportDailyLogHeading: string;
  dayTypeShort: string;
  nightTypeShort: string;
  csvHeaders: [string, string, string, string, string, string, string, string];
  dayNapCsv: string;
  nightSleepCsv: string;
}

export function getPediatricSummaryCopy(language: Language): PediatricSummaryCopy {
  switch (language) {
    case 'sk':
      return {
        sectionTitle: 'Súhrn pre pediatra / poradkyňu',
        sectionSubtitle: 'Čitateľný textový prehľad alebo tabuľka CSV za 7 alebo 14 dní',
        period7d: '7 dní',
        period14d: '14 dní',
        avg24hLabel: 'Priemer / 24h',
        avgDayLabel: 'Denný spánok',
        avgNightLabel: 'Nočný spánok',
        bedtimeLabel: 'Zaspávanie',
        wakeupLabel: 'Vstávanie',
        daysRecordedMeta: (l, t, s) => `${l} z ${t} dní · ${s} záznamov`,
        noDataInPeriod: (d) => `Za posledných ${d} dní zatiaľ nie sú zaznamenané žiadne spánky.`,
        previewToggleShow: 'Zobraziť náhľad textu',
        previewToggleHide: 'Skryť náhľad textu',
        shareTextBtn: 'Zdieľať súhrn',
        copyTextBtn: 'Kopírovať text',
        exportCsvBtn: 'CSV tabuľka',
        toastShared: 'Súhrn pripravený na odoslanie ✨',
        toastCopied: 'Súhrn skopírovaný do schránky ✨',
        toastCsvShared: 'CSV tabuľka pripravená na zdieľanie ✨',
        toastCsvDownloaded: 'CSV tabuľka bola stiahnutá ✨',
        toastCsvSaved: 'CSV tabuľka uložená do Dokumentov ✨',
        toastError: 'Nepodarilo sa zdieľať súhrn. Skúste prosím Kopírovať.',
        reportTitle: (d) => `SPÁNKOVÝ SÚHRN (posledných ${d} dní)`,
        reportChildLabel: 'Dieťa',
        reportAgeLabel: 'Vek',
        reportPeriodLabel: 'Obdobie',
        reportTargetLabel: 'Odporúčaný 24h cieľ',
        reportAveragesHeading: 'Priemerné hodnoty',
        reportNapsPerDay: (c) => `${c} spánky/deň`,
        reportQualityHeading: 'Kvalita spánku',
        qualityPeaceful: 'Kľudný',
        qualityNormal: 'Normálny',
        qualityRestless: 'Nepokojný',
        reportDailyLogHeading: 'Prehľad podľa dní',
        dayTypeShort: 'Deň',
        nightTypeShort: 'Noc',
        csvHeaders: ['Dátum', 'Začiatok', 'Koniec', 'Trvanie (min)', 'Trvanie', 'Typ', 'Kvalita', 'Poznámka'],
        dayNapCsv: 'Denný spánok',
        nightSleepCsv: 'Nočný spánok',
      };
    case 'cs':
      return {
        sectionTitle: 'Souhrn pro pediatra / poradkyni',
        sectionSubtitle: 'Čitelný textový přehled nebo tabulka CSV za 7 či 14 dní',
        period7d: '7 dní',
        period14d: '14 dní',
        avg24hLabel: 'Průměr / 24h',
        avgDayLabel: 'Denní spánek',
        avgNightLabel: 'Noční spánek',
        bedtimeLabel: 'Usínání',
        wakeupLabel: 'Probuzení',
        daysRecordedMeta: (l, t, s) => `${l} z ${t} dní · ${s} záznamů`,
        noDataInPeriod: (d) => `Za posledních ${d} dní zatím nejsou zaznamenány žádné spánky.`,
        previewToggleShow: 'Zobrazit náhled textu',
        previewToggleHide: 'Skrýt náhled textu',
        shareTextBtn: 'Sdílet souhrn',
        copyTextBtn: 'Kopírovat text',
        exportCsvBtn: 'CSV tabulka',
        toastShared: 'Souhrn připraven k odeslání ✨',
        toastCopied: 'Souhrn zkopírován do schránky ✨',
        toastCsvShared: 'CSV tabulka připravena ke sdílení ✨',
        toastCsvDownloaded: 'CSV tabulka byla stažena ✨',
        toastCsvSaved: 'CSV tabulka uložena do Dokumentů ✨',
        toastError: 'Nepodařilo se sdílet souhrn. Zkuste prosím Kopírovat.',
        reportTitle: (d) => `SPÁNKOVÝ SOUHRN (posledních ${d} dní)`,
        reportChildLabel: 'Dítě',
        reportAgeLabel: 'Věk',
        reportPeriodLabel: 'Období',
        reportTargetLabel: 'Doporučený 24h cíl',
        reportAveragesHeading: 'Průměrné hodnoty',
        reportNapsPerDay: (c) => `${c} spánky/den`,
        reportQualityHeading: 'Kvalita spánku',
        qualityPeaceful: 'Klidný',
        qualityNormal: 'Normální',
        qualityRestless: 'Neklidný',
        reportDailyLogHeading: 'Přehled podle dnů',
        dayTypeShort: 'Den',
        nightTypeShort: 'Noc',
        csvHeaders: ['Datum', 'Začátek', 'Konec', 'Trvání (min)', 'Trvání', 'Typ', 'Kvalita', 'Poznámka'],
        dayNapCsv: 'Denní spánek',
        nightSleepCsv: 'Noční spánek',
      };
    case 'en':
      return {
        sectionTitle: 'Summary for Pediatrician / Consultant',
        sectionSubtitle: 'Readable text report or CSV table for the last 7 or 14 days',
        period7d: '7 days',
        period14d: '14 days',
        avg24hLabel: 'Avg / 24h',
        avgDayLabel: 'Day naps',
        avgNightLabel: 'Night sleep',
        bedtimeLabel: 'Bedtime',
        wakeupLabel: 'Wake-up',
        daysRecordedMeta: (l, t, s) => `${l} of ${t} days · ${s} records`,
        noDataInPeriod: (d) => `No sleep sessions recorded in the last ${d} days yet.`,
        previewToggleShow: 'Preview full text',
        previewToggleHide: 'Hide text preview',
        shareTextBtn: 'Share summary',
        copyTextBtn: 'Copy text',
        exportCsvBtn: 'CSV table',
        toastShared: 'Summary ready to send ✨',
        toastCopied: 'Summary copied to clipboard ✨',
        toastCsvShared: 'CSV report ready to share ✨',
        toastCsvDownloaded: 'CSV report downloaded ✨',
        toastCsvSaved: 'CSV report saved to Documents ✨',
        toastError: 'Could not share summary. Please try Copy text.',
        reportTitle: (d) => `SLEEP SUMMARY (last ${d} days)`,
        reportChildLabel: 'Child',
        reportAgeLabel: 'Age',
        reportPeriodLabel: 'Period',
        reportTargetLabel: 'Recommended 24h target',
        reportAveragesHeading: 'Averages',
        reportNapsPerDay: (c) => `${c} naps/day`,
        reportQualityHeading: 'Sleep quality',
        qualityPeaceful: 'Calm',
        qualityNormal: 'Normal',
        qualityRestless: 'Restless',
        reportDailyLogHeading: 'Day-by-day overview',
        dayTypeShort: 'Day',
        nightTypeShort: 'Night',
        csvHeaders: ['Date', 'Start', 'End', 'Duration (min)', 'Duration', 'Type', 'Quality', 'Note'],
        dayNapCsv: 'Day nap',
        nightSleepCsv: 'Night sleep',
      };
    case 'pl':
      return {
        sectionTitle: 'Podsumowanie dla pediatry / konsultantki',
        sectionSubtitle: 'Czytelny raport tekstowy lub tabela CSV za 7 lub 14 dni',
        period7d: '7 dni',
        period14d: '14 dni',
        avg24hLabel: 'Średnia / 24h',
        avgDayLabel: 'Drzemki dzienne',
        avgNightLabel: 'Sen nocny',
        bedtimeLabel: 'Zasypianie',
        wakeupLabel: 'Pobudka',
        daysRecordedMeta: (l, t, s) => `${l} z ${t} dni · ${s} wpisów`,
        noDataInPeriod: (d) => `Brak zapisanych snów z ostatnich ${d} dni.`,
        previewToggleShow: 'Podgląd pełnego tekstu',
        previewToggleHide: 'Ukryj podgląd',
        shareTextBtn: 'Udostępnij raport',
        copyTextBtn: 'Kopiuj tekst',
        exportCsvBtn: 'Tabela CSV',
        toastShared: 'Raport gotowy do wysłania ✨',
        toastCopied: 'Raport skopiowany do schowka ✨',
        toastCsvShared: 'Tabela CSV gotowa do udostępnienia ✨',
        toastCsvDownloaded: 'Tabela CSV została pobrana ✨',
        toastCsvSaved: 'Tabela CSV zapisana w Dokumentach ✨',
        toastError: 'Nie udało się udostępnić. Użyj przycisku Kopiuj.',
        reportTitle: (d) => `PODSUMOWANIE SNU (ostatnie ${d} dni)`,
        reportChildLabel: 'Dziecko',
        reportAgeLabel: 'Wiek',
        reportPeriodLabel: 'Okres',
        reportTargetLabel: 'Zalecany cel 24h',
        reportAveragesHeading: 'Średnie wartości',
        reportNapsPerDay: (c) => `${c} drzemki/dzień`,
        reportQualityHeading: 'Jakość snu',
        qualityPeaceful: 'Spokojny',
        qualityNormal: 'Normalny',
        qualityRestless: 'Niespokojny',
        reportDailyLogHeading: 'Przegląd dzienny',
        dayTypeShort: 'Dzień',
        nightTypeShort: 'Noc',
        csvHeaders: ['Data', 'Początek', 'Koniec', 'Czas (min)', 'Czas', 'Typ', 'Jakość', 'Notatka'],
        dayNapCsv: 'Drzemka dzienna',
        nightSleepCsv: 'Sen nocny',
      };
    case 'hu':
      return {
        sectionTitle: 'Összefoglaló gyermekorvosnak / tanácsadónak',
        sectionSubtitle: 'Olvasható szöveges összegzés vagy CSV táblázat 7 vagy 14 napra',
        period7d: '7 nap',
        period14d: '14 nap',
        avg24hLabel: 'Átlag / 24ó',
        avgDayLabel: 'Nappali alvás',
        avgNightLabel: 'Éjszakai alvás',
        bedtimeLabel: 'Elalvás',
        wakeupLabel: 'Ébredés',
        daysRecordedMeta: (l, t, s) => `${l} / ${t} nap · ${s} bejegyzés`,
        noDataInPeriod: (d) => `Az elmúlt ${d} napban még nincs rögzített alvás.`,
        previewToggleShow: 'Teljes szöveg előnézete',
        previewToggleHide: 'Előnézet elrejtése',
        shareTextBtn: 'Összegzés megosztása',
        copyTextBtn: 'Szöveg másolása',
        exportCsvBtn: 'CSV táblázat',
        toastShared: 'Összefoglaló küldésre kész ✨',
        toastCopied: 'Összefoglaló a vágólapra másolva ✨',
        toastCsvShared: 'CSV táblázat megosztásra kész ✨',
        toastCsvDownloaded: 'CSV táblázat letöltve ✨',
        toastCsvSaved: 'CSV mentve a Dokumentumok mappába ✨',
        toastError: 'Nem sikerült megosztani. Próbáld a Másolás gombot.',
        reportTitle: (d) => `ALVÁSI ÖSSZEFOGLALÓ (elmúlt ${d} nap)`,
        reportChildLabel: 'Gyermek',
        reportAgeLabel: 'Életkor',
        reportPeriodLabel: 'Időszak',
        reportTargetLabel: 'Ajánlott 24 órás cél',
        reportAveragesHeading: 'Átlagos értékek',
        reportNapsPerDay: (c) => `${c} alvás/nap`,
        reportQualityHeading: 'Alvás minősége',
        qualityPeaceful: 'Nyugodt',
        qualityNormal: 'Normál',
        qualityRestless: 'Nyugtalan',
        reportDailyLogHeading: 'Napi bontás',
        dayTypeShort: 'Nappal',
        nightTypeShort: 'Éjjel',
        csvHeaders: ['Dátum', 'Kezdet', 'Vég', 'Idő (perc)', 'Időtartam', 'Típus', 'Minőség', 'Megjegyzés'],
        dayNapCsv: 'Nappali alvás',
        nightSleepCsv: 'Éjszakai alvás',
      };
    case 'uk':
      return {
        sectionTitle: 'Підсумок для педіатра / консультанта',
        sectionSubtitle: 'Зручний текстовий звіт або таблиця CSV за 7 або 14 днів',
        period7d: '7 днів',
        period14d: '14 днів',
        avg24hLabel: 'Середнє / 24г',
        avgDayLabel: 'Денний сон',
        avgNightLabel: 'Нічний сон',
        bedtimeLabel: 'Засинання',
        wakeupLabel: 'Пробудження',
        daysRecordedMeta: (l, t, s) => `${l} із ${t} днів · ${s} записів`,
        noDataInPeriod: (d) => `За останні ${d} днів ще немає записів сну.`,
        previewToggleShow: 'Переглянути повний текст',
        previewToggleHide: 'Сховати перегляд',
        shareTextBtn: 'Поділитися звітом',
        copyTextBtn: 'Копіювати текст',
        exportCsvBtn: 'CSV таблиця',
        toastShared: 'Звіт готовий до надсилання ✨',
        toastCopied: 'Звіт скопійовано в буфер ✨',
        toastCsvShared: 'CSV таблицю підготовлено ✨',
        toastCsvDownloaded: 'CSV таблицю завантажено ✨',
        toastCsvSaved: 'CSV збережено в Документи ✨',
        toastError: 'Не вдалося поділитися. Спробуйте Копіювати.',
        reportTitle: (d) => `ПІДСУМОК СНУ (останні ${d} днів)`,
        reportChildLabel: 'Дитина',
        reportAgeLabel: 'Вік',
        reportPeriodLabel: 'Період',
        reportTargetLabel: 'Рекомендована норма за 24 год',
        reportAveragesHeading: 'Середні показники',
        reportNapsPerDay: (c) => `${c} сни/день`,
        reportQualityHeading: 'Якість сну',
        qualityPeaceful: 'Спокійний',
        qualityNormal: 'Нормальний',
        qualityRestless: 'Неспокійний',
        reportDailyLogHeading: 'Огляд по днях',
        dayTypeShort: 'День',
        nightTypeShort: 'Ніч',
        csvHeaders: ['Дата', 'Початок', 'Кінець', 'Тривалість (хв)', 'Тривалість', 'Тип', 'Якість', 'Примітка'],
        dayNapCsv: 'Денний сон',
        nightSleepCsv: 'Нічний сон',
      };
    case 'it':
      return {
        sectionTitle: 'Riepilogo per pediatra / consulente',
        sectionSubtitle: 'Report testuale leggibile o tabella CSV degli ultimi 7 o 14 giorni',
        period7d: '7 giorni',
        period14d: '14 giorni',
        avg24hLabel: 'Media / 24h',
        avgDayLabel: 'Sonno diurno',
        avgNightLabel: 'Sonno notturno',
        bedtimeLabel: 'Nanna sera',
        wakeupLabel: 'Risveglio',
        daysRecordedMeta: (l, t, s) => `${l} su ${t} giorni · ${s} sessioni`,
        noDataInPeriod: (d) => `Nessuna sessione di sonno registrata negli ultimi ${d} giorni.`,
        previewToggleShow: 'Anteprima testo completo',
        previewToggleHide: 'Nascondi anteprima',
        shareTextBtn: 'Condividi report',
        copyTextBtn: 'Copia testo',
        exportCsvBtn: 'Tabella CSV',
        toastShared: 'Report pronto per la condivisione ✨',
        toastCopied: 'Report copiato negli appunti ✨',
        toastCsvShared: 'Tabella CSV pronta da condividere ✨',
        toastCsvDownloaded: 'Tabella CSV scaricata ✨',
        toastCsvSaved: 'CSV salvato in Documenti ✨',
        toastError: 'Impossibile condividere. Prova Copia testo.',
        reportTitle: (d) => `RIEPILOGO SONNO (ultimi ${d} giorni)`,
        reportChildLabel: 'Bambino',
        reportAgeLabel: 'Età',
        reportPeriodLabel: 'Periodo',
        reportTargetLabel: 'Obiettivo 24h consigliato',
        reportAveragesHeading: 'Medie',
        reportNapsPerDay: (c) => `${c} riposini/giorno`,
        reportQualityHeading: 'Qualità del sonno',
        qualityPeaceful: 'Tranquillo',
        qualityNormal: 'Normale',
        qualityRestless: 'Agitato',
        reportDailyLogHeading: 'Dettaglio giornaliero',
        dayTypeShort: 'Giorno',
        nightTypeShort: 'Notte',
        csvHeaders: ['Data', 'Inizio', 'Fine', 'Durata (min)', 'Durata', 'Tipo', 'Qualità', 'Nota'],
        dayNapCsv: 'Pisolino diurno',
        nightSleepCsv: 'Sonno notturno',
      };
    case 'es':
      return {
        sectionTitle: 'Resumen para pediatra / asesora',
        sectionSubtitle: 'Informe de texto claro o tabla CSV de los últimos 7 o 14 días',
        period7d: '7 días',
        period14d: '14 días',
        avg24hLabel: 'Media / 24h',
        avgDayLabel: 'Siestas día',
        avgNightLabel: 'Sueño noche',
        bedtimeLabel: 'Acostarse',
        wakeupLabel: 'Despertar',
        daysRecordedMeta: (l, t, s) => `${l} de ${t} días · ${s} registros`,
        noDataInPeriod: (d) => `Aún no hay registros de sueño en los últimos ${d} días.`,
        previewToggleShow: 'Ver vista previa del texto',
        previewToggleHide: 'Ocultar vista previa',
        shareTextBtn: 'Compartir resumen',
        copyTextBtn: 'Copiar texto',
        exportCsvBtn: 'Tabla CSV',
        toastShared: 'Resumen listo para enviar ✨',
        toastCopied: 'Resumen copiado al portapapeles ✨',
        toastCsvShared: 'Tabla CSV lista para compartir ✨',
        toastCsvDownloaded: 'Tabla CSV descargada ✨',
        toastCsvSaved: 'CSV guardado en Documentos ✨',
        toastError: 'No se pudo compartir. Prueba Copiar texto.',
        reportTitle: (d) => `RESUMEN DE SUEÑO (últimos ${d} días)`,
        reportChildLabel: 'Bebé',
        reportAgeLabel: 'Edad',
        reportPeriodLabel: 'Periodo',
        reportTargetLabel: 'Meta recomendada 24h',
        reportAveragesHeading: 'Promedios',
        reportNapsPerDay: (c) => `${c} siestas/día`,
        reportQualityHeading: 'Calidad del sueño',
        qualityPeaceful: 'Tranquilo',
        qualityNormal: 'Normal',
        qualityRestless: 'Inquieto',
        reportDailyLogHeading: 'Detalle por día',
        dayTypeShort: 'Día',
        nightTypeShort: 'Noche',
        csvHeaders: ['Fecha', 'Inicio', 'Fin', 'Duración (min)', 'Duración', 'Tipo', 'Calidad', 'Nota'],
        dayNapCsv: 'Siesta diurna',
        nightSleepCsv: 'Sueño nocturno',
      };
    case 'ro':
      return {
        sectionTitle: 'Rezumat pentru pediatru / consultant',
        sectionSubtitle: 'Raport text ușor de citit sau tabel CSV pe ultimele 7 sau 14 zile',
        period7d: '7 zile',
        period14d: '14 zile',
        avg24hLabel: 'Medie / 24h',
        avgDayLabel: 'Somn de zi',
        avgNightLabel: 'Somn de noapte',
        bedtimeLabel: 'Culcare',
        wakeupLabel: 'Trezire',
        daysRecordedMeta: (l, t, s) => `${l} din ${t} zile · ${s} sesiuni`,
        noDataInPeriod: (d) => `Nu există încă somnuri înregistrate în ultimele ${d} zile.`,
        previewToggleShow: 'Previzualizare text',
        previewToggleHide: 'Ascunde previzualizarea',
        shareTextBtn: 'Distribuie rezumat',
        copyTextBtn: 'Copiază text',
        exportCsvBtn: 'Tabel CSV',
        toastShared: 'Rezumat gata de trimis ✨',
        toastCopied: 'Rezumat copiat în clipboard ✨',
        toastCsvShared: 'Tabel CSV gata de distribuit ✨',
        toastCsvDownloaded: 'Tabelul CSV a fost descărcat ✨',
        toastCsvSaved: 'CSV salvat în Documente ✨',
        toastError: 'Nu s-a putut distribui. Încearcă Copiază text.',
        reportTitle: (d) => `REZUMAT SOMN (ultimele ${d} zile)`,
        reportChildLabel: 'Copil',
        reportAgeLabel: 'Vârstă',
        reportPeriodLabel: 'Perioadă',
        reportTargetLabel: 'Țintă recomandată 24h',
        reportAveragesHeading: 'Medii',
        reportNapsPerDay: (c) => `${c} somnuri/zi`,
        reportQualityHeading: 'Calitatea somnului',
        qualityPeaceful: 'Liniștit',
        qualityNormal: 'Normal',
        qualityRestless: 'Agitat',
        reportDailyLogHeading: 'Rezumat pe zile',
        dayTypeShort: 'Zi',
        nightTypeShort: 'Noapte',
        csvHeaders: ['Dată', 'Început', 'Sfârșit', 'Durată (min)', 'Durată', 'Tip', 'Calitate', 'Notă'],
        dayNapCsv: 'Somn de zi',
        nightSleepCsv: 'Somn de noapte',
      };
    case 'ar':
      return {
        sectionTitle: 'ملخص لطبيب الأطفال / المستشارة',
        sectionSubtitle: 'تقرير نصي واضح أو جدول CSV لآخر 7 أو 14 يوماً',
        period7d: '7 أيام',
        period14d: '14 يوماً',
        avg24hLabel: 'المتوسط / 24س',
        avgDayLabel: 'قيلولات النهار',
        avgNightLabel: 'نوم الليل',
        bedtimeLabel: 'وقت النوم',
        wakeupLabel: 'الاستيقاظ',
        daysRecordedMeta: (l, t, s) => `${l} من ${t} أيام · ${s} سجل`,
        noDataInPeriod: (d) => `لا توجد جلسات نوم مسجلة خلال آخر ${d} أيام بعد.`,
        previewToggleShow: 'معاينة النص الكامل',
        previewToggleHide: 'إخفاء المعاينة',
        shareTextBtn: 'مشاركة الملخص',
        copyTextBtn: 'نسخ النص',
        exportCsvBtn: 'جدول CSV',
        toastShared: 'الملخص جاهز للإرسال ✨',
        toastCopied: 'تم نسخ الملخص إلى الحافظة ✨',
        toastCsvShared: 'ملف CSV جاهز للمشاركة ✨',
        toastCsvDownloaded: 'تم تنزيل جدول CSV ✨',
        toastCsvSaved: 'تم حفظ CSV في المستندات ✨',
        toastError: 'تعذرت المشاركة. جرّب نسخ النص.',
        reportTitle: (d) => `ملخص النوم (آخر ${d} أيام)`,
        reportChildLabel: 'الطفل',
        reportAgeLabel: 'العمر',
        reportPeriodLabel: 'الفترة',
        reportTargetLabel: 'الهدف الموصى به 24س',
        reportAveragesHeading: 'المتوسطات',
        reportNapsPerDay: (c) => `${c} قيلولة/يوم`,
        reportQualityHeading: 'جودة النوم',
        qualityPeaceful: 'هادئ',
        qualityNormal: 'عادي',
        qualityRestless: 'مضطرب',
        reportDailyLogHeading: 'التفاصيل اليومية',
        dayTypeShort: 'نهار',
        nightTypeShort: 'ليل',
        csvHeaders: ['التاريخ', 'البداية', 'النهاية', 'المدة (دقيقة)', 'المدة', 'النوع', 'الجودة', 'ملاحظة'],
        dayNapCsv: 'قيلولة نهارية',
        nightSleepCsv: 'نوم ليلي',
      };
  }
}

export interface WeeklyTrendCopy {
  title: string;
  avgPerDayShort: (dur: string) => string;
  noDataShort: string;
  emptyHint: string;
  viewDayNight: string;
  legendNight: string;
  legendDay: string;
  legendTotal: string;
  legendTarget: (range: string) => string;
  avgDailyLabel: string;
  avgDayLabel: string;
  avgNightLabel: string;
  todayShort: string;
  targetStatusIn: string;
  targetStatusLow: string;
  targetStatusHigh: string;
}

export function getWeeklyTrendCopy(language: Language): WeeklyTrendCopy {
  switch (language) {
    case 'sk':
      return {
        title: '7-dňový trend spánku',
        avgPerDayShort: (d) => `Ø ${d}/deň`,
        noDataShort: 'Bez záznamov',
        emptyHint: 'Zaznamenajte prvý spánok a zobrazí sa 7-dňový trend denného a nočného spánku.',
        viewDayNight: 'Deň a noc',
        legendNight: 'Nočný',
        legendDay: 'Denný',
        legendTotal: 'Spolu',
        legendTarget: (r) => `Cieľ: ${r}`,
        avgDailyLabel: 'Priemer / deň',
        avgDayLabel: 'Denný Ø',
        avgNightLabel: 'Nočný Ø',
        todayShort: 'Dnes',
        targetStatusIn: 'V odporúčanom rozmedzí',
        targetStatusLow: 'Pod odporúčaným cieľom',
        targetStatusHigh: 'Nad odporúčaným cieľom',
      };
    case 'cs':
      return {
        title: '7denní trend spánku',
        avgPerDayShort: (d) => `Ø ${d}/den`,
        noDataShort: 'Bez záznamů',
        emptyHint: 'Zaznamenejte první spánek a zobrazí se 7denní trend denního a nočního spánku.',
        viewDayNight: 'Den a noc',
        legendNight: 'Noční',
        legendDay: 'Denní',
        legendTotal: 'Celkem',
        legendTarget: (r) => `Cíl: ${r}`,
        avgDailyLabel: 'Průměr / den',
        avgDayLabel: 'Denní Ø',
        avgNightLabel: 'Noční Ø',
        todayShort: 'Dnes',
        targetStatusIn: 'V doporučeném rozmezí',
        targetStatusLow: 'Pod doporučeným cílem',
        targetStatusHigh: 'Nad doporučeným cílem',
      };
    case 'en':
      return {
        title: '7-Day Sleep Trend',
        avgPerDayShort: (d) => `Avg ${d}/day`,
        noDataShort: 'No data',
        emptyHint: 'Log your first sleep session to view the 7-day daytime vs. nighttime trend.',
        viewDayNight: 'Day & Night',
        legendNight: 'Night',
        legendDay: 'Day',
        legendTotal: 'Total',
        legendTarget: (r) => `Goal: ${r}`,
        avgDailyLabel: 'Daily avg',
        avgDayLabel: 'Day avg',
        avgNightLabel: 'Night avg',
        todayShort: 'Today',
        targetStatusIn: 'Within age guideline',
        targetStatusLow: 'Below age guideline',
        targetStatusHigh: 'Above age guideline',
      };
    case 'pl':
      return {
        title: '7-dniowy trend snu',
        avgPerDayShort: (d) => `Śr. ${d}/dz.`,
        noDataShort: 'Brak danych',
        emptyHint: 'Zapisz pierwszy sen, aby zobaczyć 7-dniowy wykres snu dziennego i nocnego.',
        viewDayNight: 'Dzień i noc',
        legendNight: 'Nocny',
        legendDay: 'Dzienny',
        legendTotal: 'Łącznie',
        legendTarget: (r) => `Cel: ${r}`,
        avgDailyLabel: 'Śr. / dzień',
        avgDayLabel: 'Dzienny śr.',
        avgNightLabel: 'Nocny śr.',
        todayShort: 'Dziś',
        targetStatusIn: 'W zalecanym zakresie',
        targetStatusLow: 'Poniżej zalecenia',
        targetStatusHigh: 'Powyżej zalecenia',
      };
    case 'hu':
      return {
        title: '7 napos alvási trend',
        avgPerDayShort: (d) => `Átl. ${d}/nap`,
        noDataShort: 'Nincs adat',
        emptyHint: 'Rögzíts egy alvást a 7 napos nappali és éjszakai trend megtekintéséhez.',
        viewDayNight: 'Nappal és éjjel',
        legendNight: 'Éjszakai',
        legendDay: 'Nappali',
        legendTotal: 'Összesen',
        legendTarget: (r) => `Cél: ${r}`,
        avgDailyLabel: 'Napi átlag',
        avgDayLabel: 'Nappali átl.',
        avgNightLabel: 'Éjszakai átl.',
        todayShort: 'Ma',
        targetStatusIn: 'Ajánlott tartományban',
        targetStatusLow: 'Ajánlott cél alatt',
        targetStatusHigh: 'Ajánlott cél felett',
      };
    case 'uk':
      return {
        title: '7-денний тренд сну',
        avgPerDayShort: (d) => `Сер. ${d}/д`,
        noDataShort: 'Немає даних',
        emptyHint: 'Додайте перший сон, щоб побачити 7-денний графік денного та нічного сну.',
        viewDayNight: 'День і ніч',
        legendNight: 'Нічний',
        legendDay: 'Денний',
        legendTotal: 'Разом',
        legendTarget: (r) => `Норма: ${r}`,
        avgDailyLabel: 'Середнє / д',
        avgDayLabel: 'Денний сер.',
        avgNightLabel: 'Нічний сер.',
        todayShort: 'Сьогодні',
        targetStatusIn: 'У межах норми',
        targetStatusLow: 'Нижче норми',
        targetStatusHigh: 'Вище норми',
      };
    case 'it':
      return {
        title: 'Andamento sonno 7 giorni',
        avgPerDayShort: (d) => `Media ${d}/g`,
        noDataShort: 'Nessun dato',
        emptyHint: 'Registra il primo sonno per vedere il grafico settimanale diurno e notturno.',
        viewDayNight: 'Giorno e notte',
        legendNight: 'Notte',
        legendDay: 'Giorno',
        legendTotal: 'Totale',
        legendTarget: (r) => `Obiettivo: ${r}`,
        avgDailyLabel: 'Media / g',
        avgDayLabel: 'Giorno media',
        avgNightLabel: 'Notte media',
        todayShort: 'Oggi',
        targetStatusIn: 'Nella fascia consigliata',
        targetStatusLow: 'Sotto la fascia',
        targetStatusHigh: 'Sopra la fascia',
      };
    case 'es':
      return {
        title: 'Tendencia de sueño (7 días)',
        avgPerDayShort: (d) => `Media ${d}/d`,
        noDataShort: 'Sin datos',
        emptyHint: 'Registra tu primer sueño para ver la gráfica semanal de sueño diurno y nocturno.',
        viewDayNight: 'Día y noche',
        legendNight: 'Noche',
        legendDay: 'Día',
        legendTotal: 'Total',
        legendTarget: (r) => `Meta: ${r}`,
        avgDailyLabel: 'Media / día',
        avgDayLabel: 'Día media',
        avgNightLabel: 'Noche media',
        todayShort: 'Hoy',
        targetStatusIn: 'Dentro del objetivo',
        targetStatusLow: 'Por debajo del objetivo',
        targetStatusHigh: 'Por encima del objetivo',
      };
    case 'ro':
      return {
        title: 'Evoluția somnului (7 zile)',
        avgPerDayShort: (d) => `Med. ${d}/zi`,
        noDataShort: 'Fără date',
        emptyHint: 'Înregistrează primul somn pentru a vedea graficul pe 7 zile (zi vs. noapte).',
        viewDayNight: 'Zi și noapte',
        legendNight: 'Noapte',
        legendDay: 'Zi',
        legendTotal: 'Total',
        legendTarget: (r) => `Țintă: ${r}`,
        avgDailyLabel: 'Medie / zi',
        avgDayLabel: 'Zi med.',
        avgNightLabel: 'Noapte med.',
        todayShort: 'Azi',
        targetStatusIn: 'În intervalul recomandat',
        targetStatusLow: 'Sub ținta recomandată',
        targetStatusHigh: 'Peste ținta recomandată',
      };
    case 'ar':
      return {
        title: 'اتجاه النوم خلال 7 أيام',
        avgPerDayShort: (d) => `متوسط ${d}/ي`,
        noDataShort: 'لا بيانات',
        emptyHint: 'سجّل أول جلسة نوم لعرض الرسم البياني الأسبوعي للنوم النهاري والليلي.',
        viewDayNight: 'نهار وليل',
        legendNight: 'ليلي',
        legendDay: 'نهاري',
        legendTotal: 'الإجمالي',
        legendTarget: (r) => `الهدف: ${r}`,
        avgDailyLabel: 'المتوسط/يوم',
        avgDayLabel: 'متوسط النهار',
        avgNightLabel: 'متوسط الليل',
        todayShort: 'اليوم',
        targetStatusIn: 'ضمن المعدل الموصى به',
        targetStatusLow: 'أقل من المعدل',
        targetStatusHigh: 'أعلى من المعدل',
      };
  }
}

function formatShortDateLocalized(dateStr: string, language: Language): string {
  const locale = LOCALE_MAP[language] || 'en-US';
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

function formatTimeLocalized(iso: string, language: Language): string {
  const locale = LOCALE_MAP[language] || 'en-US';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

export function formatPediatricPlainTextReport(
  report: PediatricSleepReport,
  language: Language
): string {
  const copy = getPediatricSummaryCopy(language);
  const lines: string[] = [];

  lines.push(copy.reportTitle(report.periodDays));
  lines.push('──────────────────────────');

  if (report.babyName) {
    lines.push(`${copy.reportChildLabel}: ${report.babyName}`);
  }
  if (report.ageSummary) {
    lines.push(`${copy.reportAgeLabel}: ${formatShortAge(report.ageSummary, language)}`);
    lines.push(
      `${copy.reportTargetLabel}: ${report.ageSummary.dailySleepRangeHours} (${report.ageSummary.guidelineSource})`
    );
  }
  lines.push(
    `${copy.reportPeriodLabel}: ${formatShortDateLocalized(report.fromDateStr, language)} – ${formatShortDateLocalized(report.toDateStr, language)} (${copy.daysRecordedMeta(report.loggedDaysCount, report.periodDays, report.totalSessionsCount)})`
  );

  lines.push('');
  lines.push(`${copy.reportAveragesHeading}:`);
  lines.push(`• ${copy.avg24hLabel}: ${formatMinutesCompact(report.avgDailyTotalMinutes)}`);
  lines.push(
    `• ${copy.avgDayLabel}: ${formatMinutesCompact(report.avgDayNapMinutes)} (${copy.reportNapsPerDay(report.avgNapsPerLoggedDay)})`
  );
  lines.push(`• ${copy.avgNightLabel}: ${formatMinutesCompact(report.avgNightSleepMinutes)}`);
  if (report.typicalBedtime) {
    lines.push(`• ${copy.bedtimeLabel}: ~${report.typicalBedtime}`);
  }
  if (report.typicalWakeTime) {
    lines.push(`• ${copy.wakeupLabel}: ~${report.typicalWakeTime}`);
  }

  if (report.totalSessionsCount > 0) {
    lines.push('');
    lines.push(
      `${copy.reportQualityHeading}: ${copy.qualityPeaceful} ${report.qualityPercents.peaceful}% | ${copy.qualityNormal} ${report.qualityPercents.normal}% | ${copy.qualityRestless} ${report.qualityPercents.restless}%`
    );

    lines.push('');
    lines.push(`${copy.reportDailyLogHeading}:`);
    const daysNewestFirst = [...report.days].reverse().filter((d) => d.totalMinutes > 0);
    for (const day of daysNewestFirst) {
      const dateLbl = formatShortDateLocalized(day.dateStr, language);
      const notes = day.sessions
        .map((s) => s.notes?.trim())
        .filter((n): n is string => Boolean(n));
      const noteSuffix = notes.length > 0 ? ` [${notes.join('; ')}]` : '';
      lines.push(
        `- ${dateLbl}: ${formatMinutesCompact(day.totalMinutes)} (${copy.dayTypeShort} ${formatMinutesCompact(day.dayNapMinutes)}, ${copy.nightTypeShort} ${formatMinutesCompact(day.nightSleepMinutes)})${noteSuffix}`
      );
    }
  }

  return lines.join('\n');
}

function escapeCsvCell(value: string | number): string {
  const str = String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

export function formatPediatricCsvReport(
  report: PediatricSleepReport,
  language: Language
): string {
  const copy = getPediatricSummaryCopy(language);
  const qualityMap: Record<SleepQuality, string> = {
    peaceful: copy.qualityPeaceful,
    normal: copy.qualityNormal,
    restless: copy.qualityRestless,
  };

  const headerLine = copy.csvHeaders.map((h) => escapeCsvCell(h)).join(',');
  const rows = report.sessionsInPeriod.map((s) => {
    const mins = getSessionDurationMinutesSafe(s);
    const calDate = getSessionLocalCalendarDate(s);
    const startStr = formatTimeLocalized(s.startTime, language);
    const endStr = formatTimeLocalized(s.endTime, language);
    const typeLabel = s.type === 'night-sleep' ? copy.nightSleepCsv : copy.dayNapCsv;
    const qualityLabel = qualityMap[s.quality] ?? copy.qualityNormal;
    const noteClean = (s.notes || '').trim();

    return [
      escapeCsvCell(calDate),
      escapeCsvCell(startStr),
      escapeCsvCell(endStr),
      String(mins),
      escapeCsvCell(formatMinutesCompact(mins)),
      escapeCsvCell(typeLabel),
      escapeCsvCell(qualityLabel),
      escapeCsvCell(noteClean),
    ].join(',');
  });

  // UTF-8 BOM ensures Slovak/Czech/Polish/Arabic/Ukrainian diacritics open cleanly in Excel & Google Sheets
  return '\uFEFF' + [headerLine, ...rows].join('\r\n');
}

export async function copyTextWithFallback(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback for iframe / restricted clipboard contexts
    }
  }

  if (typeof document === 'undefined') return false;
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export async function sharePediatricTextReport(
  report: PediatricSleepReport,
  language: Language
): Promise<'shared' | 'copied' | 'cancelled'> {
  const copy = getPediatricSummaryCopy(language);
  const text = formatPediatricPlainTextReport(report, language);
  const title = copy.reportTitle(report.periodDays);

  if (Capacitor.isNativePlatform()) {
    try {
      await Share.share({
        title,
        text,
        dialogTitle: copy.shareTextBtn,
      });
      return 'shared';
    } catch (err) {
      const msg = String(err ?? '').toLowerCase();
      if (msg.includes('cancel') || msg.includes('dismiss')) {
        return 'cancelled';
      }
    }
  }

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text });
      return 'shared';
    } catch (err) {
      const name = err instanceof Error ? err.name : '';
      if (name === 'AbortError') return 'cancelled';
    }
  }

  const copied = await copyTextWithFallback(text);
  if (copied) return 'copied';
  throw new Error('Share and clipboard unavailable');
}

export async function exportPediatricCsvReport(
  report: PediatricSleepReport,
  language: Language
): Promise<'shared' | 'downloaded' | 'saved_documents' | 'cancelled'> {
  const copy = getPediatricSummaryCopy(language);
  const csvContent = formatPediatricCsvReport(report, language);
  const filename = `toddler-sleep-report-${report.periodDays}d-${report.toDateStr}.csv`;

  if (Capacitor.isNativePlatform()) {
    try {
      const writtenFile = await Filesystem.writeFile({
        path: filename,
        data: csvContent,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });

      try {
        await Share.share({
          title: copy.reportTitle(report.periodDays),
          text: copy.sectionSubtitle,
          url: writtenFile.uri,
          dialogTitle: copy.exportCsvBtn,
        });
        return 'shared';
      } catch (shareErr) {
        const msg = String(shareErr ?? '').toLowerCase();
        if (msg.includes('cancel') || msg.includes('dismiss')) {
          return 'cancelled';
        }
        await Filesystem.writeFile({
          path: filename,
          data: csvContent,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });
        return 'saved_documents';
      }
    } catch {
      // Fall through to web download fallback
    }
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'downloaded';
}
