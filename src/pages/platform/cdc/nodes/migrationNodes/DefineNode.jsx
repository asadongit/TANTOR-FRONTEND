import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {  Position } from "reactflow";
import { Upload, X } from "lucide-react";
import { Handle } from "../../components/CustomHandle";
export function DefineNode({ id, data, selected }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const pipelineId = data?.pipelineId;
  const isPipelineNode = pipelineId !== undefined;
  const ID = isPipelineNode ? pipelineId : id;


  return (
    <div
    className={`bg-white rounded-lg p-3 pt-2 shadow-md border-2 ${
      selected ? "border-[#8E77BB]" : "border-gray-300"
    } w-fit min-w-[18vw] max-w-[90vw] relative group grid grid-cols-[repeat(auto-fit,minmax(min-content,1fr))]`}
  >
    <div className="flex justify-between items-center mb-2">
      <div className="flex items-center gap-1">
        <iconify-icon
          icon="material-symbols-light:contract-outline"
          style={{ color: "#8e78b7" }}
          width="24"
          height="24"
        ></iconify-icon>

        <h3 className="text-black font-medium">Define {data.category}</h3>
      </div>

      {!isPipelineNode && (
        <div className="flex space-x-2">
          <button className="p-1">
            <Minus className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          </button>
          <button onClick={() => window.deleteNode?.(id)} className="p-1">
            <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          </button>
        </div>
      )}
    </div>

    <Handle type="source" position={Position.Right} />


      <div className="space-y-1.5">
        <div>
          <label className="text-xs font-semibold text-black mb-0.5 block">
            Name
          </label>
          <input
            type="text"
            placeholder="Source Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-1 text-[10px] bg-white rounded-sm border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-black mb-0.5 block">
            Description
          </label>
          <input
            type="text"
            placeholder="Add Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-1 text-[10px] bg-white rounded-sm border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
          />
        </div>
      </div>
    </div>
  );
}

DefineNode.propTypes = {
  id: PropTypes.string.isRequired,
};
