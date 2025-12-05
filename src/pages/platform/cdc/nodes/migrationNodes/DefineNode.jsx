import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { Position } from "reactflow";
import { Minus, X } from "lucide-react";
import { Handle } from "../../components/CustomHandle";
import { useWorkflow } from "../../context/WorkflowContext";
import { useArchivalData } from "../../../../../hooks/platform/archival";
export function DefineNode({ id, data, selected }) {
  const { data: MigrationData=[], isLoading: isMigrationLoading, error: MigrationError } = useArchivalData();
  const [nodeData, setNodeData] = useState({
    name: data.define?.name || "",
    description: data.define?.description || "",
    autoName: data.define?.autoName || "",
  });

  const isEditMode = data?.isEditMode;
  const pipelineId = data?.pipelineId;
  const isPipelineNode = pipelineId !== undefined;
  const ID = isPipelineNode ? pipelineId : id;

  const { updateData, pipelines } = useWorkflow();

  // Use ref to track if initial data has been set
  const initializedRef = useRef(false);
  const prevSourceRef = useRef(null);
  const prevNodeDataRef = useRef(null);

  const handleInputChange = (e, field) => {
    const value = e.target.value;
    setNodeData((prevState) => ({
      ...prevState,
      [field]: value,
    }));
  };

  // Initialize node with pre-populated data in edit mode - run once
  useEffect(() => {
    if (initializedRef.current) return;

    if (data?.define && Object.keys(data.define).length > 0) {
      const defineData = data.define;
      initializedRef.current = true;

      setNodeData({
        name: defineData.name || "",
        description: defineData.description || "",
        autoName: defineData.autoName || "",
      });
    }
  }, [data?.define]);

  // Auto-generate name only when NOT in edit mode and source changes
  useEffect(() => {
    if (isEditMode) return;
    if (data?.define?.name && data?.define?.name.trim() !== "") return;

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
      : "";

    // Check if source actually changed to avoid unnecessary updates
    const sourceKey = JSON.stringify(firstSource);
    if (sourceKey === prevSourceRef.current || !sourceName) return;
    prevSourceRef.current = sourceKey;

    const migrationAutoNames = MigrationData?.map(item => item.migration_auto_name) || [];
    let nameCount = migrationAutoNames?.filter(name =>
      typeof name === 'string' &&
      name.toLowerCase() === sourceName.toLowerCase()
    ).length;

    const newName = `${sourceName}${nameCount + 1}`;

    setNodeData((prevData) => ({
      ...prevData,
      name: newName,
      autoName: sourceName
    }));
  }, [
    pipelines[ID]?.data?.source,
    data?.source,
    isPipelineNode,
    MigrationData,
    isEditMode,
    data?.define?.name,
    ID
  ]);

  // Sync nodeData changes to workflow context - with change detection
  useEffect(() => {
    if (!nodeData.name && !nodeData.description) return;

    const currentDataStr = JSON.stringify(nodeData);
    if (prevNodeDataRef.current === currentDataStr) return;

    prevNodeDataRef.current = currentDataStr;
    updateData(ID, isPipelineNode, "define", nodeData);
  }, [nodeData, ID, isPipelineNode]); // eslint-disable-line react-hooks/exhaustive-deps



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

      <div>
        <label className="text-xs font-semibold text-black mb-0.5 block">
          Name
        </label>
        <input
          type="text"
          value={nodeData.name}
          disabled={isEditMode}
          placeholder={`${data.category} Name`}
          onChange={(e) => handleInputChange(e, "name")}
          // onBlur={() => handleBlur("name")}
          className={`w-full p-1 text-[10px] bg-white rounded-sm border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 ${isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        />
      </div>

      <div className="mt-2">
        <label className="text-xs font-semibold text-black mb-0.5 block">
          Description
        </label>
        <textarea
          value={nodeData.description}
          placeholder="Enter description..."
          onChange={(e) => handleInputChange(e, "description")}
          // onBlur={() => handleBlur("description")}
          className="w-full p-1 text-[10px] bg-white rounded-sm border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
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
