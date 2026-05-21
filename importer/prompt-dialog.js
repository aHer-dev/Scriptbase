/**
 * importer/prompt-dialog.js – KI-Prompt-Dialog
 * ===============================================
 * Zeigt ein editierbares Modal mit dem Prompt-Template für KI-Tools.
 * Workflow: Skript + Prompt in ChatGPT/Claude → HTML-Dateien → ZIP → Import
 *
 * Abhängigkeiten: keine
 */

import { t } from "../i18n.js";

const PROMPT_TEMPLATE = `You are a course author. From the script at the end, create a structured online course as HTML files.

━━ OUTPUT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• One HTML file per chapter
• File names: 01_introduction.html, 02_basics.html etc.
• Output all files together (or as a ZIP)

━━ LANGUAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠ IMPORTANT: Write ALL course content — headings, paragraphs, quiz questions,
answer options, labels, and hints — in the SAME LANGUAGE as the script I provide.
Do NOT translate. Match the language of the input exactly.

━━ HTML STRUCTURE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Each file has exactly this structure:

<div class="atm">

  <h1>Chapter title</h1>

  <h2>Section</h2>
  <h3>Subsection</h3>

  <p>Body text with <strong>bold</strong> and <em>italic</em>.</p>

  <ul>
    <li>Bullet point</li>
  </ul>

  <ol>
    <li>Numbered step</li>
  </ol>

  <table>
    <tr><th>Column 1</th><th>Column 2</th></tr>
    <tr><td>Value</td><td>Value</td></tr>
  </table>

  <hr>

  <!-- Learning boxes – use exactly these classes: -->

  <div class="atm-merke">Key fact or mnemonic</div>

  <div class="atm-klinik">
    <h4>Clinical relevance – Title</h4>
    <p>Description</p>
  </div>

  <div class="atm-tipp">Practical tip</div>

  <div class="atm-aufgabe">Task or exercise for learners</div>

</div>

━━ INTERACTIVE BLOCKS (Quiz questions) ━━━━━━━━━━━━━━
Use these formats for knowledge checks. Include 2–4 questions per chapter,
distributed throughout the content.

<!-- MC – single correct answer                          -->
<!-- data-correct = index of correct answer (0-based)   -->
<div class="atm-quiz" data-correct="1">
  <p>Which joint is a ball-and-socket joint?</p>
  <ul>
    <li>Knee joint</li>
    <li>Hip joint</li>
    <li>Elbow joint</li>
    <li>Ankle joint</li>
  </ul>
</div>

<!-- MC – multiple correct answers                       -->
<!-- data-correct = comma-separated indices, e.g. "0,2" -->
<div class="atm-quiz-multi" data-correct="0,2">
  <p>Which bones form the os coxae?</p>
  <ul>
    <li>Os ilium</li>
    <li>Os femoris</li>
    <li>Os ischii</li>
    <li>Os temporale</li>
  </ul>
</div>

<!-- True / False                                        -->
<!-- data-correct = "wahr" (true) or "falsch" (false)   -->
<div class="atm-wahr-falsch" data-correct="wahr">
  <p>The hip joint is the largest joint in the human body.</p>
</div>

<!-- Gap fill                                            -->
<!-- Mark gaps in the text with ___                     -->
<!-- Answers as a list in the same order                -->
<div class="atm-luecke">
  <p>The thigh bone is called ___ and forms the hip joint together with the ___.</p>
  <ul>
    <li>Femur</li>
    <li>Acetabulum</li>
  </ul>
</div>

<!-- Matching                                            -->
<!-- data-links = left column, data-rechts = right col  -->
<div class="atm-zuordnung">
  <ul>
    <li data-links="Os ilium"  data-rechts="Ilium"></li>
    <li data-links="Os ischii" data-rechts="Ischium"></li>
    <li data-links="Os pubis"  data-rechts="Pubis"></li>
  </ul>
</div>

━━ FORBIDDEN ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✗ No <style> block
✗ No <script> / JavaScript
✗ No inline styles (style="...")
✗ No <html>, <head> or <body> wrapper
✗ No <img> tags (images will be added manually later)

━━ NOTE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Upload your content (script, slides, text) directly into
your AI chat (ChatGPT, Claude etc.) and send this prompt
along with it. ScriptBase handles all styling on import.
`;

// ── Public API ──────────────────────────────────────────────────────

/**
 * Verdrahtet den Prompt-Button mit dem Modal.
 * @param {HTMLButtonElement} button
 */
export function initPromptButton(button) {
  button.addEventListener("click", openPromptDialog);
}

// ── Modal ────────────────────────────────────────────────────────────

function openPromptDialog() {
  if (document.getElementById("prompt-dialog-overlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "prompt-dialog-overlay";
  overlay.className = "prompt-overlay";

  overlay.innerHTML = `
    <div class="prompt-dialog" role="dialog" aria-modal="true" aria-label="${t('prompt.aria_label')}">
      <div class="prompt-dialog-header">
        <div class="prompt-dialog-title">
          <span class="prompt-dialog-icon">✦</span>
          ${t('prompt.title')}
        </div>
        <button class="btn btn-icon prompt-close" title="${t('prompt.close_title')}" aria-label="${t('prompt.close_title')}">✕</button>
      </div>

      <p class="prompt-dialog-desc">${t('prompt.description')}</p>

      <textarea class="prompt-textarea" spellcheck="false">${escapeForTextarea(PROMPT_TEMPLATE)}</textarea>

      <div class="prompt-dialog-footer">
        <span class="prompt-copy-hint" id="prompt-copy-hint"></span>
        <button class="btn btn-primary prompt-copy-btn" id="prompt-copy-btn">${t('prompt.copy_btn')}</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Schließen
  overlay.querySelector(".prompt-close").addEventListener("click", closePromptDialog);
  overlay.addEventListener("click", e => { if (e.target === overlay) closePromptDialog(); });
  document.addEventListener("keydown", onEscKey);

  // Kopieren
  overlay.querySelector("#prompt-copy-btn").addEventListener("click", () => {
    const textarea = overlay.querySelector(".prompt-textarea");
    const text = textarea.value;
    navigator.clipboard.writeText(text).then(() => {
      showCopySuccess();
    }).catch(() => {
      // Fallback für ältere Browser
      textarea.select();
      document.execCommand("copy");
      showCopySuccess();
    });
  });
}

function closePromptDialog() {
  const overlay = document.getElementById("prompt-dialog-overlay");
  if (overlay) {
    overlay.classList.add("prompt-overlay--closing");
    overlay.addEventListener("animationend", () => overlay.remove(), { once: true });
  }
  document.removeEventListener("keydown", onEscKey);
}

function onEscKey(e) {
  if (e.key === "Escape") closePromptDialog();
}

function showCopySuccess() {
  const btn  = document.getElementById("prompt-copy-btn");
  const hint = document.getElementById("prompt-copy-hint");
  if (!btn) return;
  btn.textContent = t('prompt.copied');
  btn.style.background = "#22c55e";
  if (hint) hint.textContent = t('prompt.copy_hint');
  setTimeout(() => {
    btn.textContent = t('prompt.copy_btn');
    btn.style.background = "";
    if (hint) hint.textContent = "";
  }, 3000);
}

function escapeForTextarea(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
