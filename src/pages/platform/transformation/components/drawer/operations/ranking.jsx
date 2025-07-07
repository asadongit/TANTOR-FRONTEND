import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, X, Plus, ArrowUp, ArrowDown } from "lucide-react";
import Select, { components } from "react-select";

export const RankingOperationFields = ({
  transformation,
  sourceCols,
  targetCols,
  openDropdowns,
  toggleDropdown,
  handleSelectAllColumns,
  handleColumnSelection,
  dropdownRefs,
  onAddNewTargetColumn, // <-- add this prop
}) => {
  const [showOrderByDropdown, setShowOrderByDropdown] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalInput, setModalInput] = useState("");
  const modalInputRef = useRef(null);

  // Prepare options for the Select component
  const columnOptions = sourceCols.map((col) => ({
    value: typeof col === "object" ? col.name : col,
    label: typeof col === "object" ? col.name : col,
  }));

  // For rank column dropdown (target column)
  const targetColumnOptions = [
    ...targetCols.map((col) => ({
      value: typeof col === "object" ? col.name : col,
      label: typeof col === "object" ? col.name : col,
    })),
  ];

  // Selected option for rank column
  const selectedTargetOption =
    transformation.target_column && transformation.target_column.length > 0
      ? {
          value: transformation.target_column[0],
          label: transformation.target_column[0],
        }
      : null;

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
    menu: (provided) => ({
      ...provided,
      zIndex: 9999,
      backgroundColor: "white",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? "#8E77BB"
        : state.isFocused
        ? "#f3f4f6"
        : "white",
      color: state.isSelected ? "white" : "#111827",
      fontSize: "0.875rem",
      cursor: "pointer",
      ":active": {
        backgroundColor: state.isSelected ? "#8E77BB" : "#f3f4f6",
      },
    }),
    noOptionsMessage: (provided) => ({
      ...provided,
      color: "#4b5563",
      fontSize: "0.875rem",
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "#111827",
    }),
  };

  // Restore updateRankingParam
  const updateRankingParam = (paramName, value) => {
    if (typeof transformation.updateRankingParam === "function") {
      transformation.updateRankingParam(transformation.id, paramName, value);
    }
  };

  // Move handleModalOk above AddColumnModal
  const handleModalOk = () => {
    const name = modalInput.trim();
    if (name) {
      setShowAddModal(false);
      if (typeof transformation.updateTargetColumns === "function") {
        transformation.updateTargetColumns(transformation.id, [name]);
      }
      if (onAddNewTargetColumn && typeof onAddNewTargetColumn === "function") {
        onAddNewTargetColumn(name, transformation.source_dataframe, "ranking");
      }
    }
  };

  // Custom menu list to add new column
  const CustomMenuList = (props) => (
    <components.MenuList {...props}>
      <div
        style={{
          padding: "8px 12px",
          borderBottom: "1px solid #e5e7eb",
          background: "white",
          cursor: "pointer",
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          setShowAddModal(true);
          setModalInput("");
        }}
      >
        <span style={{ color: "#8E77BB", fontWeight: 500 }}>Add New +</span>
      </div>
      {props.children}
    </components.MenuList>
  );

  // Modal for adding new column
  const AddColumnModal = (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.2)",
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={() => setShowAddModal(false)}
    >
      <div
        style={{
          background: "white",
          padding: 24,
          borderRadius: 8,
          minWidth: 320,
          boxShadow: "0 2px 16px rgba(0,0,0,0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 text-base font-medium text-gray-700">Add New Rank Column</div>
        <input
          ref={modalInputRef}
          type="text"
          className="w-full p-2 mb-4 border border-gray-300 rounded text-gray-800"
          placeholder="Enter new column name"
          value={modalInput}
          onChange={(e) => setModalInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleModalOk();
            }
          }}
        />
        <div className="flex justify-end gap-2">
          <button
            className="px-3 py-1 rounded bg-gray-200 text-gray-700"
            onClick={() => setShowAddModal(false)}
          >
            Cancel
          </button>
          <button
            className="px-3 py-1 rounded bg-[#8E77BB] text-white"
            onClick={handleModalOk}
            disabled={!modalInput.trim()}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    if (showAddModal && modalInputRef.current) {
      modalInputRef.current.focus();
    }
  }, [showAddModal]);

  const handleTargetChange = (selected, { action }) => {
    if (action === "clear") {
      if (typeof transformation.updateTargetColumns === "function") {
        transformation.updateTargetColumns(transformation.id, []);
      }
      return;
    }
    if (selected) {
      if (typeof transformation.updateTargetColumns === "function") {
        transformation.updateTargetColumns(transformation.id, [selected.value]);
      }
      // If new column, call onAddNewTargetColumn
      if (
        onAddNewTargetColumn &&
        typeof onAddNewTargetColumn === "function" &&
        !targetCols.some(
          (col) =>
            (typeof col === "object" ? col.name : col) === selected.value
        )
      ) {
        onAddNewTargetColumn(selected.value, transformation.source_dataframe, "ranking");
      }
    }
  };

  // Initialize group_by and order_by if not present
  useEffect(() => {
    if (!transformation.params.group_by) {
      updateRankingParam("group_by", []);
    }
    if (!transformation.params.order_by) {
      updateRankingParam("order_by", {});
    }
    // eslint-disable-next-line
  }, []);

  // Handle changes in the Select component for group_by
  const handleGroupByChange = (selectedOptions) => {
    const newGroupBy = selectedOptions ? selectedOptions.map((option) => option.value) : [];
    updateRankingParam("group_by", newGroupBy);
  };

  // Order By logic
  const addOrderByColumn = (column) => {
    const columnName = typeof column === "object" ? column.name : column;
    if (!Object.keys(transformation.params.order_by || {}).includes(columnName)) {
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
      !Object.keys(transformation.params.order_by || {}).includes(
        typeof col === "object" ? col.name : col
      )
  );

  // For group by select
  const selectedGroupByOptions = (transformation.params.group_by || []).map((col) => ({
    value: col,
    label: col,
  }));

  return (
    <div className="space-y-4">
      {/* Rank Column Dropdown */}
      <div className="relative">
        <label className="text-xs text-gray-600 block mb-1">Select Rank Column</label>
        <Select
          options={targetColumnOptions}
          value={selectedTargetOption}
          onChange={handleTargetChange}
          placeholder="Select column to store ranks"
          className="text-sm text-black"
          styles={customStyles}
          noOptionsMessage={() =>
            targetCols.length === 0
              ? "No columns available"
              : "All columns have been added"
          }
          isClearable
          components={{ MenuList: CustomMenuList }}
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
        {showAddModal && AddColumnModal}
      </div>

      {/* Group By Columns */}
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