import React, { useState, useMemo } from 'react';

export default function DataTable({
  columns,
  data,
  pageSize = 10,
  paginate = true,
  searchable = true,
  searchPlaceholder = 'Rechercher…',
  emptyMessage = 'Aucune donnée.',
}) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({});

  const filtered = useMemo(() => {
    let rows = [...data];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((row) =>
        columns.some((col) => {
          const val = col.accessor ? col.accessor(row) : row[col.key];
          return String(val ?? '').toLowerCase().includes(q);
        })
      );
    }
    Object.entries(filters).forEach(([key, val]) => {
      if (val) rows = rows.filter((row) => String(row[key] ?? '') === val);
    });
    if (sortKey) {
      rows.sort((a, b) => {
        const av = a[sortKey] ?? '';
        const bv = b[sortKey] ?? '';
        const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return rows;
  }, [data, search, sortKey, sortDir, filters, columns]);

  const effectivePageSize = paginate ? pageSize : filtered.length || 1;
  const totalPages = Math.max(1, Math.ceil(filtered.length / effectivePageSize));
  const paged = paginate
    ? filtered.slice(page * effectivePageSize, (page + 1) * effectivePageSize)
    : filtered;

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
    setPage(0);
  };

  const filterableCols = columns.filter((c) => c.filter);

  return (
    <div className="ld-dt">
      <style>{`
        .ld-dt { width: 100%; }
        .ld-dt-toolbar { display: flex; gap: 12px; flex-wrap: wrap; padding: 14px 16px; border-bottom: 1px solid var(--line); align-items: center; }
        .ld-dt-search { flex: 1; min-width: 180px; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--line); font-size: 13px; }
        .ld-dt-filter { padding: 8px 10px; border-radius: 8px; border: 1px solid var(--line); font-size: 12px; }
        .ld-dt-wrap { overflow-x: auto; }
        .ld-dt table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
        .ld-dt thead { position: sticky; top: 0; z-index: 2; }
        .ld-dt th {
          text-align: left; font-weight: 600; color: var(--muted); font-size: 11px;
          text-transform: uppercase; letter-spacing: .04em; padding: 11px 14px;
          border-bottom: 2px solid var(--line); background: #F5F8FA; cursor: pointer;
          user-select: none; white-space: nowrap; transition: background 0.15s;
        }
        .ld-dt th:hover { background: #eef2f0; }
        .ld-dt th.sorted { color: var(--brand-d); }
        .ld-dt td { padding: 11px 14px; border-bottom: 1px solid var(--line); vertical-align: middle; }
        .ld-dt tbody tr { transition: background 0.15s; }
        .ld-dt tbody tr:hover { background: rgba(15,139,95,0.04); }
        .ld-dt-pagination { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; font-size: 12px; color: var(--muted); flex-wrap: wrap; gap: 8px; }
        .ld-dt-pagination button {
          padding: 6px 12px; border-radius: 6px; border: 1px solid var(--line);
          background: #fff; cursor: pointer; font-size: 12px; transition: 0.15s;
        }
        .ld-dt-pagination button:hover:not(:disabled) { border-color: var(--brand); color: var(--brand-d); }
        .ld-dt-pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
        .ld-dt-empty { padding: 40px; text-align: center; color: var(--muted); }
      `}</style>

      {(searchable || filterableCols.length > 0) && (
        <div className="ld-dt-toolbar">
          {searchable && (
            <input
              className="ld-dt-search" type="search" placeholder={searchPlaceholder}
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            />
          )}
          {filterableCols.map((col) => (
            <select
              key={col.key} className="ld-dt-filter"
              value={filters[col.key] || ''}
              onChange={(e) => { setFilters((f) => ({ ...f, [col.key]: e.target.value })); setPage(0); }}
            >
              <option value="">{col.label}</option>
              {[...new Set(data.map((r) => r[col.key]).filter(Boolean))].map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          ))}
        </div>
      )}

      <div className="ld-dt-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={sortKey === col.key ? 'sorted' : ''}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                >
                  {col.label}{sortKey === col.key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr><td colSpan={columns.length} className="ld-dt-empty">{emptyMessage}</td></tr>
            ) : paged.map((row, i) => (
              <tr key={row.id ?? i}>
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render(row) : (col.accessor ? col.accessor(row) : row[col.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {paginate && (
        <div className="ld-dt-pagination no-print">
          <span>{filtered.length} résultat(s) — Page {page + 1}/{totalPages}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button disabled={page === 0} onClick={() => setPage(0)}>«</button>
            <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}>‹</button>
            <button disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>›</button>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(totalPages - 1)}>»</button>
          </div>
        </div>
      )}
    </div>
  );
}
