import React, { useEffect, useState } from 'react';
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
    const { workflowState, datasetState, mode, setMode, resetAllStates, isAIPlaygroundActive } = useAIPlayground();
    const readonly = mode === 'view';
    const ensembleCount = location.state?.ensembleCount ?? 1;
    const isEnsemble = location.state?.isEnsemble;
    const initialEnsembleCount = ensembleCount;
    const hostnameAI = window._env_?.VITE_AI_API;
    const [isCancelLoading, setIsCancelLoading] = useState(false);

    const modelGenesisConfig = workflowState?.modelGenesis?.config;

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
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showFinishModal, setShowFinishModal] = useState(false);

    useEffect(() => {
        if (isEnsemble) {
            const initialModels = Array.from({ length: initialEnsembleCount }, (_, i) => ({
                id: `model-${i + 1}`,
                label: `Model ${String(i + 1).padStart(2, '0')}`
            }));
            setModels(initialModels);

            const stateActiveIndex = location.state?.activeModelIndex;
            if (stateActiveIndex !== undefined && stateActiveIndex >= 0 && stateActiveIndex < initialModels.length) {
                setActiveModelIndex(stateActiveIndex);
            }
        }
    }, [isEnsemble, initialEnsembleCount, location.state?.activeModelIndex]);

    useEffect(() => {
        const handlePopState = (event) => {
            const currentPath = window.location.pathname;
            if (currentPath.startsWith('/ai/playground') && isAIPlaygroundActive) {
                event.preventDefault();

                window.history.pushState(null, '', location.pathname);

                setShowCancelModal(true);
            }
        };

        window.history.pushState(null, '', location.pathname);

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [location.pathname]);

    const currentStageIndex = workflowStages.findIndex(
        stage => stage.path === location.pathname
    );

    const getNextStage = () => {
        const isPreprocessingPage = location.pathname === '/ai/playground/data-preprocessing';
        const isModelSelectionPage = location.pathname === '/ai/playground/model-selection';

        if (isPreprocessingPage && !isDataPreprocessingAuto && isModelSelectionAuto) {
            return workflowStages.find(stage => stage.id === 'model-inferencing');
        }

        if (isPreprocessingPage && isDataPreprocessingAuto && isModelSelectionAuto) {
            return workflowStages.find(stage => stage.id === 'model-inferencing');
        }

        return workflowStages[Math.min(currentStageIndex + 1, workflowStages.length - 1)];
    };

    const nextStage = getNextStage();
    const previousStage = workflowStages[Math.max(currentStageIndex - 1, 0)];

    const isPreprocessingPage = location.pathname === '/ai/playground/data-preprocessing';
    const isOnStep7 = isPreprocessingPage && currentPreprocessingStep === totalPreprocessingSteps;

    const shouldShowCancel = currentStageIndex >= 0 && currentStageIndex <= 3;

    const isLastStage = currentStageIndex === workflowStages.length - 1;
    const isDeploymentStage = location.pathname === '/ai/playground/model-deployment';

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
        setIsCancelLoading(true);
        try {
            await fetch(`${hostnameAI}/model/cleanup`, {
                method: 'POST',
                headers: { 'accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: datasetState.sessionId,
                    training_flag: workflowState.modelSelection.apiResponse !== null
                })
            });
        } catch (error) {
            console.error('Cleanup API error:', error);
        }
        resetAllStates();
        setIsCancelLoading(false);
        setShowCancelModal(false);
        navigate('/ai/playground');
    };

    const handleCancelModalClose = () => {
        setShowCancelModal(false);
    };

    const handleAddModel = () => {
        if (readonly) return;
        const newModelNumber = models.length + 1;
        const newModel = {
            id: `model-${newModelNumber}`,
            label: `Model ${String(newModelNumber).padStart(2, '0')}`
        };
        setModels([...models, newModel]);
        navigate(location.pathname, {
            state: { ...location.state, isEnsemble, ensembleCount: models.length + 1 },
            replace: true
        });
    };

    const handleDeleteModel = (index) => {
        if (readonly || models.length <= 1) return;

        const newModels = models.filter((_, i) => i !== index);
        const renumberedModels = newModels.map((model, i) => ({
            ...model,
            label: `Model ${String(i + 1).padStart(2, '0')}`
        }));

        setModels(renumberedModels);

        if (activeModelIndex >= renumberedModels.length) {
            setActiveModelIndex(renumberedModels.length - 1);
        } else if (activeModelIndex > index) {
            setActiveModelIndex(activeModelIndex - 1);
        }

        navigate(location.pathname, {
            state: { ...location.state, isEnsemble, ensembleCount: renumberedModels.length },
            replace: true
        });
    };

    const getNextButtonLabel = () => {
        const isXAIPage = location.pathname === '/ai/playground/xai';

        if (isNavigating) return 'Processing...';

        if (isXAIPage) {
            return 'Save Model';
        }

        if (isOnStep7 && !isStep7Preview) return 'Preview Data';
        if (isOnStep7 && isStep7Preview) return `Continue to ${nextStage?.label || 'Next Stage'}`;
        if (isDeploymentStage && isEnsemble && activeModelIndex < models.length - 1) {
            return `Continue to ${models[activeModelIndex + 1].label}`;
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

    // Check if we should show the Finish button
    const shouldShowFinish = isDeploymentStage && (!isEnsemble || activeModelIndex >= models.length - 1);

    return (
        <div className="h-full bg-gray-50 flex flex-col gap-2 overflow-hidden p-4">

            {/* Cancel Warning Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                    <AlertTriangle className="text-red-600" size={24} />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900">Cancel Workflow?</h2>
                            </div>

                            <p className="text-gray-600 mb-6">
                                Are you sure you want to cancel? All unsaved progress and configurations will be lost. This action cannot be undone.
                            </p>

                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={handleCancelModalClose}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Continue Working
                                </button>
                                <button
                                    onClick={handleConfirmCancel}
                                    disabled={isCancelLoading}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center gap-2"
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

            {/* ✅ STICKY TOP SECTION — title bar + ensemble tabs + steps bar */}
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
                            <div className="flex items-center gap-3">
                                {models.map((model, index) => (
                                    <div
                                        key={model.id}
                                        className="relative group"
                                        onMouseEnter={() => setHoveredModelIndex(index)}
                                        onMouseLeave={() => setHoveredModelIndex(null)}
                                    >
                                        <button
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
                                            <span>{model.label}</span>

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
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {!readonly && (
                                <button
                                    onClick={handleAddModel}
                                    className="flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg text-sm font-medium border-[#8e78b7] text-[#8e78b7] bg-purple-50 transition-all"
                                >
                                    <Plus size={16} />
                                    Add Model
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
                            background: 'linear-gradient(90deg, #8e78b7 0%, #b09ef4ff 50%, #f3f4f6 100%)'
                        }}
                    />
                </div>

            </div>
            {/* ✅ END STICKY TOP SECTION */}

            {/* SCROLLABLE CONTENT + FIXED FOOTER */}
            <div className='flex flex-col flex-1 overflow-hidden min-h-0'>

                {/* Only this area scrolls */}
                <div className='bg-white flex-1 p-4 overflow-y-auto min-h-0'>
                    {children}
                </div>

                {/* ✅ Footer stays pinned at bottom */}
                <div className="bg-white border-t border-gray-200 px-6 py-2 flex-shrink-0">
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
                                {!isLastStage && (
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

                                {isLastStage && isEnsemble && activeModelIndex < models.length - 1 && (
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
            {/* ✅ END SCROLLABLE CONTENT */}

        </div>
    );
}