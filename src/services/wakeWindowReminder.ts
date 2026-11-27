import { Capacitor } from '@capacitor/core';
import { Language, SleepSession } from '../types';
import { normalizeBabyName } from '../utils/babyName';
import { getChildAgeSummary } from '../utils/wakeWindow';
import {
  SleepLockScreenNotification,
  requestLockScreenSleepPermission,
} from './lockScreenSleep';

export const WAKE_REMINDER_ENABLED_KEY = 'toddler_wake_reminder_enabled';
export const WAKE_REMINDER_LEAD_MINS_KEY = 'toddler_wake_reminder_lead_mins';
export const SESSIONS_UPDATED_EVENT = 'toddler-sessions-updated';
export const WAKE_REMINDER_TRIGGERED_EVENT = 'toddler-wake-reminder-triggered';

const STORAGE_KEY_SESSIONS = 'toddler_sleep_sessions';

export type WakeReminderLeadMins = 10 | 15 | 20 | 30;
export const WAKE_REMINDER_LEAD_OPTIONS: WakeReminderLeadMins[] = [10, 15, 20, 30];

export interface ScheduledWakeReminderInfo {
  triggerAtMs: number;
  triggerTimeLabel: string;
  sweetSpotStartTime: string;
  sweetSpotEndTime: string;
  leadMinsBeforeSweetSpot: number;
}

export interface WakeReminderBannerPayload {
  title: string;
  body: string;
}

let webReminderTimerId: number | null = null;

function isNativeAndroid(): boolean {
  try {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
  } catch {
    return false;
  }
}

function formatClockHHMM(ms: number): string {
  const d = new Date(ms);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function readWakeReminderEnabled(): boolean {
  try {
    return localStorage.getItem(WAKE_REMINDER_ENABLED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function readWakeReminderLeadMins(): WakeReminderLeadMins {
  try {
    const raw = Number(localStorage.getItem(WAKE_REMINDER_LEAD_MINS_KEY));
    if (raw === 10 || raw === 15 || raw === 20 || raw === 30) {
      return raw;
    }
  } catch {
    // ignore
  }
  return 15;
}

export function readLatestCompletedSessionEndIso(nowMs = Date.now()): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSIONS);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;

    let latestMs = -1;
    let latestIso: string | null = null;
    for (const item of parsed as Partial<SleepSession>[]) {
      if (!item || typeof item.endTime !== 'string') continue;
      const endMs = new Date(item.endTime).getTime();
      if (!Number.isNaN(endMs) && endMs <= nowMs && endMs > latestMs) {
        latestMs = endMs;
        latestIso = item.endTime;
      }
    }
    return latestIso;
  } catch {
    return null;
  }
}

export function computeNextWakeReminderSchedule(params: {
  enabled: boolean;
  activeSleepStart: string | null;
  babyBirthDate: string;
  lastCompletedEndIso: string | null;
  leadMins: WakeReminderLeadMins;
  nowMs?: number;
}): ScheduledWakeReminderInfo | null {
  const { enabled, activeSleepStart, babyBirthDate, lastCompletedEndIso, leadMins } = params;
  const nowMs = params.nowMs ?? Date.now();

  if (!enabled || activeSleepStart || !lastCompletedEndIso) return null;

  const age = getChildAgeSummary(babyBirthDate);
  if (!age) return null;

  const lastEndMs = new Date(lastCompletedEndIso).getTime();
  if (Number.isNaN(lastEndMs) || lastEndMs > nowMs) return null;

  const sweetSpotStartMs = lastEndMs + age.minWakeMins * 60000;
  const sweetSpotEndMs = lastEndMs + age.maxWakeMins * 60000;
  const sweetSpotStartTime = formatClockHHMM(sweetSpotStartMs);
  const sweetSpotEndTime = formatClockHHMM(sweetSpotEndMs);

  // Ideal reminder: `leadMins` before sweet spot begins (at least 5 min after waking)
  const effectiveLead = Math.min(leadMins, Math.max(0, age.minWakeMins - 5));
  const preferredTriggerMs = sweetSpotStartMs - effectiveLead * 60000;

  let triggerAtMs: number;
  let actualLeadMins: number;

  if (preferredTriggerMs > nowMs + 15000) {
    triggerAtMs = preferredTriggerMs;
    actualLeadMins = effectiveLead;
  } else if (sweetSpotStartMs > nowMs + 15000) {
    // Already inside the wind-down buffer — gently notify right at sweet-spot start
    triggerAtMs = sweetSpotStartMs;
    actualLeadMins = 0;
  } else {
    // Sweet spot already started or passed
    return null;
  }

  // Don't schedule stale alarms more than 18 hours away
  if (triggerAtMs - nowMs > 18 * 3600 * 1000) {
    return null;
  }

  return {
    triggerAtMs,
    triggerTimeLabel: formatClockHHMM(triggerAtMs),
    sweetSpotStartTime,
    sweetSpotEndTime,
    leadMinsBeforeSweetSpot: actualLeadMins,
  };
}

export async function requestWakeReminderPermission(): Promise<boolean> {
  if (isNativeAndroid()) {
    return requestLockScreenSleepPermission();
  }
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      if (Notification.permission === 'granted') return true;
      if (Notification.permission === 'denied') return false;
      const res = await Notification.requestPermission();
      return res === 'granted';
    } catch {
      return false;
    }
  }
  return true;
}

