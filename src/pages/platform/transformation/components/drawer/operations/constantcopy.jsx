import React, { useState, useEffect, useRef } from "react";
import Select, { components } from 'react-select';
import { ChevronDown } from "lucide-react";
import { isNumericType, isStringType, isFloatType, DataTypeGroups } from "../../nodes/DataTypeMapping";

const DATA_TYPES = [
  { id: "string", name: "String" },
  { id: "int", name: "Integer" },
  { id: "float", name: "Float" },
  { id: "boolean", name: "Boolean" },
  { id: "timestamp", name: "Timestamp" },
  { id: "date", name: "Date" },
];

const VALUE_TYPES = [
  { id: "c", name: "Constant" },
  { id: "v", name: "Variable/Function" }
];

export const ConstantCopyOperationFields = ({
  transformation,
  sourceCols,
  targetCols,
  openDropdowns,
  toggleDropdown,
  handleSelectAllColumns,
  handleColumnSelection,
  dropdownRefs,
  onAddNewTargetColumn
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalInput, setModalInput] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const modalInputRef = useRef(null);

  useEffect(() => {
    setRefreshKey(prev => prev + 1);
  }, [targetCols, transformation.params.datatype, transformation.target_column]);

  const columnOptions = React.useMemo(() => {
    if (!Array.isArray(targetCols)) return [];

    const selectedDataType = transformation.params.datatype || "string";

    // Filter columns based on selected datatype
    const filteredCols = targetCols.filter(col => {
      const colDatatype = typeof col === "object" && col.datatype ? col.datatype : "";

      if (!colDatatype) return true; // Include columns without datatype info

      // Check if column datatype matches selected datatype
      switch (selectedDataType) {
        case "string":
          return isStringType(colDatatype);
        case "int":
          return isNumericType(colDatatype);
        case "float":
          return isFloatType(colDatatype) || isNumericType(colDatatype);
        case "boolean":
          return colDatatype.toLowerCase().includes("bool");
        case "date":
        case "timestamp":
          return DataTypeGroups.date.some(dt => colDatatype.toLowerCase().includes(dt));
        default:
          return true;
      }
    });

    return filteredCols.map(col => {
      const colName = typeof col === "string" ? col : col.name;
      const datatype = typeof col === "object" && col.datatype ? col.datatype : "";
      return {
        value: colName,
        label: datatype ? `${colName} (${datatype})` : colName,
      };
    });
  }, [targetCols, transformation.params.datatype, refreshKey]);

  const selectedTargetOption = React.useMemo(() => {
    if (transformation.target_column && transformation.target_column.length > 0) {
      const selectedColumnName = transformation.target_column[0];
      const existingOption = columnOptions.find(opt => opt.value === selectedColumnName);

      if (existingOption) {
        return existingOption;
      }

      const currentDatatype = transformation.params.datatype || "string";
      return {
        value: selectedColumnName,
        label: `${selectedColumnName} (${currentDatatype})`
      };
    }
    return null;
  }, [columnOptions, transformation.target_column, transformation.params.datatype]);

  useEffect(() => {
    if (showAddModal && modalInputRef.current) {
      modalInputRef.current.focus();
    }
  }, [showAddModal]);

  const updateParam = (paramName, value) => {
    if (typeof transformation.updateConstantCopyParam === 'function') {
      transformation.updateConstantCopyParam(transformation.id, paramName, value);
    }
  };

  const handleTargetChange = (selected, { action }) => {
    if (action === "clear") {
      handleSelectAllColumns(transformation.id, "target", [], true);
      return;
    }
    if (selected) {
      handleSelectAllColumns(transformation.id, "target", [selected.value], true);

      if (onAddNewTargetColumn && typeof onAddNewTargetColumn === "function") {
        const selectedDatatype = transformation.params.datatype || "string";
        onAddNewTargetColumn(selected.value, transformation.source_dataframe, "constantcopy", selectedDatatype);
      }
    }
  };

  const customStyles = {
    control: (provided) => ({
      ...provided,
      minHeight: "38px",
      border: "1px solid #e2e8f0",
      fontSize: "0.875rem",
      backgroundColor: "white",
      boxShadow: "none",
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: "0 6px",
    }),
    input: (provided) => ({
      ...provided,
      margin: "0px",
      color: "#111827",
    }),
    indicatorSeparator: () => ({
      display: "none",
    }),
    indicatorsContainer: (provided) => ({
      ...provided,
      height: "38px",
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "#9ca3af",
      fontSize: "0.875rem",
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

  const CustomMenuList = (props) => {
    return (
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
  };

  const handleModalOk = () => {
    const name = modalInput.trim();
    if (name) {
      setShowAddModal(false);
      handleSelectAllColumns(transformation.id, "target", [name], true);
      if (onAddNewTargetColumn && typeof onAddNewTargetColumn === "function") {
        const selectedDatatype = transformation.params.datatype || "string";
        onAddNewTargetColumn(name, transformation.source_dataframe, "constantcopy", selectedDatatype);
      }
    }
  };

  const handleModalInputKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleModalOk();
    }
  };

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
        <div className="mb-3 text-base font-medium text-gray-700">Add New Target Column</div>
        <input
          ref={modalInputRef}
          type="text"
          className="w-full p-2 mb-4 border border-gray-300 rounded text-gray-800"
          placeholder="Enter new column name"
          value={modalInput}
          onChange={(e) => setModalInput(e.target.value)}
          onKeyDown={handleModalInputKeyDown}
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

  // Enhanced datatype change handler with immediate effect
  const handleDatatypeChange = (newDatatype) => {
    updateParam("datatype", newDatatype);

    // Clear target column selection when datatype changes to avoid mismatch
    handleSelectAllColumns(transformation.id, "target", [], true);

    // If a target column is selected, update it immediately
    if (transformation.target_column && transformation.target_column.length > 0 && onAddNewTargetColumn) {
      const selectedColumn = transformation.target_column[0];
      onAddNewTargetColumn(selectedColumn, transformation.source_dataframe, "constantcopy", newDatatype);
    }
  };

  return (
    <div className="constant-copy-operation-fields space-y-4">
      {/* Top row: Data Type and Value Type */}
      <div className="flex gap-4">
        <div className="w-1/2">
          <label className="block text-xs text-gray-700 mb-1">Data Type</label>
          <select
            className="w-full p-2 text-sm bg-white border border-gray-300 rounded text-gray-800 focus:ring-1 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
            value={transformation.params.datatype || "string"}
            onChange={(e) => handleDatatypeChange(e.target.value)}
            disabled={transformation.params.value_type === "v"}
          >
            {DATA_TYPES.map(type => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>

        <div className="w-1/2">
          <label className="block text-xs text-gray-700 mb-1">Value Type</label>
          <select
            className="w-full p-2 text-sm bg-white border border-gray-300 rounded text-gray-800 focus:ring-1 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
            value={transformation.params.value_type || "c"}
            onChange={(e) => updateParam("value_type", e.target.value)}
          >
            {VALUE_TYPES.map(type => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Helper text for Value Type */}
      <div className="text-xs text-gray-500">
        {transformation.params.value_type === "v"
          ? "Enter a variable or function expression (e.g., current_timestamp(), business_date)"
          : "Enter a literal constant value"}
      </div>

      {/* Bottom row: Value input and Target Column */}
      <div className="flex gap-4">
        <div className="w-1/2">
          <label className="block text-xs text-gray-700 mb-1">Value</label>
          <input
            type="text"
            className="w-full p-2 text-sm bg-white border border-gray-300 rounded text-gray-800 focus:ring-1 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
            placeholder={"Enter value"}
            value={transformation.params.value || ""}
            onChange={(e) => updateParam("value", e.target.value)}
          />
        </div>

        <div className="w-1/2">
          <label className="text-xs text-gray-600 block mb-1">Target Column</label>
          <Select
            key={`select-${transformation.id}-${refreshKey}`}
            options={columnOptions}
            value={selectedTargetOption}
            onChange={handleTargetChange}
            placeholder="Select target column"
            className="text-sm"
            styles={customStyles}
            noOptionsMessage={() => "No columns available"}
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
        </div>
      </div>

      {showAddModal && AddColumnModal}
    </div>
  );
};

export const getConstantCopyParams = (transformation) => {
  return {
    value: transformation.params.value || "",
    value_type: transformation.params.value_type || "c",
    datatype: transformation.params.value_type === "v" ? "" : (transformation.params.datatype || "string")
  };
};

export default ConstantCopyOperationFields;
