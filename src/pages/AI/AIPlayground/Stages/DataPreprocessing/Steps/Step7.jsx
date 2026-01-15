import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Scale, Download, CircleCheckBig } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAIPlayground } from '../../../../../../context/AIPlaygroundContext';

const ToggleSwitch = ({ checked, onChange, readonly }) => (
    <label className={`relative inline-flex items-center ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
        <input
            type="checkbox"
            checked={checked}
            onChange={onChange}
            disabled={readonly}
            className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8e78b7]"></div>
    </label>
);

const RadioOption = ({ name, value, checked, onChange, label, description, readonly }) => (
    <label className={`flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'} group`}>
        <input
            type="radio"
            name={name}
            value={value}
            checked={checked}
            onChange={onChange}
            disabled={readonly}
            className="w-4 h-4 mt-0.5 text-[#8e78b7] border-gray-300 focus:ring-[#8e78b7]"
        />
        <div className="flex-1">
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 block">
                {label}
            </span>
            {description && (
                <span className="text-xs text-gray-400 mt-0.5 block">{description}</span>
            )}
        </div>
    </label>
);

const FeatureSection = ({
    title,
    description,
    isToggled,
    isExpanded,
    onToggle,
    onExpand,
    children,
    icon: Icon,
    readonly
}) => (
    <div className="bg-gray-50 rounded-lg border border-gray-200">
        <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
                <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-700">{title}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">{description}</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <ToggleSwitch checked={isToggled} onChange={onToggle} readonly={readonly} />
                {isToggled && (
                    <button 
                        onClick={onExpand}
                        disabled={readonly}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                )}
            </div>
        </div>

        {isToggled && isExpanded && (
            <div className="px-4 pb-4 border-t border-gray-100">
                <div className="mt-4">{children}</div>
            </div>
        )}
    </div>
);

function Step7({ onShowPreview, showPreview, readonly = false, onApiCall }) {
    const hostnameAI = window._env_?.VITE_AI_API;
    const { workflowState, datasetState, updatePreprocessingStep, updateWorkflowStage } = useAIPlayground();
    
    const [toggles, setToggles] = useState({
        imbalancedData: true,
    });

    const [expandedSections, setExpandedSections] = useState({
        imbalancedData: true,
    });

    const [samplingMethod, setSamplingMethod] = useState('smote');
    const [isProcessing, setIsProcessing] = useState(false);
    const [previewData, setPreviewData] = useState(null);

    const samplingMethods = [
        {
            value: 'smote',
            label: 'SMOTE',
            description: 'Synthetic Minority Over-sampling Technique'
        },
        {
            value: 'adasyn',
            label: 'ADASYN',
            description: 'Adaptive Synthetic Sampling'
        },
        {
            value: 'borderline_smote',
            label: 'Borderline SMOTE',
            description: 'SMOTE for borderline samples'
        },
        {
            value: 'random_under',
            label: 'Random Under-sampling',
            description: 'Random under-sampling of majority class'
        },
        {
            value: 'svmsmote',
            label: 'SVM SMOTE',
            description: 'SMOTE using SVM classifier'
        },
        {
            value: 'nearmiss',
            label: 'NearMiss',
            description: 'NearMiss under-sampling'
        },
        {
            value: 'tomek',
            label: 'Tomek Links',
            description: 'Remove Tomek links'
        },
        {
            value: 'enn',
            label: 'ENN',
            description: 'Edited Nearest Neighbors'
        },
        {
            value: 'smotetomek',
            label: 'SMOTE + Tomek',
            description: 'Combination of SMOTE and Tomek links'
        },
        {
            value: 'smoteenn',
            label: 'SMOTE + ENN',
            description: 'Combination of SMOTE and ENN'
        },
    ];

    const handleImbalanceHandling = async () => {
        if (readonly) return false;

        setIsProcessing(true);

        try {
            const sessionId = datasetState?.sessionId
            
            if (!sessionId) {
                throw new Error('Session ID not found');
            }

            const requestBody = {
                session_id: sessionId,
                imbalance_handling: toggles.imbalancedData,
                imbalance_handling_method: samplingMethod,
                use_class_weights: false,
                sampling_strategy: "auto"
            };

            const response = await fetch(`${hostnameAI}/data/preprocess/imbalance_handling`, {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            updatePreprocessingStep('step7', {
                imbalance_handling: toggles.imbalancedData,
                imbalance_handling_method: samplingMethod,
                response: data
            });

            setPreviewData(data);

            toast.success('Imbalance handling completed successfully!', {
                duration: 3000,
                position: 'top-right',
            });

            return true;
        } catch (error) {
            console.error('Imbalance handling error:', error);
            toast.error(error.message || 'Imbalance handling failed. Please try again.', {
                duration: 4000,
                position: 'top-right',
            });
            return false;
        } finally {
            setIsProcessing(false);
        }
    };

    useEffect(() => {
        if (onApiCall) {
            onApiCall(handleImbalanceHandling);
        }
    }, [onApiCall, toggles.imbalancedData, samplingMethod]);

    const toggleSwitch = (key) => {
        if (readonly) return;
        const newToggleState = !toggles[key];
        
        setToggles(prev => ({ ...prev, [key]: newToggleState }));
        
        if (newToggleState) {
            setExpandedSections(prev => ({ ...prev, [key]: true }));
        } else {
            setExpandedSections(prev => ({ ...prev, [key]: false }));
        }
    };

    const toggleSection = (section) => {
        if (readonly) return;
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    if (showPreview) {
        const displayData = previewData?.cleaned_df_preview;
        
        if (!displayData || displayData.length === 0) {
            return (
                <div className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
                        <div className="flex-1">
                            <h3 className="text-sm font-medium text-yellow-800">No Data Available</h3>
                            <p className="text-xs text-yellow-600 mt-1">
                                No cleaned data preview is available. Please run the imbalance handling process first.
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        const rowCount = displayData.length;
        const columnCount = Object.keys(displayData[0]).length;

        return (
            <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
                    <div className="rounded-full flex items-center justify-center">
                        <CircleCheckBig className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-medium text-green-800">Processing Complete!</h3>
                        <p className="text-xs text-green-600 mt-1">
                            {previewData?.message || 'Imbalance handling processed. Class weights calculated. Cleaned data and pipeline saved.'}
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200">
                    <div className="p-4 flex items-center justify-between border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <div>
                                <h3 className="text-base font-semibold text-gray-900">Cleaned Data Preview</h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Showing 1-{Math.min(10, rowCount)} of {rowCount} rows • {columnCount} columns
                                </p>
                            </div>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            <Download size={16} />
                            Download All Data
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead className="bg-purple-100">
                                <tr>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700 sticky left-0 bg-purple-100 z-10">#</th>
                                    {Object.keys(displayData[0]).map(key => (
                                        <th key={key} className="px-3 py-2 text-left font-medium text-gray-700 whitespace-nowrap">
                                            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {displayData.slice(0, 10).map((row, index) => (
                                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="px-3 py-2 text-gray-700 sticky left-0 bg-inherit font-medium z-10">{index + 1}</td>
                                        {Object.entries(row).map(([key, value]) => (
                                            <td key={key} className="px-3 py-2 text-gray-600 whitespace-nowrap">
                                                {typeof value === 'number' ? value.toFixed(4) : value}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <FeatureSection
                title="Imbalanced Data Handling"
                description="Apply sampling techniques to balance class distribution in your dataset"
                isToggled={toggles.imbalancedData}
                isExpanded={expandedSections.imbalancedData}
                onToggle={() => toggleSwitch('imbalancedData')}
                onExpand={() => toggleSection('imbalancedData')}
                icon={Scale}
                readonly={readonly}
            >
                <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                        <h5 className="text-sm font-medium text-gray-700">Sampling Method</h5>
                        <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-md border border-gray-200">
                            {samplingMethods.find(m => m.value === samplingMethod)?.label || 'SMOTE'}
                        </span>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100 max-h-96 overflow-y-auto">
                        {samplingMethods.map(method => (
                            <RadioOption
                                key={method.value}
                                name="samplingMethod"
                                value={method.value}
                                checked={samplingMethod === method.value}
                                onChange={(e) => !readonly && setSamplingMethod(e.target.value)}
                                label={method.label}
                                description={method.description}
                                readonly={readonly}
                            />
                        ))}
                    </div>
                </div>
            </FeatureSection>
        </div>
    );
}

export default Step7;