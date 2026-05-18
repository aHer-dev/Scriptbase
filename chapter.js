/**
 * core/chapter.js – Kapitel-Operationen
 * =======================================
 * Reine Funktionen für Kapitel-Datenstrukturen.
 *
 * WICHTIG: Diese Funktionen MUTIEREN das übergebene Objekt IN-PLACE.
 *          Sie geben kein neues Objekt zurück.
 *          Aufruf immer aus state.update():
 *
 *            state.update(course => {
 *              const chapter = course.chapters[0];
 *              addBlock(chapter, createBlock("text"));
 *            });
 *
 * Abhängigkeiten: core/utils.js, core/block-types.js
 */

import { uid, now } from "./utils.js";
import { isValidBlockType } from "./block-types.js";

/**
 * Erzeugt ein neues, leeres Kapitel.
 * @param {string} title
 * @param {number} order
 * @returns {object}
 */
export function createChapter(title = "Neues Kapitel", order = 0) {
  return {
    id: uid("chapter"),
    title,
    order,
    blocks: [],
    createdAt: now(),
    updatedAt: now(),
  };
}

/**
 * Fügt einen Block zum Kapitel hinzu.
 * @param {object} chapter
 * @param {object} block - aus createBlock()
 * @param {number} [atIndex] - optional: Position. Default: ans Ende.
 */
export function addBlock(chapter, block, atIndex = null) {
  if (!block || !isValidBlockType(block.type)) {
    throw new Error("Ungültiger Block für addBlock().");
  }
  if (atIndex === null || atIndex >= chapter.blocks.length) {
    chapter.blocks.push(block);
  } else {
    chapter.blocks.splice(Math.max(0, atIndex), 0, block);
  }
  chapter.updatedAt = now();
}

/**
 * Entfernt einen Block aus dem Kapitel.
 * @param {object} chapter
 * @param {string} blockId
 * @returns {boolean} true wenn entfernt, false wenn nicht gefunden
 */
export function removeBlock(chapter, blockId) {
  const before = chapter.blocks.length;
  chapter.blocks = chapter.blocks.filter(b => b.id !== blockId);
  const removed = chapter.blocks.length < before;
  if (removed) chapter.updatedAt = now();
  return removed;
}

/**
 * Aktualisiert Felder eines Blocks (Object.assign-Style).
 * @param {object} chapter
 * @param {string} blockId
 * @param {object} patch
 * @returns {boolean} true wenn aktualisiert
 */
export function updateBlock(chapter, blockId, patch) {
  const block = chapter.blocks.find(b => b.id === blockId);
  if (!block) return false;
  Object.assign(block, patch);
  chapter.updatedAt = now();
  return true;
}

/**
 * Findet einen Block per ID.
 * @param {object} chapter
 * @param {string} blockId
 * @returns {object|null}
 */
export function findBlock(chapter, blockId) {
  return chapter.blocks.find(b => b.id === blockId) ?? null;
}

/**
 * Sortiert Blöcke nach gegebener ID-Reihenfolge.
 * IDs die nicht in orderedIds vorkommen, landen am Ende.
 *
 * @param {object} chapter
 * @param {string[]} orderedIds
 */
export function reorderBlocks(chapter, orderedIds) {
  const indexMap = new Map(orderedIds.map((id, i) => [id, i]));
  chapter.blocks.sort((a, b) => {
    const ai = indexMap.has(a.id) ? indexMap.get(a.id) : Number.MAX_SAFE_INTEGER;
    const bi = indexMap.has(b.id) ? indexMap.get(b.id) : Number.MAX_SAFE_INTEGER;
    return ai - bi;
  });
  chapter.updatedAt = now();
}

/**
 * Verschiebt einen Block um delta Positionen (negativ = nach oben).
 * @param {object} chapter
 * @param {string} blockId
 * @param {number} delta
 */
export function moveBlock(chapter, blockId, delta) {
  const idx = chapter.blocks.findIndex(b => b.id === blockId);
  if (idx === -1) return;
  const newIdx = Math.max(0, Math.min(chapter.blocks.length - 1, idx + delta));
  if (newIdx === idx) return;
  const [block] = chapter.blocks.splice(idx, 1);
  chapter.blocks.splice(newIdx, 0, block);
  chapter.updatedAt = now();
}
