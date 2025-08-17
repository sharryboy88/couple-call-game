import React, { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Home, Settings, Star, Check } from "lucide-react";

/****************************************************
 * Couple Call Games – WOW-Design + bunte Modus-Buttons (Listenlayout)
 * - Präsenz-Indikator (rot/grün) neben Room Code
 * - Spicy-Button mit leichtem Abstand
 * - Bottom-Nav: Home, Favoriten, Einstellungen
 * - ToD: Auswahl-Buttons für Wahrheit / Pflicht + Realtime-Sync
 ****************************************************/

const SUPABASE_URL = "https://qelpirfwoycjfcgvajud.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbHBpcmZ3b3ljamZjZ3ZhanVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNzQ0MDksImV4cCI6MjA3MDg1MDQwOX0.HwqCDMNN5JLgFj_geqhzXdFhocUeU2GrfB_9QK7DlRM";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ------ Beep ------ */
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

/* ------ RNG ------ */
function hashStringToSeed(str){let h=2166136261>>>0;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);}return(h>>>0)||0x9e3779b9;}
function makeRNG(seedStr){let x=hashStringToSeed(seedStr);return function(){x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296;};}
function makePicker(seedStr){const r=makeRNG(seedStr);return arr=>!arr?.length?"" : arr[Math.floor(r()*arr.length)];}
function randomLetter(rng){const L="ABCDEFGHIJKLMNOPQRSTUVWXYZ";return L[Math.floor(rng()*L.length)];}

