import { useState, useEffect } from "react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, RadialBarChart, RadialBar, Legend
} from "recharts";

// ─── RAW DATA ────────────────────────────────────────────────────────────────
const RAW_DATA = [
  { maturity:"Production", useCase:"Submission Centre",                         customer:"Sompo",              pct:1,   status:"Done",    sliderStatus:"Available", demoStatus:"Available", referenceable:"Yes", highQualityDemo:"Yes" },
  { maturity:"Production", useCase:"Slip Ingestion Centre",                      customer:"Sompo",              pct:1,   status:"Done",    sliderStatus:"Available", demoStatus:"In Progress", referenceable:null, highQualityDemo:null },
  { maturity:"Production", useCase:"Policy & Claims Chat Insure",                customer:"IAT",                pct:1,   status:"Done",    sliderStatus:"Available", demoStatus:"In Progress", referenceable:null, highQualityDemo:null },
  { maturity:"Production", useCase:"Insurance Tracking Automation",              customer:"Assurant",           pct:1,   status:"Done",    sliderStatus:"Available", demoStatus:"In Progress", referenceable:null, highQualityDemo:null },
  { maturity:"Production", useCase:"Pricing Predictive",                         customer:"IAT",                pct:1,   status:"Done",    sliderStatus:"Available", demoStatus:"In Progress", referenceable:null, highQualityDemo:null },
  { maturity:"Production", useCase:"Broker's Document Ingestion to Generate Quote", customer:"Argyle",          pct:1,   status:"Done",    sliderStatus:"Available", demoStatus:"Available", referenceable:null, highQualityDemo:null },
  { maturity:"Built",      useCase:"ISO Circular Form Summarizer Extraction",    customer:"BHSI & IAT",         pct:1,   status:"Done",    sliderStatus:"Available", demoStatus:"In Progress", referenceable:null, highQualityDemo:null },
  { maturity:"Built",      useCase:"Policy & Claims Chat Insure Accelerator",    customer:"Argyle",             pct:1,   status:"Done",    sliderStatus:"Available", demoStatus:"In Progress", referenceable:null, highQualityDemo:null },
  { maturity:"Built",      useCase:"Loss Run Analytics Using GEN AI",            customer:"None",               pct:1,   status:"Done",    sliderStatus:"Available", demoStatus:"In Progress", referenceable:null, highQualityDemo:null },
  { maturity:"Built",      useCase:"Test Genie (Test Case Generator)",           customer:"None",               pct:1,   status:"Done",    sliderStatus:"Available", demoStatus:"In Progress", referenceable:null, highQualityDemo:null },
  { maturity:"Built",      useCase:"XML to SQL Converter",                       customer:"PMIC",               pct:1,   status:"Done",    sliderStatus:"Available", demoStatus:"In Progress", referenceable:null, highQualityDemo:null },
  { maturity:"Built",      useCase:"Security Vulnerability Plug In",             customer:"Assurant",           pct:1,   status:"Done",    sliderStatus:"Available", demoStatus:"In Progress", referenceable:null, highQualityDemo:null },
  { maturity:"Built",      useCase:"Demand Letter Extraction & Summarization",   customer:"GAIG & GNY",         pct:1,   status:"Done",    sliderStatus:"Available", demoStatus:"In Progress", referenceable:null, highQualityDemo:null },
  { maturity:"Built",      useCase:"IDP/OCR Accelerator",                        customer:"GAIG & Arch",        pct:1,   status:"Done",    sliderStatus:"Available", demoStatus:"In Progress", referenceable:null, highQualityDemo:null },
  { maturity:"Dev",        useCase:"INS Claims Watch 360",                       customer:"Assurant",           pct:0.1, status:"Req. Gathering Done – ETA 30 May", sliderStatus:"In Progress", demoStatus:"In Progress", referenceable:null, highQualityDemo:null },
  { maturity:"Dev",        useCase:"Claim Intake Agent (FNOL)",                  customer:"GAIG/Assurant",      pct:0.2, status:"Design in Progress – ETA 30 May",  sliderStatus:"In Progress", demoStatus:"In Progress", referenceable:null, highQualityDemo:null },
  { maturity:"Dev",        useCase:"Incident Management Copilot",                customer:"Utica",              pct:0.4, status:"Demo Done – ETA 20 May",           sliderStatus:"In Progress", demoStatus:"In Progress", referenceable:null, highQualityDemo:null },
  { maturity:"Ideation",   useCase:"Damage IQ (Vision AI)",                      customer:"Self Proposed",      pct:0,   status:"ETA 13 Jun",  sliderStatus:"In Progress", demoStatus:"In Progress", referenceable:null, highQualityDemo:null },
  { maturity:"Ideation",   useCase:"Risk Insure (AI Underwriting)",              customer:"Self Proposed",      pct:0,   status:"ETA 20 Jun",  sliderStatus:"In Progress", demoStatus:"In Progress", referenceable:null, highQualityDemo:null },
  { maturity:"Ideation",   useCase:"Pole Pick (Policy Recommendations)",         customer:"Self Proposed",      pct:0,   status:"ETA 27 Jun",  sliderStatus:"In Progress", demoStatus:"In Progress", referenceable:null, highQualityDemo:null },
];

