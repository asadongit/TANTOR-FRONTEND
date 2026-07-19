import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useAIPlayground } from '../../../../../../../context/AIPlaygroundContext';
import { featureDependencyAnalysis } from '../../../../../../../hooks/AI/datapreprocessing/timeseries';
import { dataPreprocessingDescriptions } from '../../../../../../../hooks/AI/datapreprocessing/descriptions';
import VIFAnalysis from './vif';
import CorrelationAnalysis from './correlation';
import FeatureTargetAnalysis from './featuretarget';

/**
 * =========================================================
 * FeatureDependency
 * =========================================================
 *
 * Parent Component for Feature Dependency Analysis
 *
 * Responsibilities:
 * ---------------------------------------------------------
 * - Manages state for three analysis types: VIF, Correlation, Feature-Target
 * - Handles API payload creation
 * - Performs API calls to featureDependencyAnalysis
 * - Controls section expand/collapse
 * - Displays analysis reports with column dropping functionality
 *
 * Child Components:
 * ---------------------------------------------------------
 * - VIFAnalysis.jsx (for VIF analysis display)
 * - CorrelationAnalysis.jsx (for correlation analysis display)
 * - FeatureTargetAnalysis.jsx (for feature-target analysis display)
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

function FeatureDependency({
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
    updatePreprocessingStep,
    mode
  } = useAIPlayground();

  // Override readonly based on mode
  const isReadonly = readonly || mode === 'view';

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
   * Analysis reports from step6 API response
   */
  const step6Response = workflowState?.dataPreprocessing?.step6?.apiResponse || {};
  const vifReport = step6Response?.vif_report || [];
  const correlationReport = step6Response?.correlation_report?.flagged_pairs || [];
  const featureTargetReport = step6Response?.feature_target_report?.feature_scores || [];

  /**
   * Calculate max droppable features (leave at least 1)
   */
  const vifMaxDroppable = Math.max(vifReport.length - 1, 0);
  const correlationMaxDroppable =correlationReport.length > 0? correlationReport.length: 0;
  const featureTargetMaxDroppable = Math.max(featureTargetReport.length - 1, 0);

  /**
   * =======================================================
   * Section Descriptions
   * =======================================================
   */

  const sectionDescriptions = dataPreprocessingDescriptions;

  /**
   * =======================================================
   * Component States
   * =======================================================
   */

  /**
   * Toggles for each analysis type
   */
  const [toggles, setToggles] = useState({
    vif: false,
    correlation: false,
    featureTarget: false
  });

  /**
   * Dropper toggles for each analysis type
   */
  const [dropperToggles, setDropperToggles] = useState({
    vif: false,
    correlation: false,
    featureTarget: false
  });

  /**
   * Expanded/collapsed section state
   */
  const [expandedSections, setExpandedSections] = useState({
    vif: false,
    correlation: false,
    featureTarget: false
  });

  /**
   * Selected features to drop for each analysis type
   */
  const [selectedFeatures, setSelectedFeatures] = useState({
    vif: [],
    correlation: [],
    featureTarget: []
  });

  /**
   * Loading state
   */
  const [isLoading, setIsLoading] = useState(false);

  /**
   * API error state
   */
  const [error, setError] = useState(null);

  /**
   * Track if Next was clicked to show validation errors
   */
  const [showFieldErrors, setShowFieldErrors] = useState(false);

  /**
   * Initialize state from existing config on edit mode
   */
  useEffect(() => {
    if ((mode === 'view' || mode === 'edit') && workflowState?.dataPreprocessing?.step7?.config) {
      const config = workflowState.dataPreprocessing.step7.config;
      
      setToggles({
        vif: config.vif_active || false,
        correlation: config.correlation_active || false,
        featureTarget: config.feature_target_active || false
      });
      const vifColumns =
        config.drop_columns_from_vif || [];

      const correlationColumns =
        config.drop_columns_from_correlation || [];

      const featureTargetColumns =
        config.drop_columns_from_feature_target || [];

      setSelectedFeatures({
      vif: vifColumns,
      correlation: correlationColumns,
      featureTarget: featureTargetColumns
    });

    setDropperToggles({
      vif: vifColumns.length > 0,
      correlation: correlationColumns.length > 0,
      featureTarget: featureTargetColumns.length > 0
    });
    }
  }, [mode, workflowState]);

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


