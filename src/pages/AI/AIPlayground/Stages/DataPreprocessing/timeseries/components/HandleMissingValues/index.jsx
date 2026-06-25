import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';

import { handleMissingValues } from '../../../../../../../../hooks/AI/datapreprocessing/timeseries';
import { useAIPlayground } from '../../../../../../../../context/AIPlaygroundContext';

import HandleOriginalMissingValues from './HandleOriginalMissingValues';
import HandleGeneratedMissingValues from './HandleGeneratedMissingValues';
import HandleHighMissingValues from './HandleHighMissingValues';
const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};
function HandleMissingValues({
  readonly: readonlyProp,
  onValidationChange,
  onApiCall,
  predictionType,
}) {

  const {workflowsState,activeWorkflowId,updatePreprocessingStep,datasetState,mode,} = useAIPlayground();
  // Disable original missing values handling for univariate timeseries
  const isUnivariateTimeseries = predictionType === 'univariate_timeseries';
  const readonly = readonlyProp || mode === 'view';
  const workflowState = activeWorkflowId? workflowsState[activeWorkflowId]: null;
  const currentWorkflowId =workflowState?.workflow_id || activeWorkflowId;
  // Step data for the original missing-values card.
  const savedConfig =workflowState?.dataPreprocessing?.step2?.config;
  const hasSavedConfig = !!savedConfig;
  const missingOriginalNumericColumns =
    workflowState?.dataPreprocessing?.step1?.apiResponse?.missing_numeric_column_original ||EMPTY_OBJECT;

  const missingOriginalCategoricalColumns =
    workflowState?.dataPreprocessing?.step1?.apiResponse?.missing_categorical_column_original || EMPTY_OBJECT;

  const missingOriginalDatetimeColumns =
    workflowState?.dataPreprocessing?.step1?.apiResponse?.missing_datetime_column_original || EMPTY_OBJECT;

  // Flags that determine whether original dataset columns still have missing values.
  // for original 
  const hasNumericMissing = Object.entries(missingOriginalNumericColumns).some(([_, val]) => val === 1);

  const hasCategoricalMissing = Object.entries( missingOriginalCategoricalColumns).some(([_, val]) => val === 1);
  const hasDatetimeMissing = Object.entries( missingOriginalDatetimeColumns).some(([_, val]) => val === 1);

  const hasAnyOriginalMissing =hasNumericMissing ||hasCategoricalMissing ||hasDatetimeMissing;

  const showNumericMissing =
  hasSavedConfig
    ? !!savedConfig.original_missing_value_numeric_method
    : hasNumericMissing;

const showCategoricalMissing =
  hasSavedConfig
    ? !!savedConfig.original_missing_value_categorical_method
    : hasCategoricalMissing;

const showDatetimeMissing =hasSavedConfig ? !!savedConfig.original_missing_value_datetime_method : hasDatetimeMissing;

const showAnyOriginalMissing =showNumericMissing ||showCategoricalMissing ||showDatetimeMissing;

  // Step data for the generated missing-values card.

  const numericColumns = workflowState?.dataPreprocessing?.step1?.apiResponse?.numerical_columns || EMPTY_ARRAY;

  const categoricalColumns = workflowState?.dataPreprocessing?.step1?.apiResponse?.categorical_columns || EMPTY_ARRAY;
  const datetimeColumns = workflowState?.dataPreprocessing?.step1?.apiResponse?.datetime_columns || EMPTY_ARRAY;
  // Number of generated rows returned by the previous preprocessing step.
  const generatedFeatureCount = workflowState?.dataPreprocessing?.step1?.apiResponse?.rows_inserted || 0;
  // Flags that determine whether generated columns need missing-value handling.
  const hasGeneratedMissingNumerical = generatedFeatureCount > 0 && numericColumns.length > 0;
  const hasGeneratedMissingCategorical = generatedFeatureCount > 0 && categoricalColumns.length > 0;  
  const hasGeneratedMissingDatetime = generatedFeatureCount > 0 && datetimeColumns.length > 0;


  const hasAnyGeneratedMissing =hasGeneratedMissingNumerical ||hasGeneratedMissingCategorical || hasGeneratedMissingDatetime;
  const showGeneratedNumeric =
  hasSavedConfig
    ? !!savedConfig.generated_missing_value_numeric_method
    : hasGeneratedMissingNumerical;

  const showGeneratedCategorical =
    hasSavedConfig
      ? !!savedConfig.generated_missing_value_categorical_method
      : hasGeneratedMissingCategorical;

  const showGeneratedDatetime =
    hasSavedConfig
      ? !!savedConfig.generated_missing_value_datetime_method
      : hasGeneratedMissingDatetime;

  const showAnyGeneratedMissing =
    showGeneratedNumeric ||
    showGeneratedCategorical ||
    showGeneratedDatetime;
  const isGeneratedMissingMandatory = hasAnyGeneratedMissing;
  


  // Local UI state for the step cards and dropdown controls.

const [toggles, setToggles] = useState({
    handleHighMissing:
      savedConfig?.high_missing_value_active ??
      (numericColumns.length > 0),

    handleOriginalMissing:
      savedConfig?.original_missing_value_active ??
      (isUnivariateTimeseries
        ? false
        : hasAnyOriginalMissing),

    handleGeneratedMissing:
      savedConfig?.generated_missing_value_active ??
      hasAnyGeneratedMissing,
  });
const [highMissingConfig, setHighMissingConfig] = useState({
  threshold: 70,
});

  const [originalMissingConfig, setOriginalMissingConfig] = useState({
    numeric: '',
    categorical: '',
    datetime: '',
    polynomialDegree: '',
   categoricalSeasonalOriginalPeriod: '',
    splineOrder: '',
  });

  const [generatedMissingConfig, setGeneratedMissingConfig] = useState({
    numeric: '',
    categorical: '',
    datetime: '',
    rollingWindow: '',
    numericSeasonalgeneratedPeriod: '',
    categoricalSeasonalgeneratedPeriod: '',
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
    handleHighMissing: true,
    handleOriginalMissing: true,
    handleGeneratedMissing: false,
  });

  const [showFieldErrors, setShowFieldErrors] = useState(false);

  // Restore the saved step configuration from workflow state.
  useEffect(() => {
  if (hasSavedConfig) {
    setToggles({
       handleHighMissing:savedConfig.high_missing_value_active ??(numericColumns.length > 0),
      handleOriginalMissing: isUnivariateTimeseries ? false : (savedConfig.original_missing_value_active || false),
      handleGeneratedMissing:savedConfig.generated_missing_value_active || false, });
    setHighMissingConfig({threshold:
    savedConfig.high_missing_value_threshold ?? 70,
    });
    setOriginalMissingConfig({
      numeric:savedConfig.original_missing_value_numeric_method || '',
      categorical: savedConfig.original_missing_value_categorical_method || '',
      datetime: savedConfig.original_missing_value_datetime_method || '',
      polynomialDegree: savedConfig.original_missing_value_polynomial_degree || '', 
      splineOrder: savedConfig.original_missing_value_spline_order || '', 
      categoricalSeasonalOriginalPeriod:savedConfig.original_missing_value_categorical_seasonal_period || '',}); 

    setGeneratedMissingConfig({
      numeric:savedConfig.generated_missing_value_numeric_method || '',
      categorical:savedConfig.generated_missing_value_categorical_method || '',
      datetime: savedConfig.generated_missing_value_datetime_method || '',
      rollingWindow: savedConfig.generated_missing_value_rolling_window ?? '',
      numericSeasonalgeneratedPeriod:savedConfig.generated_missing_value_numeric_seasonal_period || '',
      categoricalSeasonalgeneratedPeriod:savedConfig.generated_missing_value_categorical_seasonal_period || '', }); }
}, [mode, workflowState?.dataPreprocessing?.step2?.config, isUnivariateTimeseries, numericColumns.length]);

  // Ensure original missing values toggle stays off for univariate timeseries
  useEffect(() => {
    if (isUnivariateTimeseries && toggles.handleOriginalMissing) {
      setToggles(prev => ({
        ...prev,
        handleOriginalMissing: false,
      }));
    }
  }, [isUnivariateTimeseries, toggles.handleOriginalMissing]);
// Automatically enable the generated missing values toggle if generated features with missing values are detected.
  useEffect(() => {
  if (hasSavedConfig) return;
  const hasNumericalColumns = numericColumns.length > 0;

  setToggles(prev => ({
    
    ...prev,
    handleHighMissing: hasNumericalColumns,}));
    }, [numericColumns]);

  // Validation helpers for the step's original and generated missing-value selections.

  const getOriginalMissingError = () => {
    if (!hasAnyOriginalMissing) return '';
    if (hasNumericMissing&&!originalMissingConfig.numeric
    ) {
      return 'Select numeric imputation method';
    }
    if (hasCategoricalMissing &&!originalMissingConfig.categorical
    ) {
      return 'Select categorical imputation method';
    }
    if (
      hasDatetimeMissing &&!originalMissingConfig.datetime
    ) {
      return 'Select datetime imputation method';
    }

    if ( hasNumericMissing && originalMissingConfig.numeric === 'polynomial') {
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

    if (hasCategoricalMissing && originalMissingConfig.categorical === 'mode_by_season') {
        const seasonalPeriod = Number(originalMissingConfig.categoricalSeasonalOriginalPeriod);
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
      const seasonalPeriod = Number(generatedMissingConfig.numericSeasonalgeneratedPeriod);
      if (!Number.isFinite(seasonalPeriod) || seasonalPeriod < 7 || seasonalPeriod > 365) {
        return 'Seasonal period must be between 7 and 365';
      }
    }

    if (hasGeneratedMissingCategorical && (generatedMissingConfig.categorical === 'mode_by_season' )) {
      const seasonalPeriod = Number(generatedMissingConfig.categoricalSeasonalgeneratedPeriod);
      if (!Number.isFinite(seasonalPeriod) || seasonalPeriod < 7 || seasonalPeriod > 365) {
        return 'Seasonal period must be between 7 and 365';
      }
    }
    

    return '';
  };


const getHighMissingError = () => {
  if (!toggles.handleHighMissing) return '';

  if (
    highMissingConfig.threshold === '' ||
    highMissingConfig.threshold === null ||
    highMissingConfig.threshold === undefined
  ) {
    return 'Please enter a value';
  }

  const threshold = Number(
    highMissingConfig.threshold
  );

  if (
    !Number.isFinite(threshold) ||
    threshold < 0 ||
    threshold > 100
  ) {
    return 'Threshold must be between 0 and 100';
  }

  return '';
};
// VALIDATION helper to determine if the step is ready to be submitted to the API.
  const validateStep = () => {
  return (
    !getHighMissingError() &&
    !getOriginalMissingError() &&
    !getGeneratedMissingError()
  );
};
  const getApiErrorMessage = () => 'Failed to handle missing values, please try again';

 

  // Expand or collapse one of the two subsection cards.
  const toggleSection = (section) => {
    setExpandedSections(prev => {
      const isOpen = prev[section];
      const allClosed = Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {});
      return isOpen ? allClosed : { ...allClosed, [section]: true };
    });
  };
  // Submit the step configuration to the preprocessing API.
  const makeApiCall = useCallback(async () => {
    if (readonly) return true;
    if (!validateStep()) {
      setShowFieldErrors(true);
      return false;
    }

    try {
      const payload= {
        ensemble_id: datasetState?.ensembleId,
        workflow_id: currentWorkflowId,
        high_missing_value_active: toggles.handleHighMissing,
        high_missing_value_threshold: Number(highMissingConfig.threshold) || 70,
        original_missing_value_active: hasAnyOriginalMissing,
        original_missing_value_numeric_method: originalMissingConfig.numeric || '',
        original_missing_value_categorical_method: originalMissingConfig.categorical || '',
        original_missing_value_datetime_method: originalMissingConfig.datetime || '',
        generated_missing_value_active: isGeneratedMissingMandatory || toggles.handleGeneratedMissing,
        generated_missing_value_numeric_method: generatedMissingConfig.numeric || '',
        generated_missing_value_categorical_method: generatedMissingConfig.categorical || '',
        generated_missing_value_datetime_method: generatedMissingConfig.datetime || '',
        generated_missing_value_rolling_window: generatedMissingConfig.rollingWindow || 3,
        generated_missing_value_numeric_seasonal_period: generatedMissingConfig.numericSeasonalgeneratedPeriod || 7,
        generated_missing_value_categorical_seasonal_period: generatedMissingConfig.categoricalSeasonalgeneratedPeriod || 7,
        original_missing_value_polynomial_order: originalMissingConfig.polynomialDegree || 2,
        original_missing_value_spline_order: originalMissingConfig.splineOrder || 3,
        original_missing_value_categorical_seasonal_period: originalMissingConfig.categoricalSeasonalOriginalPeriod || 7,
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
    highMissingConfig,
    toggles.handleHighMissing,
    originalMissingConfig,
    generatedMissingConfig,
    hasAnyOriginalMissing,
    isGeneratedMissingMandatory,
    toggles.handleGeneratedMissing,
    updatePreprocessingStep,
    onApiCall,
  ]);

  useEffect(() => {
    if (onApiCall) onApiCall(makeApiCall);
  }, [makeApiCall, onApiCall]);

  // Persist the current configuration back into workflow state with a small debounce.
  // useEffect(() => {
  //   const timeout = setTimeout(() => {
  //     updatePreprocessingStep('step2', {
  //       config: {
  //         high_missing_value_active:toggles.handleHighMissing,
  //         high_missing_value_threshold:highMissingConfig.threshold,
  //         original_missing_value_active: toggles.handleOriginalMissing,
  //         generated_missing_value_active: toggles.handleGeneratedMissing,
  //         original_missing_value_numeric_method: originalMissingConfig.numeric,
  //         original_missing_value_categorical_method: originalMissingConfig.categorical,
  //         original_missing_value_datetime_method: originalMissingConfig.datetime,
  //         original_missing_value_polynomial_degree: originalMissingConfig.polynomialDegree,
  //         original_missing_value_spline_order: originalMissingConfig.splineOrder,
  //         original_missing_value_categorical_seasonal_period: originalMissingConfig.categoricalSeasonalOriginalPeriod,
  //         generated_missing_value_numeric_method: generatedMissingConfig.numeric,
  //         generated_missing_value_categorical_method: generatedMissingConfig.categorical,
  //         generated_missing_value_datetime_method: generatedMissingConfig.datetime,
  //         generated_missing_value_rolling_window: generatedMissingConfig.rollingWindow,
  //         generated_missing_value_numeric_seasonal_period: generatedMissingConfig.numericSeasonalgeneratedPeriod,
  //         generated_missing_value_categorical_seasonal_period: generatedMissingConfig.categoricalSeasonalgeneratedPeriod,
  //       },
  //     });
  //   }, 500);

  //   return () => clearTimeout(timeout);
  // }, [toggles, highMissingConfig,originalMissingConfig, generatedMissingConfig, updatePreprocessingStep]);

  
    useEffect(() => {
      if (hasSavedConfig) return;

      setToggles(prev => ({
        ...prev,
        handleGeneratedMissing:
          isGeneratedMissingMandatory,
      }));
    }, [
      hasSavedConfig,
      isGeneratedMissingMandatory,
    ]);
  // Surface validation feedback only after the user attempts to process the step.
  const originalMissingError = showFieldErrors ? getOriginalMissingError() : '';
  const generatedMissingError = showFieldErrors ? getGeneratedMissingError() : '';
  console.log("savedConfig", savedConfig);

console.log(
  "generatedMissingConfig",
  generatedMissingConfig
);

console.log(
  "originalMissingConfig",
  originalMissingConfig
);

console.log(
  "toggles",
  toggles
);
  return (
    <div className="space-y-4 p-4">
      {/*High missing values card.*/}
      {!isUnivariateTimeseries && (
      <HandleHighMissingValues
       readonly={readonly}
      toggles={toggles}
      setToggles={setToggles}
      highMissingConfig={highMissingConfig}
      setHighMissingConfig={setHighMissingConfig}
     numericColumns={numericColumns}
     showFieldErrors={showFieldErrors}
     expanded={expandedSections.handleHighMissing}
     toggleSection={() => toggleSection('handleHighMissing')}
     />
      )}
      {/* Original missing-values card. */}
      {!isUnivariateTimeseries && (
        <HandleOriginalMissingValues
          readonly={readonly || isUnivariateTimeseries}
          expanded={expandedSections.handleOriginalMissing}
          toggleSection={() =>toggleSection('handleOriginalMissing')}
          checked={showAnyOriginalMissing}
          hasNumericMissing={showNumericMissing}
          hasCategoricalMissing={showCategoricalMissing}
          hasDatetimeMissing={showDatetimeMissing}
          missingOriginalNumericColumns={missingOriginalNumericColumns}
          missingOriginalCategoricalColumns={ missingOriginalCategoricalColumns}
          missingOriginalDatetimeColumns={missingOriginalDatetimeColumns}
          originalMissingConfig={originalMissingConfig}
          setOriginalMissingConfig={setOriginalMissingConfig}
          searchValues={searchValues}
          setSearchValues={setSearchValues}
          showDropdowns={showDropdowns}
          setShowDropdowns={setShowDropdowns}
          showFieldErrors={showFieldErrors}
          originalMissingError={originalMissingError}
      />
      )}
      {/* Generated missing-values card. */}
      <HandleGeneratedMissingValues
        readonly={readonly}
        toggles={toggles}
        setToggles={setToggles}
        generatedMissingConfig={generatedMissingConfig}
        setGeneratedMissingConfig={setGeneratedMissingConfig}
        hasGeneratedMissingNumerical={showGeneratedNumeric}
        hasGeneratedMissingCategorical={showGeneratedCategorical}
        hasGeneratedMissingDatetime={showGeneratedDatetime}
        generatedNumericColumns={numericColumns}
        generatedCategoricalColumns={categoricalColumns}
        generatedDatetimeColumns={datetimeColumns}
        searchValues={searchValues}
        setSearchValues={setSearchValues}
        showDropdowns={showDropdowns}
        setShowDropdowns={setShowDropdowns}
        showFieldErrors={showFieldErrors}
        generatedMissingError={generatedMissingError}
        expanded={expandedSections.handleGeneratedMissing}
        toggleSection={() => toggleSection('handleGeneratedMissing')}
      />
    </div>
  );
}

export default HandleMissingValues;