/* ------ Kartenpools ------ */
const WYR_CUTE = [
  "Würdest du eher die Welt bereisen oder dein Traumhaus bauen?",
  "Würdest du eher gemeinsam ein Unternehmen gründen oder für eine Firma arbeiten?",
  "Würdest du eher früh in den Ruhestand gehen oder später im Leben weiterarbeiten?",
  "Würdest du eher eine große oder eine kleine Familie haben?",
  "Würdest du eher für immer in deiner Heimatstadt leben oder umziehen?",
  "Hättest du eher ein vorhersehbares Leben oder eines voller Überraschungen?",
  "Würdest du eher deinem Traumjob nachgehen oder finanzielle Sicherheit haben?",
  "Würdest du eher ein geschäftiges Stadtleben oder ein friedliches Landleben führen?",
  "Würdest du eher persönlichen Erfolg haben oder einen Beitrag zur Gesellschaft leisten?",
  "Würdest du eher auf eine abenteuerliche Reise gehen oder einen entspannten Urlaub machen?",
  "Würdest du eher gemeinsam eine neue Sprache oder eine neue Fähigkeit lernen?",
  "Würdest du eher für die Zukunft planen oder im Moment leben?",
  "Würdest du eher ein einfaches Leben führen oder ein Leben voller Luxus?",
  "Würdest du dich eher weiterbilden oder dich auf deine Karriere konzentrieren?",
  "Würdest du eher gemeinsam ehrenamtlich arbeiten oder ein gemeinsames Unternehmen gründen?",
  "Würdest du eher gemeinsam ein Buch schreiben oder einen Blog starten?",
  "Hättest du eher viele Bekannte oder ein paar enge Freunde?",
  "Würdest du eher berühmt sein oder anonym bleiben?",
  "Würdest du eher am Meer oder in den Bergen leben?",
  "Würdest du lieber immer in Zeitlupe sprechen oder wie ein Roboter?",
  "Würdest du lieber nie wieder Schokolade essen oder nie wieder Pizza?",
  "Würdest du lieber für den Rest deines Lebens in einem Cartoon leben oder in einem Musical?",
  "Würdest du eher immer rückwärts laufen müssen oder auf einem Bein hüpfen?",
  "Würdest du lieber jeden Tag denselben Witz hören oder immer denselben Film sehen?",
  "Würdest du eher immer einen Hut tragen müssen oder immer eine Sonnenbrille?",
  "Würdest du lieber mit einer Comic-Stimme sprechen oder ständig in Reimen reden?",
  "Würdest du eher 100 winzige Hunde oder einen riesigen Hund als Haustier haben?",
  "Würdest du lieber immer niesen oder immer Schluckauf haben?",
  "Würdest du eher die Fähigkeit verlieren, zu lachen oder zu singen?",
  "Würdest du lieber alles, was du denkst, laut aussprechen oder nie wieder sprechen können?",
  "Würdest du eher jedes Mal, wenn du jemandem die Hand gibst, zwinkern oder jedes Mal, wenn du jemandem hallo sagst, tanzen müssen?",
  "Würdest du lieber für den Rest deines Lebens in einem Clownskostüm stecken oder in einem Astronautenanzug?",
  "Würdest du eher einen Elefanten als Haustier haben oder einen Tiger?",
  "Würdest du lieber immer Pech in Glücksspielen oder immer Pech in der Liebe haben?",
  "Würdest du eher nie wieder die Haare schneiden können oder nie wieder deine Nägel?",
  "Würdest du lieber jeden Morgen mit einem Kuss von einem Lama geweckt werden oder von einer Gans?",
  "Würdest du eher in einer Welt ohne Musik oder in einer Welt ohne Filme leben?",
  "Würdest du lieber jedes Mal, wenn du lachst, weinen müssen oder jedes Mal, wenn du weinst, lachen?",
  "Würdest du lieber in einem Zoo arbeiten oder in einem Vergnügungspark?",
  "Würdest du eher in einem U-Boot leben oder in einem Heißluftballon?",
  "Würdest du lieber immer im Regen stehen oder immer in der Sonne brutzeln?",
  "Würdest du eher für den Rest deines Lebens nur noch Eis essen oder nur noch Chips?",
  "Würdest du lieber mit einem Papagei sprechen können oder mit einem Delfin?",
  "Würdest du eher ein Ohr oder eine Hand verlieren?",
  "Würdest du lieber ein Vampir oder ein Werwolf sein?",
  "Würdest du eher nie wieder ein Handy benutzen oder nie wieder Schuhe tragen?",
  "Würdest du lieber ständig einen Pickel auf der Stirn haben oder ständig ein Jucken am Rücken?",
  "Würdest du eher eine Woche lang nicht sprechen können oder eine Woche lang nicht hören können?",
  "Würdest du lieber in einem Schloss oder in einer Raumstation leben?",
  "Würdest du eher für den Rest deines Lebens nur noch flüstern oder nur noch schreien können?",
  "Würdest du lieber ständig dein Lieblingsessen riechen, es aber nie wieder essen dürfen oder es essen, aber nie mehr riechen?",
  "Würdest du lieber nie wieder in den Spiegel schauen können oder immer nur durch eine trübe Scheibe?",
  "Würdest du eher die Fähigkeit verlieren wollen, Auto zu fahren, oder die Fähigkeit, zu schwimmen?",
  "Würdest du lieber immer nach Knoblauch riechen oder immer nach Fisch?",
  "Würdest du eher in einem Freizeitpark oder einem Wasserpark arbeiten?",
  "Würdest du lieber die Zeit anhalten oder zurückspulen können?",
  "Würdest du eher alles schwarz-weiß sehen oder nur in Neonfarben?",
  "Würdest du lieber nur noch ein Mal deine Lieblingssüßigkeit essen können oder so viele Süßigkeiten wie du willst, außer deine Lieblingssüßigkeit?",
  "Würdest du lieber für den Rest deines Lebens in einem Zirkus oder auf einem Schiff leben?",
  "Würdest du lieber im Körper einer Katze oder eines Hundes wiedergeboren werden?",
  "Würdest du eher jedes Mal, wenn du sprichst, singen müssen oder tanzen, wenn du gehst?",
  "Würdest du lieber immer nasse Socken tragen oder immer nasse Haare haben?",
  "Würdest du lieber alle deine Zähne verlieren oder all deine Haare?",
  "Würdest du eher dein ganzes Leben auf einem Kamel reiten oder auf einem Esel?",
  "Würdest du lieber einen Tag als unsichtbare Person verbringen oder als Superheld?",
  "Würdest du lieber fliegen können oder durch die Zeit reisen?",
  "Würdest du lieber ein:e berühmte:r Sänger:in oder Schauspieler:in sein?",
  "Würdest du eher nie wieder lachen können oder nie wieder weinen?",
  "Würdest du lieber nur noch mit einem Piratenschiff reisen oder mit einem Raumschiff?",

];
const WYR_SPICY = [
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
  "Würdest du lieber bei einem Dreier dabei sein oder Sex in der Öffentlichkeit haben?",
  "Extreme \"Würdest du eher\"-Fragen – ü18!"
];
const TRUTH_PROMPTS = [
  "Was ist eine kleine Sache, die dich sofort glücklich macht – und warum?",
  "Wann hast du dich zuletzt von mir richtig verstanden gefühlt?",
  "Welche Eigenschaft an mir liebst du im Alltag am meisten?",
  "Welche Grenze ist dir in Beziehungen besonders wichtig?",
  "Was möchtest du dieses Jahr unbedingt mit mir erleben?",
  "Wovor hast du aktuell Respekt – und was hilft dir dagegen?",
  "Welches Kompliment von mir wirkt lange nach?",
  "Welche Erinnerung an uns bringt dich sofort zum Lächeln?",
  "Welche Angewohnheit von mir findest du heimlich süß?",
  "Wann fühlst du dich mir am nächsten?",
  "Welche Tradition sollten wir beginnen?",
  "Was möchtest du an dir stärken, und wie kann ich helfen?",
  "Welche Liebessprache spricht dich am meisten an?",
  "Wann warst du zuletzt eifersüchtig – und warum?",
  "Welche Überraschung würdest du dir heimlich wünschen?",
  "Was möchtest du, dass ich über dich besser verstehe?",
  "Welche schwierige Situation haben wir gut gemeistert?",
  "Was brauchst du, um dich emotional sicher zu fühlen?",
  "Welche Art von Dates magst du am liebsten?",
  "Welche Frage hast du dich nie getraut zu stellen?",
  "Welche kleine Geste von mir bedeutet dir mehr als Worte?",
  "Was motiviert dich an schwierigen Tagen?",
  "Welche Macke an dir magst du heimlich gern?",
  "Welche Musik erinnert dich an uns?",
  "Welchen Traum willst du mit mir teilen?",
  "Welche Veränderung in unserem Alltag wäre hilfreich?",
  "Welche Grenze möchtest du klarer kommunizieren?",
  "Wann fühlst du dich wertgeschätzt?",
  "Was bedeutet „Zuhause“ mit mir für dich?",
  "Welche Unsicherheit möchtest du mit mir besprechen?",
  "Welche Zukunftsvision hast du für uns?",
  "Was möchtest du mir öfter sagen?",
  "Welche Sache willst du mir schon lange beichten (harmlos)?",
  "Welche Nachricht von mir macht deinen Tag besser?",
  "Welche Art Humor verbindet uns am meisten?",
  "Welche Erinnerung willst du nie vergessen?",
  "Was habe ich kürzlich getan, das dir guttat?",
  "Welche Angewohnheit würdest du gern ablegen?",
  "Was willst du, dass ich heute über dich weiß?",
  "Welche Grenze hat dir früher geholfen?",
  "Welche Kindheitserinnerung erzählst du gern?",
  "Was stresst dich an Social Media?",
  "Welche Routine hilft dir, runterzukommen?",
  "Welche Überraschung würdest du mir in 3 Monaten machen?",
  "Was würdest du deinem jüngeren Ich raten?",
  "Welche Frage soll ich dir öfter stellen?",
  "Welche Art von Nähe gibt dir Energie?",
  "Was möchtest du als Nächstes lernen?",
  "Welche Gewohnheit von mir verstehst du noch nicht?",
  "Welche Erinnerung willst du mit mir neu schreiben?",
  "Welche Farbe beschreibt deine Stimmung heute?",
  "Was denkst du, missverstehen Menschen oft an dir?",
  "Worauf bist du gerade stolz?",
  "Welche Grenze ziehst du gegenüber Arbeit/Privatleben?",
  "Welche Eigenschaft von mir möchtest du übernehmen?",
  "Welche Serie/Film hat dich zuletzt bewegt – warum?",
  "Was ist ein perfekter Sonntag für dich?",
  "Welcher Ort erinnert dich an uns?",
  "Welche Frage sollte ich dir in 1 Jahr noch einmal stellen?",
  "Was hast du heute über dich gelernt?",
  "Womit kann ich dich sofort aufmuntern?",
  "Welche drei Dinge liebst du an uns?",
  "Welche kleine Angst möchtest du loslassen?",
  "Welche Art Komplimente fallen dir schwer?",
  "Welches Lied passt zu unserer Geschichte?",
  "Welche Grenzen sollen wir im Spicy-Modus setzen?",
  "Welche Überraschungsidee hast du für unser nächstes Date?",
  "Was motiviert dich morgens aufzustehen?",
  "Welche Rolle spielt Humor in unserer Beziehung?",
  "Welche Art von Nachrichten magst du von mir am liebsten?",
  "Welche gemeinsame Gewohnheit sollten wir starten?",
  "Welche Lektion hast du aus früheren Beziehungen mitgenommen?",
  "Welche Dinge lassen dich geborgen fühlen?",
  "Welche Frage möchtest du mir heute stellen?",
  "Welche Entscheidung fiel dir zuletzt schwer?",
  "Was möchtest du, dass wir öfter feiern?",
  "Welche Erinnerung an unsere Anfänge ist dir wichtig?",
  "Welche Routine abends tut dir gut?",
  "Was möchtest du, dass ich niemals vergesse?",
  "Welche Gewohnheit von mir nervt dich manchmal (ehrlich)?",
  "Welche Reise möchtest du mit mir wiederholen?",
  "Welche Grenzen willst du neu setzen?",
  "Welche Botschaft würdest du mir als Notiz hinterlassen?",
  "Welche Überraschung von mir hat dich überwältigt?",
  "Welche Art von Unterstützung wünschst du dir mehr?",
  "Welche Sache traust du dich nur bei mir?",
  "Welche Angewohnheit an dir möchtest du feiern?",
  "Welche Geschichte über uns erzählst du Freunden?",
  "Welche Frage macht dich nervös – und warum?",
  "Was willst du, dass ich heute unbedingt höre?",
  "Welche drei Worte beschreiben mich?",
  "Welche Qualität macht uns zu einem guten Team?",
  "Welche Aktivität verbindet uns sofort?",
  "Was möchtest du mir beibringen?",
  "Was möchtest du von mir lernen?",
  "Welche Art von Nähe fehlt dir manchmal?",
  "Welche Grenzen willst du respektiert wissen?",
  "Welche Erinnerung willst du neu schaffen?",
  "Welche Zukunftsangst willst du teilen?",
  "Welche Überraschung wäre klein, aber perfekt?"
];
const DARE_PROMPTS = [
  "Schicke mir jetzt eine 10‑Sekunden‑Sprachnachricht mit drei Komplimenten.",
  "Zeig 15 Sekunden deinen besten Tanzmove.",
  "Schreibe mir einen Zweizeiler über uns – jetzt laut vorlesen.",
  "Imitiere 20 Sekunden lang eine bekannte Person.",
  "Mach eine Selfie‑Grimasse und schick sie.",
  "Sprich 20 Sekunden nur in Reimen.",
  "Lies mir eine zufällige Schlagzeile vor und tu sehr dramatisch.",
  "Baue ein Herz aus Gegenständen auf deinem Tisch und zeig es.",
  "Sende drei Emojis, die deinen Tag perfekt beschreiben.",
  "Tu so, als würdest du mir einen Preis verleihen – 15 Sekunden.",
  "Sprich 15 Sekunden in Zeitlupe.",
  "Mach 10 Hampelmänner und zähle mit.",
  "Erfinde einen Handschlag, den wir beim nächsten Treffen testen.",
  "Sag das Alphabet rückwärts – so weit du kommst.",
  "Erfinde einen Werbeslogan für uns zwei.",
  "Stell eine Filmszene nach, ich muss den Film raten.",
  "Mach 10 Sekunden ASMR und flüstere meinen Namen.",
  "Baue einen Turm aus 5 Dingen in deiner Nähe.",
  "Zeig deine beste Tierimitation.",
  "Sende ein GIF/Sticker, das deine Stimmung zeigt (wenn möglich).",
  "Erfinde eine 5‑Sekunden‑Choreo und tanze sie.",
  "Forme mit deinem Körper einen Buchstaben, ich rate ihn.",
  "Sprich wie ein Radiomoderator und kündige „unseren Song“ an.",
  "Mach 5 Liegestütze (Knie erlaubt).",
  "Erzähl mir in 20 Sekunden eine peinliche Story.",
  "Sprich 15 Sekunden wie ein Pirat.",
  "Erfinde ein Codewort, das „Ich vermisse dich“ bedeutet.",
  "Beschreibe mich in 5 Adjektiven.",
  "Sing eine Zeile eines Liedes, die zu uns passt.",
  "Mach 10 Sekunden Luftgitarre.",
  "Zeichne in 30 Sekunden ein Bild von uns und zeig es.",
  "Tu 10 Sekunden so, als würdest du schweben (Moonwalk möglich).",
  "Sprich 10 Sekunden nur mit Flüsterstimme.",
  "Schreibe „Ich mag dich“ in einer anderen Sprache.",
  "Stell dein Lieblingsgetränk wie ein Gourmet vor.",
  "Zeichne dein Lieblingsessen in 20 Sekunden.",
  "Baue eine Papierfliegerin und lass sie fliegen (wenn möglich).",
  "Mach eine 5‑Sekunden‑Modelpose.",
  "Zähle 10 Dinge auf, die du an dir magst.",
  "Tu so, als würdest du mir einen Heiratsantrag machen (witzig).",
  "Erfinde einen Zungenbrecher mit meinem Namen.",
  "Nenne 5 Dinge, für die du dankbar bist – schnell!",
  "Spiele 10 Sekunden Luftschlagzeug.",
  "Mach deine beste „unschuldig“-Miene 5 Sekunden lang.",
  "Zeige 5 Sekunden lang dein süßestes Lächeln.",
  "Erkläre in 15 Sekunden, warum wir ein gutes Team sind.",
  "Erfinde ein 30‑Sekunden‑Minispiel und leite mich an.",
  "Beschreibe unseren perfekten Tag in 20 Sekunden.",
  "Schicke drei Emojis, die deine Zukunft beschreiben.",
  "Erzähle, was du zuletzt gegoogelt hast (wenn ok).",
  "Erfinde eine neue Begrüßung nur für uns.",
  "Nenne 3 gemeinsame Ziele für den nächsten Monat.",
  "Mach eine Geräusch‑Imitation (ich rate das Ding).",
  "Beschreibe mich in einer Metapher.",
  "Erfinde einen peppigen Spitznamen für mich.",
  "Schicke ein Foto von etwas, das wie ein Herz aussieht (wenn ok).",
  "Baue aus Kissen eine „Burg“ und zeig sie.",
  "Tu so, als wärest du Navi und lotsest mich in die Küche.",
  "Mach eine Zeitlupe‑ und eine Vorspulen‑Bewegung.",
  "Leite eine 15‑Sekunden‑Atemübung an.",
  "Führe 10 Kniebeugen aus und zähle mit.",
  "Male ein Herz auf deine Hand und zeig es.",
  "Erfinde eine Mini‑Liebeserklärung mit genau 10 Wörtern.",
  "Spiele 10 Sekunden pantomimisch ein Tier, ich rate.",
  "Schicke mir drei Dinge, die du heute gelernt hast.",
  "Erkläre einen Gegenstand in deiner Nähe wie in einer Auktion.",
  "Stelle eine Szene nach, in der du mich zum Lachen bringst.",
  "Sprich 15 Sekunden im übertriebenen Dialekt.",
  "Entwerfe ein kleines Logo nur für uns (skizzieren).",
  "Mach eine Yoga‑Pose und halte sie 10 Sekunden.",
  "Leite mich an, eine lustige Pose zu machen.",
  "Schicke ein Sprachnotiz‑Gedicht (mind. 10 Sekunden).",
  "Spiele 10 Sekunden einen Roboter.",
  "Erfinde eine Challenge für morgen und versprich sie umzusetzen.",
  "Erzähle eine 1‑Satz‑Gruselgeschichte.",
  "Sage 3 Gründe, warum du mich magst.",
  "Spiele 10 Sekunden Luftklavier.",
  "Schicke drei zufällige Emojis – ich erfinde eine Story dazu.",
  "Beschreibe deinen Tag in 7 Wörtern.",
  "Sprich 10 Sekunden wie ein Nachrichtensprecher.",
  "Erkläre in 15 Sekunden deinen Lieblingsfilm.",
  "Tu so, als würdest du mir ein Geheimnis ohne Ton erzählen.",
  "Halte 10 Sekunden so still, als hinge das Video.",
  "Erfinde ein Spiel mit einem Würfel (falls vorhanden).",
  "Sprich 15 Sekunden in Reimen über Essen.",
  "Leite ein 10‑Sekunden‑Dehnprogramm an.",
  "Zeichne ein Mini‑Comics von uns (3 Panels).",
  "Schicke mir einen Mini‑Zungenbrecher.",
  "Erkläre, warum heute ein guter Tag war.",
  "Beschreibe mich in Farben.",
  "Zähle 10 Dinge in deinem Zimmer auf – schnell!",
  "Erfinde eine 3‑Schritte‑Morgenroutine für uns.",
  "Sprich 10 Sekunden lang nur in Fragen.",
  "Beschreibe, wie sich Geborgenheit anfühlt.",
  "Erfinde ein Ferien‑Motto für uns.",
  "Schreibe ein Akrostichon mit meinem Namen.",
  "Mach 5 Sprünge und rufe bei jedem „Yeah!“.",
  "Beschreibe, was du gerade riechst/hörst/siehst – schnell.",
  "Schicke mir einen Screenshot deiner Musik‑Playlist (wenn ok)."
];
const TRUTH_SPICY=[ "Was würdest du mir nur flüsternd ins Ohr sagen?","Welche geheime Fantasie würdest du mit mir ausprobieren?","Was war bisher dein kuss-intensivster Moment mit mir?","Welche Berührung lässt dir sofort warm werden?","Welche 3 Wörter beschreiben unser spicy-Level?" ];
const DARE_SPICY=[ "Schicke eine süße (nicht explizite) Sprachnachricht mit Komplimenten.","Beschreibe mir flüsternd unser perfektes Kuss-Szenario.","Wähle einen Körperteil und gib ihm verbal 3 Sterne-Bewertungen 😉","Sende 3 Codewörter für einen spicy Abend.","Sag mir 10 Sekunden lang nur ‚du bist heiß‘ – in Variationen." ];
const CATEGORIES = [
  "Früchte",
  "Gemüsesorten",
  "Getränke",
  "Eissorten",
  "Süßigkeiten‑Marken",
  "Kaffeespezialitäten",
  "Teesorten",
  "Brotsorten",
  "Käsesorten",
  "Nudelarten",
  "Automarken",
  "Motorradmarken",
  "Sportarten",
  "Brettspiele",
  "Kartenspiele",
  "Videospiel‑Genres",
  "Musikinstrumente",
  "Musikrichtungen",
  "Filmgenres",
  "Seriengenres",
  "Berufe",
  "Schulfächer",
  "Studienfächer",
  "Länder",
  "Hauptstädte",
  "Städte in Deutschland",
  "Städte in Europa",
  "Flüsse",
  "Seen",
  "Gebirge",
  "Farben",
  "Formen",
  "Kleidungsstücke",
  "Schuharten",
  "Accessoires",
  "Kosmetikartikel",
  "Hunderassen",
  "Katzenrassen",
  "Vögel",
  "Meerestiere",
  "Insekten",
  "Haushaltsgeräte",
  "Werkzeuge",
  "Baumarten",
  "Blumen",
  "Zimmerpflanzen",
  "Gewürze",
  "Kräuter",
  "Backzutaten",
  "Saucen",
  "Fast‑Food‑Ketten",
  "Supermarktketten",
  "Elektronikmarken",
  "Smartphone‑Modelle",
  "Buchgenres",
  "Autorinnen/Autoren",
  "Märchenfiguren",
  "Superhelden",
  "Schurken",
  "Cartoon‑Charaktere",
  "Disney‑Figuren",
  "Mythologische Wesen",
  "Sternbilder",
  "Planeten & Monde",
  "Wetterphänomene",
  "Hobbys",
  "Outdoor‑Aktivitäten",
  "Indoor‑Aktivitäten",
  "Urlaubsländer",
  "Reiseziele in Europa",
  "Inseln",
  "Strände",
  "Sportvereine",
  "Bundesliga‑Vereine",
  "Olympische Disziplinen",
  "Tanzstile",
  "Yoga‑Posen",
  "Fitnessübungen",
  "Haustiere",
  "Bauernhoftiere",
  "Berühmte Bauwerke",
  "Museen",
  "Theaterstücke",
  "Opern",
  "Programmiersprachen",
  "Frameworks",
  "Datenbanken",
  "Social‑Media‑Plattformen",
  "Apps",
  "Webseiten",
  "Autoteile",
  "Fahrradteile",
  "Zugarten",
  "Flugzeugtypen",
  "Schiffe",
  "Werkstoffe",
  "Chemische Elemente",
  "Chemische Verbindungen",
  "Mathematische Begriffe",
  "Physikalische Begriffe",
  "Psychologische Begriffe",
  "Philosophen",
  "Sprachen",
  "Dialekte",
  "Redewendungen",
  "Sprichwörter"
];
const TRIVIA = [
  { q: "Wie viele Minuten hat eine Stunde?", a: "60" },
  { q: "Wie viele Sekunden hat eine Minute?", a: "60" },
  { q: "Wie viele Tage hat ein Schaltjahr?", a: "366" },
  { q: "Wie viele Kontinente hat die Erde?", a: "7" },
  { q: "Wie viele Bundesländer hat Deutschland?", a: "16" },
  { q: "Wie heißt die Hauptstadt von Frankreich?", a: "Paris" },
  { q: "Wie heißt die Hauptstadt von Italien?", a: "Rom" },
  { q: "Wie heißt die Hauptstadt von Spanien?", a: "Madrid" },
  { q: "Wie heißt die Hauptstadt von Portugal?", a: "Lissabon" },
  { q: "Wie heißt die Hauptstadt von Österreich?", a: "Wien" },
  { q: "Wie heißt die Hauptstadt der Schweiz?", a: "Bern" },
  { q: "Wie heißt die Hauptstadt von Polen?", a: "Warschau" },
  { q: "Wie heißt die Hauptstadt von Tschechien?", a: "Prag" },
  { q: "Wie heißt die Hauptstadt von Ungarn?", a: "Budapest" },
  { q: "Wie heißt die Hauptstadt der Niederlande?", a: "Amsterdam" },
  { q: "Wie heißt die Hauptstadt von Belgien?", a: "Brüssel" },
  { q: "Wie heißt die Hauptstadt von Dänemark?", a: "Kopenhagen" },
  { q: "Wie heißt die Hauptstadt von Schweden?", a: "Stockholm" },
  { q: "Wie heißt die Hauptstadt von Norwegen?", a: "Oslo" },
  { q: "Wie heißt die Hauptstadt von Finnland?", a: "Helsinki" },
  { q: "Wie heißt die Hauptstadt von Großbritannien?", a: "London" },
  { q: "Wie heißt die Hauptstadt von Irland?", a: "Dublin" },
  { q: "Wie heißt die Hauptstadt von Griechenland?", a: "Athen" },
  { q: "Wie heißt die Hauptstadt der Türkei?", a: "Ankara" },
  { q: "Wie heißt der höchste Berg der Erde?", a: "Mount Everest" },
  { q: "Wie heißt der längste Fluss der Welt?", a: "Nil" },
  { q: "Wie viele Planeten hat unser Sonnensystem?", a: "8" },
  { q: "Welcher Planet ist der Sonne am nächsten?", a: "Merkur" },
  { q: "Welcher Planet wird „Roter Planet“ genannt?", a: "Mars" },
  { q: "Welcher Planet hat markante Ringe?", a: "Saturn" },
  { q: "Welches Tier ist das größte Säugetier der Erde?", a: "Blauwal" },
  { q: "Wie viele Zähne hat ein erwachsener Mensch normalerweise?", a: "32" },
  { q: "Welches Gas ist Hauptbestandteil der Luft?", a: "Stickstoff" },
  { q: "Welches chemische Symbol hat Wasser?", a: "H2O" },
  { q: "Welches chemische Symbol hat Gold?", a: "Au" },
  { q: "Welches chemische Symbol hat Natrium?", a: "Na" },
  { q: "Wie viele Farben hat der Regenbogen?", a: "7" },
  { q: "Welche Farbe entsteht aus Blau und Gelb?", a: "Grün" },
  { q: "Welche Sprache hat die meisten Muttersprachler?", a: "Mandarin‑Chinesisch" },
  { q: "Welcher Kontinent ist der größte?", a: "Asien" },
  { q: "Welcher Kontinent ist der kleinste?", a: "Australien" },
  { q: "Wie viele Buchstaben hat das deutsche Alphabet (ohne Umlaute/ß)?", a: "26" },
  { q: "Welches eierlegende Säugetier ist bekannt?", a: "Schnabeltier" },
  { q: "Welches Organ pumpt Blut durch den Körper?", a: "Herz" },
  { q: "Welches Gas entsteht bei der Photosynthese?", a: "Sauerstoff" },
  { q: "Wie viele Ecken hat ein Quadrat?", a: "4" },
  { q: "Wie viele Seiten hat ein Dreieck?", a: "3" },
  { q: "Wie nennt man die Lehre vom Leben?", a: "Biologie" },
  { q: "Wie nennt man die Lehre von Stoffen?", a: "Chemie" },
  { q: "Wie nennt man die Lehre von Zahlen?", a: "Mathematik" },
  { q: "Welcher Fluss fließt durch Köln?", a: "Rhein" },
  { q: "Welcher Fluss fließt durch Hamburg?", a: "Elbe" },
  { q: "Welcher Fluss fließt durch München?", a: "Isar" },
  { q: "An welches Meer grenzt Italien?", a: "Mittelmeer" },
  { q: "Wie heißt Deutschlands höchster Berg?", a: "Zugspitze" },
  { q: "Wie heißt der größte Ozean der Erde?", a: "Pazifik" },
  { q: "Wie heißt der kleinste Ozean?", a: "Arktischer Ozean" },
  { q: "Welche Währung nutzt die Eurozone?", a: "Euro" },
  { q: "Wie viele Monate haben 31 Tage?", a: "7" },
  { q: "Welcher Monat hat die wenigsten Tage?", a: "Februar" },
  { q: "Wie viele Wochen hat ein Jahr ungefähr?", a: "52" },
  { q: "Wie viele Millimeter sind ein Zentimeter?", a: "10" },
  { q: "Wie viele Zentimeter sind ein Meter?", a: "100" },
  { q: "Wie viele Meter sind ein Kilometer?", a: "1000" },
  { q: "Wie nennt man 15 Minuten?", a: "Viertelstunde" },
  { q: "Welches Insekt erzeugt Honig?", a: "Biene" },
  { q: "Wie heißt das flächengrößte Land der Welt?", a: "Russland" },
  { q: "Wie heißt die Hauptstadt der USA?", a: "Washington, D.C." },
  { q: "Wie heißt die Hauptstadt von Kanada?", a: "Ottawa" },
  { q: "Wie heißt die Hauptstadt von Australien?", a: "Canberra" },
  { q: "Wie heißt der längste Fluss Europas?", a: "Wolga" },
  { q: "Welche Stadt nennt man die Stadt der Liebe?", a: "Paris" },
  { q: "Welches Metall ist bei Raumtemperatur flüssig?", a: "Quecksilber" },
  { q: "Wie viele Spieler stehen bei Fußball pro Team auf dem Feld?", a: "11" },
  { q: "Wie viele Ecken hat ein Fünfeck?", a: "5" },
  { q: "Welche Zahl ist eine Primzahl: 9 oder 11?", a: "11" },
  { q: "Welche Form hat ein Stoppschild?", a: "Achteck" },
  { q: "Wie nennt man fleischfressende Pflanzen?", a: "Karnivore Pflanzen" },
  { q: "Wie nennt man junge Hunde?", a: "Welpen" },
  { q: "Wie nennt man junge Katzen?", a: "Kätzchen" },
  { q: "Wie heißt die größte (kälte)Wüste der Erde?", a: "Antarktis" },
  { q: "Wie nennt man gefrorenes Wasser?", a: "Eis" },
  { q: "Was misst ein Thermometer?", a: "Temperatur" },
  { q: "Welcher Planet hat den Großen Roten Fleck?", a: "Jupiter" },
  { q: "Welche Farben hat ein Schachbrett?", a: "Schwarz und Weiß" },
  { q: "Wie nennt man gleich klingende, anders geschriebene Wörter?", a: "Homophone" },
  { q: "Wie nennt man Wörter, die vorwärts wie rückwärts gleich sind?", a: "Palindrom" },
  { q: "Wie viele Beine hat eine Spinne?", a: "8" },
  { q: "Wie viele Monate hat ein Jahr?", a: "12" },
  { q: "Was ist schwerer: 1 kg Federn oder 1 kg Eisen?", a: "Beides gleich schwer" },
  { q: "Zu welcher Tierklasse gehört der Frosch?", a: "Amphibien" },
  { q: "Welches Vitamin bildet der Körper durch Sonne?", a: "Vitamin D" },
  { q: "Wie heißt die Hauptstadt von Japan?", a: "Tokio" },
  { q: "Wie heißt die Hauptstadt von China?", a: "Peking/Beijing" },
  { q: "Wie heißt die Hauptstadt von Brasilien?", a: "Brasília" },
  { q: "Wie heißt die Hauptstadt von Argentinien?", a: "Buenos Aires" },
  { q: "Wie heißt die Hauptstadt von Mexiko?", a: "Mexiko‑Stadt" },
  { q: "Welcher Vogel ist der größte und kann nicht fliegen?", a: "Strauß" },
  { q: "Welche Wissenschaft untersucht das Verhalten?", a: "Psychologie" },
  { q: "Welche Skala misst Erdbebenstärke?", a: "Richterskala" }
];
const MATCH_PROMPTS = [
  "Was wäre dein perfektes Date mit mir – vom Morgen bis zum Abend?",
  "Welche Reise passt gerade zu uns beiden – und warum?",
  "Welche Tradition sollen wir als Paar starten?",
  "Was möchtest du mit mir lernen, das uns verbindet?",
  "Welche gemeinsame Erinnerung liebst du am meisten – warum?",
  "Welche Eigenschaft an mir hilft dir im Alltag?",
  "Welche 30‑Tage‑Challenge sollen wir zusammen probieren?",
  "Welches Lied beschreibt uns am besten – und weshalb?",
  "Welche Serie/Film sollen wir als Nächstes zusammen schauen?",
  "Welcher Ort in der Stadt fühlt sich nach „uns“ an?",
  "Was wünschst du dir, dass ich öfter spontan mache?",
  "Welche kleinen Rituale machen uns glücklich?",
  "Was ist dein Wunsch für nächstes Wochenende mit mir?",
  "Welche Überraschung würdest du gerne für mich vorbereiten?",
  "Welche Angewohnheit von mir findest du heimlich süß?",
  "Was motiviert dich – und wie kann ich dich unterstützen?",
  "Welche Punkte gehören auf unsere Bucket List?",
  "Was ist ein perfektes Regenwetter‑Date?",
  "Welche Eigenschaft macht uns als Team stark?",
  "Was sollten wir jeden Monat einmal fix einplanen?",
  "Welche Reise passt zu unserer Laune gerade?",
  "Welche Komplimente wünschst du dir öfter von mir?",
  "Welcher Moment hat unsere Beziehung verändert?",
  "Was ist ein kleines Abenteuer, das wir sofort starten könnten?",
  "Was kann ich tun, um dich an miesen Tagen zu trösten?",
  "Welche gemeinsame Anschaffung wäre sinnvoll?",
  "Was war eine richtig gute Entscheidung von uns?",
  "Welche Farbe beschreibt unsere Beziehung – und warum?",
  "Welche Grenze ist dir besonders wichtig?",
  "Welche Überraschung von mir hat dich nachhaltig berührt?",
  "Was ist dein Lieblingsfoto von uns – und wieso?",
  "Was möchtest du mir öfter sagen?",
  "Über welches Thema sollten wir mehr reden?",
  "Welches Date‑Motto probieren wir als Nächstes?",
  "Wie sähe ein Traum‑Valentinstag mit mir aus?",
  "Welche Songzeile passt perfekt zu uns?",
  "Wie sieht unser perfekter Sonntag aus?",
  "Welche Eigenheit von mir verstehst du inzwischen besser?",
  "Welche Erinnerung wünschst du dir für diesen Monat?",
  "Was möchtest du an mir feiern?",
  "Welche kleine Geste macht dich sofort weich?",
  "Was willst du in 6 Monaten mit mir geschafft haben?",
  "Welches Ritual vor dem Einschlafen wäre schön?",
  "Wie definierst du Nähe?",
  "Welche Sache vertraust du nur mir an?",
  "Welche Aktivität verbindet uns am schnellsten?",
  "Welche Love‑Language ist deine – wie zeige ich sie dir?",
  "Welche Nachricht willst du morgens von mir lesen?",
  "Welche Reise würdest du jederzeit wieder mit mir machen?",
  "Was möchtest du, dass ich heute über dich lerne?",
  "Welche neue Grenze hast du zuletzt gesetzt?",
  "Welche Überraschung wünschst du dir im Alltag?",
  "Welche Tradition aus deiner Kindheit möchtest du teilen?",
  "Was gibt dir sofort Geborgenheit?",
  "Welche Veränderung hat uns gutgetan?",
  "Welche Challenge war schwer, aber hat uns gestärkt?",
  "Welche Art von Dates fehlt uns?",
  "Was möchtest du mir beibringen?",
  "Was möchtest du von mir lernen?",
  "Welche Sache verstehen nur wir beide?",
  "Welche Gerüche oder Orte lösen bei dir Liebe aus?",
  "Welche Worte willst du heute hören?",
  "Was willst du, dass ich nie vergesse?",
  "Welche Überraschung magst du gar nicht?",
  "Welche Morgenroutine könnten wir testen?",
  "Welcher Song ist „unser Song“ – und warum?",
  "Welche Erfahrung möchtest du unbedingt mit mir teilen?",
  "Was möchtest du über meine Träume wissen?",
  "Welche Art von Fotos sollen wir mehr machen?",
  "Welche Tätigkeiten geben dir mit mir Energie?",
  "Welche Grenzen willst du klarer aussprechen?",
  "Was ist dein Lieblingskompliment an mich?",
  "Welche drei Dinge liebst du an uns?",
  "Welche verrückte Reiseidee reizt dich?",
  "Was gehört auf unsere gemeinsame Bucket List?",
  "Welche Mini‑Überraschung könnte ich heute machen?",
  "Was willst du mir noch in deiner Stadt zeigen?",
  "Welches Essen ist „unser Essen“?",
  "Welche Nachricht hat dich zuletzt besonders berührt?",
  "Welche kleine Geste hatte große Wirkung?",
  "Welche Frage hast du dich nie getraut zu stellen?",
  "Welche Erinnerung möchtest du neu schreiben?",
  "Was ist ein perfektes Winter‑Date?",
  "Was ist ein perfektes Sommer‑Date?",
  "Welche Aktivität hat dich zuletzt glücklich gemacht?",
  "Wobei wünschst du dir, dass ich öfter den ersten Schritt mache?",
  "Welche Ästhetik/Farbe passt zu uns?",
  "Was wünschst du dir an unserem Jahrestag?",
  "Welche späte‑Abend‑Aktivität wäre schön?",
  "Was war unsere lustigste Panne bisher?",
  "Welche Stärke an mir siehst du, die ich unterschätze?",
  "Was möchtest du, dass wir nächstes Jahr über uns sagen können?",
  "Welche Herausforderung wollen wir gemeinsam angehen?",
  "Welche romantische Kleinigkeit vergesse ich manchmal?",
  "Wie fühlt sich „Zuhause“ mit mir an?",
  "Welche Worte geben dir Mut von mir?",
  "Welche Gewohnheit von mir verstehst du noch nicht?",
  "Welche neue Sache willst du mit mir ausprobieren?",
  "Welche Verbindung spürst du sofort, wenn wir telefonieren?",
  "Was möchtest du an mir entdecken, das ich selten zeige?",
  "Welche Orte möchtest du mit mir noch sehen?",
  "Was würde unser Zukunfts‑Ich uns raten?"
];

