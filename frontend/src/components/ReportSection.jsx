// src/components/ReportSection.jsx
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { FIR_SECTION_LABELS } from "../config/constants";
import { downloadAsTxt, downloadAsDocx, printFIR, downloadAsPDF } from "../services/reportGenerator";

export default function ReportSection({ report }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!report || !ref.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(ref.current, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", clearProps: "all" });
      gsap.fromTo(".if1-item", { y: 20, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.06, duration: 0.45, delay: 0.35, ease: "power2.out", clearProps: "all" });
      gsap.fromTo(".action-btn", { y: 10, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.08, duration: 0.35, delay: 0.9, ease: "power2.out", clearProps: "all" });
    }, ref);
    return () => ctx.revert();
  }, [report]);

  if (!report) {
    return (
      <section id="report" className="report-section">
        <div className="section-divider" />
        <div className="report-inner">
          <div className="glass-card">
            <div className="report-empty">
              <div className="report-empty-icon">📋</div>
              <h3 className="report-empty-title">Your FIR Report Will Appear Here</h3>
              <p className="report-empty-desc">Describe the incident above to generate your official report.</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const L = FIR_SECTION_LABELS;
  const r = report;

  return (
    <section id="report" ref={ref} className="report-section">
      <div className="section-divider" />
      <div className="report-inner">
        <div className="section-header">
          <span className="badge-success">Report Ready</span>
          <h2 className="section-title">Your FIR Report</h2>
        </div>

        {/* ── Official IF1 Form Card ── */}
        <div className="if1-card" id="if1-printable">

          {/* Form Title */}
          <div className="if1-title-block">
            <p className="if1-form-label">FORM – IF1 (Integrated Form)</p>
            <h2 className="if1-main-title">FIRST INFORMATION REPORT</h2>
            <p className="if1-subtitle">(Under Section 154 Cr.P.C)</p>
          </div>

          {/* Item 1 */}
          <div className="if1-item if1-row-inline">
            <span className="if1-item-no">1.</span>
            <div className="if1-inline-fields">
              <Field label="Dist." value={r.district} inline />
              <Field label="P.S." value={r.policeStation} inline />
              <Field label="Year" value={r.year} inline />
              <Field label="F.I.R. No." value={r.firNumber} inline highlight />
              <Field label="Date" value={r.filingDate} inline />
            </div>
          </div>

          {/* Item 2 — Acts */}
          <div className="if1-item">
            <span className="if1-item-no">2.</span>
            <div className="if1-acts-grid">
              <div className="if1-act-row">
                <span className="if1-act-label">(i) Act</span>
                <span className="if1-act-value">{r.act1 || "—"}</span>
                <span className="if1-act-label">Sections</span>
                <span className="if1-act-value">{r.sections1 || "—"}</span>
              </div>
              <div className="if1-act-row">
                <span className="if1-act-label">(ii) Act</span>
                <span className="if1-act-value">{r.act2 || "—"}</span>
                <span className="if1-act-label">Sections</span>
                <span className="if1-act-value">{r.sections2 || "—"}</span>
              </div>
              <div className="if1-act-row">
                <span className="if1-act-label">(iii) Act</span>
                <span className="if1-act-value">{r.act3 || "—"}</span>
                <span className="if1-act-label">Sections</span>
                <span className="if1-act-value">{r.sections3 || "—"}</span>
              </div>
              <div className="if1-act-row">
                <span className="if1-act-label">(iv) Other Acts &amp; Sections</span>
                <span className="if1-act-value" style={{ gridColumn: "2 / -1" }}>{r.otherActs || "—"}</span>
              </div>
            </div>
          </div>

          {/* Item 3 — Occurrence */}
          <div className="if1-item">
            <span className="if1-item-no">3.</span>
            <div className="if1-block">
              <div className="if1-sub-row">
                <span className="if1-sub-label">(a) Occurrence of Offence:</span>
                <span className="if1-sub-label">Day</span><span className="if1-sub-val">{r.occurrenceDay || "—"}</span>
                <span className="if1-sub-label">Date</span><span className="if1-sub-val">{r.occurrenceDate || "—"}</span>
                <span className="if1-sub-label">Time</span><span className="if1-sub-val">{r.occurrenceTime || "—"}</span>
              </div>
              <div className="if1-sub-row">
                <span className="if1-sub-label">(b) Information received at P.S.:</span>
                <span className="if1-sub-label">Date</span><span className="if1-sub-val">{r.infoReceivedDate || "—"}</span>
                <span className="if1-sub-label">Time</span><span className="if1-sub-val">{r.infoReceivedTime || "—"}</span>
              </div>
              <div className="if1-sub-row">
                <span className="if1-sub-label">(c) General Diary Reference:</span>
                <span className="if1-sub-label">Entry No.</span><span className="if1-sub-val">{r.gdEntryNo || "—"}</span>
                <span className="if1-sub-label">Time</span><span className="if1-sub-val">{r.gdEntryTime || "—"}</span>
              </div>
            </div>
          </div>

          {/* Item 4 */}
          <div className="if1-item if1-inline-simple">
            <span className="if1-item-no">4.</span>
            <span className="if1-label-plain">Type of Information:</span>
            <span className="if1-val-plain">{r.infoType || "Oral"}</span>
          </div>

          {/* Item 5 — Place */}
          <div className="if1-item">
            <span className="if1-item-no">5.</span>
            <div className="if1-block">
              <p className="if1-section-heading">Place of Occurrence:</p>
              <div className="if1-sub-row">
                <span className="if1-sub-label">(a) Direction &amp; Distance from P.S.</span>
                <span className="if1-sub-val">{r.directionDistance || "—"}</span>
                <span className="if1-sub-label">Beat No.</span>
                <span className="if1-sub-val">{r.beatNo || "—"}</span>
              </div>
              <div className="if1-sub-row-full">
                <span className="if1-sub-label">(b) Address</span>
                <span className="if1-sub-val-long">{r.placeAddress || "—"}</span>
              </div>
              {(r.outsidePS || r.outsideDistrict) && (
                <div className="if1-sub-row">
                  <span className="if1-sub-label">(c) Outside P.S. Name</span>
                  <span className="if1-sub-val">{r.outsidePS || "—"}</span>
                  <span className="if1-sub-label">District</span>
                  <span className="if1-sub-val">{r.outsideDistrict || "—"}</span>
                </div>
              )}
            </div>
          </div>

          {/* Item 6 — Complainant */}
          <div className="if1-item">
            <span className="if1-item-no">6.</span>
            <div className="if1-block">
              <p className="if1-section-heading">Complainant / Informant:</p>
              <div className="if1-two-col">
                <FieldBlock label="(a) Name" value={r.complainantName} />
                <FieldBlock label="(b) Father's / Husband's Name" value={r.fatherHusbandName} />
                <FieldBlock label="(c) Date / Year of Birth" value={r.complainantDOB} />
                <FieldBlock label="(d) Nationality" value={r.nationality} />
                <FieldBlock label="(e) Passport No." value={r.passportNo} />
                <FieldBlock label="Date of Issue" value={r.passportIssueDate} />
                <FieldBlock label="Place of Issue" value={r.passportIssuePlace} />
                <FieldBlock label="(f) Occupation" value={r.occupation} />
                <FieldBlock label="Phone" value={r.complainantPhone} />
              </div>
              <div className="if1-sub-row-full">
                <span className="if1-sub-label">(g) Address</span>
                <span className="if1-sub-val-long">{r.complainantAddress || "—"}</span>
              </div>
            </div>
          </div>

          {/* Item 7 — Accused */}
          <div className="if1-item">
            <span className="if1-item-no">7.</span>
            <div className="if1-block">
              <p className="if1-section-heading">Details of Known / Suspected / Unknown Accused:</p>
              <div className="if1-narrative">{r.accusedDetails || "—"}</div>
            </div>
          </div>

          {/* Item 8 — Delay */}
          <div className="if1-item">
            <span className="if1-item-no">8.</span>
            <div className="if1-block">
              <p className="if1-section-heading">Reasons for Delay in Reporting:</p>
              <div className="if1-narrative">{r.delayReason || "No delay"}</div>
            </div>
          </div>

          {/* Item 9 & 10 — Properties */}
          <div className="if1-item">
            <span className="if1-item-no">9.</span>
            <div className="if1-block">
              <p className="if1-section-heading">Particulars of Properties Stolen / Involved:</p>
              <div className="if1-narrative">{r.propertiesStolen || "—"}</div>
            </div>
          </div>
          <div className="if1-item if1-inline-simple">
            <span className="if1-item-no">10.</span>
            <span className="if1-label-plain">Total Value of Properties Stolen / Involved:</span>
            <span className="if1-val-plain">{r.totalPropertyValue || "—"}</span>
          </div>

          {/* Item 11 */}
          <div className="if1-item if1-inline-simple">
            <span className="if1-item-no">11.</span>
            <span className="if1-label-plain">Inquest Report / U.D. Case No., if any:</span>
            <span className="if1-val-plain">{r.inquestReport || "—"}</span>
          </div>

          {/* Item 12 — FIR Contents */}
          <div className="if1-item">
            <span className="if1-item-no">12.</span>
            <div className="if1-block">
              <p className="if1-section-heading">F.I.R. Contents:</p>
              <div className="if1-narrative if1-narrative-large">{r.firContents || "—"}</div>
            </div>
          </div>

          {/* Item 13 — Action Taken */}
          <div className="if1-item">
            <span className="if1-item-no">13.</span>
            <div className="if1-block">
              <p className="if1-section-heading">Action Taken:</p>
              <p className="if1-legal-text">
                Since the above report reveals commission of offence(s) u/s as mentioned at Item No. 2.,
                registered the case and took up the investigation. F.I.R. read over to the complainant /
                informant, admitted to be correctly recorded and copy given to the complainant / informant free of cost.
              </p>
              <div className="if1-signature-row">
                <div className="if1-sig-block">
                  <p className="if1-sig-label">Signature of Officer-in-Charge</p>
                  <div className="if1-sig-line" />
                  <p className="if1-sig-sub">Name: ___________________________</p>
                  <p className="if1-sig-sub">Rank: _______________ No. __________</p>
                </div>
                <div className="if1-sig-block">
                  <p className="if1-sig-label">14. Signature / Thumb-impression of Complainant</p>
                  <div className="if1-sig-line" />
                </div>
              </div>
              <p className="if1-sig-sub" style={{ marginTop: "12px" }}>
                15. Date &amp; Time of Despatch to the Court: ____________________________
              </p>
            </div>
          </div>

        </div>{/* /if1-card */}

        {/* Action buttons */}
        <div className="report-actions no-print">
          <button className="action-btn primary" onClick={() => downloadAsPDF(report)}>
            <DownloadIcon /> PDF
          </button>
          <button className="action-btn secondary" onClick={() => printFIR(report)}>
            <PrintIcon /> Print
          </button>
          <button className="action-btn secondary" onClick={() => downloadAsTxt(report)}>
            <TxtIcon /> TXT
          </button>
          <button className="action-btn secondary" onClick={() => downloadAsDocx(report)}>
            <DocxIcon /> DOCX
          </button>
        </div>
      </div>
    </section>
  );
}

/* ── Helper sub-components ── */
function Field({ label, value, inline, highlight }) {
  return (
    <span className={`if1-field ${inline ? "if1-field-inline" : ""} ${highlight ? "if1-field-highlight" : ""}`}>
      <span className="if1-field-label">{label}</span>
      <span className="if1-field-value">{value || "—"}</span>
    </span>
  );
}

function FieldBlock({ label, value }) {
  return (
    <div className="if1-field-block">
      <span className="if1-field-label">{label}</span>
      <span className="if1-field-value">{value || "—"}</span>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}
function PrintIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
    </svg>
  );
}
function TxtIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}
function DocxIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}
