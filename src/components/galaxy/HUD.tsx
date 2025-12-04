"use client";

import React from "react";
import { useGalaxyStore } from "@/store/galaxyStore";

const HUD: React.FC = () => {
  const nodes = useGalaxyStore((s) => s.nodes);
  const selectedId = useGalaxyStore((s) => s.selectedId);
  const selected = nodes.find((n) => n.id === selectedId);

  return (
    <div
      style={{
        position: "fixed",
        left: 16,
        bottom: 16,
        padding: "12px 16px",
        borderRadius: 8,
        background: "rgba(0, 0, 0, 0.7)",
        color: "white",
        maxWidth: 360,
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        pointerEvents: "none",
      }}
    >
      <div style={{ fontSize: 12, textTransform: "uppercase", opacity: 0.7 }}>
        Supply Chain Galaxy
      </div>
      {selected ? (
        <>
          <div style={{ marginTop: 4, fontSize: 16, fontWeight: 600 }}>
            {selected.name || "Unknown license"}
          </div>
          <div style={{ marginTop: 2, fontSize: 12, opacity: 0.9 }}>
            {selected.jurisdiction || "Unknown jurisdiction"}
          </div>
          <div style={{ marginTop: 6, fontSize: 12 }}>
            Transparency score:{" "}
            <strong>
              {typeof selected.transparencyScore === "number"
                ? selected.transparencyScore.toFixed(2)
                : "n/a"}
            </strong>{" "}
            <span style={{ opacity: 0.7 }}>(experimental metric)</span>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, opacity: 0.7 }}>
            Tip: click a different node to change focus, or click empty space to clear selection.
          </div>
        </>
      ) : (
        <div style={{ marginTop: 4, fontSize: 12, opacity: 0.85 }}>
          Click a node in the galaxy to inspect its license details.
        </div>
      )}
    </div>
  );
};

export default HUD;
