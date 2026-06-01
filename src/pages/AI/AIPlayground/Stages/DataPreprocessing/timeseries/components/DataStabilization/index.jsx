import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

import { useAIPlayground } from '../../../../../../../../context/AIPlaygroundContext';
import { stabilizeData as apiStabilizeData } from '../../../../../../../../hooks/AI/datapreprocessing/timeseries';
import { outlierTreatmentMethods } from '../../../../../../../../hooks/AI/datapreprocessing/descriptions';
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
  const [outlierStrategy, setOutlierStrategy] = useState('cap_95');
  const [hoveredOption, setHoveredOption] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showFieldErrors, setShowFieldErrors] = useState(false);
  const isUnivariateTimeseries = predictionType === 'univariate_timeseries';
  const availableOutlierOptions = outlierTreatmentMethods;
  const optionDescriptions = availableOutlierOptions.reduce((accumulator, option) => {
    accumulator[option.value] = option.description;
    return accumulator;
  }, {});

  useEffect(() => {
    const step4Config = workflowState?.dataPreprocessing?.step4?.config;

    if (step4Config && (mode === 'view' || mode === 'edit')) {
      setToggles({
        outlierTreatment: step4Config.outlier_treatment_active ?? false,
        seasonalityAnalysis: step4Config.seasonality_analysis_active ?? false
      });
      setOutlierStrategy(step4Config.outlier_treatment_strategy || 'cap_95');
      setExpandedSections({
        outlierTreatment: !!step4Config.outlier_treatment_active,
        seasonalityAnalysis: !!step4Config.seasonality_analysis_active
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
      setOutlierStrategy('cap_95');
    }
  }, [workflowState?.dataPreprocessing?.step4?.config, mode]);

  useEffect(() => {
    if (!showFieldErrors) return;

    const outlierError = toggles.outlierTreatment && !outlierStrategy;

    if (!outlierError) {
      setShowFieldErrors(false);
    }
  }, [outlierStrategy, toggles, showFieldErrors]);

  const outlierStrategyError = showFieldErrors && toggles.outlierTreatment && !outlierStrategy;

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
      } else {
        setExpandedSections((previousState) => ({
          ...previousState,
          outlierTreatment: false
        }));
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

  const handleApiCall = async () => {
    if (readonly) return true;

    if (toggles.outlierTreatment && !outlierStrategy) {
      setShowFieldErrors(true);
      setExpandedSections({ outlierTreatment: true });
      return false;
    }

    try {
      setIsLoading(true);

      const params = {
        ensembleId: datasetState?.ensembleId,
        workflowId: currentWorkflowId,
        outlierTreatmentActive: toggles.outlierTreatment,
        seasonalityAnalysis: toggles.seasonalityAnalysis,
        outlierTreatmentStrategy: toggles.outlierTreatment ? outlierStrategy : '',
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
          seasonality_analysis_active: params.seasonalityAnalysis,
          outlier_treatment_strategy: params.outlierTreatmentStrategy,
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
  }, [toggles, outlierStrategy, datasetState?.ensembleId, currentWorkflowId]);

  return (
    <div className="space-y-4">
      <OutlierTreatment
        isToggled={toggles.outlierTreatment}
        isExpanded={expandedSections.outlierTreatment}
        onToggle={() => toggleSwitch('outlierTreatment')}
        onExpand={() => toggleSection('outlierTreatment')}
        readonly={readonly}
        sectionKey="outlierTreatment"
        hasError={outlierStrategyError}
        outlierStrategy={outlierStrategy}
        setOutlierStrategy={setOutlierStrategy}
        hoveredOption={hoveredOption}
        setHoveredOption={setHoveredOption}
        availableOutlierOptions={availableOutlierOptions}
        optionDescriptions={optionDescriptions}
        errorMessage={outlierStrategyError ? 'Please select an outlier treatment strategy' : ''}
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