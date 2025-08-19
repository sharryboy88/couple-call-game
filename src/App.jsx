import React, { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

/****************************************************
 * Couple Call Games – Vollversion mit Realtime Sync
 * - Alle Modi (WYR, ToD, Match, Categories, Trivia)
 * - Beep nur am Timer-Ende
 * - Präsenzpunkt (rot/grün)
 * - ✅ Echtzeit-Synchronisierung: mode, round, p1, p2, spice, seconds, MatchMeter
 ****************************************************/

/*********************
 * Supabase Setup
 *********************/
const SUPABASE_URL = "https://qelpirfwoycjfcgvajud.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbHBpcmZ3b3ljamZjZ3ZhanVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNzQ0MDksImV4cCI6MjA3MDg1MDQwOX0.HwqCDMNN5JLgFj_geqhzXdFhocUeU2GrfB_9QK7DlRM";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/*********************
 * Tone: Beep am Ende
 *********************/
function playBeep(duration = 1.0, frequency = 880, volume = 0.5) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = frequency;
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {}
}

/*********************
 * Deterministisches RNG
 *********************/
function hashStringToSeed(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) || 0x9e3779b9;
}
function makeRNG(seedStr) { let x = hashStringToSeed(seedStr); return function rand(){ x ^= x<<13; x ^= x>>>17; x ^= x<<5; return ((x>>>0)/4294967296);};}
function makePicker(seedStr){ const r=makeRNG(seedStr); return (arr)=>{ if(!arr||!arr.length) return ""; return arr[Math.floor(r()*arr.length)]; }}
function randomLetter(rng){ const letters="ABCDEFGHIJKLMNOPQRSTUVWXYZ"; return letters[Math.floor(rng()*letters.length)]; }

/*********************
 * Kartenpools (gekürzt – erweiterbar)
 *********************/
