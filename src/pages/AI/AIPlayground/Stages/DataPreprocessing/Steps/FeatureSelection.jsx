
import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Plus, X, AlertCircle, Info } from 'lucide-react';
import { useAIPlayground } from '../../../../../../context/AIPlaygroundContext';
import { toast } from 'react-hot-toast';
import InfoButton from '../../../components/InfoButton';

function FeatureSelection({ onValidationChange, onApiCall }) {
  const hostnameAI = window._env_?.VITE_AI_API;
  const { workflowState, updatePreprocessingStep, datasetState, mode } = useAIPlayground();
  const readonly = mode === 'view';

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
  const [hoveredInfo, setHoveredInfo] = useState(null);
  const [hoveredOutlier, setHoveredOutlier] = useState(null);
  const [searchNumerical, setSearchNumerical] = useState('');
  const [searchCategorical, setSearchCategorical] = useState('');
  const [searchTimeSeries, setSearchTimeSeries] = useState('');
  const [showNumericalDropdown, setShowNumericalDropdown] = useState(false);
  const [showCategoricalDropdown, setShowCategoricalDropdown] = useState(false);
  const [showTimeSeriesDropdown, setShowTimeSeriesDropdown] = useState(false);

  const [validationErrors, setValidationErrors] = useState({
    dropLowValue: '',
    handleMissing: '',
    createBasic: ''
  });

  const [imputationWarnings, setImputationWarnings] = useState({
    numerical: false,
    categorical: false,
    datetime: false
  });

  const numericalImputationMethods = ['knn', 'mice', 'mean', 'median', 'constant', 'ffill', 'bfill', 'interpolate', 'mice_bayes', 'simple_cv'];
  const categoricalImputationMethods = ['mode', 'constant', 'ffill', 'bfill'];
  const timeSeriesImputationMethods = ['mode', 'constant', 'ffill', 'bfill'];
  const operators = ['+', '-', '*', '/', '%'];

  const sectionDescriptions = {
    dropLowValue: "Drop Low-Value Column refers to the removal of features that provide little or no useful information for model learning, such as columns with very low variance or a single dominant value. Removing such columns helps reduce noise, improve model efficiency, and prevent unnecessary complexity.",
    handleMissing: "Fix missing entries using dropping or imputation techniques.",
    createBasic: "Add new domain features for enhanced model performance.",
    detectOutliers: "Detect outliers in numerical fields using various statistical and machine learning methods to identify anomalous data points.",
    dropColumns: "Remove columns exceeding missing value threshold",
    imputation: "Imputation is the process of handling missing or null values by replacing them with meaningful estimates based on data patterns or predefined rules. It helps maintain dataset completeness, prevents errors during model training, and ensures reliable analytical results."
  };

  const imputationMethodDescriptions = {
    numerical: {
      knn: "KNN imputation replaces missing values by using the values from the most similar data points based on distance measures. It preserves local data patterns and relationships between features.",
      mice: "MICE imputes missing values by iteratively modeling each feature using other related features. It captures dependencies between variables and improves overall data consistency.",
      mean: "Mean imputation replaces missing values with the average value of the feature. It is simple and effective for normally distributed data.",
      median: "Missing values are replaced with the median (50th percentile) of the feature. It is robust to outliers and skewed data distributions.",
      constant: "Missing values are replaced with a predefined constant value (e.g., 0 or −1). This method explicitly preserves information about missingness.",
      ffill: "A sequential imputation method that propagates the last observed value forward. Missing values are filled using the previous valid observation. Commonly applied to time-series or ordered datasets.",
      bfill: "A sequential imputation method that uses the next available observation. Missing values are filled using the next valid value in sequence. Useful when future observations are more reliable.",
      interpolate: "An imputation technique that estimates missing values based on surrounding data points. The method calculates values along a trend between known observations. Often used for numeric and time-dependent data.",
      mice_bayes: "A Bayesian extension of MICE that uses probabilistic models for imputation. It estimates missing values while accounting for uncertainty and variability. This improves reliability in complex datasets.",
      simple_cv: "A model-driven approach that evaluates multiple imputation strategies using cross-validation. The method selects the imputation technique that results in the best model performance. It ensures data quality is aligned with predictive accuracy."
    },
    categorical: {
      mode: "A statistical imputation method that replaces missing categorical values with the most frequently occurring category. Missing values are filled using the category that appears most often in the data. This method preserves the dominant pattern in categorical features.",
      constant: "A rule-based imputation method that replaces missing categorical values with a predefined category label. A fixed category such as \"Unknown\" or \"Not Available\" is used. This explicitly indicates missing data without altering existing category distributions.",
      ffill: "A sequential imputation method that fills missing categorical values using the previous valid category. Missing entries are replaced with the last observed category in sequence. Commonly used for ordered or time-dependent categorical data.",
      bfill: "A sequential imputation method that fills missing categorical values using the next valid category. Missing entries are replaced with the next available category. Useful when future category values are more reliable or consistent."
    },
    timeseries: {
      mode: "A statistical imputation method that replaces missing values with the most frequently occurring value in the time series. Missing values are filled using the value that appears most often in the data. This method is useful when the time series has repeating or stable patterns.",
      constant: "A rule-based imputation method that replaces missing time series values with a predefined constant. A fixed value (such as 0 or a domain-specific number) is used to fill gaps. This helps maintain continuity and clearly marks missing observations.",
      ffill: "A sequential imputation method that propagates the last observed value forward in time. Missing values are replaced with the most recent known value. Commonly used when values are expected to change gradually over time.",
      bfill: "A sequential imputation method that fills missing values using the next observed value. Missing values are replaced with the next available data point in the series. Useful when future values are more reliable than earlier ones."
    }
  };

  const outlierMethods = [
    {
      value: 'zscore',
      label: 'Z-Score',
      description: 'A statistical method that identifies outliers based on how far a data point deviates from the mean in terms of standard deviation. Values with very high or low Z-scores are considered outliers. Best suited for data that follows a normal distribution.'
    },
    {
      value: 'modified_zscore',
      label: 'Modified Z-Score',
      description: 'A robust version of Z-score that uses the median and median absolute deviation (MAD). It reduces the impact of extreme values. More reliable than standard Z-score for skewed data.'
    },
    {
      value: 'iqr',
      label: 'IQR',
      description: 'A statistical method that identifies outliers using the range between the first and third quartiles. Values falling far below or above this range are treated as outliers. Commonly used for non-normal data distributions.'
    },
    {
      value: 'isolation_forest',
      label: 'Isolation Forest',
      description: 'A tree-based anomaly detection algorithm that isolates outliers by randomly partitioning data. Outliers are detected because they require fewer splits to isolate. Effective for large and high-dimensional datasets.'
    },
    {
      value: 'lof',
      label: 'LOF',
      description: 'A density-based method that detects outliers by comparing local data density. Points with significantly lower density than their neighbors are flagged as outliers. Captures local anomalies effectively.'
    },
    {
      value: 'one_class_svm',
      label: 'One Class SVM',
      description: 'A machine learning algorithm that learns the boundary of normal data. Data points falling outside the learned boundary are treated as outliers. Useful when only normal data is available for training.'
    },
    {
      value: 'elliptic_envelope',
      label: 'Elliptic Envelope',
      description: 'A statistical method that fits an elliptical boundary around normal data points. Observations outside the ellipse are considered outliers. Works best when data follows a Gaussian distribution.'
    },
    {
      value: 'dbscan',
      label: 'DBSCAN',
      description: 'A density-based clustering algorithm that identifies noise points as outliers. Points not belonging to any dense cluster are labeled as outliers. Effective for detecting clusters of arbitrary shape.'
    }
  ];

  useEffect(() => {
    if ((mode === 'view' || mode === 'edit') && workflowState?.dataPreprocessing?.step2?.config) {
      const config = workflowState.dataPreprocessing.step2.config;

      const newToggles = {
        dropLowValue: config.drop_high_uniqueness_active || false,
        handleMissing: config.drop_high_null_active || false,
        createBasic: config.feature_creation_active || false,
        detectOutliers: config.outlier_detection_active || false,
      };
      setToggles(newToggles);

      if (config.columns_to_drop_manually && config.columns_to_drop_manually.length > 0) {
        const newSelectedColumns = {};
        config.columns_to_drop_manually.forEach(columnName => {
          const columnIndex = columns.findIndex(col => col.name === columnName);
          if (columnIndex !== -1) {
            newSelectedColumns[`${columnName}-${columnIndex}`] = true;
          }
        });
        setSelectedColumns(newSelectedColumns);
      }

      if (config.null_threshold !== undefined) {
        setThreshold(String(Math.round(config.null_threshold * 100)));
      }

      if (config.imputation_strategy_by_type) {
        if (config.imputation_strategy_by_type.numeric) {
          setNumericalImputation(config.imputation_strategy_by_type.numeric);
        }
        if (config.imputation_strategy_by_type.categorical) {
          setCategoricalImputation(config.imputation_strategy_by_type.categorical);
        }
        if (config.imputation_strategy_by_type.datetime) {
          setTimeSeriesImputation(config.imputation_strategy_by_type.datetime);
        }
      }

      if (config.imputation_strategy_by_column && Object.keys(config.imputation_strategy_by_column).length > 0) {
        const overrides = Object.entries(config.imputation_strategy_by_column).map(([column, method], index) => ({
          id: Date.now() + index,
          column: column,
          method: method
        }));
        setColumnOverrides(overrides);
      }

      if (config.math_ops && config.math_ops.length > 0) {
        const features = config.math_ops.map((op, index) => ({
          id: Date.now() + index,
          column1: op.col1 || '',
          column2: op.col2 || '',
          operator: op.operation === 'add' ? '+' :
            op.operation === 'subtract' ? '-' :
              op.operation === 'multiply' ? '*' :
                op.operation === 'divide' ? '/' :
                  op.operation === 'modulo' ? '%' : '+',
          newColumnName: op.new_col || ''
        }));
        setBasicFeatures(features);
      }

      if (config.outlier_detection_method) {
        setOutlierMethod(config.outlier_detection_method);
      }

      if (config.drop_high_null_active) {
        setDropColumnsEnabled(true);
        setImputationEnabled(true);
      }
    }
  }, [mode, workflowState?.dataPreprocessing?.step2?.config]);

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
      const hasDropConfig = threshold && threshold.trim() !== '';
      const hasImputationMethod = numericalImputation || categoricalImputation || timeSeriesImputation;

      if (hasDropConfig) {
        const thresholdValue = parseFloat(threshold);
        if (isNaN(thresholdValue) || thresholdValue < 1 || thresholdValue > 100) {
          errors.handleMissing = 'Threshold must be between 1 and 100';
          isValid = false;
        }
      }

      if (!hasDropConfig && !hasImputationMethod) {
        errors.handleMissing = 'Please configure at least one method: set a threshold for dropping columns or select an imputation method';
        isValid = false;
      }

      if (imputationWarnings.numerical || imputationWarnings.categorical || imputationWarnings.datetime) {
        errors.handleMissing = 'Please configure all required imputation methods for columns with missing values';
        isValid = false;
      }
    }

    const missingNumeric = workflowState?.dataPreprocessing?.step1?.apiResponse?.missing_numeric_column || {};
    const missingCategorical = workflowState?.dataPreprocessing?.step1?.apiResponse?.missing_categorical_column || {};
    const missingDatetime = workflowState?.dataPreprocessing?.step1?.apiResponse?.missing_datetime_column || {};

    const columnsToDropManually = Object.entries(selectedColumns)
      .filter(([_, isSelected]) => isSelected)
      .map(([key]) => {
        const columnName = key.substring(0, key.lastIndexOf('-'));
        return columnName;
      });

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
        errors.handleMissing = 'Handle Missing Values must be enabled as there are columns with missing values';
        isValid = false;
      } else {
        if (hasNumericMissing && !numericalImputation) {
          isValid = false;
        }
        if (hasCategoricalMissing && !categoricalImputation) {
          isValid = false;
        }
        if (hasDatetimeMissing && !timeSeriesImputation) {
          isValid = false;
        }
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

    if (key === 'handleMissing') {
      const hasMissingValues = checkHasMissingValues();

      if (hasMissingValues && toggles.handleMissing) {
        toast.error('Handle Missing Values cannot be disabled as there are columns with missing values that need to be addressed.', {
          duration: 4000,
          position: 'top-right',
        });
        return;
      }
    }

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

  const ToggleSwitch = ({ checked, onChange, disabled }) => (
    <label className={`relative inline-flex items-center ${readonly || disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={readonly || disabled}
        className="sr-only peer"
      />
      <div className={`w-11 h-6 ${disabled ? 'bg-gray-200' : 'bg-gray-300'} peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${disabled ? 'peer-checked:bg-[#a899c9]' : 'peer-checked:bg-[#8e78b7]'}`}></div>
    </label>
  );

  const selectedCount = Object.values(selectedColumns).filter(Boolean).length;
  const totalFields = columns.length;

  const highCardinalityDropped = workflowState?.dataPreprocessing?.step1?.apiResponse?.high_cardinality_columns_dropped || [];

  const checkHasMissingValues = () => {
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

    return hasNumericMissing || hasCategoricalMissing || hasDatetimeMissing;
  };

  useEffect(() => {
    const hasMissingValues = checkHasMissingValues();

    if (hasMissingValues && !toggles.handleMissing) {
      setToggles(prev => ({
        ...prev,
        handleMissing: true
      }));
      setExpandedSections(prev => ({
        ...prev,
        handleMissing: true
      }));

      setDropColumnsEnabled(true);
      setImputationEnabled(true);
      if (!threshold || threshold === '') {
        setThreshold('70');
      }
    }
  }, [selectedColumns, workflowState?.dataPreprocessing?.step1?.apiResponse]);

  useEffect(() => {
    const { hasAny } = checkHasMissingValues();

    if (hasAny && !toggles.handleMissing) {
      setToggles(prev => ({
        ...prev,
        handleMissing: true
      }));
      setExpandedSections(prev => ({
        ...prev,
        handleMissing: true
      }));

      setDropColumnsEnabled(true);
      setImputationEnabled(true);
      if (!threshold || threshold === '') {
        setThreshold('70');
      }
    }
  }, [selectedColumns, workflowState?.dataPreprocessing?.step1?.apiResponse]);

  // Add the imputationWarnings useEffect
  useEffect(() => {
    if (toggles.handleMissing) {
      const { hasNumericMissing, hasCategoricalMissing, hasDatetimeMissing } = checkHasMissingValues();

      setImputationWarnings({
        numerical: hasNumericMissing && !numericalImputation,
        categorical: hasCategoricalMissing && !categoricalImputation,
        datetime: hasDatetimeMissing && !timeSeriesImputation
      });
    } else {
      setImputationWarnings({
        numerical: false,
        categorical: false,
        datetime: false
      });
    }
  }, [toggles.handleMissing, selectedColumns, numericalImputation, categoricalImputation, timeSeriesImputation, workflowState?.dataPreprocessing?.step1?.apiResponse]);

  const SearchableDropdown = ({
    value,
    onChange,
    options,
    placeholder,
    disabled,
    label,
    searchValue,
    setSearchValue,
    showDropdown,
    setShowDropdown,
    type
  }) => {
    const dropdownRef = React.useRef(null);
    const [hoveredOption, setHoveredOption] = useState(null);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setShowDropdown(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [setShowDropdown]);

    const filteredOptions = options.filter(option =>
      option.toLowerCase().includes(searchValue.toLowerCase())
    );

    const displayValue = value || placeholder;

    return (
      <div className="relative" ref={dropdownRef}>
        <label className="block text-sm text-gray-600 mb-2">{label}</label>
        <div
          onClick={() => !disabled && setShowDropdown(!showDropdown)}
          className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-[#8e78b7]'
            } ${value ? 'text-gray-700' : 'text-gray-400'}`}
        >
          {displayValue}
        </div>

        {showDropdown && !disabled && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-visible">
            <div className="p-2 border-b border-gray-200">
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search methods..."
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent"
                autoFocus
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              />
            </div>
            <div className="overflow-y-auto max-h-48 overflow-x-visible">
              <div
                onClick={() => {
                  onChange('');
                  setSearchValue('');
                  setShowDropdown(false);
                }}
                className="px-3 py-2 text-sm text-gray-400 hover:bg-gray-50 cursor-pointer"
              >
                {placeholder}
              </div>
              {filteredOptions.length > 0 ? (
                filteredOptions.map(option => (
                  <div
                    key={option}
                    className="relative group"
                    onMouseEnter={() => setHoveredOption(option)}
                    onMouseLeave={() => setHoveredOption(null)}
                  >
                    <div
                      onClick={() => {
                        onChange(option);
                        setSearchValue('');
                        setShowDropdown(false);
                      }}
                      className={`px-3 py-2 text-sm cursor-pointer hover:bg-purple-50 ${value === option ? 'bg-purple-50 text-[#8e78b7] font-medium' : 'text-gray-700'
                        }`}
                    >
                      {option}
                    </div>
                    {hoveredOption === option && imputationMethodDescriptions[type]?.[option] && (
                      <div className="fixed z-[9999] w-96 p-4 bg-gray-900 text-white text-xs leading-relaxed rounded-lg shadow-2xl pointer-events-none"
                        style={{
                          ...((() => {
                            const rect = dropdownRef.current?.getBoundingClientRect();
                            const spaceOnRight = window.innerWidth - (rect?.right || 0);
                            const tooltipWidth = 384;

                            if (spaceOnRight < tooltipWidth + 20) {
                              return {
                                right: `${window.innerWidth - (rect?.left || 0) + 10}px`,
                                top: `${rect?.top || 0}px`
                              };
                            }

                            return {
                              left: `${(rect?.right || 0) + 10}px`,
                              top: `${rect?.top || 0}px`
                            };
                          })()),
                          maxWidth: 'calc(100vw - 20px)'
                        }}
                      >
                        <div className="font-semibold mb-1 text-sm capitalize">{option}</div>
                        {imputationMethodDescriptions[type]?.[option]}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-gray-400 text-center">
                  No methods found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };


  return (
    <div className="space-y-4">
      {highCardinalityDropped.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-900">
                <span className="font-medium">
                  {highCardinalityDropped.map(item => item.column).join(', ')}
                </span>
                {' '}column{highCardinalityDropped.length > 1 ? 's are' : ' is'} dropped since {highCardinalityDropped.length > 1 ? 'they have' : 'it has'} more than 30 unique values
              </p>
            </div>
          </div>
        </div>
      )}
      {workflowState?.dataPreprocessing?.step1?.config?.toggles?.uniquenessRatio && (
        <div className="bg-gray-50 rounded-lg border border-gray-200">
          <div className="p-4 flex items-center justify-between">
            <div className="flex-1 flex items-center gap-2">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Drop Low-Value Columns</h4>
                {/* <p className="text-xs text-gray-500 mt-1">Remove columns with zero or excessively high uniqueness.</p> */}
              </div>
              <InfoButton sectionDescriptions={sectionDescriptions} section="dropLowValue" />
            </div>
            <div className="flex items-center gap-3">
              <ToggleSwitch checked={toggles.dropLowValue} onChange={() => toggleSwitch('dropLowValue')} />
              {toggles.dropLowValue && (
                <button onClick={() => toggleSection('dropLowValue')} className="text-gray-400 hover:text-gray-600">
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
          <div className="flex-1 flex items-center gap-2">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Handle Missing Values</h4>
              {/* <p className="text-xs text-gray-500 mt-1">Fix missing entries using dropping or imputation techniques.</p> */}
            </div>
            <InfoButton sectionDescriptions={sectionDescriptions} section="handleMissing" />
          </div>
          <div className="flex items-center gap-3">
            <ToggleSwitch
              checked={toggles.handleMissing}
              onChange={() => toggleSwitch('handleMissing')}
              disabled={checkHasMissingValues()}
            />
            {toggles.handleMissing && (
              <button onClick={() => toggleSection('handleMissing')} className="text-gray-400 hover:text-gray-600">
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
                  <div className="flex-1 flex items-center gap-2">
                    <div>
                      <h5 className="text-sm font-medium text-gray-900">Drop Columns</h5>
                      {/* <p className="text-xs text-gray-500 mt-1">Remove columns exceeding missing value threshold</p> */}
                    </div>
                    <InfoButton sectionDescriptions={sectionDescriptions} section="dropColumns" />
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
                  <div className="flex-1 flex items-center gap-2">
                    <div>
                      <h5 className="text-sm font-medium text-gray-900">Imputation</h5>
                      {/* <p className="text-xs text-gray-500 mt-1">Fill missing values using statistical methods</p> */}
                    </div>
                    <InfoButton sectionDescriptions={sectionDescriptions} section="imputation" />
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  <div className="grid grid-cols-3 gap-4">
                    <SearchableDropdown
                      value={numericalImputation}
                      onChange={(value) => !readonly && setNumericalImputation(value)}
                      options={numericalImputationMethods}
                      placeholder="Select"
                      disabled={readonly}
                      label="Numerical Imputation"
                      searchValue={searchNumerical}
                      setSearchValue={setSearchNumerical}
                      showDropdown={showNumericalDropdown}
                      setShowDropdown={setShowNumericalDropdown}
                      type="numerical"
                    />

                    <SearchableDropdown
                      value={categoricalImputation}
                      onChange={(value) => !readonly && setCategoricalImputation(value)}
                      options={categoricalImputationMethods}
                      placeholder="Select"
                      disabled={readonly}
                      label="Categorical Imputation"
                      searchValue={searchCategorical}
                      setSearchValue={setSearchCategorical}
                      showDropdown={showCategoricalDropdown}
                      setShowDropdown={setShowCategoricalDropdown}
                      type="categorical"
                    />

                    <SearchableDropdown
                      value={timeSeriesImputation}
                      onChange={(value) => !readonly && setTimeSeriesImputation(value)}
                      options={timeSeriesImputationMethods}
                      placeholder="Select"
                      disabled={readonly}
                      label="Time Series"
                      searchValue={searchTimeSeries}
                      setSearchValue={setSearchTimeSeries}
                      showDropdown={showTimeSeriesDropdown}
                      setShowDropdown={setShowTimeSeriesDropdown}
                      type="timeseries"
                    />
                  </div>

                  {/* Validation warnings */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      {(() => {
                        const columnsToDropManually = Object.entries(selectedColumns)
                          .filter(([_, isSelected]) => isSelected)
                          .map(([key]) => key.substring(0, key.lastIndexOf('-')));

                        const missingNumeric = workflowState?.dataPreprocessing?.step1?.apiResponse?.missing_numeric_column || {};
                        const numericColumnsWithMissing = Object.entries(missingNumeric)
                          .filter(([col, val]) => val === 1 && !columnsToDropManually.includes(col))
                          .map(([col]) => col);

                        if (numericColumnsWithMissing.length > 0 && !numericalImputation) {
                          return (
                            <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded">
                              <AlertCircle size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-amber-800">
                                Required: Numerical columns have missing values
                              </p>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    <div>
                      {(() => {
                        const columnsToDropManually = Object.entries(selectedColumns)
                          .filter(([_, isSelected]) => isSelected)
                          .map(([key]) => key.substring(0, key.lastIndexOf('-')));

                        const missingCategorical = workflowState?.dataPreprocessing?.step1?.apiResponse?.missing_categorical_column || {};
                        const categoricalColumnsWithMissing = Object.entries(missingCategorical)
                          .filter(([col, val]) => val === 1 && !columnsToDropManually.includes(col))
                          .map(([col]) => col);

                        if (categoricalColumnsWithMissing.length > 0 && !categoricalImputation) {
                          return (
                            <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded">
                              <AlertCircle size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-amber-800">
                                Required: Categorical columns have missing values
                              </p>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    <div>
                      {(() => {
                        const columnsToDropManually = Object.entries(selectedColumns)
                          .filter(([_, isSelected]) => isSelected)
                          .map(([key]) => key.substring(0, key.lastIndexOf('-')));

                        const missingDatetime = workflowState?.dataPreprocessing?.step1?.apiResponse?.missing_datetime_column || {};
                        const datetimeColumnsWithMissing = Object.entries(missingDatetime)
                          .filter(([col, val]) => val === 1 && !columnsToDropManually.includes(col))
                          .map(([col]) => col);

                        if (datetimeColumnsWithMissing.length > 0 && !timeSeriesImputation) {
                          return (
                            <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded">
                              <AlertCircle size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-amber-800">
                                Required: Datetime columns have missing values
                              </p>
                            </div>
                          );
                        }
                        return null;
                      })()}
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
          <div className="flex-1 flex items-center gap-2">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Create Basic Features</h4>
              {/* <p className="text-xs text-gray-500 mt-1">Add new domain features for enhanced model performance.</p> */}
            </div>
            <InfoButton sectionDescriptions={sectionDescriptions} section="createBasic" />
          </div>
          <div className="flex items-center gap-3">
            <ToggleSwitch checked={toggles.createBasic} onChange={() => toggleSwitch('createBasic')} />
            {toggles.createBasic && (
              <button onClick={() => toggleSection('createBasic')} className="text-gray-400 hover:text-gray-600">
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
          <div className="flex-1 flex items-center gap-2">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Detect Outliers</h4>
              {/* <p className="text-xs text-gray-500 mt-1">Find and handle outliers in numerical fields.</p> */}
            </div>
            <InfoButton sectionDescriptions={sectionDescriptions} section="detectOutliers" />
          </div>
          <div className="flex items-center gap-3">
            <ToggleSwitch checked={toggles.detectOutliers} onChange={() => toggleSwitch('detectOutliers')} />
            {toggles.detectOutliers && (
              <button onClick={() => toggleSection('detectOutliers')} className="text-gray-400 hover:text-gray-600">
                {expandedSections.detectOutliers ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            )}
          </div>
        </div>

        {toggles.detectOutliers && expandedSections.detectOutliers && (
          <div className="px-4 pb-4 border-t border-gray-100">
            <div className="mt-4 mb-20 grid grid-cols-2 gap-3">
              {outlierMethods.map(method => (
                <div
                  key={method.value}
                  className="relative"
                >
                  <label
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${outlierMethod === method.value
                      ? 'border-[#8e78b7] bg-purple-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                      } ${readonly ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                    onMouseEnter={() => setHoveredOutlier(method.value)}
                    onMouseLeave={() => setHoveredOutlier(null)}
                  >
                    <input
                      type="radio"
                      name="outlierMethod"
                      value={method.value}
                      checked={outlierMethod === method.value}
                      onChange={(e) => !readonly && setOutlierMethod(e.target.value)}
                      disabled={readonly}
                      className="w-4 h-4 text-[#8e78b7] border-gray-300 focus:ring-[#8e78b7]"
                    />
                    <span className={`text-sm font-medium ${outlierMethod === method.value ? 'text-[#8e78b7]' : 'text-gray-700'
                      }`}>
                      {method.label}
                    </span>
                  </label>

                  {hoveredOutlier === method.value && (
                    <div className="absolute left-0 top-full mt-2 z-50 w-80 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
                      <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                      {method.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FeatureSelection;