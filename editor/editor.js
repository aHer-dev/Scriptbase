/**
 * editor/editor.js – Block-Editor Controller
 * ============================================
 * Phase 6: Blöcke hinzufügen, löschen, verschieben, inline editieren.
 *
 * Abhängigkeiten: core/state.js, core/chapter.js, editor/blocks.js
 */

import * as State from "../core/state.js";
import { addBlock, removeBlock, moveBlock, reorderBlocks, updateBlock } from "../core/chapter.js";
import { createBlock, ALL_BLOCK_TYPES } from "../core/block-types.js";
import { renderBlock } from "./blocks.js";
import { escapeHTML } from "../core/utils.js";
import { getPaperStyle } from "../design/paper-style.js";

let container = null;

export function initEditor(el) {
  container = el;
  renderEmpty();
  State.subscribe(render);
}

// ── Rendering ───────────────────────────────────────────────────────

function render(course) {
  if (!container) return;
  if (!course) { renderEmpty(); return; }

  const chapter = State.getActiveChapter();
  if (!chapter) {
    renderEmpty("Wähle links ein Kapitel oder lege ein neues an.");
    return;
  }

  const canvas = document.createElement("div");
  canvas.className = "page-canvas";
  if (getPaperStyle() === "flat") canvas.classList.add("page-canvas--flat");

  // Kapitel-Titel
  const heading = document.createElement("h1");
  heading.className      = "chapter-heading";
  heading.contentEditable = "true";
  heading.spellcheck     = true;
  heading.textContent    = chapter.title;
  heading.addEventListener("blur", e => {
    const newTitle = e.target.textContent.trim() || "Unbenannt";
    State.update(c => {
      const ch = c.chapters.find(x => x.id === chapter.id);
      if (ch) ch.title = newTitle;
    });
  });
  canvas.appendChild(heading);

  // Blöcke + Insert-Linien
  if (chapter.blocks.length === 0) {
    canvas.appendChild(makeInsertLine(chapter.id, 0));
    const empty = document.createElement("div");
    empty.className = "editor-empty";
    empty.innerHTML = `Dieses Kapitel ist leer.<br>Klicke <strong>+</strong> um einen Block einzufügen.`;
    canvas.appendChild(empty);
  } else {
    chapter.blocks.forEach((block, i) => {
      canvas.appendChild(makeInsertLine(chapter.id, i));
      const shell = renderBlock(block, chapter.id, {
        onDelete:   () => deleteBlock(chapter.id, block.id),
        onMoveUp:   () => shiftBlock(chapter.id, block.id, -1),
        onMoveDown: () => shiftBlock(chapter.id, block.id, +1),
        onUpdate:   (patch) => patchBlock(chapter.id, block.id, patch),
      });
      canvas.appendChild(shell);
    });
    canvas.appendChild(makeInsertLine(chapter.id, chapter.blocks.length));
  }

  setupDragAndDrop(canvas, chapter.id);

  container.innerHTML = "";
  container.appendChild(canvas);
}

// ── Insert Line ──────────────────────────────────────────────────────

const GROUP_LABELS = { inhalt: "Inhalt", lernbox: "Lern-Boxen", interaktion: "Interaktion" };

function makeInsertLine(chapterId, insertIndex) {
  const line = document.createElement("div");
  line.className = "insert-line";

  const track = document.createElement("div");
  track.className = "insert-line-track";

  const btn = document.createElement("button");
  btn.className = "insert-line-btn";
  btn.title = "Block hier einfügen";
  btn.textContent = "+";

  line.appendChild(track);
  line.appendChild(btn);

  let palette = null;

  btn.addEventListener("click", e => {
    e.stopPropagation();
    if (palette) {
      palette.remove(); palette = null;
      line.classList.remove("insert-line--open");
      line.closest(".page-canvas")?.classList.remove("palette-open");
      return;
    }

    palette = document.createElement("div");
    palette.className = "insert-palette";

    Object.entries(GROUP_LABELS).forEach(([groupKey, groupLabel]) => {
      const items = ALL_BLOCK_TYPES.filter(t => t.group === groupKey);
      const groupEl = document.createElement("div");
      groupEl.className = "insert-palette-group";

      const lbl = document.createElement("div");
      lbl.className = "insert-palette-label";
      lbl.textContent = groupLabel;
      groupEl.appendChild(lbl);

      items.forEach(({ type, label, icon }) => {
        const b = document.createElement("button");
        b.className = "insert-palette-btn";
        b.innerHTML = `<i data-lucide="${icon}" class="lucide-icon"></i><span>${label}</span>`;
        b.addEventListener("click", ev => {
          ev.stopPropagation();
          addBlockAtIndex(chapterId, type, insertIndex);
          palette.remove();
          palette = null;
          line.classList.remove("insert-line--open");
        });
        groupEl.appendChild(b);
      });
      palette.appendChild(groupEl);
    });

    line.appendChild(palette);
    window.lucide?.createIcons();
    line.classList.add("insert-line--open");
    line.closest(".page-canvas")?.classList.add("palette-open");

    // Close on outside click (capture phase to beat stopPropagation)
    const closePalette = ev => {
      if (line.contains(ev.target)) return;
      palette?.remove();
      palette = null;
      line.classList.remove("insert-line--open");
      line.closest(".page-canvas")?.classList.remove("palette-open");
      document.removeEventListener("click", closePalette, true);
    };
    setTimeout(() => document.addEventListener("click", closePalette, true), 0);
  });

  return line;
}

