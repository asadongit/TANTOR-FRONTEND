import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { useAIPlayground } from '../../../../../../context/AIPlaygroundContext';
import { toast } from 'react-hot-toast';
import InfoButton from '../../../components/InfoButton';

const OUTLIER_OPTIONS_CONFIG = [
    {
        value: 'cap_95',
        label: 'Cap 95%',
        description: 'Cap 95% is an outlier treatment technique that limits extreme values to the 95th percentile of the data. Any value above this threshold is replaced with the 95th percentile value, reducing the impact of extreme observations while keeping all records.',
        availability: { binary: 'yes', multiclass: 'yes', regression: 'yes' }
    },
    {
        value: 'cap_99',
        label: 'Cap 99%',
        description: 'Cap 99% is an outlier treatment method that limits extreme values to the 99th percentile. It preserves most data variability while preventing very rare extreme values from dominating the analysis.',
        availability: { binary: 'yes', multiclass: 'yes', regression: 'yes' }
    },
    {
        value: 'log',
        label: 'Log Transform',
        description: 'Log Transform is a mathematical transformation that reduces the effect of large values by applying a logarithmic scale. It compresses extreme values and helps normalize skewed data, making patterns easier for models to learn.',
        availability: { binary: 'yes', multiclass: 'yes', regression: 'yes' }
    },
    {
        value: 'bin',
        label: 'Bin',
        description: 'Binning groups continuous values into discrete intervals or bins, reducing the impact of outliers by treating them as part of boundary bins.',
        availability: { binary: 'yes', multiclass: 'yes', regression: 'yes' }
    },
    {
        value: 'remove',
        label: 'Remove',
        description: 'Remove is an outlier handling approach that completely deletes records identified as outliers. This method is used when extreme values are invalid, erroneous, or likely to distort model performance.',
        availability: { binary: 'yes', multiclass: 'yes', regression: 'yes' }
    }
];