export interface WakeReminderCopy {
  settingsHeading: string;
  settingsDesc: string;
  leadTimeLabel: string;
  leadOptionLabel: (mins: number) => string;
  needBirthDateHint: string;
  testBtn: string;
  testSentFeedback: string;
  channelName: string;
  scheduledAtBadge: (time: string) => string;
  toggleOnChip: string;
  toggleOffChip: string;
  notifTitle: string;
  notifBody: (leadMins: number, start: string, end: string) => string;
  testTitle: string;
  testBody: string;
}

export function getWakeReminderCopy(language: Language, babyName?: string | null): WakeReminderCopy {
  const name = normalizeBabyName(babyName);

  switch (language) {
    case 'sk':
      return {
        settingsHeading: 'Tichá pripomienka bdelého okna',
        settingsDesc:
          'Jemná offline notifikácia bez zvuku a vibrácií pred začiatkom ideálneho okna na spánok, aby ste stihli uspanie pred preúnavou.',
        leadTimeLabel: 'Upozorniť vopred pred ideálnym oknom:',
        leadOptionLabel: (m) => `${m} min`,
        needBirthDateHint: 'Pre výpočet pripomienky nastavte v profile dátum narodenia dieťatka.',
        testBtn: 'Otestovať tichú pripomienku',
        testSentFeedback: 'Tichá pripomienka odoslaná',
        channelName: 'Pripomienka bdelého okna',
        scheduledAtBadge: (time) => `Pripomienka o ${time}`,
        toggleOnChip: 'Tichá pripomienka zapnutá',
        toggleOffChip: 'Tichá pripomienka',
        notifTitle: name ? `${name}: blíži sa čas na spánok` : 'Blíži sa ideálne bdelé okno',
        notifBody: (lead, start, end) =>
          lead > 0
            ? `Za ${lead} min začína ideálne okno na spánok (${start} – ${end}). Pomaly sa pripravte na uspanie.`
            : `Začína ideálne okno na spánok (${start} – ${end}) – dobrý čas uložiť dieťatko pred preúnavou.`,
        testTitle: name ? `${name}: test tichej pripomienky` : 'Test tichej pripomienky bdelého okna',
        testBody: 'Takto sa ticho (bez zvuku a vibrácií) zobrazí pripomienka pred ideálnym časom spánku.',
      };
    case 'cs':
      return {
        settingsHeading: 'Tichá připomínka bdělého okna',
        settingsDesc:
          'Jemné offline oznámení bez zvuku a vibrací před začátkem ideálního okna pro spánek, abyste předešli přetažení.',
        leadTimeLabel: 'Upozornit předem před ideálním oknem:',
        leadOptionLabel: (m) => `${m} min`,
        needBirthDateHint: 'Pro výpočet připomínky nastavte v profilu datum narození děťátka.',
        testBtn: 'Otestovat tichou připomínku',
        testSentFeedback: 'Tichá připomínka odeslána',
        channelName: 'Připomínka bdělého okna',
        scheduledAtBadge: (time) => `Připomínka v ${time}`,
        toggleOnChip: 'Tichá připomínka zapnuta',
        toggleOffChip: 'Tichá připomínka',
        notifTitle: name ? `${name}: blíží se čas spánku` : 'Blíží se ideální bdělé okno',
        notifBody: (lead, start, end) =>
          lead > 0
            ? `Za ${lead} min začíná ideální okno pro spánek (${start} – ${end}). Pomalu se připravte na uspání.`
            : `Začíná ideální okno pro spánek (${start} – ${end}) – vhodný čas uložit děťátko bez přetažení.`,
        testTitle: name ? `${name}: test tiché připomínky` : 'Test tiché připomínky bdělého okna',
        testBody: 'Takto se tiše (bez zvuku a vibrací) zobrazí připomínka před ideálním časem spánku.',
      };
    case 'en':
      return {
        settingsHeading: 'Silent Wake-Window Reminder',
        settingsDesc:
          'Gentle offline notification with no sound or vibration right before the ideal sleep window starts, helping prevent overtiredness.',
        leadTimeLabel: 'Remind before the ideal sleep window:',
        leadOptionLabel: (m) => `${m} min`,
        needBirthDateHint: 'Set your baby’s birth date in Child Profile to calculate wake-window reminders.',
        testBtn: 'Test silent reminder',
        testSentFeedback: 'Silent reminder sent',
        channelName: 'Wake Window Reminder',
        scheduledAtBadge: (time) => `Reminder at ${time}`,
        toggleOnChip: 'Silent reminder on',
        toggleOffChip: 'Silent reminder',
        notifTitle: name ? `${name}: sleep window soon` : 'Ideal sleep window approaching',
        notifBody: (lead, start, end) =>
          lead > 0
            ? `Ideal sleep window starts in ${lead} min (${start} – ${end}). Begin winding down gently.`
            : `Ideal sleep window starts now (${start} – ${end}) — a calm moment before overtiredness.`,
        testTitle: name ? `${name}: silent reminder test` : 'Silent wake-window reminder test',
        testBody: 'This is how your silent reminder (no sound or vibration) appears before sleep time.',
      };
    case 'pl':
      return {
        settingsHeading: 'Ciche przypomnienie okna czuwania',
        settingsDesc:
          'Delikatne powiadomienie offline bez dźwięku i wibracji przed idealnym oknem snu, aby zdążyć przed przemęczeniem.',
        leadTimeLabel: 'Przypomnij przed idealnym oknem snu:',
        leadOptionLabel: (m) => `${m} min`,
        needBirthDateHint: 'Ustaw datę urodzenia dziecka w profilu, aby obliczyć przypomnienie.',
        testBtn: 'Przetestuj ciche przypomnienie',
        testSentFeedback: 'Wysłano ciche przypomnienie',
        channelName: 'Przypomnienie okna czuwania',
        scheduledAtBadge: (time) => `Przypomnienie o ${time}`,
        toggleOnChip: 'Ciche przypomnienie włączone',
        toggleOffChip: 'Ciche przypomnienie',
        notifTitle: name ? `${name}: zbliża się pora snu` : 'Zbliża się idealne okno snu',
        notifBody: (lead, start, end) =>
          lead > 0
            ? `Za ${lead} min zaczyna się idealne okno snu (${start} – ${end}). Powoli wyciszaj malucha.`
            : `Zaczyna się idealne okno snu (${start} – ${end}) – dobry moment przed przemęczeniem.`,
        testTitle: name ? `${name}: test cichego przypomnienia` : 'Test cichego przypomnienia',
        testBody: 'Tak wygląda ciche powiadomienie (bez dźwięku i wibracji) przed idealną porą snu.',
      };
    case 'hu':
      return {
        settingsHeading: 'Csendes ébrenléti ablak emlékeztető',
        settingsDesc:
          'Finom offline értesítés hang és rezgés nélkül az ideális alvási ablak előtt, a túlfáradás megelőzésére.',
        leadTimeLabel: 'Emlékeztető az ideális ablak előtt:',
        leadOptionLabel: (m) => `${m} perc`,
        needBirthDateHint: 'Add meg a gyermek születési dátumát a profilban az emlékeztetőhöz.',
        testBtn: 'Csendes értesítés tesztje',
        testSentFeedback: 'Csendes emlékeztető elküldve',
        channelName: 'Ébrenléti ablak emlékeztető',
        scheduledAtBadge: (time) => `Emlékeztető: ${time}`,
        toggleOnChip: 'Csendes emlékeztető aktív',
        toggleOffChip: 'Csendes emlékeztető',
        notifTitle: name ? `${name}: közeleg az alvásidő` : 'Közeleg az ideális alvási ablak',
        notifBody: (lead, start, end) =>
          lead > 0
            ? `${lead} perc múlva kezdődik az ideális alvásidő (${start} – ${end}). Lassan készüljetek az altatásra.`
            : `Elkezdődött az ideális alvásablak (${start} – ${end}) – jó pillanat a túlfáradás előtt.`,
        testTitle: name ? `${name}: csendes értesítés teszt` : 'Csendes emlékeztető teszt',
        testBody: 'Így jelenik meg némán (hang és rezgés nélkül) az alvás előtti emlékeztető.',
      };
    case 'uk':
      return {
        settingsHeading: 'Тихе нагадування вікна неспання',
        settingsDesc:
          'М’яке офлайн-сповіщення без звуку та вібрації перед початком ідеального вікна сну, щоб уникнути перевтоми.',
        leadTimeLabel: 'Нагадати заздалегідь до вікна сну:',
        leadOptionLabel: (m) => `${m} хв`,
        needBirthDateHint: 'Вкажіть дату народження дитини у профілі для розрахунку нагадувань.',
        testBtn: 'Перевірити тихе нагадування',
        testSentFeedback: 'Тихе нагадування надіслано',
        channelName: 'Нагадування вікна неспання',
        scheduledAtBadge: (time) => `Нагадування о ${time}`,
        toggleOnChip: 'Тихе нагадування увімк.',
        toggleOffChip: 'Тихе нагадування',
        notifTitle: name ? `${name}: скоро час сну` : 'Наближається ідеальне вікно сну',
        notifBody: (lead, start, end) =>
          lead > 0
            ? `За ${lead} хв починається ідеальне вікно сну (${start} – ${end}). Поступово готуйтеся до сну.`
            : `Починається ідеальне вікно сну (${start} – ${end}) — спокійний час до перевтоми.`,
        testTitle: name ? `${name}: тест тихого нагадування` : 'Тест тихого нагадування',
        testBody: 'Так тихо (без звуку та вібрації) приходитиме підказка перед часом сну.',
      };
    case 'it':
      return {
        settingsHeading: 'Promemoria silenzioso finestra veglia',
        settingsDesc:
          'Notifica offline silenziosa (senza suoni né vibrazioni) poco prima della finestra ideale di sonno per evitare stanchezza eccessiva.',
        leadTimeLabel: 'Avvisa in anticipo prima della finestra ideale:',
        leadOptionLabel: (m) => `${m} min`,
        needBirthDateHint: 'Imposta la data di nascita nel profilo per calcolare i promemoria.',
        testBtn: 'Prova promemoria silenzioso',
        testSentFeedback: 'Promemoria silenzioso inviato',
        channelName: 'Promemoria finestra di veglia',
        scheduledAtBadge: (time) => `Avviso alle ${time}`,
        toggleOnChip: 'Avviso silenzioso attivo',
        toggleOffChip: 'Avviso silenzioso',
        notifTitle: name ? `${name}: sonno in arrivo` : 'Finestra di sonno in arrivo',
        notifBody: (lead, start, end) =>
          lead > 0
            ? `Tra ${lead} min inizia la finestra ideale di sonno (${start} – ${end}). Inizia a rilassare il bimbo.`
            : `Inizia ora la finestra ideale di sonno (${start} – ${end}) prima della stanchezza eccessiva.`,
        testTitle: name ? `${name}: test promemoria silenzioso` : 'Test promemoria silenzioso',
        testBody: 'Ecco come appare il promemoria silenzioso (senza suoni né vibrazioni) prima del riposo.',
      };
    case 'es':
      return {
        settingsHeading: 'Recordatorio silencioso de vigilia',
        settingsDesc:
          'Notificación offline sin sonido ni vibración antes de la ventana ideal de sueño para evitar el sobrecansancio.',
        leadTimeLabel: 'Avisar antes de la ventana ideal:',
        leadOptionLabel: (m) => `${m} min`,
        needBirthDateHint: 'Añade la fecha de nacimiento en el perfil para calcular recordatorios.',
        testBtn: 'Probar aviso silencioso',
        testSentFeedback: 'Recordatorio silencioso enviado',
        channelName: 'Recordatorio de ventana de vigilia',
        scheduledAtBadge: (time) => `Aviso a las ${time}`,
        toggleOnChip: 'Aviso silencioso activo',
        toggleOffChip: 'Aviso silencioso',
        notifTitle: name ? `${name}: hora de dormir pronto` : 'Ventana ideal de sueño cerca',
        notifBody: (lead, start, end) =>
          lead > 0
            ? `En ${lead} min empieza la ventana ideal de sueño (${start} – ${end}). Prepara el descanso con calma.`
            : `Empieza la ventana ideal de sueño (${start} – ${end}), antes del sobrecansancio.`,
        testTitle: name ? `${name}: prueba de aviso silencioso` : 'Prueba de aviso silencioso',
        testBody: 'Así aparecerá el aviso silencioso (sin sonido ni vibración) antes de dormir.',
      };
    case 'ro':
      return {
        settingsHeading: 'Memento silențios fereastră de veghe',
        settingsDesc:
          'Notificare offline fără sunet și fără vibrații înainte de fereastra optimă de somn, pentru a preveni oboseala excesivă.',
        leadTimeLabel: 'Anunță înainte de fereastra ideală:',
        leadOptionLabel: (m) => `${m} min`,
        needBirthDateHint: 'Setează data nașterii în profil pentru a calcula mementourile.',
        testBtn: 'Testează memento silențios',
        testSentFeedback: 'Memento silențios trimis',
        channelName: 'Memento fereastră de veghe',
        scheduledAtBadge: (time) => `Memento la ${time}`,
        toggleOnChip: 'Memento silențios pornit',
        toggleOffChip: 'Memento silențios',
        notifTitle: name ? `${name}: se apropie ora de somn` : 'Se apropie fereastra de somn',
        notifBody: (lead, start, end) =>
          lead > 0
            ? `Peste ${lead} min începe fereastra ideală de somn (${start} – ${end}). Pregătește culcarea.`
            : `Începe fereastra ideală de somn (${start} – ${end}), înainte de suprasolicitare.`,
        testTitle: name ? `${name}: test memento silențios` : 'Test memento silențios',
        testBody: 'Așa apare notificarea silențioasă (fără sunet și vibrații) înainte de somn.',
      };
    case 'ar':
      return {
        settingsHeading: 'تذكير صامت لنافذة اليقظة',
        settingsDesc:
          'إشعار صامت دون صوت أو اهتزاز يعمل دون إنترنت قبل بداية الوقت المثالي للنوم لتجنب الإرهاق الزائد.',
        leadTimeLabel: 'التذكير قبل بداية النافذة المثالية:',
        leadOptionLabel: (m) => `${m} د`,
        needBirthDateHint: 'أدخل تاريخ ميلاد الطفل في الملف لحساب التذكيرات.',
        testBtn: 'تجربة التذكير الصامت',
        testSentFeedback: 'تم إرسال التذكير الصامت',
        channelName: 'تذكير نافذة اليقظة',
        scheduledAtBadge: (time) => `تذكير ${time}`,
        toggleOnChip: 'التذكير الصامت مفعّل',
        toggleOffChip: 'تذكير صامت',
        notifTitle: name ? `${name}: اقترب وقت النوم` : 'اقتربت نافذة النوم المثالية',
        notifBody: (lead, start, end) =>
          lead > 0
            ? `تبدأ نافذة النوم المثالية بعد ${lead} دقيقة (${start} – ${end}). ابدأ بالتحضير الهادئ.`
            : `بدأت الآن نافذة النوم المثالية (${start} – ${end}) قبل الإرهاق الزائد.`,
        testTitle: name ? `${name}: تجربة التذكير الصامت` : 'تجربة التذكير الصامت',
        testBody: 'هكذا يظهر التذكير بصمت (دون صوت أو اهتزاز) قبل وقت النوم المثالي.',
      };
  }
}

