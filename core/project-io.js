/**
 * core/project-io.js – Projekt speichern & laden
 * ================================================
 * Exportiert den aktuellen Kurs als .sbcourse-Datei (JSON)
 * und importiert diese wieder in den State.
 *
 * Format: { sbVersion: 1, exportedAt: "ISO", course: { ...courseObject } }
 *
 * Abhängigkeiten: core/state.js, core/utils.js
 */

import * as State from "./state.js";
import { slugify } from "./utils.js";

// ── Speichern ─────────────────────────────────────────────────────────

/**
 * Serialisiert den aktuellen Kurs und triggert einen Datei-Download.
 * Dateiname: <kurs-slug>.sbcourse
 */
export function saveProject() {
  const course = State.getCourse();
  if (!course) { alert("Kein Kurs zum Speichern."); return; }

  const payload = {
    sbVersion:  1,
    exportedAt: new Date().toISOString(),
    course,
  };

  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${slugify(course.title || "kurs") || "kurs"}.sbcourse`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Laden ─────────────────────────────────────────────────────────────

/**
 * Liest eine .sbcourse-Datei ein und lädt den Kurs in den State.
 * @param {File} file
 * @returns {Promise<boolean>} true bei Erfolg
 */
export async function loadProjectFromFile(file) {
  if (State.getCourse()) {
    const ok = confirm(
      `Aktuellen Kurs ersetzen mit "${file.name}"?\n\nNicht gespeicherte Änderungen gehen verloren.`
    );
    if (!ok) return false;
  }

  let text;
  try {
    text = await file.text();
  } catch {
    alert("Datei konnte nicht gelesen werden.");
    return false;
  }

  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    alert(`"${file.name}" ist keine gültige .sbcourse-Datei.`);
    return false;
  }

  const course = payload?.course ?? payload;
  if (!course?.chapters) {
    alert(`"${file.name}" enthält keinen gültigen Kurs.`);
    return false;
  }

  State.setCourse(course);
  return true;
}
