// src/components/galaxy/HUD.tsx
import React from "react";
import type { GalaxyLicense } from "./GalaxyScene";

interface HUDProps {
  selected: GalaxyLicense | null;
}

const HUD: React.FC<HUDProps> = ({ selected }) => {
  return (
    <div
      style={{
        position: "fixed",
        left: 16,
        bottom: 16,
        padding: "12px 16px",
        borderRadius: 8,
        background: "rgba(0,0,0,0.7)",
        color: "#fff",
        maxWidth: 320,
        fontFamily: "system-ui, sans-serif",
        pointerEvents: "none",
      }}
    >
      {selected ? (
        <>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>
            Selected license
          </div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>
            {selected.name}
          </div>
          <div style={{ fontSize: 13, marginTop: 4 }}>
            Jurisdiction: {selected.jurisdiction || "Unknown"}
          </div>
          <div style={{ fontSize: 13, marginTop: 4 }}>
            Transparency score:{" "}
            {selected.transparencyScore.toFixed(2)}{" "}
            <span style={{ fontSize: 11, opacity: 0.7 }}>
              (experimental)
            </span>
          </div>
        </>
      ) : (
        <div style={{ fontSize: 13, opacity: 0.8 }}>
          Click a node to see license details.
        </div>
      )}
    </div>
  );
};

export default HUD;
