import React from 'react';

export default function LogiDocLogo({ size = 'md', variant = 'light', showHolcim = true, className = '' }) {
  const sizes = {
    sm: { icon: 34, fontSize: 15, holcimSize: 8, gap: 9 },
    md: { icon: 42, fontSize: 21, holcimSize: 9, gap: 11 },
    lg: { icon: 56, fontSize: 28, holcimSize: 10, gap: 14 },
  };
  const s = sizes[size] || sizes.md;
  const textColor = variant === 'light' ? '#FFFFFF' : '#0B2362';
  const docColor = variant === 'light' ? '#CADFB3' : '#8AC43D';
  const holcimColor = variant === 'light' ? 'rgba(202,223,179,0.9)' : '#8AC43D';
  const gradId = `ldGrad-${variant}-${size}`;

  return (
    <div className={`ld-logo ${className}`} style={{ display: 'flex', alignItems: 'center', gap: s.gap }}>
      <svg width={s.icon} height={s.icon} viewBox="0 0 48 48" fill="none" aria-label="LogiDoc">
        <rect width="48" height="48" rx="12" fill={`url(#${gradId})`} />
        <rect x="10" y="12" width="18" height="22" rx="3" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
        <rect x="14" y="16" width="10" height="2" rx="1" fill="rgba(255,255,255,0.7)" />
        <rect x="14" y="21" width="14" height="2" rx="1" fill="rgba(255,255,255,0.5)" />
        <rect x="14" y="26" width="8" height="2" rx="1" fill="rgba(255,255,255,0.4)" />
        <path d="M28 30 L36 22 L40 26 L32 34 Z" fill="#8AC43D" opacity="0.9" />
        <circle cx="36" cy="22" r="3" fill="#CADFB3" />
        <path d="M34 34 L40 28" stroke="#CADFB3" strokeWidth="2" strokeLinecap="round" />
        <defs>
          <linearGradient id={gradId} x1="4" y1="4" x2="44" y2="44">
            <stop stopColor="#0B2362" />
            <stop offset="0.55" stopColor="#1A3A7A" />
            <stop offset="1" stopColor="#8AC43D" />
          </linearGradient>
        </defs>
      </svg>
      <div>
        <div style={{
          fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: s.fontSize,
          color: textColor, letterSpacing: '-0.03em', lineHeight: 1.05,
        }}>
          Logi<span style={{ color: docColor }}>Doc</span>
        </div>
        {showHolcim && (
          <div style={{
            fontSize: s.holcimSize, fontWeight: 700, letterSpacing: '0.16em',
            color: holcimColor, textTransform: 'uppercase', marginTop: 3,
          }}>
            HOLCIM
          </div>
        )}
      </div>
    </div>
  );
}
