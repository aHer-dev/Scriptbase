/**
 * editor/reader.js – Reader-Modus
 * =================================
 * Vollbild-Overlay das den Kurs interaktiv durcharbeiten lässt.
 * Alle Quiz-Typen sind voll funktionsfähig (kein SCORM-Tracking benötigt).
 *
 * Abhängigkeiten: core/state.js, exporter/block-to-html.js,
 *                 exporter/quiz-runtime.js, design/renderer.js,
 *                 design/themes.js, core/utils.js
 */

import * as State       from "../core/state.js";
import { blockToHTML }  from "../exporter/block-to-html.js";
import { generateWebCSS, applyPreview } from "../design/renderer.js";
import { getAllThemes }  from "../design/themes.js";
import { QUIZ_RUNTIME_JS } from "../exporter/quiz-runtime.js";
import { escapeHTML }   from "../core/utils.js";

let overlay      = null;
let currentIdx   = 0;
let fontSize     = parseInt(localStorage.getItem("readerFontSize") || "16");

// ── Einstiegspunkt ────────────────────────────────────────────────────

export function initReaderButton(topbarEl) {
  const btn = document.createElement("button");
  btn.className   = "reader-brand-btn";
  btn.id          = "btn-reader";
  btn.title       = "Reader-Modus: Kurs interaktiv durcharbeiten (Esc = zurück)";
  btn.innerHTML   = `<i data-lucide="book-open" class="reader-brand-icon"></i><span>Reader</span>`;
  btn.addEventListener("click", openReader);

  // Direkt nach dem Brand-Block einfügen (links neben dem Titel-Input)
  const brand = topbarEl.querySelector(".topbar-brand");
  brand ? brand.after(btn) : topbarEl.prepend(btn);

  window.lucide?.createIcons({ nodes: [btn] });
  return btn;
}

// ── Overlay öffnen ────────────────────────────────────────────────────

