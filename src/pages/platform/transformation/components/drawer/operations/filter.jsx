import React from "react";
import { ChevronDown } from "lucide-react";

const FILTER_OPERATORS = [
  { id: ">=", name: "Greater Than or Equal (>=)" },
  { id: "<=", name: "Less Than or Equal (<=)" },
  { id: "==", name: "Equal (==)" },
  { id: ">", name: "Greater Than (>)" },
  { id: "<", name: "Less Than (<)" },
];

const FILTER_TYPES = [
  { id: "none", name: "None" },
  { id: "hybrid", name: "Hybrid" },
  { id: "active", name: "Active", onlyFor: "==" },
];

export const FilterParameters = ({ params, onChange, currentOperator }) => {
  const availableFilterTypes = FILTER_TYPES.filter(type =>
    !type.onlyFor || type.onlyFor === currentOperator
  );

  return (
    <div className="space-y-3 mt-4">
      <div>
        <label className="block text-xs text-gray-700 mb-1">Value</label>
        <input
          type="text"
          className="w-full p-2 text-sm bg-white border border-gray-300 rounded text-gray-800 focus:ring-1 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
          placeholder="Enter filter value"
          value={params.value || ""}
          onChange={(e) => onChange("value", e.target.value)}
        />
        <p className="text-xs text-gray-500 mt-1">
          The value to compare against the selected column(s)
        </p>
      </div>

      <div>
        <label className="block text-xs text-gray-700 mb-1">Filter Type</label>
        <select
          className="w-full p-2 text-sm bg-white border border-gray-300 rounded text-gray-800 focus:ring-1 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
          value={params.filter_type || "none"}
          onChange={(e) => onChange("filter_type", e.target.value)}
        >
          {availableFilterTypes.map(type => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs text-gray-700 mb-1">Expression</label>
        <textarea
          className="w-full p-2 text-sm bg-white border border-gray-300 rounded text-gray-800 focus:ring-1 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
          placeholder="Custom expression"
          value={params.expression || ""}
          onChange={(e) => onChange("expression", e.target.value)}
          rows={3}
        />
        <p className="text-xs text-gray-500 mt-1">
          For advanced filtering, you can provide a custom expression
        </p>
      </div>
    </div>
  );
};

export const FilterOperationFields = ({
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

  const updateParam = (paramName, value) => {
    if (typeof transformation.updateFilterParam === 'function') {
      transformation.updateFilterParam(transformation.id, paramName, value);
    }
  };

  const handleOperatorChangeWithFilterTypeCheck = (id, operator) => {
    if (operator !== "==" && transformation.params.filter_type === "active") {
      updateParam("filter_type", "none");
    }
    handleOperatorChange(id, operator);
  };

  return (
    <div>
      <div className="mb-4">
        <div className="relative" ref={el => dropdownRefs.current[sourceDropdownKey] = el}>
          <label className="text-xs text-gray-600 block mb-1">Source Columns to Filter</label>
          <button
            className="w-full p-2 text-black text-sm border border-gray-300 rounded bg-white flex justify-between items-center"
            onClick={() => toggleDropdown(transformation.id, 'source')}
          >
            {transformation.source_column.length === 0 ? (
              <span className="text-gray-400">Select columns to filter</span>
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

      <div className="mb-4">
        <label className="block text-xs text-gray-700 mb-1">Filter Operator</label>
        <select
          className="w-full p-2 text-sm bg-white border border-gray-300 rounded text-gray-800 focus:ring-1 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
          value={transformation.transformation_operator || ">="}
          onChange={(e) => handleOperatorChangeWithFilterTypeCheck(transformation.id, e.target.value)}
        >
          {FILTER_OPERATORS.map(op => (
            <option key={op.id} value={op.id}>
              {op.name}
            </option>
          ))}
        </select>
      </div>

      <FilterParameters
        params={transformation.params}
        onChange={updateParam}
        currentOperator={transformation.transformation_operator}
      />

      <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
        <p className="text-xs text-blue-800">
          This filter will keep only rows where the selected column(s) {transformation.transformation_operator} {transformation.params.value || "[value]"}.
          {transformation.source_column.length > 1 && " The filter will be applied to all selected columns."}
          {transformation.params.filter_type !== "none" &&
            ` Using ${transformation.params.filter_type} filter type.`}
        </p>
      </div>
    </div>
  );
};

export const getFilterParams = (transformation) => {
  return {
    value: transformation.params.value || "",
    filter_type: transformation.params.filter_type === "none" ? "" : (transformation.params.filter_type || ""),
    expression: transformation.params.expression || ""
  };
};

export default FilterOperationFields;
