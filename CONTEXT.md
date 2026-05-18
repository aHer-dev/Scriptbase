# CourseForge – Projekt-Kontext
> Diese Datei am Anfang JEDES neuen Chats einfügen.
> Sie ist die einzige Quelle der Wahrheit für dieses Projekt.

---

## Was ist CourseForge?

Browser-basiertes Autor-Tool für Moodle-Kurse.
- Läuft komplett lokal im Browser (keine Server, kein Backend, kein Login)
- HTML- oder SCORM-ZIP importieren (z.B. KI-Output) ODER komplett neu erstellen
- Inhalte visuell bearbeiten (Texte, Bilder, YouTube, Lern-Boxen)
- Fertige SCORM 1.2 ZIP exportieren → direkt in Moodle hochladbar
- Design anpassbar (Farben, Themes) pro Kurs
- Langfristig stabil: modular, kein Monolith, Moodle-Updates isoliert

## Kernproblem / Use-Case

KI-Tools (z.B. ChatGPT) generieren HTML/SCORM-Kursdateien als Rohdateien.
Nachträgliches Einfügen von Videos, Bildern oder strukturellen Änderungen
in diesen Rohdateien ist mühsam und fehleranfällig.
CourseForge ist der fehlende Schritt dazwischen:
Import → visuell bearbeiten → sauberes SCORM exportieren.

## Zielgruppe

Primär: Medizin-Lehrender (Uni/Klinik), kein Programmierer, arbeitet oft mit KI-generiertem Material
Sekundär: Kolleg:innen die Kurse bearbeiten sollen (muss Laien-bedienbar sein)

---

## Aktueller Stand (Stand: 2026-04-30, Phase 6 abgeschlossen)

### Fertig und funktionsfähig

| Modul | Status | Anmerkung |
|---|---|---|
| `core/state.js` | ✅ fertig | Pub/Sub, Persistenz, activeChapterId-Bug gefixt; Mode-State (`getMode`/`setMode`/`subscribeMode`) ergänzt |
| `core/course.js` | ✅ fertig | activeChapterId aus Course-Objekt entfernt (war falsch) |
| `core/chapter.js` | ✅ fertig | |
| `core/block-types.js` | ✅ fertig | 18 Block-Typen: Inhalt (7) + Lern-Boxen (4) + Interaktion (7: quiz, quiz_multi, true_false, luecke, zuordnung, hotspot) |
| `core/utils.js` | ✅ fertig | inkl. now() (war anfangs fehlend) |
| `scorm/moodle-compat.js` | ✅ fertig | 1.2 ↔ 2004 Mapping |
| `sidebar/sidebar.js` | ✅ fertig | Kapitel-Liste, CRUD, Drag&Drop |
| `editor/editor.js` | ✅ fertig | Block-CRUD: hinzufügen, löschen, verschieben, inline editieren; `addBlockToActiveChapter(type)` export |
| `editor/blocks.js` | ✅ fertig | Alle 18 Block-Typen: contenteditable Inline-Editing, block-shell mit Toolbar (↑↓✕), neue Interaction-UIs |
| `design/themes.js` | ✅ fertig | 7 Themes; Block-Palette in 3 Gruppen (Inhalt/Lern-Boxen/Interaktion); ruft `addBlockToActiveChapter` auf |
| `design/renderer.js` | ✅ fertig | applyPreview() liest `theme[mode]` → setzt --ed-* + --cf-* + Overrides |
| `importer/importer.js` | ✅ fertig | JSZip, imsmanifest.xml Parser, HTML→Blöcke, Lern-Boxen per class, MC-Quiz (atm-frage) |
| `importer/prompt-dialog.js` | ✅ fertig | KI-Prompt-Vorlage Modal mit Copy-Button |
| `exporter/manifest.js` | ✅ SCORM 1.2 | 2004 ist Stub |
| `exporter/scorm-runtime.js` | ✅ fertig | Tracking-Script für exportierte Seiten |
| `exporter/zip-builder.js` | ✅ fertig | JSZip dynamisch geladen |

### Noch ausstehend (nächste Phasen)

| Modul | Was fehlt | Phase |
|---|---|---|
| `exporter/exporter.js` | chapterToHTML + blockToHTML für alle 18 Block-Typen; SCORM-Tracking für Interaktionen (choice, true-false, fill-in, matching, performance) | Phase 7 |
| Polish | Autosave-Indikator, Keyboard-Shortcuts | Phase 8 |