/* ------ String-Ähnlichkeit (ohne \p{…}) ------ */
function stripDiacritics(s){return (s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"");}
function norm(s){return stripDiacritics(String(s)).toLowerCase().replace(/[^a-z0-9äöüß\s]/gi,"").replace(/\s+/g," ").trim();}
function tokens(s){return norm(s).split(" ").filter(Boolean);}
function diceCoeff(a,b){const A=new Set(a),B=new Set(b);const inter=[...A].filter(x=>B.has(x)).length;return (2*inter)/(A.size+B.size||1);}
function charSim(a,b){const x=norm(a),y=norm(b);const maxLen=Math.max(x.length,y.length)||1;let m=0;const ychars=y.split("");for(const ch of x){const i=ychars.indexOf(ch);if(i>-1){m++;ychars.splice(i,1);}}return m/maxLen;}
function similarity(a,b){const ta=tokens(a),tb=tokens(b);return Math.round(Math.max(diceCoeff(ta,tb),charSim(a,b))*100);}

/* ------ UI ------ */
function Section({ title, children }) {
  return (
    <motion.div
      initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.35}}
      className="rounded-2xl p-5 md:p-6 shadow-xl border border-neutral-800 bg-neutral-900/60"
    >
      <h2 className="text-lg md:text-xl font-semibold mb-3 text-white/90">{title}</h2>
      {children}
    </motion.div>
  );
}
function Pill({ children }) {
  return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-neutral-800 text-white/80 border border-neutral-700">{children}</span>;
}
function Timer({ seconds, onFinish }) {
  const [time,setTime]=useState(seconds); const prev=useRef(time); const tRef=useRef(null);
  useEffect(()=>setTime(seconds),[seconds]);
  useEffect(()=>{ if(time<=0) return; tRef.current=setTimeout(()=>setTime(t=>t-1),1000); return()=>clearTimeout(tRef.current); },[time]);
  useEffect(()=>{ if(prev.current>0 && time===0){ playBeep(); onFinish&&onFinish(); } prev.current=time; },[time,onFinish]);
  const pct=Math.max(0,Math.min(100,(time/seconds)*100));
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1"><span className="text-sm text-white/80">Timer</span><span className="text-sm font-mono text-white/90">{time}s</span></div>
      <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
        <div className="h-full bg-white/90" style={{width:`${pct}%`,transition:"width 1s linear"}}/>
      </div>
    </div>
  );
}
function BottomNav({ tab, setTab }) {
  const items = [
    { id: "home", icon: Home, label: "Home" },
    { id: "fav", icon: Star, label: "Favoriten" },
    { id: "settings", icon: Settings, label: "Einstellungen" },
  ];

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-black/60 backdrop-blur-lg border-t border-white/10 flex justify-around py-2 z-50"
      style={{
        paddingBottom: "max(12px, env(safe-area-inset-bottom))",
      }}
    >
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <motion.button
            whileTap={{ scale: 0.9 }}
            key={it.id}
            onClick={() => setTab(it.id)}
            className={`flex flex-col items-center text-xs ${
              tab === it.id ? "text-white" : "text-white/60"
            }`}
          >
            <Icon size={22} />
            {it.label}
          </motion.button>
        );
      })}
    </div>
  );
}

