// scorm_api.js – SCORM 1.2 Tracking
// Wird von jeder HTML-Seite eingebunden.
// Markiert die Seite als "completed" sobald sie geöffnet wird.

var API = null;

function findAPI(win) {
  var attempts = 0;
  while (!win.API && win.parent && win.parent !== win && attempts < 10) {
    win = win.parent;
    attempts++;
  }
  return win.API || null;
}

function initSCORM() {
  API = findAPI(window);
  if (!API) { console.warn("SCORM API nicht gefunden."); return; }
  API.LMSInitialize("");
  // Seite als abgeschlossen markieren
  API.LMSSetValue("cmi.core.lesson_status", "completed");
  API.LMSCommit("");
}

function finishSCORM() {
  if (!API) return;
  API.LMSFinish("");
}

window.addEventListener("load",   initSCORM);
window.addEventListener("unload", finishSCORM);
