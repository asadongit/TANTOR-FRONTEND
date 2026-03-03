import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

import { useAIPlayground } from '../../../../../../context/AIPlaygroundContext';
import toast from 'react-hot-toast';
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

const FeatureSection = ({
    title,
    isToggled,
    isExpanded,
    onToggle,
    onExpand,
    hasExpandableContent = true,
    children,
    readonly,
    sectionKey,
    isLastSection = false,
}) => {
    const sectionDescriptions = {
        advancedTransformation: "Advanced Transformation refers to mathematical techniques applied to numerical features to reshape their distributions, reduce skewness, and stabilize variance. These transformations help improve model performance by making data more suitable for algorithms that assume normality or consistent feature behavior.",
        nearZeroVariance: "Near Zero Variance refers to features that have very little variation, meaning most values are the same across records. Such features provide little to no useful information for prediction and are usually removed to improve model performance and efficiency.",
        featureScaler: "Feature Scaling is the process of standardizing the range of numerical features so they are on a similar scale."
    };

    return (
        <div className="rounded-lg transition-all bg-gray-50">
            <div className="p-4 flex items-center justify-between">
                <div className="flex-1">
                    <div className='flex flex-row'>
                        <h4 className="text-sm font-medium mr-2 text-gray-700">{title}</h4>
                        <InfoButton sectionDescriptions={sectionDescriptions} section={sectionKey} isLastSection={isLastSection} />
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <ToggleSwitch checked={isToggled} onChange={onToggle} readonly={readonly} />
                    {isToggled && hasExpandableContent && (
                        <button onClick={onExpand} className="text-gray-400 hover:text-gray-600">
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                    )}
                </div>
            </div>

            {isToggled && isExpanded && children && (
                <div className="px-4 pb-4">
                    <div className="mt-4">{children}</div>
                </div>
            )}
        </div>
    );
};