const WYR_CUTE = [
  "Würdest du eher ein gemeinsames Tagebuch schreiben oder ein gemeinsames Fotoalbum füllen?",
  "Würdest du eher eine Playlist erstellen, die uns beide beschreibt, oder einen Song zusammen schreiben?",
  "Würdest du eher in einer fremden Stadt verloren gehen oder in einer bekannten Stadt einen geheimen Ort entdecken?",
  "Würdest du eher eine Woche lang auf dem Balkon zelten oder im Wohnzimmer ein Kissenlager bauen?",
  "Würdest du eher einmal im Monat einen Überraschungstag planen oder einmal im Jahr eine riesige Überraschung?",
  "Würdest du eher einen eigenen kleinen Garten haben oder einen eigenen kleinen Buchladen?",
  "Würdest du eher ein Sternbild nach dir benannt bekommen oder eine Blume?",
  "Würdest du eher eine Sprache erfinden oder ein Brettspiel?",
  "Würdest du eher einen Brief an dein zukünftiges Ich schreiben oder an dein früheres Ich?",
  "Würdest du eher einen Regentag mit Spielen verbringen oder einen Sonnentag mit Wandern?",
  "Würdest du eher jedes Jahr einen neuen Geburtstagstrend erfinden oder jedes Jahr ein neues Ritual zu Silvester?",
  "Würdest du eher ein altes, vergessenes Talent wiederentdecken oder ein völlig neues bekommen?",
  "Würdest du eher ein geheimnisvolles Schloss besuchen oder eine verlassene Insel?",
  "Würdest du eher jede Woche einen kleinen Traum erfüllen oder einmal im Jahr einen großen?",
  "Würdest du eher nur noch über Briefe kommunizieren oder nur noch über kleine Geschenke?",
  "Würdest du eher eine neue Märchenfigur erfinden oder in einem Märchen mitspielen?",
  "Würdest du eher eine Woche ohne Spiegel leben oder eine Woche ohne Fotos?",
  "Würdest du eher dein Lieblingslied nie wieder hören oder nur noch Coverversionen davon?",
  "Würdest du eher jeden Morgen ein Kompliment bekommen oder jeden Abend?",
  "Würdest du eher dein Leben lang kostenlose Bücher bekommen oder kostenlose Blumen?",
  "Würdest du eher ein Haustier haben, das sprechen kann, oder eines, das Gedanken lesen kann?",
  "Würdest du eher jeden Traum aufschreiben oder nie wieder Albträume haben?",
  "Würdest du eher mit mir ein Geheimversteck bauen oder eine Geheimsprache entwickeln?",
  "Würdest du eher alle Sprachen sprechen können oder jede Melodie perfekt summen?",
  "Würdest du eher eine Nacht unter Sternen schlafen oder in einer Glaskuppel mit Blick in den Himmel?",
  "Würdest du eher eine Postkarte von jedem Ort sammeln oder ein Steinchen?",
  "Würdest du eher jedes Mal einen anderen Traum träumen oder immer denselben schönen?",
  "Würdest du eher immer wissen, wann jemand an dich denkt, oder immer wissen, wann jemand dich vermisst?",
  "Würdest du eher ein gemeinsames Tattoo haben oder ein gemeinsames Geheimnis?",
  "Würdest du eher jeden Monat ein neues Hobby ausprobieren oder eins für immer perfektionieren?",
  "Würdest du eher eine Geschichte hören, die niemand sonst kennt, oder ein Lied, das nie veröffentlicht wurde?",
  "Würdest du eher für eine Woche in der Zukunft leben oder für eine Woche in einer Fantasiewelt?",
  "Würdest du eher einen Tag in deinem Lieblingsbuch verbringen oder in deinem Lieblingsfilm?",
  "Würdest du eher immer die Wahrheit träumen oder immer etwas Absurdes?",
  "Würdest du eher alle Sprachen der Tiere verstehen oder alle Instrumente spielen können?",
  "Würdest du eher einen Kuss im Regen oder eine Umarmung im Schnee?",
  "Würdest du eher die ganze Nacht reden oder die ganze Nacht schweigend kuscheln?",
  "Würdest du eher unsere Zukunft sehen oder unsere Vergangenheit nochmal erleben?",
  "Würdest du eher eine eigene Farbe im Regenbogen oder eine eigene Note in der Musik haben?",
  "Würdest du eher deine Erinnerungen auf Fotos oder in Geschichten festhalten?",
  "Würdest du eher ein Abenteuer im eigenen Viertel erleben oder eine Reise ohne Gepäck?",
  "Würdest du eher eine Playlist ohne Stopp hören oder ein Buch ohne Pause lesen?",
  "Würdest du eher immer deinen Lieblingsgeruch riechen oder nie wieder etwas Unangenehmes?",
  "Würdest du eher alles um dich herum in Sepia sehen oder alles wie in einem Disneyfilm?",
  "Würdest du eher einen Schlüssel zu jedem Schloss haben oder eine Tür zu jedem Traum?",
  "Würdest du eher jeden Tag einen Glückskeks öffnen oder jeden Tag ein Horoskop lesen?",
  "Würdest du eher ein Jahr nur flüstern oder ein Jahr nur singen?",
  "Würdest du eher nur noch tanzen können statt gehen oder nur noch lachen statt reden?",
  "Würdest du eher für einen Tag unsichtbar sein oder für einen Tag doppelt existieren?",
  "Würdest du eher in jedem Traum fliegen oder in jedem Traum tauchen?",
  "Würdest du eher einen Tag komplett ohne Technik oder komplett ohne Uhr verbringen?"
];
const WYR_SPICY = [
"Würdest du eher Sex im Auto oder im Fahrstuhl haben?",
  "Würdest du eher beim Sex erwischt werden oder jemanden erwischen?",
  "Würdest du eher nie wieder Oralsex bekommen oder nie wieder geben?",
  "Würdest du eher Sex im Dunkeln oder bei vollem Licht haben?",
  "Würdest du eher ein erotisches Video von uns aufnehmen oder erotische Fotos machen?",
  "Würdest du eher Sex im Meer oder im Pool haben?",
  "Würdest du eher beim Sex laut sein oder total leise?",
  "Würdest du eher Sex an einem gefährlichen Ort riskieren oder nur langweilig zu Hause?",
  "Würdest du eher auf Vorspiel verzichten oder auf Nachspiel?",
  "Würdest du eher nur noch schnellen Sex haben oder nur noch langen?",
  "Würdest du eher Sex mit verbundenen Augen oder mit Handschellen?",
  "Würdest du eher beim Küssen gebissen werden oder beim Sex gekratzt werden?",
  "Würdest du eher in Unterwäsche gesehen werden oder nackt?",
  "Würdest du eher eine Nacht durchküssen oder die ganze Nacht Sex haben?",
  "Würdest du eher ein Rollenspiel ausprobieren oder Sex an einem neuen Ort?",
  "Würdest du eher Sex draußen im Regen oder drinnen vorm Kamin haben?",
  "Würdest du eher deine Fantasien teilen oder meine Fantasien ausprobieren?",
  "Würdest du eher dreckige Nachrichten schreiben oder ein Nacktbild schicken?",
  "Würdest du eher nie wieder küssen oder nie wieder Sex haben?",
  "Würdest du eher beim Sex Musik hören oder komplette Stille?",
  "Würdest du eher Sex mit Essen (z. B. Sahne, Erdbeeren) oder mit Toys haben?",
  "Würdest du eher immer dominant sein oder immer submissiv?",
  "Würdest du eher einen Quickie im Bad oder langen Sex im Bett?",
  "Würdest du eher beim Telefonsex erwischt werden oder beim Sexting?",
  "Würdest du eher Sex im Kino oder im Park haben?",
  "Würdest du eher Sex ohne Küssen oder Küssen ohne Sex?",
  "Würdest du eher beim Strippen für mich tanzen oder mich strippen lassen?",
  "Würdest du eher ein Wochenende ohne Klamotten oder ein Wochenende ohne Handy verbringen?",
  "Würdest du eher einen Kuss mit Zunge oder 10 ohne?",
  "Würdest du eher Sex auf einer Party riskieren oder bei meinen Eltern zu Hause?",
  "Würdest du eher Sex mit Spiegeln drumherum oder komplett im Dunkeln?",
  "Würdest du eher eine erotische Massage geben oder bekommen?",
  "Würdest du eher Sex mit Handschellen oder mit Augenbinde?",
  "Würdest du eher eine Woche ohne Sex oder eine Woche ohne Küssen?",
  "Würdest du eher ein geheimes Sexvideo besitzen oder ein geheimes Tagebuch?",
  "Würdest du eher Dirty Talk im Ohr oder heiße Blicke?",
  "Würdest du eher Sex im Flugzeug oder auf einem Boot?",
  "Würdest du eher Sex mit Verkleidung (Kostüm) oder nackt und pur?",
  "Würdest du eher beim Sex gefilmt werden oder jemanden filmen?",
  "Würdest du eher Sex auf dem Küchentisch oder auf der Waschmaschine?",
  "Würdest du eher einen Dreier ausprobieren oder niemals?",
  "Würdest du eher nie wieder Selbstbefriedigung oder nie wieder Pornos?",
  "Würdest du eher Sex mit Kerzenlicht oder Neonlicht?",
  "Würdest du eher nackt baden gehen oder nackt schlafen?",
  "Würdest du eher ein Jahr ohne Pornos oder ein Jahr ohne Küssen?",
  "Würdest du eher meine Unterwäsche tragen oder ich deine?",
  "Würdest du eher beim Sex laut den Nachbarn stören oder peinlich still sein?",
  "Würdest du eher deine Lieblingsstellung für immer verlieren oder nie wieder eine neue ausprobieren dürfen?",
  "Würdest du eher Sex im Zelt beim Camping oder im Luxushotel haben?",
  "Würdest du eher Sex mit vollem Risiko erwischt zu werden oder 100 % sicher im Schlafzimmer?",  
  "Würdest du lieber jedes Mal ,wenn du Sex hast lachen müssen oder weinen?",
  "Würdest du eher nie wieder Küssen oder nie wieder Kuscheln?",
  "Würdest du lieber deine geheimsten Fantasien verraten oder die deines/deiner Partner:in erfahren?",
  "Würdest du eher Sex im Freien oder nur noch im Schlafzimmer haben?",
  "Würdest du eher immer das gleiche erotische Spielzeug benutzen oder nie wieder welches verwenden dürfen?",
  "Würdest du lieber jeden Tag Sex haben oder nur einmal im Jahr?",
  "Würdest du eher Deiner/deinem Partner:in beim Sex mit einer anderen Person zuschauen oder beobachtet werden?",
  "Würdest du lieber niemals Sex haben oder niemals die Liebe deines Lebens finden?",
  "Würdest du lieber beim Sex erwischt werden oder jemanden beim Sex erwischen?",
  "Würdest du lieber nie wieder ein Date haben oder nie wieder einen One-Night-Stand?",
  "Würdest du eher einen Liebesbrief an die falsche Person schicken oder eine erotische Nachricht an die falsche Nummer?",
  "Würdest du eher mit den Eltern deiner/deines Partner:in oder mit deinem Chef über dein Sexleben reden?",
  "Würdest du lieber nur noch im Dunkeln Sex haben oder immer bei vollem Licht?",
  "Würdest du eher mit jemandem schlafen, den du nicht magst, oder ein Jahr enthaltsam leben?",
  "Würdest du lieber beim Sex nie den Höhepunkt erreichen oder dein:e Partner:in nie?",
  "Würdest du eher immer auf romantischen Sex verzichten oder auf Abenteuer im Bett?",
  "Würdest du lieber jedes Mal, wenn du Sex hast, eine:n neue:n Partner:in haben oder für immer den-/dieselben Partner:in?",
  "Würdest du eher auf Oralsex verzichten oder auf Penetration?",
  "Würdest du lieber beim Sex nie wieder Stöhnen können oder nie wieder reden?",
  "Würdest du eher bei jedem Date Sex haben oder nie wieder ein Date haben?",
  "Würdest du lieber nie wieder masturbieren dürfen oder nie wieder Sex haben?",
  "Würdest du eher immer Sex mit Musik haben oder in absoluter Stille?",
  "Würdest du lieber Sex an einem öffentlichen Ort haben oder im Schlafzimmer deiner Eltern?",
  "Würdest du eher deine intimsten Fotos veröffentlichen oder die deiner/deines Partner:in sehen?",
  "Würdest du lieber nie wieder einen Orgasmus haben oder nie wieder jemanden zum Orgasmus bringen?",
  "Würdest du eher mit deiner/deinem besten Freund:in schlafen oder mit deinem Chef?",
  "Würdest du lieber ein intimes Abendessen zu Hause haben oder eine wilde Nacht im Club?",
  "Würdest du eher eine Massage oder einen Striptease vor dem Sex bekommen?",
  "Würdest du lieber ein Sextape von dir im Internet finden oder das von einem Freund sehen?",
  "Würdest du lieber ein Ständchen von deinem Partner/deiner Partnerin bekommen oder einen romantischen Liebesbrief?",
  "Würdest du eher Sex mit Licht oder ohne Licht haben?",
  "Würdest du eher morgens oder abends Sex haben?",
  "Würdest du eher Pornos schauen oder Erotikbücher lesen?",
  "Würdest du lieber einen Quickie oder eine lange, leidenschaftliche Sex-Session haben?",
  "Würdest du eher dominant oder unterwürfig im Bett sein?",
  "Würdest du lieber oben oder unten sein?",
  "Würdest du eher Sexspielzeug benutzen oder es einfach halten und nur deine Hände und den Mund benutzen?",
  "Würdest du eher in der Dusche oder im Bett Sex haben?",
  "Würdest du eher im Stillen oder mit Musik im Hintergrund Sex haben?",
  "Würdest du eher neue Stellungen ausprobieren oder bei den bewährten bleiben?",
  "Würdest du eher mit deinem Partner schlafen, der laut ist oder eher leiser im Bett?",
  "Würdest du eher in der Öffentlichkeit rummachen oder Rollenspiele ausprobieren?",
  "Würdest du eher bei Licht oder nur bei Kerzenschein Sex haben?",
  "Würdest du lieber eine Massage oder einen Striptease vor dem Sex bekommen?",
  "Würdest du eher im Whirlpool oder unter der Dusche Sex haben?",
  "Würdest du eher mit deinem Partner schlafen, der ruhig oder wild ist?",
  "Würdest du eher im Bett oder auf dem Boden Sex haben?",
  "Würdest du eher im Kino oder auf einer Parkbank rummachen?",
  "Würdest du eher Handschellen oder Augenbinden beim Vorspiel tragen?",
  "Würdest du lieber einen Lap Dance bekommen oder geben?",
  "Würdest du lieber gefesselt werden oder jemand anderen fesseln?",
  "Würdest du lieber einen leidenschaftlichen Kuss auf die Lippen oder auf den Hals bekommen?",
  "Würdest du lieber beim Sex einen Klaps auf den Hintern bekommen oder an den Haaren gezogen werden?",
  "Würdest du eher zusammen duschen oder ein Schaumbad nehmen?",
  "Würdest du eher Telefonsex haben oder versaute Textnachrichten?",
  "Würdest du eher mit einer Person schlafen, die Dirty Talk mag oder eher zurückhaltend ist?",
  "Wäre es dir lieber, wenn dein/e Partner/in Unterwäsche tragen würde oder komplett nackt wäre?",
  "Würdest du eher Eis oder heißes Wachs beim Vorspiel benutzen?",
  "Würdest du eher ein romantisches Abendessen oder ein Picknick im Park haben?",
  "Würdest du eher gemeinsam Pornos schauen oder Erotikbücher lesen?",
  "Würdest du dich lieber leidenschaftlich oder zärtlich küssen?",
  "Würdest du lieber kuscheln oder knutschen?",
  "Wäre es dir lieber, wenn dein/e Partner/in dich ausziehen würde, oder wenn er/sie dich ausziehen würde?",
  "Wäre es dir lieber, wenn dein/e Partner/in dir schmutzige Worte ins Ohr flüstert oder versaute Textnachrichten schickt?",
  "Würdest du eher im Whirlpool oder im Pool rummachen?",
  "Wäre es dir lieber, wenn dein/e Partner/in ein Kostüm tragen würde oder gar nichts?",
  "Würdest du lieber im Regen oder im Schnee rummachen?",
  "Würdest du lieber in der Öffentlichkeit leidenschaftlich küssen oder an einem abgelegenen Strand rummachen?",
  "Würdest du eher Schlagsahne oder Schokoladensauce beim Vorspiel einbauen?",
  "Würdest du eher Strip-Poker oder Flaschendrehen spielen?",
  "Würdest du eher an einem öffentlichen Ort rumknutschen oder nackt baden gehen?",
  "Würdest du eher in einem sexuellen Rollenspiel Feuerwehrmann/-frau oder Polizist/in spielen?",
  "Würdest du lieber ein romantisches Abendessen oder ein abenteuerliches Date im Freien haben?",
  "Würdest du lieber die Augen verbunden bekommen oder mit einer Feder gekitzelt werden?",
  "Würdest du eher in einem sexuellen Rollenspiel Fremde in einer Bar oder Verliebte in einem Hotel spielen?",
  "Würdest du lieber eine Nacht mit sinnlichen Massagen oder leidenschaftlichen Küssen erleben?",
  "Würdest du lieber die Fantasien deines Partners/deiner Partnerin erforschen oder gemeinsam die Stadt erkunden?",
  "Würdest du lieber etwas Gewagtes in der Öffentlichkeit oder etwas Unanständiges im Privaten tun?",
  "Würdest du dich eher als Superheld/in verkleiden oder ein perverses Rollenspiel spielen?",
  "Würdest du eher an einem abgelegenen Ort oder in einem Club rummachen?",
  "Würdest du eher in der Dusche oder auf dem Küchentresen Sex haben?",
  "Würdest du eher neue Stellungen oder neues Sexspielzeug ausprobieren?",
  "Würdest du lieber gemeinsam einen erotischen Film anschauen oder einander heiße Liebesgeschichten schreiben?",
  "Würdest du lieber die ganze Nacht aufbleiben und reden oder den ganzen Tag rummachen?",
  "Würdest du lieber dich selbst vor deinem Partner/deiner Partnerin berühren oder von ihm/ihr berühren lassen?",
  "Würdest du lieber deinem Partner/deiner Partnerin etwas Unanständiges ins Ohr flüstern oder würdest du lieber von deinem Partner/deiner Partnerin etwas Unanständiges ins Ohr geflüstert bekommen?",
  "Würdest du lieber für deinen Partner/deine Partnerin strippen oder ihn/sie für dich strippen lassen?",
  "Würdest du eher etwas Unanständiges im Flugzeug machen oder eine romantische Nacht am Strand verbringen?",
  "Würdest du eher einen leidenschaftlichen Kuss in der Öffentlichkeit teilen oder auf einer privaten Party rummachen?",
  "Würdest du lieber zusammen einen Sexshop besuchen oder ein paar sexy Videos anschauen?",
  "Würdest du lieber deinen Partner/deine Partnerin langsam ausziehen oder eine sinnliche Dusch-Session machen?",
  "Würdest du lieber Dessous tragen oder gar nichts tragen?",
  "Würdest du lieber eine sinnliche Massage bekommen oder deine erogenen Zonen erkunden?",
  "Würdest du lieber die Fantasien deines Partners/deiner Partnerin erforschen oder “Wahrheit oder Pflicht” spielen?",
  "Würdest du lieber Auszüge aus dem Buch “Fifty Shades of Grey” laut vorlesen oder deinem Partner/deiner Partnerin beim Tanzen etwas Unanständiges ins Ohr flüstern?",
  "Würdest du lieber über deine Fantasien sprechen oder etwas Neues ausprobieren?",
  "Würdest du lieber ein romantisches Abendessen zu zweit genießen oder sexy Brettspiele ausprobieren?",
  "Würdest du lieber einander süße Dinge ins Ohr flüstern oder Strip-Poker spielen?",
  "Wäre es dir lieber, deinem/r Partner/in eine sinnliche Massage zu geben oder euch abwechselnd den Rücken zu massieren?",
  "Würdest du lieber etwas Unanständiges außerhalb des Schlafzimmers machen oder Rollenspiele ausprobieren?",
  "Würdest du dir lieber einen erotischen Film ansehen oder eine Geschichte schreiben und sie gemeinsam nachspielen?",
  "Würdest du lieber Essen und essbare Körperfarbe beim Sex verwenden oder eine Massage bei Kerzenschein bekommen?",
  "Würdest du lieber einen romantischen Spaziergang in der Natur machen oder lieber zu Hause bleiben und euch etwas Gutes tun?",
  "Würdest du eher eine sexy Playlist erstellen oder erotische Gedichte schreiben?",
  "Würdest du lieber jemanden im Regen küssen oder mit ihm/ihr am Strand kuscheln?",
  "Würdest du eher essbare Körperfarbe oder Massageöle verwenden?",
  "Würdest du lieber ein versautes Rollenspiel machen oder gemeinsam einen heißen Film anschauen?",
  "Würdest du lieber bei einem Dreier dabei sein oder Sex in der Öffentlichkeit haben?"
];
const TRUTH_PROMPTS = [
  "Wann hast du zuletzt etwas gemacht, das dich selbst überrascht hat?",
  "Welche Erinnerung aus deiner Kindheit zaubert dir immer noch ein Lächeln ins Gesicht?",
  "Welcher Mensch hat dich bisher am meisten geprägt – und warum?",
  "Wenn du eine Angst von dir für immer loswerden könntest, welche wäre es?",
  "Welche kleine Geste von jemandem hat dich unerwartet glücklich gemacht?",
  "Wann hast du dich das letzte Mal richtig verletzlich gezeigt?",
  "Was glaubst du, ist deine größte Stärke in einer Freundschaft oder Beziehung?",
  "Worauf bist du im Alltag heimlich stolz, auch wenn es niemand bemerkt?",
  "Welche Eigenschaft an anderen bewunderst du, die du selbst gerne mehr hättest?",
  "Wann hast du das letzte Mal etwas zum allerersten Mal ausprobiert?",
  "Welche Erfahrung würdest du gerne noch einmal durchleben – einfach weil sie so schön war?",
  "Hast du dir schon einmal gewünscht, anders zu sein? Wenn ja, wie?",
  "Was ist das mutigste, das du jemals getan hast?",
  "Gibt es etwas, das du nie laut ausgesprochen hast, aber gerne würdest?",
  "Welche kleine Macke an dir findest du insgeheim sympathisch?",
  "Was ist eine Sache, die dich sofort nostalgisch werden lässt?",
  "Wann warst du das letzte Mal so richtig stolz auf dich?",
  "Welche Lebensentscheidung würdest du rückgängig machen, wenn du könntest?",
  "Was war die schönste Überraschung, die dir jemand bereitet hat?",
  "Welche deiner Eigenschaften verstehen die wenigsten Menschen?",
  "Wann hast du dich das letzte Mal so richtig lebendig gefühlt?",
  "Welche Sache würdest du deinem jüngeren Ich gerne sagen?",
  "Wann hast du das letzte Mal vor Freude geweint?",
  "Welche drei Dinge sind dir im Leben am allerwichtigsten?",
  "Welche Eigenschaft würdest du an mir sofort übernehmen, wenn du könntest?",
  "Was war die schwerste Entscheidung deines Lebens bisher?",
  "Gibt es eine Person, die du gerne noch einmal treffen würdest – und warum?",
  "Welche Art von Kompliment bedeutet dir am meisten?",
  "Wann warst du das letzte Mal nervös und warum?",
  "Welche Gewohnheit von dir würdest du gerne ändern?",
  "Was ist etwas, das du dir insgeheim von der Zukunft wünschst?",
  "Welche Erinnerung möchtest du niemals vergessen?",
  "Was war das Verrückteste, was du jemals gemacht hast?",
  "Welcher Traum begleitet dich schon seit Jahren?",
  "Wenn du eine Frage über dein Leben beantwortet bekommen könntest – welche wäre es?",
  "Welche Sache machst du immer, auch wenn es eigentlich niemand merkt?",
  "Was war die größte Lektion, die du bisher gelernt hast?",
  "Welcher kleine Moment hat dir in letzter Zeit Kraft gegeben?",
  "Was denkst du, würde ich über dich sagen, wenn man mich fragen würde?",
  "Welcher Mensch hat dich in letzter Zeit positiv überrascht?",
  "Wenn du ein Jahr wiederholen könntest, welches würdest du nehmen?",
  "Was ist das Schönste, das du jemals über dich selbst gehört hast?",
  "Wann war dir das letzte Mal etwas richtig peinlich?",
  "Welche Angewohnheit von dir bringt andere zum Lächeln?",
  "Welche Frage würdest du dir selbst niemals stellen wollen?",
  "Was ist das Schwerste, das du je verziehen hast?",
  "Womit könntest du mich sofort aufmuntern?",
  "Welche Sache traust du dich nur bei Menschen, denen du vertraust?",
  "Was ist eine kleine Tradition oder Routine, die dir wichtig ist?",
  "Wann hast du dich das letzte Mal so richtig frei gefühlt?"
];
const DARE_PROMPTS = [
   "Mach ein Selfie mit deiner witzigsten Grimasse und schick es mir.",
  "Sprich 30 Sekunden lang nur in Reimen.",
  "Mach ein Geräusch, das zu deinem aktuellen Gefühl passt.",
  "Sing mir den Refrain eines zufälligen Liedes vor.",
  "Imitiere 20 Sekunden lang eine berühmte Person.",
  "Sag deinen nächsten Satz mit einer völlig übertriebenen Betonung.",
  "Zeig mir deine beste Tanzbewegung – mindestens 15 Sekunden.",
  "Beschreibe mich mit drei Fantasiewörtern, die es gar nicht gibt.",
  "Male mit deinem Finger in die Luft und ich muss raten, was es ist.",
  "Tu so, als wärst du ein Nachrichtensprecher und verkünde eine „Breaking News“.",
  "Sprich die nächsten 3 Sätze mit einer Roboter-Stimme.",
  "Sag mir ein Kompliment, ohne dabei das Wort ‚du‘ zu benutzen.",
  "Mach deine beste Tierimitation für 10 Sekunden.",
  "Führe eine fiktive Wettervorhersage für morgen auf.",
  "Erfinde ein neues Wort und erkläre, was es bedeutet.",
  "Stell dich hin und tu so, als würdest du eine Rede halten.",
  "Rede 15 Sekunden lang in einer Fantasiesprache.",
  "Imitiere den Klang eines Weckers, bis ich lache.",
  "Tu so, als würdest du eine Sportmoderation live kommentieren.",
  "Stell dich hin und klatsch 10 Sekunden lang übertrieben dramatisch.",
  "Schreib mir ein Mini-Gedicht in nur vier Wörtern.",
  "Erfinde ein neues Emoji und beschreibe es.",
  "Tu so, als wärst du ein Verkäufer und ich dein Kunde.",
  "Mach dein bestes ‚böse schauen‘ Gesicht für 5 Sekunden.",
  "Sag einen Zungenbrecher dreimal hintereinander.",
  "Beschreibe ein alltägliches Ding so, als wär es ein Luxusprodukt.",
  "Erzähle eine witzige Fake-Geschichte über uns.",
  "Mach ein Herz mit deinen Händen und halte es in die Kamera.",
  "Rede 20 Sekunden lang, als würdest du im Theater auftreten.",
  "Sag 5 Sekunden lang nur „Ja“ in verschiedenen Tönen.",
  "Erfinde einen neuen Spitznamen für mich.",
  "Mach ein Tiergeräusch und ich muss raten, welches es ist.",
  "Sag mir 3 Eigenschaften, die du an mir magst.",
  "Erfinde einen Mini-Song mit meinem Namen darin.",
  "Mach 10 Sekunden lang einen Werbespot über Wasser.",
  "Rede 10 Sekunden nur mit Flüsterstimme.",
  "Sag einen Satz, als würdest du in Zeitlupe sprechen.",
  "Sag 5 Sätze, ohne dabei Buchstaben mit ‚A‘ zu benutzen.",
  "Tu so, als würdest du gerade ein Geheimnis verraten.",
  "Mach 5 Hampelmänner und sag dabei meinen Namen.",
  "Stell dir vor, du wärst ein Pirat, und sag was Passendes.",
  "Tu so, als würdest du einen Zauber wirken.",
  "Sag den nächsten Satz, als wärst du in einem Actionfilm.",
  "Schick mir ein Bild von einem Gegenstand, der gerade in deiner Nähe ist.",
  "Mach ein Selfie, als würdest du erschrocken sein.",
  "Tu so, als wärst du ein Lehrer, der mich ausschimpft.",
  "Sag mir einen Satz, als wärst du ein Schauspieler in einer Liebesszene.",
  "Mach einen Witz, auch wenn er schlecht ist.",
  "Erfinde eine kurze Geschichte mit den Worten: ‚Kaffee‘, ‚Mond‘, ‚Chaos‘.",
  "Sag mir einen Satz rückwärts."
];
const TRUTH_SPICY = [
  "Was war bisher dein wildester Gedanke beim Küssen?",
  "Welches Körperteil von mir gefällt dir am meisten?",
  "Hast du schon mal an mich gedacht, bevor du eingeschlafen bist – und wie genau?",
  "Welche Art von Berührung macht dich sofort schwach?",
  "Welches ist deine absolute Lieblingsstellung?",
  "Was war dein erster Gedanke, als du mich das erste Mal attraktiv fandest?",
  "Hast du schon mal einen erotischen Traum von mir gehabt? Erzähl kurz.",
  "Was turnt dich am meisten an: Blickkontakt, Berührung oder Stimme?",
  "Was war deine bisher verrückteste Fantasie?",
  "Wo würdest du am liebsten spontan mit mir intim werden?",
  "Hast du schon mal absichtlich anzügliche Nachrichten verschickt?",
  "Welche Kleidung findest du an mir am heißesten?",
  "Was ist deine geheime erogene Zone?",
  "Wann war dir etwas in einem intimen Moment peinlich?",
  "Welche Art von Küssen magst du am liebsten?",
  "Was war die längste Zeit, die du ohne Sex ausgehalten hast?",
  "Was bringt dich mehr in Stimmung: Worte oder Berührungen?",
  "Hast du schon mal absichtlich provoziert, um mich heiß zu machen?",
  "Welches ist der verrückteste Ort, an dem du dir Sex vorstellen könntest?",
  "Glaubst du, du bist eher dominant oder eher verspielt im Bett?",
  "Hast du schon mal beim Küssen an mehr gedacht?",
  "Welches Outfit würdest du gerne mal im Bett ausprobieren?",
  "Hast du schon mal extra langsam geflirtet, um Spannung aufzubauen?",
  "Was war die intensivste Fantasie, die du je hattest?",
  "Wo würdest du dir wünschen, dass ich dich jetzt küsse?",
  "Welche Art von Dirty Talk bringt dich am meisten in Stimmung?",
  "Hast du schon mal absichtlich jemanden eifersüchtig gemacht?",
  "Was war dein bisher heißestes Erlebnis?",
  "Was würdest du niemals im Bett ausprobieren?",
  "Was war das längste Vorspiel, das du je hattest?",
  "Magst du lieber langsame oder schnelle Bewegungen im Bett?",
  "Welches Geräusch machst du beim Sex unbewusst?",
  "Womit könnte ich dich am schnellsten verführen?",
  "Was war das verrückteste, das dir während des Sex passiert ist?",
  "Hast du schon mal bei einer Fantasie gedacht: ‚Das erzähl ich niemandem‘?",
  "Welches Wort macht dich sofort an?",
  "Hast du jemals beim Küssen absichtlich etwas verlängert, nur um mich zu necken?",
  "Was wäre ein No-Go für dich beim Sex?",
  "Mit welchem Gegenstand würdest du experimentieren, wenn du müsstest?",
  "Welche Stelle an meinem Körper würdest du am liebsten jetzt küssen?",
  "Was findest du heißer: spontaner Quickie oder geplanter Abend?",
  "Was bringt dich schneller zum Erröten: ein Kuss oder ein Kompliment?",
  "Welche Art von Unterwäsche findest du am attraktivsten?",
  "Würdest du eher ein langes Vorspiel oder direkten Sex bevorzugen?",
  "Was war dein schärfster Traum überhaupt?",
  "Welches Wort würdest du beim Sex niemals sagen?",
  "Wann hast du das letzte Mal absichtlich an etwas Verbotenes gedacht?",
  "Welches ist dein liebster Ort für Zärtlichkeiten?",
  "Was würdest du gerne einmal im Bett ausprobieren, hast dich aber noch nicht getraut?"
];
const DARE_SPICY = [
  "Flüstere mir dein heißestes Geheimnis ins Ohr – so als würdest du mich verführen.",
  "Beschreibe mir in drei Sätzen dein perfektes Vorspiel.",
  "Mach ein Foto von einem Körperteil (harmlos sexy, nicht nackt) und schick es mir.",
  "Sag mir 10 Sekunden lang nur Dinge, die dich an mir heiß machen.",
  "Schreibe mir eine kurze Fantasie in einer Sprachnachricht.",
  "Imitiere für 15 Sekunden, wie du klingen würdest, wenn du sehr erregt bist.",
  "Beschreibe mir dein Lieblingskuss-Szenario so detailliert wie möglich.",
  "Schicke mir 3 Codewörter für Dinge, die du ausprobieren würdest.",
  "Sag meinen Namen so, wie du es im Bett tun würdest.",
  "Flüstere mir eine geheime Fantasie – aber ohne das Wort ‚Sex‘ zu benutzen.",
  "Mach ein 5-Sekunden-Video, in dem du mir nur einen Kuss zuwirfst.",
  "Sag 20 Sekunden lang nur ‚du bist heiß‘ in Variationen.",
  "Gib einem Körperteil von mir eine 5-Sterne-Bewertung.",
  "Beschreibe mir, wie du mich jetzt küssen würdest.",
  "Tu so, als würdest du mir gerade einen leidenschaftlichen Kuss geben – aber nur per Beschreibung.",
  "Schreibe mir eine Nachricht, die so klingt wie ein Dirty Talk – aber in Emojis.",
  "Sage mir, was du bei unserem nächsten Date mit mir machen würdest – ohne das Wort ‚küssen‘.",
  "Mach eine erotische Anpreisung über meine Lippen – als wärst du ein Verkäufer.",
  "Schicke ein Selfie, bei dem du extra ‚süß und unschuldig‘ schaust.",
  "Flüstere ein Wort, das dich sofort anmacht.",
  "Sag mir, was du am liebsten in meinem Ohr flüstern würdest.",
  "Beschreibe in drei Sätzen, wie du mich im Dunkeln finden würdest.",
  "Sag mir drei Körperstellen, die ich sofort berühren sollte.",
  "Schicke mir eine Sprachnachricht, in der du so klingst, als würdest du gerade verführt.",
  "Sag mir drei Dinge, die du gerade gerne mit mir machen würdest.",
  "Beschreibe, wie du dich nach einem leidenschaftlichen Kuss fühlen würdest.",
  "Zeig mir deine ‚Verführungs-Blicke‘ im Selfie-Modus.",
  "Sag mir, was du tun würdest, wenn wir jetzt alleine wären.",
  "Sag mir das frechste Wort, das dir einfällt.",
  "Sprich 15 Sekunden lang so, als würdest du Dirty Talk üben.",
  "Beschreibe deine Lieblingsstellung – aber ohne sie beim Namen zu nennen.",
  "Sag mir, wo du mich am liebsten berühren würdest.",
  "Sende eine Nachricht, die klingt wie der Anfang einer heißen Geschichte.",
  "Sag mir, welche Art von Kuss du jetzt von mir willst.",
  "Schicke mir drei Emojis, die deine Stimmung gerade beschreiben.",
  "Sag einen Satz, als würdest du gerade verführt werden.",
  "Erfinde ein Fantasie-Rollenspiel und beschreibe die erste Szene.",
  "Sag mir drei Wörter, die du am liebsten beim Küssen hörst.",
  "Mach ein Foto, das so aussieht, als würdest du mir gerade einen Kuss geben.",
  "Sag mir, was du mit meinen Händen anstellen würdest.",
  "Sag mir, wie du mich umarmen würdest, wenn niemand hinschaut.",
  "Sag mir, welche Art von Kompliment dich im Bett am meisten treffen würde.",
  "Sag mir dein ‚sicheres Codewort‘, falls es zu heiß wird 😉.",
  "Sag mir, welche Stelle an dir am empfindlichsten ist.",
  "Sag mir, was dich sofort in Stimmung bringt – ohne es direkt zu nennen.",
  "Sag mir drei Wörter, die du im Bett niemals hören willst.",
  "Sag mir, was du an meiner Stimme am heißesten findest.",
  "Beschreibe in drei Sätzen dein ‚perfektes erste Mal‘ – egal ob echt oder Fantasie.",
  "Schicke ein Selfie, auf dem du extra verführerisch schaust.",
  "Sag mir, welche Art von Überraschung im Schlafzimmer du spannend fändest."
];
const CATEGORIES = [
  "Früchte",
  "Gemüsesorten",
  "Getränke",
  "Eissorten",
  "Süßigkeiten-Marken",
  "Kaffeespezialitäten",
  "Teesorten",
  "Brotsorten",
  "Fast-Food-Ketten",
  "Pizza-Beläge",
  "Sandwich-Zutaten",
  "Käsesorten",
  "Saucen",
  "Frühstücksgerichte",
  "Suppenarten",
  "Nudelgerichte",
  "Asiatische Gerichte",
  "Desserts",
  "Biersorten",
  "Cocktails",
  "Berufe",
  "Sportarten",
  "Musikinstrumente",
  "Musikrichtungen",
  "Filmgenres",
  "Seriencharaktere",
  "Cartoonfiguren",
  "Superhelden",
  "Videospiele",
  "Markenklamotten",
  "Schuhmarken",
  "Autohersteller",
  "Motorradmarken",
  "Länder",
  "Städte",
  "Bundesländer",
  "Sprachen",
  "Tierarten",
  "Vogelarten",
  "Meerestiere",
  "Hunderassen",
  "Katzenrassen",
  "Berühmte Schauspieler",
  "Berühmte Sänger",
  "Historische Persönlichkeiten",
  "Berühmte Sportler",
  "Disney-Filme",
  "Harry Potter Charaktere",
  "Marvel-Charaktere",
  "Anime-Charaktere",
  "Brettspiele",
  "Kartenspiele"
];
const TRIVIA = [
  { q: "Wie viele Minuten hat ein Tag?", a: "1440" },
  { q: "Wie viele Bundesländer hat Deutschland?", a: "16" },
  { q: "Wie heißt die Hauptstadt von Australien?", a: "Canberra" },
  { q: "Wie viele Planeten hat unser Sonnensystem?", a: "8" },
  { q: "Wie viele Farben hat die Flagge von Frankreich?", a: "3" },
  { q: "Welches Tier wird als ‚König der Tiere‘ bezeichnet?", a: "Löwe" },
  { q: "Wie viele Zähne hat ein erwachsener Mensch normalerweise?", a: "32" },
  { q: "Welches Element hat das chemische Symbol O?", a: "Sauerstoff" },
  { q: "In welchem Jahr fiel die Berliner Mauer?", a: "1989" },
  { q: "Wie viele Kontinente gibt es auf der Erde?", a: "7" },
  { q: "Wie viele Spieler stehen beim Fußball pro Team auf dem Feld?", a: "11" },
  { q: "Welche Farbe entsteht, wenn man Blau und Gelb mischt?", a: "Grün" },
  { q: "Wie viele Tage hat ein Schaltjahr?", a: "366" },
  { q: "Wie viele Bundeskanzler hatte Deutschland bis 2025?", a: "10" },
  { q: "Wer malte die Mona Lisa?", a: "Leonardo da Vinci" },
  { q: "Wie heißt der höchste Berg der Welt?", a: "Mount Everest" },
  { q: "Wie heißt die Hauptstadt von Kanada?", a: "Ottawa" },
  { q: "Wie viele Tasten hat ein Klavier (Standard)?", a: "88" },
  { q: "Welcher Planet ist der Sonne am nächsten?", a: "Merkur" },
  { q: "Wie viele Buchstaben hat das deutsche Alphabet?", a: "26" },
  { q: "Welches Tier legt die größten Eier?", a: "Strauß" },
  { q: "Wie viele Herzen hat ein Oktopus?", a: "3" },
  { q: "Welches Land hat die meisten Einwohner?", a: "Indien" },
  { q: "Wie viele Knochen hat ein erwachsener Mensch?", a: "206" },
  { q: "In welchem Jahr war die erste Mondlandung?", a: "1969" },
  { q: "Wie viele Seiten hat ein Würfel?", a: "6" },
  { q: "Wie viele Sekunden hat eine Stunde?", a: "3600" },
  { q: "Wie heißt die Hauptstadt von Portugal?", a: "Lissabon" },
  { q: "Welches Meer liegt zwischen Europa und Afrika?", a: "Mittelmeer" },
  { q: "Wie viele Beine hat eine Spinne?", a: "8" },
  { q: "Wie heißt die kleinste Einheit eines Computerspeichers?", a: "Bit" },
  { q: "Welche Farbe hat Chlorophyll?", a: "Grün" },
  { q: "Wie viele Spieler hat ein Basketball-Team auf dem Feld?", a: "5" },
  { q: "Wie viele Ecken hat ein Rechteck?", a: "4" },
  { q: "Wer schrieb ‚Faust‘?", a: "Johann Wolfgang von Goethe" },
  { q: "Wie heißt die Hauptstadt von Ägypten?", a: "Kairo" },
  { q: "Welche Blutgruppe ist die seltenste?", a: "AB negativ" },
  { q: "Wie viele Sterne sind auf der US-Flagge?", a: "50" },
  { q: "Wie viele Zeitzonen hat die Erde?", a: "24" },
  { q: "Wie viele Planeten haben Ringe im Sonnensystem?", a: "4" },
  { q: "Wie viele Monate haben 31 Tage?", a: "7" },
  { q: "Wie heißt die Hauptstadt von Brasilien?", a: "Brasília" },
  { q: "Welches ist das schnellste Landtier?", a: "Gepard" },
  { q: "Welches Tier ist das größte auf der Erde?", a: "Blauwal" },
  { q: "Wie viele Weltmeere gibt es?", a: "5" },
  { q: "Wie heißt die Hauptstadt von Polen?", a: "Warschau" },
  { q: "Welches ist das längste Fließgewässer der Welt?", a: "Nil" },
  { q: "Wie viele Buchstaben hat das griechische Alphabet?", a: "24" },
  { q: "Welche Farbe hat ein Smaragd?", a: "Grün" },
  { q: "Wie viele Kontinente berührt der Äquator?", a: "3" }
];
const MATCH_METER_PROMPTS = [
  "Was wäre dein perfektes Date mit mir – vom Morgen bis zum Abend?",
  "Welche Reise passt gerade zu uns beiden – und warum?",
  "Welche Tradition sollen wir als Paar starten?",
  "Was möchtest du mit mir lernen, das uns verbindet?",
  "Wie sieht unser idealer Sonntag aus – Stunde für Stunde?",
  "Welches Gericht ist unser Signature-Dinner – und wer macht was?",
  "Welche drei Wörter beschreiben uns gerade am besten?",
  "Welcher Song gehört auf unsere gemeinsame Playlist – und wieso?",
  "Welche Stadt sollten wir als Nächstes besuchen – drei Dinge, die wir dort tun?",
  "Welches Hobby könnten wir zusammen beginnen?",
  "Welche kleinen Alltagsmomente machen dich mit mir am glücklichsten?",
  "Welche Eigenschaft bewunderst du an mir im Alltag?",
  "Welche gemeinsame Challenge für 30 Tage würdest du wählen?",
  "Wie sieht unser perfektes Zuhause aus – drei Details?",
  "Welches Spiel/Activity ist unser Go-to für Regentage?",
  "Welche Serie/Film würden wir zusammen neu anfangen – Popcorn-Regeln?",
  "Welches Frühstück ist ‚typisch wir‘?",
  "Was wäre unser gemeinsamer Business-Pitch in 2 Sätzen?",
  "Welches Duft/Ort erinnert dich sofort an uns?",
  "Welche drei Dinge packen wir immer zuerst in den Koffer?",
  "Wie würden wir einen Mini-Feiertag nur für uns feiern?",
  "Welche Überraschung würdest du mir im Alltag machen?",
  "Welche Werte sind uns beiden am wichtigsten – nenne drei.",
  "Wenn wir ein Motto für dieses Jahr hätten – welches?",
  "Welche Aktivität abends entspannt uns beide am schnellsten?",
  "Welche Sport/Bewegungsroutine könnten wir zusammen etablieren?",
  "Wie würden wir einen Stromausfallabend gestalten?",
  "Welche gemeinsame Spar-Goal-Idee motiviert uns – wofür?",
  "Welche Skills bringst du ein, welche ich – Dream-Team-Aufteilung?",
  "Welcher Ort in der Stadt ist unsere ‚Geheim-Location‘?",
  "Was wäre unser Ritual vor dem Schlafengehen?",
  "Welche Art von Fotos/Videos sollten wir regelmäßig festhalten?",
  "Welche drei Regeln würden wir für ‚Handyfreie Zeit‘ machen?",
  "Wie sieht unser perfekter Roadtrip aus – Route, Snack, Playlist?",
  "Welche Sprache/Instrument würden wir zusammen angehen – wieso?",
  "Wie würden wir unser ‚Erfolge feiern‘-Ritual gestalten?",
  "Welche kleine Gewohnheit von mir magst du besonders – und warum?",
  "Welche Saison passt am besten zu uns – und was machen wir dann?",
  "Welche Art von Picknick wäre ‚100 % wir‘?",
  "Welche drei Bücher/Podcasts könnten wir gemeinsam entdecken?",
  "Wie würden wir einen freien Samstag strukturieren – ohne Termine?",
  "Welche Café-Bestellung beschreibt uns beide am besten?",
  "Welche zwei Orte in der Natur sollten wir öfter besuchen?",
  "Welche ‚Date-Night-Themes‘ könnten wir rotieren (z. B. Kochen, Spiele, Kunst)?",
  "Welche Worte/Sätze geben uns beiden sofort gute Laune?",
  "Welche Bucket-List-Idee für dieses Jahr ist realistisch und cool?",
  "Wie teilen wir Aufgaben auf, damit es sich fair anfühlt?",
  "Welche drei Dinge sollten immer in unserer Küche vorrätig sein?",
  "Welche Farbe/Einrichtungsstil ist ‚wir‘ – und in welchem Raum?",
  "Welche Gewohnheit wollen wir gemeinsam aufbauen – erste kleine Schritte?",
  "Wie sieht unser perfekter Wintertag aus?",
  "Welche Art von Ehrenamt/Good-Deed könnten wir zusammen machen?",
  "Welche Regeln hätten wir für ein ‚Digital Detox‘-Wochenende?",
  "Welche Art von Erinnerungsbuch/Album wollen wir führen – wie oft updaten?",
  "Welche zwei ‚Comfort Movies‘ sind unsere – warum genau die?",
  "Welche Essenskombination beschreibt unseren Geschmack am besten?",
  "Welche Morgenroutine zu zweit wäre realistisch und schön?",
  "Welche drei ‚Nein, danke‘-Dinge schützen unsere gemeinsame Zeit?",
  "Welche kleine Geste lässt dich sofort geliebt fühlen – wie bauen wir sie ein?",
  "Welches ‚Reset-Ritual‘ hilft uns nach stressigen Tagen?",
  "Welche jährliche Reise/Trip-Tradition wollen wir fest einplanen?",
  "Welche Fragen sollten wir uns einmal im Monat stellen – Check-in?",
  "Welches gemeinsame Projekt (DIY/Creative) starten wir – erster Schritt?",
  "Welche Überraschung würdest du für einen ‚einfach so‘-Tag planen?",
  "Welche zwei Restaurants/Cuisines sind ‚unsere‘ – und was bestellen wir?",
  "Wie sieht unser perfekter Spaziergang aus – Route, Gesprächsthema, Snack?",
  "Welche drei Songs sind unser Soundtrack – wofür steht jeder?",
  "Welche Mini-Dates passen in 20 Minuten – drei Ideen?",
  "Welche ‚Gute-Laune-Liste‘ wollen wir anlegen – Top-5-Punkte?",
  "Welche Regeln hätten wir für faire Diskussionen – nenne drei positive Do’s?",
  "Welche gemeinsamen Lernziele setzen wir für die nächsten 3 Monate?",
  "Welche Deko/Objekte erzählen unsere Geschichte – welche würden wir wählen?",
  "Wie sieht unser perfekter Feierabend am Mittwoch aus?",
  "Welches ‚Jahresprojekt‘ (z. B. 12 Museen/12 Wanderungen) wählen wir?"
];

