import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { useAIPlayground } from '../../../../../../context/AIPlaygroundContext';
import { toast } from 'react-hot-toast';

function DataCleaning({ readonly = false, onValidationChange, onApiCall }) {
  const hostnameAI = window._env_?.VITE_AI_API;
  const { workflowState, datasetState, updatePreprocessingStep } = useAIPlayground();

  const columnsDataTypes = workflowState?.modelGenesis?.apiResponse?.columns_data_types?.manual || {};
  const columnNames = Object.keys(columnsDataTypes);

  const [expandedSections, setExpandedSections] = useState({
    changeDataType: true,
    dropColumns: false,
    dropDuplicates: false,
    uniquenessRatio: false,
    missingValue: false,
  });

  const [toggles, setToggles] = useState({
    changeDataType: false,
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


  useEffect(() => {
    const isValid = validateStep();
    if (onValidationChange) {
      onValidationChange(isValid);
    }
  }, [toggles, dataTypeColumns, dropColumnsData, missingValueColumns]);

  const validateStep = () => {
    // If change data type is enabled, ensure all selected rows have both column and new data type
    if (toggles.changeDataType) {
      const hasInvalidDataType = dataTypeColumns.some(col =>
        (col.columnName && !col.newDataType) || (!col.columnName && col.newDataType)
      );
      if (hasInvalidDataType) return false;
    }

    // If drop columns is enabled, ensure all rows have a column selected
    if (toggles.dropColumns) {
      const hasEmptyDropColumn = dropColumnsData.some(col => !col.columnName);
      if (hasEmptyDropColumn) return false;
    }

    // If missing value is enabled, ensure all rows have a column selected
    if (toggles.missingValue) {
      const hasEmptyMissingValue = missingValueColumns.some(col => !col.columnName);
      if (hasEmptyMissingValue) return false;
    }

    return true;
  };

  const buildApiPayload = () => {
    const payload = {
      session_id: datasetState.sessionId,
      modify_data_types: toggles.changeDataType,
      modify_data_types_map: {},
      drop_columns_active: toggles.dropColumns,
      drop_columns: [],
      drop_duplicates_rows: toggles.dropDuplicates,
      missing_value_indicator: toggles.missingValue,
      missing_value_indicator_cols: [],
      uniqueness_lower_threshold: 0.02,
      uniqueness_upper_threshold: 0.98
    };

    if (toggles.changeDataType) {
      dataTypeColumns.forEach(col => {
        if (col.columnName && col.newDataType) {
          payload.modify_data_types_map[col.columnName] = col.newDataType;
        }
      });
    }

    if (toggles.dropColumns) {
      payload.drop_columns = dropColumnsData
        .filter(col => col.columnName)
        .map(col => col.columnName);
    }

    if (toggles.missingValue) {
      payload.missing_value_indicator_cols = missingValueColumns
        .filter(col => col.columnName)
        .map(col => col.columnName);
    }

    return payload;
  };

  const callInitialCleanApi = async () => {
    if (readonly) return true;

    try {
      const payload = buildApiPayload();

      const response = await fetch(`${hostnameAI}/data/preprocess/initial_clean`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API error: ${response.status}`);
      }

      const data = await response.json();


      updatePreprocessingStep('step1', {
        config: {
          toggles,
          dataTypeColumns,
          dropColumnsData,
          missingValueColumns
        },
        apiResponse: data
      });

      toast.success('Data preprocessing completed successfully!', {
        duration: 3000,
        position: 'top-right',
      });

      console.log('Initial clean API response:', data);
      return true;
    } catch (error) {
      console.error('Error calling initial_clean API:', error);

      toast.error(error.message || 'Failed to process data. Please try again.', {
        duration: 4000,
        position: 'top-right',
      });

      return false;
    }
  };

  useEffect(() => {
    if (onApiCall) {
      onApiCall(callInitialCleanApi);
    }
  }, [toggles, dataTypeColumns, dropColumnsData, missingValueColumns, uniquenessThresholds, datasetState.sessionId]);

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

  const getAvailableColumns = (currentIndex, selectedColumns) => {
    const selected = selectedColumns
      .map((col, idx) => idx !== currentIndex ? col.columnName : null)
      .filter(Boolean);
    return columnNames.filter(name => !selected.includes(name));
  };

  const canAddNewRow = (columns, requireNewDataType = false) => {
    if (columns.length === 0) return true;
    const lastRow = columns[columns.length - 1];
    if (requireNewDataType) {
      return lastRow.columnName && lastRow.newDataType;
    }
    return lastRow.columnName !== '';
  };

  const handleColumnChange = (index, columnName) => {
    if (readonly) return;
    const oldDataType = columnsDataTypes[columnName] || '';
    const newColumns = [...dataTypeColumns];
    newColumns[index] = {
      columnName,
      oldDataType,
      newDataType: newColumns[index].newDataType
    };
    setDataTypeColumns(newColumns);
  };

  const handleNewDataTypeChange = (index, newDataType) => {
    if (readonly) return;
    const newColumns = [...dataTypeColumns];
    newColumns[index].newDataType = newDataType;
    setDataTypeColumns(newColumns);
  };

  const addColumn = () => {
    if (readonly || !canAddNewRow(dataTypeColumns, true)) return;
    setDataTypeColumns([...dataTypeColumns, { columnName: '', oldDataType: '', newDataType: '' }]);
  };

  const removeDataTypeColumn = (index) => {
    if (readonly) return;
    if (dataTypeColumns.length > 1) {
      setDataTypeColumns(dataTypeColumns.filter((_, i) => i !== index));
    }
  };

  const handleDropColumnChange = (index, columnName) => {
    if (readonly) return;
    const newColumns = [...dropColumnsData];
    newColumns[index] = { columnName };
    setDropColumnsData(newColumns);
  };

  const addDropColumn = () => {
    if (readonly || !canAddNewRow(dropColumnsData)) return;
    setDropColumnsData([...dropColumnsData, { columnName: '' }]);
  };

  const removeDropColumn = (index) => {
    if (readonly) return;
    if (dropColumnsData.length > 1) {
      setDropColumnsData(dropColumnsData.filter((_, i) => i !== index));
    }
  };

  const handleMissingValueColumnChange = (index, columnName) => {
    if (readonly) return;
    const newColumns = [...missingValueColumns];
    newColumns[index] = { columnName };
    setMissingValueColumns(newColumns);
  };

  const addMissingValueColumn = () => {
    if (readonly || !canAddNewRow(missingValueColumns)) return;
    setMissingValueColumns([...missingValueColumns, { columnName: '' }]);
  };

  const removeMissingValueColumn = (index) => {
    if (readonly) return;
    if (missingValueColumns.length > 1) {
      setMissingValueColumns(missingValueColumns.filter((_, i) => i !== index));
    }
  };

  const dataTypeOptions = ['datetime', 'numeric', 'boolean', 'category', 'string'];

  return (
    <div className="space-y-4 p-6 max-w-5xl mx-auto">
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
                    value={column.columnName}
                    onChange={(e) => handleColumnChange(index, e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent"
                  >
                    <option value="">Select column</option>
                    {getAvailableColumns(index, dataTypeColumns).map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                  <div className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-gray-50">
                    {column.oldDataType || '-'}
                  </div>
                  <select
                    disabled={readonly}
                    value={column.newDataType}
                    onChange={(e) => handleNewDataTypeChange(index, e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent"
                  >
                    <option value="">Select type</option>
                    {dataTypeOptions.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
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
                disabled={readonly || !canAddNewRow(dataTypeColumns, true)}
                className={`w-full py-3 border-2 border-dashed rounded-lg text-sm flex items-center justify-center gap-2 transition-colors ${readonly || !canAddNewRow(dataTypeColumns, true)
                    ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                    : 'border-gray-300 text-gray-500 hover:border-[#8e78b7] hover:text-[#8e78b7]'
                  }`}
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
                    value={column.columnName}
                    onChange={(e) => handleDropColumnChange(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent"
                  >
                    <option value="">Select column</option>
                    {getAvailableColumns(index, dropColumnsData).map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
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
                disabled={readonly || !canAddNewRow(dropColumnsData)}
                className={`w-full py-3 border-2 border-dashed rounded-lg text-sm flex items-center justify-center gap-2 transition-colors ${readonly || !canAddNewRow(dropColumnsData)
                    ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                    : 'border-gray-300 text-gray-400 hover:border-[#8e78b7] hover:text-[#8e78b7]'
                  }`}
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
                    value={column.columnName}
                    onChange={(e) => handleMissingValueColumnChange(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent"
                  >
                    <option value="">Select column</option>
                    {getAvailableColumns(index, missingValueColumns).map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
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
                disabled={readonly || !canAddNewRow(missingValueColumns)}
                className={`w-full py-3 border-2 border-dashed rounded-lg text-sm flex items-center justify-center gap-2 transition-colors ${readonly || !canAddNewRow(missingValueColumns)
                    ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                    : 'border-gray-300 text-gray-400 hover:border-[#8e78b7] hover:text-[#8e78b7]'
                  }`}
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