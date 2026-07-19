import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import CustomDropdown from '../../../../../components/CustomDropdown';
import { fetchTsXAIConfig } from '../../../../../hooks/AI/XAI/useTimeseriesXAI';

const headingCls = "font-['Satoshi'] font-medium text-[18px] leading-none tracking-normal";
const bodyCls = "font-['Satoshi'] font-normal text-[16px] leading-none tracking-normal";

const REGRESSION_OPERATOR_OPTIONS = [
    { value: 'between', label: 'Between' },
    { value: '>', label: 'Greater than (>)' },
    { value: '<', label: 'Less than (<)' },
];

const CLASSIFICATION_OPERATOR_OPTIONS = [
    { value: '=', label: 'Equals (=)' },
];

export const SeriesFilterModal = ({ isOpen, onClose, ensembleId, workflowId, nextWorkflowId, isTimeseries, onConfirm }) => {
    const hostnameAI = window._env_?.VITE_AI_API;

    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState('');
    const [xaiConfig, setXaiConfig] = useState(null);
    const [modelName, setModelName] = useState('');

    const [operator, setOperator] = useState('');
    const [operatorError, setOperatorError] = useState('');
    const [value1, setValue1] = useState('');
    const [value2, setValue2] = useState('');
    const [valueError, setValueError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const isRegression = xaiConfig?.modeling_type === 'regression';
    const operatorOptions = isRegression ? REGRESSION_OPERATOR_OPTIONS : CLASSIFICATION_OPERATOR_OPTIONS;
    const valueRange = xaiConfig?.pdp_target_value_range;
    const valueClasses = xaiConfig?.pdp_target_classes || [];

    const resetForm = () => {
        setOperator('');
        setOperatorError('');
        setValue1('');
        setValue2('');
        setValueError('');
    };

    useEffect(() => {
        if (!isOpen) {
            setXaiConfig(null);
            setModelName('');
            setLoadError('');
            resetForm();
            return;
        }

        const loadConfig = async () => {
            setLoading(true);
            setLoadError('');
            try {
                const modelsResponse = await fetch(`${hostnameAI}/model_lifecycle/logged_models`, {
                    method: 'POST',
                    headers: { accept: 'application/json', 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ensemble_id: ensembleId, workflow_id: workflowId })
                });

                if (!modelsResponse.ok) {
                    throw new Error(`Failed to fetch logged models: ${modelsResponse.status}`);
                }

                const modelsData = await modelsResponse.json();
                const firstModel = (modelsData.logged_models || [])[0];

                if (!firstModel?.run_name) {
                    setLoadError('No trained model found for the first workflow yet.');
                    return;
                }

                setModelName(firstModel.run_name);

                let config;
                if (isTimeseries) {
                    config = await fetchTsXAIConfig({
                        ensembleId,
                        workflowId,
                        modelName: firstModel.run_name
                    });
                } else {
                    const configResponse = await fetch(`${hostnameAI}/model/XAI_config`, {
                        method: 'POST',
                        headers: { accept: 'application/json', 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            ensemble_id: ensembleId,
                            workflow_id: workflowId,
                            model_name: firstModel.run_name
                        })
                    });

                    if (!configResponse.ok) {
                        throw new Error(`Failed to fetch XAI configuration: ${configResponse.status}`);
                    }
                    config = await configResponse.json();
                }

                setXaiConfig(config);
            } catch (error) {
                console.error('Error loading series filter configuration:', error);
                setLoadError(error.message || 'Failed to load model configuration. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        loadConfig();
    }, [isOpen, ensembleId, workflowId, isTimeseries, hostnameAI]);

    const handleOperatorChange = (e) => {
        setOperator(e.target.value);
        setOperatorError('');
        setValue1('');
        setValue2('');
        setValueError('');
    };

    const handleClose = () => {
        if (submitting) return;
        onClose();
    };

    const handleConfirm = async () => {
        if (!operator) {
            setOperatorError('Please select an operator');
            return;
        }

        let filteringValue1;
        let filteringValue2 = 0;

        if (isRegression) {
            const num1 = Number(value1);
            if (value1 === '' || isNaN(num1)) {
                setValueError('Enter a valid value');
                return;
            }
            if (valueRange && (num1 < valueRange.min || num1 > valueRange.max)) {
                setValueError(`Value must be between ${valueRange.min.toFixed(2)} and ${valueRange.max.toFixed(2)}`);
                return;
            }

            if (operator === 'between') {
                const num2 = Number(value2);
                if (value2 === '' || isNaN(num2)) {
                    setValueError('Enter a valid second value');
                    return;
                }
                if (valueRange && (num2 < valueRange.min || num2 > valueRange.max)) {
                    setValueError(`Second value must be between ${valueRange.min.toFixed(2)} and ${valueRange.max.toFixed(2)}`);
                    return;
                }
                if (num1 > num2) {
                    setValueError('First value must be less than or equal to the second value');
                    return;
                }
                filteringValue2 = num2;
            }

            filteringValue1 = num1;
        } else {
            if (value1 === '') {
                setValueError('Please select a value');
                return;
            }
            filteringValue1 = value1;
        }

        setSubmitting(true);
        try {
            const response = await fetch(`${hostnameAI}/ingestion/ensemble-sequence-ingestion`, {
                method: 'POST',
                headers: { accept: 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ensemble_id: ensembleId,
                    workflow_id: nextWorkflowId,
                    operator,
                    filtering_value_1: filteringValue1,
                    filtering_value_2: filteringValue2
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to save filter condition: ${response.status}`);
            }

            toast.success('Filter condition saved!', { duration: 2000, position: 'top-right' });
            resetForm();
            onConfirm();
        } catch (error) {
            console.error('Error saving series filter condition:', error);
            toast.error(error.message || 'Failed to save filter condition. Please try again.', {
                duration: 4000,
                position: 'top-right'
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-xl w-full">
                <div className="flex items-center justify-between p-6">
                    <h2 className={`${headingCls} text-[#282F49]`}>Filter Condition for Next Workflow</h2>
                    <button onClick={handleClose} className="text-[#818181] hover:text-slate-600 transition-colors" disabled={submitting}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-6 pb-6">
                    {loading ? (
                        <p className={`${bodyCls} text-[#332849]`}>Loading model configuration...</p>
                    ) : loadError ? (
                        <p className="text-sm text-red-500">{loadError}</p>
                    ) : (
                        <>
                            

                            <div className="mb-4">
                                <label className={`${bodyCls} block mb-2 text-[#282F49]`}>Operator</label>
                                <CustomDropdown
                                    value={operator}
                                    onChange={handleOperatorChange}
                                    options={operatorOptions}
                                    placeholder="Select"
                                    disabled={submitting}
                                    error={operatorError}
                                />
                            </div>

                            {operator && (
                                isRegression ? (
                                    <div className={`grid ${operator === 'between' ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
                                        <div>
                                            <label className={`${bodyCls} block mb-2 text-[#282F49]`}>
                                                {operator === 'between' ? 'First Value' : 'Value'}
                                            </label>
                                            <input
                                                type="number"
                                                value={value1}
                                                onChange={(e) => { setValue1(e.target.value); setValueError(''); }}
                                                placeholder={valueRange ? `${valueRange.min.toFixed(2)} - ${valueRange.max.toFixed(2)}` : 'Enter value'}
                                                disabled={submitting}
                                                className="w-full rounded-lg border px-4 py-3 text-[#282F49] focus:outline-none focus:ring-2 focus:ring-[#8e78b7] border-[#D7D3E5]"
                                            />
                                        </div>
                                        {operator === 'between' && (
                                            <div>
                                                <label className={`${bodyCls} block mb-2 text-[#282F49]`}>Second Value</label>
                                                <input
                                                    type="number"
                                                    value={value2}
                                                    onChange={(e) => { setValue2(e.target.value); setValueError(''); }}
                                                    placeholder={valueRange ? `${valueRange.min.toFixed(2)} - ${valueRange.max.toFixed(2)}` : 'Enter value'}
                                                    disabled={submitting}
                                                    className="w-full rounded-lg border px-4 py-3 text-[#282F49] focus:outline-none focus:ring-2 focus:ring-[#8e78b7] border-[#D7D3E5]"
                                                />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div>
                                        <label className={`${bodyCls} block mb-2 text-[#282F49]`}>Value</label>
                                        <CustomDropdown
                                            value={value1}
                                            onChange={(e) => { setValue1(e.target.value); setValueError(''); }}
                                            options={valueClasses.map(cls => ({ value: cls, label: String(cls) }))}
                                            placeholder="Select"
                                            disabled={submitting}
                                        />
                                    </div>
                                )
                            )}

                            {valueError && <p className="text-xs text-red-500 mt-2">{valueError}</p>}
                        </>
                    )}

                    <div className="mt-6 flex items-center justify-between">
                        <button
                            onClick={handleClose}
                            disabled={submitting}
                            className="px-4 py-2 rounded-lg border border-[#D7D3E5] text-[#332849] hover:bg-[#FAFAFA] disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={submitting || loading || !!loadError}
                            className="px-4 py-2 rounded-lg bg-[#8e78b7] text-white hover:bg-[#7f68a9] disabled:opacity-50"
                        >
                            {submitting ? 'Saving...' : 'Confirm & Continue'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SeriesFilterModal;
