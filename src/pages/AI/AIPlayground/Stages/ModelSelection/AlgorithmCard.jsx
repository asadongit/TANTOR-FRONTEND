import React from 'react';
import { ChevronDown, ChevronUp, Info, X, Plus } from 'lucide-react';
import { validateHyperparameterValue } from './validationUtils';

function AlgorithmCard({ algo, readonly, onToggle, onExpand, onUpdate }) {
    const handleConfigModeChange = (mode) => {
        if (readonly) return;
        onUpdate(algo.id, { configMode: mode });
    };

    const handleHyperparameterChange = (paramName, paramValue, newValue) => {
        const newErrors = { ...algo.errors };
        delete newErrors[paramName];

        onUpdate(algo.id, {
            hyperparameterValues: {
                ...algo.hyperparameterValues,
                [paramName]: newValue
            },
            errors: newErrors
        });
    };

    const handleHyperparameterBlur = (paramName, paramValue, currentValue) => {
        if (currentValue && currentValue.trim() !== '') {
            const validationResult = validateHyperparameterValue(paramName, paramValue, currentValue);

            if (validationResult !== true) {
                onUpdate(algo.id, {
                    errors: {
                        ...algo.errors,
                        [paramName]: validationResult
                    }
                });
            }
        }
    };

    const addGridSearchValue = (paramName) => {
        const currentValues = algo.gridSearchValues[paramName] || [];
        
        onUpdate(algo.id, {
            gridSearchValues: {
                ...algo.gridSearchValues,
                [paramName]: [...currentValues, '']
            },
            gridSearchErrors: {
                ...algo.gridSearchErrors,
                [paramName]: [...(algo.gridSearchErrors[paramName] || []), null]
            }
        });
    };

    const updateGridSearchValue = (paramName, index, newValue) => {
        const currentValues = [...(algo.gridSearchValues[paramName] || [])];
        currentValues[index] = newValue;

        const currentErrors = [...(algo.gridSearchErrors[paramName] || [])];
        currentErrors[index] = null;

        onUpdate(algo.id, {
            gridSearchValues: {
                ...algo.gridSearchValues,
                [paramName]: currentValues
            },
            gridSearchErrors: {
                ...algo.gridSearchErrors,
                [paramName]: currentErrors
            }
        });
    };

    const validateGridSearchValue = (paramName, paramValue, index, value) => {
        if (value && value.trim() !== '') {
            const validationResult = validateHyperparameterValue(paramName, paramValue, value);

            if (validationResult !== true) {
                const currentErrors = [...(algo.gridSearchErrors[paramName] || [])];
                currentErrors[index] = validationResult;

                onUpdate(algo.id, {
                    gridSearchErrors: {
                        ...algo.gridSearchErrors,
                        [paramName]: currentErrors
                    }
                });
            }
        }
    };

    const removeGridSearchValue = (paramName, index) => {
        const currentValues = [...(algo.gridSearchValues[paramName] || [])];
        currentValues.splice(index, 1);

        const currentErrors = [...(algo.gridSearchErrors[paramName] || [])];
        currentErrors.splice(index, 1);

        onUpdate(algo.id, {
            gridSearchValues: {
                ...algo.gridSearchValues,
                [paramName]: currentValues
            },
            gridSearchErrors: {
                ...algo.gridSearchErrors,
                [paramName]: currentErrors
            }
        });
    };

    const renderHyperparameterField = (paramName, paramValue) => {
        const hasError = algo.errors && algo.errors[paramName];

        if (typeof paramValue === 'string') {
            const options = paramValue.split(',').map(opt => opt.trim());
            return (
                <div key={paramName}>
                    <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                        {paramName.replace(/_/g, ' ')}
                    </label>
                    <select
                        disabled={readonly}
                        value={algo.hyperparameterValues[paramName] || ''}
                        onChange={(e) => handleHyperparameterChange(paramName, paramValue, e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent ${
                            hasError ? 'border-red-500' : 'border-gray-300'
                        }`}
                    >
                        <option value="">Select</option>
                        {options.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                    {hasError && <p className="text-xs text-red-600 mt-1">{hasError}</p>}
                </div>
            );
        } else if (typeof paramValue === 'object' && paramValue.low && paramValue.high) {
            const specialText = paramValue.special
                ? Array.isArray(paramValue.special)
                    ? paramValue.special.join(', ')
                    : paramValue.special
                : '';

            return (
                <div key={paramName}>
                    <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                        {paramName.replace(/_/g, ' ')}
                    </label>
                    <input
                        type="text"
                        disabled={readonly}
                        value={algo.hyperparameterValues[paramName] || ''}
                        onChange={(e) => handleHyperparameterChange(paramName, paramValue, e.target.value)}
                        onBlur={(e) => handleHyperparameterBlur(paramName, paramValue, e.target.value)}
                        placeholder={`${paramValue.low} - ${paramValue.high}${specialText ? ` or ${specialText}` : ''}`}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent ${
                            hasError ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    {hasError ? (
                        <p className="text-xs text-red-600 mt-1">{hasError}</p>
                    ) : (
                        <p className="text-xs text-gray-500 mt-1">
                            Range: {paramValue.low} to {paramValue.high}
                            {specialText && ` (or ${specialText})`}
                        </p>
                    )}
                </div>
            );
        }
        return null;
    };

    const renderGridSearchField = (paramName, paramValue) => {
        const values = algo.gridSearchValues[paramName] || [''];
        const errors = algo.gridSearchErrors[paramName] || [null];

        if (typeof paramValue === 'string') {
            const options = paramValue.split(',').map(opt => opt.trim());
            const selectedValues = values.filter(v => v !== '');
            const allOptionsSelected = selectedValues.length >= options.length;
            const allPreviousFieldsFilled = values.every(v => v && v.trim() !== '');
            
            return (
                <div key={paramName} className="p-4 bg-gray-50 rounded-lg border border-gray-300 shadow-sm">
                    <label className="block text-sm font-semibold text-gray-800 mb-3 capitalize">
                        {paramName.replace(/_/g, ' ')}
                    </label>
                    
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                        {values.map((value, index) => {
                            const availableOptions = options.filter(opt => 
                                opt === value || !selectedValues.includes(opt)
                            );
                            
                            return (
                                <div key={index} className="flex items-center gap-2">
                                    <select
                                        disabled={readonly}
                                        value={value}
                                        onChange={(e) => updateGridSearchValue(paramName, index, e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent text-sm bg-white shadow-sm"
                                    >
                                        <option value="">Select</option>
                                        {availableOptions.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                    {values.length > 1 && (
                                        <button
                                            onClick={() => removeGridSearchValue(paramName, index)}
                                            disabled={readonly}
                                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {!readonly && (
                        <button
                            onClick={() => addGridSearchValue(paramName)}
                            disabled={readonly || allOptionsSelected || !allPreviousFieldsFilled}
                            className={`mt-3 w-full px-3 py-2 border-2 border-dashed rounded-lg text-sm flex items-center justify-center gap-2 font-medium transition-colors ${
                                allOptionsSelected || !allPreviousFieldsFilled
                                    ? 'border-gray-200 text-gray-400 cursor-not-allowed' 
                                    : 'border-gray-300 text-gray-600 hover:border-[#8e78b7] hover:text-[#8e78b7] hover:bg-gray-100'
                            }`}
                        >
                            <Plus className="w-4 h-4" />
                            {allOptionsSelected ? 'All Options Selected' : 'Add Value'}
                        </button>
                    )}
                </div>
            );
        } else if (typeof paramValue === 'object' && paramValue.low && paramValue.high) {
            const specialText = paramValue.special
                ? Array.isArray(paramValue.special)
                    ? paramValue.special.join(', ')
                    : paramValue.special
                : '';

            const allPreviousFieldsFilled = values.every(v => v && v.trim() !== '');
            const hasAnyErrors = errors.some(error => error !== null && error !== '');

            return (
                <div key={paramName} className="p-4 bg-gray-50 rounded-lg border border-gray-300 shadow-sm">
                    <label className="block text-sm font-semibold text-gray-800 mb-2 capitalize">
                        {paramName.replace(/_/g, ' ')}
                    </label>

                    <div className="space-y-2 max-h-48 overflow-y-auto p-0.5 custom-scrollbar">
                        {values.map((value, index) => (
                            <div key={index} className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        disabled={readonly}
                                        value={value}
                                        onChange={(e) => updateGridSearchValue(paramName, index, e.target.value)}
                                        onBlur={(e) => validateGridSearchValue(paramName, paramValue, index, e.target.value)}
                                        placeholder={`${paramValue.low} - ${paramValue.high}${specialText ? ` or ${specialText}` : ''}`}
                                        className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent text-sm bg-white shadow-sm ${
                                            errors[index] ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    />
                                    {values.length > 1 && (
                                        <button
                                            onClick={() => removeGridSearchValue(paramName, index)}
                                            disabled={readonly}
                                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                {errors[index] && (
                                    <p className="text-xs text-red-600 ml-1">{errors[index]}</p>
                                )}
                            </div>
                        ))}
                    </div>

                    {!readonly && (
                        <button
                            onClick={() => addGridSearchValue(paramName)}
                            disabled={readonly || !allPreviousFieldsFilled || hasAnyErrors}
                            className={`mt-3 w-full px-3 py-2 border-2 border-dashed rounded-lg text-sm flex items-center justify-center gap-2 font-medium transition-colors ${
                                !allPreviousFieldsFilled || hasAnyErrors
                                    ? 'border-gray-200 text-gray-400 cursor-not-allowed' 
                                    : 'border-gray-300 text-gray-600 hover:border-[#8e78b7] hover:text-[#8e78b7] hover:bg-gray-100'
                            }`}
                        >
                            <Plus className="w-4 h-4" />
                            Add Value
                        </button>
                    )}

                    <p className="text-xs text-gray-600 mt-3 italic">
                        Range: {paramValue.low} to {paramValue.high}
                        {specialText && ` (or ${specialText})`}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-2 flex-1">
                    <span className="font-medium text-gray-900">{algo.name}</span>
                    {algo.info && (
                        <div className="relative group">
                            <Info className="w-4 h-4 text-gray-400 hover:text-[#8e78b7] cursor-help transition-colors" />
                            <div className="absolute left-0 top-6 w-80 z-1000 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
                                <div className="absolute -top-1 left-2 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                                {algo.info}
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <label className={`relative inline-flex items-center ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                        <input
                            type="checkbox"
                            checked={algo.enabled}
                            onChange={() => onToggle(algo.id)}
                            disabled={readonly}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8e78b7]"></div>
                    </label>
                    {algo.enabled && (
                        <button
                            onClick={() => onExpand(algo.id)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            title={algo.expanded ? "Collapse" : "Expand"}
                        >
                            {algo.expanded ? (
                                <ChevronUp className='w-5 h-5' />
                            ) : (
                                <ChevronDown className='w-5 h-5' />
                            )}
                        </button>
                    )}
                </div>
            </div>

            {algo.expanded && (
                <div className="bg-white p-4 border-t border-gray-200">
                    <div className={algo.configMode !== 'Base' ? 'mb-4' : ''}>
                        <label className="block text-sm font-medium text-gray-900 mb-4">Configuration Mode</label>
                        <div className="flex gap-4">
                            {['Base', 'Hyper Parameter', 'Grid Search'].map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => handleConfigModeChange(mode)}
                                    disabled={readonly}
                                    className={`px-6 py-1 text-sm font-medium rounded-lg border transition-colors ${
                                        algo.configMode === mode
                                            ? 'bg-[#8e78b7] text-white border-[#8e78b7]'
                                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    } ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>
                    </div>

                    {algo.configMode === 'Hyper Parameter' && algo.hyperparameters && (
                        <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto px-1 custom-scrollbar">
                            {Object.entries(algo.hyperparameters).map(([paramName, paramValue]) =>
                                renderHyperparameterField(paramName, paramValue)
                            )}
                        </div>
                    )}

                    {algo.configMode === 'Grid Search' && algo.hyperparameters && (
                        <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto custom-scrollbar">
                            {Object.entries(algo.hyperparameters).map(([paramName, paramValue]) =>
                                renderGridSearchField(paramName, paramValue)
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default AlgorithmCard;