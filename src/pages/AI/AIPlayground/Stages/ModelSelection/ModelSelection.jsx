import React, { useState, useEffect } from 'react';
import { AIPlaygroundLayout } from '../../AIPlaygroundLayout';
import { Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import algorithmsData from '../../../../../components/classification_models_hyperparameters.json';
import { useAIPlayground } from '../../../../../context/AIPlaygroundContext';
import { toast } from 'react-hot-toast';
import AlgorithmCard from './AlgorithmCard';
import SidePanel from './SidePanel';
import { validateAlgorithm } from './validationUtils';

const METRIC_NAME_MAPPING = {
    "Accuracy": "accuracy",
    "Precision": "precision",
    "Recall": "recall",
    "F1 Score": "f1",
    "Log Loss": "log_loss"
};

const REVERSE_METRIC_MAPPING = {
    "accuracy": "Accuracy",
    "precision": "Precision",
    "recall": "Recall",
    "f1": "F1 Score",
    "log_loss": "Log Loss"
};

function ModelSelection() {
    const hostnameAI = window._env_?.VITE_AI_API;
    const location = useLocation();
    const readonly = location.state?.mode === 'view';
    const { workflowState, datasetState, updateWorkflowStage } = useAIPlayground();

    const categorizeAlgorithms = () => {
        const categories = {};

        Object.entries(algorithmsData).forEach(([name, data]) => {
            const algo = {
                name,
                category: data.category,
                backend_key: data.backend_key || name,
                info: data.info || '',
                hyperparameters: data.hyperparameters,
                enabled: false,
                expanded: false,
                configMode: 'Base',
                hyperparameterValues: {},
                gridSearchValues: {},
                gridSearchErrors: {},
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

    const [allAlgorithmsState, setAllAlgorithmsState] = useState(() => {
        const categorized = categorizeAlgorithms();
        const allAlgos = {};

        Object.entries(categorized).forEach(([category, algos]) => {
            algos.forEach((algo) => {
                const uniqueKey = `${category}-${algo.name}`;
                allAlgos[uniqueKey] = {
                    ...algo,
                    id: uniqueKey,
                    category: category
                };
            });
        });

        return allAlgos;
    });

    const algorithms = Object.values(allAlgorithmsState).filter(algo => {
        const matchesCategory = algo.category === selectedTab;
        // In readonly mode, only show enabled algorithms
        if (readonly) {
            return matchesCategory && algo.enabled;
        }
        return matchesCategory;
    });

    const [normalizeData, setNormalizeData] = useState(true);
    const [isModelInferencingEnabled, setIsModelInferencingEnabled] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [metrics, setMetrics] = useState([
        { name: 'Accuracy', enabled: false },
        { name: 'Precision', enabled: false },
        { name: 'Recall', enabled: false },
        { name: 'F1 Score', enabled: false },
        { name: 'Log Loss', enabled: false }
    ]);

    const [searchQuery, setSearchQuery] = useState('');

    const filteredAlgorithms = algorithms.filter(algo =>
        algo.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredCategories = allCategories.filter(category => {
        const categorized = categorizeAlgorithms();
        const categoryAlgorithms = categorized[category];
        
        if (readonly) {
            return categoryAlgorithms.some(algo => {
                const matchesSearch = algo.name.toLowerCase().includes(searchQuery.toLowerCase());
                const algoState = Object.values(allAlgorithmsState).find(a => a.backend_key === (algo.backend_key || algo.name));
                return matchesSearch && algoState?.enabled;
            });
        }

        return categoryAlgorithms.some(algo =>
            algo.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    });

    useEffect(() => {
        const savedConfig = workflowState?.modelSelection?.config;
        
        if (!savedConfig) return;

        if (savedConfig.normalize !== undefined) {
            setNormalizeData(savedConfig.normalize);
        }

        if (savedConfig.performance_metrics && Array.isArray(savedConfig.performance_metrics)) {
            setMetrics(prevMetrics => 
                prevMetrics.map(metric => ({
                    ...metric,
                    enabled: savedConfig.performance_metrics.includes(
                        METRIC_NAME_MAPPING[metric.name]
                    )
                }))
            );
        }

        if (savedConfig.algorithms && Array.isArray(savedConfig.algorithms)) {
            setAllAlgorithmsState(prevState => {
                const updatedState = { ...prevState };

                Object.keys(updatedState).forEach(key => {
                    updatedState[key] = {
                        ...updatedState[key],
                        enabled: false,
                        expanded: false
                    };
                });

                savedConfig.algorithms.forEach(algoBackendKey => {
                    const algoEntry = Object.entries(updatedState).find(
                        ([_, algo]) => algo.backend_key === algoBackendKey
                    );

                    if (algoEntry) {
                        const [algoId, algo] = algoEntry;
                        
                        let configMode = 'Base';
                        const hyperparameterMode = savedConfig.hyperparameter_modes?.[algoBackendKey];
                        
                        if (hyperparameterMode === 'user_params') {
                            configMode = 'Hyper Parameter';
                        } else if (hyperparameterMode === 'grid_search') {
                            configMode = 'Grid Search';
                        }

                        const paramGridValues = savedConfig.param_grid?.[algoBackendKey] || {};
                        
                        let hyperparameterValues = {};
                        let gridSearchValues = {};
                        let gridSearchErrors = {};

                        if (configMode === 'Hyper Parameter') {
                            hyperparameterValues = Object.entries(paramGridValues).reduce((acc, [key, value]) => {
                                acc[key] = String(value);
                                return acc;
                            }, {});
                        } else if (configMode === 'Grid Search') {
                            gridSearchValues = Object.entries(paramGridValues).reduce((acc, [key, value]) => {
                                if (Array.isArray(value)) {
                                    acc[key] = value.map(v => String(v));
                                } else {
                                    acc[key] = [String(value)];
                                }
                                return acc;
                            }, {});

                            gridSearchErrors = Object.keys(gridSearchValues).reduce((acc, key) => {
                                acc[key] = gridSearchValues[key].map(() => null);
                                return acc;
                            }, {});
                        }

                        updatedState[algoId] = {
                            ...updatedState[algoId],
                            enabled: true,
                            expanded: false,
                            configMode,
                            hyperparameterValues,
                            gridSearchValues,
                            gridSearchErrors
                        };
                    }
                });

                return updatedState;
            });

            if (readonly && savedConfig.algorithms.length > 0) {
                const firstEnabledAlgo = Object.values(allAlgorithmsState).find(algo => 
                    savedConfig.algorithms.includes(algo.backend_key)
                );
                if (firstEnabledAlgo) {
                    setSelectedTab(firstEnabledAlgo.category);
                }
            }
        }
    }, [workflowState?.modelSelection?.config, readonly]);

    useEffect(() => {
        if (searchQuery && filteredCategories.length > 0) {
            if (!filteredCategories.includes(selectedTab)) {
                setSelectedTab(filteredCategories[0]);
            }
        }
    }, [searchQuery, filteredCategories, selectedTab]);

    useEffect(() => {
        const enabledAlgos = Object.values(allAlgorithmsState).filter(algo => algo.enabled);
        const hasEnabledMetrics = metrics.some(m => m.enabled);
        
        if (enabledAlgos.length === 0 || !hasEnabledMetrics) {
            setIsModelInferencingEnabled(false);
            return;
        }

        const allValid = enabledAlgos.every(algo => validateAlgorithm(algo));
        setIsModelInferencingEnabled(allValid);
    }, [allAlgorithmsState, metrics]);

    const updateAlgorithmState = (algoId, updates) => {
        setAllAlgorithmsState(prevState => ({
            ...prevState,
            [algoId]: {
                ...prevState[algoId],
                ...updates
            }
        }));
    };

    const handleTabChange = (tab) => {
        setSelectedTab(tab);
    };

    const toggleAlgorithm = (id) => {
        if (readonly) return;
        const algo = allAlgorithmsState[id];
        const newEnabled = !algo.enabled;

        let initializedGridSearchValues = { ...algo.gridSearchValues };
        let initializedGridSearchErrors = { ...algo.gridSearchErrors };

        if (newEnabled && algo.hyperparameters) {
            Object.keys(algo.hyperparameters).forEach(paramName => {
                if (!initializedGridSearchValues[paramName] || initializedGridSearchValues[paramName].length === 0) {
                    initializedGridSearchValues[paramName] = [''];
                    initializedGridSearchErrors[paramName] = [null];
                }
            });
        }

        const updates = {};
        Object.keys(allAlgorithmsState).forEach(key => {
            if (key === id) {
                updates[key] = {
                    ...allAlgorithmsState[key],
                    enabled: newEnabled,
                    expanded: newEnabled,
                    gridSearchValues: initializedGridSearchValues,
                    gridSearchErrors: initializedGridSearchErrors
                };
            } else {
                updates[key] = {
                    ...allAlgorithmsState[key],
                    expanded: false
                };
            }
        });

        setAllAlgorithmsState(updates);
    };

    const toggleExpanded = (id) => {
        const updates = {};
        Object.keys(allAlgorithmsState).forEach(key => {
            if (key === id) {
                updates[key] = {
                    ...allAlgorithmsState[key],
                    expanded: !allAlgorithmsState[key].expanded
                };
            } else {
                updates[key] = {
                    ...allAlgorithmsState[key],
                    expanded: false
                };
            }
        });

        setAllAlgorithmsState(updates);
    };

    const buildPayload = () => {
        const enabledAlgorithms = Object.values(allAlgorithmsState).filter(algo => algo.enabled);

        const algorithmNames = enabledAlgorithms.map(algo => algo.backend_key);

        const hyperparameterMode = {};
        enabledAlgorithms.forEach(algo => {
            if (algo.configMode === 'Base') {
                hyperparameterMode[algo.backend_key] = 'base';
            } else if (algo.configMode === 'Hyper Parameter') {
                hyperparameterMode[algo.backend_key] = 'user_params';
            } else if (algo.configMode === 'Grid Search') {
                hyperparameterMode[algo.backend_key] = 'grid_search';
            }
        });

        const paramGrid = {};
        enabledAlgorithms.forEach(algo => {
            if (algo.configMode === 'Hyper Parameter') {
                if (algo.hyperparameterValues && Object.keys(algo.hyperparameterValues).length > 0) {
                    paramGrid[algo.backend_key] = {};
                    Object.entries(algo.hyperparameterValues).forEach(([paramName, value]) => {
                        if (value && value.trim() !== '') {
                            const numValue = parseFloat(value);
                            paramGrid[algo.backend_key][paramName] = isNaN(numValue) ? value : numValue;
                        }
                    });
                }
            } else if (algo.configMode === 'Grid Search') {
                if (algo.gridSearchValues && Object.keys(algo.gridSearchValues).length > 0) {
                    paramGrid[algo.backend_key] = {};
                    Object.entries(algo.gridSearchValues).forEach(([paramName, values]) => {
                        const validValues = values.filter(v => v && v.trim() !== '');
                        if (validValues.length > 0) {
                            paramGrid[algo.backend_key][paramName] = validValues.map(v => {
                                const numValue = parseFloat(v);
                                return isNaN(numValue) ? v : numValue;
                            });
                        }
                    });
                }
            }
        });

        const performanceMetrics = metrics
            .filter(m => m.enabled)
            .map(m => METRIC_NAME_MAPPING[m.name] || m.name.toLowerCase());

        const finalParamGrid = Object.keys(paramGrid).length > 0 ? paramGrid : {
            "additionalProp1": {
                "additionalProp1": {}
            },
            "additionalProp2": {
                "additionalProp1": {}
            },
            "additionalProp3": {
                "additionalProp1": {}
            }
        };

        const payload = {
            session_id: datasetState?.sessionId,
            algorithms: algorithmNames,
            hyperparameter_mode: hyperparameterMode,
            param_grid: finalParamGrid,
            normalize: normalizeData,
            return_metrics: true,
            scoring: 'accuracy',
            performance_metrics: performanceMetrics.length > 0 ? performanceMetrics : ['accuracy'],
            test_size: 0.2,
            random_state: 42,
            shuffle: true
        };

        return payload;
    };

    const handleNextClick = async () => {
        if (readonly) return true;
        if (isSubmitting) return false;

        setIsSubmitting(true);

        try {
            const payload = buildPayload();

            const response = await fetch(`${hostnameAI}/model/train`, {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `API error: ${response.status}`);
            }

            const result = await response.json();

            updateWorkflowStage('modelSelection', {
                config: {
                    algorithms: Object.values(allAlgorithmsState).filter(algo => algo.enabled),
                    normalizeData,
                    metrics,
                    payload
                },
                apiResponse: result
            });

            toast.success('Model training completed successfully!', {
                duration: 3000,
                position: 'top-right',
            });

            return true;
        } catch (error) {
            console.error('Model training error:', error);
            toast.error(error.message || 'Model training failed. Please try again.', {
                duration: 4000,
                position: 'top-right',
            });
            return false;
        } finally {
            setIsSubmitting(false);
        }
    };

    const hasEnabledMetrics = metrics.some(m => m.enabled);

    return (
        <AIPlaygroundLayout
            isNextDisabled={!isModelInferencingEnabled || isSubmitting}
            onNextClick={handleNextClick}
        >
            <style>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #c4b5d6;
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #8e78b7;
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
                                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent text-sm"
                                />
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            </div>
                        </div>
                        {filteredCategories.length > 0 && (
                            <div className="relative">
                                <div className="overflow-x-auto scrollbar-hide">
                                    <div className="flex gap-4 min-w-max border-b border-gray-200">
                                        {filteredCategories.map((category) => (
                                            <button
                                                key={category}
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
                        )}
                    </div>

                    <div className="space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto pr-2 custom-scrollbar">
                        {filteredAlgorithms.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500 text-sm">No algorithms found matching "{searchQuery}"</p>
                            </div>
                        ) : (
                            filteredAlgorithms.map((algo) => (
                                <AlgorithmCard
                                    key={algo.id}
                                    algo={algo}
                                    readonly={readonly}
                                    onToggle={toggleAlgorithm}
                                    onExpand={toggleExpanded}
                                    onUpdate={updateAlgorithmState}
                                />
                            ))
                        )}
                    </div>
                </div>

                <SidePanel
                    normalizeData={normalizeData}
                    setNormalizeData={setNormalizeData}
                    metrics={metrics}
                    setMetrics={setMetrics}
                    readonly={readonly}
                    hasEnabledMetrics={hasEnabledMetrics}
                />
            </div>
        </AIPlaygroundLayout>
    );
}

export default ModelSelection;