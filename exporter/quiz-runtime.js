/**
 * exporter/quiz-runtime.js – Quiz-Interaktions-Script (als String)
 * =================================================================
 * Wird als shared/quiz.js in die SCORM-ZIP geschrieben.
 * Übernimmt alle Quiz-Typen (MC, Multi, T/F, Lücke, Zuordnung, Hotspot).
 * Nutzt window.SB.track() aus dem SCORM-Runtime für cmi.interactions.
 */

export const QUIZ_RUNTIME_JS = `// ScriptBase Quiz Runtime
(function () {
  "use strict";

  function track(id, type, response, correct) {
    if (window.SB && window.SB.track) window.SB.track(id, type, response, correct);
  }

  function showFb(el, correct, wrongHint) {
    el.hidden = false;
    el.textContent = correct ? "✓ Richtig!" : ("✗ Leider falsch." + (wrongHint ? " " + wrongHint : ""));
    el.className = "sb-fb " + (correct ? "sb-fb--ok" : "sb-fb--err");
  }

  // ── MC, eine richtige Antwort ──────────────────────────────────────
  document.querySelectorAll('.sb-quiz[data-type="quiz"]').forEach(function (quiz) {
    var correct = parseInt(quiz.dataset.correct, 10);
    var fb      = quiz.querySelector(".sb-fb");
    quiz.querySelectorAll(".sb-opt").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var idx       = parseInt(btn.dataset.i, 10);
        var isCorrect = idx === correct;
        quiz.querySelectorAll(".sb-opt").forEach(function (b) {
          b.disabled = true;
          if (parseInt(b.dataset.i, 10) === correct) b.classList.add("sb-opt--ok");
          else if (b === btn && !isCorrect)           b.classList.add("sb-opt--err");
        });
        showFb(fb, isCorrect);
        track(quiz.dataset.id, "choice", String(idx), isCorrect);
      });
    });
  });

  // ── MC, mehrere richtige Antworten ────────────────────────────────
  document.querySelectorAll('.sb-quiz[data-type="quiz_multi"]').forEach(function (quiz) {
    var correct = quiz.dataset.correct.split(",").map(Number);
    var fb      = quiz.querySelector(".sb-fb");
    quiz.querySelector(".sb-submit").addEventListener("click", function () {
      var selected = [];
      quiz.querySelectorAll(".sb-opt input:checked").forEach(function (cb) {
        selected.push(parseInt(cb.dataset.i, 10));
      });
      var isCorrect = correct.length === selected.length &&
        correct.every(function (c) { return selected.indexOf(c) !== -1; });
      quiz.querySelectorAll(".sb-opt").forEach(function (lbl) {
        var cb = lbl.querySelector("input");
        cb.disabled = true;
        var i  = parseInt(cb.dataset.i, 10);
        if (correct.indexOf(i) !== -1) lbl.classList.add("sb-opt--ok");
        else if (cb.checked)           lbl.classList.add("sb-opt--err");
      });
      quiz.querySelector(".sb-submit").disabled = true;
      showFb(fb, isCorrect);
      track(quiz.dataset.id, "choice", selected.join(","), isCorrect);
    });
  });

  // ── Wahr / Falsch ─────────────────────────────────────────────────
  document.querySelectorAll('.sb-quiz[data-type="true_false"]').forEach(function (quiz) {
    var correct = quiz.dataset.correct === "true";
    var fb      = quiz.querySelector(".sb-fb");
    quiz.querySelectorAll(".sb-opt").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var val       = btn.dataset.val === "true";
        var isCorrect = val === correct;
        quiz.querySelectorAll(".sb-opt").forEach(function (b) {
          b.disabled = true;
          if ((b.dataset.val === "true") === correct) b.classList.add("sb-opt--ok");
          else if (b === btn && !isCorrect)           b.classList.add("sb-opt--err");
        });
        showFb(fb, isCorrect);
        track(quiz.dataset.id, "true-false", btn.dataset.val, isCorrect);
      });
    });
  });

  // ── Lückentext ────────────────────────────────────────────────────
  document.querySelectorAll('.sb-quiz[data-type="luecke"]').forEach(function (quiz) {
    var answers = JSON.parse(quiz.dataset.answers);
    var opts    = JSON.parse(quiz.dataset.options || '[]');
    var fb      = quiz.querySelector(".sb-fb");

    // Fisher-Yates: Optionen zufällig mischen (pro Seitenaufruf neu)
    for (var k = opts.length - 1; k > 0; k--) {
      var r = Math.floor(Math.random() * (k + 1));
      var t = opts[k]; opts[k] = opts[r]; opts[r] = t;
    }

    // Jedes Dropdown mit den gemischten Optionen füllen
    quiz.querySelectorAll(".sb-blank").forEach(function (sel) {
      opts.forEach(function (o) {
        var option = document.createElement("option");
        option.value = o;
        option.textContent = o;
        sel.appendChild(option);
      });
    });

    quiz.querySelector(".sb-submit").addEventListener("click", function () {
      var allCorrect = true;
      var responses  = [];
      quiz.querySelectorAll(".sb-blank").forEach(function (sel) {
        var i        = parseInt(sel.dataset.i, 10);
        var expected = (answers[i] || "").trim().toLowerCase();
        var given    = sel.value.trim().toLowerCase();
        var ok       = given === expected;
        sel.disabled = true;
        sel.classList.add(ok ? "sb-blank--ok" : "sb-blank--err");
        if (!ok) allCorrect = false;
        responses.push(sel.value.trim());
      });
      quiz.querySelector(".sb-submit").disabled = true;
      showFb(fb, allCorrect);
      track(quiz.dataset.id, "fill-in", responses.join("|"), allCorrect);
    });
  });

  // ── Zuordnung ─────────────────────────────────────────────────────
  document.querySelectorAll('.sb-quiz[data-type="zuordnung"]').forEach(function (quiz) {
    var fb = quiz.querySelector(".sb-fb");
    quiz.querySelector(".sb-submit").addEventListener("click", function () {
      var allCorrect = true;
      var responses  = [];
      quiz.querySelectorAll("select").forEach(function (sel) {
        var ok       = sel.value === sel.dataset.correct;
        sel.disabled = true;
        sel.classList.add(ok ? "sb-blank--ok" : "sb-blank--err");
        if (!ok) allCorrect = false;
        responses.push(sel.value);
      });
      quiz.querySelector(".sb-submit").disabled = true;
      showFb(fb, allCorrect);
      track(quiz.dataset.id, "matching", responses.join("|"), allCorrect);
    });
  });

  // ── Hotspot (Bildklick) ───────────────────────────────────────────
  document.querySelectorAll('.sb-quiz[data-type="hotspot"]').forEach(function (quiz) {
    var correct = quiz.dataset.correct;
    var fb      = quiz.querySelector(".sb-fb");
    quiz.querySelectorAll(".sb-hs-dot").forEach(function (dot) {
      dot.addEventListener("click", function () {
        var isCorrect = dot.dataset.id === correct;
        quiz.querySelectorAll(".sb-hs-dot").forEach(function (d) {
          d.disabled = true;
          if (d.dataset.id === correct) d.classList.add("sb-opt--ok");
          else if (d === dot && !isCorrect) d.classList.add("sb-opt--err");
        });
        showFb(fb, isCorrect);
        track(quiz.dataset.id, "performance", dot.dataset.id, isCorrect);
      });
    });
  });
})();
`;
