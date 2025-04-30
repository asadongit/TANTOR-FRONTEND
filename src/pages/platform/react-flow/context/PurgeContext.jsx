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

  const [bulkFiltersAndPartitions, setBulkFiltersAndPartitions] = useState({});
  /**
   *  {
   *    source: [
   *      {
   *        source_table: <source table name>,
   *        whereCondition: <where condition>,
   *        source_partition: <source partition>
   *      }, ...
   *    ],
   *    target: [
   *      {
   *        target_table: <target table name>,
   *        source_table: <source table name>,
   *        target_partition: <target partition>
   *      }, ...
   *    ]
   * }
   */
  const saveBulkFiltersAndPartitions = (nodeType, sourceTableName, targetTableName, partitionData, whereCondition) => {
    if (nodeType === 'source') {
      setBulkFiltersAndPartitions({
        ...bulkFiltersAndPartitions,
        [nodeType]: [
          ...(bulkFiltersAndPartitions[nodeType] ?? []).filter(el => el.source_table !== sourceTableName),
          {
            source_table: sourceTableName,
            whereCondition: whereCondition,
            source_partition: partitionData
          }
        ]
      })
    } else if (nodeType === 'target') {
      setBulkFiltersAndPartitions({
        ...bulkFiltersAndPartitions,
        [nodeType]: [
          ...(bulkFiltersAndPartitions[nodeType] ?? []).filter(el => el.target_table !== targetTableName),
          {
            target_table: targetTableName,
            source_table: sourceTableName,
            target_partition: partitionData
          }
        ]
      })
    }
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

  const [selectedBulkTargetTablesPayload, setSelectedBulkTargetTablesPayload] = useState([]);
  const saveSelectedBulkTargetTablesPayload = (tables) => {
    setSelectedBulkTargetTablesPayload(tables)
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
      bulkFiltersAndPartitions,
      saveBulkFiltersAndPartitions,
      selectedBulkTargetTablesPayload,
      saveSelectedBulkTargetTablesPayload,
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
