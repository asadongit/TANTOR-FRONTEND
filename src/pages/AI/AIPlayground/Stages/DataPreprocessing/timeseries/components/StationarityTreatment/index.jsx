import React, { useState, useEffect } from 'react';

import { toast } from 'react-hot-toast';

import { useAIPlayground } from '../../../../../../../../context/AIPlaygroundContext';

import { stationarityTreatment } from '../../../../../../../../hooks/AI/datapreprocessing/timeseries';

import { dataPreprocessingDescriptions } from '../../../../../../../../hooks/AI/datapreprocessing/descriptions';

import StationarityTable from './StationarityTable';

/**
 * =========================================================
 * StationarityTreatment
 * =========================================================
 *
 * Parent Component for Stationarity Treatment
 *
 * Responsibilities:
 * ---------------------------------------------------------
 * - Holds state for stationarity treatment toggle
 * - Handles API payload creation
 * - Performs API calls to stationarityTreatment
 * - Controls section expand/collapse
 * - Displays stationarity analysis report
 *
 * Child Components:
 * ---------------------------------------------------------
 * - StationarityTable.jsx (for displaying report)
 *
 * Architecture:
 * ---------------------------------------------------------
 * Parent Component:
 *    - Business logic
 *    - API logic
 *    - State management
 *
 * Child Components:
 *    - UI rendering only
 * =========================================================
 */

function StationarityTreatmentComponent({
  readonly,
  onValidationChange,
  onApiCall
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
   * Stationarity analysis report from step 5 API response
   */
  const rawStationarityReport =
    workflowState?.dataPreprocessing?.step5?.apiResponse
      ?.stationarity_analysis_report || [];

  /**
   * Filter report to only include required keys
   */
  const requiredKeys = [
    'column',
    'adf_stationary',
    'kpss_stationary',
    'diagnosis',
    'recommended_treatment'
  ];

  const stationarityAnalysisReport = rawStationarityReport.map((row) => {
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
   * Toggle for stationarity treatment
   */
  const [stationarityTreatmentActive, setStationarityTreatmentActive] =
    useState(false);

  /**
   * Expanded/collapsed section state
   */
  const [expandedSections, setExpandedSections] =
    useState({
      stationarityTreatment: false
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
     * -----------------------------------------------------
     * Stationarity Treatment Toggle
     * -----------------------------------------------------
     */

    if (key === 'stationarityTreatment') {

      const newState = !stationarityTreatmentActive;

      setStationarityTreatmentActive(newState);

      /**
       * Close section if disabled
       */
      if (!newState) {

        setExpandedSections((prev) => ({
          ...prev,
          stationarityTreatment: false
        }));
      }

      /**
       * Open section if enabled
       */
      if (newState) {

        setExpandedSections({
          stationarityTreatment: true
        });
      }

      /**
       * Call parent callback to track changes
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
        stationarity_treatment_active:
          stationarityTreatmentActive
      };

      /**
       * ---------------------------------------------------
       * API Call
       * ---------------------------------------------------
       */

      const result =
        await stationarityTreatment({

          ensembleId:
            datasetState.ensembleId,

          workflowId:
            activeWorkflowId,

          stationarityTreatmentActive:
            stationarityTreatmentActive
        });

      /**
       * ---------------------------------------------------
       * Store Response
       * ---------------------------------------------------
       */

      updatePreprocessingStep(
        'step6',
        {
          config: config,
          apiResponse: result
        }
      );

      /**
       * ---------------------------------------------------
       * Notify Parent Component
       * ---------------------------------------------------
       */

      if (onApiCall) {
        onApiCall({
          step: 'step6',
          status: 'success',
          config,
          apiResponse: result
        });
      }

      toast.success('Stationarity treatment completed successfully');

      return true;

    } catch (err) {

      setError(
        err?.response?.data?.detail ||
        err?.message ||
        'Error processing stationarity treatment'
      );

      toast.error('Error processing stationarity treatment');

      /**
       * ---------------------------------------------------
       * Notify Parent Component
       * ---------------------------------------------------
       */

      if (onApiCall) {
        onApiCall({
          step: 'step6',
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

  }, [stationarityTreatmentActive]);

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
          Stationarity Treatment Section
      =================================================== */}

      <StationarityTable

        isToggled={stationarityTreatmentActive}

        isExpanded={expandedSections.stationarityTreatment}

        onToggle={() => toggleSwitch('stationarityTreatment')}

        onExpand={() => toggleSection('stationarityTreatment')}

        readonly={readonly}

        isLoading={isLoading}

        stationarityReport={stationarityAnalysisReport}

        sectionDescriptions={sectionDescriptions}
      />
    </div>
  );
}

export default StationarityTreatmentComponent;
