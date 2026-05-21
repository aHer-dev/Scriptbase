/**
 * exporter/exporter.js – SCORM-Export Koordinator
 * =================================================
 * Generiert HTML pro Kapitel, baut imsmanifest.xml,
 * packt alles in eine SCORM-konforme ZIP, triggert Download.
 *
 * Abhängigkeiten: core/state.js, exporter/manifest.js, exporter/zip-builder.js,
 *                 exporter/scorm-runtime.js, exporter/quiz-runtime.js,
 *                 exporter/block-to-html.js, design/renderer.js, core/utils.js
 */

import * as State from "../core/state.js";
import { buildManifest } from "./manifest.js";
import { buildZip } from "./zip-builder.js";
import { SCORM_RUNTIME_JS } from "./scorm-runtime.js";
import { QUIZ_RUNTIME_JS } from "./quiz-runtime.js";
import { blockToHTML } from "./block-to-html.js";
import { generateCSS } from "../design/renderer.js";
import { escapeHTML, slugify } from "../core/utils.js";
import { t } from "../i18n.js";

export function initExportButton(button) {
  button.addEventListener("click", runExport);
}

// ── Export orchestrieren ─────────────────────────────────────────────

async function runExport() {
  // Pending contenteditable-Änderungen flushen bevor wir den State lesen
  if (document.activeElement && document.activeElement !== document.body) {
    document.activeElement.blur();
    await new Promise(r => setTimeout(r, 50));
  }

  const course = State.getCourse();
  if (!course) { alert(t('exporter.no_course')); return; }
  if (!course.chapters?.length) { alert(t('exporter.no_chapters')); return; }

  // Prüfe auf leere Interaktionsblöcke und warne
  const warnings = [];
  course.chapters.forEach(ch => {
    (ch.blocks || []).forEach(b => {
      if ((b.type === "quiz" || b.type === "quiz_multi") && b.options?.every(o => !o?.trim()))
        warnings.push(`Kapitel „${ch.title}": MC-Quiz ohne Antwortoptionen`);
      if (b.type === "zuordnung" && b.pairs?.every(p => !p.left?.trim() && !p.right?.trim()))
        warnings.push(`Kapitel „${ch.title}": Zuordnung ohne Paare`);
      if (b.type === "luecke" && b.blanks?.every(bl => !bl?.trim()))
        warnings.push(`Kapitel „${ch.title}": Lückentext ohne Lösungen`);
    });
  });
  if (warnings.length) {
    const proceed = confirm(
      t('exporter.incomplete_blocks') + warnings.join("\n") + t('exporter.proceed_anyway')
    );
    if (!proceed) return;
  }

  // Dateinamen pro Kapitel
  const pages = course.chapters.map((ch, i) => ({
    chapter: ch,
    title:   ch.title,
    href:    `pages/${String(i + 1).padStart(2, "0")}_${slugify(ch.title) || "kapitel"}.html`,
  }));

  const files = {};

  // HTML-Seite pro Kapitel
  pages.forEach((p, i) => {
    const prev = i > 0             ? basename(pages[i - 1].href) : null;
    const next = i < pages.length - 1 ? basename(pages[i + 1].href) : null;
    files[p.href] = chapterToHTML(course, p.chapter, {
      prevHref:   prev,
      nextHref:   next,
      pageNum:    i + 1,
      pageTotal:  pages.length,
    });
  });

  // Shared-Assets
  files["shared/style.css"] = generateCSS(course);
  files["shared/scorm.js"]  = SCORM_RUNTIME_JS;
  files["shared/quiz.js"]   = QUIZ_RUNTIME_JS;

  // Manifest
  files["imsmanifest.xml"] = buildManifest(
    course,
    pages.map(p => ({ id: p.chapter.id, title: p.title, href: p.href }))
  );

  await buildZip(files, `${slugify(course.title || "kurs")}.zip`);
}

// ── Kapitel → HTML-Seite ─────────────────────────────────────────────

export function chapterToHTML(course, chapter, opts = {}) {
  const { prevHref, nextHref, pageNum, pageTotal } = opts;

  const blocksHTML = (chapter.blocks || []).map(blockToHTML).join("\n");

  const prevBtn  = prevHref
    ? `<a class="cf-nav-btn" href="${prevHref}">${t('exporter.nav_back')}</a>`
    : `<span></span>`;
  const nextBtn  = nextHref
    ? `<a class="cf-nav-btn" href="${nextHref}">${t('exporter.nav_next')}</a>`
    : `<span></span>`;
  const progress = pageTotal > 1
    ? `<span class="cf-nav-progress">${pageNum} / ${pageTotal}</span>`
    : `<span>${escapeHTML(course.title || "")}</span>`;

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(chapter.title)} – ${escapeHTML(course.title || "")}</title>
  <link rel="stylesheet" href="../shared/style.css">
</head>
<body>
  <nav class="cf-nav">
    ${prevBtn}
    ${progress}
    ${nextBtn}
  </nav>
  <main class="cf-container">
    <h1>${escapeHTML(chapter.title)}</h1>
    ${blocksHTML}
  </main>
  <script src="../shared/scorm.js"></script>
  <script src="../shared/quiz.js"></script>
</body>
</html>`;
}

// ── Helpers ──────────────────────────────────────────────────────────

function basename(path) {
  return path.split("/").pop();
}
