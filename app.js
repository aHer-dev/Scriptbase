/**
 * app.js – Koordinator
 * =====================
 * Initialisiert alle UI-Module in der richtigen Reihenfolge,
 * verbindet Top-Bar und Status-Bar mit dem State.
 *
 * Hier KEINE Business-Logik – nur Verdrahtung.
 *
 * Abhängigkeiten: alle UI-Module + core/state.js + core/course.js
 */

import { APP } from "./config.js";
import * as State from "./core/state.js";
import { createCourse } from "./core/course.js";

import { initSidebar }      from "./sidebar/sidebar.js";
import { initEditor }       from "./editor/editor.js";
import { initDesignPanel, getAllThemes } from "./design/themes.js";
import { initImportButton } from "./importer/importer.js";
import { initPromptButton } from "./importer/prompt-dialog.js";
import { initExportButton }    from "./exporter/exporter.js";
import { initWebExportButton } from "./exporter/web-exporter.js";
import { saveProject, loadProjectFromFile } from "./core/project-io.js";
import { importZipFile } from "./importer/importer.js";
import { initFormatToolbar } from "./editor/format-toolbar.js";
import { getPaperStyle, setPaperStyle } from "./design/paper-style.js";
import { initReaderButton } from "./editor/reader.js";

// ── Top-Bar ────────────────────────────────────────────────────────
function initTopbar() {
  const topbar = document.getElementById("topbar");
  topbar.innerHTML = `
    <div class="topbar-brand">
      <svg class="logo-svg" width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
        <rect x="1"  y="1"  width="11" height="11" rx="3" fill="var(--ed-accent)" opacity="0.9"/>
        <rect x="14" y="1"  width="11" height="11" rx="3" fill="var(--ed-accent)" opacity="0.4"/>
        <rect x="1"  y="14" width="11" height="11" rx="3" fill="var(--ed-accent)" opacity="0.4"/>
        <rect x="14" y="14" width="11" height="11" rx="3" fill="var(--ed-accent)" opacity="0.15"/>
      </svg>
      <span class="logo-wordmark">ScriptBase</span>
    </div>
    <input type="text" class="topbar-title" id="course-title" placeholder="Kurstitel..." />
    <div class="topbar-actions">
      <button class="btn btn-icon btn-mode" id="btn-mode" title="Light Mode aktivieren">☀️</button>
      <button class="btn-theme-dot" id="btn-theme-dot" title="Design & Einstellungen"></button>
      <button class="btn" id="btn-prompt" title="KI-Prompt zum Kurs-Erstellen">✦ KI-Prompt</button>
      <button class="btn" id="btn-import" title="SCORM-ZIP oder .sbcourse Projekt laden">↑ Importieren</button>
      <button class="btn" id="btn-web-export">Web exportieren</button>
      <button class="btn btn-primary" id="btn-export">SCORM exportieren</button>
    </div>
  `;

  // Kurstitel-Input mit State verbinden
  const titleInput = document.getElementById("course-title");
  titleInput.addEventListener("input", e => {
    State.update(c => { c.title = e.target.value; });
  });

  // Bei State-Änderung: Titel im Input nachziehen
  State.subscribe(course => {
    if (course && document.activeElement !== titleInput) {
      titleInput.value = course.title || "";
    }
  });

  // Mode-Toggle
  const btnMode = document.getElementById("btn-mode");
  State.subscribeMode(mode => {
    btnMode.textContent = mode === "dark" ? "☀️" : "🌙";
    btnMode.title       = mode === "dark" ? "Light Mode aktivieren" : "Dark Mode aktivieren";
  });
  btnMode.addEventListener("click", () => {
    State.setMode(State.getMode() === "dark" ? "light" : "dark");
  });

  // Buttons verdrahten
  initPromptButton(document.getElementById("btn-prompt"));
  initImportButton(document.getElementById("btn-import"));
  initReaderButton(topbar);
  initWebExportButton(document.getElementById("btn-web-export"));
  initExportButton(document.getElementById("btn-export"));
}

// ── Layout-Einstellungen (Canvas-Breite + Schriftgröße) ────────────
function initLayoutSettings() {
  const width    = parseInt(localStorage.getItem("canvasWidth")    || "880");
  const fontSize = parseInt(localStorage.getItem("editorFontSize") || "14");
  applyCanvasWidth(width);
  applyEditorFontSize(fontSize);
}

function applyCanvasWidth(px) {
  document.documentElement.style.setProperty("--ed-canvas-width", px + "px");
  localStorage.setItem("canvasWidth", px);
}

