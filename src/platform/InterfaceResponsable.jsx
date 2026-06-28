import React, { useState, useMemo, useCallback, useRef } from "react";
import { calcCriticite, StatutPill, SectionTitle } from "./logidoc-core";

/* ── Constantes Responsable (ENTITES globale non modifiée) ── */
const ENTITES_GRAPHIQUES = ["CILAS", "LCM", "LCO", "CMA", "LS", "LSA", "SAA"];
const TRANSITAIRES_FIXES = ["UNION SHIPPING", "HAMICI BOUALEM", "EURL TRANSIBA"];
const PORTS_ENTREE = [
  "Port Alger", "Port Oran", "Port de Béjaïa", "Aéroport Alger", "Aéroport Oran",
  "Frontière Tunisie", "Port Annaba", "Port Djendjen", "Port Mostaganem", "Port Skikda",
];
const STATUTS_DOSSIER = ["En cours", "En cours d'acheminement", "En cours de dédouanement"];

const DEFAULT_FILTERS = {
  periode: "mois", fournisseur: "", entite: "", transitaire: "", port: "",
};

/* ── Helpers ── */
function simHash(label, min = 2, max = 14) {
  let h = 0;
  for (let i = 0; i < label.length; i += 1) h = ((h << 5) - h + label.charCodeAt(i)) | 0;
  return min + (Math.abs(h) % (max - min + 1));
}

function daysBetween(a, b) {
  if (!a || !b) return null;
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}

function inPeriod(dateStr, periode) {
  if (!dateStr) return true;
  const d = new Date(dateStr);
  const now = new Date();
  const start = new Date(now);
  if (periode === "mois") start.setMonth(start.getMonth() - 1);
  else if (periode === "trimestre") start.setMonth(start.getMonth() - 3);
  else start.setFullYear(start.getFullYear() - 1);
  return d >= start && d <= now;
}

function mapPortFromPo(po) {
  if (po.port) return po.port;
  const ic = (po.incoterm || "").toUpperCase();
  if (ic.includes("AEROPORT") && ic.includes("ALGER")) return "Aéroport Alger";
  if (ic.includes("AEROPORT") && ic.includes("ORAN")) return "Aéroport Oran";
  if (ic.includes("CPT") && ic.includes("ALGER")) return "Aéroport Alger";
  if (ic.includes("CPT") && ic.includes("ORAN")) return "Aéroport Oran";
  if (ic.includes("BEJAIA") || ic.includes("BEJAÏA")) return "Port de Béjaïa";
  if (ic.includes("SKIKDA")) return "Port Skikda";
  if (ic.includes("MOSTAGANEM")) return "Port Mostaganem";
  if (ic.includes("DJENDJEN")) return "Port Djendjen";
  if (ic.includes("ANNABA")) return "Port Annaba";
  if (ic.includes("ORAN")) return "Port Oran";
  if (ic.includes("ALGER")) return "Port Alger";
  if (ic.includes("TUNIS")) return "Frontière Tunisie";
  return null;
}

function mapTransitaire(dossier) {
  if (!dossier?.transitaire) return null;
  const t = dossier.transitaire.toUpperCase();
  if (t.includes("UNION")) return "UNION SHIPPING";
  if (t.includes("HAMICI")) return "HAMICI BOUALEM";
  if (t.includes("TRANSIBA")) return "EURL TRANSIBA";
  return dossier.transitaire;
}

function getFraisPo(po, dossier) {
  const hasReal = po.fraisMagasinage != null || po.fraisSurestaries != null || po.fraisAmendes != null
    || dossier?.fraisMagasinage != null || dossier?.fraisSurestaries != null || dossier?.fraisAmendes != null;
  if (hasReal) {
    const mag = Number(po.fraisMagasinage ?? dossier?.fraisMagasinage ?? 0);
    const sur = Number(po.fraisSurestaries ?? dossier?.fraisSurestaries ?? 0);
    const am = Number(po.fraisAmendes ?? dossier?.fraisAmendes ?? 0);
    return { mag, sur, am, total: mag + sur + am, simulated: false };
  }
  const base = po.montant || 10000;
  const mag = Math.round(base * 0.008);
  const sur = dossier?.declaration ? 0 : Math.round(base * 0.012);
  const am = Math.round(base * 0.003);
  return { mag, sur, am, total: mag + sur + am, simulated: true };
}

