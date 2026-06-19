import React, { useState, useEffect, useCallback } from 'react';
import CategoricalEncoding from './encoding';
import FeatureScaling from './scaling';
import { scalingAndEncoding } from '../../../../../../../../hooks/AI/datapreprocessing/timeseries';
import { useAIPlayground } from '../../../../../../../../context/AIPlaygroundContext';
import { dataPreprocessingDescriptions } from '../../../../../../../../hooks/AI/datapreprocessing/descriptions';

/**
 * Data table component for displaying preview data
 */
const CleanDataTable = ({ title, data }) => {
  const normalizedRows = Array.isArray(data)
    ? data.filter((row) => row && typeof row === 'object' && !Array.isArray(row))
    : (data && typeof data === 'object')
      ? Object.values(data).filter((row) => row && typeof row === 'object' && !Array.isArray(row))
      : [];

  if (normalizedRows.length === 0) return null;

  const rowCount = normalizedRows.length;
  const firstRow = normalizedRows[0] || {};
  const columnCount = Object.keys(firstRow).length;

  return (
    <div className="flex flex-col bg-white border border-gray-200 rounded-lg">
      {/* Header */}
      {title && (
        <div className="px-4 py-3 border-b border-gray-200 shrink-0">
          <h3 className="text-base font-medium text-gray-900">{title}</h3>
        </div>
      )}

      {/* Table Scroll Area */}
      <div className="">
        <div className="overflow-auto">
          <table className="min-w-full border-collapse">
            <thead className="sticky top-0 z-20 bg-[#F9F9F9]">
              <tr className="border-b border-gray-200">
                <th className="px-5 py-3 text-left text-sm font-medium text-gray-800 sticky left-0 bg-[#F9F9F9] z-30">
                  #
                </th>
                {Object.keys(firstRow).map(key => (
                  <th
                    key={key}
                    className="px-5 py-3 text-left text-sm font-medium text-gray-800 whitespace-nowrap"
                  >
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {normalizedRows.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-sm text-gray-500 sticky left-0 bg-white">
                    {index + 1}
                  </td>
                  {Object.entries(row).map(([key, value]) => (
                    <td key={key} className="px-5 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {typeof value === 'number' ? value.toFixed(4) : value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Info */}
      <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-600 shrink-0">
        Showing 1 to {rowCount} of {rowCount} results • {columnCount} columns
      </div>
    </div>
  );
};

/**
 * Variant data table component
 */
const VariantDataTable = ({ variantKey, displayData }) => {
  const normalizedRows = Array.isArray(displayData)
    ? displayData
    : (displayData && typeof displayData === 'object')
      ? Object.values(displayData)
      : [];

  if (normalizedRows.length === 0) return null;

  return (
    <CleanDataTable
      title={`${variantKey.toUpperCase()} -  Data Preview`}
      data={normalizedRows}
    />
  );
};

function ScalingandEncoding({ readonly: readonlyProp, onApiCall, showPreview }) {
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
   * Backend Data
   * =======================================================
   */

  /**
   * Get categorical columns from step 6 (Stationarity Treatment)
   */
  const step6Response = workflowState?.dataPreprocessing?.step7?.apiResponse || {};
  const categoricalColumns = step6Response?.categorical_columns || [];
  const hasCategoricalColumns = Array.isArray(categoricalColumns) && categoricalColumns.length > 0;

  /**
   * Get numerical columns from step 7 (Feature Dependency)
   */
  const step7Response = workflowState?.dataPreprocessing?.step7?.apiResponse || {};
  const numericalColumns = step7Response?.numerical_columns || [];
  const hasNumericalColumns = Array.isArray(numericalColumns) && numericalColumns.length > 0;

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
   * Preview data from API response
   */
  const [previewData, setPreviewData] = useState(null);

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
      if (workflowState.dataPreprocessing.step8.apiResponse) {
        setPreviewData(workflowState.dataPreprocessing.step8.apiResponse);
      }
    }
  }, [mode, workflowState]);
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

    /**
     * Prevent toggling encoding if no categorical columns
     */
    if (key === 'encoding' && !hasCategoricalColumns) return;

    /**
     * Prevent toggling scaling if no numerical columns
     */
    if (key === 'scaling' && !hasNumericalColumns) return;

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
      updatePreprocessingStep('step8', {
        config,
        apiResponse: result
      });

      setPreviewData(result);

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
   * Preview-Only Render Mode
   * =======================================================
   */
  if (showPreview) {
    // Determine data source and structure
    let cleanedDfData = previewData?.cleaned_df;

    // If no data available, show message
    if (!cleanedDfData) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-yellow-800">No Data Available</h3>
          <p className="text-xs text-yellow-600 mt-1">No scaled and encoded data preview is available. Please run the process first.</p>
        </div>
      );
    }

    // Check if data is a simple array
    if (Array.isArray(cleanedDfData) && cleanedDfData.length > 0) {
      return (
        <div className="space-y-4 -mx-6">
          <CleanDataTable
            title="Scaled & Encoded Data Preview"
            data={cleanedDfData}
          />
        </div>
      );
    }

    // Check if data is object with variant keys (p1, p2, etc.)
    if (typeof cleanedDfData === 'object' && !Array.isArray(cleanedDfData)) {
      const variantKeys = Object.keys(cleanedDfData);
      const isMultiVariant = variantKeys.length > 0 &&
        variantKeys.some(key => key.match(/^p\d+$/)) &&
        Array.isArray(cleanedDfData[variantKeys[0]]);

      if (isMultiVariant) {
        const validVariants = variantKeys.filter(key =>
          key.match(/^p\d+$/) && Array.isArray(cleanedDfData[key]) && cleanedDfData[key].length > 0
        );

        if (validVariants.length > 0) {
          return (
            <div className="space-y-4 -mx-6">
              {validVariants.map(variantKey => (
                <VariantDataTable key={variantKey} variantKey={variantKey} displayData={cleanedDfData[variantKey]} />
              ))}
            </div>
          );
        }
      }
    }

    // No valid data structure found
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-yellow-800">No Valid Data</h3>
        <p className="text-xs text-yellow-600 mt-1">No valid preview data structure found.</p>
      </div>
    );
  }

  /**
   * =======================================================
   * Render - Configuration Mode
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
        readonly={isReadonly || !hasCategoricalColumns}
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
        readonly={isReadonly || !hasNumericalColumns}
        sectionDescriptions={dataPreprocessingDescriptions}
      />
    </div>
  );
}

export default ScalingandEncoding;
