import React from "react";
import { Handle, Position } from "reactflow";
import { X, Pencil } from "lucide-react";

export const TransformationNode = ({ id, data }) => {
  return (
    <div className="bg-white rounded-lg p-4 shadow-md border-2 border-[#8E77BB] min-w-[250px] max-w-[280px] relative group">
      <button
        onClick={() => window.deleteNode?.(id)}
        className="absolute top-1.5 right-2 p-1"
      >
        <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
      </button>

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />

      <div className="flex items-center space-x-3 mb-3">
        <Pencil className="w-5 h-5 text-[#96CF7B]" />
        <h3 className="text-black font-medium">Transformation</h3>
      </div>

      <div className="space-y-1.5">

      </div>
    </div>
  );
};
