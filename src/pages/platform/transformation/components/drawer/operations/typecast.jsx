import React, { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";

const DATA_TYPES = [
  { id: "string", name: "String", prefix: "str_" },
  { id: "int", name: "Integer", prefix: "int_" },
  { id: "float", name: "Float", prefix: "float_" },
  { id: "boolean", name: "Boolean", prefix: "bool_" },
  { id: "timestamp", name: "Timestamp", prefix: "ts_" },
  { id: "date", name: "Date", prefix: "date_" }
];

export const TypecastOperationFields = ({
  transformation,
  sourceCols,
  openDropdowns,
  toggleDropdown,
  handleSelectAllColumns,
  handleColumnSelection,
  dropdownRefs
}) => {
  const sourceDropdownKey = `${transformation.id}-source`;
  const isSourceDropdownOpen = openDropdowns[sourceDropdownKey] || false;
  const [targetColumns, setTargetColumns] = useState([]);

  const updateParam = (paramName, value) => {
    if (typeof transformation.updateTypecastParam === 'function') {
      transformation.updateTypecastParam(transformation.id, paramName, value);
    }
  };

  useEffect(() => {
    const dataType = transformation.params.target_datatype || "string";
    const prefix = DATA_TYPES.find(dt => dt.id === dataType)?.prefix || "converted_";

    const newTargetColumns = transformation.source_column.map(col =>
      `${prefix}${col}`
    );

    setTargetColumns(newTargetColumns);

    if (typeof transformation.updateTargetColumns === 'function' && newTargetColumns.length > 0) {
      transformation.updateTargetColumns(transformation.id, newTargetColumns);
    }
  }, [transformation.source_column, transformation.params.target_datatype]);

  const handleDataTypeChange = (value) => {
    updateParam("target_datatype", value);
  };

  return (
    <div className="space-y-4">
      <div className="relative" ref={el => dropdownRefs.current[sourceDropdownKey] = el}>
        <label className="text-xs text-gray-600 block mb-1">Source Columns</label>
        <button
          className="w-full p-2 text-black text-sm border border-gray-300 rounded bg-white flex justify-between items-center"
          onClick={() => toggleDropdown(transformation.id, 'source')}
        >
          {transformation.source_column.length === 0 ? (
            <span className="text-gray-400">Select columns to convert</span>
          ) : (
            <span className="truncate">
              {transformation.source_column.length} column(s) selected
            </span>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform ${isSourceDropdownOpen ? 'transform rotate-180' : ''}`} />
        </button>

        {isSourceDropdownOpen && (
          <div className="absolute z-10 mt-1 w-full text-black bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            <div className="p-2 border-b border-gray-200">
              <label className="flex items-center text-sm">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={transformation.source_column.length === sourceCols.length && sourceCols.length > 0}
                  onChange={(e) => handleSelectAllColumns(transformation.id, 'source', sourceCols, e.target.checked)}
                />
                Select All
              </label>
            </div>
            <div className="py-1">
              {sourceCols.map((column, idx) => (
                <label key={idx} className="flex items-center px-3 py-2 hover:bg-gray-100">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={transformation.source_column.includes(column)}
                    onChange={(e) => handleColumnSelection(transformation.id, 'source', column, e.target.checked)}
                  />
                  <span className="text-sm">{column}</span>
                </label>
              ))}
              {sourceCols.length === 0 && (
                <div className="px-3 py-2 text-gray-500 text-sm">No columns available</div>
              )}
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs text-gray-700 mb-1">Target Data Type</label>
        <select
          className="w-full p-2 text-sm bg-white border border-gray-300 rounded text-gray-800 focus:ring-1 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
          value={transformation.params.target_datatype || "string"}
          onChange={(e) => handleDataTypeChange(e.target.value)}
        >
          {DATA_TYPES.map(type => (
            <option key={type.id} value={type.id}>{type.name}</option>
          ))}
        </select>
      </div>

      {transformation.source_column.length > 0 && (
        <div className="bg-gray-50 p-3 border border-gray-200 rounded-md">
          <h4 className="text-xs font-medium text-gray-700 mb-2">Target Column Preview</h4>
          <div className="space-y-1">
            {transformation.source_column.map((sourceCol, idx) => (
              <div key={idx} className="grid grid-cols-2 gap-2 text-xs text-black">
                <div className="p-1.5 bg-gray-100 border border-gray-200 rounded">{sourceCol}</div>
                <div className="flex items-center">
                  <span className="mr-2">→</span>
                  <div className="p-1.5 bg-blue-50 border border-blue-200 rounded flex-grow">
                    {targetColumns[idx] || `${DATA_TYPES.find(dt => dt.id === (transformation.params.target_datatype || "string"))?.prefix || "converted_"}${sourceCol}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
        <p className="text-xs text-blue-800">
          This operation will convert the selected column(s) to {DATA_TYPES.find(dt => dt.id === (transformation.params.target_datatype || "string"))?.name || "String"} data type.
          New column names will be created with appropriate prefixes.
        </p>
      </div>
    </div>
  );
};

export const getTypecastParams = (transformation) => {
  return {
    target_datatype: transformation.params.target_datatype || "string"
  };
};

export default TypecastOperationFields;
