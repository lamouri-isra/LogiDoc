import React from 'react';

export function Skeleton({ width = '100%', height = 16, style }) {
  return <div className="ld-skeleton" style={{ width, height, ...style }} />;
}

export function SkeletonCard() {
  return (
    <div className="card" style={{ padding: 20 }}>
      <Skeleton width="40%" height={12} />
      <Skeleton width="60%" height={28} style={{ marginTop: 12 }} />
      <Skeleton width="80%" height={10} style={{ marginTop: 8 }} />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div style={{ padding: 16 }}>
      <Skeleton width="100%" height={36} style={{ marginBottom: 8 }} />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} width="100%" height={32} style={{ marginBottom: 6 }} />
      ))}
    </div>
  );
}
