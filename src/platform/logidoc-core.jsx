import React, { useState, useMemo, useCallback } from "react";
import { printDocument, buildPrintFields, buildPrintTable, printModuleReport } from "../utils/print";
import InterfaceResponsable from "./InterfaceResponsable";

/* =========================================================================
   LOGIDOC-IMPORT — Plateforme digitale de gestion du processus d'importation
   5 interfaces : Fournisseur · Approvisionnement · Transit · Trésorerie · Management
   Contrôle de conformité documentaire par IA (checklist Holcim Algérie)
   ========================================================================= */

/* ----------------------------- Données de référence ---------------------- */

const ENTITES = [
  { code: "LCM", nom: "LAFARGE CIMENT DE M'SILA (LCM) SPA", nif: "000116001686837" },
  { code: "LCO", nom: "LAFARGE CIMENT OGGAZ (LCO) SPA", nif: "000416096604709" },
  { code: "CILAS", nom: "CILAS SPA", nif: "001216099109235" },
  { code: "CMA", nom: "Ciments et Mortiers Algérie SPA (CMA)", nif: "001516104228660" },
  { code: "LS", nom: "Lafarge Sacs SPA (LS)", nif: "099934046237596" },
  { code: "LSA", nom: "LAFARGE SERVICES ALGERIE SPA (LSA)", nif: "000716097795023" },
  { code: "SAA", nom: "STATION D'AGREGATS AZROU SPA (SAA)", nif: "000034046257243" },
];

const INCOTERMS = [
  "CFR PORT DE BEJAIA", "CFR PORT D'ALGER", "CFR PORT DE DJENDJEN",
  "CFR PORT DE SKIKDA", "CFR PORT D'ORAN", "CFR PORT DE MOSTAGANEM",
  "FOB PORT (port de chargement)", "FCA AEROPORT (aéroport de chargement)",
  "CPT AEROPORT D'ALGER", "CPT AEROPORT D'ORAN", "DAP",
];

const PAYMENT_TERMS = [
  "TRANSFERT LIBRE", "REMISE DOCUMENTAIRE A VUE",
  "REMISE DOCUMENTAIRE A 60 JOURS DATE RECEPTION FACTURE",
  "REMISE DOCUMENTAIRE A 60 JOURS DATE BL", "LETTRE DE CRÉDIT",
];

const BANNED_FORWARDERS = ["UCT", "SOPHIMEX", "5 LOGISTIQUE"];

/* Standard Lead Time par pays d'origine (jours de transit maritime/aérien vers l'Algérie) */
const LEAD_TIME_PAR_PAYS = {
  // Europe
  "Allemagne":    { maritime: 12, aerien: 3,  note: "Via port Hambourg → Bejaia / Alger" },
  "France":       { maritime: 8,  aerien: 2,  note: "Via Marseille / Le Havre → Alger" },
  "Italie":       { maritime: 7,  aerien: 2,  note: "Via Gênes / Naples → Oran / Bejaia" },
  "Espagne":      { maritime: 6,  aerien: 2,  note: "Via Barcelone / Valence → Alger" },
  "Belgique":     { maritime: 13, aerien: 3,  note: "Via Anvers → Alger" },
  "Pays-Bas":     { maritime: 14, aerien: 3,  note: "Via Rotterdam → Alger" },
  "Turquie":      { maritime: 10, aerien: 3,  note: "Via Mersin / Istanbul → Bejaia" },
  "Royaume-Uni":  { maritime: 14, aerien: 3,  note: "Via Felixstowe → Alger" },
  "Portugal":     { maritime: 9,  aerien: 3,  note: "Via Lisbonne → Alger" },
  "Suède":        { maritime: 18, aerien: 4,  note: "Via Göteborg → Alger (transbordement)" },
  // Asie
  "Chine":        { maritime: 28, aerien: 6,  note: "Via Shanghai / Ningbo → Alger (transbordement)" },
  "Japon":        { maritime: 32, aerien: 5,  note: "Via Tokyo / Osaka → Alger" },
  "Corée du Sud": { maritime: 30, aerien: 5,  note: "Via Busan → Alger" },
  "Inde":         { maritime: 20, aerien: 4,  note: "Via Nhava Sheva → Alger" },
  "Singapour":    { maritime: 22, aerien: 5,  note: "Hub transbordement → Alger" },
  "Malaisie":     { maritime: 24, aerien: 5,  note: "Via Port Klang → Alger" },
  "Taiwan":       { maritime: 30, aerien: 5,  note: "Via Kaohsiung → Alger" },
  // Amériques
  "États-Unis":   { maritime: 18, aerien: 5,  note: "Via New York / Houston → Alger" },
  "Canada":       { maritime: 20, aerien: 6,  note: "Via Montréal → Alger" },
  "Brésil":       { maritime: 22, aerien: 6,  note: "Via Santos → Alger" },
  // Afrique / Moyen-Orient
  "Égypte":       { maritime: 5,  aerien: 2,  note: "Via Port-Saïd / Alexandrie → Alger" },
  "Maroc":        { maritime: 4,  aerien: 1,  note: "Via Casablanca → Alger" },
  "Émirats Arabes Unis": { maritime: 14, aerien: 4, note: "Via Jebel Ali → Alger" },
  "Arabie Saoudite":     { maritime: 12, aerien: 4, note: "Via Dammam / Djeddah → Alger" },
};

/* Types de documents + checklists (issus du fichier "Template and document check list") */
const DOC_TYPES = {
  FACTURE: {
    label: "Facture commerciale originale", short: "Facture", obligatoire: true, qte: "05 originaux",
    checklist: [
      "Date présente", "Référence facture", "Numéro de PO", "Détail fournisseur complet",
      "Client (consignée) en français : raison sociale, adresse, NIF",
      "Incoterm valide", "Payment term (réf. LC si applicable)", "Place of loading",
      "Nombre d'articles = PO", "Description des marchandises", "Origine des marchandises",
      "Code HS supprimé", "Quantité = PO", "Prix unitaire = PO", "Contrôle des coûts FOB",
      "Coût du fret si CFR / CPT", "Total = calcul du PO",
      "Mesures + poids brut/net reportés sur la packing list", "Signature & cachet humide",
    ],
  },
  PACKING: {
    label: "Packing List originale", short: "Packing List", obligatoire: true, qte: "01 original",
    checklist: [
      "Shipper", "Consignée en français (raison sociale, adresse, NIF)", "N° facture",
      "Date", "Numéro de PO", "Dimensions des colis", "Description des marchandises = PO",
      "Poids brut (Gross weight)", "Poids net (Net weight)",
    ],
  },
  BL: {
    label: "Bill of Lading (transport maritime)", short: "B/L", obligatoire: true, qte: "3/3 originaux",
    checklist: [
      "Shipper", "Consignée en français (raison sociale, adresse, NIF)",
      "Notify en français", "Vessel (navire)", "Port of loading", "Port of discharge",
      "Nombre et type de colis = facture", "Poids brut / tare = packing list",
      "Mesures CBM = packing list", "Prepaid / Collect (CFR & FOB & CPT & DAP)",
      "Shipped on Board date mentionnée", "LCL ou FCL", "Numéro de conteneur",
      "Port of discharge = Delivery place",
      "Forwarder autorisé (≠ UCT, SOPHIMEX, 5 LOGISTIQUE)",
    ],
  },
  LTA: {
    label: "LTA / Air Waybill (transport aérien)", short: "LTA", obligatoire: false, qte: "selon mode",
    checklist: [
      "Shipper's name", "Consignee en français (raison sociale, adresse, NIF)",
      "Gross weight = packing list", "Total prepaid (fret facture ou « AS AGREED »)",
    ],
  },
  COO: {
    label: "Certificat d'origine (Chambre de commerce)", short: "C.O.", obligatoire: true, qte: "01 original",
    checklist: [
      "Shipper", "Consignée en français (raison sociale, adresse, NIF)",
      "Origine des marchandises = facture", "Item = PO", "Description = PO",
      "Poids brut / quantité = packing list", "Cachet de la chambre de commerce",
    ],
  },
  EUR1: {
    label: "EUR 1 (si marchandise d'Europe)", short: "EUR 1", obligatoire: false, qte: "01 original si Europe",
    checklist: [
      "Shipper", "Consignée en français (raison sociale, adresse, NIF)",
      "Origine des marchandises = facture", "Description = PO",
      "Poids brut / quantité = packing list", "Cachet des douanes + cachet shipper",
    ],
  },
  COC: {
    label: "Certificat de conformité (COC)", short: "COC", obligatoire: true, qte: "01 original",
    checklist: [
      "Shipper", "Consignée en français (raison sociale, adresse, NIF)",
      "Référence facture = facture", "Date",
    ],
  },
  EX1: {
    label: "EX1 (copie)", short: "EX1", obligatoire: false, qte: "01 copie",
    checklist: [
      "Vérifier shipper ou fabricant", "Gross weight = packing list", "Montant = facture",
    ],
  },
};

