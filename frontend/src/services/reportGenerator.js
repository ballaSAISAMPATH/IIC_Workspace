
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";


function wrapText(font, text, fontSize, maxWidth) {
  if (!text) return [];
  // Strip control characters except newline, then split on newlines first
  const sanitized = String(text).replace(/[^\S\n]/g, " ").replace(/[^\x20-\x7E\xA0-\xFF\n]/g, "");
  const paragraphs = sanitized.split(/\r?\n/);
  const lines = [];
  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) { lines.push(""); continue; }
    const words = trimmed.split(/\s+/);
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
  }
  return lines;
}


function drawField(page, fonts, label, value, x, y, opts = {}) {
  const { fontSize = 9, labelWidth = 160, maxWidth = 470, indent = 0 } = opts;
  const lineHeight = fontSize + 4;
  const xPos = x + indent;

  page.drawText(label, { x: xPos, y, size: fontSize, font: fonts.bold, color: rgb(0, 0, 0) });
  const valX = xPos + labelWidth;
  const valMaxW = maxWidth - labelWidth - indent;
  const lines = wrapText(fonts.regular, value || "—", fontSize, valMaxW);
  if (lines.length === 0) lines.push("—");
  lines.forEach((line, i) => {
    page.drawText(line, {
      x: i === 0 ? valX : valX,
      y: y - i * lineHeight,
      size: fontSize,
      font: fonts.regular,
      color: rgb(0, 0, 0),
    });
  });
  return y - lines.length * lineHeight;
}

/** Draw a horizontal rule */
function drawHR(page, x, y, width) {
  page.drawLine({ start: { x, y }, end: { x: x + width, y }, thickness: 0.5, color: rgb(0.4, 0.4, 0.4) });
}

/** Draw a section heading like "12. FIR Contents:" and return new Y */
function drawSectionHeading(page, fonts, text, x, y, fontSize = 10) {
  page.drawText(text, { x, y, size: fontSize, font: fonts.bold, color: rgb(0, 0, 0) });
  return y - fontSize - 5;
}

/** Draw a block of wrapped text, return new Y */
function drawWrappedBlock(page, font, text, x, y, maxWidth, fontSize = 9) {
  const lineHeight = fontSize + 3.5;
  const lines = wrapText(font, text, fontSize, maxWidth);
  lines.forEach((line, i) => {
    page.drawText(line, { x, y: y - i * lineHeight, size: fontSize, font, color: rgb(0, 0, 0) });
  });
  return y - lines.length * lineHeight;
}


