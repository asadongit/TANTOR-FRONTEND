import React, { useState, useEffect, useRef } from 'react';
import { AIPlaygroundLayout } from '../../AIPlaygroundLayout';
import { Search } from 'lucide-react';
import classificationAlgorithmsData from '../../../../../components/classification_models_hyperparameters.json';
import regressionAlgorithmsData from '../../../../../components/regression_models_hyperparameters.json';
import univariateAlgorithmsData from '../../../../../components/univariate_models_hyperparameter.json';
import multivariateAlgorithmsData from '../../../../../components/multivariate_models_hyperparameter.json';
import { useAIPlayground } from '../../../../../context/AIPlaygroundContext';
import { toast } from 'react-hot-toast';
import AlgorithmCard from './AlgorithmCard';
import SidePanel from './SidePanel';
import {
    isNestedParameter,
    validateAlgorithm
} from './validationUtils';
import { useLocation, useNavigate } from 'react-router-dom';
import { tw } from '../../../../../components/themeContext';

// Classification metrics
const CLASSIFICATION_METRIC_NAME_MAPPING = {
    "Accuracy": "accuracy",
    "Precision": "precision",
    "Recall": "recall",
    "F1 Score": "f1",
    "Log Loss": "log_loss"
};

const TIMESERIES_METRICS = [
    { name: 'MAE', enabled: false },
    { name: 'RMSE', enabled: false },
    { name: 'MAPE', enabled: false },
    { name: 'SMAPE', enabled: false },
    { name: 'WMAPE', enabled: false },
    { name: 'MASE', enabled: false }
];

const CLASSIFICATION_REVERSE_METRIC_MAPPING = {
    "accuracy": "Accuracy",
    "precision": "Precision",
    "recall": "Recall",
    "f1": "F1 Score",
    "log_loss": "Log Loss"
};



const REGRESSION_METRIC_FULL_FORM = {
    "MAE": "Mean Absolute Error",
    "MSE": "Mean Squared Error",
    "RMSE": "Root Mean Squared Error",
    "R²": "Coefficient of Determination",
    "MAPE": "Mean Absolute Percentage Error",
    "Quantile Loss": "Quantile Loss (used for asymmetric error penalties)",
    "Huber Loss": "Huber Loss (robust to outliers, combines MAE & MSE)"
};

// Regression metrics
const REGRESSION_METRIC_NAME_MAPPING = {
    "MAE": "mae",
    "MSE": "mse",
    "RMSE": "rmse",
    "R²": "r2",
    "MAPE": "mape",
    "Quantile Loss": "quantile_loss",
    "Huber Loss": "huber_loss"
};

const REGRESSION_REVERSE_METRIC_MAPPING = {
    "mae": "MAE",
    "mse": "MSE",
    "rmse": "RMSE",
    "r2": "R²",
    "mape": "MAPE",
    "quantile_loss": "Quantile Loss",
    "huber_loss": "Huber Loss"
};


const TIMESERIES_METRIC_NAME_MAPPING = {
    "MAE": "mae",
    "RMSE": "rmse",
    "MAPE": "mape",
    "SMAPE": "smape",
    "WMAPE": "wmape",
    "MASE": "mase"
};

const TIMESERIES_REVERSE_METRIC_MAPPING = {
    "mae": "MAE",
    "rmse": "RMSE",
    "mape": "MAPE",
    "smape": "SMAPE",
    "wmape": "WMAPE",
    "mase": "MASE"
};

const CLASSIFICATION_MANDATORY_METRICS = ['confusion_matrix'];

const toMetricBackendKey = (metric) => {
    const normalized = String(metric || '').trim().toLowerCase();
    if (normalized.startsWith('train_')) return normalized.slice(6);
    if (normalized.startsWith('test_')) return normalized.slice(5);
    return normalized;
};

const toPayloadValue = (value) => {
    const stringValue = String(value).trim();
    if (stringValue === 'true') return true;
    if (stringValue === 'false') return false;
    if (stringValue === 'null') return null;
    const numericValue = Number(stringValue);
    return stringValue !== '' && Number.isFinite(numericValue)
        ? numericValue
        : value;
};

