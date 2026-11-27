import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Language, SleepQuality, SleepScheduleBounds, SleepSession, SleepType } from '../types';
import { BABY_NAME_STORAGE_KEY, normalizeBabyName } from './babyName';
import { BABY_BIRTH_DATE_STORAGE_KEY } from './wakeWindow';

export const BACKUP_RESTORED_EVENT = 'toddler-backup-restored';

const STORAGE_KEY_SESSIONS = 'toddler_sleep_sessions';
const STORAGE_KEY_BOUNDS = 'toddler_sleep_schedule_bounds';

export interface ToddlerSleepBackup {
  app: 'toddler-sleep-assistant';
  schemaVersion: 1;
  exportedAt: string;
  sessions: SleepSession[];
  profile: {
    babyName?: string;
    babyBirthDate?: string;
    scheduleBounds?: SleepScheduleBounds;
  };
}

export type BackupImportMode = 'merge' | 'replace';

export interface BackupRestoreResult {
  totalSessionsAfter: number;
  addedCount: number;
  restoredProfile: {
    babyName?: string;
    babyBirthDate?: string;
    scheduleBounds?: SleepScheduleBounds;
  };
}

const isValidHHMM = (val: unknown): val is string =>
  typeof val === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(val);

const isValidDateYYYYMMDD = (val: unknown): val is string =>
  typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val);

const toLocalDateStr = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const sanitizeSession = (raw: unknown, index: number): SleepSession | null => {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.startTime !== 'string' || typeof obj.endTime !== 'string') return null;

  const startMs = new Date(obj.startTime).getTime();
  const endMs = new Date(obj.endTime).getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) return null;

  const computedMins = Math.max(1, Math.round((endMs - startMs) / 60000));
  const durationMinutes =
    typeof obj.durationMinutes === 'number' &&
    Number.isFinite(obj.durationMinutes) &&
    obj.durationMinutes > 0
      ? Math.round(obj.durationMinutes)
      : computedMins;

  const type: SleepType = obj.type === 'night-sleep' ? 'night-sleep' : 'day-nap';
  const quality: SleepQuality =
    obj.quality === 'peaceful' || obj.quality === 'normal' || obj.quality === 'restless'
      ? obj.quality
      : 'normal';

  const id =
    typeof obj.id === 'string' && obj.id.trim().length > 0
      ? obj.id.trim()
      : `sleep-import-${startMs}-${index}`;

  const notes =
    typeof obj.notes === 'string' && obj.notes.trim().length > 0
      ? obj.notes.trim().slice(0, 120)
      : undefined;

  return {
    id,
    startTime: obj.startTime,
    endTime: obj.endTime,
    durationMinutes,
    type,
    quality,
    notes,
  };
};

export function readStoredSessionsCount(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSIONS);
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

export function createBackupPayload(): ToddlerSleepBackup {
  let sessions: SleepSession[] = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        sessions = parsed
          .map((item, idx) => sanitizeSession(item, idx))
          .filter((s): s is SleepSession => s !== null)
          .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      }
    }
  } catch {
    sessions = [];
  }

  let babyName: string | undefined;
  let babyBirthDate: string | undefined;
  let scheduleBounds: SleepScheduleBounds | undefined;

  try {
    const cleanedName = normalizeBabyName(localStorage.getItem(BABY_NAME_STORAGE_KEY));
    if (cleanedName) babyName = cleanedName;

    const savedBirth = localStorage.getItem(BABY_BIRTH_DATE_STORAGE_KEY);
    if (isValidDateYYYYMMDD(savedBirth)) babyBirthDate = savedBirth;

    const rawBounds = localStorage.getItem(STORAGE_KEY_BOUNDS);
    if (rawBounds) {
      const parsedBounds = JSON.parse(rawBounds);
      if (isValidHHMM(parsedBounds?.dayStart) && isValidHHMM(parsedBounds?.nightStart)) {
        scheduleBounds = {
          dayStart: parsedBounds.dayStart,
          nightStart: parsedBounds.nightStart,
        };
      }
    }
  } catch {
    // ignore
  }

  return {
    app: 'toddler-sleep-assistant',
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    sessions,
    profile: {
      ...(babyName ? { babyName } : {}),
      ...(babyBirthDate ? { babyBirthDate } : {}),
      ...(scheduleBounds ? { scheduleBounds } : {}),
    },
  };
}

