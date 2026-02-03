import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Scale, Download, CircleCheckBig, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAIPlayground } from '../../../../../../context/AIPlaygroundContext';
import InfoButton from '../../../components/InfoButton';

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
    <label className={`bg-white px-4 py-3 rounded-lg border border-gray-200 hover:border-[#8e78b7] transition-colors group relative ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
        <div className="flex items-center gap-2">
            <input
                type="radio"
                name={name}
                value={value}
                checked={checked}
                onChange={onChange}
                disabled={readonly}
                className={`w-4 h-4 text-[#8e78b7] border-gray-300 focus:ring-[#8e78b7] ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            />
            <span className="text-sm text-gray-700">{label}</span>
        </div>

        {/* Tooltip */}
        {description && (
            <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
                <p className="leading-relaxed">{description}</p>
                <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
            </div>
        )}
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
    readonly,
    sectionKey
}) => {
    const sectionDescriptions = {
        imbalancedData: "Imbalanced Data Handling refers to techniques used to address datasets where one class has significantly more samples than others. These methods help prevent model bias toward the majority class and improve the model’s ability to correctly learn and predict minority classes.",
    };

    return (
        <div className="bg-gray-50 rounded-lg border border-gray-200">
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                    <div className="flex-1">
                        <div className='flex flex-row'>
                            <h4 className="text-sm font-medium text-gray-700 mr-2">{title}</h4>
                            <InfoButton sectionDescriptions={sectionDescriptions} section={sectionKey} />
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <ToggleSwitch checked={isToggled} onChange={onToggle} readonly={readonly} />
                    {isToggled && (
                        <button
                            onClick={onExpand}
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
    )
};

const VariantDataTable = ({ variantKey, displayData, message }) => {
    if (!displayData || displayData.length === 0) {
        return null;
    }

    const rowCount = displayData.length;
    const columnCount = Object.keys(displayData[0]).length;

    return (
        <div className="space-y-3">
            <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-4 flex items-center justify-between border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div>
                            <h3 className="text-base font-semibold text-gray-900">
                                {variantKey.toUpperCase()} - Cleaned Data Preview
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Showing 1-{Math.min(10, rowCount)} of {rowCount} rows • {columnCount} columns
                            </p>
                        </div>
                    </div>
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
};

function Step7({ onShowPreview, showPreview, onApiCall }) {
    const hostnameAI = window._env_?.VITE_AI_API;
    const { workflowState, datasetState, updatePreprocessingStep, updateWorkflowStage, mode } = useAIPlayground();
    const readonly = mode === 'view';

    const [toggles, setToggles] = useState({
        imbalancedData: false,
    });

    const [expandedSections, setExpandedSections] = useState({
        imbalancedData: false,
    });

    const [samplingMethod, setSamplingMethod] = useState('smote');
    const [isProcessing, setIsProcessing] = useState(false);
    const [previewData, setPreviewData] = useState(null);

    const IMBALANCE_HANDLING_CONFIG = {
        methods: [
            {
                value: 'smote',
                label: 'SMOTE',
                description: 'SMOTE is an oversampling method that generates synthetic data points for the minority class by interpolating between existing samples. It increases class balance without duplicating records.',
                availability: {
                    binary: 'yes',
                    multiclass: 'yes'
                }
            },
            {
                value: 'adasyn',
                label: 'ADASYN',
                description: 'ADASYN is an extension of SMOTE that generates more synthetic samples in hard-to-learn regions. It focuses on areas where minority samples are sparse or difficult to classify.',
                availability: {
                    binary: 'yes',
                    multiclass: 'warning'
                }
            },
            {
                value: 'borderline_smote',
                label: 'Borderline SMOTE',
                description: 'Borderline-SMOTE generates synthetic samples near the class decision boundary. It improves classification by strengthening minority samples that are most at risk of misclassification.',
                availability: {
                    binary: 'yes',
                    multiclass: 'warning'
                }
            },
            {
                value: 'random_under',
                label: 'Random Under-sampling',
                description: 'Random Under-Sampling reduces class imbalance by randomly removing samples from the majority class. It is simple but may discard potentially useful information.',
                availability: {
                    binary: 'yes',
                    multiclass: 'warning'
                }
            },
            {
                value: 'svmsmote',
                label: 'SVM SMOTE',
                description: 'SVM-SMOTE uses a Support Vector Machine to identify boundary regions before generating synthetic samples. It focuses oversampling on informative and critical data points.',
                availability: {
                    binary: 'yes',
                    multiclass: 'warning'
                }
            },
            {
                value: 'nearmiss',
                label: 'NearMiss',
                description: 'NearMiss is an undersampling technique that selects majority class samples closest to minority samples. It helps preserve decision boundaries while reducing majority class size.',
                availability: {
                    binary: 'yes',
                    multiclass: 'no'
                }
            },
            {
                value: 'tomek',
                label: 'Tomek Link',
                description: 'Tomek Links identify pairs of samples from opposite classes that are very close to each other. Removing these pairs helps clean overlapping and ambiguous data points.',
                availability: {
                    binary: 'yes',
                    multiclass: 'warning'
                }
            },
            {
                value: 'enn',
                label: 'ENN (Edited Nearest Neighbours)',
                description: 'ENN removes samples that are misclassified by their nearest neighbors. It reduces noise and improves class separation.',
                availability: {
                    binary: 'yes',
                    multiclass: 'warning'
                }
            },
            {
                value: 'smotetomek',
                label: 'SMOTE + Tomek',
                description: 'SMOTE + Tomek Links is a hybrid method that first oversamples the minority class and then cleans overlapping samples. It improves class balance while reducing noise at class boundaries.',
                availability: {
                    binary: 'yes',
                    multiclass: 'warning'
                }
            },
            {
                value: 'smoteenn',
                label: 'SMOTE + ENN',
                description: 'SMOTE + ENN is a hybrid method that combines oversampling with noise reduction. It first generates synthetic minority samples, then removes misclassified samples to improve class separation.',
                availability: {
                    binary: 'yes',
                    multiclass: 'warning'
                }
            },
        ]
    };

    const classificationType = workflowState?.modelGenesis?.config?.modelling_type || 'binary';

    const getAvailableSamplingMethods = (classificationType) => {
        return IMBALANCE_HANDLING_CONFIG.methods.filter(
            method => method.availability[classificationType] === 'yes'
        );
    };

    const samplingMethods = getAvailableSamplingMethods(classificationType);

    const modelGenesisConfig = workflowState?.modelGenesis?.config;

    const dataPreprocessingMode = readonly
        ? modelGenesisConfig?.data_preprocessing_mode
        : modelGenesisConfig?.dataPreprocessing;
    const modelSelectionMode = modelGenesisConfig?.modelSelection;

    const isDataPreprocessingAuto = dataPreprocessingMode &&
        ['Swift', 'Standard', 'Comprehensive'].includes(dataPreprocessingMode);
    const isModelSelectionAuto = modelSelectionMode &&
        ['Swift', 'Standard', 'Comprehensive'].includes(modelSelectionMode);

    useEffect(() => {
        if ((mode === 'view' || mode === 'edit') && workflowState?.dataPreprocessing?.step7?.config) {
            const config = workflowState.dataPreprocessing.step7.config;

            setToggles({
                imbalancedData: config.imbalance_handling || false,
            });

            setSamplingMethod(config.imbalance_handling_method || 'smote');

            if (workflowState.dataPreprocessing.step7.apiResponse) {
                setPreviewData(workflowState.dataPreprocessing.step7.apiResponse);
            }
        }
    }, [mode, workflowState]);

    const handleImbalanceHandling = async () => {
        if (readonly) return true;

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
                config: {
                    imbalance_handling: toggles.imbalancedData,
                    imbalance_handling_method: samplingMethod
                },
                apiResponse: data
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
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    if (showPreview) {
        const shouldUseAutoData = isDataPreprocessingAuto;

        let displayDataSource;
        let messageText;

        if (shouldUseAutoData && workflowState?.modelGenesis?.apiResponse) {
            displayDataSource = workflowState.modelGenesis.apiResponse;
            messageText = displayDataSource.message || 'Genesis preprocessing complete.';
        } else {
            displayDataSource = previewData;
            messageText = previewData?.message || 'Imbalance handling processed. Class weights calculated. Cleaned data and pipeline saved.';
        }

        if (!displayDataSource?.cleaned_df_preview) {
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

        const cleanedDfPreview = displayDataSource.cleaned_df_preview;
        const variantKeys = Object.keys(cleanedDfPreview);
        const isMultiVariant = variantKeys.length > 0 &&
            variantKeys.some(key => key.match(/^p\d+$/)) &&
            Array.isArray(cleanedDfPreview[variantKeys[0]]);

        if (!isMultiVariant) {
            const displayData = Array.isArray(cleanedDfPreview) ? cleanedDfPreview : [];

            if (displayData.length === 0) {
                return (
                    <div className="space-y-4">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
                            <div className="flex-1">
                                <h3 className="text-sm font-medium text-yellow-800">No Data Available</h3>
                                <p className="text-xs text-yellow-600 mt-1">
                                    No cleaned data preview is available.
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
                            {/* <p className="text-xs text-green-600 mt-1">
                                {messageText}
                            </p> */}
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

        const validVariants = variantKeys.filter(key =>
            key.match(/^p\d+$/) && Array.isArray(cleanedDfPreview[key]) && cleanedDfPreview[key].length > 0
        );

        if (validVariants.length === 0) {
            return (
                <div className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
                        <div className="flex-1">
                            <h3 className="text-sm font-medium text-yellow-800">No Valid Variants</h3>
                            <p className="text-xs text-yellow-600 mt-1">
                                No valid variant data found in the cleaned preview.
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
                    <div className="rounded-full flex items-center justify-center">
                        <CircleCheckBig className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-medium text-green-800">Processing Complete!</h3>
                        {/* <p className="text-xs text-green-600 mt-1">
                            {messageText}
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                            Found {validVariants.length} variant{validVariants.length > 1 ? 's' : ''}: {validVariants.join(', ').toUpperCase()}
                        </p> */}
                    </div>
                </div>

                {validVariants.map(variantKey => (
                    <VariantDataTable
                        key={variantKey}
                        variantKey={variantKey}
                        displayData={cleanedDfPreview[variantKey]}
                        message={messageText}
                    />
                ))}
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
                sectionKey='imbalancedData'
            >
                <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                        <h5 className="text-sm font-medium text-gray-700">Sampling Method</h5>
                        <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-md border border-gray-200">
                            {samplingMethods.find(m => m.value === samplingMethod)?.label || 'SMOTE'}
                        </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
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