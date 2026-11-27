import React, { useState, useEffect, useRef } from 'react';
import { Moon, Bell, X } from 'lucide-react';
import { ClockHeader } from './components/ClockHeader';
import { MainMenu } from './components/MainMenu';
import { CalmLightMode } from './components/CalmLightMode';
import { WhiteNoiseMode } from './components/WhiteNoiseMode';
import { NatureSoundsMode } from './components/NatureSoundsMode';
import { ScheduleAssistantMode } from './components/ScheduleAssistantMode';
import { SleepTimerControls } from './components/SleepTimerControls';
import { FullScreenLamp } from './components/FullScreenLamp';
import { SettingsModal } from './components/SettingsModal';
import { TouchLockOverlay } from './components/TouchLockOverlay';
import { LanguageOnboardingModal } from './components/LanguageOnboardingModal';
import { ChangelogModal } from './components/ChangelogModal';
import { AuthorModal } from './components/AuthorModal';
import { getPalettes } from './constants/palettes';
import { translations } from './i18n/translations';
import { soundEngine } from './services/soundEngine';
import { isHapticsEnabled, setHapticsEnabled, triggerHaptic } from './utils/haptics';
import { BABY_NAME_STORAGE_KEY, normalizeBabyName } from './utils/babyName';
import { BABY_BIRTH_DATE_STORAGE_KEY } from './utils/wakeWindow';
import {
  LOCKSCREEN_SLEEP_STORAGE_KEY,
  requestLockScreenSleepPermission,
  syncLockScreenOngoingSleep,
} from './services/lockScreenSleep';
import { BACKUP_RESTORED_EVENT } from './utils/backupData';
import {
  SESSIONS_UPDATED_EVENT,
  ScheduledWakeReminderInfo,
  WAKE_REMINDER_ENABLED_KEY,
  WAKE_REMINDER_LEAD_MINS_KEY,
  WAKE_REMINDER_TRIGGERED_EVENT,
  WakeReminderBannerPayload,
  WakeReminderLeadMins,
  readWakeReminderEnabled,
  readWakeReminderLeadMins,
  requestWakeReminderPermission,
  syncWakeWindowReminder,
} from './services/wakeWindowReminder';
import {
  AppMode,
  WhiteNoiseLevel,
  NatureSoundType,
  LightPalette,
  LightSpeed,
  NightModeState,
  Language,
  ColorMode,
} from './types';

interface LastActiveConfig {
  light: boolean;
  soundType: 'none' | 'white-noise' | 'nature';
  whiteNoiseLevel: WhiteNoiseLevel;
  natureSound: NatureSoundType;
}

