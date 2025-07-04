import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Breadcrumb from '../../../../../../components/Breadcrumb';
import Step1 from './Stepper/Step1';
import Step2 from './Stepper/Step2';
import Step3 from './Stepper/Step3';
import { StepProvider, useStepData } from './Stepper/StepContext';
import { useAuth } from '../../../../../../context/AuthContext';
import Modal from '../../../../../../pages/platform/cdc/components/Modal';

function CreateRulesInner() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const { stepData, setStepData, resetStepData } = useStepData();
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const isEdit = location.state?.edit;
  const editRuleData = location.state?.ruleData;

  useEffect(() => {
    if (isEdit && editRuleData && editRuleData.rules && Array.isArray(editRuleData.rules)) {
      const firstRule = editRuleData.rules[0];
      const category = firstRule?.category || 'Custom';
      const type = firstRule?.type || 'Data';

      const rulesByGroup = {};
      editRuleData.rules.forEach(rule => {
        if (!rulesByGroup[rule.group_name]) {
          rulesByGroup[rule.group_name] = [];
        }
        rulesByGroup[rule.group_name].push({
          ...rule,
          group_name: rule.group_name,
          id: rule.id,
          name: rule.name,
          description: rule.description,
          severity: rule.severity,
          status: rule.status,
          owner: rule.owner,
          query: rule.query,
        });
      });
      const step1 = {
        category,
        type,
        rules: rulesByGroup
      };

      const step2 = [];
      editRuleData.rules.forEach(r => {
        if (Array.isArray(r.mappings)) {
          const allConnectionDetails = [];
          r.mappings.forEach(mapping => {
            if (Array.isArray(mapping.connection_details)) {
              allConnectionDetails.push(...mapping.connection_details);
            } else if (mapping.connection_details) {
              allConnectionDetails.push(mapping.connection_details);
            }
          });
          step2.push({
            id: r.id,
            category: r.category || category,
            type: r.type || type,
            group: r.group_name,
            rule: {
              id: r.id,
              name: r.name,
              query: r.query,
              description: r.description,
              severity: r.severity,
              status: r.status,
              owner: r.owner,
            },
            connection_details: allConnectionDetails,
          });
        }
      });
      setStepData({ step1, step2 });
      setCurrentStep(2);
    }
  }, [isEdit, editRuleData]);

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

    if (isEdit) {
      const rule = (finalJson && finalJson[0]) || (stepData?.step2 && stepData.step2[0]);
      if (!rule) return;
      const ruleId = rule.id || rule.rule?.id;

      let id_mappings = undefined;
      if (rule.id || rule.rule?.id) {
        id_mappings = {
          id: rule.id || rule.rule?.id,
          connection_details: Array.isArray(rule.connection_details)
            ? rule.connection_details
            : rule.connection_details ? [rule.connection_details] : []
        };
      }

      payload = {
        type: rule.type,
        category: rule.category,
        group_name: rule.group,
        name: rule.rule?.name,
        description: rule.rule?.description ?? "",
        severity: rule.rule?.severity ?? "",
        status: rule.rule?.status ?? "",
        owner: rule.rule?.owner ?? "",
        query: rule.rule?.query,
        id_mappings
      };

      setLoading(true);
      try {
        const response = await fetch(
          `${window._env_?.VITE_FAST_API}/rules/editrule/${ruleId}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          }
        );
        if (response.ok) {
          setModalOpen(true);
        } else {
          setLoading(false);
        }
      } catch (e) {
        setLoading(false);
      }
      return;
    }

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
      const response = await fetch(`${window._env_?.VITE_FAST_API}/rules/create`, {
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
        <h1 className="text-2xl font-semibold">{isEdit ? 'Edit Rule' : 'Add Rule'}</h1>
      </div>
      <div>
        {currentStep === 1 && !isEdit && (
          <Step1
            onNext={handleNext}
            onCancel={handleCancel}
            step1Data={stepData.step1}
          />
        )}

        {currentStep === 2 && (
          <Step2
            data={stepData.step1}
            onBack={isEdit ? undefined : handleBack}
            onNext={handleStep2Next}
            step2Data={stepData.step2}
            edit={isEdit}
          />
        )}

        {currentStep === 3 && (
          <Step3
            onBack={handleStep3Back}
            onCreate={handleStep3Create}
            step1Data={stepData.step1}
            step2Data={stepData.step2}
            loading={loading}
            edit={isEdit}
          />
        )}
      </div>
      <Modal
        isOpen={modalOpen}
        onClose={handleModalClose}
        type="success"
        title={isEdit ? "Rule Updated Successfully" : "Rule Created Successfully"}
        message={isEdit ? "Rule Updated Successfully" : "Rule Created Successfully"}
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