const ENCODING_OPTIONS_CONFIG = [
    {
        value: 'onehot',
        label: 'One Hot',
        description: 'One-Hot Encoding converts each category into a separate binary column. Each column indicates the presence or absence of a category, making the data usable for most machine learning models.',
        availability: { binary: 'yes', multiclass: 'yes', regression: 'yes' }
    },
    {
        value: 'label',
        label: 'Label',
        description: 'Label Encoding assigns a unique numeric label to each category. It is simple and works best for ordered or ordinal categorical features.',
        availability: { binary: 'yes', multiclass: 'yes', regression: 'yes' }
    },
    {
        value: 'target',
        label: 'Target',
        description: 'Target Encoding replaces each category with the average target value for that category. It captures the relationship between the category and the prediction outcome.',
        availability: { binary: 'yes', multiclass: 'warning', regression: 'warning' },
    },
    {
        value: 'woe',
        label: 'WOE',
        description: 'WOE encoding replaces categories with a value based on their predictive power relative to the target. It is widely used in credit risk and banking models for interpretability.',
        availability: { binary: 'yes', multiclass: 'no' ,regression: 'no'},
    },
    {
        value: 'frequency',
        label: 'Frequency',
        description: 'Frequency Encoding replaces categories with their occurrence frequency in the dataset. It preserves information about how common each category is.',
        availability: { binary: 'yes', multiclass: 'yes', regression: 'yes' }
    },
    {
        value: 'binary',
        label: 'binary',
        description: 'binary Encoding converts categories into binary digits and splits them across multiple columns. It reduces dimensionality compared to one-hot encoding.',
        availability: { binary: 'yes', multiclass: 'yes', regression: 'yes' }
    },
    {
        value: 'leave_one_out',
        label: 'Leave One Out',
        description: 'Leave-One-Out Encoding replaces a category using the target mean excluding the current row. This helps reduce overfitting compared to standard target encoding.',
        availability: { binary: 'yes', multiclass: 'warning' ,regression: 'warning'},
    },
    {
        value: 'james_stein',
        label: 'James Stein',
        description: 'James-Stein Encoding is a shrinkage-based target encoding method. It pulls category means toward the global mean to reduce overfitting.',
        availability: { binary: 'yes', multiclass: 'warning',regression: 'warning' },
    },
    {
        value: 'm_estimate',
        label: 'M-Estimate',
        description: 'M-Estimate Encoding smooths target encoding by combining category statistics with global averages. It improves stability for categories with few samples.',
        availability: { binary: 'yes', multiclass: 'warning' ,regression: 'warning'},
    },
    {
        value: 'catboost',
        label: 'CatBoost',
        description: 'CatBoost Encoding is a target-based method that uses ordered statistics to avoid data leakage. It is optimized for gradient-boosting models like CatBoost.',
        availability: { binary: 'yes', multiclass: 'yes', regression: 'yes' }
    },
    {
        value: 'count',
        label: 'Count',
        description: 'Count Encoding replaces each category with the number of times it appears in the data. It is simple and effective for high-cardinality features.',
        availability: { binary: 'yes', multiclass: 'yes', regression: 'yes' }
    },
    {
        value: 'basen',
        label: 'BaseN',
        description: 'Base-N Encoding represents categories as digits in a base-N numeral system. It is a generalized form of binary encoding that balances feature size and information.',
        availability: { binary: 'yes', multiclass: 'yes', regression: 'yes' }
    },
    {
        value: 'hashing',
        label: 'Hashing',
        description: 'Hashing Encoding converts categories into numeric features using a hash function. It is memory-efficient and suitable for large-scale datasets.',
        availability: { binary: 'yes', multiclass: 'yes', regression: 'yes' }
    },
    {
        value: 'helmert',
        label: 'Helmert',
        description: 'Helmert Encoding compares each category with the mean of subsequent categories. It is commonly used in statistical modeling and hypothesis testing.',
        availability: { binary: 'yes', multiclass: 'yes', regression: 'yes' }
    },
    {
        value: 'sum',
        label: 'Sum',
        description: 'Sum Encoding represents categories using deviation from the overall mean. It is mainly used in regression and statistical analysis.',
        availability: { binary: 'yes', multiclass: 'yes', regression: 'yes' }
    },
    {
        value: 'backward_difference',
        label: 'Backward Difference',
        description: 'Backward Difference Encoding compares each category with the previous category in order. It is useful for ordered categorical features.',
        availability: { binary: 'yes', multiclass: 'yes', regression: 'yes' }
    },
    {
        value: 'polynomial',
        label: 'Polynomial',
        description: 'Polynomial Encoding creates contrast-based numeric representations for categorical variables. It is mainly used in statistical and regression-based models.',
        availability: { binary: 'yes', multiclass: 'yes', regression: 'yes' }
    }
];

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

