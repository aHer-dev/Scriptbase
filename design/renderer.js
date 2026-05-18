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
  const mode = State.getMode();
  const T = theme[mode] ?? theme.dark;
  const overrides = course.design?.overrides ?? {};
  const root = document.documentElement;

  // Editor-UI-Variablen setzen (--ed-*)
  Object.entries(T).forEach(([k, v]) => root.style.setProperty(k, v));
  // Export-Variablen setzen (--cf-*), dann Overrides drüber
  Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
  Object.entries(overrides).forEach(([k, v]) => root.style.setProperty(k, v));

  // Favicon mit Theme-Akzent aktualisieren
  updateFavicon(T["--ed-accent"]);

  // --cf-* Box-Farben auf --ed-* mappen → Editor-Boxen folgen dem Theme
  const BOX_MAP = [
    ["--cf-merke",    "--ed-merke"],
    ["--cf-merke-bg", "--ed-merke-bg"],
    ["--cf-klinik",   "--ed-klinik"],
    ["--cf-klinik-bg","--ed-klinik-bg"],
    ["--cf-tipp",     "--ed-tipp"],
    ["--cf-tipp-bg",  "--ed-tipp-bg"],
    ["--cf-aufgabe",  "--ed-aufgabe"],
    ["--cf-aufgabe-bg","--ed-aufgabe-bg"],
    ["--cf-quiz",     "--ed-quiz"],
    ["--cf-quiz-bg",  "--ed-quiz-bg"],
  ];
  const merged = { ...theme.vars, ...overrides };
  BOX_MAP.forEach(([cf, ed]) => {
    if (merged[cf]) root.style.setProperty(ed, merged[cf]);
  });
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

function updateFavicon(accentColor) {
  if (!accentColor) return;
  const link = document.querySelector("link[rel='icon']");
  if (!link) return;
  const color = accentColor.replace("#", "%23");
  link.href = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 26 26'><rect x='1' y='1' width='11' height='11' rx='3' fill='${color}' opacity='0.9'/><rect x='14' y='1' width='11' height='11' rx='3' fill='${color}' opacity='0.4'/><rect x='1' y='14' width='11' height='11' rx='3' fill='${color}' opacity='0.4'/><rect x='14' y='14' width='11' height='11' rx='3' fill='${color}' opacity='0.15'/></svg>`;
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

/* ── Theme-variable Lernboxen ──────────────────────────────────────── */
.atm-merke, .atm-klinik, .atm-tipp, .atm-quiz, .atm-aufgabe {
  border-left: 5px solid;
  padding: 14px 18px;
  margin: 18px 0;
  border-radius: 4px;
}
.atm-merke   { border-color: var(--cf-merke);    background: var(--cf-merke-bg); }
.atm-klinik  { border-color: var(--cf-klinik);   background: var(--cf-klinik-bg); }
.atm-tipp    { border-color: var(--cf-tipp);     background: var(--cf-tipp-bg); }
.atm-quiz    { border-color: var(--cf-quiz);     background: var(--cf-quiz-bg); }
.atm-aufgabe { border-color: var(--cf-aufgabe, var(--cf-tipp)); background: var(--cf-aufgabe-bg, var(--cf-tipp-bg)); }

.atm-merke strong, .atm-eselsbruecke strong, .atm-tipp strong,
.atm-quiz strong, .atm-aufgabe strong {
  display: block;
  margin-bottom: 6px;
  font-weight: 700;
}

/* Klinik: Titel-Überschrift aus der Referenz */
.atm-klinik strong, .atm-klinik h4 {
  display: block;
  margin: 0 0 8px;
  font-size: 0.9em;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--cf-klinik);
}

/* Info-Box */
.atm-info {
  background: #e8f0f8;
  border-left: 5px solid #4682b4;
  padding: 14px 18px;
  border-radius: 4px;
  margin: 18px 0;
}
.atm-info strong, .atm-info h4 {
  display: block;
  color: #2c5a8a;
  margin: 0 0 8px;
  font-weight: 700;
  font-size: 0.95em;
}

/* ── Semantisch fixierte Lernboxen (Farbe unabhängig vom Theme) ─── */

