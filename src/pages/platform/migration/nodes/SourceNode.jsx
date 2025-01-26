import React, { useState, useCallback } from "react";
import PropTypes from "prop-types";
import { Handle, Position } from "reactflow";
import { Upload, X } from "lucide-react";

export function SourceNode({ id }) {
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
        <Upload className="w-5 h-5 text-[#96CF7B]" />
        <h3 className="text-black font-medium">Source</h3>
      </div>

      <div className="space-y-1.5">
        <div>
          <label className="text-xs font-semibold text-black mb-0.5 block">
            Connection
          </label>
          <input
            type="text"
            placeholder="Source Name"
            className="w-full p-1 text-[10px] bg-white rounded-sm border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-black mb-0.5 block">
            Schema
          </label>
          <div className="flex items-center">
            <select className="w-full p-1 text-[10px] bg-white rounded-sm border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400">
              <option>Select</option>
            </select>
            <span className="ml-5 text-black font-bold">17</span>
          </div>
        </div>
      </div>

      <div className="space-y-4 mt-3">
        <label className="text-xs font-semibold text-black mb-0.5 block">
          Migration Scope
        </label>
        {/* Table Selection */}
        <div className="flex gap-4 items-center">
          <label className="text-xs text-black font-medium">Table</label>
          <div className="flex items-center">
            <input
              type="radio"
              id="table-bulk"
              name="table"
              value="bulk"
              defaultChecked
              className="h-3 w-3 border-gray-300 text-blue-600 focus:ring-blue-500 ml-10"
            />
            <label htmlFor="table-bulk" className="ml-2 text-xs text-gray-700">
              Bulk
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="radio"
              id="table-subset"
              name="table"
              value="subset"
              className="h-3 w-3 border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="table-subset"
              className="ml-2 text-xs text-gray-700"
            >
              Subset
            </label>
          </div>
        </div>
      </div>
      <button class="bg-transparent hover:bg-[#8e78b7] text-xs text-gray-700 font-semibold hover:text-white py-2 px-24 border border-gray-700 hover:border-transparent rounded mt-4">
        OK
      </button>
    </div>
  );
}

SourceNode.propTypes = {
  id: PropTypes.string.isRequired,
};
