/**
 * design/themes.js – Themes + Design-Panel
 * ==========================================
 * Jedes Theme hat zwei Teile:
 *   vars       → --cf-* Variablen für den SCORM-Export
 *   editorVars → --ed-* Variablen für die Editor-App selbst
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
import { addBlockToActiveChapter } from "../editor/editor.js";
import { t } from "../i18n.js";

// ── Hilfsfunktion: Editor-Variablen für dunkle Themes ─────────────
function darkEditor({ accent, accentGlow, accentSoft, bg, bgGrad, text, textMuted, blob1, blob2, blob3 }) {
  const glass       = "rgba(255,255,255,0.055)";
  const glassBorder = "rgba(255,255,255,0.09)";
  return {
    "--ed-bg-grad":       bgGrad,
    "--ed-accent":        accent,
    "--ed-accent-glow":   accentGlow,
    "--ed-accent-soft":   accentSoft,
    "--ed-accent-dim":    `color-mix(in srgb, ${accent} 15%, transparent)`,
    "--ed-accent-border": `color-mix(in srgb, ${accent} 30%, transparent)`,
    "--ed-glass":         glass,
    "--ed-glass-border":  glassBorder,
    "--ed-glass-hover":   "rgba(255,255,255,0.09)",
    "--ed-text":          text,
    "--ed-text-muted":    textMuted,
    "--ed-topbar":        `color-mix(in srgb, ${bg} 90%, black)`,
    "--ed-sidebar":       `color-mix(in srgb, ${bg} 78%, black)`,
    "--ed-panel":         `color-mix(in srgb, ${bg} 78%, black)`,
    "--ed-statusbar":     `color-mix(in srgb, ${bg} 92%, black)`,
    "--ed-paper":         "rgba(255,255,255,0.05)",
    "--ed-paper-border":  "rgba(255,255,255,0.08)",
    "--ed-paper-shadow":  "0 20px 80px rgba(0,0,0,0.5)",
    "--ed-paper-radius":  "18px",
    "--ed-input":         "rgba(255,255,255,0.07)",
    "--ed-hover":         accentSoft,
    "--ed-active":        `color-mix(in srgb, ${accent} 22%, transparent)`,
    "--ed-blob1":         blob1,
    "--ed-blob2":         blob2,
    "--ed-blob3":         blob3,
  };
}

// ── Hilfsfunktion: Editor-Variablen für helle Themes ──────────────
function lightEditor({ accent, accentGlow, accentSoft, bg, bgGrad, text, textMuted, blob1, blob2, blob3 }) {
  const glass       = "rgba(0,0,0,0.04)";
  const glassBorder = "rgba(0,0,0,0.09)";
  return {
    "--ed-bg-grad":       bgGrad,
    "--ed-accent":        accent,
    "--ed-accent-glow":   accentGlow,
    "--ed-accent-soft":   accentSoft,
    "--ed-accent-dim":    `color-mix(in srgb, ${accent} 15%, transparent)`,
    "--ed-accent-border": `color-mix(in srgb, ${accent} 30%, transparent)`,
    "--ed-glass":         glass,
    "--ed-glass-border":  glassBorder,
    "--ed-glass-hover":   "rgba(0,0,0,0.07)",
    "--ed-text":          text,
    "--ed-text-muted":    textMuted,
    "--ed-topbar":        `color-mix(in srgb, ${bg} 88%, #999)`,
    "--ed-sidebar":       `color-mix(in srgb, ${bg} 80%, #bbb)`,
    "--ed-panel":         `color-mix(in srgb, ${bg} 80%, #bbb)`,
    "--ed-statusbar":     `color-mix(in srgb, ${bg} 90%, #999)`,
    "--ed-paper":         "rgba(255,255,255,0.85)",
    "--ed-paper-border":  "rgba(0,0,0,0.08)",
    "--ed-paper-shadow":  "0 8px 32px rgba(0,0,0,0.08)",
    "--ed-paper-radius":  "14px",
    "--ed-input":         "rgba(0,0,0,0.05)",
    "--ed-hover":         accentSoft,
    "--ed-active":        `color-mix(in srgb, ${accent} 15%, transparent)`,
    "--ed-blob1":         blob1,
    "--ed-blob2":         blob2,
    "--ed-blob3":         blob3,
  };
}

// ── Theme-Definitionen ─────────────────────────────────────────────
export const THEMES = {

  akademie: {
    name: "Akademie",
    emoji: "🎓",
    dark: darkEditor({
      accent:      "#f5a623",
      accentGlow:  "rgba(245,166,35,0.38)",
      accentSoft:  "rgba(245,166,35,0.14)",
      bg:          "#111008",
      bgGrad:      "linear-gradient(145deg,#111008 0%,#1a1500 60%,#0e0c04 100%)",
      text:        "#fdf6e3",
      textMuted:   "rgba(253,246,227,0.42)",
      blob1:       "rgba(245,166,35,0.18)",
      blob2:       "rgba(220,80,20,0.10)",
      blob3:       "rgba(255,200,50,0.10)",
    }),
    light: lightEditor({
      accent:      "#c97d0d",
      accentGlow:  "rgba(201,125,13,0.28)",
      accentSoft:  "rgba(201,125,13,0.11)",
      bg:          "#fdf8ed",
      bgGrad:      "linear-gradient(145deg,#fdf8ed,#faf3df,#fdf6e8)",
      text:        "#1a1200",
      textMuted:   "rgba(26,18,0,0.50)",
      blob1:       "rgba(245,166,35,0.09)",
      blob2:       "rgba(220,80,20,0.05)",
      blob3:       "rgba(255,200,50,0.06)",
    }),
    vars: {
      "--cf-primary":     "#e07b00",
      "--cf-bg":          "#fffbf0",
      "--cf-text":        "#1a1200",
      "--cf-merke":       "#4f8ef7",
      "--cf-merke-bg":    "rgba(79,142,247,0.10)",
      "--cf-klinik":      "#f56565",
      "--cf-klinik-bg":   "rgba(245,101,101,0.10)",
      "--cf-tipp":        "#3ecf8e",
      "--cf-tipp-bg":     "rgba(62,207,142,0.10)",
      "--cf-quiz":        "#7c5af5",
      "--cf-quiz-bg":     "rgba(124,90,245,0.10)",
      "--cf-nav-bg":      "#e07b00",
      "--cf-nav-text":    "#ffffff",
      "--cf-font":        "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      "--cf-font-size":   "15px",
      "--cf-line-height": "1.7",
      "--cf-max-width":   "880px",
    },
  },

  ocean: {
    name: "Ocean",
    emoji: "🌊",
    dark: darkEditor({
      accent:      "#4d9fff",
      accentGlow:  "rgba(77,159,255,0.35)",
      accentSoft:  "rgba(77,159,255,0.13)",
      bg:          "#070d1a",
      bgGrad:      "linear-gradient(145deg,#070d1a,#0c1830 60%,#081220)",
      text:        "#e4eeff",
      textMuted:   "rgba(228,238,255,0.45)",
      blob1:       "rgba(50,130,255,0.18)",
      blob2:       "rgba(0,180,255,0.10)",
      blob3:       "rgba(100,50,255,0.12)",
    }),
    light: lightEditor({
      accent:      "#1a6fd4",
      accentGlow:  "rgba(26,111,212,0.25)",
      accentSoft:  "rgba(26,111,212,0.11)",
      bg:          "#f0f7ff",
      bgGrad:      "linear-gradient(145deg,#f0f7ff,#e8f2ff,#f0f8ff)",
      text:        "#0a1e3d",
      textMuted:   "rgba(10,30,61,0.50)",
      blob1:       "rgba(50,130,255,0.08)",
      blob2:       "rgba(0,180,255,0.05)",
      blob3:       "rgba(100,50,255,0.06)",
    }),
    vars: {
      "--cf-primary":     "#1a6fd4",
      "--cf-bg":          "#f0f7ff",
      "--cf-text":        "#0a1e3d",
      "--cf-merke":       "#4d9fff",
      "--cf-merke-bg":    "rgba(77,159,255,0.10)",
      "--cf-klinik":      "#f56565",
      "--cf-klinik-bg":   "rgba(245,101,101,0.10)",
      "--cf-tipp":        "#3ecf8e",
      "--cf-tipp-bg":     "rgba(62,207,142,0.10)",
      "--cf-quiz":        "#7c5af5",
      "--cf-quiz-bg":     "rgba(124,90,245,0.10)",
      "--cf-nav-bg":      "#1a6fd4",
      "--cf-nav-text":    "#ffffff",
      "--cf-font":        "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      "--cf-font-size":   "15px",
      "--cf-line-height": "1.7",
      "--cf-max-width":   "880px",
    },
  },

  aurora: {
    name: "Aurora",
    emoji: "🌌",
    dark: darkEditor({
      accent:      "#b06fff",
      accentGlow:  "rgba(176,111,255,0.35)",
      accentSoft:  "rgba(176,111,255,0.13)",
      bg:          "#0a0614",
      bgGrad:      "linear-gradient(145deg,#0a0614,#130820 60%,#0c0a1e)",
      text:        "#f0e8ff",
      textMuted:   "rgba(240,232,255,0.40)",
      blob1:       "rgba(140,70,255,0.20)",
      blob2:       "rgba(255,80,200,0.12)",
      blob3:       "rgba(80,100,255,0.14)",
    }),
    light: lightEditor({
      accent:      "#7c3aed",
      accentGlow:  "rgba(124,58,237,0.25)",
      accentSoft:  "rgba(124,58,237,0.11)",
      bg:          "#f9f5ff",
      bgGrad:      "linear-gradient(145deg,#f9f5ff,#f3eeff,#f8f4ff)",
      text:        "#1e0940",
      textMuted:   "rgba(30,9,64,0.50)",
      blob1:       "rgba(140,70,255,0.08)",
      blob2:       "rgba(255,80,200,0.05)",
      blob3:       "rgba(80,100,255,0.06)",
    }),
    vars: {
      "--cf-primary":     "#7c3aed",
      "--cf-bg":          "#f9f5ff",
      "--cf-text":        "#1e0940",
      "--cf-merke":       "#b06fff",
      "--cf-merke-bg":    "rgba(176,111,255,0.10)",
      "--cf-klinik":      "#f56565",
      "--cf-klinik-bg":   "rgba(245,101,101,0.10)",
      "--cf-tipp":        "#3ecf8e",
      "--cf-tipp-bg":     "rgba(62,207,142,0.10)",
      "--cf-quiz":        "#f472b6",
      "--cf-quiz-bg":     "rgba(244,114,182,0.10)",
      "--cf-nav-bg":      "#7c3aed",
      "--cf-nav-text":    "#ffffff",
      "--cf-font":        "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      "--cf-font-size":   "15px",
      "--cf-line-height": "1.7",
      "--cf-max-width":   "880px",
    },
  },

  ember: {
    name: "Ember",
    emoji: "🔥",
    dark: darkEditor({
      accent:      "#ff7730",
      accentGlow:  "rgba(255,119,48,0.35)",
      accentSoft:  "rgba(255,119,48,0.13)",
      bg:          "#130600",
      bgGrad:      "linear-gradient(145deg,#130600,#1e0800 60%,#100400)",
      text:        "#fff2ec",
      textMuted:   "rgba(255,242,236,0.40)",
      blob1:       "rgba(255,100,20,0.20)",
      blob2:       "rgba(255,50,0,0.12)",
      blob3:       "rgba(255,180,0,0.10)",
    }),
    light: lightEditor({
      accent:      "#c2410c",
      accentGlow:  "rgba(194,65,12,0.25)",
      accentSoft:  "rgba(194,65,12,0.11)",
      bg:          "#fff7f0",
      bgGrad:      "linear-gradient(145deg,#fff7f0,#fef2e8,#fff5ee)",
      text:        "#3d0e00",
      textMuted:   "rgba(61,14,0,0.50)",
      blob1:       "rgba(255,100,20,0.08)",
      blob2:       "rgba(255,50,0,0.05)",
      blob3:       "rgba(255,180,0,0.05)",
    }),
    vars: {
      "--cf-primary":     "#c2410c",
      "--cf-bg":          "#fff7f0",
      "--cf-text":        "#3d0e00",
      "--cf-merke":       "#4f8ef7",
      "--cf-merke-bg":    "rgba(79,142,247,0.10)",
      "--cf-klinik":      "#ff7730",
      "--cf-klinik-bg":   "rgba(255,119,48,0.10)",
      "--cf-tipp":        "#f59e0b",
      "--cf-tipp-bg":     "rgba(245,158,11,0.10)",
      "--cf-quiz":        "#7c5af5",
      "--cf-quiz-bg":     "rgba(124,90,245,0.10)",
      "--cf-nav-bg":      "#c2410c",
      "--cf-nav-text":    "#ffffff",
      "--cf-font":        "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      "--cf-font-size":   "15px",
      "--cf-line-height": "1.7",
      "--cf-max-width":   "880px",
    },
  },

  forest: {
    name: "Forest",
    emoji: "🌿",
    dark: darkEditor({
      accent:      "#34d978",
      accentGlow:  "rgba(52,217,120,0.35)",
      accentSoft:  "rgba(52,217,120,0.13)",
      bg:          "#030e07",
      bgGrad:      "linear-gradient(145deg,#030e07,#071a0d 60%,#040c06)",
      text:        "#e8fff2",
      textMuted:   "rgba(232,255,242,0.40)",
      blob1:       "rgba(30,200,90,0.18)",
      blob2:       "rgba(0,180,80,0.10)",
      blob3:       "rgba(50,220,150,0.10)",
    }),
    light: lightEditor({
      accent:      "#15803d",
      accentGlow:  "rgba(21,128,61,0.25)",
      accentSoft:  "rgba(21,128,61,0.11)",
      bg:          "#f0fdf4",
      bgGrad:      "linear-gradient(145deg,#f0fdf4,#e8fded,#f0fdf5)",
      text:        "#052010",
      textMuted:   "rgba(5,32,16,0.50)",
      blob1:       "rgba(30,200,90,0.08)",
      blob2:       "rgba(0,180,80,0.04)",
      blob3:       "rgba(50,220,150,0.05)",
    }),
    vars: {
      "--cf-primary":     "#15803d",
      "--cf-bg":          "#f0fdf4",
      "--cf-text":        "#052010",
      "--cf-merke":       "#34d978",
      "--cf-merke-bg":    "rgba(52,217,120,0.10)",
      "--cf-klinik":      "#f56565",
      "--cf-klinik-bg":   "rgba(245,101,101,0.10)",
      "--cf-tipp":        "#f59e0b",
      "--cf-tipp-bg":     "rgba(245,158,11,0.10)",
      "--cf-quiz":        "#7c5af5",
      "--cf-quiz-bg":     "rgba(124,90,245,0.10)",
      "--cf-nav-bg":      "#15803d",
      "--cf-nav-text":    "#ffffff",
      "--cf-font":        "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      "--cf-font-size":   "15px",
      "--cf-line-height": "1.7",
      "--cf-max-width":   "880px",
    },
  },

  sakura: {
    name: "Sakura",
    emoji: "🌸",
    dark: darkEditor({
      accent:      "#f472b6",
      accentGlow:  "rgba(244,114,182,0.35)",
      accentSoft:  "rgba(244,114,182,0.13)",
      bg:          "#140810",
      bgGrad:      "linear-gradient(145deg,#140810,#1e0c18 60%,#100610)",
      text:        "#ffe8f4",
      textMuted:   "rgba(255,232,244,0.42)",
      blob1:       "rgba(240,100,180,0.20)",
      blob2:       "rgba(200,80,240,0.12)",
      blob3:       "rgba(255,160,200,0.10)",
    }),
    light: lightEditor({
      accent:      "#db2777",
      accentGlow:  "rgba(219,39,119,0.25)",
      accentSoft:  "rgba(219,39,119,0.11)",
      bg:          "#fff0f7",
      bgGrad:      "linear-gradient(145deg,#fff0f7,#ffe8f4,#fff2f8)",
      text:        "#3d0a22",
      textMuted:   "rgba(61,10,34,0.50)",
      blob1:       "rgba(240,100,180,0.08)",
      blob2:       "rgba(200,80,240,0.05)",
      blob3:       "rgba(255,160,200,0.05)",
    }),
    vars: {
      "--cf-primary":     "#db2777",
      "--cf-bg":          "#fff0f8",
      "--cf-text":        "#3d0a22",
      "--cf-merke":       "#4f8ef7",
      "--cf-merke-bg":    "rgba(79,142,247,0.10)",
      "--cf-klinik":      "#f472b6",
      "--cf-klinik-bg":   "rgba(244,114,182,0.10)",
      "--cf-tipp":        "#3ecf8e",
      "--cf-tipp-bg":     "rgba(62,207,142,0.10)",
      "--cf-quiz":        "#7c5af5",
      "--cf-quiz-bg":     "rgba(124,90,245,0.10)",
      "--cf-nav-bg":      "#db2777",
      "--cf-nav-text":    "#ffffff",
      "--cf-font":        "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      "--cf-font-size":   "15px",
      "--cf-line-height": "1.7",
      "--cf-max-width":   "880px",
    },
  },

  steel: {
    name: "Steel",
    emoji: "⚙️",
    dark: darkEditor({
      accent:      "#64d8f0",
      accentGlow:  "rgba(100,216,240,0.32)",
      accentSoft:  "rgba(100,216,240,0.12)",
      bg:          "#08090e",
      bgGrad:      "linear-gradient(145deg,#08090e,#0e1018 60%,#090a10)",
      text:        "#dff6ff",
      textMuted:   "rgba(223,246,255,0.42)",
      blob1:       "rgba(60,200,240,0.16)",
      blob2:       "rgba(40,120,200,0.12)",
      blob3:       "rgba(120,200,255,0.10)",
    }),
    light: lightEditor({
      accent:      "#0284c7",
      accentGlow:  "rgba(2,132,199,0.25)",
      accentSoft:  "rgba(2,132,199,0.11)",
      bg:          "#f0f9ff",
      bgGrad:      "linear-gradient(145deg,#f0f9ff,#e8f5ff,#f0f8ff)",
      text:        "#072840",
      textMuted:   "rgba(7,40,64,0.50)",
      blob1:       "rgba(60,200,240,0.07)",
      blob2:       "rgba(40,120,200,0.05)",
      blob3:       "rgba(120,200,255,0.05)",
    }),
    vars: {
      "--cf-primary":     "#0284c7",
      "--cf-bg":          "#f0f9ff",
      "--cf-text":        "#072840",
      "--cf-merke":       "#64d8f0",
      "--cf-merke-bg":    "rgba(100,216,240,0.10)",
      "--cf-klinik":      "#f56565",
      "--cf-klinik-bg":   "rgba(245,101,101,0.10)",
      "--cf-tipp":        "#3ecf8e",
      "--cf-tipp-bg":     "rgba(62,207,142,0.10)",
      "--cf-quiz":        "#7c5af5",
      "--cf-quiz-bg":     "rgba(124,90,245,0.10)",
      "--cf-nav-bg":      "#0284c7",
      "--cf-nav-text":    "#ffffff",
      "--cf-font":        "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      "--cf-font-size":   "15px",
      "--cf-line-height": "1.7",
      "--cf-max-width":   "880px",
    },
  },
};

/**
 * Liefert ein Theme per ID, fällt auf Akademie zurück.
 * @param {string} themeId
 * @returns {object}
 */
