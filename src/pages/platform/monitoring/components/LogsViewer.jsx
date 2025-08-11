import React, { useEffect, useState } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { useMonitoringContext } from '../context/MonitoringContext';
import toast from "react-hot-toast"; 

const LogsViewer = () => {
  const timeRangeOptions = [
    { label: "Last 5 minutes", value: "5m", from: "now-5m", to: "now" },
    { label: "Last 15 minutes", value: "15m", from: "now-15m", to: "now" },
    { label: "Last 30 minutes", value: "30m", from: "now-30m", to: "now" },
    { label: "Last 1 hour", value: "1h", from: "now-1h", to: "now" },
    { label: "Last 3 hours", value: "3h", from: "now-3h", to: "now" },
    { label: "Last 6 hours", value: "6h", from: "now-6h", to: "now" },
    { label: "Last 12 hours", value: "12h", from: "now-12h", to: "now" },
    { label: "Last 24 hours", value: "24h", from: "now-24h", to: "now" },
    { label: "Custom Range", value: "custom", from: "", to: "" }
  ];

  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [timeRange, setTimeRange] = useState(timeRangeOptions[3]);

  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const { monitoringConfig, getLogs } = useMonitoringContext();

const fetchLogs = async () => {
  setIsLoading(true);
  try {
    let fromValue = timeRange.from;
    let toValue = timeRange.to;

    if (timeRange.value === 'custom') {
      if (!customStart || !customEnd) {
        toast.error("Custom time range is incomplete.");
        setIsLoading(false);
        return;
      }
      fromValue = customStart;
      toValue = customEnd;
    }

    const result = await getLogs(monitoringConfig, fromValue, toValue);

    const frames = result?.results?.A?.frames || [];
    if (frames.length === 0) {
      setLogs([]);
      return;
    }

    const logFrame = frames[0];
    const logsFieldIndex = logFrame.schema.fields.findIndex(
      field => field.name.toLowerCase() === "line" && field.type === "string"
    );

    if (logsFieldIndex === -1) {
      toast.error("Unexpected log format.");
      setLogs([]);
      return;
    }

    const logValues = logFrame.data.values[logsFieldIndex];
    setLogs(logValues || []);
  } catch (error) {
    console.error("Failed to fetch logs:", error);
    setLogs([]);
    toast.error(error.message || "Failed to fetch logs.");
  } finally {
    setIsLoading(false);
  }
};


  useEffect(() => {
    if (!monitoringConfig.container) return;
    fetchLogs();
  }, [monitoringConfig, timeRange]);

  const refreshLogs = () => {
    fetchLogs();
  };

  const applyCustomTimeRange = () => {
    setTimeRange({
      value: 'custom',
      label: 'Custom Range',
      from: customStart,
      to: customEnd
    });
  };

  return (
    <div className="w-full h-full mt-3 bg-white rounded-xl shadow border overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center p-5 bg-gray-50 border-b">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Logs Viewer</h2>
          <p className="text-sm text-gray-500 mt-1">
            {monitoringConfig.pod} / {monitoringConfig.container}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center border border-gray-300 rounded-lg bg-white">
            <select
              className="border-0 py-2 px-3 focus:ring-2 focus:ring-indigo-500 rounded-lg w-48"
              value={timeRange.value}
              onChange={(e) => {
                if (e.target.value === 'custom') {
                  setShowCustomPicker(true);
                } else {
                  const selected = timeRangeOptions.find(opt => opt.value === e.target.value);
                  setTimeRange(selected);
                  setShowCustomPicker(false);
                }
              }}
            >
              {timeRangeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => refreshLogs()}
              disabled={isLoading}
              className={`flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-600 hover:text-indigo-600 hover:border-indigo-600 transition-all ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
              title="Refresh logs"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Custom Time Picker */}
      {showCustomPicker && (
        <div className="p-5 border-b bg-indigo-50 flex flex-col sm:flex-row items-start gap-4">
          <div className="w-full">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Custom Time Range</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From:</label>
                <input
                  type="text"
                  placeholder="e.g., now-2h"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-2">Examples: now-15m, now-1h, now-24h</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To:</label>
                <input
                  type="text"
                  placeholder="e.g., now"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-2">Usually "now" or a specific time</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 self-end">
            <button
              onClick={applyCustomTimeRange}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              Apply Range
            </button>
            <button
              onClick={() => setShowCustomPicker(false)}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Time Range Display */}
      {!showCustomPicker && (
        <div className="p-3 bg-indigo-50 border-b text-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <span className="text-gray-600">Showing logs from: </span>
            <strong className="text-indigo-700">
              {timeRange.value === 'custom'
                ? `${customStart || '?'} to ${customEnd || '?'}`
                : timeRange.label}
            </strong>
          </div>
          {timeRange.value === 'custom' && (
            <button
              onClick={() => setShowCustomPicker(true)}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1"
            >
              <RefreshCw className="h-4 w-4" />
              Edit Custom Range
            </button>
          )}
        </div>
      )}

      {/* Logs Content */}
      <div className="p-4 overflow-auto bg-gray-900 text-gray-200 font-mono text-sm min-h-[300px]">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-3"></div>
              <p className="text-gray-400">Loading logs...</p>
            </div>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-center py-8 text-gray-500">
              No logs available for the selected time range
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {logs.map((log, index) => (
              <div
                key={index}
                className="py-1.5 px-2 rounded hover:bg-gray-800 transition-colors whitespace-pre-wrap break-words"
              >
                {log}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LogsViewer;
