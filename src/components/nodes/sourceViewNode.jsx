import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Handle, Position } from 'reactflow';
import { SquareKanban, X } from 'lucide-react';

export function SourceViewNode({ id }) {
  const [selectedView, setSelectedView] = useState("");
  const [selectedColumns, setSelectedColumns] = useState([]);

  const dummyColumns = ["Column 1", "Column 2", "Column 3", "Column 4", "Column 5", "Column 6"];

  const handleColumnChange = (column) => {
    setSelectedColumns((prev) =>
      prev.includes(column)
        ? prev.filter((col) => col !== column) // Remove if already selected
        : [...prev, column] // Add if not selected
    );
  };

  const handleSelectAllChange = (isChecked) => {
    if (isChecked) {
      setSelectedColumns(dummyColumns); // Select all columns
    } else {
      setSelectedColumns([]); // Deselect all columns
    }
  };

  const isAllSelected = selectedColumns.length === dummyColumns.length;

  return (
    <div className="bg-white rounded-lg p-4 shadow-lg min-w-[300px] relative group">
      <button
        onClick={() => window.deleteNode?.(id)}
        className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4 text-black" />
      </button>

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />

      <div className="flex items-center space-x-3 mb-4">
        <SquareKanban className="w-5 h-5 text-[#8E77BB]" />
        <h3 className="text-black font-medium">Source View</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            View
          </label>
          <select
            value={selectedView}
            onChange={(e) => setSelectedView(e.target.value)}
            className="w-full bg-white rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-lg group border-solid border-2"
          >
            <option value="" disabled>
              Select a view
            </option>
            <option value="view1">View 1</option>
            <option value="view2">View 2</option>
            <option value="view3">View 3</option>
          </select>
        </div>

        {selectedView && (
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Select Columns
            </label>
            <div className="p-3 space-y-2">
              {/* Select All Option */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="selectAll"
                  checked={isAllSelected}
                  onChange={(e) => handleSelectAllChange(e.target.checked)}
                  className="text-purple-600 focus:ring-purple-500 "
                />
                <label htmlFor="selectAll" className="text-sm text-gray-700 font-medium">
                  Select All
                </label>
              </div>

              {/* Scrollable Column List */}
              <div className="max-h-32 overflow-y-auto space-y-2 custom-scrollbar">
                {dummyColumns.map((column) => (
                  <div key={column} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={column}
                      value={column}
                      checked={selectedColumns.includes(column)}
                      onChange={() => handleColumnChange(column)}
                      className="text-purple-600 focus:ring-purple-500 "
                    />
                    <label htmlFor={column} className="text-sm text-gray-700">
                      {column}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #a0aec0;
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
}

SourceViewNode.propTypes = {
  id: PropTypes.string.isRequired,
};
