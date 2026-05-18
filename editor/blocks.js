/**
 * editor/blocks.js – Block-Rendering im Editor
 * ==============================================
 * renderBlock()  → liest Block-Daten, gibt editierbares DOM-Element zurück
 *
 * Abhängigkeiten: core/block-types.js, core/utils.js
 */

import { BLOCK_TYPES } from "../core/block-types.js";
import { uid, normalizeContent } from "../core/utils.js";

export function renderBlock(block, chapterId, callbacks = {}) {
  const shell = document.createElement("div");
  shell.className = "block-shell";
  shell.dataset.blockId   = block.id;
  shell.dataset.chapterId = chapterId;
  shell.draggable = false;

  const handle = document.createElement("div");
  handle.className = "block-drag-handle";
  handle.title     = "Ziehen zum Verschieben";
  handle.textContent = "⠿";
  handle.addEventListener("mousedown", () => { shell.draggable = true; });
  handle.addEventListener("mouseup",   () => { shell.draggable = false; });

  const delBtn = document.createElement("button");
  delBtn.className   = "block-delete-btn";
  delBtn.title       = "Block löschen";
  delBtn.textContent = "×";
  delBtn.addEventListener("click", e => { e.stopPropagation(); callbacks.onDelete?.(); });

  const inner = renderBlockInner(block, callbacks.onUpdate);
  inner.classList.add("block");
  inner.dataset.blockId   = block.id;
  inner.dataset.chapterId = chapterId;

  shell.appendChild(handle);
  shell.appendChild(delBtn);
  shell.appendChild(inner);
  return shell;
}

// ── Inner-Renderer ────────────────────────────────────────────────────

function renderBlockInner(block, onUpdate) {
  switch (block.type) {
    case BLOCK_TYPES.TEXT:       return renderText(block, onUpdate);
    case BLOCK_TYPES.HEADING:    return renderHeading(block, onUpdate);
    case BLOCK_TYPES.IMAGE:      return renderImage(block, onUpdate);
    case BLOCK_TYPES.YOUTUBE:    return renderYoutube(block, onUpdate);
    case BLOCK_TYPES.TABLE:      return renderTable(block, onUpdate);
    case BLOCK_TYPES.LIST:       return renderList(block, onUpdate);
    case BLOCK_TYPES.DIVIDER:    return renderDivider();
    case BLOCK_TYPES.LERNZIELE:    return renderLernbox(block, "lernziele",    "🎯 Lernziele",           onUpdate);
    case BLOCK_TYPES.MERKE:        return renderLernbox(block, "merke",        "📌 Merke",               onUpdate);
    case BLOCK_TYPES.ESELSBRUECKE: return renderLernbox(block, "eselsbruecke", "⚡ Eselsbrücke",          onUpdate);
    case BLOCK_TYPES.KLINIK:       return renderKlinik(block, onUpdate);
    case BLOCK_TYPES.INFO:         return renderInfo(block, onUpdate);
    case BLOCK_TYPES.TIPP:         return renderLernbox(block, "tipp",         "💡 Tipp",                onUpdate);
    case BLOCK_TYPES.AUFGABE:      return renderAufgabe(block, onUpdate);
    case BLOCK_TYPES.MUSKEL:       return renderMuskel(block, onUpdate);
    case BLOCK_TYPES.REFLEXION:    return renderLernbox(block, "reflexion",    "💭 Zur Reflexion",       onUpdate);
    case BLOCK_TYPES.QUIZ:       return renderQuizBase(block, false, onUpdate);
    case BLOCK_TYPES.QUIZ_MULTI: return renderQuizBase(block, true,  onUpdate);
    case BLOCK_TYPES.TRUE_FALSE: return renderTrueFalse(block, onUpdate);
    case BLOCK_TYPES.LUECKE:     return renderLuecke(block, onUpdate);
    case BLOCK_TYPES.ZUORDNUNG:  return renderZuordnung(block, onUpdate);
    case BLOCK_TYPES.HOTSPOT:    return renderHotspot(block, onUpdate);
    default: {
      const el = document.createElement("div");
      el.textContent = `[Unbekannter Block: ${block.type}]`;
      return el;
    }
  }
}

// ── Basis-Content-Typen ───────────────────────────────────────────────

