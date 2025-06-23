import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Breadcrumb from '../../../../../../components/Breadcrumb';
import Step1 from './Stepper/Step1';
import Step2 from './Stepper/Step2';
import Step3 from './Stepper/Step3';
import { StepProvider, useStepData } from './Stepper/StepContext';
import { useAuth } from '../../../../../../context/AuthContext';
import Modal from '../../../../../../pages/platform/cdc/components/Modal';

function CreateRulesInner() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const { stepData, setStepData, resetStepData } = useStepData();
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

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

  const handleStep3Create = async (finalJson, step1Data) => {
    const category = (step1Data || stepData?.step1)?.category;
    let payload;

    if (category === "Pre-built") {
      payload = {
        prebuilt: (finalJson || []).map(rule => ({
          id: rule.id || rule.rule?.id,
          connection_details: rule.connection_details || []
        }))
      };
    } else if (category === "Custom") {
      payload = {
        custom: (finalJson || []).map(rule => ({
          type: rule.type,
          category: rule.category,
          group_name: rule.group,
          name: rule.rule?.name,
          description: rule.rule?.description ?? "",
          severity: rule.rule?.severity ?? "",
          status: rule.rule?.status ?? "",
          owner: rule.rule?.owner ?? "",
          query: rule.rule?.query,
          id_mappings: [
            {
              connection_details: rule.connection_details || []
            }
          ]
        }))
      };
    } else {
      payload = finalJson;
    }

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_FAST_API}/rules/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setModalOpen(true);
      } else {
        setLoading(false);
      }
    } catch (e) {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setLoading(false);
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
            loading={loading}
          />
        )}
      </div>
      <Modal
        isOpen={modalOpen}
        onClose={handleModalClose}
        type="success"
        title="Rule Created Successfully"
        message="Rule Created Successfully"
        confirmText="OK"
      />
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