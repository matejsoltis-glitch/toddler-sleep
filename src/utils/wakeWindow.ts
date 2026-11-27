import { Language } from '../types';
import { normalizeBabyName } from './babyName';

export const BABY_BIRTH_DATE_STORAGE_KEY = 'toddler_baby_birth_date';

export type WakeWindowStatus = 'fresh' | 'approaching' | 'sweet-spot' | 'overtired';

export interface AgeSummary {
  totalDays: number;
  totalMonths: number;
  years: number;
  remainingMonths: number;
  weeks: number;
  minWakeMins: number;
  maxWakeMins: number;
  /** Official 24-hour total sleep guideline (WHO/NSF for 0-3m; AASM/AAP for 4m+) */
  dailySleepRangeHours: string;
  dailySleepMinHours: number;
  dailySleepMaxHours: number;
  guidelineSource: 'WHO/NSF' | 'AASM/AAP';
  /** True for preschoolers (36m+) who may be transitioning out of or no longer taking daytime naps */
  isPreschoolNoNapPossible: boolean;
}

export interface WakeWindowEvaluation {
  age: AgeSummary;
  status: WakeWindowStatus;
  wakeMinutes: number;
  minWakeMins: number;
  maxWakeMins: number;
  sweetSpotStartTime: string; // HH:mm
  sweetSpotEndTime: string; // HH:mm
  minutesUntilSweetSpot: number;
  minutesOverdue: number;
  /** 0..100 visual progress where maxWakeMins sits at 85% and overtired fills 85..100% */
  progressPercent: number;
  sweetSpotStartPercent: number;
  sweetSpotEndPercent: number;
}

/**
 * Pediatric clinical consensus wake window ranges aligned with Borbély's two-process sleep
 * regulation model (homeostatic sleep pressure + circadian maturation) and official 24-hour
 * total sleep targets (WHO / NSF for 0-3 months; AASM / AAP consensus for 4 months – 5 years).
 * Note: Individual variation is normal; morning wake windows tend toward the lower bound and
 * pre-bedtime windows toward the upper bound.
 */
function getRecommendedWakeGuidance(ageMonths: number): {
  min: number;
  max: number;
  dailySleepRangeHours: string;
  dailySleepMinHours: number;
  dailySleepMaxHours: number;
  guidelineSource: 'WHO/NSF' | 'AASM/AAP';
  isPreschoolNoNapPossible: boolean;
} {
  if (ageMonths < 1) {
    return { min: 35, max: 60, dailySleepRangeHours: '14–17 h', dailySleepMinHours: 14, dailySleepMaxHours: 17, guidelineSource: 'WHO/NSF', isPreschoolNoNapPossible: false };
  }
  if (ageMonths < 2) {
    return { min: 45, max: 75, dailySleepRangeHours: '14–17 h', dailySleepMinHours: 14, dailySleepMaxHours: 17, guidelineSource: 'WHO/NSF', isPreschoolNoNapPossible: false };
  }
  if (ageMonths < 3) {
    return { min: 60, max: 90, dailySleepRangeHours: '14–17 h', dailySleepMinHours: 14, dailySleepMaxHours: 17, guidelineSource: 'WHO/NSF', isPreschoolNoNapPossible: false };
  }
  if (ageMonths < 4) {
    return { min: 75, max: 120, dailySleepRangeHours: '14–17 h', dailySleepMinHours: 14, dailySleepMaxHours: 17, guidelineSource: 'WHO/NSF', isPreschoolNoNapPossible: false };
  }
  if (ageMonths < 5) {
    return { min: 90, max: 135, dailySleepRangeHours: '12–16 h', dailySleepMinHours: 12, dailySleepMaxHours: 16, guidelineSource: 'AASM/AAP', isPreschoolNoNapPossible: false };
  }
  if (ageMonths < 6) {
    return { min: 120, max: 150, dailySleepRangeHours: '12–16 h', dailySleepMinHours: 12, dailySleepMaxHours: 16, guidelineSource: 'AASM/AAP', isPreschoolNoNapPossible: false };
  }
  if (ageMonths < 8) {
    return { min: 135, max: 180, dailySleepRangeHours: '12–16 h', dailySleepMinHours: 12, dailySleepMaxHours: 16, guidelineSource: 'AASM/AAP', isPreschoolNoNapPossible: false };
  }
  if (ageMonths < 10) {
    return { min: 165, max: 210, dailySleepRangeHours: '12–16 h', dailySleepMinHours: 12, dailySleepMaxHours: 16, guidelineSource: 'AASM/AAP', isPreschoolNoNapPossible: false };
  }
  if (ageMonths < 12) {
    return { min: 180, max: 240, dailySleepRangeHours: '12–16 h', dailySleepMinHours: 12, dailySleepMaxHours: 16, guidelineSource: 'AASM/AAP', isPreschoolNoNapPossible: false };
  }
  if (ageMonths < 15) {
    return { min: 210, max: 270, dailySleepRangeHours: '11–14 h', dailySleepMinHours: 11, dailySleepMaxHours: 14, guidelineSource: 'AASM/AAP', isPreschoolNoNapPossible: false };
  }
  if (ageMonths < 18) {
    return { min: 270, max: 330, dailySleepRangeHours: '11–14 h', dailySleepMinHours: 11, dailySleepMaxHours: 14, guidelineSource: 'AASM/AAP', isPreschoolNoNapPossible: false };
  }
  if (ageMonths < 24) {
    return { min: 300, max: 360, dailySleepRangeHours: '11–14 h', dailySleepMinHours: 11, dailySleepMaxHours: 14, guidelineSource: 'AASM/AAP', isPreschoolNoNapPossible: false };
  }
  if (ageMonths < 36) {
    return { min: 330, max: 420, dailySleepRangeHours: '11–14 h', dailySleepMinHours: 11, dailySleepMaxHours: 14, guidelineSource: 'AASM/AAP', isPreschoolNoNapPossible: false };
  }
  if (ageMonths < 48) {
    return { min: 360, max: 480, dailySleepRangeHours: '10–13 h', dailySleepMinHours: 10, dailySleepMaxHours: 13, guidelineSource: 'AASM/AAP', isPreschoolNoNapPossible: true };
  }
  // 4+ years: most children no longer nap during the day (typical daytime wake span 11–13 h)
  return { min: 660, max: 780, dailySleepRangeHours: '10–13 h', dailySleepMinHours: 10, dailySleepMaxHours: 13, guidelineSource: 'AASM/AAP', isPreschoolNoNapPossible: true };
}

