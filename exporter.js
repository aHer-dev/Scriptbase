/**
 * exporter/exporter.js – SCORM-Export Koordinator
 * =================================================
 * Phase 6 (TODO): Generiert HTML pro Kapitel, baut imsmanifest.xml,
 *                 packt alles in eine SCORM-konforme ZIP, triggert Download.
 *
 * Aktuell: Stub. Button ist verdrahtet, Aufrufkette zu manifest.js / zip-builder.js
 *          / scorm-runtime.js / renderer.js ist vorbereitet.
 *
 * Abhängigkeiten: core/state.js, exporter/manifest.js, exporter/zip-builder.js,
 *                 exporter/scorm-runtime.js, design/renderer.js, core/utils.js
 */

import * as State from "../core/state.js";
import { buildManifest } from "./manifest.js";
import { buildZip } from "./zip-builder.js";
import { SCORM_RUNTIME_JS } from "./scorm-runtime.js";
import { generateCSS } from "../design/renderer.js";
import { escapeHTML, slugify } from "../core/utils.js";

/**
 * Verdrahtet den Export-Button.
 * @param {HTMLButtonElement} button
 */
export function initExportButton(button) {
  button.addEventListener("click", runExport);
}

async function runExport() {
  const course = State.getCourse();
  if (!course) {
    alert("Kein Kurs zum Exportieren.");
    return;
  }
  if (!course.chapters || course.chapters.length === 0) {
    alert("Der Kurs hat noch keine Kapitel.");
    return;
  }

  console.log("Export gestartet:", course.title);

  // TODO Phase 6:
  //   const pages = course.chapters.map((ch, i) => ({
  //     id: ch.id,
  //     title: ch.title,
  //     href: `pages/${String(i+1).padStart(2,"0")}_${slugify(ch.title)}.html`,
  //   }));
  //   const files = {};
  //   pages.forEach((p, i) => {
  //     files[p.href] = chapterToHTML(course, course.chapters[i], { ... });
  //   });
  //   files["shared/style.css"]   = generateCSS(course);
  //   files["shared/scorm.js"]    = SCORM_RUNTIME_JS;
  //   files["imsmanifest.xml"]    = buildManifest(course, pages);
  //   await buildZip(files, `${slugify(course.title)}.zip`);

  alert(
    "SCORM-Export ist noch nicht implementiert (Phase 6).\n\n" +
    "Die Aufrufkette steht – fehlt nur das Befüllen."
  );
}

/**
 * Erzeugt eine fertige HTML-Seite für ein Kapitel.
 * Phase 6: Iteriert chapter.blocks, ruft blockToHTML(b) auf, packt ins Template.
 *
 * @param {object} course
 * @param {object} chapter
 * @param {object} opts - { prevHref, nextHref }
 * @returns {string}
 */
export function chapterToHTML(course, chapter, opts = {}) {
  const blocksHTML = chapter.blocks.map(blockToHTML).join("\n");

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(chapter.title)} – ${escapeHTML(course.title)}</title>
  <link rel="stylesheet" href="../shared/style.css">
  <script src="../shared/scorm.js"></script>
</head>
<body>
  <nav class="cf-nav">
    <span>${escapeHTML(course.title)}</span>
    <span>${escapeHTML(chapter.title)}</span>
  </nav>
  <main class="cf-container">
    <h1>${escapeHTML(chapter.title)}</h1>
    ${blocksHTML}
  </main>
</body>
</html>`;
}

/**
 * Wandelt einen Block in HTML um (für den Export).
 * Phase 6: switch über block.type, escape() benutzen, pro Typ ausformulieren.
 *
 * @param {object} block
 * @returns {string}
 */
export function blockToHTML(block) {
  // TODO Phase 6: pro Block-Typ implementieren
  return `<!-- TODO blockToHTML: ${block.type} -->`;
}
