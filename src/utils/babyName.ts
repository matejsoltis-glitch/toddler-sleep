import { Language } from '../types';

export const BABY_NAME_STORAGE_KEY = 'toddler_baby_name';

export function normalizeBabyName(name?: string | null): string {
  if (!name) return '';
  return name.trim().replace(/\s+/g, ' ').slice(0, 24);
}

export interface PersonalizedCopy {
  touchLockSubtitle: string;
  fadeDesc: string;
  settingsSubtitle: string;
  sunsetDetailDesc: string;
  whiteNoiseLevelsTip: string;
  whiteNoiseVolumeTip: string;
  whiteNoiseGentleDesc: string;
  natureVolumeTip: string;
  natureForestDesc: string;
  natureOceanDesc: string;
  natureHeartbeatDesc: string;
  sleepBoundsModalDesc: string;
}

/**
 * Hand-crafted, grammatically natural and gender-neutral copy for every personalized
 * text slot across all 10 languages. Avoids broken declensions and stray possessives
 * (e.g. never produces "vaše Simon" or "Simontku").
 */
export function getPersonalizedCopy(
  babyName: string | null | undefined,
  language: Language
): PersonalizedCopy | null {
  const name = normalizeBabyName(babyName);
  if (!name) return null;

  switch (language) {
    case 'sk':
      return {
        touchLockSubtitle: `Dotyky sú zablokované, aby náhodné stlačenie nerušilo pokoj, kým ${name} spí.`,
        fadeDesc: `Zvuk sa v záverečných minútach plynulo a nečujne stíši do nuly, aby náhle ticho nerušilo pokoj, keď ${name} zaspáva.`,
        settingsSubtitle: `Jazyk, nočný režim a pokojný spánok – ${name}`,
        sunsetDetailDesc: `Nočný režim automaticky zníži jas (25 %) a stlmí priehľadnosť prvkov (35 %), aby svetlo v izbe nerušilo, keď ${name} spí. Denný režim vráti plný jas (85 %) a 100 % kontrast.`,
        whiteNoiseLevelsTip: `Vyberte to, čo má ${name} najradšej`,
        whiteNoiseVolumeTip: `Tip: Odporúčaná hlasitosť pre pokojný spánok (${name}) je okolo 50–60 dB (jemné šumenie v pozadí).`,
        whiteNoiseGentleDesc: `Zamatovo hebký, jemný šum so stiahnutými vysokými tónmi. Šetrný k citlivým uškám, keď ${name} spí.`,
        natureVolumeTip: `Zvuky prírody sa generujú plynule bez prerušenia alebo skokov v slučke.`,
        natureForestDesc: `Mäkký šum vetra v korunách ihličnanov a lístia, ktorý prirodzene upokojuje dych, keď ${name} zaspáva.`,
        natureOceanDesc: `Pravidelný 8-sekundový cyklus morského prílivu imitujúci pomalý dych a pokojný tep srdca.`,
        natureHeartbeatDesc: `Autentický, tlmený tlkot matkinho srdca počúvaný z vnútra plodovej vody. Upokojujúci primárny zvuk prinášajúci pocit bezpečia, keď ${name} odpočíva.`,
        sleepBoundsModalDesc: `Nastavte, od ktorej hodiny máva ${name} bežne denný a od ktorej nočný spánok. Nočný spánok začatý pred polnocou sa automaticky správne priradí do dnešného prehľadu.`,
      };
    case 'cs':
      return {
        touchLockSubtitle: `Dotyky jsou uzamčeny, aby náhodný stisk nerušil klid, zatímco ${name} spí.`,
        fadeDesc: `Zvuk se v závěrečných minutách plynule a neslyšně ztiší do nuly, aby náhlé ticho nerušilo klid, když ${name} usíná.`,
        settingsSubtitle: `Jazyk, noční režim a klidný spánek – ${name}`,
        sunsetDetailDesc: `Noční režim automaticky sníží jas (25 %) a ztlumí průhlednost prvků (35 %), aby světlo v pokoji nerušilo, když ${name} spí. Denní režim vrátí plný jas (85 %) a 100 % kontrast.`,
        whiteNoiseLevelsTip: `Vyberte to, co má ${name} nejraději`,
        whiteNoiseVolumeTip: `Tip: Doporučená hlasitost pro klidný spánek (${name}) je kolem 50–60 dB (jemné šumění v pozadí).`,
        whiteNoiseGentleDesc: `Sametově hebký, jemný šum se staženými vysokými tóny. Šetrný k citlivým ouškům, když ${name} spí.`,
        natureVolumeTip: `Zvuky přírody se generují plynule bez přerušení nebo skoků ve smyčce.`,
        natureForestDesc: `Měkký šum větru v korunách jehličnanů a listí, který přirozeně zpomaluje dech, když ${name} usíná.`,
        natureOceanDesc: `Pravidelný 8sekundový cyklus mořského přílivu imitující pomalý dech a klidný tep srdce.`,
        natureHeartbeatDesc: `Autentický, tlumený tlukot matčina srdce z nitra plodové vody. Uklidňující primární zvuk přinášející pocit bezpečí, když ${name} odpočívá.`,
        sleepBoundsModalDesc: `Nastavte, od které hodiny mívá ${name} obvykle denní a od které noční spánek. Noční spánek započatý před půlnocí se správně započítá do dnešního přehledu.`,
      };
    case 'en':
      return {
        touchLockSubtitle: `Touches are blocked so accidental taps won't disturb ${name}'s sleep.`,
        fadeDesc: `Sound softly fades to silence over the final minutes so sudden quiet won't wake ${name}.`,
        settingsSubtitle: `Language, night mode, and eye safety for ${name}`,
        sunsetDetailDesc: `Night mode automatically dims brightness (25%) and softens opacity (35%) so screen light won't dazzle ${name}. Day mode restores full brightness (85%) and 100% contrast.`,
        whiteNoiseLevelsTip: `Choose what keeps ${name} most comfortable`,
        whiteNoiseVolumeTip: `Tip: Recommended volume for ${name}'s sleep is around 50–60 dB (soft background hush).`,
        whiteNoiseGentleDesc: `Velvety soft noise with muted highs. Gentle on ${name}'s sensitive ears.`,
        natureVolumeTip: `Nature sounds are generated seamlessly with zero loops or abrupt transitions.`,
        natureForestDesc: `Soft wind through pine needles and leaves, naturally slowing ${name}'s breathing.`,
        natureOceanDesc: `Regular 8-second sea tide cycle mimicking slow breathing and a calm heartbeat.`,
        natureHeartbeatDesc: `Authentic muffled maternal heartbeat from the womb. A primary soothing sound giving ${name} a sense of safety.`,
        sleepBoundsModalDesc: `Set when ${name} typically has daytime naps vs. nighttime sleep. Overnight sleep starting before midnight is accurately counted in today’s summary.`,
      };
    case 'pl':
      return {
        touchLockSubtitle: `Dotyk jest zablokowany, aby przypadkowe dotknięcie nie zakłócało spokoju, gdy ${name} śpi.`,
        fadeDesc: `Dźwięk łagodnie i niesłyszalnie wycisza się do zera, aby nagła cisza nie przeszkadzała, gdy ${name} zasypia.`,
        settingsSubtitle: `Język, tryb nocny i spokojny sen – ${name}`,
        sunsetDetailDesc: `Tryb nocny automatycznie zmniejsza jasność (25%) i przezroczystość (35%), aby światło ekranu nie raziło, gdy ${name} śpi.`,
        whiteNoiseLevelsTip: `Wybierz dźwięk najlepszy, gdy ${name} śpi`,
        whiteNoiseVolumeTip: `Wskazówka: Zalecana głośność dla spokojnego snu (${name}) to ok. 50–60 dB (delikatny szum w tle).`,
        whiteNoiseGentleDesc: `Aksamitnie miękki szum z wyciszonymi wysokimi tonami. Delikatny dla wrażliwych uszek, gdy ${name} śpi.`,
        natureVolumeTip: `Dźwięki natury są generowane płynnie, bez przerw i przeskoków pętli.`,
        natureForestDesc: `Łagodny szum wiatru w koronach drzew, który naturalnie uspokaja oddech, gdy ${name} zasypia.`,
        natureOceanDesc: `Regularny 8-sekundowy cykl fal morskich naśladujący powolny oddech i spokojne bicie serca.`,
        natureHeartbeatDesc: `Autentyczne, stłumione bicie serca mamy z okresu ciąży. Kojący dźwięk dający poczucie bezpieczeństwa, gdy ${name} odpoczywa.`,
        sleepBoundsModalDesc: `Ustaw, od której godziny ${name} zazwyczaj ma drzemki dzienne, a od której sen nocny. Sen nocny rozpoczęty przed północą zostanie poprawnie wliczony do dzisiejszych statystyk.`,
      };
    case 'hu':
      return {
        touchLockSubtitle: `Az érintések le vannak tiltva, hogy véletlen érintés ne zavarja a nyugalmat, amíg ${name} alszik.`,
        fadeDesc: `A hang az utolsó percekben észrevétlenül halkul el nullára, hogy a hirtelen csend ne zavarja a pihenést, amikor ${name} elalszik.`,
        settingsSubtitle: `Nyelv, éjszakai mód és nyugodt alvás – ${name}`,
        sunsetDetailDesc: `Az éjszakai mód automatikusan 25%-ra csökkenti a fényerőt és 35%-ra az átlátszóságot, hogy a fény ne zavarja a szobát, amíg ${name} alszik.`,
        whiteNoiseLevelsTip: `Válaszd ki, ami a legjobb, amikor ${name} pihen`,
        whiteNoiseVolumeTip: `Tipp: Az ajánlott hangerő (${name} nyugodt alvásához) kb. 50–60 dB (lágy háttérzaj).`,
        whiteNoiseGentleDesc: `Bársonyosan finom zaj tompított magas hangokkal. Kíméletes a fülnek, miközben ${name} alszik.`,
        natureVolumeTip: `A természet hangjai folyamatosan, megszakítás és ugrás nélkül szólnak.`,
        natureForestDesc: `Lágy szél a fák koronájában, amely természetes módon nyugtatja a légzést, miközben ${name} elalszik.`,
        natureOceanDesc: `Szabályos, 8 másodperces tengeri hullámzás, amely lassú légzést és nyugodt szívverést idéz.`,
        natureHeartbeatDesc: `Valódi, tompított anyai szívhang az anyaméhből. Megnyugtató hang, amely biztonságot ad, amikor ${name} pihen.`,
        sleepBoundsModalDesc: `Állítsd be, hány órától számít nappali, illetve éjszakai alvásnak, amikor ${name} pihen. Az éjfél előtt megkezdett éjszakai alvás így pontosan a mai összesítésbe kerül.`,
      };
    case 'uk':
      return {
        touchLockSubtitle: `Дотики заблоковано, щоб випадкове натискання не порушувало спокій, поки ${name} спить.`,
        fadeDesc: `Звук плавно та непомітно затихає до нуля в останні хвилини, щоб раптова тиша не заважала, коли ${name} засинає.`,
        settingsSubtitle: `Мова, нічний режим та спокійний сон – ${name}`,
        sunsetDetailDesc: `Нічний режим автоматично знижує яскравість (25%) та прозорість (35%), щоб світло в кімнаті не заважало, коли ${name} спить.`,
        whiteNoiseLevelsTip: `Оберіть те, що найкраще підходить, коли ${name} спить`,
        whiteNoiseVolumeTip: `Порада: Рекомендована гучність для спокійного сну (${name}) становить близько 50–60 дБ (м’який фоновий шум).`,
        whiteNoiseGentleDesc: `Оксамитовий, м’який шум із приглушеними високими тонами. Дбайливий до чутливих вушок, коли ${name} спить.`,
        natureVolumeTip: `Звуки природи генеруються безперервно, без пауз і різких переходів.`,
        natureForestDesc: `М’який шум вітру в кронах дерев, що природно заспокоює дихання, коли ${name} засинає.`,
        natureOceanDesc: `Рівномірний 8-секундний цикл морського припливу, що нагадує спокійне дихання та серцебиття.`,
        natureHeartbeatDesc: `Автентичне приглушене серцебиття мами. Заспокійливий звук, що дарує відчуття безпеки, коли ${name} відпочиває.`,
        sleepBoundsModalDesc: `Вкажіть, з якої години ${name} зазвичай має денний, а з якої — нічний сон. Нічний сон, що почався до опівночі, коректно врахується в сьогоднішній статистиці.`,
      };
    case 'it':
      return {
        touchLockSubtitle: `I tocchi sono disabilitati per evitare tocchi accidentali mentre ${name} dorme.`,
        fadeDesc: `Il volume cala dolcemente negli ultimi minuti per evitare che il silenzio improvviso svegli ${name}.`,
        settingsSubtitle: `Lingua, modalità notte e protezione occhi per ${name}`,
        sunsetDetailDesc: `La modalità notte riduce automaticamente luminosità (25%) e trasparenza (35%) per non abbagliare ${name}.`,
        whiteNoiseLevelsTip: `Scegli in base al comfort di ${name}`,
        whiteNoiseVolumeTip: `Consiglio: il volume consigliato per il sonno di ${name} è di circa 50–60 dB (dolce sottofondo).`,
        whiteNoiseGentleDesc: `Rumore vellutato con alti attenuati. Delicato sulle orecchie sensibili di ${name}.`,
        natureVolumeTip: `I suoni della natura sono generati in modo continuo, senza interruzioni o salti.`,
        natureForestDesc: `Soffio morbido del vento tra gli alberi che calma naturalmente il respiro di ${name}.`,
        natureOceanDesc: `Ciclo regolare di 8 secondi delle onde del mare che accompagna il respiro calmo di ${name}.`,
        natureHeartbeatDesc: `Autentico battito materno ovattato. Un suono rassicurante che dona calma a ${name}.`,
        sleepBoundsModalDesc: `Imposta da che ora ${name} fa abitualmente i riposini diurni e da che ora inizia il sonno notturno. Il sonno iniziato prima di mezzanotte verrà conteggiato correttamente oggi.`,
      };
    case 'es':
      return {
        touchLockSubtitle: `Los toques están bloqueados para evitar despertar a ${name} por accidente.`,
        fadeDesc: `Reduce suavemente el volumen antes de detenerse para no despertar a ${name}.`,
        settingsSubtitle: `Idioma, modo noche y cuidado visual de ${name}`,
        sunsetDetailDesc: `El modo noche reduce automáticamente el brillo (25 %) y la opacidad (35 %) para no deslumbrar a ${name}. El modo día devuelve el brillo (85 %) y el contraste al 100 %.`,
        whiteNoiseLevelsTip: `Elige según la comodidad de ${name}`,
        whiteNoiseVolumeTip: `Consejo: el volumen recomendado para el sueño de ${name} es de 50–60 dB (suave murmullo de fondo).`,
        whiteNoiseGentleDesc: `Ruido sedoso sin agudos molestos. Delicado para los oídos de ${name}.`,
        natureVolumeTip: `Consejo: los ritmos naturales suaves ayudan a relajar el sistema nervioso de ${name}.`,
        natureForestDesc: `Susurro suave del viento entre los árboles que calma de forma natural la respiración de ${name}.`,
        natureOceanDesc: `Olas rítmicas que acompañan suavemente la respiración de ${name}.`,
        natureHeartbeatDesc: `Latido profundo y regular que ofrece calma inmediata a ${name}.`,
        sleepBoundsModalDesc: `Configura a qué hora suele hacer siestas diurnas y a qué hora empieza el sueño nocturno de ${name}. El sueño nocturno iniciado antes de medianoche se contará correctamente en el resumen de hoy.`,
      };
    case 'ro':
      return {
        touchLockSubtitle: `Atingerile sunt blocate pentru a nu tulbura liniștea cât timp ${name} doarme.`,
        fadeDesc: `Scade treptat volumul înainte de oprire pentru a nu tulbura somnul când ${name} adoarme.`,
        settingsSubtitle: `Limbă, mod noapte și somn liniștit – ${name}`,
        sunsetDetailDesc: `Modul de noapte reduce automat luminozitatea (25%) și opacitatea elementelor (35%) pentru a nu deranja cât timp ${name} doarme. Modul de zi readuce luminozitatea (85%) și contrastul la 100%.`,
        whiteNoiseLevelsTip: `Alege ce îi oferă confort când ${name} doarme`,
        whiteNoiseVolumeTip: `Sfat: volumul recomandat pentru somnul liniștit (${name}) este 50–60 dB (fundal blând).`,
        whiteNoiseGentleDesc: `Zgomot catifelat fără frecvențe înalte stridente. Delicat pentru urechiușe cât timp ${name} doarme.`,
        natureVolumeTip: `Sfat: ritmurile naturale lente liniștesc somnul când ${name} se odihnește.`,
        natureForestDesc: `Foșnet blând de frunze care calmează natural respirația când ${name} adoarme.`,
        natureOceanDesc: `Valuri ritmice care acompaniază natural respirația când ${name} doarme.`,
        natureHeartbeatDesc: `Puls blând și regulat care oferă liniște imediată când ${name} se odihnește.`,
        sleepBoundsModalDesc: `Stabilește de la ce oră doarme de obicei ${name} ziua și de la ce oră începe somnul de noapte. Somnul de noapte început înainte de miezul nopții va fi inclus corect în rezumatul de azi.`,
      };
    case 'ar':
      return {
        touchLockSubtitle: `تم تعطيل اللمس لمنع اللمسات غير المقصودة من إيقاظ ${name}.`,
        fadeDesc: `يخفض الصوت تدريجياً قبل التوقف حتى لا يستيقظ ${name}.`,
        settingsSubtitle: `اللغة، الوضع الليلي وحماية عيني ${name}`,
        sunsetDetailDesc: `يخفض الوضع الليلي السطوع تلقائياً (25%) والشفافية (35%) حتى لا يزعج الضوء ${name}. ويعيد الوضع النهاري السطوع الكامل (85%) والتباين 100%.`,
        whiteNoiseLevelsTip: `اختر ما يريح ${name}`,
        whiteNoiseVolumeTip: `نصيحة: المستوى الموصى به لنوم ${name} هو 50–60 ديسيبل (خلفية صوتية لطيفة).`,
        whiteNoiseGentleDesc: `صوت ناعم حريري خالٍ من الترددات الحادة ومريح لأذني ${name}.`,
        natureVolumeTip: `نصيحة: إيقاعات الطبيعة الهادئة تساعد على تهدئة الجهاز العصبي لدى ${name}.`,
        natureForestDesc: `حفيف ناعم للأوراق يهدئ تنفس ${name} بشكل طبيعي.`,
        natureOceanDesc: `أمواج متناغمة تتماشى برفق مع تنفس ${name} أثناء النوم.`,
        natureHeartbeatDesc: `نبض منتظم ودافئ يمنح ${name} طمأنينة فورية.`,
        sleepBoundsModalDesc: `حدّد متى يبدأ عادةً نوم النهار ومتى يبدأ نوم الليل لدى ${name}. سيُحتسب نوم الليل الذي بدأ قبل منتصف الليل بدقة ضمن إحصاءات اليوم.`,
      };
  }
}

