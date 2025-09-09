import React from "react";
import Select from "react-select";
import { ChevronDown } from "lucide-react";
import { isStringType, isNumericType } from "../../nodes/DataTypeMapping";

export const FILTER_OPERATORS = [
  { id: ">=", name: "Greater Than or Equal (>=)", value: ">=" },
  { id: "<=", name: "Less Than or Equal (<=)", value: "<=" },
  { id: ">", name: "Greater Than (>)", value: ">" },
  { id: "<", name: "Less Than (<)", value: "<" },
  { id: "==", name: "Equal (==)", value: "==" },
  { id: "!=", name: "Not Equal (!=)", value: "!=" },


];

function getAvailableFilterColumns(sourceCols, allTransformations) {
  let cols = Array.isArray(sourceCols) ? [...sourceCols] : [];
  if (Array.isArray(allTransformations)) {
    allTransformations.forEach(tr => {
      if (tr && Array.isArray(tr.target_column)) {
        tr.target_column.forEach(tc => {
          const colName = typeof tc === "string" ? tc : tc?.name;
          const colDatatype = typeof tc === "object" && tc?.datatype ? tc.datatype : undefined;
          if (colName && !cols.some(c => (typeof c === "object" ? c.name : c) === colName)) {
            if (colDatatype) {
              cols.push({ name: colName, datatype: colDatatype });
            } else {
              cols.push(colName);
            }
          }
        });
      }
    });
  }
  return cols;
}

