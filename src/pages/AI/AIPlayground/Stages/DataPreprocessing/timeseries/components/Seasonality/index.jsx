import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAIPlayground } from '../../../../../../../../context/AIPlaygroundContext';
import { seasonalizeData, stationarityTreatment } from '../../../../../../../../hooks/AI/datapreprocessing/timeseries';
import { dataPreprocessingDescriptions } from '../../../../../../../../hooks/AI/datapreprocessing/descriptions';
import SeasonalityAnalysisTable from './SeasonalityAnalysisTable';
import StationarityToggle from './StationarityToggle';

/**
 * SeasonalityAnalysis
 * Parent Component for Seasonality Analysis and Stationarity Analysis
 *
 * Responsibilities:
 * ---------------------------------------------------------
 * - Holds ALL states for both toggles
 * - Handles API payload creation
 * - Performs API calls to seasonalizeData
 * - Controls section expand/collapse
 * - Displays seasonality analysis report
 */

function SeasonalityAnalysisComponent({readonly,onValidationChange,onApiCall,predictionType}) 
{
//context data
  const {datasetState, workflowsState,activeWorkflowId, updatePreprocessingStep} = useAIPlayground();

  {/* Get current workflow state*/}
  const workflowState = activeWorkflowId? workflowsState?.[activeWorkflowId]: null;
  {/* Backend data */}
   //Check if seasonality analysis was enabled in step 4
  const step4Config = workflowState?.dataPreprocessing?.step4?.config;
  const wasSeasonalityAnalysisEnabledInStep4 = step4Config?.seasonality_analysis_active ?? false;

  //Seasonality analysis report from step 4 API response
  const rawSeasonalityReport =workflowState?.dataPreprocessing?.step4?.apiResponse?.seasonality_analysis_report || [];
// univariate check
  const isUnivariateTimeseries = predictionType === 'univariate_timeseries';    

 // keys to extract from raw report for the seasonality analysis table
  const requiredKeys = ['column','seasonality_detected','decomposition_method','recommended_treatment'];
  const seasonalityAnalysisReport = rawSeasonalityReport.map((row) => {
    const filteredRow = {};
    requiredKeys.forEach((key) => {
      if (key in row) {
        filteredRow[key] = row[key];
      }
    });
    return filteredRow;
  });

  // section descriptions for tooltips
  const sectionDescriptions =dataPreprocessingDescriptions;

// COMPONENT STATES
// seasonality treatment toggle state
  const [seasonalityTreatmentActive, setSeasonalityTreatmentActive] = useState(false);
// stationarity analysis toggle state
  const [stationarityAnalysisActive, setStationarityAnalysisActive] = useState(false);
// section expand/collapse state
  const [expandedSections, setExpandedSections] =
    useState({
      seasonalityAnalysis: false,
      stationarityAnalysis: false
    });
// loading state for API call
  const [isLoading, setIsLoading] = useState(false);
// error state for API call
  const [error, setError] =useState(null);

// Toggle section expand/collapse
  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

// Handle toggle switches with validation
  const toggleSwitch = (key) => {
    if (readonly || isLoading) return;
    /**
     * Block seasonality treatment toggle if seasonality analysis
     * was not enabled in step 4
     */
    if (key === 'seasonalityAnalysis' && !wasSeasonalityAnalysisEnabledInStep4) return;
    // seasonality analysis toggle
    if (key === 'seasonalityAnalysis') {
      const newState = !seasonalityTreatmentActive;
      setSeasonalityTreatmentActive(newState);
      // If toggling off, also collapse the section
      if (!newState) {
        setExpandedSections((prev) => ({
          ...prev,
          seasonalityAnalysis: false
        }));
      }
      // If toggling on, expand the section
      if (newState) {
        setExpandedSections({
          seasonalityAnalysis: true,
          stationarityAnalysis: false
        });
      }

// Notify parent of validation change (to enable/disable Next button)
      if (onValidationChange) {
        onValidationChange();
      }
    }

// stationarity analysis toggle
    if (key === 'stationarityAnalysis') {
      const newState = !stationarityAnalysisActive;
      setStationarityAnalysisActive(newState);
      if (onValidationChange) {
        onValidationChange();
      }
    }
  };

// Handle API call 

  const handleApiCall = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const config = {
        seasonality_treatment_active:seasonalityTreatmentActive,
        stationarity_analysis_active:stationarityAnalysisActive
      };
      const result =
        await seasonalizeData({
          ensembleId:datasetState.ensembleId,
          workflowId:activeWorkflowId,
          seasonalityTreatmentActive:seasonalityTreatmentActive,
          stationarityAnalysisActive:stationarityAnalysisActive
        });
// Update global state with API response for step 5
      updatePreprocessingStep(
        'step5',
        {
          config: config,
          apiResponse: result
        }
      );

/**
 * ---------------------------------------------------
 * If stationarity analysis is OFF and is not univariate timeseries, then we need to call
 * stationarity treatment API with false in step 6 
 * ---------------------------------------------------
 */
      if (!stationarityAnalysisActive && !isUnivariateTimeseries) {
        try {
          const stationarityConfig = {
            stationarity_treatment_active: false
          };

          const stationarityResult =
            await stationarityTreatment({
              ensembleId: datasetState.ensembleId,
              workflowId: activeWorkflowId,
              stationarityTreatmentActive: false
            });

          updatePreprocessingStep(
            'step6',
            {
              config: stationarityConfig,
              apiResponse: stationarityResult
            }
          );
        } catch (err) {
          console.error('Error in stationarity treatment API call:', err);
        }
      }


// Notify parent of API call result
      if (onApiCall) {
        onApiCall({
          step: 'step5',
          status: 'success',
          config,
          apiResponse: result
        });
      }
      toast.success('Seasonality analysis completed successfully');
      return true;
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
        err?.message ||
        'Error processing seasonality analysis'
      );
      toast.error('Error processing seasonality analysis');

// Notify parent of API call error
      if (onApiCall) {
        onApiCall({
          step: 'step5',
          status: 'error',
          error: err?.message
        });
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

// expose API call handler to parent component so it can be called when user clicks process data

  useEffect(() => {
    if (onApiCall) {
      onApiCall(handleApiCall);
    }
  }, [seasonalityTreatmentActive, stationarityAnalysisActive]);

  return (
    <div className="space-y-6">
      {/*Error Banner*/}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">
            {error}
          </p>
        </div>
      )}
  
{/* Seasonality Analysis Section only show if not univariate timeseries */}

      {!isUnivariateTimeseries && (
      <SeasonalityAnalysisTable
        isToggled={seasonalityTreatmentActive}
        isExpanded={expandedSections.seasonalityAnalysis}
        onToggle={() => toggleSwitch('seasonalityAnalysis')}
        onExpand={() => toggleSection('seasonalityAnalysis')}
        readonly={readonly || !wasSeasonalityAnalysisEnabledInStep4}
        isLoading={isLoading}
        seasonalityReport={seasonalityAnalysisReport}
        sectionDescriptions={sectionDescriptions}
        blockedMessage={
        !wasSeasonalityAnalysisEnabledInStep4
          ? 'Seasonality Treatment is unavailable because Seasonality Analysis was not enabled in the previous step.'
          : ''
      }
      />
      )}  

{/* Stationarity Analysis Section*/}

      <StationarityToggle
        isToggled={stationarityAnalysisActive}
        onToggle={() => toggleSwitch('stationarityAnalysis')}
        readonly={readonly}
        isLoading={isLoading}
        sectionDescriptions={sectionDescriptions}
      />
    </div>
  );
}

export default SeasonalityAnalysisComponent;
