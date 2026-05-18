/**
 * importer/importer.js – ZIP-Import
 * ===================================
 * Phase 2 (TODO): ZIP einlesen, HTML pro Datei parsen, in Blöcke konvertieren,
 *                 als neuen Kurs in den State packen.
 *
 * Aktuell: Stub. Klick auf Import-Button öffnet File-Picker und triggert
 *          importZip() – die Verarbeitung selbst ist noch nicht da.
 *
 * Abhängigkeiten: core/state.js, core/course.js, core/chapter.js
 */

import * as State from "../core/state.js";
import { createCourse } from "../core/course.js";
import { createChapter } from "../core/chapter.js";

/**
 * Verdrahtet den Import-Button mit einem versteckten File-Picker.
 * @param {HTMLButtonElement} button
 */
export function initImportButton(button) {
  button.addEventListener("click", openImportDialog);
}

function openImportDialog() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".zip,application/zip";
  input.onchange = e => {
    const file = e.target.files?.[0];
    if (file) importZip(file);
  };
  input.click();
}

/**
 * Liest eine ZIP-Datei ein und konvertiert sie in einen Kurs.
 *
 * Geplanter Ablauf (Phase 2):
 *   1. JSZip dynamisch laden (siehe exporter/zip-builder.js für das Pattern)
 *   2. ZIP entpacken, HTML-Dateien finden
 *   3. Pro HTML-Datei: DOMParser, Inhalte in Blöcke konvertieren
 *   4. createCourse() + pro Datei createChapter()
 *   5. State.setCourse(neuerKurs)
 *
 * @param {File} file
 */
async function importZip(file) {
  console.log("Import angefordert:", file.name, `(${file.size} bytes)`);

  // TODO Phase 2: tatsächliche Verarbeitung
  alert(
    "Import ist noch nicht implementiert (Phase 2).\n\n" +
    `Datei "${file.name}" wäre verarbeitet worden.`
  );
}
