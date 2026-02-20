// src/services/reportGenerator.js
// Generates IF1-formatted exports: TXT, DOCX, PDF (print), and direct print

/* ── Shared formatter ── */
function buildIF1Text(r) {
  const line = (label, val) => `${label.padEnd(42, ".")}: ${val || "—"}`;
  const divider = "─".repeat(70);
  const blankLine = "";

  return [
    "FORM – IF1 (Integrated Form)",
    "FIRST INFORMATION REPORT",
    "(Under Section 154 Cr.P.C)",
    divider,
    blankLine,

    `1.  Dist: ${r.district || "—"}    P.S: ${r.policeStation || "—"}    Year: ${r.year || "—"}    F.I.R. No: ${r.firNumber || "—"}    Date: ${r.filingDate || "—"}`,
    blankLine,

    "2.  Acts & Sections:",
    `    (i)   Act: ${r.act1 || "—"}    Sections: ${r.sections1 || "—"}`,
    `    (ii)  Act: ${r.act2 || "—"}    Sections: ${r.sections2 || "—"}`,
    `    (iii) Act: ${r.act3 || "—"}    Sections: ${r.sections3 || "—"}`,
    `    (iv)  Other Acts & Sections: ${r.otherActs || "—"}`,
    blankLine,

    "3.  Occurrence of Offence:",
    `    (a) Day: ${r.occurrenceDay || "—"}    Date: ${r.occurrenceDate || "—"}    Time: ${r.occurrenceTime || "—"}`,
    `    (b) Information received at P.S. — Date: ${r.infoReceivedDate || "—"}    Time: ${r.infoReceivedTime || "—"}`,
    `    (c) General Diary Reference — Entry No: ${r.gdEntryNo || "—"}    Time: ${r.gdEntryTime || "—"}`,
    blankLine,

    `4.  Type of Information: ${r.infoType || "Oral"}`,
    blankLine,

    "5.  Place of Occurrence:",
    `    (a) Direction & Distance from P.S.: ${r.directionDistance || "—"}    Beat No.: ${r.beatNo || "—"}`,
    `    (b) Address: ${r.placeAddress || "—"}`,
    `    (c) Outside P.S. (if applicable): ${r.outsidePS || "—"}    District: ${r.outsideDistrict || "—"}`,
    blankLine,

    "6.  Complainant / Informant:",
    `    (a) Name: ${r.complainantName || "—"}`,
    `    (b) Father's / Husband's Name: ${r.fatherHusbandName || "—"}`,
    `    (c) Date / Year of Birth: ${r.complainantDOB || "—"}`,
    `    (d) Nationality: ${r.nationality || "—"}`,
    `    (e) Passport No: ${r.passportNo || "—"}    Date of Issue: ${r.passportIssueDate || "—"}    Place of Issue: ${r.passportIssuePlace || "—"}`,
    `    (f) Occupation: ${r.occupation || "—"}`,
    `    (g) Address: ${r.complainantAddress || "—"}`,
    `        Phone: ${r.complainantPhone || "—"}`,
    blankLine,

    "7.  Details of Known / Suspected / Unknown Accused:",
    r.accusedDetails || "—",
    blankLine,

    "8.  Reasons for Delay in Reporting:",
    r.delayReason || "No delay",
    blankLine,

    "9.  Particulars of Properties Stolen / Involved:",
    r.propertiesStolen || "—",
    blankLine,

    `10. Total Value of Properties Stolen / Involved: ${r.totalPropertyValue || "—"}`,
    blankLine,

    `11. Inquest Report / U.D. Case No., if any: ${r.inquestReport || "—"}`,
    blankLine,

    "12. F.I.R. Contents:",
    r.firContents || "—",
    blankLine,

    divider,
    "13. Action Taken:",
    "    Since the above report reveals commission of offence(s) u/s as mentioned at Item No. 2.,",
    "    registered the case and took up the investigation. F.I.R. read over to the complainant /",
    "    informant, admitted to be correctly recorded and copy given free of cost.",
    blankLine,
    "    Signature of Officer-in-Charge:  ___________________________",
    "    Name: ___________________________    Rank: ___________    No. ___________",
    blankLine,
    "14. Signature / Thumb-impression of Complainant: ___________________________",
    blankLine,
    "15. Date & Time of Despatch to the Court: ___________________________",
    divider,
  ].join("\n");
}

