import React, { useState } from 'react';
import { Globe, Check, ArrowRight } from 'lucide-react';
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

  const languagesList: { id: Language; label: string; nativeName: string; flag: string; isFullWidth?: boolean }[] = [
    { id: 'en', label: 'English', nativeName: 'English (Default)', flag: '🇬🇧', isFullWidth: true },
    { id: 'sk', label: 'Slovak', nativeName: 'Slovenčina', flag: '🇸🇰' },
    { id: 'cs', label: 'Czech', nativeName: 'Čeština', flag: '🇨🇿' },
    { id: 'pl', label: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
    { id: 'hu', label: 'Hungarian', nativeName: 'Magyar', flag: '🇭🇺' },
    { id: 'uk', label: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦' },
    { id: 'it', label: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pb-[max(1.25rem,calc(env(safe-area-inset-bottom,24px)+16px))] bg-slate-950/95 backdrop-blur-xl select-none animate-in fade-in duration-300 overflow-y-auto">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-white/15 p-4 sm:p-5 flex flex-col gap-3.5 shadow-2xl my-auto">
        {/* Header with App Title & Icon - Compact to guarantee fit above Android system buttons */}
        <div className="flex flex-col items-center text-center">
          <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-400/30 mb-1.5 shadow-md">
            <Globe className="w-5 h-5" />
          </div>

          <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">
            Toddler sleep assistant
          </span>

          <h2 className="text-base sm:text-lg font-light text-white tracking-wide mt-0.5">
            Choose Your Language
          </h2>

          <p className="text-[11px] text-white/60 mt-0.5 max-w-xs leading-tight">
            Select your language. You can change this anytime in Settings.
          </p>
        </div>

        {/* Language Options Grid - 2 Column Compact Grid so entire screen fits without scrolling */}
        <div className="grid grid-cols-2 gap-2">
          {languagesList.map((lang) => {
            const isSelected = selectedLang === lang.id;
            return (
              <button
                key={lang.id}
                onClick={() => setSelectedLang(lang.id)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl border transition-all active:scale-[0.98] touch-manipulation text-left ${
                  lang.isFullWidth ? 'col-span-2' : 'col-span-1'
                } ${
                  isSelected
                    ? 'bg-amber-400/20 border-amber-400 text-amber-200 ring-1 ring-amber-400/60 shadow-md font-medium'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/80'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xl shrink-0 leading-none">{lang.flag}</span>
                  <div className="min-w-0 truncate">
                    <span className="font-semibold text-xs text-white block truncate leading-tight">
                      {lang.nativeName}
                    </span>
                    <span className="text-[10px] text-white/45 block truncate leading-tight">
                      {lang.label}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 ml-1.5">
                  {isSelected ? (
                    <div className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-sm">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-white/20" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Confirm / Continue Button - comfortably elevated with clear bottom margin */}
        <button
          onClick={() => onConfirm(selectedLang)}
          className="w-full h-11 sm:h-12 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm hover:bg-amber-300 active:scale-95 touch-manipulation shadow-lg flex items-center justify-center gap-2 transition-all mt-1"
        >
          <span>{continueLabels[selectedLang]}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
