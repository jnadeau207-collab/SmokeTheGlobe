'use client';

import React from 'react';
import { useGalaxyStore } from '@/store/galaxyStore';

const hudContainer: React.CSSProperties = {
  position: 'fixed',
  left: 16,
  bottom: 16,
  padding: '12px 16px',
  borderRadius: 8,
  background: 'rgba(0, 0, 0, 0.7)',
  color: '#fff',
  fontFamily:
    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  pointerEvents: 'none',
  maxWidth: 320,
};

const titleStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  marginBottom: 4,
};

const textStyle: React.CSSProperties = {
  fontSize: 13,
  lineHeight: 1.4,
};

const subtleStyle: React.CSSProperties = {
  marginTop: 8,
  fontSize: 11,
  opacity: 0.7,
};

const HUD: React.FC = () => {
  const selected = useGalaxyStore((s) => s.selectedLicense);

  return (
    <div style={hudContainer}>
      {selected ? (
        <>
          <div style={titleStyle}>{selected.name}</div>
          {selected.jurisdiction && (
            <div style={textStyle}>Jurisdiction: {selected.jurisdiction}</div>
          )}
          {typeof selected.transparencyScore === 'number' && (
            <div style={textStyle}>
              Transparency score: {selected.transparencyScore.toFixed(2)}
            </div>
          )}
          <div style={subtleStyle}>
            Transparency score is an experimental internal metric for regulatory
            insight only.
          </div>
        </>
      ) : (
        <>
          <div style={titleStyle}>Supply Chain Galaxy</div>
          <div style={textStyle}>
            Click on a node in the galaxy to view license details and transparency
            score.
          </div>
          <div style={subtleStyle}>
            This view shows only public license data. No personal data is displayed.
          </div>
        </>
      )}
    </div>
  );
};

export default HUD;
