import { FIR_SECTION_LABELS } from "../config/constants";

export function generateFIRText(report) {
  const divider = "═".repeat(60);
  const thinDivider = "─".repeat(60);

  let text = `\n${divider}\n`;
  text += `         FIRST INFORMATION REPORT (FIR)\n`;
  text += `${divider}\n\n`;
  text += `FIR Number    : ${report.firNumber}\n`;
  text += `Filing Date   : ${report.filingDate}\n`;
  text += `Filing Time   : ${report.filingTime}\n\n`;
  text += `${thinDivider}\n`;
  text += `  COMPLAINANT DETAILS\n`;
  text += `${thinDivider}\n\n`;
  text += `Name          : ${report.complainantName || "N/A"}\n`;
  text += `Address       : ${report.complainantAddress || "N/A"}\n`;
  text += `Phone         : ${report.complainantPhone || "N/A"}\n\n`;
  text += `${thinDivider}\n`;
  text += `  INCIDENT DETAILS\n`;
  text += `${thinDivider}\n\n`;
  text += `Date          : ${report.incidentDate || "N/A"}\n`;
  text += `Time          : ${report.incidentTime || "N/A"}\n`;
  text += `Location      : ${report.incidentLocation || "N/A"}\n\n`;
  text += `Description:\n${report.incidentDescription || "N/A"}\n\n`;
  text += `${thinDivider}\n`;
  text += `  ACCUSED INFORMATION\n`;
  text += `${thinDivider}\n\n`;
  text += `${report.accusedDescription || "N/A"}\n\n`;
  text += `${thinDivider}\n`;
  text += `  WITNESSES\n`;
  text += `${thinDivider}\n\n`;
  text += `${report.witnessDetails || "None"}\n\n`;
  text += `${thinDivider}\n`;
  text += `  EVIDENCE\n`;
  text += `${thinDivider}\n\n`;
  text += `${report.evidenceDetails || "None"}\n\n`;
  text += `${divider}\n`;
  text += `This FIR was generated using File It Responsibly (FIR)\n`;
  text += `${divider}\n`;

  return text;
}