const ROLES = [
  { id: "management", nom: "Responsable / Management", desc: "Pilotage, KPI globaux et supervision des départements" },
  { id: "fournisseur", nom: "Fournisseur", desc: "Dépôt et contrôle des documents d'importation"  },
  { id: "approvisionnement", nom: "Approvisionnement", desc: "Gestion des PO et validation documentaire" },
  { id: "transit", nom: "Transit", desc: "Suivi douanier, dédouanement et coûts" },
  { id: "tresorerie", nom: "Trésorerie", desc: "Domiciliation et demandes de chèque" },
];

/* ----------------------------- Données initiales -------------------------- */

const todayISO = () => new Date().toISOString().slice(0, 10);
const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

const INITIAL_POS = [
  {
    id: "PO-2026-0142", entite: "LCM", fournisseur: "SIKA Deutschland GmbH", paysOrigine: "Allemagne",
    montant: 84500, devise: "EUR", incoterm: "CFR PORT DE BEJAIA", classeFourn: "B",
    dateEmission: addDays(-22), eta: addDays(6), statut: "Validée", marchandiseArrivee: false,
    description: "Additifs de mouture pour ciment - 24 fûts", articles: 1, paymentTerm: "REMISE DOCUMENTAIRE A VUE",
    plannedReleaseDate: addDays(-5),
    packingDate: "", goodsReady: false,
    portDepartureDate: "", portDepartureOnTime: null,
    factoryArrivalDate: "", factoryArrivalOnTime: null,
    deliveryDate: "",
  },
  {
    id: "PO-2026-0151", entite: "CILAS", fournisseur: "Shanghai Refractory Co.", paysOrigine: "Chine",
    montant: 121000, devise: "USD", incoterm: "CFR PORT D'ALGER", classeFourn: "C",
    dateEmission: addDays(-30), eta: addDays(18), statut: "Validée", marchandiseArrivee: false,
    description: "Briques réfractaires four - 2 conteneurs 40'", articles: 3, paymentTerm: "LETTRE DE CRÉDIT",
    plannedReleaseDate: addDays(3),
    packingDate: "", goodsReady: false,
    portDepartureDate: "", portDepartureOnTime: null,
    factoryArrivalDate: "", factoryArrivalOnTime: null,
    deliveryDate: "",
  },
  {
    id: "PO-2026-0138", entite: "LCO", fournisseur: "Fournisseur A (Italie)", paysOrigine: "Italie",
    montant: 46200, devise: "EUR", incoterm: "CFR PORT D'ORAN", classeFourn: "A",
    dateEmission: addDays(-35), eta: addDays(-2), statut: "Validée", marchandiseArrivee: true,
    arriveeDepuis: 2, description: "Pièces de rechange broyeur", articles: 5, paymentTerm: "TRANSFERT LIBRE",
    plannedReleaseDate: addDays(-18),
    packingDate: addDays(-16), goodsReady: true,
    portDepartureDate: addDays(-14), portDepartureOnTime: true,
    factoryArrivalDate: addDays(-2), factoryArrivalOnTime: false,
    deliveryDate: addDays(-2),
  },
];

/* ----------------------------- Moteur de criticité ------------------------ */
function calcCriticite(po, docsComplets) {
  // Urgence opérationnelle (poids 5)
  let urgence = 0;
  if (po.marchandiseArrivee && (po.arriveeDepuis || 0) > 5) urgence = 1.0;
  else if (po.marchandiseArrivee) urgence = 0.75;
  else {
    const jours = Math.round((new Date(po.eta) - new Date()) / 86400000);
    if (jours < 7) urgence = 0.5; else if (jours <= 15) urgence = 0.25; else urgence = 0;
  }
  // Disponibilité documentaire (poids 4)
  let docs = 0;
  if (docsComplets) docs = 0;
  else if (po.marchandiseArrivee) docs = 1.0;
  else {
    const jours = Math.round((new Date(po.eta) - new Date()) / 86400000);
    if (jours < 7) docs = 0.75; else if (jours <= 15) docs = 0.5; else docs = 0.25;
  }
  // Pays d'origine (poids 2)
  const europe = ["Allemagne", "France", "Espagne", "Italie", "Belgique"];
  const moyen = ["Turquie", "Royaume-Uni", "Égypte", "Singapour"];
  let pays = 0;
  if (europe.includes(po.paysOrigine)) pays = 1.0; else if (moyen.includes(po.paysOrigine)) pays = 0.5; else pays = 0;
  // Fournisseur ABC (poids 2)
  const fourn = po.classeFourn === "A" ? 1.0 : po.classeFourn === "B" ? 0.5 : 0;
  const score = (urgence * 5 + docs * 4 + pays * 2 + fourn * 2) / 13;
  // Règles d'escalade
  let niveau;
  if (po.marchandiseArrivee && !docsComplets) niveau = "Très critique";
  else if (po.marchandiseArrivee && (po.arriveeDepuis || 0) > 5) niveau = "Très critique";
  else if (score >= 0.8) niveau = "Très critique";
  else if (score >= 0.6) niveau = "Critique";
  else if (score >= 0.35) niveau = "Moyen";
  else niveau = "Normal";
  return { score: Math.round(score * 100) / 100, niveau };
}

