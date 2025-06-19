import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Breadcrumb from '../../../../../../components/Breadcrumb';
import Step1 from './Stepper/Step1';
import Step2 from './Stepper/Step2';
import Step3 from './Stepper/Step3';
import { StepProvider, useStepData } from './Stepper/StepContext';

function CreateRulesInner() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const { stepData, setStepData, resetStepData } = useStepData();

  const handleCancel = () => {
    resetStepData();
    navigate('/datagovernance/data-assurance/rules');
  };

  const handleNext = (data) => {
    setStepData(prev => ({ ...prev, step1: data }));
    setCurrentStep(2);
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  const handleStep2Next = (resultJson) => {
    console.log('Updating step2 data:', resultJson);
    setStepData(prev => ({ ...prev, step2: resultJson }));
    setCurrentStep(3);
  };

  const handleStep3Back = () => {
    setCurrentStep(2);
  };

  const handleStep3Create = (finalJson) => {
    console.log('Create payload:', finalJson);
    resetStepData();
    navigate('/datagovernance/data-assurance/rules');
  };

  return (
    <div className="p-6">
      <Breadcrumb />
      <div className="flex gap-4 mb-6 items-center">
        <h1 className="text-2xl font-semibold">Add Rule</h1>
      </div>
      <div>
        {currentStep === 1 && (
          <Step1
            onNext={handleNext}
            onCancel={handleCancel}
            step1Data={stepData.step1}
          />
        )}

        {currentStep === 2 && (
          <Step2
            data={stepData.step1}
            onBack={handleBack}
            onNext={handleStep2Next}
            step2Data={stepData.step2}
          />
        )}

        {currentStep === 3 && (
          <Step3
            onBack={handleStep3Back}
            onCreate={handleStep3Create}
            step1Data={stepData.step1}
            step2Data={stepData.step2}
          />
        )}
      </div>
    </div>
  );
}

export default function CreateRules() {
  return (
    <StepProvider>
      <CreateRulesInner />
    </StepProvider>
  );
}