export async function exportBackupFile(
  shareTitle: string,
  shareText: string,
  dialogTitle: string
): Promise<'shared' | 'downloaded' | 'saved_documents' | 'cancelled'> {
  const payload = createBackupPayload();
  const jsonContent = JSON.stringify(payload, null, 2);
  const filename = `toddler-sleep-backup-${toLocalDateStr(new Date())}.json`;

  if (Capacitor.isNativePlatform()) {
    try {
      const writtenFile = await Filesystem.writeFile({
        path: filename,
        data: jsonContent,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });

      try {
        await Share.share({
          title: shareTitle,
          text: shareText,
          url: writtenFile.uri,
          dialogTitle,
        });
        return 'shared';
      } catch (shareErr) {
        const msg = String(shareErr ?? '').toLowerCase();
        if (msg.includes('cancel') || msg.includes('dismiss')) {
          return 'cancelled';
        }
        // Fallback: save directly to Documents folder if share dialog is unavailable
        await Filesystem.writeFile({
          path: filename,
          data: jsonContent,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });
        return 'saved_documents';
      }
    } catch {
      // Fall through to web download fallback
    }
  }

  // Web / browser download
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
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

export function parseAndValidateBackup(
  rawText: string
):
  | { ok: true; data: ToddlerSleepBackup }
  | { ok: false; reason: 'invalid_json' | 'invalid_format' } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return { ok: false, reason: 'invalid_json' };
  }

  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, reason: 'invalid_format' };
  }

  const obj = parsed as Record<string, unknown>;

  // Accept official backup schema OR plain array of sessions if exported manually
  const rawSessions = Array.isArray(parsed)
    ? parsed
    : Array.isArray(obj.sessions)
    ? obj.sessions
    : null;

  if (!rawSessions) {
    return { ok: false, reason: 'invalid_format' };
  }

  // If it's an object with a different app identifier, reject cleanly
  if (!Array.isArray(parsed) && obj.app !== undefined && obj.app !== 'toddler-sleep-assistant') {
    return { ok: false, reason: 'invalid_format' };
  }

  const validSessions = rawSessions
    .map((item, idx) => sanitizeSession(item, idx))
    .filter((s): s is SleepSession => s !== null)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  // Extract optional profile fields
  const rawProfile =
    !Array.isArray(parsed) && obj.profile && typeof obj.profile === 'object'
      ? (obj.profile as Record<string, unknown>)
      : {};

  const babyName =
    typeof rawProfile.babyName === 'string'
      ? normalizeBabyName(rawProfile.babyName) || undefined
      : undefined;
  const babyBirthDate = isValidDateYYYYMMDD(rawProfile.babyBirthDate)
    ? rawProfile.babyBirthDate
    : undefined;
  const rawBounds =
    rawProfile.scheduleBounds && typeof rawProfile.scheduleBounds === 'object'
      ? (rawProfile.scheduleBounds as Record<string, unknown>)
      : null;
  const scheduleBounds =
    rawBounds && isValidHHMM(rawBounds.dayStart) && isValidHHMM(rawBounds.nightStart)
      ? { dayStart: rawBounds.dayStart, nightStart: rawBounds.nightStart }
      : undefined;

  // Reject if file had zero valid sessions AND zero profile fields AND didn't declare our app tag
  const hasAppTag = !Array.isArray(parsed) && obj.app === 'toddler-sleep-assistant';
  if (!hasAppTag && validSessions.length === 0 && !babyName && !babyBirthDate && !scheduleBounds) {
    return { ok: false, reason: 'invalid_format' };
  }

  const exportedAt =
    !Array.isArray(parsed) &&
    typeof obj.exportedAt === 'string' &&
    !Number.isNaN(new Date(obj.exportedAt).getTime())
      ? obj.exportedAt
      : new Date().toISOString();

  return {
    ok: true,
    data: {
      app: 'toddler-sleep-assistant',
      schemaVersion: 1,
      exportedAt,
      sessions: validSessions,
      profile: {
        ...(babyName ? { babyName } : {}),
        ...(babyBirthDate ? { babyBirthDate } : {}),
        ...(scheduleBounds ? { scheduleBounds } : {}),
      },
    },
  };
}

