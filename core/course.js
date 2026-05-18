/**
 * core/course.js – Kurs-Operationen
 * ===================================
 * Reine Funktionen für Kurs-Datenstrukturen.
 *
 * WICHTIG: Mutiert IN-PLACE. Aufruf immer aus state.update().
 *
 * Abhängigkeiten: config.js, core/utils.js
 */

import { APP } from "../config.js";
import { uid, now } from "./utils.js";

/**
 * Erstellt einen neuen, leeren Kurs.
 * @param {string} title
 * @returns {object}
 */
export function createCourse(title = "Neuer Kurs") {
  return {
    id: uid("course"),
    schemaVersion: APP.schemaVersion,
    title,
    description: "",
    author: "",
    createdAt: now(),
    updatedAt: now(),
    chapters: [],
    design: {
      theme: "akademie",
      overrides: {},         // CSS-Variablen-Überschreibungen, z.B. { "--cf-merke": "#abc" }
    },
    scorm: {},               // Override-Werte für config.js SCORM
  };
}

/**
 * Fügt ein Kapitel zum Kurs hinzu (am Ende).
 * Setzt order automatisch.
 *
 * @param {object} course
 * @param {object} chapter - aus createChapter()
 */
export function addChapter(course, chapter) {
  chapter.order = course.chapters.length;
  course.chapters.push(chapter);
  course.updatedAt = now();
}

/**
 * Entfernt ein Kapitel und nummeriert die order der restlichen neu.
 * Setzt activeChapterId auf null wenn das aktive Kapitel entfernt wurde.
 *
 * @param {object} course
 * @param {string} chapterId
 * @returns {boolean} true wenn entfernt
 */
export function removeChapter(course, chapterId) {
  const before = course.chapters.length;
  course.chapters = course.chapters.filter(ch => ch.id !== chapterId);
  if (course.chapters.length === before) return false;
  renumberChapters(course);
  course.updatedAt = now();
  return true;
}

/**
 * Findet ein Kapitel per ID.
 * @param {object} course
 * @param {string} chapterId
 * @returns {object|null}
 */
export function findChapter(course, chapterId) {
  return course.chapters.find(ch => ch.id === chapterId) ?? null;
}

/**
 * Aktualisiert Felder eines Kapitels.
 * @param {object} course
 * @param {string} chapterId
 * @param {object} patch
 * @returns {boolean}
 */
export function updateChapter(course, chapterId, patch) {
  const chapter = findChapter(course, chapterId);
  if (!chapter) return false;
  Object.assign(chapter, patch);
  chapter.updatedAt = now();
  course.updatedAt = now();
  return true;
}

/**
 * Convenience: Kapitel-Titel ändern.
 * @param {object} course
 * @param {string} chapterId
 * @param {string} newTitle
 * @returns {boolean}
 */
export function renameChapter(course, chapterId, newTitle) {
  return updateChapter(course, chapterId, { title: newTitle });
}

/**
 * Sortiert Kapitel nach gegebener ID-Reihenfolge.
 * Setzt anschließend order neu.
 *
 * @param {object} course
 * @param {string[]} orderedIds
 */
export function reorderChapters(course, orderedIds) {
  const indexMap = new Map(orderedIds.map((id, i) => [id, i]));
  course.chapters.sort((a, b) => {
    const ai = indexMap.has(a.id) ? indexMap.get(a.id) : Number.MAX_SAFE_INTEGER;
    const bi = indexMap.has(b.id) ? indexMap.get(b.id) : Number.MAX_SAFE_INTEGER;
    return ai - bi;
  });
  renumberChapters(course);
  course.updatedAt = now();
}

// ── Internal ───────────────────────────────────────────────────────

function renumberChapters(course) {
  course.chapters.forEach((ch, i) => { ch.order = i; });
}
