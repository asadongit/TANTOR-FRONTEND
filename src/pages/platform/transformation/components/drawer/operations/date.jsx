import React, { useState, useEffect } from "react";
import { ChevronDown, Info, Search } from "lucide-react";
import { getAllTimezones, getAllDateFormats, getFormatExample, TIMEZONES } from "./timeZoneFormatMapping";

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
          <Info className="w-3.5 h-3.5" />
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
          <Info className="w-3.5 h-3.5" />
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

      {/* Close dropdown when clicking outside */}
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
  updateDateParam
}) => {
  const sourceDropdownKey = `${transformation.id}-source`;
  const targetDropdownKey = `${transformation.id}-target`;
  const isSourceDropdownOpen = openDropdowns[sourceDropdownKey] || false;
  const isTargetDropdownOpen = openDropdowns[targetDropdownKey] || false;

  const handleParamChange = (paramName, value) => {
    updateDateParam(transformation.id, paramName, value);
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 items-center">
        <div className="relative" ref={el => dropdownRefs.current[sourceDropdownKey] = el}>
          <label className="text-xs text-gray-600 block mb-1">Source Columns</label>
          <button
            className="w-full p-2 text-black text-sm border border-gray-300 rounded bg-white flex justify-between items-center"
            onClick={() => toggleDropdown(transformation.id, 'source')}
          >
            {transformation.source_column.length === 0 ? (
              <span className="text-gray-400">Select date columns</span>
            ) : (
              <span className="truncate">
                {transformation.source_column.length} column(s) selected
              </span>
            )}
            <ChevronDown className={`w-4 h-4 transition-transform ${isSourceDropdownOpen ? 'transform rotate-180' : ''}`} />
          </button>

          {isSourceDropdownOpen && (
            <div className="absolute z-10 mt-1 w-full text-black bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              <div className="p-2 border-b border-gray-200">
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={transformation.source_column.length === sourceCols.length && sourceCols.length > 0}
                    onChange={(e) => handleSelectAllColumns(transformation.id, 'source', sourceCols, e.target.checked)}
                  />
                  Select All
                </label>
              </div>
              <div className="py-1">
                {sourceCols.map((column, idx) => (
                  <label key={idx} className="flex items-center px-3 py-2 hover:bg-gray-100">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={transformation.source_column.includes(column)}
                      onChange={(e) => handleColumnSelection(transformation.id, 'source', column, e.target.checked)}
                    />
                    <span className="text-sm">{column}</span>
                  </label>
                ))}
                {sourceCols.length === 0 && (
                  <div className="px-3 py-2 text-gray-500 text-sm">No columns available</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-center">
          <div className="w-auto h-10 px-3 flex items-center justify-center rounded-full bg-purple-100 border border-purple-200 text-sm font-medium text-[#8E77BB]">
            Convert Date
          </div>
        </div>

        <div className="relative" ref={el => dropdownRefs.current[targetDropdownKey] = el}>
          <label className="text-xs text-gray-600 block mb-1">Target Columns</label>
          <button
            className="w-full p-2 text-black text-sm border border-gray-300 rounded bg-white flex justify-between items-center"
            onClick={() => toggleDropdown(transformation.id, 'target')}
          >
            {transformation.target_column.length === 0 ? (
              <span className="text-gray-400">Select columns</span>
            ) : (
              <span className="truncate">
                {transformation.target_column.length} column(s) selected
              </span>
            )}
            <ChevronDown className={`w-4 h-4 transition-transform ${isTargetDropdownOpen ? 'transform rotate-180' : ''}`} />
          </button>

          {isTargetDropdownOpen && (
            <div className="absolute text-black z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              <div className="p-2 border-b border-gray-200">
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={transformation.target_column.length === targetCols.length && targetCols.length > 0}
                    onChange={(e) => handleSelectAllColumns(transformation.id, 'target', targetCols, e.target.checked)}
                  />
                  Select All
                </label>
              </div>
              <div className="py-1">
                {targetCols.map((column, idx) => (
                  <label key={idx} className="flex items-center px-3 py-2 hover:bg-gray-100">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={transformation.target_column.includes(column)}
                      onChange={(e) => handleColumnSelection(transformation.id, 'target', column, e.target.checked)}
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

      <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
        <p className="text-xs text-blue-800">
          This operation will convert dates/times from the source format and timezone
          to the target format and timezone.
        </p>
      </div>
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
