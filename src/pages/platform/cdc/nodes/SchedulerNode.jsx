import React, { useState, useCallback } from "react";
import PropTypes from "prop-types";
import { Position } from "reactflow";
import { Minus, X } from "lucide-react";
import { useWorkflow } from "../context/WorkflowContext";
import { Handle } from "../components/CustomHandle";
import { toast } from "react-hot-toast";
import { useNavigate } from 'react-router-dom';
import { useModal } from "../context/ModalProvider";
import { encrypt } from "../../../../utils/Crypto";

import { useAuth } from "../../../../context/AuthContext";
export function SchedulerNode({ id, data, selected}) {
  const pipelineId = data?.pipelineId;
  const isPipelineNode = pipelineId !== undefined;
  const ID = isPipelineNode ? pipelineId : id;
const {token,decodedToken ,project, hostnameV2}= useAuth()
  const navigate = useNavigate();
  const {openModal, closeModal}= useModal()

  const { updatePipelineData,deletePipeline, pipelines,setNodes,setEdge,deleteMappings} = useWorkflow();

  const [selectedOption, setSelectedOption] = useState("manual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  // const { minimizePipeline, deletePipeline } = useWorkflow();
  // const pipelineId = id.split("_").pop();
  const handleOptionChange = useCallback((event) => {
    setSelectedOption(event.target.value);
  }, []);




  const handleSave = async () => {
    let pipelineData = {};

    if (isPipelineNode) {
      pipelineData = pipelines[ID]?.data || {};
    } else {
      if (data?.target && Array.isArray(data.target) && data.target.length > 0) {
        const targetData = data.target[0];
        pipelineData = {
          define: targetData.define || {},
          source: targetData.source || {},
          target: targetData
        };
      }
    }
    if (!pipelineData?.define?.name) {
      toast.error("Please provide a name for the CDC!", { duration: 4000 });
      return;
    }

    if (!pipelineData?.source?.source_conn_id) {
      toast.error("Source connection is required!", { duration: 4000 });
      return;
    }

    if (!pipelineData?.target?.target_conn_id) {
      toast.error("Target connection is required!", { duration: 4000 });
      return;
    }

    if (!pipelineData?.target?.bulk_list || pipelineData.target.bulk_list.length === 0) {
      toast.error("Please select at least one table mapping!", { duration: 4000 });
      return;
    }


    const tableOperations = {};

    const tableOpTypes = pipelineData.source?.table_op_types || {};

    const targetTables = pipelineData.target?.bulk_list || [];

    targetTables.forEach(mapping => {
      const sourceTable = mapping.source_table;
      const targetTable = mapping.target_table;

      if (sourceTable && tableOpTypes[sourceTable]) {
        tableOperations[sourceTable] = tableOpTypes[sourceTable];
      } else {
        tableOperations[sourceTable] = pipelineData.source?.op_types || {
          create: true,
          update: false,
          delete: false,
          schemaChanges: false,
          datafederation: false
        };
      }
    });

    tableOperations["scheduler"] = {
      mode: selectedOption,
      startDateTime: startDate,
      endDateTime: endDate
    };

    const finalPayload = {
      project: project,
      created_by: decodedToken.preferred_username,
      cdc_name: pipelineData.define?.name,
      cdc_auto_name: pipelineData.define?.autoName,
      cdc_description: pipelineData.define?.description || "",
      source_conn_id: pipelineData.source?.source_conn_id,
      target_conn_id: pipelineData.target?.target_conn_id,
      source_schema: pipelineData.source?.schema,
      target_schema: pipelineData.target?.schema,
      cdc_list: pipelineData.target?.bulk_list || [],
      op_types: tableOperations,
    };

    try {
      const response = await fetch(`${hostnameV2}/create-cdc`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(finalPayload),
      });

      const data = await response.json();
    } catch (error) {
      console.error("Error:", error);
    }

    setTimeout(() => {
      setNodes([]);
      openModal({
        title: "Success!",
        message: "Your CDC has been saved successfully.",
        type: "success",
        onClose: () => handleClose(),
      });
    }, 800);
  };

  const handleClose =()=>{
    closeModal()
    deletePipeline(ID);
     setTimeout(() => {
          navigate(`/details?${encodeURIComponent(encrypt("componentType=cdc&heading=cdc"))}`);
    }, 800)
      }

  const handleCancel =()=>{
    deletePipeline(ID);
    navigate('/cdc');
  }


  return (
    <div className="bg-white rounded-lg text-black p-4 shadow-md border-2 border-[#8E77BB] min-w-[320px] max-w-[320px] relative group">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center space-x-3">
          <iconify-icon
            icon="material-symbols-light:alarm-outline"
            style={{ color: "#8e78b7" }}
            width="22"
            height="22"
          ></iconify-icon>
          <h3 className="text-black font-medium">Scheduler</h3>
        </div>

        <button
          onClick={() => (isPipelineNode ? deletePipeline(pipelineId) : window.deleteNode?.(id))}
          className="p-1"
        >
          <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
        </button>
      </div>

      <Handle type="target" position={Position.Left} style={{ width: 10, height: 10 }} />

      <div className="mb-3">
        <label className="block text-sm font-semibold text-gray-700 mb-1">Mode</label>
        <div className="flex space-x-4">
          <div className="flex items-center">
            <input
              type="radio"
              id={`manual-${id}`}
              name={`scheduleMode-${id}`}
              value="manual"
              checked={selectedOption === "manual"}
              onChange={handleOptionChange}
            />
            <label htmlFor={`manual-${id}`} className="ml-1">Manual</label>
          </div>
        </div>
      </div>

      {selectedOption === "manual" && (
        <>
          <div className="mb-3">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Start Date &amp; Time</label>
            <input
              type="datetime-local"
              className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="block text-sm font-semibold text-gray-700 mb-1">End Date &amp; Time</label>
            <input
              type="datetime-local"
              className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
            />
          </div>
        </>
      )}

      <div className="flex space-x-4 mt-4">
        <button
          className="bg-white rounded-md border border-gray-300 px-6 py-2 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          onClick={handleCancel}
        >
          Cancel
        </button>

        <button
          className="bg-[#8E77BB] rounded-md border-2 border-[#8E77BB] px-6 py-2 text-white font-medium hover:bg-[#7d68a5] transition-colors"
          onClick={() =>
            openModal({
              title: "Save Confirmation",
              message: "Are you sure you want to save this CDC?",
              type: "question",
              confirmText: "Yes",
              onConfirm: () => handleSave(),
            })
          }
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
