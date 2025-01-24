import React, { useState } from "react";
import PropTypes from "prop-types";
import { Handle, Position } from "reactflow";
import { SquareKanban, X, Network,ChevronDown ,ChevronUp } from "lucide-react";

export function ConsolidationNode({ id }) {
      const [isCollapsed, setIsCollapsed] = useState(false);
  return (
    <>
 { 
    !isCollapsed ? (
        <>
        <div className="bg-white rounded-lg p-4 shadow-lg min-w-[300px] relative group">
         <button
        onClick={() => window.deleteNode?.(id)}
        className="absolute -top-2 -right-2 bg-black rounded-full p-1 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4 text-white" />
      </button>

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Network className="w-5 h-5 text-[#8E77BB]" />
                <h3 className="text-black font-medium">Consolidation</h3>
              </div>
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1 rounded-md hover:bg-gray-200"
              >
                {isCollapsed ? (
                  <ChevronDown className="w-5 h-5 text-black" />
                ) : (
                  <ChevronUp className="w-5 h-5 text-black" />
                )}
              </button>
            </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-black mb-1">View</label>
            <select
            //   value={selectedView}
            //   onChange={(e) => setSelectedView(e.target.value)}
              className="w-full bg-white rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-lg group border-solid border-2"
            >
              <option value="" disabled>
                Select a view
              </option>
              <option value="view1">View 1</option>
              <option value="view2">View 2</option>
              <option value="view3">View 3</option>
            </select>
          </div>
        </div>
        </div>
        </>
      ):
    <div className="bg-[#8E77BB] rounded-full p-5 shadow-lg relative group">
      <button
        onClick={() => window.deleteNode?.(id)}
        className="absolute -top-2 -right-2 bg-black rounded-full p-1 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4 text-white" />
      </button>

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />

      <Network className="w-7 h-7 text-white" onClick={() => setIsCollapsed(!isCollapsed)}/>
    </div>
}
    </>
  );
}

ConsolidationNode.propTypes = {
  id: PropTypes.string.isRequired,
};
