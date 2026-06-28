export function escapeHtml(str) {
  return String(str ?? '—').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function buildPrintTable(headers, rows) {
  const head = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('');
  const body = rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('');
  return `<table><thead><tr>${head}</tr></thead><tbody>${body || '<tr><td colspan="' + headers.length + '">Aucune donnée</td></tr>'}</tbody></table>`;
}

export function buildPrintFields(fields) {
  return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin:12px 0">
    ${fields.map(([k, v]) => `<div style="padding:10px 12px;background:#F4F7F0;border-radius:8px;border:1px solid #D4DFC8">
      <div style="font-size:10px;color:#5A6478;text-transform:uppercase;letter-spacing:.04em">${escapeHtml(k)}</div>
      <div style="font-size:13px;font-weight:600;margin-top:4px;color:#0B2362">${escapeHtml(v)}</div>
    </div>`).join('')}
  </div>`;
}

export function printModuleReport(title, sections) {
  const body = sections.map((s) => {
    if (typeof s === 'string') return s;
    return `<h2 style="font-size:16px;color:#0B2362;margin:24px 0 12px;border-bottom:2px solid #8AC43D;padding-bottom:6px">${escapeHtml(s.title)}</h2>${s.content}`;
  }).join('');
  const html = `
    <h1>${escapeHtml(title)}</h1>
    <div class="meta">LogiDoc — HOLCIM · Imprimé le ${new Date().toLocaleString('fr-FR')}</div>
    ${body}
  `;
  printHtmlContent(title, html);
}

export function printHtmlContent(title, html) {
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) {
    alert('Veuillez autoriser les pop-ups pour imprimer.');
    return;
  }
  win.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
    <style>
      @page { size: A4; margin: 15mm; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      body{font-family:'Segoe UI',system-ui,sans-serif;padding:32px;color:#1A1F2C;line-height:1.6}
      h1{font-size:22px;color:#0B2362;border-bottom:2px solid #8AC43D;padding-bottom:8px}
      pre{white-space:pre-wrap;word-break:break-word;background:#F4F7F0;padding:16px;border-radius:8px;border:1px solid #D4DFC8;font-size:12px}
      .meta{color:#5A6478;font-size:13px;margin-bottom:20px}
      table{width:100%;border-collapse:collapse;margin:16px 0;font-size:12px}
      th{background:#0B2362;color:#fff;padding:8px 12px;text-align:left}
      td{padding:8px 12px;border-bottom:1px solid #D4DFC8}
      @media print{body{padding:0}}
    </style></head><body>${html}</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 600);
}

export function printDocument({ fileName, content, poId, docType }) {
  const html = `
    <h1>LogiDoc — Document</h1>
    <div class="meta">Document: ${docType || '—'} · PO: ${poId || '—'} · Fichier: ${fileName || '—'}</div>
    <pre>${(content || 'Aucun contenu disponible.').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
    <div class="meta">Imprimé le ${new Date().toLocaleString('fr-FR')}</div>
  `;
  printHtmlContent(`LogiDoc — ${fileName || 'Document'}`, html);
}

export function downloadCsv(filename, content) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
