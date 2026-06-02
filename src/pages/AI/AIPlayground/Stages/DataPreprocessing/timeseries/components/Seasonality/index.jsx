import React, { useState, useEffect } from 'react';

import { toast } from 'react-hot-toast';

import { useAIPlayground } from '../../../../../../../../context/AIPlaygroundContext';

import { seasonalizeData, stationarityTreatment } from '../../../../../../../../hooks/AI/datapreprocessing/timeseries';

import { dataPreprocessingDescriptions } from '../../../../../../../../hooks/AI/datapreprocessing/descriptions';

import SeasonalityAnalysisTable from './SeasonalityAnalysisTable';

import StationarityToggle from './StationarityToggle';

/**
 * =========================================================
 * SeasonalityAnalysis
 * =========================================================
 *
 * Parent Component for Seasonality Analysis and Stationarity Analysis
 *
 * Responsibilities:
 * ---------------------------------------------------------
 * - Holds ALL states for both toggles
 * - Handles API payload creation
 * - Performs API calls to seasonalizeData
 * - Controls section expand/collapse
 * - Displays seasonality analysis report

 * =========================================================
 */

function SeasonalityAnalysisComponent({
  readonly,
  onValidationChange,
  onApiCall,
  predictionType

}) {

  /**
   * =======================================================
   * Context Data
   * =======================================================
   */

  const {
    datasetState,
    workflowsState,
    activeWorkflowId,
    updatePreprocessingStep
  } = useAIPlayground();

  /**
   * Get current workflow state
   */
  const workflowState = activeWorkflowId
    ? workflowsState?.[activeWorkflowId]
    : null;

  /**
   * =======================================================
   * Backend Data
   * =======================================================
   */

  /**
   * Check if seasonality analysis was enabled in step 4
   */
  const step4Config = workflowState?.dataPreprocessing?.step4?.config;
  const wasSeasonalityAnalysisEnabledInStep4 = step4Config?.seasonality_analysis_active ?? false;

  /**
   * Seasonality analysis report from step 4 API response
   */
  const rawSeasonalityReport =
    workflowState?.dataPreprocessing?.step4?.apiResponse
      ?.seasonality_analysis_report || [];

  const isUnivariateTimeseries = predictionType === 'univariate_timeseries';    

  /**
   * Filter report to only include required keys
   */
  const requiredKeys = [
    'column',
    'seasonality_detected',
    'decomposition_method',
    'recommended_treatment'
  ];

  const seasonalityAnalysisReport = rawSeasonalityReport.map((row) => {
    const filteredRow = {};
    requiredKeys.forEach((key) => {
      if (key in row) {
        filteredRow[key] = row[key];
      }
    });
    return filteredRow;
  });

  /**
   * =======================================================
   * Section Descriptions
   * =======================================================
   */

  const sectionDescriptions =
    dataPreprocessingDescriptions;

  /**
   * =======================================================
   * Component States
   * =======================================================
   */

  /**
   * Toggle for seasonality treatment
   */
  const [seasonalityTreatmentActive, setSeasonalityTreatmentActive] =
    useState(false);

  /**
   * Toggle for stationarity analysis
   */
  const [stationarityAnalysisActive, setStationarityAnalysisActive] =
    useState(false);

  /**
   * Expanded/collapsed section state
   */
  const [expandedSections, setExpandedSections] =
    useState({
      seasonalityAnalysis: false,
      stationarityAnalysis: false
    });

  /**
   * Loading state
   */
  const [isLoading, setIsLoading] =
    useState(false);

  /**
   * API error state
   */
  const [error, setError] =
    useState(null);

  /**
   * =======================================================
   * Toggle Expand / Collapse Section
   * =======================================================
   */

  const toggleSection = (section) => {

    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  /**
   * =======================================================
   * Toggle Feature Switches
   * =======================================================
   */

  const toggleSwitch = (key) => {

    if (readonly || isLoading) return;

    /**
     * Block seasonality treatment toggle if seasonality analysis
     * was not enabled in step 4
     */
    if (key === 'seasonalityAnalysis' && !wasSeasonalityAnalysisEnabledInStep4) return;

    /**
     * -----------------------------------------------------
     * Seasonality Analysis Toggle
     * -----------------------------------------------------
     */

    if (key === 'seasonalityAnalysis') {

      const newState = !seasonalityTreatmentActive;

      setSeasonalityTreatmentActive(newState);

      /**
       * Close section if disabled
       */
      if (!newState) {

        setExpandedSections((prev) => ({
          ...prev,
          seasonalityAnalysis: false
        }));
      }

      /**
       * Open section if enabled
       */
      if (newState) {

        setExpandedSections({
          seasonalityAnalysis: true,
          stationarityAnalysis: false
        });
      }

      /**
       * Call parent callback to track changes
       */
      if (onValidationChange) {
        onValidationChange();
      }
    }

    /**
     * -----------------------------------------------------
     * Stationarity Analysis Toggle
     * -----------------------------------------------------
     */

    if (key === 'stationarityAnalysis') {

      const newState = !stationarityAnalysisActive;

      setStationarityAnalysisActive(newState);

      /**
       * Just toggle - no section expand/collapse
       */
      if (onValidationChange) {
        onValidationChange();
      }
    }
  };

  /**
   * =======================================================
   * Handle API Call (Called on Next Click)
   * =======================================================
   */

  const handleApiCall = async () => {

    setError(null);

    setIsLoading(true);

    try {

      /**
       * ---------------------------------------------------
       * Create Config Object
       * ---------------------------------------------------
       */

      const config = {
        seasonality_treatment_active:
          seasonalityTreatmentActive,
        stationarity_analysis_active:
          stationarityAnalysisActive
      };

      /**
       * ---------------------------------------------------
       * API Call
       * ---------------------------------------------------
       */

      const result =
        await seasonalizeData({

          ensembleId:
            datasetState.ensembleId,

          workflowId:
            activeWorkflowId,

          seasonalityTreatmentActive:
            seasonalityTreatmentActive,

          stationarityAnalysisActive:
            stationarityAnalysisActive
        });

      /**
       * ---------------------------------------------------
       * Store Response
       * ---------------------------------------------------
       */

      updatePreprocessingStep(
        'step5',
        {
          config: config,
          apiResponse: result
        }
      );

      /**
       * ---------------------------------------------------
       * If stationarity analysis is OFF, call stationarity
       * treatment API with false in step 6
       * ---------------------------------------------------
       */

      if (!stationarityAnalysisActive) {
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

      /**
       * ---------------------------------------------------
       * Notify Parent Component
       * ---------------------------------------------------
       */

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

      /**
       * ---------------------------------------------------
       * Notify Parent Component
       * ---------------------------------------------------
       */

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

  /**
   * =======================================================
   * Expose API Function to Parent
   * =======================================================
   */

  useEffect(() => {

    if (onApiCall) {
      onApiCall(handleApiCall);
    }

  }, [seasonalityTreatmentActive, stationarityAnalysisActive]);

  return (

    <div className="space-y-6">

      {/* ===================================================
          Error Banner
      =================================================== */}

      {error && (

        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">

          <p className="text-sm text-red-700">
            {error}
          </p>

        </div>
      )}

      {/* ===================================================
          Blocked Notice (if seasonality not enabled in step 4)
      =================================================== */}

      {/* {!wasSeasonalityAnalysisEnabledInStep4 && (

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">

          <p className="text-sm text-blue-700">
            <span className="font-medium">Note:</span> Seasonality treatment is blocked because seasonality analysis was not enabled in Step 4 (Data Stabilization)
          </p>

        </div>
      )} */}

      {/* ===================================================
          Seasonality Analysis Section
      =================================================== */}
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
      />
      )}  

      {/* ===================================================
          Stationarity Analysis Section
      =================================================== */}

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
