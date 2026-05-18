/**
 * design/renderer.js – Theme-Anwendung & CSS-Generator
 * ======================================================
 * - applyPreview(): Setzt CSS-Variablen am :root, sodass das aktuelle
 *   Theme + die Overrides im Editor sichtbar werden (Live-Vorschau).
 * - generateCSS(): Liefert ein komplettes CSS für den Export.
 *
 * Abhängigkeiten: core/state.js, design/themes.js
 */

import * as State from "../core/state.js";
import { getTheme } from "./themes.js";

/**
 * Wendet das aktuelle Theme + Overrides als CSS Custom Properties auf :root an.
 * Wirkt sofort im Editor (Vorschau) – KEIN Export.
 */
export function applyPreview() {
  const course = State.getCourse();
  if (!course) return;

  const theme = getTheme(course.design?.theme);
  const overrides = course.design?.overrides ?? {};
  const root = document.documentElement;

  // Erst Theme-Defaults setzen, dann Overrides drüber
  Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
  Object.entries(overrides).forEach(([k, v]) => root.style.setProperty(k, v));
}

/**
 * Erzeugt das komplette CSS für eine exportierte Seite.
 * Wird von exporter/exporter.js verwendet und in shared/style.css der ZIP geschrieben.
 *
 * @param {object} course
 * @returns {string} fertiger CSS-Inhalt
 */
export function generateCSS(course) {
  const theme = getTheme(course.design?.theme);
  const overrides = course.design?.overrides ?? {};
  const merged = { ...theme.vars, ...overrides };

  const varBlock = Object.entries(merged)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n");

  return `:root {\n${varBlock}\n}\n\n${BASE_CSS}`;
}

// ── Basis-CSS für den Export ──────────────────────────────────────
// Nutzt die CSS-Variablen, die oben aus dem Theme generiert werden.
const BASE_CSS = `
* { box-sizing: border-box; }

body {
  font-family: var(--cf-font);
  font-size: var(--cf-font-size);
  line-height: var(--cf-line-height);
  color: var(--cf-text);
  background: var(--cf-bg);
  margin: 0;
  padding: 0;
}

.cf-nav {
  background: var(--cf-nav-bg);
  color: var(--cf-nav-text);
  padding: 12px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.cf-nav a {
  color: var(--cf-nav-text);
  text-decoration: none;
  padding: 6px 12px;
  border-radius: 4px;
}
.cf-nav a:hover { background: rgba(255,255,255,0.15); }

.cf-container {
  max-width: var(--cf-max-width);
  margin: 0 auto;
  padding: 32px;
}

h1, h2, h3 { color: var(--cf-primary); }

img { max-width: 100%; height: auto; }

table { border-collapse: collapse; width: 100%; margin: 16px 0; }
table th, table td { border: 1px solid #e2e8f0; padding: 8px 12px; }
table th { background: rgba(0,0,0,0.04); font-weight: 600; }

iframe { max-width: 100%; }

.atm-merke, .atm-klinik, .atm-tipp, .atm-quiz, .atm-aufgabe {
  border-left: 4px solid;
  padding: 12px 16px;
  margin: 16px 0;
  border-radius: 4px;
}
.atm-merke   { border-color: var(--cf-merke);  background: color-mix(in srgb, var(--cf-merke)  12%, transparent); }
.atm-klinik  { border-color: var(--cf-klinik); background: color-mix(in srgb, var(--cf-klinik) 12%, transparent); }
.atm-tipp    { border-color: var(--cf-tipp);   background: color-mix(in srgb, var(--cf-tipp)   12%, transparent); }
.atm-quiz    { border-color: var(--cf-quiz);   background: color-mix(in srgb, var(--cf-quiz)   12%, transparent); }
.atm-aufgabe { border-color: var(--cf-tipp);   background: color-mix(in srgb, var(--cf-tipp)   12%, transparent); }

.atm-merke strong, .atm-klinik strong, .atm-tipp strong,
.atm-quiz strong, .atm-aufgabe strong {
  display: block;
  margin-bottom: 6px;
}
`;
