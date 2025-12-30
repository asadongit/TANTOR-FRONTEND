import React, { useState } from 'react';
import { AIPlaygroundLayout } from '../../AIPlaygroundLayout';
import { Check } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import DataCleaning from './Steps/DataCleaning';
import FeatureSelection from './Steps/FeatureSelection';
import FeatureEngineering from './Steps/FeatureEngineering';
import ScalingTransformation from './Steps/ScalingTransformation';
import StatisticalAnalysis from './Steps/StatisticalAnalysis';
import FeatureImportance from './Steps/FeatureImportance';
import Step7 from './Steps/Step7';

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
  const location = useLocation();
  const mode = location.state?.mode ?? 'edit';
  const readonly = mode === 'view';

  const [currentStep, setCurrentStep] = useState(1);
  const [isStep7Preview, setIsStep7Preview] = useState(false);

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return <DataCleaning readonly={readonly} />;
      case 2: return <FeatureSelection readonly={readonly} />;
      case 3: return <FeatureEngineering readonly={readonly} />;
      case 4: return <ScalingTransformation readonly={readonly} />;
      case 5: return <StatisticalAnalysis readonly={readonly} />;
      case 6: return <FeatureImportance readonly={readonly} />;
      case 7: return <Step7 showPreview={isStep7Preview} readonly={readonly} />;
      default: return <DataCleaning readonly={readonly} />;
    }
  };

  return (
    <AIPlaygroundLayout
      currentPreprocessingStep={currentStep}
      totalPreprocessingSteps={preprocessingSteps.length}
      onPreprocessingStepChange={setCurrentStep}
      isStep7Preview={isStep7Preview}
      onPreviewData={setIsStep7Preview}
      mode={mode}
      readonly={readonly}
    >
      <div className={currentStep === 7 && isStep7Preview ? 'w-full' : 'max-w-7xl mx-auto w-full'}>
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
            flex-1 w-full 
            ${currentStep === 7 && isStep7Preview ? '' : 'lg:h-full lg:overflow-y-auto lg:pr-2 custom-scrollbar'}
          `}>
            {renderStepContent()}
          </div>
        </div>
      </div>
    </AIPlaygroundLayout>
  );
}

export default DataPreprocessing