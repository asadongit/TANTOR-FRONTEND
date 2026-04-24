import React, { useState } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { useAIPlayground } from '../../../../../context/AIPlaygroundContext';
import { tw } from '../../../../../components/themeContext';
import { toast } from 'react-hot-toast';
import ModelTrainingIcon from '../../../../../assets/ai/model_training.svg';
import AccountTreeIcon from '../../../../../assets/ai/account_tree.svg';
import ArrowRightIcon from '../../../../../assets/ai/arrow_right.svg';

const headingCls = "font-['Satoshi'] font-medium text-[18px] leading-none tracking-normal";
const bodyCls = "font-['Satoshi'] font-normal text-[16px] leading-none tracking-normal";

export const ChooseBuildMethodModal = ({ isOpen, onClose, onProceed }) => {
    const hostnameAI = window._env_?.VITE_AI_API;
    const [ensembleCount, setEnsembleCount] = useState(2);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [workflowNames, setWorkflowNames] = useState(['']);
    const { setMode, datasetState, workflowsState, createWorkflow, setEnsembleMode } = useAIPlayground();

    if (!isOpen) return null;

    const resetModalState = () => {
        setSelectedMethod(null);
        setWorkflowNames(['']);
        setEnsembleCount(2);
    };

    const handleClose = () => {
        if (isLoading) return;
        resetModalState();
        onClose();
    };

    const handleSelectMethod = (method) => {
        if (isLoading) return;

        const workflowCount = method === 'ensemble' ? ensembleCount : 1;
        setSelectedMethod(method);
        setWorkflowNames(Array.from({ length: workflowCount }, (_, index) => workflowNames[index] || ''));
    };

    const handleWorkflowNameChange = (index, value) => {
        setWorkflowNames(prev => prev.map((name, idx) => (idx === index ? value : name)));
    };

    const handleCreateWorkflow = async () => {
        setIsLoading(true);
        try {
            const method = selectedMethod;
            const workflowCount = method === 'ensemble' ? ensembleCount : 1;
            const preparedWorkflowNames = workflowNames
                .slice(0, workflowCount)
                .map(name => name.trim());

            if (preparedWorkflowNames.some(name => !name)) {
                throw new Error('Please provide a workflow name for each workflow.');
            }

            const normalizedEnteredNames = preparedWorkflowNames.map(name => name.toLowerCase());
            if (new Set(normalizedEnteredNames).size !== normalizedEnteredNames.length) {
                throw new Error('Workflow names must be unique. Please provide different names.');
            }

            const existingWorkflowNames = Object.values(workflowsState || {})
                .map(workflow => (workflow?.workflow_name || '').trim().toLowerCase())
                .filter(Boolean);

            const hasDuplicateWithExisting = normalizedEnteredNames.some(name => existingWorkflowNames.includes(name));
            if (hasDuplicateWithExisting) {
                throw new Error('One or more workflow names already exist. Please use unique workflow names.');
            }

            // Call create-workflow API
            const response = await fetch(
                `${hostnameAI}/ingestion/create-workflow`,
                {
                    method: 'POST',
                    headers: {
                        'accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        ensemble_id: datasetState.ensembleId,
                        no_of_workflows: workflowCount,
                        workflow_names: preparedWorkflowNames
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to create workflow: ${response.status}`);
            }

            const data = await response.json();
            const workflows = data.workflows || {};
            let workflowEntries = Object.entries(workflows);

            // Backward compatibility if API still returns workflow_ids array.
            if (!workflowEntries.length && Array.isArray(data.workflow_ids)) {
                workflowEntries = data.workflow_ids.map((workflowId, index) => [workflowId, preparedWorkflowNames[index] || `workflow ${index + 1}`]);
            }

            if (!workflowEntries.length) {
                throw new Error('No workflow IDs returned from API');
            }

            // Create workflows in context for each workflow ID
            workflowEntries.forEach(([workflowId, workflowName]) => {
                createWorkflow(workflowId, workflowName);
            });

            // Set ensemble mode if ensemble is selected
            if (method === 'ensemble') {
                setEnsembleMode(ensembleCount);
            } else {
                setEnsembleMode(1);
            }

            toast.success('Workflow created successfully!', {
                duration: 2000,
                position: 'top-right',
            });

            // Proceed to next page
            onProceed(method, ensembleCount);
            resetModalState();
            onClose();
            setMode('write');
        } catch (error) {
            console.error('Error creating workflow:', error);
            toast.error(error.message || 'Failed to create workflow. Please try again.', {
                duration: 4000,
                position: 'top-right',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const decrementCount = () => {
        if (ensembleCount > 2) setEnsembleCount(ensembleCount - 1);
    };

    const incrementCount = () => {
        if (ensembleCount < 10) setEnsembleCount(ensembleCount + 1);
    };

    const workflowCount = selectedMethod === 'ensemble' ? ensembleCount : 1;
    const isNameStep = Boolean(selectedMethod);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-xl w-full">

                {/* Header */}
                <div className="flex items-center justify-between p-6">
                    <h2 className={`${headingCls} text-[#282F49]`}>
                        {isNameStep ? 'Name Your Workflows' : 'Choose Build Method'}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-[#818181] hover:text-slate-600 transition-colors"
                        disabled={isLoading}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 pb-6">
                    {!isNameStep ? (
                        <>
                            <p className={`${bodyCls} mb-6 text-[#332849]`}>
                                Select the mode that defines how your model will be configured and executed.
                            </p>

                            {/* Monolithic Option */}
                            <div
                                onClick={() => !isLoading && handleSelectMethod('monolithic')}
                                className={`rounded-lg p-4 mb-4 cursor-pointer transition-all bg-[#FAFAFA] hover:bg-[#FAF8FF] hover:shadow-sm ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="w-5 h-5 flex items-center flex-shrink-0 mr-3">
                                            <img src={ModelTrainingIcon} alt="Monolithic" className="w-5 h-5" />
                                        </div>
                                        <span className={`${headingCls} text-[#8e78b7]`}>Monolithic</span>
                                    </div>
                                    <img src={ArrowRightIcon} alt="arrow right" className="w-4 h-4 flex-shrink-0" style={{ filter: 'brightness(0) saturate(100%) invert(45%) sepia(60%) saturate(400%) hue-rotate(220deg) brightness(95%) contrast(90%)' }} />
                                </div>
                                <p className={`${bodyCls} mt-4 text-[#332849]`} style={{ lineHeight: '1.5' }}>
                                    Train a single model using one unified configuration.<br />
                                    Best for straightforward and faster workflows.
                                </p>
                            </div>

                            {/* OR Divider */}
                            <div className="flex items-center gap-3 my-4">
                                <div className="flex-1 h-px bg-[#F1F0F3]" />
                                <span className={`${bodyCls} text-[#818181]`}>Or</span>
                                <div className="flex-1 h-px bg-[#F1F0F3]" />
                            </div>

                            {/* Ensemble Option */}
                            <div
                                onClick={() => !isLoading && handleSelectMethod('ensemble')}
                                className={`rounded-lg p-4 cursor-pointer transition-all bg-[#FAFAFA] hover:bg-[#FAF8FF] hover:shadow-sm ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="w-5 h-5 flex items-center flex-shrink-0 mr-2">
                                            <img src={AccountTreeIcon} alt="Ensemble" className="w-5 h-5" />
                                        </div>
                                        <span className={`${headingCls} text-[#8e78b7]`}>Ensemble</span>
                                    </div>
                                    <img src={ArrowRightIcon} alt="arrow right" className="w-4 h-4 flex-shrink-0" style={{ filter: 'brightness(0) saturate(100%) invert(45%) sepia(60%) saturate(400%) hue-rotate(220deg) brightness(95%) contrast(90%)' }} />
                                </div>

                                <p className={`${bodyCls} mt-4 text-[#332849]`} style={{ lineHeight: '1.5' }}>
                                    Configure multiple models individually and combine their outputs.<br />
                                    Ideal for improving accuracy and robustness.
                                </p>

                                <p className={`${bodyCls} mt-3 border-t border-[#F1F0F3] pt-3 text-[#332849]`} style={{ lineHeight: '1.5' }}>
                                    Choose how many models you want to build as part of this ensemble.
                                </p>

                                <div className="flex items-center gap-3 mt-3">
                                    <div className="inline-flex items-center gap-6 bg-white p-2 rounded-lg">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); decrementCount(); }}
                                            disabled={ensembleCount <= 2 || isLoading}
                                            className="w-10 h-10 rounded-lg bg-[#FAFAFA] flex items-center justify-center hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <span className={`${headingCls} text-[#332849]`}>−</span>
                                        </button>
                                        <div className="w-10 h-10 flex items-center justify-center">
                                            <span className={`${headingCls} text-[#8e78b7]`}>{ensembleCount}</span>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); incrementCount(); }}
                                            disabled={ensembleCount >= 10 || isLoading}
                                            className="w-10 h-10 rounded-lg bg-[#FAFAFA] flex items-center justify-center hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <span className={`${headingCls} text-[#332849]`}>+</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <p className={`${bodyCls} mb-6 text-[#332849]`}>
                                Provide {workflowCount} workflow name{workflowCount > 1 ? 's' : ''} to continue.
                            </p>

                            <div className="space-y-3">
                                {Array.from({ length: workflowCount }).map((_, index) => (
                                    <div key={`workflow-name-${index}`}>
                                        <label className={`${bodyCls} block mb-2 text-[#282F49]`}>
                                            Workflow Name {index + 1}
                                        </label>
                                        <input
                                            type="text"
                                            value={workflowNames[index] || ''}
                                            onChange={(e) => handleWorkflowNameChange(index, e.target.value)}
                                            placeholder={`Enter workflow ${index + 1} name`}
                                            disabled={isLoading}
                                            className="w-full rounded-lg border border-[#D7D3E5] px-4 py-3 text-[#282F49] focus:outline-none focus:ring-2 focus:ring-[#8e78b7]"
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 flex items-center justify-between">
                                <button
                                    onClick={() => !isLoading && setSelectedMethod(null)}
                                    disabled={isLoading}
                                    className="px-4 py-2 rounded-lg border border-[#D7D3E5] text-[#332849] hover:bg-[#FAFAFA] disabled:opacity-50"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleCreateWorkflow}
                                    disabled={isLoading}
                                    className="px-4 py-2 rounded-lg bg-[#8e78b7] text-white hover:bg-[#7f68a9] disabled:opacity-50"
                                >
                                    {isLoading ? 'Creating...' : 'Create Workflows'}
                                </button>
                            </div>
                        </>
                    )}

                </div>
            </div>
        </div>
    );
};