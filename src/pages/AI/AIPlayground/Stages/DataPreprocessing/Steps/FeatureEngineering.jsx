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
        availability: {
            binary: 'yes',
            multiclass: 'yes'
        },
        warnings: 'May distort valid extreme values; sensitive to percentile choice'
    },
    {
        value: 'cap_99',
        label: 'Cap 99%',
        description: 'Cap 99% is an outlier treatment method that limits extreme values to the 99th percentile. It preserves most data variability while preventing very rare extreme values from dominating the analysis.',
        availability: {
            binary: 'yes',
            multiclass: 'yes'
        },
        warnings: 'Less aggressive but still alters tail values'
    },
    {
        value: 'log',
        label: 'Log Transform',
        description: 'Log Transform is a mathematical transformation that reduces the effect of large values by applying a logarithmic scale. It compresses extreme values and helps normalize skewed data, making patterns easier for models to learn.',
        availability: {
            binary: 'yes',
            multiclass: 'yes'
        },
        warnings: 'Requires positive values; fails with zero or negative values'
    },
    {
        value: 'bin',
        label: 'Bin',
        description: 'Binning groups continuous values into discrete intervals or bins, reducing the impact of outliers by treating them as part of boundary bins.',
        availability: {
            binary: 'yes',
            multiclass: 'yes'
        },
        warnings: 'May lose granularity in data'
    },
    {
        value: 'remove',
        label: 'Remove',
        description: 'Remove is an outlier handling approach that completely deletes records identified as outliers. This method is used when extreme values are invalid, erroneous, or likely to distort model performance.',
        availability: {
            binary: 'yes',
            multiclass: 'yes'
        },
        warnings: 'Can delete valid minority samples; risky for small datasets'
    }
];

