/**
 * editor/blocks.js – Block-Rendering im Editor
 * ==============================================
 * Eine renderBlock-Funktion pro Block-Typ.
 * Liefert ein DOM-Element zurück, das in den Editor eingefügt wird.
 *
 * WICHTIG: Diese Funktionen rendern für den EDITOR (DOM-Elemente).
 * Der Export rendert eigene HTML-Strings in exporter/exporter.js.
 *
 * Phase 1 (jetzt):  Read-only Anzeige als DOM-Elemente
 * Phase 2 (später): Inline-Editing via TipTap
 * Phase 3 (später): Block-Aktionen (löschen, verschieben)
 *
 * Neuen Block-Typ hinzufügen?
 *   1. core/block-types.js: Typ + DEFAULTS eintragen
 *   2. Hier eine render-Funktion ergänzen + im switch eintragen
 *   3. exporter/exporter.js: blockToHTML erweitern
 *
 * Abhängigkeiten: core/block-types.js, core/utils.js
 */

import { BLOCK_TYPES } from "../core/block-types.js";
import { escapeHTML } from "../core/utils.js";

/**
 * Rendert einen einzelnen Block als DOM-Element.
 * @param {object} block - Block-Daten aus block-types.js
 * @param {string} chapterId - für späteres State-Update
 * @returns {HTMLElement}
 */
export function renderBlock(block, chapterId) {
  let el;
  switch (block.type) {
    case BLOCK_TYPES.TEXT:    el = renderText(block); break;
    case BLOCK_TYPES.HEADING: el = renderHeading(block); break;
    case BLOCK_TYPES.IMAGE:   el = renderImage(block); break;
    case BLOCK_TYPES.YOUTUBE: el = renderYoutube(block); break;
    case BLOCK_TYPES.TABLE:   el = renderTable(block); break;
    case BLOCK_TYPES.LIST:    el = renderList(block); break;
    case BLOCK_TYPES.DIVIDER: el = renderDivider(); break;
    case BLOCK_TYPES.MERKE:   el = renderLernbox(block, "merke",  "📌 Merke"); break;
    case BLOCK_TYPES.KLINIK:  el = renderLernbox(block, "klinik", "🏥 Klinischer Bezug"); break;
    case BLOCK_TYPES.TIPP:    el = renderLernbox(block, "tipp",   "💡 Tipp"); break;
    case BLOCK_TYPES.QUIZ:    el = renderQuiz(block); break;
    case BLOCK_TYPES.AUFGABE: el = renderAufgabe(block); break;
    default:
      console.warn("Unbekannter Block-Typ:", block.type);
      el = document.createElement("div");
      el.textContent = `[Unbekannter Block: ${block.type}]`;
  }
  el.classList.add("block");
  el.dataset.blockId = block.id;
  el.dataset.chapterId = chapterId;
  return el;
}

// ── Render-Funktionen ──────────────────────────────────────────────
// Phase 1: Read-only. Phase 3 erweitert um Editing-Hooks.

function renderText(block) {
  const el = document.createElement("p");
  el.innerHTML = escapeHTML(block.content) || "<em style='color:#94a3b8'>Leerer Text</em>";
  return el;
}

function renderHeading(block) {
  const level = Math.max(1, Math.min(3, block.level || 2));
  const el = document.createElement(`h${level}`);
  el.textContent = block.content || "Überschrift";
  return el;
}

function renderImage(block) {
  const el = document.createElement("figure");
  if (block.src) {
    const img = document.createElement("img");
    img.src = block.src;
    img.alt = block.alt || "";
    img.style.maxWidth = "100%";
    el.appendChild(img);
    if (block.caption) {
      const cap = document.createElement("figcaption");
      cap.textContent = block.caption;
      el.appendChild(cap);
    }
  } else {
    el.innerHTML = `<div style="padding:24px; background:#f0f2f5; border-radius:6px; text-align:center; color:#94a3b8;">Bild – noch kein Bild gewählt</div>`;
  }
  return el;
}

function renderYoutube(block) {
  const el = document.createElement("div");
  if (block.url) {
    const id = extractYoutubeId(block.url);
    if (id) {
      el.innerHTML = `<iframe width="100%" height="400" src="https://www.youtube.com/embed/${id}" frameborder="0" allowfullscreen></iframe>`;
    } else {
      el.textContent = `YouTube-URL ungültig: ${block.url}`;
    }
  } else {
    el.innerHTML = `<div style="padding:24px; background:#f0f2f5; border-radius:6px; text-align:center; color:#94a3b8;">YouTube – noch keine URL</div>`;
  }
  return el;
}

function renderTable(block) {
  const el = document.createElement("table");
  el.style.borderCollapse = "collapse";
  el.style.width = "100%";
  block.rows.forEach((row, i) => {
    const tr = document.createElement("tr");
    row.forEach(cell => {
      const td = document.createElement(i === 0 ? "th" : "td");
      td.textContent = cell;
      td.style.border = "1px solid #e2e8f0";
      td.style.padding = "8px";
      tr.appendChild(td);
    });
    el.appendChild(tr);
  });
  return el;
}

function renderList(block) {
  const el = document.createElement(block.ordered ? "ol" : "ul");
  block.items.forEach(item => {
    const li = document.createElement("li");
    li.textContent = item;
    el.appendChild(li);
  });
  return el;
}

function renderDivider() {
  return document.createElement("hr");
}

function renderLernbox(block, cssClass, label) {
  const el = document.createElement("div");
  el.className = `atm-${cssClass}`;
  el.innerHTML = `<strong>${label}</strong><br>${escapeHTML(block.content) || "<em style='color:#94a3b8'>Leer</em>"}`;
  return el;
}

function renderQuiz(block) {
  const el = document.createElement("div");
  el.className = "atm-quiz";
  const opts = block.options.map((opt, i) => `
    <li ${i === block.correct ? 'style="font-weight:600"' : ""}>${escapeHTML(opt) || "(leer)"}</li>
  `).join("");
  el.innerHTML = `<strong>❓ Quiz</strong><p>${escapeHTML(block.question) || "(keine Frage)"}</p><ol>${opts}</ol>`;
  return el;
}

function renderAufgabe(block) {
  const el = document.createElement("div");
  el.className = "atm-tipp";
  el.innerHTML = `<strong>✏ Aufgabe</strong><p>${escapeHTML(block.content) || "(leer)"}</p>`;
  return el;
}

// ── Helpers ────────────────────────────────────────────────────────

function extractYoutubeId(url) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
  return match ? match[1] : null;
}