function renderText(block, onUpdate) {
  const el = document.createElement("p");
  el.innerHTML       = normalizeContent(block.content || "");
  el.contentEditable = "true";
  el.spellcheck      = true;
  withPlaceholder(el, "Text eingeben…");
  onBlurSave(el, () => onUpdate?.({ content: el.innerHTML }));
  return el;
}

function renderHeading(block, onUpdate) {
  const level = Math.max(1, Math.min(3, block.level || 2));
  const el = document.createElement(`h${level}`);
  el.innerHTML       = normalizeContent(block.content || "");
  el.contentEditable = "true";
  withPlaceholder(el, "Überschrift eingeben…");
  onBlurSave(el, () => onUpdate?.({ content: el.innerHTML }));
  return el;
}

function renderImage(block, onUpdate) {
  const el     = document.createElement("figure");
  const setImg = url => onUpdate?.({ src: url });

  if (block.src) {
    makeDragDropZone(el, setImg);

    const imgWrap = document.createElement("div");
    imgWrap.className = "img-resize-wrap";
    const w = block.width || 100;
    imgWrap.style.width = w + "%";

    const img = document.createElement("img");
    img.src       = block.src;
    img.alt       = block.alt || "";
    img.className = "img-resizable";
    imgWrap.appendChild(img);

    // Resize-Handle rechts
    const resizeHandle = document.createElement("div");
    resizeHandle.className = "img-resize-handle";
    imgWrap.appendChild(resizeHandle);

    // Width-Label beim Ziehen
    const label = document.createElement("div");
    label.className = "img-resize-label";
    label.textContent = w + "%";
    imgWrap.appendChild(label);

    resizeHandle.addEventListener("mousedown", e => {
      e.preventDefault();
      e.stopPropagation();
      const startX       = e.clientX;
      const containerW   = el.getBoundingClientRect().width;
      const startWidthPx = imgWrap.getBoundingClientRect().width;
      imgWrap.classList.add("img-resize-wrap--dragging");

      const onMove = mv => {
        const delta   = mv.clientX - startX;
        const newW    = Math.round(Math.min(100, Math.max(20, (startWidthPx + delta) / containerW * 100)));
        imgWrap.style.width    = newW + "%";
        label.textContent = newW + "%";
      };
      const onUp = () => {
        imgWrap.classList.remove("img-resize-wrap--dragging");
        const finalW = Math.round(parseFloat(imgWrap.style.width));
        onUpdate?.({ width: finalW });
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    });

    el.appendChild(imgWrap);

    const cap = document.createElement("figcaption");
    cap.innerHTML       = block.caption || "";
    cap.contentEditable = "true";
    withPlaceholder(cap, "Bildunterschrift…");
    onBlurSave(cap, () => onUpdate?.({ caption: cap.innerHTML }));
    el.appendChild(cap);
  } else {
    el.classList.add("drop-zone");
    makeDragDropZone(el, setImg);
    el.appendChild(buildImageForm(setImg));
  }
  return el;
}

function renderYoutube(block, onUpdate) {
  const el = document.createElement("div");
  const id = block.url ? extractYoutubeId(block.url) : null;
  if (id) {
    const iframe = document.createElement("iframe");
    iframe.width  = "100%";
    iframe.height = "360";
    iframe.src    = `https://www.youtube.com/embed/${id}`;
    iframe.setAttribute("frameborder", "0");
    iframe.setAttribute("allowfullscreen", "");
    iframe.style.cssText = "border-radius:8px;display:block";
    el.appendChild(iframe);
  } else {
    el.appendChild(buildUrlForm("YouTube-URL", block.url || "", url => onUpdate?.({ url })));
  }
  return el;
}

function renderTable(block, onUpdate) {
  const wrap = document.createElement("div");
  wrap.className = "table-wrap";

  const el = document.createElement("table");
  el.className = "editor-table";

  function getRows() {
    return [...el.querySelectorAll("tr")].map(tr =>
      [...tr.querySelectorAll("th,td")].map(c => c.innerHTML)
    );
  }

  function buildCell(content, isHeader) {
    const cell = document.createElement(isHeader ? "th" : "td");
    cell.innerHTML       = content || "";
    cell.contentEditable = "true";
    withPlaceholder(cell, "…");
    onBlurSave(cell, () => onUpdate?.({ rows: getRows() }));
    return cell;
  }

  block.rows.forEach((row, i) => {
    const tr = document.createElement("tr");
    row.forEach(cell => tr.appendChild(buildCell(cell, i === 0)));
    el.appendChild(tr);
  });

  wrap.appendChild(el);

  const controls = document.createElement("div");
  controls.className = "table-controls";

  function tableBtn(label, danger, onClick) {
    const btn = document.createElement("button");
    btn.className   = `btn table-btn${danger ? " table-btn--del" : ""}`;
    btn.textContent = label;
    btn.addEventListener("click", onClick);
    return btn;
  }

  controls.appendChild(tableBtn("+ Zeile", false, () => {
    const rows = getRows();
    onUpdate?.({ rows: [...rows, Array(rows[0]?.length || 2).fill("")] });
  }));
  controls.appendChild(tableBtn("+ Spalte", false, () => {
    onUpdate?.({ rows: getRows().map(r => [...r, ""]) });
  }));
  controls.appendChild(tableBtn("− Zeile", true, () => {
    const rows = getRows();
    if (rows.length > 1) onUpdate?.({ rows: rows.slice(0, -1) });
  }));
  controls.appendChild(tableBtn("− Spalte", true, () => {
    const rows = getRows();
    if (rows[0]?.length > 1) onUpdate?.({ rows: rows.map(r => r.slice(0, -1)) });
  }));

  wrap.appendChild(controls);
  return wrap;
}

function renderList(block, onUpdate) {
  const el = document.createElement(block.ordered ? "ol" : "ul");
  block.items.forEach(item => {
    const li = document.createElement("li");
    li.innerHTML       = item;
    li.contentEditable = "true";
    onBlurSave(li, () => {
      const newItems = [...el.querySelectorAll("li")].map(l => l.innerHTML);
      onUpdate?.({ items: newItems });
    });
    el.appendChild(li);
  });
  return el;
}

function renderDivider() {
  return document.createElement("hr");
}

function renderLernbox(block, cssClass, label, onUpdate) {
  const el = document.createElement("div");
  el.className = `atm-${cssClass}`;
  const lbl = document.createElement("strong");
  lbl.textContent = label;
  const body = document.createElement("div");
  body.innerHTML       = normalizeContent(block.content || "");
  body.contentEditable = "true";
  withPlaceholder(body, "Inhalt eingeben…");
  onBlurSave(body, () => onUpdate?.({ content: body.innerHTML }));
  el.appendChild(lbl);
  el.appendChild(body);
  return el;
}

function renderAufgabe(block, onUpdate) {
  const el = document.createElement("div");
  el.className = "atm-aufgabe";
  const lbl = document.createElement("strong");
  lbl.textContent = "✏ Aufgabe";
  const body = document.createElement("div");
  body.innerHTML       = normalizeContent(block.content || "");
  body.contentEditable = "true";
  withPlaceholder(body, "Aufgabenstellung…");
  onBlurSave(body, () => onUpdate?.({ content: body.innerHTML }));

  const solLbl = document.createElement("div");
  solLbl.className   = "aufgabe-sol-label";
  solLbl.textContent = "Lösung (optional):";
  const sol = document.createElement("div");
  sol.innerHTML       = normalizeContent(block.solution || "");
  sol.contentEditable = "true";
  sol.className       = "aufgabe-sol-body";
  withPlaceholder(sol, "Musterlösung eingeben… (wird als aufklappbarer Bereich exportiert)");
  onBlurSave(sol, () => onUpdate?.({ solution: sol.innerHTML }));

  el.appendChild(lbl);
  el.appendChild(body);
  el.appendChild(solLbl);
  el.appendChild(sol);
  return el;
}

function renderKlinik(block, onUpdate) {
  const el = document.createElement("div");
  el.className = "atm-klinik";
  const lbl = document.createElement("strong");
  lbl.textContent = "🏥 Klinischer Bezug";
  const titleInp = document.createElement("input");
  titleInp.className   = "lernbox-title-input";
  titleInp.placeholder = "Titel (z.B. Trendelenburg-Zeichen) — optional";
  titleInp.value       = block.title || "";
  titleInp.addEventListener("blur", () => onUpdate?.({ title: titleInp.value }));
  const body = document.createElement("div");
  body.innerHTML       = normalizeContent(block.content || "");
  body.contentEditable = "true";
  withPlaceholder(body, "Klinischen Kontext beschreiben…");
  onBlurSave(body, () => onUpdate?.({ content: body.innerHTML }));
  el.appendChild(lbl);
  el.appendChild(titleInp);
  el.appendChild(body);
  return el;
}

function renderInfo(block, onUpdate) {
  const el = document.createElement("div");
  el.className = "atm-info";
  const lbl = document.createElement("strong");
  lbl.textContent = "ℹ Info";
  const titleInp = document.createElement("input");
  titleInp.className   = "lernbox-title-input";
  titleInp.placeholder = "Titel (z.B. Warum dieses Kapitel?) — optional";
  titleInp.value       = block.title || "";
  titleInp.addEventListener("blur", () => onUpdate?.({ title: titleInp.value }));
  const body = document.createElement("div");
  body.innerHTML       = normalizeContent(block.content || "");
  body.contentEditable = "true";
  withPlaceholder(body, "Hinweis eingeben…");
  onBlurSave(body, () => onUpdate?.({ content: body.innerHTML }));
  el.appendChild(lbl);
  el.appendChild(titleInp);
  el.appendChild(body);
  return el;
}

function renderMuskel(block, onUpdate) {
  const el = document.createElement("div");
  el.className = "atm-muskel";

  const nameEl = document.createElement("div");
  nameEl.className       = "muskel-name";
  nameEl.innerHTML       = block.name || "";
  nameEl.contentEditable = "true";
  withPlaceholder(nameEl, "Muskelname (z.B. M. gluteus maximus)…");
  onBlurSave(nameEl, () => onUpdate?.({ name: nameEl.innerHTML }));
  el.appendChild(nameEl);

  const dl = document.createElement("dl");
  dl.className = "muskel-grid";
  [
    ["ursprung",    "Ursprung"],
    ["ansatz",      "Ansatz"],
    ["funktion",    "Funktion"],
    ["innervation", "Innervation"],
  ].forEach(([key, label]) => {
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    dd.innerHTML       = block[key] || "";
    dd.contentEditable = "true";
    withPlaceholder(dd, `${label} eingeben…`);
    onBlurSave(dd, () => onUpdate?.({ [key]: dd.innerHTML }));
    dl.appendChild(dt);
    dl.appendChild(dd);
  });
  el.appendChild(dl);
  return el;
}

// ── Interaktions-Blöcke ───────────────────────────────────────────────

function renderQuizBase(block, multi, onUpdate) {
  const el = document.createElement("div");
  el.className = "atm-quiz";
  el.innerHTML = `<strong>${multi ? "☑ MC – mehrere richtig" : "❓ MC – eine richtig"}</strong>`;

  const q = document.createElement("div");
  q.className       = "quiz-question";
  q.innerHTML       = block.question || "";
  q.contentEditable = "true";
  withPlaceholder(q, "Frage eingeben…");
  onBlurSave(q, () => onUpdate?.({ question: q.innerHTML }));
  el.appendChild(q);

  const opts = document.createElement("div");
  opts.className = "quiz-options";
  block.options.forEach((opt, i) => {
    const row        = document.createElement("div");
    row.className    = "quiz-option-row";
    const correctArr = multi ? (block.correct || []) : [block.correct];
    const isCorrect  = correctArr.includes(i);

    const marker = document.createElement("span");
    marker.className  = `quiz-option-marker${isCorrect ? " quiz-option-marker--correct" : ""}`;
    marker.textContent = multi ? (isCorrect ? "☑" : "☐") : (isCorrect ? "◉" : "○");
    marker.title = isCorrect ? "Richtige Antwort" : "Falsche Antwort – klicken zum Markieren";
    marker.addEventListener("click", () => {
      if (multi) {
        const cur = [...(block.correct || [])];
        const idx = cur.indexOf(i);
        if (idx === -1) cur.push(i); else cur.splice(idx, 1);
        onUpdate?.({ correct: cur });
      } else {
        onUpdate?.({ correct: i });
      }
    });

    const text = document.createElement("span");
    text.className       = "quiz-option-text";
    text.innerHTML       = opt || "";
    text.contentEditable = "true";
    withPlaceholder(text, "Option…");
    onBlurSave(text, () => {
      const newOpts = [...opts.querySelectorAll(".quiz-option-text")].map(t => t.innerHTML);
      onUpdate?.({ options: newOpts });
    });

    row.appendChild(marker);
    row.appendChild(text);
    opts.appendChild(row);
  });
  el.appendChild(opts);
  return el;
}

function renderTrueFalse(block, onUpdate) {
  const el = document.createElement("div");
  el.className = "atm-quiz";
  el.innerHTML = `<strong>⊤ Wahr / Falsch</strong>`;

  const stmt = document.createElement("div");
  stmt.className       = "quiz-question";
  stmt.innerHTML       = block.statement || "";
  stmt.contentEditable = "true";
  withPlaceholder(stmt, "Aussage eingeben…");
  onBlurSave(stmt, () => onUpdate?.({ statement: stmt.innerHTML }));
  el.appendChild(stmt);

  const btns = document.createElement("div");
  btns.className = "tf-buttons";
  [["Wahr", true], ["Falsch", false]].forEach(([label, val]) => {
    const btn = document.createElement("button");
    btn.className   = `tf-btn${block.correct === val ? " tf-btn--active" : ""}`;
    btn.textContent = label;
    btn.addEventListener("click", () => onUpdate?.({ correct: val }));
    btns.appendChild(btn);
  });
  el.appendChild(btns);
  return el;
}

function renderLuecke(block, onUpdate) {
  const el = document.createElement("div");
  el.className = "atm-quiz";
  el.innerHTML = `<strong>___ Lückentext</strong>`;

  const hint = document.createElement("div");
  hint.className   = "luecke-hint";
  hint.textContent = "Verwende ___ als Platzhalter für die Lücke(n).";
  el.appendChild(hint);

  const textEl = document.createElement("div");
  textEl.className       = "quiz-question";
  textEl.innerHTML       = block.text || "";
  textEl.contentEditable = "true";
  withPlaceholder(textEl, "Satz mit ___ als Lücke eingeben…");
  onBlurSave(textEl, () => {
    const t = textEl.innerHTML;
    const blanks = (t.match(/___/g) || []).map((_, i) => block.blanks?.[i] || "");
    onUpdate?.({ text: t, blanks });
  });
  el.appendChild(textEl);

  const answers = document.createElement("div");
  answers.className = "luecke-answers";
  (block.blanks || []).forEach((ans, i) => {
    const row = document.createElement("div");
    row.className = "luecke-answer-row";
    const lbl = document.createElement("span");
    lbl.textContent = `Lücke ${i + 1}:`;
    const inp = document.createElement("span");
    inp.contentEditable = "true";
    inp.className       = "luecke-answer-input";
    inp.textContent     = ans;
    onBlurSave(inp, () => {
      const newBlanks = [...answers.querySelectorAll(".luecke-answer-input")]
        .map(x => x.textContent.trim());
      onUpdate?.({ blanks: newBlanks });
    });
    row.appendChild(lbl);
    row.appendChild(inp);
    answers.appendChild(row);
  });
  el.appendChild(answers);
  return el;
}

function renderZuordnung(block, onUpdate) {
  const el = document.createElement("div");
  el.className = "atm-quiz";
  el.innerHTML = `<strong>⇔ Zuordnung</strong>`;

  const grid = document.createElement("div");
  grid.className = "zuordnung-grid";
  (block.pairs || []).forEach(pair => {
    const row = document.createElement("div");
    row.className = "zuordnung-row";

    const left = document.createElement("span");
    left.contentEditable = "true";
    left.className       = "zuordnung-cell";
    left.innerHTML       = pair.left || "";
    withPlaceholder(left, "Links…");

    const arrow = document.createElement("span");
    arrow.className   = "zuordnung-arrow";
    arrow.textContent = "→";

    const right = document.createElement("span");
    right.contentEditable = "true";
    right.className       = "zuordnung-cell";
    right.innerHTML       = pair.right || "";
    withPlaceholder(right, "Rechts…");

    const savePairs = () => {
      const newPairs = [...grid.querySelectorAll(".zuordnung-row")].map(r => {
        const cells = r.querySelectorAll(".zuordnung-cell");
        return { left: cells[0].innerHTML, right: cells[1].innerHTML };
      });
      onUpdate?.({ pairs: newPairs });
    };
    onBlurSave(left, savePairs);
    onBlurSave(right, savePairs);

    row.appendChild(left);
    row.appendChild(arrow);
    row.appendChild(right);
    grid.appendChild(row);
  });
  el.appendChild(grid);
  return el;
}

function renderHotspot(block, onUpdate) {
  const el = document.createElement("div");
  el.className = "atm-quiz";
  el.appendChild(Object.assign(document.createElement("strong"), { textContent: "🎯 Bildklick" }));

  const q = document.createElement("div");
  q.className       = "quiz-question";
  q.innerHTML       = block.question || "";
  q.contentEditable = "true";
  withPlaceholder(q, "Frage: Klicke auf die richtige Stelle…");
  onBlurSave(q, () => onUpdate?.({ question: q.innerHTML }));
  el.appendChild(q);

  if (!block.src) {
    const setImg = url => onUpdate?.({ src: url });
    el.classList.add("drop-zone");
    makeDragDropZone(el, setImg);
    el.appendChild(buildImageForm(setImg));
    return el;
  }

  // ── Bild + Hotspot-Editor ────────────────────────────────────────
  let editMode = false;
  let hotspots = JSON.parse(JSON.stringify(block.hotspots || []));
  let correct  = block.correct || null;

  const wrap = document.createElement("div");
  wrap.className = "hotspot-wrap";

  const imgWrap = document.createElement("div");
  imgWrap.className = "img-resize-wrap";
  imgWrap.style.width = (block.width || 100) + "%";

  const img = document.createElement("img");
  img.src       = block.src;
  img.draggable = false;
  img.className = "hotspot-img img-resizable";
  imgWrap.appendChild(img);

  // Resize handle
  const resizeHandle = document.createElement("div");
  resizeHandle.className = "img-resize-handle";
  imgWrap.appendChild(resizeHandle);

  const label = document.createElement("div");
  label.className   = "img-resize-label";
  label.textContent = (block.width || 100) + "%";
  imgWrap.appendChild(label);

  resizeHandle.addEventListener("mousedown", e => {
    e.preventDefault(); e.stopPropagation();
    const startX      = e.clientX;
    const containerW  = el.getBoundingClientRect().width;
    const startWidthPx = imgWrap.getBoundingClientRect().width;
    imgWrap.classList.add("img-resize-wrap--dragging");
    const onMove = mv => {
      const delta = mv.clientX - startX;
      const newW  = Math.round(Math.min(100, Math.max(20, (startWidthPx + delta) / containerW * 100)));
      imgWrap.style.width  = newW + "%";
      label.textContent    = newW + "%";
    };
    const onUp = () => {
      imgWrap.classList.remove("img-resize-wrap--dragging");
      const finalW = Math.round(parseFloat(imgWrap.style.width));
      onUpdate?.({ hotspots, correct, width: finalW });
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup",   onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup",   onUp);
  });

  wrap.appendChild(imgWrap);

  function save() {
    onUpdate?.({ hotspots, correct, width: Math.round(parseFloat(imgWrap.style.width)) });
  }

  function renderDots() {
    imgWrap.querySelectorAll(".hotspot-dot, .hotspot-del").forEach(d => d.remove());
    hotspots.forEach((hs, i) => {
      const dot = document.createElement("div");
      dot.className = "hotspot-dot" + (hs.id === correct ? " hotspot-dot--correct" : "");
      dot.style.cssText = `left:${hs.x}%;top:${hs.y}%`;
      dot.title = hs.label || `Hotspot ${i + 1}`;

      const num = document.createElement("span");
      num.textContent = i + 1;
      dot.appendChild(num);

      let dragged = false;

      if (editMode) {
        dot.style.cursor = "grab";
        dot.addEventListener("mousedown", e => {
          if (e.button !== 0) return;
          e.preventDefault(); e.stopPropagation();
          dragged = false;
          const startX = e.clientX, startY = e.clientY;
          dot.style.cursor = "grabbing";
          const onMove = mv => {
            const dx = mv.clientX - startX, dy = mv.clientY - startY;
            if (!dragged && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) dragged = true;
            if (!dragged) return;
            const rect = imgWrap.getBoundingClientRect();
            const curX = Math.round(Math.min(100, Math.max(0, (mv.clientX - rect.left) / rect.width  * 100)) * 10) / 10;
            const curY = Math.round(Math.min(100, Math.max(0, (mv.clientY - rect.top)  / rect.height * 100)) * 10) / 10;
            hs.x = curX; hs.y = curY;
            dot.style.left = curX + "%";
            dot.style.top  = curY + "%";
            const delEl = imgWrap.querySelector(`.hotspot-del[data-id="${hs.id}"]`);
            if (delEl) { delEl.style.left = curX + "%"; delEl.style.top = curY + "%"; }
          };
          const onUp = () => {
            dot.style.cursor = "grab";
            if (dragged) { save(); renderDots(); }
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup",   onUp);
          };
          document.addEventListener("mousemove", onMove);
          document.addEventListener("mouseup",   onUp);
        });
      }

      dot.addEventListener("click", e => {
        e.stopPropagation();
        if (editMode && dragged) { dragged = false; return; }
        correct = hs.id;
        save();
        renderDots();
      });

      if (editMode) {
        const del = document.createElement("button");
        del.dataset.id = hs.id;
        del.className   = "hotspot-del";
        del.textContent = "×";
        del.title       = "Entfernen";
        del.style.cssText = `left:${hs.x}%;top:${hs.y}%`;
        del.addEventListener("click", e => {
          e.stopPropagation();
          hotspots = hotspots.filter(h => h.id !== hs.id);
          if (correct === hs.id) correct = hotspots[0]?.id ?? null;
          save();
          renderDots();
        });
        imgWrap.appendChild(del);
      }

      imgWrap.appendChild(dot);
    });
  }

  // Klick auf Bild → Hotspot setzen (nur im Edit-Modus)
  img.addEventListener("click", e => {
    if (!editMode) return;
    if (imgWrap.querySelector(".hotspot-popup")) return; // schon offen
    const rect = imgWrap.getBoundingClientRect();
    const xPct = Math.round(((e.clientX - rect.left) / rect.width  * 100) * 10) / 10;
    const yPct = Math.round(((e.clientY - rect.top)  / rect.height * 100) * 10) / 10;

    const popup = document.createElement("div");
    popup.className = "hotspot-popup";
    popup.style.cssText = `left:${xPct}%;top:${yPct}%`;

    const input = document.createElement("input");
    input.type        = "text";
    input.placeholder = "Bezeichnung (optional)";
    input.className   = "hotspot-popup-input";

    const confirmBtn = document.createElement("button");
    confirmBtn.className   = "hotspot-popup-btn hotspot-popup-btn--confirm";
    confirmBtn.textContent = "✓";
    confirmBtn.title       = "Bestätigen";

    const cancelBtn = document.createElement("button");
    cancelBtn.className   = "hotspot-popup-btn hotspot-popup-btn--cancel";
    cancelBtn.textContent = "×";
    cancelBtn.title       = "Abbrechen";

    popup.appendChild(input);
    popup.appendChild(confirmBtn);
    popup.appendChild(cancelBtn);
    imgWrap.appendChild(popup);
    input.focus();

    const confirm = () => {
      popup.remove();
      const hs = { id: uid("hs"), x: xPct, y: yPct, r: 16, label: input.value.trim() };
      hotspots.push(hs);
      if (!correct) correct = hs.id;
      save();
      renderDots();
    };
    confirmBtn.addEventListener("click", e => { e.stopPropagation(); confirm(); });
    cancelBtn.addEventListener("click",  e => { e.stopPropagation(); popup.remove(); });
    input.addEventListener("keydown", e => {
      if (e.key === "Enter") confirm();
      if (e.key === "Escape") popup.remove();
    });
  });

  renderDots();
  el.appendChild(wrap);

  // ── Toolbar ──────────────────────────────────────────────────────
  const toolbar = document.createElement("div");
  toolbar.className = "hotspot-toolbar";

  const editBtn = document.createElement("button");
  editBtn.className   = "btn btn-small";
  editBtn.textContent = "Hotspots bearbeiten";
  editBtn.addEventListener("click", () => {
    editMode = !editMode;
    editBtn.textContent = editMode ? "Fertig" : "Hotspots bearbeiten";
    wrap.classList.toggle("hotspot-wrap--edit", editMode);
    renderDots();
  });

  const hint = document.createElement("span");
  hint.className = "hotspot-hint";
  hint.textContent = "Grüner Punkt = korrekte Antwort";

  toolbar.appendChild(editBtn);
  toolbar.appendChild(hint);
  el.appendChild(toolbar);

  return el;
}

// ── Helpers ───────────────────────────────────────────────────────────

function withPlaceholder(el, text) {
  el.dataset.placeholder = text;
  const sync = () =>
    el.classList.toggle("is-empty", !el.innerHTML || el.innerHTML === "<br>");
  el.addEventListener("input", sync);
  el.addEventListener("blur",  sync);
  sync();
}

function onBlurSave(el, fn) {
  el.addEventListener("blur", () => {
    if (el.innerHTML === "<br>") el.innerHTML = "";
    fn();
  });
}

function buildImageForm(onConfirm) {
  const wrap = document.createElement("div");
  wrap.className = "url-form image-form";

  const hint = document.createElement("div");
  hint.className   = "image-form-hint";
  hint.textContent = "Bild hierhin ziehen oder:";
  wrap.appendChild(hint);

  const fileInput = document.createElement("input");
  fileInput.type          = "file";
  fileInput.accept        = "image/*";
  fileInput.style.display = "none";
  wrap.appendChild(fileInput);

  const fileBtn = document.createElement("button");
  fileBtn.className   = "btn url-form-btn";
  fileBtn.textContent = "📁 Datei wählen";
  fileBtn.addEventListener("click", () => fileInput.click());
  wrap.appendChild(fileBtn);

  fileInput.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => onConfirm(ev.target.result);
    reader.readAsDataURL(file);
  });

  const sep = document.createElement("span");
  sep.className   = "url-form-sep";
  sep.textContent = "oder URL:";
  wrap.appendChild(sep);

  const inp = document.createElement("input");
  inp.className   = "url-form-input";
  inp.type        = "text";
  inp.placeholder = "https://…";
  wrap.appendChild(inp);

  const btn = document.createElement("button");
  btn.className   = "btn url-form-btn";
  btn.textContent = "OK";
  const confirm = () => { const v = inp.value.trim(); if (v) onConfirm(v); };
  btn.addEventListener("click", confirm);
  inp.addEventListener("keydown", e => { if (e.key === "Enter") confirm(); });
  wrap.appendChild(btn);

  return wrap;
}