async function buildFIRPdf(report) {
  const v = (x) => x || "—";
  const pdfDoc = await PDFDocument.create();
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fonts = { regular, bold };

  const W = 595.28;   
  const H = 841.89;   
  const margin = 50;
  const contentW = W - margin * 2;

  let page = pdfDoc.addPage([W, H]);
  let y = H - margin;

  /** Add a new page when space runs out, returns updated y */
  function ensureSpace(needed) {
    if (y - needed < margin) {
      page = pdfDoc.addPage([W, H]);
      y = H - margin;
    }
  }

  // ── Title ──
  const titleLines = [
    { text: "FORM — IF1 (Integrated Form)", size: 8, font: regular },
    { text: "FIRST INFORMATION REPORT", size: 14, font: bold },
    { text: "(Under Section 154 Cr.P.C)", size: 9, font: regular },
  ];
  for (const tl of titleLines) {
    const tw = tl.font.widthOfTextAtSize(tl.text, tl.size);
    page.drawText(tl.text, { x: (W - tw) / 2, y, size: tl.size, font: tl.font, color: rgb(0, 0, 0) });
    y -= tl.size + 6;
  }
  y -= 4;
  drawHR(page, margin, y, contentW);
  y -= 14;

  // ── Item 1 ──
  const item1 = `Dist: ${v(report.district)}   P.S.: ${v(report.policeStation)}   Year: ${v(report.year)}   F.I.R. No.: ${v(report.firNumber)}   Date: ${v(report.filingDate)}`;
  y = drawSectionHeading(page, fonts, "1.", margin, y, 10);
  y = drawWrappedBlock(page, regular, item1, margin + 18, y, contentW - 18, 9);
  y -= 6;
  drawHR(page, margin, y, contentW);
  y -= 14;

  // ── Item 2 — Acts ──
  y = drawSectionHeading(page, fonts, "2. Acts & Sections:", margin, y, 10);
  const acts = [
    { label: "(i)", act: report.act1, sec: report.sections1 },
    { label: "(ii)", act: report.act2, sec: report.sections2 },
    { label: "(iii)", act: report.act3, sec: report.sections3 },
  ];
  for (const a of acts) {
    if (a.act || a.sec) {
      const line = `${a.label}  Act: ${v(a.act)}  —  Sections: ${v(a.sec)}`;
      y = drawWrappedBlock(page, regular, line, margin + 18, y, contentW - 18, 9);
    }
  }
  if (report.otherActs) {
    y = drawWrappedBlock(page, regular, `(iv) Other Acts: ${report.otherActs}`, margin + 18, y, contentW - 18, 9);
  }
  y -= 6;
  drawHR(page, margin, y, contentW);
  y -= 14;

  // ── Item 3 — Occurrence ──
  ensureSpace(80);
  y = drawSectionHeading(page, fonts, "3. Occurrence of Offence:", margin, y, 10);
  y = drawWrappedBlock(page, regular, `(a) Day: ${v(report.occurrenceDay)}   Date: ${v(report.date_of_occurrence)}   Time: ${v(report.time_of_occurrence)}`, margin + 18, y, contentW - 18, 9);
  y = drawWrappedBlock(page, regular, `(b) Info received at P.S.: Date: ${v(report.filingDate)}   Time: ${v(report.filingTime)}`, margin + 18, y, contentW - 18, 9);
  y = drawWrappedBlock(page, regular, `(c) G.D. Entry No.: ${v(report.gdEntryNo)}   Time: ${v(report.filingTime)}`, margin + 18, y, contentW - 18, 9);
  y -= 6;
  drawHR(page, margin, y, contentW);
  y -= 14;

  // ── Item 4 ──
  y = drawSectionHeading(page, fonts, "4. Type of Information:", margin, y, 10);
  y = drawWrappedBlock(page, regular, v(report.infoType), margin + 18, y, contentW - 18, 9);
  y -= 6;
  drawHR(page, margin, y, contentW);
  y -= 14;

  // ── Item 5 — Place ──
  ensureSpace(70);
  y = drawSectionHeading(page, fonts, "5. Place of Occurrence:", margin, y, 10);
  y = drawWrappedBlock(page, regular, `(a) Direction & Distance from P.S.: ${v(report.distance_and_direction_from_ps)}   Beat No.: ${v(report.beatNo)}`, margin + 18, y, contentW - 18, 9);
  y = drawWrappedBlock(page, regular, `(b) Address: ${v(report.place_of_occurrence)}`, margin + 18, y, contentW - 18, 9);
  y -= 6;
  drawHR(page, margin, y, contentW);
  y -= 14;

  // ── Item 6 — Complainant ──
  ensureSpace(120);
  y = drawSectionHeading(page, fonts, "6. Complainant / Informant:", margin, y, 10);
  const complainantFields = [
    ["(a) Name:", report.complainantName],
    ["(b) Father's/Husband's Name:", report.fatherHusbandName],
    ["(c) Date/Year of Birth:", report.complainantDOB],
    ["(d) Nationality:", report.nationality],
    ["(e) Passport No.:", report.passportNo],
    ["    Date of Issue:", report.passportIssueDate],
    ["    Place of Issue:", report.passportIssuePlace],
    ["(f) Occupation:", report.occupation],
    ["(g) Address:", report.complainantAddress],
  ];
  for (const [label, val] of complainantFields) {
    ensureSpace(20);
    y = drawField(page, fonts, label, val, margin, y, { labelWidth: 170, maxWidth: contentW, indent: 18, fontSize: 9 });
    y -= 2;
  }
  y -= 4;
  drawHR(page, margin, y, contentW);
  y -= 14;

  // ── Item 7 — Accused ──
  ensureSpace(60);
  y = drawSectionHeading(page, fonts, "7. Details of Known/Suspected/Unknown Accused:", margin, y, 10);
  y = drawWrappedBlock(page, regular, v(report.accusedDetails), margin + 18, y, contentW - 18, 9);
  y -= 6;
  drawHR(page, margin, y, contentW);
  y -= 14;

  // ── Item 8 — Delay ──
  ensureSpace(40);
  y = drawSectionHeading(page, fonts, "8. Reasons for Delay in Reporting:", margin, y, 10);
  y = drawWrappedBlock(page, regular, v(report.delayReason), margin + 18, y, contentW - 18, 9);
  y -= 6;
  drawHR(page, margin, y, contentW);
  y -= 14;

  // ── Item 9 & 10 — Properties ──
  ensureSpace(60);
  y = drawSectionHeading(page, fonts, "9. Particulars of Properties Stolen/Involved:", margin, y, 10);
  y = drawWrappedBlock(page, regular, v(report.propertiesStolen), margin + 18, y, contentW - 18, 9);
  y -= 4;
  ensureSpace(20);
  y = drawField(page, fonts, "10. Total Value:", report.totalPropertyValue, margin, y, { labelWidth: 120, maxWidth: contentW, fontSize: 9 });
  y -= 6;
  drawHR(page, margin, y, contentW);
  y -= 14;

  // ── Item 11 ──
  ensureSpace(20);
  y = drawField(page, fonts, "11. Inquest Report / U.D. Case No.:", report.inquestReport, margin, y, { labelWidth: 220, maxWidth: contentW, fontSize: 9 });
  y -= 6;
  drawHR(page, margin, y, contentW);
  y -= 14;

  // ── Item 12 — FIR Contents ──
  ensureSpace(60);
  y = drawSectionHeading(page, fonts, "12. F.I.R. Contents:", margin, y, 10);
  const contentLines = wrapText(regular, v(report.firContents), 9, contentW - 18);
  for (const line of contentLines) {
    ensureSpace(16);
    page.drawText(line, { x: margin + 18, y, size: 9, font: regular, color: rgb(0, 0, 0) });
    y -= 12.5;
  }
  y -= 6;
  drawHR(page, margin, y, contentW);
  y -= 14;

  // ── Item 13 — Action Taken ──
  ensureSpace(100);
  y = drawSectionHeading(page, fonts, "13. Action Taken:", margin, y, 10);
  const actionText = "Since the above report reveals commission of offence(s) u/s as mentioned at Item No. 2, registered the case and took up the investigation. F.I.R. read over to the complainant / informant, admitted to be correctly recorded and copy given to the complainant / informant free of cost.";
  y = drawWrappedBlock(page, regular, actionText, margin + 18, y, contentW - 18, 8);
  y -= 16;

  // Signatures
  ensureSpace(80);
  page.drawText("Signature of Officer-in-Charge", { x: margin, y, size: 8, font: bold, color: rgb(0, 0, 0) });
  page.drawText("14. Signature / Thumb-impression of Complainant", { x: W / 2 + 10, y, size: 8, font: bold, color: rgb(0, 0, 0) });
  y -= 10;
  drawHR(page, margin, y, contentW / 2 - 20);
  drawHR(page, W / 2 + 10, y, contentW / 2 - 10);
  y -= 14;
  page.drawText("Name: ___________________________", { x: margin, y, size: 8, font: regular, color: rgb(0, 0, 0) });
  y -= 12;
  page.drawText("Rank: _______________ No. __________", { x: margin, y, size: 8, font: regular, color: rgb(0, 0, 0) });
  y -= 18;

  ensureSpace(20);
  page.drawText("15. Date & Time of Despatch to the Court: ____________________________", { x: margin, y, size: 8, font: regular, color: rgb(0, 0, 0) });

  return await pdfDoc.save();
}

