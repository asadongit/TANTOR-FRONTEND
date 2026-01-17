import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

import { useAIPlayground } from '../../../../../../context/AIPlaygroundContext';
import toast from 'react-hot-toast';

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
    hasExpandableContent = true,
    children,
    readonly,
    validationError
}) => (
    <div className="bg-gray-50 rounded-lg border border-gray-200">
        <div className="p-4 flex items-center justify-between">
            <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-700">{title}</h4>
                <p className="text-xs text-gray-400 mt-0.5">{description}</p>
            </div>
            <div className="flex items-center gap-3">
                <ToggleSwitch checked={isToggled} onChange={onToggle} readonly={readonly} />
                {isToggled && hasExpandableContent && (
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

        {isToggled && isExpanded && children && (
            <div className="px-4 pb-4 border-t border-gray-100">
                <div className="mt-4">{children}</div>
            </div>
        )}

        {isToggled && validationError && (
            <div className="px-4 pb-2">
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-800">{validationError}</p>
                </div>
            </div>
        )}
    </div>
);

function ScalingTransformation({ readonly = false, onApiCall, onValidationChange }) {
    const hostnameAI = window._env_?.VITE_AI_API;
    const { workflowState, datasetState, updatePreprocessingStep } = useAIPlayground();

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
    const [validationError, setValidationError] = useState('');

    const skewedColumns = React.useMemo(() => {
        const skewnessReport = workflowState?.dataPreprocessing?.step3?.apiResponse?.skewness_report;

        if (!skewnessReport) return [];

        return Object.entries(skewnessReport)
            .map(([name, skewness]) => ({
                name,
                skewness: Math.abs(skewness)
            }))
            .sort((a, b) => b.skewness - a.skewness);
    }, [workflowState]);

    const transformationOptions = [
        { value: 'box-cox', label: 'Box-Cox' },
        { value: 'yeo-johnson', label: 'Yeo-Johnson' },
        { value: 'log', label: 'Log' },
        { value: 'sqrt', label: 'Square Root' },
        { value: 'quantile_uniform', label: 'Quantile Uniform' },
        { value: 'quantile_normal', label: 'Quantile Normal' },
        { value: 'power', label: 'Power' },
    ];

    const scalerOptions = [
        { value: 'standard', label: 'Standard' },
        { value: 'minmax', label: 'MinMax' },
        { value: 'robust', label: 'Robust' },
        { value: 'maxabs', label: 'MaxAbs' },
        { value: 'quantile', label: 'Quantile' },
        { value: 'power', label: 'Power' },
        { value: 'normalizer', label: 'Normalizer' },
    ];

    useEffect(() => {
        const isValid = !toggles.advancedTransformation || selectedColumns.length > 0;
        const error = toggles.advancedTransformation && selectedColumns.length === 0
            ? 'Please select at least one column for transformation'
            : '';

        setValidationError(error);

        if (onValidationChange) {
            onValidationChange(isValid);
        }
    }, [toggles.advancedTransformation, selectedColumns, onValidationChange]);

    const handleApiCall = async () => {

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
                headers: {
                    'accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'API request failed');
            }

            const data = await response.json();

            updatePreprocessingStep('step4', {
                config: {
                    toggles,
                    transformationMethod,
                    scalerMethod,
                    selectedColumns
                },
                apiResponse: data
            });

            toast.success('Scaling & Transformation completed successfully!', {
                duration: 3000,
                position: 'top-right',
            });
            return true;
        } catch (error) {
             toast.error(error.message || 'Scaling & Transformation failed. Please try again.', {
                duration: 4000,
                position: 'top-right',
            });
            return false;
        }
    };

    useEffect(() => {
        if (onApiCall) {
            onApiCall(handleApiCall);
        }
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

            if (key === 'advancedTransformation') {
                setValidationError('');
            }
        }
    };

    const toggleSection = (section) => {
        if (readonly) return;
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
            prev.includes(columnName)
                ? prev.filter(col => col !== columnName)
                : [...prev, columnName]
        );
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="space-y-4">
                {/* Advanced Transformation Section */}
                <FeatureSection
                    title="Advanced Transformation"
                    description="Apply mathematical transformations to reduce skewness"
                    isToggled={toggles.advancedTransformation}
                    isExpanded={expandedSections.advancedTransformation}
                    onToggle={() => toggleSwitch('advancedTransformation')}
                    onExpand={() => toggleSection('advancedTransformation')}
                    hasExpandableContent={true}
                    readonly={readonly}
                    validationError={validationError}
                >
                    <div className="space-y-4">
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h5 className="text-sm font-medium text-gray-700">Select Columns</h5>
                            </div>
                            <div className="space-y-2">
                                {skewedColumns.map((column) => (
                                    <div
                                        key={column.name}
                                        className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-[#8e78b7] transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedColumns.includes(column.name)}
                                                onChange={() => toggleColumnSelection(column.name)}
                                                disabled={readonly}
                                                className="w-4 h-4 text-[#8e78b7] border-gray-300 rounded focus:ring-[#8e78b7]"
                                            />
                                            <span className="text-sm text-gray-700">{column.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                            </svg>
                                            <span className="text-xs text-gray-500">Skewness: {column.skewness.toFixed(4)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-2">
                            <h5 className="text-sm font-medium text-gray-700 mb-3">Transformation Method</h5>
                            <select
                                value={transformationMethod}
                                onChange={(e) => !readonly && setTransformationMethod(e.target.value)}
                                disabled={readonly}
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent"
                            >
                                {transformationOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-2">
                                Selected: {selectedColumns.length} columns
                            </p>
                        </div>
                    </div>
                </FeatureSection>

                <FeatureSection
                    title="Near Zero Variance"
                    description="Remove features with near-zero variance"
                    isToggled={toggles.nearZeroVariance}
                    isExpanded={false}
                    onToggle={() => toggleSwitch('nearZeroVariance')}
                    onExpand={() => { }}
                    hasExpandableContent={false}
                    readonly={readonly}
                />

                <FeatureSection
                    title="Feature Scaler"
                    description="Scale features to a standard range"
                    isToggled={toggles.featureScaler}
                    isExpanded={expandedSections.featureScaler}
                    onToggle={() => toggleSwitch('featureScaler')}
                    onExpand={() => toggleSection('featureScaler')}
                    hasExpandableContent={true}
                    readonly={readonly}
                >
                    <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-3">Scaler Method</h5>
                        <div className="grid grid-cols-3 gap-3">
                            {scalerOptions.map(option => (
                                <div
                                    key={option.value}
                                    className="bg-white px-4 py-3 rounded-lg border border-gray-200 hover:border-[#8e78b7] transition-colors"
                                >
                                    <RadioOption
                                        name="scalerMethod"
                                        value={option.value}
                                        checked={scalerMethod === option.value}
                                        onChange={(e) => !readonly && setScalerMethod(e.target.value)}
                                        label={option.label}
                                        readonly={readonly}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </FeatureSection>

            </div>
        </div>
    );
}

export default ScalingTransformation;