/**
 * importer/importer.js – ZIP-Import
 * ===================================
 * Liest eine SCORM 1.2 ZIP ein und konvertiert den Inhalt in CourseForge-Kurs-Daten.
 *
 * Ablauf:
 *   1. JSZip dynamisch laden (gleicher Pattern wie exporter/zip-builder.js)
 *   2. ZIP entpacken, alle Dateien in Map
 *   3. imsmanifest.xml parsen → Kurstitel + Kapitelreihenfolge (hrefs)
 *      Fallback: alle .html-Dateien sortiert
 *   4. Pro HTML-Datei: DOMParser → Blöcke via collectBlocks()
 *   5. createCourse() + createChapter() + State.setCourse()
 *
 * Abhängigkeiten: core/state.js, core/course.js, core/chapter.js, core/block-types.js
 */

import * as State from "../core/state.js";
import { createCourse, addChapter } from "../core/course.js";
import { createChapter } from "../core/chapter.js";
import { createBlock, BLOCK_TYPES } from "../core/block-types.js";
import { loadProjectFromFile } from "../core/project-io.js";

const JSZIP_CDN = "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";
let jszipPromise = null;

// ── Public API ──────────────────────────────────────────────────────

/**
 * Verdrahtet den Import-Button mit einem versteckten File-Picker.
 * @param {HTMLButtonElement} button
 */
export function initImportButton(button) {
  button.addEventListener("click", openImportDialog);
}

/** Öffentlicher Zugang für Drag & Drop in app.js */
export function importZipFile(file) {
  return importZip(file);
}

// ── Privat ───────────────────────────────────────────────────────────

function openImportDialog() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".zip,.sbcourse,application/zip,application/json";
  input.onchange = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.name.endsWith(".sbcourse")) {
      loadProjectFromFile(file);
    } else {
      importZip(file);
    }
  };
  input.click();
}

/**
 * Hauptfunktion: ZIP einlesen, parsen, als neuen Kurs in State laden.
 * @param {File} file
 */
async function importZip(file) {
  if (State.getCourse()) {
    const ok = confirm(
      `Aktuellen Kurs ersetzen mit "${file.name}"?\n\nNicht gespeicherte Änderungen gehen verloren.`
    );
    if (!ok) return;
  }

  let JSZip;
  try {
    JSZip = await loadJSZip();
  } catch {
    alert("JSZip konnte nicht geladen werden. Bitte Internetverbindung prüfen.");
    return;
  }

  let zip;
  try {
    zip = await JSZip.loadAsync(file);
  } catch {
    alert(`"${file.name}" konnte nicht als ZIP geöffnet werden.`);
    return;
  }

  // Alle Dateien in einer flachen Map sammeln
  const fileMap = {};
  zip.forEach((path, entry) => {
    if (!entry.dir) fileMap[path] = entry;
  });

  // Kurstitel + Kapitelliste ermitteln
  let courseTitle = file.name.replace(/\.zip$/i, "");
  let chapters = [];

  const manifestEntry = findManifestEntry(fileMap);
  if (manifestEntry) {
    const xml = new TextDecoder("utf-8").decode(await manifestEntry.async("arraybuffer"));
    const parsed = parseManifest(xml);
    if (parsed.title) courseTitle = parsed.title;
    chapters = parsed.items;
  }

  if (chapters.length === 0) {
    chapters = findHtmlFiles(fileMap).map(href => ({ title: null, href }));
  }

  if (chapters.length === 0) {
    alert(`Keine HTML-Inhalte in "${file.name}" gefunden.`);
    return;
  }

  // Kurs aufbauen
  const course = createCourse(courseTitle);

  for (const { title: titleHint, href } of chapters) {
    const htmlEntry = resolveFile(fileMap, href);
    if (!htmlEntry) {
      console.warn(`Importer: HTML-Datei nicht gefunden: ${href}`);
      continue;
    }
    const html = new TextDecoder("utf-8").decode(await htmlEntry.async("arraybuffer"));
    const chapterTitle = titleHint || extractHtmlTitle(html) || hrefToTitle(href);
    const blocks = htmlToBlocks(html);
    const chapter = createChapter(chapterTitle, 0);
    chapter.blocks = blocks;
    addChapter(course, chapter);
  }

  if (course.chapters.length === 0) {
    alert("Keine Kapitel konnten importiert werden.");
    return;
  }

  State.setCourse(course);
}