### Bekannte Fixes die bereits gemacht wurden

- `activeChapterId` lebte doppelt (State-Modul + Course-Objekt) → aus Course-Objekt entfernt
- `core/utils.js` fehlte `now()` → ergänzt
- `setActiveChapter()` persistierte nicht → `persist()` hinzugefügt
- `onDeleteChapter()` setzte aktives Kapitel nicht korrekt neu → gefixt
- `style.css` hatte nur Dark-Mode-Tokens → alle `--ed-*`-Variablen auf CSS Custom Properties umgestellt, hardcodierte Farben entfernt (`--ed-accent-dim`, `--ed-accent-border` ergänzt)

---

## Architektur-Prinzipien (STRIKT einhalten)

1. **Single Source of Truth:** Der Kurs lebt in `core/state.js`. Keine Module-Level-Variablen mit Kurs-Daten irgendwo anders.
2. **activeChapterId gehört NUR ins State-Modul** – NICHT ins course-Objekt. Wird separat im localStorage-Payload gespeichert.
3. **Pub/Sub statt Direkt-Aufrufe:** UI-Module abonnieren den State und rendern bei Änderungen neu. Module rufen sich nicht direkt gegenseitig auf.
4. **Abhängigkeiten nur nach unten:** `core/` darf nichts importieren außer aus `core/`. UI-Module dürfen `core/` importieren, nicht umgekehrt.
5. **SCORM ist isoliert:** SCORM-Code lebt NUR in `scorm/` und `exporter/scorm-runtime.js`. Nichts anderes weiß was von SCORM.
6. **Daten mutieren in place:** `update(course => course.title = 'X')` statt Kopien.
7. **Schema-Versionierung von Anfang an:** Gespeicherte Daten haben eine `schemaVersion`. Bei Breaking Changes wird migriert.
8. **Encoding immer UTF-8:** Überall explizit angeben.
9. **Eine Funktion pro KI-Prompt:** Beim Coden mit KI immer nur eine Funktion auf einmal.

---

## Modulstruktur

```
courseforge/
│
├── index.html              ← Einstiegspunkt, lädt app.js
├── app.js                  ← Koordinator: initialisiert Module, verdrahtet Events
├── config.js               ← ZENTRALE WAHRHEIT für Konfig (SCORM, Design, App)
├── style.css               ← Styling der Editor-App (NICHT der exportierten Kurse)
│
├── core/                   ← Reine Daten + State, KEINE UI, KEINE Imports nach außen
│   ├── state.js            ← Single Source of Truth + Pub/Sub + Persistenz
│   ├── course.js           ← Kurs-Operationen (addChapter, removeChapter, ...)
│   ├── chapter.js          ← Kapitel-Operationen (addBlock, updateBlock, ...)
│   ├── block-types.js      ← Block-Definitionen (Text, Merke, Klinik, YouTube, ...)
│   └── utils.js            ← uid(), now(), escapeHTML(), escapeXML(), slugify()
│
├── scorm/                  ← SCORM-Konstanten & Mapping
│   └── moodle-compat.js    ← Versions-Mapping 1.2 ↔ 2004, Quirks
│
├── editor/                 ← Block-Editor UI
│   ├── editor.js           ← Controller: rendert aktives Kapitel, hört auf State
│   └── blocks.js           ← Render-Funktionen pro Block-Typ (DOM-Elemente)
│
├── sidebar/                ← Kapitel-Manager
│   └── sidebar.js          ← Kapitel-Liste, CRUD, Drag & Drop
│
├── design/                 ← Styling des exportierten Kurses
│   ├── themes.js           ← Theme-Definitionen + Farb-Picker UI + Panel
│   └── renderer.js         ← CSS-Generator + Live-Vorschau (applyPreview)
│
├── importer/               ← ZIP Import
│   └── importer.js         ← ZIP einlesen + HTML parsen (Phase 2)
│
├── exporter/               ← SCORM Export
│   ├── exporter.js         ← Koordiniert Export, generiert HTML pro Kapitel
│   ├── manifest.js         ← imsmanifest.xml Generator (SCORM 1.2 fertig)
│   ├── scorm-runtime.js    ← SCORM-Tracking-Script (String, wird in ZIP geschrieben)
│   └── zip-builder.js      ← Fertige ZIP zusammenbauen (JSZip via CDN)
│
└── CONTEXT.md              ← Diese Datei
```

