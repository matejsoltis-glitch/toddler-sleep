import React, { useState, useEffect } from 'react';
import { Moon } from 'lucide-react';
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
import { soundEngine } from './services/soundEngine';
import { isHapticsEnabled, setHapticsEnabled, triggerHaptic } from './utils/haptics';
import {
  AppMode,
  WhiteNoiseLevel,
  NatureSoundType,
  LightPalette,
  LightSpeed,
  NightModeState,
  Language,
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
      const validLangs: Language[] = ['en', 'sk', 'cs', 'pl', 'hu', 'uk', 'it'];
      if (configured === 'true' && validLangs.includes(saved)) {
        return saved;
      }
      return 'en';
    } catch {
      return 'en';
    }
  });

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

  const handleConfirmOnboarding = (lang: Language) => {
    handleSelectLanguage(lang);
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
  const [brightness, setBrightness] = useState<number>(80);
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
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return {
      isAutoSunset: false, // Default is OFF so eye-saving / night mode NEVER turns on unexpectedly
      isAfterSunset: false,
      forceDark: false,
      redFilter: false,
      screenDimPercent: 0,
    };
  });

  const handleUpdateNightMode = (updates: Partial<NightModeState>) => {
    setNightMode((prev) => {
      const next = { ...prev, ...updates };
      if (updates.isAutoSunset) {
        next.isAfterSunset = checkAfterSunset();
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
        return { ...prev, isAfterSunset: isSunset };
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
        {/* Soft upper ambient glow with active color (maskImage with real backgroundColor enables continuous smooth color interpolation) */}
        <div
          className={`absolute inset-0 transition-colors ease-in-out ${
            lightSpeed === 'breathing' ? 'animate-rhythmic-breathing' : ''
          }`}
          style={{
            backgroundColor: activeLightColor,
            opacity: 0.32,
            maskImage: 'radial-gradient(circle at 50% 28%, black 0%, black 35%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(circle at 50% 28%, black 0%, black 35%, transparent 80%)',
            transitionDuration: `${Math.round(speedDurations[lightSpeed] * 0.92)}ms`,
          }}
        />
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
      </div>

      {/* Master Application Brightness Dimmer - Controls overall screen brightness */}
      {brightness < 100 && (
        <div
          className="pointer-events-none fixed inset-0 z-40 bg-black transition-opacity duration-150 ease-out"
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
              {language === 'sk'
                ? 'Dotknite sa pre rozsvietenie'
                : language === 'cs'
                ? 'Klepnutím rozsvítíte'
                : language === 'pl'
                ? 'Dotknij, aby rozjaśnić'
                : language === 'hu'
                ? 'Érintse meg a feloldáshoz'
                : language === 'uk'
                ? 'Торкніться для підсвітки'
                : language === 'it'
                ? 'Tocca per riattivare'
                : 'Tap screen to wake'}
            </span>
          </div>
        </div>
      )}

      {/* Child Lock Fullscreen Interceptor */}
      <TouchLockOverlay
        language={language}
        isLocked={isTouchLocked}
        onUnlock={() => setIsTouchLocked(false)}
      />

      {/* First-Run Language Selection Onboarding Modal */}
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

      {/* Settings Modal (opened via Settings Gear "koliesko") */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        language={language}
        onSelectLanguage={handleSelectLanguage}
        nightMode={nightMode}
        onUpdateNightMode={handleUpdateNightMode}
        hapticsEnabled={hapticsEnabled}
        onToggleHaptics={handleToggleHaptics}
      />

      {/* Permanent Header with app title, back button, lock, and settings gear */}
      <div style={{ opacity: safeOpacityRatio }} className="w-full transition-opacity duration-150">
        <ClockHeader
          language={language}
          activeMode={activeMode}
          onBackToMenu={() => {
            triggerHaptic(12);
            setActiveMode('menu');
          }}
          nightMode={nightMode}
          onToggleNightMode={() =>
            handleUpdateNightMode({ forceDark: !nightMode.forceDark })
          }
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
          onOpenSettings={() => {
            triggerHaptic(10);
            setIsSettingsOpen(true);
          }}
        />
      </div>

      {/* Mobile-tailored Main Container (pb-[2mm] ensures exact 2mm distance between last module and footer) */}
      <main
        style={{ opacity: safeOpacityRatio }}
        className={`flex-1 w-full max-w-md mx-auto px-4 pt-3 pb-[2mm] flex flex-col gap-3 transition-opacity duration-150 ${
          isFullScreenLamp ? 'invisible pointer-events-none' : ''
        }`}
      >
        {/* VIEW CONTAINER with smooth GPU-accelerated CSS transform transition */}
        <div key={activeMode} className="animate-mode-enter w-full flex flex-col gap-4">
          {/* VIEW 0: Main Menu (Initial screen) */}
          {activeMode === 'menu' && (
            <MainMenu
              language={language}
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
              onChangeBrightness={setBrightness}
              componentsOpacity={componentsOpacity}
              onChangeComponentsOpacity={handleUpdateComponentsOpacity}
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
              onChangeBrightness={setBrightness}
              onOpenFullScreen={() => setIsFullScreenLamp(true)}
              colorIndex={lightColorIndex}
            />
          )}

          {/* VIEW 2: Mode 2 - White Noise */}
          {activeMode === 'white-noise' && (
            <WhiteNoiseMode
              language={language}
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
            <ScheduleAssistantMode language={language} />
          )}
        </div>

        {/* Universal Sleep Timer & Gradual Fade-out (Last module, 2mm above footer) */}
        <div className="mt-0">
          <SleepTimerControls
            language={language}
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
        className={`w-full max-w-md mx-auto px-4 py-1.5 flex items-center justify-between text-[11px] text-white/40 border-t border-white/5 select-none transition-opacity duration-150 ${
          isFullScreenLamp ? 'invisible pointer-events-none' : ''
        }`}
      >
        <button
          onClick={() => {
            triggerHaptic(8);
            setIsChangelogOpen(true);
          }}
          className="flex items-center gap-1.5 hover:text-amber-300 transition-colors group cursor-pointer text-left"
          title="Kliknite pre zobrazenie noviniek a histórie verzií"
        >
          <span className="font-medium text-white/60 group-hover:text-amber-200">Toddler sleep assistant</span>
          <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-md bg-white/10 group-hover:bg-amber-400 group-hover:text-slate-950 text-amber-300 transition-all">v1.0.1</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic(8);
            setIsAuthorOpen(true);
          }}
          className="hover:text-amber-300 transition-colors cursor-pointer text-right group"
          title="Kliknite pre kontakt a informácie o autorovi"
        >
          <span>Autor: </span>
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
    </div>
  );
}
