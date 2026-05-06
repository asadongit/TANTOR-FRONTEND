import React, { useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Info, X, Plus } from 'lucide-react';
import { validateHyperparameterValue } from './validationUtils';
import { tw } from '../../../../../components/themeContext';

// Single-select dropdown for Hyper Parameter mode (mirrors GridSearchDropdown style)
function HyperparameterDropdown({ algo, paramName, options, readonly, disabled, onUpdate, isEmpty }) {
    const ref = useRef(null);
    const dropdownKey = `hp-${algo.id}-${paramName}`;
    const isOpen = algo._openDropdown === dropdownKey;
    const selectedValue = algo.hyperparameterValues[paramName] || '';

    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                onUpdate(algo.id, { _openDropdown: null });
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const toggleDropdown = () => {
        if (readonly || disabled) return;
        onUpdate(algo.id, { _openDropdown: isOpen ? null : dropdownKey });
    };

    const selectOption = (opt) => {
        if (readonly || disabled) return;
        const newErrors = { ...algo.errors };
        delete newErrors[paramName];
        onUpdate(algo.id, {
            hyperparameterValues: { ...algo.hyperparameterValues, [paramName]: opt },
            errors: newErrors,
            _openDropdown: null
        });
    };

    const triggerLabel = selectedValue || 'Select';

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={toggleDropdown}
                disabled={readonly || disabled}
                className={`w-full h-10 px-3 rounded-md border text-sm text-left flex items-center justify-between transition-all focus:outline-none font-satoshi font-normal leading-none tracking-normal ${isOpen
                    ? 'border-[#8e78b7] bg-[#F5F0FF] text-[#332849]'
                    : isEmpty
                        ? 'border-[#EF4D5F] bg-[#FFF7F8] text-[#EF4D5F]'
                        : 'border-slate-200 bg-white text-[#818181]'
                    } ${readonly ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
            >
                <span className={selectedValue
                    ? 'font-satoshi text-sm font-medium text-[#332849] leading-none tracking-normal'
                    : isEmpty
                        ? 'font-satoshi text-sm font-normal text-[#EF4D5F] leading-none tracking-normal'
                        : 'font-satoshi text-sm font-normal text-[#818181] leading-none tracking-normal'
                }>
                    {triggerLabel}
                </span>
                <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${isOpen ? 'text-[#8e78b7] rotate-180' : isEmpty ? 'text-[#EF4D5F]' : 'text-[#818181]'}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg z-20 overflow-hidden">
                    <div className="max-h-44 overflow-y-auto">
                        {options.map(opt => {
                            const isSelected = selectedValue === opt;
                            return (
                                <div
                                    key={opt}
                                    onClick={() => selectOption(opt)}
                                    className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors"
                                >
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'border-[#8e78b7]' : 'border-gray-300 bg-white'
                                        }`}>
                                        {isSelected && (
                                            <div className="w-2 h-2 rounded-full bg-[#8e78b7]" />
                                        )}
                                    </div>
                                    <span className={`font-satoshi text-sm leading-none tracking-normal ${isSelected ? 'font-medium text-[#332849]' : 'font-normal text-[#818181]'}`}>
                                        {opt}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

// Extracted dropdown as its own component so we can use hooks (useEffect, useRef)
function GridSearchDropdown({ algo, paramName, options, readonly, disabled, onUpdate, isEmpty }) {
    const ref = useRef(null);
    const dropdownKey = `${algo.id}-${paramName}`;
    const isOpen = algo._openDropdown === dropdownKey;
    const selectedValues = (algo.gridSearchValues[paramName] || []).filter(v => v && v.trim() !== '');
    const allSelected = selectedValues.length === options.length;
    const someSelected = selectedValues.length > 0;

    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                onUpdate(algo.id, { _openDropdown: null });
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const toggleDropdown = () => {
        if (readonly || disabled) return;
        onUpdate(algo.id, { _openDropdown: isOpen ? null : dropdownKey });
    };

    const toggleOption = (opt) => {
        if (readonly || disabled) return;
        const newSelected = selectedValues.includes(opt)
            ? selectedValues.filter(v => v !== opt)
            : [...selectedValues, opt];
        onUpdate(algo.id, {
            gridSearchValues: { ...algo.gridSearchValues, [paramName]: newSelected },
            gridSearchErrors: { ...algo.gridSearchErrors, [paramName]: [] }
        });
    };

    const toggleAll = () => {
        if (readonly || disabled) return;
        onUpdate(algo.id, {
            gridSearchValues: { ...algo.gridSearchValues, [paramName]: allSelected ? [] : [...options] },
            gridSearchErrors: { ...algo.gridSearchErrors, [paramName]: [] }
        });
    };

    const triggerLabel = selectedValues.length === 0
        ? 'Select'
        : allSelected
            ? 'All selected'
            : selectedValues.length === 1
                ? selectedValues[0]
                : `${selectedValues.length} selected`;

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={toggleDropdown}
                disabled={readonly || disabled}
                className={`w-full h-10 px-3 rounded-md border text-sm text-left flex items-center justify-between transition-all focus:outline-none font-satoshi font-normal leading-none tracking-normal ${isOpen
                    ? 'border-[#8e78b7] bg-[#F5F0FF] text-[#332849]'
                    : isEmpty
                        ? 'border-[#EF4D5F] bg-[#FFF7F8] text-[#EF4D5F]'
                        : 'border-slate-200 bg-white text-[#818181]'
                    } ${readonly ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
            >
                <span className={someSelected
                    ? 'font-satoshi text-sm font-medium text-[#332849] leading-none tracking-normal'
                    : isEmpty
                        ? 'font-satoshi text-sm font-normal text-[#EF4D5F] leading-none tracking-normal'
                        : 'font-satoshi text-sm font-normal text-[#818181] leading-none tracking-normal'
                }>
                    {triggerLabel}
                </span>
                <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${isOpen ? 'text-[#8e78b7] rotate-180' : isEmpty ? 'text-[#EF4D5F]' : 'text-[#818181]'}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg z-20 overflow-hidden">
                    {/* Select All */}
                    <div
                        onClick={toggleAll}
                        className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-100"
                    >
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${allSelected ? 'bg-[#8e78b7] border-[#8e78b7]'
                            : someSelected ? 'bg-[#8e78b7] border-[#8e78b7]'
                                : 'border-gray-300 bg-white'
                            }`}>
                            {allSelected && (
                                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8">
                                    <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                            {someSelected && !allSelected && (
                                <div className="w-2 h-0.5 bg-white rounded" />
                            )}
                        </div>
                        <span className="font-satoshi text-sm font-medium text-[#8e78b7] leading-none tracking-normal">Select All</span>
                        <span className="ml-auto text-xs text-gray-400">{selectedValues.length}/{options.length}</span>
                    </div>

                    {/* Options */}
                    <div className="max-h-44 overflow-y-auto">
                        {options.map(opt => {
                            const isChecked = selectedValues.includes(opt);
                            return (
                                <div
                                    key={opt}
                                    onClick={() => toggleOption(opt)}
                                    className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors"
                                >
                                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isChecked ? 'bg-[#8e78b7] border-[#8e78b7]' : 'border-gray-300 bg-white'
                                        }`}>
                                        {isChecked && (
                                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8">
                                                <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        )}
                                    </div>
                                    <span className={`font-satoshi text-sm leading-none tracking-normal ${isChecked ? 'font-medium text-[#332849]' : 'font-normal text-[#818181]'}`}>
                                        {opt}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

function AlgorithmCard({ algo, readonly, disabled, onToggle, onExpand, onUpdate, showValidation, onResetValidation, cardRef }) {
    const handleConfigModeChange = (mode) => {
        if (readonly || disabled) return;
        onUpdate(algo.id, { configMode: mode, errors: {}, hyperparameterValues: {}, gridSearchValues: {}, gridSearchErrors: {} });
        if (onResetValidation) onResetValidation();
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

    // Check if a field is empty and validation has been triggered
    const isFieldEmpty = (paramName, paramValue) => {
        if (!showValidation || !algo.enabled) return false;
        if (algo.configMode === 'Hyper Parameter') {
            if (typeof paramValue === 'string') {
                return !algo.hyperparameterValues[paramName] || algo.hyperparameterValues[paramName] === '';
            } else if (typeof paramValue === 'object' && paramValue.low && paramValue.high) {
                return !algo.hyperparameterValues[paramName] || algo.hyperparameterValues[paramName].trim() === '';
            }
        }
        if (algo.configMode === 'Grid Search') {
            if (typeof paramValue === 'string') {
                const vals = algo.gridSearchValues[paramName] || [];
                return vals.filter(v => v && v.trim() !== '').length === 0;
            } else if (typeof paramValue === 'object' && paramValue.low && paramValue.high) {
                const vals = algo.gridSearchValues[paramName] || [];
                return vals.filter(v => v && v.trim() !== '').length === 0;
            }
        }
        return false;
    };

    const renderHyperparameterField = (paramName, paramValue) => {
        const hasError = algo.errors && algo.errors[paramName];
        const isEmpty = isFieldEmpty(paramName, paramValue);
        const showError = hasError || isEmpty;

        if (typeof paramValue === 'string') {
            const options = paramValue.split(',').map(opt => opt.trim());
            return (
                <div key={paramName}>
                    <label className={`block ${tw.sectionHeading} mb-2 capitalize`}>
                        {paramName.replace(/_/g, ' ')}
                    </label>
                    <HyperparameterDropdown
                        algo={algo}
                        paramName={paramName}
                        options={options}
                        readonly={readonly}
                        disabled={disabled}
                        onUpdate={onUpdate}
                        isEmpty={isEmpty}
                    />
                    {isEmpty && !hasError && (
                        <p className="text-xs text-[#EF4D5F] mt-1 pl-0.5">Please select a value</p>
                    )}
                    {hasError && <p className="text-xs text-[#EF4D5F] mt-1 pl-0.5">{hasError}</p>}
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
                    <label className={`block ${tw.sectionHeading} mb-2 capitalize`}>
                        {paramName.replace(/_/g, ' ')}
                    </label>
                    <input
                        type="text"
                        disabled={readonly || disabled}
                        value={algo.hyperparameterValues[paramName] || ''}
                        onChange={(e) => handleHyperparameterChange(paramName, paramValue, e.target.value)}
                        onBlur={(e) => handleHyperparameterBlur(paramName, paramValue, e.target.value)}
                        placeholder={`${paramValue.low} - ${paramValue.high}${specialText ? ` or ${specialText}` : ''}`}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-0 focus:border-[#8e78b7] ${showError
                            ? 'border-[#EF4D5F] bg-[#FFF7F8] placeholder-[#EF4D5F]'
                            : 'border-gray-300'
                            }`}
                    />
                    {isEmpty && !hasError && (
                        <p className="text-xs text-[#EF4D5F] mt-1 pl-0.5">Please enter a value</p>
                    )}
                    {hasError ? (
                        <p className="text-xs text-[#EF4D5F] mt-1 pl-0.5">{hasError}</p>
                    ) : !isEmpty && (
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
        const isEmpty = isFieldEmpty(paramName, paramValue);

        if (typeof paramValue === 'string') {
            const options = paramValue.split(',').map(opt => opt.trim());
            const selectedValues = (algo.gridSearchValues[paramName] || []).filter(v => v && v.trim() !== '');

            return (
                <div key={paramName}>
                    <div className="flex items-center justify-between mb-2">
                        <label className={`block ${tw.sectionHeading} capitalize`}>
                            {paramName.replace(/_/g, ' ')}
                        </label>
                        <span className="text-xs text-gray-400">{selectedValues.length}/{options.length}</span>
                    </div>

                    <GridSearchDropdown
                        algo={algo}
                        paramName={paramName}
                        paramValue={paramValue}
                        options={options}
                        readonly={readonly}
                        disabled={disabled}
                        onUpdate={onUpdate}
                        isEmpty={isEmpty}
                    />

                    {isEmpty && (
                        <p className="text-xs text-[#EF4D5F] mt-1 pl-0.5">Please select at least one value</p>
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
                <div key={paramName}>
                    <label className={`block ${tw.sectionHeading} mb-2 capitalize`}>
                        {paramName.replace(/_/g, ' ')}
                    </label>

                    <div className="space-y-2 p-0.5">
                        {values.map((value, index) => (
                            <div key={index} className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={value}
                                        disabled={readonly || disabled}
                                        onChange={(e) => updateGridSearchValue(paramName, index, e.target.value)}
                                        onBlur={(e) => validateGridSearchValue(paramName, paramValue, index, e.target.value)}
                                        placeholder={`${paramValue.low} - ${paramValue.high}${specialText ? ` or ${specialText}` : ''}`}
                                        className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-0 focus:border-[#8e78b7] text-sm bg-white shadow-sm ${errors[index]
                                            ? 'border-[#EF4D5F] bg-[#FFF7F8] placeholder-[#EF4D5F]'
                                            : isEmpty && index === 0
                                                ? 'border-[#EF4D5F] bg-[#FFF7F8] placeholder-[#EF4D5F]'
                                                : 'border-gray-300'
                                            }`}
                                    />
                                    {values.length > 1 && (
                                        <button
                                            onClick={() => removeGridSearchValue(paramName, index)}
                                            disabled={readonly || disabled}
                                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                {errors[index] && (
                                    <p className="text-xs text-[#EF4D5F] ml-1">{errors[index]}</p>
                                )}
                            </div>
                        ))}
                    </div>

                    {isEmpty && (
                        <p className="text-xs text-[#EF4D5F] mt-1 pl-0.5">Please enter at least one value</p>
                    )}

                    {!(readonly || disabled) && (
                        <button
                            onClick={() => addGridSearchValue(paramName)}
                            disabled={readonly || disabled || !allPreviousFieldsFilled || hasAnyErrors}
                            className={`mt-3 w-full px-3 py-2 border-2 border-dashed rounded-lg text-sm flex items-center justify-center gap-2 font-medium transition-colors ${!allPreviousFieldsFilled || hasAnyErrors
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

    // Determine if this card has any validation errors (for tab dot indicator only — no red card styling)
    const hasValidationErrors = showValidation && algo.enabled && (() => {
        if (algo.configMode === 'Base') return false;
        if (algo.configMode === 'Hyper Parameter') {
            if (algo.errors && Object.values(algo.errors).some(e => e)) return true;
            if (algo.hyperparameters) {
                return Object.entries(algo.hyperparameters).some(([paramName, paramValue]) => {
                    if (typeof paramValue === 'string') {
                        return !algo.hyperparameterValues[paramName] || algo.hyperparameterValues[paramName] === '';
                    } else if (typeof paramValue === 'object' && paramValue.low && paramValue.high) {
                        return !algo.hyperparameterValues[paramName] || algo.hyperparameterValues[paramName].trim() === '';
                    }
                    return false;
                });
            }
        }
        if (algo.configMode === 'Grid Search') {
            if (algo.gridSearchErrors && Object.values(algo.gridSearchErrors).some(errs => errs && errs.some(e => e))) return true;
            if (algo.hyperparameters) {
                return Object.entries(algo.hyperparameters).some(([paramName, paramValue]) => {
                    if (typeof paramValue === 'string') {
                        const vals = algo.gridSearchValues[paramName] || [];
                        return vals.filter(v => v && v.trim() !== '').length === 0;
                    } else if (typeof paramValue === 'object' && paramValue.low && paramValue.high) {
                        const vals = algo.gridSearchValues[paramName] || [];
                        return vals.filter(v => v && v.trim() !== '').length === 0;
                    }
                    return false;
                });
            }
        }
        return false;
    })();

    return (
        <div ref={cardRef} className="bg-[#FAFAFA] rounded">
            <div
                className={`flex items-center justify-between p-4 transition-colors ${algo.expanded ? 'bg-[#FAF8FF]' : 'bg-[#FAFAFA]'
                    }`}
            >
                <div className="flex items-center gap-2 flex-1">
                    <span className={`${tw.sectionHeading} font-medium`}>
                        {algo.name}
                    </span>
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
                                disabled={readonly || disabled}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8e78b7]"></div>
                    </label>
                    {algo.enabled && (
                        <button
                            onClick={() => onExpand(algo.id)}
                            disabled={readonly || disabled}
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
                <div className="p-4">
                    <div className="bg-white p-4 rounded">
                        {/* Configuration Mode — underline tab style */}
                        <div className={algo.configMode !== 'Base' ? 'mb-4' : ''}>
                            <label className={`block ${tw.sectionHeading} mb-3`}>Configuration Mode</label>
                            <div className="flex border-b border-gray-200">
                                {['Base', 'Hyper Parameter', 'Grid Search'].map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => handleConfigModeChange(mode)}
                                        disabled={readonly || disabled}
                                        className={`px-8 py-2 text-sm font-medium transition-colors relative focus:outline-none ${algo.configMode === mode
                                            ? 'text-[#8e78b7] bg-[#FAF8FF] rounded-t'
                                            : 'text-gray-500 hover:text-gray-700'
                                            } ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                        style={{ marginBottom: '-1px' }}
                                    >
                                        {mode}
                                        {algo.configMode === mode && (
                                            <span
                                                className="absolute bottom-0 left-0 right-0 h-[3px]"
                                                style={{ background: '#8e78b7' }}
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {algo.configMode === 'Hyper Parameter' && algo.hyperparameters && (
                            <div className="grid grid-cols-2 gap-4 px-1 mt-4">
                                {Object.entries(algo.hyperparameters).map(([paramName, paramValue]) =>
                                    renderHyperparameterField(paramName, paramValue)
                                )}
                            </div>
                        )}

                        {algo.configMode === 'Grid Search' && algo.hyperparameters && (
                            <div className="grid grid-cols-2 gap-4 mt-4">
                                {Object.entries(algo.hyperparameters).map(([paramName, paramValue]) =>
                                    renderGridSearchField(paramName, paramValue)
                                )}
                            </div>
                        )}

                    </div>
                </div>
            )
            }
        </div>
    );
}

export default AlgorithmCard;