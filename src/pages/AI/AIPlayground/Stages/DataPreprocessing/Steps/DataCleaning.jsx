import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Plus, Search, X } from 'lucide-react';
import { useAIPlayground } from '../../../../../../context/AIPlaygroundContext';
import { toast } from 'react-hot-toast';
import InfoButton from '../../../components/InfoButton';
import { SearchableDropdown, MultiSelectDropdown, SelectedColumnsList } from '../timeseries/components/Dropdowns';

function DataCleaning({ readonly: readonlyProp, onValidationChange, onApiCall }) {
  const hostnameAI = window._env_?.VITE_AI_API;
  const { workflowsState, activeWorkflowId, datasetState, updatePreprocessingStep, mode } = useAIPlayground();
  const readonly = readonlyProp || mode === 'view';
  const workflowState = activeWorkflowId
    ? workflowsState[activeWorkflowId]
    : null;  
  const currentWorkflowId = workflowState?.workflow_id || activeWorkflowId;

  const changeDataTypeSectionRef = useRef(null);
  const missingValueSectionRef = useRef(null);

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

  useEffect(() => {
    if (onValidationChange) onValidationChange(true);
  }, []);

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
      ensemble_id: datasetState?.ensembleId,
      workflow_id: currentWorkflowId,
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

      const changeDataTypeHasError = toggles.changeDataType && (
        !dataTypeColumns.some(col => col.columnName && col.newDataType) ||
        dataTypeColumns.some(col => (col.columnName && !col.newDataType) || (!col.columnName && col.newDataType))
      );
      const missingValueHasError = toggles.missingValue && !missingValueColumns.some(col => col.columnName);

      setExpandedSections(prev => ({
        ...prev,
        changeDataType: changeDataTypeHasError ? true : prev.changeDataType,
        missingValue: missingValueHasError ? true : prev.missingValue,
      }));

      setTimeout(() => {
        if (changeDataTypeHasError && changeDataTypeSectionRef.current) {
          changeDataTypeSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (missingValueHasError && missingValueSectionRef.current) {
          missingValueSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);

      return false;
    }

    try {
      const payload = buildApiPayload();
      if (!payload.ensemble_id || !payload.workflow_id) {
        throw new Error('Missing required identifiers: ensemble_id or workflow_id');
      }
      const response = await fetch(`${hostnameAI}/data/preprocess_supervised/initial_clean`, {
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
  }, [toggles, dataTypeColumns, missingValueColumns, datasetState?.ensembleId, currentWorkflowId]);

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

  // ── CHANGE: No longer used for section-level red bg/heading ──
  const changeDataTypeSectionError = showFieldErrors && toggles.changeDataType && (
    !dataTypeColumns.some(col => col.columnName && col.newDataType) ||
    dataTypeColumns.some(col => (col.columnName && !col.newDataType) || (!col.columnName && col.newDataType))
  );
  const missingValueSectionError = showFieldErrors && toggles.missingValue &&
    !missingValueColumns.some(col => col.columnName);

  return (
    <div className="space-y-4 max-w-full">

      {/* ── Change Data Type ── */}
      <div ref={changeDataTypeSectionRef} className="rounded-lg transition-all bg-[#FAFAFA]">
        <div className="p-4 flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium text-gray-900">
                Change Data Type
              </h4>
              <InfoButton sectionDescriptions={sectionDescriptions} section="changeDataType" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className={`relative inline-flex items-center ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
              <input type="checkbox" checked={toggles.changeDataType} onChange={() => toggleSwitch('changeDataType')} disabled={readonly} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8e78b7]"></div>
            </label>
            {toggles.changeDataType && (
              <button onClick={() => toggleSection('changeDataType')} className="hover:opacity-70 transition-opacity">
                {expandedSections.changeDataType
                  ? <ChevronUp size={20} color="#818181" />
                  : <ChevronDown size={20} color="#818181" />
                }
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
                        placeholder="Select"
                        readonly={readonly}
                        dropDirection="down"
                        hasError={colMissingName}
                      />
                      {colMissingName && (
                        <p className="text-xs text-[#EF4D5F] mt-1 pl-0.5">Please select a column</p>
                      )}
                    </div>

                    {/* Old Data Type */}
                    <div className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white">
                      {column.oldDataType || '-'}
                    </div>

                    {/* New Data Type */}
                    <div className="flex flex-col">
                      <SearchableDropdown
                        selectedColumn={column.newDataType}
                        onSelect={(val) => handleNewDataTypeChange(index, val)}
                        availableOptions={dataTypeOptions}
                        placeholder="Select"
                        readonly={readonly}
                        dropDirection="down"
                        hasError={!!colMissingType}
                      />
                      {colMissingType && (
                        <p className="text-xs text-[#EF4D5F] mt-1 pl-0.5">Please select a new data type</p>
                      )}
                    </div>

                    {/* Remove button */}
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

              <div>
                <button
                  onClick={addColumn}
                  disabled={readonly || !canAddNewRow()}
                  style={{ width: '330px' }}
                  className={`py-2 border-2 border-dashed rounded-lg text-sm flex items-center justify-center gap-2 transition-colors mt-3 ${readonly || !canAddNewRow()
                    ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                    : 'border-[#8e78b7] text-[#8e78b7] hover:bg-purple-50'
                  }`}
                >
                  <Plus size={16} /> Add Column
                </button>
              </div>
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
      <div ref={missingValueSectionRef} className="rounded-lg transition-all bg-[#FAFAFA]">
        <div className="p-4 flex items-center justify-between">
          <div className="flex-1 flex items-center gap-2">
            {/* CHANGE: heading always gray-900, never red */}
            <h4 className="text-sm font-medium text-gray-900">
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
              <button onClick={() => toggleSection('missingValue')} className="hover:opacity-70 transition-opacity">
                {expandedSections.missingValue
                  ? <ChevronUp size={20} color="#818181" />
                  : <ChevronDown size={20} color="#818181" />
                }
              </button>
            )}
          </div>
        </div>

        {toggles.missingValue && expandedSections.missingValue && (
          <div className="px-4 pb-4 border-t border-gray-100">
            <div className="mt-4 space-y-4">
              <div style={{ width: '318px' }}>
                <label className="text-xs font-medium text-gray-600 mb-2 block">Select Column</label>
                <MultiSelectDropdown
                  selectedColumns={missingValueColumns.filter(col => col.columnName).map(col => col.columnName)}
                  onSelectionChange={(newSelection) => {
                    setMissingValueColumns(
                      newSelection.length > 0
                        ? newSelection.map(columnName => ({ columnName }))
                        : [{ columnName: '' }]
                    );
                  }}
                  availableOptions={columnNames}
                  placeholder="Search and select column..."
                  readonly={readonly}
                  dropDirection="up"
                  hasError={missingValueSectionError}
                />
                {missingValueSectionError && (
                  <p className="text-xs text-[#EF4D5F] mt-1 pl-0.5">
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