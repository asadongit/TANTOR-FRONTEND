import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';

import { handleMissingValues } from '../../../../../../../../hooks/AI/datapreprocessing/timeseries';
import { useAIPlayground } from '../../../../../../../../context/AIPlaygroundContext';

import HandleOriginalMissingValues from './HandleOriginalMissingValues';
import HandleGeneratedMissingValues from './HandleGeneratedMissingValues';

function HandleMissingValues({
  readonly: readonlyProp,
  onValidationChange,
  onApiCall,
  predictionType,
}) {

  const {
    workflowsState,
    activeWorkflowId,
    updatePreprocessingStep,
    datasetState,
    mode,
  } = useAIPlayground();

  // Disable original missing values handling for univariate timeseries
  const isUnivariateTimeseries = predictionType === 'univariate_timeseries';

  const readonly = readonlyProp || mode === 'view';

  const workflowState = activeWorkflowId
    ? workflowsState[activeWorkflowId]
    : null;

  const currentWorkflowId =
    workflowState?.workflow_id || activeWorkflowId;

  // Step data for the original missing-values card.

  const missingOriginalNumericColumns =
    workflowState?.dataPreprocessing?.step1?.apiResponse?.missing_numeric_column_original || {};

  const missingOriginalCategoricalColumns =
    workflowState?.dataPreprocessing?.step1?.apiResponse?.missing_categorical_column_original || {};

  const missingOriginalDatetimeColumns =
    workflowState?.dataPreprocessing?.step1?.apiResponse?.missing_datetime_column_original || {};

  // Flags that determine whether original dataset columns still have missing values.

  const hasNumericMissing = Object.entries(
    missingOriginalNumericColumns
  ).some(([_, val]) => val === 1);

  const hasCategoricalMissing = Object.entries(
    missingOriginalCategoricalColumns
  ).some(([_, val]) => val === 1);

  const hasDatetimeMissing = Object.entries(
    missingOriginalDatetimeColumns
  ).some(([_, val]) => val === 1);

  const hasAnyOriginalMissing =
    hasNumericMissing ||
    hasCategoricalMissing ||
    hasDatetimeMissing;

  // Step data for the generated missing-values card.

  const numericColumns = workflowState?.dataPreprocessing?.step1?.apiResponse?.numerical_columns || [];

  const categoricalColumns = workflowState?.dataPreprocessing?.step1?.apiResponse?.categorical_columns || [];

  const datetimeColumns = workflowState?.dataPreprocessing?.step1?.apiResponse?.datetime_columns || [];

  // Number of generated rows returned by the previous preprocessing step.

  const generatedFeatureCount = workflowState?.dataPreprocessing?.step1?.apiResponse?.rows_inserted || 0;

  // Flags that determine whether generated columns need missing-value handling.

  const hasGeneratedMissingNumerical = generatedFeatureCount > 0 && numericColumns.length > 0;

  const hasGeneratedMissingCategorical = generatedFeatureCount > 0 && categoricalColumns.length > 0;  

  const hasGeneratedMissingDatetime = generatedFeatureCount > 0 && datetimeColumns.length > 0;


  const hasAnyGeneratedMissing =
  hasGeneratedMissingNumerical ||
  hasGeneratedMissingCategorical ||
  hasGeneratedMissingDatetime;



  // Local UI state for the step cards and dropdown controls.

  const [toggles, setToggles] = useState({
  handleOriginalMissing: isUnivariateTimeseries ? false : hasAnyOriginalMissing,
  handleGeneratedMissing: hasAnyGeneratedMissing,
});

  const [originalMissingConfig, setOriginalMissingConfig] = useState({
    numeric: '',
    categorical: '',
    datetime: '',
    polynomialDegree: '',
    seasonalPeriod: '',
    splineOrder: '',
  });

  const [generatedMissingConfig, setGeneratedMissingConfig] = useState({
    numeric: '',
    categorical: '',
    datetime: '',
    rollingWindow: '',
    seasonalPeriod: '',
  });

  const [searchValues, setSearchValues] = useState({
    originalNumeric: '',
    originalCategorical: '',
    originalDatetime: '',
  });
  const [showDropdowns, setShowDropdowns] = useState({
    originalNumeric: false,
    originalCategorical: false,
    originalDatetime: false,
  });

  const [expandedSections, setExpandedSections] = useState({
    handleOriginalMissing: true,
    handleGeneratedMissing: false,
  });

  const [showFieldErrors, setShowFieldErrors] = useState(false);

  // Restore the saved step configuration from workflow state.
  useEffect(() => {
  const savedConfig =
    workflowState?.dataPreprocessing?.step3?.config;
  if (savedConfig) {
    setToggles({
      handleOriginalMissing: isUnivariateTimeseries ? false : (savedConfig.original_missing_value_active || false),
      handleGeneratedMissing:savedConfig.generated_missing_value_active || false, });

    setOriginalMissingConfig({
      numeric:savedConfig.original_missing_value_numeric_method || '',
      categorical: savedConfig.original_missing_value_categorical_method || '',
      datetime: savedConfig.original_missing_value_datetime_method || '',
      polynomialDegree: savedConfig.original_missing_value_polynomial_degree || '', 
      splineOrder: savedConfig.original_missing_value_spline_order || '', 
      seasonalPeriod: savedConfig.original_missing_value_seasonal_period || '',
    }); 

    setGeneratedMissingConfig({
      numeric:savedConfig.generated_missing_value_numeric_method || '',
      categorical:savedConfig.generated_missing_value_categorical_method || '',
      datetime: savedConfig.generated_missing_value_datetime_method || '',
      rollingWindow: savedConfig.generated_missing_value_rolling_window ?? '',
      seasonalPeriod: savedConfig.generated_missing_value_seasonal_period ?? '', }); }
}, [mode, workflowState?.dataPreprocessing?.step3?.config, isUnivariateTimeseries]);

  // Ensure original missing values toggle stays off for univariate timeseries
  useEffect(() => {
    if (isUnivariateTimeseries && toggles.handleOriginalMissing) {
      setToggles(prev => ({
        ...prev,
        handleOriginalMissing: false,
      }));
    }
  }, [isUnivariateTimeseries, toggles.handleOriginalMissing]);

  // Validation helpers for the step's original and generated missing-value selections.

  const getOriginalMissingError = () => {

    if (!hasAnyOriginalMissing) return '';

    if (
      hasNumericMissing &&!originalMissingConfig.numeric
    ) {
      return 'Select numeric imputation method';
    }

    if (
      hasCategoricalMissing &&!originalMissingConfig.categorical
    ) {
      return 'Select categorical imputation method';
    }
    if (
      hasDatetimeMissing &&!originalMissingConfig.datetime
    ) {
      return 'Select datetime imputation method';
    }

    if (hasNumericMissing && originalMissingConfig.numeric === 'polynomial') {
        const polynomialDegree = Number(originalMissingConfig.polynomialDegree);
        if (!Number.isFinite(polynomialDegree) || polynomialDegree < 2|| polynomialDegree > 365) {
          return 'Polynomial degree must be between 2 and 365';
        }
      }

    if (hasNumericMissing && originalMissingConfig.numeric === 'spline') {
        const splineOrder = Number(originalMissingConfig.splineOrder); 
        if (!Number.isFinite(splineOrder) || splineOrder < 3|| splineOrder > 365) {
          return 'Spline order must be between 3 and 365';
        }
    }

    if (hasNumericMissing && originalMissingConfig.numeric === 'mode_by_season') {
        const seasonalPeriod = Number(originalMissingConfig.seasonalPeriod);
        if (!Number.isFinite(seasonalPeriod) || seasonalPeriod < 7 || seasonalPeriod > 365) {
          return 'Seasonal period must be between 7 and 365';
        }
    }

    return '';
  };

  const getGeneratedMissingError = () => {
    if (!toggles.handleGeneratedMissing) return '';

    if (hasGeneratedMissingNumerical && !generatedMissingConfig.numeric) {
      return 'Select numeric imputation method';
    }

    if (hasGeneratedMissingCategorical && !generatedMissingConfig.categorical) {
      return 'Select categorical imputation method';
    }

    if (hasGeneratedMissingDatetime && !generatedMissingConfig.datetime) {
      return 'Select datetime imputation method';
    }

    if (hasGeneratedMissingNumerical && generatedMissingConfig.numeric === 'rolling_mean') {
      const rollingWindow = Number(generatedMissingConfig.rollingWindow);
      if (!Number.isFinite(rollingWindow) || rollingWindow < 3 || rollingWindow > 365) {
        return 'Rolling window must be between 3 and 365';
      }
    }

    if (hasGeneratedMissingNumerical && (generatedMissingConfig.numeric === 'mode_by_season' || generatedMissingConfig.numeric === 'seasonal_mean')) {
      const seasonalPeriod = Number(generatedMissingConfig.seasonalPeriod);
      if (!Number.isFinite(seasonalPeriod) || seasonalPeriod < 7 || seasonalPeriod > 365) {
        return 'Seasonal period must be between 7 and 365';
      }
    }

    if (hasGeneratedMissingCategorical && (generatedMissingConfig.categorical === 'mode_by_season' )) {
      const seasonalPeriod = Number(generatedMissingConfig.seasonalPeriod);
      if (!Number.isFinite(seasonalPeriod) || seasonalPeriod < 7 || seasonalPeriod > 365) {
        return 'Seasonal period must be between 7 and 365';
      }
    }
    

    return '';
  };

  const validateStep = () => {
    return !getOriginalMissingError() && !getGeneratedMissingError();
  };

  const getApiErrorMessage = () => 'Failed to handle missing values, please try again';

 

  // Expand or collapse one of the two subsection cards.
  const toggleSection = (section) => {

    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };
  // Submit the step configuration to the preprocessing API.
  const makeApiCall = useCallback(async () => {
    if (!validateStep()) {
      setShowFieldErrors(true);
      return false;
    }

    try {
      const payload = {
        ensembleId: datasetState?.ensembleId,
        workflowId: currentWorkflowId,
        originalMissingValueActive: hasAnyOriginalMissing,
        originalMissingValueNumericMethod: originalMissingConfig.numeric || 'linear',
        originalMissingValueCategoricalMethod: originalMissingConfig.categorical || 'ffill',
        originalMissingValueDatetimeMethod: originalMissingConfig.datetime || 'ffill',
        generatedMissingValueActive: toggles.handleGeneratedMissing,
        generatedMissingValueNumericMethod: generatedMissingConfig.numeric || 'ffill',
        generatedMissingValueCategoricalMethod: generatedMissingConfig.categorical || 'ffill',
        generatedMissingValueDatetimeMethod: generatedMissingConfig.datetime || 'ffill',
        generatedMissingValueRollingWindow: generatedMissingConfig.rollingWindow || 3,
      };
      const response = await handleMissingValues(payload);
      updatePreprocessingStep('step2', {
        config: payload,
        apiResponse: response,
      });
      onApiCall?.(response);
      return true;
    } catch (error) {
      console.error('Error handling missing values:', error);
      toast.error(getApiErrorMessage(error), {
        duration: 4000,
        position: 'top-right',
      });
      return false;
    }
  }, [
    validateStep,
    datasetState,
    currentWorkflowId,
    originalMissingConfig,
    generatedMissingConfig,
    hasAnyOriginalMissing,
    toggles.handleGeneratedMissing,
    updatePreprocessingStep,
    onApiCall,
  ]);

  useEffect(() => {
    if (onApiCall) onApiCall(makeApiCall);
  }, [makeApiCall, onApiCall]);

  // Persist the current configuration back into workflow state with a small debounce.
  useEffect(() => {
    const timeout = setTimeout(() => {
      updatePreprocessingStep('step3', {
        config: {
          original_missing_value_active: toggles.handleOriginalMissing,
          generated_missing_value_active: toggles.handleGeneratedMissing,
          original_missing_value_numeric_method: originalMissingConfig.numeric,
          original_missing_value_categorical_method: originalMissingConfig.categorical,
          original_missing_value_datetime_method: originalMissingConfig.datetime,
          original_missing_value_polynomial_degree: originalMissingConfig.polynomialDegree,
          original_missing_value_spline_order: originalMissingConfig.splineOrder,
          original_missing_value_seasonal_period: originalMissingConfig.seasonalPeriod,
          generated_missing_value_numeric_method: generatedMissingConfig.numeric,
          generated_missing_value_categorical_method: generatedMissingConfig.categorical,
          generated_missing_value_datetime_method: generatedMissingConfig.datetime,
          generated_missing_value_rolling_window: generatedMissingConfig.rollingWindow,
          generated_missing_value_seasonal_period: generatedMissingConfig.seasonalPeriod,
        },
      });
    }, 500);

    return () => clearTimeout(timeout);
  }, [toggles, originalMissingConfig, generatedMissingConfig, updatePreprocessingStep]);

  // Surface validation feedback only after the user attempts to process the step.
  const originalMissingError = showFieldErrors ? getOriginalMissingError() : '';
  const generatedMissingError = showFieldErrors ? getGeneratedMissingError() : '';

  return (
    <div className="space-y-4 p-4">
      {/* Original missing-values card. */}
      {!isUnivariateTimeseries && (
        <HandleOriginalMissingValues
          readonly={readonly || isUnivariateTimeseries}
          expanded={
            expandedSections.handleOriginalMissing
          }
          toggleSection={() =>
            toggleSection('handleOriginalMissing')
          }
          checked={hasAnyOriginalMissing}
          hasNumericMissing={hasNumericMissing}
          hasCategoricalMissing={
            hasCategoricalMissing
          }
          hasDatetimeMissing={hasDatetimeMissing}
          missingOriginalNumericColumns={
            missingOriginalNumericColumns
          }
          missingOriginalCategoricalColumns={
            missingOriginalCategoricalColumns
          }
          missingOriginalDatetimeColumns={
            missingOriginalDatetimeColumns
          }
          originalMissingConfig={
            originalMissingConfig
          }
          setOriginalMissingConfig={
            setOriginalMissingConfig
          }
          searchValues={searchValues}
          setSearchValues={setSearchValues}
          showDropdowns={showDropdowns}
          setShowDropdowns={setShowDropdowns}
          showFieldErrors={showFieldErrors}
          originalMissingError={
            originalMissingError
          }
      />
      )}
      {/* Generated missing-values card. */}
      <HandleGeneratedMissingValues
        readonly={readonly}
        toggles={toggles}
        setToggles={setToggles}
        generatedMissingConfig={generatedMissingConfig}
        setGeneratedMissingConfig={setGeneratedMissingConfig}
        hasGeneratedMissingNumerical={hasGeneratedMissingNumerical}
        hasGeneratedMissingCategorical={hasGeneratedMissingCategorical}
        hasGeneratedMissingDatetime={hasGeneratedMissingDatetime}
        generatedNumericColumns={numericColumns}
        generatedCategoricalColumns={categoricalColumns}
        generatedDatetimeColumns={datetimeColumns}
        searchValues={searchValues}
        setSearchValues={setSearchValues}
        showDropdowns={showDropdowns}
        setShowDropdowns={setShowDropdowns}
        showFieldErrors={showFieldErrors}
        generatedMissingError={generatedMissingError}
      />
    </div>
  );
}

export default HandleMissingValues;