import React, { useState } from 'react';
import { Globe, Check, ArrowRight, Sparkles } from 'lucide-react';
import { Language } from '../types';

interface LanguageOnboardingModalProps {
  isOpen: boolean;
  onConfirm: (lang: Language) => void;
}

export const LanguageOnboardingModal: React.FC<LanguageOnboardingModalProps> = ({
  isOpen,
  onConfirm,
}) => {
  // Default is English as strictly requested
  const [selectedLang, setSelectedLang] = useState<Language>('en');

  if (!isOpen) return null;

  const languagesList: { id: Language; label: string; nativeName: string; flag: string }[] = [
    { id: 'cs', label: 'Czech', nativeName: 'Čeština', flag: '🇨🇿' },
    { id: 'en', label: 'English', nativeName: 'English (Default)', flag: '🇬🇧' },
    { id: 'it', label: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
    { id: 'hu', label: 'Hungarian', nativeName: 'Magyar', flag: '🇭🇺' },
    { id: 'pl', label: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
    { id: 'sk', label: 'Slovak', nativeName: 'Slovenčina', flag: '🇸🇰' },
    { id: 'uk', label: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦' },
  ];

  const continueLabels: Record<Language, string> = {
    en: 'Continue to Application',
    sk: 'Pokračovať do aplikácie',
    cs: 'Pokračovat do aplikace',
    pl: 'Przejdź do aplikacji',
    hu: 'Tovább az alkalmazáshoz',
    uk: 'Перейти до додатку',
    it: "Continua nell'applicazione",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl select-none animate-in fade-in duration-300">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-white/15 p-6 flex flex-col gap-5 shadow-2xl">
        {/* Header with App Title & Icon */}
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-400/30 mb-3 shadow-lg">
            <Globe className="w-7 h-7" />
          </div>

          <span className="text-[11px] font-semibold uppercase tracking-widest text-amber-300">
            Toddler sleep assistant
          </span>

          <h2 className="text-xl font-light text-white tracking-wide mt-1">
            Choose Your Language
          </h2>

          <p className="text-xs text-white/60 mt-1 max-w-xs leading-relaxed">
            Please select your preferred language. You can change this anytime in Settings.
          </p>
        </div>

        {/* Language Options Grid */}
        <div className="grid grid-cols-1 gap-2">
          {languagesList.map((lang) => {
            const isSelected = selectedLang === lang.id;
            return (
              <button
                key={lang.id}
                onClick={() => setSelectedLang(lang.id)}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all active:scale-[0.98] touch-manipulation text-left ${
                  isSelected
                    ? 'bg-amber-400/15 border-amber-400 text-amber-200 ring-1 ring-amber-400/50 shadow-md font-medium'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{lang.flag}</span>
                  <div>
                    <span className="font-semibold text-sm text-white block">
                      {lang.nativeName}
                    </span>
                    <span className="text-[11px] text-white/45">
                      {lang.label}
                    </span>
                  </div>
                </div>

                {isSelected ? (
                  <div className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-sm">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border border-white/20" />
                )}
              </button>
            );
          })}
        </div>

        {/* Confirm / Continue Button */}
        <button
          onClick={() => onConfirm(selectedLang)}
          className="w-full min-h-[50px] rounded-2xl bg-amber-400 text-slate-950 font-bold text-sm hover:bg-amber-300 active:scale-95 touch-manipulation shadow-lg flex items-center justify-center gap-2"
        >
          <span>{continueLabels[selectedLang]}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