export function getChildAgeSummary(birthDateStr?: string | null): AgeSummary | null {
  if (!birthDateStr || !/^\d{4}-\d{2}-\d{2}$/.test(birthDateStr)) return null;
  const [y, m, d] = birthDateStr.split('-').map(Number);
  const birth = new Date(y, m - 1, d, 0, 0, 0, 0);
  if (Number.isNaN(birth.getTime())) return null;

  const now = new Date();
  const diffMs = now.getTime() - birth.getTime();
  if (diffMs < 0) return null;

  const totalDays = Math.floor(diffMs / (24 * 3600 * 1000));
  const weeks = Math.floor(totalDays / 7);

  let totalMonths =
    (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) {
    totalMonths = Math.max(0, totalMonths - 1);
  }
  const exactMonths = totalDays / 30.4375;
  const years = Math.floor(totalMonths / 12);
  const remainingMonths = totalMonths % 12;

  const guidance = getRecommendedWakeGuidance(exactMonths);

  return {
    totalDays,
    totalMonths,
    years,
    remainingMonths,
    weeks,
    minWakeMins: guidance.min,
    maxWakeMins: guidance.max,
    dailySleepRangeHours: guidance.dailySleepRangeHours,
    dailySleepMinHours: guidance.dailySleepMinHours,
    dailySleepMaxHours: guidance.dailySleepMaxHours,
    guidelineSource: guidance.guidelineSource,
    isPreschoolNoNapPossible: guidance.isPreschoolNoNapPossible,
  };
}

const formatClockHHMM = (ms: number): string => {
  const d = new Date(ms);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
};

