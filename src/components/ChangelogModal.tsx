import React from 'react';
import { X, Sparkles, History, Check } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../i18n/translations';
import { triggerHaptic } from '../utils/haptics';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

interface ReleaseEntry {
  version: string;
  isLatest?: boolean;
  highlights: Record<Language, string[]>;
}

const RELEASES: ReleaseEntry[] = [
  {
    version: 'v1.0',
    isLatest: true,
    highlights: {
      sk: [
        'Oficiálna stabilná verzia v1.0!',
        'Výška päty zmenšená o 50% a presná 2mm medzera od časovača.',
        'Zrezanie vrchnej hlavičky o 2mm pre ešte čistejší vzhľad na mobiloch.',
        'Plná 7-jazyčná lokalizácia tlačidla Návrat do hlavného menu.',
        'Interaktívne okno changelogu priamo po kliknutí na verziu.',
        'Kontaktné a autorské okno po kliknutí na meno autora (msglitchapps@gmail.com).',
        'Oficiálna verzia aplikácie v1.0 pre Android zostavenie.',
      ],
      cs: [
        'Oficiální stabilní verze v1.0!',
        'Výška zápatí zmenšena o 50% a přesná 2mm mezera od časovače.',
        'Zkrácení horního záhlaví o 2mm pro čistější vzhled na mobilech.',
        'Plná 7-jazyčná lokalizace tlačítka Návrat do hlavního menu.',
        'Interaktivní okno changelogu přímo po klepnutí na verzi.',
        'Kontaktní a autorské okno po klepnutí na jméno autora (msglitchapps@gmail.com).',
        'Oficiální verze aplikace v1.0 pro Android sestavení.',
      ],
      en: [
        'Official stable release v1.0!',
        'Halved footer height and set 2mm spacing from sleep timer.',
        'Trimmed top header by 2mm for a cleaner mobile layout.',
        'Full 7-language localization for the Back to Main Menu button.',
        'Interactive changelog modal accessible directly by tapping the version.',
        'Author & contact info modal accessible by tapping author name (msglitchapps@gmail.com).',
        'Official v1.0 app version configured across Android build files.',
      ],
      pl: [
        'Oficjalna stabilna wersja v1.0!',
        'Wysokość stopki zmniejszona o 50% i 2mm odstęp od timera.',
        'Zmniejszenie górnego nagłówka o 2mm dla lepszego wyglądu na telefonach.',
        'Pełna lokalizacja w 7 językach przycisku powrotu do menu głównego.',
        'Interaktywne okno historii wersji po kliknięciu w wersję.',
        'Okno autora i kontaktu po kliknięciu w autora (msglitchapps@gmail.com).',
      ],
      hu: [
        'Hivatalos stabil v1.0 verzió!',
        '50%-kal kisebb lábléc magasság és 2mm távolság az időzítőtől.',
        'Fejléc magasságának csökkentése 2mm-rel a letisztultabb mobilos megjelenésért.',
        'A főmenü gomb teljes körű lokalizációja 7 nyelven.',
        'Interaktív változásnapló a verzióra kattintva.',
        'Szerzői és visszajelzési ablak a készítő nevére koppintva (msglitchapps@gmail.com).',
      ],
      uk: [
        'Офіційна стабільна версія v1.0!',
        'Висота підвалу зменшена на 50% та точний відступ 2 мм від таймера.',
        'Зменшення верхнього заголовка на 2 мм для чистого вигляду на смартфонах.',
        'Повна 7-мовна локалізація кнопки повернення до головного меню.',
        'Інтерактивне вікно історії змін після натискання на версію.',
        'Вікно зворотного зв\'язку та автора (msglitchapps@gmail.com).',
      ],
      it: [
        'Versione ufficiale stabile v1.0!',
        'Altezza del piè di pagina ridotta del 50% e spazio di 2mm dal timer.',
        'Riduzione dell\'intestazione superiore di 2mm per una visualizzazione ottimale.',
        'Localizzazione completa in 7 lingue per il pulsante del menu principale.',
        'Finestra interattiva del registro delle modifiche toccando la versione.',
        'Finestra di contatto e autore toccando il nome dell\'autore (msglitchapps@gmail.com).',
      ],
    },
  },
  {
    version: 'v0.9.96',
    highlights: {
      sk: [
        'Oprava zarovnania a responzivity farebného kolieska na všetkých displejoch (vektorové GPU gradienty).',
        'Plynulé a mäkké prelínanie farieb v režime pokojného svetla bez nepríjemných skokov pre oči.',
        'Premenovanie na Cirkadiálne spektrum (na základe výskumu spánkových laboratórií).',
      ],
      cs: [
        'Oprava zarovnání barevného kolečka na všech typech displejů.',
        'Plynulé prolínání barev v klidném světle bez náhlých skoků.',
        'Přejmenování na Cirkadiální spektrum.',
      ],
      en: [
        'Fixed color wheel scaling and alignment across high-DPI displays.',
        'Continuous fluid color morphing without abrupt jumps in Calm Light mode.',
        'Renamed to Circadian Spectrum (based on sleep laboratory research).',
      ],
      pl: [
        'Płynne przejścia barw w trybie spokojnego światła bez nagłych skoków.',
        'Poprawa koła kolorów na wszystkich ekranach.',
      ],
      hu: [
        'Finom, ugrásmentes színátmenetek a nyugtató fény módban.',
        'Színkerék igazításának javítása.',
      ],
      uk: [
        'Плавне перетікання кольорів у режимі спокійного світла.',
        'Виправлення центpyвання колірного кола.',
      ],
      it: [
        'Transizioni di colore fluide e morbide nella modalità luce calma.',
        'Allineamento corretto della ruota dei colori.',
      ],
    },
  },
  {
    version: 'v0.9.95',
    highlights: {
      sk: [
        'O 30% kompaktnejšie posuvníky v hlavnom menu so zachovaním citlivosti dotyku.',
        'Vedecké Cirkadiálne spektrum bez blokovania melatonínu (>620 nm).',
        'Vlastný režim (Ľubovoľné) s výberom 2 až 6 farieb a interaktívnym kolieskom.',
        'Zobrazenie iba aktívnej palety s plynulým akordeónovým rozbalením.',
      ],
      cs: [
        'O 30% kompaktnější posuvníky v hlavním menu.',
        'Vědecké Cirkadiální spektrum bez blokování melatoninu.',
        'Vlastní režim s výběrem 2 až 6 barev.',
      ],
      en: [
        '30% more compact sliders in main menu.',
        'Circadian spectrum with zero melatonin suppression (>620nm).',
        'Custom palette with 2 to 6 colors and interactive color wheel.',
      ],
      pl: ['Kompaktowe suwaki i własna paleta od 2 do 6 kolorów.'],
      hu: ['Kompaktabb csúszkák és egyéni 2-6 színválasztás.'],
      uk: ['Компактні повзунки та власна палітра від 2 до 6 кольорів.'],
      it: ['Cursori più compatti e tavolozza personalizzata da 2 a 6 colori.'],
    },
  },
  {
    version: 'v0.99',
    highlights: {
      sk: [
        'Interaktívny kalendár pre výber konkrétneho dňa v histórii spánkov.',
        'Extra stlmenie obrazovky na minimum po skončení časovača vypnutia.',
        'Tretí posuvník Priehľadnosť v hlavnom menu (od 5% do 100%).',
      ],
      cs: [
        'Interaktivní kalendář pro výběr dne v historii spánků.',
        'Ztmavení obrazovky po skončení časovače.',
        'Posuvník průhlednosti komponent (5% až 100%).',
      ],
      en: [
        'Interactive Month Calendar picker for sleep history.',
        'Auto-dimming to ultra-low brightness after sleep timer expires.',
        'Components Opacity slider (5% to 100%) in main menu.',
      ],
      pl: ['Interaktywny kalendarz i suwak przezroczystości.'],
      hu: ['Interaktív naptár és átlátszóság csúszka.'],
      uk: ['Інтерактивний календар та повзунок прозорості.'],
      it: ['Calendario interattivo e cursore trasparenza.'],
    },
  },
  {
    version: 'v0.98 - v0.90',
    highlights: {
      sk: [
        'v0.98: Vyčistenie a zjednodušenie okienka časovača.',
        'v0.97: Zvýšenie citlivosti posuvníka časovača na 10 sekúnd.',
        'v0.96: Posuvník časovača v štýle tečúcej vody, krokovanie po 5 minútach.',
        'v0.95: Stránkovanie histórie na 6 záznamov s možnosťou rozkliknutia.',
        'v0.92: Plná 7-jazyčná lokalizácia Asistenta spánkového režimu.',
        'v0.90: Štatistické okno bdelosti a spánku dieťaťa.',
      ],
      cs: [
        'Optimalizace časovače, historie spánků a kompletní lokalizace.',
      ],
      en: [
        'Precision timer scrubbing, liquid water indicators, and pediatric schedule tracking.',
      ],
      pl: ['Usprawnienia timera, historii snu i statystyk.'],
      hu: ['Időzítő, alvástörténet és statisztikák fejlesztése.'],
      uk: ['Покращення таймера, історії сну та розкладу.'],
      it: ['Miglioramenti al timer, cronologia del sonno e statistiche.'],
    },
  },
];

