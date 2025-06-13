import React, { useState } from "react";
import { ChevronDown, X, Plus, ArrowUp, ArrowDown } from "lucide-react";

export const RankingOperationFields = ({
  transformation,
  sourceCols,
  targetCols,
  openDropdowns,
  toggleDropdown,
  handleSelectAllColumns,
  handleColumnSelection,
  dropdownRefs
}) => {
  const [showGroupByDropdown, setShowGroupByDropdown] = useState(false);
  const [showOrderByDropdown, setShowOrderByDropdown] = useState(false);
  const targetDropdownKey = `${transformation.id}-target`;
  const isTargetDropdownOpen = openDropdowns[targetDropdownKey] || false;

  const updateRankingParam = (paramName, value) => {
    if (typeof transformation.updateRankingParam === 'function') {
      transformation.updateRankingParam(transformation.id, paramName, value);
    }
  };

  if (!transformation.params.group_by) {
    updateRankingParam('group_by', []);
  }

  if (!transformation.params.order_by) {
    updateRankingParam('order_by', {});
  }

  const addGroupByColumn = (column) => {
    if (!transformation.params.group_by.includes(column)) {
      const newGroupBy = [...transformation.params.group_by, column];
      updateRankingParam('group_by', newGroupBy);
      setShowGroupByDropdown(false);
    }
  };

  const removeGroupByColumn = (column) => {
    const newGroupBy = transformation.params.group_by.filter(col => col !== column);
    updateRankingParam('group_by', newGroupBy);
  };

  const addOrderByColumn = (column) => {
    if (!Object.keys(transformation.params.order_by).includes(column)) {
      const newOrderBy = { ...transformation.params.order_by, [column]: 'asc' };
      updateRankingParam('order_by', newOrderBy);
      setShowOrderByDropdown(false);
    }
  };

  const removeOrderByColumn = (column) => {
    const newOrderBy = { ...transformation.params.order_by };
    delete newOrderBy[column];
    updateRankingParam('order_by', newOrderBy);
  };

  const toggleOrderDirection = (column) => {
    const currentDirection = transformation.params.order_by[column];
    const newDirection = currentDirection === 'asc' ? 'desc' : 'asc';
    const newOrderBy = { ...transformation.params.order_by, [column]: newDirection };
    updateRankingParam('order_by', newOrderBy);
  };

  const availableGroupByColumns = sourceCols.filter(
    col => !transformation.params.group_by.includes(col)
  );

  const availableOrderByColumns = sourceCols.filter(
    col => !Object.keys(transformation.params.order_by).includes(col)
  );

  return (
    <div className="space-y-4">
      <div className="relative" ref={el => dropdownRefs.current[targetDropdownKey] = el}>
        <label className="text-xs text-gray-600 block mb-1">Rank Column (Target)</label>
        <button
          className="w-full p-2 text-black text-sm border border-gray-300 rounded bg-white flex justify-between items-center"
          onClick={() => toggleDropdown(transformation.id, 'target')}
        >
          {transformation.target_column.length === 0 ? (
            <span className="text-gray-400">Select column to store ranks</span>
          ) : (
            <span className="truncate">
              {transformation.target_column.join(', ')}
            </span>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform ${isTargetDropdownOpen ? 'transform rotate-180' : ''}`} />
        </button>

        {isTargetDropdownOpen && (
          <div className="absolute z-10 mt-1 w-full text-black bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            <div className="py-1">
              {targetCols.map((column, idx) => (
                <label key={idx} className="flex items-center px-3 py-2 hover:bg-gray-100">
                  <input
                    type="radio"
                    className="mr-2"
                    checked={transformation.target_column.includes(column)}
                    onChange={() => {
                      const newTargetColumns = [column];
                      if (typeof transformation.updateTargetColumns === 'function') {
                        transformation.updateTargetColumns(transformation.id, newTargetColumns);
                      }
                    }}
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

      <div>
        <label className="text-xs text-gray-700 mb-1 block">Group By Columns</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {(transformation.params.group_by || []).map((column, idx) => (
            <div key={idx} className="bg-gray-100 border border-gray-300 rounded-full px-2 py-1 text-xs text-gray-800 flex items-center">
              {column}
              <button
                className="ml-1 text-gray-500 hover:text-red-500"
                onClick={() => removeGroupByColumn(column)}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {(transformation.params.group_by || []).length === 0 && (
            <div className="text-xs text-gray-500 italic">No grouping - ranking will be applied to entire dataset</div>
          )}
        </div>

        <div className="relative" ref={el => dropdownRefs.current[`${transformation.id}-group-by`] = el}>
          <button
            className="flex items-center text-sm text-[#8E77BB] hover:text-[#7d68a5]"
            onClick={() => setShowGroupByDropdown(!showGroupByDropdown)}
          >
            <Plus className="w-4 h-4 mr-1" />
            <span>Add Group By Column</span>
          </button>

          {showGroupByDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowGroupByDropdown(false)}
              />
              <div className="absolute text-black z-20 mt-1 w-64 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                <div className="py-1">
                  {availableGroupByColumns.length > 0 ? (
                    availableGroupByColumns.map((column, idx) => (
                      <button
                        key={idx}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                        onClick={() => addGroupByColumn(column)}
                      >
                        {column}
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
      </div>

      <div>
        <label className="text-xs text-gray-700 mb-1 block">Order By Columns</label>
        <div className="space-y-2 mb-2">
          {Object.entries(transformation.params.order_by || {}).map(([column, direction], idx) => (
            <div key={idx} className="flex items-center space-x-2 p-2 bg-white border border-gray-200 rounded-md">
              <div className="flex-1 text-black font-medium text-sm">{column}</div>
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
          ))}
          {Object.keys(transformation.params.order_by || {}).length === 0 && (
            <div className="text-xs text-gray-500 italic">
              Please add at least one column to order by
            </div>
          )}
        </div>

        <div className="relative" ref={el => dropdownRefs.current[`${transformation.id}-order-by`] = el}>
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
                        {column}
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
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
        <p className="text-xs text-blue-800">
          This operation will add ranking to your data.
          {transformation.params.group_by && transformation.params.group_by.length > 0
            ? ` Data will be grouped by: ${transformation.params.group_by.join(', ')}.`
            : ' No grouping will be applied - all rows will be ranked together.'}
          {Object.keys(transformation.params.order_by || {}).length > 0
            ? ` Rows will be ordered by: ${Object.entries(transformation.params.order_by || {})
                .map(([col, dir]) => `${col} (${dir})`)
                .join(', ')}.`
            : ''}
        </p>
      </div>
    </div>
  );
};

export const getRankingParams = (transformation) => {
  return {
    group_by: transformation.params.group_by || [],
    order_by: transformation.params.order_by || {}
  };
};

export default RankingOperationFields;