function applyEditorFontSize(px) {
  document.documentElement.style.setProperty("--ed-base-size", px + "px");
  localStorage.setItem("editorFontSize", px);
}

// ── Options-Panel (floating, über Statusbar) ───────────────────────
function initOptionsPanel() {
  const savedWidth    = parseInt(localStorage.getItem("canvasWidth")    || "880");
  const savedFontSize = parseInt(localStorage.getItem("editorFontSize") || "14");

  const panel = document.createElement("div");
  panel.id = "options-panel";
  panel.className = "options-panel";
  panel.hidden = true;
  panel.innerHTML = `
    <div class="options-header">Einstellungen</div>
    <div class="options-section">
      <div class="options-section-title">Theme</div>
      <div class="theme-grid" id="options-theme-grid"></div>
    </div>
    <div class="options-section">
      <div class="options-section-title">Seiten-Stil</div>
      <div class="paper-style-toggle" id="paper-style-toggle">
        <button class="paper-style-btn" data-style="card">
          <i data-lucide="layers" class="lucide-icon"></i>Karte
        </button>
        <button class="paper-style-btn" data-style="flat">
          <i data-lucide="layout-template" class="lucide-icon"></i>Flat
        </button>
      </div>
    </div>
    <div class="options-section">
      <div class="options-section-title">Layout</div>
      <div class="layout-slider-row">
        <div>
          <div class="layout-slider-label">
            Canvas-Breite
            <span id="opt-width-val">${savedWidth}px</span>
          </div>
          <input type="range" class="layout-range" id="opt-width"
                 min="560" max="1200" step="20" value="${savedWidth}">
        </div>
        <div>
          <div class="layout-slider-label">
            Schriftgröße
            <span id="opt-font-val">${savedFontSize}px</span>
          </div>
          <input type="range" class="layout-range" id="opt-font"
                 min="12" max="18" step="1" value="${savedFontSize}">
        </div>
      </div>
    </div>
  `;
  document.getElementById("app").appendChild(panel);

  function renderThemes() {
    const grid = document.getElementById("options-theme-grid");
    if (!grid) return;
    const course = State.getCourse();
    const current = course?.design?.theme ?? "akademie";
    grid.innerHTML = getAllThemes().map(t => `
      <button class="theme-card ${t.id === current ? "theme-card--active" : ""}"
              data-theme="${t.id}">
        <span class="theme-card-swatch" style="background:${t.vars["--cf-primary"]}"></span>
        <span class="theme-card-label">${t.emoji} ${t.name}</span>
      </button>
    `).join("");
    grid.querySelectorAll(".theme-card").forEach(btn => {
      btn.addEventListener("click", () => {
        State.update(c => { c.design.theme = btn.dataset.theme; });
      });
    });
  }

  // Beim State-Update aktiven Theme-Card neu markieren
  State.subscribe(() => { if (!panel.hidden) renderThemes(); });

  // Paper-Stil Toggle verdrahten
  function syncPaperBtns() {
    panel.querySelectorAll(".paper-style-btn").forEach(b =>
      b.classList.toggle("active", b.dataset.style === getPaperStyle())
    );
  }
  panel.querySelectorAll(".paper-style-btn").forEach(btn => {
    btn.addEventListener("click", () => { setPaperStyle(btn.dataset.style); syncPaperBtns(); });
  });
  syncPaperBtns();
  window.lucide?.createIcons();

  // Slider verdrahten
  panel.querySelector("#opt-width").addEventListener("input", e => {
    const v = parseInt(e.target.value);
    panel.querySelector("#opt-width-val").textContent = v + "px";
    applyCanvasWidth(v);
  });

  panel.querySelector("#opt-font").addEventListener("input", e => {
    const v = parseInt(e.target.value);
    panel.querySelector("#opt-font-val").textContent = v + "px";
    applyEditorFontSize(v);
  });

  return { panel, renderThemes };
}

