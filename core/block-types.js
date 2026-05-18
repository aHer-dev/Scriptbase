/**
 * core/block-types.js – Block-Definitionen
 * ==========================================
 * Alle verfügbaren Block-Typen + Factory für neue Blöcke.
 * Reine Daten – kein UI, kein DOM.
 *
 * Neuen Block-Typ hinzufügen?
 *   1. Hier in BLOCK_TYPES + DEFAULTS + ALL_BLOCK_TYPES eintragen.
 *   2. editor/blocks.js: Render-Funktion hinzufügen.
 *   3. exporter/exporter.js: HTML-Export-Funktion hinzufügen.
 *
 * Abhängigkeiten: core/utils.js
 */

import { uid, now } from "./utils.js";

// ── Block-Typen (Konstanten gegen Tippfehler) ──────────────────────
export const BLOCK_TYPES = {
  TEXT:         "text",
  HEADING:      "heading",
  IMAGE:        "image",
  YOUTUBE:      "youtube",
  TABLE:        "table",
  LIST:         "list",
  DIVIDER:      "divider",
  // Lern-Boxen
  LERNZIELE:    "lernziele",    // grüne Lernziel-Box am Kapitelstart
  MERKE:        "merke",
  ESELSBRUECKE: "eselsbruecke", // gelb, wie Merke aber eigenes Label
  KLINIK:       "klinik",
  TIPP:         "tipp",
  INFO:         "info",         // hellblaue neutrale Hinweis-Box
  AUFGABE:      "aufgabe",
  MUSKEL:       "muskel",       // strukturiertes Anatomie-Datenblatt
  REFLEXION:    "reflexion",    // Reflexionsfrage am Kapitelende
  // Interaktion
  QUIZ:         "quiz",         // MC, eine richtige Antwort
  QUIZ_MULTI:   "quiz_multi",   // MC, mehrere richtige Antworten
  TRUE_FALSE:   "true_false",   // Wahr / Falsch
  LUECKE:       "luecke",       // Lückentext (___ als Platzhalter)
  ZUORDNUNG:    "zuordnung",    // Matching: links ↔ rechts
  HOTSPOT:      "hotspot",      // Bildklick: Struktur auf Bild anklicken
};

// ── Standard-Daten pro Block-Typ ───────────────────────────────────
const DEFAULTS = {
  [BLOCK_TYPES.TEXT]:         { content: "" },
  [BLOCK_TYPES.HEADING]:      { content: "", level: 2 },
  [BLOCK_TYPES.IMAGE]:        { src: "", alt: "", caption: "" },
  [BLOCK_TYPES.YOUTUBE]:      { url: "", title: "" },
  [BLOCK_TYPES.TABLE]:        { rows: [["", ""], ["", ""]] },
  [BLOCK_TYPES.LIST]:         { items: [""], ordered: false },
  [BLOCK_TYPES.DIVIDER]:      {},
  [BLOCK_TYPES.LERNZIELE]:    { content: "" },
  [BLOCK_TYPES.MERKE]:        { content: "" },
  [BLOCK_TYPES.ESELSBRUECKE]: { content: "" },
  [BLOCK_TYPES.KLINIK]:       { title: "", content: "" },
  [BLOCK_TYPES.TIPP]:         { content: "" },
  [BLOCK_TYPES.INFO]:         { title: "", content: "" },
  [BLOCK_TYPES.AUFGABE]:      { content: "", solution: "" },
  [BLOCK_TYPES.MUSKEL]:       { name: "", ursprung: "", ansatz: "", funktion: "", innervation: "" },
  [BLOCK_TYPES.REFLEXION]:    { content: "" },
  [BLOCK_TYPES.QUIZ]:         { question: "", options: ["", "", "", ""], correct: 0 },
  [BLOCK_TYPES.QUIZ_MULTI]:   { question: "", options: ["", "", "", ""], correct: [0] },
  [BLOCK_TYPES.TRUE_FALSE]:   { statement: "", correct: true },
  [BLOCK_TYPES.LUECKE]:       { text: "___", blanks: [""] },
  [BLOCK_TYPES.ZUORDNUNG]:    { pairs: [{ left: "", right: "" }, { left: "", right: "" }] },
  [BLOCK_TYPES.HOTSPOT]:      { question: "", src: "", hotspots: [], correct: "" },
};

