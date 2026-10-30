import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Moon,
  Sun,
  Plus,
  Trash2,
  Share2,
  FileSpreadsheet,
  Copy,
  Check,
  ChevronDown,
  Sparkles,
  Info,
  Heart,
  TrendingUp,
} from 'lucide-react';
import { Language, SleepSession, SleepQuality, SleepType } from '../types';
import { translations } from '../i18n/translations';
import { triggerHaptic } from '../utils/haptics';

interface ScheduleAssistantModeProps {
  language: Language;
}

const STORAGE_KEY_SESSIONS = 'toddler_sleep_sessions';
const STORAGE_KEY_ACTIVE_SLEEP = 'toddler_active_sleep_start';

export const ScheduleAssistantMode: React.FC<ScheduleAssistantModeProps> = ({ language }) => {
  const t = translations[language];

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
        notes: 'Zaspal rýchlo po prechádzke na čerstvom vzduchu',
      },
      {
        id: 'sample-2',
        startTime: `${yesterdayStr}T20:00:00`,
        endTime: `${todayStr}T06:30:00`,
        durationMinutes: 630,
        type: 'night-sleep',
        quality: 'normal',
        notes: 'Jedno nočné zobudenie na čajík',
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

  // Export card collapsible state (collapsed by default to description)
  const [isExportExpanded, setIsExportExpanded] = useState(false);

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
    showToast(language === 'sk' ? 'Spánok sa začal zaznamenávať 🌙' : 'Sleep tracking started 🌙');
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
    showToast(language === 'sk' ? 'Spánok bol úspešne uložený! ✨' : 'Sleep session saved! ✨');
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
    showToast(language === 'sk' ? 'Záznam pridaný do histórie' : 'Session added to history');
  };

  // Delete a session
  const handleDeleteSession = (id: string) => {
    triggerHaptic('light');
    setSessions((prev) => prev.filter((s) => s.id !== id));
    showToast(language === 'sk' ? 'Záznam vymazaný' : 'Session removed');
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
  const todayDateStr = new Date().toISOString().split('T')[0];
  const todaySessions = sessions.filter((s) => s.startTime.startsWith(todayDateStr));
  const todayTotalMins = todaySessions.reduce((acc, curr) => acc + curr.durationMinutes, 0);
  const todayNapSessions = todaySessions.filter((s) => s.type === 'day-nap');
  const todayNightSessions = todaySessions.filter((s) => s.type === 'night-sleep');
  const todayNapMins = todayNapSessions.reduce((acc, curr) => acc + curr.durationMinutes, 0);
  const todayNightMins = todayNightSessions.reduce((acc, curr) => acc + curr.durationMinutes, 0);
  const todayAvgMins = todaySessions.length > 0 ? Math.round(todayTotalMins / todaySessions.length) : 0;

  // 4. Export for Google Drive / Sheets (CSV with UTF-8 BOM)
  const handleExportCSV = async () => {
    triggerHaptic('medium');

    const headers = [
      'Dátum',
      'Čas začiatku',
      'Čas konca',
      'Trvanie (minúty)',
      'Trvanie (formát)',
      'Typ spánku',
      'Kvalita spánku',
      'Poznámka',
    ];

    const rows = sessions.map((s) => {
      const startDate = new Date(s.startTime);
      const endDate = new Date(s.endTime);
      const dateStr = startDate.toLocaleDateString('sk-SK');
      const startStr = startDate.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });
      const endStr = endDate.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });
      const durationFmt = formatDuration(s.durationMinutes);
      const typeStr = s.type === 'day-nap' ? 'Denný spánok' : 'Nočný spánok';
      const qualityMap: Record<SleepQuality, string> = {
        peaceful: 'Kľudný',
        normal: 'Normálny',
        restless: 'Nepokojný',
      };
      const noteClean = (s.notes || '').replace(/"/g, '""');

      return [
        `"${dateStr}"`,
        `"${startStr}"`,
        `"${endStr}"`,
        s.durationMinutes,
        `"${durationFmt}"`,
        `"${typeStr}"`,
        `"${qualityMap[s.quality] || s.quality}"`,
        `"${noteClean}"`,
      ].join(',');
    });

    // Prepend UTF-8 BOM (\uFEFF) so Google Sheets, Excel & Google Drive handle diacritics natively
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const filename = `detsky-spankovy-rezim-${todayDateStr}.csv`;

    // Try Web Share API (native on phones: directly shows "Google Drive", Gmail, Files, etc.)
    let shared = false;
    try {
      if (typeof navigator !== 'undefined' && 'share' in navigator && 'canShare' in navigator) {
        const file = new File([blob], filename, { type: 'text/csv' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Detský spánkový režim - Export',
            text: 'Záznamy spánkového režimu pre Google Drive / Tabuľky',
            files: [file],
          });
          shared = true;
          showToast(language === 'sk' ? 'Zdieľané do Google Drive / aplikácie' : 'Export shared');
        }
      }
    } catch {
      shared = false;
    }

    // Direct browser download fallback if share wasn't used or dismissed
    if (!shared) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(
        language === 'sk'
          ? 'CSV stiahnuté – pripravené pre Google Drive / Tabuľky'
          : 'CSV downloaded – ready for Google Drive / Sheets'
      );
    }
  };

  // Copy quick summary to clipboard
  const handleCopySummary = () => {
    triggerHaptic('light');
    const summaryLines = [
      `📊 Súhrn spánkového režimu (${todayDateStr})`,
      `Dnes celkovo: ${formatDuration(todayTotalMins)} (${todaySessions.length} spánkov)`,
      '',
      'Posledné záznamy:',
      ...sessions.slice(0, 5).map((s) => {
        const d = new Date(s.startTime).toLocaleDateString('sk-SK');
        const st = new Date(s.startTime).toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });
        const et = new Date(s.endTime).toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });
        return `• ${d} [${st} – ${et}] ${formatDuration(s.durationMinutes)} (${s.type === 'day-nap' ? 'Denný' : 'Nočný'})${s.notes ? ` - ${s.notes}` : ''}`;
      }),
    ];

    navigator.clipboard.writeText(summaryLines.join('\n')).then(() => {
      showToast(language === 'sk' ? 'Súhrn skopírovaný do schránky' : 'Summary copied to clipboard');
    });
  };

  return (
    <div className="w-full flex flex-col gap-4 select-none pb-4">
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-slate-950 font-bold px-4 py-2 rounded-2xl shadow-2xl text-xs flex items-center gap-2 border border-emerald-300 animate-in fade-in slide-in-from-top-4">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero: Active Live Tracker Card */}
      <div className="relative rounded-3xl p-5 border border-indigo-500/30 bg-gradient-to-br from-indigo-950/60 via-slate-900/90 to-purple-950/40 shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-44 h-44 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>{language === 'sk' ? 'Aktuálny stav' : 'Current Status'}</span>
          </div>

          {activeSleepStart ? (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              {language === 'sk' ? 'Dieťatko spí' : 'Baby is sleeping'}
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/10 text-white/70 border border-white/10 flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-300" />
              {language === 'sk' ? 'Bdie' : 'Awake'}
            </span>
          )}
        </div>

        {/* Live timer display or Idle status */}
        {activeSleepStart ? (
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <span className="text-xs text-indigo-200/70 mb-1">
              {language === 'sk' ? 'Zaspalo o' : 'Fell asleep at'}{' '}
              {new Date(activeSleepStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-mono drop-shadow">
              {formatLiveClock(activeElapsedSec)}
            </div>
            <p className="text-[11px] text-white/50 mt-1 max-w-xs">
              {language === 'sk'
                ? 'Časovač beží na pozadí, pokojne môžete aplikáciu zatvoriť.'
                : 'Timer keeps running in background even if you switch apps.'}
            </p>

            <button
              onClick={handleBabyWokeUp}
              className="mt-5 w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 active:scale-95 touch-manipulation transition-all"
            >
              <Sun className="w-5 h-5 fill-slate-950" />
              <span>{language === 'sk' ? 'Dieťatko sa zobudilo' : 'Baby woke up'}</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col py-1">
            <h2 className="text-lg font-bold text-white tracking-wide">
              {language === 'sk' ? 'Zaznamenať spánok jedným ťuknutím' : 'One-tap Sleep Tracker'}
            </h2>
            <p className="text-xs text-white/60 mt-0.5 mb-4">
              {language === 'sk'
                ? 'Hneď ako uložíte dieťatko, spustite stopky spánku.'
                : 'Start the sleep timer as soon as baby falls asleep.'}
            </p>

            <button
              onClick={handleBabyFellAsleep}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 active:scale-95 touch-manipulation transition-all"
            >
              <Moon className="w-5 h-5 fill-indigo-200" />
              <span>{language === 'sk' ? 'Dieťatko práve zaspalo' : 'Baby just fell asleep'}</span>
            </button>
          </div>
        )}

        {/* Wake Window & Pediatric Sweet Spot Tip */}
        {!activeSleepStart && wakeWindowMins !== null && (
          <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-white/70">
              <Clock className="w-3.5 h-3.5 text-indigo-300" />
              <span>{language === 'sk' ? 'Bdelé okno:' : 'Wake window:'}</span>
              <strong className="text-white font-semibold">{formatDuration(wakeWindowMins)}</strong>
            </div>

            <span className="text-[10px] text-white/50 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
              {language === 'sk' ? 'Od posledného spánku' : 'Since last sleep'}
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
                {language === 'sk' ? 'Dnes naspaté' : 'Today total'}
              </span>
              <span className="text-base sm:text-lg font-bold text-white tracking-tight truncate block">
                {todayTotalMins > 0 ? formatDuration(todayTotalMins) : '0 min'}
              </span>
            </div>
          </div>

          {/* Stat 2: Dnešné spánky */}
          <div className="flex items-center gap-3 min-w-0 pl-2 sm:pl-3 border-l border-white/10">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-400/25 text-purple-300 flex items-center justify-center shrink-0 shadow-sm">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase tracking-wider text-white/50 block font-semibold truncate">
                {language === 'sk' ? 'Dnešné spánky' : 'Naps today'}
              </span>
              <span className="text-base sm:text-lg font-bold text-white tracking-tight truncate block">
                {todaySessions.length}{' '}
                <span className="text-xs font-normal text-white/50">
                  {language === 'sk' ? 'záznamy' : 'sessions'}
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
                {language === 'sk' ? 'Denný spánok' : 'Day nap'}
              </span>
              <span className="font-semibold text-white/80">
                {formatDuration(todayNapMins)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-white/40">
                {language === 'sk' ? 'Nočný spánok' : 'Night sleep'}
              </span>
              <span className="font-semibold text-white/80">
                {formatDuration(todayNightMins)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-white/40">
                {language === 'sk' ? 'Priemer' : 'Average'}
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
            <span>{language === 'sk' ? 'Pridať spánok ručne' : 'Add sleep session manually'}</span>
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
                  {language === 'sk' ? 'Dátum' : 'Date'}
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
                  {language === 'sk' ? 'Od' : 'Start'}
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
                  {language === 'sk' ? 'Do' : 'End'}
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
                <span>{language === 'sk' ? 'Denný spánok' : 'Day nap'}</span>
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
                <span>{language === 'sk' ? 'Nočný spánok' : 'Night sleep'}</span>
              </button>
            </div>

            {/* Quality selector */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-white/50 block mb-1">
                {language === 'sk' ? 'Kvalita spánku' : 'Sleep quality'}
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                {(['peaceful', 'normal', 'restless'] as SleepQuality[]).map((q) => {
                  const labels = {
                    peaceful: language === 'sk' ? '🌿 Kľudný' : '🌿 Calm',
                    normal: language === 'sk' ? '😴 Normálny' : '😴 Normal',
                    restless: language === 'sk' ? '🌪️ Nepokojný' : '🌪️ Restless',
                  };
                  return (
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
                      {labels[q]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional note */}
            <div>
              <input
                type="text"
                placeholder={language === 'sk' ? 'Poznámka (voliteľné, napr. zúbky)' : 'Note (optional)'}
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
              {language === 'sk' ? 'Uložiť záznam' : 'Save session'}
            </button>
          </form>
        )}
      </div>

      {/* Export Section for Google Drive / Sheets - Collapsible (truncated to description with arrow) */}
      <div className="rounded-3xl bg-slate-900/60 border border-white/10 overflow-hidden transition-all duration-300">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setIsExportExpanded(!isExportExpanded);
          }}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 active:bg-white/10 transition-colors select-none"
          aria-expanded={isExportExpanded}
        >
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-white truncate">
                {language === 'sk' ? 'Export do Google Drive & Tabuliek' : 'Export to Google Drive / Sheets'}
              </h3>
              <p className="text-[11px] text-white/50 truncate mt-0.5">
                {language === 'sk'
                  ? 'Stiahnite alebo zdieľajte dáta vo formáte CSV'
                  : 'Download or share sessions as CSV'}
              </p>
            </div>
          </div>

          <div
            className={`w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-white/60 transition-transform duration-300 shrink-0 ${
              isExportExpanded ? 'rotate-180 bg-white/10 text-white' : ''
            }`}
          >
            <ChevronDown className="w-4 h-4" />
          </div>
        </button>

        {isExportExpanded && (
          <div className="px-4 pb-4 pt-1 flex flex-col gap-3 border-t border-white/5 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2 mt-1">
              <button
                type="button"
                onClick={handleExportCSV}
                className="flex-1 py-2.5 px-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/40 active:scale-95 transition-all"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{language === 'sk' ? 'Exportovať (CSV)' : 'Export (CSV)'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopySummary}
                className="py-2.5 px-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-medium text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                title={language === 'sk' ? 'Kopírovať súhrn' : 'Copy summary'}
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{language === 'sk' ? 'Súhrn' : 'Summary'}</span>
              </button>
            </div>

            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-white/5 border border-white/5 text-[10px] text-white/50 leading-relaxed">
              <Info className="w-3.5 h-3.5 shrink-0 text-emerald-400 mt-0.5" />
              <span>
                {language === 'sk'
                  ? 'Vygenerovaný súbor CSV obsahuje UTF-8 diakritiku a dá sa priamo nahrať na Google Drive alebo otvoriť v Google Tabuľkách.'
                  : 'Exported CSV includes UTF-8 encoding and can be opened directly in Google Drive or Google Sheets.'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* History List */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/60">
            {language === 'sk' ? 'História spánkov' : 'Sleep History'} ({sessions.length})
          </h3>
          {sessions.length > 0 && (
            <span className="text-[11px] text-white/40">
              {language === 'sk' ? 'Najnovšie hore' : 'Latest first'}
            </span>
          )}
        </div>

        {sessions.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/40 border border-white/5 text-center text-white/40 text-xs">
            {language === 'sk'
              ? 'Zatiaľ nemáte zaznamenaný žiadny spánok. Ťuknite vyššie na "Dieťatko práve zaspalo".'
              : 'No sleep sessions recorded yet. Tap "Baby just fell asleep" above.'}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {sessions.map((s) => {
              const startDate = new Date(s.startTime);
              const endDate = new Date(s.endTime);
              const dateStr = startDate.toLocaleDateString(language === 'sk' ? 'sk-SK' : undefined, {
                day: 'numeric',
                month: 'short',
              });
              const startStr = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const endStr = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              const qualityLabels = {
                peaceful: language === 'sk' ? '🌿 Kľudný' : '🌿 Calm',
                normal: language === 'sk' ? '😴 Normálny' : '😴 Normal',
                restless: language === 'sk' ? '🌪️ Nepokojný' : '🌪️ Restless',
              };

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
                        <span>{qualityLabels[s.quality] || s.quality}</span>
                        {s.notes && (
                          <>
                            <span>·</span>
                            <span className="italic truncate text-white/60">"{s.notes}"</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteSession(s.id)}
                    className="p-2 rounded-xl text-white/30 hover:text-red-400 hover:bg-red-500/10 active:scale-95 transition-all shrink-0"
                    title={language === 'sk' ? 'Vymazať' : 'Delete'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
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
                <span>{language === 'sk' ? 'Uložiť prebudenie' : 'Save wake up'}</span>
              </h3>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/10 text-white font-bold">
                {formatDuration(pendingEndSession.durationMin)}
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {/* Type */}
              <div>
                <label className="text-[10px] uppercase tracking-wider text-white/50 block mb-1">
                  {language === 'sk' ? 'Typ spánku' : 'Sleep type'}
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
                    <span>{language === 'sk' ? 'Denný spánok' : 'Day nap'}</span>
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
                    <span>{language === 'sk' ? 'Nočný spánok' : 'Night sleep'}</span>
                  </button>
                </div>
              </div>

              {/* Quality */}
              <div>
                <label className="text-[10px] uppercase tracking-wider text-white/50 block mb-1">
                  {language === 'sk' ? 'Ako dieťatko spalo?' : 'How was the sleep?'}
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {(['peaceful', 'normal', 'restless'] as SleepQuality[]).map((q) => {
                    const labels = {
                      peaceful: language === 'sk' ? '🌿 Kľudný' : '🌿 Calm',
                      normal: language === 'sk' ? '😴 Normálny' : '😴 Normal',
                      restless: language === 'sk' ? '🌪️ Nepokojný' : '🌪️ Restless',
                    };
                    return (
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
                        {labels[q]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-[10px] uppercase tracking-wider text-white/50 block mb-1">
                  {language === 'sk' ? 'Poznámka (voliteľné)' : 'Note (optional)'}
                </label>
                <input
                  type="text"
                  placeholder={language === 'sk' ? 'Napr. bez nočného budenia' : 'e.g. slept peacefully'}
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
                {language === 'sk' ? 'Zahodiť' : 'Discard'}
              </button>

              <button
                type="button"
                onClick={handleSaveLiveSession}
                className="flex-1 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-950/40 active:scale-95 transition-all"
              >
                {language === 'sk' ? 'Uložiť do histórie' : 'Save to history'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
