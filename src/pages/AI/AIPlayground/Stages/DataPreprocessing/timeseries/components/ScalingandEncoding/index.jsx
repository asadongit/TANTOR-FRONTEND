import React, { useState, useEffect, useCallback } from 'react';
import CategoricalEncoding from './encoding';
import FeatureScaling from './scaling';
import { scalingAndEncoding } from '../../../../../../../../hooks/AI/datapreprocessing/timeseries';
import { useAIPlayground } from '../../../../../../../../context/AIPlaygroundContext';
import { dataPreprocessingDescriptions } from '../../../../../../../../hooks/AI/datapreprocessing/descriptions';

function ScalingandEncoding({ readonly: readonlyProp, onApiCall }) {
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
  const isReadonly = readonlyProp || mode === 'view';

  /**
   * Get current workflow state
   */
  const workflowState = activeWorkflowId
    ? workflowsState?.[activeWorkflowId]
    : null;

  const currentWorkflowId = workflowState?.workflow_id || activeWorkflowId;

  /**
   * =======================================================
   * Component States
   * =======================================================
   */

  /**
   * Toggles for scaling and encoding
   */
  const [toggles, setToggles] = useState({
    encoding: false,
    scaling: false
  });

  /**
   * Expanded/collapsed section state
   */
  const [expandedSections, setExpandedSections] = useState({
    encoding: false,
    scaling: false
  });

  /**
   * Selected methods
   */
  const [selectedMethods, setSelectedMethods] = useState({
    encodingMethod: 'onehot',
    scalingMethod: 'standard'
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
   * =======================================================
   * Initialize state from existing config on edit mode
   * =======================================================
   */
  useEffect(() => {
    if ((mode === 'view' || mode === 'edit') && workflowState?.dataPreprocessing?.step8?.config) {
      const config = workflowState.dataPreprocessing.step8.config;

      setToggles({
        encoding: config.encoding_active || false,
        scaling: config.scaling_active || false
      });

      setSelectedMethods({
        encodingMethod: config.encoding_type || 'onehot',
        scalingMethod: config.scaling_method || 'standard'
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

  /**
   * =======================================================
   * Toggle Feature Switches
   * =======================================================
   */
  const toggleSwitch = (key) => {
    if (isReadonly || isLoading) return;

    const newState = !toggles[key];
    setToggles(prev => ({ ...prev, [key]: newState }));

    /**
     * Close section if disabled
     */
    if (!newState) {
      setExpandedSections((prev) => ({
        ...prev,
        [key]: false
      }));
    }

    /**
     * Open section if enabled
     */
    if (newState) {
      setExpandedSections({
        encoding: key === 'encoding',
        scaling: key === 'scaling'
      });
    }
  };

  /**
   * =======================================================
   * Handle Method Selection
   * =======================================================
   */
  const handleEncodingChange = (method) => {
    if (isReadonly || isLoading) return;
    setSelectedMethods(prev => ({ ...prev, encodingMethod: method }));
  };

  const handleScalingChange = (method) => {
    if (isReadonly || isLoading) return;
    setSelectedMethods(prev => ({ ...prev, scalingMethod: method }));
  };

  /**
   * =======================================================
   * Validation Checks
   * =======================================================
   */
  const getValidationError = () => {
    if (toggles.encoding && !selectedMethods.encodingMethod) {
      return 'Please select an encoding method';
    }
    if (toggles.scaling && !selectedMethods.scalingMethod) {
      return 'Please select a scaling method';
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
      setError(validationError);
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
        scaling_active: toggles.scaling,
        encoding_active: toggles.encoding,
        encoding_type: toggles.encoding ? selectedMethods.encodingMethod : null,
        scaling_method: toggles.scaling ? selectedMethods.scalingMethod : null,
        handle_unknown: 'ignore'
      };

      /**
       * ---------------------------------------------------
       * API Call
       * ---------------------------------------------------
       */
      const result = await scalingAndEncoding({
        ensembleId: datasetState.ensembleId,
        workflowId: activeWorkflowId,
        scalingActive: toggles.scaling,
        encodingActive: toggles.encoding,
        encodingType: toggles.encoding ? selectedMethods.encodingMethod : null,
        scalingMethod: toggles.scaling ? selectedMethods.scalingMethod : null,
        handleUnknown: 'ignore'
      });

      /**
       * ---------------------------------------------------
       * Store Response
       * ---------------------------------------------------
       */
      updatePreprocessingStep(activeWorkflowId, 'step8', {
        config,
        apiResponse: result
      });

      if (onApiCall) {
        onApiCall();
      }

      return true;
    } catch (err) {
      console.error('Error in scaling and encoding:', err);
      setError(err?.message || 'Failed to execute scaling and encoding');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [
    isReadonly,
    toggles,
    selectedMethods,
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
      setError(null);
    }
  }, [toggles, selectedMethods, showFieldErrors]);

  /**
   * Derived error flags — only active after Next is clicked
   */
  const encodingError = showFieldErrors && toggles.encoding && !selectedMethods.encodingMethod;
  const scalingError = showFieldErrors && toggles.scaling && !selectedMethods.scalingMethod;

  /**
   * =======================================================
   * Render
   * =======================================================
   */
  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Categorical Encoding Section */}
      <CategoricalEncoding
        isToggled={toggles.encoding}
        isExpanded={expandedSections.encoding}
        onToggle={() => toggleSwitch('encoding')}
        onExpand={() => toggleSection('encoding')}
        selectedEncoding={selectedMethods.encodingMethod}
        onEncodingChange={handleEncodingChange}
        readonly={isReadonly}
        hasError={encodingError}
        sectionDescriptions={dataPreprocessingDescriptions}
      />

      {/* Feature Scaling Section */}
      <FeatureScaling
        isToggled={toggles.scaling}
        isExpanded={expandedSections.scaling}
        onToggle={() => toggleSwitch('scaling')}
        onExpand={() => toggleSection('scaling')}
        selectedScaling={selectedMethods.scalingMethod}
        onScalingChange={handleScalingChange}
        readonly={isReadonly}
        sectionDescriptions={dataPreprocessingDescriptions}
      />
    </div>
  );
}

export default ScalingandEncoding;