// ── UI-Metadaten (für die Block-Palette rechts) ────────────────────
export const ALL_BLOCK_TYPES = [
  // Inhalt
  { type: BLOCK_TYPES.TEXT,         label: "Text",            icon: "type",             group: "inhalt" },
  { type: BLOCK_TYPES.HEADING,      label: "Überschrift",     icon: "heading-1",        group: "inhalt" },
  { type: BLOCK_TYPES.IMAGE,        label: "Bild",            icon: "image",            group: "inhalt" },
  { type: BLOCK_TYPES.YOUTUBE,      label: "YouTube",         icon: "youtube",          group: "inhalt" },
  { type: BLOCK_TYPES.TABLE,        label: "Tabelle",         icon: "table",            group: "inhalt" },
  { type: BLOCK_TYPES.LIST,         label: "Liste",           icon: "list",             group: "inhalt" },
  { type: BLOCK_TYPES.DIVIDER,      label: "Trenner",         icon: "minus",            group: "inhalt" },
  { type: BLOCK_TYPES.MUSKEL,       label: "Muskeldatenblatt",icon: "activity",         group: "inhalt" },
  // Lern-Boxen
  { type: BLOCK_TYPES.LERNZIELE,    label: "Lernziele",       icon: "target",           group: "lernbox" },
  { type: BLOCK_TYPES.MERKE,        label: "Merke",           icon: "pin",              group: "lernbox" },
  { type: BLOCK_TYPES.ESELSBRUECKE, label: "Eselsbrücke",     icon: "zap",              group: "lernbox" },
  { type: BLOCK_TYPES.KLINIK,       label: "Klinik",          icon: "stethoscope",      group: "lernbox" },
  { type: BLOCK_TYPES.INFO,         label: "Info",            icon: "info",             group: "lernbox" },
  { type: BLOCK_TYPES.TIPP,         label: "Tipp",            icon: "lightbulb",        group: "lernbox" },
  { type: BLOCK_TYPES.AUFGABE,      label: "Aufgabe",         icon: "check-square",     group: "lernbox" },
  { type: BLOCK_TYPES.REFLEXION,    label: "Reflexion",       icon: "message-circle",   group: "lernbox" },
  // Interaktion
  { type: BLOCK_TYPES.QUIZ,         label: "MC (1 richtig)",  icon: "help-circle",      group: "interaktion" },
  { type: BLOCK_TYPES.QUIZ_MULTI,   label: "MC (mehrere)",    icon: "list-checks",      group: "interaktion" },
  { type: BLOCK_TYPES.TRUE_FALSE,   label: "Wahr / Falsch",   icon: "toggle-left",      group: "interaktion" },
  { type: BLOCK_TYPES.LUECKE,       label: "Lückentext",      icon: "underline",        group: "interaktion" },
  { type: BLOCK_TYPES.ZUORDNUNG,    label: "Zuordnung",       icon: "arrow-left-right", group: "interaktion" },
  { type: BLOCK_TYPES.HOTSPOT,      label: "Bildklick",       icon: "crosshair",        group: "interaktion" },
];

// ── Factory ────────────────────────────────────────────────────────

/**
 * Erzeugt einen neuen Block mit Standard-Daten.
 * @param {string} type - einer der BLOCK_TYPES Werte
 * @returns {object} Block-Objekt
 */
export function createBlock(type) {
  if (!(type in DEFAULTS)) {
    throw new Error(`Unbekannter Block-Typ: ${type}`);
  }
  return {
    id: uid("block"),
    type,
    createdAt: now(),
    ...DEFAULTS[type],
  };
}

/**
 * Prüft ob ein String ein gültiger Block-Typ ist.
 * @param {string} type
 * @returns {boolean}
 */
export function isValidBlockType(type) {
  return type in DEFAULTS;
}
