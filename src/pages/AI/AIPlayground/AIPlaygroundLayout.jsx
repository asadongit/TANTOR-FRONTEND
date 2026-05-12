import React, { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
    Boxes,
    SlidersHorizontal,
    ListChecks,
    BrainCircuit,
    Lightbulb,
    Rocket,
    ChevronLeft,
    ArrowRight,
    Check,
    Bot,
    Image,
    X,
    Plus,
    AlertTriangle
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAIPlayground } from '../../../context/AIPlaygroundContext';
import { toast } from 'react-hot-toast';
import AnalyticsIcons from '../../../assets/ai/analytics.svg';
import AutoAwesomeMosaicIcons from '../../../assets/ai/auto_awesome_mosaic.svg';
import BidLandscapeIcons from '../../../assets/ai/bid_landscape.svg';
import CloudDoneIcons from '../../../assets/ai/cloud_done.svg';
import RobotIcon from '../../../assets/ai/robotIcon.svg';
import LightBulbIcons from '../../../assets/ai/lightbulb.svg';
import ListAltCheckIcons from '../../../assets/ai/list_alt_check.svg';
import TuneIcons from '../../../assets/ai/tune.svg';


function SvgIcon({ src, size = 20, className = '', style = {} }) {
    return (
        <img
            src={src}
            alt=""
            className={className}
            style={{
                width: size,
                height: size,
                minWidth: size,
                minHeight: size,
                maxWidth: size,
                maxHeight: size,
                display: 'block',
                objectFit: 'contain',
                ...style,
            }}
        />
    );
}

const ACTIVE_ICON_FILTER =
    'invert(51%) sepia(29%) saturate(672%) hue-rotate(221deg) brightness(88%) contrast(87%)';

export const workflowStages = [
    { id: 'model-genesis', label: 'Model Genesis', icon: AutoAwesomeMosaicIcons, path: '/ai/playground/model-genesis' },
    { id: 'data-preprocessing', label: 'Data Pre-processing', icon: TuneIcons, path: '/ai/playground/data-preprocessing' },
    { id: 'model-selection', label: 'Model Selection', icon: ListAltCheckIcons, path: '/ai/playground/model-selection' },
    { id: 'model-inferencing', label: 'Model Inferencing', icon: AnalyticsIcons, path: '/ai/playground/model-inferencing' },
    { id: 'xai', label: 'XAI', icon: LightBulbIcons, path: '/ai/playground/xai' },
    { id: 'model-deployment', label: 'Model Deployment', icon: CloudDoneIcons, path: '/ai/playground/model-deployment' },
];

