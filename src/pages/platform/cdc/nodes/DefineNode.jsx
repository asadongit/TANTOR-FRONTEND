import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Position } from "reactflow";
import { useWorkflow } from "../context/WorkflowContext";
import { Minus, X } from "lucide-react";
import { Handle } from "../components/CustomHandle";
import { useCDCData } from "../../../../hooks/platform/cdc";
export function DefineNode({ id, data, selected }) {
const { data: CDCData=[], isLoading: isCDCLoading, error: CDCError } = useCDCData();
  const [nodeData, setNodeData] = useState({
    name: data.define?.name || "",
    description: data.define?.description || "",
    autoName:data.define?.autoName || "",
  });

  const pipelineId = data?.pipelineId;
  const isPipelineNode = pipelineId !== undefined;
  const ID = isPipelineNode ? pipelineId : id;

  const { updateData, pipelines } = useWorkflow();
  const handleInputChange = (e, field) => {
    const value = e.target.value;
    setNodeData((prevState) => ({
      ...prevState,
      [field]: value,
    }));
  };


useEffect(() => {
  const cdcAutoNames = CDCData.map(item => item.cdc_auto_name);
  const sourceData = isPipelineNode
    ? pipelines[ID]?.data?.source
    : data?.source;

  const firstSource = sourceData
    ? Array.isArray(sourceData)
      ? sourceData[0]
      : sourceData
    : null;


    const sourceName = firstSource?.connection && firstSource?.schema && firstSource?.mode
    ? `${firstSource.connection}_${firstSource.schema}_${firstSource.mode}`
    : nodeData.name;
    let nameCount = cdcAutoNames.filter(name => name.toLowerCase() === sourceName.toLowerCase()).length;
  if (isPipelineNode) {
    if (sourceName && sourceName !== nodeData.name) {
      setNodeData((prevData) => ({
        ...prevData,
        name: `${sourceName}${nameCount+1}`,
        autoName:sourceName
      }));
    }
  } else {

    if (sourceName && (!nodeData.name || nodeData.name.trim() === "" || sourceName !== nodeData.name)) {
      setNodeData((prevData) => ({
        ...prevData,
        name: `${sourceName}${nameCount}`,
        autoName:sourceName
      }));
    }
  }

  updateData(ID, isPipelineNode, "define", nodeData);

}, [
  pipelines[ID]?.data?.define?.name,
  pipelines[ID]?.data?.source,
  data?.source,
  isPipelineNode,
  nodeData.name,
]);




  return (
    <div className="bg-white text-black rounded-lg p-4 shadow-md border-2 border-[#8E77BB] min-w-[300px] max-w-[380px] relative group">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center space-x-3">
          <iconify-icon
            icon="material-symbols-light:contract-outline"
            style={{ color: "#8e78b7" }}
            width="22"
            height="22"
          ></iconify-icon>
          <h3 className="text-black font-medium">Define</h3>
        </div>

        {!isPipelineNode && (
          <button onClick={() => window.deleteNode?.(id)} className="p-1">
            <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      <Handle type="source" position={Position.Right} style={{ width: 10, height: 10 }} />

      <div className="mb-3 w-full">
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Name<span className="text-red-500">*</span>
        </label>
        <input
          className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
          type="text"
          value={nodeData.name}
          placeholder="Enter CDC name"
          onChange={(e) => handleInputChange(e, "name")}
        />
      </div>

      <div className="mb-1 w-full">
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Description
        </label>
        <textarea
          className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm resize-y min-h-[48px] focus:outline-none focus:ring-2 focus:ring-purple-300"
          value={nodeData.description}
          placeholder="Enter description"
          onChange={(e) => handleInputChange(e, "description")}
        />
      </div>
    </div>
  );
}

DefineNode.propTypes = {
  id: PropTypes.string.isRequired,
  data: PropTypes.shape({
    pipelineId: PropTypes.string.isRequired,
    category: PropTypes.string,
    define: PropTypes.shape({
      name: PropTypes.string,
      description: PropTypes.string,
    }),
  }).isRequired,
};

export default DefineNode;
