import React, { useState, useEffect, useRef } from "react";
import Select, { components } from 'react-select';
import { ChevronDown } from "lucide-react";

const STRING_OPERATIONS = [
  { id: "lpad", name: "Left Pad" },
  { id: "rpad", name: "Right Pad" },
  { id: "substr", name: "Substring" },
  { id: "trim", name: "Trim" },
  { id: "ltrim", name: "Left Trim" },
  { id: "rtrim", name: "Right Trim" },
];

const isStringType = (datatype) => {
  if (!datatype) return false;
  const lowerType = datatype.toLowerCase();
  return lowerType.includes("char") || lowerType.includes("string") || lowerType.includes("varchar");
};

export const StringOperationParameters = ({ operator, params, onChange }) => {
  const handleNumberChange = (paramName, value) => {
    const parsedValue = value.trim() === "" ? "" : parseInt(value, 10);
    onChange(paramName, isNaN(parsedValue) ? "" : parsedValue);
  };

  switch (operator) {
    case 'lpad':
    case 'rpad':
      return (
        <div className="space-y-3 mt-3">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-xs text-gray-700 mb-1">Max Length</label>
              <input
                type="number"
                className="w-full p-2 text-sm bg-white border border-gray-300 rounded text-gray-800 focus:ring-1 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
                value={params.max_length ?? ""}
                onChange={(e) => handleNumberChange("max_length", e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-700 mb-1">Padding Character</label>
              <input
                type="text"
                maxLength={1}
                className="w-full p-2 text-sm bg-white border border-gray-300 rounded text-gray-800 focus:ring-1 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
                value={params.padding_character ?? ""}
                onChange={(e) => onChange("padding_character", e.target.value)}
              />
            </div>
          </div>
        </div>
      );
    case 'substr':
      return (
        <div className="space-y-3 mt-3">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-xs text-gray-700 mb-1">Start Position</label>
              <input
                type="number"
                className="w-full p-2 text-sm bg-white border border-gray-300 rounded text-gray-800 focus:ring-1 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
                value={params.start_position ?? ""}
                onChange={(e) => handleNumberChange("start_position", e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-700 mb-1">Number of Characters</label>
              <input
                type="number"
                className="w-full p-2 text-sm bg-white border border-gray-300 rounded text-gray-800 focus:ring-1 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
                value={params.no_of_character ?? ""}
                onChange={(e) => handleNumberChange("no_of_character", e.target.value)}
              />
            </div>
          </div>
        </div>
      );
    case 'trim':
    case 'ltrim':
    case 'rtrim':
      return null;
    default:
      return null;
  }
};

export const StringOperationFields = ({
  transformation,
  sourceCols,
  targetCols,
  openDropdowns,
  toggleDropdown,
  handleSelectAllColumns,
  handleColumnSelection,
  dropdownRefs,
  updateStringParam,
  onAddNewTargetColumn,
}) => {
  const [isAddingNewColumn, setIsAddingNewColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const inputRef = useRef(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalInput, setModalInput] = useState("");
  const modalInputRef = useRef(null);

  const stringCols = Array.isArray(sourceCols)
    ? sourceCols.filter(col => {
        if (typeof col === "object" && col.datatype) {
          return isStringType(col.datatype);
        }
        return true;
      })
    : [];

  const columnOptions = stringCols.map(col => {
    const colName = typeof col === "string" ? col : col.name;
    const datatype = typeof col === "object" && col.datatype ? col.datatype : "";
    return {
      value: colName,
      label: datatype ? `${colName} (${datatype})` : colName,
    };
  });

  const targetColumnOptions = [
    ...columnOptions,
    ...(isAddingNewColumn && newColumnName ? [{ value: newColumnName, label: newColumnName }] : []),
  ];

  const selectedTargetOption = isAddingNewColumn && newColumnName
    ? { value: newColumnName, label: newColumnName }
    : transformation.target_column[0]
    ? { value: transformation.target_column[0], label: transformation.target_column[0] }
    : null;

  const selectedSourceOption = transformation.source_column && transformation.source_column.length > 0
    ? { value: transformation.source_column[0], label: transformation.source_column[0] }
    : null;

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

  const handleSourceChange = (selected) => {
    const selectedColumn = selected ? selected.value : null;
    handleSelectAllColumns(transformation.id, "source", selectedColumn ? [selectedColumn] : [], true);
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
        onAddNewTargetColumn(selected.value, transformation.source_dataframe, "string");
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

  const handleOperationChange = (operationId) => {
    updateStringParam(transformation.id, "transformation_operator", operationId);
  };

  const handleParamChange = (paramName, value) => {
    updateStringParam(transformation.id, paramName, value);
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
        onAddNewTargetColumn(name, transformation.source_dataframe, "string");
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
    <div className="string-operation-fields space-y-4">
      <div className="flex gap-4 items-end mb-4">
        <div className="flex-1">
          <label className="text-xs text-gray-600 block mb-1">Source Columns</label>
          <Select
            options={columnOptions}
            value={selectedSourceOption}
            onChange={handleSourceChange}
            placeholder="Select column"
            className="text-sm"
            styles={customStyles}
            noOptionsMessage={() => "No string columns available"}
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
          <label className="text-xs text-gray-600 block mb-1">Operater</label>
          <Select
            options={STRING_OPERATIONS.map(op => ({ value: op.id, label: op.name }))}
            value={{ value: transformation.transformation_operator, label: STRING_OPERATIONS.find(op => op.id === transformation.transformation_operator)?.name }}
            onChange={(selected) => handleOperationChange(selected.value)}
            placeholder="Select operation"
            className="text-sm"
            styles={customStyles}
            noOptionsMessage={() => "No operations available"}
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

      <StringOperationParameters
        operator={transformation.transformation_operator}
        params={transformation.params || {}}
        onChange={handleParamChange}
      />

      <div className="flex mt-4">
        <div className="w-1/2">
          <label className="text-xs text-gray-600 block mb-1">Target Column</label>
          <Select
            options={targetColumnOptions}
            value={selectedTargetOption}
            onChange={handleTargetChange}
            placeholder="Select target column"
            className="text-sm"
            styles={customStyles}
            noOptionsMessage={() => "No string columns available"}
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

export const getStringParams = (transformation) => {
  switch (transformation.transformation_operator) {
    case "lpad":
    case "rpad":
      return {
        max_length: transformation.params.max_length,
        padding_character: transformation.params.padding_character,
      };
    case "substr":
      return {
        start_position: transformation.params.start_position,
        no_of_character: transformation.params.no_of_character,
      };
    case "trim":
    case "ltrim":
    case "rtrim":
      return {};
    default:
      return {};
  }
};

export default StringOperationFields;