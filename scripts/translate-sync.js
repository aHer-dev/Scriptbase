/**
 * scripts/translate-sync.js
 * ==========================
 * Findet alle Keys in i18n/de.js die in anderen Sprachen fehlen,
 * übersetzt sie per Claude API und schreibt die Dateien neu.
 *
 * Neue Sprache hinzufügen:
 *   1. Leere Datei anlegen:  i18n/xx.js  (export default {};)
 *   2. In i18n.js registrieren
 *   3. Dieses Script ausführen
 *
 * Ausführen:
 *   node scripts/translate-sync.js          → alle Sprachen
 *   node scripts/translate-sync.js et       → nur Estnisch
 *
 * Voraussetzung: Node.js >= 18, ANTHROPIC_API_KEY als Umgebungsvariable
 */

import { readdir, writeFile } from 'fs/promises';
import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const I18N_DIR  = path.resolve(__dirname, '..', 'i18n');

// Sprachcodes → vollständige Sprachnamen für die Übersetzungs-KI
const LANGUAGE_NAMES = {
  en: 'English',
  et: 'Estonian',
  fr: 'French',
  es: 'Spanish',
  tr: 'Turkish',
  pl: 'Polish',
  nl: 'Dutch',
  it: 'Italian',
  pt: 'Portuguese',
  ar: 'Arabic',
  zh: 'Chinese (Simplified)',
  ja: 'Japanese',
};

// ── Übersetzungsdatei laden ──────────────────────────────────────────

async function loadLang(code) {
  const filePath = path.join(I18N_DIR, `${code}.js`);
  try {
    const mod = await import(pathToFileURL(filePath).href + `?t=${Date.now()}`);
    return mod.default ?? {};
  } catch {
    return {};
  }
}

// ── Alle Sprachdateien finden (außer de.js) ──────────────────────────

async function getTargetLanguages(filter) {
  const files = await readdir(I18N_DIR);
  return files
    .filter(f => f.endsWith('.js') && f !== 'de.js')
    .map(f => f.replace('.js', ''))
    .filter(code => !filter || code === filter);
}

// ── Fehlende Keys finden ─────────────────────────────────────────────

function findMissingKeys(de, target) {
  return Object.keys(de).filter(k => !(k in target) || target[k] === '');
}

// ── Per Claude API übersetzen ────────────────────────────────────────

async function translateWithClaude(stringsToTranslate, targetLanguage) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY nicht gesetzt.\n' +
      'PowerShell: $env:ANTHROPIC_API_KEY = "sk-ant-..."\n' +
      'CMD:        set ANTHROPIC_API_KEY=sk-ant-...'
    );
  }

  const langName = LANGUAGE_NAMES[targetLanguage] || targetLanguage.toUpperCase();
  const payload  = JSON.stringify(stringsToTranslate, null, 2);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type':    'application/json',
      'x-api-key':       apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content:
`You are translating UI strings for a SCORM course editor from German to ${langName}.
Keep the same tone and style. Preserve:
- Emojis (🎯 📌 ⚡ 💡 💭 🏥 ℹ ✏ ☑ ❓ ⊤ ⇔ 🎯 📁 ←  →)
- Template placeholders: {{n}}, {{filename}}, {{type}}, {{label}}
- Technical terms: SCORM, ZIP, URL, HTML, CSS, Claude, ChatGPT
- Special chars: ___ (gap placeholder), ×, ✓, ✕, ✎, ⠿

Return ONLY a valid JSON object — same keys as input, values in ${langName}.
No markdown, no explanation, just raw JSON.

Input:
${payload}`,
      }],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Claude API Fehler ${response.status}: ${body}`);
  }

  const data = await response.json();
  const text = data.content[0].text.trim();

  // JSON aus Antwort extrahieren (falls in Backtick-Block)
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
  return JSON.parse(jsonMatch[1].trim());
}

// ── Sprachdatei neu schreiben ────────────────────────────────────────

async function writeLangFile(code, translations) {
  // Kommentar-Gruppen (Reihenfolge wie in de.js)
  const groups = [
    ['block.',         '// block palette labels'],
    ['sidebar.',       '// sidebar'],
    ['editor.',        '// editor'],
    ['blocks.drag',    '// blocks – handles & controls'],
    ['blocks.ph.',     '// blocks – placeholders'],
    ['blocks.lernbox.','// blocks – lernbox labels'],
    ['blocks.quiz.',   '// blocks – quiz'],
    ['blocks.table.',  '// blocks – table'],
    ['blocks.image.',  '// blocks – image'],
    ['blocks.hotspot.','// blocks – hotspot'],
    ['blocks.muskel.', '// blocks – muscle anatomy'],
    ['toolbar.',       '// format toolbar'],
    ['importer.',      '// importer'],
    ['prompt.',        '// prompt dialog'],
    ['exporter.',      '// exporter'],
    ['app.',           '// app'],
  ];

  const lines    = [];
  let lastGroup  = null;

  for (const [key, val] of Object.entries(translations)) {
    const group        = groups.find(([prefix]) => key.startsWith(prefix));
    const groupComment = group?.[1];
    if (groupComment && groupComment !== lastGroup) {
      if (lines.length > 0) lines.push('');
      lines.push(`  ${groupComment}`);
      lastGroup = groupComment;
    }
    const escaped = String(val)
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/\n/g, '\\n');
    lines.push(`  '${key}': '${escaped}',`);
  }

  const langName = LANGUAGE_NAMES[code] || code.toUpperCase();
  const content  =
    `// ${langName} translations — auto-generated by scripts/translate-sync.js\n` +
    `export default {\n${lines.join('\n')}\n};\n`;

  await writeFile(path.join(I18N_DIR, `${code}.js`), content, 'utf8');
}

// ── Hauptprogramm ────────────────────────────────────────────────────

async function main() {
  const filterCode = process.argv[2] || null;

  console.log('🔍 Lade Quelldatei (de.js)...');
  const de = await loadLang('de');

  const targets = await getTargetLanguages(filterCode);
  if (targets.length === 0) {
    console.log(filterCode
      ? `❌ Sprache "${filterCode}" nicht gefunden in i18n/.`
      : '❌ Keine Zielsprachen in i18n/ gefunden.'
    );
    return;
  }

  for (const code of targets) {
    const langName = LANGUAGE_NAMES[code] || code.toUpperCase();
    console.log(`\n📋 Prüfe ${langName} (${code})...`);

    const existing = await loadLang(code);
    const missing  = findMissingKeys(de, existing);

    if (missing.length === 0) {
      console.log(`   ✅ Vollständig — nichts zu tun.`);
      continue;
    }

    console.log(`   ${missing.length} fehlende Keys:`);
    missing.slice(0, 5).forEach(k => console.log(`     - ${k}`));
    if (missing.length > 5) console.log(`     ... und ${missing.length - 5} weitere`);

    console.log(`   🤖 Übersetze per Claude API...`);
    const toTranslate = Object.fromEntries(missing.map(k => [k, de[k]]));
    const translated  = await translateWithClaude(toTranslate, code);

    // Reihenfolge aus de.js beibehalten
    const merged  = { ...existing, ...translated };
    const ordered = {};
    for (const key of Object.keys(de)) {
      if (key in merged) ordered[key] = merged[key];
    }

    await writeLangFile(code, ordered);
    console.log(`   ✅ ${missing.length} Übersetzungen hinzugefügt → i18n/${code}.js`);
  }

  console.log('\n💡 Tipp: Überprüfe neue Einträge kurz vor dem Commit.');
}

main().catch(err => {
  console.error('\n❌ Fehler:', err.message);
  process.exit(1);
});
