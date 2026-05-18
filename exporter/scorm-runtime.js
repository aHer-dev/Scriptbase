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
(function () {
  "use strict";

  var api        = null;
  var apiVersion = null;
  var results    = [];   // true/false pro Quiz-Antwort – für Score
  var n          = 0;    // laufender cmi.interactions Index

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

  function submitScore() {
    if (!api || !results.length) return;
    var correct = 0;
    for (var k = 0; k < results.length; k++) { if (results[k]) correct++; }
    var raw = Math.round(correct / results.length * 100);
    try {
      if (apiVersion === "1.2") {
        api.LMSSetValue("cmi.core.score.min", "0");
        api.LMSSetValue("cmi.core.score.max", "100");
        api.LMSSetValue("cmi.core.score.raw", String(raw));
        api.LMSCommit("");
      } else {
        api.SetValue("cmi.score.min",    "0");
        api.SetValue("cmi.score.max",    "100");
        api.SetValue("cmi.score.raw",    String(raw));
        api.SetValue("cmi.score.scaled", String(raw / 100));
        api.Commit("");
      }
    } catch (e) { /* LMS unterstützt Score nicht – ignorieren */ }
  }

  function init() {
    var found = findAPI(window);
    if (!found) {
      console.warn("[SB] SCORM-API nicht gefunden – Standalone-Modus.");
      return;
    }
    api        = found.api;
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

    // Globales SB-Objekt für Quiz-Tracking
    window.SB = {
      track: function (id, type, response, correct) {
        results.push(!!correct);
        var pre = "cmi.interactions." + n + ".";
        try {
          if (apiVersion === "1.2") {
            api.LMSSetValue(pre + "id",               String(id).substring(0, 255));
            api.LMSSetValue(pre + "type",             type);
            api.LMSSetValue(pre + "student_response", String(response).substring(0, 255));
            api.LMSSetValue(pre + "result",           correct ? "correct" : "wrong");
            api.LMSCommit("");
          } else {
            api.SetValue(pre + "id",               String(id));
            api.SetValue(pre + "type",             type);
            api.SetValue(pre + "learner_response", String(response));
            api.SetValue(pre + "result",           correct ? "correct" : "incorrect");
            api.Commit("");
          }
          n++;
        } catch (e) { /* LMS unterstützt cmi.interactions nicht – ignorieren */ }
        submitScore();
      }
    };
  }

  function finish() {
    if (!api) return;
    try {
      submitScore();
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
})();
`;
