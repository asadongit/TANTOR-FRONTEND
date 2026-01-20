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

    const value = {
        projectState,
        datasetState,
        workflowState,
        mode,
        modelState,
        setProjectState,
        setDatasetState,
        setWorkflowState,
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