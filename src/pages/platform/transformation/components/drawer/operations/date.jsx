import React, { useState, useEffect, useMemo, useRef } from "react";
import Select, { components } from "react-select";
import { ChevronDown, Info, Search } from "lucide-react";
import { getAllTimezones, getAllDateFormats, getFormatExample, TIMEZONES } from "./timeZoneFormatMapping";
import { isStringType, isNumericType, DataTypeGroups } from "../../../components/nodes/DataTypeMapping";

const TimezoneCategorySelect = ({ value, onChange, label }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);

  const filteredTimezones = searchTerm ?
    Object.entries(TIMEZONES).reduce((acc, [region, zones]) => {
      const filtered = zones.filter(zone =>
        zone.toLowerCase().includes(searchTerm.toLowerCase()));
      if (filtered.length > 0) {
        acc[region] = filtered;
      }
      return acc;
    }, {}) :
    TIMEZONES;

  return (
    <div className="mb-3 relative">
      <div className="flex items-center mb-1">
        <label className="block text-xs text-gray-700">{label}</label>
        <button
          type="button"
          className="ml-1 text-gray-400 hover:text-gray-600"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          {/* <Info className="w-3.5 h-3.5" /> */}
        </button>
        {showTooltip && (
          <div className="absolute z-10 mt-8 p-2 bg-gray-800 text-white text-xs rounded shadow-lg max-w-xs">
            The timezone that represents the date/time values in the selected column
          </div>
        )}
      </div>
      <div className="relative">
        <input
          type="text"
          className="w-full p-2 text-sm bg-white border border-gray-300 rounded text-gray-800 focus:ring-1 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
          value={value || ""}
          placeholder="Select or search timezone"
          onChange={(e) => {}}
          onClick={() => setShowSearchResults(true)}
          readOnly
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-2">
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </div>
      </div>
      {showSearchResults && (
        <div className="absolute z-20 text-black mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          <div className="sticky top-0 bg-white p-2 border-b border-gray-200">
            <div className="relative">
              <input
                autoFocus
                type="text"
                className="w-full p-2 pl-8 text-sm bg-white border border-gray-300 rounded"
                placeholder="Search timezones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>
          <div className="py-1">
            {Object.entries(filteredTimezones).map(([region, zones]) => (
              <div key={region}>
                <div className="px-3 py-1 bg-gray-100 text-xs font-medium text-gray-700">{region}</div>
                {zones.slice(0, 20).map(zone => (
                  <div
                    key={zone}
                    className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      onChange(zone);
                      setShowSearchResults(false);
                      setSearchTerm("");
                    }}
                  >
                    {zone}
                  </div>
                ))}
                {zones.length > 20 && (
                  <div className="px-3 py-1 text-xs text-gray-500 italic">
                    {zones.length - 20} more... (refine your search)
                  </div>
                )}
              </div>
            ))}
            {Object.keys(filteredTimezones).length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500">No matching timezones found</div>
            )}
          </div>
        </div>
      )}
      {showSearchResults && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowSearchResults(false)}
        />
      )}
    </div>
  );
};

