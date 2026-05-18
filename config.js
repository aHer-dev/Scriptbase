/**
 * config.js – ZENTRALE WAHRHEIT
 * ==============================
 * Alle Konfigurations-Werte an einem Ort.
 *
 * Moodle-Update? → Nur diese Datei + scorm/moodle-compat.js anfassen.
 * Neue Standard-Farbe? → Hier eintragen.
 *
 * Abhängigkeiten: KEINE – diese Datei darf nichts importieren
 */

export const APP = {
  name: 'ScriptBase',
  version: '0.1.0',
  schemaVersion: 1,                // bei Breaking Changes hochzählen + Migration schreiben
  storageKey: 'scriptbase:current',
  autosave: true,
};

export const SCORM = {
  version: '1.2',                  // '1.2' oder '2004'
  completionTrigger: 'on_page_load', // 'on_page_load' | 'on_quiz_pass' | 'on_time'
  minimumTime: null,               // null oder Sekunden
  passingScore: null,              // null oder 0-100
  bookmarking: true,               // Lerner landet wo er aufgehört hat
  scoreTracking: false,            // Score an Moodle zurückmelden
};

export const MOODLE = {
  version: '4.x',                  // Ziel-Moodle-Version
  scormPlugin: 'mod_scorm',        // Moodle SCORM Plugin-Name
};

export const DESIGN = {
  defaultTheme: 'akademie',        // muss in design/themes.js existieren
  primaryColor: '#1e5b8a',
  boxColors: {
    merke:  '#4f8ef7',
    klinik: '#f56565',
    tipp:   '#3ecf8e',
    quiz:   '#7c5af5',
  },
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontSize: '15px',
  lineHeight: '1.7',
};
