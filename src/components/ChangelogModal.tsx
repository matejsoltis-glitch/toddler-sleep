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
    version: 'v1.1.1',
    isLatest: true,
    highlights: {
      sk: [
        'Záloha a prenos dát (export / import JSON) v Nastaveniach + zachovanie histórie po aktualizácii a čistý štart pre nových používateľov.',
        'Potvrdenie pred zmazaním spánku a úprava poradia v 4. režime (ručné pridanie spánku hneď pod aktuálnym stavom).',
        'Kompaktnejšie zrolovateľné Nastavenia a tichá offline pripomienka pred ideálnym bdelým oknom.',
        'Nový zrolovateľný 7-dňový čiarový graf spánku (Deň a noc / Spolu) a zdieľateľný súhrn pre pediatra (7/14 dní + CSV).',
        'Oprava živého časovača spánku na zamknutej obrazovke na starších Androidoch (napr. Redmi Note 11 / MIUI) a presnejších výpočtov.',
      ],
      cs: [
        'Záloha a přenos dat (export / import JSON) v Nastavení + zachování historie po aktualizaci a čistý start pro nové uživatele.',
        'Potvrzení před smazáním spánku a úprava pořadí ve 4. režimu (ruční přidání spánku hned pod aktuálním stavem).',
        'Kompaktnější sbalitelné Nastavení a tichá offline připomínka před ideálním bdělým oknem.',
        'Nový sbalitelný 7denní čárový graf spánku (Den a noc / Celkem) a sdílený souhrn pro pediatra (7/14 dní + CSV).',
        'Oprava živého časovače spánku na zamčené obrazovce u starších Androidů (např. Redmi Note 11 / MIUI) a přesnějších výpočtů.',
      ],
      en: [
        'Backup & device transfer (JSON export / import) in Settings, preserved history across updates, and clean empty start for new users.',
        'Delete confirmation for saved sleep records and improved Mode 4 layout (manual entry directly below current status).',
        'Compact collapsible Settings sections and silent offline reminder before the ideal wake window.',
        'New collapsible 7-day line chart (Day & Night / Total) and shareable 7/14-day pediatrician summary with CSV export.',
        'Fixed live lock-screen sleep chronometer on older Android & MIUI devices (e.g. Redmi Note 11) and refined sleep math.',
      ],
      pl: [
        'Kopia zapasowa i przenoszenie danych (eksport / import JSON) w Ustawieniach oraz czysty start dla nowych użytkowników.',
        'Potwierdzenie przed usunięciem snu i wygodniejsza kolejność sekcji w trybie 4.',
        'Kompaktowe zwijane Ustawienia i ciche przypomnienie offline przed idealnym oknem czuwania.',
        'Nowy zwijany 7-dniowy wykres liniowy snu (Dzień i noc / Łącznie) oraz raport dla pediatry (7/14 dni + CSV).',
        'Poprawka stopera snu na ekranie blokady starszych Androidów (np. Redmi Note 11 / MIUI) i dokładności obliczeń.',
      ],
      hu: [
        'Biztonsági mentés és átvitel (JSON export / import) a Beállításokban, tiszta indulás új felhasználóknak.',
        'Megerősítés alvás törlése előtt és áttekinthetőbb sorrend a 4. módban.',
        'Kompakt, összecsukható Beállítások és csendes offline emlékeztető az ideális ébrenléti ablak előtt.',
        'Új, lenyitható 7 napos vonaldiagram (Nappal és éjjel / Összesen) és megosztható összefoglaló gyermekorvosnak (7/14 nap + CSV).',
        'Zárolt képernyős élő alvásidő-mérő javítása régebbi Androidokon (pl. Redmi Note 11 / MIUI).',
      ],
      uk: [
        'Резервне копіювання та перенесення даних (експорт / імпорт JSON) у Налаштуваннях і чистий старт для нових користувачів.',
        'Підтвердження перед видаленням запису сну та зручніший порядок блоків у 4-му режимі.',
        'Компактні згортані Налаштування та тихе офлайн-нагадування перед ідеальним вікном сну.',
        'Новий 7-денний лінійний графік сну (День і ніч / Разом) та підсумок для педіатра (7/14 днів + CSV).',
        'Виправлення живого таймера сну на екрані блокування старіших Android (напр. Redmi Note 11 / MIUI).',
      ],
      it: [
        'Backup e trasferimento dati (esporta / importa JSON) nelle Impostazioni e avvio pulito per i nuovi utenti.',
        'Conferma prima di eliminare un sonno e ordine migliorato nella modalità 4.',
        'Impostazioni compatte a fisarmonica e promemoria offline silenzioso prima della finestra di sonno ideale.',
        'Nuovo grafico a linee a 7 giorni (Giorno e notte / Totale) e riepilogo condivisibile per pediatra (7/14 giorni + CSV).',
        'Risolto il cronometro live del sonno su schermata di blocco per Android meno recenti (es. Redmi Note 11 / MIUI).',
      ],
      es: [
        'Copia de seguridad y migración (exportar / importar JSON) en Ajustes e inicio limpio para nuevos usuarios.',
        'Confirmación antes de borrar un sueño y orden mejorado en el modo 4.',
        'Ajustes compactos plegables y recordatorio silencioso sin conexión antes de la ventana ideal de sueño.',
        'Nuevo gráfico de líneas de 7 días (Día y noche / Total) y resumen compartible para pediatra (7/14 días + CSV).',
        'Corrección del cronómetro en vivo en pantalla de bloqueo para Android antiguos (p. ej. Redmi Note 11 / MIUI).',
      ],
      ro: [
        'Backup și transfer de date (export / import JSON) în Setări și start curat pentru utilizatorii noi.',
        'Confirmare înainte de ștergerea unui somn și ordonare mai practică în modul 4.',
        'Setări compacte pliabile și memento silențios offline înainte de fereastra optimă de somn.',
        'Grafic liniar nou pe 7 zile (Zi și noapte / Total) și rezumat partajabil pentru pediatru (7/14 zile + CSV).',
        'Corectarea cronometrului live pe ecranul de blocare pentru Android mai vechi (ex. Redmi Note 11 / MIUI).',
      ],
      ar: [
        'نسخ احتياطي ونقل البيانات (تصدير/استيراد JSON) في الإعدادات وبداية نظيفة للمستخدمين الجدد.',
        'تأكيد قبل حذف سجل النوم وترتيب أسهل لأقسام الوضع الرابع.',
        'إعدادات مدمجة قابلة للطي وتذكير صامت دون إنترنت قبل نافذة النوم المثالية.',
        'مخطط خطي جديد لآخر 7 أيام (نهار وليل / الإجمالي) وملخص قابل للمشاركة لطبيب الأطفال (7/14 يوماً + CSV).',
        'إصلاح عداد النوم المباشر على شاشة القفل لهواتف أندرويد الأقدم (مثل Redmi Note 11 / MIUI).',
      ],
    },
  },
  {
    version: 'v1.1.0',
    highlights: {
      sk: [
        'Aplikácia úspešne prešla testovaním a je oficiálne verejne dostupná!',
        'Meno a dátum narodenia dieťaťa (v úvode aj v Nastaveniach) s prirodzeným skloňovaním textov.',
        'Upozornenie na optimálne bdelé okno podľa veku a 24h cieľ spánku (AASM/WHO).',
        'Zobrazenie prebiehajúceho spánku na zamknutej obrazovke Androidu (tichý časovač).',
        'Vlastné časy denného a nočného spánku, zrolovateľná história spánkov a 3 nové jazyky: španielčina, rumunčina a arabčina.',
      ],
      cs: [
        'Aplikace úspěšně prošla testováním a je oficiálně veřejně dostupná!',
        'Jméno a datum narození děťátka (v úvodu i v Nastavení) s přirozenou personalizací textů.',
        'Upozornění na optimální bdělé okno podle věku a 24h cíl spánku (AASM/WHO).',
        'Zobrazení probíhajícího spánku na zamčené obrazovce Androidu (tichý časovač).',
        'Vlastní časy denního/nočního spánku, sbalitelná historie spánků a 3 nové jazyky: španělština, rumunština a arabština.',
      ],
      en: [
        'The app has passed testing and is now officially publicly available!',
        'Child name & birth date personalization (onboarding and Settings) with natural phrasing.',
        'Age-based optimal wake-window alerts with AASM/WHO 24-hour sleep targets.',
        'Silent ongoing sleep timer displayed directly on the Android lock screen.',
        'Custom day/night sleep hours, collapsible sleep history, and 3 new languages: Spanish, Romanian, and Arabic.',
      ],
      pl: [
        'Aplikacja pomyślnie przeszła testy i jest już oficjalnie dostępna publicznie!',
        'Personalizacja imienia i daty urodzenia dziecka (na starcie i w Ustawieniach).',
        'Alert optymalnego okna czuwania według wieku z celem 24h (AASM/WHO).',
        'Cichy stoper trwającego snu na ekranie blokady Androida.',
        'Własne godziny snu dziennego/nocnego, zwijana historia snu oraz 3 nowe języki: hiszpański, rumuński i arabski.',
      ],
      hu: [
        'Az alkalmazás sikeresen teljesítette a tesztelést és hivatalosan nyilvánosan elérhető!',
        'Kisbaba nevének és születési dátumának megadása (első indításkor és a Beállításokban).',
        'Életkor szerinti optimális ébrenléti ablak jelzés 24 órás AASM/WHO céllal.',
        'Folyamatban lévő alvás csendes megjelenítése az Android zárolt képernyőjén.',
        'Egyéni nappali/éjszakai alvásidő, összecsukható alváselőzmények és 3 új nyelv: spanyol, román és arab.',
      ],
      uk: [
        'Додаток успішно пройшов тестування і тепер офіційно у відкритому доступі!',
        'Персоналізація імені та дати народження дитини (при запуску та в Налаштуваннях).',
        'Підказка оптимального вікна неспання за віком і добова норма сну (AASM/WHO).',
        'Тихе відображення активного сну на екрані блокування Android.',
        'Власні години денного/нічного сну, згортання історії снів і 3 нові мови: іспанська, румунська та арабська.',
      ],
      it: [
        'L’app ha superato i test ed è ora ufficialmente disponibile al pubblico!',
        'Personalizzazione con nome e data di nascita del bambino (avvio e Impostazioni).',
        'Avvisi finestra di veglia ottimale per età con obiettivo 24h (AASM/WHO).',
        'Timer silenzioso del sonno in corso sulla schermata di blocco Android.',
        'Orari giorno/notte personalizzabili, cronologia comprimibile e 3 nuove lingue: spagnolo, rumeno e arabo.',
      ],
      es: [
        '¡La aplicación ha superado las pruebas y ya está disponible públicamente!',
        'Personalización con nombre y fecha de nacimiento del bebé (inicio y Ajustes).',
        'Avisos de ventana de vigilia óptima según la edad y objetivo de 24 h (AASM/WHO).',
        'Cronómetro de sueño en curso en la pantalla de bloqueo de Android (en silencio).',
        'Horario personalizado día/noche, historial plegable y 3 nuevos idiomas: español, rumano y árabe.',
      ],
      ro: [
        'Aplicația a trecut testarea și este acum oficial disponibilă public!',
        'Personalizare cu numele și data nașterii copilului (la pornire și în Setări).',
        'Alerte pentru fereastra optimă de veghe după vârstă și țintă 24h (AASM/WHO).',
        'Afișare silențioasă a somnului activ pe ecranul de blocare Android.',
        'Ore personalizate zi/noapte, istoric pliabil și 3 limbi noi: spaniolă, română și arabă.',
      ],
      ar: [
        'اجتاز التطبيق مرحلة الاختبار وأصبح متاحاً للجميع رسمياً!',
        'تخصيص اسم الطفل وتاريخ ميلاده (عند التشغيل الأول وفي الإعدادات).',
        'تنبيه نافذة اليقظة المثالية حسب العمر مع هدف النوم اليومي (AASM/WHO).',
        'عرض مؤقت النوم الجاري بصمت على شاشة القفل في أندرويد.',
        'تخصيص أوقات النوم النهاري والليلي، سجل نوم قابل للطي، و3 لغات جديدة: الإسبانية، الرومانية والعربية.',
      ],
    },
  },
  {
    version: 'v1.0.2',
    highlights: {
      sk: [
        'Nové farebné režimy v nastaveniach: Farebný, plynulý Lite (pre staršie telefóny) a Čiernobiely (odtiene sivej) s jemným prechodom šetrným pre oči.',
        'Úprava uložených spánkov v histórii (dátum, čas od/do, typ, kvalita a poznámky) aj úprava presného času zaspatia počas prebiehajúceho spánku.',
        'Živý časovač spánku z režimu 4 zobrazený priamo v hornej hlavičke medzi batériou a detským zámkom.',
        'Automatické zalamovanie textu tlačidla Hlavné menu do dvoch riadkov na užších obrazovkách vo všetkých 7 jazykoch.',
        'Vylepšený Denný / Nočný režim s logickým znížením jasu a priehľadnosti v noci, čistejšie nastavenia a vlajočky pri výbere jazyka.',
        'Android: pridaná podpora ikony aplikácie a vynútený Immersive Sticky režim pre skrytie systémových líšt aj na starších zariadeniach.',
      ],
      cs: [
        'Nové barevné režimy v nastavení: Barevný, plynulý Lite (pro starší telefony) a Černobílý (odstíny šedi) s jemným přechodem.',
        'Úprava uložených spánků v historii i úprava přesného času usnutí během probíhajícího spánku.',
        'Živý časovač spánku z režimu 4 v horní liště mezi baterií a dětským zámkem.',
        'Automatické zalamování textu tlačítka Hlavní menu na užších obrazovkách ve všech 7 jazycích.',
        'Vylepšený Denní / Noční režim se snížením jasu i průhlednosti a vynucený Immersive Sticky režim na Androidu.',
      ],
      en: [
        'New Color Modes in Settings: Full Color, high-performance Lite (smooth on older phones), and Black & White (grayscale) with a gentle eye-safe transition.',
        'Edit saved sleep records in Sleep History and adjust exact falling-asleep time during an ongoing sleep session.',
        'Live Mode 4 sleep duration timer displayed directly in the top header between Battery and Child Lock.',
        'Automatic multi-line wrapping for the Main Menu header button across all 7 languages on narrow screens.',
        'Upgraded Day / Night mode adjusting both brightness & opacity, cleaner Settings, language flags, Android app icon & Immersive Sticky fullscreen.',
      ],
      pl: [
        'Nowe tryby kolorów: Kolorowy, płynny Lite (dla starszych telefonów) oraz Czarno-biały (odcienie szarości) z delikatnym przejściem.',
        'Edycja zapisanych wpisów snu w historii oraz korekta dokładnej godziny zaśnięcia w trakcie trwającego snu.',
        'Stoper czasu trwania snu z trybu 4 w górnym pasku między baterią a blokadą dziecięcą.',
        'Automatyczne zawijanie tekstu przycisku Menu główne na węższych ekranach oraz tryb Immersive Sticky na Androidzie.',
      ],
      hu: [
        'Új színmódok a beállításokban: Színes, gyors Lite (régebbi telefonokra) és Fekete-fehér szürkeárnyalat kíméletes átmenettel.',
        'Mentett alvások szerkesztése az előzményekben és pontos elalvási idő módosítása folyamatban lévő alvásnál.',
        'Élő alvásidő-mérő a felső fejlécben az akkumulátor és a gyerekzár között.',
        'Többsoros főmenü gomb keskeny kijelzőkön, finomhangolt éjszakai fényerő/átlátszóság és Android Immersive Sticky teljes képernyő.',
      ],
      uk: [
        'Нові колірні режими: Кольоровий, швидкий Lite (для старіших телефонів) та Чорно-білий (відтінки сірого) з плавним переходом.',
        'Редагування збережених записів сну в історії та точного часу засинання під час активного сну.',
        'Таймер тривалості сну з режиму 4 у верхній панелі між батареєю та дитячим замком.',
        'Перенесення тексту кнопки Головне меню на вузьких екранах та примусовий Immersive Sticky режим для Android.',
      ],
      it: [
        'Nuove modalità colore: A colori, Lite ad alte prestazioni (per telefoni meno recenti) e Bianco e nero con transizione delicata.',
        'Modifica delle sessioni di sonno salvate e regolazione dell\'ora esatta di addormentamento durante il sonno in corso.',
        'Timer live del sonno nella barra superiore tra batteria e blocco bimbo.',
        'Testo del pulsante Menu principale adattabile su più righe, modalità Giorno/Notte migliorata e Immersive Sticky su Android.',
      ],
      es: [
        'Nuevos modos de color en Ajustes: Color, Lite fluido (para teléfonos antiguos) y Blanco y negro con transición suave.',
        'Edición de registros de sueño guardados y ajuste de la hora exacta de inicio durante un sueño en curso.',
        'Temporizador de sueño en vivo del modo 4 en la barra superior entre la batería y el bloqueo infantil.',
        'Ajuste automático en dos líneas del botón Menú principal y modo pantalla completa Immersive Sticky en Android.',
      ],
      ro: [
        'Moduri noi de culoare în Setări: Color, Lite rapid (pentru telefoane mai vechi) și Alb-negru cu tranziție blândă.',
        'Editarea sesiunilor de somn salvate și ajustarea orei exacte de adormire în timpul somnului activ.',
        'Cronometru live de somn din modul 4 afișat în bara de sus între baterie și blocarea copil.',
        'Încadrare automată pe două rânduri a butonului Meniu principal și mod Immersive Sticky pe Android.',
      ],
      ar: [
        'أوضاع ألوان جديدة في الإعدادات: ملون، ووضع Lite السريع للهواتف القديمة، وأبيض وأسود بانتقال هادئ مريح للعين.',
        'تعديل جلسات النوم المحفوظة وضبط وقت بداية النوم بدقة أثناء استمرار النوم.',
        'عرض مؤقت النوم المباشر في الشريط العلوي بين البطارية وقفل الطفل.',
        'التفاف تلقائي لنص زر القائمة الرئيسية على الشاشات الضيقة ووضع ملء الشاشة Immersive Sticky على أندرويد.',
      ],
    },
  },
  {
    version: 'v1.0.1',
    highlights: {
      sk: [
        'Oprava obrazovky výberu jazyka: nové kompaktné rozloženie bez nutnosti scrollovania.',
        'Potvrdzovacie tlačidlo umiestnené bezpečne nad systémovými tlačidlami Androidu (s ochranou safe-area insets).',
      ],
      cs: [
        'Oprava obrazovky výběru jazyka: kompaktní rozložení bez nutnosti scrollování.',
        'Potvrzovací tlačítko umístěno bezpečně nad systémovými tlačítky Androidu.',
      ],
      en: [
        'Language onboarding screen fix: compact responsive layout fitting comfortably without scrolling.',
        'Continue button safely elevated above Android 3-button system navigation bars (with safe-area insets).',
      ],
      pl: [
        'Poprawa ekranu wyboru języka: kompaktowy układ bez konieczności przewijania.',
        'Przycisk potwierdzenia umieszczony bezpiecznie nad przyciskami systemowymi Androida.',
      ],
      hu: [
        'Nyelvválasztó képernyő javítása: kompakt elrendezés görgetés nélkül.',
        'A megerősítő gomb biztonságosan az Android rendszergombok felett helyezkedik el.',
      ],
      uk: [
        'Виправлення екрана вибору мови: компактний вигляд без необхідності скролити.',
        'Кнопка підтвердження розташована безпечно над системними кнопками Android.',
      ],
      it: [
        'Correzione schermata di selezione della lingua: layout compatto senza scorrimento.',
        'Pulsante di conferma posizionato in modo sicuro sopra i tasti di sistema Android.',
      ],
      es: [
        'Corrección de la pantalla de selección de idioma: diseño compacto sin desplazamiento.',
        'Botón de continuar situado de forma segura por encima de los botones del sistema Android.',
      ],
      ro: [
        'Corectarea ecranului de alegere a limbii: aranjament compact fără derulare.',
        'Butonul de confirmare poziționat în siguranță deasupra barei de navigare Android.',
      ],
      ar: [
        'تحسين شاشة اختيار اللغة بتصميم مدمج دون الحاجة للتمرير.',
        'وضع زر المتابعة بأمان فوق أزرار التنقل في نظام أندرويد.',
      ],
    },
  },
  {
    version: 'v1.0',
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
      es: [
        '¡Versión estable oficial v1.0!',
        'Pie de página más compacto y cabecera superior optimizada para móviles.',
        'Ventana interactiva del historial de versiones y ventana de contacto del autor (msglitchapps@gmail.com).',
      ],
      ro: [
        'Versiunea oficială stabilă v1.0!',
        'Subsol și antet optimizate pentru ecrane mobile.',
        'Fereastră interactivă cu istoricul versiunilor și date de contact ale autorului (msglitchapps@gmail.com).',
      ],
      ar: [
        'الإصدار المستقر الرسمي v1.0!',
        'تصميم مدمج للشريط العلوي والسفلي يناسب شاشات الهواتف.',
        'نافذة تفاعلية لسجل الإصدارات ومعلومات التواصل مع المطوّر (msglitchapps@gmail.com).',
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
      es: [
        'Transiciones de color fluidas y suaves en el modo luz relajante.',
        'Alineación mejorada de la rueda de colores y espectro circadiano.',
      ],
      ro: [
        'Tranziții fluide de culoare în modul lumină calmă.',
        'Aliniere îmbunătățită pentru roata de culori și spectrul circadian.',
      ],
      ar: [
        'انتقالات لونية سلسة وناعمة في وضع الإضاءة الهادئة.',
        'تحسين محاذاة عجلة الألوان والطيف اليوماوي.',
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
      es: ['Deslizadores más compactos y paleta personalizada de 2 a 6 colores.'],
      ro: ['Glisoare mai compacte și paletă personalizată de la 2 la 6 culori.'],
      ar: ['أشرطة تمرير أكثر تناسقاً ولوحة ألوان مخصصة من 2 إلى 6 ألوان.'],
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
      es: ['Calendario interactivo y control de opacidad.'],
      ro: ['Calendar interactiv și control de opacitate.'],
      ar: ['تقويم تفاعلي وشريط تحكم في الشفافية.'],
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
      es: ['Mejoras en el temporizador, historial de sueño y estadísticas.'],
      ro: ['Îmbunătățiri ale cronometrului, istoricului de somn și statisticilor.'],
      ar: ['تحسينات في المؤقت وسجل النوم والإحصاءات.'],
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
                {t.changelogModal.currentVersionLabel} v1.1.1
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
                      {t.changelogModal.latestBadge}
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