function buildUrlForm(label, current, onConfirm) {
  const wrap = document.createElement("div");
  wrap.className = "url-form";

  const lbl = document.createElement("span");
  lbl.className   = "url-form-label";
  lbl.textContent = label;

  const inp = document.createElement("input");
  inp.className   = "url-form-input";
  inp.type        = "text";
  inp.placeholder = "https://…";
  inp.value       = current || "";

  const btn = document.createElement("button");
  btn.className   = "url-form-btn btn";
  btn.textContent = "OK";

  const confirm = () => { const v = inp.value.trim(); if (v) onConfirm(v); };
  btn.addEventListener("click", confirm);
  inp.addEventListener("keydown", e => { if (e.key === "Enter") confirm(); });

  wrap.appendChild(lbl);
  wrap.appendChild(inp);
  wrap.appendChild(btn);
  return wrap;
}

function extractYoutubeId(url) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
  return m ? m[1] : null;
}

function makeDragDropZone(el, onLoad) {
  el.addEventListener("dragenter", e => {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    el.classList.add("drop-zone--active");
  });
  el.addEventListener("dragover", e => {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  });
  el.addEventListener("dragleave", e => {
    if (!el.contains(e.relatedTarget)) el.classList.remove("drop-zone--active");
  });
  el.addEventListener("drop", e => {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    e.stopPropagation(); // Block-Reorder-Handler im Canvas nicht auslösen
    el.classList.remove("drop-zone--active");
    const file = [...e.dataTransfer.files].find(f => f.type.startsWith("image/"));
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => onLoad(ev.target.result);
    reader.readAsDataURL(file);
  });
}

function isFileDrag(e) {
  return [...(e.dataTransfer?.types || [])].includes("Files");
}
