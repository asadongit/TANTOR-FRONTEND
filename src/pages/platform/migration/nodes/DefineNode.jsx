import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Handle, Position } from 'reactflow';
import { Upload, X } from 'lucide-react';
import { useCSV } from '../context/CSVcontext';

export function DefineNode({ id }) {
  const { setData } = useCSV();
  const [csvInfo, setCsvInfo] = useState({ name: '', rowCount: 0 });


  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg border-2 border-[#8E77BB] min-w-[200px] relative group">
      <button
        onClick={() => window.deleteNode?.(id)}
        className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4 text-white" />
      </button>

      <Handle type="source" position={Position.Right} />

      <div className="flex items-center space-x-3 mb-3">
        <Upload className="w-5 h-5 text-[#96CF7B]" />
        <h3 className="text-white font-medium">Define</h3>
      </div>

      <label className="flex items-center justify-center w-full h-24 px-4 transition bg-gray-700 border-2 border-gray-600 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-500 focus:outline-none">
        <span className="flex items-center space-x-2">
          <Upload className="w-6 h-6 text-gray-400" />
          <span className="text-sm text-gray-400">Drop your file here or click to upload</span>
        </span>
        <input type="file" accept=".csv" className="hidden" onChange='#' />
      </label>

      {csvInfo.name && (
        <div className="mt-4 text-sm text-white">
          <p>{csvInfo.name}</p>
          <p> {csvInfo.rowCount} Rows</p>
        </div>
      )}
    </div>
  );
}

DefineNode.propTypes = {
  id: PropTypes.string.isRequired
};
