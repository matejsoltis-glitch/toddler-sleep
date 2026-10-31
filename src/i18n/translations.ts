import { Language } from '../types';

export interface Translations {
  appName: string;
  appSubtitle: string;
  clockDayNames: string[];
  clockMonthNames: string[];
  sunsetActive: string;
  dayActive: string;
  redLightFilter: string;
  nightMode: string;
  nightModeActive: string;
  touchLock: string;
  touchLocked: string;
  touchLockSubtitle: string;
  touchLockHoldInstruction: string;
  unlockingProgress: string;
  settings: string;
  personalization: string;
  selectLanguage: string;
  languages: {
    en: string;
    sk: string;
    cs: string;
    pl: string;
    hu: string;
    uk: string;
    it: string;
  };
  statusCard: {
    activeTitle: string;
    inactiveTitle: string;
    readyDesc: string;
    stopBtn: string;
    startBtn: string;
  };
  modes: {
    light: {
      tabTitle: string;
      tabSubtitle: string;
      activeBadge: string;
      turnOn: string;
      turnOff: string;
      fullScreen: string;
      lightOffDesc: string;
      brightness: string;
      speed: string;
      speeds: {
        verySlow: string;
        slow: string;
        medium: string;
        breathing: string;
      };
      palettesTitle: string;
      shadesCount: string;
      changePalette: string;
      activePaletteOnly: string;
      customColorsTitle: string;
      customColorsHint: string;
      addColor: string;
      removeColor: string;
      pickColorOnWheel: string;
    };
    whiteNoise: {
      tabTitle: string;
      tabSubtitle: string;
      activeBadge: string;
      play: string;
      stop: string;
      volume: string;
      volumeTip: string;
      levelsTitle: string;
      levelsTip: string;
      activeLevelBadge: string;
      fadeActiveNotice: string;
      levels: {
        gentle: {
          title: string;
          levelNum: string;
          pitch: string;
          description: string;
          idealFor: string;
          frequency: string;
        };
        balanced: {
          title: string;
          levelNum: string;
          pitch: string;
          description: string;
          idealFor: string;
          frequency: string;
        };
        deep: {
          title: string;
          levelNum: string;
          pitch: string;
          description: string;
          idealFor: string;
          frequency: string;
        };
      };
    };
    nature: {
      tabTitle: string;
      tabSubtitle: string;
      activeBadge: string;
      play: string;
      stop: string;
      volume: string;
      volumeTip: string;
      selectionTitle: string;
      selectionTip: string;
      selectedBadge: string;
      natureSoundPrefix: string;
      fadeActiveNotice: string;
      sounds: {
        forest: {
          title: string;
          subtitle: string;
          description: string;
          rhythm: string;
        };
        rain: {
          title: string;
          subtitle: string;
          description: string;
          rhythm: string;
        };
        ocean: {
          title: string;
          subtitle: string;
          description: string;
          rhythm: string;
        };
        nightBirds: {
          title: string;
          subtitle: string;
          description: string;
          rhythm: string;
        };
        heartbeat: {
          title: string;
          subtitle: string;
          description: string;
          rhythm: string;
        };
      };
    };
    schedule?: {
      tabTitle: string;
      tabSubtitle: string;
      activeBadge: string;
    };
  };
  timer: {
    title: string;
    unlimitedDesc: string;
    setDurationDesc: string;
    remaining: string;
    add15m: string;
    reset: string;
    presetsTitle: string;
    presets: {
      m15: string;
      m30: string;
      m45: string;
      m60: string;
      m90: string;
      m120: string;
      unlimited: string;
    };
    fadeTitle: string;
    fadeRecommended: string;
    fadeDesc: string;
    fadeOn: string;
    fadeOff: string;
    minsLabel: string;
  };
  fullScreen: {
    nightLamp: string;
    tapToToggle: string;
    lockedNotice: string;
    backToMenu: string;
    colorCycle: string;
  };
  nightSettingsModal: {
    title: string;
    subtitle: string;
    sunsetHeading: string;
    sunsetDesc: string;
    currentSunset: string;
    currentDay: string;
    autoSunsetBtn: string;
    forceNightBtn: string;
    redFilterHeading: string;
    redFilterDesc: string;
    dimHeading: string;
    dimDesc: string;
    dimZero: string;
    dimMax: string;
    saveClose: string;
  };
  palettes: {
    warmSunset: { name: string; desc: string; mood: string };
    honeyCandle: { name: string; desc: string; mood: string };
    lavenderDusk: { name: string; desc: string; mood: string };
    moonlight: { name: string; desc: string; mood: string };
    forestMoss: { name: string; desc: string; mood: string };
    redMelatonin: { name: string; desc: string; mood: string };
    circadianScience: { name: string; desc: string; mood: string };
    customSpectrum: { name: string; desc: string; mood: string };
  };
  mainMenuButton: string;
  backToMenuTooltip: string;
  authorNotice: {
    title: string;
    message: string;
    email: string;
    copyEmail: string;
    copied: string;
    close: string;
  };
  changelogModal: {
    title: string;
    version: string;
    close: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    appName: 'Toddler sleep assistant',
    appSubtitle: 'Baby Sleep & Night Assistant',
    clockDayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    clockMonthNames: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ],
    sunsetActive: 'After Sunset',
    dayActive: 'Day Mode',
    redLightFilter: 'Red Light',
    nightMode: 'Night Mode',
    nightModeActive: 'Night Mode Active',
    touchLock: 'Child Lock',
    touchLocked: 'Locked',
    touchLockSubtitle: 'Touches are blocked to avoid accidental taps waking up your baby.',
    touchLockHoldInstruction: 'Hold for 1 second to unlock',
    unlockingProgress: 'Unlocking...',
    settings: 'Settings',
    personalization: 'Personalization & Settings',
    selectLanguage: 'Application Language',
    languages: {
      en: 'English (English)',
      sk: 'Slovenčina (Slovak)',
      cs: 'Čeština (Czech)',
      pl: 'Polski (Polish)',
      hu: 'Magyar (Hungarian)',
      uk: 'Українська (Ukrainian)',
      it: 'Italiano (Italian)',
    },
    statusCard: {
      activeTitle: 'Assistant is active',
      inactiveTitle: 'Assistant inactive',
      readyDesc: 'Tap Start to resume previous sleep modes',
      stopBtn: 'Stop',
      startBtn: 'Start',
    },
    modes: {
      light: {
        tabTitle: '1. Calm Light',
        tabSubtitle: 'Gradual soothing color spectrum',
        activeBadge: 'Light is on',
        turnOn: 'Turn On Calm Light',
        turnOff: 'Turn Off Light',
        fullScreen: 'Fullscreen Lamp',
        lightOffDesc: 'Tap the button below to start soothing sleep lighting',
        brightness: 'Brightness',
        speed: 'Color Shift Speed',
        speeds: {
          verySlow: 'Very slow (16s)',
          slow: 'Slow (9s)',
          medium: 'Medium (5s)',
          breathing: 'Rhythmic breath (6s)',
        },
        palettesTitle: 'Select Soothing Color Spectrum',
        shadesCount: 'shades',
        changePalette: 'Change Palette',
        activePaletteOnly: 'Active Palette',
        customColorsTitle: 'Custom Palette Colors',
        customColorsHint: 'Choose 2 to 6 colors using the color wheel',
        addColor: 'Add Color',
        removeColor: 'Remove Color',
        pickColorOnWheel: 'Touch or drag on wheel to pick color',
      },
      whiteNoise: {
        tabTitle: '2. White Noise',
        tabSubtitle: '3 intensity levels in seamless loop',
        activeBadge: 'Playing noise',
        play: 'Play White Noise',
        stop: 'Stop White Noise',
        volume: 'White Noise Volume',
        volumeTip: 'Tip: Recommended volume for infant sleep is around 50–60 dB (gentle background wash).',
        levelsTitle: '3 White Noise Intensity Levels',
        levelsTip: 'Choose according to your baby’s comfort',
        activeLevelBadge: 'Active',
        fadeActiveNotice: 'Gradual volume fade-out active',
        levels: {
          gentle: {
            title: 'Gentle Noise',
            levelNum: 'Level 1',
            pitch: 'Soft Whisper (Pink Filter)',
            description: 'Silky smooth noise with rolled-off highs. Soft and gentle on infant ears.',
            idealFor: 'Newborns, naps, quiet nursery',
            frequency: 'Low-pass warm filter (~950 Hz)',
          },
          balanced: {
            title: 'Balanced Noise',
            levelNum: 'Level 2',
            pitch: 'Standard White Noise',
            description: 'Classic acoustic blanket masking household sounds, television, and street noise.',
            idealFor: 'Masking footsteps, conversations & street',
            frequency: 'Broadband spectrum (~2400 Hz)',
          },
          deep: {
            title: 'Deep Noise (Womb)',
            levelNum: 'Level 3',
            pitch: 'Brownian Womb Sound',
            description: 'Warm resonant frequencies resembling maternal heartbeat and uterine blood flow.',
            idealFor: 'Colic, restless soothing, crying',
            frequency: 'Deep brown noise (~450 Hz)',
          },
        },
      },
      nature: {
        tabTitle: '3. Nature Sounds',
        tabSubtitle: 'Forest, rain, waves & night birds',
        activeBadge: 'Playing sounds',
        play: 'Play Nature Sounds',
        stop: 'Stop Nature Sounds',
        volume: 'Nature Sounds Volume',
        volumeTip: 'Nature soundscapes are generated seamlessly with zero loop breaks.',
        selectionTitle: 'Select Nature Soundscape',
        selectionTip: 'Tap to instantly switch',
        selectedBadge: 'Selected',
        natureSoundPrefix: 'Nature Sound',
        fadeActiveNotice: 'Gradual nature fade-out active',
        sounds: {
          forest: {
            title: 'Quiet Forest',
            subtitle: 'Rustling trees & gentle breeze',
            description: 'Soft wind through pine needles and leaves, naturally slowing baby’s breathing.',
            rhythm: 'Slow breeze & forest whisper',
          },
          rain: {
            title: 'Gentle Rain',
            subtitle: 'Raindrops & soft summer shower',
            description: 'Hypnotic rhythmic rain falling on windows and leaves, creating a cozy and secure space.',
            rhythm: 'Even soothing patter of drops',
          },
          ocean: {
            title: 'Ocean Waves',
            subtitle: 'Slow ocean tide & shoreline foam',
            description: 'Rhythmic 8-second tidal swell cycle imitating slow deep breathing and calm heartbeat.',
            rhythm: 'Rhythmic 8s swells & sea foam',
          },
          nightBirds: {
            title: 'Night Forest Birds',
            subtitle: 'Forest owls & night calls',
            description: 'Gentle distant owl hoots and soft nocturnal woodland atmosphere under starry skies.',
            rhythm: 'Gentle distant night calls',
          },
          heartbeat: {
            title: 'Heartbeat',
            subtitle: "Mother's pulse from the womb",
            description: 'Authentic muffled maternal heartbeat as heard from inside amniotic fluid. Deep reassuring rhythm providing calm and safety without unnecessary background noise.',
            rhythm: 'Gentle womb tempo ~68 BPM',
          },
        },
      },
      schedule: {
        tabTitle: '4. Schedule Assistant',
        tabSubtitle: 'Track naps, sleep sessions & export',
        activeBadge: 'Tracking',
      },
    },
    timer: {
      title: 'Sleep Timer',
      unlimitedDesc: 'Playing continuously with no time limit',
      setDurationDesc: 'Automatic shutdown set for {mins} minutes',
      remaining: 'Remaining',
      add15m: '+15m',
      reset: 'Reset',
      presetsTitle: 'Time settings:',
      presets: {
        m15: '15 min',
        m30: '30 min',
        m45: '45 min',
        m60: '60 min (1h)',
        m90: '90 min (1.5h)',
        m120: '120 min (2h)',
        unlimited: 'Unlimited (∞)',
      },
      fadeTitle: 'Gradual Volume Fade-Out before shutdown',
      fadeRecommended: 'Recommended',
      fadeDesc: 'Sound softly and imperceptibly attenuates to silence over the final minutes to prevent sudden silence from waking baby.',
      fadeOn: 'Fade-out ON',
      fadeOff: 'Fade-out OFF',
      minsLabel: 'min',
    },
    fullScreen: {
      nightLamp: 'Night Lamp',
      tapToToggle: 'Tap anywhere to show controls',
      lockedNotice: 'Screen is locked',
      backToMenu: 'Back to menu',
      colorCycle: 'color cycle',
    },
    nightSettingsModal: {
      title: 'Settings & Personalization',
      subtitle: 'Language, night mode, and baby eye safety',
      sunsetHeading: 'Automatic After Sunset',
      sunsetDesc: 'After 18:00 (6 PM), the app automatically switches to dim, eye-friendly night mode.',
      currentSunset: 'Current: After Sunset',
      currentDay: 'Current: Daytime',
      autoSunsetBtn: 'Auto (18:00 - 07:00)',
      forceNightBtn: 'Force Night Mode',
      redFilterHeading: 'Melatonin Red Night Filter',
      redFilterDesc: 'Blocks 100% of blue light to protect natural melatonin production during night feeds.',
      dimHeading: 'Extra Screen Dimming Overlay',
      dimDesc: 'Software dimming overlay for completely dark rooms when phone hardware minimum is still too bright.',
      dimZero: '0% (Standard)',
      dimMax: '75% (Maximum dimming)',
      saveClose: 'Save & Close',
    },
    palettes: {
      warmSunset: {
        name: 'Warm Sunset',
        desc: 'Warm amber and peach hues supporting natural melatonin sleep hormone production.',
        mood: 'Warm and secure',
      },
      honeyCandle: {
        name: 'Honey Candlelight',
        desc: 'Soft golden glow resembling a silent candle flame in the nursery.',
        mood: 'Cozy and quiet',
      },
      lavenderDusk: {
        name: 'Lavender Dusk',
        desc: 'Gentle pastel lavender and lilac tones helping baby unwind after a busy day.',
        mood: 'Dreamy and calming',
      },
      moonlight: {
        name: 'Moonlight Calm',
        desc: 'Tender indigo and deep starry night blue imitating a serene night sky.',
        mood: 'Deep and tranquil',
      },
      forestMoss: {
        name: 'Forest Moss',
        desc: 'Soothing sage and forest greenery acting gently on restless senses.',
        mood: 'Natural and fresh',
      },
      redMelatonin: {
        name: 'Red Night Light (0% Blue Light)',
        desc: 'Deep ruby bulb for night nursing and diaper changes without disrupting baby’s sleep cycle.',
        mood: 'Undisturbed sleep',
      },
      circadianScience: {
        name: 'Circadian Spectrum',
        desc: 'Based on sleep laboratory research.',
        mood: 'Science deep sleep',
      },
      customSpectrum: {
        name: 'Custom Spectrum',
        desc: 'Pick your own 2 to 6 calming colors using the interactive color wheel.',
        mood: 'Personalized palette',
      },
    },
    mainMenuButton: 'Main Menu',
    backToMenuTooltip: 'Back to main menu',
    authorNotice: {
      title: 'About the Author',
      message: 'Created for all patient parents. For tips or bug reports, feel free to write to msglitchapps@gmail.com .',
      email: 'msglitchapps@gmail.com',
      copyEmail: 'Copy email',
      copied: 'Copied!',
      close: 'Close',
    },
    changelogModal: {
      title: 'Version History & Changelog',
      version: 'Version',
      close: 'Close',
    },
  },
  sk: {
    appName: 'Toddler sleep assistant',
    appSubtitle: 'Detský uspávací asistent',
    clockDayNames: ['Nedeľa', 'Pondelok', 'Utorok', 'Streda', 'Štvrtok', 'Piatok', 'Sobota'],
    clockMonthNames: [
      'januára', 'februára', 'marca', 'apríla', 'mája', 'júna',
      'júla', 'augusta', 'septembra', 'októbra', 'novembra', 'decembra',
    ],
    sunsetActive: 'Po západe slnka',
    dayActive: 'Denný režim',
    redLightFilter: 'Červené svetlo',
    nightMode: 'Nočný režim',
    nightModeActive: 'Nočný režim aktívny',
    touchLock: 'Detský zámok',
    touchLocked: 'Zamknuté',
    touchLockSubtitle: 'Dotyky sú zablokované, aby náhodné stlačenie neprebudilo dieťatko.',
    touchLockHoldInstruction: 'Podržte 1 sekundu pre odomknutie',
    unlockingProgress: 'Odomykám...',
    settings: 'Nastavenia',
    personalization: 'Personalizácia a jazyk',
    selectLanguage: 'Jazyk aplikácie',
    languages: {
      en: 'English (Angličtina)',
      sk: 'Slovenčina (Predvolená)',
      cs: 'Čeština',
      pl: 'Polski (Poľština)',
      hu: 'Magyar (Maďarčina)',
      uk: 'Українська (Ukrajinčina)',
      it: 'Italiano (Taliančina)',
    },
    statusCard: {
      activeTitle: 'Asistent je aktívny',
      inactiveTitle: 'Asistent neaktívny',
      readyDesc: 'Klepnutím na spustiť obnovíte predošlé režimy',
      stopBtn: 'Zastaviť',
      startBtn: 'Spustiť',
    },
    modes: {
      light: {
        tabTitle: '1. Pokojné svetlo',
        tabSubtitle: 'Postupná zmena jemných farieb',
        activeBadge: 'Svetlo svieti',
        turnOn: 'Zapnúť pokojné svetlo',
        turnOff: 'Vypnúť svetlo',
        fullScreen: 'Celá obrazovka',
        lightOffDesc: 'Dotknite sa tlačidla nižšie pre spustenie upokojujúceho svetla',
        brightness: 'Jas svetla',
        speed: 'Rýchlosť premeny farieb',
        speeds: {
          verySlow: 'Veľmi pomalá (16s)',
          slow: 'Pomalá (9s)',
          medium: 'Stredná (5s)',
          breathing: 'Rytmický dych (6s)',
        },
        palettesTitle: 'Výber upokojujúceho spektra farieb',
        shadesCount: 'odtieňov',
        changePalette: 'Zmeniť paletu',
        activePaletteOnly: 'Aktívna paleta',
        customColorsTitle: 'Vlastné farby spektra',
        customColorsHint: 'Vyberte 2 až 6 ľubovoľných farieb pomocou farebného kolieska',
        addColor: 'Pridať farbu',
        removeColor: 'Odstrániť',
        pickColorOnWheel: 'Dotknite sa alebo potiahnite po koliesku',
      },
      whiteNoise: {
        tabTitle: '2. Biely šum',
        tabSubtitle: '3 úrovne intenzity v slučke',
        activeBadge: 'Hrá šum',
        play: 'Spustiť biely šum',
        stop: 'Zastaviť biely šum',
        volume: 'Hlasitosť bieleho šumu',
        volumeTip: 'Tip: Odporúčaná hlasitosť pre spánok novorodencov je okolo 50–60 dB (jemné šumenie v pozadí).',
        levelsTitle: '3 úrovne intenzity bieleho šumu',
        levelsTip: 'Vyberte podľa potreby dieťaťa',
        activeLevelBadge: 'Aktívny',
        fadeActiveNotice: 'Postupné stlmovanie zvuku aktívne',
        levels: {
          gentle: {
            title: 'Jemný šum',
            levelNum: 'Úroveň 1',
            pitch: 'Mäkký šepot (Ružový filter)',
            description: 'Zamatovo hebký, jemný šum so stiahnutými vysokými tónmi. Nedráždi citlivé ušká bábätka.',
            idealFor: 'Novorodenci, denný spánok a tichá izba',
            frequency: 'Nízkofrekvenčný filter (~950 Hz)',
          },
          balanced: {
            title: 'Stredný šum',
            levelNum: 'Úroveň 2',
            pitch: 'Vyvážený biely šum',
            description: 'Klasický akustický plášť, ktorý spoľahlivo prekryje zvuky z domácnosti, televízora či ulice.',
            idealFor: 'Prekrytie krokov, reči a ruchov v byte',
            frequency: 'Široké spektrum (~2400 Hz)',
          },
          deep: {
            title: 'Hlboký šum (Womb)',
            levelNum: 'Úroveň 3',
            pitch: 'Hnedý / prenatálny šum',
            description: 'Hlboké, hrejivé rezonancie pripomínajúce tlkot srdca a prietok krvi v maternici matky.',
            idealFor: 'Kolika, nepokojné zaspávanie, plač',
            frequency: 'Hlboký hnedý šum (~450 Hz)',
          },
        },
      },
      nature: {
        tabTitle: '3. Zvuky prírody',
        tabSubtitle: 'Les, dážď, vlny & nočné vtáky',
        activeBadge: 'Hrajú zvuky',
        play: 'Spustiť zvuky prírody',
        stop: 'Zastaviť zvuky prírody',
        volume: 'Hlasitosť prírodných zvukov',
        volumeTip: 'Zvuky prírody sa generujú plynule bez prerušenia alebo skokov v slučke.',
        selectionTitle: 'Výber scenérie prírody',
        selectionTip: 'Dotknite sa pre okamžité prepnutie',
        selectedBadge: 'Vybrané',
        natureSoundPrefix: 'Zvuk prírody',
        fadeActiveNotice: 'Postupné stlmovanie prírody aktívne',
        sounds: {
          forest: {
            title: 'Tichý les',
            subtitle: 'Šumenie stromov a vánok',
            description: 'Mäkký šum vetra v korunách ihličnanov a lístia, ktorý prirodzene spomaľuje dych dieťaťa.',
            rhythm: 'Pomalý vánok a lesný šelest',
          },
          rain: {
            title: 'Jemný dážď',
            subtitle: 'Kvapky dažďa a tichý lejak',
            description: 'Hypnotizujúci rytmický dáždik padajúci na okná a lístie, vytvárajúci pocit bezpečia v teple domova.',
            rhythm: 'Rovnomerný šum kvapiek',
          },
          ocean: {
            title: 'Morské vlny',
            subtitle: 'Pomalý príliv a odliv pláže',
            description: 'Pravidelný 8-sekundový cyklus morského prílivu imitujúci pomalý dych a pokojný tep srdca.',
            rhythm: 'Rytmické 8s vlny a morská pena',
          },
          nightBirds: {
            title: 'Nočné lesné vtáky',
            subtitle: 'Lesné sovy a nočné štebotanie',
            description: 'Tiché a jemné húkanie nočnej sovy v diaľke lesa s atmosférou pokojnej hviezdnej noci.',
            rhythm: 'Pokojné nočné volania v diaľke',
          },
          heartbeat: {
            title: 'Tlkot srdca',
            subtitle: 'Matkin pulz v maternici',
            description: 'Autentický, tlmený tlkot matkinho srdca počúvaný z vnútra plodovej vody. Upokojujúci primárny zvuk prinášajúci dieťatku pocit bezpečia bez zbytočného šumu.',
            rhythm: 'Tlmený rytmus ~68 BPM',
          },
        },
      },
      schedule: {
        tabTitle: '4. Asistent spánkového režimu',
        tabSubtitle: 'Sledovanie bdelosti, spánku a história',
        activeBadge: 'Sleduje sa',
      },
    },
    timer: {
      title: 'Časovač vypnutia',
      unlimitedDesc: 'Hrá nepretržite bez časového obmedzenia',
      setDurationDesc: 'Automatické vypnutie nastavené na {mins} minút',
      remaining: 'Zostáva',
      add15m: '+15m',
      reset: 'Reset',
      presetsTitle: 'Nastavenie času:',
      presets: {
        m15: '15 minút',
        m30: '30 minút',
        m45: '45 minút',
        m60: '60 minút (1h)',
        m90: '90 minút (1,5h)',
        m120: '120 minút (2h)',
        unlimited: 'Bez limitu (∞)',
      },
      fadeTitle: 'Postupné stlmenie zvuku pred vypnutím',
      fadeRecommended: 'Odporúčané',
      fadeDesc: 'Zvuk sa v priebehu záverečných minút plynulo a nečujne stíši do nuly, aby bábätko neprebudilo náhle ticho.',
      fadeOn: 'Stlmenie ZAPNUTÉ',
      fadeOff: 'Stlmenie VYPNUTÉ',
      minsLabel: 'min',
    },
    fullScreen: {
      nightLamp: 'Nočná lampa',
      tapToToggle: 'Dotknite sa pre zobrazenie ovládania',
      lockedNotice: 'Obrazovka je zamknutá',
      backToMenu: 'Späť do menu',
      colorCycle: 'prechod farieb',
    },
    nightSettingsModal: {
      title: 'Nastavenia a prispôsobenie',
      subtitle: 'Jazyk, nočný režim a ochrana zraku dieťaťa',
      sunsetHeading: 'Automaticky po západe slnka',
      sunsetDesc: 'Po 18:00 hodine sa aplikácia automaticky prepne do tmavého, nerušiaceho zobrazenia, ktoré neoslňuje.',
      currentSunset: 'Aktuálne: Po západe slnka',
      currentDay: 'Aktuálne: Deň',
      autoSunsetBtn: 'Automaticky (18:00 - 07:00)',
      forceNightBtn: 'Vynútiť nočný režim',
      redFilterHeading: 'Ochranný červený nočný filter',
      redFilterDesc: 'Úplne eliminuje modré svetlo (0 % modrého spektra), čím chráni tvorbu melatonínu pri nočnom kŕmení.',
      dimHeading: 'Extra nočné stlmenie displeja',
      dimDesc: 'Pridá softvérové stmavenie pre mobil v úplnej tme, keď je aj minimálny jas displeja príliš silný.',
      dimZero: '0% (Štandard)',
      dimMax: '75% (Maximum stmavenia)',
      saveClose: 'Uložiť a zavrieť',
    },
    palettes: {
      warmSunset: {
        name: 'Teplý západ slnka',
        desc: 'Jantárové a broskyňové tóny podporujúce prirodzenú tvorbu spánkového hormónu melatonínu.',
        mood: 'Hrejivý a bezpečný',
      },
      honeyCandle: {
        name: 'Medový svit sviečky',
        desc: 'Mäkké zlatisté svetlo pripomínajúce tichý plamienok sviečky v detskej izbičke.',
        mood: 'Útulný a tichý',
      },
      lavenderDusk: {
        name: 'Levanduľový súmrak',
        desc: 'Jemné pastelové fialové a orgovánové tóny pre uvoľnenie bábätka po celom dni.',
        mood: 'Snový a upokojujúci',
      },
      moonlight: {
        name: 'Mesačný svit',
        desc: 'Nežné indigo a nočná hviezdna modrá imitujúca tichú nočnú oblohu.',
        mood: 'Tichý a hlboký',
      },
      forestMoss: {
        name: 'Lesný mach',
        desc: 'Utišujúca šalviová a lesná zeleň pôsobiaca blahodarne na nepokojné zmysly.',
        mood: 'Prírodný a svieži',
      },
      redMelatonin: {
        name: 'Červené nočné svetlo (0% modrého svetla)',
        desc: 'Hlboká rubínová žiarovka pre nočné kŕmenie a prebaľovanie bez narušenia spánkového cyklu.',
        mood: 'Nerušený spánok',
      },
      circadianScience: {
        name: 'Cirkadiálne spektrum',
        desc: 'Na základe výskumu spánkových laboratórií.',
        mood: 'Vedecký spánok',
      },
      customSpectrum: {
        name: 'Ľubovoľné (vlastné)',
        desc: 'Vlastný výber 2 až 6 upokojujúcich farieb pomocou interaktívneho farebného kolieska.',
        mood: 'Vlastná paleta',
      },
    },
    mainMenuButton: 'Hlavné menu',
    backToMenuTooltip: 'Späť do hlavného menu',
    authorNotice: {
      title: 'O autorovi',
      message: 'Vytvorené pre všetkých trpezlivých rodičov. Pre tipy alebo hlásenia chýb mi môžete písať na msglitchapps@gmail.com .',
      email: 'msglitchapps@gmail.com',
      copyEmail: 'Skopírovať e-mail',
      copied: 'Skopírované!',
      close: 'Zavrieť',
    },
    changelogModal: {
      title: 'História verzií a novinky',
      version: 'Verzia',
      close: 'Zavrieť',
    },
  },
  cs: {
    appName: 'Toddler sleep assistant',
    appSubtitle: 'Dětský uspávací asistent',
    clockDayNames: ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'],
    clockMonthNames: [
      'ledna', 'února', 'března', 'dubna', 'května', 'června',
      'července', 'srpna', 'září', 'října', 'listopadu', 'prosince',
    ],
    sunsetActive: 'Po západu slunce',
    dayActive: 'Denní režim',
    redLightFilter: 'Červené světlo',
    nightMode: 'Noční režim',
    nightModeActive: 'Noční režim aktivní',
    touchLock: 'Dětský zámek',
    touchLocked: 'Zamčeno',
    touchLockSubtitle: 'Dotyky jsou uzamčeny, aby náhodný stisk neprobudil děťátko.',
    touchLockHoldInstruction: 'Podržte 1 sekundu pro odemčení',
    unlockingProgress: 'Odemykám...',
    settings: 'Nastavení',
    personalization: 'Personalizace a jazyk',
    selectLanguage: 'Jazyk aplikace',
    languages: {
      en: 'English (Angličtina)',
      sk: 'Slovenčina',
      cs: 'Čeština',
      pl: 'Polski (Polština)',
      hu: 'Magyar (Maďarština)',
      uk: 'Українська (Ukrajinština)',
      it: 'Italiano (Italština)',
    },
    statusCard: {
      activeTitle: 'Asistent je aktivní',
      inactiveTitle: 'Asistent neaktivní',
      readyDesc: 'Klepnutím na spustit obnovíte předchozí režimy',
      stopBtn: 'Zastavit',
      startBtn: 'Spustit',
    },
    modes: {
      light: {
        tabTitle: '1. Klidné světlo',
        tabSubtitle: 'Postupná proměna jemných barev',
        activeBadge: 'Světlo svítí',
        turnOn: 'Zapnout klidné světlo',
        turnOff: 'Vypnout světlo',
        fullScreen: 'Celá obrazovka',
        lightOffDesc: 'Klepněte na tlačítko níže pro spuštění uklidňujícího světla',
        brightness: 'Jas světla',
        speed: 'Rychlost proměny barev',
        speeds: {
          verySlow: 'Velmi pomalá (16s)',
          slow: 'Pomalá (9s)',
          medium: 'Střední (5s)',
          breathing: 'Rytmický dech (6s)',
        },
        palettesTitle: 'Výběr uklidňujícího spektra barev',
        shadesCount: 'odstínů',
        changePalette: 'Změnit paletu',
        activePaletteOnly: 'Aktivní paleta',
        customColorsTitle: 'Vlastní barvy spektra',
        customColorsHint: 'Vyberte 2 až 6 libovolných barev pomocí barevného kolečka',
        addColor: 'Přidat barvu',
        removeColor: 'Odebrat',
        pickColorOnWheel: 'Klepněte nebo táhněte po kolečku',
      },
      whiteNoise: {
        tabTitle: '2. Bílý šum',
        tabSubtitle: '3 úrovně intenzity ve smyčce',
        activeBadge: 'Hraje šum',
        play: 'Spustit bílý šum ve smyčce',
        stop: 'Zastavit bílý šum',
        volume: 'Hlasitost bílého šumu',
        volumeTip: 'Tip: Doporučená hlasitost pro spánek novorozenců je kolem 50–60 dB (jemné šumění v pozadí).',
        levelsTitle: '3 úrovně intenzity bílého šumu',
        levelsTip: 'Vyberte dle potřeby dítěte',
        activeLevelBadge: 'Aktivní',
        fadeActiveNotice: 'Postupné ztišování zvuku aktivní',
        levels: {
          gentle: {
            title: 'Jemný šum',
            levelNum: 'Úroveň 1',
            pitch: 'Měkký šepot (Růžový filtr)',
            description: 'Sametově hebký, jemný šum se staženými vysokými tóny. Nedráždí citlivá ouška miminka.',
            idealFor: 'Novorozenci, denní spánek a tichý pokoj',
            frequency: 'Nízkofrekvenční filtr (~950 Hz)',
          },
          balanced: {
            title: 'Střední šum',
            levelNum: 'Úroveň 2',
            pitch: 'Vyvážený bílý šum',
            description: 'Klasický akustický plášť, který spolehlivě překryje zvuky z domácnosti, televize či ulice.',
            idealFor: 'Překrytí kroků, hovoru a ruchů v bytě',
            frequency: 'Široké spektrum (~2400 Hz)',
          },
          deep: {
            title: 'Hluboký šum (Womb)',
            levelNum: 'Úroveň 3',
            pitch: 'Hnědý / prenatální šum',
            description: 'Hluboké, hřejivé rezonance připomínající tlukot srdce a proud krve v děloze maminky.',
            idealFor: 'Kolika, neklidné usínání, pláč',
            frequency: 'Hluboký hnědý šum (~450 Hz)',
          },
        },
      },
      nature: {
        tabTitle: '3. Zvuky přírody',
        tabSubtitle: 'Les, déšť, vlny & noční ptáci',
        activeBadge: 'Hrají zvuky',
        play: 'Spustit zvuky přírody',
        stop: 'Zastavit zvuky přírody',
        volume: 'Hlasitost přírodních zvuků',
        volumeTip: 'Zvuky přírody se generují plynule bez přerušení ve smyčce.',
        selectionTitle: 'Výběr scenérie přírody',
        selectionTip: 'Klepněte pro okamžité přepnutí',
        selectedBadge: 'Vybráno',
        natureSoundPrefix: 'Zvuk přírody',
        fadeActiveNotice: 'Postupné ztišování přírody aktivní',
        sounds: {
          forest: {
            title: 'Tichý les',
            subtitle: 'Šumění stromů a vánek',
            description: 'Měkký šum větru v korunách jehličnanů a listí, který přirozeně zpomaluje dech dítěte.',
            rhythm: 'Pomalý vánek a lesní ševelení',
          },
          rain: {
            title: 'Jemný déšť',
            subtitle: 'Kapky deště a tichý liják',
            description: 'Hypnotizující rytmický deštík dopadající na okna a listí pro pocit bezpečí a tepla.',
            rhythm: 'Rovnoměrný šum kapek',
          },
          ocean: {
            title: 'Mořské vlny',
            subtitle: 'Pomalý příliv a odliv pláže',
            description: 'Pravidelný 8sekundový cyklus mořského přílivu imitující pomalý dech a klidný tep srdce.',
            rhythm: 'Rytmické 8s vlny a mořská pěna',
          },
          nightBirds: {
            title: 'Noční lesní ptáci',
            subtitle: 'Lesní sovy a noční ševelení',
            description: 'Tiché a jemné houkání lesní sovy v dálce s atmosférou klidné hvězdné noci.',
            rhythm: 'Klidné noční volání v dáli',
          },
          heartbeat: {
            title: 'Tlukot srdce',
            subtitle: 'Matčin puls z dělohy',
            description: 'Autentický tlumený tlukot matčina srdce z nitra dělohy. Hluboký uklidňující rytmus bez zbytečného šumu.',
            rhythm: 'Tlumený rytmus ~68 BPM',
          },
        },
      },
      schedule: {
        tabTitle: '4. Asistent spánkového režimu',
        tabSubtitle: 'Sledování bdělosti, spánku a historie',
        activeBadge: 'Sleduje se',
      },
    },
    timer: {
      title: 'Časovač vypnutí',
      unlimitedDesc: 'Hraje nepřetržitě bez časového omezení',
      setDurationDesc: 'Automatické vypnutí nastaveno na {mins} minut',
      remaining: 'Zbývá',
      add15m: '+15m',
      reset: 'Reset',
      presetsTitle: 'Nastavení času:',
      presets: {
        m15: '15 minut',
        m30: '30 minut',
        m45: '45 minut',
        m60: '60 minut (1h)',
        m90: '90 minut (1,5h)',
        m120: '120 minut (2h)',
        unlimited: 'Bez limitu (∞)',
      },
      fadeTitle: 'Postupné ztišení zvuku před vypnutím',
      fadeRecommended: 'Doporučeno',
      fadeDesc: 'Zvuk se v průběhu závěrečných minut plynule a neslyšně ztiší do nuly, aby miminko neprobudilo náhlé ticho.',
      fadeOn: 'Ztišení ZAPNUTO',
      fadeOff: 'Ztišení VYPNUTO',
      minsLabel: 'min',
    },
    fullScreen: {
      nightLamp: 'Noční lampa',
      tapToToggle: 'Klepněte pro zobrazení ovládání',
      lockedNotice: 'Obrazovka je zamčena',
      backToMenu: 'Zpět do menu',
      colorCycle: 'proměna barev',
    },
    nightSettingsModal: {
      title: 'Nastavení a přizpůsobení',
      subtitle: 'Jazyk, noční režim a ochrana zraku dítěte',
      sunsetHeading: 'Automaticky po západu slunce',
      sunsetDesc: 'Po 18:00 se aplikace automaticky přepne do tmavého, nerušícího zobrazení.',
      currentSunset: 'Aktuálně: Po západu slunce',
      currentDay: 'Aktuálně: Den',
      autoSunsetBtn: 'Automaticky (18:00 - 07:00)',
      forceNightBtn: 'Vynutit noční režim',
      redFilterHeading: 'Ochranný červený noční filtr',
      redFilterDesc: 'Zcela eliminuje modré světlo (0 % modrého spektra), čímž chrání tvorbu melatoninu.',
      dimHeading: 'Extra noční ztmavení displeje',
      dimDesc: 'Přidá softwarové ztmavení pro mobil v naprosté tmě, když je i minimální jas displeje příliš ostrý.',
      dimZero: '0% (Standard)',
      dimMax: '75% (Maximum ztmavení)',
      saveClose: 'Uložit a zavřít',
    },
    palettes: {
      warmSunset: {
        name: 'Teplý západ slunce',
        desc: 'Jantarové a broskvové tóny podporující přirozenou tvorbu spánkového hormonu melatoninu.',
        mood: 'Hřejivý a bezpečný',
      },
      honeyCandle: {
        name: 'Medový svit svíčky',
        desc: 'Měkké zlatavé světlo připomínající tichý plamínek svíčky v dětském pokoji.',
        mood: 'Útulný a tichý',
      },
      lavenderDusk: {
        name: 'Levandulový soumrak',
        desc: 'Jemné pastelové fialové a šeříkové tóny pro uvolnění miminka po celém dni.',
        mood: 'Snový a uklidňující',
      },
      moonlight: {
        name: 'Měsíční svit',
        desc: 'Něžné indigo a noční hvězdná modř imitující tichou noční oblohu.',
        mood: 'Tichý a hluboký',
      },
      forestMoss: {
        name: 'Lesní mech',
        desc: 'Utišující šalvějová a lesní zeleň působící blahodárně na neklidné smysly.',
        mood: 'Přírodní a svěží',
      },
      redMelatonin: {
        name: 'Červené noční světlo (0% modrého světla)',
        desc: 'Hluboká rubínová žárovka pro noční krmení a přebalování bez narušení spánkového cyklu.',
        mood: 'Nerušený spánek',
      },
      circadianScience: {
        name: 'Cirkadiální spektrum',
        desc: 'Na základě výzkumu spánkových laboratoří.',
        mood: 'Vědecký spánek',
      },
      customSpectrum: {
        name: 'Vlastní (volitelné)',
        desc: 'Vlastní výběr 2 až 6 uklidňujících barev pomocí interaktivního barevného kolečka.',
        mood: 'Vlastní paleta',
      },
    },
    mainMenuButton: 'Hlavní menu',
    backToMenuTooltip: 'Zpět do hlavního menu',
    authorNotice: {
      title: 'O autorovi',
      message: 'Vytvořeno pro všechny trpělivé rodiče. Pro tipy nebo hlášení chyb mi můžete psát na msglitchapps@gmail.com .',
      email: 'msglitchapps@gmail.com',
      copyEmail: 'Zkopírovat e-mail',
      copied: 'Zkopírováno!',
      close: 'Zavřít',
    },
    changelogModal: {
      title: 'Historie verzí a novinky',
      version: 'Verze',
      close: 'Zavřít',
    },
  },
  pl: {
    appName: 'Toddler sleep assistant',
    appSubtitle: 'Asystent snu i lampka nocna',
    clockDayNames: ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'],
    clockMonthNames: [
      'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
      'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia',
    ],
    sunsetActive: 'Po zachodzie słońca',
    dayActive: 'Tryb dzienny',
    redLightFilter: 'Czerwone światło',
    nightMode: 'Tryb nocny',
    nightModeActive: 'Tryb nocny aktywny',
    touchLock: 'Blokada dotyku',
    touchLocked: 'Zablokowane',
    touchLockSubtitle: 'Dotyk jest zablokowany, aby przypadkowe dotknięcie nie obudziło dziecka.',
    touchLockHoldInstruction: 'Przytrzymaj 1 sekundę, aby odblokować',
    unlockingProgress: 'Odblokowywanie...',
    settings: 'Ustawienia',
    personalization: 'Personalizacja i język',
    selectLanguage: 'Język aplikacji',
    languages: {
      en: 'English (Angielski)',
      sk: 'Slovenčina (Słowacki)',
      cs: 'Čeština (Czeski)',
      pl: 'Polski',
      hu: 'Magyar (Węgierski)',
      uk: 'Українська (Ukraiński)',
      it: 'Italiano (Włoski)',
    },
    statusCard: {
      activeTitle: 'Asystent jest aktywny',
      inactiveTitle: 'Asystent nieaktywny',
      readyDesc: 'Dotknij uruchom, aby wznowić poprzednie tryby',
      stopBtn: 'Zatrzymaj',
      startBtn: 'Uruchom',
    },
    modes: {
      light: {
        tabTitle: '1. Spokojne światło',
        tabSubtitle: 'Łagodne przejścia kolorów',
        activeBadge: 'Światło włączone',
        turnOn: 'Włącz spokojne światło',
        turnOff: 'Wyłącz światło',
        fullScreen: 'Pełny ekran',
        lightOffDesc: 'Dotknij przycisku poniżej, aby włączyć kojące światło nocne',
        brightness: 'Jasność',
        speed: 'Szybkość zmiany kolorów',
        speeds: {
          verySlow: 'Bardzo wolna (16s)',
          slow: 'Wolna (9s)',
          medium: 'Średnia (5s)',
          breathing: 'Rytm oddechu (6s)',
        },
        palettesTitle: 'Wybór kojącego spektrum barw',
        shadesCount: 'odcieni',
        changePalette: 'Zmień paletę',
        activePaletteOnly: 'Aktywna paleta',
        customColorsTitle: 'Własne kolory spektrum',
        customColorsHint: 'Wybierz od 2 do 6 kolorów za pomocą koła barw',
        addColor: 'Dodaj kolor',
        removeColor: 'Usuń',
        pickColorOnWheel: 'Dotknij lub przeciągnij po kole barw',
      },
      whiteNoise: {
        tabTitle: '2. Biały szum',
        tabSubtitle: '3 poziomy intensywności w pętli',
        activeBadge: 'Szum włączony',
        play: 'Włącz biały szum',
        stop: 'Zatrzymaj biały szum',
        volume: 'Głośność szumu',
        volumeTip: 'Wskazówka: Zalecana głośność dla snu niemowląt to około 50–60 dB (delikatny szum w tle).',
        levelsTitle: '3 poziomy intensywności białego szumu',
        levelsTip: 'Wybierz według potrzeb dziecka',
        activeLevelBadge: 'Aktywny',
        fadeActiveNotice: 'Stopniowe wyciszanie aktywne',
        levels: {
          gentle: {
            title: 'Delikatny szum',
            levelNum: 'Poziom 1',
            pitch: 'Miękki szept (Filtr różowy)',
            description: 'Aksamitny, miękki szum ze zredukowanymi wysokimi tonami. Bardzo łagodny dla uszu niemowlęcia.',
            idealFor: 'Noworodki, drzemki i cichy pokój',
            frequency: 'Filtr dolnoprzepustowy (~950 Hz)',
          },
          balanced: {
            title: 'Zrównoważony szum',
            levelNum: 'Poziom 2',
            pitch: 'Klasyczny biały szum',
            description: 'Akustyczna tarcza tłumiąca hałasy domowe, telewizor i dźwięki ulicy.',
            idealFor: 'Tłumienie kroków, rozmów i hałasów',
            frequency: 'Szerokie spektrum (~2400 Hz)',
          },
          deep: {
            title: 'Głęboki szum (Womb)',
            levelNum: 'Poziom 3',
            pitch: 'Szum brązowy / prenatalny',
            description: 'Głębokie, ciepłe brzmienie imitujące bicie serca i szum krwi w łonie matki.',
            idealFor: 'Kolka, niepokój, trudności z zasypianiem',
            frequency: 'Głęboki szum brązowy (~450 Hz)',
          },
        },
      },
      nature: {
        tabTitle: '3. Dźwięki natury',
        tabSubtitle: 'Las, deszcz, fale & nocne ptaki',
        activeBadge: 'Dźwięki grają',
        play: 'Włącz dźwięki natury',
        stop: 'Zatrzymaj dźwięki natury',
        volume: 'Głośność dźwięków natury',
        volumeTip: 'Dźwięki natury generowane są płynnie w nieskończonej pętli.',
        selectionTitle: 'Wybór scenerii natury',
        selectionTip: 'Dotknij, aby natychmiast przełączyć',
        selectedBadge: 'Wybrane',
        natureSoundPrefix: 'Dźwięk natury',
        fadeActiveNotice: 'Stopniowe wyciszanie aktywne',
        sounds: {
          forest: {
            title: 'Cichy las',
            subtitle: 'Szum drzew i wietrzyk',
            description: 'Łagodny szum wiatru w koronach drzew, który naturalnie uspokaja oddech dziecka.',
            rhythm: 'Spokojny wiatr i szelest liści',
          },
          rain: {
            title: 'Delikatny deszcz',
            subtitle: 'Krople deszczu i cichy deszczyk',
            description: 'Kojący, miarowy deszcz za oknem dający poczucie ciepła i bezpieczeństwa.',
            rhythm: 'Równomierny szmer kropel',
          },
          ocean: {
            title: 'Fale morskie',
            subtitle: 'Spokojny przypływ i odpływ',
            description: 'Miarowy 8-sekundowy cykl morskich fal imitujący spokojny oddech.',
            rhythm: 'Rytmiczne 8s fale i piana',
          },
          nightBirds: {
            title: 'Nocne ptaki leśne',
            subtitle: 'Puchacze i nocne trele',
            description: 'Ciche, łagodne pohukiwanie sowy w głębi lasu pod rozgwieżdżonym niebem.',
            rhythm: 'Spokojne nawoływania w oddali',
          },
          heartbeat: {
            title: 'Bicie serca',
            subtitle: 'Puls matki z wnętrza łona',
            description: 'Autentyczne, przytłumione bicie matczynego serca słyszane z wnętrza wód płodowych. Kojący rytm bez zbędnego szumu.',
            rhythm: 'Łagodny rytm ~68 BPM',
          },
        },
      },
      schedule: {
        tabTitle: '4. Asystent harmonogramu',
        tabSubtitle: 'Śledzenie snu, czuwania i historia',
        activeBadge: 'Śledzenie',
      },
    },
    timer: {
      title: 'Wyłącznik czasowy',
      unlimitedDesc: 'Odtwarzanie ciągłe bez limitu czasu',
      setDurationDesc: 'Automatyczne wyłączenie za {mins} minut',
      remaining: 'Pozostało',
      add15m: '+15m',
      reset: 'Resetuj',
      presetsTitle: 'Ustawienia czasu:',
      presets: {
        m15: '15 minut',
        m30: '30 minut',
        m45: '45 minut',
        m60: '60 minut (1h)',
        m90: '90 minut (1,5h)',
        m120: '120 minut (2h)',
        unlimited: 'Bez limitu (∞)',
      },
      fadeTitle: 'Stopniowe wyciszanie przed wyłączeniem',
      fadeRecommended: 'Zalecane',
      fadeDesc: 'Dźwięk łagodnie i niesłyszalnie wycisza się do zera, aby nagła cisza nie wybudziła maluszka.',
      fadeOn: 'Wyciszanie WŁ.',
      fadeOff: 'Wyciszanie WYŁ.',
      minsLabel: 'min',
    },
    fullScreen: {
      nightLamp: 'Lampka nocna',
      tapToToggle: 'Dotknij ekranu, aby pokazać sterowanie',
      lockedNotice: 'Ekran jest zablokowany',
      backToMenu: 'Powrót do menu',
      colorCycle: 'cykl kolorów',
    },
    nightSettingsModal: {
      title: 'Ustawienia i personalizacja',
      subtitle: 'Język, tryb nocny i ochrona wzroku dziecka',
      sunsetHeading: 'Automatycznie po zachodzie słońca',
      sunsetDesc: 'Po godzinie 18:00 aplikacja przełącza się w ciemny, przyjazny dla oczu tryb nocny.',
      currentSunset: 'Aktualnie: Po zachodzie słońca',
      currentDay: 'Aktualnie: Dzień',
      autoSunsetBtn: 'Automatycznie (18:00 - 07:00)',
      forceNightBtn: 'Wymuś tryb nocny',
      redFilterHeading: 'Czerwony filtr melatninowy',
      redFilterDesc: 'Blokuje 100% niebieskiego światła, chroniąc produkcję melatoniny podczas nocnego karmienia.',
      dimHeading: 'Dodatkowe przyciemnienie ekranu',
      dimDesc: 'Programowe przyciemnienie ekranu w całkowitej ciemności, gdy sprzętowa jasność jest zbyt jasna.',
      dimZero: '0% (Standard)',
      dimMax: '75% (Maksymalne przyciemnienie)',
      saveClose: 'Zapisz i zamknij',
    },
    palettes: {
      warmSunset: {
        name: 'Ciepły zachód słońca',
        desc: 'Bursztynowe i brzoskwiniowe barwy wspierające wydzielanie melatoniny.',
        mood: 'Ciepły i bezpieczny',
      },
      honeyCandle: {
        name: 'Miodowe światło świecy',
        desc: 'Złocisty blask przypominający cichy płomyk świecy w dziecięcym pokoju.',
        mood: 'Przytulny i cichy',
      },
      lavenderDusk: {
        name: 'Lawendowy zmierzch',
        desc: 'Subtelne pastelowe fiolety i bzy ułatwiające wyciszenie po całym dniu.',
        mood: 'Marzycielski i kojący',
      },
      moonlight: {
        name: 'Blask księżyca',
        desc: 'Głęboki błękit nocy i indygo imitujące rozgwieżdżone niebo.',
        mood: 'Spokojny i głęboki',
      },
      forestMoss: {
        name: 'Leśny mech',
        desc: 'Kojąca szałwia i leśna zieleń wpływające dobroczynnie na zmysły.',
        mood: 'Naturalny i świeży',
      },
      redMelatonin: {
        name: 'Czerwone światło nocne (0% niebieskiego)',
        desc: 'Głęboka rubinowa barwa do nocnego karmienia i przewijania bez rozbudzania.',
        mood: 'Nieprzerwany sen',
      },
      circadianScience: {
        name: 'Spektrum dobowe',
        desc: 'Na podstawie badań laboratoriów snu.',
        mood: 'Naukowo wspierany sen',
      },
      customSpectrum: {
        name: 'Własne (dowolne)',
        desc: 'Własny wybór 2 do 6 uspokajających kolorów za pomocą interaktywnego koła barw.',
        mood: 'Własna paleta',
      },
    },
    mainMenuButton: 'Menu główne',
    backToMenuTooltip: 'Powrót do menu głównego',
    authorNotice: {
      title: 'O autorze',
      message: 'Stworzone dla wszystkich cierpliwych rodziców. W przypadku wskazówek lub zgłoszeń błędów możesz pisać na msglitchapps@gmail.com .',
      email: 'msglitchapps@gmail.com',
      copyEmail: 'Kopiuj e-mail',
      copied: 'Skopiowano!',
      close: 'Zamknij',
    },
    changelogModal: {
      title: 'Historia wersji i nowości',
      version: 'Wersja',
      close: 'Zamknij',
    },
  },
  hu: {
    appName: 'Toddler sleep assistant',
    appSubtitle: 'Gyermek altató asszisztens',
    clockDayNames: ['Vasárnap', 'Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat'],
    clockMonthNames: [
      'január', 'február', 'március', 'április', 'május', 'június',
      'július', 'augusztus', 'szeptember', 'október', 'november', 'december',
    ],
    sunsetActive: 'Naplemente után',
    dayActive: 'Nappali mód',
    redLightFilter: 'Vörös fény',
    nightMode: 'Éjszakai mód',
    nightModeActive: 'Éjszakai mód aktív',
    touchLock: 'Gyerekzár',
    touchLocked: 'Lezárva',
    touchLockSubtitle: 'Az érintések le vannak tiltva, hogy a baba ne ébredjen fel.',
    touchLockHoldInstruction: 'Tartsa lenyomva 1 másodpercig a feloldáshoz',
    unlockingProgress: 'Feloldás...',
    settings: 'Beállítások',
    personalization: 'Személyre szabás és nyelv',
    selectLanguage: 'Alkalmazás nyelve',
    languages: {
      en: 'English (Angol)',
      sk: 'Slovenčina (Szlovák)',
      cs: 'Čeština (Cseh)',
      pl: 'Polski (Lengyel)',
      hu: 'Magyar',
      uk: 'Українська (Ukrán)',
      it: 'Italiano (Olasz)',
    },
    statusCard: {
      activeTitle: 'Asszisztens aktív',
      inactiveTitle: 'Asszisztens inaktív',
      readyDesc: 'Koppintson az indításra az előző módok folytatásához',
      stopBtn: 'Leállítás',
      startBtn: 'Indítás',
    },
    modes: {
      light: {
        tabTitle: '1. Nyugtató fény',
        tabSubtitle: 'Lágy színátmenetes hangulatfény',
        activeBadge: 'Fény világít',
        turnOn: 'Fény bekapcsolása',
        turnOff: 'Fény kikapcsolása',
        fullScreen: 'Teljes képernyő',
        lightOffDesc: 'Koppintson az alábbi gombra az éjszakai altatófény bekapcsolásához',
        brightness: 'Fényerő',
        speed: 'Színváltás sebessége',
        speeds: {
          verySlow: 'Nagyon lassú (16s)',
          slow: 'Lassú (9s)',
          medium: 'Közepes (5s)',
          breathing: 'Légzés ritmusa (6s)',
        },
        palettesTitle: 'Nyugtató színspektrum kiválasztása',
        shadesCount: 'árnyalat',
        changePalette: 'Paletta váltása',
        activePaletteOnly: 'Aktív paletta',
        customColorsTitle: 'Egyéni színek',
        customColorsHint: 'Válassz 2-6 nyugtató színt a színkerék segítségével',
        addColor: 'Szín hozzáadása',
        removeColor: 'Törlés',
        pickColorOnWheel: 'Érintsd meg vagy húzd az ujjad a színkeréken',
      },
      whiteNoise: {
        tabTitle: '2. Fehér zaj',
        tabSubtitle: '3 hangerő-szint végtelenítve',
        activeBadge: 'Zaj szól',
        play: 'Fehér zaj indítása',
        stop: 'Fehér zaj leállítása',
        volume: 'Fehér zaj hangereje',
        volumeTip: 'Tipp: A babák alvásához 50–60 dB körüli lágy háttérzaj javasolt.',
        levelsTitle: 'A fehér zaj 3 intenzitási szintje',
        levelsTip: 'Válasszon a baba igényei szerint',
        activeLevelBadge: 'Aktív',
        fadeActiveNotice: 'Fokozatos lehalkítás aktív',
        levels: {
          gentle: {
            title: 'Lágy suttogás',
            levelNum: '1. szint',
            pitch: 'Lágy rózsaszín szűrő',
            description: 'Bársonyosan finom zaj tompított magas hangokkal. Kíméli a baba érzékeny fülét.',
            idealFor: 'Újszülöttek, nappali alvás és csendes szoba',
            frequency: 'Aluláteresztő szűrő (~950 Hz)',
          },
          balanced: {
            title: 'Kiegyensúlyozott zaj',
            levelNum: '2. szint',
            pitch: 'Klasszikus fehér zaj',
            description: 'Klasszikus akusztikus függöny, amely elfedi az otthoni zajokat és az utcát.',
            idealFor: 'Lépések, beszéd és környezeti zajok elfedése',
            frequency: 'Széles spektrum (~2400 Hz)',
          },
          deep: {
            title: 'Mély zaj (Anyaméh)',
            levelNum: '3. szint',
            pitch: 'Barna / prenatális zaj',
            description: 'Mély, meleg hangzás, amely az édesanya szívverését és a véráramlást idézi.',
            idealFor: 'Kólika, nyugtalan alvás, sírás',
            frequency: 'Mély barna zaj (~450 Hz)',
          },
        },
      },
      nature: {
        tabTitle: '3. Természet hangjai',
        tabSubtitle: 'Erdő, eső, hullámok & éjszakai madarak',
        activeBadge: 'Hangok szólnak',
        play: 'Hangok indítása',
        stop: 'Hangok leállítása',
        volume: 'Természet hangereje',
        volumeTip: 'A természet hangjai akadás nélkül, folyamatosan szólnak.',
        selectionTitle: 'Természeti táj kiválasztása',
        selectionTip: 'Koppintson az azonnali váltáshoz',
        selectedBadge: 'Kiválasztva',
        natureSoundPrefix: 'Természet hangja',
        fadeActiveNotice: 'Fokozatos lehalkítás aktív',
        sounds: {
          forest: {
            title: 'Csendes erdő',
            subtitle: 'Fák susogása és lágy szellő',
            description: 'Lágy szél a fák koronájában, amely természetes módon lassítja a baba légzését.',
            rhythm: 'Lassú szellő és lombmorajlás',
          },
          rain: {
            title: 'Gyengéd eső',
            subtitle: 'Esőcseppek és csendes zápor',
            description: 'Megnyugtató, ritmikus esőkopogás az ablakon a biztonság és melegség érzéséért.',
            rhythm: 'Egyenletes csepegés',
          },
          ocean: {
            title: 'Tenger hullámai',
            subtitle: 'Lassú apály és dagály',
            description: 'Ritmikus 8 másodperces hullámverés, amely a lassú, mély légzést követi.',
            rhythm: 'Ritmikus 8s hullámok és tajték',
          },
          nightBirds: {
            title: 'Éjszakai erdei madarak',
            subtitle: 'Erdei baglyok és éji hangok',
            description: 'Csendes bagolyhuhogás a távolban egy csillagfényes éjszaka nyugalmával.',
            rhythm: 'Távoli éjszakai hangok',
          },
          heartbeat: {
            title: 'Szívverés',
            subtitle: 'Anyai szívhang az anyaméhből',
            description: 'Hiteles, tompa anyai szívverés, ahogyan a magzatvízből hallható. Mély megnyugtató ritmus felesleges háttérzaj nélkül.',
            rhythm: 'Tompa ritmus ~68 BPM',
          },
        },
      },
      schedule: {
        tabTitle: '4. Alvási asszisztens',
        tabSubtitle: 'Ébrenlét és alvás nyomon követése',
        activeBadge: 'Követés',
      },
    },
    timer: {
      title: 'Elalváskapcsoló',
      unlimitedDesc: 'Folyamatos lejátszás időkorlát nélkül',
      setDurationDesc: 'Automatikus leállítás {mins} perc múlva',
      remaining: 'Hátralévő idő',
      add15m: '+15p',
      reset: 'Visszaállítás',
      presetsTitle: 'Időbeállítás:',
      presets: {
        m15: '15 perc',
        m30: '30 perc',
        m45: '45 perc',
        m60: '60 perc (1ó)',
        m90: '90 perc (1,5ó)',
        m120: '120 perc (2ó)',
        unlimited: 'Korlátlan (∞)',
      },
      fadeTitle: 'Fokozatos lehalkítás a leállás előtt',
      fadeRecommended: 'Javasolt',
      fadeDesc: 'A hang az utolsó percekben észrevétlenül halkul el nullára, hogy a hirtelen csend ne ébressze fel a babát.',
      fadeOn: 'Lehalkítás BE',
      fadeOff: 'Lehalkítás KI',
      minsLabel: 'perc',
    },
    fullScreen: {
      nightLamp: 'Éjjeli lámpa',
      tapToToggle: 'Koppintson a vezérlők megjelenítéséhez',
      lockedNotice: 'A képernyő le van zárva',
      backToMenu: 'Vissza a menübe',
      colorCycle: 'színciklus',
    },
    nightSettingsModal: {
      title: 'Beállítások és testreszabás',
      subtitle: 'Nyelv, éjszakai mód és a baba szemének védelme',
      sunsetHeading: 'Automatikusan naplemente után',
      sunsetDesc: '18:00 után az alkalmazás automatikusan sötét, szemkímélő éjszakai módra vált.',
      currentSunset: 'Jelenleg: Naplemente után',
      currentDay: 'Jelenleg: Nappal',
      autoSunsetBtn: 'Automatikus (18:00 - 07:00)',
      forceNightBtn: 'Éjszakai mód kényszerítése',
      redFilterHeading: 'Melatonin védő vörös szűrő',
      redFilterDesc: 'Kiszűri a kék fény 100%-át, óvva a melatonin termelődését az éjszakai etetések során.',
      dimHeading: 'Extra képernyő-sötétítés',
      dimDesc: 'Szoftveres sötétítés teljes sötétségben, ha a telefon minimális fényereje még túl erős.',
      dimZero: '0% (Alapértelmezett)',
      dimMax: '75% (Maximális sötétítés)',
      saveClose: 'Mentés és bezárás',
    },
    palettes: {
      warmSunset: {
        name: 'Meleg naplemente',
        desc: 'Borostyán és barack tónusok a természetes melatonin képződéséhez.',
        mood: 'Meleg és biztonságos',
      },
      honeyCandle: {
        name: 'Mézes gyertyafény',
        desc: 'Aranyló meleg fény, mint egy csendes gyertyaláng a gyerekszobában.',
        mood: 'Otthonos és csendes',
      },
      lavenderDusk: {
        name: 'Levendula szürkület',
        desc: 'Gyengéd pasztell lila színek a baba ellazulásához a nap végén.',
        mood: 'Álomszerű és nyugtató',
      },
      moonlight: {
        name: 'Holdfény',
        desc: 'Lágy indigó és éji kék, amely a békés csillagos égboltot idézi.',
        mood: 'Mély és békés',
      },
      forestMoss: {
        name: 'Erdei moha',
        desc: 'Megnyugtató zsálya és erdei zöld a nyugtalan érzékek lecsendesítésére.',
        mood: 'Természetes és friss',
      },
      redMelatonin: {
        name: 'Vörös éjszakai fény (0% kék fény)',
        desc: 'Mély rubin fény az éjszakai etetéshez és pelenkázáshoz ébredés nélkül.',
        mood: 'Zavartalan alvás',
      },
      circadianScience: {
        name: 'Cirkadián spektrum',
        desc: 'Alváslaboratóriumi kutatások alapján.',
        mood: 'Tudományos alvás',
      },
      customSpectrum: {
        name: 'Egyéni (szabadon választott)',
        desc: '2-6 nyugtató szín egyéni kiválasztása az interaktív színkerékkel.',
        mood: 'Egyéni paletta',
      },
    },
    mainMenuButton: 'Főmenü',
    backToMenuTooltip: 'Vissza a főmenübe',
    authorNotice: {
      title: 'A készítőről',
      message: 'Minden türelmes szülő számára készítve. Tippekért vagy hibajelentésekért írhat a msglitchapps@gmail.com címre.',
      email: 'msglitchapps@gmail.com',
      copyEmail: 'E-mail másolása',
      copied: 'Másolva!',
      close: 'Bezárás',
    },
    changelogModal: {
      title: 'Verziótörténet és újdonságok',
      version: 'Verzió',
      close: 'Bezárás',
    },
  },
  uk: {
    appName: 'Toddler sleep assistant',
    appSubtitle: 'Помічник для сну дитини',
    clockDayNames: ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', 'Пʼятниця', 'Субота'],
    clockMonthNames: [
      'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
      'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня',
    ],
    sunsetActive: 'Після заходу сонця',
    dayActive: 'Денний режим',
    redLightFilter: 'Червоне світло',
    nightMode: 'Нічний режим',
    nightModeActive: 'Нічний режим активний',
    touchLock: 'Дитячий замок',
    touchLocked: 'Заблоковано',
    touchLockSubtitle: 'Дотики заблоковано, щоб випадкове натискання не розбудило малюка.',
    touchLockHoldInstruction: 'Утримуйте 1 секунду для розблокування',
    unlockingProgress: 'Розблокування...',
    settings: 'Налаштування',
    personalization: 'Персоналізація та мова',
    selectLanguage: 'Мова додатку',
    languages: {
      en: 'English (Англійська)',
      sk: 'Slovenčina (Словацька)',
      cs: 'Čeština (Чеська)',
      pl: 'Polski (Польська)',
      hu: 'Magyar (Угорська)',
      uk: 'Українська',
      it: 'Italiano (Італійська)',
    },
    statusCard: {
      activeTitle: 'Асистент активний',
      inactiveTitle: 'Асистент неактивний',
      readyDesc: 'Торкніться запустити, щоб відновити попередні режими',
      stopBtn: 'Зупинити',
      startBtn: 'Запустити',
    },
    modes: {
      light: {
        tabTitle: '1. Спокійне світло',
        tabSubtitle: 'Плавна зміна м’яких кольорів',
        activeBadge: 'Світло світить',
        turnOn: 'Увімкнути світло',
        turnOff: 'Вимкнути світло',
        fullScreen: 'На весь екран',
        lightOffDesc: 'Торкніться кнопки нижче, щоб увімкнути заспокійливе нічне світло',
        brightness: 'Яскравість',
        speed: 'Швидкість зміни кольорів',
        speeds: {
          verySlow: 'Дуже повільна (16s)',
          slow: 'Повільна (9s)',
          medium: 'Середня (5s)',
          breathing: 'Ритм дихання (6s)',
        },
        palettesTitle: 'Вибір заспокійливого спектра кольорів',
        shadesCount: 'відтінків',
        changePalette: 'Змінити палітру',
        activePaletteOnly: 'Активна палітра',
        customColorsTitle: 'Власні кольори спектру',
        customColorsHint: 'Оберіть від 2 до 6 кольорів за допомогою колірного кола',
        addColor: 'Додати колір',
        removeColor: 'Видалити',
        pickColorOnWheel: 'Торкніться або проведіть по колу кольорів',
      },
      whiteNoise: {
        tabTitle: '2. Білий шум',
        tabSubtitle: '3 рівні інтенсивності в циклі',
        activeBadge: 'Шум грає',
        play: 'Запустити білий шум',
        stop: 'Зупинити білий шум',
        volume: 'Гучність білого шуму',
        volumeTip: 'Порада: Рекомендована гучність для сну немовлят становить близько 50–60 дБ (м’який фоновий шум).',
        levelsTitle: '3 рівні інтенсивності білого шуму',
        levelsTip: 'Оберіть відповідно до потреб дитини',
        activeLevelBadge: 'Активний',
        fadeActiveNotice: 'Поступове згасання звуку активне',
        levels: {
          gentle: {
            title: 'Ніжний шум',
            levelNum: 'Рівень 1',
            pitch: 'М’який шепіт (Рожевий фільтр)',
            description: 'Оксамитовий, м’який шум із приглушеними високими тонами. Не подразнює чутливі вушка немовляти.',
            idealFor: 'Новонароджені, денний сон і тиха кімната',
            frequency: 'Низькочастотний фільтр (~950 Гц)',
          },
          balanced: {
            title: 'Збалансований шум',
            levelNum: 'Рівень 2',
            pitch: 'Класичний білий шум',
            description: 'Акустичний бар’єр, що надійно маскує побутові звуки, телевізор і вуличний шум.',
            idealFor: 'Маскування кроків, розмов і побутових звуків',
            frequency: 'Широкий спектр (~2400 Гц)',
          },
          deep: {
            title: 'Глибокий шум (Утроба)',
            levelNum: 'Рівень 3',
            pitch: 'Коричневий / пренатальний шум',
            description: 'Глибоке тепле звучання, що нагадує биття серця та потік крові в утробі матері.',
            idealFor: 'Коліки, неспокійний сон, плач',
            frequency: 'Глибокий коричневий шум (~450 Гц)',
          },
        },
      },
      nature: {
        tabTitle: '3. Звуки природи',
        tabSubtitle: 'Ліс, дощ, хвилі & нічні птахи',
        activeBadge: 'Звуки грають',
        play: 'Увімкнути звуки природи',
        stop: 'Зупинити звуки природи',
        volume: 'Гучність звуків природи',
        volumeTip: 'Звуки природи звучать плавно та безперервно без пауз.',
        selectionTitle: 'Вибір природи',
        selectionTip: 'Торкніться для миттєвого перемикання',
        selectedBadge: 'Обрано',
        natureSoundPrefix: 'Звук природи',
        fadeActiveNotice: 'Поступове затихання звуку активне',
        sounds: {
          forest: {
            title: 'Тихий ліс',
            subtitle: 'Шелест дерев і вітерець',
            description: 'М’який шум вітру в кронах дерев, що природно заспокоює дихання малюка.',
            rhythm: 'Повільний вітерець і шелест листя',
          },
          rain: {
            title: 'Лагідний дощ',
            subtitle: 'Краплі дощу та тиха злива',
            description: 'Гіпнотичний ритмічний шум дощу у вікно для відчуття затишку й безпеки.',
            rhythm: 'Рівномірний шепіт крапель',
          },
          ocean: {
            title: 'Морські хвилі',
            subtitle: 'Спокійний приплив і відплив',
            description: 'Ритмічний 8-секундний цикл морських хвиль, що імітує повільне дихання.',
            rhythm: 'Ритмічні 8с хвилі та піна',
          },
          nightBirds: {
            title: 'Нічні лісові птахи',
            subtitle: 'Лісові сови та нічний спів',
            description: 'Тихе та лагідне гукання сови в глибині лісу під зоряним небом.',
            rhythm: 'Спокійні далекі звуки ночі',
          },
          heartbeat: {
            title: 'Серцебиття',
            subtitle: 'Пульс матері з утроби',
            description: 'Автентичне приглушене биття серця матері, як чути крізь навколоплідні води. Заспокійливий глибокий ритм без зайвого шуму.',
            rhythm: 'Приглушений ритм ~68 уд/хв',
          },
        },
      },
      schedule: {
        tabTitle: '4. Асистент режиму сну',
        tabSubtitle: 'Відстеження сну, неспання та історія',
        activeBadge: 'Відстежується',
      },
    },
    timer: {
      title: 'Таймер сну',
      unlimitedDesc: 'Грає безперервно без обмеження часу',
      setDurationDesc: 'Автоматичне вимкнення через {mins} хвилин',
      remaining: 'Залишилося',
      add15m: '+15хв',
      reset: 'Скинути',
      presetsTitle: 'Налаштування часу:',
      presets: {
        m15: '15 хвилин',
        m30: '30 хвилин',
        m45: '45 хвилин',
        m60: '60 хвилин (1г)',
        m90: '90 хвилин (1,5г)',
        m120: '120 хвилин (2г)',
        unlimited: 'Без обмежень (∞)',
      },
      fadeTitle: 'Поступове затихання перед вимкненням',
      fadeRecommended: 'Рекомендовано',
      fadeDesc: 'Звук плавно та непомітно затихає до нуля в останні хвилини, щоб раптова тиша не розбудила малюка.',
      fadeOn: 'Затихання УВІМК',
      fadeOff: 'Затихання ВИМК',
      minsLabel: 'хв',
    },
    fullScreen: {
      nightLamp: 'Нічник',
      tapToToggle: 'Торкніться екрана, щоб відкрити панель',
      lockedNotice: 'Екран заблоковано',
      backToMenu: 'Назад до меню',
      colorCycle: 'цикл кольорів',
    },
    nightSettingsModal: {
      title: 'Налаштування та персоналізація',
      subtitle: 'Мова, нічний режим та захист очей дитини',
      sunsetHeading: 'Автоматично після заходу сонця',
      sunsetDesc: 'Після 18:00 додаток автоматично вмикає темний, безпечний для очей режим.',
      currentSunset: 'Зараз: Після заходу сонця',
      currentDay: 'Зараз: День',
      autoSunsetBtn: 'Авто (18:00 - 07:00)',
      forceNightBtn: 'Увімкнути нічний режим',
      redFilterHeading: 'Червоний мелатоніновий фільтр',
      redFilterDesc: 'Блокує 100% синього світла для підтримки вироблення мелатоніну під час нічних годувань.',
      dimHeading: 'Додаткове затемнення екрана',
      dimDesc: 'Програмне затемнення для повної темряви, коли навіть мінімальна яскравість смартфона занадто сильна.',
      dimZero: '0% (Звичайна)',
      dimMax: '75% (Максимальне затемнення)',
      saveClose: 'Зберегти і закрити',
    },
    palettes: {
      warmSunset: {
        name: 'Теплий захід сонця',
        desc: 'Бурштинові та персикові тони для природного вироблення гормону сну мелатоніну.',
        mood: 'Теплий і безпечний',
      },
      honeyCandle: {
        name: 'Медове світло свічки',
        desc: 'М’яке золотисте сяйво, схоже на затишний вогник свічки в дитячій кімнаті.',
        mood: 'Затишний і тихий',
      },
      lavenderDusk: {
        name: 'Лавандові сутінки',
        desc: 'Ніжні пастельні лавандові відтінки для розслаблення малюка після насиченого дня.',
        mood: 'Мрійливий і заспокійливий',
      },
      moonlight: {
        name: 'Місячне сяйво',
        desc: 'Ніжне індиго та нічна синява, що імітують тихе зоряне небо.',
        mood: 'Глибокий і тихий',
      },
      forestMoss: {
        name: 'Лісовий мох',
        desc: 'Заспокійлива шавлія та лісова зелень, що благотворно діють на збуджені органи чуття.',
        mood: 'Природний і свіжий',
      },
      redMelatonin: {
        name: 'Червоне нічне світло (0% синього)',
        desc: 'Глибоке рубінове світло для нічного годування та сповивання без порушення сну.',
        mood: 'Непорушний сон',
      },
      circadianScience: {
        name: 'Циркадний спектр',
        desc: 'На основі досліджень лабораторій сну.',
        mood: 'Науковий сон',
      },
      customSpectrum: {
        name: 'Власне (довільне)',
        desc: 'Власний вибір від 2 до 6 заспокійливих кольорів за допомогою інтерактивного колірного кола.',
        mood: 'Власна палітра',
      },
    },
    mainMenuButton: 'Головне меню',
    backToMenuTooltip: 'Назад до головного меню',
    authorNotice: {
      title: 'Про автора',
      message: 'Створено для всіх терплячих батьків. Для порад або повідомлень про помилки пишіть на msglitchapps@gmail.com .',
      email: 'msglitchapps@gmail.com',
      copyEmail: 'Скопіювати e-mail',
      copied: 'Скопійовано!',
      close: 'Закрити',
    },
    changelogModal: {
      title: 'Історія версій та оновлення',
      version: 'Версія',
      close: 'Закрити',
    },
  },
  it: {
    appName: 'Toddler sleep assistant',
    appSubtitle: 'Assistente per il sonno del bambino',
    clockDayNames: ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'],
    clockMonthNames: [
      'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
      'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
    ],
    sunsetActive: 'Dopo il tramonto',
    dayActive: 'Modalità giorno',
    redLightFilter: 'Luce rossa',
    nightMode: 'Modalità notte',
    nightModeActive: 'Modalità notte attiva',
    touchLock: 'Blocco bimbo',
    touchLocked: 'Bloccato',
    touchLockSubtitle: 'I tocchi sono disabilitati per evitare tocchi accidentali che sveglino il bambino.',
    touchLockHoldInstruction: 'Tieni premuto per 1 secondo per sbloccare',
    unlockingProgress: 'Sblocco in corso...',
    settings: 'Impostazioni',
    personalization: 'Personalizzazione e lingua',
    selectLanguage: "Lingua dell'applicazione",
    languages: {
      en: 'English (Inglese)',
      sk: 'Slovenčina (Slovacco)',
      cs: 'Čeština (Ceco)',
      pl: 'Polski (Polacco)',
      hu: 'Magyar (Ungherese)',
      uk: 'Українська (Ucraino)',
      it: 'Italiano',
    },
    statusCard: {
      activeTitle: 'Assistente attivo',
      inactiveTitle: 'Assistente inattivo',
      readyDesc: 'Tocca Avvia per riprendere le modalità precedenti',
      stopBtn: 'Arresta',
      startBtn: 'Avvia',
    },
    modes: {
      light: {
        tabTitle: '1. Luce rilassante',
        tabSubtitle: 'Spettro cromatico graduale e distensivo',
        activeBadge: 'Luce accesa',
        turnOn: 'Accendi luce rilassante',
        turnOff: 'Spegni luce',
        fullScreen: 'Schermo intero',
        lightOffDesc: "Tocca il pulsante qui sotto per avviare l'illuminazione per la nanna",
        brightness: 'Luminosità',
        speed: 'Velocità cambio colore',
        speeds: {
          verySlow: 'Molto lenta (16s)',
          slow: 'Lenta (9s)',
          medium: 'Media (5s)',
          breathing: 'Respiro ritmico (6s)',
        },
        palettesTitle: 'Seleziona lo spettro di colori rilassanti',
        shadesCount: 'sfumature',
        changePalette: 'Cambia tavolozza',
        activePaletteOnly: 'Tavolozza attiva',
        customColorsTitle: 'Colori personalizzati',
        customColorsHint: 'Scegli da 2 a 6 colori rilassanti con la ruota dei colori',
        addColor: 'Aggiungi colore',
        removeColor: 'Rimuovi',
        pickColorOnWheel: 'Tocca o trascina sulla ruota dei colori',
      },
      whiteNoise: {
        tabTitle: '2. Rumore bianco',
        tabSubtitle: '3 livelli di intensità in ciclo continuo',
        activeBadge: 'Rumore in riproduzione',
        play: 'Avvia rumore bianco',
        stop: 'Ferma rumore bianco',
        volume: 'Volume rumore bianco',
        volumeTip: 'Consiglio: Il volume ideale per il sonno infantile è intorno a 50–60 dB (suono di sottofondo delicato).',
        levelsTitle: '3 livelli di intensità del rumore bianco',
        levelsTip: 'Scegli in base alla sensibilità del bambino',
        activeLevelBadge: 'Attivo',
        fadeActiveNotice: 'Dissolvenza graduale del volume attiva',
        levels: {
          gentle: {
            title: 'Rumore delicato',
            levelNum: 'Livello 1',
            pitch: 'Sussurro morbido (Filtro rosa)',
            description: "Suono setoso con frequenze alte smorzate. Estremamente dolce per l'udito infantile.",
            idealFor: 'Neonati, pisolini, cameretta silenziosa',
            frequency: 'Filtro passa-basso caldo (~950 Hz)',
          },
          balanced: {
            title: 'Rumore bilanciato',
            levelNum: 'Livello 2',
            pitch: 'Rumore bianco standard',
            description: 'Classica schermatura acustica che maschera i rumori di casa, TV e traffico esterno.',
            idealFor: 'Mascherare passi, conversazioni e rumori stradali',
            frequency: 'Spettro ad ampia banda (~2400 Hz)',
          },
          deep: {
            title: 'Rumore profondo (Grembo)',
            levelNum: 'Livello 3',
            pitch: 'Suono browniano uterino',
            description: 'Frequenze calde e risonanti simili al flusso sanguigno materno e al battito cardiaco.',
            idealFor: 'Coliche, agitazione, pianto inconsolabile',
            frequency: 'Rumore browniano profondo (~450 Hz)',
          },
        },
      },
      nature: {
        tabTitle: '3. Suoni della natura',
        tabSubtitle: 'Foresta, pioggia, onde, uccelli notturni e battito',
        activeBadge: 'Suoni in riproduzione',
        play: 'Riproduci suoni della natura',
        stop: 'Ferma suoni della natura',
        volume: 'Volume suoni della natura',
        volumeTip: 'I suoni naturali sono generati senza interruzioni o salti di riproduzione.',
        selectionTitle: 'Scegli paesaggio sonoro naturale',
        selectionTip: 'Tocca per cambiare all’istante',
        selectedBadge: 'Selezionato',
        natureSoundPrefix: 'Suono naturale',
        fadeActiveNotice: 'Dissolvenza graduale della natura attiva',
        sounds: {
          forest: {
            title: 'Foresta silenziosa',
            subtitle: 'Fruscio di alberi e brezza gentile',
            description: 'Vento leggero tra aghi di pino e foglie, che rallenta naturalmente la respirazione.',
            rhythm: 'Brezza lenta e sussurro della foresta',
          },
          rain: {
            title: 'Pioggia leggera',
            subtitle: 'Gocce di pioggia e pioggerella estiva',
            description: 'Pioggia ritmica e ipnotica che cade su finestre e foglie, creando un ambiente protetto.',
            rhythm: 'Ticchettio calmo e rassicurante',
          },
          ocean: {
            title: "Onde dell'oceano",
            subtitle: 'Marea lenta e spuma sulla battigia',
            description: 'Ciclo di risacca di 8 secondi che imita la respirazione profonda e il battito calmo.',
            rhythm: 'Onde ritmiche di 8s e risacca marina',
          },
          nightBirds: {
            title: 'Uccelli della foresta notturna',
            subtitle: 'Gufi della foresta e richiami notturni',
            description: 'Dolci richiami lontani di gufi e atmosfera pacifica del bosco sotto le stelle.',
            rhythm: 'Dolci richiami notturni in lontananza',
          },
          heartbeat: {
            title: 'Battito cardiaco',
            subtitle: 'Pulsazioni materne dal grembo',
            description: 'Autentico battito cardiaco materno ovattato come percepito dal liquido amniotico. Ritmo profondo e rassicurante senza rumori superflui.',
            rhythm: 'Ritmo ovattato ~68 BPM',
          },
        },
      },
      schedule: {
        tabTitle: '4. Assistente del sonno',
        tabSubtitle: 'Monitoraggio sonno, veglia e cronologia',
        activeBadge: 'In corso',
      },
    },
    timer: {
      title: 'Timer di spegnimento',
      unlimitedDesc: 'Riproduzione continua senza limiti di tempo',
      setDurationDesc: 'Spegnimento automatico impostato su {mins} minuti',
      remaining: 'Rimanente',
      add15m: '+15m',
      reset: 'Azzera',
      presetsTitle: 'Impostazioni tempo:',
      presets: {
        m15: '15 min',
        m30: '30 min',
        m45: '45 min',
        m60: '60 min (1h)',
        m90: '90 min (1.5h)',
        m120: '120 min (2h)',
        unlimited: 'Illimitato (∞)',
      },
      fadeTitle: 'Dissolvenza graduale del volume prima dello spegnimento',
      fadeRecommended: 'Consigliato',
      fadeDesc: 'Il volume cala dolcemente e impercettibilmente negli ultimi minuti per evitare che il silenzio improvviso svegli il bambino.',
      fadeOn: 'Dissolvenza ATTIVA',
      fadeOff: 'Dissolvenza DISATTIVA',
      minsLabel: 'min',
    },
    fullScreen: {
      nightLamp: 'Luce notturna',
      tapToToggle: 'Tocca lo schermo per mostrare i comandi',
      lockedNotice: 'Schermo bloccato',
      backToMenu: 'Torna al menu',
      colorCycle: 'ciclo colore',
    },
    nightSettingsModal: {
      title: 'Impostazioni e personalizzazione',
      subtitle: 'Lingua, modalità notte e protezione occhi del bambino',
      sunsetHeading: 'Automatico dopo il tramonto',
      sunsetDesc: "Dopo le 18:00 l'app passa automaticamente alla modalità notturna riposante per la vista.",
      currentSunset: 'Attuale: Dopo il tramonto',
      currentDay: 'Attuale: Modalità giorno',
      autoSunsetBtn: 'Auto (18:00 - 07:00)',
      forceNightBtn: 'Forza modalità notte',
      redFilterHeading: 'Filtro rosso melatonina',
      redFilterDesc: 'Blocca il 100% della luce blu per proteggere la produzione naturale di melatonina durante le poppate notturne.',
      dimHeading: 'Oscuramento extra dello schermo',
      dimDesc: 'Oscuramento software per stanze completamente buie quando il minimo dello smartphone è ancora troppo luminoso.',
      dimZero: '0% (Standard)',
      dimMax: '75% (Oscuramento massimo)',
      saveClose: 'Salva e chiudi',
    },
    palettes: {
      warmSunset: {
        name: 'Tramonto caldo',
        desc: 'Tonalità ambrate e pesca che favoriscono la produzione naturale della melatonina.',
        mood: 'Caldo e rassicurante',
      },
      honeyCandle: {
        name: 'Lume di candela al miele',
        desc: 'Morbida luce dorata che ricorda la fiamma silenziosa di una candela nella stanza.',
        mood: 'Accogliente e intimo',
      },
      lavenderDusk: {
        name: 'Crepuscolo di lavanda',
        desc: 'Toni pastello lavanda e lilla che aiutano il piccolo a rilassarsi dopo una giornata intensa.',
        mood: 'Rilassante e sognante',
      },
      moonlight: {
        name: 'Chiaro di luna',
        desc: 'Indaco soffice e blu notte stellato che imitano un cielo notturno sereno.',
        mood: 'Profondo e quieto',
      },
      forestMoss: {
        name: 'Muschio di foresta',
        desc: 'Salvia distensiva e verde boschivo che agiscono delicatamente sui sensi agitati.',
        mood: 'Naturale e fresco',
      },
      redMelatonin: {
        name: 'Luce notturna rossa (0% luce blu)',
        desc: "Luce rubino profonda per l'allattamento e il cambio notturno senza disturbare il sonno.",
        mood: 'Sonno imperturbato',
      },
      circadianScience: {
        name: 'Spettro circadiano',
        desc: 'Basato sulla ricerca dei laboratori del sonno.',
        mood: 'Sonno scientifico',
      },
      customSpectrum: {
        name: 'Personalizzato (a scelta)',
        desc: 'Selezione personale da 2 a 6 colori rilassanti tramite la ruota dei colori interattiva.',
        mood: 'Tavolozza personalizzata',
      },
    },
    mainMenuButton: 'Menu principale',
    backToMenuTooltip: 'Torna al menu principale',
    authorNotice: {
      title: 'Sull\'autore',
      message: 'Creato per tutti i genitori pazienti. Per suggerimenti o segnalazioni di bug, puoi scrivermi a msglitchapps@gmail.com .',
      email: 'msglitchapps@gmail.com',
      copyEmail: 'Copia e-mail',
      copied: 'Copiato!',
      close: 'Chiudi',
    },
    changelogModal: {
      title: 'Cronologia versioni e novità',
      version: 'Versione',
      close: 'Chiudi',
    },
  },
};
