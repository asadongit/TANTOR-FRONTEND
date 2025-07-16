import React, { useMemo, useEffect, useRef, useState } from "react";
import Select from "react-select";
import { ChevronDown } from "lucide-react";

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
  handleOperatorChange,
  onAddNewTargetColumn
}) => {
  const sourceDropdownKey = `${transformation.id}-source`;
  const operatorDescription = OPERATORS.find(op => op.id === transformation.transformation_operator)?.description || "";

  const columnOptions = useMemo(() => (
    Array.isArray(sourceCols)
      ? sourceCols.map(col => {
          const colName = typeof col === "object" && col !== null ? col.name : col;
          const datatype = typeof col === "object" && col !== null && col.datatype ? col.datatype : "";
          return {
            value: colName,
            label: datatype ? `${colName} (${datatype})` : colName
          };
        })
      : []
  ), [sourceCols]);

  const selectedSourceOptions = Array.isArray(transformation.source_column)
    ? transformation.source_column.map(colName => ({
        value: colName,
        label: colName
      }))
    : [];

  const customStyles = {
    control: (provided) => ({
      ...provided,
      minHeight: '38px',
      border: '1px solid #e2e8f0',
      fontSize: '0.875rem',
      backgroundColor: 'white',
      boxShadow: 'none'
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: '#f3f4f6',
      color: '#111827'
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: '#111827',
      fontSize: '0.75rem',
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: '#4b5563',
      ':hover': {
        backgroundColor: '#ef4444',
        color: 'white',
      },
      opacity: 1,
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: '0 6px'
    }),
    input: (provided) => ({
      ...provided,
      margin: '0px',
      color: '#111827'
    }),
    indicatorSeparator: () => ({
      display: 'none'
    }),
    indicatorsContainer: (provided) => ({
      ...provided,
      height: '38px'
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#9ca3af',
      fontSize: '0.875rem'
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 9999,
      backgroundColor: 'white',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? '#8E77BB'
        : state.isFocused
          ? '#f3f4f6'
          : 'white',
      color: state.isSelected ? 'white' : '#111827',
      fontSize: '0.875rem',
      cursor: 'pointer',
      ':active': {
        backgroundColor: state.isSelected ? '#8E77BB' : '#f3f4f6',
      }
    }),
    noOptionsMessage: (provided) => ({
      ...provided,
      color: '#4b5563',
      fontSize: '0.875rem'
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#111827'
    }),
  };

  const debounceTimer = useRef(null);
  const [pendingRestriction, setPendingRestriction] = useState(false);

  const handleSourceChange = (selected) => {
    const selectedColumns = selected ? selected.map(option => option.value) : [];
    handleSelectAllColumns(transformation.id, 'source', selectedColumns, true);
    setPendingRestriction(selectedColumns.length > 0);
  };

  const applyRestriction = () => {
    if (onAddNewTargetColumn && typeof onAddNewTargetColumn === "function") {
      const operationType = transformation.transformation_operator;
      const selectedColumns = transformation.source_column || [];

      if (operationType === "select") {
        onAddNewTargetColumn(null, transformation.source_dataframe, "restrictcolumns", null, null, selectedColumns, "select");
      } else if (operationType === "drop") {
        onAddNewTargetColumn(null, transformation.source_dataframe, "restrictcolumns", null, null, selectedColumns, "drop");
      }
      setPendingRestriction(false);
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return (
    <div>
      <div className="mb-4">
        <label className="block text-xs text-gray-700 mb-1">Restriction Type</label>
        <select
          className="w-full p-2 text-sm bg-white border border-gray-300 rounded text-gray-800 focus:ring-1 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
          value={transformation.transformation_operator || ""}
          onChange={e => handleOperatorChange(transformation.id, e.target.value)}
          disabled={OPERATORS.length === 0}
        >
          <option value="" disabled>Select restriction type</option>
          {OPERATORS.map(op => (
            <option key={op.id} value={op.id}>{op.name}</option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">{operatorDescription}</p>
      </div>

      <div className="mb-4">
        <label className="text-xs text-gray-600 block mb-1">
          {transformation.transformation_operator === "select" ? "Columns to Keep" : "Columns to Remove"}
        </label>
        <Select
          isMulti
          options={columnOptions}
          value={selectedSourceOptions}
          onChange={handleSourceChange}
          placeholder={
            transformation.transformation_operator === "select"
              ? "Select columns to keep"
              : "Select columns to remove"
          }
          className="text-sm"
          styles={customStyles}
          noOptionsMessage={() => "No columns available"}
          closeMenuOnSelect={false}
          theme={theme => ({
            ...theme,
            colors: {
              ...theme.colors,
              primary: '#8E77BB',
              primary25: '#f3f4f6',
              neutral0: 'white',
              neutral80: '#111827',
            },
          })}
        />

        {pendingRestriction && transformation.transformation_operator && (
          <button
            onClick={applyRestriction}
            className="mt-2 px-3 py-1 bg-[#8E77BB] text-white text-xs rounded hover:bg-[#7d68a5] transition-colors"
          >
            Apply {transformation.transformation_operator === "select" ? "Selection" : "Restriction"}
          </button>
        )}
      </div>
    </div>
  );
};

export const getRestrictColumnsParams = () => {
  return {};
};

export default RestrictColumnsOperationFields;
