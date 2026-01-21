import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { useAIPlayground } from '../../../../../../context/AIPlaygroundContext';
import { toast } from 'react-hot-toast';

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

const RadioOption = ({ name, value, checked, onChange, label, readonly }) => (
    <label className={`flex items-center gap-2 group ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
        <input
            type="radio"
            name={name}
            value={value}
            checked={checked}
            onChange={onChange}
            disabled={readonly}
            className="w-4 h-4 text-[#8e78b7] border-gray-300 focus:ring-[#8e78b7]"
        />
        <span className="text-sm text-gray-700 group-hover:text-gray-900">{label}</span>
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
    readonly,
    infoMessage
}) => (
    <div className="bg-gray-50 rounded-lg border border-gray-200">
        <div className="p-4 flex items-center justify-between">
            <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-700">{title}</h4>
                <p className="text-xs text-gray-400 mt-0.5">{description}</p>
                {infoMessage && (
                    <div className="mt-2 flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-md p-2">
                        <Info size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-blue-700">{infoMessage}</p>
                    </div>
                )}
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
);

function FeatureEngineering({ onApiCall }) {
    const hostnameAI = window._env_?.VITE_AI_API;
    const { workflowState, datasetState, updatePreprocessingStep, mode } = useAIPlayground();
    const readonly = mode === 'view';

    const [toggles, setToggles] = useState({
        outlierTreatment: false,
        categoricalEncoding: false,
    });

    const [expandedSections, setExpandedSections] = useState({
        outlierTreatment: false,
        categoricalEncoding: false,
    });

    const [outlierStrategy, setOutlierStrategy] = useState('remove');
    const [encodingStrategy, setEncodingStrategy] = useState('onehot');
    const [isLoading, setIsLoading] = useState(false);

    const categoricalColumns = workflowState?.dataPreprocessing?.step2?.apiResponse?.categorical_columns || [];
    const hasCategoricalColumns = categoricalColumns.length > 0;

    useEffect(() => {
        const step3Config = workflowState?.dataPreprocessing?.step3?.config;

        if (step3Config && (mode === 'view' || mode === 'edit')) {
            setToggles({
                outlierTreatment: step3Config.outlier_treatment || false,
                categoricalEncoding: hasCategoricalColumns ? true : (step3Config.categorical_encoding || false),
            });

            if (step3Config.outlier_treatment_strategy) {
                setOutlierStrategy(step3Config.outlier_treatment_strategy);
            }

            if (step3Config.categorical_encoding_method) {
                setEncodingStrategy(step3Config.categorical_encoding_method);
            }
        } else if (hasCategoricalColumns) {
            setToggles(prev => ({ ...prev, categoricalEncoding: true }));
        }
    }, [workflowState?.dataPreprocessing?.step3, mode, hasCategoricalColumns]);

    const handleApiCall = async () => {
        if (readonly) return true;
        try {
            setIsLoading(true);

            const requestBody = {
                session_id: datasetState.sessionId,
                outlier_treatment: toggles.outlierTreatment,
                outlier_treatment_strategy: toggles.outlierTreatment ? outlierStrategy : "",
                outlier_threshold: 3,
                categorical_encoding: toggles.categoricalEncoding,
                categorical_encoding_method: toggles.categoricalEncoding ? encodingStrategy : "",
                categorical_encoding_base: 2
            };

            if (toggles.outlierTreatment && !outlierStrategy) {
                toast.error('Please select an outlier treatment strategy', {
                    duration: 4000,
                    position: 'top-right',
                });
                setIsLoading(false);
                return false;
            }

            if (toggles.categoricalEncoding && !encodingStrategy) {
                toast.error('Please select a categorical encoding method', {
                    duration: 4000,
                    position: 'top-right',
                });
                setIsLoading(false);
                return false;
            }

            const response = await fetch(`${hostnameAI}/data/preprocess/feature_engineering`, {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`API call failed with status: ${response.status}`);
            }

            const data = await response.json();

            updatePreprocessingStep('step3', {
                config: {
                    toggles,
                    outlierStrategy,
                    encodingStrategy
                },
                apiResponse: data
            });

            setIsLoading(false);
             toast.success('Feature Engineering completed successfully!', {
                duration: 3000,
                position: 'top-right',
            });
            return true;
        } catch (error) {
             toast.error(error.message || 'Feature Engineering failed. Please try again.', {
                duration: 4000,
                position: 'top-right',
            });
            setIsLoading(false);
            return false;
        }
    };

    useEffect(() => {
        if (onApiCall) {
            onApiCall(handleApiCall);
        }
    }, [toggles, outlierStrategy, encodingStrategy, datasetState.sessionId]);

    const options = [
        { value: 'cap_95', label: 'Cap 95%' },
        { value: 'cap_99', label: 'Cap 99%' },
        { value: 'log', label: 'Log Transform' },
        { value: 'bin', label: 'Bin' },
        { value: 'remove', label: 'Remove' },
    ];

    const Encodingoptions = [
        { value: 'onehot', label: 'One Hot' },
        { value: 'label', label: 'Label' },
        { value: 'target', label: 'Target' },
        { value: 'woe', label: 'WOE' },
        { value: 'frequency', label: 'Frequency' },
        { value: 'binary', label: 'Binary' },
        { value: 'leave_one_out', label: 'Leave One Out' },
        { value: 'james_stein', label: 'James Stein' },
        { value: 'm_estimate', label: 'M-Estimate' },
        { value: 'catboost', label: 'CatBoost' },
        { value: 'count', label: 'Count' },
        { value: 'basen', label: 'BaseN' },
        { value: 'hash', label: 'Hash' },
        { value: 'hashing', label: 'Hashing' },
        { value: 'helmert', label: 'Helmert' },
        { value: 'sum', label: 'Sum' },
        { value: 'backward_difference', label: 'Backward Difference' },
        { value: 'polynomial', label: 'Polynomial' },
    ];

    const toggleSwitch = (key) => {
        if (readonly) return;

        if (key === 'categoricalEncoding' && hasCategoricalColumns) {
            return;
        }

        const newToggleState = !toggles[key];

        setToggles(prev => ({ ...prev, [key]: newToggleState }));

        if (newToggleState) {
            setExpandedSections({
                outlierTreatment: false,
                categoricalEncoding: false,
                [key]: true
            });
        } else {
            setExpandedSections(prev => ({ ...prev, [key]: false }));
        }
    };

    const toggleSection = (section) => {
        setExpandedSections({
            outlierTreatment: false,
            categoricalEncoding: false,
            [section]: !expandedSections[section]
        });
    };

    return (
        <div className="space-y-4">

            <FeatureSection
                title="Outlier Treatment"
                description="Handle outliers detected in your dataset."
                isToggled={toggles.outlierTreatment}
                isExpanded={expandedSections.outlierTreatment}
                onToggle={() => toggleSwitch('outlierTreatment')}
                onExpand={() => toggleSection('outlierTreatment')}
                readonly={readonly}
            >
                <div className="mb-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Treatment Strategy</h5>
                </div>

                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                    {options.map(option => (
                        <div key={option.value} className="bg-white px-3 py-2 rounded border border-gray-200">
                            <RadioOption
                                name="outlierStrategy"
                                value={option.value}
                                checked={outlierStrategy === option.value}
                                onChange={(e) => !readonly && setOutlierStrategy(e.target.value)}
                                label={option.label}
                                readonly={readonly}
                            />
                        </div>
                    ))}
                </div>
            </FeatureSection>

            {hasCategoricalColumns && (
                <FeatureSection
                    title="Categorical Encoding"
                    description="Encode categorical variables for machine learning."
                    isToggled={toggles.categoricalEncoding}
                    isExpanded={expandedSections.categoricalEncoding}
                    onToggle={() => toggleSwitch('categoricalEncoding')}
                    onExpand={() => toggleSection('categoricalEncoding')}
                    readonly={readonly || hasCategoricalColumns}
                    infoMessage={hasCategoricalColumns ? "Categorical encoding is required because your dataset contains categorical columns" : null}
                >
                    <div className="space-y-4">
                        <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-3">Categorical Columns</h5>
                            <div className={`flex flex-wrap gap-2 ${categoricalColumns.length > 10 ? 'max-h-32 overflow-y-auto pr-2' : ''}`}>
                                {categoricalColumns.map((column) => (
                                    <span
                                        key={column}
                                        className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-gray-500 hover:border-[#8e78b7] hover:bg-purple-50 transition-colors"
                                    >
                                        {column}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="pt-2">
                            <h5 className="text-sm font-medium text-gray-700 mb-3">Encoding Method</h5>
                        </div>

                        <div className="grid grid-cols-2 gap-x-8 gap-y-3 max-h-64 overflow-y-auto pr-2">
                            {Encodingoptions.map(option => (
                                <div key={option.value} className="bg-white px-3 py-2 rounded border border-gray-200">
                                    <RadioOption
                                        name="encodingStrategy"
                                        value={option.value}
                                        checked={encodingStrategy === option.value}
                                        onChange={(e) => !readonly && setEncodingStrategy(e.target.value)}
                                        label={option.label}
                                        readonly={readonly}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </FeatureSection>
            )}
        </div>
    );
}

export default FeatureEngineering;