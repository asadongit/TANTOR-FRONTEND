import React, { useState, useEffect } from 'react';

import { toast } from 'react-hot-toast';

import { useAIPlayground } from '../../../../../../../../context/AIPlaygroundContext';

import { cleanTimeSeriesData } from '../../../../../../../../hooks/AI/datapreprocessing/timeseries';

import { dataPreprocessingDescriptions } from '../../../../../../../../hooks/AI/datapreprocessing/descriptions';

import ChangeDataType from './ChangeDataType';
// import AggregateFeatures from './AggregateFeatures';

/**
 * Responsibilities:
 * ---------------------------------------------------------
 * - Holds ALL states
 * - Handles API payload creation
 * - Performs API calls
 * - Handles validation
 * - Controls section expand/collapse
 * - Passes props to child components

 * =========================================================
 */

function TimeSeriesDataCleaning({readonly,onValidationChange, onApiCall, predictionType
}) {


  const {datasetState,workflowsState,activeWorkflowId,updatePreprocessingStep } = useAIPlayground();
  const isUnivariateTimeseries =predictionType === 'univariate_timeseries';
  const workflowState = activeWorkflowId? workflowsState?.[activeWorkflowId]: null;
  const columnsDataTypes =workflowState?.modelGenesis?.apiResponse?.columns_data_types?.manual || {};
  const duplicateRows = workflowState?.modelGenesis?.apiResponse?.duplicate_timestamp_report?.duplicate_rows || {};
  const columnNames = Object.keys(columnsDataTypes);
  const hasDuplicateRows =duplicateRows &&Object.keys(duplicateRows).length > 0;
  const sectionDescriptions = dataPreprocessingDescriptions;

  const dataTypeOptions = [
    'datetime',
    'numeric',
    'boolean',
    'category',
    'string'
  ];
  const savedConfig =workflowState?.dataPreprocessing?.step1?.config;
  const hasSavedConfig = !!savedConfig;
  const [modifyDataTypes, setModifyDataTypes] =useState(false);
  const [dataTypeColumns, setDataTypeColumns] =useState([
      {
        columnName: '',
        oldDataType: '',
        newDataType: ''
      }
    ]);

  const [expandedSections, setExpandedSections] =
    useState({
      changeDataType: false,
      aggregation: false
    });

  const [showFieldErrors, setShowFieldErrors] =useState(false);

  const [aggregation, setAggregation] =useState(hasDuplicateRows);

  const [aggregationMethod, setAggregationMethod] =useState('mean');

  const [isLoading, setIsLoading] =
    useState(false);


  const [error, setError] =
    useState(null);

  useEffect(() => {
      if (!hasSavedConfig) return;

      setModifyDataTypes(
        savedConfig.modify_data_types || false
      );

      setAggregation(
        savedConfig.aggregation ?? hasDuplicateRows
      );

      setAggregationMethod(
        savedConfig.aggregation_method || 'mean'
      );

      if (
        savedConfig.modify_data_types_map &&
        Object.keys(savedConfig.modify_data_types_map).length > 0
      ) {
        setDataTypeColumns(
          Object.entries(
            savedConfig.modify_data_types_map
          ).map(([columnName, newDataType]) => ({
            columnName,
            oldDataType:
              columnsDataTypes[columnName] || '',
            newDataType
          }))
        );
      } else {
        setDataTypeColumns([
          {
            columnName: '',
            oldDataType: '',
            newDataType: ''
          }
        ]);
      }
    }, [
      savedConfig,
      columnsDataTypes,
      hasDuplicateRows
    ]);

  const toggleSection = (section) => {

    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section]
    }));
  };



  useEffect(() => {
    if (hasSavedConfig) return;

    setAggregation(hasDuplicateRows);
  }, [hasDuplicateRows, hasSavedConfig]);

  const toggleSwitch = (key) => {

    if (readonly || isLoading) return;

    

    if (key === 'changeDataType') {

      /**
       * Block feature for univariate timeseries
       */
      if (isUnivariateTimeseries) {
        toast.error(
          'Change Data Type is not available for univariate timeseries.',
          {
            duration: 3000,
            position: 'top-right'
          }
        );
        return;
      }

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

        // Reset all selected values
        setDataTypeColumns([
          {
            columnName: '',
            oldDataType: '',
            newDataType: ''
          }
        ]);
      }

      /**
       * Open section if enabled
       */
      if (newState) {
        setShowFieldErrors(false);

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

  const dropColumns =
    workflowState?.modelGenesis?.config?.drop_columns || [];

  const targetColumn =
    workflowState?.modelGenesis?.config?.target_column || '';

  const timeColumn =
    workflowState?.modelGenesis?.config?.timeColumn || '';

  return columnNames.filter(
    (name) =>
      !selected.includes(name) &&
      !dropColumns.includes(name) &&
      name !== targetColumn &&
      name !== timeColumn
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
      oldDataType:columnsDataTypes[columnName] || '',
      newDataType:newColumns[index].newDataType};
    setDataTypeColumns(newColumns);
  };


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


  const handleSubmit = async () => {
    if (readonly) return true;
    try {
      setIsLoading(true);
      setError(null);
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

      if (modifyDataTypes) {
        const hasSelectedFeature = Object.keys(
          modifyDataTypesMap
        ).length > 0;

        if (!hasSelectedFeature) {
          setShowFieldErrors(true);

          toast.error(
            'Please select at least one feature.',
            {
              duration: 4000,
              position: 'top-right'
            }
          );

          setIsLoading(false);
          return false;
        }
      }


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
  {!isUnivariateTimeseries && (
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
        disabled={isUnivariateTimeseries}

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
      )}

    </div>
  );
}

export default TimeSeriesDataCleaning;