import { useEffect, useRef } from "react";
import ForceGraph2D from "react-force-graph-2d";

export default function DatabotGraphPlot({ graphData }) {
  const fgRef = useRef();

  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.zoom(5.0, 1000);
    }
  }, [graphData]);

  return (
    <div className="w-full h-full bg-[#f8f8f8] p-2">
      <div className="flex flex-col items-end gap-1 mb-2 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span>Column</span>
          <span className="inline-block w-3 h-3 border border-gray-300 bg-[#8d77ba]"></span>
        </div>
        <div className="flex items-center gap-2">
          <span>Table</span>
          <span className="inline-block w-3 h-3 border border-gray-300 bg-[#94cc7c]"></span>
        </div>
      </div>

      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        width={window.innerWidth / 2}
        height={400}
        nodeId="id"
        nodeLabel={(node) => `${node.label} (${node.type})`}
        linkLabel={(link) => link.type}
        nodeColor={(node) => {
          if (node.type === "Table") return "#94cc7c";
          if (node.type === "Column") return "#8d77ba";
          return "#999";
        }}
        linkDirectionalArrowLength={3}
        linkDirectionalArrowRelPos={0.9}
      />
    </div>
  );
}

