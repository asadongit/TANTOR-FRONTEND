import React from "react";
import { Handle, Position } from "reactflow";
import { FilePlus } from "lucide-react";

export const DefineNode = ({ id, data }) => {
  return (
    <div className="bg-white rounded-lg p-4 shadow-md border-2 border-[#8E77BB] min-w-[250px] max-w-[280px] relative group">

      <Handle type="source" position={Position.Right} />

      <div className="flex items-center space-x-3 mb-3">
        <FilePlus className="w-5 h-5 text-[#96CF7B]" />
        <h3 className="text-black font-medium">Define</h3>
      </div>

      <div className="space-y-1.5">
        <div>
          <label className="text-xs font-semibold text-black mb-0.5 block">
            Name
          </label>
          <input
            type="text"
            className="w-full p-1 text-[10px] bg-white rounded-sm border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
            placeholder="Enter transformation name"
            value={data.name || ""}
            onChange={(e) => data.onDataChange({ name: e.target.value })}
          />
        </div>
        <div className="mb-2">
          <label className="text-xs font-semibold text-black mb-0.5 block">
            Description
          </label>
          <textarea
            className="w-full p-1 text-[10px] bg-white rounded-sm border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
            placeholder="Enter description"
            rows="2"
            value={data.description || ""}
            onChange={(e) => data.onDataChange({ description: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
};