function clearWebReminderTimer() {
  if (webReminderTimerId !== null) {
    window.clearTimeout(webReminderTimerId);
    webReminderTimerId = null;
  }
}

function fireWebSilentNotification(payload: WakeReminderBannerPayload) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(WAKE_REMINDER_TRIGGERED_EVENT, { detail: payload }));
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(payload.title, {
        body: payload.body,
        silent: true,
        tag: 'toddler-wake-window-reminder',
      });
    } catch {
      // In-app banner already dispatched above
    }
  }
}

export async function syncWakeWindowReminder(params: {
  enabled: boolean;
  leadMins: WakeReminderLeadMins;
  activeSleepStart: string | null;
  babyBirthDate: string;
  babyName: string;
  language: Language;
}): Promise<ScheduledWakeReminderInfo | null> {
  const { enabled, leadMins, activeSleepStart, babyBirthDate, babyName, language } = params;
  clearWebReminderTimer();

  const lastEndIso = readLatestCompletedSessionEndIso();
  const schedule = computeNextWakeReminderSchedule({
    enabled,
    activeSleepStart,
    babyBirthDate,
    lastCompletedEndIso: lastEndIso,
    leadMins,
  });

  if (!schedule) {
    if (isNativeAndroid()) {
      try {
        await SleepLockScreenNotification.cancelWakeReminder();
      } catch {
        // graceful no-op
      }
    }
    return null;
  }

  const copy = getWakeReminderCopy(language, babyName);
  const title = copy.notifTitle;
  const body = copy.notifBody(
    schedule.leadMinsBeforeSweetSpot,
    schedule.sweetSpotStartTime,
    schedule.sweetSpotEndTime
  );

  if (isNativeAndroid()) {
    try {
      await SleepLockScreenNotification.scheduleWakeReminder({
        title,
        body,
        triggerAtMs: schedule.triggerAtMs,
        channelName: copy.channelName,
      });
    } catch {
      // graceful no-op if native method unavailable on older APK
    }
  } else if (typeof window !== 'undefined') {
    const delayMs = Math.max(1000, schedule.triggerAtMs - Date.now());
    webReminderTimerId = window.setTimeout(() => {
      webReminderTimerId = null;
      fireWebSilentNotification({ title, body });
    }, delayMs);
  }

  return schedule;
}

export async function sendTestWakeReminder(
  language: Language,
  babyName: string
): Promise<boolean> {
  const copy = getWakeReminderCopy(language, babyName);

  if (isNativeAndroid()) {
    await requestLockScreenSleepPermission();
    try {
      const res = await SleepLockScreenNotification.showInstantWakeReminder({
        title: copy.testTitle,
        body: copy.testBody,
        channelName: copy.channelName,
      });
      if (res?.shown) return true;
    } catch {
      // fall through to in-app preview banner
    }
  } else {
    await requestWakeReminderPermission();
  }

  fireWebSilentNotification({
    title: copy.testTitle,
    body: copy.testBody,
  });
  return true;
}