const MATURITY_META = {
  Production: { color: "#00E5A0", label: "Production",  order: 0 },
  Built:      { color: "#3B82F6", label: "Built",       order: 1 },
  Dev:        { color: "#F59E0B", label: "In Dev",      order: 2 },
  Ideation:   { color: "#A855F7", label: "Ideation",    order: 3 },
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const countBy = (arr, key) => arr.reduce((acc, item) => {
  const v = item[key]; acc[v] = (acc[v] || 0) + 1; return acc;
}, {});

const CUSTOMERS = [...new Set(RAW_DATA.map(d => d.customer))].filter(c => c !== "None" && c !== "Self Proposed");

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────
const KpiCard = ({ label, value, sub, accent, icon }) => (
  <div style={{
    background: "linear-gradient(135deg,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.01) 100%)",
    border: `1px solid ${accent}33`,
    borderRadius: 16,
    padding: "24px 28px",
    position: "relative",
    overflow: "hidden",
    backdropFilter: "blur(8px)",
    transition: "transform 0.2s,box-shadow 0.2s",
  }}
    onMouseEnter={e => { e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow=`0 12px 40px ${accent}22`; }}
    onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="none"; }}
  >
    <div style={{ position:"absolute", top:-20, right:-20, fontSize:72, opacity:0.06, userSelect:"none" }}>{icon}</div>
    <div style={{ color: accent, fontSize: 13, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
    <div style={{ color: "#fff", fontSize: 48, fontWeight: 800, lineHeight: 1, fontFamily:"'Bebas Neue',sans-serif", letterSpacing:"0.02em" }}>{value}</div>
    {sub && <div style={{ color: "#94A3B8", fontSize: 12, marginTop: 6 }}>{sub}</div>}
    <div style={{ position:"absolute", bottom:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${accent},transparent)` }} />
  </div>
);

const MaturityBadge = ({ maturity }) => {
  const m = MATURITY_META[maturity] || MATURITY_META.Dev;
  return (
    <span style={{
      background: `${m.color}22`,
      color: m.color,
      border: `1px solid ${m.color}55`,
      borderRadius: 6,
      padding: "2px 10px",
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      whiteSpace: "nowrap",
    }}>{m.label}</span>
  );
};

const StatusDot = ({ val, trueVal = "Available" }) => (
  <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, color: val === trueVal ? "#00E5A0" : "#F59E0B" }}>
    <span style={{ width:7, height:7, borderRadius:"50%", background: val === trueVal ? "#00E5A0" : "#F59E0B", display:"inline-block", boxShadow: val === trueVal ? "0 0 6px #00E5A0" : "0 0 6px #F59E0B" }} />
    {val}
  </span>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#0F1829", border:"1px solid #1E2D4A", borderRadius:10, padding:"10px 16px" }}>
      <div style={{ color:"#94A3B8", fontSize:12, marginBottom:4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color:p.color || "#fff", fontSize:14, fontWeight:700 }}>{p.value} use cases</div>
      ))}
    </div>
  );
};

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function App() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [animated, setAnimated] = useState(false);

  useEffect(() => { setTimeout(() => setAnimated(true), 100); }, []);

  const maturityCounts = countBy(RAW_DATA, "maturity");
  const live = RAW_DATA.filter(d => d.maturity === "Production").length;
  const done = RAW_DATA.filter(d => d.status === "Done").length;
  const customerCounts = countBy(
    RAW_DATA.filter(d => d.customer !== "None" && d.customer !== "Self Proposed"), "customer"
  );

  const pieData = Object.entries(maturityCounts).map(([k, v]) => ({
    name: MATURITY_META[k]?.label || k, value: v, color: MATURITY_META[k]?.color || "#64748B"
  }));

  const barData = Object.entries(customerCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => ({ customer: k, count: v }));

  const filtered = RAW_DATA.filter(d => {
    const matchFilter = filter === "All" || d.maturity === filter;
    const matchSearch = !search || d.useCase.toLowerCase().includes(search.toLowerCase()) || d.customer.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #060D1A 0%, #0A1628 50%, #060D1A 100%)",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      color: "#E2E8F0",
      padding: "0 0 60px",
    }}>
      {/* Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />

      {/* Background grid */}
      <div style={{
        position:"fixed", inset:0, pointerEvents:"none", zIndex:0,
        backgroundImage:"linear-gradient(rgba(0,229,160,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,160,0.03) 1px,transparent 1px)",
        backgroundSize:"48px 48px",
      }} />

      {/* Header */}
      <header style={{
        position:"relative", zIndex:1,
        borderBottom:"1px solid rgba(255,255,255,0.06)",
        background:"rgba(6,13,26,0.8)", backdropFilter:"blur(20px)",
        padding:"0 48px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        height:72,
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <div style={{
            width:36, height:36, borderRadius:10,
            background:"linear-gradient(135deg,#00E5A0,#0EA5E9)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:20,
          }}>⚡</div>
          <div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, letterSpacing:"0.08em", color:"#fff", lineHeight:1 }}>GEN AI USE CASE COMMAND CENTER</div>
            <div style={{ fontSize:11, color:"#00E5A0", letterSpacing:"0.15em", textTransform:"uppercase" }}>Insurance · IBU/HBU · Live Intelligence</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:24 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color:"#64748B" }}>
            <span style={{ width:8, height:8, borderRadius:"50%", background:"#00E5A0", display:"inline-block", boxShadow:"0 0 8px #00E5A0", animation:"pulse 2s infinite" }} />
            {live} Use Cases Live
          </div>
          <div style={{ fontSize:12, color:"#475569", borderLeft:"1px solid #1E2D4A", paddingLeft:24 }}>
            Total: <span style={{ color:"#fff", fontWeight:700 }}>{RAW_DATA.length}</span>
          </div>
        </div>
      </header>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.5s ease forwards; }
        ::-webkit-scrollbar { width:6px; height:6px; }
        ::-webkit-scrollbar-track { background:#0A1628; }
        ::-webkit-scrollbar-thumb { background:#1E3A5F; border-radius:3px; }
      `}</style>

      <main style={{ position:"relative", zIndex:1, maxWidth:1440, margin:"0 auto", padding:"40px 48px 0" }}>

        {/* KPI ROW */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:20, marginBottom:36,
          opacity: animated ? 1 : 0, transform: animated ? "none" : "translateY(20px)",
          transition:"all 0.6s ease",
        }}>
          <KpiCard label="Total Use Cases"   value={RAW_DATA.length} sub="Across all maturity stages"    accent="#00E5A0" icon="📊" />
          <KpiCard label="Live in Production" value={live}            sub={`${Math.round(live/RAW_DATA.length*100)}% of portfolio`} accent="#3B82F6" icon="🚀" />
          <KpiCard label="Completed"          value={done}            sub="Status marked Done"             accent="#F59E0B" icon="✅" />
          <KpiCard label="Active Accounts"    value={CUSTOMERS.length} sub="Unique client engagements"    accent="#A855F7" icon="🏢" />
        </div>

        {/* CHARTS ROW */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1.6fr", gap:20, marginBottom:36,
          opacity: animated ? 1 : 0, transform: animated ? "none" : "translateY(20px)",
          transition:"all 0.6s ease 0.15s",
        }}>
          {/* Pie */}
          <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:20, padding:"28px 24px" }}>
            <div style={{ fontSize:13, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"#94A3B8", marginBottom:4 }}>Portfolio Distribution</div>
            <div style={{ fontSize:11, color:"#475569", marginBottom:20 }}>By Maturity Stage</div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={58} outerRadius={90}
                  paddingAngle={4} dataKey="value" stroke="none">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"8px 16px", justifyContent:"center", marginTop:8 }}>
              {pieData.map(d => (
                <div key={d.name} style={{ display:"flex", alignItems:"center", gap:6, fontSize:12 }}>
                  <span style={{ width:10, height:10, borderRadius:3, background:d.color, display:"inline-block" }} />
                  <span style={{ color:"#94A3B8" }}>{d.name}</span>
                  <span style={{ color:"#fff", fontWeight:700 }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bar chart – by customer */}
          <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:20, padding:"28px 24px" }}>
            <div style={{ fontSize:13, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"#94A3B8", marginBottom:4 }}>Use Cases by Account</div>
            <div style={{ fontSize:11, color:"#475569", marginBottom:20 }}>Excluding internal / self-proposed</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} barSize={28} margin={{ top:0, right:16, bottom:0, left:-16 }}>
                <XAxis dataKey="customer" tick={{ fill:"#64748B", fontSize:11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:"#64748B", fontSize:11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill:"rgba(255,255,255,0.03)" }} />
                <Bar dataKey="count" radius={[6,6,0,0]}>
                  {barData.map((_, i) => (
                    <Cell key={i} fill={`hsl(${170 + i * 22},70%,${52 - i * 3}%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* FILTER + SEARCH */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20,
          opacity: animated ? 1 : 0, transition:"opacity 0.6s ease 0.3s",
        }}>
          <div style={{ display:"flex", gap:8 }}>
            {["All", "Production", "Built", "Dev", "Ideation"].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding:"8px 18px", borderRadius:8, border:"none", cursor:"pointer",
                fontSize:12, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase",
                background: filter === f ? (f === "All" ? "#00E5A0" : MATURITY_META[f]?.color || "#00E5A0") : "rgba(255,255,255,0.05)",
                color: filter === f ? "#060D1A" : "#64748B",
                transition:"all 0.2s",
              }}>{f === "All" ? `All (${RAW_DATA.length})` : `${MATURITY_META[f]?.label || f} (${maturityCounts[f] || 0})`}</button>
            ))}
          </div>
          <input
            placeholder="Search use case or account…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)",
              borderRadius:10, padding:"9px 18px", color:"#E2E8F0", fontSize:13,
              width:260, outline:"none",
            }}
          />
        </div>

        {/* TABLE */}
        <div style={{
          background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)",
          borderRadius:20, overflow:"hidden",
          opacity: animated ? 1 : 0, transition:"opacity 0.6s ease 0.35s",
        }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:"rgba(255,255,255,0.03)", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                {["Use Case","Maturity","Customer","% Complete","Slider","Demo","Status"].map(h => (
                  <th key={h} style={{ padding:"14px 18px", textAlign:"left", fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"#475569", whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <tr key={i} style={{
                  borderBottom:"1px solid rgba(255,255,255,0.04)",
                  transition:"background 0.15s",
                  animation:`fadeUp 0.3s ease ${i * 0.03}s both`,
                }}
                  onMouseEnter={e => e.currentTarget.style.background="rgba(0,229,160,0.03)"}
                  onMouseLeave={e => e.currentTarget.style.background="transparent"}
                >
                  <td style={{ padding:"14px 18px", fontSize:13, fontWeight:500, color:"#E2E8F0", maxWidth:260 }}>
                    <div style={{ whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:240 }} title={row.useCase}>{row.useCase}</div>
                  </td>
                  <td style={{ padding:"14px 18px" }}><MaturityBadge maturity={row.maturity} /></td>
                  <td style={{ padding:"14px 18px", fontSize:13, color:"#94A3B8", whiteSpace:"nowrap" }}>{row.customer}</td>
                  <td style={{ padding:"14px 18px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ flex:1, height:5, background:"rgba(255,255,255,0.08)", borderRadius:3, minWidth:60 }}>
                        <div style={{ height:"100%", borderRadius:3, width:`${row.pct * 100}%`, background: row.pct === 1 ? "#00E5A0" : row.pct > 0.2 ? "#F59E0B" : "#EF4444", transition:"width 0.8s ease" }} />
                      </div>
                      <span style={{ fontSize:11, color:"#64748B", minWidth:28 }}>{Math.round(row.pct * 100)}%</span>
                    </div>
                  </td>
                  <td style={{ padding:"14px 18px" }}><StatusDot val={row.sliderStatus} /></td>
                  <td style={{ padding:"14px 18px" }}><StatusDot val={row.demoStatus} /></td>
                  <td style={{ padding:"14px 18px", fontSize:11, color:"#64748B", maxWidth:180 }}>
                    <div style={{ whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:170 }} title={row.status}>{row.status}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding:"12px 18px", borderTop:"1px solid rgba(255,255,255,0.04)", fontSize:12, color:"#475569" }}>
            Showing {filtered.length} of {RAW_DATA.length} use cases
          </div>
        </div>

      </main>
    </div>
  );
}