export const ChangelogModal: React.FC<ChangelogModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  if (!isOpen) return null;

  const t = translations[language];

  return (
    <div
      onClick={() => {
        triggerHaptic(6);
        onClose();
      }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[85vh] bg-slate-900 border border-white/15 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 text-white overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-400/30">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                {t.changelogModal?.title || 'História verzií a novinky'}
              </h2>
              <span className="text-[11px] text-amber-300/80 font-mono">
                Aktuálna verzia: v1.0
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic(6);
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white/70 hover:text-white flex items-center justify-center transition-all"
            aria-label={t.changelogModal?.close || 'Zavrieť'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable List of Versions */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3.5 scrollbar-thin scrollbar-thumb-white/20">
          {RELEASES.map((rel) => {
            const points = rel.highlights[language] || rel.highlights.sk || rel.highlights.en;
            return (
              <div
                key={rel.version}
                className={`p-3.5 rounded-2xl border transition-all ${
                  rel.isLatest
                    ? 'bg-amber-400/10 border-amber-400/40 ring-1 ring-amber-400/30'
                    : 'bg-white/[0.03] border-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-amber-300">
                    {rel.version}
                  </span>
                  {rel.isLatest && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-bold text-[10px] tracking-wider uppercase flex items-center gap-1 shadow-sm">
                      <Sparkles className="w-3 h-3" />
                      Najnovšia
                    </span>
                  )}
                </div>

                <ul className="flex flex-col gap-1.5 text-xs text-white/80">
                  {points.map((pt, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      <span className="leading-relaxed">{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Close Button */}
        <button
          onClick={() => {
            triggerHaptic(6);
            onClose();
          }}
          className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs active:scale-95 transition-all border border-white/10"
        >
          {t.changelogModal?.close || 'Zavrieť'}
        </button>
      </div>
    </div>
  );
};