function addBlockAtIndex(chapterId, type, atIndex) {
  const block = createBlock(type);
  State.update(course => {
    const ch = course.chapters.find(c => c.id === chapterId);
    if (ch) addBlock(ch, block, atIndex);
  });
}

// ── Drag & Drop ──────────────────────────────────────────────────────

function setupDragAndDrop(canvas, chapterId) {
  let dragSourceId = null;

  canvas.addEventListener("dragstart", e => {
    const shell = e.target.closest(".block-shell");
    if (!shell) return;
    dragSourceId = shell.dataset.blockId;
    shell.classList.add("block-shell--dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", dragSourceId);
  });

  canvas.addEventListener("dragend", () => {
    canvas.querySelectorAll(".block-shell").forEach(s => {
      s.draggable = false;
      s.classList.remove("block-shell--dragging", "block-shell--drop-above", "block-shell--drop-below");
    });
    dragSourceId = null;
  });

  canvas.addEventListener("dragover", e => {
    if (!dragSourceId) return; // File-Drag → Image-Blöcke selbst behandeln
    const shell = e.target.closest(".block-shell");
    if (!shell || shell.dataset.blockId === dragSourceId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const rect = shell.getBoundingClientRect();
    const above = e.clientY < rect.top + rect.height / 2;
    canvas.querySelectorAll(".block-shell--drop-above, .block-shell--drop-below")
      .forEach(s => s.classList.remove("block-shell--drop-above", "block-shell--drop-below"));
    shell.classList.add(above ? "block-shell--drop-above" : "block-shell--drop-below");
  });

  canvas.addEventListener("dragleave", e => {
    if (!dragSourceId) return;
    const shell = e.target.closest(".block-shell");
    if (shell) shell.classList.remove("block-shell--drop-above", "block-shell--drop-below");
  });

  canvas.addEventListener("drop", e => {
    if (!dragSourceId) return; // File-Drop → Image-Block hat stopPropagation
    e.preventDefault();
    const targetShell = e.target.closest(".block-shell");
    if (!targetShell) return;
    const targetId = targetShell.dataset.blockId;
    if (targetId === dragSourceId) return;

    const rect = targetShell.getBoundingClientRect();
    const dropAbove = e.clientY < rect.top + rect.height / 2;

    const allIds = [...canvas.querySelectorAll(".block-shell")]
      .map(s => s.dataset.blockId)
      .filter(id => id !== dragSourceId);
    const targetIdx = allIds.indexOf(targetId);
    allIds.splice(dropAbove ? targetIdx : targetIdx + 1, 0, dragSourceId);

    State.update(course => {
      const ch = course.chapters.find(c => c.id === chapterId);
      if (ch) reorderBlocks(ch, allIds);
    });
  });
}

function renderEmpty(message = "Kein Kurs geladen.") {
  container.innerHTML = `<div class="editor-empty">${escapeHTML(message)}</div>`;
}

// ── Block-CRUD ──────────────────────────────────────────────────────

export function addBlockToActiveChapter(type) {
  const chapter = State.getActiveChapter();
  if (!chapter) return;
  addBlockAtIndex(chapter.id, type, null);
}

function deleteBlock(chapterId, blockId) {
  State.update(course => {
    const ch = course.chapters.find(c => c.id === chapterId);
    if (ch) removeBlock(ch, blockId);
  });
}

function shiftBlock(chapterId, blockId, delta) {
  State.update(course => {
    const ch = course.chapters.find(c => c.id === chapterId);
    if (ch) moveBlock(ch, blockId, delta);
  });
}

function patchBlock(chapterId, blockId, patch) {
  State.update(course => {
    const ch = course.chapters.find(c => c.id === chapterId);
    if (ch) updateBlock(ch, blockId, patch);
  });
}
