import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Handle, Position } from "reactflow";
import { useWorkflow } from "../context/WorkflowContext";
import { Minus, X } from "lucide-react";
import { CustomHandle } from "../components/CustomHandle";
export function DefineNode({ id, data, selected }) {
  // console.log("Define-Data----------", data);

  const [nodeData, setNodeData] = useState({
    name: data.define?.name || "",
    description: data.define?.description || "",
  });

  const pipelineId = data?.pipelineId;
  const isPipelineNode = pipelineId !== undefined;
  const ID = isPipelineNode ? pipelineId : id;

  const { updateData } = useWorkflow();

  const handleInputChange = (e, field) => {
    const value = e.target.value;
    setNodeData((prevState) => ({
      ...prevState,
      [field]: value,
    }));
  };

  // const handleBlur = () => {
  //   updateData(ID, isPipelineNode, "define", nodeData);
  // };

  useEffect(() => {
    if (nodeData) {
      updateData(ID, isPipelineNode, "define", nodeData);
    }
  }, [nodeData,pipelineId]);


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

      <CustomHandle type="source" position={Position.Right} />

      <div>
        <label className="text-xs font-semibold text-black mb-0.5 block">
          Name
        </label>
        <input
          type="text"
          value={nodeData.name}
          placeholder={`${data.category} Name`}
          onChange={(e) => handleInputChange(e, "name")}
          // onBlur={() => handleBlur("name")}
          className="w-full p-1 text-[10px] bg-white rounded-sm border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
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