/* ------ Modus + Themes ------ */
const MODES = [
  { id:"wyr",   name:"Would You Rather", desc:"Entscheidet euch zwischen zwei Optionen." },
  { id:"tod",   name:"Truth or Dare",    desc:"Wahrheit ODER Pflicht – spicy optional." },
  { id:"match", name:"Match Meter",      desc:"Schätzt ein, ob ihr gleich antwortet (Liebestest)." },
  { id:"cat",   name:"Categories",       desc:"Kategorie + Buchstabe – nennt abwechselnd Begriffe." },
  { id:"trivia",name:"Speed Trivia",     desc:"Kurze Quizfragen." },
];

const MODE_THEME = {
  wyr:   { from:"from-sky-500/15",    via:"via-cyan-400/10",   to:"to-sky-300/15"    },
  tod:   { from:"from-rose-500/15",   via:"via-pink-400/10",   to:"to-red-300/15"    },
  match: { from:"from-violet-500/15", via:"via-fuchsia-400/10",to:"to-purple-300/15" },
  cat:   { from:"from-emerald-500/15",via:"via-teal-400/10",   to:"to-emerald-300/15"},
  trivia:{ from:"from-amber-500/15",  via:"via-yellow-400/10", to:"to-amber-300/15"  },
};

const MODE_BUTTON_STYLES = {
  wyr:   { bg:"bg-sky-700/70",   hover:"hover:bg-sky-700",   ring:"ring-sky-300",   shadow:"shadow-sky-500/40" },
  tod:   { bg:"bg-rose-700/70",  hover:"hover:bg-rose-700",  ring:"ring-rose-300",  shadow:"shadow-rose-500/40" },
  match: { bg:"bg-violet-700/70",hover:"hover:bg-violet-700",ring:"ring-violet-300",shadow:"shadow-violet-500/40" },
  cat:   { bg:"bg-emerald-700/70",hover:"hover:bg-emerald-700",ring:"ring-emerald-300",shadow:"shadow-emerald-500/40" },
  trivia:{ bg:"bg-amber-700/70", hover:"hover:bg-amber-700", ring:"ring-amber-300", shadow:"shadow-amber-500/40" },
};