// ── ZIP-Hilfsfunktionen ──────────────────────────────────────────────

function findManifestEntry(fileMap) {
  if (fileMap["imsmanifest.xml"]) return fileMap["imsmanifest.xml"];
  return Object.values(fileMap).find(f =>
    f.name.toLowerCase().endsWith("imsmanifest.xml")
  ) ?? null;
}

function findHtmlFiles(fileMap) {
  return Object.keys(fileMap)
    .filter(p => {
      const lower = p.toLowerCase();
      return lower.endsWith(".html") && !lower.includes("scorm_runtime");
    })
    .sort();
}

function resolveFile(fileMap, href) {
  if (!href) return null;
  if (fileMap[href]) return fileMap[href];
  const normalized = href.replace(/^\.?\//, "");
  return fileMap[normalized]
    ?? Object.values(fileMap).find(f => f.name.endsWith(normalized))
    ?? null;
}

/** "pages/01_intro.html" → "Intro" */
function hrefToTitle(href) {
  const base = href.split("/").pop().replace(/\.html?$/i, "");
  const cleaned = base.replace(/^[\d_\-]+/, "").replace(/[_\-]/g, " ").trim();
  return cleaned || base;
}

// ── Manifest-Parser (SCORM 1.2 imsmanifest.xml) ──────────────────────

/**
 * Extrahiert Kurstitel und Kapitel-Liste aus dem Manifest.
 * @param {string} xmlString
 * @returns {{ title: string, items: Array<{title: string, href: string}> }}
 */
function parseManifest(xmlString) {
  const doc = new DOMParser().parseFromString(xmlString, "application/xml");

  const title = doc.querySelector("organization > title")?.textContent.trim() ?? "";

  // Ressourcen-Map: identifier → href
  const resourceMap = {};
  doc.querySelectorAll("resource").forEach(res => {
    const id   = res.getAttribute("identifier");
    const href = res.getAttribute("href");
    if (id && href) resourceMap[id] = href;
  });

  const items = [];
  doc.querySelectorAll("item").forEach(item => {
    const ref  = item.getAttribute("identifierref");
    const href = ref ? resourceMap[ref] : null;
    if (!href) return;
    const itemTitle = item.querySelector(":scope > title")?.textContent.trim()
      || hrefToTitle(href);
    items.push({ title: itemTitle, href });
  });

  return { title, items };
}

// ── HTML → Blöcke ────────────────────────────────────────────────────

/**
 * Extrahiert den Seitentitel aus einem HTML-String (für Fallback-Kapiteltitel).
 * @param {string} htmlString
 * @returns {string|null}
 */
function extractHtmlTitle(htmlString) {
  const doc = new DOMParser().parseFromString(htmlString, "text/html");
  return doc.querySelector("title")?.textContent.trim()
    || doc.querySelector("h1")?.textContent.trim()
    || null;
}

/**
 * Parst einen HTML-String und gibt ein Array von Block-Objekten zurück.
 * @param {string} htmlString
 * @returns {object[]}
 */
function htmlToBlocks(htmlString) {
  const doc = new DOMParser().parseFromString(htmlString, "text/html");
  const root = doc.querySelector("main, article, .content, #content, body");
  if (!root) return [];
  // Immer Kinder des Root verarbeiten, nie Root selbst als Block
  return collectChildBlocks(root);
}

/**
 * Rekursiver Walk: konvertiert ein DOM-Element in 0-n Block-Objekte.
 * @param {Element} el
 * @returns {object[]}
 */
function collectBlocks(el) {
  const tag = el.tagName?.toLowerCase();
  if (!tag) return [];
  const cls = (typeof el.className === "string" ? el.className : "").toLowerCase();

  // ── Überschriften ──────────────────────────────────────────────
  if (/^h[1-6]$/.test(tag)) {
    const block = createBlock(BLOCK_TYPES.HEADING);
    block.content = el.textContent.trim();
    block.level   = Math.min(3, parseInt(tag[1], 10));
    return [block];
  }

  // ── Absatz ─────────────────────────────────────────────────────
  if (tag === "p") {
    const html = el.innerHTML.trim();
    if (!html) return [];
    const block = createBlock(BLOCK_TYPES.TEXT);
    block.content = html;
    return [block];
  }

  // ── Listen ─────────────────────────────────────────────────────
  if (tag === "ul" || tag === "ol") {
    const items = [...el.querySelectorAll(":scope > li")].map(li => li.innerHTML.trim());
    if (items.length === 0) return [];
    const block = createBlock(BLOCK_TYPES.LIST);
    block.items   = items;
    block.ordered = tag === "ol";
    return [block];
  }

  // ── Tabelle ────────────────────────────────────────────────────
  if (tag === "table") {
    const rows = [...el.querySelectorAll("tr")].map(tr =>
      [...tr.querySelectorAll("td, th")].map(cell => cell.innerHTML.trim())
    );
    if (rows.length === 0) return [];
    const block = createBlock(BLOCK_TYPES.TABLE);
    block.rows = rows;
    return [block];
  }

  // ── Trennlinie ─────────────────────────────────────────────────
  if (tag === "hr") return [createBlock(BLOCK_TYPES.DIVIDER)];

  // ── Bild ───────────────────────────────────────────────────────
  if (tag === "img") {
    const src = el.getAttribute("src") || "";
    if (!src) return [];
    const block = createBlock(BLOCK_TYPES.IMAGE);
    block.src = src;
    block.alt = el.getAttribute("alt") || "";
    return [block];
  }

  // ── Figure (Bild + Caption) ────────────────────────────────────
  if (tag === "figure") {
    const img = el.querySelector("img");
    if (!img) return collectChildBlocks(el);
    const src = img.getAttribute("src") || "";
    if (!src) return [];
    const block = createBlock(BLOCK_TYPES.IMAGE);
    block.src     = src;
    block.alt     = img.getAttribute("alt") || "";
    block.caption = el.querySelector("figcaption")?.textContent.trim() || "";
    return [block];
  }

  // ── YouTube-iframe ─────────────────────────────────────────────
  if (tag === "iframe") {
    const src = el.getAttribute("src") || "";
    if (!src.includes("youtube.com") && !src.includes("youtu.be")) return [];
    const block = createBlock(BLOCK_TYPES.YOUTUBE);
    block.url   = src;
    block.title = el.getAttribute("title") || "";
    return [block];
  }

  // ── Platzhalter & Navigation überspringen ─────────────────────
  // (keine importierbaren Inhalte: Bild-/Video-Hinweise, Navigationstext)
  if (cls.includes("atm-bild") || cls.includes("atm-video") || cls.includes("atm-nav")) {
    return [];
  }

  // ── Lern-Boxen (class-basiert) ─────────────────────────────────
  // Reihenfolge beachten: spezifischere Muster vor "tipp"
  const LERNBOX_MAP = [
    ["merke",      BLOCK_TYPES.MERKE],
    ["eselsbr",    BLOCK_TYPES.MERKE],   // atm-eselsbrücke (encoding-sicher)
    ["klinik",     BLOCK_TYPES.KLINIK],
    ["tipp",       BLOCK_TYPES.TIPP],
    ["aufgabe",    BLOCK_TYPES.AUFGABE],
    ["reflexion",  BLOCK_TYPES.TIPP],    // Reflexions-Box → Tipp
    ["info",       BLOCK_TYPES.TIPP],    // Info-Box → Tipp
  ];
  for (const [pattern, blockType] of LERNBOX_MAP) {
    if (cls.includes(pattern)) {
      const block = createBlock(blockType);
      const inner = el.querySelector(".content, .text, p");
      block.content = (inner?.innerHTML ?? el.innerHTML).trim();
      return [block];
    }
  }

  // ── MC (1 richtig) — neues Format: atm-quiz ──────────────────
  if (cls.includes("atm-quiz") && !cls.includes("atm-quiz-multi")) {
    const question = el.querySelector("p")?.innerHTML.trim() || "";
    const options  = [...el.querySelectorAll("li")].map(li => li.textContent.trim());
    const correct  = parseInt(el.getAttribute("data-correct") || "0", 10);
    const block = createBlock(BLOCK_TYPES.QUIZ);
    block.question = question;
    block.options  = options.length > 0 ? options : ["", "", "", ""];
    block.correct  = isNaN(correct) ? 0 : correct;
    return [block];
  }

  // ── MC (mehrere richtig) — atm-quiz-multi ─────────────────────
  if (cls.includes("atm-quiz-multi")) {
    const question    = el.querySelector("p")?.innerHTML.trim() || "";
    const options     = [...el.querySelectorAll("li")].map(li => li.textContent.trim());
    const correctAttr = el.getAttribute("data-correct") || "0";
    const correct     = correctAttr.split(",").map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
    const block = createBlock(BLOCK_TYPES.QUIZ_MULTI);
    block.question = question;
    block.options  = options.length > 0 ? options : ["", "", "", ""];
    block.correct  = correct.length > 0 ? correct : [0];
    return [block];
  }

  // ── Wahr / Falsch — atm-wahr-falsch ──────────────────────────
  if (cls.includes("atm-wahr-falsch")) {
    const statement = el.querySelector("p")?.textContent.trim() || el.textContent.trim();
    const block = createBlock(BLOCK_TYPES.TRUE_FALSE);
    block.statement = statement;
    block.correct   = (el.getAttribute("data-correct") || "wahr").toLowerCase() === "wahr";
    return [block];
  }

  // ── Lückentext — atm-luecke ───────────────────────────────────
  if (cls.includes("atm-luecke")) {
    const text   = el.querySelector("p")?.textContent.trim() || "";
    const blanks = [...el.querySelectorAll("ul li, ol li")].map(li => li.textContent.trim());
    const block = createBlock(BLOCK_TYPES.LUECKE);
    block.text   = text;
    block.blanks = blanks.length > 0 ? blanks : [""];
    return [block];
  }

  // ── Zuordnung — atm-zuordnung ─────────────────────────────────
  if (cls.includes("atm-zuordnung")) {
    const pairs = [...el.querySelectorAll("li[data-links]")].map(li => ({
      left:  li.getAttribute("data-links")  || "",
      right: li.getAttribute("data-rechts") || "",
    }));
    if (pairs.length === 0) return [];
    const block = createBlock(BLOCK_TYPES.ZUORDNUNG);
    block.pairs = pairs;
    return [block];
  }

  // ── MC (1 richtig) — altes Format: atm-frage + atm-mc ─────────
  if (cls.includes("atm-frage")) {
    const question = el.querySelector(":scope > p")?.innerHTML.trim() || "";
    const mcDiv    = el.querySelector(".atm-mc");
    if (mcDiv) {
      const labels  = [...mcDiv.querySelectorAll("label")];
      const options = labels.map(l => l.textContent.trim());
      const correct = labels.findIndex(label => {
        const fbId = label.getAttribute("for") + "-fb";
        return mcDiv.querySelector(`#${CSS.escape(fbId)}`)
                    ?.classList.contains("atm-richtig");
      });
      const block = createBlock(BLOCK_TYPES.QUIZ);
      block.question = question;
      block.options  = options.length > 0 ? options : ["", "", "", ""];
      block.correct  = correct >= 0 ? correct : 0;
      return [block];
    }
    if (question) {
      const block = createBlock(BLOCK_TYPES.TEXT);
      block.content = question;
      return [block];
    }
    return [];
  }

  // ── Container → Kinder rekursiv verarbeiten ────────────────────
  if (["div", "section", "article", "main", "header", "aside", "nav"].includes(tag)) {
    return collectChildBlocks(el);
  }

  return [];
}

function collectChildBlocks(el) {
  return [...el.children].flatMap(child => collectBlocks(child));
}

// ── JSZip laden ──────────────────────────────────────────────────────

function loadJSZip() {
  if (window.JSZip) return Promise.resolve(window.JSZip);
  if (jszipPromise) return jszipPromise;
  jszipPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = JSZIP_CDN;
    script.onload  = () => resolve(window.JSZip);
    script.onerror = () => {
      jszipPromise = null;
      reject(new Error("JSZip konnte nicht geladen werden."));
    };
    document.head.appendChild(script);
  });
  return jszipPromise;
}
