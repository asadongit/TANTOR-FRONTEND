import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Scale, CircleCheckBig } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAIPlayground } from '../../../../../../context/AIPlaygroundContext';
import InfoButton from '../../../components/InfoButton';

const ToggleSwitch = ({ checked, onChange, readonly }) => (
    <label className={`relative inline-flex items-center ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
        <input type="checkbox" checked={checked} onChange={onChange} disabled={readonly} className="sr-only peer" />
        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8e78b7]"></div>
    </label>
);


const RadioOption = ({ name, value, checked, onChange, label, description, readonly }) => (
    <label className={`px-4 py-3 rounded-lg transition-colors group relative ${checked ? 'bg-purple-100 border border-[#8e78b7]' : 'bg-white'} ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
        <div className="flex items-center gap-2">
            <input type="radio" name={name} value={value} checked={checked} onChange={onChange} disabled={readonly} className={`w-4 h-4 accent-[#8e78b7] ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`} />
            <span className={`text-sm font-medium ${checked ? 'text-[#8e78b7]' : 'text-gray-700'}`}>{label}</span>
        </div>
        {description && (
            <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-[#332849] text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
                <p className="leading-relaxed">{description}</p>
                <div className="absolute -top-1 left-4 w-2 h-2 bg-[#332849] transform rotate-45"></div>
            </div>
        )}
    </label>
);

const FeatureSection = ({ title, isToggled, isExpanded, onToggle, onExpand, children, readonly, sectionKey }) => {
    const sectionDescriptions = {
        imbalancedData: "Imbalanced Data Handling refers to techniques used to address datasets where one class has significantly more samples than others. These methods help prevent model bias toward the majority class and improve the model's ability to correctly learn and predict minority classes.",
    };
    return (
        <div className="bg-gray-50 rounded-lg">
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
                        <button onClick={onExpand} className="text-gray-400 hover:text-gray-600">
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                    )}
                </div>
            </div>
            {isToggled && isExpanded && (
                <div className="px-4 pb-4">
                    <div className="mt-4">{children}</div>
                </div>
            )}
        </div>
    );
};