function ModeSelector({ mode, setMode }) {
  return (
    <div className="space-y-3">
      <div className="text-sm text-white/80">Spielmodus</div>
      {MODES.map(m=>{
        const s = MODE_BUTTON_STYLES[m.id];
        const active = mode===m.id;
        return (
          <motion.button
            key={m.id}
            whileTap={{scale:0.98}}
            onClick={()=>setMode(m.id)}
            className={`w-full text-left rounded-2xl px-4 py-3 border transition transform
                        ${s.bg} ${s.hover} border-white/10 text-white
                        ${active ? `ring-2 ${s.ring} shadow-lg ${s.shadow}` : "opacity-95 hover:scale-[1.01]"}`}
          >
            <div className="font-semibold">{m.name}</div>
            <div className="text-sm text-white/80">{m.desc}</div>
          </motion.button>
        );
      })}
    </div>
  );
}

/* ------ App ------ */
export default function App(){
  const [tab,setTab]=useState("home");
  const [mode,setMode]=useState("wyr");
  const [room,setRoom]=useState("1234");
  const [seconds,setSeconds]=useState(60);
  const [spice,setSpice]=useState(true);
  const [myRole,setMyRole]=useState("p1");
  const [p1,setP1]=useState(0); const [p2,setP2]=useState(0);
  const [round,setRound]=useState(1);

  // Presence indicator
  const [onlineCount,setOnlineCount]=useState(1);

  // ToD Auswahl
  const [todChoice,setTodChoice]=useState("truth"); // "truth" | "dare"

  const WYR_POOL=useMemo(()=>[...WYR_CUTE,...(spice?WYR_SPICY:[])],[spice]);
  const TRUTH_POOL=useMemo(()=>[...TRUTH_PROMPTS,...(spice?TRUTH_SPICY:[])],[spice]);
  const DARE_POOL=useMemo(()=>[...DARE_PROMPTS,...(spice?DARE_SPICY:[])],[spice]);

  const rng=useMemo(()=>makeRNG(`${room}:${round}:${mode}:${spice}`),[room,round,mode,spice]);
  const pick=useMemo(()=>makePicker(`${room}:${round}:${mode}:${spice}`),[room,round,mode,spice]);

  const card=useMemo(()=>{
    if(mode==="wyr"){ return {title:"Would You Rather",lines:[pick(WYR_POOL)]}; }
    if(mode==="tod"){ return {title:"Truth or Dare",truth:pick(TRUTH_POOL),dare:pick(DARE_POOL)}; }
    if(mode==="match"){ return {title:"Match Meter",lines:[pick(MATCH_PROMPTS)]}; }
    if(mode==="cat"){ return {title:"Categories",lines:[`Buchstabe: ${randomLetter(rng)}`,`Kategorie: ${pick(CATEGORIES)}`]}; }
    if(mode==="trivia"){ const t=pick(TRIVIA); return {title:"Speed Trivia",lines:[t.q],solution:t.a}; }
    return {title:"",lines:[]};
  },[mode,pick,rng,WYR_POOL,TRUTH_POOL,DARE_POOL]);

  // Match Meter
  const [mmAnsP1,setMMAnsP1]=useState(""); const [mmAnsP2,setMMAnsP2]=useState("");
  const [mmRcvP1,setMmRcvP1]=useState(""); const [mmRcvP2,setMmRcvP2]=useState("");
  const [mmResolved,setMMResolved]=useState(false); const [mmScore,setMMScore]=useState(0);
  const [mmHearts,setMMHearts]=useState(false);

  const [triviaShowSolution,setTriviaShowSolution]=useState(false);

  // Realtime (Presence + State)
  const clientKey=useMemo(()=>Math.random().toString(36).slice(2),[]);
  const channelRef=useRef(null); const applyingRef=useRef(false);
  useEffect(()=>{ if(!room) return;
    if(channelRef.current){ supabase.removeChannel(channelRef.current); channelRef.current=null; }
    const ch=supabase.channel(`room-${room}`,{config:{presence:{key:clientKey}}});

    // Presence indicator
    ch.on("presence",{event:"sync"},()=>{
      const n = Object.keys(ch.presenceState() || {}).length;
      setOnlineCount(n || 1);
    });

    ch.on("broadcast",{event:"state"},(payload)=>{
      const {sender,data}=payload.payload||{}; if(sender===clientKey) return;
      applyingRef.current=true;
      if(data.mode!==undefined) setMode(data.mode);
      if(data.round!==undefined) setRound(data.round);
      if(data.seconds!==undefined) setSeconds(data.seconds);
      if(data.spice!==undefined) setSpice(data.spice);
      if(data.todChoice!==undefined) setTodChoice(data.todChoice);
      setTimeout(()=>{applyingRef.current=false;},0);
    });
    ch.on("broadcast",{event:"mm_reveal"},(payload)=>{
      const {sender,role,answer}=payload.payload||{}; if(sender===clientKey) return;
      if(role==="p1") setMmRcvP1(answer||""); if(role==="p2") setMmRcvP2(answer||"");
    });
    ch.subscribe(async(status)=>{ if(status==="SUBSCRIBED"){ await ch.track({online_at:new Date().toISOString()}); }});
    channelRef.current=ch; return()=>{try{supabase.removeChannel(ch);}catch{}};
  },[room]);

  const broadcast=(extra={})=>{ if(applyingRef.current) return; const ch=channelRef.current; if(!ch) return;
    ch.send({type:"broadcast",event:"state",payload:{sender:clientKey,data:{mode,round,seconds,spice,todChoice,...extra}}});
  };
  useEffect(()=>{ broadcast(); },[mode,round,seconds,spice,todChoice]);

  // Herz 3s
  useEffect(()=>{ if(mmHearts){ const t=setTimeout(()=>setMMHearts(false),3000); return()=>clearTimeout(t);} },[mmHearts]);

  // Match Auswertung
  useEffect(()=>{ if(mmResolved) return; const a1=mmRcvP1||mmAnsP1; const a2=mmRcvP2||mmAnsP2; if(!a1||!a2) return;
    const s=similarity(a1,a2); setMMScore(s); setMMHearts(s===100); setMMResolved(true);
  },[mmRcvP1,mmRcvP2,mmAnsP1,mmAnsP2,mmResolved]);

  function resolveMatch(){ const myAnswer=myRole==="p1"?mmAnsP1:mmAnsP2; if(myRole==="p1") setMmRcvP1(myAnswer||""); else setMmRcvP2(myAnswer||"");
    const ch=channelRef.current; if(ch){ ch.send({type:"broadcast",event:"mm_reveal",payload:{sender:clientKey,role:myRole,answer:myAnswer||""}}); } }

  function nextCard(){ setRound(r=>r+1); setTriviaShowSolution(false); if(mode==="match"){ setMMAnsP1("");setMMAnsP2("");setMmRcvP1("");setMmRcvP2("");setMMResolved(false);setMMScore(0);setMMHearts(false);} }
  function prevCard(){ setRound(r=>Math.max(1,r-1)); setTriviaShowSolution(false); }

  const theme = MODE_THEME[mode] || MODE_THEME.wyr;

  return (
    <div className="min-h-screen relative bg-gradient-to-b from-black via-neutral-950 to-black text-white overflow-hidden">
      {/* dynamischer Farb-Glow */}
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-tr ${theme.from} ${theme.via} ${theme.to} animate-pulse`} />

      {/* Herzregen */}
      <AnimatePresence>
        {mmHearts && (
          <motion.div key="heart" initial={{scale:0,opacity:0}} animate={{scale:3,opacity:1}} exit={{scale:0.5,opacity:0}} transition={{duration:0.8}}
            className="absolute inset-0 flex items-center justify-center z-50">
            <Heart size={140} className="text-pink-500 drop-shadow-[0_0_30px_rgba(236,72,153,0.7)]"/>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="relative z-10 max-w-5xl mx-auto px-4 py-6 md:py-10 pb-32"
        style={{ paddingBottom: "calc(7.5rem + env(safe-area-inset-bottom))" }}
      >
        <header className="mb-6 md:mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-rose-400 via-pink-300 to-sky-300">
            Couple Call Games
          </h1>
          <Pill>v2.0</Pill>
        </header>

        {/* HOME */}
        {tab==="home" && (
          <>
            {/* Setup */}
            <Section title="Home">
              <div className="grid md:grid-cols-2 gap-6">
                {/* LINKS */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm text-white/80 flex items-center gap-2">
                      Gemeinsamer Room Code
                      <span className={`inline-block w-3 h-3 rounded-full ${onlineCount>=2?'bg-green-500':'bg-red-500'}`} />
                    </label>
                    <input className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 focus:outline-none focus:ring-2 focus:ring-rose-400/40"
                      value={room} onChange={e=>setRoom(e.target.value)} placeholder="z. B. 1234"/>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-white/80">Timer (Sekunden)</label>
                    <div className="flex gap-2 flex-wrap">
                      {[30,45,60,90].map(s=>(
                        <motion.button key={s} whileTap={{scale:0.95}} onClick={()=>setSeconds(s)}
                          className={`px-3 py-2 rounded-xl border ${seconds===s?'bg-white text-black border-white':'bg-neutral-900 border-neutral-800 text-white/80 hover:bg-neutral-800'}`}>
                          {s}s
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-white/80">Spicy Mode</label>
                    <motion.button whileTap={{scale:0.95}} onClick={()=>setSpice(!spice)}
                      className={`ml-3 px-3 py-2 rounded-xl border ${spice?'bg-rose-600 text-white border-rose-600 hover:bg-rose-500':'bg-neutral-900 border-neutral-800 text-white/80 hover:bg-neutral-800'}`}>
                      {spice?'Spicy an':'Spicy aus'}
                    </motion.button>
                    <div className="text-xs text-white/60">Gilt für WYR / ToD</div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-white/80">Rolle nur für (Match Meter)</label>
                    <div className="flex items-center gap-2">
                      <motion.button whileTap={{scale:0.95}} onClick={()=>setMyRole("p1")}
                        className={`px-3 py-2 rounded-xl border flex items-center gap-2 ${myRole==="p1"?'bg-white text-black border-white ring-2 ring-pink-400':'bg-neutral-900 border-neutral-800 text-white/80 hover:bg-neutral-800'}`}>
                        {myRole==="p1"&&<Check size={16}/>} Ich bin Spieler 1
                      </motion.button>
                      <motion.button whileTap={{scale:0.95}} onClick={()=>setMyRole("p2")}
                        className={`px-3 py-2 rounded-xl border flex items-center gap-2 ${myRole==="p2"?'bg-white text-black border-white ring-2 ring-sky-400':'bg-neutral-900 border-neutral-800 text-white/80 hover:bg-neutral-800'}`}>
                        {myRole==="p2"&&<Check size={16}/>} Ich bin Spieler 2
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* RECHTS – bunte Modusliste (Listenlayout) */}
                <ModeSelector mode={mode} setMode={setMode}/>
              </div>
            </Section>

            <div className="my-6"><Timer seconds={seconds} onFinish={()=>{}} /></div>

            {/* Aktuelle Karte */}
            <Section title="Aktuelle Karte">
              <AnimatePresence mode="wait">
                <motion.div key={`${mode}-${round}-${todChoice}`} initial={{y:30,opacity:0,scale:0.98}} animate={{y:0,opacity:1,scale:1}} exit={{y:-20,opacity:0,scale:0.98}} transition={{type:"spring",stiffness:220,damping:20}} className="text-lg">
                  <div className="text-xl md:text-2xl font-semibold mb-3">{card.title}</div>

                  {mode==="wyr" && <div className="mb-4">{card.lines[0]}</div>}

                  {mode==="tod" && (
                    <div className="space-y-3">
                      {/* Auswahl-Buttons */}
                      <div className="flex gap-2">
                        <motion.button
                          whileTap={{scale:0.95}}
                          onClick={()=>setTodChoice("truth")}
                          className={`px-3 py-2 rounded-xl border ${todChoice==="truth" ? "bg-white text-black border-white" : "bg-neutral-900 border-neutral-800 text-white/80 hover:bg-neutral-800"}`}
                        >
                          Wahrheit
                        </motion.button>
                        <motion.button
                          whileTap={{scale:0.95}}
                          onClick={()=>setTodChoice("dare")}
                          className={`px-3 py-2 rounded-xl border ${todChoice==="dare" ? "bg-white text-black border-white" : "bg-neutral-900 border-neutral-800 text-white/80 hover:bg-neutral-800"}`}
                        >
                          Pflicht
                        </motion.button>
                      </div>

                      {/* Nur die gewählte Aufgabe anzeigen */}
                      <div className="text-base md:text-lg">
                        {todChoice==="truth" ? (
                          <div><strong>Wahrheit:</strong> {card.truth}</div>
                        ) : (
                          <div><strong>Pflicht:</strong> {card.dare}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {mode==="match" && (
                    <div className="space-y-4">
                      <div className="text-white/80 text-sm">{card.lines?.[0]}</div>
                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-white/70">Antwort Spieler 1</label>
                          <input className="w-full px-3 py-2 mt-1 rounded-xl bg-neutral-900 border border-neutral-800"
                            value={mmAnsP1} onChange={e=>setMMAnsP1(e.target.value)} disabled={myRole!=="p1"} placeholder="Antwort von P1"/>
                        </div>
                        <div>
                          <label className="text-xs text-white/70">Antwort Spieler 2</label>
                          <input className="w-full px-3 py-2 mt-1 rounded-xl bg-neutral-900 border border-neutral-800"
                            value={mmAnsP2} onChange={e=>setMMAnsP2(e.target.value)} disabled={myRole!=="p2"} placeholder="Antwort von P2"/>
                        </div>
                      </div>
                      {!mmResolved ? (
                        <motion.button whileTap={{scale:0.95}} onClick={resolveMatch} className="px-4 py-2 rounded-xl bg-white text-black font-semibold">
                          Reveal & Auswerten
                        </motion.button>
                      ) : (
                        <div className="text-sm text-white/80">
                          Ähnlichkeit: <span className="font-mono text-white">{mmScore}%</span>
                          {mmScore===100 && <span className="ml-2">❤️ Perfektes Match!</span>}
                        </div>
                      )}
                    </div>
                  )}

                  {mode==="cat" && (<div className="space-y-2">{card.lines?.map((ln,i)=>(<div key={i}>{ln}</div>))}</div>)}

                  {mode==="trivia" && (
                    <div>
                      <div className="mb-2">{card.lines[0]}</div>
                      <details className="mt-1">
                        <summary className="cursor-pointer text-white/80">Lösung anzeigen!</summary>
                        <div className="mt-1 text-white/90">{card.solution}</div>
                      </details>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="mt-6 flex gap-3">
                    <motion.button whileTap={{scale:0.95}} onClick={prevCard} className="px-4 py-2 rounded-lg bg-neutral-900 border border-neutral-800">Zurück</motion.button>
                    <motion.button whileTap={{scale:0.95}} onClick={nextCard} className="px-4 py-2 rounded-lg bg-white text-black">Nächste Karte</motion.button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </Section>
          </>
        )}

        {/* Favoriten/Settings – Coming soon */}
        {tab==="fav" && (<Section title="Favoriten"><p className="text-sm text-white/70">Coming soon ✨</p></Section>)}
        {tab==="settings" && (<Section title="Einstellungen"><p className="text-sm text-white/70">Coming soon ✨</p></Section>)}
      </div>

      <BottomNav tab={tab} setTab={setTab}/>
    </div>
  );
}
