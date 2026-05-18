/**
 * editor/editor.js – Block-Editor Controller
 * ============================================
 * Mittlere Spalte. Zeigt das aktuell aktive Kapitel als editierbare
 * Block-Liste. Reagiert auf State.subscribe (Kapitel gewechselt → neu rendern).
 *
 * Diese Datei ist der Controller. Das eigentliche Block-Rendering passiert
 * in editor/blocks.js (eine renderBlock-Funktion pro Block-Typ).
 *
 * Implementierungsreihenfolge:
 *   Phase 1: Read-only Anzeige aller Blöcke (stub erledigt)
 *   Phase 2: Block hinzufügen / löschen / verschieben (TODO)
 *   Phase 3: Inline-Editing pro Block via TipTap (TODO)
 *
 * Abhängigkeiten:
 *   core/state.js, core/chapter.js, editor/blocks.js
 */

import * as State from "../core/state.js";
import { renderBlock } from "./blocks.js";
import { escapeHTML } from "../core/utils.js";

let container = null;

/**
 * Initialisiert den Editor im gegebenen Container.
 * @param {HTMLElement} el
 */
export function initEditor(el) {
  container = el;
  renderEmpty();

  // Bei jeder State-Änderung neu rendern (Kapitel-Wechsel inkludiert)
  State.subscribe(render);
}

// ── Rendering ──────────────────────────────────────────────────────

function render(course) {
  if (!container) return;

  if (!course) {
    renderEmpty();
    return;
  }

  const chapter = State.getActiveChapter();
  if (!chapter) {
    renderEmpty("Wähle links ein Kapitel oder lege ein neues an.");
    return;
  }

  // TODO Phase 2: "Block hinzufügen"-Button und Drop-Zone für neue Blöcke
  // TODO Phase 3: Inline-Editing pro Block

  const canvas = document.createElement("div");
  canvas.className = "page-canvas";

  const heading = document.createElement("h1");
  heading.className = "chapter-heading";
  heading.contentEditable = "true";
  heading.spellcheck = true;
  heading.textContent = chapter.title;
  heading.addEventListener("blur", e => {
    const newTitle = e.target.textContent.trim() || "Unbenannt";
    State.update(c => {
      const ch = c.chapters.find(x => x.id === chapter.id);
      if (ch) ch.title = newTitle;
    });
  });
  canvas.appendChild(heading);

  // Blöcke rendern
  if (chapter.blocks.length === 0) {
    const empty = document.createElement("div");
    empty.className = "editor-empty";
    empty.innerHTML = `Dieses Kapitel ist leer.<br>Füge rechts einen Block hinzu.`;
    canvas.appendChild(empty);
  } else {
    chapter.blocks.forEach(block => {
      const el = renderBlock(block, chapter.id);
      canvas.appendChild(el);
    });
  }

  container.innerHTML = "";
  container.appendChild(canvas);
}

function renderEmpty(message = "Kein Kurs geladen.") {
  container.innerHTML = `<div class="editor-empty">${escapeHTML(message)}</div>`;
}
