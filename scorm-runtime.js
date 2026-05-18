/**
 * exporter/scorm-runtime.js – SCORM-Tracking-Script
 * ===================================================
 * Wird in jede exportierte HTML-Seite eingebettet.
 * Findet die SCORM-API im Moodle-Window und meldet "completed" zurück.
 *
 * WICHTIG: Dies ist KEIN normales Modul – der Inhalt ist ein String,
 *          der vom Exporter in shared/scorm.js der ZIP geschrieben wird.
 *
 * Phase 6 (TODO): Bookmarking, Score, Session-Time.
 *
 * Abhängigkeiten: keine
 */

/**
 * SCORM-Runtime-Code als String. Wird vom Exporter in shared/scorm.js geschrieben.
 *
 * Erkennt SCORM 1.2 (window.API) und SCORM 2004 (window.API_1484_11) automatisch –
 * der Editor weiß zur Export-Zeit zwar die konfigurierte Version, der Lerner-Browser
 * weiß sie aber nicht, also bleibt das Script flexibel.
 */
export const SCORM_RUNTIME_JS = `// ScriptBase SCORM Runtime
// Wird in jede exportierte Seite eingebunden.

(function () {
  "use strict";

  var api = null;
  var apiVersion = null;

  // ── API im Window-Tree suchen ────────────────────────────
  function findAPI(win) {
    var depth = 0;
    while ((!win.API && !win.API_1484_11) && win.parent && win.parent !== win && depth < 10) {
      win = win.parent;
      depth++;
    }
    if (win.API)         return { api: win.API,         version: "1.2" };
    if (win.API_1484_11) return { api: win.API_1484_11, version: "2004" };
    if (win.opener)      return findAPI(win.opener);
    return null;
  }

  function init() {
    var found = findAPI(window);
    if (!found) {
      console.warn("[CF] SCORM-API nicht gefunden – Standalone-Modus.");
      return;
    }
    api = found.api;
    apiVersion = found.version;

    if (apiVersion === "1.2") {
      api.LMSInitialize("");
      api.LMSSetValue("cmi.core.lesson_status", "completed");
      api.LMSCommit("");
    } else {
      api.Initialize("");
      api.SetValue("cmi.completion_status", "completed");
      api.Commit("");
    }
  }

  function finish() {
    if (!api) return;
    try {
      if (apiVersion === "1.2") {
        api.LMSCommit("");
        api.LMSFinish("");
      } else {
        api.Commit("");
        api.Terminate("");
      }
    } catch (e) { /* ignore */ }
  }

  window.addEventListener("load",   init);
  window.addEventListener("unload", finish);

  // TODO Phase 6: bookmarking, suspend_data, session_time, score
})();
`;
