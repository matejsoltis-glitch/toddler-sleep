import { Capacitor, registerPlugin } from '@capacitor/core';
import { Language } from '../types';
import { normalizeBabyName } from '../utils/babyName';

export const LOCKSCREEN_SLEEP_STORAGE_KEY = 'toddler_lockscreen_sleep_enabled';

export interface SleepLockScreenPlugin {
  showOngoingSleep(options: {
    title: string;
    body: string;
    startTimeMs: number;
    channelName: string;
  }): Promise<{ shown: boolean; reason?: string }>;
  hideOngoingSleep(): Promise<{ hidden: boolean }>;
  checkNotificationPermission(): Promise<{ granted: boolean }>;
  requestNotificationPermission(): Promise<{ granted: boolean }>;
  scheduleWakeReminder(options: {
    title: string;
    body: string;
    triggerAtMs: number;
    channelName: string;
  }): Promise<{ scheduled: boolean; reason?: string }>;
  cancelWakeReminder(): Promise<{ cancelled: boolean }>;
  showInstantWakeReminder(options: {
    title: string;
    body: string;
    channelName: string;
  }): Promise<{ shown: boolean; reason?: string }>;
}

export const SleepLockScreenNotification = registerPlugin<SleepLockScreenPlugin>(
  'SleepLockScreenNotification'
);

export interface LockScreenCopy {
  settingsHeading: string;
  settingsDesc: string;
  settingsBadgeOn: string;
  settingsBadgeOff: string;
  channelName: string;
  activeHint: string;
  permissionHint: string;
}

export function getLockScreenCopy(language: Language): LockScreenCopy {
  switch (language) {
    case 'sk':
      return {
        settingsHeading: 'Spánok na zamknutej obrazovke (Android)',
        settingsDesc:
          'Počas zaznamenávania spánku zobrazí na zamknutej obrazovke živý časovač v tichom režime (bez zvuku a vibrácií).',
        settingsBadgeOn: 'AKTÍVNE',
        settingsBadgeOff: 'VYPNUTÉ',
        channelName: 'Prebiehajúci spánok',
        activeHint: 'Zobrazené aj na zamknutej obrazovke',
        permissionHint: 'Vyžaduje povolenie upozornení v Androide',
      };
    case 'cs':
      return {
        settingsHeading: 'Spánek na zamčené obrazovce (Android)',
        settingsDesc:
          'Během sledování spánku zobrazí na zamčené obrazovce živý časovač v tichém režimu (bez zvuku a vibrací).',
        settingsBadgeOn: 'AKTIVNÍ',
        settingsBadgeOff: 'VYPNUTO',
        channelName: 'Probíhající spánek',
        activeHint: 'Zobrazeno i na zamčené obrazovce',
        permissionHint: 'Vyžaduje oprávnění oznámení v Androidu',
      };
    case 'en':
      return {
        settingsHeading: 'Lock Screen Sleep Display (Android)',
        settingsDesc:
          'Shows a silent live sleep timer on your Android lock screen while sleep tracking is active (no sound or vibration).',
        settingsBadgeOn: 'ACTIVE',
        settingsBadgeOff: 'OFF',
        channelName: 'Ongoing Sleep Tracker',
        activeHint: 'Visible on Android lock screen',
        permissionHint: 'Requires Android notification permission',
      };
    case 'pl':
      return {
        settingsHeading: 'Sen na ekranie blokady (Android)',
        settingsDesc:
          'Podczas śledzenia snu wyświetla na ekranie blokady cichy stoper na żywo (bez dźwięku i wibracji).',
        settingsBadgeOn: 'AKTYWNE',
        settingsBadgeOff: 'WYŁĄCZONE',
        channelName: 'Trwający sen',
        activeHint: 'Widoczne na ekranie blokady',
        permissionHint: 'Wymaga zgody na powiadomienia w Androidzie',
      };
    case 'hu':
      return {
        settingsHeading: 'Alvás a zárolt képernyőn (Android)',
        settingsDesc:
          'Alváskövetés közben némán, hang és rezgés nélkül jeleníti meg az élő időzítőt az Android zárolt képernyőjén.',
        settingsBadgeOn: 'AKTÍV',
        settingsBadgeOff: 'KI',
        channelName: 'Folyamatban lévő alvás',
        activeHint: 'Látható a zárolt képernyőn',
        permissionHint: 'Android értesítési engedély szükséges',
      };
    case 'uk':
      return {
        settingsHeading: 'Сон на екрані блокування (Android)',
        settingsDesc:
          'Під час відстеження сну тихо показує живий таймер на екрані блокування Android (без звуку та вібрації).',
        settingsBadgeOn: 'АКТИВНО',
        settingsBadgeOff: 'ВИМКНЕНО',
        channelName: 'Поточний сон',
        activeHint: 'Відображається на екрані блокування',
        permissionHint: 'Потрібен дозвіл на сповіщення в Android',
      };
    case 'it':
      return {
        settingsHeading: 'Sonno su schermata di blocco (Android)',
        settingsDesc:
          'Mostra un timer del sonno in tempo reale sulla schermata di blocco Android in modalità silenziosa (senza suoni né vibrazioni).',
        settingsBadgeOn: 'ATTIVO',
        settingsBadgeOff: 'DISATTIVO',
        channelName: 'Monitoraggio sonno attivo',
        activeHint: 'Visibile sulla schermata di blocco',
        permissionHint: 'Richiede il permesso notifiche su Android',
      };
    case 'es':
      return {
        settingsHeading: 'Sueño en pantalla de bloqueo (Android)',
        settingsDesc:
          'Muestra un cronómetro de sueño en vivo y en silencio en la pantalla de bloqueo de Android (sin sonido ni vibración).',
        settingsBadgeOn: 'ACTIVO',
        settingsBadgeOff: 'INACTIVO',
        channelName: 'Seguimiento de sueño activo',
        activeHint: 'Visible en pantalla de bloqueo',
        permissionHint: 'Requiere permiso de notificaciones en Android',
      };
    case 'ro':
      return {
        settingsHeading: 'Somn pe ecranul de blocare (Android)',
        settingsDesc:
          'Afișează un cronometru de somn în timp real pe ecranul de blocare Android, complet silențios (fără sunet sau vibrații).',
        settingsBadgeOn: 'ACTIV',
        settingsBadgeOff: 'OPRIT',
        channelName: 'Monitorizare somn activă',
        activeHint: 'Vizibil pe ecranul de blocare',
        permissionHint: 'Necesită permisiunea de notificări în Android',
      };
    case 'ar':
      return {
        settingsHeading: 'عرض النوم على شاشة القفل (Android)',
        settingsDesc:
          'يعرض مؤقت النوم المباشر بصمت على شاشة القفل في أندرويد أثناء تتبع النوم (دون صوت أو اهتزاز).',
        settingsBadgeOn: 'مفعّل',
        settingsBadgeOff: 'متوقف',
        channelName: 'تتبع النوم الجاري',
        activeHint: 'ظاهر على شاشة القفل',
        permissionHint: 'يتطلب إذن الإشعارات في أندرويد',
      };
  }
}

