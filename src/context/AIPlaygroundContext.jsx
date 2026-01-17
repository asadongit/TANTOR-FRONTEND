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

    const [datasetState, setDatasetState] = useState({
        tableName: '',
        sessionId: '',
        columnNames: [],
        profileReportHtml: ''
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

    // console.log("work flow state is @@@ ", workflowState)
    // console.log("DATASET is @@@ ", datasetState)

    const [mode, setMode] = useState('edit');

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

    const value = {
        projectState,
        datasetState,
        workflowState,
        mode,
        setProjectState,
        setDatasetState,
        setWorkflowState,
        setMode,
        updateWorkflowStage,
        updatePreprocessingStep
    };

    return (
        <AIPlaygroundContext.Provider value={value}>
            {children}
        </AIPlaygroundContext.Provider>
    );
};