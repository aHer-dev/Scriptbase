/**
 * core/state.js – Single Source of Truth
 * =========================================
 * DAS HERZSTÜCK der App. Hier lebt der aktuelle Kurs.
 *
 * Andere Module:
 * - LESEN: getCourse() oder subscribe(fn)
 * - SCHREIBEN: update(course => course.title = 'X')
 * - NIE direkt mutieren ohne update() aufzurufen, sonst keine UI-Updates / kein Save
 *
 * Auto-Persistenz: Bei jedem update() wird in localStorage gespeichert.
 * Schema-Versionierung: gespeicherte Daten haben eine schemaVersion.
 *
 * Abhängigkeiten: config.js
 */

import { APP } from '../config.js';

// ── Interner State ──────────────────────────────────────────────
let course = null;
const listeners = new Set();
let activeChapterId = null;       // welches Kapitel ist gerade im Editor offen?

// ── Lese-Funktionen ─────────────────────────────────────────────

/**
 * Gibt den aktuellen Kurs zurück (oder null wenn keiner geladen).
 * @returns {object|null}
 */
export function getCourse() {
  return course;
}

/**
 * Gibt das aktive Kapitel-Objekt zurück (oder null).
 * @returns {object|null}
 */
export function getActiveChapter() {
  if (!course || !activeChapterId) return null;
  return course.chapters.find(ch => ch.id === activeChapterId) || null;
}

/**
 * Gibt die ID des aktiven Kapitels zurück.
 * @returns {string|null}
 */
export function getActiveChapterId() {
  return activeChapterId;
}

// ── Schreib-Funktionen ──────────────────────────────────────────

/**
 * Setzt einen komplett neuen Kurs (z.B. nach Import oder beim Laden).
 * @param {object} newCourse
 */
export function setCourse(newCourse) {
  course = newCourse;
  if (newCourse && newCourse.chapters?.length > 0) {
    activeChapterId = newCourse.chapters[0].id;
  } else {
    activeChapterId = null;
  }
  persist();
  emit();
}

/**
 * Mutiert den Kurs. Die mutator-Funktion bekommt das course-Objekt
 * und darf es direkt verändern.
 *
 * Beispiel:
 *   update(c => c.title = 'Neuer Titel');
 *   update(c => c.chapters.push(newChapter));
 *
 * @param {(course: object) => void} mutator
 */
export function update(mutator) {
  if (!course) {
    console.warn('update() aufgerufen aber kein Kurs geladen');
    return;
  }
  mutator(course);
  course.updatedAt = new Date().toISOString();
  persist();
  emit();
}

/**
 * Setzt das aktive Kapitel.
 * @param {string|null} chapterId
 */
export function setActiveChapter(chapterId) {
  activeChapterId = chapterId;
  emit();
}

/**
 * Setzt den State zurück (kein Kurs geladen).
 */
export function reset() {
  course = null;
  activeChapterId = null;
  try { localStorage.removeItem(APP.storageKey); } catch (e) { /* ignore */ }
  emit();
}

// ── Pub/Sub ─────────────────────────────────────────────────────

/**
 * Abonniert State-Änderungen.
 * @param {(course: object|null) => void} fn
 * @returns {() => void} unsubscribe-Funktion
 */
export function subscribe(fn) {
  listeners.add(fn);
  // Sofort einmal mit aktuellem State aufrufen
  fn(course);
  return () => listeners.delete(fn);
}

function emit() {
  listeners.forEach(fn => {
    try { fn(course); }
    catch (e) { console.error('Subscriber-Fehler:', e); }
  });
}

// ── Persistenz ──────────────────────────────────────────────────

function persist() {
  if (!APP.autosave) return;
  if (!course) return;
  try {
    const payload = {
      schemaVersion: APP.schemaVersion,
      activeChapterId,
      course,
    };
    localStorage.setItem(APP.storageKey, JSON.stringify(payload));
  } catch (e) {
    console.error('Speichern fehlgeschlagen:', e);
    // TODO: Bei QuotaExceededError den Nutzer warnen
  }
}

/**
 * Lädt einen gespeicherten Kurs aus localStorage.
 * @returns {boolean} true wenn erfolgreich geladen
 */
export function loadFromStorage() {
  try {
    const raw = localStorage.getItem(APP.storageKey);
    if (!raw) return false;

    const parsed = JSON.parse(raw);

    if (parsed.schemaVersion !== APP.schemaVersion) {
      console.warn(
        `Schema-Version ${parsed.schemaVersion} passt nicht zur App-Version ${APP.schemaVersion}.`,
        'Migration nötig – aktuell wird der gespeicherte Kurs ignoriert.'
      );
      return false;
    }

    course = parsed.course;
    activeChapterId = parsed.activeChapterId || (course?.chapters?.[0]?.id ?? null);
    emit();
    return true;
  } catch (e) {
    console.error('Laden aus localStorage fehlgeschlagen:', e);
    return false;
  }
}
