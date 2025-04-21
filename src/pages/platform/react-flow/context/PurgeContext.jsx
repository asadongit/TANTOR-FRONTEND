import { createContext, useContext, useState } from "react";

const PurgeContext = createContext();

export const PurgeContextProvider = ({ children }) => {

  const [ dropPartitions, setDropPartitions ] = useState({
    source: {
      partitionName: null,
      columnName: null,
      highValue: null,
      partitionType: null,
      tableName: null
    },
    target: {
      partitionName: null,
      columnName: null,
      highValue: null,
      partitionType: null,
      tableName: null
    }
  })
  const saveDropPartitions = (nodeType, partitionName, columnName, highValue, partitionType, tableName) => {
    setDropPartitions({
      ...dropPartitions,
      [nodeType]: {
        partitionName: partitionName,
        columnName: columnName,
        highValue: highValue,
        partitionType: partitionType,
        tableName: tableName
      }
    })
  }

  const [ filters, setFilters ] = useState({
    source: {
      isComplex: null,
      details: null
    },
    target: {
      isComplex: null,
      details: null
    },
  });
  const saveFilter = (nodeType, isComplex, details) => {
    setFilters({
      ...filters,
      [nodeType]: {
        isComplex: isComplex,
        details: details
      }
    })    
  }

  const [sourceData, setSourceData] = useState({
    connectionId: null,
    connectionName: null,
    connectionType: null,
    tableName: null,
    schemaName: null,
    sourceType: null
  })
  const saveSourceData = (connectionId, connectionName, connectionType, tableName, schemaName, sourceType) => {
    setSourceData({
      connectionId, connectionName, connectionType, tableName, schemaName, sourceType
    })
  }

  const [ defineNode, setDefineNode ] = useState({
    name: null,
    description: null,
  })
  const saveDefineNode = (name, description) => {
    setDefineNode(name, description)
  }

  const [ targetData, setTargetData ] = useState({
    connectionId: null,
    connectionName: null,
    connectionType: null,
    tableName: null,
    schemaName: null,
    targetType: null
  })
  const saveTargetData = (connectionId, connectionName, connectionType, tableName, schemaName, targetType) => {
    setTargetData({
      connectionId, connectionName, connectionType, tableName, schemaName, targetType
    })
  }

  return (
  <PurgeContext.Provider 
    value={{
      saveDefineNode,
      filters,
      saveFilter,
      dropPartitions,
      saveDropPartitions,
      sourceData,
      saveSourceData,
      targetData,
      saveTargetData,
    }}
  >
    {children}
  </PurgeContext.Provider>
  );
};

export const usePurgeContext = () => useContext(PurgeContext);
