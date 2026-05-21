import de from './i18n/de.js';
import en from './i18n/en.js';
import et from './i18n/et.js';

const TRANSLATIONS = { de, en, et };

let currentLang = localStorage.getItem('cf_lang') || 'de';

// Sync HTML lang attribute with current language
document.documentElement.lang = currentLang;

/**
 * Translate a key. Supports {{var}} placeholders.
 * Falls back to German, then to the key itself.
 */
export function t(key, vars = {}) {
  const dict = TRANSLATIONS[currentLang] || de;
  let str = dict[key] ?? de[key] ?? key;
  return str.replace(/\{\{(\w+)\}\}/g, (_, k) => (k in vars ? vars[k] : `{{${k}}}`));
}

/** Switch language and reload the page (all UI re-renders fresh). */
export function setLanguage(lang) {
  if (!TRANSLATIONS[lang]) return;
  localStorage.setItem('cf_lang', lang);
  location.reload();
}

export function getLanguage() {
  return currentLang;
}

export function getSupportedLanguages() {
  return Object.keys(TRANSLATIONS);
}
