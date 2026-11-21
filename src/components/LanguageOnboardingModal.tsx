import React, { useState } from 'react';
import { Globe, Check, ArrowRight, ArrowLeft, Baby, Sparkles, X, Cake } from 'lucide-react';
import { Language } from '../types';
import { normalizeBabyName } from '../utils/babyName';
import { getWakeWindowCopy } from '../utils/wakeWindow';
import { triggerHaptic } from '../utils/haptics';

interface LanguageOnboardingModalProps {
  isOpen: boolean;
  onConfirm: (lang: Language, babyName: string, babyBirthDate?: string) => void;
}

// Crisp, vector SVG flags guaranteed to render perfectly on all devices (Android, iOS, Windows, Mac)
const FlagIcon: React.FC<{ lang: Language; className?: string }> = ({ lang, className = 'w-6 h-4' }) => {
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
    case 'es':
      return (
        <svg viewBox="0 0 60 40" className={className} aria-label="Spain Flag">
          <rect width="60" height="10" fill="#aa151b" />
          <rect y="10" width="60" height="20" fill="#f1bf00" />
          <rect y="30" width="60" height="10" fill="#aa151b" />
          <g transform="translate(15, 20)">
            <rect x="-4" y="-5" width="8" height="9" rx="2" fill="#aa151b" stroke="#f1bf00" strokeWidth="0.9" />
            <rect x="-2" y="-3" width="4" height="5" rx="1" fill="#f1bf00" />
          </g>
        </svg>
      );
    case 'ro':
      return (
        <svg viewBox="0 0 60 40" className={className} aria-label="Romania Flag">
          <rect width="20" height="40" fill="#002b7f" />
          <rect x="20" width="20" height="40" fill="#fcd116" />
          <rect x="40" width="20" height="40" fill="#ce1126" />
        </svg>
      );
    case 'ar':
      return (
        <svg viewBox="0 0 60 40" className={className} aria-label="Arabic Flag">
          <rect width="60" height="40" rx="3" fill="#006c35" />
          <path
            d="M14,16 C18,12 22,19 26,15 C30,11 34,18 39,14 C42,12 45,15 47,14"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <line x1="16" y1="26" x2="44" y2="26" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="41" y1="23.5" x2="41" y2="28.5" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
};

interface OnboardingCopy {
  step1Heading: string;
  step1Subtitle: string;
  nextStepBtn: string;
  step2Heading: string;
  step2Subtitle: string;
  nameLabel: string;
  namePlaceholder: string;
  nameHint: string;
  backBtn: string;
  skipBtn: string;
  finishBtn: string;
  stepLabel: (step: number) => string;
}

const onboardingCopy: Record<Language, OnboardingCopy> = {
  en: {
    step1Heading: 'Choose Your Language',
    step1Subtitle: 'Select your language. You can change this anytime in Settings.',
    nextStepBtn: 'Continue',
    step2Heading: "What's your baby's name?",
    step2Subtitle: 'We will personalize sleep tracking and gentle messages for your little one.',
    nameLabel: "Child's Name (optional)",
    namePlaceholder: 'e.g. Emma, Leo...',
    nameHint: 'You can add or change the name anytime in Settings.',
    backBtn: 'Back',
    skipBtn: 'Skip for now',
    finishBtn: 'Continue to Application',
    stepLabel: (s) => `Step ${s} of 2`,
  },
  sk: {
    step1Heading: 'Vyberte si jazyk',
    step1Subtitle: 'Zvoľte jazyk aplikácie. Kedykoľvek ho môžete zmeniť v Nastaveniach.',
    nextStepBtn: 'Pokračovať',
    step2Heading: 'Ako sa volá vaše bábätko?',
    step2Subtitle: 'Meno nahradí všeobecné pomenovania dieťatka v celej aplikácii.',
    nameLabel: 'Meno dieťatka (voliteľné)',
    namePlaceholder: 'napr. Ema, Jakub...',
    nameHint: 'Meno môžete kedykoľvek pridať alebo zmeniť v Nastaveniach.',
    backBtn: 'Späť',
    skipBtn: 'Preskočiť zatiaľ',
    finishBtn: 'Vstúpiť do aplikácie',
    stepLabel: (s) => `Krok ${s} z 2`,
  },
  cs: {
    step1Heading: 'Vyberte si jazyk',
    step1Subtitle: 'Zvolte jazyk aplikace. Kdykoli ho můžete změnit v Nastavení.',
    nextStepBtn: 'Pokračovat',
    step2Heading: 'Jak se jmenuje vaše miminko?',
    step2Subtitle: 'Jméno nahradí obecná pojmenování děťátka v celé aplikaci.',
    nameLabel: 'Jméno děťátka (volitelné)',
    namePlaceholder: 'např. Eliška, Jakub...',
    nameHint: 'Jméno můžete kdykoli přidat nebo upravit v Nastavení.',
    backBtn: 'Zpět',
    skipBtn: 'Přeskočit',
    finishBtn: 'Vstoupit do aplikace',
    stepLabel: (s) => `Krok ${s} ze 2`,
  },
  pl: {
    step1Heading: 'Wybierz język',
    step1Subtitle: 'Wybierz język aplikacji. Możesz go zmienić w każdej chwili w Ustawieniach.',
    nextStepBtn: 'Dalej',
    step2Heading: 'Jak ma na imię Twoje dziecko?',
    step2Subtitle: 'Imię zastąpi ogólne określenia maluszka w całej aplikacji.',
    nameLabel: 'Imię dziecka (opcjonalnie)',
    namePlaceholder: 'np. Zuzia, Antek...',
    nameHint: 'Możesz dodać lub zmienić imię w dowolnym momencie w Ustawieniach.',
    backBtn: 'Wstecz',
    skipBtn: 'Pomiń na razie',
    finishBtn: 'Przejdź do aplikacji',
    stepLabel: (s) => `Krok ${s} z 2`,
  },
  hu: {
    step1Heading: 'Válassz nyelvet',
    step1Subtitle: 'Válaszd ki az alkalmazás nyelvét. Bármikor módosíthatod a Beállításokban.',
    nextStepBtn: 'Tovább',
    step2Heading: 'Hogy hívják a kisbabádat?',
    step2Subtitle: 'A név felváltja az általános megnevezéseket az egész alkalmazásban.',
    nameLabel: 'Kisbaba neve (opcionális)',
    namePlaceholder: 'pl. Hanna, Bence...',
    nameHint: 'A nevet bármikor hozzáadhatod vagy módosíthatod a Beállításokban.',
    backBtn: 'Vissza',
    skipBtn: 'Kihagyás most',
    finishBtn: 'Tovább az alkalmazáshoz',
    stepLabel: (s) => `${s} / 2. lépés`,
  },
  uk: {
    step1Heading: 'Оберіть мову',
    step1Subtitle: 'Виберіть мову додатка. Її можна змінити будь-коли в Налаштуваннях.',
    nextStepBtn: 'Далі',
    step2Heading: 'Як звати вашу дитину?',
    step2Subtitle: 'Ім’я замінить загальні звернення до малюка в усьому додатку.',
    nameLabel: 'Ім’я дитини (необов’язково)',
    namePlaceholder: 'напр. Софія, Марк...',
    nameHint: 'Ви зможете додати або змінити ім’я будь-коли в Налаштуваннях.',
    backBtn: 'Назад',
    skipBtn: 'Пропустити',
    finishBtn: 'Перейти до додатку',
    stepLabel: (s) => `Крок ${s} з 2`,
  },
  it: {
    step1Heading: 'Scegli la lingua',
    step1Subtitle: 'Seleziona la lingua. Puoi cambiarla in qualsiasi momento nelle Impostazioni.',
    nextStepBtn: 'Continua',
    step2Heading: 'Come si chiama il tuo bambino?',
    step2Subtitle: "Il nome sostituirà i riferimenti generici al bambino in tutta l'app.",
    nameLabel: 'Nome del bambino (opzionale)',
    namePlaceholder: 'es. Sofia, Leo...',
    nameHint: 'Puoi aggiungere o modificare il nome in qualsiasi momento nelle Impostazioni.',
    backBtn: 'Indietro',
    skipBtn: 'Salta per ora',
    finishBtn: "Continua nell'applicazione",
    stepLabel: (s) => `Passo ${s} di 2`,
  },
  es: {
    step1Heading: 'Elige tu idioma',
    step1Subtitle: 'Selecciona tu idioma. Puedes cambiarlo en cualquier momento en Ajustes.',
    nextStepBtn: 'Continuar',
    step2Heading: '¿Cómo se llama tu bebé?',
    step2Subtitle: 'El nombre reemplazará las menciones genéricas del bebé en toda la aplicación.',
    nameLabel: 'Nombre del bebé (opcional)',
    namePlaceholder: 'ej. Sofía, Mateo...',
    nameHint: 'Puedes añadir o cambiar el nombre cuando quieras en Ajustes.',
    backBtn: 'Atrás',
    skipBtn: 'Omitir por ahora',
    finishBtn: 'Entrar a la aplicación',
    stepLabel: (s) => `Paso ${s} de 2`,
  },
  ro: {
    step1Heading: 'Alege limba',
    step1Subtitle: 'Selectează limba aplicației. O poți schimba oricând din Setări.',
    nextStepBtn: 'Continuă',
    step2Heading: 'Cum îl cheamă pe copilul tău?',
    step2Subtitle: 'Numele va înlocui termenii generali despre bebeluș în toată aplicația.',
    nameLabel: 'Numele copilului (opțional)',
    namePlaceholder: 'ex. Sofia, Matei...',
    nameHint: 'Poți adăuga sau modifica numele oricând în Setări.',
    backBtn: 'Înapoi',
    skipBtn: 'Sari deocamdată',
    finishBtn: 'Intră în aplicație',
    stepLabel: (s) => `Pasul ${s} din 2`,
  },
  ar: {
    step1Heading: 'اختر لغتك',
    step1Subtitle: 'اختر لغة التطبيق. يمكنك تغييرها في أي وقت من الإعدادات.',
    nextStepBtn: 'متابعة',
    step2Heading: 'ما اسم طفلك؟',
    step2Subtitle: 'سيحل اسم طفلك محل العبارات العامة في جميع أنحاء التطبيق.',
    nameLabel: 'اسم الطفل (اختياري)',
    namePlaceholder: 'مثل: سارة، عمر...',
    nameHint: 'يمكنك إضافة الاسم أو تغييره في أي وقت من الإعدادات.',
    backBtn: 'رجوع',
    skipBtn: 'تخطي الآن',
    finishBtn: 'الدخول إلى التطبيق',
    stepLabel: (s) => `الخطوة ${s} من 2`,
  },
};

export const LanguageOnboardingModal: React.FC<LanguageOnboardingModalProps> = ({
  isOpen,
  onConfirm,
}) => {
  const [selectedLang, setSelectedLang] = useState<Language>('en');
  const [step, setStep] = useState<1 | 2>(1);
  const [babyNameInput, setBabyNameInput] = useState<string>('');
  const [birthDateInput, setBirthDateInput] = useState<string>('');

  if (!isOpen) return null;

  const languagesList: { id: Language; label: string; nativeName: string }[] = [
    { id: 'en', label: 'English', nativeName: 'English' },
    { id: 'sk', label: 'Slovak', nativeName: 'Slovenčina' },
    { id: 'cs', label: 'Czech', nativeName: 'Čeština' },
    { id: 'pl', label: 'Polish', nativeName: 'Polski' },
    { id: 'hu', label: 'Hungarian', nativeName: 'Magyar' },
    { id: 'uk', label: 'Ukrainian', nativeName: 'Українська' },
    { id: 'it', label: 'Italian', nativeName: 'Italiano' },
    { id: 'es', label: 'Spanish', nativeName: 'Español' },
    { id: 'ro', label: 'Romanian', nativeName: 'Română' },
    { id: 'ar', label: 'Arabic', nativeName: 'العربية' },
  ];

  const copy = onboardingCopy[selectedLang] || onboardingCopy.en;
  const wakeCopy = getWakeWindowCopy(selectedLang, babyNameInput);
  const todayIsoDate = new Date().toISOString().split('T')[0];
  const isRtl = selectedLang === 'ar';

  const handleFinish = (skipDetails = false) => {
    triggerHaptic(10);
    const cleaned = skipDetails ? '' : normalizeBabyName(babyNameInput);
    const cleanedBirth = skipDetails ? '' : birthDateInput;
    onConfirm(selectedLang, cleaned, cleanedBirth);
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pb-[max(1.25rem,calc(env(safe-area-inset-bottom,24px)+16px))] bg-slate-950/95 backdrop-blur-xl select-none animate-in fade-in duration-300 overflow-y-auto"
    >
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-white/15 p-4 sm:p-5 flex flex-col gap-3 shadow-2xl my-auto">
        {/* Step indicator */}
        <div className="flex items-center justify-between px-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-300/90">
            Toddler sleep assistant
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium text-white/45">
              {copy.stepLabel(step)}
            </span>
            <div className="flex items-center gap-1">
              <span
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === 1 ? 'w-4 bg-amber-400' : 'w-1.5 bg-amber-400/50'
                }`}
              />
              <span
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === 2 ? 'w-4 bg-amber-400' : 'w-1.5 bg-white/20'
                }`}
              />
            </div>
          </div>
        </div>

        {step === 1 ? (
          <>
            {/* Step 1: Language Selection */}
            <div className="flex flex-col items-center text-center">
              <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-400/30 mb-1 shadow-md">
                <Globe className="w-4 h-4" />
              </div>

              <h2 className="text-base sm:text-lg font-light text-white tracking-wide">
                {copy.step1Heading}
              </h2>

              <p className="text-[11px] text-white/60 mt-0.5 max-w-xs leading-tight">
                {copy.step1Subtitle}
              </p>
            </div>

            {/* Balanced 2x5 Grid of all 10 languages (fits comfortably without scrolling) */}
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2" dir="ltr">
              {languagesList.map((lang) => {
                const isSelected = selectedLang === lang.id;
                return (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic(6);
                      setSelectedLang(lang.id);
                    }}
                    className={`flex items-center justify-between px-2.5 py-1.5 sm:py-2 rounded-xl border transition-all active:scale-[0.98] touch-manipulation text-left ${
                      isSelected
                        ? 'bg-amber-400/20 border-amber-400 text-amber-200 ring-1 ring-amber-400/60 shadow-md font-medium'
                        : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/80'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
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

                    <div className="shrink-0 ml-1">
                      {isSelected ? (
                        <div className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-sm">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-white/20" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Next Step Button */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic(10);
                setStep(2);
              }}
              className="w-full h-11 sm:h-12 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm hover:bg-amber-300 active:scale-95 touch-manipulation shadow-lg flex items-center justify-center gap-2 transition-all mt-0.5"
            >
              <span>{copy.nextStepBtn}</span>
              <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
            </button>
          </>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleFinish(false);
            }}
            className="flex flex-col gap-4 animate-in fade-in duration-200"
          >
            {/* Step 2: Baby Name Personalization */}
            <div className="flex flex-col items-center text-center pt-1">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400/25 to-rose-400/20 text-amber-300 flex items-center justify-center border border-amber-400/35 mb-2.5 shadow-lg">
                <Baby className="w-6 h-6" />
              </div>

              <h2 className="text-lg font-medium text-white tracking-wide">
                {copy.step2Heading}
              </h2>

              <p className="text-xs text-white/60 mt-1 max-w-xs leading-relaxed">
                {copy.step2Subtitle}
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="onboarding-baby-name"
                className="text-[11px] font-semibold uppercase tracking-wider text-amber-300/80 px-1 flex items-center gap-1.5"
              >
                <Sparkles className="w-3 h-3" />
                <span>{copy.nameLabel}</span>
              </label>

              <div className="relative">
                <input
                  id="onboarding-baby-name"
                  type="text"
                  value={babyNameInput}
                  onChange={(e) => setBabyNameInput(e.target.value)}
                  placeholder={copy.namePlaceholder}
                  maxLength={24}
                  autoFocus
                  className="w-full h-12 px-4 rounded-xl bg-slate-950/90 border border-white/20 text-white text-sm font-medium placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400/60 transition-all"
                />
                {babyNameInput.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setBabyNameInput('')}
                    className={`absolute top-1/2 -translate-y-1/2 ${
                      isRtl ? 'left-2.5' : 'right-2.5'
                    } w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 flex items-center justify-center transition-colors`}
                    aria-label="Clear"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <p className="text-[11px] text-white/45 px-1">
                {copy.nameHint}
              </p>
            </div>

            {/* Optional Date of Birth for Optimal Wake Window Alerts */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="onboarding-baby-birthdate"
                className="text-[11px] font-semibold uppercase tracking-wider text-indigo-300/85 px-1 flex items-center gap-1.5"
              >
                <Cake className="w-3 h-3" />
                <span>{wakeCopy.birthDateLabel}</span>
              </label>

              <input
                id="onboarding-baby-birthdate"
                type="date"
                value={birthDateInput}
                max={todayIsoDate}
                onChange={(e) => setBirthDateInput(e.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-slate-950/90 border border-white/20 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400/60 transition-all"
              />

              <p className="text-[11px] text-white/45 px-1">
                {wakeCopy.birthDateHint}
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(6);
                    setStep(1);
                  }}
                  className="h-11 sm:h-12 px-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 font-semibold text-xs active:scale-95 touch-manipulation flex items-center justify-center gap-1.5 border border-white/10 transition-all shrink-0"
                >
                  <ArrowLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
                  <span>{copy.backBtn}</span>
                </button>

                <button
                  type="submit"
                  className="flex-1 h-11 sm:h-12 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm hover:bg-amber-300 active:scale-95 touch-manipulation shadow-lg flex items-center justify-center gap-2 transition-all"
                >
                  <span>{copy.finishBtn}</span>
                  <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {babyNameInput.trim().length === 0 && (
                <button
                  type="button"
                  onClick={() => handleFinish(true)}
                  className="w-full py-1.5 text-[11px] text-white/45 hover:text-white/75 transition-colors font-medium"
                >
                  {copy.skipBtn}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
