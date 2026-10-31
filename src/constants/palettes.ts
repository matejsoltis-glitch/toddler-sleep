import { LightPalette, Language } from '../types';
import { translations } from '../i18n/translations';

export const getPalettes = (lang: Language): LightPalette[] => {
  const t = translations[lang].palettes;
  return [
    {
      id: 'warm-sunset',
      name: t.warmSunset.name,
      description: t.warmSunset.desc,
      mood: t.warmSunset.mood,
      colors: ['#f97316', '#ea580c', '#fb923c', '#fdba74', '#f59e0b', '#d97706'],
    },
    {
      id: 'honey-candle',
      name: t.honeyCandle.name,
      description: t.honeyCandle.desc,
      mood: t.honeyCandle.mood,
      colors: ['#eab308', '#ca8a04', '#d97706', '#b45309', '#f59e0b'],
    },
    {
      id: 'lavender-dusk',
      name: t.lavenderDusk.name,
      description: t.lavenderDusk.desc,
      mood: t.lavenderDusk.mood,
      colors: ['#a855f7', '#9333ea', '#7e22ce', '#c084fc', '#818cf8', '#6366f1'],
    },
    {
      id: 'moonlight',
      name: t.moonlight.name,
      description: t.moonlight.desc,
      mood: t.moonlight.mood,
      colors: ['#3b82f6', '#2563eb', '#1d4ed8', '#60a5fa', '#4f46e5'],
    },
    {
      id: 'forest-moss',
      name: t.forestMoss.name,
      description: t.forestMoss.desc,
      mood: t.forestMoss.mood,
      colors: ['#10b981', '#059669', '#047857', '#34d399', '#14b8a6'],
    },
    {
      id: 'red-melatonin',
      name: t.redMelatonin.name,
      description: t.redMelatonin.desc,
      mood: t.redMelatonin.mood,
      colors: ['#dc2626', '#b91c1c', '#991b1b', '#ef4444', '#7f1d1d'],
    },
    {
      id: 'circadian-science',
      name: t.circadianScience.name,
      description: t.circadianScience.desc,
      mood: t.circadianScience.mood,
      // Harvard & Salk research: >620nm wavelengths (deep amber, ruby, sunset ember) 0% melanopsin stimulation
      colors: ['#991b1b', '#7f1d1d', '#b91c1c', '#c2410c', '#9a3412', '#78350f'],
    },
    {
      id: 'custom-spectrum',
      name: t.customSpectrum.name,
      description: t.customSpectrum.desc,
      mood: t.customSpectrum.mood,
      colors: loadCustomPaletteColors(),
    },
  ];
};

export const loadCustomPaletteColors = (): string[] => {
  try {
    const saved = localStorage.getItem('toddler_custom_light_palette');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length >= 2 && parsed.length <= 6) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return ['#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];
};

export const saveCustomPaletteColors = (colors: string[]): void => {
  try {
    if (Array.isArray(colors) && colors.length >= 2 && colors.length <= 6) {
      localStorage.setItem('toddler_custom_light_palette', JSON.stringify(colors));
    }
  } catch {
    // ignore
  }
};

export const LIGHT_PALETTES = getPalettes('sk');

export const getTimerPresets = (lang: Language) => {
  const p = translations[lang].timer.presets;
  return [
    { label: p.m15, value: 15 },
    { label: p.m30, value: 30 },
    { label: p.m45, value: 45 },
    { label: p.m60, value: 60 },
    { label: p.m90, value: 90 },
    { label: p.m120, value: 120 },
    { label: p.unlimited, value: 0 },
  ];
};
