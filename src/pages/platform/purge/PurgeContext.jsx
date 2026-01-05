import React, { createContext, useContext, useState } from 'react';

const PurgeContext = createContext();

export function PurgeContextProvider({ children }) {
  const [purgeData, setPurgeData] = useState({});

  const updateNodeData = (nodeId, data) => {
    setPurgeData((prev) => {
      const existingNode = prev[nodeId] || {};
      const updatedNode = { ...existingNode, ...data };

      if (JSON.stringify(existingNode) === JSON.stringify(updatedNode)) {
        return prev;
      }

      return {
        ...prev,
        [nodeId]: updatedNode,
      };
    });
  };

  return (
    <PurgeContext.Provider value={{ purgeData, updateNodeData, setPurgeData }}>
      {children}
    </PurgeContext.Provider>
  );
}

export function usePurgeContext() {
  return useContext(PurgeContext);
}
