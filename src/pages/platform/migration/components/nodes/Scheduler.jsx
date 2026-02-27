import { Handle, Position } from '@xyflow/react';
import { useMigrationContext } from '../MigrationContext';
import { Calendar, X } from "lucide-react";
import { useState, useEffect } from 'react';

export default function Scheduler({ id }) {
  const { migrationData, updateNodeData } = useMigrationContext();
  const [selectedOption, setSelectedOption] = useState(migrationData[id]?.mode || "manual");
  const [scheduleColumn, setScheduleColumn] = useState(migrationData[id]?.column || "");
  const [startDateTime, setStartDateTime] = useState(migrationData[id]?.startDateTime || "");
  const [endDateTime, setEndDateTime] = useState(migrationData[id]?.endDateTime || "");
  const [intervalType, setIntervalType] = useState(migrationData[id]?.intervalType || "Hours");
  const [intervalValue, setIntervalValue] = useState(migrationData[id]?.intervalValue || 1);
  const [showFrequency, setShowFrequency] = useState(false);
  const [frequency, setFrequency] = useState(migrationData[id]?.frequency || "");

  const minDateTime = new Date().toISOString().slice(0, 16);

  useEffect(() => {
    const schedulerData = selectedOption === "auto" ? {
      mode: "auto",
      column: scheduleColumn,
      startDateTime,
      intervalType,
      intervalValue,
      ...(showFrequency && { frequency }),
    } : {
      mode: "manual",
      startDateTime,
      endDateTime
    };
    updateNodeData(id, schedulerData);
  }, [selectedOption, scheduleColumn, startDateTime, endDateTime, intervalType, intervalValue, showFrequency, frequency]);

  return (
    <div className="bg-white rounded-lg p-4 shadow-md border-2 border-[#8E77BB] min-w-[320px] max-w-[320px] relative group">
      <button
        onClick={() => window.deleteNode?.(id)}
        className="absolute top-1.5 right-2 p-1"
      >
        <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
      </button>

      <Handle type="target" position={Position.Left} style={{ width: 10, height: 10 }} />
      <Handle type="source" position={Position.Right} style={{ width: 10, height: 10 }} />

      <div className="flex items-center space-x-3 mb-3">
        <Calendar className="w-5 h-5 text-[#8E77BB]" />
        <h3 className="text-black font-medium">Scheduler</h3>
      </div>

      <div className="mb-3">
        <label className="block text-sm font-semibold text-gray-700 mb-1">Mode</label>
        <div className="flex space-x-4">
          <div className="flex items-center">
            <input
              type="radio"
              id={`manual-${id}`}
              value="manual"
              checked={selectedOption === "manual"}
              onChange={() => setSelectedOption("manual")}
            />
            <label htmlFor={`manual-${id}`} className="ml-1">Manual</label>
          </div>
          <div className="flex items-center">
            <input
              type="radio"
              id={`auto-${id}`}
              value="auto"
              checked={selectedOption === "auto"}
              onChange={() => setSelectedOption("auto")}
            />
            <label htmlFor={`auto-${id}`} className="ml-1">Auto</label>
          </div>
        </div>
      </div>

      {selectedOption === "manual" ? (
        <>
          <div className="mb-3">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Start Date & Time</label>
            <input
              type="datetime-local"
              className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
              value={startDateTime}
              min={minDateTime}
              onChange={(e) => setStartDateTime(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="block text-sm font-semibold text-gray-700 mb-1">End Date & Time</label>
            <input
              type="datetime-local"
              className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
              value={endDateTime}
              min={startDateTime || minDateTime}
              onChange={(e) => setEndDateTime(e.target.value)}
            />
          </div>
        </>
      ) : (
        <>
          <div className="mb-3">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Schedule On</label>
            <input
              type="text"
              className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
              placeholder="Enter column name"
              value={scheduleColumn}
              onChange={(e) => setScheduleColumn(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Start Date & Time</label>
            <input
              type="datetime-local"
              className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
              value={startDateTime}
              min={minDateTime}
              onChange={(e) => setStartDateTime(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Scheduler Interval</label>
            <div className="flex space-x-2">
              <input
                type="number"
                className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                value={intervalValue}
                onChange={(e) => setIntervalValue(e.target.value)}
              />
              <select
                className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                value={intervalType}
                onChange={(e) => setIntervalType(e.target.value)}
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
            <div className="mb-3">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Frequency</label>
              <input
                type="text"
                className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                placeholder="Enter frequency"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}