import React, { useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { Calendar, X } from "lucide-react";

export function SchedulerNode({ id, data }) {
    const [selectedOption, setSelectedOption] = useState(data?.mode || "manual");
    const [flowType, setFlowType] = useState(data?.flow_type || "single_run"); // single_run, periodic, recurring
    const [intervalValue, setIntervalValue] = useState(data?.intervalValue || "");
    const [frequency, setFrequency] = useState(data?.frequency || "");
    const [runningDays, setRunningDays] = useState(data?.runningDays || []);

    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const dayAbbreviations = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    // Sync state with node data changes from parent (e.g., during Edit Mode restore)
    useEffect(() => {
        if (data?.mode !== undefined && data.mode !== selectedOption) setSelectedOption(data.mode);
        if (data?.flow_type !== undefined && data.flow_type !== flowType) setFlowType(data.flow_type);
        if (data?.intervalValue !== undefined && data.intervalValue !== intervalValue) setIntervalValue(data.intervalValue);
        if (data?.frequency !== undefined && data.frequency !== frequency) setFrequency(data.frequency);
        if (data?.runningDays !== undefined && JSON.stringify(data.runningDays) !== JSON.stringify(runningDays)) setRunningDays(data.runningDays);
    }, [data?.mode, data?.flow_type, data?.intervalValue, data?.frequency, data?.runningDays]);

    const handleDataChange = (updates) => {
        if (typeof data?.onDataChange === 'function') {
            data.onDataChange({
                mode: selectedOption,
                flow_type: flowType,
                intervalValue,
                frequency,
                runningDays,
                ...updates
            });
        }
    };

    const handleOptionChange = (newMode) => {
        setSelectedOption(newMode);
        handleDataChange({ mode: newMode });
    };

    const handleFlowTypeChange = (newFlowType) => {
        setFlowType(newFlowType);

        const updates = { flow_type: newFlowType };

        if (newFlowType === "single_run") {
            setFrequency("");
            setRunningDays([]);
            updates.frequency = "";
            updates.runningDays = [];
        } else if (newFlowType === "periodic") {
            setFrequency("");
            setRunningDays([]);
            updates.frequency = "";
            updates.runningDays = [];
        } else if (newFlowType === "recurring") {
            setFrequency("");
            updates.frequency = "";
        }

        handleDataChange(updates);
    };

    const handleIntervalChange = (val) => {
        setIntervalValue(val);
        handleDataChange({ intervalValue: val });
    };

    const handleFrequencyChange = (val) => {
        setFrequency(val);
        handleDataChange({ frequency: val });
    };

    const handleDayToggle = (day) => {
        let newDays = [...runningDays];
        if (newDays.includes(day)) {
            newDays = newDays.filter(d => d !== day);
        } else {
            newDays.push(day);
        }
        setRunningDays(newDays);
        handleDataChange({ runningDays: newDays });
    };

    const getCurrentDateTimeLocal = () => {
        const tzoffset = (new Date()).getTimezoneOffset() * 60000;
        return new Date(Date.now() - tzoffset).toISOString().slice(0, 16);
    };

    return (
        <div className="bg-white rounded-lg p-4 shadow-md border-2 border-[#8E77BB] min-w-[320px] max-w-[320px] relative group">
            {/* Delete button (will be handled by canvas if needed, using general nodes delete) */}
            <Handle type="target" position={Position.Left} style={{ width: 10, height: 10 }} />

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
                            onChange={() => handleOptionChange("manual")}
                        />
                        <label htmlFor={`manual-${id}`} className="ml-2 text-sm text-gray-700">Manual</label>
                    </div>
                    <div className="flex items-center">
                        <input
                            type="radio"
                            id={`auto-${id}`}
                            value="auto"
                            checked={selectedOption === "auto"}
                            onChange={() => handleOptionChange("auto")}
                        />
                        <label htmlFor={`auto-${id}`} className="ml-2 text-sm text-gray-700">Auto</label>
                    </div>
                </div>
            </div>

            {selectedOption === "manual" ? (
                <div className="text-sm text-gray-500 mt-2">
                    Workflow will be triggered manually.
                </div>
            ) : (
                <div className="mt-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Flow Type</label>
                    <div className="flex flex-col space-y-2 mb-4">
                        <div className="flex items-center">
                            <input
                                type="radio"
                                id={`single-${id}`}
                                value="single_run"
                                checked={flowType === "single_run"}
                                onChange={() => handleFlowTypeChange("single_run")}
                                className="w-4 h-4 border-gray-300 focus:ring-[#8E77BB]"
                                style={{ accentColor: '#8E77BB' }}
                            />
                            <label htmlFor={`single-${id}`} className="ml-2 text-sm text-gray-700">Single run</label>
                        </div>
                        <div className="flex items-center">
                            <input
                                type="radio"
                                id={`periodic-${id}`}
                                value="periodic"
                                checked={flowType === "periodic"}
                                onChange={() => handleFlowTypeChange("periodic")}
                                className="w-4 h-4 border-gray-300 focus:ring-[#8E77BB]"
                                style={{ accentColor: '#8E77BB' }}
                            />
                            <label htmlFor={`periodic-${id}`} className="ml-2 text-sm text-gray-700">Periodic</label>
                        </div>
                        <div className="flex items-center">
                            <input
                                type="radio"
                                id={`recurring-${id}`}
                                value="recurring"
                                checked={flowType === "recurring"}
                                onChange={() => handleFlowTypeChange("recurring")}
                                className="w-4 h-4 border-gray-300 focus:ring-[#8E77BB]"
                                style={{ accentColor: '#8E77BB' }}
                            />
                            <label htmlFor={`recurring-${id}`} className="ml-2 text-sm text-gray-700">Recurring</label>
                        </div>
                    </div>

                    {flowType === "periodic" && (
                        <div className="mb-3">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Frequency</label>
                            <select
                                className="w-full px-3 py-2 border border-gray-300 text-gray-700 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
                                value={frequency}
                                onChange={(e) => handleFrequencyChange(e.target.value)}
                            >
                                <option value="">Select Frequency</option>
                                <option value="hourly">Hourly</option>
                                <option value="daily">Daily</option>
                                <option value="monthly">Monthly</option>
                                <option value="quarterly">Quarterly</option>
                                <option value="half_yearly">Half Yearly</option>
                                <option value="yearly">Yearly</option>
                            </select>
                        </div>
                    )}

                    {flowType === "recurring" && (
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Run Days</label>
                            <div className="flex gap-2 justify-between">
                                {dayAbbreviations.map((dayLabel, idx) => {
                                    const fullDayName = dayNames[idx];
                                    const isSelected = runningDays.includes(fullDayName);
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleDayToggle(fullDayName)}
                                            className={`w-8 h-8 rounded-full text-xs font-medium transition-colors border ${isSelected
                                                ? 'bg-[#8E77BB] text-white border-[#8E77BB]'
                                                : 'bg-white text-gray-500 border-gray-300 hover:border-[#8E77BB] hover:text-[#8E77BB]'
                                                }`}
                                        >
                                            {dayLabel}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="mb-3">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Schedule Date & Time</label>
                        <input
                            type="datetime-local"
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
                            value={intervalValue}
                            min={getCurrentDateTimeLocal()}
                            onChange={(e) => handleIntervalChange(e.target.value)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default SchedulerNode;