/**
 * Safe fallback helper for any ad-hoc text replacement (uses whole-word Unicode boundaries
 * and strips full possessive phrases so broken fragments like "vaše Simon" or "Simontku" never occur).
 */
export function personalizeBabyText(
  text: string,
  babyName?: string | null,
  language?: Language
): string {
  const name = normalizeBabyName(babyName);
  if (!name || !text) return text;

  switch (language) {
    case 'sk':
      return text.replace(
        /(?<![\p{L}])(?:(?:vaše|vášho|vášmu|tvoje|svoje)\s+)?(?:bábätko|dieťatko|dieťatku|bábätka|dieťatka|dieťaťa|dieťaťu|dieťa)(?![\p{L}])/giu,
        name
      );
    case 'cs':
      return text.replace(
        /(?<![\p{L}])(?:(?:vaše|vašeho|vašemu|tvé|své)\s+)?(?:miminko|děťátko|děťátku|miminka|děťátka|dítěti|dítěte|dítě)(?![\p{L}])/giu,
        name
      );
    case 'en':
      return text
        .replace(/\b(?:your|the)\s+(?:baby|toddler)['’]s\b/gi, `${name}'s`)
        .replace(/\b(?:baby|toddler)['’]s\b/gi, `${name}'s`)
        .replace(/\b(?:your|the)\s+(?:baby|toddler)\b/gi, name)
        .replace(/\b(?:baby|toddler)\b/gi, name);
    case 'pl':
      return text.replace(
        /(?<![\p{L}])(?:(?:Twojego|Twoje|Twojemu)\s+)?(?:maluszka|maluszek|niemowlaka|dziecka|dziecku|dziecko)(?![\p{L}])/giu,
        name
      );
    case 'hu':
      return text.replace(
        /(?<![\p{L}])(?:a\s+)?(?:kisbabád|kisbabát|kisbaba|babát|babának|baba)(?![\p{L}])/giu,
        name
      );
    case 'uk':
      return text.replace(
        /(?<![\p{L}])(?:(?:вашого|вашої|ваше|вашу)\s+)?(?:малюка|малюк|немовляти|немовля|дитині|дитини|дитина)(?![\p{L}])/giu,
        name
      );
    case 'it':
      return text
        .replace(/\bdel\s+(?:tuo\s+)?bambino\b/gi, `di ${name}`)
        .replace(/\bal\s+(?:tuo\s+)?bambino\b/gi, `a ${name}`)
        .replace(/\bil\s+(?:tuo\s+)?(?:bambino|neonato|piccolo)\b/gi, name)
        .replace(/\bbambino\b/gi, name);
    case 'es':
      return text
        .replace(/\bde\s+tu\s+bebé\b/gi, `de ${name}`)
        .replace(/\ba\s+tu\s+bebé\b/gi, `a ${name}`)
        .replace(/\bdel\s+bebé\b/gi, `de ${name}`)
        .replace(/\bal\s+bebé\b/gi, `a ${name}`)
        .replace(/\b(?:tu|el)\s+bebé\b/gi, name)
        .replace(/\bbebé\b/gi, name);
    case 'ro':
      return text
        .replace(/\b(?:bebelușul|copilul)\s+tău\b/gi, name)
        .replace(/\b(?:bebelușului|copilului)\b/gi, `lui ${name}`)
        .replace(/\b(?:bebelușul|copilul|bebeluș)\b/gi, name);
    case 'ar':
      return text.replace(/(?:طفلك|الطفل|الرضيع)/g, name);
    default:
      return text;
  }
}

export interface PersonalizedSchedulePhrases {
  babySleeping: string;
  babyAwake: string;
  fellAsleepAt: string;
  babyWokeUpBtn: string;
  babyFellAsleepBtn: string;
  heroSubtitle: string;
  howWasSleep: string;
  noHistory: string;
}

/**
 * Produces natural, gender-neutral Mode 4 phrases using the child's name across all 10 languages.
 */
export function getPersonalizedSchedulePhrases(
  babyName: string,
  language: Language
): PersonalizedSchedulePhrases | null {
  const name = normalizeBabyName(babyName);
  if (!name) return null;

  switch (language) {
    case 'sk':
      return {
        babySleeping: `${name} spí`,
        babyAwake: `${name} bdie`,
        fellAsleepAt: 'Začiatok spánku o',
        babyWokeUpBtn: `${name} je hore`,
        babyFellAsleepBtn: `${name} práve zaspáva`,
        heroSubtitle: `Spustite stopky hneď, ako ${name} zaspí.`,
        howWasSleep: `Aký bol spánok – ${name}?`,
        noHistory: `Zatiaľ nemáte zaznamenaný žiadny spánok (${name}). Ťuknite vyššie na „${name} práve zaspáva“.`,
      };
    case 'cs':
      return {
        babySleeping: `${name} spí`,
        babyAwake: `${name} bdí`,
        fellAsleepAt: 'Začátek spánku v',
        babyWokeUpBtn: `${name} je vzhůru`,
        babyFellAsleepBtn: `${name} právě usíná`,
        heroSubtitle: `Spusťte stopky hned, jakmile ${name} usne.`,
        howWasSleep: `Jaký byl spánek – ${name}?`,
        noHistory: `Zatím nemáte zaznamenaný žádný spánek (${name}). Klepněte výše na „${name} právě usíná“.`,
      };
    case 'en':
      return {
        babySleeping: `${name} is sleeping`,
        babyAwake: `${name} is awake`,
        fellAsleepAt: 'Asleep since',
        babyWokeUpBtn: `${name} woke up`,
        babyFellAsleepBtn: `${name} just fell asleep`,
        heroSubtitle: `Start the sleep timer as soon as you put ${name} down.`,
        howWasSleep: `How did ${name} sleep?`,
        noHistory: `No sleep sessions logged for ${name} yet. Tap "${name} just fell asleep" above.`,
      };
    case 'pl':
      return {
        babySleeping: `${name} śpi`,
        babyAwake: `${name} nie śpi`,
        fellAsleepAt: 'Sen rozpoczęty o',
        babyWokeUpBtn: `${name} już nie śpi`,
        babyFellAsleepBtn: `${name} właśnie zasypia`,
        heroSubtitle: `Uruchom stoper snu, gdy tylko ${name} zaśnie.`,
        howWasSleep: `Jak przebiegł sen (${name})?`,
        noHistory: `Brak zapisanych drzemek dla ${name}. Kliknij wyżej „${name} właśnie zasypia”.`,
      };
    case 'hu':
      return {
        babySleeping: `${name} alszik`,
        babyAwake: `${name} ébren van`,
        fellAsleepAt: 'Alvás kezdete:',
        babyWokeUpBtn: `${name} felébredt`,
        babyFellAsleepBtn: `${name} most aludt el`,
        heroSubtitle: `Indítsd el a stoppert, amint ${name} elalszik.`,
        howWasSleep: `Hogyan aludt ${name}?`,
        noHistory: `Még nincs mentett alvás (${name}). Koppints feljebb a „${name} most aludt el” gombra.`,
      };
    case 'uk':
      return {
        babySleeping: `${name} спить`,
        babyAwake: `${name} не спить`,
        fellAsleepAt: 'Початок сну о',
        babyWokeUpBtn: `${name} вже не спить`,
        babyFellAsleepBtn: `${name} щойно засинає`,
        heroSubtitle: `Запустіть таймер сну, щойно ${name} засне.`,
        howWasSleep: `Як пройшов сон (${name})?`,
        noHistory: `Поки немає записів сну для ${name}. Натисніть вище «${name} щойно засинає».`,
      };
    case 'it':
      return {
        babySleeping: `${name} dorme`,
        babyAwake: `${name} è sveglio/a`,
        fellAsleepAt: 'Inizio sonno alle',
        babyWokeUpBtn: `${name} si è svegliato/a`,
        babyFellAsleepBtn: `${name} si sta addormentando`,
        heroSubtitle: `Avvia il timer del sonno non appena ${name} si addormenta.`,
        howWasSleep: `Come ha dormito ${name}?`,
        noHistory: `Nessun sonno registrato per ${name}. Tocca sopra «${name} si sta addormentando».`,
      };
    case 'es':
      return {
        babySleeping: `${name} duerme`,
        babyAwake: `${name} está despierto/a`,
        fellAsleepAt: 'Inicio del sueño:',
        babyWokeUpBtn: `${name} se despertó`,
        babyFellAsleepBtn: `${name} acaba de dormirse`,
        heroSubtitle: `Inicia el cronómetro de sueño en cuanto ${name} se duerma.`,
        howWasSleep: `¿Cómo durmió ${name}?`,
        noHistory: `Aún no hay registros de sueño para ${name}. Toca arriba en «${name} acaba de dormirse».`,
      };
    case 'ro':
      return {
        babySleeping: `${name} doarme`,
        babyAwake: `${name} este treaz/ă`,
        fellAsleepAt: 'Începutul somnului la',
        babyWokeUpBtn: `${name} s-a trezit`,
        babyFellAsleepBtn: `${name} tocmai a adormit`,
        heroSubtitle: `Pornește cronometrul de somn imediat ce ${name} adoarme.`,
        howWasSleep: `Cum a dormit ${name}?`,
        noHistory: `Nu există încă înregistrări de somn pentru ${name}. Apasă mai sus pe „${name} tocmai a adormit”.`,
      };
    case 'ar':
      return {
        babySleeping: `${name} نائم الآن`,
        babyAwake: `${name} مستيقظ الآن`,
        fellAsleepAt: 'بداية النوم الساعة',
        babyWokeUpBtn: `استيقظ ${name}`,
        babyFellAsleepBtn: `نام ${name} الآن`,
        heroSubtitle: `شغّل مؤقت النوم فور نوم ${name}.`,
        howWasSleep: `كيف كان نوم ${name}؟`,
        noHistory: `لا توجد جلسات نوم مسجلة لـ ${name} بعد. اضغط أعلاه على «نام ${name} الآن».`,
      };
  }
}