// ── Status-Bar ─────────────────────────────────────────────────────
function initStatusbar() {
  const { panel: optionsPanel, renderThemes } = initOptionsPanel();

  const statusbar = document.getElementById("statusbar");
  statusbar.innerHTML = `
    <span id="status-text">Bereit</span>
    <button class="btn-project-save" id="btn-project-save" title="Projekt als .sbcourse speichern">↓ Projekt</button>
  `;
  document.getElementById("btn-project-save").addEventListener("click", saveProject);

  const statusText = document.getElementById("status-text");
  State.subscribe(course => {
    if (!course) {
      statusText.textContent = "Kein Kurs geladen";
      return;
    }
    const n = course.chapters?.length ?? 0;
    statusText.textContent = `${n} Kapitel · zuletzt gespeichert: ${formatTime(course.updatedAt)}`;
  });

  // Farbpunkt: Panel auf-/zuklappen
  const btnDot = document.getElementById("btn-theme-dot");
  btnDot.addEventListener("click", e => {
    e.stopPropagation();
    const opening = optionsPanel.hidden;
    optionsPanel.hidden = !opening;
    btnDot.classList.toggle("btn-theme-dot--open", !opening);
    if (opening) renderThemes();
  });

  // Klick außerhalb schließt das Panel
  document.addEventListener("click", e => {
    if (!optionsPanel.contains(e.target) && e.target !== btnDot) {
      optionsPanel.hidden = true;
      btnDot.classList.remove("btn-theme-dot--open");
    }
  });
}

function formatTime(iso) {
  if (!iso) return "–";
  return new Date(iso).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

// ── App-Start ──────────────────────────────────────────────────────
// ── Undo / Redo (Ctrl+Z / Ctrl+Y) ─────────────────────────────────
function initUndoRedo() {
  document.addEventListener("keydown", e => {
    if (e.target.isContentEditable) return;
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
    const ctrl = e.ctrlKey || e.metaKey;
    if (ctrl && e.key === "z" && !e.shiftKey) {
      e.preventDefault();
      const ok = State.undo();
      if (ok) showUndoToast("Rückgängig");
    } else if (ctrl && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
      e.preventDefault();
      const ok = State.redo();
      if (ok) showUndoToast("Wiederherstellen");
    }
  });
}

let toastTimer = null;
function showUndoToast(label) {
  let toast = document.getElementById("undo-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "undo-toast";
    toast.className = "undo-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = label;
  toast.classList.add("undo-toast--visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("undo-toast--visible"), 1400);
}

// ── Drag & Drop (global) ───────────────────────────────────────────
function initDragDrop() {
  const overlay = document.createElement("div");
  overlay.id = "drop-overlay";
  overlay.className = "drop-overlay";
  overlay.innerHTML = `
    <div class="drop-overlay__box">
      <div class="drop-overlay__icon">↓</div>
      <div class="drop-overlay__text" id="drop-overlay-text">Datei loslassen zum Laden</div>
    </div>`;
  document.body.appendChild(overlay);

  let dragCounter = 0;

  document.addEventListener("dragenter", e => {
    const file = e.dataTransfer?.items?.[0];
    if (!file) return;
    dragCounter++;
    const name = (e.dataTransfer.items[0]?.type || "").toLowerCase();
    const isSbcourse = [...(e.dataTransfer.items || [])].some(
      item => item.kind === "file"
    );
    if (!isSbcourse) return;
    overlay.classList.add("drop-overlay--active");
  });

  document.addEventListener("dragleave", e => {
    dragCounter--;
    if (dragCounter <= 0) {
      dragCounter = 0;
      overlay.classList.remove("drop-overlay--active");
    }
  });

  document.addEventListener("dragover", e => e.preventDefault());

  document.addEventListener("drop", async e => {
    e.preventDefault();
    dragCounter = 0;
    overlay.classList.remove("drop-overlay--active");

    const file = e.dataTransfer?.files?.[0];
    if (!file) return;

    if (file.name.endsWith(".sbcourse")) {
      await loadProjectFromFile(file);
    } else if (file.name.endsWith(".zip")) {
      await importZipFile(file);
    }
  });
}

function initApp() {
  console.log(`${APP.name} v${APP.version} startet`);

  // Reihenfolge wichtig: Erst UI aufbauen, dann State laden
  initLayoutSettings();
  initTopbar();
  initSidebar(document.getElementById("sidebar"));
  initEditor(document.getElementById("editor"));
  initDesignPanel(document.getElementById("panel"));
  initStatusbar();

  initUndoRedo();
  initFormatToolbar();
  initDragDrop();

  // Gespeicherten Kurs laden – wenn keiner da ist, leeren Kurs anlegen
  const loaded = State.loadFromStorage();
  if (!loaded) {
    State.setCourse(createCourse("Mein erster Kurs"));
    console.log("Kein gespeicherter Kurs gefunden – neuer Kurs angelegt");
  } else {
    console.log("Gespeicherten Kurs geladen:", loaded.title);
  }
}

initApp();
