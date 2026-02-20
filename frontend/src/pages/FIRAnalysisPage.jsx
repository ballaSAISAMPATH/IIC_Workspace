import { useState, useRef } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const API_BASE = "http://localhost:8000/api/v1/fir";

// ── Tiny helpers ──────────────────────────────────────────────────────────────
const fmt = (n) => n?.toLocaleString("en-IN") ?? "—";
const clamp = (v) => Math.max(0, Math.min(100, v));

const OUTCOME_COLOR = {
  "Convicted": "#22c55e",
  "Acquitted": "#ef4444",
  "Settled": "#f59e0b",
  "Compounded": "#f59e0b",
  "Partially Convicted": "#fb923c",
};

export default function FIRAnalysisPage() {
  const [file, setFile]           = useState(null);
  const [dragging, setDragging]   = useState(false);
  const [stage, setStage]         = useState("idle"); // idle | uploading | done | error
  const [report, setReport]       = useState(null);
  const [errorMsg, setErrorMsg]   = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const inputRef = useRef();

  // ── File handling ──────────────────────────────────────────────────────────
  const pickFile = (f) => {
    if (!f) return;
    if (f.type !== "application/pdf") {
      setErrorMsg("Only PDF files are accepted.");
      setStage("error");
      return;
    }
    setFile(f);
    setStage("idle");
    setErrorMsg("");
    setReport(null);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    pickFile(e.dataTransfer.files[0]);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const analyse = async () => {
    if (!file) return;
    setStage("uploading");
    setErrorMsg("");
    try {
      const form = new FormData();
      form.append("file", file);
      const { data } = await axios.post(`${API_BASE}/analyse-pdf`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setReport(data);
      setStage("done");
      setActiveTab("overview");
    } catch (err) {
      setErrorMsg(
        err.response?.data?.detail || "Something went wrong. Check your server."
      );
      setStage("error");
    }
  };

  const reset = () => {
    setFile(null);
    setStage("idle");
    setReport(null);
    setErrorMsg("");
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const ef  = report?.extracted_fields ?? {};
  const la  = report?.legal_analysis   ?? {};
  const mp  = report?.masked_payload   ?? {};
  const pct = clamp(la.win_probability_percent ?? 0);
  const dur = la.estimated_duration_months ?? {};
  const cost = la.cost_estimate_inr ?? {};

  const ACTION_STYLE = {
    "Proceed to Trial":       { bg: "#052e16", border: "#16a34a", text: "#4ade80" },
    "Negotiate Settlement":   { bg: "#1c1917", border: "#d97706", text: "#fbbf24" },
    "Mediation / Lok Adalat": { bg: "#172554", border: "#3b82f6", text: "#93c5fd" },
    "Drop the Case":          { bg: "#2d0a0a", border: "#dc2626", text: "#f87171" },
  };
  const actionStyle = ACTION_STYLE[la.recommended_action] ?? { bg:"#1a1a2e", border:"#6366f1", text:"#a5b4fc" };

  const TABS = ["overview","evidence","precedents","steps"];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');

        .fa-page { background:#080810; min-height:100vh; color:#e2e0f0; font-family:'Syne',sans-serif; }

        /* ── hero strip ── */
        .fa-hero {
          padding: 120px 24px 60px;
          max-width: 860px;
          margin: 0 auto;
          text-align: center;
        }
        .fa-hero-eyebrow {
          display:inline-flex; align-items:center; gap:8px;
          background:rgba(99,102,241,.15); border:1px solid rgba(99,102,241,.3);
          border-radius:99px; padding:5px 14px;
          font-family:'JetBrains Mono',monospace; font-size:11px;
          color:#818cf8; letter-spacing:.08em; text-transform:uppercase;
          margin-bottom:24px;
        }
        .fa-hero h1 {
          font-size:clamp(2rem,6vw,3.6rem); font-weight:800; line-height:1.08;
          margin:0 0 20px;
          background:linear-gradient(135deg,#e2e0f0 30%,#818cf8);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent;
        }
        .fa-hero p { font-size:1.05rem; color:#9490b0; max-width:520px; margin:0 auto; line-height:1.7; }

        /* ── upload card ── */
        .fa-upload-wrap { max-width:700px; margin:0 auto 40px; padding:0 24px; }
        .fa-drop {
          border:2px dashed rgba(99,102,241,.35);
          border-radius:20px;
          padding:48px 32px;
          text-align:center;
          cursor:pointer;
          transition:all .2s;
          background:rgba(99,102,241,.04);
          position:relative;
        }
        .fa-drop.drag  { border-color:#6366f1; background:rgba(99,102,241,.12); }
        .fa-drop.ready { border-color:#4ade80; border-style:solid; background:rgba(74,222,128,.05); }
        .fa-drop-icon {
          width:60px; height:60px; border-radius:16px;
          background:rgba(99,102,241,.18); display:flex; align-items:center; justify-content:center;
          margin:0 auto 16px; font-size:26px;
        }
        .fa-drop h3 { font-size:1.1rem; font-weight:700; margin:0 0 6px; color:#e2e0f0; }
        .fa-drop p  { font-size:.85rem; color:#6b6885; margin:0 0 20px; }
        .fa-file-badge {
          display:inline-flex; align-items:center; gap:8px;
          background:rgba(74,222,128,.12); border:1px solid rgba(74,222,128,.3);
          border-radius:10px; padding:8px 16px; font-size:.85rem; color:#4ade80;
          font-family:'JetBrains Mono',monospace;
        }
        .fa-btn {
          display:inline-flex; align-items:center; gap:8px;
          background:linear-gradient(135deg,#6366f1,#8b5cf6);
          color:#fff; border:none; border-radius:12px;
          padding:14px 32px; font-size:.95rem; font-weight:700;
          font-family:'Syne',sans-serif; cursor:pointer;
          transition:all .2s; box-shadow:0 4px 20px rgba(99,102,241,.35);
        }
        .fa-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 28px rgba(99,102,241,.5); }
        .fa-btn:disabled { opacity:.45; cursor:not-allowed; }
        .fa-btn-ghost {
          background:transparent; border:1px solid rgba(99,102,241,.4);
          color:#818cf8; padding:10px 22px; font-size:.85rem;
        }
        .fa-btn-ghost:hover { background:rgba(99,102,241,.1); }
        .fa-actions { display:flex; gap:12px; justify-content:center; margin-top:20px; flex-wrap:wrap; }
        .fa-error {
          background:rgba(239,68,68,.1); border:1px solid rgba(239,68,68,.3);
          border-radius:12px; padding:12px 18px; margin-top:16px;
          color:#f87171; font-size:.875rem; text-align:center;
        }

        /* ── loading ── */
        .fa-loading {
          max-width:700px; margin:0 auto 40px; padding:0 24px; text-align:center;
        }
        .fa-spinner {
          width:56px; height:56px; border-radius:50%;
          border:3px solid rgba(99,102,241,.2);
          border-top-color:#6366f1;
          animation:spin .8s linear infinite;
          margin:0 auto 20px;
        }
        @keyframes spin { to { transform:rotate(360deg); } }
        .fa-loading p { color:#9490b0; font-size:.9rem; }
        .fa-loading strong { color:#e2e0f0; }

        /* ── report ── */
        .fa-report { max-width:940px; margin:0 auto; padding:0 24px 80px; }

        /* verdict banner */
        .fa-verdict {
          border-radius:20px; padding:32px;
          border:1px solid; margin-bottom:28px;
          display:grid; grid-template-columns:1fr auto; gap:24px; align-items:center;
        }
        .fa-verdict-label { font-size:.75rem; font-family:'JetBrains Mono',monospace; letter-spacing:.1em; text-transform:uppercase; opacity:.6; margin-bottom:6px; }
        .fa-verdict-action { font-size:1.5rem; font-weight:800; }
        .fa-verdict-reason { font-size:.875rem; opacity:.75; margin-top:8px; line-height:1.6; }
        .fa-pct-ring { position:relative; width:100px; height:100px; flex-shrink:0; }
        .fa-pct-ring svg { transform:rotate(-90deg); }
        .fa-pct-ring-num {
          position:absolute; inset:0; display:flex; flex-direction:column;
          align-items:center; justify-content:center;
          font-family:'JetBrains Mono',monospace; line-height:1;
        }
        .fa-pct-ring-num span:first-child { font-size:1.6rem; font-weight:700; }
        .fa-pct-ring-num span:last-child  { font-size:.6rem; opacity:.55; margin-top:2px; }

        /* tabs */
        .fa-tabs { display:flex; gap:4px; margin-bottom:24px; background:rgba(255,255,255,.04); border-radius:14px; padding:4px; }
        .fa-tab {
          flex:1; padding:10px; border-radius:10px; border:none;
          background:transparent; color:#9490b0;
          font-family:'Syne',sans-serif; font-size:.82rem; font-weight:600;
          cursor:pointer; transition:all .2s; text-transform:capitalize;
        }
        .fa-tab.active { background:rgba(99,102,241,.25); color:#c7d2fe; }

        /* panels */
        .fa-panel { animation:fadeUp .3s ease; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }

        /* grid cards */
        .fa-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:16px; margin-bottom:20px; }
        .fa-card {
          background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.07);
          border-radius:16px; padding:22px;
        }
        .fa-card-label { font-size:.7rem; font-family:'JetBrains Mono',monospace; letter-spacing:.1em; text-transform:uppercase; color:#6b6885; margin-bottom:10px; }
        .fa-card-value { font-size:1.5rem; font-weight:800; color:#e2e0f0; }
        .fa-card-sub   { font-size:.78rem; color:#6b6885; margin-top:4px; }

        /* field list */
        .fa-field-list { display:grid; gap:10px; }
        .fa-field {
          display:flex; justify-content:space-between; align-items:baseline;
          padding:10px 0; border-bottom:1px solid rgba(255,255,255,.05);
          font-size:.875rem;
        }
        .fa-field:last-child { border-bottom:none; }
        .fa-field-key { color:#6b6885; flex-shrink:0; margin-right:12px; }
        .fa-field-val { color:#e2e0f0; font-weight:600; text-align:right; }

        /* tags */
        .fa-tags { display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }
        .fa-tag {
          background:rgba(99,102,241,.15); border:1px solid rgba(99,102,241,.3);
          border-radius:8px; padding:4px 12px; font-size:.78rem;
          color:#a5b4fc; font-family:'JetBrains Mono',monospace;
        }
        .fa-tag.green { background:rgba(74,222,128,.1); border-color:rgba(74,222,128,.3); color:#4ade80; }
        .fa-tag.red   { background:rgba(239,68,68,.1);  border-color:rgba(239,68,68,.3);  color:#f87171; }

        /* sections */
        .fa-section { margin-bottom:24px; }
        .fa-section h4 {
          font-size:.7rem; font-family:'JetBrains Mono',monospace;
          letter-spacing:.12em; text-transform:uppercase; color:#6b6885;
          margin:0 0 12px;
        }
        .fa-list { list-style:none; padding:0; margin:0; display:grid; gap:8px; }
        .fa-list li {
          display:flex; gap:10px; align-items:flex-start;
          font-size:.875rem; color:#c4c0d8; line-height:1.55;
        }
        .fa-list li::before { content:"→"; color:#6366f1; flex-shrink:0; margin-top:1px; }
        .fa-list.check li::before { content:"✓"; color:#22c55e; }
        .fa-list.warn  li::before { content:"✗"; color:#ef4444; }
        .fa-list.num   { counter-reset:steps; }
        .fa-list.num li { counter-increment:steps; }
        .fa-list.num li::before {
          content:counter(steps); color:#fff;
          background:#6366f1; border-radius:50%;
          width:20px; height:20px; display:flex; align-items:center; justify-content:center;
          font-size:.68rem; font-weight:700; flex-shrink:0;
        }

        /* past case card */
        .fa-case-card {
          background:rgba(255,255,255,.025); border:1px solid rgba(255,255,255,.07);
          border-radius:16px; padding:22px; margin-bottom:14px;
        }
        .fa-case-header { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:14px; }
        .fa-case-title { font-family:'Libre Baskerville',serif; font-size:.95rem; font-weight:700; color:#e2e0f0; line-height:1.4; }
        .fa-case-court { font-size:.75rem; color:#9490b0; margin-top:3px; font-family:'JetBrains Mono',monospace; }
        .fa-outcome-badge {
          border-radius:8px; padding:4px 12px; font-size:.72rem; font-weight:700;
          font-family:'JetBrains Mono',monospace; white-space:nowrap;
          border:1px solid;
        }
        .fa-case-body { display:grid; gap:10px; }
        .fa-case-row { font-size:.83rem; color:#9490b0; line-height:1.6; }
        .fa-case-row strong { color:#c4c0d8; display:block; font-size:.7rem; text-transform:uppercase; letter-spacing:.08em; margin-bottom:3px; }
        .fa-relevance {
          margin-top:12px; padding:10px 14px;
          background:rgba(99,102,241,.08); border-left:3px solid #6366f1;
          border-radius:0 8px 8px 0; font-size:.82rem; color:#a5b4fc; line-height:1.55;
        }

        /* disclaimer */
        .fa-disclaimer {
          background:rgba(245,158,11,.06); border:1px solid rgba(245,158,11,.2);
          border-radius:12px; padding:14px 18px; margin-top:28px;
          font-size:.8rem; color:#a16207; line-height:1.6; text-align:center;
        }

        @media (max-width:600px) {
          .fa-verdict { grid-template-columns:1fr; }
          .fa-pct-ring { margin:0 auto; }
          .fa-tabs { flex-wrap:wrap; }
        }
      `}</style>

      <div className="fa-page">
        <Navbar />

        {/* ── Hero ── */}
        <div className="fa-hero">
          <div className="fa-hero-eyebrow">
            <span>⚖</span> AI-Powered Legal Analysis
          </div>
          <h1>Understand Your FIR Before Court</h1>
          <p>
            Upload your FIR PDF. We extract, anonymise, and analyse it using AI —
            giving you win probability, cost estimates, and real case precedents.
            Your personal data never leaves this server.
          </p>
        </div>

        {/* ── Upload / Loading / Report ── */}
        {stage !== "done" && (
          <div className="fa-upload-wrap">
            {/* Drop zone */}
            <div
              className={`fa-drop ${dragging ? "drag" : ""} ${file ? "ready" : ""}`}
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".pdf"
                style={{ display: "none" }}
                onChange={(e) => pickFile(e.target.files[0])}
              />

              {!file ? (
                <>
                  <div className="fa-drop-icon">📄</div>
                  <h3>Drop your FIR PDF here</h3>
                  <p>or click to browse — digital and scanned PDFs supported</p>
                </>
              ) : (
                <>
                  <div className="fa-drop-icon" style={{ background: "rgba(74,222,128,.15)" }}>✓</div>
                  <h3>File selected</h3>
                  <div className="fa-file-badge" onClick={(e) => e.stopPropagation()}>
                    📎 {file.name} &nbsp;·&nbsp; {(file.size / 1024).toFixed(0)} KB
                  </div>
                </>
              )}
            </div>

            {stage === "error" && <div className="fa-error">⚠ {errorMsg}</div>}

            <div className="fa-actions">
              <button
                className="fa-btn"
                disabled={!file || stage === "uploading"}
                onClick={analyse}
              >
                {stage === "uploading" ? (
                  <>
                    <span className="fa-spinner" style={{ width:18, height:18, borderWidth:2, margin:0 }} />
                    Analysing…
                  </>
                ) : "Analyse FIR →"}
              </button>
              {file && (
                <button className="fa-btn fa-btn-ghost" onClick={reset}>
                  Clear
                </button>
              )}
            </div>

            {stage === "uploading" && (
              <div className="fa-loading" style={{ marginTop: 32 }}>
                <div className="fa-spinner" />
                <p><strong>Extracting fields</strong> with local AI…</p>
                <p style={{ marginTop: 6 }}>Masking your personal data…</p>
                <p style={{ marginTop: 6 }}>Getting legal analysis from Gemini…</p>
              </div>
            )}
          </div>
        )}

        {/* ── Report ── */}
        {stage === "done" && report && (
          <div className="fa-report">

            {/* Verdict banner */}
            <div
              className="fa-verdict"
              style={{ background: actionStyle.bg, borderColor: actionStyle.border }}
            >
              <div>
                <div className="fa-verdict-label">Recommended Action</div>
                <div className="fa-verdict-action" style={{ color: actionStyle.text }}>
                  {la.recommended_action}
                </div>
                <div className="fa-verdict-reason">{la.recommended_action_reasoning}</div>
              </div>

              {/* Win % ring */}
              <div className="fa-pct-ring">
                <svg width="100" height="100" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="42" fill="none"
                    stroke={pct >= 60 ? "#22c55e" : pct >= 40 ? "#f59e0b" : "#ef4444"}
                    strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 42}`}
                    strokeDashoffset={`${2 * Math.PI * 42 * (1 - pct / 100)}`}
                    style={{ transition: "stroke-dashoffset 1s ease" }}
                  />
                </svg>
                <div className="fa-pct-ring-num">
                  <span style={{ color: pct >= 60 ? "#22c55e" : pct >= 40 ? "#f59e0b" : "#ef4444" }}>
                    {pct}%
                  </span>
                  <span>WIN</span>
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div className="fa-grid" style={{ marginBottom: 24 }}>
              <div className="fa-card">
                <div className="fa-card-label">Typical Duration</div>
                <div className="fa-card-value">{dur.district_court_typical ?? "—"} <span style={{fontSize:".9rem",opacity:.6}}>months</span></div>
                <div className="fa-card-sub">{dur.district_court_min}–{dur.district_court_max} mo range · {dur.including_appeals_typical} mo with appeals</div>
              </div>
              <div className="fa-card">
                <div className="fa-card-label">Estimated Cost</div>
                <div className="fa-card-value">₹{fmt(cost.total_min)}</div>
                <div className="fa-card-sub">up to ₹{fmt(cost.total_max)} · advocate + court fees</div>
              </div>
              <div className="fa-card">
                <div className="fa-card-label">IPC Sections</div>
                <div className="fa-tags" style={{marginTop:4}}>
                  {(ef.ipc_sections ?? []).map(s => <span key={s} className="fa-tag">{s}</span>)}
                  {!(ef.ipc_sections?.length) && <span style={{color:"#6b6885",fontSize:".85rem"}}>None extracted</span>}
                </div>
                <div className="fa-card-sub" style={{marginTop:8}}>{ef.case_nature ?? mp.case_nature ?? "—"}</div>
              </div>
              <div className="fa-card">
                <div className="fa-card-label">Filed At</div>
                <div className="fa-card-value" style={{fontSize:"1.1rem"}}>{ef.police_station ?? "—"}</div>
                <div className="fa-card-sub">{ef.district ?? ""} · {ef.date_of_filing ?? "—"}</div>
              </div>
            </div>

            {/* Tabs */}
            <div className="fa-tabs">
              {TABS.map(t => (
                <button key={t} className={`fa-tab ${activeTab===t?"active":""}`} onClick={() => setActiveTab(t)}>
                  {t === "steps" ? "Next Steps" : t === "precedents" ? "Past Cases" : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {/* ── Overview tab ── */}
            {activeTab === "overview" && (
              <div className="fa-panel">
                <div className="fa-grid">
                  <div className="fa-card" style={{gridColumn:"1/-1"}}>
                    <div className="fa-card-label">Win Probability Reasoning</div>
                    <p style={{fontSize:".88rem",color:"#c4c0d8",lineHeight:1.65,margin:"10px 0 0"}}>
                      {la.win_probability_reasoning}
                    </p>
                  </div>
                </div>
                <div className="fa-grid">
                  <div className="fa-card">
                    <div className="fa-card-label">Key Strengths</div>
                    <ul className="fa-list check" style={{marginTop:10}}>
                      {(la.key_strengths??[]).map((s,i)=><li key={i}>{s}</li>)}
                    </ul>
                  </div>
                  <div className="fa-card">
                    <div className="fa-card-label">Key Weaknesses</div>
                    <ul className="fa-list warn" style={{marginTop:10}}>
                      {(la.key_weaknesses??[]).map((s,i)=><li key={i}>{s}</li>)}
                    </ul>
                  </div>
                </div>
                <div className="fa-card">
                  <div className="fa-card-label">Cost Breakdown</div>
                  <div className="fa-field-list" style={{marginTop:12}}>
                    {[
                      ["Advocate Fees", `₹${fmt(cost.advocate_fees_min)} – ₹${fmt(cost.advocate_fees_max)}`],
                      ["Court Fees",    `₹${fmt(cost.court_fees_approx)}`],
                      ["Miscellaneous", `₹${fmt(cost.miscellaneous_min)} – ₹${fmt(cost.miscellaneous_max)}`],
                      ["Total",         `₹${fmt(cost.total_min)} – ₹${fmt(cost.total_max)}`],
                    ].map(([k,v])=>(
                      <div key={k} className="fa-field">
                        <span className="fa-field-key">{k}</span>
                        <span className="fa-field-val">{v}</span>
                      </div>
                    ))}
                  </div>
                  {cost.notes && <p style={{fontSize:".78rem",color:"#6b6885",marginTop:10,lineHeight:1.6}}>{cost.notes}</p>}
                </div>
              </div>
            )}

            {/* ── Evidence tab ── */}
            {activeTab === "evidence" && (
              <div className="fa-panel">
                <div className="fa-grid">
                  <div className="fa-card">
                    <div className="fa-card-label">Required Documents</div>
                    <ul className="fa-list" style={{marginTop:10}}>
                      {(la.required_documents??[]).map((d,i)=><li key={i}>{d}</li>)}
                    </ul>
                  </div>
                  <div className="fa-card">
                    <div className="fa-card-label">Optional but Helpful</div>
                    <ul className="fa-list" style={{marginTop:10}}>
                      {(la.optional_but_helpful_documents??[]).map((d,i)=><li key={i}>{d}</li>)}
                    </ul>
                  </div>
                </div>
                <div className="fa-card" style={{marginTop:0}}>
                  <div className="fa-card-label">Extracted FIR Fields</div>
                  <div className="fa-field-list" style={{marginTop:12}}>
                    {[
                      ["FIR Number",      ef.fir_number],
                      ["Incident Date",   ef.date_of_incident],
                      ["Incident Time",   ef.time_of_incident],
                      ["Incident Location", ef.incident_location],
                      ["Victim Age",      ef.victim_age],
                      ["Accused",         ef.accused_names?.join(", ")],
                      ["Witnesses",       ef.witness_names?.join(", ")],
                    ].filter(([,v])=>v).map(([k,v])=>(
                      <div key={k} className="fa-field">
                        <span className="fa-field-key">{k}</span>
                        <span className="fa-field-val">{v}</span>
                      </div>
                    ))}
                  </div>
                  {ef.incident_description && (
                    <div style={{marginTop:16}}>
                      <div className="fa-card-label">Incident Description</div>
                      <p style={{fontSize:".875rem",color:"#c4c0d8",lineHeight:1.65,marginTop:8}}>
                        {ef.incident_description}
                      </p>
                    </div>
                  )}
                </div>
                <div className="fa-card" style={{marginTop:16}}>
                  <div className="fa-card-label">Important Caveats</div>
                  <ul className="fa-list" style={{marginTop:10}}>
                    {(la.important_caveats??[]).map((c,i)=><li key={i}>{c}</li>)}
                  </ul>
                </div>
              </div>
            )}

            {/* ── Precedents tab ── */}
            {activeTab === "precedents" && (
              <div className="fa-panel">
                {(la.similar_past_cases?.length > 0) ? la.similar_past_cases.map((c, i) => {
                  const oc = OUTCOME_COLOR[c.outcome] ?? "#9490b0";
                  return (
                    <div key={i} className="fa-case-card">
                      <div className="fa-case-header">
                        <div>
                          <div className="fa-case-title">{c.case_title}</div>
                          <div className="fa-case-court">{c.court} · {c.year}</div>
                          <div className="fa-tags" style={{marginTop:8}}>
                            {(c.ipc_sections??[]).map(s=><span key={s} className="fa-tag">{s}</span>)}
                          </div>
                        </div>
                        <div
                          className="fa-outcome-badge"
                          style={{ color:oc, borderColor:oc, background:`${oc}18` }}
                        >
                          {c.outcome}
                        </div>
                      </div>
                      <div className="fa-case-body">
                        <div className="fa-case-row">
                          <strong>Facts</strong>
                          {c.what_happened}
                        </div>
                        <div className="fa-case-row">
                          <strong>Judgement</strong>
                          {c.judgement_summary}
                        </div>
                        <div className="fa-case-row">
                          <strong>Sentence / Relief</strong>
                          {c.sentence_or_relief}
                        </div>
                      </div>
                      <div className="fa-relevance">
                        💡 {c.relevance_to_current_case}
                      </div>
                    </div>
                  );
                }) : (
                  <div className="fa-card" style={{textAlign:"center",padding:"40px 24px"}}>
                    <div style={{fontSize:"2rem",marginBottom:12}}>⚖️</div>
                    <p style={{color:"#6b6885",fontSize:".9rem"}}>
                      No closely matching past cases were found by Gemini for this FIR.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── Steps tab ── */}
            {activeTab === "steps" && (
              <div className="fa-panel">
                <div className="fa-card">
                  <div className="fa-card-label">Immediate Next Steps</div>
                  <ul className="fa-list num" style={{marginTop:16}}>
                    {(la.immediate_next_steps??[]).map((s,i)=><li key={i}>{s}</li>)}
                  </ul>
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="fa-disclaimer">⚠ {report.disclaimer}</div>

            {/* Analyse another */}
            <div style={{textAlign:"center",marginTop:28}}>
              <button className="fa-btn fa-btn-ghost" style={{padding:"12px 28px"}} onClick={reset}>
                ← Analyse Another FIR
              </button>
            </div>
          </div>
        )}

        <Footer />
      </div>
    </>
  );
}