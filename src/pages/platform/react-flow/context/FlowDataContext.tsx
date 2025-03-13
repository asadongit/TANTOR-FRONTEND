import React from 'react';
import { createContext, useContext, useState, useCallback } from 'react';

type NodeType = 'source' | 'target' | 'transformer' | 'scheduler';

type SourceNodeData = {
  selectedConnection: string;
  selectedSchema: string;
  selectedTables: string[];
  searchTerm: string;
  migrationScope: 'bulk' | 'subset';
  columnScope: 'bulk' | 'subset';
};

type FlowData = {
  [key in NodeType]: {
    [nodeId: string]: any;
  };
};

type FlowDataContextType = {
  flowData: FlowData;
  updateNodeData: (nodeType: NodeType, nodeId: string, data: any) => void;
  deleteNodeData: (nodeType: NodeType, nodeId: string) => void;
};

const FlowDataContext = createContext<FlowDataContextType>({
  flowData: {
    source: {},
    target: {},
    transformer: {},
    scheduler: {}
  },
  updateNodeData: () => {},
  deleteNodeData: () => {}
});

export const FlowDataProvider = ({ children }: { children: React.ReactNode }) => {
  const [flowData, setFlowData] = useState<FlowData>({
    source: {},
    target: {},
    transformer: {},
    scheduler: {}
  });

  const updateNodeData = useCallback((nodeType: NodeType, nodeId: string, data: any) => {
    setFlowData(prev => ({
      ...prev,
      [nodeType]: {
        ...prev[nodeType],
        [nodeId]: {
          ...prev[nodeType]?.[nodeId],
          ...data
        }
      }
    }));
  }, []);

  const deleteNodeData = useCallback((nodeType: NodeType, nodeId: string) => {
    setFlowData(prev => ({
      ...prev,
      [nodeType]: Object.fromEntries(
        Object.entries(prev[nodeType]).filter(([id]) => id !== nodeId)
      )
    }));
  }, []);

  return (
    <FlowDataContext.Provider value={{ flowData, updateNodeData, deleteNodeData }}>
      {children}
    </FlowDataContext.Provider>
  );
};

export const useFlowData = () => useContext(FlowDataContext);