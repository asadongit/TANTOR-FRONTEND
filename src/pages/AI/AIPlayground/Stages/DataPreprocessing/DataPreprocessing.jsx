  import React, { useState, useRef, useEffect } from 'react';
  import { AIPlaygroundLayout } from '../../AIPlaygroundLayout';
  import { Check, Eye } from 'lucide-react';
  import { useAIPlayground } from '../../../../../context/AIPlaygroundContext';

  //  supervised preprocessing steps
  import DataCleaning from './Steps/DataCleaning';
  import FeatureSelection from './Steps/FeatureSelection';
  import FeatureEngineering from './Steps/FeatureEngineering';
  import ScalingTransformation from './Steps/ScalingTransformation';
  import StatisticalAnalysis from './Steps/StatisticalAnalysis';
  import FeatureImportance from './Steps/FeatureImportance';
  import Step7 from './Steps/Step7';


  // Routing utilities
  import { useLocation, useNavigate } from 'react-router-dom';
  // Modal for previewing processed data
  import DataPreviewModal from '../../modals/DataPreprocessing/DataPreviewModal';

  // Time series preprocessing components
  import TimeSeriesDataCleaning from './timeseries/components/TimeSeriesDataCleaning';
  import HandleMissingValues from './timeseries/components/HandleMissingValues';
  import FeatureIntegrity from './timeseries/components/FeatureIntegrity';
  import DataStabilization from './timeseries/components/DataStabilization';
  import Seasonality from './timeseries/components/Seasonality';
  import StationarityTreatment from './timeseries/components/StationarityTreatment';
  import FeatureDependency from './timeseries/FeatureDependency';
  import ScalingandEncoding from './timeseries/components/ScalingandEncoding';

  /**
   * Returns preprocessing steps based on prediction type.
   */
  const getPreprocessingSteps = (predictionType) => {
    if (predictionType === 'univariate_timeseries') {
      return [
        { id: 1, label: 'Handle Missing Values', isTimeSeries: true },
        { id: 2, label: 'Feature Integrity', isTimeSeries: true },
        { id: 3, label: 'Data Stabilization', isTimeSeries: true },
        { id: 4, label: 'Seasonality Treatment', isTimeSeries: true },
        { id: 5, label: 'Stationarity Analysis', isTimeSeries: true },
        { id: 6, label: 'Stationarity Treatment', isTimeSeries: true },
      ];
    }

    if (
      predictionType === 'multivariate_timeseries' ||
      predictionType === 'multiseries_timeseries'
    ) {
      return [
        { id: 1, label: 'Data Cleaning', isTimeSeries: true },
        { id: 2, label: 'Handle Missing Values', isTimeSeries: true },
        { id: 3, label: 'Feature Integrity', isTimeSeries: true },
        { id: 4, label: 'Data Stabilization', isTimeSeries: true },
        { id: 5, label: 'Seasonality Treatment', isTimeSeries: true },
        { id: 6, label: 'Stationarity Treatment', isTimeSeries: true },
        { id: 7, label: 'Feature Dependency', isTimeSeries: true },
        { id: 8, label: 'Scaling & Encoding', isTimeSeries: true },
      ];
    }

    // Standard ML workflow steps
    return [
      { id: 1, label: 'Data Pre-processing' },
      { id: 2, label: 'Feature Selection' },
      { id: 3, label: 'Feature Engineering' },
      { id: 4, label: 'Scaling & Transformation' },
      { id: 5, label: 'Statistical Analysis' },
      { id: 6, label: 'Feature Importance' },
      { id: 7, label: 'Imbalance handling' },
    ];
  };

  function DataPreprocessing() {
    // AI backend hostname from environment config
    const hostnameAI = window._env_?.VITE_AI_API;

    // Global workflow state from context
    const {
      workflowsState,
      activeWorkflowId,
      mode,
      datasetState,
      updateWorkflowStage,
    } = useAIPlayground();

    // Current workflow state
    const workflowState = activeWorkflowId ? workflowsState?.[activeWorkflowId]: null;

    // Determines whether screen is in readonly/view mode
    const readonly = mode === 'view';
    const navigate = useNavigate();

    /**
     * Redirect user back to playground
     * if dataset is not available.
     */
    useEffect(() => {
      if (!datasetState?.ensembleId) {
        navigate('/ai/playground');
      }
    }, []);

    // Model configuration object
    const modelGenesisConfig = workflowState?.modelGenesis?.config;

    // Prediction type determines preprocessing flow
    const predictionType = modelGenesisConfig?.modelling_type;

    // Dynamic step list
    const preprocessingSteps = getPreprocessingSteps(predictionType);

    // Data preprocessing mode
    const dataPreprocessingMode = readonly
      ? modelGenesisConfig?.data_preprocessing_mode
      : modelGenesisConfig?.dataPreprocessing;

    // Model selection mode
    const modelSelectionMode = modelGenesisConfig?.modelSelection;

    /**
     * Checks whether preprocessing is auto-generated
     * using predefined modes.
     */
    const isDataPreprocessingAuto = !!(
      dataPreprocessingMode &&
      ['Swift', 'Standard', 'Comprehensive'].includes(
        dataPreprocessingMode
      )
    );

    /**
     * Checks whether model selection is auto-generated.
     */
    const isModelSelectionAuto = !!(
      modelSelectionMode &&
      ['Swift', 'Standard', 'Comprehensive'].includes(
        modelSelectionMode
      )
    );

    // Current active preprocessing step if it is univariate it starts from 2 
   const [currentStep, setCurrentStep] = useState(() => {
  if (isDataPreprocessingAuto) return 7;

  if (predictionType === 'univariate_timeseries') {
    return 2;
  }

  return 1;
});

    // Whether preview screen is open on step 7
    const [isStep7Preview, setIsStep7Preview] = useState(isDataPreprocessingAuto);
    // Whether preview screen is open on step 8 (time series)
    const [isStep8Preview, setIsStep8Preview] = useState(false);

    //preview screen state for univariate time series
    const [isUnivariatePreview, setIsUnivariatePreview] = useState(false);

    // Validation states for individual steps
    const [isStep1Valid, setIsStep1Valid] = useState(true);
    const [isStep2Valid, setIsStep2Valid] = useState(true);
    const [isStep4Valid, setIsStep4Valid] = useState(true);
    const [isStep5Valid, setIsStep5Valid] = useState(true);

    // Preview modal state
    const [isPreviewModalOpen, setIsPreviewModalOpen] =
      useState(false);

    // Global API loading state
    const [isApiCallInProgress, setIsApiCallInProgress] =
      useState(false);

    /**
     * Auto-advance from step 6 if stationarity analysis was not enabled in step 5 and it's not univariate timeseries
     */
    useEffect(() => {
      if (currentStep === 6) {
        const step5Config = workflowState?.dataPreprocessing?.step5?.config;
        const wasStationarityAnalysisEnabledInStep5 = step5Config?.stationarity_analysis_active ?? false;
        const isUnivariateTimeseries = predictionType === 'univariate_timeseries';
        if (!wasStationarityAnalysisEnabledInStep5 && !isUnivariateTimeseries) {
          setCurrentStep(7);
        }
      }
    }, [currentStep, workflowState?.dataPreprocessing?.step5?.config]);

    /**
     * Auto-advance to preview mode after step 8 for time series if auto-preprocessing is enabled*/
    useEffect(() => {
      const isTimeSeries =
        predictionType &&
        [

          'multivariate_timeseries'
        ].includes(predictionType);

      if (isTimeSeries && currentStep === 8 && isDataPreprocessingAuto) {
        setIsStep8Preview(true);
      }
    }, [currentStep, isDataPreprocessingAuto, predictionType]);


    /**
     * Locks user interactions while
     * API calls are in progress or in readonly mode.
     */
    const isInteractionLocked =
      readonly || isApiCallInProgress;

    /**
     * Refs used to store step-specific API handlers.
     * Each child step registers its API function here.
     */
    const step1ApiCallRef = useRef(null);
    const step2ApiCallRef = useRef(null);
    const step3ApiCallRef = useRef(null);
    const step4ApiCallRef = useRef(null);
    const step5ApiCallRef = useRef(null);
    const step6ApiCallRef = useRef(null);
    const step7ApiCallRef = useRef(null);
    const step8ApiCallRef = useRef(null);



    /**
     * Handles next button click.
     * Executes API calls for current step.
     */
    const handleNextClick = async () => {
      setIsApiCallInProgress(true);

      try {
        /**
         * Special handling:
         * If step 7 preview is active and model selection is auto,
         * fetch completed job details.
         */
        if (
          currentStep === 7 &&
          isStep7Preview &&
          isModelSelectionAuto
        ) {
          try {
            // Job ID from auto preprocessing response
            const autoModeJobId =
              workflowState?.modelGenesis?.apiResponse?.job_id ??
              null;

            // Select correct job ID based on preprocessing mode
            const jobId = isDataPreprocessingAuto
              ? autoModeJobId
              : workflowState?.dataPreprocessing?.step7
                  ?.apiResponse?.job_id;

            // Fetch completed job details
            if (jobId && hostnameAI) {
              const response = await fetch(
                `${hostnameAI}/jobs/${jobId}`,
                {
                  method: 'GET',
                  headers: { accept: 'application/json' },
                }
              );

              if (response.ok) {
                const data = await response.json();

                // Save completed job response
                updateWorkflowStage?.('completedJobs', {
                  config: { job_id: jobId },
                  apiResponse: data,
                });
              }
            }
          } catch (error) {
            console.error(
              'Error fetching job details:',
              error
            );
          }

          return true;
        }

        // Prevent duplicate execution in preview mode
        if (currentStep === 7 && isStep7Preview) return true;

        /**
         * Special handling for step 8 preview (time series):
         * Exit preview mode and move to model selection.
         */
        if (currentStep === 8 && isStep8Preview) {
          return true;
        }

        // Prevent duplicate execution in step 8 preview mode
        if (currentStep === 8 && isStep8Preview) return true;

        /**
         * Array mapping step number
         * to corresponding API function.
         */
        const stepApiRefs = [
          null,
          step1ApiCallRef.current,
          step2ApiCallRef.current,
          step3ApiCallRef.current,
          step4ApiCallRef.current,
          step5ApiCallRef.current,
          step6ApiCallRef.current,
          step7ApiCallRef.current,
          step8ApiCallRef.current,
        ];

        // Get current step API function
        const apiCallFn = stepApiRefs[currentStep] ?? null;

        // Skip if no API exists
        if (typeof apiCallFn !== 'function') return true;

        // Execute current step API
        const apiResult = await apiCallFn();

        return apiResult;
      } finally {
        // Reset loading state
        setIsApiCallInProgress(false);
      }
    };

    /**
     * Opens processed data preview modal.
     */
    const handlePreviewClick = () => {
      setIsPreviewModalOpen(true);
    };

    /**
     * Dynamically renders preprocessing step component
     * based on workflow type and current step.
     */
    const renderStepContent = () => {
      const isTimeSeries =
        predictionType &&
        [
          'univariate_timeseries',
          'multivariate_timeseries',
          'multiseries_timeseries',
        ].includes(predictionType);

      /**
       * Time series workflow rendering
       */
      if (isTimeSeries) {
        switch (currentStep) {
          case 1:
            return (
              <TimeSeriesDataCleaning
                readonly={isInteractionLocked}
                onValidationChange={setIsStep1Valid}
                onApiCall={(fn) =>
                  (step1ApiCallRef.current = fn)
                }
                predictionType={predictionType}
              />
            );
          case 2:
            return (
              <HandleMissingValues
                readonly={isInteractionLocked}
                onValidationChange={setIsStep2Valid}
                onApiCall={(fn) =>
                  (step2ApiCallRef.current = fn)
                }
                predictionType={predictionType}
              />
            );
          case 3:
            return (
              <FeatureIntegrity
                readonly={isInteractionLocked}
                onApiCall={(fn) =>
                  (step3ApiCallRef.current = fn)
                }
                predictionType={predictionType}
              />
            );
          case 4:
            return (
              <DataStabilization
                readonly={isInteractionLocked}
                onApiCall={(fn) =>
                  (step4ApiCallRef.current = fn)
                }
                predictionType={predictionType}
              />
            );

          case 5:
            return (
              <Seasonality
                readonly={isInteractionLocked}
                onApiCall={(fn) =>
                  (step5ApiCallRef.current = fn)
                }
                predictionType={predictionType}
              />
            );

          case 6: {
            // if stationarity analysis was not enabled in step 5 and it's not univariate timeseries, skip stationarity treatment
            const step5Config = workflowState?.dataPreprocessing?.step5?.config;
            const wasStationarityAnalysisEnabledInStep5 = step5Config?.stationarity_analysis_active ?? false;
            const isUnivariateTimeseries = predictionType === 'univariate_timeseries';
         
            if (!wasStationarityAnalysisEnabledInStep5 && !isUnivariateTimeseries) {
             return null;
            }
            return (
              <StationarityTreatment
                readonly={isInteractionLocked}
                onApiCall={(fn) =>
                  (step6ApiCallRef.current = fn)
                }
                 showPreview={predictionType === 'univariate_timeseries' && isUnivariatePreview}
              />
            );
          }

          case 7:
            return (
              <FeatureDependency
                readonly={isInteractionLocked}
                onApiCall={(fn) =>
                  (step7ApiCallRef.current = fn)
                }
              />
            );

          case 8:
            return (
              <ScalingandEncoding
                readonly={isInteractionLocked}
                onApiCall={(fn) =>
                  (step8ApiCallRef.current = fn)
                }
                showPreview={isStep8Preview}
              />
            );

          default:
            return null;
        }
      }

      /**
       * Standard ML workflow rendering
       */
      switch (currentStep) {
        case 1:
          return (
            <DataCleaning
              readonly={isInteractionLocked}
              onValidationChange={setIsStep1Valid}
              onApiCall={(fn) =>
                (step1ApiCallRef.current = fn)
              }
            />
          );

        case 2:
          return (
            <FeatureSelection
              readonly={isInteractionLocked}
              onValidationChange={setIsStep2Valid}
              onApiCall={(fn) =>
                (step2ApiCallRef.current = fn)
              }
            />
          );

        case 3:
          return (
            <FeatureEngineering
              readonly={isInteractionLocked}
              onApiCall={(fn) =>
                (step3ApiCallRef.current = fn)
              }
            />
          );

        case 4:
          return (
            <ScalingTransformation
              readonly={isInteractionLocked}
              onValidationChange={setIsStep4Valid}
              onApiCall={(fn) =>
                (step4ApiCallRef.current = fn)
              }
            />
          );

        case 5:
          return (
            <StatisticalAnalysis
              readonly={isInteractionLocked}
              onValidationChange={setIsStep5Valid}
              onApiCall={(fn) =>
                (step5ApiCallRef.current = fn)
              }
            />
          );

        case 6:
          return (
            <FeatureImportance
              readonly={isInteractionLocked}
              onApiCall={(fn) =>
                (step6ApiCallRef.current = fn)
              }
            />
          );

        case 7:
          return (
            <Step7
              readonly={isInteractionLocked}
              showPreview={isStep7Preview}
              isDataPreprocessingAuto={
                isDataPreprocessingAuto
              }
              onApiCall={(fn) =>
                (step7ApiCallRef.current = fn)
              }
            />
          );

        default:
          return (
            <DataCleaning
              readonly={isInteractionLocked}
              onValidationChange={setIsStep1Valid}
              onApiCall={(fn) =>
                (step1ApiCallRef.current = fn)
              }
            />
          );
      }
    };

    /**
     * Determines whether next button
     * should be disabled.
     */
    const getIsNextDisabled = () => {
      if (isApiCallInProgress) return true;
      if (currentStep === 1 && !isStep1Valid) return true;
      if (currentStep === 2 && !isStep2Valid) return true;
      if (currentStep === 4 && !isStep4Valid) return true;
      if (currentStep === 5 && !isStep5Valid) return true;

      return false;
    };

    /**
     * Show preview button only after step 1
     * and not inside final preview screen.
     */
    const showPreviewButton =
      currentStep > 1 &&
      !(currentStep === 7 && isStep7Preview) &&
      !(currentStep === 8 && isStep8Preview);

    return (
      <>
        <AIPlaygroundLayout
          currentPreprocessingStep={currentStep}
          totalPreprocessingSteps={
            preprocessingSteps.length
          }
          onPreprocessingStepChange={setCurrentStep}
          isStep7Preview={isStep7Preview}
          isStep8Preview={isStep8Preview}
          onPreviewData={setIsStep7Preview}
          onPreviewData8={setIsStep8Preview}
          onNextClick={handleNextClick}
          isNextDisabled={getIsNextDisabled()}
          predictionType={predictionType}
isUnivariatePreview={isUnivariatePreview}
onUnivariatePreview={setIsUnivariatePreview}
        >
          <div className="w-full h-full overflow-hidden">
            <div className="flex flex-row h-full overflow-hidden">
              
              {/* Sidebar hidden during final preview */}
              {!(currentStep === 7 && isStep7Preview) && !(currentStep === 8 && isStep8Preview) && (
                <div className="w-72 flex-shrink-0 h-full overflow-hidden">
                  <div className="bg-white px-3 border-r border-[#CCCCCC] h-full flex flex-col">

                    {/* Sidebar header */}
                    <h3 className="bg-[#FAFAFA] text-sm font-medium text-gray-700 mb-3 px-3 py-2 rounded-md flex-shrink-0">
                      Pre-processing Steps{' '}
                      <span className="text-gray-400 ml-2">
                        {currentStep} of{' '}
                        {preprocessingSteps.length}
                      </span>
                    </h3>

                    {/* Steps list */}
                    <div className="flex-1 min-h-0 flex flex-col justify-between pb-4">
                      {preprocessingSteps.map((step, index) => {
                        // Completed steps
                        const isCompleted = readonly
                          ? step.id !== currentStep
                          : step.id < currentStep;

                        const isLast =
                          index ===
                          preprocessingSteps.length - 1;

                        return (
                          <React.Fragment key={step.id}>
                            {/* Step button */}
                            <button
                              onClick={() =>
                                !isApiCallInProgress &&
                                setCurrentStep(step.id)
                              }
                              disabled={isApiCallInProgress}
                              className={`flex items-center gap-3 w-full text-left transition-colors flex-shrink-0 ${
                                isApiCallInProgress
                                  ? 'cursor-not-allowed opacity-50'
                                  : 'cursor-pointer'
                              } ${
                                currentStep === step.id
                                  ? 'text-[#8e78b7]'
                                  : 'text-gray-500'
                              }`}
                            >
                              {/* Step circle */}
                              <div
                                className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-medium border transition-all ${
                                  isCompleted
                                    ? 'bg-[#e6f6f4] text-[#2ba995] border-[#2ba995]'
                                    : currentStep === step.id
                                    ? 'bg-purple-100 border-[#8e78b7] text-[#8e78b7]'
                                    : 'bg-white border-gray-300 text-gray-500'
                                }`}
                              >
                                {isCompleted ? (
                                  <Check className="w-4 h-4" />
                                ) : (
                                  step.id
                                )}
                              </div>

                              {/* Step label */}
                              <span className="text-sm font-medium whitespace-nowrap">
                                {step.label}
                              </span>
                            </button>

                            {/* Vertical connector line */}
                            {!isLast && (
                              <div className="flex-1 min-h-0 flex justify-start pl-[15px]">
                                <div className="w-px bg-gray-200 h-full" />
                              </div>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Main content area */}
              <div className="flex-1 min-w-0 h-full px-6 flex flex-col overflow-y-auto">

                {/* Preview button */}
                {showPreviewButton && (
                  <div className="flex justify-end mb-4">
                    <button
                      onClick={handlePreviewClick}
                      disabled={isApiCallInProgress}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all shadow-md ${
                        isApiCallInProgress
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-[#8e78b7] text-white hover:bg-[#7a6ba0] hover:shadow-lg'
                      }`}
                    >
                      <Eye className="w-4 h-4" />
                      <span className="font-medium">
                        Preview Processed Data
                      </span>
                    </button>
                  </div>
                )}

                {/* Dynamic step component */}
                {renderStepContent()}
              </div>
            </div>
          </div>
        </AIPlaygroundLayout>

        {/* Data preview modal */}
        <DataPreviewModal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          currentStep={currentStep}
          predictionType={predictionType}
        />
      </>
    );
  }

  export default DataPreprocessing;