/*********************
 * UI Helpers
 *********************/
function Section({ title, children }) {
  return (
    <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800 p-4 md:p-6 shadow-xl">
      <h2 className="text-lg md:text-xl font-semibold mb-3 text-white/90">{title}</h2>
      {children}
    </div>
  );
}
function Pill({ children }){ return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-neutral-800 text-white/80 border border-neutral-700">{children}</span>; }
function Timer({ seconds, onFinish }){
  const [time,setTime]=useState(seconds); const prevRef=useRef(time); const tRef=useRef(null);
  useEffect(()=>setTime(seconds),[seconds]);
  useEffect(()=>{ if(time<=0) return; tRef.current=setTimeout(()=>setTime(t=>t-1),1000); return()=>clearTimeout(tRef.current); },[time]);
  useEffect(()=>{ if(prevRef.current>0 && time===0){ playBeep(); onFinish&&onFinish(); } prevRef.current=time; },[time,onFinish]);
  const pct=Math.max(0,Math.min(100,(time/seconds)*100));
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-white/80">Timer</span>
        <span className="text-sm font-mono text-white/90">{time}s</span>
      </div>
      <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
        <div className="h-full bg-white/90" style={{width:`${pct}%`,transition:"width 1s linear"}}/>
      </div>
    </div>
  );
}
function Counter({label,value,onChange}){
  return (
    <div className="flex items-center gap-2 bg-neutral-900/50 border border-neutral-800 px-2 py-1 rounded-xl">
      <Pill>{label}</Pill>
      <button className="px-3 py-1 rounded-lg bg-neutral-800 text-white/80 border border-neutral-700 hover:bg-neutral-700" onClick={()=>onChange(Math.max(0,value-1))}>−</button>
      <span className="w-8 text-center font-mono text-white/90">{value}</span>
      <button className="px-3 py-1 rounded-lg bg-neutral-800 text-white/80 border border-neutral-700 hover:bg-neutral-700" onClick={()=>onChange(value+1)}>+</button>
    </div>
  );
}
function useLocalStorage(key, initial){ const [s,ss]=useState(()=>{ try{const r=localStorage.getItem(key); return r?JSON.parse(r):initial;}catch{return initial;} }); useEffect(()=>{ try{localStorage.setItem(key,JSON.stringify(s));}catch{} },[key,s]); return [s,ss]; }

