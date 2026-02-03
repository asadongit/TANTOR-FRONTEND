import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Plus, AlertCircle, Info, Search, X } from 'lucide-react';
import { useAIPlayground } from '../../../../../../context/AIPlaygroundContext';
import { toast } from 'react-hot-toast';
import InfoButton from '../../../components/InfoButton';

const SearchableDropdown = ({
  selectedColumn,
  onSelect,
  availableOptions,
  placeholder = "Select column",
  readonly,
  dropDirection = "down"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  const filteredOptions = availableOptions.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (option) => {
    if (!readonly) {
      onSelect(option);
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  return (
    <div className="relative flex-1" ref={dropdownRef}>
      <button
        type="button"
        disabled={readonly}
        onClick={() => !readonly && setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-left focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent bg-white flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className={selectedColumn ? "text-gray-700" : "text-gray-500"}>
          {selectedColumn || placeholder}
        </span>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && !readonly && (
        <div className={`absolute z-50 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden ${dropDirection === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'
          }`}>
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent"
              />
            </div>
          </div>

          <div className="overflow-y-auto max-h-48">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 transition-colors text-gray-700"
                >
                  {option}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500 text-center">
                No results found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const SelectedColumnsList = ({ columns, onRemove, readonly }) => {

  if (columns.length === 0) return null;

  const displayedColumns = columns;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {displayedColumns.map(column => (
          <span
            key={column}
            className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-gray-300 text-gray-700 text-sm rounded-md"
          >
            {column}
            {!readonly && (
              <button
                type="button"
                onClick={() => onRemove(column)}
                className="ml-1 text-gray-500 hover:text-gray-700"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </span>
        ))}
      </div>

    </div>
  );
};

function DataCleaning({ onValidationChange, onApiCall }) {
  const hostnameAI = window._env_?.VITE_AI_API;
  const { workflowState, datasetState, updatePreprocessingStep, mode } = useAIPlayground();
  const readonly = mode === 'view';

  const columnsDataTypes = workflowState?.modelGenesis?.apiResponse?.columns_data_types?.manual || {};
  const columnNames = Object.keys(columnsDataTypes);

  const savedStep1 = workflowState?.dataPreprocessing?.step1;
  const savedConfig = savedStep1?.config || {};

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

  const sectionDescriptions = {
    changeDataType: "Change Data Type refers to converting a feature to its appropriate data format (e.g., string to numeric, date to datetime). Correct data types ensure accurate calculations, proper validation, and correct model behavior.",
    dropDuplicates: "Drop Duplicate Rows removes repeated records that appear more than once in the dataset. It prevents data bias and ensures each observation is counted only once.",
    uniquenessRatio: "Uniqueness Ratio measures the proportion of unique values in a feature relative to total records. It helps identify identifier-like columns or features with very low variability.",
    missingValue: "Missing Value Indicator creates a binary flag to indicate whether a value was originally missing. It helps models learn patterns related to data missingness."
  };

  const [dataTypeColumns, setDataTypeColumns] = useState([
    { columnName: '', oldDataType: '', newDataType: '' }
  ]);

  const [missingValueColumns, setMissingValueColumns] = useState([
    { columnName: '' }
  ]);


  const [validationErrors, setValidationErrors] = useState({
    changeDataType: '',
    missingValue: ''
  });

  useEffect(() => {
    if (!savedStep1) return;
    const stepConfig = savedStep1.config;

    if ((mode === 'view' || mode === 'edit') && stepConfig) {
      const reconstructedToggles = {
        changeDataType: stepConfig.modify_data_types || false,
        dropDuplicates: stepConfig.drop_duplicates_rows || false,
        uniquenessRatio: stepConfig.uniqueness_filter_active || false,
        missingValue: stepConfig.missing_value_indicator || false,
      };

      setToggles(reconstructedToggles);

      if (stepConfig.modify_data_types_map && Object.keys(stepConfig.modify_data_types_map).length > 0) {
        const reconstructedDataTypes = Object.entries(stepConfig.modify_data_types_map).map(([columnName, newDataType]) => ({
          columnName,
          oldDataType: columnsDataTypes[columnName] || '',
          newDataType
        }));
        setDataTypeColumns(reconstructedDataTypes);
      }

      if (stepConfig.missing_value_indicator_cols && stepConfig.missing_value_indicator_cols.length > 0) {
        const reconstructedMissingValue = stepConfig.missing_value_indicator_cols.map(columnName => ({ columnName }));
        setMissingValueColumns(reconstructedMissingValue);
      }

    }
  }, [savedStep1, columnsDataTypes]);

  useEffect(() => {
    const { isValid, errors } = validateStep();
    setValidationErrors(errors);
    if (onValidationChange) {
      onValidationChange(isValid);
    }
  }, [toggles, dataTypeColumns, missingValueColumns]);

  const validateStep = () => {
    const errors = {
      changeDataType: '',
      missingValue: ''
    };
    let isValid = true;

    if (toggles.changeDataType) {
      const hasAnyValidEntry = dataTypeColumns.some(col => col.columnName && col.newDataType);
      const hasInvalidDataType = dataTypeColumns.some(col =>
        (col.columnName && !col.newDataType) || (!col.columnName && col.newDataType)
      );

      if (!hasAnyValidEntry) {
        errors.changeDataType = 'Please select at least one column and its new data type';
        isValid = false;
      } else if (hasInvalidDataType) {
        errors.changeDataType = 'Please complete all selected rows with both column and new data type';
        isValid = false;
      }
    }

    if (toggles.missingValue) {
      const hasAnyColumn = missingValueColumns.some(col => col.columnName);

      if (!hasAnyColumn) {
        errors.missingValue = 'Please select at least one column for missing value indicator';
        isValid = false;
      }
    }

    return { isValid, errors };
  };

  const buildApiPayload = () => {
    const payload = {
      session_id: datasetState.sessionId,
      modify_data_types: toggles.changeDataType,
      modify_data_types_map: {},
      drop_duplicates_rows: toggles.dropDuplicates,
      missing_value_indicator: toggles.missingValue,
      missing_value_indicator_cols: [],
      uniqueness_filter_active: toggles.uniquenessRatio,
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
        config: payload,
        apiResponse: data
      });

      toast.success('Data preprocessing completed successfully!', {
        duration: 3000,
        position: 'top-right',
      });
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
  }, [toggles, dataTypeColumns, missingValueColumns, datasetState.sessionId]);

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
    if (readonly) return;
    const newToggleState = !toggles[key];

    setToggles(prev => ({
      ...prev,
      [key]: newToggleState
    }));

    if (newToggleState && (key === 'changeDataType' || key === 'missingValue')) {
      setExpandedSections({
        changeDataType: false,
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

  const getAvailableColumnsForMissingValue = (currentIndex) => {
    const selectedInMissingValue = missingValueColumns
      .map((col, idx) => idx !== currentIndex ? col.columnName : null)
      .filter(Boolean);

    return columnNames.filter(name =>
      !selectedInMissingValue.includes(name)
    );
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

  const dataTypeOptions = ['datetime', 'numeric', 'boolean', 'category', 'string'];

  return (
    <div className="space-y-4 max-w-full">
      {/* Change Data Type Section - Unchanged */}
      <div className="bg-gray-50 rounded-lg border border-gray-200">
        <div className="p-4 flex items-center justify-between">
          <div className="flex-1 flex items-center gap-2">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Change Data Type</h4>
            </div>
            <InfoButton sectionDescriptions={sectionDescriptions} section="changeDataType" />
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
                className="text-gray-400 hover:text-gray-600"
              >
                {expandedSections.changeDataType ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            )}
          </div>
        </div>

        {toggles.changeDataType && validationErrors.changeDataType && (
          <div className="px-4 pb-2">
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-800">{validationErrors.changeDataType}</p>
            </div>
          </div>
        )}

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
                  <SearchableDropdown
                    selectedColumn={column.columnName}
                    onSelect={(columnName) => handleColumnChange(index, columnName)}
                    availableOptions={getAvailableColumns(index, dataTypeColumns)}
                    placeholder="Select column"
                    readonly={readonly}
                    dropDirection="down"
                  />
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

      {/* Drop Duplicate Rows Section - Unchanged */}
      <div className="bg-gray-50 rounded-lg border border-gray-200">
        <div className="p-4 flex items-center justify-between">
          <div className="flex-1 flex items-center gap-2">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Drop Duplicate Rows</h4>
            </div>
            <InfoButton sectionDescriptions={sectionDescriptions} section="dropDuplicates" />
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

      {/* Uniqueness Ratio Section - Unchanged */}
      <div className="bg-gray-50 rounded-lg border border-gray-200">
        <div className="p-4 flex items-center justify-between">
          <div className="flex-1 flex items-center gap-2">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Uniqueness Ratio</h4>
            </div>
            <InfoButton sectionDescriptions={sectionDescriptions} section="uniquenessRatio" />
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

      {/* UPDATED Missing Value Indicator Section */}
      <div className="bg-gray-50 rounded-lg border border-gray-200">
        <div className="p-4 flex items-center justify-between">
          <div className="flex-1 flex items-center gap-2">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Missing Value Indicator</h4>
            </div>
            <InfoButton sectionDescriptions={sectionDescriptions} section="missingValue" isLastSection={true} />
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
                className="text-gray-400 hover:text-gray-600"
              >
                {expandedSections.missingValue ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            )}
          </div>
        </div>

        {toggles.missingValue && validationErrors.missingValue && (
          <div className="px-4 pb-2">
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-800">{validationErrors.missingValue}</p>
            </div>
          </div>
        )}

        {toggles.missingValue && expandedSections.missingValue && (
          <div className="px-4 pb-4 border-t border-gray-100">
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-2 block">Select Column</label>
                <SearchableDropdown
                  selectedColumn=""
                  onSelect={(columnName) => {
                    const newColumns = [...missingValueColumns.filter(col => col.columnName)];
                    newColumns.push({ columnName });
                    setMissingValueColumns(newColumns.length > 0 ? newColumns : [{ columnName: '' }]);
                  }}
                  availableOptions={getAvailableColumnsForMissingValue(-1)}
                  placeholder="Search and select column..."
                  readonly={readonly}
                  dropDirection="up"
                />
              </div>

              {missingValueColumns.filter(col => col.columnName).length > 0 && (
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-2 block">Selected Columns</label>
                  <SelectedColumnsList
                    columns={missingValueColumns.filter(col => col.columnName).map(col => col.columnName)}
                    onRemove={(columnName) => {
                      const newColumns = missingValueColumns.filter(col => col.columnName !== columnName);
                      setMissingValueColumns(newColumns.length > 0 ? newColumns : [{ columnName: '' }]);
                    }}
                    readonly={readonly}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DataCleaning;