const CleanDataTable = ({ title, data }) => {
    if (!data || data.length === 0) return null;

    const rowCount = data.length;
    const columnCount = Object.keys(data[0]).length;

    return (
        <div className="flex flex-col bg-white border border-gray-200 rounded-lg">

            {/* Header */}
            {title && (
                <div className="px-4 py-3 border-b border-gray-200 shrink-0">
                    <h3 className="text-base font-medium text-gray-900">
                        {title}
                    </h3>
                </div>
            )}

            {/* Table Scroll Area */}
            <div className="">
                <div className="overflow-auto">
                    <table className="min-w-full border-collapse">
                        <thead className="sticky top-0 z-20 bg-[#F9F9F9]">
                            <tr className="border-b border-gray-200">
                                <th className="px-5 py-3 text-left text-sm font-medium text-gray-800 sticky left-0 bg-[#F9F9F9] z-30">
                                    #
                                </th>
                                {Object.keys(data[0]).map(key => (
                                    <th
                                        key={key}
                                        className="px-5 py-3 text-left text-sm font-medium text-gray-800 whitespace-nowrap"
                                    >
                                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                            {data.map((row, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-5 py-3 text-sm text-gray-500 sticky left-0 bg-white">
                                        {index + 1}
                                    </td>
                                    {Object.entries(row).map(([key, value]) => (
                                        <td
                                            key={key}
                                            className="px-5 py-3 text-sm text-gray-600 whitespace-nowrap"
                                        >
                                            {typeof value === 'number'
                                                ? value.toFixed(4)
                                                : value}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Bottom Info */}
            <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-600 shrink-0">
                Showing 1 to {rowCount} of {rowCount} results • {columnCount} columns
            </div>
        </div>
    );
};

const VariantDataTable = ({ variantKey, displayData }) => {
    if (!displayData || displayData.length === 0) return null;
    return (
        <CleanDataTable
            title={`${variantKey.toUpperCase()} - Cleaned Data Preview`}
            subtitle={`Showing 1-${Math.min(10, displayData.length)} of ${displayData.length} rows • ${Object.keys(displayData[0]).length} columns`}
            data={displayData}
        />
    );
};

function Step7({ readonly: readonlyProp, onShowPreview, showPreview, onApiCall, isDataPreprocessingAuto: isDataPreprocessingAutoProp }) {
    const hostnameAI = window._env_?.VITE_AI_API;
    const { workflowsState, activeWorkflowId, datasetState, updatePreprocessingStep, updateWorkflowStage, mode } = useAIPlayground();
    const workflowState = activeWorkflowId
    ? workflowsState[activeWorkflowId]
    : null;  
    const readonly = readonlyProp || mode === 'view';
    const currentWorkflowId = workflowState?.workflow_id || activeWorkflowId;

    const [toggles, setToggles] = useState({ imbalancedData: false });
    const [expandedSections, setExpandedSections] = useState({ imbalancedData: false });
    const [samplingMethod, setSamplingMethod] = useState('smote');
    const [isProcessing, setIsProcessing] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const modelGenesisConfig = workflowState?.modelGenesis?.config;
    const modellingType = modelGenesisConfig?.modelling_type || 'binary';
    const isRegression = modellingType === 'regression';
    // Use prop if provided, otherwise calculate from config
    const isDataPreprocessingAuto = isDataPreprocessingAutoProp !== undefined ? isDataPreprocessingAutoProp : (modelGenesisConfig?.dataPreprocessing && ['Swift', 'Standard', 'Comprehensive'].includes(modelGenesisConfig?.dataPreprocessing));

    const IMBALANCE_HANDLING_CONFIG = {
        methods: [
            { value: 'smote', label: 'SMOTE', description: 'SMOTE is an oversampling method that generates synthetic data points for the minority class by interpolating between existing samples.', availability: { binary: 'yes', multiclass: 'yes' } },
            { value: 'adasyn', label: 'ADASYN', description: 'ADASYN is an extension of SMOTE that generates more synthetic samples in hard-to-learn regions.', availability: { binary: 'yes', multiclass: 'warning' } },
            { value: 'borderline_smote', label: 'Borderline SMOTE', description: 'Borderline-SMOTE generates synthetic samples near the class decision boundary.', availability: { binary: 'yes', multiclass: 'warning' } },
            { value: 'random_under', label: 'Random Under-sampling', description: 'Random Under-Sampling reduces class imbalance by randomly removing samples from the majority class.', availability: { binary: 'yes', multiclass: 'warning' } },
            { value: 'svmsmote', label: 'SVM SMOTE', description: 'SVM-SMOTE uses a Support Vector Machine to identify boundary regions before generating synthetic samples.', availability: { binary: 'yes', multiclass: 'warning' } },
            { value: 'nearmiss', label: 'NearMiss', description: 'NearMiss is an undersampling technique that selects majority class samples closest to minority samples.', availability: { binary: 'yes', multiclass: 'no' } },
            { value: 'tomek', label: 'Tomek Link', description: 'Tomek Links identify pairs of samples from opposite classes that are very close to each other.', availability: { binary: 'yes', multiclass: 'warning' } },
            { value: 'enn', label: 'ENN (Edited Nearest Neighbours)', description: 'ENN removes samples that are misclassified by their nearest neighbors.', availability: { binary: 'yes', multiclass: 'warning' } },
            { value: 'smotetomek', label: 'SMOTE + Tomek', description: 'SMOTE + Tomek Links is a hybrid method that first oversamples the minority class and then cleans overlapping samples.', availability: { binary: 'yes', multiclass: 'warning' } },
            { value: 'smoteenn', label: 'SMOTE + ENN', description: 'SMOTE + ENN is a hybrid method that combines oversampling with noise reduction.', availability: { binary: 'yes', multiclass: 'warning' } },
        ]
    };

    const samplingMethods = IMBALANCE_HANDLING_CONFIG.methods.filter(m => m.availability[modellingType] === 'yes');
    // Note: isDataPreprocessingAuto is now passed as prop from parent for reliability in preview mode

    useEffect(() => {
        if (isRegression) {
            setToggles({ imbalancedData: false });
        }
    }, [isRegression]);

    useEffect(() => {
        if ((mode === 'view' || mode === 'edit') && workflowState?.dataPreprocessing?.step7?.config) {
            const config = workflowState.dataPreprocessing.step7.config;
            setToggles({ imbalancedData: config.imbalance_handling || false });
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
            const requestBody = {
                ensemble_id: datasetState?.ensembleId,
                workflow_id: currentWorkflowId,
                imbalance_handling: toggles.imbalancedData,
                imbalance_handling_method: samplingMethod,
                use_class_weights: false,
                sampling_strategy: "auto"
            };

            if (!requestBody.ensemble_id || !requestBody.workflow_id) {
                throw new Error('Missing required identifiers: ensemble_id or workflow_id');
            }

            const response = await fetch(`${hostnameAI}/data/preprocess_supervised/imbalance_handling`, {
                method: 'POST',
                headers: { 'accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            updatePreprocessingStep('step7', {
                config: {
                    ensemble_id: datasetState?.ensembleId,
                    workflow_id: currentWorkflowId,
                    imbalance_handling: toggles.imbalancedData,
                    imbalance_handling_method: samplingMethod
                },
                apiResponse: data
            });
            setPreviewData(data);
            toast.success('Imbalance handling completed successfully!', { duration: 3000, position: 'top-right' });
            return true;
        } catch (error) {
            toast.error(error.message || 'Imbalance handling failed. Please try again.', { duration: 4000, position: 'top-right' });
            return false;
        } finally {
            setIsProcessing(false);
        }
    };

    useEffect(() => {
        if (onApiCall) onApiCall(handleImbalanceHandling);
    }, [onApiCall, toggles.imbalancedData, samplingMethod, datasetState?.ensembleId, currentWorkflowId]);

    const toggleSwitch = (key) => {
        if (readonly || isRegression) return;
        const newToggleState = !toggles[key];
        setToggles(prev => ({ ...prev, [key]: newToggleState }));
        setExpandedSections(prev => ({ ...prev, [key]: newToggleState }));
    };

    const toggleSection = (section) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    // ── Preview mode ──
    if (showPreview) {
        let displayDataSource;
        let messageText;

        if (isDataPreprocessingAuto && workflowState?.modelGenesis?.apiResponse) {
            displayDataSource = workflowState.modelGenesis.apiResponse;
            messageText = displayDataSource.message || 'Genesis preprocessing complete.';
        } else {
            displayDataSource = previewData;
            messageText = previewData?.message || 'Imbalance handling processed.';
        }

        if (!displayDataSource?.cleaned_df_preview) {
            return (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-yellow-800">No Data Available</h3>
                    <p className="text-xs text-yellow-600 mt-1">No cleaned data preview is available. Please run the imbalance handling process first.</p>
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
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-yellow-800">No Data Available</h3>
                        <p className="text-xs text-yellow-600 mt-1">No cleaned data preview is available.</p>
                    </div>
                );
            }
            return (
                <div className="space-y-4 -mx-6">
                    <CleanDataTable
                        title="Cleaned Data Preview"
                        subtitle={`Showing 1-${Math.min(10, displayData.length)} of ${displayData.length} rows • ${Object.keys(displayData[0]).length} columns`}
                        data={displayData}
                    />
                </div>
            );
        }

        const validVariants = variantKeys.filter(key =>
            key.match(/^p\d+$/) && Array.isArray(cleanedDfPreview[key]) && cleanedDfPreview[key].length > 0
        );

        if (validVariants.length === 0) {
            return (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-yellow-800">No Valid Variants</h3>
                    <p className="text-xs text-yellow-600 mt-1">No valid variant data found in the cleaned preview.</p>
                </div>
            );
        }

        return (
            <div className="space-y-4 -mx-6">
                {validVariants.map(variantKey => (
                    <VariantDataTable key={variantKey} variantKey={variantKey} displayData={cleanedDfPreview[variantKey]} />
                ))}
            </div>
        );
    }

    // ── Main config view ──
    return (
        <div className="space-y-4">
            {isRegression && (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                    Imbalanced data handling cannot be done for regression models.
                </div>
            )}

            <FeatureSection
                title="Imbalanced Data Handling"
                isToggled={toggles.imbalancedData}
                isExpanded={expandedSections.imbalancedData}
                onToggle={() => toggleSwitch('imbalancedData')}
                onExpand={() => toggleSection('imbalancedData')}
                icon={Scale}
               readonly={readonly || isRegression}
                sectionKey="imbalancedData"
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
                                readonly={readonly || isRegression}
                            />
                        ))}
                    </div>
                </div>
            </FeatureSection>
        </div>
    );
}

export default Step7;