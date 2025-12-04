// src/components/galaxy/HUD.tsx
"use client";

import React from "react";

interface HUDProps {
  totalLicenses?: number;
}

const HUD: React.FC<HUDProps> = ({ totalLicenses }) => {
  return (
    <div
      style={{
        position: "fixed",
        left: 16,
        bottom: 16,
        padding: "10px 14px",
        borderRadius: 8,
        background: "rgba(15,23,42,0.8)",
        color: "#e5e7eb",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        fontSize: 12,
        maxWidth: 320,
        pointerEvents: "none",
        zIndex: 30,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>Supply Chain Galaxy</div>
      <div>
        Licenses in view:{" "}
        {typeof totalLicenses === "number" ? totalLicenses : "–"}
      </div>
      <div style={{ marginTop: 6, opacity: 0.75 }}>
        Transparency score coloring is an experimental internal metric.
      </div>
    </div>
  );
};

export default HUD;
