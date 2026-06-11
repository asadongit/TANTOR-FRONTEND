import React, { useState, useEffect } from 'react';

import { toast } from 'react-hot-toast';

import { useAIPlayground } from '../../../../../../../../context/AIPlaygroundContext';

import { stationarityTreatment } from '../../../../../../../../hooks/AI/datapreprocessing/timeseries';

import { dataPreprocessingDescriptions } from '../../../../../../../../hooks/AI/datapreprocessing/descriptions';

import StationarityTable from './StationarityTable';

/**
 ==
 StationarityTreatment
 ==
 *
 Parent Component for Stationarity Treatment
 *
 Responsibilities:
 ----
 - Holds state for stationarity treatment toggle
 - Handles API payload creation
 - Performs API calls to stationarityTreatment
 - Controls section expand/collapse
 - Displays stationarity analysis report
 *
 */
/**
 Data table component for displaying preview data
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
      {/*Header */}
      {title && (
        <div className="px-4 py-3 border-b border-gray-200 shrink-0">
          <h3 className="text-base font-medium text-gray-900">{title}</h3>
        </div>
      )}

      {/*Table Scroll Area */}
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

      {/*Bottom Info */}
      <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-600 shrink-0">
        Showing 1 to {rowCount} of {rowCount} results • {columnCount} columns
      </div>
    </div>
  );
};

{/* Variant data table component*/}
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



function StationarityTreatmentComponent({readonly,onValidationChange,onApiCall, showPreview})
{  
  //Context Data
  const {
    datasetState,
    workflowsState,
    activeWorkflowId,
    updatePreprocessingStep
  } = useAIPlayground();
   //Get current workflow state
  const workflowState = activeWorkflowId
    ? workflowsState?.[activeWorkflowId]
    : null;

   //Backend Data
   //Stationarity analysis report from step 5 API response
  const rawStationarityReport =
    workflowState?.dataPreprocessing?.step5?.apiResponse
      ?.stationarity_analysis_report || [];

   //Filter report to only include required keys
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
  const step5Config =
  workflowState?.dataPreprocessing?.step5?.config;
  const wasStationarityAnalysisEnabledInStep5 =
  step5Config?.stationarity_analysis_active ?? false;
   //Section Descriptions
  const sectionDescriptions =dataPreprocessingDescriptions;

  {/*Component States*/}
  {/*Toggle for stationarity treatment*/}
  const [stationarityTreatmentActive, setStationarityTreatmentActive] =useState(false);
  {/*Expanded/collapsed section state*/}
  const [expandedSections, setExpandedSections] = useState({stationarityTreatment: false});
  {/*Loading state */}
  const [isLoading, setIsLoading] = useState(false);
  {/*API error state*/}
  const [error, setError] =useState(null);

  {/*Toggle Expand / Collapse Section*/}
  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

   // preview section state
  const [previewData, setPreviewData] = useState(null);

  {/*Toggle Feature Switches*/}
  const toggleSwitch = (key) =>
     {if (readonly || isLoading) return;
      if (
  key === 'stationarityTreatment' &&
  !wasStationarityAnalysisEnabledInStep5
) {
  return;
}
    {/*Stationarity Treatment Toggle*/}
    if (key === 'stationarityTreatment') {
      const newState = !stationarityTreatmentActive;
      setStationarityTreatmentActive(newState);
      {/*Close section if disabled*/}
      if (!newState) {
        setExpandedSections((prev) => ({
          ...prev,
          stationarityTreatment: false
        }));
      }
      {/* Open section if enabled*/}
      if (newState) {
        setExpandedSections({
          stationarityTreatment: true
        });
      }
      {/*Call parent callback to track changes*/}
      if (onValidationChange) {
        onValidationChange();
      }
    }
  };

  {/*Handle API Call (Called on Next Click) */}
  const handleApiCall = async () => {
    setError(null);
    setIsLoading(true);
    try {
      {/*Create Config Object*/}
      const config = {
        stationarity_treatment_active:
          stationarityTreatmentActive
      };

      { /*API Call*/}
      const result =
        await stationarityTreatment({
          ensembleId:datasetState.ensembleId,
          workflowId:activeWorkflowId,
          stationarityTreatmentActive:stationarityTreatmentActive
        });

      {/*Store Response*/}
      updatePreprocessingStep(
        'step6',
        {
          config: config,
          apiResponse: result
        }
      );

      {/* Notify Parent Component*/}
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

      {/*Notify Parent Component*/}
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

    useEffect(() => {
    if (onApiCall) {
      onApiCall(handleApiCall);
    }
  }, [stationarityTreatmentActive]);


  {/*Preview-Only Render Mode*/}
  if (showPreview) {
    // Determine data source and structure
    let cleanedDfData = workflowState.dataPreprocessing?.step6?.apiResponse?.cleaned_df;

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

  /*Expose API Function to Parent */
  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">
            {error}
          </p>
        </div>
      )}

      <StationarityTable
        isToggled={stationarityTreatmentActive}
        isExpanded={expandedSections.stationarityTreatment}
        onToggle={() => toggleSwitch('stationarityTreatment')}
        onExpand={() => toggleSection('stationarityTreatment')}
        readonly={readonly || !wasStationarityAnalysisEnabledInStep5}
        isLoading={isLoading}
        stationarityReport={stationarityAnalysisReport}
        sectionDescriptions={sectionDescriptions}
        stationarityAnalysisEnabled={wasStationarityAnalysisEnabledInStep5}
      />
    </div>
  );
}

export default StationarityTreatmentComponent;
