import React from "react";
import { ChevronDown, Info } from "lucide-react";

const OPERATORS = [
  { id: "select", name: "Select", description: "Keep only selected columns" },
  { id: "drop", name: "Drop", description: "Remove selected columns" }
];

export const RestrictColumnsOperationFields = ({
  transformation,
  sourceCols,
  openDropdowns,
  toggleDropdown,
  handleSelectAllColumns,
  handleColumnSelection,
  dropdownRefs,
  handleOperatorChange
}) => {
  const sourceDropdownKey = `${transformation.id}-source`;
  const isSourceDropdownOpen = openDropdowns[sourceDropdownKey] || false;
  const operatorDescription = OPERATORS.find(op => op.id === transformation.transformation_operator)?.description || "";

  return (
    <div>
      {/* <div className="mb-4">
        <label className="block text-xs text-gray-700 mb-1">Restriction Type</label>
        <select
          className="w-full p-2 text-sm bg-white border border-gray-300 rounded text-gray-800 focus:ring-1 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
          value={transformation.transformation_operator || "select"}
          onChange={(e) => handleOperatorChange(transformation.id, e.target.value)}
        >
          {OPERATORS.map(op => (
            <option key={op.id} value={op.id}>{op.name}</option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">{operatorDescription}</p>
      </div> */}

      <div className="mb-4">
        <div className="relative" ref={el => dropdownRefs.current[sourceDropdownKey] = el}>
          <label className="text-xs text-gray-600 block mb-1">
            {transformation.transformation_operator === "select" ? "Columns to Keep" : "Columns to Remove"}
          </label>
          <button
            className="w-full p-2 text-black text-sm border border-gray-300 rounded bg-white flex justify-between items-center"
            onClick={() => toggleDropdown(transformation.id, 'source')}
          >
            {transformation.source_column.length === 0 ? (
              <span className="text-gray-400">
                {transformation.transformation_operator === "select"
                  ? "Select columns to keep"
                  : "Select columns to remove"}
              </span>
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
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
        <p className="text-xs text-blue-800">
          {transformation.transformation_operator === "select"
            ? "This operation will keep only the selected columns in the resulting dataframe."
            : "This operation will remove the selected columns from the resulting dataframe."}
        </p>
      </div>
    </div>
  );
};

export const getRestrictColumnsParams = () => {
  // No parameters needed for restrict columns operation
  return {};
};

export default RestrictColumnsOperationFields;
