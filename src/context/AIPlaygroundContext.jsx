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
    const [mode, setMode] = useState('edit');

    const value = {
        // States
        projectState,
        datasetState,
        mode,

        // Setters
        setProjectState,
        setDatasetState,
        setMode,
    };

    return (
        <AIPlaygroundContext.Provider value={value}>
            {children}
        </AIPlaygroundContext.Provider>
    );
};