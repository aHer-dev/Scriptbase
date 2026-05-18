/**
 * exporter/block-to-html.js – Block → HTML-String
 * =================================================
 * Wandelt jeden Block-Typ in einen fertigen HTML-String um (für den Export).
 * Kein DOM, nur Strings. Wird von chapterToHTML() verwendet.
 */

import { escapeHTML, normalizeContent } from "../core/utils.js";

export function blockToHTML(block) {
  if (!block?.type) return "";
  switch (block.type) {
    case "text":       return renderText(block);
    case "heading":    return renderHeading(block);
    case "image":      return renderImage(block);
    case "youtube":    return renderYoutube(block);
    case "table":      return renderTable(block);
    case "list":       return renderList(block);
    case "divider":      return `<hr>`;
    case "lernziele":    return renderLernziele(block);
    case "merke":        return `<div class="atm-merke"><strong>Merke</strong>${normalizeContent(block.content || "")}</div>`;
    case "eselsbruecke": return `<div class="atm-eselsbruecke"><strong>Eselsbrücke</strong>${normalizeContent(block.content || "")}</div>`;
    case "klinik":       return renderKlinik(block);
    case "info":         return renderInfoBox(block);
    case "tipp":         return `<div class="atm-tipp"><strong>Tipp</strong>${normalizeContent(block.content || "")}</div>`;
    case "aufgabe":      return renderAufgabe(block);
    case "muskel":       return renderMuskel(block);
    case "reflexion":    return `<div class="atm-reflexion"><strong>Zur Reflexion</strong>${normalizeContent(block.content || "")}</div>`;
    case "quiz":       return renderQuiz(block);
    case "quiz_multi": return renderQuizMulti(block);
    case "true_false": return renderTrueFalse(block);
    case "luecke":     return renderLuecke(block);
    case "zuordnung":  return renderZuordnung(block);
    case "hotspot":    return renderHotspot(block);
    default:           return `<!-- unknown block: ${escapeHTML(block.type)} -->`;
  }
}

// ── Inhalt ────────────────────────────────────────────────────────────

function renderText(block) {
  return block.content ? `<div class="sb-text">${normalizeContent(block.content)}</div>` : "";
}

function renderHeading(block) {
  if (!block.content) return "";
  const tag = `h${block.level || 2}`;
  return `<${tag}>${normalizeContent(block.content)}</${tag}>`;
}

function renderImage(block) {
  if (!block.src) return "";
  const w     = block.width ? ` style="width:${block.width}%"` : "";
  const cap   = block.caption ? `<figcaption>${block.caption}</figcaption>` : "";
  return `<figure style="text-align:center"><img src="${attr(block.src)}" alt="${attr(block.alt || "")}"${w}>${cap}</figure>`;
}

function renderYoutube(block) {
  const id = extractYoutubeId(block.url);
  if (!id) return "";
  return `<div class="sb-video"><iframe src="https://www.youtube.com/embed/${id}" title="${attr(block.title || "Video")}" frameborder="0" allowfullscreen></iframe></div>`;
}

function renderTable(block) {
  if (!block.rows?.length) return "";
  const rows = block.rows.map((row, ri) => {
    const tag   = ri === 0 ? "th" : "td";
    const cells = (row || []).map(c => `<${tag}>${c || ""}</${tag}>`).join("");
    return `<tr>${cells}</tr>`;
  });
  return `<table class="atm-tabelle">${rows.join("")}</table>`;
}

function renderList(block) {
  if (!block.items?.length) return "";
  const tag   = block.ordered ? "ol" : "ul";
  const items = block.items.map(i => `<li>${i || ""}</li>`).join("");
  return `<${tag}>${items}</${tag}>`;
}

// ── Lern-Boxen ────────────────────────────────────────────────────────

function renderLernziele(block) {
  if (!block.content) return "";
  return `<div class="atm-lernziele"><strong>Lernziele dieses Kapitels</strong>${normalizeContent(block.content)}</div>`;
}

function renderKlinik(block) {
  const titel = block.title?.trim()
    ? `<h4>Klinischer Bezug &mdash; ${escapeHTML(block.title)}</h4>`
    : `<strong>Klinischer Bezug</strong>`;
  return `<div class="atm-klinik">${titel}${normalizeContent(block.content || "")}</div>`;
}

function renderInfoBox(block) {
  const titel = block.title?.trim()
    ? `<h4>${escapeHTML(block.title)}</h4>`
    : `<strong>Info</strong>`;
  return `<div class="atm-info">${titel}${normalizeContent(block.content || "")}</div>`;
}

function renderAufgabe(block) {
  const sol = block.solution?.trim()
    ? `<details class="atm-loesung"><summary></summary><div>${normalizeContent(block.solution)}</div></details>`
    : "";
  return `<div class="atm-aufgabe"><strong>Aufgabe</strong>${normalizeContent(block.content || "")}${sol}</div>`;
}

function renderMuskel(block) {
  if (!block.name && !block.ursprung && !block.ansatz && !block.funktion && !block.innervation) return "";
  const felder = [
    ["Ursprung",    block.ursprung],
    ["Ansatz",      block.ansatz],
    ["Funktion",    block.funktion],
    ["Innervation", block.innervation],
  ]
    .filter(([, v]) => v?.trim())
    .map(([k, v]) => `<dt>${k}</dt><dd>${normalizeContent(v)}</dd>`)
    .join("");
  const name = block.name?.trim()
    ? `<h4>${normalizeContent(block.name)}</h4>`
    : "";
  return `<div class="atm-muskel">${name}<dl>${felder}</dl></div>`;
}

