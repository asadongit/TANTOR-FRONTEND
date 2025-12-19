import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';

function DataCleaning() {
  const [expandedSections, setExpandedSections] = useState({
    changeDataType: false,
    dropDuplicates: false,
    uniquenessRatio: false,
    missingValue: false,
  });

  const [toggles, setToggles] = useState({
    changeDataType: false,
    dropDuplicates: false,
    uniquenessRatio: false,
    missingValue: false,
  });

  const [dataTypeColumns, setDataTypeColumns] = useState([
    { columnName: '', oldDataType: '', newDataType: '' }
  ]);

  const [missingValueColumns, setMissingValueColumns] = useState([
    { columnName: '' }
  ]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      changeDataType: false,
      dropDuplicates: false,
      uniquenessRatio: false,
      missingValue: false,
      [section]: !prev[section]
    }));
  };

  const toggleSwitch = (key) => {
    setToggles(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    
    if (key === 'changeDataType' || key === 'missingValue') {
      if (!toggles[key]) {
        setExpandedSections({
          changeDataType: false,
          dropDuplicates: false,
          uniquenessRatio: false,
          missingValue: false,
          [key]: true
        });
      } else {
        setExpandedSections(prev => ({
          ...prev,
          [key]: false
        }));
      }
    }
  };

  const addColumn = () => {
    setDataTypeColumns([...dataTypeColumns, { columnName: '', oldDataType: '', newDataType: '' }]);
  };

  const removeDataTypeColumn = (index) => {
    if (dataTypeColumns.length > 1) {
      setDataTypeColumns(dataTypeColumns.filter((_, i) => i !== index));
    }
  };

  const addMissingValueColumn = () => {
    setMissingValueColumns([...missingValueColumns, { columnName: '' }]);
  };

  const removeMissingValueColumn = (index) => {
    if (missingValueColumns.length > 1) {
      setMissingValueColumns(missingValueColumns.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-4">

      <div className="bg-gray-50 rounded-lg border border-gray-200">
        <div className="p-4 flex items-center justify-between">
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900">Change Data Type</h4>
            <p className="text-xs text-gray-500 mt-1">Modify column data types for accurate analysis.</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={toggles.changeDataType}
                onChange={() => toggleSwitch('changeDataType')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8e78b7]"></div>
            </label>
            <button
              onClick={() => toggleSection('changeDataType')}
              className="text-gray-400 hover:text-gray-600"
            >
              {expandedSections.changeDataType ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>
        </div>

        {expandedSections.changeDataType && (
          <div className="px-4 pb-4 border-t border-gray-100">
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3">
                <label className="text-xs font-medium text-gray-600">Column Name</label>
                <label className="text-xs font-medium text-gray-600">Old Data Type</label>
                <label className="text-xs font-medium text-gray-600">New Data Type</label>
                <div className="w-8"></div>
              </div>

              {dataTypeColumns.map((column, index) => (
                <div key={index} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-center">
                  <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700">
                    <option>Select</option>
                  </select>
                  <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700">
                    <option>Select</option>
                  </select>
                  <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700">
                    <option>Select</option>
                  </select>
                  {dataTypeColumns.length > 1 && (
                    <button
                      onClick={() => removeDataTypeColumn(index)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      title="Remove column"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}

              <button
                onClick={addColumn}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-[#8e78b7] hover:text-[#8e78b7] transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Add Column
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-gray-50 rounded-lg border border-gray-200">
        <div className="p-4 flex items-center justify-between">
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900">Drop Duplicate Rows</h4>
            <p className="text-xs text-gray-500 mt-1">Remove duplicated entries from your dataset.</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={toggles.dropDuplicates}
                onChange={() => toggleSwitch('dropDuplicates')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8e78b7]"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg border border-gray-200">
        <div className="p-4 flex items-center justify-between">
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900">Uniqueness Ratio</h4>
            <p className="text-xs text-gray-500 mt-1">Set threshold limits to evaluate column uniqueness.</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={toggles.uniquenessRatio}
                onChange={() => toggleSwitch('uniquenessRatio')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8e78b7]"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg border border-gray-200">
        <div className="p-4 flex items-center justify-between">
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900">Missing Value Indicator</h4>
            <p className="text-xs text-gray-500 mt-1">Create indicator columns for missing values.</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={toggles.missingValue}
                onChange={() => toggleSwitch('missingValue')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8e78b7]"></div>
            </label>
            <button
              onClick={() => toggleSection('missingValue')}
              className="text-gray-400 hover:text-gray-600"
            >
              {expandedSections.missingValue ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>
        </div>

        {expandedSections.missingValue && (
          <div className="px-4 pb-4 border-t border-gray-100">
            <div className="mt-4 space-y-3">
              <label className="text-xs font-medium text-gray-600">Column Name</label>

              {missingValueColumns.map((column, index) => (
                <div key={index} className="flex items-center gap-3">
                  <select className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent">
                    <option>Select column</option>
                  </select>
                  {missingValueColumns.length > 1 && (
                    <button
                      onClick={() => removeMissingValueColumn(index)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      title="Remove column"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}

              <button
                onClick={addMissingValueColumn}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-400 hover:border-[#8e78b7] hover:text-[#8e78b7] transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Add Column
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DataCleaning;