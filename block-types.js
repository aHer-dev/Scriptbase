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
  TEXT:    "text",
  HEADING: "heading",
  IMAGE:   "image",
  YOUTUBE: "youtube",
  TABLE:   "table",
  LIST:    "list",
  DIVIDER: "divider",
  // Lern-Boxen
  MERKE:   "merke",
  KLINIK:  "klinik",
  TIPP:    "tipp",
  QUIZ:    "quiz",
  AUFGABE: "aufgabe",
};

// ── Standard-Daten pro Block-Typ ───────────────────────────────────
const DEFAULTS = {
  [BLOCK_TYPES.TEXT]:    { content: "" },
  [BLOCK_TYPES.HEADING]: { content: "", level: 2 },         // 1, 2 oder 3
  [BLOCK_TYPES.IMAGE]:   { src: "", alt: "", caption: "" },
  [BLOCK_TYPES.YOUTUBE]: { url: "", title: "" },
  [BLOCK_TYPES.TABLE]:   { rows: [["", ""], ["", ""]] },
  [BLOCK_TYPES.LIST]:    { items: [""], ordered: false },
  [BLOCK_TYPES.DIVIDER]: {},
  [BLOCK_TYPES.MERKE]:   { content: "" },
  [BLOCK_TYPES.KLINIK]:  { content: "" },
  [BLOCK_TYPES.TIPP]:    { content: "" },
  [BLOCK_TYPES.QUIZ]:    { question: "", options: ["", "", "", ""], correct: 0 },
  [BLOCK_TYPES.AUFGABE]: { content: "", solution: "" },
};

// ── UI-Metadaten (für die Block-Palette rechts) ────────────────────
export const ALL_BLOCK_TYPES = [
  // Inhalt
  { type: BLOCK_TYPES.TEXT,    label: "Text",        icon: "¶",  group: "inhalt" },
  { type: BLOCK_TYPES.HEADING, label: "Überschrift", icon: "H",  group: "inhalt" },
  { type: BLOCK_TYPES.IMAGE,   label: "Bild",        icon: "🖼", group: "inhalt" },
  { type: BLOCK_TYPES.YOUTUBE, label: "YouTube",     icon: "▶",  group: "inhalt" },
  { type: BLOCK_TYPES.TABLE,   label: "Tabelle",     icon: "⊞",  group: "inhalt" },
  { type: BLOCK_TYPES.LIST,    label: "Liste",       icon: "≡",  group: "inhalt" },
  { type: BLOCK_TYPES.DIVIDER, label: "Trenner",     icon: "─",  group: "inhalt" },
  // Lern-Boxen
  { type: BLOCK_TYPES.MERKE,   label: "Merke",       icon: "📌", group: "lernbox" },
  { type: BLOCK_TYPES.KLINIK,  label: "Klinik",      icon: "🏥", group: "lernbox" },
  { type: BLOCK_TYPES.TIPP,    label: "Tipp",        icon: "💡", group: "lernbox" },
  { type: BLOCK_TYPES.QUIZ,    label: "Quiz",        icon: "❓", group: "lernbox" },
  { type: BLOCK_TYPES.AUFGABE, label: "Aufgabe",     icon: "✏",  group: "lernbox" },
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
