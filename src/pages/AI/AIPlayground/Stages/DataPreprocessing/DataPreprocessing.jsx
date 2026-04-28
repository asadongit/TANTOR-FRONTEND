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
  const { workflowsState, activeWorkflowId, mode, datasetState, updateWorkflowStage } = useAIPlayground();
  const workflowState = activeWorkflowId
    ? workflowsState?.[activeWorkflowId]
    : null;  
  const readonly = mode === 'view';
  const navigate = useNavigate();

  useEffect(() => {
    if (!datasetState?.ensembleId) {
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
  // if the data preprocessing is manual and model selection is auto , jobID api gets called 
  const handleNextClick = async () => {
   
    
    if (currentStep === 7 && isStep7Preview && isModelSelectionAuto) {

      try {
        const autoModeJobId = workflowState?.modelGenesis?.apiResponse?.job_id ?? null;

        const jobId = isDataPreprocessingAuto
          ? autoModeJobId
          : workflowState?.dataPreprocessing?.step7?.apiResponse?.job_id;
        
      
        
        if (jobId && hostnameAI) {
          const response = await fetch(`${hostnameAI}/jobs/${jobId}`, {
            method: 'GET',
            headers: { 'accept': 'application/json' }
          });

          if (response.ok) {
            const data = await response.json();
           
            updateWorkflowStage?.('completedJobs', {
              config: { job_id: jobId },
              apiResponse: data
            });

          } else {
         
          }
        } else {
         
        }
      } catch (error) {
        console.error('Error fetching job details:', error);
      }
      return true;
    }

    if (currentStep === 7 && isStep7Preview) return true;

    const stepApiRefs = [
      null,
      step1ApiCallRef.current,
      step2ApiCallRef.current,
      step3ApiCallRef.current,
      step4ApiCallRef.current,
      step5ApiCallRef.current,
      step6ApiCallRef.current,
      step7ApiCallRef.current,
    ];

    const apiCallFn = stepApiRefs[currentStep] ?? null;
    if (typeof apiCallFn !== 'function') return true;

    return await apiCallFn();
  };

  const handlePreviewClick = () => {
    setIsPreviewModalOpen(true);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <DataCleaning onValidationChange={setIsStep1Valid} onApiCall={(fn) => step1ApiCallRef.current = fn} />;
      case 2:
        return <FeatureSelection onValidationChange={setIsStep2Valid} onApiCall={(fn) => step2ApiCallRef.current = fn} />;
      case 3:
        return <FeatureEngineering onApiCall={(fn) => step3ApiCallRef.current = fn} />;
      case 4:
        return <ScalingTransformation onValidationChange={setIsStep4Valid} onApiCall={(fn) => step4ApiCallRef.current = fn} />;
      case 5:
        return <StatisticalAnalysis onValidationChange={setIsStep5Valid} onApiCall={(fn) => step5ApiCallRef.current = fn} />;
      case 6:
        return <FeatureImportance onApiCall={(fn) => step6ApiCallRef.current = fn} />;
      case 7:
        return <Step7 showPreview={isStep7Preview} onApiCall={(fn) => step7ApiCallRef.current = fn} />;
      default:
        return <DataCleaning onValidationChange={setIsStep1Valid} onApiCall={(fn) => step1ApiCallRef.current = fn} />;
    }
  };

  const getIsNextDisabled = () => {
    if (currentStep === 1 && !isStep1Valid) return true;
    if (currentStep === 2 && !isStep2Valid) return true;
    if (currentStep === 4 && !isStep4Valid) return true;
    if (currentStep === 5 && !isStep5Valid) return true;
    return false;
  };

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

        <div className="w-full h-full overflow-hidden">
          <div className="flex flex-row h-full overflow-hidden">
            {!(currentStep === 7 && isStep7Preview) && (
              <div className="w-72 flex-shrink-0 h-full overflow-hidden">
                <div className="bg-white px-3 border-r border-[#CCCCCC] h-full flex flex-col">

                  {/* Header */}
                  <h3 className="bg-[#FAFAFA] text-sm font-medium text-gray-700 mb-3 px-3 py-2 rounded-md flex-shrink-0">
                    Pre-processing Steps{' '}
                    <span className="text-gray-400 ml-2">
                      {currentStep} of {preprocessingSteps.length}
                    </span>
                  </h3>

                  <div className="flex-1 min-h-0 flex flex-col justify-between pb-4">
                    {preprocessingSteps.map((step, index) => {
                      const isCompleted = readonly
                        ? step.id !== currentStep
                        : step.id < currentStep;
                      const isLast = index === preprocessingSteps.length - 1;

                      return (
                        <React.Fragment key={step.id}>
                          {/* Step row — flex-shrink-0 so it never compresses */}
                          <button
                            className={`flex items-center gap-3 w-full text-left transition-colors flex-shrink-0 ${currentStep === step.id ? 'text-[#8e78b7]' : 'text-gray-500'
                              }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-medium border transition-all ${isCompleted
                                  ? 'bg-[#e6f6f4] text-[#2ba995] border-[#2ba995]'
                                  : currentStep === step.id
                                    ? 'bg-purple-100 border-[#8e78b7] text-[#8e78b7]'
                                    : 'bg-white border-gray-300 text-gray-500'
                                }`}
                            >
                              {isCompleted ? <Check className="w-4 h-4" /> : step.id}
                            </div>
                            <span className="text-sm font-medium whitespace-nowrap">
                              {step.label}
                            </span>
                          </button>

                          {/* Connector: flex-1 + min-h-0 grows to fill the equal gap */}
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
            <div
              className={`flex-1 min-w-0 h-full px-6 flex flex-col ${currentStep === 7 && isStep7Preview
                  ? 'overflow-y-auto'
                  : 'overflow-y-auto'
                }`}
            >
              {showPreviewButton && (
                <div className="flex justify-end mb-4">
                  <button
                    onClick={handlePreviewClick}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#8e78b7] text-white rounded-lg hover:bg-[#7a6ba0] transition-all shadow-md hover:shadow-lg"
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