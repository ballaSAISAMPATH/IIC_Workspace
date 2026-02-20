// src/services/reportGenerator.js
// PDF download uses pdf-lib to fill the official FORM IF1 PDF

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

const FORM_PDF_URL = "/FORM_IF_1.pdf"; // place FORM_IF_1.pdf in your /public folder

function drawText(page, font, text, x0, y_top, x1, y_bottom, fontSize = 8, pdfHeight = 792) {
  if (!text) return;
  const maxWidth = x1 - x0 - 2;
  const lineHeight = fontSize + 2;
  const baseY = pdfHeight - y_bottom + (y_bottom - y_top) * 0.1;

  const words = String(text).split(" ");
  const lines = [];
  let cur = "";
  for (const word of words) {
    const test = cur ? cur + " " + word : word;
    if (font.widthOfTextAtSize(test, fontSize) > maxWidth && cur) {
      lines.push(cur);
      cur = word;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);

  lines.forEach((line, i) => {
    page.drawText(line, {
      x: x0 + 1,
      y: baseY - i * lineHeight,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });
  });
}

function drawBlock(page, font, text, x0, y_top, x1, y_bottom, fontSize = 8, pdfHeight = 792) {
  if (!text) return;
  const maxWidth = x1 - x0 - 4;
  const lineHeight = fontSize + 2.5;
  const startY = pdfHeight - y_top - fontSize;
  const minY = pdfHeight - y_bottom;

  const words = text.split(" ");
  const lines = [];
  let cur = "";
  for (const word of words) {
    const test = cur ? cur + " " + word : word;
    if (font.widthOfTextAtSize(test, fontSize) > maxWidth && cur) {
      lines.push(cur);
      cur = word;
    } else cur = test;
  }
  if (cur) lines.push(cur);

  lines.forEach((line, i) => {
    const y = startY - i * lineHeight;
    if (y < minY) return;
    page.drawText(line, { x: x0 + 2, y, size: fontSize, font, color: rgb(0, 0, 0) });
  });
}

export async function downloadAsPDF(report) {
  const existingBytes = await fetch(FORM_PDF_URL).then((r) => r.arrayBuffer());
  const pdfDoc = await PDFDocument.load(existingBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();
  const p1 = pages[0];
  const p2 = pages[1];
  const H = 792;
  const d1 = (t, x0, yt, x1, yb, fs) => drawText(p1, font, t, x0, yt, x1, yb, fs, H);
  const d2 = (t, x0, yt, x1, yb, fs) => drawText(p2, font, t, x0, yt, x1, yb, fs, H);

  // Item 1
  d1(report.district,       97,  113, 168, 127, 7);
  d1(report.policeStation,  220, 113, 289, 127, 7);
  d1(report.year,           292, 113, 358, 127, 8);
  d1(report.firNumber,      413, 113, 480, 127, 8);
  d1(report.filingDate,     507, 113, 558, 127, 7);

  // Item 2
  d1(report.act1,      126, 141, 284, 155, 7);
  d1(report.sections1, 340, 141, 553, 155, 8);
  d1(report.act2,      126, 162, 284, 175, 8);
  d1(report.sections2, 340, 162, 553, 175, 8);
  d1(report.act3,      126, 182, 284, 196, 8);
  d1(report.sections3, 340, 182, 553, 196, 8);
  d1(report.otherActs, 223, 203, 553, 217, 8);

  // Item 3
  d1([report.occurrenceDay, report.occurrenceDate].filter(Boolean).join("  "), 260, 238, 455, 251, 8);
  d1(report.occurrenceTime,   491, 238, 556, 251, 8);
  d1(report.infoReceivedDate, 266, 265, 388, 279, 8);
  d1(report.infoReceivedTime, 417, 265, 556, 279, 8);
  d1(report.gdEntryNo,        286, 293, 383, 306, 8);
  d1(report.gdEntryTime,      413, 293, 557, 306, 8);

  // Item 4
  d1(report.infoType, 175, 320, 285, 334, 8);

  // Item 5
  d1(report.directionDistance, 354, 348, 438, 361, 8);
  d1(report.beatNo,            486, 348, 556, 361, 8);
  d1(report.placeAddress,      151, 376, 552, 389, 7);

  // Item 6
  d1(report.complainantName,    131, 472, 556, 486, 8);
  d1(report.fatherHusbandName,  234, 494, 556, 507, 8);
  d1(report.complainantDOB,     201, 515, 383, 528, 8);
  d1(report.nationality,        459, 515, 558, 528, 8);
  d1(report.passportNo,         164, 535, 255, 549, 8);
  d1(report.passportIssueDate,  327, 535, 406, 549, 8);
  d1(report.passportIssuePlace, 477, 535, 558, 549, 8);
  d1(report.occupation,         161, 556, 556, 570, 8);
  d1(report.complainantAddress, 145, 577, 556, 590, 7);

  // Item 7 — accused (3 lines)
  const accLines = wrapToLines(report.accusedDetails, 85, 3);
  d1(accLines[0], 71, 632, 557, 645, 8);
  d1(accLines[1], 71, 646, 557, 659, 8);
  d1(accLines[2], 71, 660, 557, 673, 8);

  // Item 8 — delay reason
  d1(report.delayReason, 374, 673, 556, 687, 8);

  // Item 9 — properties (short part on page 1)
  d1(String(report.propertiesStolen || "").slice(0, 55), 451, 715, 556, 728, 8);

  // ── PAGE 2 ──────────────────────────────────────────────────
  d2(String(report.propertiesStolen || "").slice(55), 71, 44, 551, 58, 8);
  d2(report.totalPropertyValue, 302, 100, 550, 113, 8);
  d2(report.inquestReport,      267, 127, 551, 141, 8);

  // Item 12 — FIR Contents (large block)
  drawBlock(p2, font, report.firContents || "", 71, 185, 553, 368, 8, H);

  // Save and trigger download
  const pdfBytes = await pdfDoc.save();
  triggerDownload(pdfBytes, "application/pdf", `FIR-${report.firNumber || "report"}.pdf`);
}

function wrapToLines(text, charsPerLine, maxLines) {
  if (!text) return Array(maxLines).fill("");
  const words = text.split(" ");
  const lines = [];
  let cur = "";
  for (const word of words) {
    if (lines.length >= maxLines) break;
    if ((cur + " " + word).trim().length > charsPerLine && cur) {
      lines.push(cur.trim()); cur = word;
    } else cur = (cur + " " + word).trim();
  }
  if (cur && lines.length < maxLines) lines.push(cur.trim());
  while (lines.length < maxLines) lines.push("");
  return lines;
}

function triggerDownload(bytes, mime, filename) {
  const blob = new Blob([bytes], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

export function printFIR() { window.print(); }

export function downloadAsTxt(report) {
  const v = (x) => x || "—";
  const D = "─".repeat(65);
  const txt = [
    "FORM IF1 | FIRST INFORMATION REPORT | (Under Section 154 Cr.P.C)",
    D,
    `FIR No: ${v(report.firNumber)}  Date: ${v(report.filingDate)}`,
    `Dist: ${v(report.district)}  P.S.: ${v(report.policeStation)}  Year: ${v(report.year)}`,
    D,
    "2. Acts:",
    ` (i)  ${v(report.act1)} — ${v(report.sections1)}`,
    ` (ii) ${v(report.act2)} — ${v(report.sections2)}`,
    ` (iii)${v(report.act3)} — ${v(report.sections3)}`,
    ` (iv) ${v(report.otherActs)}`,
    D,
    `3. Occurrence: ${v(report.occurrenceDay)} ${v(report.occurrenceDate)} ${v(report.occurrenceTime)}`,
    `   Info received: ${v(report.infoReceivedDate)} ${v(report.infoReceivedTime)}`,
    `   G.D. Entry: ${v(report.gdEntryNo)}  Time: ${v(report.gdEntryTime)}`,
    `4. Type: ${v(report.infoType)}`,
    D,
    `5. Place: ${v(report.placeAddress)}  (${v(report.directionDistance)})`,
    D,
    "6. Complainant:",
    `   Name: ${v(report.complainantName)}`,
    `   Father/Husband: ${v(report.fatherHusbandName)}`,
    `   DOB: ${v(report.complainantDOB)}  Nationality: ${v(report.nationality)}`,
    `   Occupation: ${v(report.occupation)}`,
    `   Address: ${v(report.complainantAddress)}`,
    D,
    `7. Accused:\n${v(report.accusedDetails)}`,
    `8. Delay: ${v(report.delayReason)}`,
    `9. Properties:\n${v(report.propertiesStolen)}`,
    `10. Total Value: ${v(report.totalPropertyValue)}`,
    `11. Inquest/UD: ${v(report.inquestReport)}`,
    D,
    `12. FIR Contents:\n${v(report.firContents)}`,
    D,
  ].join("\n");
  triggerDownload(new TextEncoder().encode(txt), "text/plain;charset=utf-8", `FIR-${report.firNumber || "report"}.txt`);
}

export function downloadAsDocx(report) {
  const v = (x) => x || "—";
  const html = `<html><head><meta charset="utf-8"><style>
body{font-family:Arial,sans-serif;font-size:10pt;margin:2cm}
h1{text-align:center;font-size:13pt}h2{text-align:center;font-size:10pt;font-weight:normal}
hr{border-top:1px solid #000}.val{border-bottom:1px solid #888;display:inline-block;min-width:80px}
.block{border:1px solid #ccc;padding:5px;margin-top:3px}.row{margin:5px 0}
.sigs{display:flex;justify-content:space-between;margin-top:18px}.sig{width:45%}
.sigline{border-bottom:1px solid #000;height:36px;margin:5px 0}
</style></head><body>
<p style="text-align:center;font-size:8pt">FORM – IF1 (Integrated Form)</p>
<h1>FIRST INFORMATION REPORT</h1><h2>(Under Section 154 Cr.P.C)</h2><hr>
<div class="row">1. Dist: <span class="val">${v(report.district)}</span> &nbsp;P.S.: <span class="val">${v(report.policeStation)}</span> &nbsp;Year: <span class="val">${v(report.year)}</span> &nbsp;F.I.R. No.: <b><span class="val">${v(report.firNumber)}</span></b> &nbsp;Date: <span class="val">${v(report.filingDate)}</span></div>
<div class="row">2. (i) ${v(report.act1)} — ${v(report.sections1)}<br>(ii) ${v(report.act2)} — ${v(report.sections2)}<br>(iii) ${v(report.act3)} — ${v(report.sections3)}<br>(iv) ${v(report.otherActs)}</div>
<div class="row">3. Occurrence: ${v(report.occurrenceDay)} ${v(report.occurrenceDate)} ${v(report.occurrenceTime)}<br>Info received: ${v(report.infoReceivedDate)} ${v(report.infoReceivedTime)}<br>G.D.: ${v(report.gdEntryNo)} / ${v(report.gdEntryTime)}</div>
<div class="row">4. Type: ${v(report.infoType)}</div>
<div class="row">5. Place: ${v(report.placeAddress)} (${v(report.directionDistance)})</div>
<div class="row">6. Name: ${v(report.complainantName)}<br>Father/Husband: ${v(report.fatherHusbandName)}<br>DOB: ${v(report.complainantDOB)} Nationality: ${v(report.nationality)}<br>Occupation: ${v(report.occupation)}<br>Address: ${v(report.complainantAddress)}</div>
<div class="row">7. Accused:<div class="block">${v(report.accusedDetails)}</div></div>
<div class="row">8. Delay: ${v(report.delayReason)}</div>
<div class="row">9. Properties:<div class="block">${v(report.propertiesStolen)}</div>10. Total Value: ${v(report.totalPropertyValue)}</div>
<div class="row">11. Inquest/UD: ${v(report.inquestReport)}</div>
<div class="row">12. FIR Contents:<div class="block" style="min-height:80px">${v(report.firContents)}</div></div><hr>
<div class="row">13. Action Taken: Registered and investigation taken up.
<div class="sigs"><div class="sig"><b>Signature of Officer-in-Charge</b><div class="sigline"></div><p>Name: _______________</p><p>Rank: _______ No. _______</p></div>
<div class="sig"><b>14. Signature / Thumb-impression of Complainant</b><div class="sigline"></div></div></div>
<p>15. Date &amp; time of despatch to court: _______________</p></div>
</body></html>`;
  triggerDownload(new TextEncoder().encode(html), "application/msword", `FIR-${report.firNumber || "report"}.doc`);
}
