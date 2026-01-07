import React, { useState, useEffect } from 'react';
import { AIPlaygroundLayout } from '../AIPlaygroundLayout';
import { ChevronDown, ChevronUp, GripVertical, Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import algorithmsData from '../../../../components/classification_models_hyperparameters.json';

function ModelSelection() {
    const location = useLocation();
    const readonly = location.state?.mode === 'view';

    const categorizeAlgorithms = () => {
        const categories = {};

        Object.entries(algorithmsData).forEach(([name, data]) => {
            const algo = {
                name,
                category: data.category,
                hyperparameters: data.hyperparameters,
                enabled: false,
                expanded: false,
                hyperparameterValues: {},
                errors: {}
            };

            const category = data.category;
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push(algo);
        });

        return categories;
    };

    const allCategories = Object.keys(categorizeAlgorithms());
    const [selectedTab, setSelectedTab] = useState(allCategories[0] || 'Linear');
    const [algorithms, setAlgorithms] = useState(() => {
        const categorized = categorizeAlgorithms();
        const firstCategory = allCategories[0] || 'Linear';
        return (categorized[firstCategory] || []).map((algo, index) => ({
            ...algo,
            id: index + 1
        }));
    });

    const [configMode, setConfigMode] = useState('Base');
    const [normalizeData, setNormalizeData] = useState(true);
    const [isModelInferencingEnabled, setIsModelInferencingEnabled] = useState(false);

    const [metrics, setMetrics] = useState([
        { name: 'Accuracy', enabled: false },
        { name: 'Precision', enabled: false },
        { name: 'Recall', enabled: false },
        { name: 'F1 Score', enabled: false },
        { name: 'Log Loss', enabled: false }
    ]);

    const [metricsExpanded, setMetricsExpanded] = useState(true);
    const [draggedItem, setDraggedItem] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Filter algorithms based on search query
    const filteredAlgorithms = algorithms.filter(algo =>
        algo.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Check if model inferencing should be enabled
    useEffect(() => {
        const enabledAlgos = algorithms.filter(algo => algo.enabled);

        if (enabledAlgos.length === 0) {
            setIsModelInferencingEnabled(false);
            return;
        }

        // Check if all enabled algorithms have valid inputs
        const allValid = enabledAlgos.every(algo => {
            // If in Base mode, no validation needed
            if (configMode === 'Base') {
                return true;
            }

            // Check if there are any errors
            if (algo.errors && Object.keys(algo.errors).length > 0) {
                const hasErrors = Object.values(algo.errors).some(error => error !== null && error !== '');
                if (hasErrors) return false;
            }

            // Check if all required hyperparameters have values
            if (algo.hyperparameters) {
                for (const [paramName, paramValue] of Object.entries(algo.hyperparameters)) {
                    const value = algo.hyperparameterValues[paramName];

                    // For dropdowns (string type), must have a value
                    if (typeof paramValue === 'string') {
                        if (!value || value === '') {
                            return false;
                        }
                    }
                    // For text inputs (object with range), can be empty but if filled must be valid
                    else if (typeof paramValue === 'object' && paramValue.low && paramValue.high) {
                        if (value && value.trim() !== '') {
                            // Has value, check if valid
                            if (!validateHyperparameterValue(paramName, paramValue, value, true)) {
                                return false;
                            }
                        }
                        // Empty is ok for range inputs
                    }
                }
            }

            return true;
        });

        setIsModelInferencingEnabled(allValid);
    }, [algorithms, configMode]);

    const validateHyperparameterValue = (paramName, paramValue, value, silent = false) => {
        if (!value || value.trim() === '') {
            return true; // Allow empty values
        }

        if (typeof paramValue === 'object' && paramValue.low && paramValue.high) {
            const trimmedValue = value.trim();

            // Check if it's a special value
            if (paramValue.special) {
                const specialValues = Array.isArray(paramValue.special)
                    ? paramValue.special
                    : [paramValue.special];

                if (specialValues.some(sv => sv.toLowerCase() === trimmedValue.toLowerCase())) {
                    return true;
                }
            }

            // Check if it's a numeric value within range
            const numValue = parseFloat(trimmedValue);
            if (isNaN(numValue)) {
                if (!silent) {
                    const specialText = paramValue.special
                        ? Array.isArray(paramValue.special)
                            ? paramValue.special.join(', ')
                            : paramValue.special
                        : '';
                    return `Must be a number between ${paramValue.low} and ${paramValue.high}${specialText ? ` or ${specialText}` : ''}`;
                }
                return false;
            }

            const low = parseFloat(paramValue.low);
            const high = parseFloat(paramValue.high);

            if (numValue < low || numValue > high) {
                if (!silent) {
                    const specialText = paramValue.special
                        ? Array.isArray(paramValue.special)
                            ? paramValue.special.join(', ')
                            : paramValue.special
                        : '';
                    return `Value must be between ${paramValue.low} and ${paramValue.high}${specialText ? ` (or ${specialText})` : ''}`;
                }
                return false;
            }
        }

        return true;
    };

    const handleHyperparameterChange = (algoId, paramName, paramValue, newValue) => {
        setAlgorithms(algorithms.map(algo => {
            if (algo.id === algoId) {
                // Clear error when user starts typing
                const newErrors = { ...algo.errors };
                delete newErrors[paramName];

                return {
                    ...algo,
                    hyperparameterValues: {
                        ...algo.hyperparameterValues,
                        [paramName]: newValue
                    },
                    errors: newErrors
                };
            }
            return algo;
        }));
    };

    const handleHyperparameterBlur = (algoId, paramName, paramValue, currentValue) => {
        if (currentValue && currentValue.trim() !== '') {
            const validationResult = validateHyperparameterValue(paramName, paramValue, currentValue);

            if (validationResult !== true) {
                // Set error
                setAlgorithms(algorithms.map(algo => {
                    if (algo.id === algoId) {
                        return {
                            ...algo,
                            errors: {
                                ...algo.errors,
                                [paramName]: validationResult
                            }
                        };
                    }
                    return algo;
                }));
            }
        }
    };

    const handleTabChange = (tab) => {
        if (readonly) return;
        setSelectedTab(tab);
        const categorized = categorizeAlgorithms();
        setAlgorithms(categorized[tab].map((algo, index) => ({
            ...algo,
            id: index + 1
        })));
    };

    const toggleAlgorithm = (id) => {
        if (readonly) return;
        setAlgorithms(algorithms.map(algo => {
            if (algo.id === id) {
                const newEnabled = !algo.enabled;
                return { ...algo, enabled: newEnabled, expanded: newEnabled };
            }
            return { ...algo, expanded: false };
        }));
    };

    const toggleExpanded = (id) => {
        if (readonly) return;
        setAlgorithms(algorithms.map(algo => {
            if (algo.id === id) {
                return { ...algo, expanded: !algo.expanded };
            }
            return { ...algo, expanded: false };
        }));
    };

    const toggleMetric = (index) => {
        if (readonly) return;
        setMetrics(metrics.map((metric, i) =>
            i === index ? { ...metric, enabled: !metric.enabled } : metric
        ));
    };

    const handleDragStart = (e, index) => {
        if (readonly) return;
        setDraggedItem(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, index) => {
        if (readonly) return;
        e.preventDefault();
        if (draggedItem === null || draggedItem === index) return;

        const newMetrics = [...metrics];
        const draggedMetric = newMetrics[draggedItem];
        newMetrics.splice(draggedItem, 1);
        newMetrics.splice(index, 0, draggedMetric);

        setMetrics(newMetrics);
        setDraggedItem(index);
    };

    const handleDragEnd = () => {
        if (readonly) return;
        setDraggedItem(null);
    };

    const renderHyperparameterField = (algo, paramName, paramValue) => {
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
                        onChange={(e) => handleHyperparameterChange(algo.id, paramName, paramValue, e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent ${hasError ? 'border-red-500' : 'border-gray-300'
                            }`}
                    >
                        <option value="">Select</option>
                        {options.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                    {hasError && (
                        <p className="text-xs text-red-600 mt-1">{hasError}</p>
                    )}
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
                        onChange={(e) => handleHyperparameterChange(algo.id, paramName, paramValue, e.target.value)}
                        onBlur={(e) => handleHyperparameterBlur(algo.id, paramName, paramValue, e.target.value)}
                        placeholder={`${paramValue.low} - ${paramValue.high}${specialText ? ` or ${specialText}` : ''}`}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent ${hasError ? 'border-red-500' : 'border-gray-300'
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

    return (
        <AIPlaygroundLayout isNextDisabled={!isModelInferencingEnabled}>
            <style>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-200">
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Algorithms</h3>
                            <div className="relative w-64">
                                <input
                                    type="text"
                                    placeholder="Search algorithms..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    disabled={readonly}
                                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent text-sm"
                                />
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            </div>
                        </div>
                        <div className="relative">
                            <div className="overflow-x-auto scrollbar-hide">
                                <div className="flex gap-4 min-w-max border-b border-gray-200">
                                    {allCategories.map((category) => (
                                        <button
                                            key={category}
                                            disabled={readonly}
                                            onClick={() => handleTabChange(category)}
                                            className={`px-4 py-2 font-medium whitespace-nowrap ${selectedTab === category
                                                ? 'text-[#8e78b7] border-b-4 border-[#8e78b7]'
                                                : 'text-gray-600 hover:text-gray-900'
                                                }`}
                                        >
                                            {category}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
                        </div>
                    </div>

                    {/* Algorithm List */}
                    <div className="space-y-4">
                        {filteredAlgorithms.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500 text-sm">No algorithms found matching "{searchQuery}" in {selectedTab}</p>
                            </div>
                        ) : (
                            filteredAlgorithms.map((algo) => (
                                <div key={algo.id} className="bg-gray-50 border border-gray-200 rounded-lg">
                                    <div className="flex items-center justify-between p-4">
                                        <span className="font-medium text-gray-900">{algo.name}</span>
                                        <div className="flex items-center gap-3">
                                            <label className={`relative inline-flex items-center ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={algo.enabled}
                                                    onChange={() => toggleAlgorithm(algo.id)}
                                                    disabled={readonly}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8e78b7]"></div>
                                            </label>
                                            <button
                                                onClick={() => toggleExpanded(algo.id)}
                                                disabled={readonly}
                                                className="text-gray-400 hover:text-gray-600"
                                            >
                                                {algo.expanded ? (
                                                    <ChevronUp className='w-5 h-5' />
                                                ) : (
                                                    <ChevronDown className='w-5 h-5' />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {algo.expanded && (
                                        <div className="bg-white p-4 border-t border-gray-200">
                                            <div className={configMode !== 'Base' ? 'mb-4' : ''}>
                                                <label className="block text-sm font-medium text-gray-900 mb-4">Configuration Mode</label>
                                                <div className="flex gap-4">
                                                    {['Base', 'Hyper Parameter'].map((mode) => (
                                                        <button
                                                            key={mode}
                                                            onClick={() => !readonly && setConfigMode(mode)}
                                                            disabled={readonly}
                                                            className={`px-6 py-1 text-sm font-medium rounded-lg border transition-colors ${configMode === mode
                                                                ? 'bg-[#8e78b7] text-white border-[#8e78b7]'
                                                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                                }
                                                        ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                                        >
                                                            {mode}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {configMode !== 'Base' && algo.hyperparameters && (
                                                <div className="grid grid-cols-2 gap-4">
                                                    {Object.entries(algo.hyperparameters).map(([paramName, paramValue]) =>
                                                        renderHyperparameterField(algo, paramName, paramValue)
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-start justify-between mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">Normalise Data</h3>
                            <label className={`relative inline-flex items-center ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                                <input
                                    type="checkbox"
                                    checked={normalizeData}
                                    onChange={(e) => !readonly && setNormalizeData(e.target.checked)}
                                    disabled={readonly}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8e78b7]"></div>
                            </label>
                        </div>
                        <p className="text-sm text-gray-600">Scale Features to standard range before training</p>
                        <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                            <p className="text-xs text-gray-700">
                                <span className="font-medium">Note:</span> If a feature scaler has already been applied during data pre-processing, you do not need to normalise the data again.
                            </p>
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900">Metrics</h3>
                                <p className="text-sm text-gray-600">Measure how your model performs.</p>
                            </div>
                            <button
                                onClick={() => !readonly && setMetricsExpanded(!metricsExpanded)}
                                disabled={readonly}
                                className="text-gray-400 hover:text-gray-600 ml-4"
                            >
                                {metricsExpanded ? (
                                    <ChevronUp className='w-5 h-5' />
                                ) : (
                                    <ChevronDown className='w-5 h-5' />
                                )}
                            </button>
                        </div>

                        {metricsExpanded && (
                            <>
                                <p className="text-sm text-gray-700 mb-4">
                                    Enable the toggle to set metric priorities. Drag metrics to reorder (P1, P2, P3...).
                                </p>

                                <div className="space-y-3">
                                    {metrics.map((metric, index) => (
                                        <div
                                            key={index}
                                            draggable={!readonly}
                                            onDragStart={(e) => handleDragStart(e, index)}
                                            onDragOver={(e) => handleDragOver(e, index)}
                                            onDragEnd={handleDragEnd}
                                            className={`flex items-center gap-3 p-3 rounded-lg border border-gray-200 ${readonly ? 'cursor-not-allowed' : 'cursor-move'
                                                } bg-white transition-colors ${draggedItem === index ? 'opacity-50' : ''
                                                }`}
                                        >
                                            <span className="text-md font-medium text-[#8e78b7] w-8">P{index + 1}</span>
                                            <GripVertical className="w-5 h-5 text-gray-400" />
                                            <span className="flex-1 text-sm font-medium text-gray-900">{metric.name}</span>
                                            <label className={`relative inline-flex items-center ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={metric.enabled}
                                                    onChange={() => toggleMetric(index)}
                                                    disabled={readonly}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8e78b7]"></div>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </AIPlaygroundLayout>
    );
}

export default ModelSelection;