// Configuration for categorical encoding options
const ENCODING_OPTIONS_CONFIG = [
    {
        value: 'onehot',
        label: 'One Hot',
        description: 'One-Hot Encoding converts each category into a separate binary column. Each column indicates the presence or absence of a category, making the data usable for most machine learning models.',
        availability: {
            binary: 'yes',
            multiclass: 'yes'
        },
        warnings: 'High cardinality leads to many columns'
    },
    {
        value: 'label',
        label: 'Label',
        description: 'Label Encoding assigns a unique numeric label to each category. It is simple and works best for ordered or ordinal categorical features.',
        availability: {
            binary: 'yes',
            multiclass: 'yes'
        },
        warnings: 'Imposes artificial ordering; unsafe for linear models'
    },
    {
        value: 'target',
        label: 'Target',
        description: 'Target Encoding replaces each category with the average target value for that category. It captures the relationship between the category and the prediction outcome.',
        availability: {
            binary: 'yes',
            multiclass: 'warning'
        },
        warnings: 'High leakage risk; output interpretation changes in multiclass'
    },
    {
        value: 'woe',
        label: 'WOE',
        description: 'WOE encoding replaces categories with a value based on their predictive power relative to the target. It is widely used in credit risk and banking models for interpretability.',
        availability: {
            binary: 'yes',
            multiclass: 'no'
        },
        warnings: 'Requires binary target; invalid for multiclass'
    },
    {
        value: 'frequency',
        label: 'Frequency',
        description: 'Frequency Encoding replaces categories with their occurrence frequency in the dataset. It preserves information about how common each category is.',
        availability: {
            binary: 'yes',
            multiclass: 'yes'
        },
        warnings: 'Loses category-level distinction'
    },
    {
        value: 'binary',
        label: 'binary',
        description: 'binary Encoding converts categories into binary digits and splits them across multiple columns. It reduces dimensionality compared to one-hot encoding.',
        availability: {
            binary: 'yes',
            multiclass: 'yes'
        },
        warnings: 'Requires prior label encoding'
    },
    {
        value: 'leave_one_out',
        label: 'Leave One Out',
        description: 'Leave-One-Out Encoding replaces a category using the target mean excluding the current row. This helps reduce overfitting compared to standard target encoding.',
        availability: {
            binary: 'yes',
            multiclass: 'warning'
        },
        warnings: 'Noisy for rare categories; leakage risk'
    },
    {
        value: 'james_stein',
        label: 'James Stein',
        description: 'James-Stein Encoding is a shrinkage-based target encoding method. It pulls category means toward the global mean to reduce overfitting.',
        availability: {
            binary: 'yes',
            multiclass: 'warning'
        },
        warnings: 'Unstable for small or sparse categories'
    },
    {
        value: 'm_estimate',
        label: 'M-Estimate',
        description: 'M-Estimate Encoding smooths target encoding by combining category statistics with global averages. It improves stability for categories with few samples.',
        availability: {
            binary: 'yes',
            multiclass: 'warning'
        },
        warnings: 'Sensitive to smoothing parameter'
    },
    {
        value: 'catboost',
        label: 'CatBoost',
        description: 'CatBoost Encoding is a target-based method that uses ordered statistics to avoid data leakage. It is optimized for gradient-boosting models like CatBoost.',
        availability: {
            binary: 'yes',
            multiclass: 'yes'
        },
        warnings: 'Requires proper ordering to avoid leakage'
    },
    {
        value: 'count',
        label: 'Count',
        description: 'Count Encoding replaces each category with the number of times it appears in the data. It is simple and effective for high-cardinality features.',
        availability: {
            binary: 'yes',
            multiclass: 'yes'
        },
        warnings: 'Rare categories may dominate importance'
    },
    {
        value: 'basen',
        label: 'BaseN',
        description: 'Base-N Encoding represents categories as digits in a base-N numeral system. It is a generalized form of binary encoding that balances feature size and information.',
        availability: {
            binary: 'yes',
            multiclass: 'yes'
        },
        warnings: 'Requires prior label encoding'
    },
    {
        value: 'hashing',
        label: 'Hashing',
        description: 'Hashing Encoding converts categories into numeric features using a hash function. It is memory-efficient and suitable for large-scale datasets.',
        availability: {
            binary: 'yes',
            multiclass: 'yes'
        },
        warnings: 'Irreversible; collisions possible'
    },
    {
        value: 'helmert',
        label: 'Helmert',
        description: 'Helmert Encoding compares each category with the mean of subsequent categories. It is commonly used in statistical modeling and hypothesis testing.',
        availability: {
            binary: 'yes',
            multiclass: 'yes'
        },
        warnings: 'Primarily useful for statistical models'
    },
    {
        value: 'sum',
        label: 'Sum',
        description: 'Sum Encoding represents categories using deviation from the overall mean. It is mainly used in regression and statistical analysis.',
        availability: {
            binary: 'yes',
            multiclass: 'yes'
        },
        warnings: 'Interpretation less intuitive'
    },
    {
        value: 'backward_difference',
        label: 'Backward Difference',
        description: 'Backward Difference Encoding compares each category with the previous category in order. It is useful for ordered categorical features.',
        availability: {
            binary: 'yes',
            multiclass: 'yes'
        },
        warnings: 'Assumes meaningful category order'
    },
    {
        value: 'polynomial',
        label: 'Polynomial',
        description: 'Polynomial Encoding creates contrast-based numeric representations for categorical variables. It is mainly used in statistical and regression-based models.',
        availability: {
            binary: 'yes',
            multiclass: 'yes'
        },
        warnings: 'Increases feature dimensionality'
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
    description,
    isToggled,
    isExpanded,
    onToggle,
    onExpand,
    children,
    readonly,
    infoMessage,
    sectionKey
}) => {
    const sectionDescriptions = {
        outlierTreatment: "Outlier Treatment refers to techniques used to identify and handle extreme or abnormal data values that deviate significantly from the rest of the dataset. These methods help reduce noise, prevent model distortion, and improve overall model stability and performance.",
        categoricalEncoding: "Encode categorical variables for machine learning."
    };

    return (
        <div className="bg-gray-50 rounded-lg border border-gray-200">
            <div className="p-4 flex items-center justify-between">
                <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1">
                        <div className='flex flex-row'>
                            <h4 className="text-sm font-medium text-gray-700 mr-2">{title}</h4>
                            <InfoButton sectionDescriptions={sectionDescriptions} section={sectionKey} />
                        </div>
                        {infoMessage && (
                            <div className="mt-2 mr-8 flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-md p-2">
                                <Info size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-blue-700">{infoMessage}</p>
                            </div>
                        )}
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
    );
};

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
    const [hoveredOption, setHoveredOption] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const categoricalColumns = workflowState?.dataPreprocessing?.step2?.apiResponse?.categorical_columns || [];
    const hasCategoricalColumns = categoricalColumns.length > 0;

    const detectOutliersEnabled = workflowState?.dataPreprocessing?.step2?.config?.toggles?.detectOutliers || false;
    const outlierCount = workflowState?.dataPreprocessing?.step2?.apiResponse?.outlier_count || 0;
    const hasOutliers = detectOutliersEnabled && outlierCount > 0;

    const classificationType = workflowState?.modelGenesis?.config?.modelling_type || 'binary';
    const isOutlierTreatmentDisabled = !hasOutliers;

    // Filter options based on classification type
    const getAvailableOptions = (optionsConfig, classificationType) => {
        return optionsConfig.filter(option => {
            const availability = option.availability[classificationType];
            return availability === 'yes';
        });
    };
    useEffect(() => {
        const step3Config = workflowState?.dataPreprocessing?.step3?.config;

        if (step3Config && (mode === 'view' || mode === 'edit')) {
            setToggles({
                outlierTreatment: hasOutliers ? (step3Config.outlier_treatment || false) : false,
                categoricalEncoding: hasCategoricalColumns ? true : (step3Config.categorical_encoding || false),
            });

            if (step3Config.outlier_treatment_strategy) {
                setOutlierStrategy(step3Config.outlier_treatment_strategy);
            }

            if (step3Config.categorical_encoding_method) {
                setEncodingStrategy(step3Config.categorical_encoding_method);
            }
        } else {
            setToggles({
                outlierTreatment: false,
                categoricalEncoding: hasCategoricalColumns,
            });

            if (hasCategoricalColumns) {
                setExpandedSections(prev => ({
                    ...prev,
                    categoricalEncoding: true
                }));
            }
        }
    }, [workflowState?.dataPreprocessing?.step3, mode, hasCategoricalColumns, hasOutliers]);

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
                    outlier_treatment: toggles.outlierTreatment,
                    outlier_treatment_strategy: outlierStrategy,
                    categorical_encoding: toggles.categoricalEncoding,
                    categorical_encoding_method: encodingStrategy
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

    const availableOutlierOptions = getAvailableOptions(OUTLIER_OPTIONS_CONFIG, classificationType);
    const availableEncodingOptions = getAvailableOptions(ENCODING_OPTIONS_CONFIG, classificationType);

    // Create descriptions object for options
    const optionDescriptions = {};

    OUTLIER_OPTIONS_CONFIG.forEach(option => {
        optionDescriptions[option.value] = {
            description: option.description,
            warnings: option.warnings
        };
    });

    ENCODING_OPTIONS_CONFIG.forEach(option => {
        optionDescriptions[option.value] = {
            description: option.description,
            warnings: option.warnings
        };
    });

    const toggleSwitch = (key) => {
        if (readonly) return;

        if (key === 'outlierTreatment' && isOutlierTreatmentDisabled) {
            return;
        }

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

    const getOutlierInfoMessage = () => {
        if (!detectOutliersEnabled || outlierCount === 0) {
            return "No outliers were detected in your dataset";
        }
        // if (outlierCount === 0) {
        //     return "No outliers were detected in your dataset";
        // }
        return null;
    };

    return (
        <div className="space-y-4">
            <FeatureSection
                title="Outlier Treatment"
                description={hasOutliers
                    ? `Handle ${outlierCount} outlier${outlierCount !== 1 ? 's' : ''} detected in your dataset.`
                    : "Handle outliers detected in your dataset."
                }
                isToggled={toggles.outlierTreatment}
                isExpanded={expandedSections.outlierTreatment}
                onToggle={() => toggleSwitch('outlierTreatment')}
                onExpand={() => toggleSection('outlierTreatment')}
                readonly={readonly || isOutlierTreatmentDisabled}
                infoMessage={getOutlierInfoMessage()}
                sectionKey="outlierTreatment"
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

                        <div className="mb-4">
                            <h5 className="text-sm font-medium text-gray-700 mb-3">Treatment Strategy</h5>
                        </div>

                        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                            {availableOutlierOptions.map(option => (
                                <div
                                    key={option.value}
                                    className="relative"
                                    onMouseEnter={() => setHoveredOption(option.value)}
                                    onMouseLeave={() => setHoveredOption(null)}
                                >
                                    <label
                                        className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${outlierStrategy === option.value
                                            ? 'border-[#8e78b7] bg-purple-50'
                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                            } ${readonly ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                                    >
                                        <input
                                            type="radio"
                                            name="outlierStrategy"
                                            value={option.value}
                                            checked={outlierStrategy === option.value}
                                            onChange={(e) => !readonly && setOutlierStrategy(e.target.value)}
                                            disabled={readonly}
                                            className="w-4 h-4 text-[#8e78b7] border-gray-300 focus:ring-[#8e78b7]"
                                        />
                                        <span className={`text-sm font-medium ${outlierStrategy === option.value ? 'text-[#8e78b7]' : 'text-gray-700'
                                            }`}>
                                            {option.label}
                                        </span>
                                    </label>

                                    {hoveredOption === option.value && (
                                        <div className="absolute left-0 top-full mt-2 z-50 w-80 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
                                            <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                                            <p className="leading-relaxed">{optionDescriptions[option.value].description}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                )}
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
                    sectionKey="categoricalEncoding"
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
                            <h5 className="text-sm font-medium text-gray-700 mb-3">
                                Encoding Method
                            </h5>
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
                                        className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${encodingStrategy === option.value
                                            ? 'border-[#8e78b7] bg-purple-50'
                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                            } ${readonly ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                                    >
                                        <input
                                            type="radio"
                                            name="encodingStrategy"
                                            value={option.value}
                                            checked={encodingStrategy === option.value}
                                            onChange={(e) => !readonly && setEncodingStrategy(e.target.value)}
                                            disabled={readonly}
                                            className="w-4 h-4 text-[#8e78b7] border-gray-300 focus:ring-[#8e78b7]"
                                        />
                                        <span className={`text-sm font-medium ${encodingStrategy === option.value ? 'text-[#8e78b7]' : 'text-gray-700'
                                            }`}>
                                            {option.label}
                                        </span>
                                    </label>

                                    {hoveredOption === option.value && (
                                        <div className="absolute left-0 top-full mt-2 z-50 w-80 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
                                            <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                                            <p className="">{optionDescriptions[option.value].description}</p>
                                        </div>
                                    )}
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