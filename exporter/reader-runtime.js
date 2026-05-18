/**
 * exporter/reader-runtime.js – Reader-Script (als String)
 * =========================================================
 * Wird als shared/reader.js in die Web-Export-ZIP geschrieben.
 * Übernimmt: Fortschritts-Tracking (localStorage), Dark-Mode-Toggle,
 * TOC-Sidebar (mobile), Index-Seite Kapitel-Status.
 *
 * Kein SCORM – rein lokales Tracking.
 */

export const READER_RUNTIME_JS = `// ScriptBase Reader Runtime
(function () {
  "use strict";

  // SB_COURSE wird von der jeweiligen HTML-Seite als globale Var gesetzt
  var KEY = "sb:" + (window.SB_COURSE || "course");

  function getProgress() {
    try { return JSON.parse(localStorage.getItem(KEY) || "{}"); }
    catch (e) { return {}; }
  }

  function markVisited(href) {
    var p = getProgress();
    p[href] = true;
    try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) {}
  }

  // ── Dark Mode ─────────────────────────────────────────────────────
  function applyDark(dark) {
    document.documentElement.classList.toggle("sb-dark", dark);
    var btn = document.getElementById("sb-theme-toggle");
    if (btn) btn.textContent = dark ? "☀️" : "🌙";
  }

  function initTheme() {
    var dark = localStorage.getItem("sb-dark") === "1";
    applyDark(dark);
    var btn = document.getElementById("sb-theme-toggle");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var nowDark = !document.documentElement.classList.contains("sb-dark");
      localStorage.setItem("sb-dark", nowDark ? "1" : "0");
      applyDark(nowDark);
    });
  }

  // ── Index-Seite ───────────────────────────────────────────────────
  function initIndex() {
    if (!document.body.classList.contains("sb-page--index")) return;
    var progress = getProgress();
    var items    = document.querySelectorAll(".sb-ch-item[data-href]");
    var firstUnvisited = null;

    for (var i = 0; i < items.length; i++) {
      var href = items[i].dataset.href;
      if (progress[href]) {
        items[i].classList.add("sb-ch-item--done");
      } else if (!firstUnvisited) {
        firstUnvisited = items[i].getAttribute("href");
      }
    }

    // "Weiter lesen" wenn bereits gestartet
    var btn = document.getElementById("sb-start-btn");
    if (btn && firstUnvisited && items.length &&
        firstUnvisited !== items[0].getAttribute("href")) {
      btn.textContent = "Weiter lesen →";
      btn.href = firstUnvisited;
    }
  }

  // ── Kapitel-Seite ─────────────────────────────────────────────────
  function initChapter() {
    if (!document.body.classList.contains("sb-page--chapter")) return;

    // Aktuelle Seite als besucht markieren
    var myHref = "pages/" + location.pathname.split("/").pop();
    markVisited(myHref);

    // Fortschrittsbalken animieren
    var fill = document.getElementById("sb-progress-fill");
    if (fill) {
      var pct = parseInt(fill.dataset.pct || "0", 10);
      requestAnimationFrame(function () { fill.style.width = pct + "%"; });
    }

    // TOC: besuchte Kapitel markieren
    var progress = getProgress();
    document.querySelectorAll(".sb-toc-item[data-href]").forEach(function (el) {
      if (progress[el.dataset.href]) el.classList.add("sb-toc-item--done");
    });

    // TOC: Mobile-Toggle
    var tocToggle = document.getElementById("sb-toc-toggle");
    var toc       = document.getElementById("sb-toc");
    if (tocToggle && toc) {
      tocToggle.addEventListener("click", function (e) {
        e.stopPropagation();
        toc.classList.toggle("sb-toc--open");
      });
      document.addEventListener("click", function (e) {
        if (!toc.contains(e.target) && e.target !== tocToggle) {
          toc.classList.remove("sb-toc--open");
        }
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    initTheme();
    initIndex();
    initChapter();
  });
})();
`;