export function getTheme(themeId) {
  return THEMES[themeId] ?? THEMES[DESIGN.defaultTheme] ?? THEMES.akademie;
}

/**
 * Liefert alle Themes als Array (für Dropdowns).
 * @returns {Array<{id, name, emoji, vars, editorVars}>}
 */
export function getAllThemes() {
  return Object.entries(THEMES).map(([id, t]) => ({ id, ...t }));
}

// ── Panel-Rendering (rechte Spalte) ────────────────────────────────

/**
 * Initialisiert das rechte Panel.
 * @param {HTMLElement} el
 */
export function initDesignPanel(el) {
  const groups = [
    { key: "inhalt",      label: () => t('editor.group.inhalt') },
    { key: "lernbox",     label: () => t('editor.group.lernbox') },
    { key: "interaktion", label: () => t('editor.group.interaktion') },
  ];

  el.innerHTML = groups.map(g => `
    <div class="panel-section">
      <h3>${g.label()}</h3>
      <div class="block-palette" data-group="${g.key}"></div>
    </div>
  `).join("");

  groups.forEach(g => {
    const palette = el.querySelector(`[data-group="${g.key}"]`);
    ALL_BLOCK_TYPES.filter(b => b.group === g.key).forEach(b => {
      const label = t(`block.${b.type}`) || b.label;
      const btn = document.createElement("button");
      btn.className = "btn btn-small";
      btn.title     = label;
      btn.innerHTML = `<i data-lucide="${b.icon}" class="lucide-icon"></i>${label}`;
      btn.addEventListener("click", () => addBlockToActiveChapter(b.type));
      palette.appendChild(btn);
    });
  });
  window.lucide?.createIcons();

  State.subscribe(() => applyPreview());
  State.subscribeMode(() => applyPreview());
}
