/**
 * sidebar/sidebar.js – Kapitel-Manager
 * ======================================
 * Linke Spalte. Zeigt alle Kapitel des aktuellen Kurses.
 * Bietet: Auswählen, Hinzufügen, Umbenennen, Löschen, Drag&Drop.
 *
 * Liest State über subscribe(), schreibt über update().
 *
 * Abhängigkeiten: core/state.js, core/course.js, core/chapter.js, core/utils.js
 */

import * as State from "../core/state.js";
import { createChapter } from "../core/chapter.js";
import {
  addChapter,
  removeChapter,
  renameChapter,
  reorderChapters,
} from "../core/course.js";
import { escapeHTML } from "../core/utils.js";

let container = null;

/**
 * Initialisiert die Sidebar im gegebenen Container.
 * @param {HTMLElement} el
 */
export function initSidebar(el) {
  container = el;
  container.innerHTML = `
    <div class="sidebar-header">
      <h2>Kapitel</h2>
      <button class="btn btn-small" id="btn-add-chapter" title="Neues Kapitel">+</button>
    </div>
    <ul class="chapter-list" id="chapter-list"></ul>
  `;

  document.getElementById("btn-add-chapter").addEventListener("click", onAddChapter);

  // Bei jeder State-Änderung neu rendern
  State.subscribe(render);
}

// ── Rendering ──────────────────────────────────────────────────────

function render(course) {
  const list = document.getElementById("chapter-list");
  if (!list) return;

  if (!course || !course.chapters || course.chapters.length === 0) {
    list.innerHTML = `
      <li class="chapter-empty">
        Noch keine Kapitel.<br>
        Klick auf <strong>+</strong> oder importiere ein ZIP.
      </li>`;
    return;
  }

  const activeId = State.getActiveChapterId();

  list.innerHTML = course.chapters.map((ch, i) => `
    <li class="chapter-item ${ch.id === activeId ? "active" : ""}"
        data-id="${ch.id}" draggable="true">
      <span class="chapter-number">${String(i + 1).padStart(2, "0")}</span>
      <span class="chapter-title">${escapeHTML(ch.title)}</span>
      <span class="chapter-actions">
        <button class="btn-icon" data-action="rename" title="Umbenennen">✎</button>
        <button class="btn-icon" data-action="delete" title="Löschen">×</button>
      </span>
    </li>
  `).join("");

  attachItemHandlers();
}

function attachItemHandlers() {
  container.querySelectorAll(".chapter-item").forEach(item => {
    const id = item.dataset.id;

    // Klick auf Item → aktivieren (außer auf Action-Buttons)
    item.addEventListener("click", e => {
      if (e.target.closest(".chapter-actions")) return;
      State.setActiveChapter(id);
    });

    item.querySelector('[data-action="rename"]')
      .addEventListener("click", e => { e.stopPropagation(); onRenameChapter(id); });
    item.querySelector('[data-action="delete"]')
      .addEventListener("click", e => { e.stopPropagation(); onDeleteChapter(id); });

    item.addEventListener("dragstart", onDragStart);
    item.addEventListener("dragover",  onDragOver);
    item.addEventListener("dragleave", onDragLeave);
    item.addEventListener("drop",      onDrop);
    item.addEventListener("dragend",   onDragEnd);
  });
}

// ── Aktionen ───────────────────────────────────────────────────────

function onAddChapter() {
  const chapter = createChapter("Neues Kapitel");
  State.update(course => {
    addChapter(course, chapter);
    course.activeChapterId = chapter.id;
  });
}

function onRenameChapter(chapterId) {
  const course = State.getCourse();
  const chapter = course?.chapters.find(c => c.id === chapterId);
  if (!chapter) return;

  const newTitle = prompt("Neuer Kapitel-Titel:", chapter.title);
  if (newTitle === null || newTitle.trim() === "") return;

  State.update(c => { renameChapter(c, chapterId, newTitle.trim()); });
}

function onDeleteChapter(chapterId) {
  if (!confirm("Kapitel wirklich löschen? Das kann nicht rückgängig gemacht werden.")) return;
  // removeChapter setzt activeChapterId selbst neu wenn nötig
  State.update(c => { removeChapter(c, chapterId); });
}

// ── Drag & Drop ────────────────────────────────────────────────────

let draggedId = null;

function onDragStart(e) {
  draggedId = e.currentTarget.dataset.id;
  e.currentTarget.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
}

function onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
  e.currentTarget.classList.add("drag-over");
}

function onDragLeave(e) {
  e.currentTarget.classList.remove("drag-over");
}

function onDrop(e) {
  e.preventDefault();
  const targetId = e.currentTarget.dataset.id;
  e.currentTarget.classList.remove("drag-over");
  if (!draggedId || draggedId === targetId) return;

  State.update(course => {
    const ids = course.chapters.map(c => c.id);
    const fromIdx = ids.indexOf(draggedId);
    const toIdx   = ids.indexOf(targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    const [moved] = ids.splice(fromIdx, 1);
    ids.splice(toIdx, 0, moved);
    reorderChapters(course, ids);
  });
}

function onDragEnd(e) {
  e.currentTarget.classList.remove("dragging");
  container.querySelectorAll(".drag-over")
    .forEach(el => el.classList.remove("drag-over"));
  draggedId = null;
}