export default function App() {
  // First-run onboarding check: if not configured, show language selection screen (defaulted in English)
  const [isFirstRun, setIsFirstRun] = useState<boolean>(() => {
    try {
      return localStorage.getItem('toddler_lang_configured') !== 'true';
    } catch {
      return false;
    }
  });

  // Modals for Changelog and Author Info
  const [isChangelogOpen, setIsChangelogOpen] = useState<boolean>(false);
  const [isAuthorOpen, setIsAuthorOpen] = useState<boolean>(false);

  // Language Personalization (First run defaults to English, persists once chosen)
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const configured = localStorage.getItem('toddler_lang_configured');
      const saved = localStorage.getItem('toddler_lang') as Language;
      const validLangs: Language[] = ['en', 'sk', 'cs', 'pl', 'hu', 'uk', 'it', 'es', 'ro', 'ar'];
      if (configured === 'true' && validLangs.includes(saved)) {
        return saved;
      }
      return 'en';
    } catch {
      return 'en';
    }
  });

  // Child's name personalization (persists in localStorage, editable in Onboarding & Settings)
  const [babyName, setBabyName] = useState<string>(() => {
    try {
      return normalizeBabyName(localStorage.getItem(BABY_NAME_STORAGE_KEY));
    } catch {
      return '';
    }
  });

  const handleChangeBabyName = (rawName: string) => {
    const trimmedMax = rawName.slice(0, 24);
    setBabyName(trimmedMax);
    try {
      const cleaned = normalizeBabyName(trimmedMax);
      if (cleaned) {
        localStorage.setItem(BABY_NAME_STORAGE_KEY, cleaned);
      } else {
        localStorage.removeItem(BABY_NAME_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  };

  // Child's birth date for age-based optimal wake window alerts (YYYY-MM-DD)
  const [babyBirthDate, setBabyBirthDate] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(BABY_BIRTH_DATE_STORAGE_KEY);
      if (saved && /^\d{4}-\d{2}-\d{2}$/.test(saved)) return saved;
    } catch {
      // ignore
    }
    return '';
  });

  const handleChangeBabyBirthDate = (nextDate: string) => {
    const cleaned = /^\d{4}-\d{2}-\d{2}$/.test(nextDate) ? nextDate : '';
    setBabyBirthDate(cleaned);
    try {
      if (cleaned) {
        localStorage.setItem(BABY_BIRTH_DATE_STORAGE_KEY, cleaned);
      } else {
        localStorage.removeItem(BABY_BIRTH_DATE_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  };

  // Android lock-screen ongoing sleep timer notification toggle (enabled by default)
  const [lockScreenSleepEnabled, setLockScreenSleepEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(LOCKSCREEN_SLEEP_STORAGE_KEY);
      if (saved === 'false') return false;
    } catch {
      // ignore
    }
    return true;
  });

  const handleToggleLockScreenSleep = (enabled: boolean) => {
    setLockScreenSleepEnabled(enabled);
    try {
      localStorage.setItem(LOCKSCREEN_SLEEP_STORAGE_KEY, enabled ? 'true' : 'false');
    } catch {
      // ignore
    }
    if (enabled) {
      void requestLockScreenSleepPermission();
    }
  };

  // Silent offline wake-window reminder notification settings
  const [wakeReminderEnabled, setWakeReminderEnabled] = useState<boolean>(() =>
    readWakeReminderEnabled()
  );
  const [wakeReminderLeadMins, setWakeReminderLeadMins] = useState<WakeReminderLeadMins>(() =>
    readWakeReminderLeadMins()
  );
  const [scheduledWakeReminder, setScheduledWakeReminder] =
    useState<ScheduledWakeReminderInfo | null>(null);
  const [wakeReminderBanner, setWakeReminderBanner] =
    useState<WakeReminderBannerPayload | null>(null);
  const [sessionsSyncTick, setSessionsSyncTick] = useState<number>(0);

  const handleToggleWakeReminder = (enabled: boolean) => {
    setWakeReminderEnabled(enabled);
    try {
      localStorage.setItem(WAKE_REMINDER_ENABLED_KEY, enabled ? 'true' : 'false');
    } catch {
      // ignore
    }
    if (enabled) {
      void requestWakeReminderPermission().then(() => {
        setSessionsSyncTick((n) => n + 1);
      });
    }
  };

  const handleChangeWakeReminderLeadMins = (mins: WakeReminderLeadMins) => {
    setWakeReminderLeadMins(mins);
    try {
      localStorage.setItem(WAKE_REMINDER_LEAD_MINS_KEY, String(mins));
    } catch {
      // ignore
    }
  };

  // Sync HTML document direction (RTL for Arabic) and lang attribute
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const handleSelectLanguage = (lang: Language) => {
    setLanguage(lang);
    try {
      localStorage.setItem('toddler_lang', lang);
      localStorage.setItem('toddler_lang_configured', 'true');
    } catch {
      // ignore
    }
    // Update active palette with localized strings
    const newPalettes = getPalettes(lang);
    setSelectedPalette((prev) => {
      const found = newPalettes.find((p) => p.id === prev.id);
      if (found) {
        if (prev.id === 'custom-spectrum') {
          return { ...found, colors: prev.colors };
        }
        return found;
      }
      return newPalettes[0];
    });
  };

  const handleConfirmOnboarding = (
    lang: Language,
    initialBabyName: string,
    initialBirthDate?: string
  ) => {
    handleSelectLanguage(lang);
    handleChangeBabyName(initialBabyName);
    if (initialBirthDate) {
      handleChangeBabyBirthDate(initialBirthDate);
    }
    setIsFirstRun(false);
  };

  // Navigation: Starts at 'menu' (Modes only start working after user taps them from main menu)
  const [activeMode, setActiveMode] = useState<AppMode>('menu');

  // Components Opacity state (5% to 100%, safely initialized and validated)
  const [componentsOpacity, setComponentsOpacity] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('toddler_components_opacity');
      if (saved !== null && saved !== '' && saved !== 'NaN') {
        const num = Number(saved);
        if (Number.isFinite(num) && !isNaN(num)) {
          return Math.max(5, Math.min(100, Math.round(num)));
        }
      }
    } catch {
      // ignore
    }
    return 100;
  });

  const handleUpdateComponentsOpacity = (val: number) => {
    const num = Number(val);
    const safeVal = Number.isFinite(num) && !isNaN(num)
      ? Math.max(5, Math.min(100, Math.round(num)))
      : 100;
    setComponentsOpacity(safeVal);
    try {
      localStorage.setItem('toddler_components_opacity', safeVal.toString());
    } catch {
      // ignore
    }
  };

  // Full Screen Sleep Dimming after timer completion (dim completely to minimum until screen is touched)
  const [isSleepDimmed, setIsSleepDimmed] = useState<boolean>(false);

  // Mode 1: Calm Light State
  const [isLightOn, setIsLightOn] = useState<boolean>(false);
  const [selectedPalette, setSelectedPalette] = useState<LightPalette>(() => {
    try {
      const savedPaletteId = localStorage.getItem('toddler_active_palette_id');
      const all = getPalettes(language);
      if (savedPaletteId) {
        const found = all.find((p) => p.id === savedPaletteId);
        if (found) return found;
      }
    } catch {
      // ignore
    }
    return getPalettes(language)[0];
  });

  const handleSelectPalette = (palette: LightPalette) => {
    setSelectedPalette(palette);
    try {
      localStorage.setItem('toddler_active_palette_id', palette.id);
    } catch {
      // ignore
    }
  };

  const [lightSpeed, setLightSpeed] = useState<LightSpeed>('slow');
  const [brightness, setBrightness] = useState<number>(() => {
    try {
      const savedNightMode = localStorage.getItem('toddler_night_mode');
      if (savedNightMode) {
        const parsed = JSON.parse(savedNightMode);
        const hour = new Date().getHours();
        const isDark = parsed.forceDark || (parsed.isAutoSunset && (hour >= 18 || hour < 7));
        if (isDark) {
          const savedNightB = Number(localStorage.getItem('toddler_night_brightness'));
          return Number.isFinite(savedNightB) && savedNightB >= 10 && savedNightB <= 100 ? savedNightB : 25;
        }
      }
      const savedDayB = Number(localStorage.getItem('toddler_day_brightness'));
      if (Number.isFinite(savedDayB) && savedDayB >= 10 && savedDayB <= 100) return savedDayB;
    } catch {}
    return 80;
  });

  const handleUpdateBrightness = (val: number) => {
    const num = Math.max(10, Math.min(100, Math.round(val)));
    setBrightness(num);
    try {
      const hour = new Date().getHours();
      const isDark = nightMode.forceDark || (nightMode.isAutoSunset && (hour >= 18 || hour < 7));
      if (isDark) {
        localStorage.setItem('toddler_night_brightness', num.toString());
      } else {
        localStorage.setItem('toddler_day_brightness', num.toString());
      }
    } catch {}
  };
  const [isFullScreenLamp, setIsFullScreenLamp] = useState<boolean>(false);
  const [lightColorIndex, setLightColorIndex] = useState<number>(0);

  // Speed timings in milliseconds for Calm Light color shifting
  const speedDurations: Record<LightSpeed, number> = {
    'very-slow': 16000,
    slow: 9000,
    medium: 5000,
    breathing: 6000,
  };

  useEffect(() => {
    if (!isLightOn) return;
    const interval = setInterval(() => {
      setLightColorIndex((prev) => (prev + 1) % selectedPalette.colors.length);
    }, speedDurations[lightSpeed]);
    return () => clearInterval(interval);
  }, [isLightOn, lightSpeed, selectedPalette]);

  const activeLightColor =
    selectedPalette.colors[lightColorIndex % selectedPalette.colors.length] ||
    selectedPalette.colors[0] ||
    '#f97316';
  const nextLightColor =
    selectedPalette.colors[(lightColorIndex + 1) % selectedPalette.colors.length] ||
    activeLightColor;

  // Mode 2: White Noise State
  const [isWhiteNoisePlaying, setIsWhiteNoisePlaying] = useState<boolean>(false);
  const [whiteNoiseLevel, setWhiteNoiseLevel] = useState<WhiteNoiseLevel>('gentle');

  // Mode 3: Nature Sounds State
  const [isNaturePlaying, setIsNaturePlaying] = useState<boolean>(false);
  const [activeNatureSound, setActiveNatureSound] = useState<NatureSoundType>('rain');

  // Audio volume & Fade
  const [volume, setVolume] = useState<number>(0.7);
  const [fadeMultiplier, setFadeMultiplier] = useState<number>(1.0);

  // Sleep Timer State
  const [durationMinutes, setDurationMinutes] = useState<number>(30); // 30 min default preset
  const [remainingSeconds, setRemainingSeconds] = useState<number>(30 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [isFadeEnabled, setIsFadeEnabled] = useState<boolean>(true);
  const [fadeMinutes, setFadeMinutes] = useState<number>(10);

  // Mode 4: Active ongoing sleep tracking (shared across Header, MainMenu & ScheduleAssistantMode)
  const [activeSleepStart, setActiveSleepStart] = useState<string | null>(() => {
    try {
      return localStorage.getItem('toddler_active_sleep_start');
    } catch {
      return null;
    }
  });
  const [sleepElapsedSeconds, setSleepElapsedSeconds] = useState<number>(0);

  const handleUpdateActiveSleepStart = (nextIso: string | null) => {
    setActiveSleepStart(nextIso);
    try {
      if (nextIso) {
        localStorage.setItem('toddler_active_sleep_start', nextIso);
        if (lockScreenSleepEnabled) {
          void requestLockScreenSleepPermission().then(() =>
            syncLockScreenOngoingSleep({
              enabled: true,
              activeSleepStart: nextIso,
              language,
              babyName,
            })
          );
        }
      } else {
        localStorage.removeItem('toddler_active_sleep_start');
      }
    } catch {
      // ignore
    }
  };

  // Keep Android lock-screen ongoing sleep notification synced with sleep state, language, baby name & toggle
  useEffect(() => {
    void syncLockScreenOngoingSleep({
      enabled: lockScreenSleepEnabled,
      activeSleepStart,
      language,
      babyName,
    });
  }, [lockScreenSleepEnabled, activeSleepStart, language, babyName]);

  // Listen for sleep-session updates, backup restores & visibility resume to keep wake-window reminders synced
  useEffect(() => {
    const bump = () => setSessionsSyncTick((n) => n + 1);
    const onBanner = (e: Event) => {
      const detail = (e as CustomEvent<WakeReminderBannerPayload>).detail;
      if (detail?.title && detail?.body) {
        setWakeReminderBanner(detail);
      }
      bump();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        bump();
      }
    };
    window.addEventListener(SESSIONS_UPDATED_EVENT, bump);
    window.addEventListener(BACKUP_RESTORED_EVENT, bump);
    window.addEventListener(WAKE_REMINDER_TRIGGERED_EVENT, onBanner);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener(SESSIONS_UPDATED_EVENT, bump);
      window.removeEventListener(BACKUP_RESTORED_EVENT, bump);
      window.removeEventListener(WAKE_REMINDER_TRIGGERED_EVENT, onBanner);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  // Auto-dismiss in-app silent reminder banner after 9 seconds
  useEffect(() => {
    if (!wakeReminderBanner) return;
    const timer = window.setTimeout(() => setWakeReminderBanner(null), 9000);
    return () => window.clearTimeout(timer);
  }, [wakeReminderBanner]);

  // Sync silent local wake-window reminder whenever sleep state, sessions, age, or settings change
  useEffect(() => {
    let cancelled = false;
    void syncWakeWindowReminder({
      enabled: wakeReminderEnabled,
      leadMins: wakeReminderLeadMins,
      activeSleepStart,
      babyBirthDate,
      babyName,
      language,
    }).then((info) => {
      if (!cancelled) {
        setScheduledWakeReminder(info);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [
    wakeReminderEnabled,
    wakeReminderLeadMins,
    activeSleepStart,
    babyBirthDate,
    babyName,
    language,
    sessionsSyncTick,
  ]);

  // Refresh scheduled reminder badge automatically once its trigger time passes
  useEffect(() => {
    if (!scheduledWakeReminder) return;
    const msUntilPassed = scheduledWakeReminder.triggerAtMs - Date.now() + 2000;
    const safeDelay = Math.max(2000, Math.min(msUntilPassed, 60 * 60 * 1000));
    const timer = window.setTimeout(() => {
      setSessionsSyncTick((n) => n + 1);
    }, safeDelay);
    return () => window.clearTimeout(timer);
  }, [scheduledWakeReminder]);

  useEffect(() => {
    if (!activeSleepStart) {
      setSleepElapsedSeconds(0);
      return;
    }
    const calcElapsed = () => {
      const startMs = new Date(activeSleepStart).getTime();
      if (Number.isNaN(startMs)) {
        setSleepElapsedSeconds(0);
        return;
      }
      setSleepElapsedSeconds(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
    };
    calcElapsed();
    const interval = setInterval(calcElapsed, 1000);
    return () => clearInterval(interval);
  }, [activeSleepStart]);

  // Track previously running modes so clicking "Spustiť" restarts them faithfully
  const [lastActiveConfig, setLastActiveConfig] = useState<LastActiveConfig>({
    light: true,
    soundType: 'white-noise',
    whiteNoiseLevel: 'gentle',
    natureSound: 'rain',
  });

  // Automatic sunset detection (after 18:00 or before 07:00)
  const checkAfterSunset = () => {
    const hour = new Date().getHours();
    return hour >= 18 || hour < 7;
  };

  const [nightMode, setNightMode] = useState<NightModeState>(() => {
    try {
      const saved = localStorage.getItem('toddler_night_mode');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          isAfterSunset: checkAfterSunset(),
        };
      }
    } catch {
      // ignore
    }
    return {
      isAutoSunset: false,
      isAfterSunset: checkAfterSunset(),
      forceDark: false,
      redFilter: false,
      screenDimPercent: 0,
    };
  });

  // Apply Day or Night ergonomic presets (adjusts brightness & opacity for infant sleep science)
  const applyNightPreset = () => {
    let nightB = 25;
    let nightO = 35;
    try {
      const savedB = Number(localStorage.getItem('toddler_night_brightness'));
      if (Number.isFinite(savedB) && savedB >= 10 && savedB <= 100) nightB = savedB;
      const savedO = Number(localStorage.getItem('toddler_night_opacity'));
      if (Number.isFinite(savedO) && savedO >= 5 && savedO <= 100) nightO = savedO;
    } catch {}
    setBrightness(nightB);
    setComponentsOpacity(nightO);
    try {
      localStorage.setItem('toddler_components_opacity', nightO.toString());
    } catch {}
  };

  const applyDayPreset = () => {
    let dayB = 85;
    let dayO = 100;
    try {
      const savedB = Number(localStorage.getItem('toddler_day_brightness'));
      if (Number.isFinite(savedB) && savedB >= 10 && savedB <= 100) dayB = savedB;
      const savedO = Number(localStorage.getItem('toddler_day_opacity'));
      if (Number.isFinite(savedO) && savedO >= 5 && savedO <= 100) dayO = savedO;
    } catch {}
    setBrightness(dayB);
    setComponentsOpacity(dayO);
    try {
      localStorage.setItem('toddler_components_opacity', dayO.toString());
    } catch {}
  };

  const handleUpdateNightMode = (updates: Partial<NightModeState>) => {
    setNightMode((prev) => {
      const next = { ...prev, ...updates };
      if (updates.isAutoSunset !== undefined) {
        next.isAfterSunset = checkAfterSunset();
      }

      const wasDark = prev.forceDark || (prev.isAutoSunset && prev.isAfterSunset);
      const willBeDark = next.forceDark || (next.isAutoSunset && next.isAfterSunset);

      if (!wasDark && willBeDark) {
        applyNightPreset();
      } else if (wasDark && !willBeDark) {
        applyDayPreset();
      }

      try {
        localStorage.setItem('toddler_night_mode', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const [isTouchLocked, setIsTouchLocked] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [hapticsEnabled, setHapticsEnabledState] = useState<boolean>(() => isHapticsEnabled());

  // Color vs Lite (Low-effects Performance) vs Black & White (Grayscale) display mode
  const [colorMode, setColorMode] = useState<ColorMode>(() => {
    try {
      const saved = localStorage.getItem('toddler_color_mode');
      if (saved === 'grayscale' || saved === 'lite' || saved === 'color') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'color';
  });
  const [isGrayscaleMounted, setIsGrayscaleMounted] = useState<boolean>(() => colorMode === 'grayscale');
  const [grayscaleLayerOpacity, setGrayscaleLayerOpacity] = useState<number>(() =>
    colorMode === 'grayscale' ? 1 : 0
  );
  const [colorWaveEffect, setColorWaveEffect] = useState<{ key: number; targetMode: ColorMode } | null>(null);
  const grayscaleCleanupTimerRef = useRef<number | null>(null);
  const colorWaveTimerRef = useRef<number | null>(null);

  // Sync .app-lite class on document root so heavy blurs & infinite animations are disabled globally
  useEffect(() => {
    document.documentElement.classList.toggle('app-lite', colorMode === 'lite');
  }, [colorMode]);

  const handleChangeColorMode = (nextMode: ColorMode) => {
    if (nextMode === colorMode) return;
    const prevMode = colorMode;
    setColorMode(nextMode);
    try {
      localStorage.setItem('toddler_color_mode', nextMode);
    } catch {
      // ignore
    }

    if (grayscaleCleanupTimerRef.current) {
      window.clearTimeout(grayscaleCleanupTimerRef.current);
      grayscaleCleanupTimerRef.current = null;
    }
    if (colorWaveTimerRef.current) {
      window.clearTimeout(colorWaveTimerRef.current);
      colorWaveTimerRef.current = null;
    }

    // Trigger +25% slower (2400ms) gentle dual-mist & bloom transition effect
    setColorWaveEffect({ key: Date.now(), targetMode: nextMode });
    colorWaveTimerRef.current = window.setTimeout(() => {
      setColorWaveEffect(null);
    }, 2480);

    if (nextMode === 'grayscale') {
      setIsGrayscaleMounted(true);
      setGrayscaleLayerOpacity(0);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setGrayscaleLayerOpacity(1);
        });
      });
    } else if (prevMode === 'grayscale') {
      setIsGrayscaleMounted(true);
      setGrayscaleLayerOpacity(0);
      grayscaleCleanupTimerRef.current = window.setTimeout(() => {
        setIsGrayscaleMounted(false);
      }, 2320);
    }
  };

  useEffect(() => {
    return () => {
      if (grayscaleCleanupTimerRef.current) window.clearTimeout(grayscaleCleanupTimerRef.current);
      if (colorWaveTimerRef.current) window.clearTimeout(colorWaveTimerRef.current);
    };
  }, []);

  const handleToggleHaptics = (enabled: boolean) => {
    setHapticsEnabled(enabled);
    setHapticsEnabledState(enabled);
  };

  // Check sunset automatically every minute only if user explicitly enabled isAutoSunset
  useEffect(() => {
    if (!nightMode.isAutoSunset) return;
    const interval = setInterval(() => {
      setNightMode((prev) => {
        if (!prev.isAutoSunset) return prev;
        const isSunset = checkAfterSunset();
        if (prev.isAfterSunset !== isSunset) {
          if (isSunset) {
            applyNightPreset();
          } else {
            applyDayPreset();
          }
          return { ...prev, isAfterSunset: isSunset };
        }
        return prev;
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [nightMode.isAutoSunset]);

  // Sync volume with sound engine
  const handleVolumeChange = (vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolume(clamped);
    soundEngine.setVolume(clamped);
  };

  // Navigating to a mode from Main Menu activates that view (does not auto-start playback until user presses start)
  const handleSelectModeFromMenu = (mode: AppMode) => {
    setActiveMode(mode);
  };

  // Sound Playback Handlers
  const handleToggleWhiteNoise = () => {
    if (isWhiteNoisePlaying) {
      soundEngine.stopWhiteNoise();
      setIsWhiteNoisePlaying(false);
    } else {
      setIsNaturePlaying(false);
      soundEngine.playWhiteNoise(whiteNoiseLevel);
      setIsWhiteNoisePlaying(true);
      setLastActiveConfig((prev) => ({
        ...prev,
        soundType: 'white-noise',
        whiteNoiseLevel,
      }));
      if (durationMinutes > 0 && !isTimerRunning) {
        setIsTimerRunning(true);
      }
    }
  };

  const handleSelectWhiteNoiseLevel = (level: WhiteNoiseLevel) => {
    setWhiteNoiseLevel(level);
    setLastActiveConfig((prev) => ({
      ...prev,
      soundType: 'white-noise',
      whiteNoiseLevel: level,
    }));
    if (isWhiteNoisePlaying) {
      soundEngine.playWhiteNoise(level);
    }
  };

  const handleToggleNatureSounds = () => {
    if (isNaturePlaying) {
      soundEngine.stopNatureSounds();
      setIsNaturePlaying(false);
    } else {
      setIsWhiteNoisePlaying(false);
      soundEngine.playNatureSound(activeNatureSound);
      setIsNaturePlaying(true);
      setLastActiveConfig((prev) => ({
        ...prev,
        soundType: 'nature',
        natureSound: activeNatureSound,
      }));
      if (durationMinutes > 0 && !isTimerRunning) {
        setIsTimerRunning(true);
      }
    }
  };

  const handleSelectNatureSound = (nature: NatureSoundType) => {
    setActiveNatureSound(nature);
    setLastActiveConfig((prev) => ({
      ...prev,
      soundType: 'nature',
      natureSound: nature,
    }));
    if (isNaturePlaying) {
      soundEngine.playNatureSound(nature);
    }
  };

  // Stop all active outputs
  const handleStopAll = () => {
    // Record current active state before stopping so "Spustiť" can restart them
    const wasLightOn = isLightOn;
    const wasSound: 'none' | 'white-noise' | 'nature' = isWhiteNoisePlaying
      ? 'white-noise'
      : isNaturePlaying
      ? 'nature'
      : 'none';

    if (wasLightOn || wasSound !== 'none') {
      setLastActiveConfig({
        light: wasLightOn,
        soundType: wasSound,
        whiteNoiseLevel,
        natureSound: activeNatureSound,
      });
    }

    soundEngine.stopAll(0.5);
    setIsWhiteNoisePlaying(false);
    setIsNaturePlaying(false);
    setIsLightOn(false);
    setIsTimerRunning(false);
    setFadeMultiplier(1.0);
    soundEngine.setFadeMultiplier(1.0);
  };

  // Resume / Start previously running modes
  const handleResumePrevious = () => {
    let startedSomething = false;

    if (lastActiveConfig.light) {
      setIsLightOn(true);
      startedSomething = true;
    }

    if (lastActiveConfig.soundType === 'white-noise') {
      setIsNaturePlaying(false);
      soundEngine.playWhiteNoise(lastActiveConfig.whiteNoiseLevel);
      setIsWhiteNoisePlaying(true);
      startedSomething = true;
    } else if (lastActiveConfig.soundType === 'nature') {
      setIsWhiteNoisePlaying(false);
      soundEngine.playNatureSound(lastActiveConfig.natureSound);
      setIsNaturePlaying(true);
      startedSomething = true;
    }

    // Default fallback if no prior active state was recorded
    if (!startedSomething) {
      setIsLightOn(true);
      soundEngine.playWhiteNoise(whiteNoiseLevel);
      setIsWhiteNoisePlaying(true);
    }

    // Restore timer if duration is configured
    if (durationMinutes > 0) {
      if (remainingSeconds <= 0) {
        setRemainingSeconds(durationMinutes * 60);
      }
      setIsTimerRunning(true);
    }
    setFadeMultiplier(1.0);
    soundEngine.setFadeMultiplier(1.0);
  };

  // Sleep Timer countdown & Gradual Fade-out calculation
  useEffect(() => {
    let interval: number | null = null;
    const isAnySoundPlaying = isWhiteNoisePlaying || isNaturePlaying;

    if (isTimerRunning && durationMinutes > 0 && (isAnySoundPlaying || isLightOn)) {
      interval = window.setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            // Timer finished
            soundEngine.stopAll(1.5);
            setIsWhiteNoisePlaying(false);
            setIsNaturePlaying(false);
            setIsLightOn(false);
            setIsTimerRunning(false);
            setFadeMultiplier(1.0);
            soundEngine.setFadeMultiplier(1.0);
            setIsSleepDimmed(true); // Stlmiť jas úplne na minimum po skončení časovača
            return 0;
          }

          const nextSec = prev - 1;

          // Gradual Fade-out logic
          if (isFadeEnabled && fadeMinutes > 0) {
            const fadeTotalSec = fadeMinutes * 60;
            if (nextSec <= fadeTotalSec) {
              const currentFadeRatio = Math.max(0, nextSec / fadeTotalSec);
              setFadeMultiplier(currentFadeRatio);
              soundEngine.setFadeMultiplier(currentFadeRatio);
            } else {
              setFadeMultiplier(1.0);
              soundEngine.setFadeMultiplier(1.0);
            }
          } else {
            setFadeMultiplier(1.0);
            soundEngine.setFadeMultiplier(1.0);
          }

          return nextSec;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    isTimerRunning,
    durationMinutes,
    isWhiteNoisePlaying,
    isNaturePlaying,
    isLightOn,
    isFadeEnabled,
    fadeMinutes,
  ]);

  const handleSetTimerDuration = (mins: number) => {
    setDurationMinutes(mins);
    if (mins === 0) {
      setIsTimerRunning(false);
      setRemainingSeconds(0);
      setFadeMultiplier(1.0);
      soundEngine.setFadeMultiplier(1.0);
    } else {
      setRemainingSeconds(mins * 60);
      setIsTimerRunning(true);
      setFadeMultiplier(1.0);
      soundEngine.setFadeMultiplier(1.0);
    }
  };

  const handleAddMinutes = (mins: number) => {
    setRemainingSeconds((prev) => prev + mins * 60);
    setDurationMinutes((prev) => prev + mins);
    setIsTimerRunning(true);
    setFadeMultiplier(1.0);
    soundEngine.setFadeMultiplier(1.0);
  };

  const handleSubtractMinutes = (mins: number) => {
    setRemainingSeconds((prev) => {
      const next = Math.max(0, prev - mins * 60);
      if (next === 0) {
        setIsTimerRunning(false);
      }
      return next;
    });
    setDurationMinutes((prev) => Math.max(0, prev - mins));
    setFadeMultiplier(1.0);
    soundEngine.setFadeMultiplier(1.0);
  };

  const handleSeekSeconds = (sec: number) => {
    const clamped = Math.max(0, sec);
    const mins = Math.ceil(clamped / 60);
    setRemainingSeconds(clamped);
    if (mins > durationMinutes || durationMinutes === 0) {
      setDurationMinutes(mins);
    }
    setIsTimerRunning(clamped > 0);
    setFadeMultiplier(1.0);
    soundEngine.setFadeMultiplier(1.0);
  };

  const handleResetTimer = () => {
    if (durationMinutes > 0) {
      setRemainingSeconds(durationMinutes * 60);
      setIsTimerRunning(true);
    } else {
      setRemainingSeconds(0);
      setIsTimerRunning(false);
    }
    setFadeMultiplier(1.0);
    soundEngine.setFadeMultiplier(1.0);
  };

  // Determine if Dark Theme applies
  const isDarkMode = nightMode.forceDark || (nightMode.isAutoSunset && nightMode.isAfterSunset);

  // Sound active helper
  const soundPlayingType: 'none' | 'white-noise' | 'nature' = isWhiteNoisePlaying
    ? 'white-noise'
    : isNaturePlaying
    ? 'nature'
    : 'none';
  const isSoundPlaying = soundPlayingType !== 'none';
  const safeOpacityRatio =
    Number.isFinite(componentsOpacity) && componentsOpacity >= 5
      ? Math.max(0.12, componentsOpacity / 100)
      : 1;

  return (
    <div
      className={`relative min-h-screen flex flex-col transition-colors duration-500 overflow-x-hidden font-sans ${
        isDarkMode
          ? 'bg-slate-950 text-slate-100'
          : 'bg-[#0a0f1d] text-slate-100'
      }`}
    >
      {/* Calm Light Fullscreen Ambient Background:
          When Calm Light is ON and not in FullScreenLamp, radiates soothingly across the entire screen as a background in menu & app.
          When turned off or stopped, fades out smoothly via transition-opacity without an abrupt shutoff. */}
      <div
        className={`pointer-events-none fixed inset-0 z-0 transition-opacity duration-[1800ms] ease-out ${
          isLightOn && !isFullScreenLamp ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden="true"
      >
        {/* Soft upper ambient glow with active color */}
        <div
          className={`absolute inset-0 transition-colors ease-in-out ${
            lightSpeed === 'breathing' && colorMode !== 'lite' ? 'animate-rhythmic-breathing' : ''
          }`}
          style={{
            backgroundColor: activeLightColor,
            opacity: 0.32,
            maskImage: 'radial-gradient(circle at 50% 28%, black 0%, black 35%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(circle at 50% 28%, black 0%, black 35%, transparent 80%)',
            transitionDuration: `${Math.round(speedDurations[lightSpeed] * 0.92)}ms`,
          }}
        />
        {colorMode !== 'lite' && (
          <>
            {/* Soft lower ambient glow with secondary palette color */}
            <div
              className="absolute inset-0 transition-colors ease-in-out"
              style={{
                backgroundColor: nextLightColor,
                opacity: 0.22,
                maskImage: 'radial-gradient(circle at 50% 85%, black 0%, transparent 70%)',
                WebkitMaskImage: 'radial-gradient(circle at 50% 85%, black 0%, transparent 70%)',
                transitionDuration: `${Math.round(speedDurations[lightSpeed] * 0.92)}ms`,
              }}
            />
            {/* Ambient screen wash scaled with brightness */}
            <div
              className="absolute inset-0 transition-colors ease-in-out mix-blend-screen"
              style={{
                backgroundColor: activeLightColor,
                opacity: (brightness / 100) * 0.16,
                transitionDuration: `${Math.round(speedDurations[lightSpeed] * 0.92)}ms`,
              }}
            />
          </>
        )}
      </div>

      {/* Master Application Brightness Dimmer - Controls overall screen brightness */}
      {brightness < 100 && (
        <div
          className="pointer-events-none fixed inset-0 z-40 bg-black transition-opacity duration-500 ease-in-out"
          style={{ opacity: Math.max(0, Math.min(0.85, ((100 - brightness) / 100) * 0.82)) }}
          aria-hidden="true"
        />
      )}

      {/* Red Melatonin Filter Scrim (0% blue light) */}
      {nightMode.redFilter && (
        <div
          className="pointer-events-none fixed inset-0 z-40 mix-blend-multiply transition-opacity duration-700 bg-red-600/40"
          aria-hidden="true"
        />
      )}

      {/* Screen Dimming Scrim for ultra-dark rooms on mobile */}
      {nightMode.screenDimPercent > 0 && (
        <div
          className="pointer-events-none fixed inset-0 z-40 bg-black transition-opacity duration-300"
          style={{ opacity: nightMode.screenDimPercent / 100 }}
          aria-hidden="true"
        />
      )}

      {/* Dimmed to minimum after sleep timer ends - dismissed upon screen touch */}
      {isSleepDimmed && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Tap to restore screen"
          onPointerDown={() => {
            triggerHaptic(15);
            setIsSleepDimmed(false);
          }}
          className="fixed inset-0 z-50 bg-black/98 cursor-pointer flex flex-col items-center justify-center select-none animate-fade-in"
        >
          <div className="flex flex-col items-center gap-3 text-white/25 hover:text-white/40 transition-colors pointer-events-none">
            <Moon className="w-8 h-8 opacity-30 animate-pulse" />
            <span className="text-[11px] tracking-widest uppercase font-medium">
              {translations[language].sleepDimmedWakePrompt}
            </span>
          </div>
        </div>
      )}

      {/* Child Lock Fullscreen Interceptor */}
      <TouchLockOverlay
        language={language}
        babyName={babyName}
        isLocked={isTouchLocked}
        onUnlock={() => setIsTouchLocked(false)}
      />

      {/* First-Run Language & Baby Name Onboarding Modal */}
      <LanguageOnboardingModal
        isOpen={isFirstRun}
        onConfirm={handleConfirmOnboarding}
      />

      {/* Fullscreen Ambient Lamp Mode */}
      {isFullScreenLamp && (
        <FullScreenLamp
          language={language}
          palette={selectedPalette}
          speed={lightSpeed}
          brightness={brightness}
          onClose={() => setIsFullScreenLamp(false)}
          redFilter={nightMode.redFilter}
          timerRemaining={durationMinutes > 0 ? remainingSeconds : null}
          isSoundPlaying={isSoundPlaying}
        />
      )}

      {/* Silent Wake-Window Reminder In-App Toast Banner */}
      {wakeReminderBanner && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-sm rounded-2xl bg-slate-900/95 border border-emerald-400/40 p-3.5 shadow-2xl backdrop-blur-md flex items-start gap-2.5 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/35 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
            <Bell className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white leading-snug">{wakeReminderBanner.title}</p>
            <p className="text-[11px] text-white/70 mt-0.5 leading-relaxed">{wakeReminderBanner.body}</p>
          </div>
          <button
            type="button"
            onClick={() => setWakeReminderBanner(null)}
            className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Settings Modal (opened via Settings Gear "koliesko") */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        language={language}
        onSelectLanguage={handleSelectLanguage}
        babyName={babyName}
        onChangeBabyName={handleChangeBabyName}
        babyBirthDate={babyBirthDate}
        onChangeBabyBirthDate={handleChangeBabyBirthDate}
        lockScreenSleepEnabled={lockScreenSleepEnabled}
        onToggleLockScreenSleep={handleToggleLockScreenSleep}
        wakeReminderEnabled={wakeReminderEnabled}
        onToggleWakeReminder={handleToggleWakeReminder}
        wakeReminderLeadMins={wakeReminderLeadMins}
        onChangeWakeReminderLeadMins={handleChangeWakeReminderLeadMins}
        nightMode={nightMode}
        onUpdateNightMode={handleUpdateNightMode}
        colorMode={colorMode}
        onChangeColorMode={handleChangeColorMode}
        onBackupRestored={(result) => {
          if (result.restoredProfile.babyName !== undefined) {
            setBabyName(result.restoredProfile.babyName);
          }
          if (result.restoredProfile.babyBirthDate !== undefined) {
            setBabyBirthDate(result.restoredProfile.babyBirthDate);
          }
        }}
      />

      {/* Permanent Header with app title, back button, lock, and settings gear */}
      <div style={{ opacity: safeOpacityRatio }} className="w-full transition-opacity duration-500 ease-in-out">
        <ClockHeader
          language={language}
          activeMode={activeMode}
          onBackToMenu={() => {
            triggerHaptic(12);
            setActiveMode('menu');
          }}
          nightMode={nightMode}
          onToggleNightMode={() => {
            const isCurrentlyDark = nightMode.forceDark || (nightMode.isAutoSunset && nightMode.isAfterSunset);
            handleUpdateNightMode({
              forceDark: !isCurrentlyDark,
              isAutoSunset: false,
            });
          }}
          onToggleRedFilter={() =>
            handleUpdateNightMode({ redFilter: !nightMode.redFilter })
          }
          isTouchLocked={isTouchLocked}
          onToggleTouchLock={() => {
            triggerHaptic(14);
            setIsTouchLocked(!isTouchLocked);
          }}
          activeSoundMode={soundPlayingType}
          isPlaying={isSoundPlaying}
          timerRemaining={durationMinutes > 0 ? remainingSeconds : null}
          activeSleepStart={activeSleepStart}
          sleepElapsedSeconds={sleepElapsedSeconds}
          onOpenSchedule={() => {
            triggerHaptic(8);
            setActiveMode('schedule');
          }}
          onOpenSettings={() => {
            triggerHaptic(10);
            setIsSettingsOpen(true);
          }}
        />
      </div>

      {/* Mobile-tailored Main Container (pb-[2mm] ensures exact 2mm distance between last module and footer) */}
      <main
        style={{ opacity: safeOpacityRatio }}
        className={`flex-1 w-full max-w-md mx-auto px-4 pt-3 pb-[2mm] flex flex-col gap-3 transition-opacity duration-500 ease-in-out ${
          isFullScreenLamp ? 'invisible pointer-events-none' : ''
        }`}
      >
        {/* VIEW CONTAINER with smooth GPU-accelerated CSS transform transition */}
        <div key={activeMode} className="animate-mode-enter w-full flex flex-col gap-4">
          {/* VIEW 0: Main Menu (Initial screen) */}
          {activeMode === 'menu' && (
            <MainMenu
              language={language}
              babyName={babyName}
              onSelectMode={handleSelectModeFromMenu}
              isLightActive={isLightOn}
              isWhiteNoiseActive={isWhiteNoisePlaying}
              isNatureActive={isNaturePlaying}
              onStopAll={handleStopAll}
              onResumePrevious={handleResumePrevious}
              timerRemaining={durationMinutes > 0 ? remainingSeconds : null}
              durationMinutes={durationMinutes}
              volume={volume}
              onChangeVolume={handleVolumeChange}
              brightness={brightness}
              onChangeBrightness={handleUpdateBrightness}
              componentsOpacity={componentsOpacity}
              onChangeComponentsOpacity={handleUpdateComponentsOpacity}
              isScheduleActive={Boolean(activeSleepStart)}
            />
          )}

          {/* VIEW 1: Mode 1 - Calm Light */}
          {activeMode === 'light' && (
            <CalmLightMode
              language={language}
              isLightOn={isLightOn}
              onToggleLight={() => {
                const nextState = !isLightOn;
                setIsLightOn(nextState);
                if (nextState) {
                  setLastActiveConfig((prev) => ({ ...prev, light: true }));
                }
              }}
              selectedPalette={selectedPalette}
              onSelectPalette={handleSelectPalette}
              speed={lightSpeed}
              onSelectSpeed={setLightSpeed}
              brightness={brightness}
              onChangeBrightness={handleUpdateBrightness}
              onOpenFullScreen={() => setIsFullScreenLamp(true)}
              colorIndex={lightColorIndex}
            />
          )}

          {/* VIEW 2: Mode 2 - White Noise */}
          {activeMode === 'white-noise' && (
            <WhiteNoiseMode
              language={language}
              babyName={babyName}
              isPlaying={isWhiteNoisePlaying}
              activeLevel={whiteNoiseLevel}
              onSelectLevel={handleSelectWhiteNoiseLevel}
              onTogglePlay={handleToggleWhiteNoise}
              volume={volume}
              onChangeVolume={handleVolumeChange}
              isFading={isTimerRunning && durationMinutes > 0 && isFadeEnabled && remainingSeconds <= fadeMinutes * 60}
              fadeMultiplier={fadeMultiplier}
            />
          )}

          {/* VIEW 3: Mode 3 - Nature Sounds */}
          {activeMode === 'nature' && (
            <NatureSoundsMode
              language={language}
              babyName={babyName}
              isPlaying={isNaturePlaying}
              activeNature={activeNatureSound}
              onSelectNature={handleSelectNatureSound}
              onTogglePlay={handleToggleNatureSounds}
              volume={volume}
              onChangeVolume={handleVolumeChange}
              isFading={isTimerRunning && durationMinutes > 0 && isFadeEnabled && remainingSeconds <= fadeMinutes * 60}
              fadeMultiplier={fadeMultiplier}
            />
          )}

          {/* VIEW 4: Mode 4 - Schedule Assistant */}
          {activeMode === 'schedule' && (
            <ScheduleAssistantMode
              language={language}
              babyName={babyName}
              babyBirthDate={babyBirthDate}
              onChangeBabyBirthDate={handleChangeBabyBirthDate}
              lockScreenSleepEnabled={lockScreenSleepEnabled}
              wakeReminderEnabled={wakeReminderEnabled}
              onToggleWakeReminder={handleToggleWakeReminder}
              scheduledWakeReminder={scheduledWakeReminder}
              activeSleepStart={activeSleepStart}
              sleepElapsedSeconds={sleepElapsedSeconds}
              onUpdateActiveSleepStart={handleUpdateActiveSleepStart}
            />
          )}
        </div>

        {/* Universal Sleep Timer & Gradual Fade-out (Last module, 2mm above footer) */}
        <div className="mt-0">
          <SleepTimerControls
            language={language}
            babyName={babyName}
            durationMinutes={durationMinutes}
            remainingSeconds={remainingSeconds}
            isRunning={isTimerRunning}
            onSetDuration={handleSetTimerDuration}
            onResetTimer={handleResetTimer}
            onAddMinutes={handleAddMinutes}
            onSubtractMinutes={handleSubtractMinutes}
            onSeekSeconds={handleSeekSeconds}
            isFadeEnabled={isFadeEnabled}
            onToggleFade={() => setIsFadeEnabled(!isFadeEnabled)}
            fadeMinutes={fadeMinutes}
            onSetFadeMinutes={setFadeMinutes}
            isLightActive={isLightOn}
          />
        </div>
      </main>

      {/* Subtle Mobile Bottom Status with Halved Height (py-1.5), Interactive Changelog and Author Notice */}
      <footer
        style={{ opacity: safeOpacityRatio }}
        className={`w-full max-w-md mx-auto px-4 py-1.5 flex items-center justify-between text-[11px] text-white/40 border-t border-white/5 select-none transition-opacity duration-500 ease-in-out ${
          isFullScreenLamp ? 'invisible pointer-events-none' : ''
        }`}
      >
        <button
          onClick={() => {
            triggerHaptic(8);
            setIsChangelogOpen(true);
          }}
          className="flex items-center gap-1.5 hover:text-amber-300 transition-colors group cursor-pointer text-start"
          title={translations[language].changelogModal.title}
        >
          <span className="font-medium text-white/60 group-hover:text-amber-200">Toddler sleep assistant</span>
          <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-md bg-white/10 group-hover:bg-amber-400 group-hover:text-slate-950 text-amber-300 transition-all">v1.1.1</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic(8);
            setIsAuthorOpen(true);
          }}
          className="hover:text-amber-300 transition-colors cursor-pointer text-end group"
          title={translations[language].authorNotice.title}
        >
          <span>{translations[language].authorNotice.authorLabel} </span>
          <span className="underline decoration-dotted underline-offset-2 text-white/60 group-hover:text-amber-200">Matej Šoltis</span>
        </button>
      </footer>

      {/* Interactive Changelog Modal (opens on version click) */}
      <ChangelogModal
        isOpen={isChangelogOpen}
        onClose={() => setIsChangelogOpen(false)}
        language={language}
      />

      {/* Interactive Author Notice Modal (opens on author click) */}
      <AuthorModal
        isOpen={isAuthorOpen}
        onClose={() => setIsAuthorOpen(false)}
        language={language}
      />

      {/* Global Grayscale (Shades of Gray) Overlay with Smooth 2250ms Desaturation Transition */}
      {isGrayscaleMounted && (
        <div
          className="grayscale-master-overlay pointer-events-none fixed inset-0 z-[70] transition-opacity duration-[2250ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            opacity: grayscaleLayerOpacity,
            backdropFilter: 'grayscale(100%) contrast(1.04)',
            WebkitBackdropFilter: 'grayscale(100%) contrast(1.04)',
          }}
          aria-hidden="true"
        />
      )}

      {/* Gentle Centered Eye-Safe Multi-Layered Mist & Bloom Transition between Color / Lite / B&W */}
      {colorWaveEffect && (
        <div
          key={colorWaveEffect.key}
          className="pointer-events-none fixed inset-0 z-[71] overflow-hidden"
          aria-hidden="true"
        >
          {/* Subtle ambient radial bloom */}
          <div
            className="animate-bw-bloom absolute inset-0"
            style={{
              background:
                colorWaveEffect.targetMode === 'grayscale'
                  ? 'radial-gradient(circle at 50% 50%, rgba(226,232,240,0.22) 0%, rgba(148,163,184,0.08) 45%, transparent 78%)'
                  : colorWaveEffect.targetMode === 'lite'
                  ? 'radial-gradient(circle at 50% 50%, rgba(125,211,252,0.18) 0%, rgba(110,231,183,0.08) 45%, transparent 78%)'
                  : 'radial-gradient(circle at 50% 50%, rgba(251,191,36,0.18) 0%, rgba(129,140,248,0.09) 45%, transparent 78%)',
            }}
          />

          {/* Primary centered expanding soft mist halo */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="animate-bw-wave w-[110vmax] h-[110vmax] rounded-full shrink-0"
              style={{
                background:
                  colorWaveEffect.targetMode === 'grayscale'
                    ? 'radial-gradient(circle, rgba(255,255,255,0) 44%, rgba(226,232,240,0.14) 64%, rgba(248,250,252,0.18) 70%, rgba(255,255,255,0) 80%)'
                    : colorWaveEffect.targetMode === 'lite'
                    ? 'radial-gradient(circle, rgba(255,255,255,0) 44%, rgba(125,211,252,0.14) 64%, rgba(110,231,183,0.16) 70%, rgba(255,255,255,0) 80%)'
                    : 'radial-gradient(circle, rgba(255,255,255,0) 44%, rgba(251,191,36,0.15) 60%, rgba(244,114,182,0.12) 66%, rgba(129,140,248,0.15) 72%, rgba(255,255,255,0) 80%)',
              }}
            />
          </div>

          {/* Secondary centered trailing echo mist ring (no harsh hard border) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="animate-bw-echo w-[100vmax] h-[100vmax] rounded-full shrink-0"
              style={{
                background:
                  colorWaveEffect.targetMode === 'grayscale'
                    ? 'radial-gradient(circle, rgba(255,255,255,0) 56%, rgba(248,250,252,0.14) 68%, rgba(255,255,255,0) 76%)'
                    : colorWaveEffect.targetMode === 'lite'
                    ? 'radial-gradient(circle, rgba(255,255,255,0) 56%, rgba(125,211,252,0.15) 68%, rgba(255,255,255,0) 76%)'
                    : 'radial-gradient(circle, rgba(255,255,255,0) 56%, rgba(253,224,71,0.14) 68%, rgba(255,255,255,0) 76%)',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
