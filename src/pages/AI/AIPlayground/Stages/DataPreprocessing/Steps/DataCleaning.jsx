import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';

function DataCleaning({ readonly = false }) {
  const [expandedSections, setExpandedSections] = useState({
    changeDataType: true,
    dropColumns: false,
    dropDuplicates: false,
    uniquenessRatio: false,
    missingValue: false,
  });

  const [toggles, setToggles] = useState({
    changeDataType: true,
    dropColumns: false,
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

  const [dropColumnsData, setDropColumnsData] = useState([
    { columnName: '' }
  ]);

  const toggleSection = (section) => {
    if (readonly) return;
    setExpandedSections(prev => ({
      changeDataType: false,
      dropColumns: false,
      dropDuplicates: false,
      uniquenessRatio: false,
      missingValue: false,
      [section]: !prev[section]
    }));
  };

  const toggleSwitch = (key) => {
    if (readonly) return;
    const newToggleState = !toggles[key];
    
    setToggles(prev => ({
      ...prev,
      [key]: newToggleState
    }));
    
    if (newToggleState && (key === 'changeDataType' || key === 'dropColumns' || key === 'missingValue')) {
      setExpandedSections({
        changeDataType: false,
        dropColumns: false,
        dropDuplicates: false,
        uniquenessRatio: false,
        missingValue: false,
        [key]: true
      });
    }
    
    if (!newToggleState) {
      setExpandedSections(prev => ({
        ...prev,
        [key]: false
      }));
    }
  };

  const addColumn = () => {
    if (readonly) return;
    setDataTypeColumns([...dataTypeColumns, { columnName: '', oldDataType: '', newDataType: '' }]);
  };

  const removeDataTypeColumn = (index) => {
    if (readonly) return;
    if (dataTypeColumns.length > 1) {
      setDataTypeColumns(dataTypeColumns.filter((_, i) => i !== index));
    }
  };

  const addMissingValueColumn = () => {
    if (readonly) return;
    setMissingValueColumns([...missingValueColumns, { columnName: '' }]);
  };

  const removeMissingValueColumn = (index) => {
    if (readonly) return;
    if (missingValueColumns.length > 1) {
      setMissingValueColumns(missingValueColumns.filter((_, i) => i !== index));
    }
  };

  const addDropColumn = () => {
    if (readonly) return;
    setDropColumnsData([...dropColumnsData, { columnName: '' }]);
  };

  const removeDropColumn = (index) => {
    if (readonly) return;
    if (dropColumnsData.length > 1) {
      setDropColumnsData(dropColumnsData.filter((_, i) => i !== index));
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
            <label className={`relative inline-flex items-center ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
              <input
                type="checkbox"
                checked={toggles.changeDataType}
                onChange={() => toggleSwitch('changeDataType')}
                disabled={readonly}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8e78b7]"></div>
            </label>
            {toggles.changeDataType && (
              <button
                onClick={() => toggleSection('changeDataType')}
                disabled={readonly}
                className="text-gray-400 hover:text-gray-600"
              >
                {expandedSections.changeDataType ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            )}
          </div>
        </div>

        {toggles.changeDataType && expandedSections.changeDataType && (
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
                  <select 
                    disabled={readonly}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700"
                  >
                    <option>Select</option>
                  </select>
                  <div className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 bg-gray-50">
                    {column.oldDataType || 'Number'}
                  </div>
                  <select 
                    disabled={readonly}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700"
                  >
                    <option>Select</option>
                  </select>
                  {dataTypeColumns.length > 1 && (
                    <button
                      onClick={() => removeDataTypeColumn(index)}
                      disabled={readonly}
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
                disabled={readonly}
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
            <h4 className="text-sm font-medium text-gray-900">Drop Columns</h4>
            <p className="text-xs text-gray-500 mt-1">Remove specific columns from your dataset.</p>
          </div>
          <div className="flex items-center gap-3">
            <label className={`relative inline-flex items-center ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
              <input
                type="checkbox"
                checked={toggles.dropColumns}
                onChange={() => toggleSwitch('dropColumns')}
                disabled={readonly}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8e78b7]"></div>
            </label>
            {toggles.dropColumns && (
              <button
                onClick={() => toggleSection('dropColumns')}
                disabled={readonly}
                className="text-gray-400 hover:text-gray-600"
              >
                {expandedSections.dropColumns ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            )}
          </div>
        </div>

        {toggles.dropColumns && expandedSections.dropColumns && (
          <div className="px-4 pb-4 border-t border-gray-100">
            <div className="mt-4 space-y-3">
              <label className="text-xs font-medium text-gray-600">Column Name</label>

              {dropColumnsData.map((column, index) => (
                <div key={index} className="flex items-center gap-3">
                  <select 
                    disabled={readonly}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent"
                  >
                    <option>Select column</option>
                  </select>
                  {dropColumnsData.length > 1 && (
                    <button
                      onClick={() => removeDropColumn(index)}
                      disabled={readonly}
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
                onClick={addDropColumn}
                disabled={readonly}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-400 hover:border-[#8e78b7] hover:text-[#8e78b7] transition-colors flex items-center justify-center gap-2"
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
            <label className={`relative inline-flex items-center ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
              <input
                type="checkbox"
                checked={toggles.dropDuplicates}
                onChange={() => toggleSwitch('dropDuplicates')}
                disabled={readonly}
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
            <label className={`relative inline-flex items-center ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
              <input
                type="checkbox"
                checked={toggles.uniquenessRatio}
                onChange={() => toggleSwitch('uniquenessRatio')}
                disabled={readonly}
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
            <label className={`relative inline-flex items-center ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
              <input
                type="checkbox"
                checked={toggles.missingValue}
                onChange={() => toggleSwitch('missingValue')}
                disabled={readonly}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8e78b7]"></div>
            </label>
            {toggles.missingValue && (
              <button
                onClick={() => toggleSection('missingValue')}
                disabled={readonly}
                className="text-gray-400 hover:text-gray-600"
              >
                {expandedSections.missingValue ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            )}
          </div>
        </div>

        {toggles.missingValue && expandedSections.missingValue && (
          <div className="px-4 pb-4 border-t border-gray-100">
            <div className="mt-4 space-y-3">
              <label className="text-xs font-medium text-gray-600">Column Name</label>

              {missingValueColumns.map((column, index) => (
                <div key={index} className="flex items-center gap-3">
                  <select 
                    disabled={readonly}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent"
                  >
                    <option>Select column</option>
                  </select>
                  {missingValueColumns.length > 1 && (
                    <button
                      onClick={() => removeMissingValueColumn(index)}
                      disabled={readonly}
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
                disabled={readonly}
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