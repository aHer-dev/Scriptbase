/**
 * scorm/moodle-compat.js – Moodle/SCORM-Kompatibilitätsschicht
 * ==============================================================
 * Übersetzt SCORM 1.2 ↔ 2004 Schlüssel.
 * Enthält bekannte Quirks/Workarounds pro Moodle-Version.
 *
 * WICHTIG: Diese Datei enthält NUR Daten/Mappings, KEINE Browser-API-Aufrufe –
 *          deshalb kann sie sowohl im Editor als auch im Exporter (zur
 *          Code-Generierung) sicher importiert werden.
 *
 * Moodle-Update? → Hier prüfen ob neue Quirks dokumentiert werden müssen.
 *                  Zusammen mit exporter/scorm-runtime.js und config.js anpassen.
 *
 * Abhängigkeiten: config.js
 */

import { SCORM, MOODLE } from "../config.js";

// ── SCORM 1.2 → 2004 Key-Mapping ───────────────────────────────────
const KEY_MAP_12_TO_2004 = {
  "cmi.core.lesson_status":   "cmi.completion_status",
  "cmi.core.score.raw":       "cmi.score.raw",
  "cmi.core.score.min":       "cmi.score.min",
  "cmi.core.score.max":       "cmi.score.max",
  "cmi.core.score.scaled":    "cmi.score.scaled",
  "cmi.core.session_time":    "cmi.session_time",
  "cmi.core.lesson_location": "cmi.location",
  "cmi.core.student_id":      "cmi.learner_id",
  "cmi.core.student_name":    "cmi.learner_name",
  "cmi.suspend_data":         "cmi.suspend_data",
};

// ── SCORM 1.2 vs 2004 API-Methodennamen ────────────────────────────
const API_METHODS_12 = {
  init:    "LMSInitialize",
  finish:  "LMSFinish",
  get:     "LMSGetValue",
  set:     "LMSSetValue",
  commit:  "LMSCommit",
  getErr:  "LMSGetLastError",
};

const API_METHODS_2004 = {
  init:    "Initialize",
  finish:  "Terminate",
  get:     "GetValue",
  set:     "SetValue",
  commit:  "Commit",
  getErr:  "GetLastError",
};

// ── Moodle-Quirks pro Version ──────────────────────────────────────
const MOODLE_QUIRKS = {
  "4.x": {
    requiresCommitAfterInit: false,
    completionValueTrue: "completed",  // Was gilt als "abgeschlossen"
    apiObjectName: { "1.2": "API", "2004": "API_1484_11" },
  },
  // Hier neue Versionen ergänzen:
  // "5.x": { ... },
};

// ── Public API ─────────────────────────────────────────────────────

/**
 * Liefert die aktive SCORM-Version.
 * @returns {"1.2" | "2004"}
 */
export function getAPIVersion() {
  return SCORM.version;
}

/**
 * Übersetzt einen SCORM 1.2 Key in die aktuell konfigurierte Version.
 * Bei version="1.2": gibt key12 unverändert zurück.
 *
 * @param {string} key12 - SCORM 1.2 CMI-Schlüssel
 * @returns {string}
 */
export function translateKey(key12) {
  if (SCORM.version === "1.2") return key12;
  return KEY_MAP_12_TO_2004[key12] || key12;
}

/**
 * Liefert die API-Methodennamen für die aktive Version.
 * Wird im Runtime-Template benutzt.
 *
 * @returns {{init,finish,get,set,commit,getErr: string}}
 */
export function getAPIMethods() {
  return SCORM.version === "1.2" ? API_METHODS_12 : API_METHODS_2004;
}

/**
 * Name des globalen API-Objekts im Moodle-Window.
 * SCORM 1.2 → "API"
 * SCORM 2004 → "API_1484_11"
 *
 * @returns {string}
 */
export function getAPIObjectName() {
  const quirks = getMoodleQuirks();
  return quirks.apiObjectName[SCORM.version] ?? "API";
}

/**
 * Quirks für die aktuell konfigurierte Moodle-Version.
 * Fallback auf "4.x".
 *
 * @returns {object}
 */
export function getMoodleQuirks() {
  return MOODLE_QUIRKS[MOODLE.version] ?? MOODLE_QUIRKS["4.x"];
}