const FeatureSection = ({
    title,
    isToggled,
    isExpanded,
    onToggle,
    onExpand,
    children,
    readonly,
    infoMessage,
    sectionKey,
    hasError
}) => {
    const sectionDescriptions = {
        outlierTreatment: "Outlier Treatment refers to techniques used to identify and handle extreme or abnormal data values that deviate significantly from the rest of the dataset. These methods help reduce noise, prevent model distortion, and improve overall model stability and performance.",
        categoricalEncoding: "Encode categorical variables for machine learning."
    };

    return (
        <div className={`rounded-lg transition-all ${hasError ? 'bg-red-50 border border-red-400' : 'bg-gray-50'}`}>
            <div className="p-4 flex items-center justify-between">
                <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1">
                        <div className='flex flex-row'>
                            <h4 className={`text-sm font-medium mr-2 ${hasError ? 'text-red-700' : 'text-gray-700'}`}>
                                {title}
                            </h4>
                            <InfoButton sectionDescriptions={sectionDescriptions} section={sectionKey} />
                        </div>
                        {infoMessage && (
                            <div className="mt-2 mr-8 flex items-start gap-2 bg-[#FAF8FF] border border-[#8e78b7] text-[#8e78b7] rounded-md p-2">
                                <Info size={14} className="text-[#8e78b7] mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-[#8e78b7]">{infoMessage}</p>
                            </div>
                        )}
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

function FeatureEngineering({ readonly: readonlyProp, onApiCall }) {
    const hostnameAI = window._env_?.VITE_AI_API;
    const { workflowsState, activeWorkflowId, datasetState, updatePreprocessingStep, mode } = useAIPlayground();
    const readonly = readonlyProp || mode === 'view';
    const workflowState = activeWorkflowId
    ? workflowsState[activeWorkflowId]
    : null;  
    const currentWorkflowId = workflowState?.workflow_id || activeWorkflowId;

    const [toggles, setToggles] = useState({
        outlierTreatment: false,
        categoricalEncoding: false,
    });

    const [expandedSections, setExpandedSections] = useState({
        outlierTreatment: false,
        categoricalEncoding: false,
    });

    const [outlierStrategy, setOutlierStrategy] = useState('cap_95');
    const [encodingStrategy, setEncodingStrategy] = useState('onehot');
    const [hoveredOption, setHoveredOption] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showFieldErrors, setShowFieldErrors] = useState(false);

    const categoricalColumns = workflowState?.dataPreprocessing?.step2?.apiResponse?.categorical_columns || [];
    const hasCategoricalColumns = categoricalColumns.length > 0;

    const detectOutliersEnabled = workflowState?.dataPreprocessing?.step2?.config?.outlier_detection_active || false;
    const outlierCount = workflowState?.dataPreprocessing?.step2?.apiResponse?.outlier_count || 0;
    const hasOutliers = detectOutliersEnabled && outlierCount > 0;

    const modellingType = workflowState?.modelGenesis?.config?.modelling_type || 'binary';
    const isOutlierTreatmentDisabled = !hasOutliers;

    const getAvailableOptions = (optionsConfig, modellingType) => {
    return optionsConfig.filter(option => option.availability[modellingType] === 'yes');
};

    useEffect(() => {
        const step3Config = workflowState?.dataPreprocessing?.step3?.config;
        if (step3Config && (mode === 'view' || mode === 'edit')) {
            setToggles({
                outlierTreatment: hasOutliers ? (step3Config.outlier_treatment || false) : false,
                categoricalEncoding: hasCategoricalColumns ? true : (step3Config.categorical_encoding || false),
            });
            if (step3Config.outlier_treatment_strategy) setOutlierStrategy(step3Config.outlier_treatment_strategy);
            if (step3Config.categorical_encoding_method) setEncodingStrategy(step3Config.categorical_encoding_method);
        } else {
            setToggles({
                outlierTreatment: false,
                categoricalEncoding: hasCategoricalColumns,
            });
            if (hasCategoricalColumns) {
                setExpandedSections(prev => ({ ...prev, categoricalEncoding: true }));
            }
        }
    }, [workflowState?.dataPreprocessing?.step3, mode, hasCategoricalColumns, hasOutliers]);

    // Auto-clear errors when user fixes them
    useEffect(() => {
        if (!showFieldErrors) return;
        const outlierError = toggles.outlierTreatment && !outlierStrategy;
        const encodingError = toggles.categoricalEncoding && !encodingStrategy;
        if (!outlierError && !encodingError) setShowFieldErrors(false);
    }, [outlierStrategy, encodingStrategy, toggles, showFieldErrors]);

    // Derived error flags — only active after Next is clicked
    const outlierStrategyError = showFieldErrors && toggles.outlierTreatment && !outlierStrategy;
    const encodingStrategyError = showFieldErrors && toggles.categoricalEncoding && !encodingStrategy;

    const handleApiCall = async () => {
        if (readonly) return true;

        if (toggles.outlierTreatment && !outlierStrategy) {
            setShowFieldErrors(true);
            return false;
        }
        if (toggles.categoricalEncoding && !encodingStrategy) {
            setShowFieldErrors(true);
            return false;
        }

        try {
            setIsLoading(true);
            const requestBody = {
                ensemble_id: datasetState?.ensembleId,
                workflow_id: currentWorkflowId,
                outlier_treatment: toggles.outlierTreatment,
                outlier_treatment_strategy: toggles.outlierTreatment ? outlierStrategy : "",
                outlier_threshold: 3,
                categorical_encoding: toggles.categoricalEncoding,
                categorical_encoding_method: toggles.categoricalEncoding ? encodingStrategy : "",
                categorical_encoding_base: 2
            };

            if (!requestBody.ensemble_id || !requestBody.workflow_id) {
                throw new Error('Missing required identifiers: ensemble_id or workflow_id');
            }

            const response = await fetch(`${hostnameAI}/data/preprocess_supervised/feature_engineering`, {
                method: 'POST',
                headers: { 'accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) throw new Error(`API call failed with status: ${response.status}`);

            const data = await response.json();
            updatePreprocessingStep('step3', {
                config: {
                    outlier_treatment: toggles.outlierTreatment,
                    outlier_treatment_strategy: outlierStrategy,
                    categorical_encoding: toggles.categoricalEncoding,
                    categorical_encoding_method: encodingStrategy
                },
                apiResponse: data
            });

            setIsLoading(false);
            toast.success('Feature Engineering completed successfully!', { duration: 3000, position: 'top-right' });
            return true;
        } catch (error) {
            toast.error(error.message || 'Feature Engineering failed. Please try again.', { duration: 4000, position: 'top-right' });
            setIsLoading(false);
            return false;
        }
    };

    useEffect(() => {
        if (onApiCall) onApiCall(handleApiCall);
    }, [toggles, outlierStrategy, encodingStrategy, datasetState?.ensembleId, currentWorkflowId]);

    const availableOutlierOptions = getAvailableOptions(OUTLIER_OPTIONS_CONFIG, modellingType);
    const availableEncodingOptions = getAvailableOptions(ENCODING_OPTIONS_CONFIG, modellingType);

    const optionDescriptions = {};
    [...OUTLIER_OPTIONS_CONFIG, ...ENCODING_OPTIONS_CONFIG].forEach(option => {
        optionDescriptions[option.value] = option.description;
    });

    const toggleSwitch = (key) => {
        if (readonly) return;
        if (key === 'outlierTreatment' && isOutlierTreatmentDisabled) return;
        if (key === 'categoricalEncoding' && hasCategoricalColumns) return;

        const newToggleState = !toggles[key];
        setToggles(prev => ({ ...prev, [key]: newToggleState }));

        if (newToggleState) {
            setExpandedSections({ outlierTreatment: false, categoricalEncoding: false, [key]: true });
        } else {
            setExpandedSections(prev => ({ ...prev, [key]: false }));
            setShowFieldErrors(false);
        }
    };

    const toggleSection = (section) => {
        setExpandedSections({
            outlierTreatment: false,
            categoricalEncoding: false,
            [section]: !expandedSections[section]
        });
    };

    const getOutlierInfoMessage = () => {
        if (!detectOutliersEnabled || outlierCount === 0) return "No outliers were detected in your dataset";
        return null;
    };

    return (
        <div className="space-y-4">
            {/* ── Outlier Treatment ── */}
            <FeatureSection
                title="Outlier Treatment"
                isToggled={toggles.outlierTreatment}
                isExpanded={expandedSections.outlierTreatment}
                onToggle={() => toggleSwitch('outlierTreatment')}
                onExpand={() => toggleSection('outlierTreatment')}
                readonly={readonly || isOutlierTreatmentDisabled}
                infoMessage={getOutlierInfoMessage()}
                sectionKey="outlierTreatment"
                hasError={outlierStrategyError}
            >
                {hasOutliers && (
                    <>
                        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
                            <div className="flex items-center gap-2">
                                <Info size={16} className="text-orange-500 flex-shrink-0" />
                                <p className="text-sm text-orange-700">
                                    <span className="font-medium">{outlierCount}</span> outlier{outlierCount !== 1 ? 's' : ''} detected
                                </p>
                            </div>
                        </div>

                        <h5 className="text-sm font-medium text-gray-700 mb-3">Treatment Strategy</h5>

                        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                            {availableOutlierOptions.map(option => (
                                <div
                                    key={option.value}
                                    className="relative"
                                    onMouseEnter={() => setHoveredOption(option.value)}
                                    onMouseLeave={() => setHoveredOption(null)}
                                >
                                    <label
                                        className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                                            outlierStrategy === option.value
                                                ? 'bg-[#FAF8FF] border border-[#8e78b7]'
                                                : 'bg-white'
                                        } ${readonly ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                                    >
                                        <input
                                            type="radio"
                                            name="outlierStrategy"
                                            value={option.value}
                                            checked={outlierStrategy === option.value}
                                            onChange={(e) => !readonly && setOutlierStrategy(e.target.value)}
                                            disabled={readonly}
                                            className="w-4 h-4 accent-[#8e78b7]"
                                        />
                                        <span className={`text-sm font-medium ${outlierStrategy === option.value ? 'text-[#8e78b7]' : 'text-gray-700'}`}>
                                            {option.label}
                                        </span>
                                    </label>

                                    {hoveredOption === option.value && (
                                        <div className="absolute left-0 top-full mt-2 z-50 w-80 p-3 bg-[#332849] text-white text-xs rounded-lg shadow-lg">
                                            <div className="absolute -top-1 left-4 w-2 h-2 bg-[#332849] transform rotate-45"></div>
                                            <p className="leading-relaxed">{optionDescriptions[option.value]}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Inline error — only shown after Next is clicked */}
                        {outlierStrategyError && (
                            <p className="text-xs text-red-500 mt-2 pl-0.5">Please select a treatment strategy</p>
                        )}
                    </>
                )}
            </FeatureSection>

            {/* ── Categorical Encoding ── */}
            {hasCategoricalColumns && (
                <FeatureSection
                    title="Categorical Encoding"
                    isToggled={toggles.categoricalEncoding}
                    isExpanded={expandedSections.categoricalEncoding}
                    onToggle={() => toggleSwitch('categoricalEncoding')}
                    onExpand={() => toggleSection('categoricalEncoding')}
                    readonly={readonly || hasCategoricalColumns}
                    infoMessage={hasCategoricalColumns ? "Categorical encoding is required because your dataset contains categorical columns" : null}
                    sectionKey="categoricalEncoding"
                    hasError={encodingStrategyError}
                >
                    <div className="space-y-4">
                        <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-3 font-satoshi">Categorical Columns</h5>
                            <div className={`flex flex-wrap gap-2 ${categoricalColumns.length > 10 ? 'max-h-32 overflow-y-auto pr-2 font-satoshi' : ''}`}>
                                {categoricalColumns.map((column) => (
                                    <span
                                        key={column}
                                        className="px-3 py-1.5 border border-[#CCCCCC] rounded-lg text-xs text-[#818181] font-medium font-satoshi"
                                    >
                                        {column}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="pt-2">
                            <h5 className="text-sm font-medium text-gray-700 mb-3">Encoding Method</h5>
                        </div>

                        <div className="grid grid-cols-2 gap-x-8 gap-y-3 overflow-y-auto pr-2 pb-20">
                            {availableEncodingOptions.map(option => (
                                <div
                                    key={option.value}
                                    className="relative"
                                    onMouseEnter={() => setHoveredOption(option.value)}
                                    onMouseLeave={() => setHoveredOption(null)}
                                >
                                    <label
                                        className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                                            encodingStrategy === option.value
                                                ? 'bg-[#FAF8FF] border border-[#8e78b7]'
                                                : 'bg-white'
                                        } ${readonly ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                                    >
                                        <input
                                            type="radio"
                                            name="encodingStrategy"
                                            value={option.value}
                                            checked={encodingStrategy === option.value}
                                            onChange={(e) => !readonly && setEncodingStrategy(e.target.value)}
                                            disabled={readonly}
                                            className="w-4 h-4 accent-[#8e78b7]"
                                        />
                                        <span className={`text-sm font-medium ${encodingStrategy === option.value ? 'text-[#8e78b7]' : 'text-gray-700'}`}>
                                            {option.label}
                                        </span>
                                    </label>

                                    {hoveredOption === option.value && (
                                        <div className="absolute left-0 top-full mt-2 z-50 w-80 p-3 bg-[#332849] text-white text-xs rounded-lg shadow-lg">
                                            <div className="absolute -top-1 left-4 w-2 h-2 bg-[#332849] transform rotate-45"></div>
                                            <p className="">{optionDescriptions[option.value]}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {encodingStrategyError && (
                            <p className="text-xs text-red-500 mt-2 pl-0.5">Please select an encoding method</p>
                        )}
                    </div>
                </FeatureSection>
            )}
        </div>
    );
}

export default FeatureEngineering;