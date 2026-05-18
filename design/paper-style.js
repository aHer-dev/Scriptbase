/**
 * design/paper-style.js – Paper-Stil Verwaltung
 * ===============================================
 * Zwei Modi: "card" (Glas-Karte) und "flat" (transparenter Hintergrund).
 * Gespeichert in localStorage als "paperStyle".
 *
 * Wird in editor/editor.js beim Canvas-Aufbau und in design/themes.js
 * für den Toggle-Button verwendet.
 */

let paperStyle = localStorage.getItem("paperStyle") || "card";

export function getPaperStyle() {
  return paperStyle;
}

export function setPaperStyle(style) {
  paperStyle = style;
  localStorage.setItem("paperStyle", style);
  applyPaperStyle();
}

/**
 * Trägt den aktuellen Stil in das aktive .page-canvas ein.
 * Sicher aufzurufen auch wenn kein Canvas existiert.
 */
export function applyPaperStyle() {
  const canvas = document.querySelector(".page-canvas");
  if (!canvas) return;
  canvas.classList.toggle("page-canvas--flat", paperStyle === "flat");
}