// ── Interaktion ───────────────────────────────────────────────────────

function renderQuiz(block) {
  if (!block.options?.length) return "";
  const opts = block.options.map((o, i) =>
    `<button class="sb-opt" data-i="${i}">${o || ""}</button>`
  ).join("");
  return `<div class="sb-quiz" data-type="quiz" data-id="${attr(block.id)}" data-correct="${block.correct ?? 0}">
  <p class="sb-q">${block.question || ""}</p>
  <div class="sb-opts">${opts}</div>
  <p class="sb-fb" hidden></p>
</div>`;
}

function renderQuizMulti(block) {
  if (!block.options?.length) return "";
  const correct = (Array.isArray(block.correct) ? block.correct : [0]).join(",");
  const opts = block.options.map((o, i) =>
    `<label class="sb-opt"><input type="checkbox" data-i="${i}"> ${o || ""}</label>`
  ).join("");
  return `<div class="sb-quiz" data-type="quiz_multi" data-id="${attr(block.id)}" data-correct="${correct}">
  <p class="sb-q">${block.question || ""}</p>
  <div class="sb-opts">${opts}</div>
  <button class="sb-submit">Prüfen</button>
  <p class="sb-fb" hidden></p>
</div>`;
}

function renderTrueFalse(block) {
  const correct = block.correct === true ? "true" : "false";
  return `<div class="sb-quiz" data-type="true_false" data-id="${attr(block.id)}" data-correct="${correct}">
  <p class="sb-q">${block.statement || ""}</p>
  <div class="sb-opts sb-tf">
    <button class="sb-opt" data-val="true">Wahr</button>
    <button class="sb-opt" data-val="false">Falsch</button>
  </div>
  <p class="sb-fb" hidden></p>
</div>`;
}

function renderLuecke(block) {
  const blanks      = block.blanks || [];
  const answersJSON = JSON.stringify(blanks).replace(/'/g, "&#39;");
  // Alle einzigartigen Antworten als Auswahlpool für die Dropdowns
  const uniqueOpts  = [...new Set(blanks.filter(Boolean))];
  const optsJSON    = JSON.stringify(uniqueOpts).replace(/'/g, "&#39;");
  let   blankIdx    = 0;
  const textHtml    = normalizeContent(block.text || "").replace(/___/g, () => {
    const i = blankIdx++;
    return `<select class="sb-blank" data-i="${i}"><option value="">– wählen –</option></select>`;
  });
  return `<div class="sb-quiz" data-type="luecke" data-id="${attr(block.id)}" data-answers='${answersJSON}' data-options='${optsJSON}'>
  <p class="sb-q">${textHtml}</p>
  <button class="sb-submit">Prüfen</button>
  <p class="sb-fb" hidden></p>
</div>`;
}

function renderZuordnung(block) {
  if (!block.pairs?.length) return "";
  // Rechte Seite als reinen Text (kein HTML) für option-values und data-correct
  const rights  = block.pairs.map(p => stripHTML(p.right));
  const options = ["<option value=\"\">– wählen –</option>",
    ...[...rights].sort().map(r => `<option value="${attr(r)}">${escapeHTML(r)}</option>`)
  ].join("");

  const rows = block.pairs.map((p, i) =>
    `<tr><td>${p.left || ""}</td><td><select data-correct="${attr(rights[i])}">${options}</select></td></tr>`
  ).join("");

  return `<div class="sb-quiz" data-type="zuordnung" data-id="${attr(block.id)}">
  <table class="sb-match">${rows}</table>
  <button class="sb-submit">Prüfen</button>
  <p class="sb-fb" hidden></p>
</div>`;
}

function renderHotspot(block) {
  if (!block.src) return "";
  const hotspots = block.hotspots || [];
  const wrapW    = block.width ? `width:${block.width}%;` : "width:100%;";
  const dots     = hotspots.map((hs, i) =>
    `<button class="sb-hs-dot" data-id="${attr(hs.id)}" style="left:${hs.x}%;top:${hs.y}%" title="${attr(hs.label || "")}">${i + 1}</button>`
  ).join("");
  return `<div class="sb-quiz" data-type="hotspot" data-id="${attr(block.id)}" data-correct="${attr(block.correct || "")}">
  <p class="sb-q">${block.question || ""}</p>
  <div class="sb-hs-wrap" style="${wrapW}margin:0 auto">
    <img src="${attr(block.src)}" alt="" style="width:100%;display:block;border-radius:6px">
    ${dots}
  </div>
  <p class="sb-fb" hidden></p>
</div>`;
}

// ── Helpers ───────────────────────────────────────────────────────────

function stripHTML(html) {
  return String(html || "")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .trim();
}

function attr(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;").replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function extractYoutubeId(url) {
  if (!url) return null;
  for (const re of [/[?&]v=([a-zA-Z0-9_-]{11})/, /youtu\.be\/([a-zA-Z0-9_-]{11})/, /embed\/([a-zA-Z0-9_-]{11})/]) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}