const toggleSwitch = (key) => {
  if (isReadonly || isLoading) return;

  const newState = !toggles[key];

  if (newState) {
  // Only one report can be active at a time
  setToggles({
    vif: key === 'vif',
    correlation: key === 'correlation',
    featureTarget: key === 'featureTarget'
  });

  setExpandedSections({
    vif: key === 'vif',
    correlation: key === 'correlation',
    featureTarget: key === 'featureTarget'
  });

  // Clear ALL previously selected features
  setSelectedFeatures({
    vif: [],
    correlation: [],
    featureTarget: []
  });

  // Close all droppers
  setDropperToggles({
    vif: false,
    correlation: false,
    featureTarget: false
  });
} else {
    setToggles(prev => ({
      ...prev,
      [key]: false
    }));

    setExpandedSections(prev => ({
      ...prev,
      [key]: false
    }));
  }

  if (onValidationChange) {
    onValidationChange();
  }
};
    

  /**
   * =======================================================
   * Toggle Dropper Switch
   * =======================================================
   */

 const toggleDropper = (key) => {
  if (isReadonly || isLoading) return;

  setDropperToggles(prev => {
    const isCurrentlyOpen = prev[key];

    return {
      vif: false,
      correlation: false,
      featureTarget: false,
      [key]: !isCurrentlyOpen
    };
  });
};

  /**
   * =======================================================
   * Toggle Feature Selection
   * =======================================================
   */

  const toggleFeatureSelection = (analysisType, featureName) => {
    if (isReadonly || isLoading) return;

    setSelectedFeatures(prev => {
      const currentFeatures = prev[analysisType];
      const isSelected = currentFeatures.includes(featureName);

      if (isSelected) {
        return {
          ...prev,
          [analysisType]: currentFeatures.filter(f => f !== featureName)
        };
      } else {
        const maxDroppable = 
          analysisType === 'vif' ? vifMaxDroppable :
          analysisType === 'correlation' ? correlationMaxDroppable :
          featureTargetMaxDroppable;

        if (currentFeatures.length < maxDroppable) {
          return {
            ...prev,
            [analysisType]: [...currentFeatures, featureName]
          };
        }
        return prev;
      }
    });
  };

  /**
   * =======================================================
   * Validation Checks
   * =======================================================
   */

  const getValidationError = () => {
    // Check VIF
    if (dropperToggles.vif && vifReport.length > 0 && selectedFeatures.vif.length === vifReport.length) {
      return { type: 'vif', message: 'You must leave at least one feature undropped' };
    }

    // No validation required for Correlation

    // Check Feature-Target
    if (dropperToggles.featureTarget && featureTargetReport.length > 0 && selectedFeatures.featureTarget.length === featureTargetReport.length) {
      return { type: 'featureTarget', message: 'You must leave at least one feature undropped' };
    }

    return null;
  };

  /**
   * =======================================================
   * Handle API Call (Called on Next Click)
   * =======================================================
   */

  const handleApiCall = useCallback(async () => {
    if (isReadonly) return true;

    setError(null);
    setShowFieldErrors(true);

    /**
     * Validate all sections
     */
    const validationError = getValidationError();
    if (validationError) {
      setError(validationError.message);
      return false;
    }

    setIsLoading(true);

    try {
      /**
       * ---------------------------------------------------
       * Create Config Object
       * ---------------------------------------------------
       */

      const config = {
        vif_active: toggles.vif && dropperToggles.vif,
        correlation_active: toggles.correlation && dropperToggles.correlation,
        feature_target_active: toggles.featureTarget && dropperToggles.featureTarget,
        drop_columns_from_vif: toggles.vif && dropperToggles.vif ? selectedFeatures.vif : [],
        drop_columns_from_correlation: toggles.correlation && dropperToggles.correlation ? selectedFeatures.correlation : [],
        drop_columns_from_feature_target: toggles.featureTarget && dropperToggles.featureTarget ? selectedFeatures.featureTarget : []
      };

      /**
       * ---------------------------------------------------
       * API Call
       * ---------------------------------------------------
       */

      const result = await featureDependencyAnalysis({
        ensembleId: datasetState.ensembleId,
        workflowId: activeWorkflowId,
        vifActive: toggles.vif && dropperToggles.vif,
        correlationActive: toggles.correlation && dropperToggles.correlation,
        featureTargetActive: toggles.featureTarget && dropperToggles.featureTarget,
        dropColumnsFromVif: toggles.vif && dropperToggles.vif ? selectedFeatures.vif : [],
        dropColumnsFromCorrelation: toggles.correlation && dropperToggles.correlation ? selectedFeatures.correlation : [],
        dropColumnsFromFeatureTarget: toggles.featureTarget && dropperToggles.featureTarget ? selectedFeatures.featureTarget : []
      });

      /**
       * ---------------------------------------------------
       * Store Response
       * ---------------------------------------------------
       */

      updatePreprocessingStep(
        'step7',
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
          step: 'step7',
          status: 'success',
          config,
          apiResponse: result
        });
      }

      toast.success('Feature dependency analysis completed successfully');
      setShowFieldErrors(false);

      return true;

    } catch (err) {
      const errorMessage =
        err?.response?.data?.detail ||
        err?.message ||
        'Error processing feature dependency analysis';

      setError(errorMessage);
      toast.error(errorMessage);

      /**
       * ---------------------------------------------------
       * Notify Parent Component
       * ---------------------------------------------------
       */

      if (onApiCall) {
        onApiCall({
          step: 'step7',
          status: 'error',
          error: err?.message
        });
      }

      return false;

    } finally {
      setIsLoading(false);
    }
  }, [
    isReadonly,
    toggles,
    dropperToggles,
    selectedFeatures,
    vifReport.length,
    correlationReport.length,
    featureTargetReport.length,
    datasetState.ensembleId,
    activeWorkflowId,
    updatePreprocessingStep,
    onApiCall,
    getValidationError
  ]);

  /**
   * =======================================================
   * Expose API Function to Parent
   * =======================================================
   */

  useEffect(() => {
    if (onApiCall) {
      onApiCall(handleApiCall);
    }
  }, [handleApiCall, onApiCall]);

  /**
   * Auto-clear errors when validation fixed
   */
  useEffect(() => {
    if (!showFieldErrors) return;
    if (!getValidationError()) {
      setShowFieldErrors(false);
    }
  }, [selectedFeatures, toggles, dropperToggles, showFieldErrors]);

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

   

      <div className="bg-gray-50 p-4 rounded-lg">
        <h5 className="text-sm font-medium text-[#8e78b7] mb-3">What's Included?</h5>
        <div className="grid grid-cols-3 gap-x-8">
          <ul className="text-xs text-gray-700 space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-gray-700 mt-0.5">•</span>
              <span>VIF analysis for multicollinearity detection</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gray-700 mt-0.5">•</span>
              <span>Feature risk assessment and categorization</span>
            </li>
          </ul>
          <ul className="text-xs text-gray-700 space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-gray-700 mt-0.5">•</span>
              <span>Correlation analysis between features</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gray-700 mt-0.5">•</span>
              <span>Feature-target relationship analysis</span>
            </li>
          </ul>
          <ul className="text-xs text-gray-700 space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-gray-700 mt-0.5">•</span>
              <span>Column dropper for each analysis type</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gray-700 mt-0.5">•</span>
              <span>Independent feature selection per analysis</span>
            </li>
          </ul>
        </div>
      </div>

      {/* ===================================================
          VIF Analysis Section
      =================================================== */}

      <VIFAnalysis
        isToggled={toggles.vif}
        isExpanded={expandedSections.vif}
        onToggle={() => toggleSwitch('vif')}
        onExpand={() => toggleSection('vif')}
        readonly={isReadonly}
        isLoading={isLoading}
        vifReport={vifReport}
        selectedFeatures={selectedFeatures.vif}
        onFeatureSelect={(feature) => toggleFeatureSelection('vif', feature)}
        sectionDescriptions={sectionDescriptions}
        showError={showFieldErrors && dropperToggles.vif && vifReport.length > 0 && selectedFeatures.vif.length === vifReport.length}
        maxDroppableFeatures={vifMaxDroppable}
        isDropperEnabled={dropperToggles.vif}
        onDropperToggle={() => toggleDropper('vif')}
      />

      {/* ===================================================
          Correlation Analysis Section
      =================================================== */}

      <CorrelationAnalysis
        isToggled={toggles.correlation}
        isExpanded={expandedSections.correlation}
        onToggle={() => toggleSwitch('correlation')}
        onExpand={() => toggleSection('correlation')}
        readonly={isReadonly}
        isLoading={isLoading}
        correlationReport={correlationReport}
        selectedFeatures={selectedFeatures.correlation}
        onFeatureSelect={(feature) => toggleFeatureSelection('correlation', feature)}
        sectionDescriptions={sectionDescriptions}
        showError={false}
        maxDroppableFeatures={correlationMaxDroppable}
        isDropperEnabled={dropperToggles.correlation}
        onDropperToggle={() => toggleDropper('correlation')}
      />

      {/* ===================================================
          Feature-Target Analysis Section
      =================================================== */}

      <FeatureTargetAnalysis
        isToggled={toggles.featureTarget}
        isExpanded={expandedSections.featureTarget}
        onToggle={() => toggleSwitch('featureTarget')}
        onExpand={() => toggleSection('featureTarget')}
        readonly={isReadonly}
        isLoading={isLoading}
        featureTargetReport={featureTargetReport}
        selectedFeatures={selectedFeatures.featureTarget}
        onFeatureSelect={(feature) => toggleFeatureSelection('featureTarget', feature)}
        sectionDescriptions={sectionDescriptions}
        showError={showFieldErrors && dropperToggles.featureTarget && featureTargetReport.length > 0 && selectedFeatures.featureTarget.length === featureTargetReport.length}
        maxDroppableFeatures={featureTargetMaxDroppable}
        isDropperEnabled={dropperToggles.featureTarget}
        onDropperToggle={() => toggleDropper('featureTarget')}
      />
    </div>
  );
}

export default FeatureDependency;
