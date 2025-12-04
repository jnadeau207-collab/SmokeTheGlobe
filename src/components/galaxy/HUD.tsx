"use client";

import React from "react";
import { useGalaxyStore } from "../../store/galaxyStore";

const HUD: React.FC = () => {
  const { nodes, selectedId } = useGalaxyStore((state) => ({
    nodes: state.nodes,
    selectedId: state.selectedId,
  }));

  const selected = nodes.find((n) => n.id === selectedId);

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
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        maxWidth: 360,
        pointerEvents: "none",
        zIndex: 1000,
      }}
    >
      {selected ? (
        <>
          <div style={{ fontSize: 13, opacity: 0.7 }}>
            Selected license
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              marginTop: 2,
              wordBreak: "break-word",
            }}
          >
            {selected.name}
          </div>
          {selected.jurisdiction && (
            <div style={{ fontSize: 14, marginTop: 4 }}>
              Jurisdiction: {selected.jurisdiction}
            </div>
          )}
          <div style={{ fontSize: 14, marginTop: 4 }}>
            Transparency score:{" "}
            {typeof selected.transparencyScore === "number"
              ? selected.transparencyScore.toFixed(2)
              : "N/A"}{" "}
            <span style={{ opacity: 0.7 }}>
              (experimental)
            </span>
          </div>
        </>
      ) : (
        <div style={{ fontSize: 14, opacity: 0.8 }}>
          Click a node to see license details.
        </div>
      )}
    </div>
  );
};

export default HUD;
