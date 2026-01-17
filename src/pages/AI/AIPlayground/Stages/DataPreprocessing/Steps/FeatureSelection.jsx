
import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Plus, X, AlertCircle } from 'lucide-react';
import { useAIPlayground } from '../../../../../../context/AIPlaygroundContext';
import { toast } from 'react-hot-toast';

function FeatureSelection({ readonly = false, onValidationChange, onApiCall }) {
  const hostnameAI = window._env_?.VITE_AI_API;
  const { workflowState, updatePreprocessingStep, datasetState } = useAIPlayground();

  const columns = workflowState?.dataPreprocessing?.step1?.apiResponse?.filtered_uniqueness_report?.map(item => ({
    name: item.column,
    uniqueness: `${(item.uniqueness_ratio * 100).toFixed(2)}%`
  })) || [];

  const numericalColumns = workflowState?.dataPreprocessing?.step1?.apiResponse?.numerical_columns || [];
  const categoricalColumns = workflowState?.dataPreprocessing?.step1?.apiResponse?.categorical_columns || [];
  const datetimeColumns = workflowState?.dataPreprocessing?.step1?.apiResponse?.datetime_columns || [];

  const allColumns = [...numericalColumns, ...categoricalColumns, ...datetimeColumns];

  const [expandedSections, setExpandedSections] = useState({
    dropLowValue: false,
    handleMissing: false,
    createBasic: false,
    detectOutliers: false,
  });

  const [toggles, setToggles] = useState({
    dropLowValue: false,
    handleMissing: false,
    createBasic: false,
    detectOutliers: false,
  });

  const [selectedColumns, setSelectedColumns] = useState({});
  const [selectAll, setSelectAll] = useState(false);
  const [dropColumnsEnabled, setDropColumnsEnabled] = useState(false);
  const [imputationEnabled, setImputationEnabled] = useState(false);
  const [threshold, setThreshold] = useState('70');
  const [numericalImputation, setNumericalImputation] = useState('');
  const [categoricalImputation, setCategoricalImputation] = useState('');
  const [timeSeriesImputation, setTimeSeriesImputation] = useState('');
  const [columnOverrides, setColumnOverrides] = useState([]);
  const [basicFeatures, setBasicFeatures] = useState([]);
  const [outlierMethod, setOutlierMethod] = useState('zscore');

  const [validationErrors, setValidationErrors] = useState({
    dropLowValue: '',
    handleMissing: '',
    createBasic: ''
  });

  const numericalImputationMethods = ['knn', 'mice', 'mean', 'median', 'constant', 'ffill', 'bfill', 'interpolate', 'mice_bayes', 'simple_cv'];
  const categoricalImputationMethods = ['mode', 'constant', 'ffill', 'bfill'];
  const timeSeriesImputationMethods = ['mode', 'constant', 'ffill', 'bfill'];
  const operators = ['+', '-', '*', '/', '%'];
  const outlierMethods = [
    { value: 'zscore', label: 'Z-Score' },
    { value: 'modified_zscore', label: 'Modified Z-Score' },
    { value: 'iqr', label: 'IQR' },
    { value: 'isolation_forest', label: 'Isolation Forest' },
    { value: 'lof', label: 'LOF' },
    { value: 'one_class_svm', label: 'One Class SVM' },
    { value: 'elliptic_envelope', label: 'Elliptic Envelope' },
    { value: 'dbscan', label: 'DBSCAN' }
  ];

  useEffect(() => {
    const { isValid, errors } = validateStep();
    setValidationErrors(errors);
    if (onValidationChange) {
      onValidationChange(isValid);
    }
  }, [toggles, selectedColumns, dropColumnsEnabled, imputationEnabled, threshold, numericalImputation, categoricalImputation, timeSeriesImputation, basicFeatures]);

  const validateStep = () => {
    const errors = {
      dropLowValue: '',
      handleMissing: '',
      createBasic: ''
    };
    let isValid = true;

    if (toggles.dropLowValue) {
      const selectedCount = Object.values(selectedColumns).filter(Boolean).length;
      if (selectedCount === 0) {
        errors.dropLowValue = 'Please select at least one column.';
        isValid = false;
      }
    }

    if (toggles.handleMissing) {
      if (!threshold || threshold.trim() === '') {
        errors.handleMissing = 'Please enter a threshold value for dropping columns.';
        isValid = false;
      }
      const hasImputationMethod = numericalImputation || categoricalImputation || timeSeriesImputation;
      if (!hasImputationMethod) {
        errors.handleMissing = 'Please select at least one imputation method';
        isValid = false;
      }
    }

    if (toggles.createBasic) {
      const hasValidFeature = basicFeatures.some(f => f.column1 && f.column2 && f.operator && f.newColumnName);
      if (!hasValidFeature) {
        errors.createBasic = 'Please add at least one complete operation.';
        isValid = false;
      }
    }

    return { isValid, errors };
  };

  const makeApiCall = async () => {
    if (readonly) return true;

    try {
      // Get columns to drop manually from Drop Low-Value Columns section
      const columnsToDropManually = Object.entries(selectedColumns)
        .filter(([_, isSelected]) => isSelected)
        .map(([key]) => {
          const columnName = key.substring(0, key.lastIndexOf('-'));
          return columnName;
        });

      const missingNumeric = workflowState?.dataPreprocessing?.step1?.apiResponse?.missing_numeric_column || {};
      const missingCategorical = workflowState?.dataPreprocessing?.step1?.apiResponse?.missing_categorical_column || {};
      const missingDatetime = workflowState?.dataPreprocessing?.step1?.apiResponse?.missing_datetime_column || {};

      const hasNumericMissing = Object.entries(missingNumeric).some(
        ([col, val]) => val === 1 && !columnsToDropManually.includes(col)
      );
      const hasCategoricalMissing = Object.entries(missingCategorical).some(
        ([col, val]) => val === 1 && !columnsToDropManually.includes(col)
      );
      const hasDatetimeMissing = Object.entries(missingDatetime).some(
        ([col, val]) => val === 1 && !columnsToDropManually.includes(col)
      );

      if (hasNumericMissing || hasCategoricalMissing || hasDatetimeMissing) {
        if (!toggles.handleMissing) {
          toast.error('Handle Missing Values must be enabled and configured as there are columns with missing values.', {
            duration: 4000,
            position: 'top-right',
          });
          return false;
        }

        if (!imputationEnabled) {
          toast.error('Please enable Imputation to handle missing values in your columns.', {
            duration: 4000,
            position: 'top-right',
          });
          return false;
        }

        if (hasNumericMissing && !numericalImputation) {
          toast.error('Numerical Imputation is mandatory as there are numerical columns with missing values.', {
            duration: 4000,
            position: 'top-right',
          });
          return false;
        }

        if (hasCategoricalMissing && !categoricalImputation) {
          toast.error('Categorical Imputation is mandatory as there are categorical columns with missing values.', {
            duration: 4000,
            position: 'top-right',
          });
          return false;
        }

        if (hasDatetimeMissing && !timeSeriesImputation) {
          toast.error('Time Series Imputation is mandatory as there are datetime columns with missing values.', {
            duration: 4000,
            position: 'top-right',
          });
          return false;
        }
      }

      const imputationStrategyByType = {};
      if (categoricalImputation) imputationStrategyByType.categorical = categoricalImputation;
      if (numericalImputation) imputationStrategyByType.numeric = numericalImputation;
      if (timeSeriesImputation) imputationStrategyByType.datetime = timeSeriesImputation;

      const imputationStrategyByColumn = {};
      columnOverrides.forEach(override => {
        if (override.column && override.method) {
          imputationStrategyByColumn[override.column] = override.method;
        }
      });

      const mathOps = basicFeatures
        .filter(f => f.column1 && f.column2 && f.operator && f.newColumnName)
        .map(f => ({
          operation: f.operator === '+' ? 'add' :
            f.operator === '-' ? 'subtract' :
              f.operator === '*' ? 'multiply' :
                f.operator === '/' ? 'divide' :
                  f.operator === '%' ? 'modulo' : 'add',
          col1: f.column1,
          col2: f.column2,
          new_col: f.newColumnName
        }));

      const requestBody = {
        session_id: datasetState.sessionId,
        drop_high_uniqueness_active: toggles.dropLowValue,
        columns_to_drop_manually: columnsToDropManually,
        drop_high_null_active: toggles.handleMissing,
        null_threshold: parseFloat(threshold) / 100,
        imputation_strategy_by_type: imputationStrategyByType,
        imputation_strategy_by_column: imputationStrategyByColumn,
        feature_creation_active: toggles.createBasic,
        math_ops: mathOps,
        outlier_detection_active: toggles.detectOutliers,
        outlier_detection_method: outlierMethod
      };

      const currentConfig = {
        toggles,
        selectedColumns,
        dropColumnsEnabled,
        imputationEnabled,
        threshold,
        numericalImputation,
        categoricalImputation,
        timeSeriesImputation,
        columnOverrides,
        basicFeatures,
        outlierMethod
      };

      const response = await fetch(`${hostnameAI}/data/preprocess/feature_selection`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API error: ${response.status}`);
      }

      const apiResponse = await response.json();

      updatePreprocessingStep('step2', {
        config: currentConfig,
        apiResponse: apiResponse
      });

      toast.success('Feature selection completed successfully!', {
        duration: 3000,
        position: 'top-right',
      });
      return true;

    } catch (error) {
      console.error('API call failed:', error);
      toast.error(error.message || 'Feature selection failed. Please try again.', {
        duration: 4000,
        position: 'top-right',
      });
      return false;
    }
  };

  useEffect(() => {
    if (onApiCall) {
      onApiCall(makeApiCall);
    }
  }, [toggles, selectedColumns, dropColumnsEnabled, imputationEnabled, threshold, numericalImputation,
    categoricalImputation, timeSeriesImputation, columnOverrides, basicFeatures, outlierMethod, datasetState.sessionId]);

  const toggleSection = (section) => {
    if (readonly) return;
    setExpandedSections({
      dropLowValue: false,
      handleMissing: false,
      createBasic: false,
      detectOutliers: false,
      [section]: !expandedSections[section]
    });
  };

  const toggleSwitch = (key) => {
    if (readonly) return;
    const newToggleState = !toggles[key];

    setToggles(prev => ({
      ...prev,
      [key]: newToggleState
    }));

    if (newToggleState && (key === 'dropLowValue' || key === 'handleMissing' || key === 'createBasic' || key === 'detectOutliers')) {
      setExpandedSections({
        dropLowValue: false,
        handleMissing: false,
        createBasic: false,
        detectOutliers: false,
        [key]: true
      });
    }

    // Set default values when Handle Missing Values is enabled
    if (key === 'handleMissing' && newToggleState) {
      setDropColumnsEnabled(true);
      setImputationEnabled(true);
      if (!threshold || threshold === '') {
        setThreshold('70');
      }
    }

    if (!newToggleState) {
      setExpandedSections(prev => ({
        ...prev,
        [key]: false
      }));
    }
  };

  const handleSelectAll = () => {
    if (readonly) return;
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    const newSelectedColumns = {};
    columns.forEach((col, idx) => {
      newSelectedColumns[`${col.name}-${idx}`] = newSelectAll;
    });
    setSelectedColumns(newSelectedColumns);
  };

  const handleColumnToggle = (columnKey) => {
    if (readonly) return;
    setSelectedColumns(prev => ({ ...prev, [columnKey]: !prev[columnKey] }));
  };

  const getImputationMethodsForColumn = (columnName) => {
    if (numericalColumns.includes(columnName)) return numericalImputationMethods;
    if (categoricalColumns.includes(columnName)) return categoricalImputationMethods;
    if (datetimeColumns.includes(columnName)) return timeSeriesImputationMethods;
    return [];
  };

  const addColumnOverride = () => {
    if (readonly) return;
    setColumnOverrides([...columnOverrides, { id: Date.now(), column: '', method: '' }]);
  };

  const removeColumnOverride = (id) => {
    if (readonly) return;
    setColumnOverrides(columnOverrides.filter(override => override.id !== id));
  };

  const updateColumnOverride = (id, field, value) => {
    if (readonly) return;
    setColumnOverrides(columnOverrides.map(override =>
      override.id === id ? { ...override, [field]: value } : override
    ));
  };

  const addBasicFeature = () => {
    if (readonly) return;
    setBasicFeatures([...basicFeatures, {
      id: Date.now(),
      column1: '',
      operator: '+',
      column2: '',
      newColumnName: ''
    }]);
  };

  const removeBasicFeature = (id) => {
    if (readonly) return;
    setBasicFeatures(basicFeatures.filter(feature => feature.id !== id));
  };

  const updateBasicFeature = (id, field, value) => {
    if (readonly) return;
    setBasicFeatures(basicFeatures.map(feature =>
      feature.id === id ? { ...feature, [field]: value } : feature
    ));
  };

  const ToggleSwitch = ({ checked, onChange }) => (
    <label className={`relative inline-flex items-center ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={readonly}
        className="sr-only peer"
      />
      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8e78b7]"></div>
    </label>
  );

  const selectedCount = Object.values(selectedColumns).filter(Boolean).length;
  const totalFields = columns.length;

  return (
    <div className="space-y-4">
      {workflowState?.dataPreprocessing?.step1?.config?.toggles?.uniquenessRatio && (
        <div className="bg-gray-50 rounded-lg border border-gray-200">
          <div className="p-4 flex items-center justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900">Drop Low-Value Columns</h4>
              <p className="text-xs text-gray-500 mt-1">Remove columns with zero or excessively high uniqueness.</p>
            </div>
            <div className="flex items-center gap-3">
              <ToggleSwitch checked={toggles.dropLowValue} onChange={() => toggleSwitch('dropLowValue')} />
              {toggles.dropLowValue && (
                <button onClick={() => toggleSection('dropLowValue')} disabled={readonly} className="text-gray-400 hover:text-gray-600">
                  {expandedSections.dropLowValue ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
              )}
            </div>
          </div>

          {toggles.dropLowValue && validationErrors.dropLowValue && (
            <div className="px-4 pb-2">
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-800">{validationErrors.dropLowValue}</p>
              </div>
            </div>
          )}

          {toggles.dropLowValue && expandedSections.dropLowValue && (
            <div className="px-4 pb-4 border-t border-gray-100">
              <div className="mt-4">
                <div className="flex items-center justify-between mb-4">
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      disabled={readonly}
                      className="w-4 h-4 text-[#8e78b7] border-gray-300 rounded"
                    />
                    Select All
                  </label>
                  <span className="text-xs text-gray-400">Total Fields: {totalFields} | Selected: {selectedCount}</span>
                </div>

                <div className="grid grid-cols-3 gap-x-8 gap-y-4 max-h-96 overflow-y-auto pr-2">
                  {columns.map((column, idx) => {
                    const columnKey = `${column.name}-${idx}`;
                    return (
                      <div key={columnKey} className="flex items-center gap-2 bg-white p-2 rounded">
                        <input
                          type="checkbox"
                          checked={selectedColumns[columnKey] || false}
                          onChange={() => handleColumnToggle(columnKey)}
                          disabled={readonly}
                          className="w-4 h-4 text-[#8e78b7] border-gray-300 rounded mt-0.5"
                        />
                        <div className="flex-1">
                          <div className="text-sm text-gray-700">{column.name}</div>
                          <div className="text-xs text-gray-400">{column.uniqueness}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-gray-50 rounded-lg border border-gray-200">
        <div className="p-4 flex items-center justify-between">
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900">Handle Missing Values</h4>
            <p className="text-xs text-gray-500 mt-1">Fix missing entries using dropping or imputation techniques.</p>
          </div>
          <div className="flex items-center gap-3">
            <ToggleSwitch checked={toggles.handleMissing} onChange={() => toggleSwitch('handleMissing')} />
            {toggles.handleMissing && (
              <button onClick={() => toggleSection('handleMissing')} disabled={readonly} className="text-gray-400 hover:text-gray-600">
                {expandedSections.handleMissing ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            )}
          </div>
        </div>

        {toggles.handleMissing && validationErrors.handleMissing && (
          <div className="px-4 pb-2">
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-800">{validationErrors.handleMissing}</p>
            </div>
          </div>
        )}

        {toggles.handleMissing && expandedSections.handleMissing && (
          <div className="px-4 pb-4 border-t border-gray-100">
            <div className="mt-4 space-y-6">
              {/* Drop Columns Section */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="mb-3">
                  <div>
                    <h5 className="text-sm font-medium text-gray-900">Drop Columns</h5>
                    <p className="text-xs text-gray-500">Remove columns exceeding missing value threshold</p>
                  </div>
                </div>

                <div className="mt-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Threshold (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={threshold}
                      onChange={(e) => !readonly && setThreshold(e.target.value)}
                      disabled={readonly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent"
                      placeholder="70"
                    />
                    <p className="text-xs text-gray-400 mt-1">Drop columns with more than {threshold || 0}% missing values</p>
                  </div>
                </div>
              </div>

              {/* Imputation Section */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="mb-3">
                  <div>
                    <h5 className="text-sm font-medium text-gray-900">Imputation</h5>
                    <p className="text-xs text-gray-500">Fill missing values using statistical methods</p>
                  </div>
                </div>

                <div className="mt-3 space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Numerical Imputation</label>
                      <select
                        value={numericalImputation}
                        onChange={(e) => !readonly && setNumericalImputation(e.target.value)}
                        disabled={readonly}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent"
                      >
                        <option value="">Select</option>
                        {numericalImputationMethods.map(method => (
                          <option key={method} value={method}>{method}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Categorical Imputation</label>
                      <select
                        value={categoricalImputation}
                        onChange={(e) => !readonly && setCategoricalImputation(e.target.value)}
                        disabled={readonly}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent"
                      >
                        <option value="">Select</option>
                        {categoricalImputationMethods.map(method => (
                          <option key={method} value={method}>{method}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Time Series</label>
                      <select
                        value={timeSeriesImputation}
                        onChange={(e) => !readonly && setTimeSeriesImputation(e.target.value)}
                        disabled={readonly}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent"
                      >
                        <option value="">Select</option>
                        {timeSeriesImputationMethods.map(method => (
                          <option key={method} value={method}>{method}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-3">Column Overrides</label>
                    <div className="space-y-3">
                      {columnOverrides.map((override, index) => (
                        <div key={override.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <label className="block text-xs text-gray-500 mb-1">Override {index + 1}</label>
                              <select
                                value={override.column}
                                onChange={(e) => updateColumnOverride(override.id, 'column', e.target.value)}
                                disabled={readonly}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent"
                              >
                                <option value="">Column</option>
                                {allColumns.map(col => (
                                  <option key={col} value={col}>{col}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex-1">
                              <label className="block text-xs text-gray-500 mb-1">&nbsp;</label>
                              <select
                                value={override.method}
                                onChange={(e) => updateColumnOverride(override.id, 'method', e.target.value)}
                                disabled={readonly}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent"
                              >
                                <option value="">Strategy</option>
                                {getImputationMethodsForColumn(override.column).map(method => (
                                  <option key={method} value={method}>{method}</option>
                                ))}
                              </select>
                            </div>
                            <button
                              onClick={() => removeColumnOverride(override.id)}
                              disabled={readonly}
                              className="mt-5 p-2 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ))}

                      <button
                        onClick={addColumnOverride}
                        disabled={readonly}
                        className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-[#8e78b7] hover:text-[#8e78b7] transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus size={16} />
                        Add Override
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-gray-50 rounded-lg border border-gray-200">
        <div className="p-4 flex items-center justify-between">
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900">Create Basic Features</h4>
            <p className="text-xs text-gray-500 mt-1">Add new domain features for enhanced model performance.</p>
          </div>
          <div className="flex items-center gap-3">
            <ToggleSwitch checked={toggles.createBasic} onChange={() => toggleSwitch('createBasic')} />
            {toggles.createBasic && (
              <button onClick={() => toggleSection('createBasic')} disabled={readonly} className="text-gray-400 hover:text-gray-600">
                {expandedSections.createBasic ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            )}
          </div>
        </div>

        {toggles.createBasic && validationErrors.createBasic && (
          <div className="px-4 pb-2">
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-800">{validationErrors.createBasic}</p>
            </div>
          </div>
        )}

        {toggles.createBasic && expandedSections.createBasic && (
          <div className="px-4 pb-4 border-t border-gray-100">
            <div className="mt-4 space-y-3">
              {basicFeatures.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 mb-3">No operations added yet</p>
                </div>
              ) : (
                basicFeatures.map((feature, index) => (
                  <div key={feature.id} className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-gray-700">Operation {index + 1}</label>
                      <button
                        onClick={() => removeBasicFeature(feature.id)}
                        disabled={readonly}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded hover:bg-red-50"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="grid grid-cols-12 gap-3 items-start">
                      <div className="col-span-3">
                        <label className="block text-xs text-gray-500 mb-1.5">First Column</label>
                        <select
                          value={feature.column1}
                          onChange={(e) => updateBasicFeature(feature.id, 'column1', e.target.value)}
                          disabled={readonly}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent bg-white"
                        >
                          <option value="">Select Column</option>
                          {numericalColumns.map(col => (
                            <option key={col} value={col}>{col}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-xs text-gray-500 mb-1.5">Operator</label>
                        <select
                          value={feature.operator}
                          onChange={(e) => updateBasicFeature(feature.id, 'operator', e.target.value)}
                          disabled={readonly}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent bg-white text-center font-medium"
                        >
                          {operators.map(op => (
                            <option key={op} value={op}>{op}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-3">
                        <label className="block text-xs text-gray-500 mb-1.5">Second Column</label>
                        <select
                          value={feature.column2}
                          onChange={(e) => updateBasicFeature(feature.id, 'column2', e.target.value)}
                          disabled={readonly}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent bg-white"
                        >
                          <option value="">Select Column</option>
                          {numericalColumns.map(col => (
                            <option key={col} value={col}>{col}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-4">
                        <label className="block text-xs text-gray-500 mb-1.5">New Column Name</label>
                        <input
                          type="text"
                          value={feature.newColumnName}
                          onChange={(e) => updateBasicFeature(feature.id, 'newColumnName', e.target.value)}
                          disabled={readonly}
                          placeholder="e.g., total_amount"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}

              <button
                onClick={addBasicFeature}
                disabled={readonly}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-[#8e78b7] hover:text-[#8e78b7] hover:bg-purple-50 transition-all flex items-center justify-center gap-2 font-medium"
              >
                <Plus size={18} />
                Add New Operation
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-gray-50 rounded-lg border border-gray-200">
        <div className="p-4 flex items-center justify-between">
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900">Detect Outliers</h4>
            <p className="text-xs text-gray-500 mt-1">Find and handle outliers in numerical fields.</p>
          </div>
          <div className="flex items-center gap-3">
            <ToggleSwitch checked={toggles.detectOutliers} onChange={() => toggleSwitch('detectOutliers')} />
            {toggles.detectOutliers && (
              <button onClick={() => toggleSection('detectOutliers')} disabled={readonly} className="text-gray-400 hover:text-gray-600">
                {expandedSections.detectOutliers ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            )}
          </div>
        </div>

        {toggles.detectOutliers && expandedSections.detectOutliers && (
          <div className="px-4 pb-4 border-t border-gray-100">
            <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-3">
              {outlierMethods.map(method => (
                <label key={method.value} className={`flex items-center gap-2 group ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                  <input
                    type="radio"
                    name="outlierMethod"
                    value={method.value}
                    checked={outlierMethod === method.value}
                    onChange={(e) => !readonly && setOutlierMethod(e.target.value)}
                    disabled={readonly}
                    className="w-4 h-4 text-[#8e78b7] border-gray-300 focus:ring-[#8e78b7]"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">{method.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FeatureSelection;