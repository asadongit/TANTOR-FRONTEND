import React, { createContext, useContext, useState, useEffect } from "react";

const StateContext = createContext();

export const ContextViewProvider = ({ children }) => {
  const [viewPayload, setViewPayload] = useState([]);
  const handleViewPayload = (val) => {
    setViewPayload(val);
  }

  const [connectionPayload, setConnectionPayload] = useState([]);
  const handleConnectionPayload = (val) => {
    setConnectionPayload(val);
  }

  const [consolidationPayload, setConsolidationPayload] = useState([]);
  const handleConsolidationPayload = (val) => {
    setConsolidationPayload((prevPayload) => {
      return [
        ...prevPayload,
        val,
      ];
    });
  };

  const removeConsolidationPayloadByNode = (nodeId) => {
    setConsolidationPayload((prevPayload) =>
      prevPayload.filter(
        (entry) => entry.source !== nodeId && entry.target !== nodeId
      )
    );
  };

  const [nodeCount, setNodeCount] = useState({
    sourceView: 0,
    connection: 0,
    consolidation: 0
  });

  const [finalPayload, setFinalPayload] = useState({});
  const handleFinalPayload = (val) => {
    setFinalPayload(val);
  };


  const [columnSettings, setColumnSettings] = useState({});

  // Source View States
  const [userSelections, setUserSelections] = useState(new Map());
  const [settingsList, setSettingsList] = useState([]);
  const [userCheckedColumns, setUserCheckedColumns] = useState([]);
  const [consolidationTypeChange, setConsolidationTypeChange] = useState(null);

  useEffect(() => {
  }, [userSelections])

  const incrementNodeCount = (nodeType) => {
    setNodeCount(prev => ({
      ...prev,
      [nodeType]: prev[nodeType] + 1
    }));
  };

  const decrementNodeCount = (nodeType) => {
    setNodeCount(prev => ({
      ...prev,
      [nodeType]: Math.max(0, prev[nodeType] - 1)
    }));
  };

  const resetNodeCount = (nodeType) => {
    if (nodeType) {
      setNodeCount(prev => ({
        ...prev,
        [nodeType]: 0
      }));
    } else {
      setNodeCount({
        sourceView: 0,
        connection: 0,
        consolidation: 0
      });
    }
  };

  return (
    <StateContext.Provider
      value={{
        viewPayload,
        handleViewPayload,
        consolidationPayload,
        handleConsolidationPayload,
        removeConsolidationPayloadByNode,
        connectionPayload,
        handleConnectionPayload,
        finalPayload,
        handleFinalPayload,
        columnSettings,
        setColumnSettings,
        settingsList, setSettingsList,
        userSelections, setUserSelections,
        userCheckedColumns, setUserCheckedColumns,
        nodeCount,
        incrementNodeCount,
        decrementNodeCount,
        resetNodeCount,
        consolidationTypeChange,
        setConsolidationTypeChange,
      }}
    >
      {children}
    </StateContext.Provider>
  );
};

export const useStateContext = () => useContext(StateContext);