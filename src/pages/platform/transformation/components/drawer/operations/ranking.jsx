import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, X, Plus, ArrowUp, ArrowDown } from "lucide-react";
import Select from "react-select";

export const RankingOperationFields = ({
  transformation,
  sourceCols,
  targetCols,
  openDropdowns,
  toggleDropdown,
  handleSelectAllColumns,
  handleColumnSelection,
  dropdownRefs,
}) => {
  const [showOrderByDropdown, setShowOrderByDropdown] = useState(false);
  const targetDropdownKey = `${transformation.id}-target`;
  const isTargetDropdownOpen = openDropdowns[targetDropdownKey] || false;
  const targetDropdownRef = useRef(null);

  // Prepare options for the Select component
  const columnOptions = sourceCols.map((col) => ({
    value: typeof col === "object" ? col.name : col,
    label: typeof col === "object" ? col.name : col,
  }));

  // Selected options for group_by
  const selectedGroupByOptions = (transformation.params.group_by || []).map((col) => ({
    value: col,
    label: col,
  }));

  // Custom styles for react-select
  const customStyles = {
    control: (provided) => ({
      ...provided,
      minHeight: "38px",
      borderColor: "#d1d5db",
      "&:hover": { borderColor: "#8E77BB" },
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: "#f3f4f6",
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: "#111827",
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: "#6b7280",
      "&:hover": { backgroundColor: "#ef4444", color: "white" },
    }),
  };

  const updateRankingParam = (paramName, value) => {
    if (typeof transformation.updateRankingParam === "function") {
      transformation.updateRankingParam(transformation.id, paramName, value);
    }
  };

  // Initialize group_by and order_by if not present
  if (!transformation.params.group_by) {
    updateRankingParam("group_by", []);
  }

  if (!transformation.params.order_by) {
    updateRankingParam("order_by", {});
  }

  // Handle changes in the Select component for group_by
  const handleGroupByChange = (selectedOptions) => {
    const newGroupBy = selectedOptions ? selectedOptions.map((option) => option.value) : [];
    updateRankingParam("group_by", newGroupBy);
  };

  const addOrderByColumn = (column) => {
    const columnName = typeof column === "object" ? column.name : column;
    if (!Object.keys(transformation.params.order_by).includes(columnName)) {
      const newOrderBy = { ...transformation.params.order_by, [columnName]: "asc" };
      updateRankingParam("order_by", newOrderBy);
      setShowOrderByDropdown(false);
    }
  };

  const removeOrderByColumn = (column) => {
    const newOrderBy = { ...transformation.params.order_by };
    delete newOrderBy[column];
    updateRankingParam("order_by", newOrderBy);
  };

  const toggleOrderDirection = (column) => {
    const currentDirection = transformation.params.order_by[column];
    const newDirection = currentDirection === "asc" ? "desc" : "asc";
    const newOrderBy = { ...transformation.params.order_by, [column]: newDirection };
    updateRankingParam("order_by", newOrderBy);
  };

  const availableOrderByColumns = sourceCols.filter(
    (col) =>
      !Object.keys(transformation.params.order_by).includes(
        typeof col === "object" ? col.name : col
      )
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        targetDropdownRef.current &&
        !targetDropdownRef.current.contains(event.target) &&
        isTargetDropdownOpen
      ) {
        toggleDropdown(transformation.id, "target");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isTargetDropdownOpen, toggleDropdown, transformation.id]);

  return (
    <div className="space-y-4">
      {/* Rank Column Dropdown */}
      <div
        className="relative"
        ref={(el) => {
          dropdownRefs.current[targetDropdownKey] = el;
          targetDropdownRef.current = el;
        }}
      >
        <label className="text-xs text-gray-600 block mb-1">Select Rank Column</label>
        <button
          className="w-full p-2 text-black text-sm border border-gray-300 rounded bg-white flex justify-between items-center"
          onClick={() => toggleDropdown(transformation.id, "target")}
        >
          {transformation.target_column.length === 0 ? (
            <span className="text-gray-400">Select column to store ranks</span>
          ) : (
            <span className="truncate">
              {transformation.target_column.join(", ")}
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              isTargetDropdownOpen ? "transform rotate-180" : ""
            }`}
          />
        </button>

        {isTargetDropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => toggleDropdown(transformation.id, "target")}
            />
            <div className="absolute z-20 mt-1 w-full text-black bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              <div className="py-1">
                {targetCols.map((column, idx) => (
                  <label
                    key={idx}
                    className="flex items-center px-3 py-2 hover:bg-gray-100"
                  >
                    <input
                      type="radio"
                      className="mr-2"
                      checked={transformation.target_column.includes(
                        typeof column === "object" ? column.name : column
                      )}
                      onChange={() => {
                        const newTargetColumns = [
                          typeof column === "object" ? column.name : column,
                        ];
                        if (typeof transformation.updateTargetColumns === "function") {
                          transformation.updateTargetColumns(
                            transformation.id,
                            newTargetColumns
                          );
                        }
                      }}
                    />
                    <span className="text-sm">
                      {typeof column === "object" ? column.name : column}
                    </span>
                  </label>
                ))}
                {targetCols.length === 0 && (
                  <div className="px-3 py-2 text-gray-500 text-sm">
                    No columns available
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <div>
        <label className="text-xs text-gray-700 mb-1 block">Group By Columns</label>
        <Select
          isMulti
          options={columnOptions}
          value={selectedGroupByOptions}
          onChange={handleGroupByChange}
          placeholder="Select columns"
          className="text-sm text-black"
          styles={customStyles}
          noOptionsMessage={() =>
            sourceCols.length === 0
              ? "No columns available"
              : "All columns have been added"
          }
          closeMenuOnSelect={false}
          theme={(theme) => ({
            ...theme,
            colors: {
              ...theme.colors,
              primary: "#8E77BB",
              primary25: "#f3f4f6",
              neutral0: "white",
              neutral80: "#111827",
            },
          })}
        />
        {(transformation.params.group_by || []).length === 0 && (
          <div className="text-xs text-gray-500 italic mt-1">
            No grouping - ranking will be applied to entire dataset
          </div>
        )}
      </div>

      {/* Order By Columns */}
      <div>
        <label className="text-xs text-gray-700 mb-1 block">Order By Columns</label>
        <div
          className="relative mb-2"
          ref={(el) => (dropdownRefs.current[`${transformation.id}-order-by`] = el)}
        >
          <button
            className="flex items-center text-sm text-[#8E77BB] hover:text-[#7d68a5]"
            onClick={() => setShowOrderByDropdown(!showOrderByDropdown)}
          >
            <Plus className="w-4 h-4 mr-1" />
            <span>Add Order By Column</span>
          </button>

          {showOrderByDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowOrderByDropdown(false)}
              />
              <div className="absolute text-black z-20 mt-1 w-64 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                <div className="py-1">
                  {availableOrderByColumns.length > 0 ? (
                    availableOrderByColumns.map((column, idx) => (
                      <button
                        key={idx}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                        onClick={() => addOrderByColumn(column)}
                      >
                        {typeof column === "object" ? column.name : column}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-gray-500 text-sm">
                      {sourceCols.length === 0
                        ? "No columns available"
                        : "All columns have been added"}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {Object.entries(transformation.params.order_by || {}).map(
            ([column, direction], idx) => (
              <div
                key={idx}
                className="flex items-center space-x-2 p-2 bg-white border border-gray-200 rounded-md w-[calc(50%-0.5rem)]"
              >
                <div className="flex-1 text-black font-medium text-sm truncate">
                  {column}
                </div>
                <button
                  type="button"
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    direction === "asc"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-purple-100 text-purple-700"
                  }`}
                  onClick={() => toggleOrderDirection(column)}
                >
                  {direction === "asc" ? (
                    <div className="flex items-center space-x-1">
                      <ArrowUp className="w-3 h-3" />
                      <span>ASC</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1">
                      <ArrowDown className="w-3 h-3" />
                      <span>DESC</span>
                    </div>
                  )}
                </button>
                <button
                  type="button"
                  className="p-1 text-gray-400 hover:text-red-500 rounded-full"
                  onClick={() => removeOrderByColumn(column)}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export const getRankingParams = (transformation) => {
  return {
    group_by: transformation.params.group_by || [],
    order_by: transformation.params.order_by || {},
  };
};

export default RankingOperationFields;