export function AIPlaygroundLayout({
    children,
    currentPreprocessingStep,
    totalPreprocessingSteps,
    onPreprocessingStepChange,
    isStep7Preview,
    onPreviewData,
    isNextDisabled: isNextDisabledProp,
    onSaveModel,
    onNextClick
}) {
    const navigate = useNavigate();
    const location = useLocation();
    const { workflowsState, datasetState, mode, setMode, resetAllStates, isAIPlaygroundActive, activeWorkflowId, switchWorkflow, createWorkflow, deleteWorkflow } = useAIPlayground();
    const readonly = mode === 'view';
    const ensembleCount = location.state?.ensembleCount ?? 1;
    const isEnsemble = location.state?.isEnsemble;
    const initialEnsembleCount = ensembleCount;
    const hostnameAI = window._env_?.VITE_AI_API;
    const workflowState = activeWorkflowId
    ? workflowsState[activeWorkflowId]
    : null;  
    const modelGenesisConfig = workflowState?.modelGenesis?.config;

    const truncateLabel = (label, max = 20) => {
        if (!label) return '';
        return String(label).length > max ? `${String(label).slice(0, max)}..` : String(label);
    };

    
    

    const dataPreprocessingMode = readonly
        ? modelGenesisConfig?.data_preprocessing_mode
        : modelGenesisConfig?.dataPreprocessing;    
    const modelSelectionMode = readonly
        ? modelGenesisConfig?.model_mode
        : modelGenesisConfig?.modelSelection;

      

    

    const isDataPreprocessingAuto = dataPreprocessingMode &&
        ['Swift', 'Standard', 'Comprehensive'].includes(dataPreprocessingMode);
    const isModelSelectionAuto = modelSelectionMode &&
        ['Swift', 'Standard', 'Comprehensive'].includes(modelSelectionMode);

    const [models, setModels] = useState([]);
    const [activeModelIndex, setActiveModelIndex] = useState(0);
    const [hoveredModelIndex, setHoveredModelIndex] = useState(null);
    const [isNavigating, setIsNavigating] = useState(false);
    const [showAddWorkflowModal, setShowAddWorkflowModal] = useState(false);
    const [newWorkflowName, setNewWorkflowName] = useState('');
    const [addWorkflowNameError, setAddWorkflowNameError] = useState('');
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showFinishModal, setShowFinishModal] = useState(false);
    const [showDeleteWorkflowModal, setShowDeleteWorkflowModal] = useState(false);
    const [deleteTargetModelIndex, setDeleteTargetModelIndex] = useState(null);

    const cleanupMutation = useMutation({
        mutationFn: async () => {
            try {
                if (!datasetState?.ensembleId) {
                    return null;
                }

                const response = await fetch(`${hostnameAI}/cleanup/cleanup`, {
                    method: 'POST',
                    headers: { 'accept': 'application/json', 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ensemble_id: datasetState.ensembleId,
                        training_flag: workflowState?.modelSelection?.apiResponse !== null
                    })
                });

                if (!response.ok) {
                    throw new Error(`Failed to cleanup workflow: ${response.status}`);
                }

                return response.json();
            } catch (error) {
                console.error('Cleanup API error:', error);
                throw error;
            }
        }
    });

    const createWorkflowMutation = useMutation({
        mutationFn: async (workflowName) => {
            try {
                const response = await fetch(`${hostnameAI}/ingestion/create-workflow`, {
                    method: 'POST',
                    headers: {
                        accept: 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        ensemble_id: datasetState.ensembleId,
                        no_of_workflows: 1,
                        workflow_names: [workflowName]
                    })
                });

                if (!response.ok) {
                    throw new Error(`Failed to create workflow: ${response.status}`);
                }

                return response.json();
            } catch (error) {
                console.error('Error creating workflow:', error);
                toast.error(error?.message || 'Failed to add workflow. Please try again.', {
                    duration: 4000,
                    position: 'top-right'
                });
                throw error;
            }
        }
    });

    const isCancelLoading = cleanupMutation.isPending;
    const isAddingWorkflow = createWorkflowMutation.isPending;

    useEffect(() => {
        if (isEnsemble && Object.keys(workflowsState).length > 0) {
            // Initialize models from workflowsState
            const workflowsList = Object.entries(workflowsState).map(([workflowId, workflow]) => ({
                id: workflowId,
                label: workflow.workflow_name
            }));
            setModels(workflowsList);

            // Set active model index based on active workflow ID
            const activeIndex = workflowsList.findIndex(m => m.id === activeWorkflowId);
            if (activeIndex >= 0) {
                setActiveModelIndex(activeIndex);
            }
        }
    }, [isEnsemble, workflowsState, activeWorkflowId]);

    useEffect(() => {
        const handlePopState = (event) => {
            const currentPath = window.location.pathname;
            if (currentPath.startsWith('/ai/playground') && isAIPlaygroundActive) {
                event.preventDefault();

                window.history.pushState(null, '', location.pathname);

                setShowCancelModal(true);
            }
        };

        try {
            window.history.pushState(null, '', location.pathname);
            window.addEventListener('popstate', handlePopState);
        } catch (error) {
            console.error('Error setting up popstate listener:', error);
        }

        return () => {
            try {
                window.removeEventListener('popstate', handlePopState);
            } catch (error) {
                console.error('Error removing popstate listener:', error);
            }
        };
    }, [location.pathname, isAIPlaygroundActive]);

    

    const currentStageIndex = workflowStages.findIndex(
        stage => stage.path === location.pathname
    );

    const getNextStage = () => {
        const isPreprocessingPage = location.pathname === '/ai/playground/data-preprocessing';
        const isModelSelectionPage = location.pathname === '/ai/playground/model-selection';
        const isGenesisPage = location.pathname === '/ai/playground/model-genesis';
        
        const fallbackStage = workflowStages[Math.min(currentStageIndex + 1, workflowStages.length - 1)];

        

        if (isPreprocessingPage && !isDataPreprocessingAuto && isModelSelectionAuto) {
            const nextStage = workflowStages.find(stage => stage.id === 'model-inferencing');
           
            return nextStage;
        }

        if (isGenesisPage && isDataPreprocessingAuto && isModelSelectionAuto) {
            const nextStage = workflowStages.find(stage => stage.id === 'data-preprocessing');

            return nextStage;
        }

        if (isPreprocessingPage && isDataPreprocessingAuto && isModelSelectionAuto) {
            const nextStage = workflowStages.find(stage => stage.id === 'model-inferencing');
            return nextStage;
        }

        
        return fallbackStage;
    };

    const nextStage = getNextStage();
    const previousStage = workflowStages[Math.max(currentStageIndex - 1, 0)];

    const isPreprocessingPage = location.pathname === '/ai/playground/data-preprocessing';
    const isOnStep7 = isPreprocessingPage && currentPreprocessingStep === totalPreprocessingSteps;

    const shouldShowCancel = currentStageIndex >= 0 && currentStageIndex <= 3;

    const isLastStage = currentStageIndex === workflowStages.length - 1;
    const isDeploymentStage = location.pathname === '/ai/playground/model-deployment';
    const isFinalEnsembleWorkflow = !isEnsemble || activeModelIndex >= models.length - 1;
    const isXAIPage = location.pathname === '/ai/playground/xai';

    const calculateProgress = () => {
        const totalStages = workflowStages.length;
        const percentagePerStage = 100 / totalStages;

        if (currentStageIndex === -1) {
            return 0;
        }

        let progress = currentStageIndex * percentagePerStage;

        if (isPreprocessingPage && totalPreprocessingSteps) {
            const substepProgress = (currentPreprocessingStep / totalPreprocessingSteps) * percentagePerStage;
            progress += substepProgress;
        } else {
            progress += percentagePerStage;
        }

        return progress;
    };

    const progressPercentage = calculateProgress();

    const handleEditConfiguration = () => {
        setMode('edit')
        navigate('/ai/playground/model-genesis', {
            state: {
                isEnsemble,
                ensembleCount: models.length,
                activeModelIndex: activeModelIndex
            }
        });
    }

    const handleFinish = () => {
        setShowFinishModal(true);
    };

    const handleConfirmFinish = () => {
        resetAllStates();
        setShowFinishModal(false);
        navigate('/ai/playground');
    };

    const handleFinishModalClose = () => {
        setShowFinishModal(false);
    };

    const handleNext = async () => {
        const isXAIPage = location.pathname === '/ai/playground/xai';

        if (onNextClick) {
            setIsNavigating(true);
            try {
                const canProceed = await onNextClick();
                if (!canProceed) {
                    setIsNavigating(false);
                    return;
                }
            } catch (error) {
                console.error('Error in onNextClick:', error);
                setIsNavigating(false);
                return;
            }
            setIsNavigating(false);
        }
        if (isXAIPage && onSaveModel) {
            if (isEnsemble && activeModelIndex < models.length - 1) {
                const nextIndex = activeModelIndex + 1;
                const nextModel = models[nextIndex];

                if (nextModel?.id) {
                    switchWorkflow(nextModel.id);
                }

                setActiveModelIndex(nextIndex);
                navigate('/ai/playground/model-genesis', {
                    state: {
                        mode: readonly ? 'view' : 'edit',
                        isEnsemble,
                        ensembleCount: models.length,
                        method: 'ensemble',
                        activeModelIndex: nextIndex
                    }
                });
                return;
            }

            onSaveModel();
            return;
        }

        if (isOnStep7 && !isStep7Preview) {
            if (onPreviewData) onPreviewData(true);
            return;
        }

        if (isOnStep7 && isStep7Preview) {
            if (nextStage) {
                navigate(nextStage.path, {
                    state: {
                        mode: readonly ? 'view' : 'edit',
                        isEnsemble,
                        ensembleCount: models.length,
                        activeModelIndex: activeModelIndex
                    }
                });
            }
            return;
        }

        if (isDeploymentStage && isEnsemble && activeModelIndex < models.length - 1) {
            setActiveModelIndex(activeModelIndex + 1);
            navigate('/ai/playground/model-genesis', {
                state: {
                    mode: readonly ? 'view' : 'edit',
                    isEnsemble,
                    ensembleCount: models.length,
                    method: 'ensemble',
                    activeModelIndex: activeModelIndex + 1
                }
            });
            return;
        }

        if (isPreprocessingPage && currentPreprocessingStep < totalPreprocessingSteps) {
            onPreprocessingStepChange(currentPreprocessingStep + 1);
        } else if (nextStage) {
            navigate(nextStage.path, {
                state: {
                    mode: readonly ? 'view' : 'edit',
                    isEnsemble,
                    ensembleCount: models.length,
                    activeModelIndex: activeModelIndex
                }
            });
        }
    };

    const handlePrevious = () => {
        if (isPreprocessingPage && currentPreprocessingStep > 1) {
            onPreprocessingStepChange(currentPreprocessingStep - 1);
        } else if (currentStageIndex > 0) {
            navigate(previousStage.path, {
                state: {
                    mode: readonly ? 'view' : 'edit',
                    isEnsemble,
                    ensembleCount: models.length,
                    activeModelIndex: activeModelIndex
                }
            });
        } else {
            navigate('/ai/playground');
        }
    };

    const handleCancel = () => {
        setShowCancelModal(true);
    };

    const handleConfirmCancel = async () => {
        try {
            await cleanupMutation.mutateAsync();
        } catch (error) {
            console.error('Cleanup API error:', error);
            return;
        }
        resetAllStates();
        setShowCancelModal(false);
        navigate('/ai/playground');
    };

    const handleCancelModalClose = () => {
        setShowCancelModal(false);
    };

    const validateWorkflowName = (name) => {
        if (!name.trim()) {
            return 'Workflow name is required';
        }

        if (name.length > 100) {
            return 'Workflow name must be 100 characters or less';
        }

        if (!/^[A-Za-z]/.test(name.trim())) {
            return 'Workflow name must start with an alphabet';
        }

        if (/^\d+$/.test(name.trim())) {
            return 'Workflow name cannot contain only digits';
        }

        const validCharPattern = /^[A-Za-z0-9_\-@#& ]+$/;
        if (!validCharPattern.test(name.trim())) {
            return 'Only letters, numbers, underscore, hyphen, space, @, #, and & are allowed';
        }

        return null;
    };

    const openAddWorkflowModal = () => {
        if (readonly || isAddingWorkflow) return;
        
        // Check if max workflows (8) already reached
        if (Object.keys(workflowsState || {}).length >= 8) {
            toast.error('Maximum of 8 workflows allowed. Cannot add more workflows.', {
                duration: 3000,
                position: 'top-right'
            });
            return;
        }
        
        setNewWorkflowName('');
        setAddWorkflowNameError('');
        setShowAddWorkflowModal(true);
    };

    const handleCloseAddWorkflowModal = () => {
        if (isAddingWorkflow) return;
        setShowAddWorkflowModal(false);
        setNewWorkflowName('');
        setAddWorkflowNameError('');
    };

    const handleAddWorkflow = async () => {
        if (readonly || isAddingWorkflow) return;

        const workflowName = newWorkflowName.trim();
        const validationError = validateWorkflowName(workflowName);
        if (validationError) {
            setAddWorkflowNameError(validationError);
            toast.error(validationError, {
                duration: 2500,
                position: 'top-right'
            });
            return;
        }

        // Check if max workflows (8) reached
        if (Object.keys(workflowsState || {}).length >= 8) {
            toast.error('Maximum of 8 workflows allowed. Cannot add more workflows.', {
                duration: 3000,
                position: 'top-right'
            });
            return;
        }

        const normalizedName = workflowName.toLowerCase();
        const existingWorkflowNames = Object.values(workflowsState || {})
            .map(workflow => (workflow?.workflow_name || '').trim().toLowerCase())
            .filter(Boolean);

        if (existingWorkflowNames.includes(normalizedName)) {
            setAddWorkflowNameError('A workflow with this name already exists. Please choose a different name.');
            toast.error('Workflow name already exists. Please provide a different name.', {
                duration: 3000,
                position: 'top-right'
            });
            return;
        }

        try {
            const data = await createWorkflowMutation.mutateAsync(workflowName);
            const workflows = data?.workflows || {};
            const [newWorkflowId] = Object.entries(workflows)[0] || [];
            const fallbackWorkflowId = data?.workflow_ids?.[0];
            const resolvedWorkflowId = newWorkflowId || fallbackWorkflowId;

            if (!resolvedWorkflowId) {
                throw new Error('No workflow ID returned from API');
            }

            createWorkflow(resolvedWorkflowId, workflowName);
            switchWorkflow(resolvedWorkflowId);
            handleCloseAddWorkflowModal();

            navigate(location.pathname, {
                state: { ...location.state, isEnsemble, ensembleCount: Object.keys(workflowsState).length + 1 },
                replace: true
            });

            toast.success('Workflow added successfully!', {
                duration: 2000,
                position: 'top-right'
            });
        } catch (error) {
            console.error('Error creating workflow:', error);
            toast.error(error.message || 'Failed to add workflow. Please try again.', {
                duration: 4000,
                position: 'top-right'
            });
        }
    };

    const handleDeleteModel = (index) => {
        if (readonly || models.length <= 1) return;

        const workflowToDelete = models[index];
        if (!workflowToDelete?.id) {
            return;
        }

        setDeleteTargetModelIndex(index);
        setShowDeleteWorkflowModal(true);
    };

    const handleCloseDeleteWorkflowModal = () => {
        setShowDeleteWorkflowModal(false);
        setDeleteTargetModelIndex(null);
    };

    const handleConfirmDeleteWorkflow = () => {
        if (deleteTargetModelIndex === null) {
            handleCloseDeleteWorkflowModal();
            return;
        }

        const workflowToDelete = models[deleteTargetModelIndex];
        if (!workflowToDelete?.id) {
            handleCloseDeleteWorkflowModal();
            return;
        }

        const isDeletingActiveWorkflow = workflowToDelete.id === activeWorkflowId;

        const remainingModels = models.filter((_, index) => index !== deleteTargetModelIndex);
        const previousModelIndex = deleteTargetModelIndex > 0 ? deleteTargetModelIndex - 1 : 0;

        deleteWorkflow(workflowToDelete.id);

        if (!isDeletingActiveWorkflow) {
            handleCloseDeleteWorkflowModal();
            return;
        }

        const nextActiveModel = remainingModels[previousModelIndex] || remainingModels[0] || null;
        const shouldNavigateToGenesis = deleteTargetModelIndex === 0 && remainingModels.length > 0;

        const updatedCount = remainingModels.length;
        const nextActiveIndex = nextActiveModel
            ? remainingModels.findIndex(model => model.id === nextActiveModel.id)
            : 0;
        if (nextActiveIndex >= 0) {
            setActiveModelIndex(nextActiveIndex);
        }

        if (nextActiveModel?.id) {
            switchWorkflow(nextActiveModel.id);
        }

        navigate(shouldNavigateToGenesis ? '/ai/playground/model-genesis' : '/ai/playground/xai', {
            state: { ...location.state, isEnsemble, ensembleCount: updatedCount, activeModelIndex: Math.max(0, nextActiveIndex) },
            replace: true
        });

        handleCloseDeleteWorkflowModal();
    };

    const getNextButtonLabel = () => {
        if (isNavigating) return 'Processing...';

        if (isXAIPage) {
            if (isEnsemble && activeModelIndex < models.length - 1) {
                return `Continue to ${truncateLabel(models[activeModelIndex + 1]?.label)}`;
            }
            return `Continue to ${nextStage?.label || 'Next Stage'}`;
        }

        if (isOnStep7 && !isStep7Preview) return 'Preview Data';
        if (isOnStep7 && isStep7Preview) return `Continue to ${nextStage?.label || 'Next Stage'}`;
        if (isDeploymentStage && isEnsemble && activeModelIndex < models.length - 1) {
            return `Continue to ${truncateLabel(models[activeModelIndex + 1]?.label)}`;
        }
        if (isPreprocessingPage && currentPreprocessingStep < totalPreprocessingSteps) return 'Process Data';
        return `Continue to ${nextStage?.label || 'Next Stage'}`;
    };

    const isNextDisabled = () => {
        if (isNavigating) return true;
        if (isNextDisabledProp !== undefined) {
            return isNextDisabledProp;
        }
        if (isDeploymentStage && isEnsemble && activeModelIndex < models.length - 1) {
            return false;
        }
        return !isPreprocessingPage && currentStageIndex === workflowStages.length - 1 && !(isOnStep7 && !isStep7Preview);
    };

    const getVisibleStages = () => {
        if (isDataPreprocessingAuto && isModelSelectionAuto) {
            return workflowStages.filter(stage =>
                stage.id !== 'model-selection'
            );
        }

        if (!isDataPreprocessingAuto && isModelSelectionAuto) {
            return workflowStages.filter(stage =>
                stage.id !== 'model-selection'
            );
        }

        return workflowStages;
    };

    const visibleStages = getVisibleStages();
    const visibleCurrentStageIndex = visibleStages.findIndex(
        stage => stage.path === location.pathname
    );

    const shouldShowFinish = isDeploymentStage && (!isEnsemble || activeModelIndex >= models.length - 1);

    return (
        <div className="h-full bg-gray-50 flex flex-col gap-2 overflow-hidden p-4">

            {/* Cancel Warning Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-[#00000099] bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div>
                            <div className='p-6' >
                                <div className="flex items-center gap-3 mb-4">
                                    <h2 className="text-lg font-medium text-[#332849]">Cancel AI Playground Workflow?</h2>
                                </div>

                                <p className="text-base text-[#818181] mb-6">
                                    Are you sure you want to cancel? All unsaved progress and configurations will be lost. This action cannot be undone.
                                </p>
                            </div>

                            <div className="flex gap-3 p-3 justify-end font-satoshi border-t border-slate-200 shadow-[0_-2px_10px_0px_rgba(0,0,0,0.07)]">
                                <button
                                    onClick={handleCancelModalClose}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-[#818181] hover:bg-gray-50 transition-colors"
                                >
                                    Continue Working
                                </button>
                                <button
                                    onClick={handleConfirmCancel}
                                    disabled={isCancelLoading}
                                    className="px-4 py-2 bg-[#EF4D5F] text-white rounded-lg text-sm hover:bg-red-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center gap-2"
                                >
                                    {isCancelLoading && (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    )}
                                    {isCancelLoading ? 'Cancelling...' : 'Yes, Discard Changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Finish Confirmation Modal */}
            {showFinishModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                                    <Check className="text-[#36AD8F]" size={24} />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900">Complete Workflow</h2>
                            </div>

                            <p className="text-gray-600 mb-6">
                                You have successfully completed all stages of the machine learning workflow. Click "Finish" to return to the AI Playground.
                            </p>

                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={handleFinishModalClose}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Stay Here
                                </button>
                                <button
                                    onClick={handleConfirmFinish}
                                    className="px-8 py-2 bg-[#8e78b7] text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    Finish
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Workflow Warning Modal */}
            {showDeleteWorkflowModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                    <AlertTriangle className="text-[#EF4D5F]" size={24} />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900">Delete Workflow</h2>
                            </div>

                            <p className="text-gray-600 mb-6">
                                Are you sure you want to delete{' '}
                                <span className="font-medium text-gray-800">
                                    {deleteTargetModelIndex !== null ? truncateLabel(models[deleteTargetModelIndex]?.label) : 'this workflow'}
                                </span>
                                ? This action cannot be undone.
                            </p>

                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={handleCloseDeleteWorkflowModal}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmDeleteWorkflow}
                                    className="px-4 py-2 bg-[#EF4D5F] text-white rounded-lg text-sm font-medium hover:bg-red-500 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Workflow Modal */}
            {showAddWorkflowModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-[#332849]">Add Workflow</h2>
                                <button
                                    onClick={handleCloseAddWorkflowModal}
                                    disabled={isAddingWorkflow}
                                    className="text-[#818181] hover:text-slate-600 transition-colors disabled:opacity-60"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="mb-3">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm text-[#818181]">
                                        Enter a name for the new workflow.
                                    </p>
                                    <span className="text-xs text-slate-400">{newWorkflowName.length}/100</span>
                                </div>
                                <input
                                    type="text"
                                    value={newWorkflowName}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setNewWorkflowName(value);
                                        // Validate in real-time and clear error if valid
                                        if (value.trim()) {
                                            const error = validateWorkflowName(value);
                                            setAddWorkflowNameError(error || '');
                                        } else {
                                            setAddWorkflowNameError('');
                                        }
                                    }}
                                    placeholder="Enter workflow name"
                                    disabled={isAddingWorkflow}
                                    maxLength={100}
                                    className={`w-full rounded-lg border px-4 py-3 text-[#282F49] focus:outline-none focus:ring-2 ${
                                        addWorkflowNameError
                                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                            : 'border-[#D7D3E5] focus:ring-[#8e78b7]'
                                    }`}
                                />
                                {addWorkflowNameError && (
                                    <p className="text-xs text-red-500 mt-1">{addWorkflowNameError}</p>
                                )}
                            </div>

                            <div className="flex gap-3 justify-end mt-6">
                                <button
                                    onClick={handleCloseAddWorkflowModal}
                                    disabled={isAddingWorkflow}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddWorkflow}
                                    disabled={isAddingWorkflow}
                                    className="px-4 py-2 bg-[#8e78b7] text-white rounded-lg text-sm font-medium hover:bg-[#7d67a6] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {isAddingWorkflow ? 'Adding...' : 'Add Workflow'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-shrink-0 flex flex-col gap-2">

                {/* Title / Progress Bar */}
                <div className="bg-white rounded-md px-6 py-2">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                            <button onClick={() => navigate('/ai/playground')} className="text-gray-600 hover:text-gray-900">
                                <ChevronLeft size={24} />
                            </button>
                            <h1 className="text-xl font-bold text-gray-700">Build Machine Learning</h1>
                        </div>
                        {readonly ? (
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-md">
                                    Note: Read-only view. Click edit configuration to modify.
                                </span>
                                <button
                                    onClick={handleEditConfiguration}
                                    className="px-4 py-2 bg-[#8e78b7] text-white rounded-lg text-sm font-medium hover:bg-[#7d67a6]"
                                >
                                    Edit Configuration
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <div className="bg-gray-50 px-4 py-2 rounded-lg flex items-center gap-3">
                                    <span className="text-sm text-gray-600">
                                        {isEnsemble && `Model ${activeModelIndex + 1} -`} Progress
                                    </span>
                                    <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[#8e78b7] transition-all duration-300"
                                            style={{ width: `${progressPercentage}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">{Math.round(progressPercentage)}%</span>
                                </div>
                                <button className="w-10 h-10 bg-[#F2EBFF] rounded-lg flex items-center justify-center text-[#8e78b7] hover:bg-purple-100 transition-colors">
                                    <SvgIcon src={RobotIcon} size={22} />
                                </button>
                                <button className="w-10 h-10 bg-[#F2EBFF] rounded-lg flex items-center justify-center text-[#8e78b7] hover:bg-purple-100 transition-colors">
                                    <SvgIcon src={BidLandscapeIcons} size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Ensemble Model Tabs */}
                {isEnsemble && models.length > 0 && (
                    <div className="bg-white rounded-md px-6 py-1">
                        <div className="w-full flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3 overflow-x-auto flex-nowrap" style={{ WebkitOverflowScrolling: 'touch' }}>
                                {models.map((model, index) => (
                                    <div
                                        key={model.id}
                                        className="relative group flex-shrink-0"
                                        onMouseEnter={() => setHoveredModelIndex(index)}
                                        onMouseLeave={() => setHoveredModelIndex(null)}
                                    >
                                        <div
                                            title={model.label}
                                            className={`flex items-center gap-3 px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeModelIndex === index
                                                ? 'bg-[#8e78b7] text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${activeModelIndex === index
                                                ? 'bg-white text-[#8e78b7]'
                                                : 'bg-white text-gray-700'
                                                }`}>
                                                {index + 1}
                                            </span>
                                            <span>{truncateLabel(model.label)}</span>

                                            {!readonly && models.length > 1 && hoveredModelIndex === index && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteModel(index);
                                                    }}
                                                    className={`ml-1 p-0.5 rounded transition-colors ${activeModelIndex === index
                                                        ? 'hover:bg-[#7d67a6]'
                                                        : 'hover:bg-gray-300'
                                                        }`}
                                                >
                                                    <X size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {!readonly && (
                                <button
                                    onClick={openAddWorkflowModal}
                                    disabled={isAddingWorkflow || Object.keys(workflowsState || {}).length >= 8}
                                    title={Object.keys(workflowsState || {}).length >= 8 ? 'Maximum 8 workflows allowed' : ''}
                                    className="flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg text-sm font-medium border-[#8e78b7] text-[#8e78b7] bg-purple-50 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    <Plus size={16} />
                                    {isAddingWorkflow ? 'Adding Workflow...' : 'Add Workflow'}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Workflow Steps Bar */}
                <div className="bg-white rounded-md px-6 pt-2 pb-3 relative overflow-hidden">
                    <div className="w-full">
                        <div className="flex items-center justify-between">
                            {visibleStages.map((stage, index) => {
                                const isActive = stage.path === location.pathname;
                                const actualStageIndex = workflowStages.findIndex(s => s.id === stage.id);
                                const isPast = readonly ? !isActive : actualStageIndex < currentStageIndex;

                                return (
                                    <React.Fragment key={stage.id}>
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`w-9 h-9 rounded-md flex items-center justify-center transition-all ${isActive
                                                    ? 'bg-[#F2EBFF] text-[#8e78b7] border border-[#8E77BB]'
                                                    : isPast
                                                        ? 'bg-[#D4FFEF] text-[#36AD8F]'
                                                        : 'bg-[#F9F9F9] text-[#818181]'
                                                    }`}
                                            >
                                                {isPast ? (
                                                    <div className="bg-[#2ba995] rounded-full p-1">
                                                        <Check size={12} className="text-white stroke-[4]" />
                                                    </div>
                                                ) : (
                                                    <SvgIcon
                                                        src={stage.icon}
                                                        size={16}
                                                        style={isActive ? { filter: ACTIVE_ICON_FILTER } : undefined}
                                                    />
                                                )}
                                            </div>

                                            <span className={`text-sm font-medium whitespace-nowrap ${isActive ? 'text-[#8e78b7]' : isPast ? 'text-[#36AD8F]' : 'text-[#818181]'
                                                }`}>
                                                {stage.label}
                                            </span>
                                        </div>

                                        {index < visibleStages.length - 1 && (
                                            <div className="flex-1 flex items-center justify-center px-2">
                                                <div className="w-full border-t border-dashed border-[#818181] relative flex items-center justify-end">
                                                    <div className="absolute right-0 w-1.5 h-1.5 border-t border-r border-dashed border-[#818181] rotate-45 -mr-0.5" />
                                                </div>
                                            </div>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>

                    <div
                        className="absolute bottom-0 left-0 right-0 h-[5px]"
                        style={{
                            background: 'linear-gradient(90deg, #8E77BB 0%, #F2EBFF 100%)'
                        }}
                    />
                </div>

            </div>
            <div className='flex flex-col flex-1 overflow-hidden min-h-0'>

                <div className='bg-white flex-1 p-4 pr-1 overflow-y-auto min-h-0'>
                    {children}
                </div>

                <div className="bg-white border-t border-gray-200 px-6 py-2 flex-shrink-0" style={{ background: '#FFFFFF', boxShadow: '0px -4px 9px 0px #0000001A' }}>
                    <div className="w-full flex justify-between items-center">
                        {!(isOnStep7 && isStep7Preview) && !isDeploymentStage ? (
                            shouldShowCancel ? (
                                <button
                                    onClick={handleCancel}
                                    disabled={isNavigating}
                                    className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <X size={16} />
                                    Cancel
                                </button>
                            ) : (
                                <button
                                    onClick={handlePrevious}
                                    disabled={isNavigating}
                                    className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft size={16} />
                                    Previous
                                </button>
                            )
                        ) : <div />}

                        {shouldShowFinish ? (
                            <button
                                onClick={handleFinish}
                                className="px-6 py-2 bg-[#8e78b7] text-white rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2"
                            >
                                <Check size={16} />
                                Finish
                            </button>
                        ) : (
                            <>
                                {location.pathname === '/ai/playground/xai' && onSaveModel && isFinalEnsembleWorkflow && (
                                    <button
                                        onClick={onSaveModel}
                                        disabled={isNavigating || isNextDisabled()}
                                        className="px-6 py-2 border border-[#8e78b7] text-[#8e78b7] rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#f5f2fb]"
                                    >
                                        Save Model
                                    </button>
                                )}

                                {isXAIPage && isEnsemble && activeModelIndex < models.length - 1 && (
                                    <button
                                        onClick={handleNext}
                                        disabled={isNextDisabled()}
                                        className="px-6 py-2 bg-[#8e78b7] text-white rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#7d67a6] disabled:hover:bg-[#8e78b7]"
                                    >
                                        Continue to {truncateLabel(models[activeModelIndex + 1]?.label) || 'Next Workflow'}
                                        {isNavigating ? (
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <ArrowRight size={16} />
                                        )}
                                    </button>
                                )}

                                {!isXAIPage && !isLastStage && (
                                    <button
                                        onClick={handleNext}
                                        disabled={isNextDisabled()}
                                        className="px-6 py-2 bg-[#8e78b7] text-white rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#7d67a6] disabled:hover:bg-[#8e78b7]"
                                    >
                                        {getNextButtonLabel()}
                                        {isNavigating && (
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        )}
                                    </button>
                                )}

                                {isLastStage && isEnsemble && activeModelIndex < models.length - 1 && !isXAIPage && (
                                    <button
                                        onClick={handleNext}
                                        disabled={isNextDisabled()}
                                        className="px-6 py-2 bg-[#8e78b7] text-white rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#7d67a6] disabled:hover:bg-[#8e78b7]"
                                    >
                                        {getNextButtonLabel()}
                                        {isNavigating ? (
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <ArrowRight size={16} />
                                        )}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>

            </div>

        </div>
    );
}