const DateFormatSelect = ({ value, onChange, label }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const formats = getAllDateFormats();

  return (
    <div className="mb-3 relative">
      <div className="flex items-center mb-1">
        <label className="block text-xs text-gray-700">{label}</label>
        <button
          type="button"
          className="ml-1 text-gray-400 hover:text-gray-600"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          {/* <Info className="w-3.5 h-3.5" /> */}
        </button>
        {showTooltip && (
          <div className="absolute z-10 mt-8 p-2 bg-gray-800 text-white text-xs rounded shadow-lg max-w-xs">
            The format of the date/time values in the selected column
          </div>
        )}
      </div>
      <div className="relative">
        <input
          type="text"
          className="w-full p-2 text-sm bg-white border border-gray-300 rounded text-gray-800 focus:ring-1 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
          value={value || ""}
          placeholder="Select date format"
          onClick={() => setShowDropdown(true)}
          readOnly
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-2">
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </div>
      </div>
      {showDropdown && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {formats.map((format, idx) => (
            <div
              key={format}
              className="flex flex-col px-3 py-2 hover:bg-gray-100 border-b border-gray-100 cursor-pointer"
              onClick={() => {
                onChange(format);
                setShowDropdown(false);
              }}
            >
              <div className="text-sm">{format}</div>
              <div className="text-xs text-gray-500">{getFormatExample(format)}</div>
            </div>
          ))}
        </div>
      )}
      {value && (
        <div className="mt-1 text-xs text-gray-500">
          Example: {getFormatExample(value)}
        </div>
      )}

      {showDropdown && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

export const DateParameters = ({ params, onChange }) => {
  return (
    <div className="mt-4 space-y-2">
      <div className="grid grid-cols-2 gap-4">
        <TimezoneCategorySelect
          label="Source Timezone"
          value={params.source_timezone}
          onChange={(value) => onChange("source_timezone", value)}
        />
        <DateFormatSelect
          label="Source Format"
          value={params.source_timeformat}
          onChange={(value) => onChange("source_timeformat", value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <TimezoneCategorySelect
          label="Target Timezone"
          value={params.target_timezone}
          onChange={(value) => onChange("target_timezone", value)}
        />
        <DateFormatSelect
          label="Target Format"
          value={params.target_timeformat}
          onChange={(value) => onChange("target_timeformat", value)}
        />
      </div>
    </div>
  );
};

export const DateOperationFields = ({
  transformation,
  sourceCols,
  targetCols,
  openDropdowns,
  toggleDropdown,
  handleSelectAllColumns,
  handleColumnSelection,
  dropdownRefs,
  updateDateParam,
  onAddNewTargetColumn,
  updateTransformation
}) => {

  const [isAddingNewColumn, setIsAddingNewColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const inputRef = useRef(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalInput, setModalInput] = useState("");
  const modalInputRef = useRef(null);

  const isDateType = (col) => {
    if (typeof col === "object" && col.datatype) {
      const t = col.datatype.toLowerCase();
      return DataTypeGroups.date.some(dt => t.includes(dt));
    }
    return false;
  };

  const dateSourceCols = Array.isArray(sourceCols)
    ? sourceCols.filter(isDateType)
    : [];

  const dateTargetCols = Array.isArray(targetCols)
    ? targetCols.filter(isDateType)
    : [];

  const allColumns = [
    ...dateSourceCols.map((col) => ({
      value: typeof col === "object" ? col.name : col,
      label: typeof col === "object" ? col.name : col,
    })),
    ...(transformation.target_column && transformation.target_column.length > 0
      ? transformation.target_column
          .filter(
            (col) =>
              !dateSourceCols.some(
                (src) =>
                  (typeof src === "object" ? src.name : src) === col
              )
          )
          .map((col) => ({
            value: col,
            label: col,
          }))
      : []),
  ];

  const selectedTargetOption =
    transformation.target_column && transformation.target_column.length > 0
      ? {
          value: transformation.target_column[0],
          label: transformation.target_column[0],
        }
      : null;

  const selectedSourceOption =
    transformation.source_column && transformation.source_column.length > 0
      ? dateSourceCols
          .map((col) => (typeof col === "object" ? col.name : col))
          .includes(transformation.source_column[0])
        ? {
            value: transformation.source_column[0],
            label: transformation.source_column[0],
          }
        : null
      : null;

  const customStyles = {
    control: (provided) => ({
      ...provided,
      minHeight: "38px",
      border: "1px solid #e2e8f0",
      fontSize: "0.875rem",
      backgroundColor: "white",
      boxShadow: "none",
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

      if (
        onAddNewTargetColumn &&
        typeof onAddNewTargetColumn === "function" &&
        !dateSourceCols.some(col => (typeof col === "object" ? col.name : col) === selected.value) &&
        !dateTargetCols.some(col => (typeof col === "object" ? col.name : col) === selected.value)
      ) {
        onAddNewTargetColumn(selected.value, transformation.source_dataframe, "date", "date");
      }
    }
  };

  const handleModalOk = () => {
    const name = modalInput.trim();
    if (name) {
      setShowAddModal(false);

      // Simply update the target column with the new name
      if (typeof transformation.updateTargetColumns === "function") {
        transformation.updateTargetColumns(transformation.id, [name]);
      }

      // Call onAddNewTargetColumn to add the new column to the dataframe
      if (onAddNewTargetColumn && typeof onAddNewTargetColumn === "function") {
        onAddNewTargetColumn(name, transformation.source_dataframe, "date", "date");
      }
    }
  };

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
        <div className="mb-3 text-base font-medium text-gray-700">Add New Target Column</div>
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

  const handleSourceChange = (selected) => {
    const selectedColumn = selected ? [selected.value] : [];
    handleSelectAllColumns(transformation.id, "source", selectedColumn, true);
  };

  const handleParamChange = (paramName, value) => {
    updateDateParam(transformation.id, paramName, value);
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 items-center">
        <div>
          <label className="text-xs text-gray-600 block mb-1">Source Column</label>
          <Select
            isMulti={false}
            options={allColumns}
            value={selectedSourceOption}
            onChange={handleSourceChange}
            placeholder="Select date column"
            className="text-sm"
            styles={customStyles}
            noOptionsMessage={() => "No date columns available"}
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
        <div>
          <label className="text-xs text-gray-600 block mb-1">Target Column</label>
          <Select
            isMulti={false}
            options={allColumns}
            value={selectedTargetOption}
            onChange={handleTargetChange}
            placeholder="Select target column"
            className="text-sm"
            styles={customStyles}
            noOptionsMessage={() => "No date columns available"}
            isClearable
            components={{ MenuList: CustomMenuList }}
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
          {showAddModal && AddColumnModal}
        </div>
      </div>

      {transformation.source_column.length > 0 && transformation.target_column.length > 0 &&
       transformation.source_column.length !== transformation.target_column.length && (
        <div className="mt-3 p-2 bg-amber-50 border border-amber-100 rounded-md">
          <p className="text-amber-600 text-xs">
            Warning: Number of source columns ({transformation.source_column.length}) does not match
            number of target columns ({transformation.target_column.length}).
            Date conversions will be applied in order.
          </p>
        </div>
      )}

      <DateParameters
        params={transformation.params || {}}
        onChange={handleParamChange}
      />
    </div>
  );
};

export const getDateParams = (transformation) => {
  return {
    source_timezone: transformation.params.source_timezone || "",
    source_timeformat: transformation.params.source_timeformat || "",
    target_timezone: transformation.params.target_timezone || "",
    target_timeformat: transformation.params.target_timeformat || ""
  };
};

export default DateOperationFields;