export function downloadAsTxt(report) {
  const text = generateFIRText(report);
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `FIR_${report.firNumber}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


export function downloadAsDocx(report) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>FIR - ${report.firNumber}</title>
  <style>
    body { font-family: 'Times New Roman', serif; max-width: 800px; margin: 40px auto; padding: 20px; color: #1a1a1a; line-height: 1.6; }
    h1 { text-align: center; border-bottom: 3px double #333; padding-bottom: 10px; font-size: 24px; }
    h2 { color: #2563eb; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-top: 30px; font-size: 18px; }
    .meta { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .meta p { margin: 5px 0; }
    .label { font-weight: bold; display: inline-block; min-width: 180px; }
    .description { white-space: pre-wrap; background: #fafafa; padding: 15px; border-left: 3px solid #2563eb; margin: 10px 0; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #333; color: #666; font-size: 12px; }
    .signature { margin-top: 60px; display: flex; justify-content: space-between; }
    .signature div { text-align: center; width: 200px; }
    .signature .line { border-top: 1px solid #333; padding-top: 5px; margin-top: 40px; }
  </style>
</head>
<body>
  <h1>FIRST INFORMATION REPORT</h1>
  
  <div class="meta">
    <p><span class="label">FIR Number:</span> ${report.firNumber}</p>
    <p><span class="label">Filing Date:</span> ${report.filingDate}</p>
    <p><span class="label">Filing Time:</span> ${report.filingTime}</p>
  </div>
  
  <h2>Complainant Details</h2>
  <p><span class="label">Name:</span> ${report.complainantName || "N/A"}</p>
  <p><span class="label">Address:</span> ${report.complainantAddress || "N/A"}</p>
  <p><span class="label">Phone:</span> ${report.complainantPhone || "N/A"}</p>
  
  <h2>Incident Details</h2>
  <p><span class="label">Date of Incident:</span> ${report.incidentDate || "N/A"}</p>
  <p><span class="label">Time of Incident:</span> ${report.incidentTime || "N/A"}</p>
  <p><span class="label">Location:</span> ${report.incidentLocation || "N/A"}</p>
  <p><span class="label">Description:</span></p>
  <div class="description">${report.incidentDescription || "N/A"}</div>
  
  <h2>Accused Information</h2>
  <div class="description">${report.accusedDescription || "N/A"}</div>
  
  <h2>Witnesses</h2>
  <div class="description">${report.witnessDetails || "None"}</div>
  
  <h2>Evidence</h2>
  <div class="description">${report.evidenceDetails || "None"}</div>
  
  <div class="signature">
    <div>
      <div class="line">Complainant Signature</div>
    </div>
    <div>
      <div class="line">Officer Signature & Seal</div>
    </div>
  </div>
  
  <div class="footer">
    <p>This FIR was generated using File It Responsibly (FIR)</p>
    <p>Generated on: ${report.filingDate} at ${report.filingTime}</p>
  </div>
</body>
</html>`;

  const blob = new Blob([html], {
    type: "application/vnd.ms-word;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `FIR_${report.firNumber}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Print the FIR report
 */
export function printFIR(report) {
  const printWindow = window.open("", "_blank");
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>FIR - ${report.firNumber}</title>
  <style>
    body { font-family: 'Times New Roman', serif; max-width: 800px; margin: 40px auto; padding: 20px; color: #000; line-height: 1.6; }
    h1 { text-align: center; border-bottom: 3px double #333; padding-bottom: 10px; }
    h2 { border-bottom: 1px solid #999; padding-bottom: 5px; margin-top: 25px; }
    .meta { background: #f5f5f5; padding: 15px; margin: 15px 0; }
    .label { font-weight: bold; display: inline-block; min-width: 180px; }
    .description { white-space: pre-wrap; padding: 10px; border-left: 3px solid #333; margin: 10px 0; }
    .footer { text-align: center; margin-top: 40px; padding-top: 15px; border-top: 2px solid #333; font-size: 11px; color: #666; }
    .signature { margin-top: 60px; display: flex; justify-content: space-between; }
    .signature div { text-align: center; width: 200px; }
    .signature .line { border-top: 1px solid #333; padding-top: 5px; margin-top: 40px; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <h1>FIRST INFORMATION REPORT</h1>
  <div class="meta">
    <p><span class="label">FIR Number:</span> ${report.firNumber}</p>
    <p><span class="label">Filing Date:</span> ${report.filingDate}</p>
    <p><span class="label">Filing Time:</span> ${report.filingTime}</p>
  </div>
  <h2>Complainant Details</h2>
  <p><span class="label">Name:</span> ${report.complainantName || "N/A"}</p>
  <p><span class="label">Address:</span> ${report.complainantAddress || "N/A"}</p>
  <p><span class="label">Phone:</span> ${report.complainantPhone || "N/A"}</p>
  <h2>Incident Details</h2>
  <p><span class="label">Date:</span> ${report.incidentDate || "N/A"}</p>
  <p><span class="label">Time:</span> ${report.incidentTime || "N/A"}</p>
  <p><span class="label">Location:</span> ${report.incidentLocation || "N/A"}</p>
  <p><span class="label">Description:</span></p>
  <div class="description">${report.incidentDescription || "N/A"}</div>
  <h2>Accused Information</h2>
  <div class="description">${report.accusedDescription || "N/A"}</div>
  <h2>Witnesses</h2>
  <div class="description">${report.witnessDetails || "None"}</div>
  <h2>Evidence</h2>
  <div class="description">${report.evidenceDetails || "None"}</div>
  <div class="signature">
    <div><div class="line">Complainant Signature</div></div>
    <div><div class="line">Officer Signature & Seal</div></div>
  </div>
  <div class="footer">
    <p>Generated using File It Responsibly (FIR) on ${report.filingDate} at ${report.filingTime}</p>
  </div>
</body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.print();
  };
}


export function downloadAsPDF(report) {
  // We use the same print mechanism — user selects "Save as PDF" from print dialog
  printFIR(report);
}