export function applyBackupRestore(
  backup: ToddlerSleepBackup,
  mode: BackupImportMode
): BackupRestoreResult {
  let existingSessions: SleepSession[] = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        existingSessions = parsed
          .map((item, idx) => sanitizeSession(item, idx))
          .filter((s): s is SleepSession => s !== null);
      }
    }
  } catch {
    existingSessions = [];
  }

  let finalSessions: SleepSession[];
  let addedCount = 0;

  if (mode === 'replace') {
    finalSessions = [...backup.sessions].sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
    addedCount = finalSessions.length;
  } else {
    const existingIds = new Set(existingSessions.map((s) => s.id));
    const existingTimeKeys = new Set(
      existingSessions.map((s) => `${new Date(s.startTime).getTime()}|${new Date(s.endTime).getTime()}`)
    );

    const toAdd = backup.sessions.filter((s) => {
      const timeKey = `${new Date(s.startTime).getTime()}|${new Date(s.endTime).getTime()}`;
      if (existingIds.has(s.id) || existingTimeKeys.has(timeKey)) {
        return false;
      }
      existingIds.add(s.id);
      existingTimeKeys.add(timeKey);
      return true;
    });

    addedCount = toAdd.length;
    finalSessions = [...existingSessions, ...toAdd].sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  }

  const restoredProfile: BackupRestoreResult['restoredProfile'] = {};

  try {
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(finalSessions));

    const currentName = normalizeBabyName(localStorage.getItem(BABY_NAME_STORAGE_KEY));
    const currentBirth = localStorage.getItem(BABY_BIRTH_DATE_STORAGE_KEY) || '';
    const currentBoundsRaw = localStorage.getItem(STORAGE_KEY_BOUNDS);

    if (mode === 'replace') {
      if (backup.profile.babyName) {
        localStorage.setItem(BABY_NAME_STORAGE_KEY, backup.profile.babyName);
        restoredProfile.babyName = backup.profile.babyName;
      } else {
        localStorage.removeItem(BABY_NAME_STORAGE_KEY);
        restoredProfile.babyName = '';
      }

      if (backup.profile.babyBirthDate) {
        localStorage.setItem(BABY_BIRTH_DATE_STORAGE_KEY, backup.profile.babyBirthDate);
        restoredProfile.babyBirthDate = backup.profile.babyBirthDate;
      } else {
        localStorage.removeItem(BABY_BIRTH_DATE_STORAGE_KEY);
        restoredProfile.babyBirthDate = '';
      }

      if (backup.profile.scheduleBounds) {
        localStorage.setItem(STORAGE_KEY_BOUNDS, JSON.stringify(backup.profile.scheduleBounds));
        restoredProfile.scheduleBounds = backup.profile.scheduleBounds;
      }
    } else {
      // Merge mode: fill missing profile fields without overwriting existing parent choices
      if (!currentName && backup.profile.babyName) {
        localStorage.setItem(BABY_NAME_STORAGE_KEY, backup.profile.babyName);
        restoredProfile.babyName = backup.profile.babyName;
      }
      if (!currentBirth && backup.profile.babyBirthDate) {
        localStorage.setItem(BABY_BIRTH_DATE_STORAGE_KEY, backup.profile.babyBirthDate);
        restoredProfile.babyBirthDate = backup.profile.babyBirthDate;
      }
      if (!currentBoundsRaw && backup.profile.scheduleBounds) {
        localStorage.setItem(STORAGE_KEY_BOUNDS, JSON.stringify(backup.profile.scheduleBounds));
        restoredProfile.scheduleBounds = backup.profile.scheduleBounds;
      }
    }
  } catch {
    // ignore storage errors
  }

  const result: BackupRestoreResult = {
    totalSessionsAfter: finalSessions.length,
    addedCount,
    restoredProfile,
  };

  window.dispatchEvent(new CustomEvent(BACKUP_RESTORED_EVENT, { detail: result }));
  return result;
}

export interface BackupCopy {
  heading: string;
  savedCountBadge: (count: number) => string;
  plainExplanation: string;
  migrationHint: string;
  exportBtn: string;
  importBtn: string;
  shareTitle: string;
  shareText: string;
  shareDialogTitle: string;
  exportSuccessShared: string;
  exportSuccessDownloaded: string;
  exportSuccessSaved: string;
  exportError: string;
  importPreviewTitle: string;
  importPreviewRecords: (count: number) => string;
  importPreviewDate: (dateStr: string) => string;
  importPreviewChild: (name: string) => string;
  importMergeBtn: string;
  importMergeHint: string;
  importReplaceBtn: string;
  importCancelBtn: string;
  importSuccessMerge: (added: number, total: number) => string;
  importSuccessReplace: (total: number) => string;
  importErrorInvalid: string;
}

