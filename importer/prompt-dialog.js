/**
 * importer/prompt-dialog.js – KI-Prompt-Dialog
 * ===============================================
 * Zeigt ein editierbares Modal mit dem Prompt-Template für KI-Tools.
 * Workflow: Skript + Prompt in ChatGPT/Claude → HTML-Dateien → ZIP → Import
 *
 * Abhängigkeiten: keine
 */

const PROMPT_TEMPLATE = `Du bist ein Kurs-Autor. Erstelle aus dem Skript am Ende diesen strukturierten Online-Kurs als HTML-Dateien.

━━ AUSGABE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Eine HTML-Datei pro Kapitel
• Dateinamen: 01_einleitung.html, 02_grundlagen.html usw.
• Alle Dateien gesammelt ausgeben (oder als ZIP)

━━ HTML-STRUKTUR ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Jede Datei hat genau diesen Aufbau:

<div class="atm">

  <h1>Kapiteltitel</h1>

  <h2>Abschnitt</h2>
  <h3>Unterabschnitt</h3>

  <p>Fließtext mit <strong>fett</strong> und <em>kursiv</em>.</p>

  <ul>
    <li>Aufzählungspunkt</li>
  </ul>

  <ol>
    <li>Nummerierter Schritt</li>
  </ol>

  <table>
    <tr><th>Spalte 1</th><th>Spalte 2</th></tr>
    <tr><td>Wert</td><td>Wert</td></tr>
  </table>

  <hr>

  <!-- Lern-Boxen – genau diese Klassen verwenden: -->

  <div class="atm-merke">Merksatz oder Eselsbrücke</div>

  <div class="atm-klinik">
    <h4>Klinischer Bezug – Titel</h4>
    <p>Beschreibung</p>
  </div>

  <div class="atm-tipp">Praktischer Hinweis</div>

  <div class="atm-aufgabe">Aufgabe oder Übung für die Lernenden</div>

</div>

━━ INTERAKTIVE BLÖCKE (Quizfragen) ━━━━━━━━━━━━━━━━━━━
Verwende diese Formate für Lernkontrollen. Baue pro Kapitel
2–4 Fragen ein, verteilt über den Inhalt.

<!-- MC – eine richtige Antwort                          -->
<!-- data-correct = Index der richtigen Antwort (0-basiert) -->
<div class="atm-quiz" data-correct="1">
  <p>Welches Gelenk ist ein Kugelgelenk?</p>
  <ul>
    <li>Kniegelenk</li>
    <li>Hüftgelenk</li>
    <li>Ellenbogengelenk</li>
    <li>Sprunggelenk</li>
  </ul>
</div>

<!-- MC – mehrere richtige Antworten                     -->
<!-- data-correct = kommagetrennte Indizes, z. B. "0,2" -->
<div class="atm-quiz-multi" data-correct="0,2">
  <p>Welche Knochen bilden das Os coxae?</p>
  <ul>
    <li>Os ilium</li>
    <li>Os femoris</li>
    <li>Os ischii</li>
    <li>Os temporale</li>
  </ul>
</div>

<!-- Wahr / Falsch                                       -->
<!-- data-correct = "wahr" oder "falsch"                 -->
<div class="atm-wahr-falsch" data-correct="wahr">
  <p>Das Hüftgelenk ist das größte Gelenk des menschlichen Körpers.</p>
</div>

<!-- Lückentext                                          -->
<!-- Lücken im Text mit ___ markieren                   -->
<!-- Lösungen in gleicher Reihenfolge als Liste         -->
<div class="atm-luecke">
  <p>Der Oberschenkelknochen heißt ___ und bildet zusammen mit der ___ das Hüftgelenk.</p>
  <ul>
    <li>Femur</li>
    <li>Hüftpfanne (Acetabulum)</li>
  </ul>
</div>

<!-- Zuordnung (Matching)                                -->
<!-- data-links = linke Spalte, data-rechts = rechte Spalte -->
<div class="atm-zuordnung">
  <ul>
    <li data-links="Os ilium"  data-rechts="Darmbein"></li>
    <li data-links="Os ischii" data-rechts="Sitzbein"></li>
    <li data-links="Os pubis"  data-rechts="Schambein"></li>
  </ul>
</div>

━━ VERBOTEN ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✗ Kein <style>-Block
✗ Kein <script> / JavaScript
✗ Keine inline-Styles  (style="...")
✗ Kein <html>, <head> oder <body>-Wrapper
✗ Keine <img>-Tags (Bilder werden später manuell eingefügt)

━━ HINWEIS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Lade deine Inhalte (Skript, Folien, Texte) direkt in den
Chat deiner KI (ChatGPT, Claude usw.) und schick diesen
Prompt dazu. Das Styling übernimmt ScriptBase beim Import.
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
    <div class="prompt-dialog" role="dialog" aria-modal="true" aria-label="KI-Prompt">
      <div class="prompt-dialog-header">
        <div class="prompt-dialog-title">
          <span class="prompt-dialog-icon">✦</span>
          KI-Prompt: Kurs erstellen lassen
        </div>
        <button class="btn btn-icon prompt-close" title="Schließen" aria-label="Schließen">✕</button>
      </div>

      <p class="prompt-dialog-desc">
        Kopiere den Prompt, füge dein Skript am Ende ein und schick alles an ChatGPT oder Claude.
        Die KI gibt HTML-Dateien zurück → als ZIP speichern → hier importieren.
      </p>

      <textarea class="prompt-textarea" spellcheck="false">${escapeForTextarea(PROMPT_TEMPLATE)}</textarea>

      <div class="prompt-dialog-footer">
        <span class="prompt-copy-hint" id="prompt-copy-hint"></span>
        <button class="btn btn-primary prompt-copy-btn" id="prompt-copy-btn">Prompt kopieren</button>
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
  btn.textContent = "Kopiert ✓";
  btn.style.background = "#22c55e";
  if (hint) hint.textContent = "Jetzt in ChatGPT oder Claude einfügen.";
  setTimeout(() => {
    btn.textContent = "Prompt kopieren";
    btn.style.background = "";
    if (hint) hint.textContent = "";
  }, 3000);
}

function escapeForTextarea(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