/* ----------------------------- Styles globaux ----------------------------- */
const Style = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');
    .ld * { box-sizing: border-box; }
    .ld {
      --bg:#F4F7F0; --panel:#FFFFFF; --ink:#1A1F2C; --muted:#5A6478; --line:#D4DFC8;
      --brand:#8AC43D; --brand-d:#6FA32E; --brand-l:#CADFB3; --accent:#0B2362;
      --ok:#8AC43D; --warn:#b3760a; --ko:#c0392b; --crit:#7a1d12;
      --dark:#0B2362; --dark-2:#1A3A7A; --navy:#1A3A7A; --mint:#CADFB3;
      --green-light:#BAD697; --green-pale:#CADFB3;
      font-family:'IBM Plex Sans',system-ui,sans-serif; color:var(--ink);
      background:var(--bg); min-height:100%; -webkit-font-smoothing:antialiased;
    }
    .ld h1,.ld h2,.ld h3,.ld h4 { font-family:'Archivo',sans-serif; margin:0; letter-spacing:-.01em; }
    .ld .mono { font-family:'IBM Plex Mono',monospace; }
    .ld button { font-family:inherit; cursor:pointer; border:none; }
    .ld input,.ld select,.ld textarea { font-family:inherit; font-size:13px; color:var(--ink);
      background:#fbfcfb; border:1px solid var(--line); border-radius:8px; padding:9px 11px; width:100%; }
    .ld input:focus,.ld select:focus,.ld textarea:focus { outline:none; border-color:var(--brand); box-shadow:0 0 0 3px var(--brand-l); }
    .ld .pill { display:inline-flex; align-items:center; gap:5px; font-size:11px; font-weight:600;
      padding:3px 9px; border-radius:999px; line-height:1.4; white-space:nowrap; }
    .ld .card { background:var(--panel); border:1px solid var(--line); border-radius:14px;
      box-shadow:0 2px 8px rgba(11,31,58,0.06); transition:box-shadow .25s, transform .25s; }
    .ld .card:hover { box-shadow:0 8px 24px rgba(11,31,58,0.1); }
    .ld .skeleton, .ld-skeleton { background:linear-gradient(90deg,#eef2f0 25%,#e0e8e4 50%,#eef2f0 75%); background-size:200% 100%; animation:sk 1.5s infinite; border-radius:8px; }
    @keyframes sk { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
    .ld .slide-in { animation:sl .4s ease; }
    @keyframes sl { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:none} }
    .ld table { width:100%; border-collapse:collapse; font-size:12.5px; }
    .ld th { text-align:left; font-weight:600; color:var(--muted); font-size:11px; text-transform:uppercase;
      letter-spacing:.04em; padding:9px 12px; border-bottom:1px solid var(--line); background:#f6f8f5; }
    .ld td { padding:10px 12px; border-bottom:1px solid var(--line); vertical-align:middle; }
    .ld tr:last-child td { border-bottom:none; }
    .ld .btn { display:inline-flex; align-items:center; gap:7px; font-weight:600; font-size:13px;
      padding:9px 16px; border-radius:9px; transition:.15s; }
    .ld .btn-p { background:var(--brand); color:#fff; }
    .ld .btn-p:hover { background:var(--brand-d); }
    .ld .btn-p:disabled { background:#b9c4bd; cursor:not-allowed; }
    .ld .btn-g { background:#eef1ed; color:var(--ink); border:1px solid var(--line); }
    .ld .btn-g:hover { background:#e3e8e2; }
    .ld .spin { width:15px;height:15px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:sp .7s linear infinite; }
    @keyframes sp { to { transform:rotate(360deg);} }
    .ld .fade { animation:fd .35s ease; }
    @keyframes fd { from { opacity:0; transform:translateY(6px);} to { opacity:1; transform:none;} }
  `}</style>
);

/* Helpers d'affichage */
const StatutPill = ({ s }) => {
  const map = {
    Conforme: ["var(--brand-l)", "var(--brand-d)"], "Non conforme": ["#E8EEF8", "#0B2362"],
    "En attente": ["#f1f1ee", "var(--muted)"], "À vérifier": ["#E8EEF8", "#0B2362"],
    Validé: ["var(--brand-l)", "var(--brand-d)"], Envoyé: ["#E8EEF8", "#0B2362"],
    Refusé: ["#DBEAFE", "#0B2362"], "Très critique": ["#E8EEF8", "#0B2362"],
    Critique: ["#DBEAFE", "#0B2362"], Moyen: ["#DCFCE7", "#8AC43D"], Normal: ["var(--brand-l)", "var(--brand-d)"],
  };
  const [bg, c] = map[s] || ["#f1f1ee", "var(--muted)"];
  return <span className="pill" style={{ background: bg, color: c }}>{s}</span>;
};

/* =========================================================================
   COMPOSANT : Carte de dépôt + contrôle IA d'un document (Interface Fournisseur)
   ========================================================================= */
function DocumentCard({ typeKey, po, doc, onUpdate }) {
  const t = DOC_TYPES[typeKey];
  const [content, setContent] = useState(doc?.content || "");
  const [fileName, setFileName] = useState(doc?.fileName || "");
  const [checking, setChecking] = useState(false);
  const [open, setOpen] = useState(false);
  const result = doc?.result;

  const ruleBasedCheck = useCallback(() => {
    // Contrôle local de secours si l'API n'est pas disponible
    const txt = content.toLowerCase();
    const ent = ENTITES.find((e) => e.code === po.entite);
    const items = t.checklist.map((label) => {
      const l = label.toLowerCase();
      let status = "warn", comment = "À vérifier manuellement";
      if (l.includes("nif") || l.includes("consignée") || l.includes("consignee")) {
        const ok = ent && (txt.includes(ent.nif) || txt.includes(ent.code.toLowerCase()));
        status = ok ? "ok" : "ko"; comment = ok ? "Consignée détectée" : `NIF/consignée ${ent?.code} introuvable`;
      } else if (l.includes("po") && l.includes("numéro")) {
        const ok = txt.includes(po.id.toLowerCase()); status = ok ? "ok" : "ko";
        comment = ok ? "PO référencé" : `PO ${po.id} absent`;
      } else if (l.includes("incoterm")) {
        const ok = txt.includes(po.incoterm.toLowerCase().slice(0, 8)); status = ok ? "ok" : "warn";
        comment = ok ? "Incoterm cohérent" : "Incoterm à confirmer";
      } else if (l.includes("forwarder")) {
        const banned = BANNED_FORWARDERS.find((f) => txt.includes(f.toLowerCase()));
        status = banned ? "ko" : "ok"; comment = banned ? `Forwarder interdit: ${banned}` : "Forwarder autorisé";
      } else if (content.trim().length > 30) { status = "ok"; comment = "Présent dans le document"; }
      return { label, status, comment };
    });
    const conforme = items.every((i) => i.status !== "ko");
    return { items, conforme, synthese: conforme ? "Document conforme (contrôle local)." : "Anomalies détectées (contrôle local)." };
  }, [content, po, t]);

  const runAICheck = async () => {
    if (content.trim().length < 15) return;
    setChecking(true); setOpen(true);
    const ent = ENTITES.find((e) => e.code === po.entite);
    const sys = `Tu es le moteur de contrôle de conformité documentaire de la plateforme LOGIDOC-Import (import Holcim Algérie).
Tu vérifies un document d'importation point par point selon une checklist officielle.
Réponds UNIQUEMENT par un objet JSON valide, sans texte avant/après, sans backticks, au format :
{"items":[{"label":"...","status":"ok|ko|warn","comment":"court, en français"}],"conforme":true|false,"synthese":"1 phrase en français"}
Règles: status "ko" = bloquant (non conforme), "warn" = à vérifier (non bloquant), "ok" = conforme.
Le champ "conforme" est true seulement si AUCUN item n'est en "ko".`;
    const usr = `TYPE DE DOCUMENT: ${t.label}
DONNÉES DE RÉFÉRENCE DU PO (pour recoupement):
- N° PO: ${po.id}
- Entité / Consignée attendue: ${ent?.nom} — NIF ${ent?.nif}
- Fournisseur (shipper): ${po.fournisseur}
- Incoterm attendu: ${po.incoterm}
- Payment term: ${po.paymentTerm}
- Devise/Montant: ${po.montant} ${po.devise}
- Nombre d'articles: ${po.articles}
- Description: ${po.description}
- Forwarders interdits: ${BANNED_FORWARDERS.join(", ")}

CHECKLIST À CONTRÔLER (un item par point):
${t.checklist.map((c, i) => `${i + 1}. ${c}`).join("\n")}

CONTENU DU DOCUMENT DÉPOSÉ PAR LE FOURNISSEUR:
"""${content}"""

Contrôle chaque point de la checklist par rapport au contenu et aux données du PO.`;
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000,
          messages: [{ role: "user", content: `${sys}\n\n${usr}` }],
        }),
      });
      const data = await resp.json();
      const text = (data.content || []).map((i) => (i.type === "text" ? i.text : "")).join("");
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      onUpdate(typeKey, { content, fileName, result: parsed, statut: parsed.conforme ? "Conforme" : "Non conforme" });
    } catch (e) {
      const fb = ruleBasedCheck();
      onUpdate(typeKey, { content, fileName, result: fb, statut: fb.conforme ? "Conforme" : "Non conforme", fallback: true });
    } finally { setChecking(false); }
  };

  const handleFile = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    setFileName(f.name);
    const r = new FileReader();
    r.onload = () => {
      const text = String(r.result || "");
      // Pour fichiers texte ; pour PDF binaire on garde au moins le nom + contenu saisi
      if (text && !text.startsWith("%PDF") && text.length < 60000) setContent(text);
    };
    r.readAsText(f);
  };

  const statut = doc?.statut || "En attente";
  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderBottom: open ? "1px solid var(--line)" : "none" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <strong style={{ fontSize: 13.5 }}>{t.label}</strong>
            {t.obligatoire ? <span className="pill" style={{ background: "#fdf2dc", color: "var(--warn)" }}>Obligatoire</span>
              : <span className="pill" style={{ background: "#f1f1ee", color: "var(--muted)" }}>Selon mode</span>}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>Quantité requise : {t.qte}</div>
        </div>
        <StatutPill s={statut} />
        <button className="btn btn-g" onClick={() => setOpen((o) => !o)} style={{ padding: "6px 12px" }}>
          {open ? "Réduire" : "Ouvrir"}
        </button>
      </div>

      {open && (
        <div className="fade" style={{ padding: 16, display: "grid", gap: 12 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <label className="btn btn-g" style={{ position: "relative" }}>
              📎 Joindre un fichier
              <input type="file" onChange={handleFile} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
            </label>
            {fileName && <span className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>{fileName}</span>}
            {(fileName || content.trim()) && (
              <button type="button" className="btn btn-g no-print" style={{ padding: "6px 12px", fontSize: 12 }}
                onClick={() => printDocument({ fileName, content, poId: po.id, docType: t.label })}>
                🖨 Imprimer
              </button>
            )}
          </div>
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 5 }}>
              Contenu / champs clés du document (texte extrait du PDF ou saisie manuelle)
            </label>
            <textarea rows={5} value={content} placeholder={`Collez ici le texte du document ou saisissez les champs clés (consignée, NIF, n° PO, incoterm, poids, montant...)`}
              onChange={(e) => setContent(e.target.value)} />
          </div>

          <details>
            <summary style={{ fontSize: 12, color: "var(--brand-d)", fontWeight: 600, cursor: "pointer" }}>
              Voir la checklist de contrôle ({t.checklist.length} points)
            </summary>
            <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 12, color: "var(--muted)", lineHeight: 1.7 }}>
              {t.checklist.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </details>

          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-p" onClick={runAICheck} disabled={checking || content.trim().length < 15}>
              {checking ? <><span className="spin" /> Analyse IA…</> : <> Vérifier la conformité (IA)</>}
            </button>
          </div>

          {result && (
            <div className="fade card" style={{ padding: 14, background: result.conforme ? "var(--brand-l)" : "#fbe6e3", borderColor: result.conforme ? "#bfe3cd" : "#f3c9c3" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <strong style={{ color: result.conforme ? "var(--brand-d)" : "var(--ko)", fontSize: 14 }}>
                  {result.conforme ? "✓ Document conforme — prêt à l'envoi" : "✗ Document non conforme — envoi bloqué"}
                </strong>
                {doc?.fallback && <span className="pill" style={{ background: "#fff", color: "var(--muted)" }}>contrôle local</span>}
              </div>
              <p style={{ margin: "0 0 10px", fontSize: 12.5 }}>{result.synthese}</p>
              <div style={{ display: "grid", gap: 5 }}>
                {result.items.map((it, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12, background: "#fff", padding: "6px 9px", borderRadius: 7 }}>
                    <span style={{ color: it.status === "ok" ? "var(--ok)" : it.status === "ko" ? "var(--ko)" : "var(--warn)", fontWeight: 700 }}>
                      {it.status === "ok" ? "✓" : it.status === "ko" ? "✕" : "!"}
                    </span>
                    <span style={{ flex: 1 }}><strong>{it.label}</strong> — <span style={{ color: "var(--muted)" }}>{it.comment}</span></span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   INTERFACE FOURNISSEUR
   ========================================================================= */
function InterfaceFournisseur({ pos, docsByPo, setDocsByPo, dossiers, sendToAppro, updatePo }) {
  const myPos = pos;
  const [selPo, setSelPo] = useState(myPos[0]?.id);
  const po = myPos.find((p) => p.id === selPo);
  const docs = docsByPo[selPo] || {};

  const europe = ["Allemagne", "France", "Espagne", "Italie", "Belgique"];
  const requis = Object.keys(DOC_TYPES).filter((k) => {
    if (DOC_TYPES[k].obligatoire) return true;
    if (k === "EUR1") return europe.includes(po?.paysOrigine);
    return false;
  });

  const updateDoc = (typeKey, payload) =>
    setDocsByPo((prev) => ({ ...prev, [selPo]: { ...(prev[selPo] || {}), [typeKey]: { ...(prev[selPo]?.[typeKey] || {}), ...payload } } }));

  const conformes = requis.filter((k) => docs[k]?.statut === "Conforme").length;
  const tousConformes = requis.length > 0 && conformes === requis.length;
  const dejaEnvoye = dossiers.some((d) => d.poId === selPo);

  const IndicBadge = ({ val }) => {
    if (val === null || val === undefined) return <span className="pill" style={{ background: "#f1f1ee", color: "var(--muted)" }}>—</span>;
    return val
      ? <span className="pill" style={{ background: "var(--brand-l)", color: "var(--brand-d)" }}>✓ À temps</span>
      : <span className="pill" style={{ background: "#fbe6e3", color: "var(--ko)" }}>✕ En retard</span>;
  };

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div className="card" style={{ padding: 18 }}>
        <h3 style={{ fontSize: 16, marginBottom: 4 }}>Dépôt documentaire</h3>
        <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
          Sélectionnez une commande, déposez les documents requis puis lancez le contrôle de conformité IA.
          Le dossier ne peut être envoyé que lorsque <strong>tous</strong> les documents obligatoires sont conformes.
        </p>
        <div style={{ display: "flex", gap: 14, marginTop: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ minWidth: 240 }}>
            <label style={{ fontSize: 11.5, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 5 }}>Commande (PO)</label>
            <select value={selPo} onChange={(e) => setSelPo(e.target.value)}>
              {myPos.map((p) => <option key={p.id} value={p.id}>{p.id} — {p.fournisseur}</option>)}
            </select>
          </div>
        </div>
      </div>

      {po && (
        <>
          {/* Infos PO */}
          <div className="card" style={{ padding: 18 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 14 }}>
              {[
                ["Entité", ENTITES.find((e) => e.code === po.entite)?.nom], ["Incoterm", po.incoterm],
                ["Montant", `${po.montant.toLocaleString()} ${po.devise}`], ["Origine", po.paysOrigine],
                ["ETA", po.eta], ["Payment term", po.paymentTerm],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".04em" }}>{k}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginTop: 3 }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, padding: 12, background: "#f6f8f5", borderRadius: 10, fontSize: 12.5 }}>
              <strong>Documents requis : {conformes}/{requis.length} conformes.</strong>{" "}
              <span style={{ color: "var(--muted)" }}>
                {europe.includes(po.paysOrigine) ? "EUR 1 requis (origine Europe). " : ""}
                Règle : aucun envoi sans validation client.
              </span>
              <div style={{ height: 7, background: "#dde2dc", borderRadius: 999, marginTop: 8, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${requis.length ? (conformes / requis.length) * 100 : 0}%`, background: "var(--brand)", transition: ".4s" }} />
              </div>
            </div>
          </div>

          {/* ── NOUVEAU : Suivi expédition fournisseur ── */}
          <div className="card" style={{ overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)", background: "#f6f8f5" }}>
              <h3 style={{ fontSize: 14, margin: 0 }}> Suivi expédition — données fournisseur</h3>
              <p style={{ fontSize: 12, color: "var(--muted)", margin: "3px 0 0" }}>
                Planned Release Date, préparation, arrivée port et usine
              </p>
            </div>
            <div style={{ padding: 18, display: "grid", gap: 18 }}>

              {/* Bloc A — Planned Release Date + Préparation */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 10 }}>
                  Bloc A — Préparation marchandise
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>

                  {/* Planned Release Date (lecture seule) */}
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 5 }}>
                      Planned Release Date
                      <span className="pill" style={{ background: "#fdf2dc", color: "var(--warn)", marginLeft: 6, fontSize: 10 }}>Fixée par Appro</span>
                    </label>
                    <input type="date" value={po.plannedReleaseDate || ""} readOnly
                      style={{ background: "#f1f3f0", color: "var(--muted)", cursor: "not-allowed" }} />
                  </div>

                  {/* Packing Date */}
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 5 }}>
                      Packing Date <span style={{ color: "var(--ko)" }}>*</span>
                    </label>
                    <input type="date" value={po.packingDate || ""}
                      onChange={(e) => {
                        const pd = e.target.value;
                        const late = po.plannedReleaseDate && pd > po.plannedReleaseDate;
                        updatePo(po.id, { packingDate: pd, goodsReady: !!pd, packingLate: late });
                      }} />
                    {po.packingDate && po.plannedReleaseDate && po.packingDate > po.plannedReleaseDate && (
                      <p style={{ fontSize: 11, color: "var(--ko)", margin: "4px 0 0" }}>
                        ⚠ Packing Date postérieure à la Planned Release Date — retard fournisseur détecté
                      </p>
                    )}
                  </div>

                  {/* Statut marchandise préparée */}
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 5 }}>
                      Marchandise préparée ?
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", background: "#fbfcfb", border: "1px solid var(--line)", borderRadius: 8 }}>
                      <input type="checkbox" id={`gready-${po.id}`} checked={!!po.goodsReady}
                        onChange={(e) => {
                          if (e.target.checked && !po.packingDate) {
                            alert(" La Packing Date doit être renseignée avant de confirmer la préparation de la marchandise.");
                            return;
                          }
                          updatePo(po.id, { goodsReady: e.target.checked });
                        }}
                        style={{ width: 16, height: 16, accentColor: "var(--brand)" }} />
                      <label htmlFor={`gready-${po.id}`} style={{ fontSize: 13, cursor: "pointer" }}>
                        {po.goodsReady ? <span style={{ color: "var(--brand-d)", fontWeight: 600 }}>✓ Oui — prête</span> : "Non"}
                      </label>
                    </div>
                    {!po.packingDate && (
                      <p style={{ fontSize: 11, color: "var(--muted)", margin: "4px 0 0" }}>
                        Saisissez d'abord la Packing Date
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Séparateur */}
              <div style={{ height: 1, background: "var(--line)" }} />

              <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>
                📍 Les dates d'arrivée au port d'embarquement et à l'usine sont saisies dans l'interface <strong>Approvisionnement</strong>.
              </p>
            </div>
          </div>
        </>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {requis.map((k) => (
          <DocumentCard key={k + selPo} typeKey={k} po={po} doc={docs[k]} onUpdate={updateDoc} />
        ))}
      </div>

      <div className="card" style={{ padding: 18, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <strong style={{ fontSize: 14 }}>Envoi officiel à l'approvisionnement</strong>
          <p style={{ margin: "3px 0 0", fontSize: 12.5, color: "var(--muted)" }}>
            {dejaEnvoye ? "Dossier déjà transmis à l'approvisionnement." : tousConformes
              ? "Tous les documents obligatoires sont conformes. Vous pouvez transmettre le dossier."
              : "Transmission bloquée tant que tous les documents obligatoires ne sont pas conformes."}
          </p>
        </div>
        <button className="btn btn-p" disabled={!tousConformes || dejaEnvoye}
          onClick={() => sendToAppro(po, requis, docs)}>
          {dejaEnvoye ? "✓ Transmis" : "Envoyer le dossier →"}
        </button>
      </div>
    </div>
  );
}

/* =========================================================================
   INTERFACE APPROVISIONNEMENT
   ========================================================================= */
function InterfaceAppro({ pos, dossiers, createTransit, validerDoc, updatePo }) {
  const [tab, setTab] = useState("po");
  const tabs = [["po", "Commandes (PO)"], ["transit", "Dossiers transit"]];

  const IndicBadge = ({ val }) => {
    if (val === null || val === undefined) return <span className="pill" style={{ background: "#f1f1ee", color: "var(--muted)" }}>—</span>;
    return val
      ? <span className="pill" style={{ background: "var(--brand-l)", color: "var(--brand-d)" }}>À temps</span>
      : <span className="pill" style={{ background: "#fbe6e3", color: "var(--ko)" }}>En retard</span>;
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === "po" && (
        <div className="card">
          <SectionTitle t="Gestion des Purchase Orders" s="Suivi Planned Release Date, préparation fournisseur, arrivée port et usine" />
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>ID PO</th><th>Entité</th><th>Fournisseur</th><th>Pays origine</th><th>Port</th><th>Montant</th>
                  <th>Lead Time (j)</th>
                  <th>Planned Release Date</th><th>Packing Date</th>
                  <th>Marchandise prête</th>
                  <th>Date arrivée port embarquement</th>
                  <th>Date arrivée à l'usine</th>
                  <th>Écart (j)</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>{pos.map((p) => {
                const packingLate = p.packingDate && p.plannedReleaseDate && p.packingDate > p.plannedReleaseDate;
                const ecart = p.factoryArrivalDate && p.plannedReleaseDate
                  ? Math.round((new Date(p.factoryArrivalDate) - new Date(p.plannedReleaseDate)) / 86400000)
                  : null;
                return (
                  <tr key={p.id} style={{ background: packingLate ? "#fff9f0" : undefined }}>
                    <td className="mono">{p.id}</td>
                    <td>{p.entite}</td>
                    <td>{p.fournisseur}</td>
                    <td>{p.paysOrigine}</td>

                    {/* Port — extrait de l'incoterm */}
                    <td style={{ fontSize: 12, fontWeight: 600 }}>
                      {(() => {
                        const m = p.incoterm && p.incoterm.match(/PORT\s+(?:DE\s+|D['''])?(.+)|AEROPORT\s+(?:DE\s+|D['''])?(.+)/i);
                        if (!m) return <span style={{ color: "var(--muted)" }}>—</span>;
                        const nom = (m[1] || m[2] || "").trim();
                        const isAir = p.incoterm.includes("AEROPORT") || p.incoterm.includes("FCA") || p.incoterm.includes("CPT");
                        return <span>{isAir ? "" : ""} {nom}</span>;
                      })()}
                    </td>

                    <td>{p.montant.toLocaleString()} {p.devise}</td>

                    {/* Standard Lead Time — juste le chiffre */}
                    <td style={{ textAlign: "center" }}>
                      {(() => {
                        const lt = LEAD_TIME_PAR_PAYS[p.paysOrigine];
                        const isMaritime = p.incoterm && (p.incoterm.includes("CFR") || p.incoterm.includes("FOB") || p.incoterm.includes("DAP"));
                        const jours = lt ? (isMaritime ? lt.maritime : lt.aerien) : null;
                        return jours !== null
                          ? <span className="pill" style={{ background: "#e8f0fb", color: "#1c5ca8", fontWeight: 700, fontSize: 13 }}>{jours} j</span>
                          : <span style={{ color: "var(--muted)", fontSize: 12 }}>—</span>;
                      })()}
                    </td>

                    {/* Planned Release Date — éditable par appro */}
                    <td>
                      <input type="date" value={p.plannedReleaseDate || ""}
                        onChange={(e) => updatePo(p.id, { plannedReleaseDate: e.target.value })}
                        style={{ fontSize: 12, padding: "5px 8px", minWidth: 130 }} />
                    </td>

                    {/* Packing Date — lecture seule (saisie fournisseur) */}
                    <td>
                      {p.packingDate
                        ? <span className="mono" style={{ fontSize: 12, color: packingLate ? "var(--ko)" : "var(--brand-d)" }}>
                            {p.packingDate} {packingLate && "⚠"}
                          </span>
                        : <span style={{ color: "var(--muted)", fontSize: 12 }}>—</span>}
                    </td>

                    {/* Marchandise prête */}
                    <td>{p.goodsReady
                      ? <span className="pill" style={{ background: "var(--brand-l)", color: "var(--brand-d)" }}>✓ Oui</span>
                      : <span className="pill" style={{ background: "#f1f1ee", color: "var(--muted)" }}>Non</span>}
                    </td>

                    {/* Date arrivée port embarquement — saisie appro */}
                    <td>
                      <input type="date" value={p.portDepartureDate || ""}
                        onChange={(e) => {
                          const d = e.target.value;
                          const onTime = p.plannedReleaseDate ? d <= p.plannedReleaseDate : null;
                          updatePo(p.id, { portDepartureDate: d, portDepartureOnTime: onTime });
                        }}
                        style={{ fontSize: 12, padding: "5px 8px", minWidth: 130 }} />
                      {p.portDepartureDate && (
                        <div style={{ marginTop: 4 }}><IndicBadge val={p.portDepartureOnTime} /></div>
                      )}
                    </td>

                    {/* Date arrivée à l'usine — saisie appro */}
                    <td>
                      <input type="date" value={p.factoryArrivalDate || ""}
                        onChange={(e) => {
                          const d = e.target.value;
                          const onTime = p.eta ? d <= p.eta : null;
                          updatePo(p.id, { factoryArrivalDate: d, factoryArrivalOnTime: onTime, deliveryDate: d });
                        }}
                        style={{ fontSize: 12, padding: "5px 8px", minWidth: 130 }} />
                      {p.factoryArrivalDate && (
                        <div style={{ marginTop: 4 }}><IndicBadge val={p.factoryArrivalOnTime} /></div>
                      )}
                    </td>

                    {/* Écart Delivery / Release Date */}
                    <td>
                      {ecart !== null
                        ? <span className="mono" style={{ fontWeight: 700, fontSize: 13,
                            color: ecart > 0 ? "var(--ko)" : "var(--brand-d)" }}>
                            {ecart > 0 ? `+${ecart}` : ecart}j
                          </span>
                        : <span style={{ color: "var(--muted)", fontSize: 12 }}>—</span>}
                    </td>

                    <td><StatutPill s={p.statut} /></td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
          {pos.some((p) => p.packingDate && p.plannedReleaseDate && p.packingDate > p.plannedReleaseDate) && (
            <div style={{ margin: "0 16px", padding: "10px 14px", background: "#fdf2dc", border: "1px solid #f0c96a", borderRadius: 8, fontSize: 12.5, color: "var(--warn)" }}>
              ⚠ <strong>Alerte retard fournisseur</strong> — Un ou plusieurs PO ont une Packing Date postérieure à la Planned Release Date.
            </div>
          )}

          {/* Tableau de référence Standard Lead Time */}
          <details style={{ margin: "0 16px 16px" }}>
            <summary style={{ fontSize: 12.5, fontWeight: 600, color: "var(--brand-d)", cursor: "pointer", padding: "10px 0", userSelect: "none" }}>
               Référentiel Standard Lead Time — Délais maritimes et aériens par pays d'origine
            </summary>
            <div style={{ marginTop: 10, overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Pays d'origine</th>
                    <th> Maritime (j)</th>
                    <th> Aérien (j)</th>
                    <th>Route principale</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(LEAD_TIME_PAR_PAYS).map(([pays, lt], i) => (
                    <tr key={pays} style={{ background: i % 2 === 0 ? "#fff" : "#f6f8f5" }}>
                      <td style={{ fontWeight: 600 }}>{pays}</td>
                      <td style={{ textAlign: "center" }}>
                        <span className="pill" style={{ background: "#e8f0fb", color: "#1c5ca8" }}>{lt.maritime} j</span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span className="pill" style={{ background: "#f0f8f0", color: "var(--brand-d)" }}>{lt.aerien} j</span>
                      </td>
                      <td style={{ fontSize: 11.5, color: "var(--muted)" }}>{lt.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      )}

      {tab === "transit" && (
        <div className="card">
          <SectionTitle t="Génération des dossiers transit" s="Validation documentaire et transfert structuré des commandes vers le service transit" />
          {dossiers.length === 0 ? <Empty t="Aucun dossier à transférer." /> : (
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead><tr><th>N° Dossier</th><th>PO</th><th>Fournisseur</th><th>Complétude</th><th>Statut appro</th><th>Transit</th><th></th></tr></thead>
                <tbody>{dossiers.map((d) => (
                  <tr key={d.id}>
                    <td className="mono">{d.id}</td><td className="mono">{d.poId}</td><td>{d.fournisseur}</td>
                    <td>100%</td>
                    <td><StatutPill s={d.validéAppro ? "Validé" : "À vérifier"} /></td>
                    <td><StatutPill s={d.transitCree ? "Validé" : "En attente"} /></td>
                    <td>{!d.validéAppro
                      ? <button className="btn btn-p" style={{ padding: "6px 12px" }} onClick={() => validerDoc(d.id)}>Valider</button>
                      : d.validéAppro && !d.transitCree
                      ? <button className="btn btn-p" style={{ padding: "6px 12px" }} onClick={() => createTransit(d.id)}>Créer dossier transit →</button>
                      : <span style={{ fontSize: 11.5, color: "var(--brand-d)" }}>✓ Transmis au transit</span>}
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   INTERFACE TRANSIT
   ========================================================================= */
function InterfaceTransit({ dossiers, pos, demandeChèque, majDeclaration, majDedouanement }) {
  const [tab, setTab] = useState("suivi");
  const [selectedId, setSelectedId] = useState(null);
  const tabs = [["suivi", "Suivi dossier transit"], ["cheque", "Demandes de chèque"], ["cout", "Performance & coûts"]];
  const actifs = dossiers.filter((d) => d.transitCree);

  const getTransitCosts = (d) => {
    const po = pos.find((p) => p.id === d.poId);
    if (!po) return null;
    const mag = Math.round(po.montant * 0.008);
    const sur = d.declaration ? 0 : Math.round(po.montant * 0.012);
    const taxes = Math.round(po.montant * 0.19);
    const total = mag + sur + taxes + Math.round(po.montant * 0.015);
    const fa = ((total / po.montant) * 100).toFixed(2);
    return { po, mag, sur, taxes, total, fa };
  };

  const handlePrint = () => {
    if (tab === "suivi") {
      const headers = ["Dossier", "PO", "Fournisseur", "Transitaire", "D10", "Déclaration", "Situation", "Priorité"];
      const rows = actifs.map((d) => {
        const po = pos.find((p) => p.id === d.poId);
        const crit = calcCriticite(po, true);
        return [
          d.id, d.poId, d.fournisseur, d.transitaire || "—", d.d10 || "—",
          d.declaration ? "Oui" : "Non", d.situation || "En cours", crit.niveau,
        ];
      });
      const sections = [{ title: "Suivi des dossiers transit", content: buildPrintTable(headers, rows) }];
      const selected = selectedId ? actifs.find((d) => d.id === selectedId) : null;
      if (selected) {
        const costs = getTransitCosts(selected);
        sections.push({
          title: `Dossier transit complet — ${selected.id}`,
          content: buildPrintFields([
            ["N° Dossier", selected.id],
            ["PO", selected.poId],
            ["Fournisseur", selected.fournisseur],
            ["Transitaire", selected.transitaire || "—"],
            ["D10", selected.d10 || "—"],
            ["Déclaration", selected.declaration ? `Oui — ${selected.dateDeclaration || ""}` : "Non"],
            ["Dédouanement", selected.dateDedouanement ? `Oui — ${selected.dateDedouanement}` : "Non"],
            ["Situation", selected.situation || "En cours"],
            ...(costs ? [
              ["Magasinage", costs.mag.toLocaleString()],
              ["Surestaries", costs.sur.toLocaleString()],
              ["Droits & taxes", costs.taxes.toLocaleString()],
              ["Coût total transit", `${costs.total.toLocaleString()} ${costs.po.devise}`],
              ["Frais d'approche", `${costs.fa}%`],
            ] : []),
          ]),
        });
      }
      printModuleReport("Transit — Suivi dossier", sections);
    } else if (tab === "cheque") {
      const headers = ["Dossier", "Bénéficiaire", "Montant", "Nature", "Statut"];
      const rows = actifs.map((d) => {
        const po = pos.find((p) => p.id === d.poId);
        return [
          d.id, d.transitaire || "Transitaire",
          `${Math.round(po.montant * 0.04).toLocaleString()} ${po.devise}`,
          "Frais de dédouanement",
          d.chequeDemandé ? (d.chequeValidé ? "Validé" : "À vérifier") : "En attente",
        ];
      });
      printModuleReport("Transit — Demandes de chèque", [
        { title: "Demandes de chèque", content: buildPrintTable(headers, rows) },
      ]);
    } else {
      const headers = ["Dossier", "Fournisseur", "Magasinage", "Surestaries", "Droits & taxes", "Coût total", "Frais d'approche"];
      const rows = actifs.map((d) => {
        const c = getTransitCosts(d);
        if (!c) return [d.id, d.fournisseur, "—", "—", "—", "—", "—"];
        return [
          d.id, d.fournisseur, c.mag.toLocaleString(), c.sur.toLocaleString(),
          c.taxes.toLocaleString(), `${c.total.toLocaleString()} ${c.po.devise}`, `${c.fa}%`,
        ];
      });
      printModuleReport("Transit — Performance & coûts", [
        { title: "Analyse des coûts transit", content: buildPrintTable(headers, rows) },
      ]);
    }
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="ld-module-print-bar no-print" style={{ justifyContent: "flex-end" }}>
        <button type="button" className="btn btn-g" style={{ padding: "8px 16px", fontSize: 12.5 }} onClick={handlePrint}>
          🖨️ Imprimer
        </button>
      </div>
      <Tabs tabs={tabs} active={tab} onChange={(t) => { setTab(t); setSelectedId(null); }} />
      {tab === "suivi" && (
        <div className="card">
          <SectionTitle t="Suivi opérationnel des dossiers import" s="De la réception du dossier jusqu'à la livraison finale (D10, déclaration, dédouanement)" />
          {actifs.length === 0 ? <Empty t="Aucun dossier transit créé. L'approvisionnement doit transmettre les dossiers." /> : (
            <>
              {/* Alerte délai déclaration > 7 jours */}
              {actifs.some((d) => {
                if (!d.dateArrivee || d.declaration) return false;
                const jours = Math.round((new Date() - new Date(d.dateArrivee)) / 86400000);
                return jours > 7;
              }) && (
                <div style={{ margin: "0 16px", padding: "10px 14px", background: "#f6dcd7", border: "1px solid #d9534f", borderRadius: 8, fontSize: 12.5, color: "var(--crit)", fontWeight: 600 }}>
                  🚨 <strong>Priorité maximale</strong> — Un ou plusieurs dossiers dépassent le délai réglementaire de 7 jours sans déclaration douanière.
                </div>
              )}
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead><tr><th>Dossier</th><th>PO</th><th>Fournisseur</th><th>Transitaire</th><th>D10</th><th>Délai décl.</th><th>Déclaration</th><th>Situation</th><th>Priorité</th><th></th></tr></thead>
                <tbody>{actifs.map((d) => {
                  const po = pos.find((p) => p.id === d.poId);
                  const crit = calcCriticite(po, true);
                  const joursDepuisArrivee = d.dateArrivee && !d.declaration
                    ? Math.round((new Date() - new Date(d.dateArrivee)) / 86400000)
                    : null;
                  return (
                    <tr key={d.id} style={{ background: joursDepuisArrivee > 7 ? "#fff5f5" : undefined }}
                      className={selectedId === d.id ? "ld-row-selected" : ""}
                      onClick={() => setSelectedId((prev) => (prev === d.id ? null : d.id))}
                      title="Cliquer pour sélectionner le dossier à imprimer"
                    >
                      <td className="mono">{d.id}</td><td className="mono">{d.poId}</td><td>{d.fournisseur}</td>
                      <td>{d.transitaire || "—"}</td><td>{d.d10 || "—"}</td>
                      <td>
                        {joursDepuisArrivee !== null
                          ? <span className="pill" style={{ background: joursDepuisArrivee > 7 ? "#f6dcd7" : joursDepuisArrivee > 5 ? "#fdf2dc" : "var(--brand-l)", color: joursDepuisArrivee > 7 ? "var(--crit)" : joursDepuisArrivee > 5 ? "var(--warn)" : "var(--brand-d)" }}>
                              {joursDepuisArrivee}j {joursDepuisArrivee > 7 ? "🚨" : joursDepuisArrivee > 5 ? "⚠" : ""}
                            </span>
                          : <span style={{ color: "var(--muted)", fontSize: 11.5 }}>—</span>}
                      </td>
                      <td>{d.declaration ? <StatutPill s="Validé" /> : <StatutPill s="En attente" />}</td>
                      <td style={{ fontSize: 11.5 }}>{d.situation || "En cours"}</td>
                      <td><StatutPill s={crit.niveau} /></td>
                      <td onClick={(e) => e.stopPropagation()}>{!d.declaration
                        ? <button className="btn btn-p" style={{ padding: "5px 10px", fontSize: 12 }} onClick={() => majDeclaration(d.id)}>Déclarer</button>
                        : !d.dateDedouanement
                        ? <button className="btn btn-g" style={{ padding: "5px 10px", fontSize: 12 }} onClick={() => majDedouanement(d.id)}>Dédouaner ✓</button>
                        : <span style={{ fontSize: 11.5, color: "var(--brand-d)" }}>✓ Dédouané</span>
                      }</td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
            </>
          )}
        </div>
      )}
      {tab === "cheque" && (
        <div className="card">
          <SectionTitle t="Suivi des demandes de chèque" s="Coordination avec la trésorerie pour le paiement nécessaire au dédouanement" />
          {actifs.length === 0 ? <Empty t="Aucun dossier transit actif." /> : (
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead><tr><th>Dossier</th><th>Bénéficiaire</th><th>Montant</th><th>Nature</th><th>Statut demande</th><th></th></tr></thead>
                <tbody>{actifs.map((d) => {
                  const po = pos.find((p) => p.id === d.poId);
                  return (
                    <tr key={d.id}>
                      <td className="mono">{d.id}</td><td>{d.transitaire || "Transitaire"}</td>
                      <td>{Math.round(po.montant * 0.04).toLocaleString()} {po.devise}</td><td>Frais de dédouanement</td>
                      <td><StatutPill s={d.chequeDemandé ? (d.chequeValidé ? "Validé" : "À vérifier") : "En attente"} /></td>
                      <td>{!d.chequeDemandé && <button className="btn btn-p" style={{ padding: "5px 10px", fontSize: 12 }} onClick={() => demandeChèque(d.id)}>Demander chèque →</button>}</td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          )}
        </div>
      )}
      {tab === "cout" && (
        <div className="card">
          <SectionTitle t="Analyse des coûts et performance transit" s="Frais d'approche, surestaries, magasinage, délais de dédouanement" />
          {actifs.length === 0 ? <Empty t="Pas encore de données de coûts." /> : (
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead><tr><th>Dossier</th><th>Fournisseur</th><th>Magasinage</th><th>Surestaries</th><th>Droits & taxes</th><th>Coût total transit</th><th>Frais d'approche</th></tr></thead>
                <tbody>{actifs.map((d) => {
                  const po = pos.find((p) => p.id === d.poId);
                  const mag = Math.round(po.montant * 0.008), sur = d.declaration ? 0 : Math.round(po.montant * 0.012);
                  const taxes = Math.round(po.montant * 0.19), total = mag + sur + taxes + Math.round(po.montant * 0.015);
                  const fa = ((total / po.montant) * 100).toFixed(2);
                  return (
                    <tr key={d.id}>
                      <td className="mono">{d.id}</td><td>{d.fournisseur}</td>
                      <td>{mag.toLocaleString()}</td><td style={{ color: sur ? "var(--ko)" : "inherit" }}>{sur.toLocaleString()}</td>
                      <td>{taxes.toLocaleString()}</td><td><strong>{total.toLocaleString()} {po.devise}</strong></td>
                      <td><span className="pill" style={{ background: +fa > 2 ? "#fbe6e3" : "var(--brand-l)", color: +fa > 2 ? "var(--ko)" : "var(--brand-d)" }}>{fa}%</span></td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   INTERFACE TRÉSORERIE
   ========================================================================= */
function InterfaceTresorerie({ dossiers, pos, traiterPredom, validerChèque, updateDossier }) {
  const [tab, setTab] = useState("domiciliation");
  const [selDom, setSelDom] = useState(null);

  const tabs = [
    ["domiciliation", "Domiciliation bancaire"],
    ["cheques", "Émission des chèques"],
  ];

  const ETAPES_DOM = [
    "Demande soumise", "Banque accusé réception",
    "Domiciliation ouverte", "Transfert effectué", "Clôturée",
  ];
  const BANQUES = ["BNA", "BEA", "CPA", "BADR", "Société Générale Algérie", "AGB"];

  const PipelineDom = ({ etape }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 0, margin: "10px 0" }}>
      {ETAPES_DOM.map((e, i) => {
        const done = i < etape - 1;
        const current = i === etape - 1;
        return (
          <React.Fragment key={e}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
              <div style={{
                width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700, position: "relative", zIndex: 1,
                background: done ? "var(--brand)" : current ? "#1c5ca8" : "#e8ece7",
                color: (done || current) ? "#fff" : "var(--muted)",
                border: current ? "2px solid #1c5ca8" : "none",
              }}>
                {done ? "✓" : i + 1}
              </div>
              <span style={{ fontSize: 9.5, color: done ? "var(--brand-d)" : current ? "#1c5ca8" : "var(--muted)", textAlign: "center", lineHeight: 1.3, maxWidth: 70 }}>{e}</span>
            </div>
            {i < ETAPES_DOM.length - 1 && (
              <div style={{ flex: 1, height: 2, background: done ? "var(--brand)" : "#e8ece7", marginBottom: 18 }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  const domandees = dossiers.filter((d) => d.predomDemandée);

  const handlePrint = () => {
    const sections = [];

    if (tab === "domiciliation") {
      const headers = ["N° Dossier", "Fournisseur", "Montant", "N° Domiciliation", "Banque", "Date création", "Étape", "Statut"];
      const rows = domandees.map((d) => {
        const po = pos.find((p) => p.id === d.poId);
        const etape = d.etapeDom || 1;
        return [
          d.id, d.fournisseur, `${po?.montant?.toLocaleString() || "—"} ${po?.devise || ""}`,
          d.numDomiciliation || "—", d.banque || "—", d.dateCreationDom || "—",
          ETAPES_DOM[etape - 1], d.domiciliée ? "Clôturée" : "En cours",
        ];
      });
      sections.push({ title: "Domiciliation bancaire", content: buildPrintTable(headers, rows) });

      const selected = selDom ? dossiers.find((x) => x.id === selDom) : null;
      if (selected) {
        const po = pos.find((p) => p.id === selected.poId);
        const etape = selected.etapeDom || 1;
        sections.push({
          title: `Détails domiciliation — ${selected.id}`,
          content: `${buildPrintFields([
            ["N° Dossier", selected.id],
            ["Fournisseur", selected.fournisseur],
            ["Montant", po ? `${po.montant.toLocaleString()} ${po.devise}` : "—"],
            ["Numéro de domiciliation", selected.numDomiciliation || "—"],
            ["Banque domiciliataire", selected.banque || "—"],
            ["Date de création", selected.dateCreationDom || "—"],
            ["Statut domiciliation", selected.statutDom || "En attente"],
            ["Référence transfert", selected.referenceTransfert || "—"],
            ["Étape courante", ETAPES_DOM[etape - 1]],
          ])}<div style="margin-top:16px"><strong style="color:#0B2362;font-size:13px">Étapes de validation</strong><ol style="margin:8px 0 0 20px;font-size:12px;line-height:1.8">${ETAPES_DOM.map((e, i) => `<li style="color:${i < etape ? '#6FA32E' : '#5A6478'};font-weight:${i === etape - 1 ? 700 : 400}">${e}${i < etape - 1 ? ' ✓' : i === etape - 1 ? ' ← en cours' : ''}</li>`).join('')}</ol></div>`,
        });
      }
    } else {
      const chequeDossiers = dossiers.filter((d) => d.chequeDemandé);
      const headers = ["N° Dossier", "Bénéficiaire", "Montant", "Type", "Statut", "Date demande"];
      const rows = chequeDossiers.map((d) => {
        const po = pos.find((p) => p.id === d.poId);
        return [
          d.id, d.transitaire || "Transitaire",
          `${Math.round(po.montant * 0.04).toLocaleString()} ${po.devise}`,
          "Chèque bancaire", d.chequeValidé ? "Émis" : "En attente", d.dateDemandeChèque || "—",
        ];
      });
      sections.push({ title: "Demandes de chèques", content: buildPrintTable(headers, rows) });
    }

    printModuleReport(`Trésorerie — ${tab === "domiciliation" ? "Domiciliation bancaire" : "Émission des chèques"}`, sections);
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="ld-module-print-bar no-print" style={{ justifyContent: "flex-end" }}>
        <button type="button" className="btn btn-g" style={{ padding: "8px 16px", fontSize: 12.5 }} onClick={handlePrint}>
          🖨️ Imprimer
        </button>
      </div>
      <Tabs tabs={tabs} active={tab} onChange={(t) => { setTab(t); setSelDom(null); }} />

      {/* ── ONGLET 1 : Domiciliation ── */}
      {tab === "domiciliation" && (
        <>
          <div className="card">
            <SectionTitle t="Pré-domiciliation & domiciliation bancaire" s="Traitement des demandes émises par l'approvisionnement" />
            {domandees.length === 0 ? <Empty t="Aucune demande de pré-domiciliation reçue." /> : (
              <div style={{ overflowX: "auto" }}>
                <table>
                  <thead>
                    <tr>
                      <th>N° Dossier</th><th>Fournisseur</th><th>Montant</th><th>N° Domiciliation</th>
                      <th>Banque</th><th>Date création</th><th>Étape</th><th>Statut</th><th></th>
                    </tr>
                  </thead>
                  <tbody>{domandees.map((d) => {
                    const po = pos.find((p) => p.id === d.poId);
                    const etape = d.etapeDom || 1;
                    return (
                      <tr key={d.id}>
                        <td className="mono">{d.id}</td>
                        <td>{d.fournisseur}</td>
                        <td>{po.montant.toLocaleString()} {po.devise}</td>
                        <td className="mono" style={{ color: d.numDomiciliation ? "var(--ink)" : "var(--muted)", fontSize: 12 }}>
                          {d.numDomiciliation || "—"}
                        </td>
                        <td style={{ fontSize: 12 }}>{d.banque || "—"}</td>
                        <td style={{ fontSize: 12 }}>{d.dateCreationDom || "—"}</td>
                        <td style={{ fontSize: 12 }}>{ETAPES_DOM[etape - 1]}</td>
                        <td><StatutPill s={d.domiciliée ? "Validé" : "À vérifier"} /></td>
                        <td>
                          <button className="btn btn-g" style={{ padding: "5px 10px", fontSize: 12 }}
                            onClick={() => setSelDom(selDom === d.id ? null : d.id)}>
                            {selDom === d.id ? "Fermer" : "Ouvrir formulaire"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}</tbody>
                </table>
              </div>
            )}
          </div>

          {/* Formulaire domiciliation inline */}
          {selDom && (() => {
            const d = dossiers.find((x) => x.id === selDom);
            const po = pos.find((p) => p.id === d?.poId);
            if (!d || !po) return null;
            const etape = d.etapeDom || 1;
            return (
              <div className="card fade" style={{ overflow: "hidden" }}>
                <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)", background: "#f6f8f5", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}></span>
                  <div>
                    <h3 style={{ fontSize: 14, margin: 0 }}>Formulaire de domiciliation bancaire</h3>
                    <p style={{ fontSize: 12, color: "var(--muted)", margin: "2px 0 0" }}>
                      Dossier {d.id} · {d.fournisseur}
                    </p>
                  </div>
                </div>

                <div style={{ padding: 18, display: "grid", gap: 18 }}>

                  {/* Info lecture seule */}
                  <div style={{ padding: 12, background: "#f6f8f5", borderRadius: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 10 }}>
                      Informations dossier (lecture seule)
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
                      {[["N° Dossier", d.id], ["Fournisseur", d.fournisseur],
                        ["Montant", `${po.montant.toLocaleString()} ${po.devise}`],
                        ["Date demande", todayISO()]].map(([k, v]) => (
                        <div key={k}>
                          <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".04em" }}>{k}</div>
                          <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Champs de saisie */}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 10 }}>
                      Données de domiciliation
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 11.5, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 5 }}>
                          Numéro de domiciliation <span style={{ color: "var(--ko)" }}>*</span>
                        </label>
                        <input type="text" placeholder="Ex : BNA-2026-00874"
                          value={d.numDomiciliation || ""}
                          onChange={(e) => updateDossier(d.id, { numDomiciliation: e.target.value })} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11.5, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 5 }}>
                          Banque domiciliataire <span style={{ color: "var(--ko)" }}>*</span>
                        </label>
                        <select value={d.banque || "BNA"}
                          onChange={(e) => updateDossier(d.id, { banque: e.target.value })}>
                          {BANQUES.map((b) => <option key={b}>{b}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 11.5, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 5 }}>
                          Date de création <span style={{ color: "var(--ko)" }}>*</span>
                        </label>
                        <input type="date" value={d.dateCreationDom || ""}
                          onChange={(e) => updateDossier(d.id, { dateCreationDom: e.target.value })} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11.5, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 5 }}>
                          Statut domiciliation <span style={{ color: "var(--ko)" }}>*</span>
                        </label>
                        <select value={d.statutDom || "En attente"}
                          onChange={(e) => updateDossier(d.id, { statutDom: e.target.value })}>
                          {["En attente", "Ouverte", "Clôturée", "Annulée"].map((s) => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 11.5, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 5 }}>
                          RT — Référence de Transfert
                        </label>
                        <input type="text" placeholder="Rempli après transfert bancaire"
                          value={d.referenceTransfert || ""}
                          style={{ borderStyle: d.referenceTransfert ? "solid" : "dashed" }}
                          onChange={(e) => updateDossier(d.id, { referenceTransfert: e.target.value })} />
                      </div>
                    </div>
                  </div>

                  {/* Pipeline d'étapes */}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>
                      Suivi des étapes — Étape courante : <span style={{ color: "#1c5ca8" }}>{ETAPES_DOM[etape - 1]}</span>
                    </div>
                    <PipelineDom etape={etape} />
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <button className="btn btn-g" style={{ fontSize: 12, padding: "6px 12px" }}
                        disabled={etape <= 1}
                        onClick={() => updateDossier(d.id, { etapeDom: etape - 1 })}>
                        ← Étape précédente
                      </button>
                      <button className="btn btn-p" style={{ fontSize: 12, padding: "6px 12px" }}
                        disabled={etape >= ETAPES_DOM.length}
                        onClick={() => {
                          const next = etape + 1;
                          updateDossier(d.id, { etapeDom: next });
                          if (next >= ETAPES_DOM.length) traiterPredom(d.id, { domiciliée: true });
                        }}>
                        Étape suivante →
                      </button>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 10, borderTop: "1px solid var(--line)" }}>
                    <button className="btn btn-p" onClick={() => {
                      traiterPredom(d.id, { numDomiciliation: d.numDomiciliation, banque: d.banque, dateCreationDom: d.dateCreationDom, statutDom: d.statutDom });
                      setSelDom(null);
                    }}>
                      ✓ Enregistrer la domiciliation
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </>
      )}

      {/* ── ONGLET 2 : Chèques ── */}
      {tab === "cheques" && (
        <div className="card">
          <SectionTitle t="Émission et suivi des chèques" s="Demandes de chèque transmises par le transit" />
          {dossiers.filter((d) => d.chequeDemandé).length === 0 ? <Empty t="Aucune demande de chèque en attente." /> : (
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead><tr><th>N° Dossier</th><th>Bénéficiaire</th><th>Montant</th><th>Type</th><th>Statut</th><th></th></tr></thead>
                <tbody>{dossiers.filter((d) => d.chequeDemandé).map((d) => {
                  const po = pos.find((p) => p.id === d.poId);
                  return (
                    <tr key={d.id}>
                      <td className="mono">{d.id}</td><td>{d.transitaire || "Transitaire"}</td>
                      <td>{Math.round(po.montant * 0.04).toLocaleString()} {po.devise}</td><td>Chèque bancaire</td>
                      <td><StatutPill s={d.chequeValidé ? "Validé" : "À vérifier"} /></td>
                      <td>{!d.chequeValidé && <button className="btn btn-p" style={{ padding: "5px 10px", fontSize: 12 }} onClick={() => validerChèque(d.id)}>Émettre chèque →</button>}</td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ----------------------------- Composants UI ------------------------------ */
const Tabs = ({ tabs, active, onChange }) => (
  <div style={{ display: "flex", gap: 6, background: "var(--panel)", padding: 6, borderRadius: 12, border: "1px solid var(--line)", flexWrap: "wrap" }}>
    {tabs.map(([id, label]) => (
      <button key={id} onClick={() => onChange(id)} className="btn"
        style={{ flex: "1 1 auto", justifyContent: "center", background: active === id ? "var(--brand)" : "transparent", color: active === id ? "#fff" : "var(--muted)", fontSize: 12.5 }}>
        {label}
      </button>
    ))}
  </div>
);
const SectionTitle = ({ t, s }) => (
  <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--line)" }}>
    <h3 style={{ fontSize: 15 }}>{t}</h3>
    {s && <p style={{ margin: "3px 0 0", fontSize: 12.5, color: "var(--muted)" }}>{s}</p>}
  </div>
);
const Empty = ({ t }) => (
  <div style={{ padding: 32, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>{t}</div>
);

export {
  ENTITES, INCOTERMS, PAYMENT_TERMS, BANNED_FORWARDERS, LEAD_TIME_PAR_PAYS, DOC_TYPES, ROLES,
  INITIAL_POS, todayISO, addDays, calcCriticite,
  Style, StatutPill, Tabs, SectionTitle, Empty,
  DocumentCard,
  InterfaceFournisseur, InterfaceAppro, InterfaceTransit, InterfaceTresorerie, InterfaceResponsable,
};
