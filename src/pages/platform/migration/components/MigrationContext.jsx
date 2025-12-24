import React, { createContext, useContext, useState } from 'react';

const MigrationContext = createContext();

export function MigrationContextProvider({ children }) {
  const [migrationData, setMigrationData] = useState({});

  const updateNodeData = (nodeId, data) => {
    setMigrationData((prev) => ({
      ...prev,
      [nodeId]: { ...prev[nodeId], ...data }
    }));
  };

  return (
    <MigrationContext.Provider value={{ migrationData, updateNodeData, setMigrationData }}>
      {children}
    </MigrationContext.Provider>
  );
}

export function useMigrationContext() {
  return useContext(MigrationContext);
}