---

## Datenfluss

```
                ┌─────────────────────┐
                │   core/state.js     │  ← Single Source of Truth
                │   (course-Objekt)   │
                └──────────┬──────────┘
                           │ subscribe()
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
      ┌─────────┐   ┌──────────┐   ┌──────────┐
      │ Sidebar │   │  Editor  │   │  Design  │
      └─────────┘   └──────────┘   └──────────┘
            │              │              │
            └──────────────┼──────────────┘
                           │ update(fn)
                           ▼
                ┌─────────────────────┐
                │   localStorage      │  ← automatisch nach jedem update()
                │   { schemaVersion,  │     UND nach setActiveChapter()
                │     activeChapterId,│
                │     course }        │
                └─────────────────────┘
```

UI-Module schreiben NIE direkt ins course-Objekt. Sie rufen `update(course => ...)` auf.
`activeChapterId` lebt NUR als Modul-Variable in state.js – nie in course.activeChapterId.

---

## Technologie-Stack

- **Sprache:** Vanilla JavaScript (ES Modules)
- **Editor (Phase 3):** TipTap – nicht `document.execCommand` (deprecated)
- **ZIP:** JSZip via CDN-Import (dynamisch nachgeladen, gecacht)
- **SCORM:** 1.2 (Standard), 2004 vorbereitet
- **Styling:** CSS Custom Properties (--cf-primary, --cf-merke, etc.)
- **Persistenz:** localStorage (für später: IndexedDB bei großen Kursen)
- **Hosting:** Lokal im Browser, kein Backend

---

## Implementierungsreihenfolge

1. ✅ **State + Datenmodelle** — fertig
2. ✅ **Sidebar** — fertig (CRUD, Drag&Drop, activeChapter-Bug gefixt)
3. ✅ **Editor read-only** — fertig (alle Block-Typen werden angezeigt)
4. ✅ **UI / Design** — fertig
   - 7 Themes, je `.dark` + `.light` (Glassmorphism)
   - Dark/Light-Mode-Toggle in Topbar (☀️/🌙), persistiert in `localStorage('mode')`, Default: Light
   - Options-Panel (⚙️ unten rechts) mit Theme-Auswahl
   - Rechtes Panel zeigt nur noch Block-Palette
   - Alle `--ed-*` CSS-Variablen theme-gesteuert, keine hardcodierten Farben mehr
5. ✅ **Importer** — fertig (JSZip, Manifest-Parser, HTML→Blöcke, Lern-Boxen, MC-Quiz, KI-Prompt-Dialog)
6. ✅ **Editor bearbeiten** — fertig (Block-CRUD: hinzufügen/löschen/verschieben, Inline-Editing für alle 18 Typen, Layout-Sliders)
7. ⬜ **Exporter** — chapterToHTML + blockToHTML für alle 18 Typen, SCORM-Interaktions-Tracking
8. ⬜ **Polish** — Autosave-Indikator, Keyboard-Shortcuts

---

## Wichtige Entscheidungen

| Thema | Entscheidung | Grund |
|---|---|---|
| Framework | Vanilla JS + ES Modules | Keine Build-Pipeline, läuft direkt im Browser |
| State | Eigenes Mini-Pub/Sub in core/state.js | 30 Zeilen, kein Redux/MobX nötig |
| activeChapterId | Nur im State-Modul, separat neben course gespeichert | course-Objekt = reine Inhaltsdaten |
| Editor-Engine | TipTap (Phase 3) | execCommand ist deprecated |
| SCORM Version | 1.2 | Beste Moodle-Kompatibilität |
| Mutation | In-place statt immutable | Einfacher für Solo-Projekt |
| Persistenz | localStorage mit schemaVersion | Auto-Save bei jedem Update |
| ZIP handling | JSZip im Browser | Kein Backend nötig |
| Encoding | UTF-8 überall | Umlaute problemlos |
| Design | CSS Custom Properties | Themes einfach austauschbar |

---

## Prompt-Vorlage für neue Chats

```
Hier ist mein Projektkontext: [CONTEXT.md einfügen]

Aktuell arbeite ich an: [Modul/Datei]
Hier ist der bisherige Code: [Code einfügen]

Aufgabe (NUR DIESE EINE FUNKTION):
[Genau beschreiben was die eine Funktion machen soll]
```