/* ── Download as TXT ── */
export function downloadAsTxt(report) {
  const content = buildIF1Text(report);
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `FIR-${report.firNumber || "report"}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Download as DOCX (HTML-based .doc, works in Word) ── */
export function downloadAsDocx(report) {
  const htmlContent = `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>FIR ${report.firNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 11pt; margin: 2cm; color: #000; }
    h1 { font-size: 14pt; text-align: center; margin-bottom: 2px; }
    h2 { font-size: 11pt; text-align: center; font-weight: normal; margin-bottom: 2px; }
    .divider { border-top: 1px solid #000; margin: 8px 0; }
    .item { margin: 8px 0; }
    .item-no { font-weight: bold; }
    .label { color: #555; font-size: 10pt; }
    .value { border-bottom: 1px solid #555; display: inline-block; min-width: 100px; }
    .narrative { border: 1px solid #ccc; padding: 6px; background: #fafafa; margin-top: 4px; }
    .sig-row { display: flex; justify-content: space-between; margin-top: 20px; }
    .sig-block { width: 45%; }
    .sig-line { border-bottom: 1px solid #000; height: 40px; margin: 6px 0; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 3px 6px; font-size: 10.5pt; }
  </style>
</head>
<body>
  <p style="text-align:center; font-size:9pt;">FORM – IF1 (Integrated Form)</p>
  <h1>FIRST INFORMATION REPORT</h1>
  <h2>(Under Section 154 Cr.P.C)</h2>
  <div class="divider"></div>

  <div class="item">
    <span class="item-no">1.</span>
    <table><tr>
      <td><span class="label">Dist.</span> <span class="value">${report.district || "—"}</span></td>
      <td><span class="label">P.S.</span> <span class="value">${report.policeStation || "—"}</span></td>
      <td><span class="label">Year</span> <span class="value">${report.year || "—"}</span></td>
      <td><span class="label">F.I.R. No.</span> <strong class="value">${report.firNumber || "—"}</strong></td>
      <td><span class="label">Date</span> <span class="value">${report.filingDate || "—"}</span></td>
    </tr></table>
  </div>

  <div class="item">
    <span class="item-no">2.</span> Acts &amp; Sections:<br>
    &nbsp;&nbsp;(i) Act: <span class="value">${report.act1 || "—"}</span>&nbsp; Sections: <span class="value">${report.sections1 || "—"}</span><br>
    &nbsp;&nbsp;(ii) Act: <span class="value">${report.act2 || "—"}</span>&nbsp; Sections: <span class="value">${report.sections2 || "—"}</span><br>
    &nbsp;&nbsp;(iii) Act: <span class="value">${report.act3 || "—"}</span>&nbsp; Sections: <span class="value">${report.sections3 || "—"}</span><br>
    &nbsp;&nbsp;(iv) Other Acts &amp; Sections: <span class="value">${report.otherActs || "—"}</span>
  </div>

  <div class="item">
    <span class="item-no">3.</span> Occurrence of Offence:<br>
    &nbsp;&nbsp;(a) Day: <span class="value">${report.occurrenceDay || "—"}</span>&nbsp;
        Date: <span class="value">${report.occurrenceDate || "—"}</span>&nbsp;
        Time: <span class="value">${report.occurrenceTime || "—"}</span><br>
    &nbsp;&nbsp;(b) Information received at P.S. — Date: <span class="value">${report.infoReceivedDate || "—"}</span>&nbsp;
        Time: <span class="value">${report.infoReceivedTime || "—"}</span><br>
    &nbsp;&nbsp;(c) General Diary — Entry No: <span class="value">${report.gdEntryNo || "—"}</span>&nbsp;
        Time: <span class="value">${report.gdEntryTime || "—"}</span>
  </div>

  <div class="item">
    <span class="item-no">4.</span> Type of Information: <span class="value">${report.infoType || "Oral"}</span>
  </div>

  <div class="item">
    <span class="item-no">5.</span> Place of Occurrence:<br>
    &nbsp;&nbsp;(a) Direction &amp; Distance from P.S.: <span class="value">${report.directionDistance || "—"}</span>&nbsp;
        Beat No.: <span class="value">${report.beatNo || "—"}</span><br>
    &nbsp;&nbsp;(b) Address: <span class="value" style="min-width:300px">${report.placeAddress || "—"}</span>
  </div>

  <div class="item">
    <span class="item-no">6.</span> Complainant / Informant:<br>
    &nbsp;&nbsp;(a) Name: <span class="value">${report.complainantName || "—"}</span><br>
    &nbsp;&nbsp;(b) Father's / Husband's Name: <span class="value">${report.fatherHusbandName || "—"}</span><br>
    &nbsp;&nbsp;(c) Date / Year of Birth: <span class="value">${report.complainantDOB || "—"}</span>&nbsp;
        (d) Nationality: <span class="value">${report.nationality || "—"}</span><br>
    &nbsp;&nbsp;(e) Passport No: <span class="value">${report.passportNo || "—"}</span>&nbsp;
        Date of Issue: <span class="value">${report.passportIssueDate || "—"}</span>&nbsp;
        Place of Issue: <span class="value">${report.passportIssuePlace || "—"}</span><br>
    &nbsp;&nbsp;(f) Occupation: <span class="value">${report.occupation || "—"}</span>&nbsp;
        Phone: <span class="value">${report.complainantPhone || "—"}</span><br>
    &nbsp;&nbsp;(g) Address: <span class="value" style="min-width:300px">${report.complainantAddress || "—"}</span>
  </div>

  <div class="item">
    <span class="item-no">7.</span> Details of Known / Suspected / Unknown Accused:
    <div class="narrative">${report.accusedDetails || "—"}</div>
  </div>

  <div class="item">
    <span class="item-no">8.</span> Reasons for Delay in Reporting:
    <div class="narrative">${report.delayReason || "No delay"}</div>
  </div>

  <div class="item">
    <span class="item-no">9.</span> Particulars of Properties Stolen / Involved:
    <div class="narrative">${report.propertiesStolen || "—"}</div>
  </div>

  <div class="item">
    <span class="item-no">10.</span> Total Value of Properties Stolen / Involved: <span class="value">${report.totalPropertyValue || "—"}</span>
  </div>

  <div class="item">
    <span class="item-no">11.</span> Inquest Report / U.D. Case No., if any: <span class="value">${report.inquestReport || "—"}</span>
  </div>

  <div class="item">
    <span class="item-no">12.</span> F.I.R. Contents:
    <div class="narrative" style="min-height:80px">${report.firContents || "—"}</div>
  </div>

  <div class="divider"></div>

  <div class="item">
    <span class="item-no">13.</span> Action Taken:<br>
    <small>Since the above report reveals commission of offence(s) u/s as mentioned at Item No. 2., 
    registered the case and took up the investigation. F.I.R. read over to the complainant / informant, 
    admitted to be correctly recorded and copy given to the complainant / informant free of cost.</small>

    <div class="sig-row">
      <div class="sig-block">
        <p><strong>Signature of Officer-in-Charge, Police Station</strong></p>
        <div class="sig-line"></div>
        <p>Name: ___________________________</p>
        <p>Rank: _____________ No. __________</p>
      </div>
      <div class="sig-block">
        <p><strong>14. Signature / Thumb-impression of Complainant / Informant</strong></p>
        <div class="sig-line"></div>
      </div>
    </div>
    <p>15. Date &amp; Time of Despatch to the Court: ___________________________</p>
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `FIR-${report.firNumber || "report"}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Print ── */
export function printFIR() {
  window.print();
}

/* ── Download as PDF (uses print dialog) ── */
export function downloadAsPDF() {
  window.print();
}
