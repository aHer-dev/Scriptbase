/**
 * editor/format-toolbar.js – Schwebende Formatierungsleiste
 * ===========================================================
 * Erscheint bei Textauswahl in contenteditable-Feldern.
 * Tastaturkürzel (Strg+B / I / U) funktionieren auch ohne Toolbar.
 */

export function initFormatToolbar() {
  const toolbar = document.createElement("div");
  toolbar.id        = "format-toolbar";
  toolbar.className = "format-toolbar";
  toolbar.hidden    = true;
  toolbar.innerHTML = `
    <button class="fmt-btn" data-cmd="bold"                title="Fett (Strg+B)"><b>B</b></button>
    <button class="fmt-btn" data-cmd="italic"              title="Kursiv (Strg+I)"><i>I</i></button>
    <button class="fmt-btn" data-cmd="underline"           title="Unterstrichen (Strg+U)"><u>U</u></button>
    <span class="fmt-sep"></span>
    <button class="fmt-btn" data-cmd="insertUnorderedList" title="Aufzählung (•)">≡</button>
    <button class="fmt-btn" data-cmd="insertOrderedList"   title="Nummerierung (1.)">1.</button>
  `;
  document.body.appendChild(toolbar);

  // mousedown NICHT auf Toolbar: Fokus bleibt im contenteditable
  toolbar.addEventListener("mousedown", e => e.preventDefault());

  toolbar.querySelectorAll("[data-cmd]").forEach(btn => {
    btn.addEventListener("mousedown", e => {
      e.preventDefault();
      document.execCommand(btn.dataset.cmd, false, null);
    });
  });

  function reposition() {
    const sel    = window.getSelection();
    const active = document.activeElement;
    if (!active?.isContentEditable || !sel || sel.isCollapsed || sel.rangeCount === 0) {
      toolbar.hidden = true;
      return;
    }
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    if (!rect.width) { toolbar.hidden = true; return; }

    toolbar.hidden = false;
    requestAnimationFrame(() => {
      const tb   = toolbar.getBoundingClientRect();
      let   left = rect.left + rect.width / 2 - tb.width / 2;
      let   top  = rect.top  - tb.height - 8;
      left = Math.max(8, Math.min(left, window.innerWidth - tb.width - 8));
      top  = Math.max(8, top);
      toolbar.style.left = left + "px";
      toolbar.style.top  = top  + "px";
    });
  }

  document.addEventListener("mouseup", reposition);
  document.addEventListener("keyup", e => { if (e.shiftKey) reposition(); });

  // Toolbar-Klick: Fokus behalten, Befehl ausführen → kein Schließen
  // Alles andere: sofort schließen — mouseup öffnet neu falls Auswahl entsteht
  document.addEventListener("mousedown", e => {
    if (toolbar.contains(e.target)) return;
    toolbar.hidden = true;
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") toolbar.hidden = true;
  });
}
