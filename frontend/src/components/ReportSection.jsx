import { useEffect, useRef } from "react";
import gsap from "gsap";
import { FIR_SECTION_LABELS } from "../config/constants";
import { downloadAsTxt, downloadAsDocx, printFIR, downloadAsPDF } from "../services/reportGenerator";

const SECTIONS = [
  { title: "Complainant Details", icon: "👤", fields: ["complainantName", "complainantAddress", "complainantPhone"] },
  { title: "Incident Details", icon: "📍", fields: ["incidentDate", "incidentTime", "incidentLocation", "incidentDescription"] },
  { title: "Accused Information", icon: "🔍", fields: ["accusedDescription"] },
  { title: "Witnesses & Evidence", icon: "📎", fields: ["witnessDetails", "evidenceDetails"] },
];

const LONG_FIELDS = ["incidentDescription", "accusedDescription", "witnessDetails", "evidenceDetails"];

export default function ReportSection({ report }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!report || !ref.current) return;

    const ctx = gsap.context(() => {
      // Card entrance
      gsap.fromTo(ref.current, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" });

      // Stagger report sections
      gsap.from(".report-section-block", {
        y: 20, opacity: 0, stagger: 0.1, duration: 0.5, delay: 0.4, ease: "power2.out",
      });

      // Stagger action buttons
      gsap.from(".action-btn", {
        y: 10, opacity: 0, stagger: 0.08, duration: 0.35, delay: 0.8, ease: "power2.out",
      });
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
              <p className="report-empty-desc">Complete the conversation above to generate your report.</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="report" ref={ref} className="report-section">
      <div className="section-divider" />
      <div className="report-inner">
        <div className="section-header">
          <span className="badge-success">Report Ready</span>
          <h2 className="section-title">Your FIR Report</h2>
        </div>

        <div className="report-card">
          <div className="report-header">
            <div>
              <h3 className="report-header-title">First Information Report</h3>
              <p className="report-header-sub">Please review all details carefully</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="report-fir-number">{report.firNumber}</div>
              <p className="report-fir-date">{report.filingDate} • {report.filingTime}</p>
            </div>
          </div>

          {SECTIONS.map((section) => (
            <div key={section.title} className="report-section-block">
              <h4 className="report-section-title">
                <span className="report-section-title-icon">{section.icon}</span>
                {section.title}
              </h4>
              <div className="report-fields">
                {section.fields.map((field) => {
                  const isLong = LONG_FIELDS.includes(field);
                  return (
                    <div key={field} className={isLong ? "report-field-full" : ""}>
                      <label className="report-field-label">{FIR_SECTION_LABELS[field]}</label>
                      {isLong ? (
                        <div className="report-field-value-long">{report[field] || "N/A"}</div>
                      ) : (
                        <p className="report-field-value">{report[field] || "N/A"}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="report-actions no-print">
          <button className="action-btn primary" onClick={() => downloadAsPDF(report)}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            PDF
          </button>
          <button className="action-btn secondary" onClick={() => printFIR(report)}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
            </svg>
            Print
          </button>
          <button className="action-btn secondary" onClick={() => downloadAsTxt(report)}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            TXT
          </button>
          <button className="action-btn secondary" onClick={() => downloadAsDocx(report)}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            DOCX
          </button>
        </div>
      </div>
    </section>
  );
}