/* ── Composants SVG purs ── */
function CircularGauge({ value, inverted = false, size = 88 }) {
  const pct = value != null ? Math.min(100, Math.max(0, value)) : null;
  const r = 34;
  const circ = 2 * Math.PI * r;
  const offset = pct != null ? circ - (pct / 100) * circ : circ;
  let color = "var(--muted)";
  if (pct != null) {
    if (inverted) color = pct <= 15 ? "var(--brand)" : pct <= 25 ? "var(--warn)" : "var(--ko)";
    else color = pct >= 80 ? "var(--brand)" : pct >= 60 ? "var(--warn)" : "var(--ko)";
  }
  return (
    <svg width={size} height={size} viewBox="0 0 88 88" style={{ display: "block", margin: "0 auto" }}>
      <circle cx="44" cy="44" r={r} fill="none" stroke="#e8ece7" strokeWidth="8" />
      {pct != null && (
        <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          transform="rotate(-90 44 44)" />
      )}
      <text x="44" y="44" textAnchor="middle" dominantBaseline="central"
        style={{ fontFamily: "Archivo", fontSize: 16, fontWeight: 800, fill: color }}>
        {pct != null ? `${pct}%` : "—"}
      </text>
    </svg>
  );
}

function SvgDoughnut({ segments, size = 180 }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (!total) {
    return (
      <div style={{ textAlign: "center", color: "var(--muted)", fontSize: 13, padding: 24 }}>—</div>
    );
  }
  const r = 60;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  let acc = 0;
  const colors = ["var(--brand)", "var(--warn)", "var(--ko)"];
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", justifyContent: "center" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {segments.map((seg, i) => {
          const pct = seg.value / total;
          const dash = pct * circ;
          const el = (
            <circle key={seg.label} cx={cx} cy={cy} r={r} fill="none"
              stroke={seg.color || colors[i % colors.length]} strokeWidth={22}
              strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-acc * circ}
              transform={`rotate(-90 ${cx} ${cy})`} />
          );
          acc += pct;
          return el;
        })}
        <circle cx={cx} cy={cy} r={38} fill="var(--panel)" />
      </svg>
      <div style={{ display: "grid", gap: 6, fontSize: 12 }}>
        {segments.map((seg, i) => (
          <div key={seg.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: seg.color || colors[i % colors.length] }} />
            <span>{seg.label}</span>
            <span className="mono" style={{ fontWeight: 700 }}>{seg.value.toLocaleString()} DZD</span>
            <span style={{ color: "var(--muted)" }}>({Math.round((seg.value / total) * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SvgVerticalBars({ data, height = 200, color = "var(--brand)" }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const barW = Math.min(48, Math.floor(320 / Math.max(data.length, 1)) - 8);
  return (
    <svg width="100%" height={height + 40} viewBox={`0 0 ${Math.max(data.length * (barW + 12), 200)} ${height + 40}`}
      preserveAspectRatio="xMidYMid meet" style={{ display: "block" }}>
      {data.map((d, i) => {
        const h = (d.value / max) * (height - 20);
        const x = i * (barW + 12) + 6;
        const y = height - h;
        return (
          <g key={d.label}>
            <rect x={x} y={y} width={barW} height={h} rx={4} fill={d.color || color} />
            <text x={x + barW / 2} y={height + 14} textAnchor="middle" fontSize="9" fill="var(--muted)">{d.label}</text>
            <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ink)">{d.value}</text>
          </g>
        );
      })}
    </svg>
  );
}

function SvgHorizontalBars({ data, width = 360, barH = 22 }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const h = data.length * (barH + 14) + 10;
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${width} ${h}`} preserveAspectRatio="xMidYMid meet">
      {data.map((d, i) => {
        const w = (d.value / max) * (width - 120);
        const y = i * (barH + 14) + 8;
        return (
          <g key={d.label}>
            <text x={0} y={y + barH / 2 + 4} fontSize="10" fill="var(--muted)">{d.label.slice(0, 18)}</text>
            <rect x={110} y={y} width={w} height={barH} rx={4} fill={d.color || "var(--brand)"} />
            <text x={110 + w + 6} y={y + barH / 2 + 4} fontSize="10" fontWeight="700" fill="var(--ink)">{d.value} j</text>
          </g>
        );
      })}
    </svg>
  );
}

function SvgStackedBars100({ data, height = 28 }) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {data.map((d) => (
        <div key={d.label} style={{ display: "grid", gridTemplateColumns: "72px 1fr 48px", gap: 8, alignItems: "center", fontSize: 11 }}>
          <span style={{ color: "var(--muted)", fontWeight: 600 }}>{d.label}</span>
          <div style={{ display: "flex", height, borderRadius: 6, overflow: "hidden", background: "#e8ece7" }}>
            {d.onTime > 0 && <div style={{ width: `${d.onTime}%`, background: "var(--brand)" }} title={`À temps ${d.onTime}%`} />}
            {d.late > 0 && <div style={{ width: `${d.late}%`, background: "var(--ko)" }} title={`En retard ${d.late}%`} />}
          </div>
          <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>{d.count} PO</span>
        </div>
      ))}
    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "Archivo" }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

function KpiCard({ label, value, unit, color, desc }) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".04em" }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "Archivo", color: color || "var(--brand)", marginTop: 4 }}>
        {value !== null && value !== undefined ? `${value}${unit || ""}` : "—"}
      </div>
      {desc && <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 6, lineHeight: 1.5 }}>{desc}</div>}
    </div>
  );
}

function KpiGaugeCard({ label, value, target, inverted, desc }) {
  return (
    <div className="card" style={{ padding: 16, textAlign: "center" }}>
      <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".04em" }}>{label}</div>
      <CircularGauge value={value} inverted={inverted} />
      {target && <div style={{ fontSize: 11, color: "var(--muted)" }}>Cible : {target}</div>}
      {desc && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{desc}</div>}
    </div>
  );
}

/* =========================================================================
   INTERFACE RESPONSABLE
   ========================================================================= */
export default function InterfaceResponsable({ dossiers, pos, updatePo }) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const printRef = useRef(null);

  const dossierByPo = useMemo(() => {
    const m = {};
    dossiers.forEach((d) => { m[d.poId] = d; });
    return m;
  }, [dossiers]);

  const filteredPos = useMemo(() => pos.filter((p) => {
    if (!inPeriod(p.dateEmission, filters.periode)) return false;
    if (filters.fournisseur && p.fournisseur !== filters.fournisseur) return false;
    if (filters.entite && p.entite !== filters.entite) return false;
    if (filters.port && mapPortFromPo(p) !== filters.port) return false;
    if (filters.transitaire) {
      const tr = mapTransitaire(dossierByPo[p.id]);
      if (tr !== filters.transitaire) return false;
    }
    return true;
  }), [pos, filters, dossierByPo]);

  const filteredDossiers = useMemo(() => {
    const ids = new Set(filteredPos.map((p) => p.id));
    return dossiers.filter((d) => ids.has(d.poId));
  }, [dossiers, filteredPos]);

  const fournisseursOptions = useMemo(() => {
    const inPeriodPos = pos.filter((p) => inPeriod(p.dateEmission, filters.periode));
    return [...new Set(inPeriodPos.map((p) => p.fournisseur))].sort();
  }, [pos, filters.periode]);

  const hasActiveFilters = filters.fournisseur || filters.entite || filters.transitaire || filters.port
    || filters.periode !== DEFAULT_FILTERS.periode;

  const enrich = useMemo(() => filteredPos.map((po) => ({
    po,
    crit: calcCriticite(po, filteredDossiers.some((d) => d.poId === po.id && d.validéAppro)),
  })), [filteredPos, filteredDossiers]);

  const critiques = enrich.filter((e) => ["Très critique", "Critique"].includes(e.crit.niveau));

  const fraisData = useMemo(() => {
    let mag = 0; let sur = 0; let am = 0; let totalMontant = 0; let hasAny = false;
    filteredPos.forEach((po) => {
      const d = dossierByPo[po.id];
      const f = getFraisPo(po, d);
      if (!f.simulated) hasAny = true;
      mag += f.mag; sur += f.sur; am += f.am;
      totalMontant += po.montant || 0;
    });
    const totalFrais = mag + sur + am;
    const pctMoyen = totalMontant > 0 ? ((totalFrais / totalMontant) * 100).toFixed(2) : null;
    return { mag, sur, am, totalFrais, pctMoyen, hasAny };
  }, [filteredPos, dossierByPo]);

  const fraisColor = fraisData.pctMoyen == null ? "var(--brand)"
    : +fraisData.pctMoyen > 3 ? "var(--ko)" : +fraisData.pctMoyen >= 2 ? "var(--warn)" : "var(--brand)";

  const posAvecEcart = filteredPos.filter((p) => p.deliveryDate && p.plannedReleaseDate);
  const ecartMoyen = posAvecEcart.length
    ? Math.round(posAvecEcart.reduce((s, p) => s + (daysBetween(p.plannedReleaseDate, p.deliveryDate) || 0), 0) / posAvecEcart.length)
    : null;
  const tauxLivraisonsTemps = posAvecEcart.length
    ? Math.round((posAvecEcart.filter((p) => p.deliveryDate <= p.plannedReleaseDate).length / posAvecEcart.length) * 100)
    : null;
  const nbRetard = posAvecEcart.filter((p) => p.deliveryDate > p.plannedReleaseDate).length;
  const tauxRetardDoc = filteredPos.filter((p) => p.packingDate && p.plannedReleaseDate).length
    ? Math.round((filteredPos.filter((p) => p.packingDate && p.plannedReleaseDate && p.packingDate > p.plannedReleaseDate).length
      / filteredPos.filter((p) => p.packingDate && p.plannedReleaseDate).length) * 100)
    : null;

  const chartB1 = useMemo(() => ENTITES_GRAPHIQUES.map((ent) => {
    const entPos = filteredPos.filter((p) => p.entite === ent);
    const entDos = entPos.map((p) => dossierByPo[p.id]).filter(Boolean);
    let onTime = 0; let late = 0;
    entDos.forEach((d) => {
      if (d.dateArrivee && d.dateDeclaration) {
        const del = daysBetween(d.dateArrivee, d.dateDeclaration);
        if (del != null && del <= 7) onTime += 1; else late += 1;
      } else {
        const sim = simHash(`${ent}-decl`, 0, 1);
        if (sim) onTime += 1; else late += 1;
      }
    });
    const count = onTime + late || entPos.length;
    if (!count) return { label: ent, onTime: 0, late: 0, count: 0 };
    const ot = count ? Math.round((onTime / count) * 100) : simHash(ent, 55, 85);
    return { label: ent, onTime: ot, late: 100 - ot, count: count || entPos.length };
  }).filter((d) => filteredPos.some((p) => p.entite === d.label)), [filteredPos, dossierByPo]);

  const chartB2 = useMemo(() => ENTITES_GRAPHIQUES.map((ent) => {
    const entPos = filteredPos.filter((p) => p.entite === ent);
    const withEta = entPos.filter((p) => p.eta && (p.factoryArrivalDate || p.portDepartureDate));
    if (withEta.length) {
      const avg = Math.round(withEta.reduce((s, p) => {
        const real = p.factoryArrivalDate || p.portDepartureDate;
        return s + (daysBetween(p.eta, real) || 0);
      }, 0) / withEta.length);
      return { label: ent, value: avg };
    }
    return { label: ent, value: simHash(`eta-${ent}`, 1, 12) };
  }), [filteredPos]);

  const chartC = useMemo(() => ENTITES_GRAPHIQUES.map((ent) => {
    const entDos = filteredDossiers.filter((d) => {
      const po = filteredPos.find((p) => p.id === d.poId);
      return po?.entite === ent && d.dateCreationDom && d.dateValidationDom;
    });
    if (entDos.length) {
      const avg = Math.round(entDos.reduce((s, d) => s + (daysBetween(d.dateCreationDom, d.dateValidationDom) || 0), 0) / entDos.length);
      return { label: ent, value: avg };
    }
    return { label: ent, value: simHash(`dom-${ent}`, 3, 18) };
  }), [filteredPos, filteredDossiers]);

  const chartD = useMemo(() => TRANSITAIRES_FIXES.map((tr) => {
    const trDos = filteredDossiers.filter((d) => mapTransitaire(d) === tr && d.dateArrivee && d.dateDeclaration);
    if (trDos.length) {
      const avg = Math.round(trDos.reduce((s, d) => s + (daysBetween(d.dateArrivee, d.dateDeclaration) || 0), 0) / trDos.length);
      return { label: tr, value: avg };
    }
    return { label: tr, value: simHash(`tr-${tr}`, 2, 11) };
  }), [filteredDossiers]);

  const chartE = useMemo(() => PORTS_ENTREE.map((port) => {
    const portDos = filteredDossiers.filter((d) => {
      const po = filteredPos.find((p) => p.id === d.poId);
      return mapPortFromPo(po || {}) === port && d.dateDeclaration && d.dateDedouanement;
    });
    if (portDos.length) {
      const avg = Math.round(portDos.reduce((s, d) => s + (daysBetween(d.dateDeclaration, d.dateDedouanement) || 0), 0) / portDos.length);
      return { label: port, value: avg };
    }
    return { label: port, value: simHash(`port-${port}`, 3, 14) };
  }), [filteredPos, filteredDossiers]);

  const chartF = useMemo(() => ENTITES_GRAPHIQUES.map((ent) => {
    const entDos = filteredDossiers.filter((d) => {
      const po = filteredPos.find((p) => p.id === d.poId);
      return po?.entite === ent && d.dateDemandeChèque && d.dateReceptionChèque;
    });
    if (entDos.length) {
      const avg = Math.round(entDos.reduce((s, d) => s + (daysBetween(d.dateDemandeChèque, d.dateReceptionChèque) || 0), 0) / entDos.length);
      return { label: ent, value: avg };
    }
    return { label: ent, value: simHash(`chq-${ent}`, 1, 8) };
  }), [filteredPos, filteredDossiers]);

  const doughnutSegments = useMemo(() => {
    if (!fraisData.hasAny) return [];
    return [
      { label: "Magasinage", value: fraisData.mag, color: "var(--brand)" },
      { label: "Surestaries", value: fraisData.sur, color: "var(--warn)" },
      { label: "Amendes", value: fraisData.am, color: "var(--ko)" },
    ].filter((s) => s.value > 0);
  }, [fraisData]);

  const handleExportExcel = useCallback(() => {
    const rows = [
      ["PO", "Fournisseur", "Entité", "Montant", "Frais approche %", "Niveau criticité", "Statut dossier"],
      ...enrich.map(({ po, crit }) => {
        const f = getFraisPo(po, dossierByPo[po.id]);
        const pct = po.montant ? ((f.total / po.montant) * 100).toFixed(2) : "";
        return [po.id, po.fournisseur, po.entite, po.montant, pct, crit.niveau, po.statutDossier || ""];
      }),
    ];
    const csv = "\uFEFF" + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `LogiDoc_Responsable_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [enrich, dossierByPo]);

  const handleExportPdf = useCallback(() => {
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return;
    const html = printRef.current?.innerHTML || "";
    w.document.write(`<!DOCTYPE html><html><head><title>LogiDoc — Interface Responsable</title>
      <style>
        body{font-family:Arial,sans-serif;padding:24px;color:#1A1F2C;font-size:12px}
        h1{font-size:20px;margin-bottom:8px} h2{font-size:14px;margin:18px 0 8px;border-bottom:1px solid #ddd;padding-bottom:4px}
        table{width:100%;border-collapse:collapse;margin:8px 0} th,td{border:1px solid #ddd;padding:6px 8px;text-align:left}
        th{background:#f6f8f5;font-size:10px;text-transform:uppercase}
        .card{border:1px solid #ddd;border-radius:8px;padding:12px;margin-bottom:12px}
      </style></head><body>
      <h1>LogiDoc-Import — Interface Responsable</h1>
      <p>Généré le ${new Date().toLocaleString("fr-FR")}</p>
      ${html}
      </body></html>`);
    w.document.close();
    w.onload = () => { w.focus(); w.print(); };
  }, []);

  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  return (
    <div ref={printRef} style={{ display: "grid", gap: 16 }}>

      {/* Filtres globaux */}
      <div className="card no-print" style={{ padding: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6, fontWeight: 600 }}>Période</div>
            <div style={{ display: "flex", gap: 4 }}>
              {[["mois", "Mois"], ["trimestre", "Trimestre"], ["annee", "Année"]].map(([k, lbl]) => (
                <button key={k} type="button" className="btn btn-g" onClick={() => setFilters((f) => ({ ...f, periode: k }))}
                  style={{ fontSize: 12, padding: "7px 12px", background: filters.periode === k ? "var(--brand)" : undefined, color: filters.periode === k ? "#fff" : undefined }}>
                  {lbl}
                </button>
              ))}
            </div>
          </div>
          <div style={{ minWidth: 160 }}>
            <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>Fournisseur</div>
            <select value={filters.fournisseur} onChange={(e) => setFilters((f) => ({ ...f, fournisseur: e.target.value }))}>
              <option value="">Tous</option>
              {fournisseursOptions.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div style={{ minWidth: 120 }}>
            <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>Entité</div>
            <select value={filters.entite} onChange={(e) => setFilters((f) => ({ ...f, entite: e.target.value }))}>
              <option value="">Toutes</option>
              {ENTITES_GRAPHIQUES.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div style={{ minWidth: 150 }}>
            <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>Transitaire</div>
            <select value={filters.transitaire} onChange={(e) => setFilters((f) => ({ ...f, transitaire: e.target.value }))}>
              <option value="">Tous</option>
              {TRANSITAIRES_FIXES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ minWidth: 150 }}>
            <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>Port</div>
            <select value={filters.port} onChange={(e) => setFilters((f) => ({ ...f, port: e.target.value }))}>
              <option value="">Tous</option>
              {PORTS_ENTREE.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          {hasActiveFilters && (
            <button type="button" className="btn btn-g" onClick={resetFilters} style={{ fontSize: 12 }}>Réinitialiser</button>
          )}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button type="button" className="btn btn-g" onClick={handleExportExcel}>Export Excel</button>
            <button type="button" className="btn btn-g" onClick={handleExportPdf}>Export PDF</button>
          </div>
        </div>
      </div>

      {/* KPI principaux — 3 cartes */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
        <KpiCard label="Dossiers actifs" value={filteredPos.length} color="var(--brand)" />
        <KpiCard label="Dossiers critiques" value={critiques.length}
          color={critiques.length > 0 ? "var(--ko)" : "var(--brand)"} />
        <KpiCard label="Frais d'approche" value={fraisData.pctMoyen} unit="%"
          color={fraisColor}
          desc="Objectif : maintenir les frais d'approche inférieurs à 2 % de la valeur de la marchandise." />
      </div>

      {/* KPI Performance Logistique */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)", background: "#f6f8f5" }}>
          <h3 style={{ fontSize: 14, margin: 0 }}>📦 KPI Performance Logistique</h3>
          <p style={{ fontSize: 12, color: "var(--muted)", margin: "3px 0 0" }}>De la mise à disposition fournisseur à la livraison finale</p>
        </div>
        <div style={{ padding: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
          <KpiCard label="Écart moyen Delivery / Release"
            value={ecartMoyen !== null ? (ecartMoyen > 0 ? `+${ecartMoyen}` : ecartMoyen) : null}
            unit=" j" color={ecartMoyen !== null && ecartMoyen > 0 ? "var(--ko)" : "var(--brand)"}
            desc="Cible ≤ 0 j · Positif = retard" />
          <KpiGaugeCard label="Taux livraisons à temps" value={tauxLivraisonsTemps} target="≥ 80%"
            desc={posAvecEcart.length ? `Sur ${posAvecEcart.length} PO` : "Aucune donnée"} />
          <KpiCard label="Dossiers en retard" value={nbRetard}
            color={nbRetard > 0 ? "var(--ko)" : "var(--brand)"}
            desc="Delivery Date > Planned Release Date" />
          <KpiGaugeCard label="Taux retard doc. fournisseur" value={tauxRetardDoc} target="≤ 15%" inverted
            desc="Packing Date > Planned Release Date" />
        </div>
      </div>

      {/* Tableau de bord analytique — 6 graphiques */}
      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "Archivo", color: "var(--muted)" }}>Tableau de bord analytique</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 16 }}>
          <ChartCard title="A. Répartition des frais d'approche" subtitle="Magasinage · Surestaries · Amendes">
            <SvgDoughnut segments={doughnutSegments} />
          </ChartCard>
          <ChartCard title="B.1 Dossiers à temps / en retard par entité" subtitle="Déclaration ≤ 7 j après arrivée">
            <SvgStackedBars100 data={chartB1} />
            <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 11 }}>
              <span><span style={{ display: "inline-block", width: 10, height: 10, background: "var(--brand)", borderRadius: 2, marginRight: 4 }} />À temps</span>
              <span><span style={{ display: "inline-block", width: 10, height: 10, background: "var(--ko)", borderRadius: 2, marginRight: 4 }} />En retard</span>
            </div>
          </ChartCard>
          <ChartCard title="B.2 Délai moyen d'arrivée par entité" subtitle="Écart ETA prévue vs arrivée réelle (j)">
            <SvgVerticalBars data={chartB2} />
          </ChartCard>
          <ChartCard title="C. Délai moyen de domiciliation par entité" subtitle="Création → validation (j)">
            <SvgVerticalBars data={chartC} color="var(--accent)" />
          </ChartCard>
          <ChartCard title="D. Délai réception/déclaration par transitaire" subtitle="Arrivée → déclaration (j)">
            <SvgHorizontalBars data={chartD} />
          </ChartCard>
          <ChartCard title="E. Délai de dédouanement par port" subtitle="Déclaration → dédouanement (j)">
            <SvgHorizontalBars data={chartE} />
          </ChartCard>
          <ChartCard title="F. Délai traitement chèques par entité" subtitle="Demande → réception (j)">
            <SvgVerticalBars data={chartF} color="var(--brand-d)" />
          </ChartCard>
        </div>
      </div>

      {/* Tableau Delivery / Release */}
      {posAvecEcart.length > 0 && (
        <div className="card">
          <SectionTitle t="Détail Écart Delivery / Release Date" s="Delivery Date − Release Date (jours) · Positif = retard de livraison" />
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead><tr><th>PO</th><th>Fournisseur</th><th>Planned Release Date</th><th>Delivery Date</th><th>Écart (j)</th><th>Résultat</th></tr></thead>
              <tbody>{posAvecEcart.map((p) => {
                const ecart = daysBetween(p.plannedReleaseDate, p.deliveryDate) || 0;
                return (
                  <tr key={p.id}>
                    <td className="mono">{p.id}</td><td>{p.fournisseur}</td>
                    <td>{p.plannedReleaseDate}</td><td>{p.deliveryDate}</td>
                    <td className="mono" style={{ fontWeight: 700, color: ecart > 0 ? "var(--ko)" : "var(--brand-d)" }}>
                      {ecart > 0 ? `+${ecart}` : ecart}
                    </td>
                    <td>{ecart > 0
                      ? <span className="pill" style={{ background: "#fbe6e3", color: "var(--ko)" }}>En retard</span>
                      : <span className="pill" style={{ background: "var(--brand-l)", color: "var(--brand-d)" }}>À temps</span>}
                    </td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cartographie des risques */}
      <div className="card">
        <SectionTitle t="Cartographie des risques — moteur de criticité"
          s="Priorisation automatique par score pondéré (urgence 5 · documents 4 · pays 2 · fournisseur 2)" />
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>PO</th><th>Fournisseur</th><th>Origine</th><th>Classe</th><th>ETA</th>
                <th>Score</th><th>Niveau de criticité</th><th>Statut dossier</th>
              </tr>
            </thead>
            <tbody>{enrich.sort((a, b) => b.crit.score - a.crit.score).map(({ po, crit }) => (
              <tr key={po.id}>
                <td className="mono">{po.id}</td><td>{po.fournisseur}</td><td>{po.paysOrigine}</td>
                <td><span className="pill" style={{ background: "#f1f1ee", color: "var(--muted)" }}>{po.classeFourn}</span></td>
                <td>{po.eta}</td>
                <td className="mono"><strong>{crit.score.toFixed(2)}</strong></td>
                <td><StatutPill s={crit.niveau} /></td>
                <td>
                  <select value={po.statutDossier || "En cours"} style={{ fontSize: 12, padding: "6px 8px" }}
                    onChange={(e) => updatePo?.(po.id, { statutDossier: e.target.value })}>
                    {STATUTS_DOSSIER.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>

      {/* Performance & blocages */}
      <div className="card">
        <SectionTitle t="Performance & blocages" s="Suivi des délais, surestaries et performance fournisseurs / transitaires" />
        <div style={{ padding: 16, display: "grid", gap: 10 }}>
          {filteredPos.map((po) => {
            const sent = filteredDossiers.some((d) => d.poId === po.id);
            const pct = sent ? 100 : 30;
            return (
              <div key={po.id} style={{ fontSize: 12.5 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span className="mono">{po.id} · {po.fournisseur}</span>
                  <span style={{ color: "var(--muted)" }}>{sent ? "Dossier transmis" : "Documents en cours"}</span>
                </div>
                <div style={{ height: 6, background: "#e8ece7", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: sent ? "var(--brand)" : "var(--accent)", transition: ".4s" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
