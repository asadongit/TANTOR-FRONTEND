import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Handle, Position } from "reactflow";
import { Upload, X } from "lucide-react";

export function DefineNode({ id, data }) {
  const [metadata, setMetadata] = useState({
    metadata_name: data?.metadata_name || '',
    description: data?.description || ''
  });

  useEffect(() => {
    data?.onDataChange?.(metadata);
  }, [metadata, data]);


  return (
    <div className="bg-white rounded-lg p-4 shadow-md border-2 border-[#8E77BB] min-w-[250px] max-w-[280px] relative group">
      <button
        onClick={() => window.deleteNode?.(id)}
        className="absolute top-1.5 right-2 p-1"
      >
        <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
      </button>

      <Handle type="source" position={Position.Right} />

      <div className="flex items-center space-x-3 mb-3">
        <Upload className="w-5 h-5 text-[#96CF7B]" />
        <h3 className="text-black font-medium">Define</h3>
      </div>

      <div className="space-y-1.5">
        <div>
          <label className="text-xs font-semibold text-black mb-0.5 block">Name</label>
          <input
            type="text"
            value={metadata.metadata_name}
            onChange={e => setMetadata({...metadata, metadata_name: e.target.value})}
            placeholder="Source Name"
            className="w-full p-1 text-[10px] bg-white rounded-sm border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-black mb-0.5 block">
            Description
          </label>
          <input
            type="text"
            value={metadata.description}
            onChange={e => setMetadata({...metadata, description: e.target.value})}
            placeholder="Add Description"
            className="w-full p-1 text-[10px] bg-white rounded-sm border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
          />
        </div>
      </div>
    </div>
  );
}

DefineNode.propTypes = {
  id: PropTypes.string.isRequired,
  data: PropTypes.object,
};
