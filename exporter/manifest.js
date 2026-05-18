/**
 * exporter/manifest.js – imsmanifest.xml Generator
 * ==================================================
 * Generiert die imsmanifest.xml für SCORM 1.2 oder 2004.
 *
 * SCORM 1.2 ist funktional (Standard). 2004 ist Stub.
 *
 * Abhängigkeiten: config.js, core/utils.js, scorm/moodle-compat.js
 */

import { APP } from "../config.js";
import { escapeXML, slugify } from "../core/utils.js";
import { getAPIVersion } from "../scorm/moodle-compat.js";

/**
 * Baut den XML-String für imsmanifest.xml.
 *
 * @param {object} course
 * @param {Array<{id: string, title: string, href: string}>} pages
 * @returns {string}
 */
export function buildManifest(course, pages) {
  const version = getAPIVersion();
  const manifestId = `manifest_${slugify(course.title || "kurs")}`;

  if (version === "1.2") {
    return buildManifest12(course, pages, manifestId);
  }
  return buildManifest2004(course, pages, manifestId);
}

// ── SCORM 1.2 ──────────────────────────────────────────────────────

function buildManifest12(course, pages, manifestId) {
  const items = pages.map((p, i) => `
        <item identifier="ITEM-${i + 1}" identifierref="RES-${i + 1}">
          <title>${escapeXML(p.title)}</title>
        </item>`).join("");

  const resources = pages.map((p, i) => `
    <resource identifier="RES-${i + 1}" type="webcontent" adlcp:scormtype="sco" href="${escapeXML(p.href)}">
      <file href="${escapeXML(p.href)}"/>
      <file href="shared/style.css"/>
      <file href="shared/scorm.js"/>
      <file href="shared/quiz.js"/>
    </resource>`).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${manifestId}" version="1.0"
          xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
          xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd
                              http://www.imsglobal.org/xsd/imsmd_rootv1p2p1 imsmd_rootv1p2p1.xsd
                              http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="ORG-1">
    <organization identifier="ORG-1">
      <title>${escapeXML(course.title || APP.name)}</title>${items}
    </organization>
  </organizations>
  <resources>${resources}
  </resources>
</manifest>`;
}

// ── SCORM 2004 ─────────────────────────────────────────────────────

function buildManifest2004(course, pages, manifestId) {
  // TODO Phase 6: SCORM 2004 Manifest implementieren
  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- TODO: SCORM 2004 Manifest – Phase 6 -->
<manifest identifier="${manifestId}" version="1.0"></manifest>`;
}
