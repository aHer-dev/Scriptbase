/**
 * exporter/web-exporter.js – Web-Export (statische Site)
 * ========================================================
 * Generiert eine vollständige statische HTML-Site:
 *   index.html         – Kursübersicht mit Kapitel-Liste
 *   pages/01_*.html    – eine Seite pro Kapitel
 *   shared/style.css   – Theme-CSS + Reader-Styles
 *   shared/quiz.js     – Quiz-Interaktionen (kein SCORM)
 *   shared/reader.js   – Fortschritt + Dark-Mode + TOC
 *
 * Verwendung: Auf GitHub Pages oder beliebigem Static-Host hochladen.
 *
 * Abhängigkeiten: core/state.js, exporter/block-to-html.js,
 *                 exporter/quiz-runtime.js, exporter/reader-runtime.js,
 *                 design/renderer.js, exporter/zip-builder.js, core/utils.js
 */

import * as State from "../core/state.js";
import { blockToHTML } from "./block-to-html.js";
import { QUIZ_RUNTIME_JS } from "./quiz-runtime.js";
import { READER_RUNTIME_JS } from "./reader-runtime.js";
import { generateWebCSS } from "../design/renderer.js";
import { escapeHTML, slugify } from "../core/utils.js";
import { buildZip } from "./zip-builder.js";

export function initWebExportButton(button) {
  button.addEventListener("click", runWebExport);
}

// ── Export orchestrieren ──────────────────────────────────────────────

async function runWebExport() {
  if (document.activeElement && document.activeElement !== document.body) {
    document.activeElement.blur();
    await new Promise(r => setTimeout(r, 50));
  }

  const course = State.getCourse();
  if (!course) { alert("Kein Kurs zum Exportieren."); return; }
  if (!course.chapters?.length) { alert("Der Kurs hat noch keine Kapitel."); return; }

  const courseSlug = slugify(course.title || "kurs") || "kurs";

  const pages = course.chapters.map((ch, i) => {
    const slug = slugify(ch.title) || "kapitel";
    const filename = `${String(i + 1).padStart(2, "0")}_${slug}.html`;
    return {
      chapter:  ch,
      title:    ch.title || `Kapitel ${i + 1}`,
      filename,
      href:     `pages/${filename}`,
    };
  });

  const files = {};

  pages.forEach((p, i) => {
    files[p.href] = chapterPageHTML(course, p.chapter, pages, i, courseSlug);
  });

  files["index.html"]       = indexPageHTML(course, pages, courseSlug);
  files["shared/style.css"] = generateWebCSS(course);
  files["shared/quiz.js"]   = QUIZ_RUNTIME_JS;
  files["shared/reader.js"] = READER_RUNTIME_JS;

  await buildZip(files, `${courseSlug}_web.zip`);
}

// ── Index-Seite ───────────────────────────────────────────────────────

function indexPageHTML(course, pages, courseSlug) {
  const items = pages.map((p, i) => `
    <a class="sb-ch-item" data-href="${a(p.href)}" href="${a(p.href)}">
      <span class="sb-ch-num">${i + 1}</span>
      <div class="sb-ch-info">
        <span class="sb-ch-title">${escapeHTML(p.title)}</span>
      </div>
      <span class="sb-ch-arrow">→</span>
    </a>`).join("");

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(course.title || "Kurs")}</title>
  <link rel="stylesheet" href="shared/style.css">
</head>
<body class="sb-page sb-page--index">
  <header class="sb-header">
    <div class="sb-header-inner">
      <span class="sb-header-brand">ScriptBase</span>
      <button class="sb-theme-btn" id="sb-theme-toggle" title="Dark/Light Mode">🌙</button>
    </div>
  </header>
  <main class="sb-index">
    <div class="sb-index-hero">
      <h1 class="sb-index-title">${escapeHTML(course.title || "Kurs")}</h1>
      <p class="sb-index-meta">${pages.length} Kapitel</p>
    </div>
    <div class="sb-index-chapters">${items}
    </div>
    <a class="sb-start-btn" id="sb-start-btn" href="${a(pages[0].href)}">Kurs starten →</a>
  </main>
  <script>var SB_COURSE = "${courseSlug}";</script>
  <script src="shared/reader.js"></script>
</body>
</html>`;
}

// ── Kapitel-Seite ─────────────────────────────────────────────────────

function chapterPageHTML(course, chapter, pages, idx, courseSlug) {
  const total = pages.length;
  const pct   = Math.round((idx + 1) / total * 100);
  const prev  = idx > 0         ? pages[idx - 1].filename : null;
  const next  = idx < total - 1 ? pages[idx + 1].filename : null;

  const blocksHTML = (chapter.blocks || []).map(blockToHTML).join("\n");

  const tocItems = pages.map((p, i) => `
      <a class="sb-toc-item${i === idx ? " sb-toc-item--active" : ""}"
         data-href="${a(p.href)}" href="${a(p.filename)}">
        <span class="sb-toc-num">${i + 1}</span>
        <span>${escapeHTML(p.title)}</span>
      </a>`).join("");

  const prevBtn = prev
    ? `<a class="sb-nav-btn sb-nav-btn--ghost" href="${a(prev)}">← Zurück</a>`
    : `<span></span>`;
  const nextBtn = next
    ? `<a class="sb-nav-btn" href="${a(next)}">Weiter →</a>`
    : `<a class="sb-nav-btn sb-nav-btn--ghost" href="../index.html">Zur Übersicht</a>`;

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(chapter.title)} – ${escapeHTML(course.title || "")}</title>
  <link rel="stylesheet" href="../shared/style.css">
</head>
<body class="sb-page sb-page--chapter">
  <div class="sb-progress-bar">
    <div class="sb-progress-fill" id="sb-progress-fill" data-pct="${pct}"></div>
  </div>
  <header class="sb-header">
    <div class="sb-header-inner">
      <a class="sb-header-home" href="../index.html">${escapeHTML(course.title || "Kurs")}</a>
      <div class="sb-header-right">
        <span class="sb-header-pager">${idx + 1} / ${total}</span>
        <button class="sb-toc-toggle" id="sb-toc-toggle" title="Inhaltsverzeichnis">☰</button>
        <button class="sb-theme-btn" id="sb-theme-toggle" title="Dark/Light Mode">🌙</button>
      </div>
    </div>
  </header>
  <div class="sb-body">
    <aside class="sb-toc" id="sb-toc">
      <div class="sb-toc-inner">
        <div class="sb-toc-header">Inhalt</div>${tocItems}
      </div>
    </aside>
    <main class="sb-main">
      <article class="sb-article">
        <h1>${escapeHTML(chapter.title)}</h1>
        ${blocksHTML}
      </article>
      <nav class="sb-chapter-nav">
        ${prevBtn}
        ${nextBtn}
      </nav>
    </main>
  </div>
  <script>var SB_COURSE = "${courseSlug}";</script>
  <script src="../shared/quiz.js"></script>
  <script src="../shared/reader.js"></script>
</body>
</html>`;
}

// ── Helper ────────────────────────────────────────────────────────────

function a(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;").replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