function openReader() {
  const course = State.getCourse();
  if (!course?.chapters?.length) { alert("Kein Kurs geladen."); return; }

  // Startet am aktuell aktiven Kapitel
  const activeId = State.getActiveChapterId?.() ?? null;
  currentIdx = activeId
    ? Math.max(0, course.chapters.findIndex(ch => ch.id === activeId))
    : 0;

  overlay = document.createElement("div");
  overlay.className = "reader-overlay";
  overlay.innerHTML = `
    <div class="reader-bar" id="reader-bar">
      <button class="reader-exit" id="reader-exit" title="Zurück zum Editor (Esc)">
        ← <span class="reader-exit-label">Editor</span>
      </button>
      <div class="reader-nav">
        <button class="reader-nav-btn" id="reader-prev" title="Vorheriges Kapitel (←)">‹</button>
        <span class="reader-pos" id="reader-pos"></span>
        <button class="reader-nav-btn" id="reader-next" title="Nächstes Kapitel (→)">›</button>
      </div>
      <div class="reader-controls">
        <div class="reader-themes" id="reader-themes"></div>
        <div class="reader-font-ctrl">
          <button class="reader-font-btn" id="reader-font-sm" title="Schrift kleiner">A−</button>
          <button class="reader-font-btn" id="reader-font-lg" title="Schrift größer">A+</button>
        </div>
        <button class="reader-font-btn reader-mode-btn" id="reader-mode-btn" title="Dark / Light Mode wechseln"></button>
      </div>
    </div>
    <iframe class="reader-iframe" id="reader-iframe" sandbox="allow-scripts"></iframe>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add("reader-overlay--visible"));

  // Event-Listener
  overlay._keyHandler = e => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
    if (e.key === "Escape")                         closeReader();
    if (e.key === "ArrowRight" || e.key === "PageDown") navigate(1);
    if (e.key === "ArrowLeft"  || e.key === "PageUp")   navigate(-1);
  };
  document.addEventListener("keydown", overlay._keyHandler);

  document.getElementById("reader-exit").addEventListener("click", closeReader);
  document.getElementById("reader-prev").addEventListener("click", () => navigate(-1));
  document.getElementById("reader-next").addEventListener("click", () => navigate(1));
  document.getElementById("reader-font-sm").addEventListener("click", () => changeFontSize(-1));
  document.getElementById("reader-font-lg").addEventListener("click", () => changeFontSize(1));

  const modeBtn = document.getElementById("reader-mode-btn");
  function syncModeBtn() {
    modeBtn.textContent = (State.getMode?.() ?? "dark") === "dark" ? "☀️" : "🌙";
  }
  syncModeBtn();
  modeBtn.addEventListener("click", () => {
    State.setMode(State.getMode() === "dark" ? "light" : "dark");
    applyPreview();
    syncModeBtn();
    renderChapter();
  });

  renderThemeDots();
  renderChapter();
}

// ── Overlay schließen ─────────────────────────────────────────────────

function closeReader() {
  if (!overlay) return;
  document.removeEventListener("keydown", overlay._keyHandler);
  overlay.classList.remove("reader-overlay--visible");
  setTimeout(() => { overlay?.remove(); overlay = null; }, 220);
}

// ── Kapitel-Navigation ────────────────────────────────────────────────

function navigate(delta) {
  const course = State.getCourse();
  if (!course) return;
  const newIdx = currentIdx + delta;
  if (newIdx < 0 || newIdx >= course.chapters.length) return;
  currentIdx = newIdx;
  renderChapter();

  // Iframe-Inhalt nach oben scrollen
  const iframe = document.getElementById("reader-iframe");
  if (iframe?.contentWindow) {
    setTimeout(() => iframe.contentWindow.scrollTo({ top: 0, behavior: "instant" }), 80);
  }
}

// ── Kapitel in iframe rendern ─────────────────────────────────────────

function renderChapter() {
  const course = State.getCourse();
  if (!course) return;
  const chapter = course.chapters[currentIdx];
  if (!chapter) return;

  const total = course.chapters.length;

  // Positions-Anzeige + Buttons
  const posEl  = document.getElementById("reader-pos");
  const prevBtn = document.getElementById("reader-prev");
  const nextBtn = document.getElementById("reader-next");
  if (posEl)   posEl.textContent   = `${currentIdx + 1} / ${total}`;
  if (prevBtn) prevBtn.disabled    = currentIdx === 0;
  if (nextBtn) nextBtn.disabled    = currentIdx === total - 1;

  const blocksHTML = (chapter.blocks || []).map(blockToHTML).join("\n");
  const css        = generateWebCSS(course);
  const mode       = State.getMode?.() ?? "dark";

  // Navigations-Footer im Reader
  const prevLink = currentIdx > 0
    ? `<button class="rd-nav-btn rd-nav-btn--prev" onclick="parent.document.getElementById('reader-prev').click()">← ${escapeHTML(course.chapters[currentIdx - 1].title || "Zurück")}</button>`
    : `<span></span>`;
  const nextLink = currentIdx < total - 1
    ? `<button class="rd-nav-btn rd-nav-btn--next" onclick="parent.document.getElementById('reader-next').click()">Weiter: ${escapeHTML(course.chapters[currentIdx + 1].title || "Weiter")} →</button>`
    : `<span class="rd-done">✓ Modul abgeschlossen</span>`;

  const srcdoc = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(chapter.title || "")}</title>
  <style>
${css}

/* Reader-spezifische Overrides */
body {
  margin: 0;
  padding: 0;
  font-size: ${fontSize}px;
  min-height: 100vh;
}
.rd-page {
  max-width: var(--cf-max-width, 720px);
  margin: 0 auto;
  padding: 44px 32px 80px;
}
.rd-page h1 {
  font-size: 1.8em;
  line-height: 1.2;
  border-bottom: 3px solid var(--cf-primary);
  padding-bottom: 12px;
  margin-bottom: 28px;
}
.rd-chapter-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 60px;
  padding-top: 24px;
  border-top: 1px solid rgba(128,128,128,.15);
  flex-wrap: wrap;
  gap: 10px;
}
.rd-nav-btn {
  padding: 10px 20px;
  background: var(--cf-primary);
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9em;
  font-family: inherit;
  transition: opacity .15s;
}
.rd-nav-btn:hover { opacity: .85; }
.rd-nav-btn--prev { background: transparent; color: var(--cf-text, #222); border: 1.5px solid rgba(128,128,128,.25); }
.rd-done { font-size: .9em; color: var(--cf-primary); font-weight: 600; }

@media (max-width: 600px) {
  .rd-page { padding: 28px 18px 60px; }
}
  </style>
</head>
<body class="sb-page ${mode === 'dark' ? 'sb-dark' : 'sb-light'}">
  <div class="rd-page">
    <h1>${escapeHTML(chapter.title || "")}</h1>
    ${blocksHTML}
    <div class="rd-chapter-nav">
      ${prevLink}
      ${nextLink}
    </div>
  </div>
  <script>${QUIZ_RUNTIME_JS}<\/script>
</body>
</html>`;

  const iframe = document.getElementById("reader-iframe");
  if (iframe) iframe.srcdoc = srcdoc;
}

// ── Theme-Dots ────────────────────────────────────────────────────────

function renderThemeDots() {
  const container = document.getElementById("reader-themes");
  if (!container) return;
  const course  = State.getCourse();
  const current = course?.design?.theme ?? "akademie";
  const themes  = getAllThemes();

  container.innerHTML = themes.map(t => `
    <button
      class="reader-theme-dot${t.id === current ? " reader-theme-dot--active" : ""}"
      data-theme="${t.id}"
      title="${t.name}"
      style="background:${t.vars["--cf-primary"]}">
    </button>`).join("");

  container.querySelectorAll(".reader-theme-dot").forEach(btn => {
    btn.addEventListener("click", () => {
      State.update(c => { c.design.theme = btn.dataset.theme; });
      renderThemeDots();
      renderChapter();
    });
  });
}

// ── Schriftgröße ──────────────────────────────────────────────────────

function changeFontSize(delta) {
  fontSize = Math.min(22, Math.max(12, fontSize + delta));
  localStorage.setItem("readerFontSize", fontSize);
  renderChapter();
}
