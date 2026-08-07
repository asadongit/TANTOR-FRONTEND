import React, { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  getBezierPath,
} from "@xyflow/react";

const BreakpointEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data = {},
  selected,
  interactionWidth = 20,
  label,
  labelStyle,
}) => {
  const isBreakpoint = Boolean(data?.isBreakpoint);
  const wireStyle = data?.wireStyle || "smoothstep";

  let edgePath = "";
  let labelX = 0;
  let labelY = 0;

  if (wireStyle === "bezier" || wireStyle === "curve") {
    [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });
  } else {
    [edgePath, labelX, labelY] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });
  }

  // Edge line styling based on breakpoint status
  const baseStroke = isBreakpoint
    ? "#ef4444"
    : style.stroke || "#94a3b8";
  const strokeWidth = isBreakpoint ? (style.strokeWidth || 2) + 1 : style.strokeWidth || 2;

  const edgeStyle = {
    ...style,
    stroke: baseStroke,
    strokeWidth,
    strokeDasharray: isBreakpoint ? "6, 4" : style.strokeDasharray || "none",
    transition: "stroke 0.2s ease, stroke-width 0.2s ease",
    filter: isBreakpoint ? "drop-shadow(0 0 4px rgba(239, 68, 68, 0.6))" : undefined,
  };

  // Determine edge label text (either explicit label or formatted condition key/op/val)
  const condition = data?.condition;
  const conditionLabel = condition?.key
    ? `${condition.key} ${condition.operator || "=="} ${condition.value !== undefined ? condition.value : ""}`.trim()
    : null;
  const displayLabel = label || conditionLabel;

  return (
    <>
      <style>{`
        @keyframes bpPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.85; }
        }
      `}</style>
      <BaseEdge
        id={id}
        path={edgePath}
        style={edgeStyle}
        markerEnd={markerEnd}
        interactionWidth={interactionWidth}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
          className="nodrag nopan"
        >
          {displayLabel && (
            <div
              style={{
                padding: "2px 8px",
                borderRadius: "4px",
                fontSize: "11px",
                fontWeight: 600,
                backgroundColor: "rgba(255, 255, 255, 0.85)",
                backdropFilter: "blur(4px)",
                color: "#334155",
                border: "1px solid rgba(203, 213, 225, 0.8)",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
                whiteSpace: "nowrap",
                ...labelStyle,
              }}
            >
              {displayLabel}
            </div>
          )}
          {isBreakpoint && (
            <div
              title="🛑 Breakpoint Active (Flow will pause here). Alt+Click wire to toggle off."
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 22,
                height: 22,
                borderRadius: "50%",
                backgroundColor: "#ef4444",
                color: "#ffffff",
                fontSize: "11px",
                fontWeight: "bold",
                boxShadow: "0 0 10px rgba(239, 68, 68, 0.8), 0 2px 4px rgba(0, 0, 0, 0.3)",
                border: "2px solid #ffffff",
                cursor: "pointer",
                animation: "bpPulse 2s infinite",
              }}
            >
              🛑
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default memo(BreakpointEdge);
