/**
 * design/themes.js – Themes + Design-Panel
 * ==========================================
 * Definiert alle Themes (Sets von CSS Custom Properties).
 * Rendert das rechte Panel: Theme-Auswahl + Block-Palette + Farben.
 *
 * Neues Theme hinzufügen?
 *   → Hier ein neues Objekt in THEMES eintragen, fertig.
 *
 * Abhängigkeiten: core/state.js, core/block-types.js, design/renderer.js, config.js
 */

import * as State from "../core/state.js";
import { ALL_BLOCK_TYPES } from "../core/block-types.js";
import { applyPreview } from "./renderer.js";
import { DESIGN } from "../config.js";

// ── Theme-Definitionen ─────────────────────────────────────────────
export const THEMES = {
  standard: {
    name: "Standard",
    vars: {
      "--cf-primary":     "#1e5b8a",
      "--cf-bg":          "#ffffff",
      "--cf-text":        "#222222",
      "--cf-merke":       "#4f8ef7",
      "--cf-klinik":      "#f56565",
      "--cf-tipp":        "#3ecf8e",
      "--cf-quiz":        "#7c5af5",
      "--cf-nav-bg":      "#1e5b8a",
      "--cf-nav-text":    "#ffffff",
      "--cf-font":        "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      "--cf-font-size":   "15px",
      "--cf-line-height": "1.7",
      "--cf-max-width":   "880px",
    },
  },

  dunkel: {
    name: "Dunkel",
    vars: {
      "--cf-primary":     "#4f8ef7",
      "--cf-bg":          "#1a1a2e",
      "--cf-text":        "#e0e0e0",
      "--cf-merke":       "#4f8ef7",
      "--cf-klinik":      "#f56565",
      "--cf-tipp":        "#3ecf8e",
      "--cf-quiz":        "#9b7cfa",
      "--cf-nav-bg":      "#0f0f23",
      "--cf-nav-text":    "#ffffff",
      "--cf-font":        "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      "--cf-font-size":   "15px",
      "--cf-line-height": "1.7",
      "--cf-max-width":   "880px",
    },
  },

  // TODO: Weitere Themes (medizin, modern, klassisch...)
};

/**
 * Liefert ein Theme per ID, fällt auf Standard zurück.
 * @param {string} themeId
 * @returns {object}
 */
export function getTheme(themeId) {
  return THEMES[themeId] ?? THEMES[DESIGN.defaultTheme] ?? THEMES.standard;
}

/**
 * Liefert alle Themes als Array (für Dropdowns).
 * @returns {Array<{id, name, vars}>}
 */
export function getAllThemes() {
  return Object.entries(THEMES).map(([id, t]) => ({ id, ...t }));
}

// ── Panel-Rendering (rechte Spalte) ────────────────────────────────

/**
 * Initialisiert das rechte Panel.
 * Sektionen: Block-Palette, Theme-Auswahl, Farb-Picker.
 *
 * @param {HTMLElement} el
 */
export function initDesignPanel(el) {
  el.innerHTML = `
    <div class="panel-section" id="panel-blocks">
      <h3>Block hinzufügen</h3>
      <div class="block-palette" id="block-palette"></div>
    </div>

    <div class="panel-section" id="panel-theme">
      <h3>Theme</h3>
      <select id="theme-select" class="btn" style="width: 100%"></select>
    </div>

    <div class="panel-section" id="panel-colors">
      <h3>Farben</h3>
      <div id="color-pickers"></div>
    </div>
  `;

  renderBlockPalette();
  renderThemeSelect();
  renderColorPickers();

  State.subscribe(() => {
    renderThemeSelect();
    renderColorPickers();
    applyPreview();
  });
}

function renderBlockPalette() {
  const palette = document.getElementById("block-palette");
  // TODO: Klick auf Block-Typ → in aktuelles Kapitel einfügen
  // (sobald addBlock-Action im Editor implementiert ist)
  palette.innerHTML = ALL_BLOCK_TYPES.map(b => `
    <button class="btn btn-small" data-block-type="${b.type}" title="${b.label}"
            style="margin: 2px; min-width: 60px">
      ${b.icon} ${b.label}
    </button>
  `).join("");
}

function renderThemeSelect() {
  const select = document.getElementById("theme-select");
  if (!select) return;
  const course = State.getCourse();
  const currentTheme = course?.design?.theme ?? "standard";

  select.innerHTML = getAllThemes()
    .map(t => `<option value="${t.id}" ${t.id === currentTheme ? "selected" : ""}>${t.name}</option>`)
    .join("");

  select.onchange = e => {
    State.update(c => { c.design.theme = e.target.value; });
  };
}

function renderColorPickers() {
  const wrap = document.getElementById("color-pickers");
  if (!wrap) return;
  const course = State.getCourse();
  if (!course) { wrap.innerHTML = ""; return; }

  const theme = getTheme(course.design?.theme);
  const overrides = course.design?.overrides ?? {};

  // Nur Farben, keine font-Variables
  const colorVars = Object.keys(theme.vars).filter(k =>
    /^--cf-(primary|merke|klinik|tipp|quiz|nav-bg|nav-text|bg|text)$/.test(k)
  );

  wrap.innerHTML = colorVars.map(varName => {
    const current = overrides[varName] ?? theme.vars[varName];
    const label = varName.replace("--cf-", "");
    return `
      <label style="display:flex; align-items:center; gap:8px; margin-bottom:6px; font-size:12px">
        <input type="color" data-var="${varName}" value="${current}" style="width:32px; height:24px; border:none; padding:0">
        <span>${label}</span>
      </label>
    `;
  }).join("");

  wrap.querySelectorAll('input[type="color"]').forEach(input => {
    input.addEventListener("input", e => {
      const varName = e.target.dataset.var;
      const value = e.target.value;
      State.update(c => {
        if (!c.design) c.design = { theme: "standard", overrides: {} };
        if (!c.design.overrides) c.design.overrides = {};
        c.design.overrides[varName] = value;
      });
    });
  });
}
