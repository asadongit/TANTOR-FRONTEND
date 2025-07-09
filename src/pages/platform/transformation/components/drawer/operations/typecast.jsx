import React, { useState, useEffect, useRef } from "react";
import Select, { components } from 'react-select';
import { ChevronDown } from "lucide-react";
import { DataTypeGroups, isNumericType, isFloatType, isStringType } from "../../../components/nodes/DataTypeMapping";

const DATA_TYPES = [
  { id: "string", name: "String", prefix: "str_" },
  { id: "int", name: "int", prefix: "int_" },
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
  dropdownRefs,
  onAddNewTargetColumn
}) => {
  const sourceDropdownKey = `${transformation.id}-source`;
  const isSourceDropdownOpen = openDropdowns[sourceDropdownKey] || false;
  const [isAddingNewColumn, setIsAddingNewColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const inputRef = useRef(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalInput, setModalInput] = useState("");
  const modalInputRef = useRef(null);

  const updateParam = (paramName, value) => {
    if (typeof transformation.updateTypecastParam === 'function') {
      transformation.updateTypecastParam(transformation.id, paramName, value);
    }
  };

  useEffect(() => {
    if (!isAddingNewColumn && transformation.target_column[0]) {
      setNewColumnName("");
    }
  }, [transformation.target_column, isAddingNewColumn]);

  useEffect(() => {
    if (isAddingNewColumn && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAddingNewColumn]);

  useEffect(() => {
    if (showAddModal && modalInputRef.current) {
      modalInputRef.current.focus();
    }
  }, [showAddModal]);

  const handleDataTypeChange = (value) => {
    updateParam("target_datatype", value);
    const selectedTarget = transformation.target_column[0];
    if (selectedTarget) {
      const targetCol = sourceCols.find(col => (typeof col === "object" ? col.name : col) === selectedTarget);
      const targetDataType = targetCol && typeof targetCol === "object" ? targetCol.datatype : "";
      if (targetDataType && !isAddingNewColumn) {
        const isValid = value === "string"
          ? isStringType(targetDataType)
          : value === "int"
          ? isNumericType(targetDataType)
          : value === "float"
          ? isFloatType(targetDataType)
          : targetDataType === value;
        if (!isValid) {
          handleSelectAllColumns(transformation.id, "target", [], true);
        }
      }
    }
  };

  const filteredSourceCols = sourceCols.filter(col => {
    const datatype = typeof col === "object" && col.datatype ? col.datatype : "";
    return isNumericType(datatype) || isFloatType(datatype);
  });

  const columnOptions = filteredSourceCols.map(col => {
    const colName = typeof col === "object" ? col.name : col;
    const datatype = typeof col === "object" && col.datatype ? col.datatype : "";
    return {
      value: colName,
      label: datatype ? `${colName} (${datatype})` : colName,
      datatype: datatype
    };
  });

  const selectedDataType = transformation.params.target_datatype || "";
  console.log("selected datat===>",selectedDataType)
  const targetColumnOptions = [
    ...(selectedDataType
      ? sourceCols
          .filter(col => {
            const datatype = typeof col === "object" && col.datatype ? col.datatype : "";
            return selectedDataType === "string"
              ? isStringType(datatype)
              : selectedDataType === "int"
              ? isNumericType(datatype)
              : selectedDataType === "float"
              ? isFloatType(datatype)
              : datatype === selectedDataType;
          })
          .map(col => {
            const colName = typeof col === "object" ? col.name : col;
            const datatype = typeof col === "object" && col.datatype ? col.datatype : "";
            return {
              value: colName,
              label: datatype ? `${colName} (${datatype})` : colName,
              datatype: datatype
            };
          })
      : columnOptions),
    ...(isAddingNewColumn && newColumnName ? [{ value: newColumnName, label: newColumnName }] : []),
  ];

  const selectedSourceOption = transformation.source_column && transformation.source_column.length > 0
    ? { value: transformation.source_column[0], label: transformation.source_column[0] }
    : null;

  const selectedTargetOption = isAddingNewColumn && newColumnName
    ? { value: newColumnName, label: newColumnName }
    : transformation.target_column[0]
    ? { value: transformation.target_column[0], label: transformation.target_column[0] }
    : null;

  const handleSourceChange = (selected) => {
    const selectedColumn = selected ? selected.value : null;
    handleSelectAllColumns(transformation.id, "source", selectedColumn ? [selectedColumn] : [], true);

    const sourceCol = filteredSourceCols.find(col =>
      (typeof col === "object" ? col.name : col) === selectedColumn
    );
    const sourceDataType = sourceCol && typeof sourceCol === "object"
      ? sourceCol.datatype
      : "";

    updateParam("source_datatype", sourceDataType);

    updateParam("target_datatype", "");
    handleSelectAllColumns(transformation.id, "target", [], true);
  };

  const handleTargetChange = (selected, { action }) => {
    if (action === "clear") {
      setIsAddingNewColumn(false);
      setNewColumnName("");
      handleSelectAllColumns(transformation.id, "target", [], true);
      return;
    }
    if (selected) {
      setIsAddingNewColumn(false);
      setNewColumnName("");
      handleSelectAllColumns(transformation.id, "target", [selected.value], true);
      if (onAddNewTargetColumn && typeof onAddNewTargetColumn === "function" && selected.value !== transformation.target_column[0]) {
        onAddNewTargetColumn(selected.value, transformation.source_dataframe, transformation.params.target_datatype || "");
      }
    }
  };

  const handleNewColumnNameChange = (e) => {
    const name = e.target.value;
    setNewColumnName(name);
    if (name.trim()) {
      handleSelectAllColumns(transformation.id, "target", [name], true);
    } else {
      handleSelectAllColumns(transformation.id, "target", [], true);
    }
  };

  const selectedSourceColumn = filteredSourceCols.find(col =>
    (typeof col === "object" ? col.name : col) === transformation.source_column?.[0]
  );
  const sourceDataType = selectedSourceColumn && typeof selectedSourceColumn === "object"
    ? selectedSourceColumn.datatype
    : "";

  const filteredDataTypes = DATA_TYPES.filter(type => {
    if (!sourceDataType) return true;

    if (isNumericType(sourceDataType) && !isFloatType(sourceDataType)) {
      return ["string", "float"].includes(type.id);
    }
    if (isFloatType(sourceDataType)) {
      return type.id === "int";
    }
    return ["string"].includes(type.id);
  });


  const customStyles = {
    control: (provided) => ({
      ...provided,
      minHeight: "38px",
      border: "1px solid #e2e8f0",
      fontSize: "0.875rem",
      backgroundColor: "white",
      boxShadow: "none",
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: "#f3f4f6",
      color: "#111827",
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: "#111827",
      fontSize: "0.75rem",
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: "#4b5563",
      ":hover": {
        backgroundColor: "#ef4444",
        color: "white",
      },
      opacity: 1,
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
        {!isAddingNewColumn && (
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
        )}
        {props.children}
      </components.MenuList>
    );
  };

  const handleModalOk = () => {
    const name = modalInput.trim();
    if (name) {
      setShowAddModal(false);
      setIsAddingNewColumn(false);
      setNewColumnName("");
      handleSelectAllColumns(transformation.id, "target", [name], true);
      if (onAddNewTargetColumn && typeof onAddNewTargetColumn === "function") {
        onAddNewTargetColumn(name, transformation.source_dataframe, transformation.params.target_datatype || "");
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

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="flex-1 relative" ref={el => dropdownRefs.current[sourceDropdownKey] = el}>
          <label className="text-xs text-gray-600 block mb-1">Source Column</label>
          <Select
            options={columnOptions}
            value={selectedSourceOption}
            onChange={handleSourceChange}
            placeholder="Select column"
            className="text-sm"
            styles={customStyles}
            noOptionsMessage={() => "No numeric or float columns available"}
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
        <div className="flex-1">
          <label className="block text-xs text-gray-700 mb-1">Target Data Type</label>
          <select
            className="w-full p-2 text-sm bg-white border border-gray-300 rounded text-gray-800 focus:ring-1 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
            value={transformation.params.target_datatype || ""}
            onChange={(e) => handleDataTypeChange(e.target.value)}
          >
            <option value="" disabled>Select Data Type</option>
            {filteredDataTypes.map(type => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="w-1/2">
        <label className="text-xs text-gray-600 block mb-1">Target Column</label>
        <Select
          options={targetColumnOptions}
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

      {showAddModal && AddColumnModal}
    </div>
  );
};

export const getTypecastParams = (transformation) => {
  return {
    target_datatype: transformation.params.target_datatype || "",
    source_datatype: transformation.params.source_datatype || ""
  };
};

export default TypecastOperationFields;