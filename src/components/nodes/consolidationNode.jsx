import React, { useState } from "react";
import PropTypes from "prop-types";
import { Handle, Position } from "reactflow";
import { SquareKanban, X, Network } from "lucide-react";

export function ConsolidationNode({ id }) {
  return (
    <div className="bg-[#8E77BB] rounded-full p-5 shadow-lg relative group">
      <button
        onClick={() => window.deleteNode?.(id)}
        className="absolute -top-2 -right-2 bg-black rounded-full p-1 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4 text-white" />
      </button>

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />

      <Network className="w-7 h-7 text-white" />
    </div>
  );
}

ConsolidationNode.propTypes = {
  id: PropTypes.string.isRequired,
};