const MODES=[{id:"wyr",name:"Would You Rather",desc:"Entscheidet euch zwischen zwei Optionen."},{id:"tod",name:"Truth or Dare",desc:"Wahrheit ODER Pflicht – spicy optional."},{id:"match",name:"Match Meter",desc:"Schätzt ein, ob ihr gleich antwortet (Kompatibilität)."},{id:"cat",name:"Categories",desc:"Kategorie + Buchstabe – nennt abwechselnd Begriffe."},{id:"trivia",name:"Speed Trivia",desc:"Kurze Quizfragen zum Auflockern."}];

/*********************
 * String-Ähnlichkeit (ohne KI)
 *********************/
function normalize(s){ return (s||"").toLowerCase().normalize("NFKD").replace(/[\p{Diacritic}]/gu,"").replace(/[^a-z0-9äöüß\s]/gi,"").replace(/\s+/g," ").trim(); }
function tokens(s){ return normalize(s).split(" ").filter(Boolean); }
function diceCoeff(a,b){ const A=new Set(a), B=new Set(b); const inter=[...A].filter(x=>B.has(x)).length; return (2*inter)/(A.size+B.size||1); }
function charSim(a,b){ const x=normalize(a), y=normalize(b); const maxLen=Math.max(x.length,y.length)||1; let m=0; const ychars=y.split(""); for(const ch of x){ const i=ychars.indexOf(ch); if(i>-1){ m++; ychars.splice(i,1);} } return m/maxLen; }
function similarity(a,b){ const ta=tokens(a), tb=tokens(b); const tokenScore=diceCoeff(ta,tb); const charScore=charSim(a,b); return Math.round(Math.max(tokenScore, charScore)*100); }

