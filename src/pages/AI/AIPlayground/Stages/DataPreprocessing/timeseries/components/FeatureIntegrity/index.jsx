import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

import { featureIntegrity as apiFeatureIntegrity } from '../../../../../../../../hooks/AI/datapreprocessing/timeseries';
import { useAIPlayground } from '../../../../../../../../context/AIPlaygroundContext';
import HighUniqunessDrop from './HighUniquenessDrop';
import OutlierDetection from './OutlierDetection';
import LowVarianceDroppedNotification from './LowVarianceDroppedNotification';
import { univariateOutlierDetectionMethods,multivariateOutlierDetectionMethods,} from '../../../../../../../../hooks/AI/datapreprocessing/descriptions';


function FeatureIntegrity({ readonly: readonlyProp, onApiCall ,predictionType,}) {
  const { workflowsState, activeWorkflowId, updatePreprocessingStep, datasetState, mode } = useAIPlayground();

  const readonly = readonlyProp || mode === 'view';
  const workflowState = activeWorkflowId ? workflowsState[activeWorkflowId] : null;
  const currentWorkflowId = workflowState?.workflow_id || activeWorkflowId;

  const columnAndUniqueness = 
    workflowState?.dataPreprocessing?.step2?.apiResponse?.uniqueness_ratio_report?.map((item) => ({
      name: item.column,
      uniqueness: `${(item.uniqueness_ratio * 100).toFixed(2)}%`,
    })) || [];

  const lowVarianceColumnsDropped =workflowState?.dataPreprocessing?.step2?.apiResponse?.low_variance_columns_dropped || [];
  const isUnivariateTimeseries = predictionType === 'univariate_timeseries';
  // outlier methods rendered depend on prediction type
  const availableOutlierOptions = isUnivariateTimeseries? univariateOutlierDetectionMethods: multivariateOutlierDetectionMethods;
  const [expandedSections, setExpandedSections] = useState({ dropLowValue: false, detectOutliers: false });
  const [toggles, setToggles] = useState({ dropLowValue: false, detectOutliers: false });
  const [selectedColumns, setSelectedColumns] = useState({});
  const [selectAll, setSelectAll] = useState(false);
  const [showFieldErrors, setShowFieldErrors] = useState(false);
  const [outlierConfig, setOutlierConfig] = useState({ method: '',rollingWindow: '',seasonalPeriod: '',});
  const rollingWindowMethods = ['rolling_median_iqr','rolling_mean_sigma',];
  const seasonalPeriodMethods = ['stl_mad','seasonal_decomp_residuals',];

  useEffect(() => {
  if (
    (mode === 'view' || mode === 'edit') &&
    workflowState?.dataPreprocessing?.step2?.config
  ) {
    const config = workflowState.dataPreprocessing.step2.config;
    setToggles({
      dropLowValue:config.dropColumnsActive || false,
      detectOutliers: config.outlierDetectionActive || false,
    });
    setOutlierConfig({
      method:config.outlierDetectionMethod || '',
      rollingWindow:config.outlierRollingWindow || '',
      seasonalPeriod:config.outlierSeasonPeriod || '',
    });
    if (
      config.columnsToDrop &&
      config.columnsToDrop.length > 0
    ) {
      const newSelected = {};
      config.columnsToDrop.forEach((columnName, idx) => {
        newSelected[`${columnName}-${idx}`] = true;
      });
      setSelectedColumns(newSelected);
    }
    setExpandedSections({
      dropLowValue:
        config.dropColumnsActive || false,
      detectOutliers:
        config.outlierDetectionActive || false,
    });
  }}, [mode,workflowState?.dataPreprocessing?.step3?.config,]);

  const getDropLowValueError = () => {
    if (!toggles.dropLowValue) return '';
    if (Object.values(selectedColumns).filter(Boolean).length === 0) return 'Please select at least one column.';
    return '';
  };
  const dropLowValueError = showFieldErrors ? getDropLowValueError() : '';
  const validateStep = () => {
  if (getDropLowValueError()) return false;
  if (
    toggles.detectOutliers &&
    (
      !outlierConfig.method ||
      rollingWindowError ||
      seasonalPeriodError
    )
  ) {
    return false;
  }
  return true;
};
  const methodError =showFieldErrors &&toggles.detectOutliers &&!outlierConfig.method? 'Please select an outlier detection method': '';
  const rollingWindowError =
  showFieldErrors &&
  toggles.detectOutliers &&
  rollingWindowMethods.includes(outlierConfig.method) &&
  (
    !Number(outlierConfig.rollingWindow) ||
    Number(outlierConfig.rollingWindow) < 3 ||
    Number(outlierConfig.rollingWindow) > 365
  )
    ? 'Value must be between 3 and 365'
    : '';

  const seasonalPeriodError =
  showFieldErrors &&
  toggles.detectOutliers &&
  seasonalPeriodMethods.includes(outlierConfig.method) &&
  (
    !Number(outlierConfig.seasonalPeriod) ||
    Number(outlierConfig.seasonalPeriod) < 2 ||
    Number(outlierConfig.seasonalPeriod) > 365
  )
    ? 'Value must be between 2 and 365'
    : '';  

  useEffect(() => {
  if (!showFieldErrors) return;

  const outlierError =
    toggles.detectOutliers &&
    (
      !outlierConfig.method ||
      rollingWindowError ||
      seasonalPeriodError
    );

  if (!outlierError) {
    setShowFieldErrors(false);
  }
}, [outlierConfig,toggles,showFieldErrors,rollingWindowError, seasonalPeriodError,]);  
  const makeApiCall = async () => {
    if (readonly) return true;
    const isValid = validateStep();
    if (!isValid) {
      setShowFieldErrors(true);
      setExpandedSections({
  dropLowValue: !!getDropLowValueError(),
  detectOutliers:
    toggles.detectOutliers &&
    (
      !outlierConfig.method ||
      rollingWindowError ||
      seasonalPeriodError
    ),
});
      return false;
    }

    try {
      const columnsToDropManually = Object.entries(selectedColumns).filter(([_, v]) => v).map(([key]) => key.substring(0, key.lastIndexOf('-')));

      const params = {
        ensembleId: datasetState?.ensembleId,
        workflowId: currentWorkflowId,
        dropColumnsActive: toggles.dropLowValue,
        columnsToDrop: columnsToDropManually,
        outlierDetectionActive: toggles.detectOutliers,
        outlierDetectionMethod: outlierConfig.method,
        outlierRollingWindow:Number(outlierConfig.rollingWindow) || 7,
        outlierSeasonPeriod:Number(outlierConfig.seasonalPeriod) || 7,
        outlierThreshold: 3,
      };

      if (!params.ensembleId || !params.workflowId) {
        toast.error('Missing ensemble or workflow id', { duration: 4000, position: 'top-right' });
        return false;
      }

      const apiResponse = await apiFeatureIntegrity(params);
      updatePreprocessingStep('step3', { config: params, apiResponse });
      toast.success('Feature integrity check completed!', { duration: 3000, position: 'top-right' });
      return true;
    } catch (error) {
      console.error('FeatureIntegrity API failed:', error);
      toast.error('Failed to process data, please try again', { duration: 4000, position: 'top-right' });
      return false;
    }
  };

  useEffect(() => {
    if (onApiCall) onApiCall(makeApiCall);
  }, [toggles, selectedColumns, datasetState?.ensembleId, currentWorkflowId, outlierConfig]);

  const toggleSection = (section) => {
    setExpandedSections({ dropLowValue: false, [section]: !expandedSections[section] });
  };

  const toggleSwitch = (key) => {
    if (readonly) return;
    const newToggleState = !toggles[key];
    setToggles((prev) => ({ ...prev, [key]: newToggleState }));
    if (newToggleState) setExpandedSections({ dropLowValue: false, [key]: true });
    if (!newToggleState) setExpandedSections((prev) => ({ ...prev, [key]: false }));
  };

  const handleSelectAll = () => {
    if (readonly) return;
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    const newSelectedColumns= {};
    columnAndUniqueness.forEach((col, idx) => {
      newSelectedColumns[`${col.name}-${idx}`] = newSelectAll;
    });
    setSelectedColumns(newSelectedColumns);
  };

  const handleColumnToggle = (columnKey) => {
    if (readonly) return;
    setSelectedColumns((prev) => ({ ...prev, [columnKey]: !prev[columnKey] }));
  };

  const selectedCount = Object.values(selectedColumns).filter(Boolean).length;
  const totalFields = columnAndUniqueness.length;

  return (
    <div className="space-y-4">
      <LowVarianceDroppedNotification
        droppedColumns={lowVarianceColumnsDropped}
      />
      {!isUnivariateTimeseries && (
      <HighUniqunessDrop
        columns={columnAndUniqueness}
        toggles={toggles}
        toggleSwitch={toggleSwitch}
        expandedSections={expandedSections}
        toggleSection={toggleSection}
        selectedColumns={selectedColumns}
        handleColumnToggle={handleColumnToggle}
        selectAll={selectAll}
        handleSelectAll={handleSelectAll}
        dropLowValueError={dropLowValueError}
        readonly={readonly}
        totalFields={totalFields}
        selectedCount={selectedCount}
      />
      )}

      <OutlierDetection
      isToggled={toggles.detectOutliers}
      isExpanded={expandedSections.detectOutliers}
      onToggle={() => toggleSwitch('detectOutliers')}
      onExpand={() => toggleSection('detectOutliers')}
      readonly={readonly}
      outlierConfig={outlierConfig}
      setOutlierConfig={setOutlierConfig}
      availableOutlierOptions={availableOutlierOptions}
      methodError={methodError}
      rollingWindowError={rollingWindowError}
      seasonalPeriodError={seasonalPeriodError}
      hasError={
        !!methodError ||
        !!rollingWindowError ||
        !!seasonalPeriodError
      }
     />
    </div>
  );
}

export default FeatureIntegrity;