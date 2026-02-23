import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Plus, Search, X } from 'lucide-react';
import { useAIPlayground } from '../../../../../../context/AIPlaygroundContext';
import { toast } from 'react-hot-toast';
import InfoButton from '../../../components/InfoButton';

const SearchableDropdown = ({
  selectedColumn,
  onSelect,
  availableOptions,
  placeholder = "Select column",
  readonly,
  dropDirection = "down",
  hasError = false
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
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        disabled={readonly}
        onClick={() => !readonly && setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 border rounded-lg text-sm text-left focus:outline-none focus:ring-2 focus:border-transparent bg-white flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
          hasError
            ? 'border-red-400 focus:ring-red-300'
            : 'border-gray-300 focus:ring-[#8e78b7]'
        }`}
      >
        <span className={selectedColumn ? "text-gray-700" : "text-gray-500"}>
          {selectedColumn || placeholder}
        </span>
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && !readonly && (
        <div className={`absolute z-50 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden ${
          dropDirection === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'
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
              <div className="px-3 py-2 text-sm text-gray-500 text-center">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const SelectedColumnsList = ({ columns, onRemove, readonly }) => {
  if (columns.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {columns.map(column => (
        <span
          key={column}
          className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-gray-300 text-gray-700 text-sm rounded-md"
        >
          {column}
          {!readonly && (
            <button type="button" onClick={() => onRemove(column)} className="ml-1 text-gray-500 hover:text-gray-700">
              <X className="w-3 h-3" />
            </button>
          )}
        </span>
      ))}
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

  // Only show errors after Next is clicked
  const [showFieldErrors, setShowFieldErrors] = useState(false);

  useEffect(() => {
    if (!savedStep1) return;
    const stepConfig = savedStep1.config;
    if ((mode === 'view' || mode === 'edit') && stepConfig) {
      setToggles({
        changeDataType: stepConfig.modify_data_types || false,
        dropDuplicates: stepConfig.drop_duplicates_rows || false,
        uniquenessRatio: stepConfig.uniqueness_filter_active || false,
        missingValue: stepConfig.missing_value_indicator || false,
      });
      if (stepConfig.modify_data_types_map && Object.keys(stepConfig.modify_data_types_map).length > 0) {
        setDataTypeColumns(
          Object.entries(stepConfig.modify_data_types_map).map(([columnName, newDataType]) => ({
            columnName,
            oldDataType: columnsDataTypes[columnName] || '',
            newDataType
          }))
        );
      }
      if (stepConfig.missing_value_indicator_cols?.length > 0) {
        setMissingValueColumns(
          stepConfig.missing_value_indicator_cols.map(columnName => ({ columnName }))
        );
      }
    }
  }, [savedStep1, columnsDataTypes]);

  // Always report valid — Next button is never disabled by this step
  useEffect(() => {
    if (onValidationChange) onValidationChange(true);
  }, []);

  // Auto-clear errors once user has fixed everything
  useEffect(() => {
    if (!showFieldErrors) return;
    const changeDataTypeHasError =
      toggles.changeDataType && (
        !dataTypeColumns.some(col => col.columnName && col.newDataType) ||
        dataTypeColumns.some(col => (col.columnName && !col.newDataType) || (!col.columnName && col.newDataType))
      );
    const missingValueHasError =
      toggles.missingValue && !missingValueColumns.some(col => col.columnName);

    if (!changeDataTypeHasError && !missingValueHasError) {
      setShowFieldErrors(false);
    }
  }, [dataTypeColumns, missingValueColumns, toggles]);

  const validateStep = () => {
    if (toggles.changeDataType) {
      const hasAnyValidEntry = dataTypeColumns.some(col => col.columnName && col.newDataType);
      const hasIncomplete = dataTypeColumns.some(col =>
        (col.columnName && !col.newDataType) || (!col.columnName && col.newDataType)
      );
      if (!hasAnyValidEntry || hasIncomplete) return false;
    }
    if (toggles.missingValue) {
      if (!missingValueColumns.some(col => col.columnName)) return false;
    }
    return true;
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

    const isValid = validateStep();
    if (!isValid) {
      setShowFieldErrors(true);
      return false;
    }

    try {
      const payload = buildApiPayload();
      const response = await fetch(`${hostnameAI}/data/preprocess/initial_clean`, {
        method: 'POST',
        headers: { 'accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API error: ${response.status}`);
      }
      const data = await response.json();
      updatePreprocessingStep('step1', { config: payload, apiResponse: data });
      toast.success('Data preprocessing completed successfully!', { duration: 3000, position: 'top-right' });
      return true;
    } catch (error) {
      console.error('Error calling initial_clean API:', error);
      toast.error(error.message || 'Failed to process data. Please try again.', { duration: 4000, position: 'top-right' });
      return false;
    }
  };

  useEffect(() => {
    if (onApiCall) onApiCall(callInitialCleanApi);
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
    const newState = !toggles[key];
    setToggles(prev => ({ ...prev, [key]: newState }));
    if (!newState) {
      setExpandedSections(prev => ({ ...prev, [key]: false }));
      setShowFieldErrors(false);
    }
    if (newState && (key === 'changeDataType' || key === 'missingValue')) {
      setExpandedSections({
        changeDataType: false,
        dropDuplicates: false,
        uniquenessRatio: false,
        missingValue: false,
        [key]: true
      });
    }
  };

  const getAvailableColumns = (currentIndex) => {
    const selected = dataTypeColumns
      .map((col, idx) => idx !== currentIndex ? col.columnName : null)
      .filter(Boolean);
    return columnNames.filter(name => !selected.includes(name));
  };

  const getAvailableColumnsForMissingValue = () => {
    const selected = missingValueColumns.map(col => col.columnName).filter(Boolean);
    return columnNames.filter(name => !selected.includes(name));
  };

  const canAddNewRow = () => {
    if (dataTypeColumns.length === 0) return true;
    const last = dataTypeColumns[dataTypeColumns.length - 1];
    return !!(last.columnName && last.newDataType);
  };

  const handleColumnChange = (index, columnName) => {
    if (readonly) return;
    const newColumns = [...dataTypeColumns];
    newColumns[index] = { columnName, oldDataType: columnsDataTypes[columnName] || '', newDataType: newColumns[index].newDataType };
    setDataTypeColumns(newColumns);
  };

  const handleNewDataTypeChange = (index, newDataType) => {
    if (readonly) return;
    const newColumns = [...dataTypeColumns];
    newColumns[index].newDataType = newDataType;
    setDataTypeColumns(newColumns);
  };

  const addColumn = () => {
    if (readonly || !canAddNewRow()) return;
    setDataTypeColumns([...dataTypeColumns, { columnName: '', oldDataType: '', newDataType: '' }]);
  };

  const removeDataTypeColumn = (index) => {
    if (readonly || dataTypeColumns.length <= 1) return;
    setDataTypeColumns(dataTypeColumns.filter((_, i) => i !== index));
  };

  const dataTypeOptions = ['datetime', 'numeric', 'boolean', 'category', 'string'];

  // Derived section-level error flags
  const changeDataTypeSectionError = showFieldErrors && toggles.changeDataType && (
    !dataTypeColumns.some(col => col.columnName && col.newDataType) ||
    dataTypeColumns.some(col => (col.columnName && !col.newDataType) || (!col.columnName && col.newDataType))
  );
  const missingValueSectionError = showFieldErrors && toggles.missingValue &&
    !missingValueColumns.some(col => col.columnName);

  // Helper: section card border class
  const sectionClass = (hasError) =>
    `rounded-lg transition-all ${hasError
      ? 'bg-red-50 border border-red-400'
      : 'bg-[#FAFAFA]'
    }`;

  return (
    <div className="space-y-4 max-w-full">

      {/* ── Change Data Type ── */}
      <div className={sectionClass(changeDataTypeSectionError)}>
        <div className="p-4 flex items-center justify-between">
          <div className="flex-1 flex items-center gap-2">
            <h4 className={`text-sm font-medium ${changeDataTypeSectionError ? 'text-red-700' : 'text-gray-900'}`}>
              Change Data Type
            </h4>
            <InfoButton sectionDescriptions={sectionDescriptions} section="changeDataType" />
          </div>
          <div className="flex items-center gap-3">
            <label className={`relative inline-flex items-center ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
              <input type="checkbox" checked={toggles.changeDataType} onChange={() => toggleSwitch('changeDataType')} disabled={readonly} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8e78b7]"></div>
            </label>
            {toggles.changeDataType && (
              <button onClick={() => toggleSection('changeDataType')} className="text-gray-400 hover:text-gray-600">
                {expandedSections.changeDataType ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            )}
          </div>
        </div>

        {toggles.changeDataType && expandedSections.changeDataType && (
          <div className="px-4 pb-4 border-t border-gray-100">
            <div className="mt-4 space-y-2">

              {/* Header row */}
              <div className="grid grid-cols-[1fr_1fr_1fr_32px] gap-3">
                <label className="text-xs font-medium text-gray-600">Column Name</label>
                <label className="text-xs font-medium text-gray-600">Old Data Type</label>
                <label className="text-xs font-medium text-gray-600">New Data Type</label>
                <div />
              </div>

              {/* Each row: use items-start so each cell can have error text below it independently */}
              {dataTypeColumns.map((column, index) => {
                const colMissingName = showFieldErrors && !column.columnName;
                const colMissingType = showFieldErrors && column.columnName && !column.newDataType;

                return (
                  <div key={index} className="grid grid-cols-[1fr_1fr_1fr_32px] gap-3 items-start">

                    {/* Column Name */}
                    <div className="flex flex-col">
                      <SearchableDropdown
                        selectedColumn={column.columnName}
                        onSelect={(val) => handleColumnChange(index, val)}
                        availableOptions={getAvailableColumns(index)}
                        placeholder="Select column"
                        readonly={readonly}
                        dropDirection="down"
                        hasError={colMissingName}
                      />
                      {colMissingName && (
                        <p className="text-xs text-red-500 mt-1 pl-0.5">Please select a column</p>
                      )}
                    </div>

                    {/* Old Data Type — no error state, purely display */}
                    <div className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white">
                      {column.oldDataType || '-'}
                    </div>

                    {/* New Data Type */}
                    <div className="flex flex-col">
                      <select
                        disabled={readonly}
                        value={column.newDataType}
                        onChange={(e) => handleNewDataTypeChange(index, e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                          colMissingType
                            ? 'border-red-400 focus:ring-red-300 bg-white'
                            : 'border-gray-300 focus:ring-[#8e78b7] bg-white'
                        }`}
                      >
                        <option value="">Select type</option>
                        {dataTypeOptions.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                      {/* Error text sits ONLY under this column */}
                      {colMissingType && (
                        <p className="text-xs text-red-500 mt-1 pl-0.5">Please select a new data type</p>
                      )}
                    </div>

                    {/* Remove button — aligned to top of row */}
                    <div className="flex items-start justify-center pt-2">
                      {dataTypeColumns.length > 1 && (
                        <button
                          onClick={() => removeDataTypeColumn(index)}
                          disabled={readonly}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          title="Remove"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}

              <button
                onClick={addColumn}
                disabled={readonly || !canAddNewRow()}
                className={`w-full py-3 border-2 border-dashed rounded-lg text-sm flex items-center justify-center gap-2 transition-colors mt-1 ${
                  readonly || !canAddNewRow()
                    ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                    : 'border-[#8e78b7] text-[#8e78b7]'
                }`}
              >
                <Plus size={16} /> Add Column
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Drop Duplicate Rows ── */}
      <div className="bg-[#FAFAFA] rounded-lg">
        <div className="p-4 flex items-center justify-between">
          <div className="flex-1 flex items-center gap-2">
            <h4 className="text-sm font-medium text-gray-900">Drop Duplicate Rows</h4>
            <InfoButton sectionDescriptions={sectionDescriptions} section="dropDuplicates" />
          </div>
          <label className={`relative inline-flex items-center ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
            <input type="checkbox" checked={toggles.dropDuplicates} onChange={() => toggleSwitch('dropDuplicates')} disabled={readonly} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8E77BB]"></div>
          </label>
        </div>
      </div>

      {/* ── Uniqueness Ratio ── */}
      <div className="bg-[#FAFAFA] rounded-lg">
        <div className="p-4 flex items-center justify-between">
          <div className="flex-1 flex items-center gap-2">
            <h4 className="text-sm font-medium text-gray-900">Uniqueness Ratio</h4>
            <InfoButton sectionDescriptions={sectionDescriptions} section="uniquenessRatio" />
          </div>
          <label className={`relative inline-flex items-center ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
            <input type="checkbox" checked={toggles.uniquenessRatio} onChange={() => toggleSwitch('uniquenessRatio')} disabled={readonly} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8E77BB]"></div>
          </label>
        </div>
      </div>

      {/* ── Missing Value Indicator ── */}
      <div className={sectionClass(missingValueSectionError)}>
        <div className="p-4 flex items-center justify-between">
          <div className="flex-1 flex items-center gap-2">
            <h4 className={`text-sm font-medium ${missingValueSectionError ? 'text-red-700' : 'text-gray-900'}`}>
              Missing Value Indicator
            </h4>
            <InfoButton sectionDescriptions={sectionDescriptions} section="missingValue" isLastSection={true} />
          </div>
          <div className="flex items-center gap-3">
            <label className={`relative inline-flex items-center ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
              <input type="checkbox" checked={toggles.missingValue} onChange={() => toggleSwitch('missingValue')} disabled={readonly} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8E77BB]"></div>
            </label>
            {toggles.missingValue && (
              <button onClick={() => toggleSection('missingValue')} className="text-gray-400 hover:text-gray-600">
                {expandedSections.missingValue ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            )}
          </div>
        </div>

        {toggles.missingValue && expandedSections.missingValue && (
          <div className="px-4 pb-4 border-t border-gray-100">
            <div className="mt-4 space-y-4">
              <div className="w-1/2">
                <label className="text-xs font-medium text-gray-600 mb-2 block">Select Column</label>
                <SearchableDropdown
                  selectedColumn=""
                  onSelect={(columnName) => {
                    const existing = missingValueColumns.filter(col => col.columnName);
                    setMissingValueColumns([...existing, { columnName }]);
                  }}
                  availableOptions={getAvailableColumnsForMissingValue()}
                  placeholder="Search and select column..."
                  readonly={readonly}
                  dropDirection="up"
                  hasError={missingValueSectionError}
                />
                {/* Error text directly under the dropdown */}
                {missingValueSectionError && (
                  <p className="text-xs text-red-500 mt-1 pl-0.5">
                    Please select at least one column
                  </p>
                )}
              </div>

              {missingValueColumns.filter(col => col.columnName).length > 0 && (
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-2 block">Selected Columns</label>
                  <SelectedColumnsList
                    columns={missingValueColumns.filter(col => col.columnName).map(col => col.columnName)}
                    onRemove={(columnName) => {
                      const next = missingValueColumns.filter(col => col.columnName !== columnName);
                      setMissingValueColumns(next.length > 0 ? next : [{ columnName: '' }]);
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