/* Lernziele (grün) */
.atm-lernziele {
  background: #eaf5ee;
  border-left: 5px solid #2c7a5b;
  padding: 14px 18px;
  border-radius: 4px;
  margin: 20px 0;
}
.atm-lernziele strong {
  display: block;
  color: #2c7a5b;
  font-weight: 700;
  margin-bottom: 8px;
  font-size: 1em;
}
.atm-lernziele ul { margin: 4px 0; padding-left: 1.4em; }
.atm-lernziele li { margin: 4px 0; }

/* Eselsbrücke (gelb) */
.atm-eselsbruecke {
  background: #fff8dc;
  border-left: 5px solid #d4a017;
  padding: 12px 16px;
  border-radius: 4px;
  margin: 18px 0;
}
.atm-eselsbruecke strong { color: #8a6a0a; }

/* Reflexion (blau) */
.atm-reflexion {
  background: #f0f5fa;
  border-left: 5px solid #4682b4;
  padding: 12px 16px;
  border-radius: 4px;
  margin: 18px 0;
}
.atm-reflexion strong {
  display: block;
  color: #2c5a8a;
  font-weight: 700;
  margin-bottom: 6px;
}

/* ── Muskeldatenblatt ──────────────────────────────────────────────── */
.atm-muskel {
  background: #f4f7fa;
  border: 1px solid #ccd6e0;
  border-radius: 6px;
  padding: 14px 18px;
  margin: 16px 0;
}
.atm-muskel h4 {
  color: var(--cf-primary, #1e5b8a);
  margin: 0 0 10px;
  font-size: 1.05em;
  font-weight: 700;
}
.atm-muskel dl {
  margin: 0;
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 5px 12px;
}
.atm-muskel dt { font-weight: 600; color: #2c4a6b; }
.atm-muskel dd { margin: 0; }

/* ── Tabelle (atm-tabelle) ─────────────────────────────────────────── */
table.atm-tabelle { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 0.95em; }
table.atm-tabelle th,
table.atm-tabelle td { border: 1px solid #ccd6e0; padding: 8px 12px; text-align: left; vertical-align: top; }
table.atm-tabelle th { background: var(--cf-primary, #1e5b8a); color: #fff; font-weight: 600; }
table.atm-tabelle tr:nth-child(even) td { background: rgba(0,0,0,0.025); }

/* ── Lösung-Details (Aufgabe) ─────────────────────────────────────── */
details.atm-loesung {
  background: rgba(255,255,255,0.5);
  border: 1px solid var(--cf-aufgabe, var(--cf-tipp));
  border-radius: 4px;
  padding: 10px 14px;
  margin-top: 10px;
}
details.atm-loesung summary {
  cursor: pointer;
  font-weight: 600;
  color: var(--cf-aufgabe, var(--cf-tipp));
  list-style: none;
}
details.atm-loesung summary::-webkit-details-marker { display: none; }
details.atm-loesung summary::before { content: "Lösung anzeigen ▸"; }
details.atm-loesung[open] summary::before { content: "Lösung verbergen ▾"; }
details.atm-loesung[open] summary { margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid rgba(0,0,0,0.1); }

/* ── Text-Block ──────────────────────────────────────────────────── */
.sb-text { margin: 8px 0 16px; line-height: var(--cf-line-height); }
.sb-text p, .sb-text div { margin: 0 0 8px; }
.sb-text strong { font-weight: 600; }

/* ── YouTube-Embed ───────────────────────────────────────────────── */
.sb-video { position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; margin: 16px 0; border-radius: 8px; }
.sb-video iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }

/* ── Quiz-Blöcke ─────────────────────────────────────────────────── */
.sb-quiz { border-left: 4px solid var(--cf-quiz); background: var(--cf-quiz-bg); padding: 16px 20px; margin: 16px 0; border-radius: 0 8px 8px 0; }
.sb-q { margin: 0 0 14px; font-weight: 600; }
.sb-opts { display: flex; flex-direction: column; gap: 8px; }
.sb-opt {
  text-align: left; padding: 10px 14px;
  border: 1.5px solid var(--cf-quiz); border-radius: 6px;
  background: transparent; color: inherit;
  cursor: pointer; font-size: inherit; font-family: inherit;
  transition: background 0.15s;
}
.sb-opt:hover:not(:disabled) { background: rgba(0,0,0,0.06); }
.sb-opt--ok { background: rgba(34,197,94,0.2) !important; border-color: #22c55e !important; }
.sb-opt--err { background: rgba(239,68,68,0.15) !important; border-color: #ef4444 !important; }
.sb-opt:disabled { cursor: default; }
.sb-tf { flex-direction: row; }
.sb-tf .sb-opt { flex: 1; text-align: center; }
.sb-submit {
  margin-top: 10px; padding: 8px 20px;
  background: var(--cf-quiz); color: #fff;
  border: none; border-radius: 6px;
  cursor: pointer; font-size: inherit; font-family: inherit;
}
.sb-submit:hover:not(:disabled) { opacity: 0.85; }
.sb-submit:disabled { opacity: 0.5; cursor: default; }
.sb-fb { margin-top: 12px; padding: 8px 14px; border-radius: 6px; font-weight: 600; }
.sb-fb--ok  { background: rgba(34,197,94,0.2);  color: #16a34a; }
.sb-fb--err { background: rgba(239,68,68,0.15); color: #dc2626; }
[hidden] { display: none !important; }
.sb-blank {
  border: 1.5px solid var(--cf-quiz); border-radius: 4px;
  padding: 2px 8px; font-size: inherit; font-family: inherit;
  background: transparent; color: inherit;
}
.sb-blank--ok  { border-color: #22c55e; background: rgba(34,197,94,0.1); }
.sb-blank--err { border-color: #ef4444; background: rgba(239,68,68,0.1); }
select.sb-blank { padding: 4px 8px; cursor: pointer; min-width: 120px; }
.sb-match { width: 100%; border-collapse: collapse; }
.sb-match td { padding: 8px 12px; border-bottom: 1px solid rgba(0,0,0,0.08); }
.sb-match select { padding: 4px 8px; border: 1.5px solid var(--cf-quiz); border-radius: 4px; font-size: inherit; font-family: inherit; background: transparent; color: inherit; cursor: pointer; }
.sb-solution { margin-top: 12px; }
.sb-solution summary { cursor: pointer; color: var(--cf-quiz); font-weight: 600; }
.sb-hs-wrap { position: relative; display: block; }
.sb-hs-dot {
  position: absolute; transform: translate(-50%, -50%);
  width: 28px; height: 28px; border-radius: 50%;
  background: var(--cf-quiz); color: #fff;
  border: 2px solid rgba(255,255,255,0.7);
  cursor: pointer; font-size: 11px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  transition: transform 0.15s;
}
.sb-hs-dot:hover:not(:disabled) { transform: translate(-50%,-50%) scale(1.15); }
.sb-hs-dot.sb-opt--ok  { background: #22c55e; }
.sb-hs-dot.sb-opt--err { background: #ef4444; }
.sb-hs-dot:disabled { cursor: default; }

/* ── Nav-Buttons ─────────────────────────────────────────────────── */
.cf-nav-btn { color: var(--cf-nav-text); text-decoration: none; padding: 6px 16px; border-radius: 6px; background: rgba(255,255,255,0.12); transition: background 0.15s; }
.cf-nav-btn:hover { background: rgba(255,255,255,0.22); }
.cf-nav-progress { font-size: 13px; opacity: 0.8; }
`;

// ── Reader-CSS (nur Web-Export) ───────────────────────────────────────
const READER_CSS = `

/* ═══════════════════════════════════════════════════
   ScriptBase Web Reader
   ═══════════════════════════════════════════════════ */

/* ── Dark Mode ───────────────────────────────────── */
.sb-dark {
  --cf-bg:        #0f1117;
  --cf-text:      #dde1ec;
  --cf-nav-bg:    #141620;
  --cf-nav-text:  #dde1ec;
  --cf-merke-bg:  rgba(59,130,246,0.12);
  --cf-klinik-bg: rgba(239,68,68,0.12);
  --cf-tipp-bg:   rgba(245,158,11,0.12);
  --cf-quiz-bg:   rgba(139,92,246,0.12);
}

/* ── Light Mode overrides (helle Hintergrundfarben) ── */
.sb-light {
  --cf-merke-bg:  rgba(59,130,246,0.09);
  --cf-klinik-bg: rgba(239,68,68,0.09);
  --cf-tipp-bg:   rgba(245,158,11,0.09);
  --cf-quiz-bg:   rgba(139,92,246,0.09);
}

/* ── Base ────────────────────────────────────────── */
.sb-page {
  min-height: 100vh;
  background: var(--cf-bg);
  color: var(--cf-text);
  font-family: var(--cf-font);
  transition: background 0.25s, color 0.25s;
}

/* ── Progress Bar ────────────────────────────────── */
.sb-progress-bar {
  position: fixed; top: 0; left: 0; right: 0; height: 3px;
  background: rgba(128,128,128,0.15); z-index: 200;
}
.sb-progress-fill {
  height: 100%; width: 0;
  background: var(--cf-primary);
  transition: width 0.5s cubic-bezier(.4,0,.2,1);
}

/* ── Header ──────────────────────────────────────── */
.sb-header {
  position: sticky; top: 3px; z-index: 190;
  background: var(--cf-nav-bg);
  color: var(--cf-nav-text);
  border-bottom: 1px solid rgba(128,128,128,0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
.sb-header-inner {
  max-width: 1200px; margin: 0 auto;
  padding: 0 24px; height: 54px;
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
}
.sb-header-brand { font-weight: 700; font-size: 16px; letter-spacing: -0.02em; }
.sb-header-home {
  color: var(--cf-nav-text); text-decoration: none;
  font-weight: 600; font-size: 15px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 380px;
  opacity: 0.9;
}
.sb-header-home:hover { opacity: 1; }
.sb-header-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.sb-header-pager { font-size: 13px; opacity: 0.6; }

/* ── Icon-Buttons ────────────────────────────────── */
.sb-toc-toggle, .sb-theme-btn {
  background: rgba(255,255,255,0.1); border: none;
  color: var(--cf-nav-text);
  width: 34px; height: 34px; border-radius: 8px;
  cursor: pointer; font-size: 15px;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s;
}
.sb-toc-toggle:hover, .sb-theme-btn:hover { background: rgba(255,255,255,0.18); }

/* ── Body Layout ─────────────────────────────────── */
.sb-body {
  display: flex;
  max-width: 1200px; margin: 0 auto;
  min-height: calc(100vh - 57px);
}

/* ── TOC Sidebar ─────────────────────────────────── */
.sb-toc {
  width: 244px; flex-shrink: 0;
  padding: 28px 0;
  border-right: 1px solid rgba(128,128,128,0.1);
  position: sticky; top: 57px;
  height: calc(100vh - 57px); overflow-y: auto;
}
.sb-toc-inner { padding: 0 12px; }
.sb-toc-header {
  font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
  text-transform: uppercase; opacity: 0.38;
  margin-bottom: 10px; padding: 0 10px;
}
.sb-toc-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 10px; border-radius: 8px;
  color: inherit; text-decoration: none; font-size: 13.5px;
  margin-bottom: 2px; transition: background 0.12s; line-height: 1.35;
}
.sb-toc-item:hover { background: rgba(128,128,128,0.09); }
.sb-toc-item--active { background: rgba(128,128,128,0.12); font-weight: 600; }
.sb-toc-item--active .sb-toc-num { background: var(--cf-primary); color: #fff; }
.sb-toc-item--done   .sb-toc-num { background: #22c55e; color: #fff; }
.sb-toc-num {
  width: 22px; height: 22px; border-radius: 6px;
  background: rgba(128,128,128,0.14);
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; flex-shrink: 0;
  transition: background 0.15s;
}

/* ── Haupt-Inhaltsbereich ────────────────────────── */
.sb-main { flex: 1; min-width: 0; padding: 48px 52px 96px; }
.sb-article { max-width: var(--cf-max-width, 720px); margin: 0 auto; }
.sb-article h1 {
  font-size: clamp(22px, 4vw, 32px);
  margin-bottom: 32px; line-height: 1.2; letter-spacing: -0.02em;
}

/* ── Kapitel-Navigation ──────────────────────────── */
.sb-chapter-nav {
  display: flex; justify-content: space-between; align-items: center;
  max-width: var(--cf-max-width, 720px); margin: 64px auto 0;
  padding-top: 32px; border-top: 1px solid rgba(128,128,128,0.1);
}
.sb-nav-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 10px 22px; border-radius: 10px;
  background: var(--cf-primary); color: #fff;
  text-decoration: none; font-weight: 600; font-size: 14px;
  transition: opacity 0.15s, transform 0.12s;
}
.sb-nav-btn:hover { opacity: 0.88; transform: translateY(-1px); }
.sb-nav-btn--ghost {
  background: transparent; color: var(--cf-text);
  border: 1.5px solid rgba(128,128,128,0.2);
}
.sb-nav-btn--ghost:hover { background: rgba(128,128,128,0.07); transform: none; }

/* ── Index-Seite ─────────────────────────────────── */
.sb-index { max-width: 660px; margin: 0 auto; padding: 64px 24px 96px; }
.sb-index-hero { text-align: center; margin-bottom: 52px; }
.sb-index-title {
  font-size: clamp(28px, 6vw, 52px); font-weight: 800;
  color: var(--cf-primary); margin: 0 0 10px;
  line-height: 1.12; letter-spacing: -0.03em;
}
.sb-index-meta { font-size: 15px; opacity: 0.5; margin: 0; }

.sb-index-chapters { display: flex; flex-direction: column; gap: 8px; margin-bottom: 40px; }
.sb-ch-item {
  display: flex; align-items: center; gap: 16px;
  padding: 16px 20px; border-radius: 14px;
  background: rgba(128,128,128,0.05);
  border: 1.5px solid rgba(128,128,128,0.1);
  color: inherit; text-decoration: none;
  transition: border-color 0.15s, background 0.15s, transform 0.15s;
}
.sb-ch-item:hover {
  border-color: var(--cf-primary);
  background: rgba(128,128,128,0.09);
  transform: translateX(4px);
}
.sb-ch-item--done .sb-ch-num   { background: #22c55e; color: #fff; }
.sb-ch-item--done .sb-ch-arrow { color: #22c55e; }
.sb-ch-num {
  width: 38px; height: 38px; border-radius: 10px;
  background: rgba(128,128,128,0.12);
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 14px; flex-shrink: 0;
  transition: background 0.15s;
}
.sb-ch-info { flex: 1; min-width: 0; }
.sb-ch-title { font-weight: 600; font-size: 15px; }
.sb-ch-arrow { opacity: 0.3; font-size: 18px; transition: opacity 0.15s; }
.sb-ch-item:hover .sb-ch-arrow { opacity: 0.7; }

.sb-start-btn {
  display: block; text-align: center;
  padding: 15px 32px; border-radius: 12px;
  background: var(--cf-primary); color: #fff;
  text-decoration: none; font-weight: 700; font-size: 16px;
  transition: opacity 0.15s, transform 0.15s; letter-spacing: 0.01em;
}
.sb-start-btn:hover { opacity: 0.9; transform: translateY(-2px); }

/* ── Responsive ──────────────────────────────────── */
@media (max-width: 800px) {
  .sb-toc {
    position: fixed; left: 0; top: 57px; bottom: 0;
    width: 272px; height: calc(100vh - 57px);
    background: var(--cf-bg);
    border-right: 1px solid rgba(128,128,128,0.15);
    box-shadow: 4px 0 24px rgba(0,0,0,0.12);
    transform: translateX(-100%);
    transition: transform 0.25s cubic-bezier(.4,0,.2,1);
    z-index: 180;
  }
  .sb-toc--open { transform: translateX(0); }
  .sb-main { padding: 28px 20px 64px; }
}
@media (min-width: 801px) { .sb-toc-toggle { display: none; } }
`;

/**
 * CSS für den Web-Export (Reader). Kombiniert Theme-Vars + BASE_CSS + READER_CSS.
 * @param {object} course
 * @returns {string}
 */
export function generateWebCSS(course) {
  return generateCSS(course) + READER_CSS;
}
