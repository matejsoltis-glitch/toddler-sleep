import React, { useState } from 'react';
import { Globe, Check, ArrowRight } from 'lucide-react';
import { Language } from '../types';

interface LanguageOnboardingModalProps {
  isOpen: boolean;
  onConfirm: (lang: Language) => void;
}

// Crisp, vector SVG flags guaranteed to render perfectly on all devices (Android, iOS, Windows, Mac)
const FlagIcon: React.FC<{ lang: Language; className?: string }> = ({ lang, className = "w-6 h-4" }) => {
  switch (lang) {
    case 'en':
      return (
        <svg viewBox="0 0 60 40" className={className} aria-label="United Kingdom Flag">
          <rect width="60" height="40" rx="3" fill="#012169" />
          <path d="M0,0 L60,40 M60,0 L0,40" stroke="#ffffff" strokeWidth="7" />
          <path d="M0,0 L60,40 M60,0 L0,40" stroke="#C8102E" strokeWidth="4" />
          <path d="M30,0 v40 M0,20 h60" stroke="#ffffff" strokeWidth="11" />
          <path d="M30,0 v40 M0,20 h60" stroke="#C8102E" strokeWidth="7" />
        </svg>
      );
    case 'sk':
      return (
        <svg viewBox="0 0 60 40" className={className} aria-label="Slovakia Flag">
          <rect width="60" height="13.33" fill="#ffffff" />
          <rect y="13.33" width="60" height="13.33" fill="#0b4ea2" />
          <rect y="26.66" width="60" height="13.34" fill="#ee1c25" />
          <g transform="translate(16, 20) scale(0.68)">
            <path d="M-9,-12 h18 v14 c0,8 -9,12 -9,12 c0,0 -9,-4 -9,-12 z" fill="#ee1c25" stroke="#ffffff" strokeWidth="1.5" />
            <path d="M-6,7 c2,-3 4,-3 6,0 c2,-3 4,-3 6,0 v5 h-12 z" fill="#0b4ea2" />
            <path d="M0,-8 v16 M-4,-4 h8 M-3,-1 h6" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
          </g>
        </svg>
      );
    case 'cs':
      return (
        <svg viewBox="0 0 60 40" className={className} aria-label="Czech Republic Flag">
          <rect width="60" height="20" fill="#ffffff" />
          <rect y="20" width="60" height="20" fill="#d7141a" />
          <polygon points="0,0 30,20 0,40" fill="#11457e" />
        </svg>
      );
    case 'pl':
      return (
        <svg viewBox="0 0 60 40" className={className} aria-label="Poland Flag">
          <rect width="60" height="20" fill="#ffffff" />
          <rect y="20" width="60" height="20" fill="#dc143c" />
        </svg>
      );
    case 'hu':
      return (
        <svg viewBox="0 0 60 40" className={className} aria-label="Hungary Flag">
          <rect width="60" height="13.33" fill="#ce2939" />
          <rect y="13.33" width="60" height="13.33" fill="#ffffff" />
          <rect y="26.66" width="60" height="13.34" fill="#477050" />
        </svg>
      );
    case 'uk':
      return (
        <svg viewBox="0 0 60 40" className={className} aria-label="Ukraine Flag">
          <rect width="60" height="20" fill="#0057b7" />
          <rect y="20" width="60" height="20" fill="#ffd700" />
        </svg>
      );
    case 'it':
      return (
        <svg viewBox="0 0 60 40" className={className} aria-label="Italy Flag">
          <rect width="20" height="40" fill="#009246" />
          <rect x="20" width="20" height="40" fill="#ffffff" />
          <rect x="40" width="20" height="40" fill="#ce2b37" />
        </svg>
      );
    default:
      return null;
  }
};

export const LanguageOnboardingModal: React.FC<LanguageOnboardingModalProps> = ({
  isOpen,
  onConfirm,
}) => {
  // Default is English as strictly requested
  const [selectedLang, setSelectedLang] = useState<Language>('en');

  if (!isOpen) return null;

  const languagesList: { id: Language; label: string; nativeName: string; isFullWidth?: boolean }[] = [
    { id: 'en', label: 'English', nativeName: 'English (Default)', isFullWidth: true },
    { id: 'sk', label: 'Slovak', nativeName: 'Slovenčina' },
    { id: 'cs', label: 'Czech', nativeName: 'Čeština' },
    { id: 'pl', label: 'Polish', nativeName: 'Polski' },
    { id: 'hu', label: 'Hungarian', nativeName: 'Magyar' },
    { id: 'uk', label: 'Ukrainian', nativeName: 'Українська' },
    { id: 'it', label: 'Italian', nativeName: 'Italiano' },
  ];

  const continueLabels: Record<Language, string> = {
    en: 'Continue to Application',
    sk: 'Pokračovať do aplikácie',
    cs: 'Pokračovat do aplikace',
    pl: 'Przejdź do aplikacji',
    hu: 'Tovább az alkalmazáshoz',
    uk: 'Перейти do dodatku',
    it: "Continua nell'applicazione",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pb-[max(1.25rem,calc(env(safe-area-inset-bottom,24px)+16px))] bg-slate-950/95 backdrop-blur-xl select-none animate-in fade-in duration-300 overflow-y-auto">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-white/15 p-4 sm:p-5 flex flex-col gap-3.5 shadow-2xl my-auto">
        {/* Header with App Title, Icon and Flags Showcase Bar */}
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

        {/* Language Options Grid with Flag Icons at the start of each language */}
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
                  <div className="shrink-0 rounded-[3px] overflow-hidden shadow-sm border border-white/20">
                    <FlagIcon lang={lang.id} className="w-5 h-3.5 block" />
                  </div>
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

        {/* Confirm / Continue Button */}
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