export function evaluateWakeWindow(
  wakeMinutes: number,
  lastEndIso: string,
  birthDateStr?: string | null
): WakeWindowEvaluation | null {
  const age = getChildAgeSummary(birthDateStr);
  if (!age) return null;

  const lastEndMs = new Date(lastEndIso).getTime();
  if (Number.isNaN(lastEndMs)) return null;

  const { minWakeMins, maxWakeMins } = age;
  // Proportional gentle wind-down buffer: ~10 min for newborns, 15–20 min for infants, up to 30 min for toddlers
  const approachingBuffer = Math.min(30, Math.max(10, Math.round(minWakeMins * 0.12)));

  let status: WakeWindowStatus = 'fresh';
  if (wakeMinutes > maxWakeMins) {
    status = 'overtired';
  } else if (wakeMinutes >= minWakeMins) {
    status = 'sweet-spot';
  } else if (wakeMinutes >= minWakeMins - approachingBuffer) {
    status = 'approaching';
  }

  const sweetSpotStartTime = formatClockHHMM(lastEndMs + minWakeMins * 60000);
  const sweetSpotEndTime = formatClockHHMM(lastEndMs + maxWakeMins * 60000);
  const minutesUntilSweetSpot = Math.max(0, minWakeMins - wakeMinutes);
  const minutesOverdue = Math.max(0, wakeMinutes - maxWakeMins);

  // Scale progress bar so maxWakeMins sits at 85% and overtired stretches to 100%
  const scaleMax = maxWakeMins / 0.85;
  const progressPercent = Math.max(2, Math.min(100, (wakeMinutes / scaleMax) * 100));
  const sweetSpotStartPercent = Math.min(82, (minWakeMins / scaleMax) * 100);
  const sweetSpotEndPercent = 85;

  return {
    age,
    status,
    wakeMinutes,
    minWakeMins,
    maxWakeMins,
    sweetSpotStartTime,
    sweetSpotEndTime,
    minutesUntilSweetSpot,
    minutesOverdue,
    progressPercent,
    sweetSpotStartPercent,
    sweetSpotEndPercent,
  };
}

export function formatShortAge(age: AgeSummary, language: Language): string {
  const units: Record<Language, { y: string; m: string; w: string; d: string }> = {
    sk: { y: 'r.', m: 'mes.', w: 'týž.', d: 'd.' },
    cs: { y: 'r.', m: 'měs.', w: 'týd.', d: 'd.' },
    en: { y: 'y', m: 'mo', w: 'wk', d: 'd' },
    pl: { y: 'l.', m: 'mies.', w: 'tyg.', d: 'd.' },
    hu: { y: 'év', m: 'hó', w: 'hét', d: 'nap' },
    uk: { y: 'р.', m: 'міс.', w: 'тиж.', d: 'д.' },
    it: { y: 'a', m: 'm', w: 'sett.', d: 'g' },
    es: { y: 'a', m: 'm', w: 'sem.', d: 'd' },
    ro: { y: 'ani', m: 'luni', w: 'săpt.', d: 'zile' },
    ar: { y: 'سنة', m: 'شهر', w: 'أسبوع', d: 'يوم' },
  };
  const u = units[language] || units.en;

  if (age.totalMonths >= 12) {
    if (age.remainingMonths === 0) return `${age.years} ${u.y}`;
    return `${age.years} ${u.y} ${age.remainingMonths} ${u.m}`;
  }
  if (age.totalMonths >= 1) {
    return `${age.totalMonths} ${u.m}`;
  }
  if (age.weeks >= 1) {
    return `${age.weeks} ${u.w}`;
  }
  return `${Math.max(1, age.totalDays)} ${u.d}`;
}

export function formatWakeDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export interface WakeWindowCopy {
  birthDateLabel: string;
  birthDateHint: string;
  birthDateClear: string;
  setupPromptBtn: string;
  modalTitle: string;
  modalDesc: string;
  saveBtn: string;
  cancelBtn: string;
  optimalRangeLabel: string;
  nextSleepAround: (start: string, end: string) => string;
  badgeFresh: string;
  badgeApproaching: string;
  badgeSweetSpot: string;
  badgeOvertired: string;
  msgFresh: (inDur: string, start: string, end: string) => string;
  msgApproaching: (inDur: string, start: string) => string;
  msgSweetSpot: (start: string, end: string) => string;
  msgOvertired: (overDur: string) => string;
  editAgeTitle: string;
  dailyTargetLabel: (range: string, source: string) => string;
  sleepCuesHint: string;
}

