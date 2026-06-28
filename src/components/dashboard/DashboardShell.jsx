import React, { useRef } from 'react';
import StatsCards from './StatsCards';
import PrintButton, { PrintArea } from '../ui/PrintButton';
import DataTable from '../ui/DataTable';
import { StatutPill } from '../../platform/logidoc-core';

function Timeline({ items }) {
  return (
    <div style={{ padding: '16px 20px' }}>
      {items.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: 20 }}>Aucune activité récente.</p>
      ) : items.map((item, i) => (
        <div key={item.id || i} className="slide-in" style={{
          display: 'flex', gap: 14, padding: '12px 0',
          borderBottom: i < items.length - 1 ? '1px solid var(--line)' : 'none',
          animationDelay: `${i * 0.05}s`,
        }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%', marginTop: 5, flexShrink: 0,
            background: item.color || '#00A870', boxShadow: `0 0 0 3px ${item.color || '#00A870'}33`,
          }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{item.title}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{item.desc}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{item.time}</div>
          </div>
          {item.badge && <StatutPill s={item.badge} />}
        </div>
      ))}
    </div>
  );
}

function ProgressOverview({ items }) {
  return (
    <div style={{ padding: 16, display: 'grid', gap: 14 }}>
      {items.map((item, i) => (
        <div key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 6 }}>
            <span style={{ fontWeight: 600 }}>{item.label}</span>
            <span style={{ color: 'var(--muted)' }}>{item.value}%</span>
          </div>
          <div style={{ height: 7, background: '#F5F8FA', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${item.value}%`,
              background: `linear-gradient(90deg, ${item.color || '#00A870'}, #DFF7ED)`,
              borderRadius: 999, transition: 'width 0.8s ease',
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardShell({
  title, subtitle, stats, progress, timeline, tableColumns, tableData,
  chartSlot, children,
}) {
  const printRef = useRef(null);

  return (
    <div className="fade" style={{ display: 'grid', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: 'Archivo,sans-serif', fontSize: 22, color: '#1A1F2C' }}>{title}</h2>
          {subtitle && <p style={{ color: '#667085', fontSize: 13, marginTop: 4 }}>{subtitle}</p>}
        </div>
        <PrintButton targetRef={printRef} label="Imprimer le tableau de bord" />
      </div>

      <PrintArea ref={printRef}>
        {stats && <StatsCards stats={stats} />}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16, marginTop: stats ? 4 : 0 }}>
          {progress && (
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', background: 'linear-gradient(135deg,#0B1F3A,#102A4C)', color: '#fff', fontWeight: 600, fontSize: 14 }}>
                Progression
              </div>
              <ProgressOverview items={progress} />
            </div>
          )}
          {timeline && (
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', background: 'linear-gradient(135deg,#0B1F3A,#102A4C)', color: '#fff', fontWeight: 600, fontSize: 14 }}>
                Activités récentes
              </div>
              <Timeline items={timeline} />
            </div>
          )}
        </div>

        {chartSlot}

        {tableColumns && tableData && (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
              <strong style={{ fontSize: 14 }}>Vue synthétique</strong>
            </div>
            <DataTable columns={tableColumns} data={tableData} pageSize={5} />
          </div>
        )}

        {children && (
          <div style={{ marginTop: 8 }}>
            {children}
          </div>
        )}
      </PrintArea>
    </div>
  );
}

export { Timeline, ProgressOverview };
