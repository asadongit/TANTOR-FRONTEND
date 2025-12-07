import { useState, useCallback, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { Handle, Position } from "reactflow";
import { CloudCog, Pencil, Search, Upload, X } from "lucide-react";
import { useStateContext } from "../../react-flow/context/ContextProvider";
import { SkeletonLoader } from "../../react-flow/SkeletonLoader";
import { useTableContext } from "../../react-flow/context/TableContext";
import toast from "react-hot-toast";
import { usePurgeContext } from "../../react-flow/context/PurgeContext";
import { useAuth } from "../../../../context/AuthContext";

export function TargetNode({ id, data }) {
  const hostname = window._env_?.VITE_FAST_API;
  const hostnameV2 = window._env_?.VITE_FAST_API_V2;
  const { token, decodedToken, project } = useAuth();

  const {
    selectedTables,
    setSelectedTables,
    sourceConnectionName,
    sourceSchemaName,
    selectedScope,
    handleTargetConnectionName,
    handleIsVisibleFooter,
    defineNodeName,
    defineNodeDesc,
    selectedDataSet,
    handlePurgeNode,
  } = useStateContext("");
  const [connections, setConnections] = useState([]);
  const [targetConnection, setTargetConnection] = useState("");
  const [schemas, setSchema] = useState([]);
  const [selectedSchema, setSelectedSchema] = useState("");
  const [metadata, setMetaData] = useState([]);
  const [tables, setTables] = useState([]);
  const [selectedTableName, setSelectedTableName] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTargetTables, setSelectedTargetTables] = useState([]);
  const [checkedBulkTables, setCheckedBulkTables] = useState(false);
  const [selectedBulkTablesMap, setSelectedBulkTablesMap] = useState([]);
  const [selectedBulkTables, setSelectedBulkTables] = useState([]);
  const [bulkTableMetadata, setBulkTableMetadata] = useState([]);

  const { openDrawer } = useTableContext();
  const {
    saveTargetData,
    filters,
    dropPartitions,
    selectedBulkTargetTablesPayload,
    bulkFiltersAndPartitions,
    sourceData,
    saveSelectedBulkTargetTablesPayload,
    saveBulkFiltersAndPartitions,
    setFilters,
    setDropPartitions,
    setBulkFiltersAndPartitions,
    saveDropPartitions
  } = usePurgeContext("");
  const isInitialized = useRef(false);

  let connectionsData;
  let schemadetails;
  let tabledetails;

  const fetchOptions = useCallback(async () => {
    try {
      const connectionResponse = await fetch(`${hostname}/connection-saves`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "x-project": project,
        },
      });
      connectionsData = await connectionResponse.json();
      setConnections(connectionsData);
    } catch (error) {
      console.error("Error fetching options", error);
    }
  }, []);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  const fetchSchema = useCallback(
    async (connectionName) => {
      if (!connectionName) {
        setSchema([]);
        return;
      }

      try {
        const response = await fetch(`${hostname}/schema/${connectionName}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        schemadetails = await response.json();
        setSchema(schemadetails);
      } catch (error) {
        console.error("Error fetching schemas:", error);
        setSchema([]);
      }
    },
    [hostname, token]
  );

  const fetchTables = useCallback(
    async (connectionName, schemaName) => {
      if (!connectionName || !schemaName) return;

      //setLoading(true);
      try {
        const fetchTableResponse = await fetch(
          `${hostname}/connection-master-metadata/find-by-conn-name-type?conn_name=${connectionName}&schema_name=${schemaName}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!fetchTableResponse.ok) {
          throw new Error(`HTTP error! status: ${fetchTableResponse.status}`);
        }

        tabledetails = await fetchTableResponse.json();

        setTables(tabledetails);
      } catch (error) {
        console.error("Error fetching tables:", error);
        setTables([]); // Clear tables on error
      } finally {
        setLoading(false);
      }
    },
    [hostname, token]
  );

  const fetchMetadata = useCallback(async () => {
    try {
      const metaDataResponse = await fetch(`${hostname}/metadata-archivals`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const response = await metaDataResponse.json();
      setMetaData(response);
    } catch (error) {
      console.error("Error fetching options ", error);
    }
  }, []);

  
  const fetchMetadataAccToConnectionAndBulkTable = async (
    targetConnection,
    selectedBulkTables
  ) => {
    if (!targetConnection || !selectedBulkTables) return;
    try {
      let bulkTableName = null;

      if (Array.isArray(selectedBulkTables)){
        if(selectedBulkTables[0].split(".").length > 1){
          bulkTableName = selectedBulkTables[0].split(".")[1]
        }
        else{
          bulkTableName = selectedBulkTables[0];
        }
      }else{
        bulkTableName = selectedBulkTables;
      }

      const response = await fetch(
        `${hostname}/connection-master-metadata/${targetConnection}/${bulkTableName}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${metaDataResponse.status}`);
      }

      const json = await response.json();
      console.log("JSON ===> ", json);

      let result = json;

      if (Array.isArray(json) && json.length > 0) {
        result = json.map(j => ({
          ...j,
          table_name: `${j.table_schema}.${j.table_name}`
        }));

        console.log("FORMATTED JSON ==> ", result);
      }

      setBulkTableMetadata(result);
      return result;

    } catch (error) {
      console.error("Error fetching tables ", error);
    }
  };

  const buildTargetTablesPayload = () => {
    return {
      source_conn_name: sourceConnectionName,
      target_conn_name: targetConnection,
      source_schema: sourceSchemaName,
      selected_source_tables: selectedTables,
    };
  };

  const [sourceMappedTargetTables, setSourceMappedTargetTables] = useState([]);

  const initCheckedBulkTables = (sourceTargetTableMap) => {
    let arr = [];
    for (const sourceObj of sourceTargetTableMap) {
      let checkedTableMap = {
        [sourceObj.source_table]: false,
        target_tables: {},
      };
      for (const target_table_name of sourceObj.target_tables) {
        checkedTableMap.target_tables[target_table_name] = false;
      }

      arr.push(checkedTableMap);
    }
    return arr;
  };

  const fetchSourceMappedTargetTables = useCallback(async () => {
    try {
      const targetTables = await fetch(
        `${hostnameV2}/metadata-archivals/grouped-target-tables`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(buildTargetTablesPayload()),
        }
      );
      const response = await targetTables.json();
      setSourceMappedTargetTables(response);
      setCheckedBulkTables(initCheckedBulkTables(response));
    } catch (error) {
      console.error(error);
      setSourceMappedTargetTables([]);
    }
  }, [
    sourceConnectionName,
    targetConnection,
    sourceSchemaName,
    selectedTables,
    token,
    hostnameV2,
  ]);

  const [bulkTargetPartitionData, setBulkTargetPartitionData] = useState([])

  const automaticallySavesBulkPartitionsData = async () => {
    const checkTargetPartitionExists = async (targetTable) => {
      const table = await fetchMetadataAccToConnectionAndBulkTable(targetConnection, targetTable);
      const partitions = table?.[0]?.partition_json;

      return partitions;
    };

    for (const sourceItem of bulkFiltersAndPartitions?.source || []) {
      const sourceTable = sourceItem.source_table;
      const sourcePartition = sourceItem.source_partition;

      if (!sourcePartition) continue;

      const checkedItem = checkedBulkTables?.find(item => item[sourceTable] !== undefined);
      if (!checkedItem) continue;

      const targetTables = checkedItem.target_tables;

      for (const [targetTable, isSelected] of Object.entries(targetTables)) {

        if (!isSelected) continue;

        const targetPartitionsData = await checkTargetPartitionExists(targetTable);
        const targetPartitionExists = Array.isArray(targetPartitionsData) && targetPartitionsData.length > 0;

        if (targetPartitionExists) {
          const matchedPartition = targetPartitionsData?.find(
            part => part.partition_name === sourcePartition.partition_name
          );

          console.log("MATCHED PARTITIONS ==> ", matchedPartition);
          if (matchedPartition) {
            saveBulkFiltersAndPartitions("target", sourceTable, targetTable, matchedPartition, null);
          }
        }
      }
    }
  };


  const filterMetaData = metadata.filter((targetTable) =>
    targetTable.target_table
      .toLowerCase()
      .includes(searchTerm?.toLowerCase() || "")
  );

  const filteredTables = tables.filter((table) =>
    table.table_name.toLowerCase().includes(searchTerm?.toLowerCase() || "")
  );

  const filterConnection = metadata.filter(
    (connection) =>
      connection.source_conn_name == sourceConnectionName &&
      connection.target_conn_name == targetConnection
  );

  const mappedTargetTables = filterConnection
    .filter((conn) => selectedTables.includes(conn.source_table))
    .map((conn) => conn.target_table);

  const validateBulkSourceTargetConnectionsExist = (
    selectedSourceTables,
    selectedTargetTables,
    allConnections
  ) => {
    const filteredConnectionsByTargetTable = allConnections.filter(
      (connection) => selectedTargetTables.includes(connection?.target_table)
    );

    const filteredConnectionsBySourceTable = allConnections.filter(
      (connection) => selectedSourceTables.includes(connection?.source_table)
    );

    if (filteredConnectionsByTargetTable.length === 0) {
      return {
        valid: false,
        message: `No connections found for target tables!`,
      };
    }

    if (filteredConnectionsBySourceTable.length === 0) {
      return {
        valid: false,
        message: `No connections found for source tables!`,
      };
    }

    const connectionSourceTables = filteredConnectionsByTargetTable.map(
      (connection) => connection?.source_table
    );
    const connectionTargetTables = filteredConnectionsBySourceTable.map(
      (connection) => connection?.target_table
    );

    const filteredConnectionSourceTables = connectionSourceTables.filter(
      (table) => selectedSourceTables.includes(table)
    );
    const filteredConnectionTargetTables = connectionTargetTables.filter(
      (table) => selectedTargetTables.includes(table)
    );

    for (const table of selectedSourceTables) {
      if (!filteredConnectionSourceTables.includes(table)) {
        return {
          valid: false,
          message: `No valid connection found for ${table} `,
        };
      }
    }
    for (const table of selectedTargetTables) {
      if (!filteredConnectionTargetTables.includes(table)) {
        return {
          valid: false,
          message: `No valid connection found for ${table} `,
        };
      }
    }
    return {
      valid: true,
      message: `All selected source tables & target tables found in connections!`,
    };
  };

  useEffect(() => {
    fetchTables(targetConnection, selectedSchema);
  }, [targetConnection, selectedSchema]);

  useEffect(() => {
    if (
      targetConnection &&
      sourceConnectionName &&
      sourceSchemaName &&
      selectedTables.length > 0
    ) {
      fetchSourceMappedTargetTables();
    }
  }, [
    sourceConnectionName,
    sourceSchemaName,
    selectedTables,
    fetchSourceMappedTargetTables,
  ]);

  useEffect(() => {
    handleTargetConnectionName(targetConnection);
  }, [targetConnection]);

  // Pre-populate state from data prop on mount (edit mode)
  useEffect(() => {
    if (data && !isInitialized.current) {
      isInitialized.current = true;
      if (data.connectionName) setTargetConnection(data.connectionName);
      if (data.schemaName) {
        setSelectedSchema(data.schemaName);
        fetchSchema(data.connectionName);
      }
      if (data.scope === "subset" && data.tableName) setSelectedTableName([data.tableName]);
    // if (data.scope === "bulk" && data.tableName) setSelectedBulkTables([data.tableName]);
    
    if (data.scope === "bulk") {
      data.bulk.selectedBulkTargetTablesPayload.forEach(t => {
        setSelectedBulkTables(t.target_table);
        // handleTargetTableOnChange(null, t.source_table, t.target_table);
      });
      console.log("SOURCE GROUP ==> ", sourceMappedTargetTables)
      } 
    

    if (data.selectedTableName) setSelectedTableName(data.TableName);
    if (data.checkedBulkTables) setCheckedBulkTables(data.checkedBulkTables);
    if (data.searchTerm) setSearchTerm(data.searchTerm);
    // if (data.selectedPurgeScope) setSelectedPurgeScope(data.scope);
    // Fetch tables if both connection and schema are present
    if (data.connectionName && data.selectedSchema) {
      fetchTables(data.connectionName, data.selectedSchema);
    }
    // Add more fields as needed for full pre-population

    // Restore filters and partitions
    if (data.filters && setFilters) {
      setFilters(prev => ({ ...prev, target: data.filters }));
    }
    if (data.dropPartitions && setDropPartitions) {
      setDropPartitions(prev => ({ ...prev, target: data.dropPartitions }));
    }

    // Restore Bulk Data
    if (data.bulk) {
      if (data.bulk.selectedBulkTargetTablesPayload && saveSelectedBulkTargetTablesPayload) {
          saveSelectedBulkTargetTablesPayload(data.bulk.selectedBulkTargetTablesPayload);
      }
      if (data.bulk.bulkFiltersAndPartitions && setBulkFiltersAndPartitions) {
          setBulkFiltersAndPartitions(data.bulk.bulkFiltersAndPartitions);
      }
    }
  }
}, [data, handleTargetConnectionName, setFilters, setDropPartitions, saveSelectedBulkTargetTablesPayload, setBulkFiltersAndPartitions, fetchSchema, fetchTables, checkedBulkTables]);

  const handleTableSelection = (tableName) => {
    if (selectedScope === "subset") {
      setSelectedTableName([tableName]);
    } else {
      setSelectedTableName((prev) =>
        prev.includes(tableName)
          ? prev.filter((item) => item !== tableName)
          : [...prev, tableName]
      );
    }
  };

  const validateSelection = (
    sourceData,
    defineNode,
    sourceNode,
    targetNode
  ) => {
    const { name, desc } = defineNode;

    const {
      source_conn_name,
      purge_scope: source_purge_scope,
      selectedTables: sourceTables,
    } = sourceNode;

    const {
      target_conn_name,
      purge_scope: target_purge_scope,
      selectedTables: targetTables,
    } = targetNode;

    if (
      !sourceData.connectionId &&
      !sourceData.connectionName &&
      !sourceData.schemaName &&
      !sourceData.sourceType &&
      !sourceData.tableName
    ) {
      return {
        valid: false,
        message: "Please save source node data!",
      };
    }

    if (!name) {
      return { valid: false, message: "Name must be selected on Define Node." };
    }

    if (!desc) {
      return {
        valid: false,
        message: "Description must be selected on Define Node.",
      };
    }

    if (!source_conn_name) {
      return {
        valid: false,
        message: "Source connection name must be selected on Source Node.",
      };
    }

    if (
      source_purge_scope === "subset" &&
      (!sourceTables || sourceTables.length !== 1)
    ) {
      return {
        valid: false,
        message:
          "For Source Node with 'subset' purge scope, one table must be selected.",
      };
    }

    if (!target_conn_name) {
      return {
        valid: false,
        message: "Target connection name must be selected on Target Node.",
      };
    }

    if (
      target_purge_scope === "subset" &&
      (!targetTables || targetTables.length !== 1)
    ) {
      return {
        valid: false,
        message:
          "For Target Node with 'subset' purge scope, one table must be selected.",
      };
    }

    return { valid: true, message: "Selection is valid." };
  };

  const saveBulkTableSelection = () => {
    let selectedBulkTargetTables = [];

    for (const sourceObj of checkedBulkTables) {
      let source_table_name = Object.keys(sourceObj).find(
        (key) => key !== "target_tables"
      );

      let selected_target_tables = Object.keys(sourceObj.target_tables).filter(
        (target_table_name) => sourceObj.target_tables[target_table_name]
      );

      if (selected_target_tables.length === 0)  continue;

      selectedBulkTargetTables = [
        ...selectedBulkTargetTables,
        ...selected_target_tables.map((target_table_name) => ({
          target_table: target_table_name,
          source_table: source_table_name,
        })),
      ];
    }

    saveSelectedBulkTargetTablesPayload(selectedBulkTargetTables);

    let selectedConnectionData = connections.find(
      (connection) => connection.connection_name === targetConnection
    );

    const connectionId = selectedConnectionData?.connection_id;
    const connectionType = selectedConnectionData?.connection_type;

    saveTargetData(
      connectionId,
      targetConnection,
      connectionType,
      null,
      selectedSchema,
      connectionType
    );

    return selectedBulkTargetTables;
  };

  const saveSubsetTableSelection = () => {
    let selectedConnectionData = connections.find(
      (connection) => connection.connection_name === targetConnection
    );

    const connectionId = selectedConnectionData?.connection_id;
    const connectionType = selectedConnectionData?.connection_type;
    const tableName = selectedTableName[0];

    saveTargetData(
      connectionId,
      targetConnection,
      connectionType,
      tableName,
      selectedSchema,
      connectionType
    );
  };

  const handleOkClick = async () => {
    const defineNode = {
      name: defineNodeName || "",
      desc: defineNodeDesc || "",
    };

    const sourceNode = {
      source_conn_name: sourceConnectionName || "",
      purge_scope: selectedScope || "",
      selectedTables:
        selectedScope === "subset" ? selectedDataSet : selectedTables,
    };

    const targetNode = {
      target_conn_name: targetConnection || "",
      purge_scope: selectedScope || "",
      selectedTables:
        selectedScope === "subset" ? selectedTableName : selectedTables || [],
    };

    let validationResult = validateSelection(
      sourceData,
      defineNode,
      sourceNode,
      targetNode
    );

    if (!validationResult.valid) {
      toast.error(validationResult.message);
      return;
    }

    // if (selectedScope === "bulk") {
    //   //let validationResultForBulk = validateBulkSourceTargetConnectionsExist(selectedTables, selectedTargetTables, metadata);
    //   // if (!validationResultForBulk.valid) {
    //   //   toast.error(validationResultForBulk.message);
    //   //   return;
    //   // }
    //   // toast.success(validationResultForBulk.message)

    //   savebulkTableSelection(checkedBulkTables);
    // }

    // NEW CODE
    if(selectedScope === "subset"){
      const sourcePartitions = dropPartitions?.source;
      
      const sourceTable = sourceNode.selectedTables[0];
      console.log("sourceTable ==> ", sourceTable);

      if(sourcePartitions && sourcePartitions?.partition_name){
        let targetTableMetadata = await fetchMetadataAccToConnectionAndBulkTable(targetConnection, targetNode.selectedTables);
        targetTableMetadata = Array.isArray(targetTableMetadata) ? targetTableMetadata[0] : targetTableMetadata;
        
        const targetPartitions = targetTableMetadata?.partition_json || [];
        
        if(targetPartitions.length === 0){
          toast.error(`No partitions available for target table: "${targetNode.selectedTables}"`)
          return;
        }

        // Selecting partition by partition name
        console.log("source partition ==> ", sourcePartitions);
        console.log("targetPartitions ==> ", targetPartitions);
        
        const selectedTargetPartition = targetPartitions.find(p => p.partition_name === sourcePartitions.partition_name);
        
        console.log("selectedTargetPartition ==> ", selectedTargetPartition);
        
        if(!selectedTargetPartition){
          toast.error(`Partition ${sourcePartitions.partition_name} doesn't exist for the target table "${targetNode.selectedTables}".`);
          return;
        }
        saveDropPartitions("target", selectedTargetPartition);
      }else{
        console.log("Dropping target partitions since source partition is empty.")
        saveDropPartitions("target");
      }
    }
    

    try {
      const apiPromise = window.handleConnectNode?.(id);

      if (!apiPromise) {
        //throw new Error("Submission handler not found");
        return apiPromise;
      }

      if (apiPromise instanceof Promise) {
        await apiPromise;
      }

      if (selectedScope === "bulk") {
        saveBulkTableSelection();
        automaticallySavesBulkPartitionsData();
      } else if (selectedScope === "subset") {
        saveSubsetTableSelection();
      }

      handleIsVisibleFooter(true);
    } catch (error) {
      throw error;
    }
  };

  const isSourceTableChecked = (source_table_name) => {
    const checkedSourceTable = checkedBulkTables.find(
      (el) => source_table_name in el
    );
    return checkedSourceTable[source_table_name];
  };

  const isTargetTableChecked = (source_table_name, target_table_name) => {
    const checkedSourceTable = checkedBulkTables.find(
      (el) => source_table_name in el
    );
    return checkedSourceTable.target_tables[target_table_name];
  };

  const toggleSourceTableChecked = (source_table_name) => {
    const newCheckedBulkTables = [...checkedBulkTables];
    const checkedSourceTable = newCheckedBulkTables.find(
      (el) => source_table_name in el
    );
    checkedSourceTable[source_table_name] =
      !checkedSourceTable[source_table_name];
    setCheckedBulkTables(newCheckedBulkTables);
  };

  const toggleTargetTableChecked = (source_table_name, target_table_name) => {
    const newCheckedBulkTables = [...checkedBulkTables];
    const checkedSourceTable = newCheckedBulkTables.find(
      (el) => source_table_name in el
    );
    checkedSourceTable.target_tables[target_table_name] =
      !checkedSourceTable.target_tables[target_table_name];
    setCheckedBulkTables(newCheckedBulkTables);
  };

  const setAllTargetTablesChecked = (source_table_name, updated_is_checked) => {
    const newCheckedBulkTables = [...checkedBulkTables];
    const checkedSourceTable = newCheckedBulkTables.find(
      (el) => source_table_name in el
    );
    for (let target_table_name in checkedSourceTable.target_tables) {
      checkedSourceTable.target_tables[target_table_name] = updated_is_checked;
    }
    setCheckedBulkTables(newCheckedBulkTables);
  };

  const handleSourceTableOnChange = (e, source_table_name) => {
    if (isSourceTableChecked(source_table_name)) {
      setAllTargetTablesChecked(source_table_name, false);
    } else {
      setAllTargetTablesChecked(source_table_name, true);
    }
    toggleSourceTableChecked(source_table_name);
  };

  const handleTargetTableOnChange = (e, source_table_name, target_table_name) => {
    toggleTargetTableChecked(source_table_name, target_table_name);

    // Check/uncheck source based on target tables
    const checkedSourceTable = checkedBulkTables.find(
      (el) => source_table_name in el
    );
    const targetTables = checkedSourceTable.target_tables;

    // Check if all target tables are checked or all are unchecked
    const allTargetTablesChecked = Object.values(targetTables).every(
      (value) => value === true
    );
    const allTargetTablesUnchecked = Object.values(targetTables).every(
      (value) => value === false
    );

    // Update source table checked state if needed
    if (allTargetTablesChecked && !checkedSourceTable[source_table_name]) {
      // If all target tables are checked, mark source table as checked
      toggleSourceTableChecked(source_table_name);
    } else if (
      allTargetTablesUnchecked &&
      checkedSourceTable[source_table_name]
    ) {
      // If all target tables are unchecked, mark source table as unchecked
      toggleSourceTableChecked(source_table_name);
    }
  };

  return (
    <div
      className="bg-white rounded-lg p-4 shadow-md border-2 border-[#8E77BB]
                             w-fit min-w-min max-w-[90vw]
                             relative group
                             grid grid-cols-[repeat(auto-fit,minmax(min-content,1fr))]
                             "
    >
      <button
        onClick={() => window.deleteNode?.(id)}
        className="absolute top-1.5 right-2 p-1"
      >
        <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
      </button>

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />

      <div className="flex items-center space-x-3 mb-3">
        <Upload className="w-5 h-5 text-[#96CF7B]" />
        <h3 className="text-black font-medium">Target</h3>
      </div>

      <div className="space-y-1.5">
        <div>
          <label className="text-xs font-semibold text-black mb-0.5 block">
            Connection
          </label>
          <select
            className="w-full p-1 text-[10px] bg-white rounded-sm border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
            value={targetConnection}
            onChange={(e) => {
              const connectionName = e.target.value;
              setTargetConnection(connectionName);
              setSelectedSchema("");
              fetchSchema(connectionName);
              fetchMetadata();
            }}
          >
            <option value="">Select</option>
            {connections
              .filter((connection) => connection?.pool_type === "target" || connection?.pool_type === "both")
              .map((connection, idx) => (
                <option key={idx} value={connection.connection_name}>
                  {connection.connection_name}
                </option>
              ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-black mb-0.5 block">
            Schema
          </label>
          <select
            className="w-full p-1 text-[10px] bg-white rounded-sm border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
            value={selectedSchema}
            onChange={(e) => {
              const schemaName = e.target.value;
              setSelectedSchema(schemaName);
            }}
          >
            <option value="">Select</option>
            {schemas.map((schema, idx) => (
              <option key={idx} value={schema.table_schema}>
                {schema.table_schema}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* {targetConnection && selectedSchema && selectedScope === "bulk" &&
        (mappedTargetTables.length === 0 ? (
          <div className="text-xs font-semibold text-black mt-4">
            {" "}
            No Data Set Found{" "}
          </div>
        ) : (
          <div className="flex flex-col space-y-2 mt-3 justify-between">
            <span className="text-xs font-semibold text-black">Data Set</span>
            {mappedTargetTables.map((targetTable, idx) => (
              <div key={idx}>
                <div className="flex space-x-2 space-y-3">
                  <label
                    htmlFor={`table-${idx}`}
                    className="text-xs font-semibold text-black"
                  >
                    {targetTable}
                  </label>
                </div>
              </div>
            ))}
          </div>
        ))} */}

      {/* {targetConnection && selectedSchema && selectedScope === "bulk" && (
        <div>
          <div className="flex items-center gap-2 mb-0.5 mt-4">
            <Search size={14} className="text-gray-500" />
            <label className="text-xs font-semibold text-black">Data Set</label>
          </div>
          <div>
            <input
              type="search"
              placeholder="Search datasets..."
              className="w-full p-2 mb-2 text-xs text-black border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {loading ? (
                <>
                  <SkeletonLoader />
                  <SkeletonLoader />
                  <SkeletonLoader />
                </>
              ) : (
                <>
                  {filterMetaData
                    .filter((table) => table !== null)
                    .filter(
                      (connection) =>
                        connection.target_conn_name == targetConnection
                    ).length === 0 ? (
                    <div className="text-xs font-semibold text-black mt-2">
                      {" "}
                      No Data Set Found{" "}
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 mt-2">
                          <input
                            type="checkbox"
                            id="select-all"
                            className="h-3 w-3 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            checked={
                              selectedTargetTables.length ===
                              filterMetaData.length
                            } // Check if all items are selected
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              if (isChecked) {
                                setSelectedTargetTables(
                                  filterMetaData
                                    .filter((table) => table !== null)
                                    .map((table) => table.target_table)
                                );
                              } else {
                                setSelectedTargetTables([]);
                              }
                            }}
                          />
                          <label
                            htmlFor="select-all"
                            className="text-xs font-semibold text-black"
                          >
                            Select all
                          </label>
                        </div>
                      </div>

                      {filterMetaData
                        .filter((table) => table !== null)
                        .filter(
                          (connection) =>
                            connection.target_conn_name == targetConnection
                        )
                        .map((table, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`table-${idx}`}
                                checked={selectedTargetTables.includes(
                                  table.target_table
                                )}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setSelectedTargetTables((prev) =>
                                    checked
                                      ? [...prev, table.target_table]
                                      : prev.filter(
                                          (i) => i !== table.target_table
                                        )
                                  );
                                }}
                                className="h-3 w-3 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                              />
                              <label
                                htmlFor={`table-${idx}`}
                                className="text-xs font-semibold text-black"
                              >
                                {table.target_table}
                              </label>
                            </div>
                            <button
                                onClick={() => {
                                  openDrawer(id, table);
                                  handlePurgeNode("Target Node");
                                }}
                                className="text-purple-600 hover:text-purple-700"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                          </div>
                        ))}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )} */}

      {/* {targetConnection && selectedSchema && selectedScope === "bulk" &&
        (mappedTargetTables.length === 0 ? (
          <div className="text-xs font-semibold text-black mt-4">
            {" "}
            No Data Set Found{" "}
          </div>
        ) : (
          <div className="flex flex-col space-y-2 mt-3 justify-between">
            <span className="text-xs font-semibold text-black">Data Set</span>
            {mappedTargetTables.map((targetTable, idx) => (
              <div key={idx}>
                <div className="flex space-x-2 space-y-3">
                  <label
                    htmlFor={`table-${idx}`}
                    className="text-xs font-semibold text-black"
                  >
                    {targetTable}
                  </label>
                </div>
              </div>
            ))}
          </div>
        ))} */}

      {targetConnection && selectedSchema && selectedScope === "bulk" && (
        <div>
          <div className="flex items-center gap-2 mb-3 mt-4">
            <label className="text-xs font-semibold text-black">Data Set</label>
          </div>
          <div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {loading ? (
                <>
                  <SkeletonLoader />
                  <SkeletonLoader />
                  <SkeletonLoader />
                </>
              ) : (
                <>
                  {selectedTables.length === 0 ||
                  sourceMappedTargetTables.length === 0 ? (
                    <div className="text-xs font-semibold text-black mt-2">
                      {" "}
                      No Data Set Found{" "}
                    </div>
                  ) : (
                    <>
                      {/* <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 mt-2">
                          <input
                            type="checkbox"
                            id="select-all"
                            className="h-3 w-3 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            checked={
                              selectedTargetTables.length ===
                              filterMetaData.length
                            } // Check if all items are selected
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              if (isChecked) {
                                setSelectedTargetTables(
                                  filterMetaData
                                    .filter((table) => table !== null)
                                    .map((table) => table.target_table)
                                );
                              } else {
                                setSelectedTargetTables([]);
                              }
                            }}
                          />
                          <label
                            htmlFor="select-all"
                            className="text-xs font-semibold text-black"
                          >
                            Select all
                          </label>
                        </div>
                      </div> */}

                      {sourceMappedTargetTables.map(
                        (sourceGroup, sourceIdx) => (
                          <div
                            key={sourceIdx}
                            className="border rounded-md p-2 m-2"
                          >
                            <div className="flex items-center mb-2">
                              <input
                                type="checkbox"
                                id={`source-${sourceIdx}`}
                                checked={isSourceTableChecked(
                                  sourceGroup.source_table
                                )}
                                onChange={(e) =>
                                  handleSourceTableOnChange(
                                    e,
                                    sourceGroup.source_table
                                  )
                                }
                                className="h-4 w-4 mr-2 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                              />
                              <label
                                //onClick={() => toggleSection(sourceIdx)}
                                className="text-sm font-bold text-black hover:text-purple-600 focus:outline-none"
                              >
                                {sourceGroup.source_table}
                              </label>
                            </div>

                            <div className="ml-6 space-y-4">
                              {sourceGroup.target_tables.map(
                                (targetTable, targetIdx) => (
                                  <div
                                    key={targetIdx}
                                    className="flex items-center justify-between"
                                  >
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        id={`target-${sourceIdx}-${targetIdx}`}
                                        checked={isTargetTableChecked(
                                          sourceGroup.source_table,
                                          targetTable
                                        )}
                                        onChange={(e) => {
                                          setSelectedBulkTables(targetTable);
                                          //fetchDropPartitions();
                                          handleTargetTableOnChange(
                                            e,
                                            sourceGroup.source_table,
                                            targetTable
                                          );
                                        }}
                                        className="h-3 w-3 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                      />
                                      <label
                                        //htmlFor={`target-${sourceIdx}-${targetIdx}`}
                                        className="text-xs font-semibold text-black"
                                      >
                                        {targetTable}
                                      </label>
                                    </div>
                                    {/* <button
                                      onClick={async () => {
                                        const table =
                                          await fetchMetadataAccToConnectionAndBulkTable(
                                            targetConnection,
                                            targetTable
                                          );
                                        handlePurgeNode("Target node");
                                        openDrawer(
                                          id,
                                          table[0] ? table[0] : targetTable
                                        );
                                      }}
                                      className="text-purple-600 hover:text-purple-700 pl-2"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button> */}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {targetConnection && selectedSchema && selectedScope === "subset" && (
        <div>
          <div className="flex items-center gap-2 mb-0.5 mt-4">
            <Search size={14} className="text-gray-500" />
            <label className="text-xs font-semibold text-black">Data Set</label>
          </div>
          <input
            type="search"
            placeholder="Search datasets..."
            className="w-full p-2 mb-2 text-xs text-black border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {loading ? (
              <>
                <SkeletonLoader />
                <SkeletonLoader />
                <SkeletonLoader />
              </>
            ) : (
              <>
                {filteredTables
                  .filter((table) => table !== null)
                  .map((table, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`table-${idx}`}
                          checked={selectedTableName.includes(table.table_name)}
                          onChange={() =>
                            handleTableSelection(table.table_name)
                          }
                          className="h-3 w-3 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          disabled={
                            selectedScope === "subset" &&
                            table.length > 0 &&
                            !selectedTables.includes(table.table_name)
                          }
                        />
                        <label
                          htmlFor={`table-${idx}`}
                          className="text-xs font-semibold text-black"
                        >
                          {table.table_name}
                        </label>
                      </div>
                      {/* <button
                        onClick={() => {
                          handlePurgeNode("Target node");
                          openDrawer(id, table);
                        }}
                        className="text-purple-600 hover:text-purple-700"
                      >
                        <Pencil className="w-4 h-4" />
                      </button> */}
                    </div>
                  ))}
              </>
            )}
          </div>
        </div>
      )}
      <div className="flex space-x-2 mt-4">
        <button className="bg-transparent hover:bg-[#8e78b7] text-xs text-gray-700 font-semibold hover:text-white py-2 px-10 border border-gray-700 hover:border-transparent rounded">
          Cancel
        </button>
        <button
          //onClick={() => { handleIsVisibleFooter(true) }}
          onClick={handleOkClick}
          className="bg-transparent hover:bg-[#8e78b7] text-xs text-gray-700 font-semibold hover:text-white py-2 px-10 border border-gray-700 hover:border-transparent rounded"
        >
          OK
        </button>
      </div>
    </div>
  );
}

TargetNode.propTypes = {
  id: PropTypes.string.isRequired,
  data: PropTypes.object,
};
