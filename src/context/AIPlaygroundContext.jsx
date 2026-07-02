import React, { createContext, useContext, useState } from 'react';

const AIPlaygroundContext = createContext(null);

export const useAIPlayground = () => {
    const context = useContext(AIPlaygroundContext);
    if (!context) {
        throw new Error('useAIPlayground must be used within AIPlaygroundProvider');
    }
    return context;
};

const defaultProjectState = {
    selectedProject: '',
};

const defaultModelState = {
    selectedModel: '',
};

const defaultDatasetState = {
    tableName: '',
    ensembleId: '',
    columnNames: [],
    tsColumnsName: [],
    profileReportHtml: '',
    isEnsemble: false,
    WorkflowCount: 1
};

const defaultSchedulerState = {
    owner_id: '',
    project: '',
    is_ensemble: false,
    ensemble_name: '',
    model: '',
    model_id: '',
    project_id: '',
    flow_type: 'single_run',
    scheduler: {
        mode: 'auto',
        frequency: '',
        runningDays: [],
        endDateTime: '',
        intervalType: 'single_run',
        intervalValue: '',
        startDateTime: '',
    },
    source: {
        source_conn_type: '',
        source_schema: '',
        source_table: ''
    },
    target: {
        destination_conn_type: '',
        destination_schema: '',
        destination_table: ''
    },
    data_drift_threshold: {
        distribution_drift_threshold: 0,
        statistical_significance_level: 0,
        information_stability_threshold: 0,
        target_stability_threshold: 0
    },
    model_drift_threshold: {
        prediction_drift_threshold: 0,
        performance_drift_threshold: -1,
        rmse_threshold: '',
        smape_threshold: ''
    },
    data_drift_check: 0,
    model_drift_check: 0,
    recipients: [],
    created_by: '',
    workflow_name: ''
};

const defaultWorkflowState = {
    workflow_id: null,
    workflow_name: null,
    modelGenesis: {
        config: null,
        apiResponse: null
    },
    dataPreprocessing: {
        step1: {
            config: null,
            apiResponse: null
        },
        step2: {
            config: null,
            apiResponse: null
        },
        step3: {
            config: null,
            apiResponse: null
        },
        step4: {
            config: null,
            apiResponse: null
        },
        step5: {
            config: null,
            apiResponse: null
        },
        step6: {
            config: null,
            apiResponse: null
        },
        step7: {
            config: null,
            apiResponse: null
        },
        step8: {
            config: null,
            apiResponse: null
        }
    },
    modelSelection: {
        config: null,
        apiResponse: null
    },
    completedJobs: {
        config: null,
        apiResponse: null
    },
    modelInferencing: {
        config: null,
        apiResponse: null
    },
    xai: {
        config: null,
        apiResponse: null
    },
    modelDeployment: {
        config: null,
        apiResponse: null
    }
};

