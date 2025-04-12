import { useState, useCallback, useEffect } from "react";
import PropTypes from "prop-types";
import { Handle, Position } from "reactflow";
import { Upload, X, Search, Pencil } from "lucide-react";
import { useTableContext } from "../../react-flow/context/TableContext";
import { useStateContext } from "../../react-flow/context/ContextProvider";
import { SkeletonLoader } from "../../react-flow/SkeletonLoader";
import { toast } from "react-hot-toast";
import { useAuth } from "../../../../context/AuthContext";
import { usePurgeContext } from "../../react-flow/context/PurgeContext";

export function SourceNode({ id }) {
  const hostname = import.meta.env.VITE_FAST_API;
  const { token, decodedToken } = useAuth();

  const [connections, setConnections] = useState([]);
  const [schemaCount, setSchemacount] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [schemas, setSchema] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedConnection, setSelectedConnection] = useState("");
  const [selectedSchema, setSelectedSchema] = useState("");
  const [schemaLoading, setSchemaLoading] = useState(false);
  const { openDrawer } = useTableContext();
  const [metadata, setMetaData] = useState([]);
  const [selectedPurgeScope, setSelectedPurgeScope] = useState("");
  const {
    handleSelectedTables,
    handleSourceConnectionName,
    handleSelectedDataSetName,
    handleSelectedScopeName,
    handlePurgeNode,
    handleFirstSourcePartitionName,
    //firstSourcePartitionName,
    handleSourceSelectedTable,
  } = useStateContext("");
  const { saveSourceData, sourceData } = usePurgeContext("");
  const [selectedTables, setSelectedTables] = useState("");

  let connectionsData;
  let schemacount;
  let schemadetails;
  let tabledetails;
  let metadatalist;

  const node = "Source Node";

  const fetchOptions = useCallback(async () => {
    try {
      const connectionResponse = await fetch(`${hostname}/connection-saves`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      connectionsData = await connectionResponse.json();

      setConnections(connectionsData);
    } catch (error) {
      console.error("Error fetching options:", error);
    }
  }, []);

  const fetchschemacount = useCallback(
    async (connectionName) => {
      if (!connectionName) {
        setSchemacount([]);
        return;
      }
      try {
        const response = await fetch(
          `${hostname}/schema/${connectionName}/count`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        schemacount = await response.json();

        setSchemacount(schemacount);
      } catch (error) {
        console.error("Error fetching schemas:", error);
        setSchemacount([]);
      }
    },
    [hostname, token]
  );

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  const fetchschema = useCallback(
    async (connectionName) => {
      if (!connectionName) {
        setSchema([]);
        return;
      }
      setSchemaLoading(true);
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
        setSchemaLoading(false);
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

      setLoading(true);
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
    setLoading(true);
    try {
      const cachedmetadatalist = sessionStorage.getItem("metadatalist");
      // if (cachedmetadatalist) {
      //   metadatalist = JSON.parse(cachedmetadatalist);
      // }
      const metaDataResponse = await fetch(`${hostname}/metadata-archivals`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!metaDataResponse.ok) {
        throw new Error(`HTTP error! status: ${metaDataResponse.status}`);
      }

      metadatalist = await metaDataResponse.json();
      //sessionStorage.setItem("metadatalist", JSON.stringify(metadatalist));
      setMetaData(metadatalist);
    } catch (error) {
      console.error("Error fetching tables:", error);
      setMetaData([]);
    } finally {
      setLoading(false);
    }
  }, [hostname, token]);

  const filteredTables = tables.filter((table) =>
    table.table_name.toLowerCase().includes(searchTerm?.toLowerCase() || "")
  );

  const filterMetaData = metadata.filter((sourceTable) =>
    sourceTable.source_table
      .toLowerCase()
      .includes(searchTerm?.toLowerCase() || "")
  );

  useEffect(() => {
    handleSelectedTables(selectedItems);
    handleSourceConnectionName(selectedConnection);
  }, [selectedItems]);

  useEffect(() => {
    handleSelectedScopeName(selectedPurgeScope);
    handleSourceConnectionName(selectedConnection);
  }, [selectedPurgeScope]);

  const handleTableSelection = (tableName) => {
    if (selectedPurgeScope === "subset") {
      setSelectedTables([tableName]);
    } else {
      setSelectedTables((prev) =>
        prev.includes(tableName)
          ? prev.filter((item) => item !== tableName)
          : [...prev, tableName]
      );
    }
  };

  const validateSelection = (defineNode, sourceNode) => {
    const { name, desc } = defineNode;
    const {
      source_conn_name,
      purge_scope: source_purge_scope,
      selectedTables: sourceTables,
    } = sourceNode;

    if (!name) {
      return { valid: false, message: "Name must be selected on Define Node." };
    }

    if (!desc) {
      return {
        valid: false,
        message: "Description should be selected on Define Node.",
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

    return { valid: true, message: "Selection is valid." };
  };

  const { defineNodeName, defineNodeDesc } = useStateContext("");

  const saveNode = () => {
    const tableName = selectedTables[0];
    const selectedConnectionData = connections.find(
      (connection) => connection.connection_name === selectedConnection
    );
    const connectionType = selectedConnectionData?.connection_type;
    const connectionId = selectedConnectionData?.connection_id;

    saveSourceData(
      connectionId,
      selectedConnection,
      connectionType,
      tableName,
      selectedSchema,
      connectionType
    );
  };

  const handleOKSlection = () => {
    const defineNode = {
      name: defineNodeName || "",
      desc: defineNodeDesc || "",
    };

    const sourceNode = {
      source_conn_name: selectedConnection || "",
      purge_scope: selectedPurgeScope || "",
      selectedTables: selectedPurgeScope === "subset" && selectedTables,
    };

    const validationResult = validateSelection(defineNode, sourceNode);

    if (!validationResult.valid) {
      toast.error(validationResult.message);
      return;
    } else {
      saveNode();
      toast.success("Table updated successfully");
    }
  };

  const [firstSourcePartitionName, setFirstSourcePartitionName] = useState("");

  const getFirstPartitionNameFromTable = (table) => {
    if (!table?.partition_json) return null;
    console.log("table in source node ---> ", table);

    if (table.partition_json.length === 0) return null;

    const sortedPartitions = [...table.partition_json].sort(
      (a, b) => a.partition_id - b.partition_id
    );

    return sortedPartitions[0]?.partition_name || null;
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
        <h3 className="text-black font-medium">Source</h3>
      </div>
      <div className="space-y-1.5">
        <div>
          <label className="text-xs font-semibold text-black mb-0.5 block">
            Connection
          </label>
          <select
            className="w-full p-1 text-[10px] bg-white rounded-sm border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
            value={selectedConnection}
            onChange={(e) => {
              const connectionName = e.target.value;
              setSelectedConnection(connectionName);
              setSelectedSchema(""); // Reset schema selection
              setTables([]); // Clear previous tables
              fetchschema(connectionName);
              fetchschemacount(connectionName);
            }}
          >
            <option value="">Select</option>
            {connections.map((connection, idx) => (
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
          <div className="flex items-center">
            <select
              className="w-full p-1 text-[10px] bg-white rounded-sm border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
              value={selectedSchema}
              onChange={(e) => {
                const schemaName = e.target.value;
                setSelectedSchema(schemaName);
              }}
              disabled={!selectedConnection || schemaLoading}
            >
              {schemaLoading ? (
                <option value="">Loading schemas...</option>
              ) : (
                <>
                  <option value="">Select Schema</option>
                  {schemas.map((schema, idx) => (
                    <option key={idx} value={schema.table_schema}>
                      {schema.table_schema}
                    </option>
                  ))}
                </>
              )}
            </select>
            {/* Loading Indicator */}
            {schemaLoading && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <div className="animate-spin h-4 w-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
              </div>
            )}
            <span className="ml-5 text-black font-bold">
              {schemaCount.schema_count}
            </span>
          </div>
        </div>
      </div>
      <div className="space-y-4 mt-3">
        <label className="text-xs font-semibold text-black mb-0.5 block">
          Purge Scope
        </label>
        <div className="flex gap-4 items-center">
          <label className="text-xs text-black font-medium">Table</label>
          <div className="flex items-center">
            <input
              type="radio"
              id="table-bulk"
              name="table"
              value="bulk"
              onChange={(e) => {
                const scopeName = e.target.value;
                setSelectedPurgeScope(scopeName);
                fetchMetadata();
              }}
              className="h-3 w-3 border-gray-300 text-blue-600 focus:ring-blue-500 ml-10"
            />
            <label htmlFor="table-bulk" className="ml-2 text-xs text-gray-700">
              Bulk
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="radio"
              id="table-subset"
              name="table"
              value="subset"
              onChange={(e) => {
                const scopeName = e.target.value;
                setSelectedPurgeScope(scopeName);
                fetchTables(selectedConnection, selectedSchema);
              }}
              className="h-3 w-3 border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="table-subset"
              className="ml-2 text-xs text-gray-700"
            >
              Subset
            </label>
          </div>
        </div>
      </div>

      {/* Column to be used later */}

      {/* <div className="flex gap-4 items-center mt-3">
        <label className="text-xs text-black font-medium">Column</label>
        <div className="flex items-center">
          <input
            type="radio"
            id="column-bulk"
            name="column"
            value="bulk"
            defaultChecked
            className="h-3 w-3 border-gray-300 text-blue-600 focus:ring-blue-500 ml-10"
          />
          <label htmlFor="column-bulk" className="ml-2 text-xs text-gray-700">
            Bulk
          </label>
        </div>
        <div className="flex items-center">
          <input
            type="radio"
            id="column-subset"
            name="column"
            value="subset"
            className="h-3 w-3 border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="column-subset" className="ml-2 text-xs text-gray-700">
            Subset
          </label>
        </div>
      </div> */}

      {selectedConnection &&
        selectedSchema &&
        selectedPurgeScope === "bulk" && (
          <div>
            <div className="flex items-center gap-2 mb-0.5 mt-4">
              <Search size={14} className="text-gray-500" />
              <label className="text-xs font-semibold text-black">
                Data Set
              </label>
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
                          connection.source_conn_name == selectedConnection
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
                                selectedItems.length === filterMetaData.length
                              } // Check if all items are selected
                              onChange={(e) => {
                                const isChecked = e.target.checked;
                                if (isChecked) {
                                  setSelectedItems(
                                    filterMetaData
                                      .filter((table) => table !== null)
                                      .map((table) => table.source_table)
                                  );
                                } else {
                                  setSelectedItems([]);
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
                              connection.source_conn_name == selectedConnection
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
                                  checked={selectedItems.includes(
                                    table.source_table
                                  )}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setSelectedItems((prev) =>
                                      checked
                                        ? [...prev, table.source_table]
                                        : prev.filter(
                                            (i) => i !== table.source_table
                                          )
                                    );
                                  }}
                                  className="h-3 w-3 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                />
                                <label
                                  htmlFor={`table-${idx}`}
                                  className="text-xs font-semibold text-black"
                                >
                                  {table.source_table}
                                </label>
                              </div>
                              <button
                                onClick={() => openDrawer(id, table)}
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
        )}

      {selectedConnection &&
        selectedSchema &&
        selectedPurgeScope === "subset" && (
          <div>
            <div className="flex items-center gap-2 mb-0.5 mt-4">
              <Search size={14} className="text-gray-500" />
              <label className="text-xs font-semibold text-black">
                Data Set
              </label>
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
                            checked={selectedTables.includes(table.table_name)}
                            onChange={() => {
                              handleTableSelection(table.table_name);
                              handleFirstSourcePartitionName(
                                getFirstPartitionNameFromTable(table)
                              );
                              handleSourceSelectedTable(table);
                              handleSelectedDataSetName([table.table_name]);
                            }}
                            className="h-3 w-3 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            disabled={
                              selectedPurgeScope === "subset" &&
                              table.length > 0 &&
                              !selectedTables.includes(
                                selectedTables.table_name
                              )
                            }
                          />
                          <label
                            htmlFor={`table-${idx}`}
                            className="text-xs font-semibold text-black"
                          >
                            {table.table_name}
                          </label>
                        </div>
                        <button
                          onClick={() => {
                            openDrawer(id, table);
                            handlePurgeNode("Source Node");
                          }}
                          className="text-purple-600 hover:text-purple-700"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
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
          onClick={handleOKSlection}
          className="bg-transparent hover:bg-[#8e78b7] text-xs text-gray-700 font-semibold hover:text-white py-2 px-10 border border-gray-700 hover:border-transparent rounded"
        >
          OK
        </button>
      </div>
    </div>
  );
}

SourceNode.propTypes = {
  id: PropTypes.string.isRequired,
};
