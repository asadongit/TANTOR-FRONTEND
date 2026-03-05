import React, { useEffect, useState, useRef } from "react";
import { Icon } from "@iconify-icon/react";
import { Info, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { useAuth } from "../../../../../context/AuthContext";
import bookmarkAddSvg from "../../../../../assets/ai/bookmark_add.svg";

const COLORS = {
  all: "#5B63D3",
  Deployed: "#10B981",
  Archived: "#64748B",
  Saved: "#8B5CF6",
  Auto: "#EC4899",
  Manual: "#F59E0B",
  Swift: "#06B6D4",
  edge: "#b9bdc6",
};

export default function ModelFlow() {
  const { token } = useAuth();
  const hostnameAI = window._env_?.VITE_AI_API;

  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hover, setHover] = useState(null);
  const [showInfo, setShowInfo] = useState(false);

  const [zoom, setZoom] = useState(1.2);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(`${hostnameAI}/canvas/model/metrics/summary`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => alive && setMetrics(data))
      .catch(() => alive && setMetrics(null))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [hostnameAI, token]);

  // Zoom handlers
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prevZoom) => Math.min(Math.max(0.5, prevZoom + delta), 3));
  };

  const handleZoomIn = () => {
    setZoom((prevZoom) => Math.min(prevZoom + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoom((prevZoom) => Math.max(prevZoom - 0.2, 0.5));
  };

  const handleReset = () => {
    setZoom(1.2);
    setPan({ x: 0, y: 0 });
  };

  // Pan handlers
  const handleMouseDown = (e) => {
    if (e.button === 0) { // Left mouse button
      setIsDragging(true);
      setDragStart({
        x: e.clientX - pan.x,
        y: e.clientY - pan.y,
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, dragStart, pan]);

  if (loading || !metrics) {
    return (
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm h-full">
        <div className="h-[400px] grid place-items-center text-gray-500">
          {loading ? "Loading..." : "No data available"}
        </div>
      </div>
    );
  }

  // Normalize case sensitivity
  const statusCounts = {
    Deployed: metrics.status_counts.Deployed || 0,
    Archived: metrics.status_counts.Archived || 0,
    Saved: metrics.status_counts.Saved || 0,
  };

  const allModelsCount = Object.values(statusCounts).reduce((a, b) => a + b, 0);
  const autoCount = metrics.run_mode_counts.Auto || 0;
  const manualCount = metrics.run_mode_counts.Manual || 0;
  const swiftCount = metrics.run_type_counts.Swift || 0;

  // Layout
  const W = 1000, H = 200;
  const padding = { top: 50, left: 60, right: 60 };

  // Column positions
  const cols = {
    allModels: padding.left,
    status: 220,
    mode: 480,
    type: 740,
  };

  // Node dimensions
  const nodeW = 140;
  const nodeH = 70;

  // All Models node (centered vertically)
  const allNode = {
    x: cols.allModels,
    y: H / 2 - nodeH / 2,
    w: nodeW,
    h: nodeH,
    label: "All Models",
    value: allModelsCount,
    color: COLORS.all,
  };

  // Status nodes (deployed, archived, saved) - distributed vertically
  const statusLabels = ["Deployed", "Archived", "Saved"];
  const statusGap = 20;
  const statusTotalHeight = statusLabels.length * nodeH + (statusLabels.length - 1) * statusGap;
  const statusStartY = (H - statusTotalHeight) / 2;

  const statusNodes = statusLabels.map((status, i) => ({
    id: status,
    x: cols.status,
    y: statusStartY + i * (nodeH + statusGap),
    w: nodeW,
    h: nodeH,
    label: status.charAt(0).toUpperCase() + status.slice(1),
    value: statusCounts[status],
    color: COLORS[status],
  }));

  // Mode nodes (Auto, Manual) - centered
  const modeLabels = ["Auto", "Manual"];
  const modeGap = 40;
  const modeTotalHeight = modeLabels.length * nodeH + modeGap;
  const modeStartY = (H - modeTotalHeight) / 2;

  const modeNodes = modeLabels.map((mode, i) => ({
    id: mode,
    x: cols.mode,
    y: modeStartY + i * (nodeH + modeGap),
    w: nodeW,
    h: nodeH,
    label: mode,
    value: mode === "Auto" ? autoCount : manualCount,
    color: COLORS[mode],
  }));

  // Type node (Swift) - centered
  const typeNode = {
    id: "Swift",
    x: cols.type,
    y: H / 2 - nodeH / 2,
    w: nodeW,
    h: nodeH,
    label: "Swift",
    value: swiftCount,
    color: COLORS.Swift,
  };

  // Create edges
  const edges = [];

  // All Models → Status
  statusNodes.forEach((status) => {
    if (status.value > 0) {
      edges.push({
        id: `all-${status.id}`,
        from: { x: allNode.x + allNode.w, y: allNode.y + allNode.h / 2 },
        to: { x: status.x, y: status.y + status.h / 2 },
        value: status.value,
        width: Math.max(3, (status.value / allModelsCount) * 30),
        label: `${status.label}: ${status.value}`,
        color: status.color,
      });
    }
  });

  // Status → Mode
  const autoRunStatus = metrics.auto_run_status_counts || {};
  const manualRunStatus = metrics.manual_run_status_counts || {};

  statusNodes.forEach((status) => {
    const autoVal = autoRunStatus[status.id] || 0;
    const manualVal = manualRunStatus[status.id] || 0;

    if (autoVal > 0) {
      edges.push({
        id: `${status.id}-Auto`,
        from: { x: status.x + status.w, y: status.y + status.h / 2 },
        to: { x: modeNodes[0].x, y: modeNodes[0].y + modeNodes[0].h / 2 },
        value: autoVal,
        width: Math.max(3, (autoVal / allModelsCount) * 30),
        label: `${status.label} → Auto: ${autoVal}`,
        color: COLORS.Auto,
      });
    }

    if (manualVal > 0) {
      edges.push({
        id: `${status.id}-Manual`,
        from: { x: status.x + status.w, y: status.y + status.h / 2 },
        to: { x: modeNodes[1].x, y: modeNodes[1].y + modeNodes[1].h / 2 },
        value: manualVal,
        width: Math.max(3, (manualVal / allModelsCount) * 30),
        label: `${status.label} → Manual: ${manualVal}`,
        color: COLORS.Manual,
      });
    }
  });

  // Mode → Type
  const runTypeModeCounts = metrics.run_type_mode_counts?.Swift || {};
  modeNodes.forEach((mode) => {
    const val = runTypeModeCounts[mode.id] || 0;
    if (val > 0) {
      edges.push({
        id: `${mode.id}-Swift`,
        from: { x: mode.x + mode.w, y: mode.y + mode.h / 2 },
        to: { x: typeNode.x, y: typeNode.y + typeNode.h / 2 },
        value: val,
        width: Math.max(3, (val / swiftCount) * 30),
        label: `${mode.label} → Swift: ${val}`,
        color: COLORS.Swift,
      });
    }
  });

  // Bezier path for smooth curves
  const createPath = (x1, y1, x2, y2) => {
    const cx1 = x1 + (x2 - x1) * 0.4;
    const cx2 = x2 - (x2 - x1) * 0.4;
    return `M${x1},${y1} C${cx1},${y1} ${cx2},${y2} ${x2},${y2}`;
  };

  const handleEdgeHover = (e, edge) => {
    const rect = e.currentTarget.ownerSVGElement.getBoundingClientRect();
    setHover({
      id: edge.id,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      text: edge.label,
    });
  };

  const NodeBox = ({ node }) => (
    <g>
      <rect
        x={node.x}
        y={node.y}
        width={node.w}
        height={node.h}
        rx={10}
        fill={node.color}
        className="drop-shadow-md"
      />
      <text
        x={node.x + node.w / 2}
        y={node.y + node.h / 2 - 8}
        textAnchor="middle"
        fill="white"
        fontSize="15"
        fontWeight="600"
      >
        {node.label}
      </text>
      <text
        x={node.x + node.w / 2}
        y={node.y + node.h / 2 + 14}
        textAnchor="middle"
        fill="white"
        fontSize="20"
        fontWeight="700"
      >
        {node.value}
      </text>
    </g>
  );

  return (
    <div className="bg-white pt-4 px-6 pb-6 rounded-xl border border-gray-200 shadow-sm h-[350px] flex flex-col">
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-[8px]">
          <img src={bookmarkAddSvg} alt="Model Flow" className="w-[21px] h-[21px]" />
          <h3 className="satoshi-medium-md m-0">Model Flow Distribution</h3>
        </div>
        <div className="flex items-center gap-3">
          {/* Zoom controls */}
          <div className="flex items-center gap-0.5 border border-gray-200 rounded-lg p-0.5">
            <button
              onClick={handleZoomOut}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4 text-gray-600" />
            </button>
            <span className="text-xs text-gray-600 min-w-[2.5rem] text-center font-medium">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={handleReset}
              className="p-1 hover:bg-gray-100 rounded transition-colors border-l border-gray-200 ml-0.5"
              title="Reset View"
            >
              <Maximize2 className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          <div className="relative">
            <Info
              className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
              onMouseEnter={() => setShowInfo(true)}
              onMouseLeave={() => setShowInfo(false)}
            />
            {showInfo && (
              <div className="absolute right-0 top-6 z-10 w-64 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-xl">
                Hover over connections to see the flow counts. Use mouse wheel to zoom and drag to pan.
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className="flex-1 overflow-x-auto overflow-y-hidden rounded-lg bg-gradient-to-br from-gray-50 to-white relative border border-gray-100"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-full"
        >
          <defs>
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
              <feOffset dx="0" dy="2" result="offsetblur"/>
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.2"/>
              </feComponentTransfer>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Draw edges */}
            {edges.map((edge) => (
              <path
                key={edge.id}
                d={createPath(edge.from.x, edge.from.y, edge.to.x, edge.to.y)}
                stroke={hover?.id === edge.id ? edge.color : COLORS.edge}
                strokeWidth={hover?.id === edge.id ? edge.width + 4 : edge.width}
                fill="none"
                opacity={hover?.id === edge.id ? 0.9 : 0.4}
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={(e) => handleEdgeHover(e, edge)}
                onMouseMove={(e) => handleEdgeHover(e, edge)}
                onMouseLeave={() => setHover(null)}
                filter="url(#shadow)"
              />
            ))}

            {/* Draw nodes */}
            <NodeBox node={allNode} />
            {statusNodes.map((node) => <NodeBox key={node.id} node={node} />)}
            {modeNodes.map((node) => <NodeBox key={node.id} node={node} />)}
            <NodeBox node={typeNode} />
          </g>

          {/* Tooltip (outside transform group) */}
          {hover && (
            <g pointerEvents="none">
              <rect
                x={hover.x - 60}
                y={hover.y - 35}
                width="120"
                height="30"
                rx="6"
                fill="#1F2937"
                opacity="0.95"
                filter="url(#shadow)"
              />
              <text
                x={hover.x}
                y={hover.y - 15}
                textAnchor="middle"
                fill="white"
                fontSize="11"
                fontWeight="600"
              >
                {hover.text}
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
