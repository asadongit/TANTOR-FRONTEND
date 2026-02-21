import React, { useState, useRef, useEffect } from 'react';
import { AIPlaygroundLayout } from '../../AIPlaygroundLayout';
import { Check, Eye } from 'lucide-react';
import { useAIPlayground } from '../../../../../context/AIPlaygroundContext';
import DataCleaning from './Steps/DataCleaning';
import FeatureSelection from './Steps/FeatureSelection';
import FeatureEngineering from './Steps/FeatureEngineering';
import ScalingTransformation from './Steps/ScalingTransformation';
import StatisticalAnalysis from './Steps/StatisticalAnalysis';
import FeatureImportance from './Steps/FeatureImportance';
import Step7 from './Steps/Step7';
import { useLocation, useNavigate } from 'react-router-dom';
import DataPreviewModal from '../../modals/DataPreprocessing/DataPreviewModal';

const preprocessingSteps = [
  { id: 1, label: 'Data Pre-processing' },
  { id: 2, label: 'Feature Selection' },
  { id: 3, label: 'Feature Engineering' },
  { id: 4, label: 'Scaling & Transformation' },
  { id: 5, label: 'Statistical Analysis' },
  { id: 6, label: 'Feature Importance' },
  { id: 7, label: 'Imbalance handling' },
];

