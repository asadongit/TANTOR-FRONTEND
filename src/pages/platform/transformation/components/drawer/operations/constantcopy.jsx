import React from "react";
import { ChevronDown } from "lucide-react";

const DATA_TYPES = [
  { id: "string", name: "String" },
  { id: "int", name: "Integer" },
  { id: "float", name: "Float" },
  { id: "boolean", name: "Boolean" },
  { id: "timestamp", name: "Timestamp" },
  { id: "date", name: "Date" },
  { id: "object", name: "Object" },
  { id: "array", name: "Array" }
];

const VALUE_TYPES = [
  { id: "c", name: "Constant" },
  { id: "v", name: "Variable/Function" }
];

export const ConstantCopyParameters = ({ params, onChange }) => {
  return (
    <div className="space-y-3 mt-3">
      <div>
        <label className="block text-xs text-gray-700 mb-1">Value Type</label>
        <select
          className="w-full p-2 text-sm bg-white border border-gray-300 rounded text-gray-800 focus:ring-1 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
          value={params.value_type || "c"}
          onChange={(e) => onChange("value_type", e.target.value)}
        >
          {VALUE_TYPES.map(type => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          {params.value_type === "v"
            ? "Enter a variable or function expression (e.g., current_timestamp())"
            : "Enter a literal constant value"}
        </p>
      </div>

      <div>
        <label className="block text-xs text-gray-700 mb-1">Value</label>
        <input
          type="text"
          className="w-full p-2 text-sm bg-white border border-gray-300 rounded text-gray-800 focus:ring-1 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
          placeholder={params.value_type === "v" ? "current_timestamp()" : "Enter value"}
          value={params.value || ""}
          onChange={(e) => onChange("value", e.target.value)}
        />
      </div>

      <div>
        <label className="block text-xs text-gray-700 mb-1">Data Type</label>
        <select
          className="w-full p-2 text-sm bg-white border border-gray-300 rounded text-gray-800 focus:ring-1 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
          value={params.datatype || "string"}
          onChange={(e) => onChange("datatype", e.target.value)}
        >
          {DATA_TYPES.map(type => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export const ConstantCopyOperationFields = ({
  transformation,
  targetCols,
  openDropdowns,
  toggleDropdown,
  handleSelectAllColumns,
  handleColumnSelection,
  dropdownRefs
}) => {
  const targetDropdownKey = `${transformation.id}-target`;
  const isTargetDropdownOpen = openDropdowns[targetDropdownKey] || false;

  const updateParam = (paramName, value) => {
    if (typeof transformation.updateConstantCopyParam === 'function') {
      transformation.updateConstantCopyParam(transformation.id, paramName, value);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 mb-4">
        <div className="relative" ref={el => dropdownRefs.current[targetDropdownKey] = el}>
          <label className="text-xs text-gray-600 block mb-1">Target Columns</label>
          <button
            className="w-full p-2 text-black text-sm border border-gray-300 rounded bg-white flex justify-between items-center"
            onClick={() => toggleDropdown(transformation.id, 'target')}
          >
            {transformation.target_column.length === 0 ? (
              <span className="text-gray-400">Select columns</span>
            ) : (
              <span className="truncate">
                {transformation.target_column.length} column(s) selected
              </span>
            )}
            <ChevronDown className={`w-4 h-4 transition-transform ${isTargetDropdownOpen ? 'transform rotate-180' : ''}`} />
          </button>

          {isTargetDropdownOpen && (
            <div className="absolute text-black z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              <div className="p-2 border-b border-gray-200">
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={transformation.target_column.length === targetCols.length && targetCols.length > 0}
                    onChange={(e) => handleSelectAllColumns(transformation.id, 'target', targetCols, e.target.checked)}
                  />
                  Select All
                </label>
              </div>
              <div className="py-1">
                {targetCols.map((column, idx) => (
                  <label key={idx} className="flex items-center px-3 py-2 hover:bg-gray-100">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={transformation.target_column.includes(column)}
                      onChange={(e) => handleColumnSelection(transformation.id, 'target', column, e.target.checked)}
                    />
                    <span className="text-sm">{column}</span>
                  </label>
                ))}
                {targetCols.length === 0 && (
                  <div className="px-3 py-2 text-gray-500 text-sm">No columns available</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-3 bg-blue-50 border border-blue-100 rounded-md mb-4">
        <p className="text-xs text-blue-800">
          Constant Copy allows you to set a fixed value or expression to the selected target columns.
          {transformation.target_column.length > 1 &&
            " All selected columns will receive the same value."}
        </p>
      </div>

      <ConstantCopyParameters
        params={transformation.params}
        onChange={updateParam}
      />
    </div>
  );
};

export const getConstantCopyParams = (transformation) => {
  return {
    value: transformation.params.value || "",
    value_type: transformation.params.value_type || "c",
    datatype: transformation.params.datatype || "string"
  };
};

export default ConstantCopyOperationFields;