function ScalingTransformation({ onApiCall, onValidationChange }) {
    const hostnameAI = window._env_?.VITE_AI_API;
    const { workflowState, datasetState, updatePreprocessingStep, mode } = useAIPlayground();
    const readonly = mode === 'view';

    const advancedTransformationRef = useRef(null);

    const [toggles, setToggles] = useState({
        advancedTransformation: false,
        nearZeroVariance: false,
        featureScaler: false,
    });

    const [expandedSections, setExpandedSections] = useState({
        advancedTransformation: false,
        nearZeroVariance: false,
        featureScaler: false,
    });

    const [transformationMethod, setTransformationMethod] = useState('yeo-johnson');
    const [scalerMethod, setScalerMethod] = useState('standard');
    const [selectedColumns, setSelectedColumns] = useState([]);
    const [columnSearchQuery, setColumnSearchQuery] = useState('');

    // Only show errors after Next is clicked
    const [showFieldErrors, setShowFieldErrors] = useState(false);

    const transformationOptions = [
        { value: 'box-cox', label: 'Box-Cox', description: 'Box-Cox is a power transformation technique that stabilizes variance and makes data more normally distributed. It is applied only to positive-valued data and helps improve model performance.' },
        { value: 'yeo-johnson', label: 'Yeo-Johnson', description: 'Yeo–Johnson is a power transformation similar to Box-Cox but supports zero and negative values. It reduces skewness and improves data symmetry.' },
        { value: 'log', label: 'Log', description: 'Log Transformation reduces the impact of large values by applying a logarithmic scale. It is commonly used to handle right-skewed data and compress extreme values.' },
        { value: 'sqrt', label: 'Square Root', description: 'Square Root Transformation reduces skewness by taking the square root of values. It is useful for moderately skewed data and count-based features.' },
        { value: 'quantile_uniform', label: 'Quantile Uniform', description: 'Quantile Uniform Transformation maps data values to a uniform distribution using quantiles. It reduces the effect of outliers and standardizes feature distribution.' },
        { value: 'quantile_normal', label: 'Quantile Normal', description: 'Quantile Normal Transformation maps data values to a normal (Gaussian) distribution. It helps models that assume normally distributed input features.' },
        { value: 'power', label: 'Power', description: 'Power Transformation applies a mathematical exponent to reshape data distribution. It reduces skewness and stabilizes variance for improved model learning.' },
    ];

    const scalerOptions = [
        { value: 'standard', label: 'Standard', description: 'Standard Scaler transforms features to have zero mean and unit variance. It is commonly used when data follows a normal distribution.' },
        { value: 'minmax', label: 'MinMax', description: 'Min-Max Scaler rescales values to a fixed range, usually between 0 and 1. It is sensitive to outliers but easy to interpret.' },
        { value: 'robust', label: 'Robust', description: 'Robust Scaler uses the median and interquartile range (IQR) instead of mean and standard deviation. It is effective when data contains outliers or extreme values.' },
        { value: 'maxabs', label: 'MaxAbs', description: 'MaxAbs Scaler scales values by dividing them by the maximum absolute value. It preserves sparsity and works well for data already centered around zero.' },
        { value: 'quantile', label: 'Quantile', description: 'Quantile Scaler transforms features to follow a uniform or normal distribution based on quantiles. It reduces the effect of outliers and makes feature distributions consistent.' },
        { value: 'power', label: 'Power', description: 'Power Scaler applies a power transformation to stabilize variance and reduce skewness. It helps make features more suitable for machine learning models.' },
        { value: 'normalizer', label: 'Normalizer', description: 'Normalization rescales each data record so its overall magnitude equals one. It is mainly used for distance-based algorithms such as KNN and clustering.' },
    ];

    const skewedColumns = React.useMemo(() => {
        const skewnessReport = workflowState?.dataPreprocessing?.step3?.apiResponse?.skewness_report;
        if (!skewnessReport) return [];
        return Object.entries(skewnessReport)
            .map(([name, skewness]) => ({ name, skewness: Math.abs(skewness) }))
            .sort((a, b) => b.skewness - a.skewness);
    }, [workflowState]);

    const filteredColumns = React.useMemo(() => {
        if (!columnSearchQuery.trim()) return skewedColumns;
        return skewedColumns.filter(column =>
            column.name.toLowerCase().includes(columnSearchQuery.toLowerCase())
        );
    }, [skewedColumns, columnSearchQuery]);

    useEffect(() => {
        if ((mode === 'view' || mode === 'edit') && workflowState?.dataPreprocessing?.step4?.config) {
            const config = workflowState.dataPreprocessing.step4.config;
            setToggles({
                advancedTransformation: config.advanced_transformation || false,
                nearZeroVariance: config.near_zero_variance_filter || false,
                featureScaler: config.feature_scaler || false,
            });
            setTransformationMethod(config.transformation_method || 'yeo-johnson');
            setScalerMethod(config.feature_scaler_method || 'standard');
            setSelectedColumns(config.columns_to_transform || []);
        }
    }, [mode, workflowState]);

    // Derived error flag — only active after Next is clicked
    const columnsError = showFieldErrors && toggles.advancedTransformation && selectedColumns.length === 0;

    // Always report valid to parent — Next is never disabled
    useEffect(() => {
        if (onValidationChange) onValidationChange(true);
    }, []);

    // Auto-clear errors when fixed
    useEffect(() => {
        if (!showFieldErrors) return;
        if (!(toggles.advancedTransformation && selectedColumns.length === 0)) {
            setShowFieldErrors(false);
        }
    }, [selectedColumns, toggles, showFieldErrors]);

    const handleApiCall = async () => {
        if (readonly) return true;

        if (toggles.advancedTransformation && selectedColumns.length === 0) {
            setShowFieldErrors(true);
            setExpandedSections(prev => ({ ...prev, advancedTransformation: true }));
            setTimeout(() => {
                if (advancedTransformationRef.current) {
                    advancedTransformationRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 50);
            return false;
        }

        try {
            const requestBody = {
                session_id: datasetState?.sessionId,
                advanced_transformation: toggles.advancedTransformation,
                columns_to_transform: toggles.advancedTransformation ? selectedColumns : [],
                transformation_method: transformationMethod,
                near_zero_variance_filter: toggles.nearZeroVariance,
                feature_scaler: toggles.featureScaler,
                feature_scaler_method: scalerMethod
            };

            const response = await fetch(`${hostnameAI}/data/preprocess/advanced_transformation`, {
                method: 'POST',
                headers: { 'accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'API request failed');
            }

            const data = await response.json();

            updatePreprocessingStep('step4', {
                config: {
                    session_id: datasetState?.sessionId,
                    advanced_transformation: toggles.advancedTransformation,
                    columns_to_transform: toggles.advancedTransformation ? selectedColumns : [],
                    transformation_method: transformationMethod,
                    near_zero_variance_filter: toggles.nearZeroVariance,
                    feature_scaler: toggles.featureScaler,
                    feature_scaler_method: scalerMethod
                },
                apiResponse: data
            });

            toast.success('Scaling & Transformation completed successfully!', { duration: 3000, position: 'top-right' });
            return true;
        } catch (error) {
            toast.error(error.message || 'Scaling & Transformation failed. Please try again.', { duration: 4000, position: 'top-right' });
            return false;
        }
    };

    useEffect(() => {
        if (onApiCall) onApiCall(handleApiCall);
    }, [toggles, transformationMethod, scalerMethod, selectedColumns, onApiCall]);

    const toggleSwitch = (key) => {
        if (readonly) return;
        const newToggleState = !toggles[key];
        setToggles(prev => ({ ...prev, [key]: newToggleState }));

        if (newToggleState) {
            if (key !== 'nearZeroVariance') {
                setExpandedSections({
                    advancedTransformation: false,
                    nearZeroVariance: false,
                    featureScaler: false,
                    [key]: true
                });
            }
        } else {
            setExpandedSections(prev => ({ ...prev, [key]: false }));
            if (key === 'advancedTransformation') setShowFieldErrors(false);
        }
    };

    const toggleSection = (section) => {
        setExpandedSections({
            advancedTransformation: false,
            nearZeroVariance: false,
            featureScaler: false,
            [section]: !expandedSections[section]
        });
    };

    const toggleColumnSelection = (columnName) => {
        if (readonly) return;
        setSelectedColumns(prev =>
            prev.includes(columnName) ? prev.filter(col => col !== columnName) : [...prev, columnName]
        );
    };

    const radioCardClass = (isSelected) =>
        `px-4 py-3 rounded-lg transition-colors group relative ${
            isSelected
                ? 'bg-purple-100 border border-[#8e78b7]'
                : 'bg-white'
        } ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`;

    return (
        <div className="max-w-full">
            <div className="space-y-4">
                <div ref={advancedTransformationRef}>
                    <FeatureSection
                        title="Advanced Transformation"
                        isToggled={toggles.advancedTransformation}
                        isExpanded={expandedSections.advancedTransformation}
                        onToggle={() => toggleSwitch('advancedTransformation')}
                        onExpand={() => toggleSection('advancedTransformation')}
                        hasExpandableContent={true}
                        readonly={readonly}
                        sectionKey="advancedTransformation"
                    >
                        <div className="space-y-4">
                            <div>
                                <h5 className="text-sm font-medium text-gray-700 mb-3">Select Columns</h5>

                                <div className="mb-3">
                                    <input
                                        type="text"
                                        placeholder="Search columns..."
                                        value={columnSearchQuery}
                                        onChange={(e) => setColumnSearchQuery(e.target.value)}
                                        disabled={readonly}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent"
                                    />
                                </div>

                                <div className={`rounded-lg ${columnsError ? 'border border-[#EF4D5F]' : ''}`}>
                                    <div className={`space-y-1 ${skewedColumns.length > 10 ? 'max-h-80 overflow-y-auto pr-2' : ''}`}>
                                        {filteredColumns.map((column) => (
                                            <label
                                                key={column.name}
                                                className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                                                    selectedColumns.includes(column.name)
                                                        ? 'bg-purple-100'
                                                        : columnsError ? '' : 'bg-white hover:bg-gray-100'
                                                } ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedColumns.includes(column.name)}
                                                        onChange={() => toggleColumnSelection(column.name)}
                                                        disabled={readonly}
                                                        className={`w-4 h-4 accent-[#8e78b7] rounded focus:ring-[#8e78b7] ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                                    />
                                                    <span className={`text-sm font-medium ${selectedColumns.includes(column.name) ? 'text-[#8e78b7]' : 'text-gray-700'}`}>
                                                        {column.name}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 pointer-events-none">
                                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                                    </svg>
                                                    <span className="text-xs text-gray-500">Skewness: {column.skewness.toFixed(4)}</span>
                                                </div>
                                            </label>
                                        ))}
                                        {filteredColumns.length === 0 && (
                                            <p className="text-sm text-gray-500 text-center py-4">No columns found</p>
                                        )}
                                    </div>
                                </div>
                                {columnsError && (
                                    <p className="text-xs text-[#EF4D5F] mt-1 pl-0.5">Please select at least one column for transformation</p>
                                )}
                            </div>

                            <div className="pt-2">
                                <h5 className="text-sm font-medium text-gray-700 mb-3">Transformation Method</h5>
                                <div className="grid grid-cols-3 gap-3">
                                    {transformationOptions.map(option => (
                                        <label
                                            key={option.value}
                                            className={radioCardClass(transformationMethod === option.value)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name="transformationMethod"
                                                    value={option.value}
                                                    checked={transformationMethod === option.value}
                                                    onChange={(e) => !readonly && setTransformationMethod(e.target.value)}
                                                    disabled={readonly}
                                                    className="w-4 h-4 accent-[#8e78b7]"
                                                />
                                                <span className={`text-sm font-medium ${transformationMethod === option.value ? 'text-[#8e78b7]' : 'text-gray-700'}`}>
                                                    {option.label}
                                                </span>
                                            </div>
                                            {/* Tooltip */}
                                            <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-[#332849] text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
                                                <p className="leading-relaxed">{option.description}</p>
                                                <div className="absolute -top-1 left-4 w-2 h-2 bg-[#332849] transform rotate-45"></div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500 mt-3">Selected: {selectedColumns.length} columns</p>
                            </div>
                        </div>
                    </FeatureSection>
                </div>

                {/* ── Near Zero Variance ── */}
                <FeatureSection
                    title="Near Zero Variance"
                    isToggled={toggles.nearZeroVariance}
                    isExpanded={false}
                    onToggle={() => toggleSwitch('nearZeroVariance')}
                    onExpand={() => { }}
                    hasExpandableContent={false}
                    readonly={readonly}
                    sectionKey="nearZeroVariance"
                />

                {/* ── Feature Scaler ── */}
                <FeatureSection
                    title="Feature Scaler"
                    isToggled={toggles.featureScaler}
                    isExpanded={expandedSections.featureScaler}
                    onToggle={() => toggleSwitch('featureScaler')}
                    onExpand={() => toggleSection('featureScaler')}
                    hasExpandableContent={true}
                    readonly={readonly}
                    sectionKey="featureScaler"
                    isLastSection={true}
                >
                    <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-3">Scaler Method</h5>
                        <div className="grid grid-cols-3 gap-3">
                            {scalerOptions.map(option => (
                                <label
                                    key={option.value}
                                    className={radioCardClass(scalerMethod === option.value)}
                                >
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="scalerMethod"
                                            value={option.value}
                                            checked={scalerMethod === option.value}
                                            onChange={(e) => !readonly && setScalerMethod(e.target.value)}
                                            disabled={readonly}
                                            className="w-4 h-4 accent-[#8e78b7]"
                                        />
                                        <span className={`text-sm font-medium ${scalerMethod === option.value ? 'text-[#8e78b7]' : 'text-gray-700'}`}>
                                            {option.label}
                                        </span>
                                    </div>
                                    {/* Tooltip */}
                                    <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-[#332849] text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
                                        <p className="leading-relaxed">{option.description}</p>
                                        <div className="absolute -top-1 left-4 w-2 h-2 bg-[#332849] transform rotate-45"></div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                </FeatureSection>
            </div>
        </div>
    );
}

export default ScalingTransformation;