import React, { useState, useEffect } from 'react';
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
      return found || newPalettes[0];
    });
  };

  const handleConfirmOnboarding = (lang: Language) => {
    handleSelectLanguage(lang);
    setIsFirstRun(false);
  };

  // Navigation: Starts at 'menu' (Modes only start working after user taps them from main menu)
  const [activeMode, setActiveMode] = useState<AppMode>('menu');

  // Mode 1: Calm Light State
  const [isLightOn, setIsLightOn] = useState<boolean>(false);
  const [selectedPalette, setSelectedPalette] = useState<LightPalette>(() => getPalettes(language)[0]);
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
          className={`absolute inset-0 transition-colors duration-[2500ms] ease-in-out ${
            lightSpeed === 'breathing' ? 'animate-rhythmic-breathing' : ''
          }`}
          style={{
            background: `radial-gradient(circle at 50% 28%, ${activeLightColor}55 0%, ${activeLightColor}22 50%, transparent 80%)`,
          }}
        />
        {/* Soft lower ambient glow with secondary palette color */}
        <div
          className="absolute inset-0 transition-colors duration-[3000ms] ease-in-out"
          style={{
            background: `radial-gradient(circle at 50% 85%, ${nextLightColor}35 0%, transparent 65%)`,
          }}
        />
        {/* Ambient screen wash scaled with brightness */}
        <div
          className="absolute inset-0 transition-colors duration-[2500ms] ease-in-out mix-blend-screen"
          style={{
            backgroundColor: activeLightColor,
            opacity: (brightness / 100) * 0.16,
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

      {/* Mobile-tailored Main Container */}
      <main
        className={`flex-1 w-full max-w-md mx-auto px-4 py-4 flex flex-col gap-4 ${
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
              onSelectPalette={setSelectedPalette}
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

        {/* Universal Sleep Timer & Gradual Fade-out */}
        <div className="mt-1">
          <SleepTimerControls
            language={language}
            durationMinutes={durationMinutes}
            remainingSeconds={remainingSeconds}
            isRunning={isTimerRunning}
            onSetDuration={handleSetTimerDuration}
            onResetTimer={handleResetTimer}
            onAddMinutes={handleAddMinutes}
            isFadeEnabled={isFadeEnabled}
            onToggleFade={() => setIsFadeEnabled(!isFadeEnabled)}
            fadeMinutes={fadeMinutes}
            onSetFadeMinutes={setFadeMinutes}
            isLightActive={isLightOn}
          />
        </div>
      </main>

      {/* Subtle Mobile Bottom Status with Version & Author */}
      <footer
        className={`w-full max-w-md mx-auto px-4 py-3 flex items-center justify-between text-[11px] text-white/40 border-t border-white/5 select-none ${
          isFullScreenLamp ? 'invisible pointer-events-none' : ''
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="font-medium text-white/60">Toddler sleep assistant</span>
          <span className="text-[11px] font-bold italic text-white/50">v0.92</span>
        </div>
        <span>Autor: Matej Šoltis</span>
      </footer>
    </div>
  );
}
