import React, { createContext, useContext, useState } from 'react';
import PropTypes from 'prop-types';

const CSVContext = createContext(null);

export function CSVProvider({ children }) {
  const [nodeData, setNodeData] = useState(new Map());

  const setData = (nodeId, data) => {
    setNodeData(prev => new Map(prev).set(nodeId, data));
  };

  const getData = (nodeId) => {
    return nodeData.get(nodeId);
  };

  return (
    <CSVContext.Provider value={{ setData, getData }}>
      {children}
    </CSVContext.Provider>
  );
}

CSVProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useCSV = () => {
  const context = useContext(CSVContext);
  if (!context) {
    throw new Error('useCSV must be used within a CSVProvider');
  }
  return context;
};