function DataPreprocessing() {
  const hostnameAI = window._env_?.VITE_AI_API;
  const { workflowState, mode, datasetState, updateWorkflowStage } = useAIPlayground();
  const readonly = mode === 'view';
  const navigate = useNavigate();

  useEffect(() => {
    if (datasetState.sessionId == '') {
      navigate('/ai/playground')
    }
  }, []);

  const modelGenesisConfig = workflowState?.modelGenesis?.config;

  const dataPreprocessingMode = readonly
    ? modelGenesisConfig?.data_preprocessing_mode
    : modelGenesisConfig?.dataPreprocessing;
  const modelSelectionMode = modelGenesisConfig?.modelSelection;

  const isDataPreprocessingAuto = dataPreprocessingMode &&
    ['Swift', 'Standard', 'Comprehensive'].includes(dataPreprocessingMode);

  const isModelSelectionAuto = modelSelectionMode &&
    ['Swift', 'Standard', 'Comprehensive'].includes(modelSelectionMode);

  const [currentStep, setCurrentStep] = useState(isDataPreprocessingAuto ? 7 : 1);
  const [isStep7Preview, setIsStep7Preview] = useState(isDataPreprocessingAuto);
  const [isStep1Valid, setIsStep1Valid] = useState(true);
  const [isStep2Valid, setIsStep2Valid] = useState(true);
  const [isStep4Valid, setIsStep4Valid] = useState(true);
  const [isStep5Valid, setIsStep5Valid] = useState(true);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);


  const step1ApiCallRef = useRef(null);
  const step2ApiCallRef = useRef(null);
  const step3ApiCallRef = useRef(null);
  const step4ApiCallRef = useRef(null);
  const step5ApiCallRef = useRef(null);
  const step6ApiCallRef = useRef(null);
  const step7ApiCallRef = useRef(null);

  const handleNextClick = async () => {
    if (currentStep === 7 && isStep7Preview && isModelSelectionAuto) {
      try {
        const jobId = isDataPreprocessingAuto
          ? workflowState?.modelGenesis?.apiResponse?.job_id
          : workflowState?.dataPreprocessing?.step7?.apiResponse?.job_id;

        if (jobId) {
          const response = await fetch(`${hostnameAI}/jobs/${jobId}`, {
            method: 'GET',
            headers: { 'accept': 'application/json' }
          });

          if (response.ok) {
            const data = await response.json();
            updateWorkflowStage('completedJobs', {
              config: { job_id: jobId },
              apiResponse: data
            });
            
          }
        }
      } catch (error) {
        console.error('Error fetching job details:', error);
      }
      return true;
    }

    if (currentStep === 7 && isStep7Preview && isDataPreprocessingAuto) {
      return true;
    }

    if (currentStep === 7 && isStep7Preview) {
      return true;
    }

    let apiCallFn = null;
    switch (currentStep) {
      case 1: apiCallFn = step1ApiCallRef.current; break;
      case 2: apiCallFn = step2ApiCallRef.current; break;
      case 3: apiCallFn = step3ApiCallRef.current; break;
      case 4: apiCallFn = step4ApiCallRef.current; break;
      case 5: apiCallFn = step5ApiCallRef.current; break;
      case 6: apiCallFn = step6ApiCallRef.current; break;
      case 7: apiCallFn = step7ApiCallRef.current; break;
      default: break;
    }

    if (apiCallFn) {
      const success = await apiCallFn();
      return success;
    }

    return true;
  };

  const handlePreviewClick = () => {
    setIsPreviewModalOpen(true);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <DataCleaning
            onValidationChange={setIsStep1Valid}
            onApiCall={(fn) => step1ApiCallRef.current = fn}
          />
        );
      case 2:
        return (
          <FeatureSelection
            onValidationChange={setIsStep2Valid}
            onApiCall={(fn) => step2ApiCallRef.current = fn}
          />
        );
      case 3:
        return (
          <FeatureEngineering
            onApiCall={(fn) => step3ApiCallRef.current = fn}
          />
        );
      case 4:
        return (
          <ScalingTransformation
            onValidationChange={setIsStep4Valid}
            onApiCall={(fn) => step4ApiCallRef.current = fn}
          />
        );
      case 5:
        return (
          <StatisticalAnalysis
            onValidationChange={setIsStep5Valid}
            onApiCall={(fn) => step5ApiCallRef.current = fn}
          />
        );
      case 6:
        return (
          <FeatureImportance
            onApiCall={(fn) => step6ApiCallRef.current = fn}
          />
        );
      case 7:
        return (
          <Step7
            showPreview={isStep7Preview}
            onApiCall={(fn) => step7ApiCallRef.current = fn}
          />
        );
      default:
        return (
          <DataCleaning
            onValidationChange={setIsStep1Valid}
            onApiCall={(fn) => step1ApiCallRef.current = fn}
          />
        );
    }
  };

  const getIsNextDisabled = () => {
    if (currentStep === 1 && !isStep1Valid) return true;
    if (currentStep === 2 && !isStep2Valid) return true;
    if (currentStep === 4 && !isStep4Valid) return true;
    if (currentStep === 5 && !isStep5Valid) return true;
    return false;
  };

  // Show preview button only for steps 2-7
  const showPreviewButton = currentStep > 1 && !(currentStep === 7 && isStep7Preview);

  return (
    <>
      <AIPlaygroundLayout
        currentPreprocessingStep={currentStep}
        totalPreprocessingSteps={preprocessingSteps.length}
        onPreprocessingStepChange={setCurrentStep}
        isStep7Preview={isStep7Preview}
        onPreviewData={setIsStep7Preview}
        onNextClick={handleNextClick}
        isNextDisabled={getIsNextDisabled()}
      >
        <div className="w-full">
          <div className={`
            flex flex-col lg:flex-row gap-6
            ${!(currentStep === 7 && isStep7Preview) ? 'h-auto lg:h-[calc(100vh-180px)]' : ''}
          `}>

            {!(currentStep === 7 && isStep7Preview) && (
              <div className="w-full lg:w-72 flex-shrink-0">
                <div className="bg-white rounded-lg p-4 lg:p-6 border border-gray-200 h-full lg:overflow-y-auto custom-scrollbar">
                  <h3 className="bg-gray-100 text-sm font-medium text-gray-700 mb-2 px-3 py-2 rounded-md">
                    Pre-processing Steps <span className="text-gray-400 ml-2">{currentStep} of {preprocessingSteps.length}</span>
                  </h3>

                  <div className="relative flex lg:block overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 gap-4 lg:gap-0">
                    {preprocessingSteps.map((step, index) => {
                      const isCompleted = readonly ? step.id !== currentStep : step.id < currentStep;

                      return (
                        <div key={step.id} className="relative flex-shrink-0 lg:w-full">
                          {index < preprocessingSteps.length - 1 && (
                            <div className="hidden lg:block absolute left-4 top-12 w-0.5 h-10 bg-gray-200" />
                          )}

                          <button
                            className={`flex items-center gap-3 py-3 lg:py-4 text-left transition-colors relative ${currentStep === step.id ? 'text-[#8e78b7]' : 'text-gray-500'
                              }`}
                          >
                            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-medium border-2 transition-all ${isCompleted
                              ? 'bg-[#e6f6f4] text-[#2ba995] border-[#2ba995]'
                              : currentStep === step.id
                                ? 'bg-purple-100 border-[#8e78b7] text-[#8e78b7]'
                                : 'bg-white border-gray-300 text-gray-500'
                              }`}>
                              {isCompleted ? <Check className="w-4 h-4" /> : step.id}
                            </div>
                            <span className="text-sm font-medium whitespace-nowrap">{step.label}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className={`
              flex-1 min-w-0
              ${currentStep === 7 && isStep7Preview ? '' : 'lg:h-full lg:overflow-y-auto lg:pr-2 custom-scrollbar'}
            `}>
              {showPreviewButton && (
                <div className="flex justify-end mb-4">
                  <button
                    onClick={handlePreviewClick}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#8e78b7] text-white rounded-lg hover:bg-[#7a6ba0] transition-all shadow-md hover:shadow-lg transform"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="font-medium">Preview Processed Data</span>
                  </button>
                </div>
              )}

              {renderStepContent()}
            </div>
          </div>
        </div>
      </AIPlaygroundLayout>

      <DataPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        currentStep={currentStep}
      />
    </>
  );
}

export default DataPreprocessing;