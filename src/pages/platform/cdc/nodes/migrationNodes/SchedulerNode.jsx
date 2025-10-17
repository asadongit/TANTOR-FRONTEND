import React, { useState, useCallback, useMemo, useEffect } from "react";
import PropTypes from "prop-types";
import { Position } from "reactflow";
import { Minus, X } from "lucide-react";
import { Handle } from "../../components/CustomHandle";
import { toast } from "react-hot-toast";
import { useNavigate } from 'react-router-dom';
import { encrypt } from "../../../../../utils/Crypto";
import { useModal } from "../../context/ModalProvider";
import { useWorkflow } from "../../context/WorkflowContext";
import { useAuth } from "../../../../../context/AuthContext";

export function SchedulerNode({ id, data, selected}) { 
  const pipelineId = data?.pipelineId;
  const isPipelineNode = pipelineId !== undefined;
  const ID = isPipelineNode ? pipelineId : id; 
  const { token, decodedToken, project, hostnameV2 } = useAuth();
  const navigate = useNavigate();
  const { openModal, closeModal } = useModal();
  const { updatePipelineData, deletePipeline, pipelines, setNodes, nodes, edges, getEnhancedNodeData } = useWorkflow();
  
  const [selectedOption, setSelectedOption] = useState("manual");
  const [intervalType, setIntervalType] = useState("hours");
  const [intervalValue, setIntervalValue] = useState(1);
  const [frequency, setFrequency] = useState(1);
  const [scheduleColumn, setScheduleColumn] = useState("");
  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");

  // Initialize node with pre-populated data in edit mode
  useEffect(() => {
    if (data?.scheduler && Object.keys(data.scheduler).length > 0) {
      const schedulerData = data.scheduler;
      
      // Pre-populate scheduler options
      if (schedulerData.mode) {
        setSelectedOption(schedulerData.mode);
      }
      
      if (schedulerData.column) {
        setScheduleColumn(schedulerData.column);
      }
      
      if (schedulerData.startDateTime) {
        setStartDateTime(schedulerData.startDateTime);
      }
      
      if (schedulerData.endDateTime) {
        setEndDateTime(schedulerData.endDateTime);
      }
      
      if (schedulerData.intervalType) {
        setIntervalType(schedulerData.intervalType);
      }
      
      if (schedulerData.intervalValue) {
        setIntervalValue(schedulerData.intervalValue);
      }
      
      if (schedulerData.frequency) {
        setFrequency(schedulerData.frequency);
      }
    }
  }, [data?.scheduler]);
  
  const availableColumns = useMemo(() => {
    const sourceColumns = data?.source?.columns || [];
    return sourceColumns.length > 0 
      ? sourceColumns 
      : [
          { name: "created_at" },
          { name: "updated_at" },
          { name: "timestamp" },
          { name: "date" }
        ];
  }, [data?.source?.columns]);

  const handleOptionChange = useCallback((event) => {
    setSelectedOption(event.target.value);
  }, []);

  const handleIntervalTypeChange = (event) => {
    setIntervalType(event.target.value);
  };
  
  const showFrequency = intervalType === "months" || intervalType === "years";

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
      toast.error("Please provide a name for the Migration!", { duration: 4000 });
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

    // if (selectedOption === "auto") {
    //   if (!scheduleColumn) {
    //     toast.error("Schedule column name is required for auto mode!", { duration: 4000 });
    //     return;
    //   }
    //   if (!startDateTime) {
    //     toast.error("Start date & time is required for auto mode!", { duration: 4000 });
    //     return;
    //   }
    //   if (!intervalValue || intervalValue <= 0) {
    //     toast.error("Interval value must be greater than 0!", { duration: 4000 });
    //     return;
    //   }
    // } else {
    //   if (!startDateTime) {
    //     toast.error("Start load date is required!", { duration: 4000 });
    //     return;
    //   }
    //   if (!endDateTime) {
    //     toast.error("End load date is required!", { duration: 4000 });
    //     return;
    //   }
    // }
  
    const schedulerData = selectedOption === "auto" ? {
      mode: "auto",
      column: scheduleColumn,
      startDateTime,
      intervalType,
      intervalValue,
      ...(showFrequency && { frequency })
    } : {
      mode: "manual",
      startDateTime,
      endDateTime
    };

    // Use the enhanced node data function for better data storage
    const allNodeData = getEnhancedNodeData();
    
    const finalPayload = {
      project: project,
      created_by: decodedToken.preferred_username,
      migration_name: pipelineData.define?.name,
      migration_auto_name: pipelineData.define?.autoName,
      description: pipelineData.define?.description || "",
      source_conn_id: pipelineData.source?.source_conn_id,
      target_conn_id: pipelineData.target?.target_conn_id,
      source_conn_name: pipelineData.source?.connection,
      target_conn_name: pipelineData.target?.connection,
      source_schema: pipelineData.source?.schema,
      target_schema: pipelineData.target?.schema,
      source_conn_type: pipelineData.source?.type,
      target_conn_type: pipelineData.target?.type,
      migration_list: pipelineData.target?.bulk_list || [],
      op_types: pipelineData.source?.op_types || {},
      scheduler: schedulerData,
      ui_json: allNodeData
    };

    
    try {
      const response = await fetch(`${hostnameV2}/create-migration`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(finalPayload),
      });
  
      const responseData = await response.json();
      // console.log("Response:", responseData);
      
      setTimeout(() => {
        setNodes([]);
        openModal({
          title: "Success!",
          message: "Your Migration has been saved successfully.",
          type: "success",
          onClose: () => handleClose(),
        });
      }, 800);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to save Migration. Please try again.", { duration: 4000 });
    }
  };
  
  const handleClose = () => {
    closeModal();
    deletePipeline(ID);
    setTimeout(() => {
      navigate(`/migration`);
    }, 800);
  };

  return (
    <div
      className={`bg-white rounded-lg p-3 pt-2 shadow-md border-2 ${
        selected ? "border-[#8E77BB]" : "border-gray-300"
      } w-fit min-w-[18vw] max-w-[90vw] relative group`}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-1">
          <iconify-icon icon="material-symbols-light:alarm-outline" style={{ color: "#8e78b7" }} width="24" height="24"></iconify-icon>
          <h3 className="text-black font-medium">Scheduler</h3>
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
    
      <Handle type="target" position={Position.Left} />

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

      {selectedOption === "auto" && (
        <div className="space-y-3 mt-4 w-full">
          <div className="w-full">
            <label
              htmlFor="schedule-column"
              className="block text-xs text-black font-semibold mb-1"
            >
              Schedule On
            </label>
            <select
              id="schedule-column"
              value={scheduleColumn}
              onChange={(e) => setScheduleColumn(e.target.value)}
              className="w-full border border-gray-700 rounded px-3 py-1.5 text-xs text-gray-700 focus:ring-2 focus:ring-[#8e78b7]"
            >
              <option value="">Select Column</option>
              {data?.source?.columns?.map((column, index) => (
                <option key={index} value={column.name || column}>
                  {column.name || column}
                </option>
              )) || [
                <option key="created_at" value="created_at">created_at</option>,
                <option key="updated_at" value="updated_at">updated_at</option>,
                <option key="timestamp" value="timestamp">timestamp</option>,
                <option key="date" value="date">date</option>
              ]}
            </select>
          </div>
          
          <div className="w-full">
            <label
              htmlFor="start-datetime"
              className="block text-xs text-black font-semibold mb-1"
            >
              Start Date & Time (IST)
            </label>
            <input
              type="datetime-local"
              id="start-datetime"
              value={startDateTime}
              onChange={(e) => setStartDateTime(e.target.value)}
              className="w-full border border-gray-700 rounded px-3 py-1.5 text-xs text-gray-700 focus:ring-2 focus:ring-[#8e78b7]"
            />
          </div>
          
          <div className="w-full">
            <label className="block text-xs text-black font-semibold mb-1">
              Scheduler Interval
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                value={intervalValue}
                onChange={(e) => setIntervalValue(parseInt(e.target.value) || 0)}
                className="w-1/2 border border-gray-700 rounded px-3 py-1.5 text-xs text-gray-700 focus:ring-2 focus:ring-[#8e78b7]"
              />
              <select
                value={intervalType}
                onChange={handleIntervalTypeChange}
                className="w-1/2 border border-gray-700 rounded px-3 py-1.5 text-xs text-gray-700 focus:ring-2 focus:ring-[#8e78b7]"
              >
                <option value="hours">Hours</option>
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
                <option value="months">Months</option>
                <option value="years">Years</option>
              </select>
            </div>
          </div>
          
          {showFrequency && (
            <div className="w-full">
              <label
                htmlFor="frequency"
                className="block text-xs text-black font-semibold mb-1"
              >
                Frequency
              </label>
              <input
                type="number"
                id="frequency"
                min="1"
                value={frequency}
                onChange={(e) => setFrequency(parseInt(e.target.value) || 1)}
                className="w-full border border-gray-700 rounded px-3 py-1.5 text-xs text-gray-700 focus:ring-2 focus:ring-[#8e78b7]"
              />
            </div>
          )}
        </div>
      )}

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
              value={startDateTime}
              onChange={(e) => setStartDateTime(e.target.value)}
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
              value={endDateTime}
              onChange={(e) => setEndDateTime(e.target.value)}
              className="w-full border border-gray-700 rounded px-3 py-1.5 text-xs text-gray-700 focus:ring-2 focus:ring-[#8e78b7]"
            />
          </div>
        </div>
      )}

      <div className="flex space-x-2 mt-4">
        <button 
          className="bg-transparent hover:bg-[#8e78b7] text-xs text-gray-700 font-semibold hover:text-white py-2 px-10 border border-gray-700 hover:border-transparent rounded"
          onClick={() => deletePipeline(ID)}
        >
          Cancel
        </button>
        <button 
          className="bg-transparent hover:bg-[#8e78b7] text-xs text-gray-700 font-semibold hover:text-white py-2 px-10 border border-gray-700 hover:border-transparent rounded"
          onClick={() => openModal({
            title: "Save Confirmation",
            message: "Are you sure you want to save this Migration?",
            type: "question",
            confirmText: "Yes",
            loadingText: "Saving",
            onConfirm: () => handleSave(), 
          })}
        >
          SAVE
        </button>
      </div>
    </div>
  );
}

SchedulerNode.propTypes = {
  id: PropTypes.string.isRequired,
  data: PropTypes.object,
  selected: PropTypes.bool
};