function buildLockScreenNotificationStrings(
  language: Language,
  babyName: string,
  startTimeMs: number
): { title: string; body: string; channelName: string } {
  const name = normalizeBabyName(babyName);
  const startDate = new Date(startTimeMs);
  const hh = String(startDate.getHours()).padStart(2, '0');
  const mm = String(startDate.getMinutes()).padStart(2, '0');
  const startTimeStr = `${hh}:${mm}`;
  const copy = getLockScreenCopy(language);

  switch (language) {
    case 'sk':
      return {
        title: name ? `${name} spí` : 'Dieťatko spí',
        body: `Začiatok spánku o ${startTimeStr} • Ťuknutím otvoríte aplikáciu`,
        channelName: copy.channelName,
      };
    case 'cs':
      return {
        title: name ? `${name} spí` : 'Děťátko spí',
        body: `Začátek spánku v ${startTimeStr} • Klepnutím otevřete aplikaci`,
        channelName: copy.channelName,
      };
    case 'en':
      return {
        title: name ? `${name} is sleeping` : 'Baby is sleeping',
        body: `Asleep since ${startTimeStr} • Tap to open app`,
        channelName: copy.channelName,
      };
    case 'pl':
      return {
        title: name ? `${name} śpi` : 'Maluszek śpi',
        body: `Początek snu o ${startTimeStr} • Dotknij, aby otworzyć`,
        channelName: copy.channelName,
      };
    case 'hu':
      return {
        title: name ? `${name} alszik` : 'A baba alszik',
        body: `Alvás kezdete: ${startTimeStr} • Koppints a megnyitáshoz`,
        channelName: copy.channelName,
      };
    case 'uk':
      return {
        title: name ? `${name} спить` : 'Малюк спить',
        body: `Початок сну о ${startTimeStr} • Натисніть, щоб відкрити`,
        channelName: copy.channelName,
      };
    case 'it':
      return {
        title: name ? `${name} dorme` : 'Il bambino dorme',
        body: `Inizio sonno alle ${startTimeStr} • Tocca per aprire`,
        channelName: copy.channelName,
      };
    case 'es':
      return {
        title: name ? `${name} duerme` : 'El bebé duerme',
        body: `Inicio del sueño: ${startTimeStr} • Toca para abrir`,
        channelName: copy.channelName,
      };
    case 'ro':
      return {
        title: name ? `${name} doarme` : 'Bebelușul doarme',
        body: `Începutul somnului la ${startTimeStr} • Apasă pentru a deschide`,
        channelName: copy.channelName,
      };
    case 'ar':
      return {
        title: name ? `${name} نائم الآن` : 'الطفل نائم الآن',
        body: `بداية النوم ${startTimeStr} • اضغط لفتح التطبيق`,
        channelName: copy.channelName,
      };
  }
}

export function isNativeAndroid(): boolean {
  try {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
  } catch {
    return false;
  }
}

export async function requestLockScreenSleepPermission(): Promise<boolean> {
  if (!isNativeAndroid()) return true;
  try {
    const check = await SleepLockScreenNotification.checkNotificationPermission();
    if (check?.granted) return true;
    const res = await SleepLockScreenNotification.requestNotificationPermission();
    return Boolean(res?.granted);
  } catch {
    return false;
  }
}

export async function syncLockScreenOngoingSleep(params: {
  enabled: boolean;
  activeSleepStart: string | null;
  language: Language;
  babyName: string;
}): Promise<void> {
  if (!isNativeAndroid()) return;
  const { enabled, activeSleepStart, language, babyName } = params;

  try {
    if (!enabled || !activeSleepStart) {
      await SleepLockScreenNotification.hideOngoingSleep();
      return;
    }

    const startTimeMs = new Date(activeSleepStart).getTime();
    if (Number.isNaN(startTimeMs)) {
      await SleepLockScreenNotification.hideOngoingSleep();
      return;
    }

    const strings = buildLockScreenNotificationStrings(language, babyName, startTimeMs);
    await SleepLockScreenNotification.showOngoingSleep({
      title: strings.title,
      body: strings.body,
      startTimeMs,
      channelName: strings.channelName,
    });
  } catch {
    // Graceful no-op if native plugin is unavailable
  }
}
