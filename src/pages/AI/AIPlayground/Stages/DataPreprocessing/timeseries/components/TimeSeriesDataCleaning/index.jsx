import React, { useState, useEffect } from 'react';

import { toast } from 'react-hot-toast';

import { useAIPlayground } from '../../../../../../../../context/AIPlaygroundContext';

import { cleanTimeSeriesData } from '../../../../../../../../hooks/AI/datapreprocessing/timeseries';

import { dataPreprocessingDescriptions } from '../../../../../../../../hooks/AI/datapreprocessing/descriptions';

import ChangeDataType from './ChangeDataType';
import AggregateFeatures from './AggregateFeatures';

/**
 * =========================================================
 * TimeSeriesDataCleaning
 * =========================================================
 *
 * Parent Component for Time Series Data Cleaning
 *
 * Responsibilities:
 * ---------------------------------------------------------
 * - Holds ALL states
 * - Handles API payload creation
 * - Performs API calls
 * - Handles validation
 * - Controls section expand/collapse
 * - Passes props to child components
 *
 * Child Components:
 * ---------------------------------------------------------
 * - ChangeDataType.jsx
 * - AggregateFeatures.jsx
 * - ToggleSwitch.jsx
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

function TimeSeriesDataCleaning({
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
   * Existing column datatypes
   */
  const columnsDataTypes =
    workflowState?.modelGenesis?.apiResponse
      ?.columns_data_types?.manual || {};

  /**
   * Duplicate rows data
   */
  const duplicateRows =
    workflowState?.modelGenesis?.apiResponse
      ?.duplicate_timestamp_report?.duplicate_rows || {};

  /**
   * Extract column names
   */
  const columnNames = Object.keys(columnsDataTypes);

  /**
   * Check if duplicate rows exist
   */
  const hasDuplicateRows =
    duplicateRows &&
    Object.keys(duplicateRows).length > 0;

  /**
   * =======================================================
   * Section Descriptions
   * =======================================================
   */

  const sectionDescriptions =
    dataPreprocessingDescriptions;

  /**
   * =======================================================
   * Available Datatype Options
   * =======================================================
   */

  const dataTypeOptions = [
    'datetime',
    'numeric',
    'boolean',
    'category',
    'string'
  ];

  /**
   * =======================================================
   * Component States
   * =======================================================
   */

  /**
   * Toggle for datatype modification
   */
  const [modifyDataTypes, setModifyDataTypes] =
    useState(false);

  /**
   * Datatype conversion rows
   */
  const [dataTypeColumns, setDataTypeColumns] =
    useState([
      {
        columnName: '',
        oldDataType: '',
        newDataType: ''
      }
    ]);

  /**
   * Expanded/collapsed section state
   */
  const [expandedSections, setExpandedSections] =
    useState({
      changeDataType: false,
      aggregation: false
    });

  /**
   * Validation error state
   */
  const [showFieldErrors, setShowFieldErrors] =
    useState(false);

  /**
   * Aggregation toggle
   */
  const [aggregation, setAggregation] =
    useState(true);

  /**
   * Aggregation method
   */
  const [aggregationMethod, setAggregationMethod] =
    useState('mean');

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
     * Change Data Type Toggle
     * -----------------------------------------------------
     */

    if (key === 'changeDataType') {

      const newState = !modifyDataTypes;

      setModifyDataTypes(newState);

      /**
       * Close section if disabled
       */
      if (!newState) {

        setExpandedSections((prev) => ({
          ...prev,
          changeDataType: false
        }));

        setShowFieldErrors(false);
      }

      /**
       * Open section if enabled
       */
      if (newState) {

        setExpandedSections({
          changeDataType: true,
          aggregation: false
        });
      }
    }

    /**
     * -----------------------------------------------------
     * Aggregation Toggle
     * -----------------------------------------------------
     */

    else if (key === 'aggregation') {

      /**
       * Prevent enabling if no duplicates exist
       */
      if (!hasDuplicateRows) {

        toast.error(
          'Aggregation feature is not available since there are no duplicate rows.',
          {
            duration: 3000,
            position: 'top-right'
          }
        );

        return;
      }

      const newState = !aggregation;

      setAggregation(newState);

      /**
       * Close section if disabled
       */
      if (!newState) {

        setExpandedSections((prev) => ({
          ...prev,
          aggregation: false
        }));
      }

      /**
       * Open section if enabled
       */
      if (newState) {

        setExpandedSections({
          changeDataType: false,
          aggregation: true
        });
      }
    }
  };

  /**
   * =======================================================
   * Get Available Columns
   * =======================================================
   *
   * Prevents duplicate column selection.
   */

  const getAvailableColumns = (currentIndex) => {

    const selected = dataTypeColumns

      .map((col, idx) =>
        idx !== currentIndex
          ? col.columnName
          : null
      )

      .filter(Boolean);

    return columnNames.filter(
      (name) => !selected.includes(name)
    );
  };

  /**
   * =======================================================
   * Check if New Row Can Be Added
   * =======================================================
   */

  const canAddNewRow = () => {

    if (dataTypeColumns.length === 0) {
      return true;
    }

    const last =
      dataTypeColumns[dataTypeColumns.length - 1];

    return !!(
      last.columnName &&
      last.newDataType
    );
  };

  /**
   * =======================================================
   * Handle Column Selection
   * =======================================================
   */

  const handleColumnChange = (
    index,
    columnName
  ) => {

    if (readonly || isLoading) return;

    const newColumns = [...dataTypeColumns];

    newColumns[index] = {

      columnName,

      oldDataType:
        columnsDataTypes[columnName] || '',

      newDataType:
        newColumns[index].newDataType
    };

    setDataTypeColumns(newColumns);
  };

  /**
   * =======================================================
   * Handle New Datatype Selection
   * =======================================================
   */

  const handleNewDataTypeChange = (
    index,
    newDataType
  ) => {

    if (readonly || isLoading) return;

    const newColumns = [...dataTypeColumns];

    newColumns[index].newDataType =
      newDataType;

    setDataTypeColumns(newColumns);
  };

  /**
   * =======================================================
   * Add New Datatype Row
   * =======================================================
   */

  const addColumn = () => {

    if (
      readonly ||
      isLoading ||
      !canAddNewRow()
    ) {
      return;
    }

    setDataTypeColumns([
      ...dataTypeColumns,

      {
        columnName: '',
        oldDataType: '',
        newDataType: ''
      }
    ]);
  };

  /**
   * =======================================================
   * Remove Datatype Row
   * =======================================================
   */

  const removeDataTypeColumn = (index) => {

    if (
      readonly ||
      isLoading ||
      dataTypeColumns.length <= 1
    ) {
      return;
    }

    setDataTypeColumns(
      dataTypeColumns.filter(
        (_, i) => i !== index
      )
    );
  };

  /**
   * =======================================================
   * Expose Submit Function to Parent
   * =======================================================
   */

  useEffect(() => {

    if (onApiCall) {

      onApiCall(handleSubmit);
    }

  }, [
    modifyDataTypes,
    dataTypeColumns,
    aggregation,
    aggregationMethod,
    onApiCall
  ]);

  /**
   * =======================================================
   * Final API Submit
   * =======================================================
   */

  const handleSubmit = async () => {

    try {

      setIsLoading(true);

      setError(null);

      /**
       * ---------------------------------------------------
       * Validate Aggregation
       * ---------------------------------------------------
       */

      if (
        hasDuplicateRows &&
        !aggregation
      ) {

        toast.error(
          'Please select the Aggregation feature to process the data.',
          {
            duration: 4000,
            position: 'top-right'
          }
        );

        setIsLoading(false);

        return false;
      }

      /**
       * ---------------------------------------------------
       * Create Datatype Mapping
       * ---------------------------------------------------
       */

      const modifyDataTypesMap = {};

      dataTypeColumns.forEach((col) => {

        if (
          col.columnName &&
          col.newDataType
        ) {

          modifyDataTypesMap[
            col.columnName
          ] = col.newDataType;
        }
      });

      /**
       * ---------------------------------------------------
       * Final Config Payload
       * ---------------------------------------------------
       */

      const config = {

        ensemble_id:
          datasetState.ensembleId,

        workflow_id:
          activeWorkflowId,

        modify_data_types:
          modifyDataTypes,

        modify_data_types_map:
          modifyDataTypesMap,

        aggregation:
          aggregation,

        aggregation_method:
          aggregationMethod
      };

      /**
       * ---------------------------------------------------
       * API Call
       * ---------------------------------------------------
       */

      const result =
        await cleanTimeSeriesData({

          ensembleId:
            datasetState.ensembleId,

          workflowId:
            activeWorkflowId,

          modifyDataTypes:
            modifyDataTypes,

          modifyDataTypesMap:
            modifyDataTypesMap,

          aggregation:
            aggregation,

          aggregationMethod:
            aggregationMethod
        });

      /**
       * ---------------------------------------------------
       * Store Response
       * ---------------------------------------------------
       */

      updatePreprocessingStep(
        'step1',
        {
          config: config,
          apiResponse: result
        }
      );

      /**
       * Validation Success
       */
      if (onValidationChange) {

        onValidationChange(true);
      }

      toast.success(
        'Time series data preprocessing completed successfully!',
        {
          duration: 3000,
          position: 'top-right'
        }
      );

      return result;

    } catch (error) {

      console.error(
        'Error cleaning time series data:',
        error
      );

      const errorMessage =
        error?.response?.data?.message ||
        'Failed to process data. Please try again.';

      setError(errorMessage);

      toast.error(errorMessage, {
        duration: 4000,
        position: 'top-right'
      });

      if (onValidationChange) {

        onValidationChange(false);
      }

      return false;

    } finally {

      setIsLoading(false);
    }
  };

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
          Change Data Type Section
      =================================================== */}

      <ChangeDataType

        modifyDataTypes={modifyDataTypes}

        expanded={
          expandedSections.changeDataType
        }

        toggleSwitch={toggleSwitch}

        toggleSection={toggleSection}

        readonly={readonly}

        isLoading={isLoading}

        dataTypeColumns={dataTypeColumns}

        columnsDataTypes={columnsDataTypes}

        dataTypeOptions={dataTypeOptions}

        showFieldErrors={showFieldErrors}

        getAvailableColumns={
          getAvailableColumns
        }

        canAddNewRow={canAddNewRow}

        handleColumnChange={
          handleColumnChange
        }

        handleNewDataTypeChange={
          handleNewDataTypeChange
        }

        addColumn={addColumn}

        removeDataTypeColumn={
          removeDataTypeColumn
        }

        sectionDescriptions={
          sectionDescriptions
        }
      />

      {/* ===================================================
          Aggregate Features Section
      =================================================== */}

      <AggregateFeatures

        aggregation={aggregation}

        expanded={
          expandedSections.aggregation
        }

        toggleSwitch={toggleSwitch}

        toggleSection={toggleSection}

        readonly={readonly}

        isLoading={isLoading}

        hasDuplicateRows={
          hasDuplicateRows
        }

        aggregationMethod={
          aggregationMethod
        }

        setAggregationMethod={
          setAggregationMethod
        }

        duplicateRows={duplicateRows}

        sectionDescriptions={
          sectionDescriptions
        }
      />
    </div>
  );
}

export default TimeSeriesDataCleaning;