/*********************
 * App
 *********************/
export default function App(){
  const [room,setRoom]=useLocalStorage("ccg_room","Ilayda❤️Sufyan");
  const [mode,setMode]=useLocalStorage("ccg_mode","wyr");
  const [spice,setSpice]=useLocalStorage("ccg_spice",true);
  const [p1,setP1]=useLocalStorage("ccg_p1",0);
  const [p2,setP2]=useLocalStorage("ccg_p2",0);
  const [seconds,setSeconds]=useLocalStorage("ccg_secs",60);
  const [round,setRound]=useLocalStorage("ccg_round",1);

  // Präsenz + Realtime Broadcast
  const clientKey=useMemo(()=>Math.random().toString(36).slice(2),[]);
  const [onlineCount,setOnlineCount]=useState(1);
  const channelRef=useRef(null); const applyingRef=useRef(false);

  // --- Match Meter state ---
  const [mmPredictor,setMMPredictor]=useLocalStorage("ccg_mm_predictor","p1");
  const [mmPercent,setMMPercent]=useLocalStorage("ccg_mm_percent",50);
  const [mmAnsP1,setMMAnsP1]=useLocalStorage("ccg_mm_ans_p1","");
  const [mmAnsP2,setMMAnsP2]=useLocalStorage("ccg_mm_ans_p2","");
  const [mmResolved,setMMResolved]=useState(false);
  const [mmScore,setMMScore]=useState(0);
  const [mmHearts,setMMHearts]=useState(false);

  // Channel aufbauen
  useEffect(()=>{
    if(!room) return; if(channelRef.current){ supabase.removeChannel(channelRef.current); channelRef.current=null; }
    const ch=supabase.channel(`room-${room}`,{config:{presence:{key:clientKey}}});

    ch.on("presence",{event:"sync"},()=>{ const n=Object.keys(ch.presenceState()).length; setOnlineCount(n); });

    // Broadcast empfangen
    ch.on("broadcast",{event:"state"},(payload)=>{
      const { sender, data } = payload.payload||{}; if(sender===clientKey) return;
      applyingRef.current=true;
      if(data.mode!==undefined) setMode(data.mode);
      if(data.round!==undefined) setRound(data.round);
      if(data.p1!==undefined) setP1(data.p1);
      if(data.p2!==undefined) setP2(data.p2);
      if(data.spice!==undefined) setSpice(data.spice);
      if(data.seconds!==undefined) setSeconds(data.seconds);
      // match meter
      if(data.mmPredictor!==undefined) setMMPredictor(data.mmPredictor);
      if(data.mmPercent!==undefined) setMMPercent(data.mmPercent);
      if(data.mmAnsP1!==undefined) setMMAnsP1(data.mmAnsP1);
      if(data.mmAnsP2!==undefined) setMMAnsP2(data.mmAnsP2);
      if(data.mmResolved!==undefined) setMMResolved(data.mmResolved);
      if(data.mmScore!==undefined) setMMScore(data.mmScore);
      if(data.mmHearts!==undefined) setMMHearts(data.mmHearts);
      setTimeout(()=>{ applyingRef.current=false; },0);
    });

    ch.on("broadcast",{event:"request_state"},(payload)=>{
      const { sender } = payload.payload||{}; if(sender===clientKey) return;
      ch.send({ type:"broadcast", event:"state", payload:{ sender:clientKey, data:{ mode, round, p1, p2, spice, seconds, mmPredictor, mmPercent, mmAnsP1, mmAnsP2, mmResolved, mmScore, mmHearts } } });
    });

    ch.subscribe(async (status)=>{
      if(status==="SUBSCRIBED"){ await ch.track({ online_at:new Date().toISOString() });
        ch.send({ type:"broadcast", event:"request_state", payload:{ sender:clientKey } });
      }
    });

    channelRef.current=ch; return ()=>{ try{ supabase.removeChannel(ch); }catch{} };
  },[room]);

  // Änderungen broadcasten
  const broadcast = (extra={})=>{ if(applyingRef.current) return; const ch=channelRef.current; if(!ch) return; ch.send({ type:"broadcast", event:"state", payload:{ sender:clientKey, data:{ mode, round, p1, p2, spice, seconds, mmPredictor, mmPercent, mmAnsP1, mmAnsP2, mmResolved, mmScore, mmHearts, ...extra } } }); };
  useEffect(()=>{ broadcast(); },[mode,round,p1,p2,spice,seconds,mmPredictor,mmPercent,mmAnsP1,mmAnsP2,mmResolved,mmScore,mmHearts]);

  // Kartenlogik
  const rng=useMemo(()=>makeRNG(`${room}:${round}:${mode}:${spice}`),[room,round,mode,spice]);
  const pick=useMemo(()=>makePicker(`${room}:${round}:${mode}:${spice}`),[room,round,mode,spice]);
  const card=useMemo(()=>{
    if(mode==="wyr"){ const pool=spice?[...WYR_CUTE,...WYR_SPICY]:WYR_CUTE; let a=pick(pool), b=pick(pool), guard=0; while(b===a&&guard++<10) b=pick(pool); return {title:"Would You Rather", lines:[a,b]}; }
    if(mode==="tod"){ const truth=pick(TRUTH_PROMPTS), dare=pick(DARE_PROMPTS); return {title:"Truth or Dare", lines:["Truth:",truth,"Dare:",dare]}; }
    if(mode==="match"){ const q = pick(MATCH_METER_QUESTIONS); return {title:"Match Meter", lines:[q], hint:"Beide tippen Antworten. Predictor stellt Schätzung ein und wertet aus."}; }
    if(mode==="cat"){ return {title:"Categories", lines:[`Buchstabe: ${randomLetter(rng)}`,`Kategorie: ${pick(CATEGORIES)}`]}; }
    if(mode==="trivia"){ const t=pick(TRIVIA); return {title:"Speed Trivia", lines:[t.q], solution:t.a}; }
    return {title:"", lines:[]};
  },[mode,pick,rng,spice]);

  const nextRound=()=>{ setRound(r=>r+1); if(mode==="match"){ setMMAnsP1(""); setMMAnsP2(""); setMMResolved(false); setMMHearts(false); broadcast({ mmAnsP1:"", mmAnsP2:"", mmResolved:false, mmHearts:false }); } };
  const prevRound=()=>setRound(r=>Math.max(1,r-1));

  // Hearts Animation
  function Hearts(){ if(!mmHearts) return null; const hearts = Array.from({length:12},(_,i)=>i); return (
    <div className="pointer-events-none fixed inset-0 flex items-center justify-center overflow-hidden">
      {hearts.map(i=> (
        <span key={i} className="absolute text-4xl animate-ping" style={{ left: `${Math.random()*80+10}%`, top: `${Math.random()*60+20}%` }}>❤️</span>
      ))}
    </div>
  ); }

  // Match auswerten
  function resolveMatch(){
    const predictorIsP1 = mmPredictor === "p1";
    const a = predictorIsP1 ? mmAnsP2 : mmAnsP1; // Antwort der anderen Person
    const b = predictorIsP1 ? mmAnsP1 : mmAnsP2; // Antwort des Predictors
    const s = similarity(a,b); // 0..100
    setMMScore(s);
    const hearts = s >= 80; setMMHearts(hearts);

    // Punkte abhängig von Güte der Vorhersage
    const pred = mmPercent; const diff = Math.abs(pred - s);
    if(predictorIsP1){ if(diff<=20) setP1(v=>v+1); else if(pred>=80 && s<50) setP1(v=>Math.max(0,v-1)); }
    else { if(diff<=20) setP2(v=>v+1); else if(pred>=80 && s<50) setP2(v=>Math.max(0,v-1)); }

    setMMResolved(true);
    broadcast({ mmScore:s, mmResolved:true, mmHearts:hearts, p1, p2 });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-[#0b0f19] to-black text-white">
      <Hearts />
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-10">
        <header className="mb-6 md:mb-8 flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-rose-400 via-pink-300 to-sky-300">Couple Call Games</h1>
          <div className="flex items-center gap-2"><Pill>v1.8</Pill><Pill>Realtime Sync</Pill></div>
        </header>

        <Section title="Setup">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-white/80 flex items-center gap-2">Gemeinsamer Room Code
                <span className={`inline-block w-3 h-3 rounded-full ${onlineCount>=2?"bg-green-500":"bg-red-500"}`}></span>
              </label>
              <input className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 focus:outline-none focus:ring-2 focus:ring-rose-400/40" value={room} onChange={(e)=>setRoom(e.target.value)} placeholder="z. B. 1234" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-white/80">Spielmodus</label>
              <div className="grid grid-cols-2 gap-2">
                {MODES.map(m=> (
                  <button key={m.id} onClick={()=>setMode(m.id)} className={`px-3 py-2 rounded-xl border text-left ${mode===m.id?"bg-white text-black border-white":"bg-neutral-900 border-neutral-800 text-white/80 hover:bg-neutral-800"}`}>
                    <div className="text-sm font-semibold">{m.name}</div>
                    <div className="text-xs opacity-70">{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 grid md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm text-white/80">Timer (Sekunden)</label>
              <div className="flex gap-2 flex-wrap">
                {[30,45,60,90].map(s=> (
                  <button key={s} onClick={()=>{setSeconds(s);}} className={`px-3 py-2 rounded-xl border ${seconds===s?"bg-white text-black border-white":"bg-neutral-900 border-neutral-800 text-white/80 hover:bg-neutral-800"}`}>{s}s</button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-white/80">Würze</label>
              <div className="flex items-center gap-2">
                <button onClick={()=>setSpice(!spice)} className={`px-3 py-2 rounded-xl border ${spice?"bg-rose-600 text-white border-rose-600 hover:bg-rose-500":"bg-neutral-900 border-neutral-800 text-white/80 hover:bg-neutral-800"}`}>{spice?"Spicy an":"Spicy aus"}</button>
                <span className="text-xs text-white/60">Gilt für WYR / ToD</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-white/80">Runde</label>
              <div className="flex items-center gap-2">
                <button onClick={prevRound} className="px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800">←</button>
                <span className="px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 font-mono">{round}</span>
                <button onClick={nextRound} className="px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800">→</button>
              </div>
            </div>
          </div>
        </Section>

        <div className="my-6"><Timer seconds={seconds} onFinish={()=>{}}/></div>

        <Section title="Aktuelle Karte">
          <div className="space-y-3">
            <div className="text-xl md:text-2xl font-semibold">{card.title}</div>

            {/* Match Meter UI */}
            {mode==="match" && (
              <div className="space-y-4">
                <div className="text-white/80 text-sm">{card.lines?.[0]}</div>

                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-white/70">Antwort Spieler 1</label>
                    <input className="w-full px-3 py-2 mt-1 rounded-xl bg-neutral-900 border border-neutral-800 focus:outline-none" value={mmAnsP1} onChange={(e)=>setMMAnsP1(e.target.value)} placeholder="Antwort von P1" />
                  </div>
                  <div>
                    <label className="text-xs text-white/70">Antwort Spieler 2</label>
                    <input className="w-full px-3 py-2 mt-1 rounded-xl bg-neutral-900 border border-neutral-800 focus:outline-none" value={mmAnsP2} onChange={(e)=>setMMAnsP2(e.target.value)} placeholder="Antwort von P2" />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-white/70">Predictor:</span>
                  <button onClick={()=>setMMPredictor("p1")} className={`px-2 py-1 rounded-lg border ${mmPredictor==="p1"?"bg-white text-black border-white":"bg-neutral-900 border-neutral-800 text-white/80"}`}>Player 1</button>
                  <button onClick={()=>setMMPredictor("p2")} className={`px-2 py-1 rounded-lg border ${mmPredictor==="p2"?"bg-white text-black border-white":"bg-neutral-900 border-neutral-800 text-white/80"}`}>Player 2</button>
                </div>

                <div>
                  <label className="text-sm text-white/80 flex items-center justify-between">
                    <span>Match-Schätzung</span><span className="font-mono">{mmPercent}%</span>
                  </label>
                  <input type="range" min="0" max="100" value={mmPercent} onChange={(e)=>setMMPercent(parseInt(e.target.value)||0)} className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer" />
                </div>

                {!mmResolved ? (
                  <button onClick={resolveMatch} className="px-4 py-2 rounded-xl bg-white text-black font-semibold">Auswerten</button>
                ) : (
                  <div className="text-sm text-white/80">Ähnlichkeit: <span className="font-mono text-white">{mmScore}%</span> {mmScore>=80 && <span className="ml-2">❤️ Match!</span>}</div>
                )}
              </div>
            )}

            {/* Standard-Ausgabe für andere Modi */}
            {mode!=="match" && (
              <div className="space-y-2">
                {card.lines?.map((line,i)=> (
                  <div key={i} className={`text-base md:text-lg ${line.endsWith(":")?"mt-2 font-semibold":""}`}>{line}</div>
                ))}
                {card.solution && (
                  <details className="mt-2"><summary className="cursor-pointer text-white/80">Lösung anzeigen</summary><div className="mt-1 text-white/90">{card.solution}</div></details>
                )}
              </div>
            )}

            <div className="pt-3 flex gap-2">
              <button onClick={prevRound} className="px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800">Zurück</button>
              <button onClick={nextRound} className="px-4 py-2 rounded-xl bg-white text-black font-semibold">Nächste Karte</button>
            </div>
          </div>
        </Section>

        <div className="grid md:grid-cols-2 gap-4 mt-6">
          <Section title="Punktestand">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 flex-wrap">
              <Counter label="Player 1" value={p1} onChange={setP1} />
              <Counter label="Player 2" value={p2} onChange={setP2} />
            </div>
            <div className="mt-3">
              <button onClick={()=>{ setP1(0); setP2(0); }} className="px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800">Reset</button>
            </div>
          </Section>

          <Section title="Spieltipps (für Telefonate)">
            <ul className="list-disc list-inside space-y-1 text-white/80 text-sm">
              <li>Denselben Room Code eingeben → gleiche Karten in gleicher Reihenfolge.</li>
              <li>Timer ist nur Reminder – lauter Beep am Ende.</li>
              <li>Punkte manuell zählen. Bei Gleichstand: schnelle Trivia als Tie-Break.</li>
            </ul>
          </Section>
        </div>

        {/* Debug / Test-Fälle */}
        <details className="mt-6 opacity-80">
          <summary className="cursor-pointer">Debug anzeigen (State & Sync)</summary>
          <pre className="mt-2 text-xs bg-neutral-900/80 p-3 rounded-xl border border-neutral-800 overflow-auto">
{JSON.stringify({ room, mode, round, p1, p2, spice, seconds, onlineCount, mmPredictor, mmPercent, mmAnsP1, mmAnsP2, mmResolved, mmScore, mmHearts }, null, 2)}
          </pre>
        </details>

        <footer className="mt-10 text-center text-xs text-white/50">Made for Sufyan & Ilayda • Alles lokal, keine Daten gespeichert.</footer>
      </div>
    </div>
  );
}
