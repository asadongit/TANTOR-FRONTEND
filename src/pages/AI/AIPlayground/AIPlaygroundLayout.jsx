import React from 'react';
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
    X
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export const workflowStages = [
    { id: 'model-genesis', label: 'Model Genesis', icon: Boxes, path: '/ai/playground/model-genesis' },
    { id: 'data-preprocessing', label: 'Data Pre-processing', icon: SlidersHorizontal, path: '/ai/playground/data-preprocessing' },
    { id: 'model-selection', label: 'Model Selection', icon: ListChecks, path: '/ai/playground/model-selection' },
    { id: 'model-inferencing', label: 'Model Inferencing', icon: BrainCircuit, path: '/ai/playground/model-inferencing' },
    { id: 'xai', label: 'XAI', icon: Lightbulb, path: '/ai/playground/xai' },
    { id: 'model-deployment', label: 'Model Deployment', icon: Rocket, path: '/ai/playground/model-deployment' },
];

export function AIPlaygroundLayout({
    children,
    currentPreprocessingStep,
    totalPreprocessingSteps,
    onPreprocessingStepChange,
    isStep7Preview,
    onPreviewData,
    isNextDisabled: isNextDisabledProp,
    mode = 'edit',
    readonly = false,
}) {
    const navigate = useNavigate();
    const location = useLocation();

    const currentStageIndex = workflowStages.findIndex(
        stage => stage.path === location.pathname
    );

    const nextStage = workflowStages[Math.min(currentStageIndex + 1, workflowStages.length - 1)];
    const previousStage = workflowStages[Math.max(currentStageIndex - 1, 0)];

    const isPreprocessingPage = location.pathname === '/ai/playground/data-preprocessing';
    const isOnStep7 = isPreprocessingPage && currentPreprocessingStep === totalPreprocessingSteps;

    const shouldShowCancel = currentStageIndex >= 0 && currentStageIndex <= 3;

    const isLastStage = currentStageIndex === workflowStages.length - 1;

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

    const handleNext = () => {
        if (isOnStep7 && !isStep7Preview) {
            if (onPreviewData) onPreviewData(true);
            return;
        }
        if (isOnStep7 && isStep7Preview) {
            if (currentStageIndex < workflowStages.length - 1) {
                navigate(workflowStages[currentStageIndex + 1].path, {
                    state: { mode: readonly ? 'view' : 'edit' }
                });
            }
            return;
        }
        if (isPreprocessingPage && currentPreprocessingStep < totalPreprocessingSteps) {
            onPreprocessingStepChange(currentPreprocessingStep + 1);
        } else if (currentStageIndex < workflowStages.length - 1) {
            navigate(workflowStages[currentStageIndex + 1].path, {
                state: { mode: readonly ? 'view' : 'edit' }
            });
        }
    };

    const handlePrevious = () => {
        if (isPreprocessingPage && currentPreprocessingStep > 1) {
            onPreprocessingStepChange(currentPreprocessingStep - 1);
        } else if (currentStageIndex > 0) {
            navigate(previousStage.path, {
                state: { mode: readonly ? 'view' : 'edit' }
            });
        } else {
            navigate('/ai/playground');
        }
    };

    const handleCancel = () => {
        navigate('/ai/playground');
    };

    const getNextButtonLabel = () => {
        if (isOnStep7 && !isStep7Preview) return 'Preview Data';
        if (isOnStep7 && isStep7Preview) return `Continue to ${nextStage.label}`;
        if (isPreprocessingPage && currentPreprocessingStep < totalPreprocessingSteps) return 'Next Step';
        return `Continue to ${nextStage.label}`;
    };

    const isNextDisabled = () => {
        if (isNextDisabledProp !== undefined) {
            return isNextDisabledProp;
        }
        return !isPreprocessingPage && currentStageIndex === workflowStages.length - 1 && !(isOnStep7 && !isStep7Preview);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col gap-2">
            <div className="bg-white rounded-md px-6 py-3">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate('/ai/playground')} className="text-gray-600 hover:text-gray-900">
                            <ChevronLeft size={24} />
                        </button>
                        <h1 className="text-xl font-semibold text-gray-900">Build Machine Learning</h1>
                    </div>
                    {readonly ? (
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-md">
                                Note: Read-only view. Click edit configuration to modify.
                            </span>

                            <button
                                onClick={() =>
                                    navigate(location.pathname, {
                                        state: { ...location.state, mode: 'edit' },
                                    })
                                }
                                className="px-4 py-2 bg-[#8e78b7] text-white rounded-lg text-sm font-medium hover:bg-[#7d67a6]"
                            >
                                Edit Configuration
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className="bg-gray-50 px-4 py-2 rounded-lg flex items-center gap-3">
                                <span className="text-sm text-gray-600">Progress</span>
                                <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[#8e78b7] transition-all duration-300"
                                        style={{ width: `${progressPercentage}%` }}
                                    />
                                </div>
                                <span className="text-sm font-medium text-gray-700">{Math.round(progressPercentage)}%</span>
                            </div>
                            <button className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-[#8e78b7] hover:bg-purple-100 transition-colors">
                                <Bot size={20} />
                            </button>
                            <button className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-[#8e78b7] hover:bg-purple-100 transition-colors">
                                <Image size={20} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-md px-6 pt-3 pb-4 relative overflow-hidden">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between">
                        {workflowStages.map((stage, index) => {
                            const IconComponent = stage.icon;
                            const isActive = index === currentStageIndex;
                            const isPast = readonly ? index !== currentStageIndex : index < currentStageIndex;

                            return (
                                <React.Fragment key={stage.id}>
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${isActive
                                                ? 'bg-purple-50 text-[#8e78b7] border border-purple-400'
                                                : isPast
                                                    ? 'bg-[#e6f6f4] text-[#2ba995]'
                                                    : 'bg-gray-50 text-gray-400 border border-gray-100'
                                                }`}
                                        >
                                            {isPast ? (
                                                <div className="bg-[#2ba995] rounded-full p-1">
                                                    <Check size={12} className="text-white stroke-[4]" />
                                                </div>
                                            ) : (
                                                <IconComponent size={20} />
                                            )}
                                        </div>

                                        <span className={`text-sm font-medium whitespace-nowrap ${isActive ? 'text-[#8e78b7]' : isPast ? 'text-[#2ba995]' : 'text-gray-400'
                                            }`}>
                                            {stage.label}
                                        </span>
                                    </div>

                                    {index < workflowStages.length - 1 && (
                                        <div className="flex-1 flex items-center justify-center px-2">
                                            <div className="w-full border-t border-dashed border-gray-300 relative flex items-center justify-end">
                                                <div className="absolute right-0 w-1.5 h-1.5 border-t border-r border-dashed border-gray-300 rotate-45 -mr-0.5" />
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

            <div className='flex flex-col'>
                <div className='bg-white flex-1 p-4'>
                    {children}
                </div>

                <div className="bg-white border-t border-gray-200 px-6 py-4">
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                        {!(isOnStep7 && isStep7Preview) ? (
                            shouldShowCancel ? (
                                <button
                                    onClick={handleCancel}
                                    className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
                                >
                                    <X size={16} />
                                    Cancel
                                </button>
                            ) : (
                                <button
                                    onClick={handlePrevious}
                                    className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
                                >
                                    <ChevronLeft size={16} />
                                    Previous
                                </button>
                            )
                        ) : <div />}

                        {!isLastStage && (
                            <button
                                onClick={handleNext}
                                disabled={isNextDisabled()}
                                className="px-6 py-2 bg-[#8e78b7] text-white rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#7d67a6] disabled:hover:bg-[#8e78b7]"
                            >
                                {getNextButtonLabel()}
                                <ArrowRight size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}