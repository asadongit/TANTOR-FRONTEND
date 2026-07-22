import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

import { useAIPlayground } from '../../../../../../../../context/AIPlaygroundContext';
import { stabilizeData as apiStabilizeData } from '../../../../../../../../hooks/AI/datapreprocessing/timeseries';
import {   univariateOutlierMethods,multivariateOutlierMethods } from '../../../../../../../../hooks/AI/datapreprocessing/descriptions';
import OutlierTreatment from './OutlierTreatment';
import SeasonalityAnalysis from './SeasonalityAnalysis';

function DataStabilization({ readonly: readonlyProp, onApiCall, predictionType }) {
  const { workflowsState, activeWorkflowId, datasetState, updatePreprocessingStep, mode } = useAIPlayground();

  const readonly = readonlyProp || mode === 'view';
  const workflowState = activeWorkflowId ? workflowsState?.[activeWorkflowId] : null;
  const currentWorkflowId = workflowState?.workflow_id || activeWorkflowId;
  
  const [toggles, setToggles] = useState({
    outlierTreatment: false,
    seasonalityAnalysis: false
  });
  const [expandedSections, setExpandedSections] = useState({
    outlierTreatment: false,
    seasonalityAnalysis: false
  });
 
  const [outlierConfig, setOutlierConfig] = useState({method: '',rollingWindow: '',seasonalPeriod: '',});
  const [isLoading, setIsLoading] = useState(false);
  const [showFieldErrors, setShowFieldErrors] = useState(false);
  const isUnivariateTimeseries = predictionType === 'univariate_timeseries';
  const availableOutlierOptions = isUnivariateTimeseries? univariateOutlierMethods: multivariateOutlierMethods;
  const outliersDetectedCount =
  workflowState?.dataPreprocessing?.step3?.apiResponse?.outliers_detected_count || 0;
  const rollingWindowMethods = [
    'rolling_median',
    'rolling_mean',
    'ewm',
    'local_winsorize',
    'flag_magnitude',
  ];

const seasonalPeriodMethods = [
    'seasonal_naive',
    'seasonal_median',
    'seasonal_mean',
    'stl_reconstruction',
  ];
  useEffect(() => {
    const step4Config = workflowState?.dataPreprocessing?.step4?.config;
    

    if (step4Config && (mode === 'view' || mode === 'edit')) {
      setToggles({
        outlierTreatment: step4Config.outlier_treatment_active ?? false,
        seasonalityAnalysis: step4Config.seasonality_analysis?? false
      });
      
      setOutlierConfig({method: step4Config.outlier_treatment_strategy || '',
                        rollingWindow: step4Config.outlier_rolling_window || '',
                        seasonalPeriod: step4Config.outlier_season_period || '',
                      });
      setExpandedSections({
        outlierTreatment: !!step4Config.outlier_treatment_active,
        seasonalityAnalysis: !!step4Config.seasonality_analysis
      });
    } else {
      setToggles({
        outlierTreatment: false,
        seasonalityAnalysis: false
      });
      setExpandedSections({
        outlierTreatment: false,
        seasonalityAnalysis: false
      });
      setOutlierConfig({method: '',
                        rollingWindow: '',
                        seasonalPeriod: '',
                      });
        }
  }, [workflowState?.dataPreprocessing?.step4?.config, mode]);
// Rolling window error is shown if the selected method requires a rolling window and the value is invalid


  const rollingWindowError =
  showFieldErrors &&
  toggles.outlierTreatment &&
  rollingWindowMethods.includes(outlierConfig.method) &&
  !outlierConfig.rollingWindow
    ? 'Rolling Window is required'
    : showFieldErrors &&
      toggles.outlierTreatment &&
      rollingWindowMethods.includes(outlierConfig.method) &&
      (
        Number(outlierConfig.rollingWindow) < 3 ||
        Number(outlierConfig.rollingWindow) > 365
      )
    ? 'Value must be between 3 and 365'
    : '';
    
  // Seasonal period error is shown if the selected method requires a seasonal period and the value is invalid
  const seasonalPeriodError =
  showFieldErrors &&
  toggles.outlierTreatment &&
  seasonalPeriodMethods.includes(outlierConfig.method) &&
  !outlierConfig.seasonalPeriod
    ? 'Seasonal Period is required'
    : showFieldErrors &&
      toggles.outlierTreatment &&
      seasonalPeriodMethods.includes(outlierConfig.method) &&
      (
        Number(outlierConfig.seasonalPeriod) < 2 ||
        Number(outlierConfig.seasonalPeriod) > 365
      )
    ? 'Value must be between 2 and 365'
    : '';
  useEffect(() => {
  if (!showFieldErrors) return;
  
  const outlierError =
    toggles.outlierTreatment &&
    (
      !outlierConfig.method ||
      rollingWindowError ||
      seasonalPeriodError
    );

  if (!outlierError) {
    setShowFieldErrors(false);
  }
}, [ outlierConfig,toggles,showFieldErrors,rollingWindowError,seasonalPeriodError,]);

  const methodError = showFieldErrors && toggles.outlierTreatment &&!outlierConfig.method
    ? 'Please select an outlier treatment method'
    : '';

  const toggleSection = (section) => {
    setExpandedSections({
      outlierTreatment: false,
      seasonalityAnalysis: false,
      [section]: !expandedSections[section]
    });
  };

  const toggleSwitch = (key) => {
    if (readonly || isLoading) return;

    if (key === 'outlierTreatment') {
      const newToggleState = !toggles.outlierTreatment;

      setToggles((previousState) => ({
        ...previousState,
        outlierTreatment: newToggleState
      }));

      if (newToggleState) {
  setExpandedSections({
    outlierTreatment: true,
    seasonalityAnalysis: false
  });

  setOutlierConfig((prev) => ({
    ...prev,
    method: availableOutlierOptions?.[0]?.value || '',
    rollingWindow: '',
    seasonalPeriod: '',
  }));
} else {
  setExpandedSections((previousState) => ({
    ...previousState,
    outlierTreatment: false
  }));

  setOutlierConfig({
    method: '',
    rollingWindow: '',
    seasonalPeriod: '',
  });

  setShowFieldErrors(false);
}
    }

    if (key === 'seasonalityAnalysis') {
      const newToggleState = !toggles.seasonalityAnalysis;

      setToggles((previousState) => ({
        ...previousState,
        seasonalityAnalysis: newToggleState
      }));

      if (newToggleState) {
        setExpandedSections({
          outlierTreatment: false,
          seasonalityAnalysis: true
        });
      } else {
        setExpandedSections((previousState) => ({
          ...previousState,
          seasonalityAnalysis: false
        }));
      }
    }
  };
const requiresRollingWindow = rollingWindowMethods.includes(outlierConfig.method);

const requiresSeasonalPeriod = seasonalPeriodMethods.includes(outlierConfig.method);

  const handleApiCall = async () => {
    if (readonly) return true;

    const hasValidationError =
  !outlierConfig.method ||
  (
    requiresRollingWindow &&
    (
      !outlierConfig.rollingWindow ||
      Number(outlierConfig.rollingWindow) < 3 ||
      Number(outlierConfig.rollingWindow) > 365
    )
  ) ||
  (
    requiresSeasonalPeriod &&
    (
      !outlierConfig.seasonalPeriod ||
      Number(outlierConfig.seasonalPeriod) < 2 ||
      Number(outlierConfig.seasonalPeriod) > 365
    )
  );

if (
  toggles.outlierTreatment &&
  hasValidationError
) {
  setShowFieldErrors(true);
  return false;
}
    try {
      setIsLoading(true);

      const params = {
        ensembleId: datasetState?.ensembleId,
        workflowId: currentWorkflowId,
        outlierTreatmentActive: toggles.outlierTreatment,
        seasonalityAnalysis: toggles.seasonalityAnalysis,
        outlierTreatmentStrategy:toggles.outlierTreatment? outlierConfig.method: '',
        outlierRollingWindow:Number(outlierConfig.rollingWindow) || 7,
        outlierSeasonPeriod:Number(outlierConfig.seasonalPeriod) || 7,
        outlierThreshold: 3
      };

      if (!params.ensembleId || !params.workflowId) {
        toast.error('Missing ensemble or workflow id', { duration: 4000, position: 'top-right' });
        return false;
      }

      const apiResponse = await apiStabilizeData(params);
      updatePreprocessingStep('step4', {
        config: {
          outlier_treatment_active: params.outlierTreatmentActive,
          seasonality_analysis: params.seasonalityAnalysis,
          outlier_treatment_strategy: params.outlierTreatmentStrategy,
          outlier_rolling_window:params.outlierRollingWindow,
          outlier_season_period:params.outlierSeasonPeriod,
          outlier_thershold: params.outlierThreshold
        },
        apiResponse
      });

      toast.success('Data stabilization completed!', { duration: 3000, position: 'top-right' });
      return true;
    } catch (error) {
      console.error('DataStabilization API failed:', error);
      toast.error('Failed to process data, please try again', { duration: 4000, position: 'top-right' });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (onApiCall) onApiCall(handleApiCall);
  }, [toggles, outlierConfig, datasetState?.ensembleId, currentWorkflowId]);
  

  return (
    <div className="space-y-4">
      
      <OutlierTreatment
        isToggled={toggles.outlierTreatment}
        isExpanded={expandedSections.outlierTreatment}
        onToggle={() => toggleSwitch('outlierTreatment')}
        onExpand={() => toggleSection('outlierTreatment')}
        outlierCount={outliersDetectedCount}
        readonly={readonly}
        sectionKey="outlierTreatment"

        hasError={!!methodError}

        outlierConfig={outlierConfig}
        setOutlierConfig={setOutlierConfig}

        availableOutlierOptions={availableOutlierOptions}

        methodError={methodError}
        rollingWindowError={rollingWindowError}
        seasonalPeriodError={seasonalPeriodError}
        noOutliersDetected={outliersDetectedCount === 0}
      />

      {!isUnivariateTimeseries && (
      <SeasonalityAnalysis
        isToggled={toggles.seasonalityAnalysis}
        isExpanded={expandedSections.seasonalityAnalysis}
        onToggle={() => toggleSwitch('seasonalityAnalysis')}
        onExpand={() => toggleSection('seasonalityAnalysis')}
        readonly={readonly}
      />
      )}
    </div>
  );
}

export default DataStabilization;