function ModelSelection() {
    const hostnameAI = window._env_?.VITE_AI_API;
    const location = useLocation();
    const { workflowsState, activeWorkflowId, datasetState, updateWorkflowStage, mode } = useAIPlayground();
    const workflowState = activeWorkflowId
    ? workflowsState[activeWorkflowId]
    : null;  
    const readonly = mode === 'view';
    const navigate = useNavigate();
    const currentWorkflowId = workflowState?.workflow_id || activeWorkflowId;
    const modelGenesisConfig = workflowState?.modelGenesis?.config;
    const modelSelectionMode = modelGenesisConfig?.model_mode || modelGenesisConfig?.modelSelection;
    const isModelSelectionAuto = modelSelectionMode &&
        ['Swift', 'Standard', 'Comprehensive'].includes(modelSelectionMode);

    // Determine if this is a regression or classification problem.
    // In view mode, saved config typically stores `modelling_type`.
    const classificationType = modelGenesisConfig?.modelling_type || modelGenesisConfig?.classification;
    const isRegression = String(classificationType || '').trim().toLowerCase() === 'regression';
    const predictionType =
    modelGenesisConfig?.modelling_type ||
    modelGenesisConfig?.predictionType ||'';
    const timeseriesType = modelGenesisConfig?.timeseries_type || modelGenesisConfig?.timeSeriesType || modelGenesisConfig?.modelling_type || '';
    const isTimeSeries =
    String(predictionType).trim().toLowerCase() === 'time series' ||
    String(predictionType).trim().toLowerCase() === 'timeseries' ||
    String(predictionType).trim().toLowerCase() === 'univariate_timeseries' ||
    String(predictionType).trim().toLowerCase() === 'multivariate_timeseries';

    const isUnivariate =
    String(timeseriesType).trim().toLowerCase() ===
    'Univariate' || String(timeseriesType).trim().toLowerCase() === 'univariate' || String(timeseriesType).trim().toLowerCase() === 'univariate_timeseries' ;

    const isMultivariate =
        String(timeseriesType).trim().toLowerCase() ===
        'Multivariate' || String(timeseriesType).trim().toLowerCase() === 'multivariate' || String(timeseriesType).trim().toLowerCase() === 'multivariate_timeseries';
    let algorithmData;
    if (isUnivariate) {
    algorithmData = univariateAlgorithmsData;
}
else if (isMultivariate) {
    algorithmData = multivariateAlgorithmsData;
}
else if (isRegression) {
    algorithmData = regressionAlgorithmsData;
}
else {
    algorithmData = classificationAlgorithmsData;
}
    


    const METRIC_NAME_MAPPING = isTimeSeries
    ? TIMESERIES_METRIC_NAME_MAPPING
    : isRegression
        ? REGRESSION_METRIC_NAME_MAPPING
        : CLASSIFICATION_METRIC_NAME_MAPPING;

const REVERSE_METRIC_MAPPING = isTimeSeries
    ? TIMESERIES_REVERSE_METRIC_MAPPING
    : isRegression
        ? REGRESSION_REVERSE_METRIC_MAPPING
        : CLASSIFICATION_REVERSE_METRIC_MAPPING;

    // Tracks whether user has attempted to proceed (triggers inline validation)
    const [showValidation, setShowValidation] = useState(false);

    // Refs map: algoId → DOM element, for scroll-to-error
    const cardRefs = useRef({});

    useEffect(() => {
        if (datasetState.ensembleId == '') {
            navigate('/ai/playground')
        }
    }, []);

    const categorizeAlgorithms = () => {
        const categories = {};

        Object.entries(algorithmData).forEach(([name, data]) => {
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

    const buildAllAlgorithmsState = () => {
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
    };

    const allCategories = Object.keys(categorizeAlgorithms());
    const [selectedTab, setSelectedTab] = useState(allCategories[0] || 'Linear');

    const [allAlgorithmsState, setAllAlgorithmsState] = useState(() => buildAllAlgorithmsState());

    const algorithms = Object.values(allAlgorithmsState).filter(algo => {
        const matchesCategory = algo.category === selectedTab;
        if (readonly) {
            return matchesCategory && algo.enabled;
        }
        return matchesCategory;
    });

    const [normalizeData, setNormalizeData] = useState(false);
    const [forecastHorizon, setForecastHorizon] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isInteractionLocked = readonly || isSubmitting;

    // Initialize metrics based on problem type
    const getInitialMetrics = () => {
    if (isTimeSeries) {
    return TIMESERIES_METRICS;
}

    if (isRegression) {
        return [
            { name: 'MAE', enabled: false },
            { name: 'MAPE', enabled: false },
            { name: 'RMSE', enabled: false },
            { name: 'R²', enabled: false },
            { name: 'Quantile Loss', enabled: false },
            { name: 'Huber Loss', enabled: false }
        ];
    }

    return [
        { name: 'Accuracy', enabled: false },
        { name: 'Precision', enabled: false },
        { name: 'Recall', enabled: false },
        { name: 'F1 Score', enabled: false },
        { name: 'Log Loss', enabled: false }
    ];
};
    const [metrics, setMetrics] = useState(getInitialMetrics());

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
        const rebuiltState = buildAllAlgorithmsState();
        setAllAlgorithmsState(rebuiltState);

        const categories = Object.keys(categorizeAlgorithms());
        setSelectedTab(prevTab => (categories.includes(prevTab) ? prevTab : (categories[0] || 'Linear')));
    }, [isRegression, isTimeSeries]);

    useEffect(() => {
        const savedConfig = workflowState?.modelSelection?.config;
        if (!savedConfig) return;
        if (savedConfig.normalize !== undefined) {
            setNormalizeData(savedConfig.normalize);
        }
        if (savedConfig.forecast) {
                setForecastHorizon(
                    String(savedConfig.forecast)
                );
            }
        if (savedConfig.performance_metrics && Array.isArray(savedConfig.performance_metrics)) {
            const reverseMap = isTimeSeries
                ? TIMESERIES_REVERSE_METRIC_MAPPING
                : isRegression
                    ? REGRESSION_REVERSE_METRIC_MAPPING
                    : CLASSIFICATION_REVERSE_METRIC_MAPPING;
                

            const nameMap = isTimeSeries
                ? TIMESERIES_METRIC_NAME_MAPPING
                : isRegression
                    ? REGRESSION_METRIC_NAME_MAPPING
                    : CLASSIFICATION_METRIC_NAME_MAPPING;
            
            const initialMetrics = getInitialMetrics();
            const byName = new Map(initialMetrics.map(metric => [metric.name, metric]));

            const backendToDisplay = savedConfig.performance_metrics
                .map((backendName) => {
                    const key = toMetricBackendKey(backendName);
                    if (reverseMap[key]) return reverseMap[key];

                    const matchedDisplay = Object.keys(nameMap).find(
                        (displayName) => displayName.toLowerCase() === String(backendName || '').trim().toLowerCase()
                    );
                    return matchedDisplay || null;
                })
                .filter(Boolean);

            const orderedMetrics = [];
            const seen = new Set();

            backendToDisplay.forEach((displayName) => {
                if (!seen.has(displayName) && byName.has(displayName)) {
                    orderedMetrics.push({ ...byName.get(displayName), enabled: true });
                    seen.add(displayName);
                }
            });

            initialMetrics.forEach((metric) => {
                if (!seen.has(metric.name)) {
                    orderedMetrics.push({ ...metric, enabled: false });
                }
            });

            setMetrics(orderedMetrics.length ? orderedMetrics : initialMetrics);
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
                                const paramConfig = algo.hyperparameters?.[key];
                                if (isNestedParameter(paramConfig) && value && typeof value === 'object') {
                                    acc[key] = Object.entries(value).reduce((nestedAcc, [subParam, subValue]) => {
                                        nestedAcc[subParam] = String(subValue);
                                        return nestedAcc;
                                    }, {});
                                } else {
                                    acc[key] = String(value);
                                }
                                return acc;
                            }, {});
                        } else if (configMode === 'Grid Search') {
                            gridSearchValues = Object.entries(paramGridValues).reduce((acc, [key, value]) => {
                                const paramConfig = algo.hyperparameters?.[key];
                                if (isNestedParameter(paramConfig) && value && typeof value === 'object') {
                                    acc[key] = Object.entries(paramConfig).reduce(
                                        (nestedAcc, [subParam]) => {
                                            const savedValues = value[subParam];
                                            nestedAcc[subParam] = Array.isArray(savedValues)
                                                ? savedValues.map(item => String(item))
                                                : savedValues !== undefined
                                                    ? [String(savedValues)]
                                                    : [''];
                                            return nestedAcc;
                                        },
                                        {}
                                    );
                                } else if (Array.isArray(value)) {
                                    acc[key] = value.map(v => String(v));
                                } else {
                                    acc[key] = [String(value)];
                                }
                                return acc;
                            }, {});

                            gridSearchErrors = Object.keys(gridSearchValues).reduce((acc, key) => {
                                const paramConfig = algo.hyperparameters?.[key];
                                if (isNestedParameter(paramConfig)) {
                                    acc[key] = Object.entries(gridSearchValues[key]).reduce(
                                        (nestedAcc, [subParam, values]) => {
                                            nestedAcc[subParam] = values.map(() => null);
                                            return nestedAcc;
                                        },
                                        {}
                                    );
                                } else {
                                    acc[key] = gridSearchValues[key].map(() => null);
                                }
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

                if (readonly && savedConfig.algorithms.length > 0) {
                    const firstEnabledAlgo = Object.values(updatedState).find(algo =>
                        savedConfig.algorithms.includes(algo.backend_key)
                    );
                    if (firstEnabledAlgo) {
                        setSelectedTab(firstEnabledAlgo.category);
                    }
                }

                return updatedState;
            });
        }
    }, [workflowState?.modelSelection?.config, readonly, isRegression, isTimeSeries]);

    useEffect(() => {
        if (searchQuery && filteredCategories.length > 0) {
            if (!filteredCategories.includes(selectedTab)) {
                setSelectedTab(filteredCategories[0]);
            }
        }
    }, [searchQuery, filteredCategories, selectedTab]);

    // Reset metrics when problem type changes (regression vs classification)
    useEffect(() => {
        const savedMetrics = workflowState?.modelSelection?.config?.performance_metrics;
        if (readonly && Array.isArray(savedMetrics) && savedMetrics.length > 0) {
            return;
        }
        setMetrics(getInitialMetrics());
    }, [isRegression,isTimeSeries, readonly, workflowState?.modelSelection?.config?.performance_metrics]);

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
        if (isInteractionLocked) return;
        setSelectedTab(tab);
    };

    const toggleAlgorithm = (id) => {
        if (isInteractionLocked) return;
        const algo = allAlgorithmsState[id];
        const newEnabled = !algo.enabled;

        if (newEnabled) {
            setShowValidation(false);
        }

        let initializedGridSearchValues = { ...algo.gridSearchValues };
        let initializedGridSearchErrors = { ...algo.gridSearchErrors };

        if (newEnabled && algo.hyperparameters) {
            Object.entries(algo.hyperparameters).forEach(([paramName, paramValue]) => {
                if (isNestedParameter(paramValue)) {
                    const currentNestedValues = initializedGridSearchValues[paramName] || {};
                    const currentNestedErrors = initializedGridSearchErrors[paramName] || {};

                    initializedGridSearchValues[paramName] = {};
                    initializedGridSearchErrors[paramName] = {};

                    Object.keys(paramValue).forEach(subParam => {
                        const values = currentNestedValues[subParam];
                        initializedGridSearchValues[paramName][subParam] =
                            Array.isArray(values) && values.length > 0 ? values : [''];
                        initializedGridSearchErrors[paramName][subParam] =
                            Array.isArray(currentNestedErrors[subParam])
                                ? currentNestedErrors[subParam]
                                : initializedGridSearchValues[paramName][subParam].map(() => null);
                    });
                } else if (
                    !Array.isArray(initializedGridSearchValues[paramName]) ||
                    initializedGridSearchValues[paramName].length === 0
                ) {
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
        if (isInteractionLocked) return;
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
                    // Special handling for Encoder-Decoder LSTM
                    if (algo.backend_key === "EncoderDecoderLSTM") {
                        const units = Number(algo.hyperparameterValues["encoder_decoder units"] )|| 0;

                        paramGrid[algo.backend_key] = {
                            encoder_units: units,
                            decoder_units: units,
                            attention: algo.hyperparameterValues.attention === "true"
                        };

                        return;
                    }
                    paramGrid[algo.backend_key] = {};
                    Object.entries(algo.hyperparameterValues).forEach(([paramName, value]) => {
                        if (value && typeof value === 'object') {
                            const nestedValue = Object.entries(value).reduce((acc, [key, item]) => {
                                if (item !== null && item !== undefined && String(item).trim() !== '') {
                                    acc[key] = toPayloadValue(item);
                                }
                                return acc;
                            }, {});

                            if (Object.keys(nestedValue).length > 0) {
                                paramGrid[algo.backend_key][paramName] = nestedValue;
                            }
                        } else if (
                            value !== null &&
                            value !== undefined &&
                            String(value).trim() !== ''
                        ) {
                            paramGrid[algo.backend_key][paramName] = toPayloadValue(value);
                        }
                    });
                }
            } else if (algo.configMode === 'Grid Search') {
                if (algo.gridSearchValues && Object.keys(algo.gridSearchValues).length > 0) {
                   if (algo.backend_key === "EncoderDecoderLSTM") {
                        const units = (
                            algo.gridSearchValues["encoder_decoder units"] || []
                        ).map(Number);

                        paramGrid[algo.backend_key] = {
                            encoder_units: units,
                            decoder_units: units,
                            attention: algo.gridSearchValues["attention"] || []
                        };

                        return;
                    }
                    paramGrid[algo.backend_key] = {};
                    Object.entries(algo.gridSearchValues).forEach(([paramName, values]) => {
                        if (values && typeof values === 'object' && !Array.isArray(values)) {
                            const nestedValues = Object.entries(values).reduce(
                                (acc, [subParam, subValues]) => {
                                    const validValues = (subValues || []).filter(
                                        value => value && value.trim() !== ''
                                    );
                                    if (validValues.length > 0) {
                                        acc[subParam] = validValues.map(toPayloadValue);
                                    }
                                    return acc;
                                },
                                {}
                            );

                            if (Object.keys(nestedValues).length > 0) {
                                paramGrid[algo.backend_key][paramName] = nestedValues;
                            }
                        } else {
                            const validValues = (values || []).filter(v => v && v.trim() !== '');
                            if (validValues.length > 0) {
                                paramGrid[algo.backend_key][paramName] =
                                    validValues.map(toPayloadValue);
                            }
                        }
                    });
                }
            }
        });

        const performanceMetrics = metrics
            .filter(m => m.enabled)
            .map(m => METRIC_NAME_MAPPING[m.name] || m.name.toLowerCase());

        const finalPerformanceMetrics = isTimeSeries
    ? performanceMetrics
    : isRegression
        ? performanceMetrics
        : Array.from(
            new Set([
                ...performanceMetrics,
                ...CLASSIFICATION_MANDATORY_METRICS
            ])
        );

        const finalParamGrid = Object.keys(paramGrid).length > 0 ? paramGrid : {
            "additionalProp1": { "additionalProp1": {} },
            "additionalProp2": { "additionalProp1": {} },
            "additionalProp3": { "additionalProp1": {} }
        };

        const defaultScoringMetric = isTimeSeries
    ? 'rmse'
    : isRegression
        ? 'r2'
        : 'accuracy';

const defaultPerformanceMetrics = isTimeSeries
    ? ['rmse']
    : isRegression
        ? ['r2']
        : ['accuracy', ...CLASSIFICATION_MANDATORY_METRICS];

        const payload = {
            ensemble_id: datasetState?.ensembleId,
            workflow_id: currentWorkflowId,
            algorithms: algorithmNames,
            hyperparameter_modes: hyperparameterMode,
            param_grid: finalParamGrid,
            normalize: normalizeData,
            forecast: Number(forecastHorizon),
            return_metrics: true,
            scoring: defaultScoringMetric,
            performance_metrics: finalPerformanceMetrics.length > 0 ? finalPerformanceMetrics : defaultPerformanceMetrics,
            test_size: 0.2,
            random_state: 42,
            shuffle: true
            
        };

        if (!payload.ensemble_id || !payload.workflow_id) {
            throw new Error('Missing required identifiers: ensemble_id or workflow_id');
        }

        return payload;
    };

    // Validate the whole form — returns true if all good
    const isFormValid = () => {
            const enabledAlgos = Object.values(allAlgorithmsState).filter(algo => algo.enabled);
            const hasEnabledMetrics = metrics.some(m => m.enabled);

            if (enabledAlgos.length === 0 || !hasEnabledMetrics) return false;

            if (isTimeSeries) {
                const forecastValue = Number(forecastHorizon);

                if (
                    !forecastHorizon ||
                    forecastValue < 1 ||
                    forecastValue > 15
                ) {
                    return false;
                }
            }

            return enabledAlgos.every(algo => validateAlgorithm(algo));
        };

    const handleNextClick = async () => {
        if (readonly) return true;
        if (isSubmitting) return false;

        if (!isFormValid()) {

    setShowValidation(true);

    const forecastValue = Number(forecastHorizon);

        if (
            isTimeSeries &&
            (
                !forecastHorizon ||
                forecastValue < 1 ||
                forecastValue > 15
            )
        ) {
            toast.error(
                'Forecast horizon must be between 1 and 15.',
                {
                    duration: 3000,
                    position: 'top-right',
                }
            );
            return false;
}

            const enabledAlgos = Object.values(allAlgorithmsState).filter(algo => algo.enabled);
            const invalidAlgo = enabledAlgos.find(algo => !validateAlgorithm(algo));

            if (invalidAlgo) {
                // Switch to the tab of the first invalid algorithm
                setSelectedTab(invalidAlgo.category);

                // Expand the invalid algorithm so its fields are visible
                const updates = {};
                Object.keys(allAlgorithmsState).forEach(key => {
                    updates[key] = {
                        ...allAlgorithmsState[key],
                        expanded: key === invalidAlgo.id ? true : allAlgorithmsState[key].expanded
                    };
                });
                setAllAlgorithmsState(updates);

                // Scroll to the invalid algorithm card after state updates settle
                setTimeout(() => {
                    const cardEl = cardRefs.current[invalidAlgo.id];
                    if (cardEl) {
                        cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 80);
            }

            const enabledCount = enabledAlgos.length;
            const hasMetrics = metrics.some(m => m.enabled);
            if (enabledCount === 0) {
                toast.error('Please select at least one algorithm.', { duration: 3000, position: 'top-right' });
            } else if (!hasMetrics) {
                toast.error('Please select at least one metric.', { duration: 3000, position: 'top-right' });
            } else {
                toast.error('Please complete all required fields in the selected algorithms.', { duration: 3000, position: 'top-right' });
            }
            return false;
        }

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
                    ensemble_id: payload.ensemble_id,
                    workflow_id: payload.workflow_id,
                    algorithms: payload.algorithms,
                    normalize: normalizeData,
                    performance_metrics: payload.performance_metrics,
                    hyperparameter_modes: payload.hyperparameter_modes,
                    param_grid: payload.param_grid,
                    forecast_horizon: Number(forecastHorizon),
                },
                apiResponse: result
            });

            if (!isModelSelectionAuto) {
                const jobId = result?.job_id;

                if (jobId) {
                    const jobResponse = await fetch(`${hostnameAI}/jobs/${jobId}`, {
                        method: 'GET',
                        headers: { 'accept': 'application/json' }
                    });

                    if (jobResponse.ok) {
                        const data = await jobResponse.json();
                        updateWorkflowStage('completedJobs', {
                            config: { job_id: jobId },
                            apiResponse: data
                        });
                    }
                }
            }

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

    // Check if current tab has any invalid algorithms (for red dot tab indicator)
    const categoryHasErrors = (category) => {
        if (!showValidation) return false;
        return Object.values(allAlgorithmsState).some(algo =>
            algo.category === category &&
            algo.enabled &&
            !validateAlgorithm(algo)
        );
    };

    return (
        <AIPlaygroundLayout
            isNextDisabled={isSubmitting}
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
                <div className="lg:col-span-2 bg-white rounded-xl pl-2">
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className={`${tw.sectionHeading} text-xl`}>Algorithms</h3>
                            <div className="relative w-64">
                                <input
                                    type="text"
                                    placeholder="Search algorithms..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    disabled={isInteractionLocked}
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
                                                disabled={isInteractionLocked}
                                                className={`px-8 py-2 ${tw.sectionHeading} whitespace-nowrap flex items-center gap-1.5 ${selectedTab === category
                                                    ? 'text-[#8e78b7] border-b-[3px] border-[#8e78b7] bg-[#FAF8FF] rounded-t'
                                                    : 'text-gray-600 hover:text-gray-900'
                                                    }`}
                                            >
                                                {category}
                                                {/* Red dot indicator if category has errors */}
                                                {categoryHasErrors(category) && (
                                                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
                            </div>
                        )}
                    </div>

                    <div className={`space-y-4 ${filteredAlgorithms.length > 4
                        ? 'max-h-[calc(100vh-280px)] overflow-y-auto px-1 pb-1 custom-scrollbar'
                        : 'min-h-[500px] px-1 pb-1'
                        }`}>
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
                                    disabled={isInteractionLocked}
                                    onToggle={toggleAlgorithm}
                                    onExpand={toggleExpanded}
                                    onUpdate={updateAlgorithmState}
                                    showValidation={showValidation}
                                    onResetValidation={() => setShowValidation(false)}
                                    cardRef={(el) => { cardRefs.current[algo.id] = el; }}
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
                    disabled={isInteractionLocked}
                    hasEnabledMetrics={hasEnabledMetrics}
                    showValidation={showValidation}
                    metricFullFormMap={isRegression ? REGRESSION_METRIC_FULL_FORM : {}}

                    forecastHorizon={forecastHorizon}
                    setForecastHorizon={setForecastHorizon}
                    isTimeSeries={isTimeSeries}
                />
            </div>
        </AIPlaygroundLayout>
    );
}

export default ModelSelection;