export const AIPlaygroundProvider = ({ children }) => {
    const [projectState, setProjectState] = useState(defaultProjectState);
    const [modelState, setModelState] = useState(defaultModelState);
    const [datasetState, setDatasetState] = useState(defaultDatasetState);
    const [schedulerState, setSchedulerState] = useState(defaultSchedulerState);
    
    // Store multiple workflows indexed by workflowId
    const [workflowsState, setWorkflowsState] = useState({});
    // Track which workflow is currently active
    const [activeWorkflowId, setActiveWorkflowId] = useState(null);
    
    const [mode, setMode] = useState('write');
    const [isAIPlaygroundActive, setIsAIPlaygroundActive] = useState(false);
    const [F1Mode, setF1Mode] = useState({});

    // Create a new workflow with the given ID
    const createWorkflow = (workflowId, workflowName = null) => {
        setWorkflowsState(prev => {
            if (prev[workflowId]) {
                console.warn(`Workflow ${workflowId} already exists`);
                return prev;
            }
            // Calculate workflow number based on existing workflows
            const workflowNumber = Object.keys(prev).length + 1;
            const resolvedWorkflowName = workflowName || `workflow ${String(workflowNumber).padStart(2, '0')}`;
            
            return {
                ...prev,
                [workflowId]: {
                    ...defaultWorkflowState,
                    workflow_id: workflowId,
                    workflow_name: resolvedWorkflowName
                }
            };
        });
        // Keep the first created workflow as active during batched creations.
        setActiveWorkflowId(prevId => prevId ?? workflowId);
    };

    // Switch active workflow
    const switchWorkflow = (workflowId) => {
        if (workflowsState[workflowId]) {
            setActiveWorkflowId(workflowId);
        } else {
            console.warn(`Workflow ${workflowId} does not exist`);
        }
    };

    // Delete a workflow
    const deleteWorkflow = (workflowId) => {
        setWorkflowsState(prev => {
            const updated = { ...prev };
            delete updated[workflowId];

            // Keep existing workflow names as-is after deletion.
            return updated;
        });
        // If deleted workflow was active, switch to another one
        if (activeWorkflowId === workflowId) {
            const remainingIds = Object.keys(workflowsState).filter(id => id !== workflowId);
            setActiveWorkflowId(remainingIds.length > 0 ? remainingIds[0] : null);
        }
    };

    // Get current active workflow
    const getCurrentWorkflow = () => {
        return activeWorkflowId ? workflowsState[activeWorkflowId] : null;
    };

    // Update a specific workflow stage
    const updateWorkflowStage = (stage, data, workflowId = activeWorkflowId) => {
        if (!workflowId) {
            console.error('No active workflow selected');
            return;
        }
        
        setWorkflowsState(prev => ({
            ...prev,
            [workflowId]: {
                ...prev[workflowId],
                [stage]: {
                    ...prev[workflowId][stage],
                    ...data
                }
            }
        }));
    };

    // Update preprocessing step in a specific workflow
    const updatePreprocessingStep = (stepKey, data, workflowId = activeWorkflowId) => {
        if (!workflowId) {
            console.error('No active workflow selected');
            return;
        }
        
        setWorkflowsState(prev => ({
            ...prev,
            [workflowId]: {
                ...prev[workflowId],
                dataPreprocessing: {
                    ...prev[workflowId].dataPreprocessing,
                    [stepKey]: {
                        ...prev[workflowId].dataPreprocessing[stepKey],
                        ...data
                    }
                }
            }
        }));
    };

    // Set ensemble mode with workflow count
    const setEnsembleMode = (ensembleCount = 1) => {
        setDatasetState(prev => ({
            ...prev,
            isEnsemble: ensembleCount > 1,
            WorkflowCount: ensembleCount
        }));
    };

    // Reset all states
    const resetAllStates = () => {
        setProjectState(defaultProjectState);
        setModelState(defaultModelState);
        setDatasetState(defaultDatasetState);
        setSchedulerState(defaultSchedulerState);
        setWorkflowsState({});
        setActiveWorkflowId(null);
        setMode('write');
        setIsAIPlaygroundActive(false);
    };

    const value = {
        projectState,
        datasetState,
        workflowsState,
        activeWorkflowId,
        schedulerState,
        mode,
        modelState,
        isAIPlaygroundActive,
        setProjectState,
        setDatasetState,
        setWorkflowsState,
        setActiveWorkflowId,
        setSchedulerState,
        setMode,
        setModelState,
        setIsAIPlaygroundActive,
        // Workflow management functions
        createWorkflow,
        switchWorkflow,
        deleteWorkflow,
        getCurrentWorkflow,
        updateWorkflowStage,
        updatePreprocessingStep,
        setEnsembleMode,
        resetAllStates,
        F1Mode,
        setF1Mode
    };

    return (
        <AIPlaygroundContext.Provider value={value}>
            {children}
        </AIPlaygroundContext.Provider>
    );
};