/**
 * core/utils.js – kleine Helfer
 * ===============================
 * Reine Funktionen, keine Side-Effects.
 *
 * Abhängigkeiten: KEINE
 */

/**
 * Generiert eine eindeutige ID mit Prefix.
 * Format: prefix_<timestamp>_<random5chars>
 *
 * @param {string} prefix - z.B. 'course', 'chapter', 'block'
 * @returns {string}
 */
export function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Escapt einen String für die sichere Verwendung in HTML-Text.
 * Achtung: NICHT für Attribute geeignet (nutze escapeAttr).
 *
 * @param {*} value
 * @returns {string}
 */
export function escapeHTML(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Escapt einen String für die sichere Verwendung in HTML-Attributen.
 *
 * @param {*} value
 * @returns {string}
 */
export function escapeAttr(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Escapt einen String für sichere Verwendung in XML (Element + Attribute).
 *
 * @param {*} value
 * @returns {string}
 */
export function escapeXML(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Macht aus einem String einen sicheren Dateinamen / ID.
 * Beispiel: "Hüfte & Knie" → "huefte_knie"
 *
 * @param {string} str
 * @returns {string}
 */
export function slugify(str) {
  return String(str ?? '')
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 50) || 'kapitel';
}

/**
 * Tiefe Kopie eines Objekts (nur für JSON-serialisierbare Daten).
 *
 * @param {*} obj
 * @returns {*}
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
