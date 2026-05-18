/**
 * exporter/zip-builder.js – ZIP-Bau via JSZip
 * =============================================
 * Lädt JSZip dynamisch von CDN nach (gecached), packt eine Datei-Map
 * in eine ZIP und triggert den Download.
 *
 * Komplett funktional – wird vom Exporter genutzt sobald der Rest steht.
 *
 * Abhängigkeiten: keine (JSZip wird zur Laufzeit nachgeladen)
 */

const JSZIP_CDN = "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";

let jszipPromise = null;

/**
 * Lädt JSZip einmalig nach (cached über jszipPromise).
 * @returns {Promise<any>} window.JSZip-Konstruktor
 */
function loadJSZip() {
  if (window.JSZip) return Promise.resolve(window.JSZip);
  if (jszipPromise) return jszipPromise;

  jszipPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = JSZIP_CDN;
    script.onload = () => resolve(window.JSZip);
    script.onerror = () => {
      jszipPromise = null;
      reject(new Error("JSZip konnte nicht geladen werden."));
    };
    document.head.appendChild(script);
  });
  return jszipPromise;
}

/**
 * Baut eine ZIP aus einer Pfad → Inhalt-Map und triggert Download.
 *
 * Beispiel:
 *   await buildZip({
 *     "imsmanifest.xml": "<?xml ...",
 *     "pages/01_intro.html": "<!DOCTYPE ...",
 *     "shared/style.css": ":root { ... }",
 *   }, "mein_kurs.zip");
 *
 * @param {Object<string, string|Blob|Uint8Array>} files
 * @param {string} filename - Name der Download-Datei
 */
export async function buildZip(files, filename = "kurs.zip") {
  const JSZip = await loadJSZip();
  const zip = new JSZip();

  for (const [path, content] of Object.entries(files)) {
    zip.file(path, content);
  }

  const blob = await zip.generateAsync({ type: "blob" });
  triggerDownload(blob, filename);
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
