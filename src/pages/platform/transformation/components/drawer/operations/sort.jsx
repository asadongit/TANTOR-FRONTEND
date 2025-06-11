import React, { useState } from "react";
import { ChevronDown, X, Plus, ArrowUp, ArrowDown } from "lucide-react";

export const SortOperationFields = ({
  transformation,
  sourceCols,
  dropdownRefs
}) => {
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [sortItems, setSortItems] = useState(() => {
    const orderBy = transformation.params?.order_by || {};
    return Object.keys(orderBy).map(column => ({
      column,
      direction: orderBy[column]
    }));
  });

  const updateSortParams = () => {
    const orderBy = {};
    sortItems.forEach(item => {
      if (item.column) {
        orderBy[item.column] = item.direction || "asc";
      }
    });

    if (typeof transformation.updateSortParam === 'function') {
      transformation.updateSortParam(transformation.id, "order_by", orderBy);
    }
  };

  const addSortColumn = (column) => {
    if (!sortItems.some(item => item.column === column)) {
      const newItems = [...sortItems, { column, direction: "asc" }];
      setSortItems(newItems);
      setShowColumnDropdown(false);

      const orderBy = { ...transformation.params?.order_by || {} };
      orderBy[column] = "asc";
      transformation.updateSortParam(transformation.id, "order_by", orderBy);
    }
  };

  const removeSortColumn = (index) => {
    const newItems = sortItems.filter((_, idx) => idx !== index);
    setSortItems(newItems);

    const orderBy = {};
    newItems.forEach(item => {
      if (item.column) {
        orderBy[item.column] = item.direction;
      }
    });

    transformation.updateSortParam(transformation.id, "order_by", orderBy);
  };

  const toggleDirection = (index) => {
    const newItems = [...sortItems];
    newItems[index].direction = newItems[index].direction === "asc" ? "desc" : "asc";
    setSortItems(newItems);

    const orderBy = { ...transformation.params?.order_by || {} };
    orderBy[newItems[index].column] = newItems[index].direction;
    transformation.updateSortParam(transformation.id, "order_by", orderBy);
  };

  const availableColumns = sourceCols.filter(
    col => !sortItems.some(item => item.column === col)
  );

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <p className="text-xs text-gray-600 mb-2">
          Configure the sorting order for the dataframe. You can sort by multiple columns.
        </p>
      </div>

      <div className="space-y-2">
        {sortItems.map((item, index) => (
          <div key={index} className="flex items-center space-x-2 p-2 bg-white border border-gray-200 rounded-md">
            <div className="flex-1 text-black font-medium text-sm">{item.column}</div>
            <button
              type="button"
              className={`px-2 py-1 rounded text-xs font-medium ${
                item.direction === "asc"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-purple-100 text-purple-700"
              }`}
              onClick={() => toggleDirection(index)}
            >
              {item.direction === "asc" ? (
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
              onClick={() => removeSortColumn(index)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="relative" ref={el => dropdownRefs.current["sort-column-dropdown"] = el}>
        <div className="mb-2">
          <button
            type="button"
            className="flex items-center space-x-1 text-sm text-[#8E77BB] hover:text-[#7d68a5]"
            onClick={() => setShowColumnDropdown(!showColumnDropdown)}
          >
            <Plus className="w-4 h-4" />
            <span>Add Column to Sort By</span>
          </button>
        </div>

        {showColumnDropdown && (
          <div className="absolute text-black z-10 left-0 mt-1 w-64 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            <div className="py-1">
              {availableColumns.length > 0 ? (
                availableColumns.map((column, idx) => (
                  <button
                    key={idx}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                    onClick={() => addSortColumn(column)}
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
        )}
      </div>


    </div>
  );
};

export const getSortParams = (transformation) => {
  return {
    order_by: transformation.params?.order_by || {}
  };
};

export default SortOperationFields;
