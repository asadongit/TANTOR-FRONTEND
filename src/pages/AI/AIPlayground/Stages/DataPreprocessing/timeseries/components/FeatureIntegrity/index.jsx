import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

import { featureIntegrity as apiFeatureIntegrity } from '../../../../../../../../hooks/AI/datapreprocessing/timeseries';
import { useAIPlayground } from '../../../../../../../../context/AIPlaygroundContext';
import HighUniqunessDrop from './HighUniquenessDrop';
import OutlierDetection from './OutlierDetection';
import LowVarianceDroppedNotification from './LowVarianceDroppedNotification';
import { featureSelectionDescriptions, outlierMethods as OUTLIER_METHODS } from '../../../../../../../../hooks/AI/datapreprocessing/descriptions';


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

  const lowVarianceColumnsDropped =
    workflowState?.dataPreprocessing?.step2?.apiResponse
      ?.low_variance_columns_dropped || [];
  const isUnivariateTimeseries = predictionType === 'univariate_timeseries';
  const [expandedSections, setExpandedSections] = useState({ dropLowValue: false });
  const [toggles, setToggles] = useState({ dropLowValue: false, detectOutliers: false });
  const [selectedColumns, setSelectedColumns] = useState({});
  const [selectAll, setSelectAll] = useState(false);
  const [showFieldErrors, setShowFieldErrors] = useState(false);
  const [outlierMethod, setOutlierMethod] = useState('zscore');
  const [hoveredOutlier, setHoveredOutlier] = useState(null);

  

  useEffect(() => {
    if ((mode === 'view' || mode === 'edit') && workflowState?.dataPreprocessing?.step2?.config) {
      const config = workflowState.dataPreprocessing.step2.config;
      setToggles((p) => ({ ...p, dropLowValue: config.drop_high_uniqueness_active || false }));
      if (config.columns_to_drop_manually && config.columns_to_drop_manually.length > 0) {
        const newSelected = {};
        config.columns_to_drop_manually.forEach((columnName, idx) => {
          newSelected[`${columnName}-${idx}`] = true;
        });
        setSelectedColumns(newSelected);
      }
    }
  }, [mode, workflowState?.dataPreprocessing?.step2?.config]);

  const getDropLowValueError = () => {
    if (!toggles.dropLowValue) return '';
    if (Object.values(selectedColumns).filter(Boolean).length === 0) return 'Please select at least one column.';
    return '';
  };

  const dropLowValueError = showFieldErrors ? getDropLowValueError() : '';

  const validateStep = () => !getDropLowValueError();

  const makeApiCall = async () => {
    if (readonly) return true;
    const isValid = validateStep();
    if (!isValid) {
      setShowFieldErrors(true);
      setExpandedSections({ dropLowValue: !!getDropLowValueError() });
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
        outlierDetectionMethod: outlierMethod,
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
  }, [toggles, selectedColumns, datasetState?.ensembleId, currentWorkflowId, outlierMethod]);

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
        toggles={toggles}
        toggleSwitch={toggleSwitch}
        expandedSections={expandedSections}
        toggleSection={toggleSection}
        outlierMethod={outlierMethod}
        setOutlierMethod={setOutlierMethod}
        hoveredOutlier={hoveredOutlier}
        setHoveredOutlier={setHoveredOutlier}
        outlierMethods={OUTLIER_METHODS}
        readonly={readonly}
      />
    </div>
  );
}

export default FeatureIntegrity;