export const FilterParameters = ({ params, onChange, selectedColType, filterType, columnOptions, sourceColumn, sourceColDatatype }) => (
  <div>
    <label className="block text-xs text-gray-700 mb-1">
      {filterType === "column" ? "Compare With Column" : "Value"}
    </label>
    {filterType === "column" ? (
      <Select
        options={
          columnOptions.filter(opt =>
            opt.value !== sourceColumn &&
            (
              !sourceColDatatype ||
              !opt.datatype ||
              (opt.datatype && sourceColDatatype && opt.datatype.toLowerCase() === sourceColDatatype.toLowerCase())
            )
          )
        }
        value={columnOptions.find(opt => opt.value === params.value) || null}
        onChange={selected => onChange("value", selected ? selected.value : "")}
        placeholder="Select column"
        className="text-sm"
        isDisabled={!filterType}
        styles={{
          control: (provided) => ({
            ...provided,
            minHeight: '38px',
            border: '1px solid #e2e8f0',
            fontSize: '0.875rem',
            backgroundColor: 'white',
            boxShadow: 'none'
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
        }}
        isClearable
        isMulti={false}
        noOptionsMessage={() => "No columns available"}
      />
    ) : (
      <>
        <input
          type={
            isStringType(selectedColType) ? "text"
            : isNumericType(selectedColType) ? "number"
            : selectedColType === "date" ? "date"
            : selectedColType === "timestamp" ? "datetime-local"
            : "text"
          }
          step={isNumericType(selectedColType) ? "1" : undefined}
          className="w-full p-2 text-sm bg-white border border-gray-300 rounded text-gray-800 focus:ring-1 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
          placeholder={
            isStringType(selectedColType) ? "Enter filter value"
            : isNumericType(selectedColType) ? "Enter integer value"
            : selectedColType === "date" ? "yyyy-mm-dd"
            : selectedColType === "timestamp" ? "yyyy-mm-ddThh:mm"
            : "Enter filter value"
          }
          value={
            (selectedColType === "date" || selectedColType === "timestamp")
              ? (params.value || "")
              : (params.value || "")
          }
          onChange={e => {
            if (!filterType) return;
            if (isNumericType(selectedColType)) {
              const val = e.target.value;
              if (val === "" || /^-?\d+$/.test(val)) {
                onChange("value", val);
              }
            } else if (selectedColType === "date") {
              const val = e.target.value;
              if (val === "" || /^\d{4}-\d{2}-\d{2}$/.test(val)) {
                onChange("value", val);
              }
            } else if (selectedColType === "timestamp") {
              const val = e.target.value;
              // Accept yyyy-mm-ddThh:mm or empty
              if (val === "" || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(val)) {
                onChange("value", val);
              }
            } else {
              onChange("value", e.target.value);
            }
          }}
          disabled={!filterType}
          pattern={
            selectedColType === "date"
              ? "\\d{4}-\\d{2}-\\d{2}"
              : selectedColType === "timestamp"
              ? "\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}"
              : undefined
          }
          inputMode={
            selectedColType === "date" || selectedColType === "timestamp"
              ? "numeric"
              : undefined
          }
        />

      </>
    )}
  </div>
);

export const FilterOperationFields = ({
  transformation,
  sourceCols,
  handleSelectAllColumns,
  handleColumnSelection,
  handleOperatorChange,
  updateTransformation,
  allTransformations = [],
  operatorOptions = FILTER_OPERATORS,
  transformation_operator
}) => {

  const availableColumns = getAvailableFilterColumns(sourceCols, allTransformations);

  const columnOptions = availableColumns.map(col =>
    typeof col === "object"
      ? { value: col.name, label: col.datatype ? `${col.name} (${col.datatype})` : col.name, datatype: col.datatype }
      : { value: col, label: col }
  );

  const selectedOption = columnOptions.find(
    opt => transformation.source_column && transformation.source_column[0] === opt.value
  ) || null;

  let selectedColType = undefined;
  let selectedColDatatype = undefined;
  if (selectedOption) {
    selectedColDatatype =
      selectedOption.datatype ||
      (availableColumns.find(
        c => (typeof c === "object" ? c.name : c) === selectedOption.value
      )?.datatype) ||
      undefined;
    if (selectedColDatatype) {
      const t = selectedColDatatype.toLowerCase();
      if (isStringType(t)) selectedColType = t;
      else if (isNumericType(t)) selectedColType = t;
      else if (t.includes("timestamp")) selectedColType = "timestamp";
      else if (t.includes("date") || t.includes("time")) selectedColType = "date";
    }
  }

  const updateParam = (paramName, value) => {
    if (typeof transformation.updateFilterParam === 'function') {
      transformation.updateFilterParam(transformation.id, paramName, value);
    }
  };


  const handleColumnChange = (selected) => {
    if (selected) {
      handleSelectAllColumns(transformation.id, 'source', [selected.value], true);
    } else {
      handleSelectAllColumns(transformation.id, 'source', [], true);
    }
  };

  const filterType = transformation.params?.filter_type || "";

  const handleFilterTypeChange = (e) => {
    const value = e.target.value;
    if (typeof transformation.updateFilterParam === 'function') {
      transformation.updateFilterParam(transformation.id, "filter_type", value);
      transformation.updateFilterParam(transformation.id, "value", "");
    }
    if (!value) {
      handleOperatorChange(transformation.id, "");
    }
  };

  const selectedOperator = transformation_operator || transformation.transformation_operator || operatorOptions[0]?.id;

  let operatorOptionsFiltered = operatorOptions;
  if (selectedColType && selectedColDatatype) {
    const datatype = selectedColDatatype.toLowerCase();
    if (datatype.includes("varchar") || datatype.includes("char") || datatype.includes("string") || datatype.includes("text")) {
      operatorOptionsFiltered = operatorOptions.filter(op => op.id === "==" || op.id === "!=");
    }
  }

  const customStyles = {
    control: (provided) => ({
      ...provided,
      minHeight: '38px',
      border: '1px solid #e2e8f0',
      fontSize: '0.875rem',
      backgroundColor: 'white',
      boxShadow: 'none'
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

  return (
    <div>
      <div className="flex gap-4 mb-2">
        <div className="w-1/2">
          <label className="text-xs text-gray-600 block mb-1">Source Column to Filter</label>
          <Select
            options={columnOptions}
            value={selectedOption}
            onChange={handleColumnChange}
            placeholder="Select column to filter"
            className="text-sm"
            styles={customStyles}
            isClearable
            isMulti={false}
            noOptionsMessage={() => "No columns available"}
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
        </div>
        <div className="w-1/2">
          <label className="block text-xs text-gray-700 mb-1">Filter Type</label>
          <select
            className="w-full p-2 text-sm bg-white border border-gray-300 rounded text-gray-800 focus:ring-1 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
            value={filterType}
            onChange={handleFilterTypeChange}
          >
            <option value="">Select filter type</option>
            <option value="value">Value</option>
            <option value="column">Column</option>
          </select>
        </div>
      </div>
      <div className="flex gap-4 mb-4 mt-4">
        <div className="w-1/2">
          <label className="block text-xs text-gray-700 mb-1">
            Filter Operator
            {!filterType && (
              <span className="text-xs text-gray-400 ml-1">
                (Please select filter type first)
              </span>
            )}
          </label>
          <select
            className="w-full p-2 text-sm bg-white border border-gray-300 rounded text-gray-800 focus:ring-1 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
            value={selectedOperator}
            onChange={(e) => handleOperatorChange(transformation.id, e.target.value)}
            disabled={!filterType}
          >
            <option value="">
              {filterType ? "Select operator" : "Select option type first"}
            </option>
            {operatorOptionsFiltered.map(op => (
              <option key={op.id} value={op.id}>
                {op.name}
              </option>
            ))}
          </select>
        </div>
        <div className="w-1/2">
          <div className="mt-0">
            <FilterParameters
              params={transformation.params}
              onChange={updateParam}
              selectedColType={selectedColType}
              filterType={filterType}
              columnOptions={columnOptions}
              sourceColumn={transformation.source_column && transformation.source_column[0]}
              sourceColDatatype={selectedColDatatype}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export const getFilterParams = (transformation) => {
  const filterType = transformation.params.filter_type || "value";
  return {
    expression: "",
    filter_column: filterType === "column" ? (transformation.params.value || "") : "",
    filter_type: filterType,
    value: filterType === "value" ? (transformation.params.value || "") : ""
  };
};

export default FilterOperationFields;