export function getWakeWindowCopy(language: Language, babyName?: string | null): WakeWindowCopy {
  const name = normalizeBabyName(babyName);

  switch (language) {
    case 'sk':
      return {
        birthDateLabel: 'Dátum narodenia (pre bdelé okno)',
        birthDateHint: 'Na základe veku aplikácia vypočíta optimálne bdelé okno a upozorní pred preúnavou.',
        birthDateClear: 'Vymazať',
        setupPromptBtn: 'Nastaviť dátum narodenia pre upozornenie na ideálne bdelé okno',
        modalTitle: 'Optimálne bdelé okno podľa veku',
        modalDesc: name
          ? `Zadajte dátum narodenia (${name}). Aplikácia automaticky zobrazí odporúčanú dĺžku bdenia a jemne upozorní, keď sa priblíži ideálny čas na ďalší spánok.`
          : 'Zadajte dátum narodenia dieťatka. Aplikácia automaticky zobrazí odporúčanú dĺžku bdenia a jemne upozorní, keď sa priblíži ideálny čas na ďalší spánok.',
        saveBtn: 'Uložiť vek',
        cancelBtn: 'Zrušiť',
        optimalRangeLabel: 'Odporúčané bdelé okno:',
        nextSleepAround: (s, e) => `Ideálny spánok: ${s} – ${e}`,
        badgeFresh: 'Pokojné bdenie',
        badgeApproaching: 'Okno sa blíži',
        badgeSweetSpot: 'Ideálny čas na spánok',
        badgeOvertired: 'Pozor na preúnavu',
        msgFresh: (inDur, s, e) => `Ďalší spánok odporúčame o ${inDur} (okolo ${s} – ${e}).`,
        msgApproaching: (inDur, s) =>
          name
            ? `${name}: optimálne bdelé okno sa blíži (o ${inDur}, okolo ${s}) – postupne sa pripravte na spánok.`
            : `Optimálne bdelé okno sa blíži (o ${inDur}, okolo ${s}) – postupne sa pripravte na spánok.`,
        msgSweetSpot: (s, e) =>
          name
            ? `${name}: práve teraz je ideálne okno na zaspatie (${s} – ${e}), skôr než príde preúnava.`
            : `Práve teraz je ideálne okno na zaspatie (${s} – ${e}), aby nevznikla preúnava.`,
        msgOvertired: (over) =>
          `Odporúčané bdelé okno je prekročené o ${over} – odporúčame uložiť na spánok čo najskôr.`,
        editAgeTitle: 'Upraviť dátum narodenia',
        dailyTargetLabel: (range, source) => `24h cieľ (${source}): ${range}`,
        sleepCuesHint: 'Orientačne – sledujte aj signály únavy.',
      };
    case 'cs':
      return {
        birthDateLabel: 'Datum narození (pro bdělé okno)',
        birthDateHint: 'Podle věku aplikace vypočítá optimální bdělé okno a upozorní před přetažením.',
        birthDateClear: 'Vymazat',
        setupPromptBtn: 'Nastavit datum narození pro upozornění na ideální bdělé okno',
        modalTitle: 'Optimální bdělé okno podle věku',
        modalDesc: name
          ? `Zadejte datum narození (${name}). Aplikace automaticky zobrazí doporučenou délku bdění a upozorní, jakmile se přiblíží ideální čas na další spánek.`
          : 'Zadejte datum narození děťátka. Aplikace automaticky zobrazí doporučenou délku bdění a upozorní, jakmile se přiblíží ideální čas na další spánek.',
        saveBtn: 'Uložit věk',
        cancelBtn: 'Zrušit',
        optimalRangeLabel: 'Doporučené bdělé okno:',
        nextSleepAround: (s, e) => `Ideální spánek: ${s} – ${e}`,
        badgeFresh: 'Klidné bdění',
        badgeApproaching: 'Okno se blíží',
        badgeSweetSpot: 'Ideální čas na spánek',
        badgeOvertired: 'Pozor na přetažení',
        msgFresh: (inDur, s, e) => `Další spánek doporučujeme za ${inDur} (kolem ${s} – ${e}).`,
        msgApproaching: (inDur, s) =>
          `Optimální bdělé okno se blíží (za ${inDur}, kolem ${s}) – pomalu se připravte na spánek.`,
        msgSweetSpot: (s, e) =>
          `Právě teď je ideální okno pro usnutí (${s} – ${e}), bez rizika přetažení.`,
        msgOvertired: (over) =>
          `Doporučené bdělé okno je překročeno o ${over} – doporučujeme uložit ke spánku co nejdříve.`,
        editAgeTitle: 'Upravit datum narození',
        dailyTargetLabel: (range, source) => `Cíl za 24 h (${source}): ${range}`,
        sleepCuesHint: 'Orientačně – sledujte i signály únavy.',
      };
    case 'en':
      return {
        birthDateLabel: 'Date of Birth (for wake window)',
        birthDateHint: 'Used to calculate age-appropriate wake windows and alert you before overtiredness.',
        birthDateClear: 'Clear',
        setupPromptBtn: 'Set birth date for optimal wake-window alerts',
        modalTitle: 'Age-Based Optimal Wake Window',
        modalDesc: name
          ? `Enter ${name}'s birth date. The app will calculate the ideal wake window and gently alert you when the sweet spot for the next sleep approaches.`
          : "Enter your baby's birth date. The app will calculate the ideal wake window and gently alert you when the sweet spot for the next sleep approaches.",
        saveBtn: 'Save Age',
        cancelBtn: 'Cancel',
        optimalRangeLabel: 'Ideal wake window:',
        nextSleepAround: (s, e) => `Ideal sleep: ${s} – ${e}`,
        badgeFresh: 'Resting well',
        badgeApproaching: 'Sleep window soon',
        badgeSweetSpot: 'Sweet spot now',
        badgeOvertired: 'Overtired risk',
        msgFresh: (inDur, s, e) => `Next ideal sleep window in ${inDur} (around ${s} – ${e}).`,
        msgApproaching: (inDur, s) =>
          name
            ? `Sweet spot approaching in ${inDur} (around ${s}) — start winding ${name} down.`
            : `Sweet spot approaching in ${inDur} (around ${s}) — start winding down for sleep.`,
        msgSweetSpot: (s, e) =>
          name
            ? `Right in the optimal sleep window (${s} – ${e}) — great time to put ${name} down.`
            : `Right in the optimal sleep window (${s} – ${e}) — great time to put baby down.`,
        msgOvertired: (over) =>
          `Past the recommended wake window by ${over} — try settling for sleep soon to avoid overtiredness.`,
        editAgeTitle: 'Edit birth date',
        dailyTargetLabel: (range, source) => `24h goal (${source}): ${range}`,
        sleepCuesHint: 'Guide only — always watch sleepy cues.',
      };
    case 'pl':
      return {
        birthDateLabel: 'Data urodzenia (okno aktywności)',
        birthDateHint: 'Na podstawie wieku aplikacja wyliczy optymalne okno czuwania i ostrzeże przed przemęczeniem.',
        birthDateClear: 'Wyczyść',
        setupPromptBtn: 'Ustaw datę urodzenia dla alertu idealnego okna czuwania',
        modalTitle: 'Optymalne okno czuwania wg wieku',
        modalDesc: name
          ? `Podaj datę urodzenia (${name}). Aplikacja pokaże zalecany czas czuwania i delikatnie przypomni o zbliżającej się idealnej porze snu.`
          : 'Podaj datę urodzenia dziecka. Aplikacja pokaże zalecany czas czuwania i delikatnie przypomni o zbliżającej się idealnej porze snu.',
        saveBtn: 'Zapisz wiek',
        cancelBtn: 'Anuluj',
        optimalRangeLabel: 'Zalecane okno czuwania:',
        nextSleepAround: (s, e) => `Idealny sen: ${s} – ${e}`,
        badgeFresh: 'Spokojna aktywność',
        badgeApproaching: 'Zbliża się pora snu',
        badgeSweetSpot: 'Idealny czas na sen',
        badgeOvertired: 'Ryzyko przemęczenia',
        msgFresh: (inDur, s, e) => `Kolejna idealna pora snu za ${inDur} (ok. ${s} – ${e}).`,
        msgApproaching: (inDur, s) =>
          `Zbliża się optymalne okno snu (za ${inDur}, ok. ${s}) – warto powoli wyciszać atmosferę.`,
        msgSweetSpot: (s, e) =>
          `Teraz trwa idealne okno na zaśnięcie (${s} – ${e}) – najlepszy moment bez przemęczenia.`,
        msgOvertired: (over) =>
          `Przekroczono zalecane okno czuwania o ${over} – warto ułożyć do snu jak najszybciej.`,
        editAgeTitle: 'Edytuj datę urodzenia',
        dailyTargetLabel: (range, source) => `Cel 24h (${source}): ${range}`,
        sleepCuesHint: 'Orientacyjnie – obserwuj też oznaki zmęczenia.',
      };
    case 'hu':
      return {
        birthDateLabel: 'Születési dátum (ébrenléti ablakhoz)',
        birthDateHint: 'Az életkor alapján az alkalmazás kiszámítja az optimális ébrenléti ablakot a túlfáradás elkerülésére.',
        birthDateClear: 'Törlés',
        setupPromptBtn: 'Születési dátum beállítása az ideális ébrenléti ablakhoz',
        modalTitle: 'Optimális ébrenléti ablak életkor szerint',
        modalDesc: name
          ? `Add meg ${name} születési dátumát. Az alkalmazás kiszámítja az ajánlott ébrenléti időt és jelzi a következő alvás ideális idejét.`
          : 'Add meg a kisbaba születési dátumát. Az alkalmazás kiszámítja az ajánlott ébrenléti időt és jelzi a következő alvás ideális idejét.',
        saveBtn: 'Életkor mentése',
        cancelBtn: 'Mégse',
        optimalRangeLabel: 'Ajánlott ébrenléti ablak:',
        nextSleepAround: (s, e) => `Ideális alvás: ${s} – ${e}`,
        badgeFresh: 'Nyugodt ébrenlét',
        badgeApproaching: 'Közeleg az alvásidő',
        badgeSweetSpot: 'Ideális alvásablak',
        badgeOvertired: 'Túlfáradás veszélye',
        msgFresh: (inDur, s, e) => `A következő ideális alvás ${inDur} múlva (${s} – ${e} között).`,
        msgApproaching: (inDur, s) =>
          `Közeleg az optimális alvásablak (${inDur} múlva, ${s} körül) – lassan készüljetek az altatásra.`,
        msgSweetSpot: (s, e) =>
          `Most van az ideális elalvási ablak (${s} – ${e}) a nyugodt, túlfáradás nélküli pihenéshez.`,
        msgOvertired: (over) =>
          `Az ajánlott ébrenléti idő ${over}-vel túllépve – érdemes minél hamarabb altatni.`,
        editAgeTitle: 'Születési dátum szerkesztése',
        dailyTargetLabel: (range, source) => `24 órás cél (${source}): ${range}`,
        sleepCuesHint: 'Tájékoztató jellegű – figyeld az álmosság jeleit is.',
      };
    case 'uk':
      return {
        birthDateLabel: 'Дата народження (вікно неспання)',
        birthDateHint: 'За віком додаток розрахує оптимальне вікно неспання та попередить про втому.',
        birthDateClear: 'Очистити',
        setupPromptBtn: 'Вказати дату народження для підказки вікна неспання',
        modalTitle: 'Оптимальне вікно неспання за віком',
        modalDesc: name
          ? `Вкажіть дату народження (${name}). Додаток розрахує рекомендований час неспання та м’яко підкаже ідеальний момент для наступного сну.`
          : 'Вкажіть дату народження дитини. Додаток розрахує рекомендований час неспання та м’яко підкаже ідеальний момент для наступного сну.',
        saveBtn: 'Зберегти вік',
        cancelBtn: 'Скасувати',
        optimalRangeLabel: 'Рекомендоване вікно:',
        nextSleepAround: (s, e) => `Ідеальний сон: ${s} – ${e}`,
        badgeFresh: 'Спокійне неспання',
        badgeApproaching: 'Скоро час сну',
        badgeSweetSpot: 'Ідеальний час для сну',
        badgeOvertired: 'Ризик перевтоми',
        msgFresh: (inDur, s, e) => `Наступний ідеальний час для сну через ${inDur} (близько ${s} – ${e}).`,
        msgApproaching: (inDur, s) =>
          `Оптимальне вікно сну вже близько (через ${inDur}, о ${s}) — поступово готуйтеся до сну.`,
        msgSweetSpot: (s, e) =>
          `Зараз найкраще вікно для засинання (${s} – ${e}), поки немає перевтоми.`,
        msgOvertired: (over) =>
          `Рекомендоване вікно неспання перевищено на ${over} — бажано вкладати спати якнайшвидше.`,
        editAgeTitle: 'Змінити дату народження',
        dailyTargetLabel: (range, source) => `Норма за 24 год (${source}): ${range}`,
        sleepCuesHint: 'Орієнтовно — зважайте також на ознаки втоми.',
      };
    case 'it':
      return {
        birthDateLabel: 'Data di nascita (finestra di veglia)',
        birthDateHint: 'Calcola la finestra di veglia ideale in base all’età per evitare stanchezza eccessiva.',
        birthDateClear: 'Cancella',
        setupPromptBtn: 'Imposta data di nascita per avviso finestra di veglia',
        modalTitle: 'Finestra di veglia ottimale per età',
        modalDesc: name
          ? `Inserisci la data di nascita di ${name}. L'app calcolerà la finestra di veglia ideale e ti avviserà prima che subentri la stanchezza eccessiva.`
          : "Inserisci la data di nascita del bambino. L'app calcolerà la finestra di veglia ideale e ti avviserà prima che subentri la stanchezza eccessiva.",
        saveBtn: 'Salva età',
        cancelBtn: 'Annulla',
        optimalRangeLabel: 'Finestra ideale:',
        nextSleepAround: (s, e) => `Sonno ideale: ${s} – ${e}`,
        badgeFresh: 'Veglia serena',
        badgeApproaching: 'Sonno in arrivo',
        badgeSweetSpot: 'Momento ideale',
        badgeOvertired: 'Rischio stanchezza',
        msgFresh: (inDur, s, e) => `Prossima finestra ideale tra ${inDur} (verso ${s} – ${e}).`,
        msgApproaching: (inDur, s) =>
          `La finestra di sonno si avvicina (tra ${inDur}, verso ${s}) — inizia a preparare il riposo.`,
        msgSweetSpot: (s, e) =>
          `Questo è il momento ideale per addormentarsi (${s} – ${e}) senza stanchezza eccessiva.`,
        msgOvertired: (over) =>
          `Finestra di veglia superata di ${over} — prova a favorire il sonno al più presto.`,
        editAgeTitle: 'Modifica data di nascita',
        dailyTargetLabel: (range, source) => `Obiettivo 24h (${source}): ${range}`,
        sleepCuesHint: 'Indicativo — osserva sempre i segnali di sonno.',
      };
    case 'es':
      return {
        birthDateLabel: 'Fecha de nacimiento (ventana de vigilia)',
        birthDateHint: 'Calcula la ventana de vigilia ideal según la edad y avisa antes del sobrecansancio.',
        birthDateClear: 'Borrar',
        setupPromptBtn: 'Añadir fecha de nacimiento para avisos de vigilia',
        modalTitle: 'Ventana de vigilia óptima según edad',
        modalDesc: name
          ? `Introduce la fecha de nacimiento de ${name}. La app calculará la ventana de vigilia ideal y te avisará cuando se acerque el mejor momento para dormir.`
          : 'Introduce la fecha de nacimiento del bebé. La app calculará la ventana de vigilia ideal y te avisará cuando se acerque el mejor momento para dormir.',
        saveBtn: 'Guardar edad',
        cancelBtn: 'Cancelar',
        optimalRangeLabel: 'Ventana ideal:',
        nextSleepAround: (s, e) => `Sueño ideal: ${s} – ${e}`,
        badgeFresh: 'Vigilia tranquila',
        badgeApproaching: 'Sueño cercano',
        badgeSweetSpot: 'Momento ideal ahora',
        badgeOvertired: 'Riesgo de sobrecansancio',
        msgFresh: (inDur, s, e) => `Próximo momento ideal de sueño en ${inDur} (sobre ${s} – ${e}).`,
        msgApproaching: (inDur, s) =>
          `La ventana óptima se acerca (en ${inDur}, sobre ${s}) — empieza a preparar el descanso.`,
        msgSweetSpot: (s, e) =>
          `Estás en el punto óptimo para dormir (${s} – ${e}), antes de que aparezca el sobrecansancio.`,
        msgOvertired: (over) =>
          `Ventana de vigilia superada por ${over} — intenta iniciar el sueño pronto.`,
        editAgeTitle: 'Editar fecha de nacimiento',
        dailyTargetLabel: (range, source) => `Meta 24 h (${source}): ${range}`,
        sleepCuesHint: 'Orientativo — observa siempre las señales de sueño.',
      };
    case 'ro':
      return {
        birthDateLabel: 'Data nașterii (fereastra de veghe)',
        birthDateHint: 'Calculează fereastra optimă de veghe după vârstă și avertizează înainte de suprasolicitare.',
        birthDateClear: 'Șterge',
        setupPromptBtn: 'Setează data nașterii pentru alerta ferestrei de veghe',
        modalTitle: 'Fereastra optimă de veghe după vârstă',
        modalDesc: name
          ? `Introdu data nașterii (${name}). Aplicația va calcula intervalul ideal de veghe și te va anunța blând când se apropie ora optimă de somn.`
          : 'Introdu data nașterii copilului. Aplicația va calcula intervalul ideal de veghe și te va anunța blând când se apropie ora optimă de somn.',
        saveBtn: 'Salvează vârsta',
        cancelBtn: 'Anulează',
        optimalRangeLabel: 'Fereastră ideală:',
        nextSleepAround: (s, e) => `Somn ideal: ${s} – ${e}`,
        badgeFresh: 'Veghe liniștită',
        badgeApproaching: 'Se apropie somnul',
        badgeSweetSpot: 'Moment ideal acum',
        badgeOvertired: 'Risc de oboseală',
        msgFresh: (inDur, s, e) => `Următorul somn ideal peste ${inDur} (în jur de ${s} – ${e}).`,
        msgApproaching: (inDur, s) =>
          `Fereastra optimă de somn se apropie (peste ${inDur}, la ${s}) — pregătește treptat culcarea.`,
        msgSweetSpot: (s, e) =>
          `Acum este momentul ideal pentru adormire (${s} – ${e}), fără oboseală excesivă.`,
        msgOvertired: (over) =>
          `Fereastra recomandată a fost depășită cu ${over} — încearcă culcarea cât mai curând.`,
        editAgeTitle: 'Editează data nașterii',
        dailyTargetLabel: (range, source) => `Țintă 24h (${source}): ${range}`,
        sleepCuesHint: 'Orientativ — urmărește și semnele de oboseală.',
      };
    case 'ar':
      return {
        birthDateLabel: 'تاريخ الميلاد (لنافذة اليقظة)',
        birthDateHint: 'يحسب نافذة اليقظة المثالية حسب العمر وينبهك قبل الإرهاق الزائد.',
        birthDateClear: 'مسح',
        setupPromptBtn: 'أدخل تاريخ الميلاد لتنبيه نافذة اليقظة المثالية',
        modalTitle: 'نافذة اليقظة المثالية حسب العمر',
        modalDesc: name
          ? `أدخل تاريخ ميلاد ${name}. سيحسب التطبيق مدة اليقظة الموصى بها وينبهك بلطف عند اقتراب الوقت المثالي للنوم القادم.`
          : 'أدخل تاريخ ميلاد طفلك. سيحسب التطبيق مدة اليقظة الموصى بها وينبهك بلطف عند اقتراب الوقت المثالي للنوم القادم.',
        saveBtn: 'حفظ العمر',
        cancelBtn: 'إلغاء',
        optimalRangeLabel: 'النافذة المثالية:',
        nextSleepAround: (s, e) => `النوم المثالي: ${s} – ${e}`,
        badgeFresh: 'يقظة مريحة',
        badgeApproaching: 'اقترب وقت النوم',
        badgeSweetSpot: 'الوقت المثالي الآن',
        badgeOvertired: 'احتمال إرهاق زائد',
        msgFresh: (inDur, s, e) => `الوقت المثالي للنوم القادم بعد ${inDur} (حوالي ${s} – ${e}).`,
        msgApproaching: (inDur, s) =>
          `تقترب نافذة النوم المثالية (بعد ${inDur}، حوالي ${s}) — ابدأ بالتحضير الهادئ للنوم.`,
        msgSweetSpot: (s, e) =>
          `الآن هو الوقت المثالي للنوم (${s} – ${e}) قبل حدوث الإرهاق الزائد.`,
        msgOvertired: (over) =>
          `تجاوزت نافذة اليقظة الموصى بها بـ ${over} — يُنصح ببدء النوم قريباً.`,
        editAgeTitle: 'تعديل تاريخ الميلاد',
        dailyTargetLabel: (range, source) => `هدف 24 ساعة (${source}): ${range}`,
        sleepCuesHint: 'إرشادي فقط — راقب دائماً علامات النعاس.',
      };
  }
}
