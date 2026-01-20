import React, { createContext, useContext, useState } from 'react';

const AIPlaygroundContext = createContext(null);

export const useAIPlayground = () => {
    const context = useContext(AIPlaygroundContext);
    if (!context) {
        throw new Error('useAIPlayground must be used within AIPlaygroundProvider');
    }
    return context;
};

export const AIPlaygroundProvider = ({ children }) => {
    const [projectState, setProjectState] = useState({
        selectedProject: '',
    });

    const [modelState, setModelState] = useState({
        selectedModel: '',
    });

    const [datasetState, setDatasetState] = useState({
        tableName: '',
        sessionId: '',
        columnNames: [],
        profileReportHtml: ''
    });

    const [schedulerState, setSchedulerState] = useState({
        owner_id: '',
        project: '',
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
            performance_drift_threshold: 0
        },
        data_drift_check: 0,
        model_drift_check: 0,
        recipients: [],
        airflow_dag_id: '',
        created_by: '',
        workflow_name: ''
    });

    const [workflowState, setWorkflowState] = useState({
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
            }
        },
        modelSelection: {
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
    });

    const [mode, setMode] = useState('write');

    const updateWorkflowStage = (stage, data) => {
        setWorkflowState(prev => ({
            ...prev,
            [stage]: {
                ...prev[stage],
                ...data
            }
        }));
    };

    const updatePreprocessingStep = (stepKey, data) => {
        setWorkflowState(prev => ({
            ...prev,
            dataPreprocessing: {
                ...prev.dataPreprocessing,
                [stepKey]: {
                    ...prev.dataPreprocessing[stepKey],
                    ...data
                }
            }
        }));
    };

    // console.log("DATASET STATE IS @@@ ", datasetState)
    // console.log("PROJECT IS @@@", projectState)
    // console.log("MODE IS @@@", mode)
    // console.log("WORKFLOW STATE IS @@@@ ", workflowState)
    // console.log("SCHEDULER STATE IS @@@@ ", schedulerState)

    const value = {
        projectState,
        datasetState,
        workflowState,
        schedulerState,
        mode,
        modelState,
        setProjectState,
        setDatasetState,
        setWorkflowState,
        setSchedulerState,
        setMode,
        setModelState,
        updateWorkflowStage,
        updatePreprocessingStep
    };

    return (
        <AIPlaygroundContext.Provider value={value}>
            {children}
        </AIPlaygroundContext.Provider>
    );
};