export function getBackupCopy(language: Language): BackupCopy {
  switch (language) {
    case 'sk':
      return {
        heading: 'Záloha a prenos dát',
        savedCountBadge: (n) => `${n} spánkov`,
        plainExplanation:
          'Export uloží celú históriu spánkov, meno, dátum narodenia a nastavené časy denného/nočného spánku do jedného malého súboru (.json). Môžete si ho bezpečne uložiť na Google Drive, do telefónu alebo poslať na e-mail.',
        migrationHint:
          'Pri prechode na nový telefón alebo reinštalácii stačí vybrať uložený súbor cez „Importovať zálohu“ a všetky záznamy sa hneď obnovia.',
        exportBtn: 'Exportovať zálohu',
        importBtn: 'Importovať zálohu',
        shareTitle: 'Záloha Toddler Sleep Assistant',
        shareText: 'Záloha histórie spánkov a profilu dieťatka (.json)',
        shareDialogTitle: 'Uložiť alebo zdieľať zálohu',
        exportSuccessShared: 'Záloha pripravená na uloženie alebo zdieľanie ✨',
        exportSuccessDownloaded: 'Záloha (.json) bola stiahnutá do zariadenia ✨',
        exportSuccessSaved: 'Záloha bola uložená do priečinka Dokumenty ✨',
        exportError: 'Nepodarilo sa vytvoriť zálohu. Skúste to prosím znova.',
        importPreviewTitle: 'Záloha pripravená na obnovu',
        importPreviewRecords: (n) => `Nájdených spánkov: ${n}`,
        importPreviewDate: (d) => `Vytvorené: ${d}`,
        importPreviewChild: (name) => `Dieťa: ${name}`,
        importMergeBtn: 'Zlúčiť s aktuálnymi (odporúčané)',
        importMergeHint: 'Doplní chýbajúce záznamy bez duplikátov, nič nevymaže.',
        importReplaceBtn: 'Nahradiť celú históriu',
        importCancelBtn: 'Zrušiť',
        importSuccessMerge: (added, total) => `Obnovené: pridaných ${added} spánkov (spolu ${total}) ✨`,
        importSuccessReplace: (total) => `História bola obnovená (${total} spánkov) ✨`,
        importErrorInvalid: 'Vybraný súbor nie je platná záloha z aplikácie Toddler Sleep Assistant (.json).',
      };
    case 'cs':
      return {
        heading: 'Záloha a přenos dat',
        savedCountBadge: (n) => `${n} spánků`,
        plainExplanation:
          'Export uloží celou historii spánků, jméno, datum narození a nastavené časy denního/nočního spánku do jednoho souboru (.json). Můžete si ho uložit na Google Drive, do telefonu nebo poslat e-mailem.',
        migrationHint:
          'Při přechodu na nový telefon nebo přeinstalaci stačí vybrat uložený soubor přes „Importovat zálohu“ a všechny záznamy se ihned obnoví.',
        exportBtn: 'Exportovat zálohu',
        importBtn: 'Importovat zálohu',
        shareTitle: 'Záloha Toddler Sleep Assistant',
        shareText: 'Záloha historie spánků a profilu děťátka (.json)',
        shareDialogTitle: 'Uložit nebo sdílet zálohu',
        exportSuccessShared: 'Záloha připravena k uložení nebo sdílení ✨',
        exportSuccessDownloaded: 'Záloha (.json) byla stažena do zařízení ✨',
        exportSuccessSaved: 'Záloha byla uložena do složky Dokumenty ✨',
        exportError: 'Nepodařilo se vytvořit zálohu. Zkuste to prosím znovu.',
        importPreviewTitle: 'Záloha připravena k obnově',
        importPreviewRecords: (n) => `Nalezených spánků: ${n}`,
        importPreviewDate: (d) => `Vytvořeno: ${d}`,
        importPreviewChild: (name) => `Dítě: ${name}`,
        importMergeBtn: 'Sloučit se stávajícími (doporučeno)',
        importMergeHint: 'Doplní chybějící záznamy bez duplikátů, nic nesmaže.',
        importReplaceBtn: 'Nahradit celou historii',
        importCancelBtn: 'Zrušit',
        importSuccessMerge: (added, total) => `Obnoveno: přidáno ${added} spánků (celkem ${total}) ✨`,
        importSuccessReplace: (total) => `Historie byla obnovena (${total} spánků) ✨`,
        importErrorInvalid: 'Vybraný soubor není platná záloha aplikace Toddler Sleep Assistant (.json).',
      };
    case 'en':
      return {
        heading: 'Backup & Data Transfer',
        savedCountBadge: (n) => `${n} sleeps`,
        plainExplanation:
          'Export saves your entire sleep history, child name, birth date, and day/night sleep hours into one small backup file (.json). Store it safely on Google Drive, in your phone Files, or email it to yourself.',
        migrationHint:
          'When switching to a new phone or reinstalling, simply pick that saved file via "Import Backup" to restore everything in seconds.',
        exportBtn: 'Export Backup',
        importBtn: 'Import Backup',
        shareTitle: 'Toddler Sleep Assistant Backup',
        shareText: 'Sleep history and baby profile backup (.json)',
        shareDialogTitle: 'Save or share backup',
        exportSuccessShared: 'Backup ready to save or share ✨',
        exportSuccessDownloaded: 'Backup (.json) downloaded to your device ✨',
        exportSuccessSaved: 'Backup saved to your Documents folder ✨',
        exportError: 'Could not create backup. Please try again.',
        importPreviewTitle: 'Backup ready to restore',
        importPreviewRecords: (n) => `Sleep records found: ${n}`,
        importPreviewDate: (d) => `Created: ${d}`,
        importPreviewChild: (name) => `Child: ${name}`,
        importMergeBtn: 'Merge with current (recommended)',
        importMergeHint: 'Adds missing records without duplicates and keeps existing ones.',
        importReplaceBtn: 'Replace all history',
        importCancelBtn: 'Cancel',
        importSuccessMerge: (added, total) => `Restored: added ${added} records (${total} total) ✨`,
        importSuccessReplace: (total) => `History restored (${total} records) ✨`,
        importErrorInvalid: 'The selected file is not a valid Toddler Sleep Assistant backup (.json).',
      };
    case 'pl':
      return {
        heading: 'Kopia zapasowa i przenoszenie danych',
        savedCountBadge: (n) => `${n} snów`,
        plainExplanation:
          'Eksport zapisuje całą historię snu, imię, datę urodzenia oraz godziny snu dziennego/nocnego w jednym pliku (.json). Możesz zapisać go na Dysku Google, w pamięci telefonu lub wysłać na e-mail.',
        migrationHint:
          'Przy zmianie telefonu lub ponownej instalacji wybierz zapisany plik przez „Importuj kopię”, aby od razu przywrócić wszystkie dane.',
        exportBtn: 'Eksportuj kopię',
        importBtn: 'Importuj kopię',
        shareTitle: 'Kopia Toddler Sleep Assistant',
        shareText: 'Kopia zapasowa historii snu i profilu dziecka (.json)',
        shareDialogTitle: 'Zapisz lub udostępnij kopię',
        exportSuccessShared: 'Kopia gotowa do zapisania lub udostępnienia ✨',
        exportSuccessDownloaded: 'Plik kopii (.json) został pobrany ✨',
        exportSuccessSaved: 'Kopia zapisana w folderze Dokumenty ✨',
        exportError: 'Nie udało się utworzyć kopii. Spróbuj ponownie.',
        importPreviewTitle: 'Kopia gotowa do przywrócenia',
        importPreviewRecords: (n) => `Znalezione wpisy snu: ${n}`,
        importPreviewDate: (d) => `Utworzono: ${d}`,
        importPreviewChild: (name) => `Dziecko: ${name}`,
        importMergeBtn: 'Połącz z obecnymi (zalecane)',
        importMergeHint: 'Dodaje brakujące wpisy bez duplikatów i nic nie usuwa.',
        importReplaceBtn: 'Zastąp całą historię',
        importCancelBtn: 'Anuluj',
        importSuccessMerge: (added, total) => `Przywrócono: dodano ${added} wpisów (łącznie ${total}) ✨`,
        importSuccessReplace: (total) => `Historia została przywrócona (${total} wpisów) ✨`,
        importErrorInvalid: 'Wybrany plik nie jest poprawną kopią z aplikacji Toddler Sleep Assistant (.json).',
      };
    case 'hu':
      return {
        heading: 'Biztonsági mentés és adatátvitel',
        savedCountBadge: (n) => `${n} alvás`,
        plainExplanation:
          'Az exportálás egyetlen kis fájlba (.json) menti a teljes alvástörténetet, a gyermek nevét, születési dátumát és a nappali/éjszakai időket. Elmentheted Google Drive-ra, telefonra vagy elküldheted e-mailben.',
        migrationHint:
          'Új telefonra váltáskor vagy újratelepítéskor válaszd ki a mentett fájlt a „Mentés importálása” gombbal, és minden adat azonnal visszatöltődik.',
        exportBtn: 'Mentés exportálása',
        importBtn: 'Mentés importálása',
        shareTitle: 'Toddler Sleep Assistant mentés',
        shareText: 'Alvástörténet és gyermekprofil mentése (.json)',
        shareDialogTitle: 'Mentés tárolása vagy megosztása',
        exportSuccessShared: 'A mentés kész a tárolásra vagy megosztásra ✨',
        exportSuccessDownloaded: 'A mentés (.json) letöltve a készülékre ✨',
        exportSuccessSaved: 'A mentés elmentve a Dokumentumok mappába ✨',
        exportError: 'Nem sikerült létrehozni a mentést. Próbáld újra.',
        importPreviewTitle: 'A mentés készen áll a visszaállításra',
        importPreviewRecords: (n) => `Talált alvásbejegyzések: ${n}`,
        importPreviewDate: (d) => `Létrehozva: ${d}`,
        importPreviewChild: (name) => `Gyermek: ${name}`,
        importMergeBtn: 'Összefésülés a meglévőkkel (ajánlott)',
        importMergeHint: 'Hozzáadja a hiányzó bejegyzéseket duplikáció nélkül.',
        importReplaceBtn: 'Teljes történet cseréje',
        importCancelBtn: 'Mégse',
        importSuccessMerge: (added, total) => `Visszaállítva: +${added} bejegyzés (összesen ${total}) ✨`,
        importSuccessReplace: (total) => `Alvástörténet visszaállítva (${total} bejegyzés) ✨`,
        importErrorInvalid: 'A kiválasztott fájl nem érvényes Toddler Sleep Assistant mentés (.json).',
      };
    case 'uk':
      return {
        heading: 'Резервна копія та перенесення даних',
        savedCountBadge: (n) => `${n} снів`,
        plainExplanation:
          'Експорт зберігає всю історію сну, ім’я, дату народження та налаштовані години денного/нічного сну в один невеликий файл (.json). Збережіть його на Google Диск, у файли телефону або надішліть собі на пошту.',
        migrationHint:
          'При переході на інший телефон або перевстановленні просто оберіть збережений файл через «Імпортувати копію» — усі дані миттєво відновляться.',
        exportBtn: 'Експортувати копію',
        importBtn: 'Імпортувати копію',
        shareTitle: 'Резервна копія Toddler Sleep Assistant',
        shareText: 'Резервна копія історії сну та профілю дитини (.json)',
        shareDialogTitle: 'Зберегти або поділитися копією',
        exportSuccessShared: 'Копію підготовлено для збереження або надсилання ✨',
        exportSuccessDownloaded: 'Файл копії (.json) завантажено на пристрій ✨',
        exportSuccessSaved: 'Копію збережено у папку «Документи» ✨',
        exportError: 'Не вдалося створити резервну копію. Спробуйте ще раз.',
        importPreviewTitle: 'Копія готова до відновлення',
        importPreviewRecords: (n) => `Знайдено записів сну: ${n}`,
        importPreviewDate: (d) => `Створено: ${d}`,
        importPreviewChild: (name) => `Дитина: ${name}`,
        importMergeBtn: 'Об’єднати з поточними (рекомендовано)',
        importMergeHint: 'Додає відсутні записи без дублікатів і нічого не видаляє.',
        importReplaceBtn: 'Замінити всю історію',
        importCancelBtn: 'Скасувати',
        importSuccessMerge: (added, total) => `Відновлено: додано ${added} записів (усього ${total}) ✨`,
        importSuccessReplace: (total) => `Історію відновлено (${total} записів) ✨`,
        importErrorInvalid: 'Обраний файл не є дійсною резервною копією Toddler Sleep Assistant (.json).',
      };
    case 'it':
      return {
        heading: 'Backup e trasferimento dati',
        savedCountBadge: (n) => `${n} sonni`,
        plainExplanation:
          'L’esportazione salva tutta la cronologia del sonno, il nome, la data di nascita e gli orari giorno/notte in un unico file (.json). Puoi salvarlo su Google Drive, nei File del telefono o inviartelo via e-mail.',
        migrationHint:
          'Quando cambi telefono o reinstalli l’app, seleziona quel file con «Importa backup» per ripristinare subito tutti i dati.',
        exportBtn: 'Esporta backup',
        importBtn: 'Importa backup',
        shareTitle: 'Backup Toddler Sleep Assistant',
        shareText: 'Backup della cronologia del sonno e del profilo (.json)',
        shareDialogTitle: 'Salva o condividi backup',
        exportSuccessShared: 'Backup pronto per il salvataggio o la condivisione ✨',
        exportSuccessDownloaded: 'Backup (.json) scaricato sul dispositivo ✨',
        exportSuccessSaved: 'Backup salvato nella cartella Documenti ✨',
        exportError: 'Impossibile creare il backup. Riprova.',
        importPreviewTitle: 'Backup pronto per il ripristino',
        importPreviewRecords: (n) => `Sessioni di sonno trovate: ${n}`,
        importPreviewDate: (d) => `Creato il: ${d}`,
        importPreviewChild: (name) => `Bambino: ${name}`,
        importMergeBtn: 'Unisci ai dati attuali (consigliato)',
        importMergeHint: 'Aggiunge le sessioni mancanti senza duplicati.',
        importReplaceBtn: 'Sostituisci tutta la cronologia',
        importCancelBtn: 'Annulla',
        importSuccessMerge: (added, total) => `Ripristinato: aggiunte ${added} sessioni (${total} totali) ✨`,
        importSuccessReplace: (total) => `Cronologia ripristinata (${total} sessioni) ✨`,
        importErrorInvalid: 'Il file selezionato non è un backup valido di Toddler Sleep Assistant (.json).',
      };
    case 'es':
      return {
        heading: 'Copia de seguridad y transferencia',
        savedCountBadge: (n) => `${n} sueños`,
        plainExplanation:
          'La exportación guarda todo el historial de sueño, nombre, fecha de nacimiento y horarios de día/noche en un solo archivo (.json). Guárdalo en Google Drive, en tu teléfono o envíatelo por correo.',
        migrationHint:
          'Al cambiar de teléfono o reinstalar la app, selecciona ese archivo en «Importar copia» para recuperar todos tus registros al instante.',
        exportBtn: 'Exportar copia',
        importBtn: 'Importar copia',
        shareTitle: 'Copia de Toddler Sleep Assistant',
        shareText: 'Copia de seguridad del historial de sueño (.json)',
        shareDialogTitle: 'Guardar o compartir copia',
        exportSuccessShared: 'Copia lista para guardar o compartir ✨',
        exportSuccessDownloaded: 'Copia (.json) descargada en tu dispositivo ✨',
        exportSuccessSaved: 'Copia guardada en la carpeta Documentos ✨',
        exportError: 'No se pudo crear la copia. Inténtalo de nuevo.',
        importPreviewTitle: 'Copia lista para restaurar',
        importPreviewRecords: (n) => `Registros de sueño encontrados: ${n}`,
        importPreviewDate: (d) => `Creada: ${d}`,
        importPreviewChild: (name) => `Bebé: ${name}`,
        importMergeBtn: 'Combinar con los actuales (recomendado)',
        importMergeHint: 'Añade los registros faltantes sin duplicados y sin borrar nada.',
        importReplaceBtn: 'Reemplazar todo el historial',
        importCancelBtn: 'Cancelar',
        importSuccessMerge: (added, total) => `Restaurado: +${added} registros (${total} en total) ✨`,
        importSuccessReplace: (total) => `Historial restaurado (${total} registros) ✨`,
        importErrorInvalid: 'El archivo seleccionado no es una copia válida de Toddler Sleep Assistant (.json).',
      };
    case 'ro':
      return {
        heading: 'Backup și transfer de date',
        savedCountBadge: (n) => `${n} somnuri`,
        plainExplanation:
          'Exportul salvează tot istoricul somnului, numele, data nașterii și orele de zi/noapte într-un singur fișier (.json). Îl poți salva în Google Drive, în fișierele telefonului sau trimite pe e-mail.',
        migrationHint:
          'Când treci pe un alt telefon sau reinstalezi aplicația, alege fișierul salvat prin „Importă backup” și toate datele se refac imediat.',
        exportBtn: 'Exportă backup',
        importBtn: 'Importă backup',
        shareTitle: 'Backup Toddler Sleep Assistant',
        shareText: 'Backup pentru istoricul somnului și profilul copilului (.json)',
        shareDialogTitle: 'Salvează sau distribuie backup',
        exportSuccessShared: 'Backup pregătit pentru salvare sau distribuire ✨',
        exportSuccessDownloaded: 'Fișierul de backup (.json) a fost descărcat ✨',
        exportSuccessSaved: 'Backup salvat în folderul Documente ✨',
        exportError: 'Nu s-a putut crea backupul. Încearcă din nou.',
        importPreviewTitle: 'Backup gata de restaurare',
        importPreviewRecords: (n) => `Sesiuni de somn găsite: ${n}`,
        importPreviewDate: (d) => `Creat: ${d}`,
        importPreviewChild: (name) => `Copil: ${name}`,
        importMergeBtn: 'Combină cu datele curente (recomandat)',
        importMergeHint: 'Adaugă înregistrările lipsă fără duplicate, fără a șterge nimic.',
        importReplaceBtn: 'Înlocuiește tot istoricul',
        importCancelBtn: 'Anulează',
        importSuccessMerge: (added, total) => `Restaurat: +${added} sesiuni (${total} total) ✨`,
        importSuccessReplace: (total) => `Istoricul a fost restaurat (${total} sesiuni) ✨`,
        importErrorInvalid: 'Fișierul ales nu este un backup valid din Toddler Sleep Assistant (.json).',
      };
    case 'ar':
      return {
        heading: 'النسخ الاحتياطي ونقل البيانات',
        savedCountBadge: (n) => `${n} جلسة`,
        plainExplanation:
          'يحفظ التصدير كامل سجل النوم واسم الطفل وتاريخ ميلاده وأوقات النوم النهاري والليلي في ملف واحد صغير (.json). يمكنك حفظه بأمان على Google Drive أو في ملفات الهاتف أو إرساله لبريدك.',
        migrationHint:
          'عند الانتقال إلى هاتف جديد أو إعادة تثبيت التطبيق، اختر هذا الملف عبر «استيراد نسخة احتياطية» لاستعادة كل السجلات فوراً.',
        exportBtn: 'تصدير نسخة احتياطية',
        importBtn: 'استيراد نسخة احتياطية',
        shareTitle: 'نسخة احتياطية – Toddler Sleep Assistant',
        shareText: 'نسخة احتياطية لسجل النوم وملف الطفل (.json)',
        shareDialogTitle: 'حفظ أو مشاركة النسخة الاحتياطية',
        exportSuccessShared: 'النسخة الاحتياطية جاهزة للحفظ أو المشاركة ✨',
        exportSuccessDownloaded: 'تم تنزيل ملف النسخة الاحتياطية (.json) ✨',
        exportSuccessSaved: 'تم حفظ النسخة الاحتياطية في مجلد المستندات ✨',
        exportError: 'تعذّر إنشاء النسخة الاحتياطية. يرجى المحاولة مجدداً.',
        importPreviewTitle: 'النسخة الاحتياطية جاهزة للاستعادة',
        importPreviewRecords: (n) => `سجلات النوم الموجودة: ${n}`,
        importPreviewDate: (d) => `تاريخ الإنشاء: ${d}`,
        importPreviewChild: (name) => `الطفل: ${name}`,
        importMergeBtn: 'دمج مع السجلات الحالية (موصى به)',
        importMergeHint: 'يضيف السجلات الناقصة دون تكرار ودون حذف أي بيانات.',
        importReplaceBtn: 'استبدال السجل بالكامل',
        importCancelBtn: 'إلغاء',
        importSuccessMerge: (added, total) => `تمت الاستعادة: أُضيف ${added} سجل (الإجمالي ${total}) ✨`,
        importSuccessReplace: (total) => `تمت استعادة السجل بالكامل (${total} سجل) ✨`,
        importErrorInvalid: 'الملف المختار ليس نسخة احتياطية صالحة من التطبيق (.json).',
      };
  }
}