/**
 * Generates the FIR PDF and triggers a file download.
 */
export async function downloadAsPDF(report) {
  const pdfBytes = await buildFIRPdf(report);
  triggerDownload(pdfBytes, "application/pdf", `FIR-${report.firNumber || "report"}.pdf`);
}

function triggerDownload(bytes, mime, filename) {
  const blob = new Blob([bytes], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

export async function printFIR(report) {
  const pdfBytes = await buildFIRPdf(report);
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  // Remove any previous print iframe
  const existing = document.getElementById("fir-print-iframe");
  if (existing) existing.remove();

  const iframe = document.createElement("iframe");
  iframe.id = "fir-print-iframe";
  iframe.style.position = "fixed";
  iframe.style.top = "-10000px";
  iframe.style.left = "-10000px";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  iframe.src = url;

  iframe.onload = () => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch {
      // Fallback: open in a new tab and let user print from there
      window.open(url, "_blank");
    }
  };

  document.body.appendChild(iframe);
}

export function downloadAsTxt(report) {
  console.log(report);
  
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
    `3. Occurrence: ${v(report.occurrenceDay)} ${v(report.date_of_occurrence)} ${v(report.time_of_occurrence)}`,
    `   Info received: ${v(report.filingDate)} ${v(report.filingTime)}`,
    `   G.D. Entry: ${v(report.gdEntryNo)}  Time: ${v(report.filingTime)}`,
    `4. Type: ${v(report.infoType)}`,
    D,
    `5. Place: ${v(report.place_of_occurrence)}  (${v(report.distance_and_direction_from_ps)})`,
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
<div class="row">3. Occurrence: ${v(report.occurrenceDay)} ${v(report.date_of_occurrence)} ${v(report.time_of_occurrence)}<br>Info received: ${v(report.infoReceivedDate)} ${v(report.infoReceivedTime)}<br>G.D.: ${v(report.gdEntryNo)} / ${v(report.gdEntryTime)}</div>
<div class="row">4. Type: ${v(report.infoType)}</div>
<div class="row">5. Place: ${v(report.place_of_occurrence)} (${v(report.distance_and_direction_from_ps)})</div>
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