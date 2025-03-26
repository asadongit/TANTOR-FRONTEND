import React, { useState, useCallback } from "react";
import PropTypes from "prop-types";
import { Position } from "reactflow";
import { Minus, X } from "lucide-react";
import { useWorkflow } from "../context/WorkflowContext";
import { CustomHandle } from "../components/CustomHandle";
import { toast as hotToast } from "react-hot-toast";
import { useNavigate } from 'react-router-dom';


export function SchedulerNode({ id, data, selected}) {

  // console.log("SCHEDULAR DATA---------",data)
  const hostname = import.meta.env.VITE_FAST_API;
  const token = import.meta.env.VITE_ACCESS_TOKEN;
  const pipelineId = data?.pipelineId;
  const isPipelineNode = pipelineId !== undefined;
  const ID = isPipelineNode ? pipelineId : id; 


  const navigate = useNavigate();

  const { updatePipelineData,deletePipeline, pipelines,setNodes,setEdge,deleteMappings} = useWorkflow();
  
  const [selectedOption, setSelectedOption] = useState("manual");
  // const { minimizePipeline, deletePipeline } = useWorkflow();
  // const pipelineId = id.split("_").pop();
  const handleOptionChange = useCallback((event) => {
    setSelectedOption(event.target.value);
  }, []);

  
  const handleSave =async () => {
    const pipelineData = pipelines[pipelineId]?.data || {};

    if(!pipelineData.define?.name && !pipelineData.source?.bulk_list || !pipelineData.source?.subset_list || !pipelineData.source?.op_types){
      hotToast.error("Please fill all the required fields!",{  duration: 4000,
      })
    return;
    }

  
    const finalPayload = {
      project: "default",
      created_by: "sorv",
      workflow_name: pipelineData.define?.name ,
      cdc_description: pipelineData.define?.description || "",
      cdc_list: pipelineData.source?.bulk_list || [],
      subset_list: pipelineData.source?.subset_list|| [],
      op_types: pipelineData.source?.op_types || {}
    };
  
    console.log("Final Payload:", finalPayload);

    try {
      const response = await fetch(`${hostname}/create-cdc`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(finalPayload)
      });
  
      const data = await response.json();
      console.log("Response:", data);
  
    } catch (error) {
      console.error("Error:", error);
    }
    hotToast.success("cdc Pipeline ceated successfully!",{  duration: 4000,
    })
    deletePipeline(pipelineId)


    setTimeout(() => {
      navigate('/CDCList')
    }, 500);
  };
  
  return (
<div
  className={`bg-white rounded-lg p-3 pt-2 shadow-md border-2 ${
    selected ? "border-[#8E77BB]" : "border-gray-300"
  } w-fit min-w-[18vw] max-w-[90vw] relative group grid grid-cols-[repeat(auto-fit,minmax(min-content,1fr))]`}
>
  
    <div className="flex justify-between items-center mb-2">
      <div className="flex items-center gap-1">
      <iconify-icon icon="material-symbols-light:alarm-outline" style={{ color: "#8e78b7" }}  width="24" height="24"></iconify-icon>
        <h3 className="text-black font-medium">Schedular</h3>
      </div>
  
      <div className="flex space-x-2">
        <button className="p-1">
          <Minus className="w-4 h-4 text-gray-400 hover:text-gray-600" />
        </button>
        <button onClick={() => isPipelineNode ? deletePipeline(pipelineId) : window.deleteNode?.(id)} className="p-1">
          <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
        </button>
      </div>
    </div>
  
    <CustomHandle type="target" position={Position.Left} />



      <div className="space-y-1.5">
        <div className="flex gap-4 items-center">
          <div className="flex items-center">
            <input
              type="radio"
              id="manual"
              name="scheduleMode"
              value="manual"
              checked={selectedOption === "manual"}
              onChange={handleOptionChange}
              className="h-3 w-3 border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="manual" className="ml-2 text-xs text-gray-700">
              Manual
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="radio"
              id="auto"
              name="scheduleMode"
              value="auto"
              checked={selectedOption === "auto"}
              onChange={handleOptionChange}
              className="h-3 w-3 border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="auto" className="ml-2 text-xs text-gray-700">
              Auto
            </label>
          </div>
        </div>
      </div>

      {selectedOption === "manual" && (
        <div className="space-y-4 mt-4 w-full">
          <div className="w-full">
            <label
              htmlFor="start-date"
              className="block text-xs text-black font-semibold mb-1"
            >
              Start Load Date
            </label>
            <input
              type="datetime-local"
              id="start-date"
              className="w-full border border-gray-700 rounded px-3 py-1.5 text-xs text-gray-700 focus:ring-2 focus:ring-[#8e78b7]"
            />
          </div>
          <div className="w-full">
            <label
              htmlFor="end-date"
              className="block text-xs text-black font-semibold mb-1"
            >
              End Load Date
            </label>
            <input
              type="datetime-local"
              id="end-date"
              className="w-full border border-gray-700 rounded px-3 py-1.5 text-xs text-gray-700 focus:ring-2 focus:ring-[#8e78b7]"
            />
          </div>
        </div>
      )}

      <div className="flex space-x-2 mt-4">
        <button className="bg-transparent hover:bg-[#8e78b7] text-xs text-gray-700 font-semibold hover:text-white py-2 px-10 border border-gray-700 hover:border-transparent rounded">
          Cancel
        </button>
        <button className="bg-transparent hover:bg-[#8e78b7] text-xs text-gray-700 font-semibold hover:text-white py-2 px-10 border border-gray-700 hover:border-transparent rounded"
        onClick={handleSave}
        >
          SAVE
        </button>
      </div>
    </div>
  );
}

SchedulerNode.propTypes = {
  id: PropTypes.string.isRequired,
};
