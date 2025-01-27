import React, { useState, useCallback } from "react";
import PropTypes from "prop-types";
import { Handle, Position } from "reactflow";
import { Upload, X } from "lucide-react";

export function SchedulerNode({ id }) {
const [selectedOption, setSelectedOption] = useState("manual");

const handleOptionChange = useCallback((event) => {
    setSelectedOption(event.target.value);
}, []);

return (
    <div className="bg-white rounded-lg p-4 shadow-md border-2 border-[#8E77BB] min-w-[250px] max-w-[280px] relative group">
        <button
            onClick={() => window.deleteNode?.(id)}
            className="absolute top-1.5 right-2 p-1"
        >
            <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
        </button>

        <Handle type="target" position={Position.Left} />

        <div className="flex items-center space-x-3 mb-3">
            <Upload className="w-5 h-5 text-[#96CF7B]" />
            <h3 className="text-black font-medium">Scheduler</h3>
        </div>

        <div className="space-y-1.5">
            <div className="flex gap-4 items-center">
                <div className="flex items-center">
                    <input
                        type="radio"
                        id="manual"
                        name="table"
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
                        name="table"
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
            <button className="bg-transparent hover:bg-[#8e78b7] text-xs text-gray-700 font-semibold hover:text-white py-2 px-10 border border-gray-700 hover:border-transparent rounded">
                OK
            </button>
        </div>
    </div>
);
}

SchedulerNode.propTypes = {
  id: PropTypes.string.isRequired,
};
