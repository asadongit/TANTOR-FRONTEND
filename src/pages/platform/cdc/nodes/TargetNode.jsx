import React, { useState, useCallback, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { Position } from "reactflow";
import { useDrawerContext } from "../context/DrawerContext";
import { CustomHandle } from "../components/CustomHandle";
import { useWorkflow } from "../context/WorkflowContext";
import { Minus, X, Search, Pencil } from "lucide-react";
import { toast as hotToast } from "react-hot-toast";
import { SkeletonLoader } from "../components/skeltonLoader";
export function TargetNode({ id, data, selected }) {
  // console.log("Target-Data--------------------------------", data);
  const hostname = import.meta.env.VITE_FAST_API;
  const token = import.meta.env.VITE_ACCESS_TOKEN;
  const hostnamev2 = import.meta.env.VITE_FAST_API_V2;

  const [connections, setConnections] = useState([]);
  const [schemaCount, setSchemacount] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [schemas, setSchema] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState("");
  const [selectedSchema, setSelectedSchema] = useState("");
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { openDrawer } = useDrawerContext();
  const [sourceConnection, setSourceConnection] = useState("");
  const [bulkList, setBulkList] = useState([]);
  const [nodeData, setNodeData] = useState(() => ({
    connection: "",
    schema: "",
    mode: "",
    bulk_list: [],
    subset_list: [],
  }));

  const pipelineId = data?.pipelineId;
  const isPipelineNode = pipelineId !== undefined;
  const ID = isPipelineNode ? pipelineId : id;

  const {
    pipelines,
    completeMapping,
    pipelineMappings,
    inProgressMappings,
    updateData,
  } = useWorkflow();

  useEffect(() => {
    let sourceData = isPipelineNode
      ? pipelines?.[pipelineId]?.data?.source
      : data?.source;
    if (sourceData) {
      setSourceConnection(sourceData?.connection || "");
      setBulkList(sourceData?.bulk_list || []);
      setSelectedMode(sourceData?.mode || "bulk");
    }
  }, [pipelines, pipelineId, data?.source]);

  const fetchConnections = useCallback(async () => {
    try {
      const connectionResponse = await fetch(`${hostname}/connection-saves`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const connectionsData = await connectionResponse.json();
      sessionStorage.setItem(
        "connectionResponse",
        JSON.stringify(connectionsData)
      );
      setConnections(connectionsData);
    } catch (error) {
      console.error("Error fetching options:", error);
      setConnections([]);
    }
  }, []);

  const fetchschemas = useCallback(async (connectionName) => {
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

      const schemadetails = await response.json();
      sessionStorage.setItem("schemalist", JSON.stringify(schemadetails));
      setSchema(schemadetails);
    } catch (error) {
      console.error("Error fetching schemas:", error);
      setSchema([]);
    } finally {
      setSchemaLoading(false);
    }
  }, []);

  const fetchschemascount = useCallback(async (connectionName) => {
    if (!connectionName) {
      setSchemacount([]);
      return;
    }

    try {
      const cachedschemacount = sessionStorage.getItem("schemacount");
      if (cachedschemacount) {
        const schemacount = JSON.parse(cachedschemacount);
        setSchemacount(schemacount);
      } else {
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

        const schemacount = await response.json();
        sessionStorage.setItem("schemacount", JSON.stringify(schemacount));
        setSchemacount(schemacount);
      }
    } catch (error) {
      console.error("Error fetching schemas:", error);
      setSchemacount([]);
    }
  }, []);

  const fetchDDL = useCallback(
    async (sourceConnection, selectedConnection, schemaName, bulkList) => {
      if (
        !sourceConnection ||
        !selectedConnection ||
        !schemaName ||
        !bulkList ||
        bulkList.length === 0
      ) {
        console.log("EMPTY MODE ENTERINGNGINGINGI");
        setSelectedItems([]);
        setTables([]);
        setLoading(false);
        return;
      }

      try {
        const connectionResponse = await fetch(
          `${hostnamev2}/metadata-archivals-tables?source_conn_name=${sourceConnection}&target_conn_name=${selectedConnection}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!connectionResponse.ok) {
          throw new Error(`HTTP error! status: ${connectionResponse.status}`);
        }

        const ddlData = await connectionResponse.json();
        console.log("DDL Data:", ddlData);

        const filteredData =
          Array.isArray(ddlData) && Array.isArray(bulkList)
            ? ddlData.filter((item) =>
                bulkList.some((bulk) => bulk.metadata_id === item.metadata_id)
              )
            : [];

        setSelectedItems(filteredData);
        setTables(filteredData);
      } catch (error) {
        console.error("Error fetching DDL data:", error);
        setSelectedItems([]);
        setTables([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchTables = useCallback(async (connectionName, schemaName) => {
    if (!connectionName || !schemaName) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${hostname}/connection-master-metadata/find-by-conn-name-type?conn_name=${connectionName}&schema_name=${schemaName}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch tables: ${response.status}`);
      }

      const tableDetails = await response.json();
      const normalizedTables = tableDetails.map((item) => ({
        target_table: item.table_name,
        connection_name: item.connection_name,
        connection_id: item.connection_id,
        source_schema: item.source_schema,
      }));

      setTables(normalizedTables);
    } catch (error) {
      console.error("Error fetching tables:", error);
      setTables([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  useEffect(() => {
    if (selectedConnection && selectedSchema && ID) {
      const updatedNodeData = {
        connection: selectedConnection,
        schema: selectedSchema,
        mode: selectedMode,
        bulk_list: selectedItems.map((item) => item.metadata_id),
      };
      setNodeData(updatedNodeData);

      updateData(ID, isPipelineNode, "target", updatedNodeData);
    }
  }, [selectedConnection, selectedSchema, selectedItems]);

  useEffect(() => {
    if (selectedSchema) {
      selectedMode === "bulk"
        ? fetchDDL(
            sourceConnection,
            selectedConnection,
            selectedSchema,
            bulkList
          )
        : fetchTables(selectedConnection, selectedSchema);
    }
  }, [selectedSchema, bulkList]);

  const filteredTables = useMemo(() => {
    if (!tables || !tables.length) return [];

    return tables
      .filter((table) => table && table.target_table)
      .filter((table) =>
        table.target_table
          .toLowerCase()
          .includes(searchTerm?.toLowerCase() || "")
      );
  }, [tables, searchTerm, bulkList]);

  const handleOkClick = () => {
    if (selectedConnection && selectedSchema && selectedMode) {
      const updatedNodeData = {
        connection: selectedConnection,
        schema: selectedSchema,
        mode: selectedMode,
        bulk_list: selectedItems.map((item) => item.metadata_id),
      };
      updateData(ID, isPipelineNode, "target", updatedNodeData);
    }
  };

  const showTablesList = Boolean(
    selectedMode === "bulk"
      ? tables.length > 0 || loading
      : (pipelineMappings[pipelineId]?.length ?? 0) > 0
  );

  const pipelineData = pipelineMappings[pipelineId] || [];
  const targetTables = pipelineData.map((mapping) => mapping.targetTable);
  const sourceTables = pipelineData.map((mapping) => mapping.sourceTable);
  const sourceTable = isPipelineNode
    ? inProgressMappings[pipelineId]?.sourceTable
    : inProgressMappings[data?.source?.id]?.sourceTable;

  console.log("slectedModeTARGET", selectedMode);
  return (
    <div
      className={`bg-white rounded-lg p-3 pt-2 shadow-md border-2 ${
        selected ? "border-[#8E77BB]" : "border-gray-300"
      } w-fit min-w-[18vw] max-w-[90vw] relative group grid grid-cols-[repeat(auto-fit,minmax(min-content,1fr))]`}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-1">
          <iconify-icon
            icon="material-symbols-light:ads-click"
            style={{ color: "#8e78b7" }}
            width="24"
            height="24"
          ></iconify-icon>
          <h3 className="text-black font-medium">Target</h3>
        </div>

        {!data?.pipelineId && (
          <div className="flex space-x-2">
            <button className="p-1">
              <Minus className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
            <button onClick={() => window.deleteNode?.(id)} className="p-1">
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          </div>
        )}
      </div>

      <CustomHandle type="target" position={Position.Left} />
      <CustomHandle type="source" position={Position.Right} />

      <div className="space-y-1.5">
        <div>
          <label className="text-xs font-medium text-black mb-0.5 block">
            Connection
          </label>
          <div className="w-full">
            <select
              className="w-full p-1 text-[10px] bg-white rounded-sm border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
              value={selectedConnection}
              onChange={(e) => {
                const connectionName = e.target.value;
                setSelectedConnection(connectionName);
                setSelectedSchema("");
                setTables([]);
                fetchschemas(connectionName);
                fetchschemascount(connectionName);
              }}
            >
              <option value="">Select Connection</option>
              {connections.map((connection, idx) => (
                <option key={idx} value={connection.connection_name}>
                  {connection.connection_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-black mb-0.5 block">
            Schema
          </label>
          <div className="relative w-full flex items-center gap-2">
            <div className="w-full relative">
              <select
                className="w-full min-w-0 p-1 text-[10px] bg-white rounded-sm border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                value={selectedSchema}
                onChange={(e) => {
                  const schemaName = e.target.value;
                  setSelectedSchema(schemaName);
                  setLoading(true);
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

              {schemaLoading && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <div className="animate-spin h-4 w-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>

            <span className="text-black font-bold">
              {schemaCount.schema_count}
            </span>
          </div>
        </div>
      </div>

      {showSearch && tables.length > 0 && (
        <input
          type="search"
          placeholder="Search datasets..."
          className="w-full p-2 mb-2 text-xs text-black border border-gray-300 rounded-lg focus:outline-none focus:border-[#8e78b7]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      )}

      {filteredTables &&
        filteredTables.length > 0 &&
        selectedMode === "subset" && (
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm font-semibold text-black">Map for:</span>
              <span className="text-sm text-gray-700">
                {sourceTable || "No source selected"}
              </span>
            </div>
            <select
              id="connection-select"
              className="w-full p-1 text-[10px] bg-white rounded-sm border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
              // value={selectedConnection}
              onChange={(e) => completeMapping(pipelineId, e.target.value)}
            >
              <option value="">Select Table</option>
              {filteredTables.map((table, idx) => (
                <option
                  key={idx}
                  // value={table.connection_name}
                >
                  {table.target_table}
                </option>
              ))}
            </select>
          </div>
        )}

      {showTablesList && (
        <div className="my-3">
          <div className="flex items-center justify-between mb-2">
            <div
              className="flex items-center gap-1 cursor-pointer"
              onClick={() => setShowSearch(!showSearch)}
            >
              <label className="text-sm font-medium text-black">Data Set</label>
              {showSearch && <Search size={16} className="text-gray-500" />}
            </div>
          </div>

          <div
            className="space-y-2 max-h-40 overflow-y-auto mt-2"
            onWheelCapture={(e) => e.stopPropagation()}
          >
            {loading ? (
              <>
                <SkeletonLoader />
                <SkeletonLoader />
                <SkeletonLoader />
              </>
            ) : filteredTables.length === 0 ? (
              <div className="text-sm text-gray-500 py-2">No tables found</div>
            ) : (
              <div>
                {selectedMode == "bulk" ? (
                  filteredTables.map((table, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`table-${idx}`}
                          checked={selectedItems.some(
                            (i) => i.metadata_id === table.metadata_id
                          )}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setSelectedItems((prev) =>
                              checked
                                ? [...prev, table]
                                : prev.filter(
                                    (i) => i.metadata_id !== table.metadata_id
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
                        onClick={() =>
                          openDrawer(
                            data?.category,
                            "condition",
                            id,
                            data?.pipelineId,
                            table
                          )
                        }
                        className="text-purple-600 hover:text-purple-700"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="max-w-sm mx-auto">
                      <div>
                        {targetTables.map((targetTable, idx) => (
                          <div
                            key={`target-table-${idx}`}
                            className="flex items-center justify-between mt-4"
                          >
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`target-${idx}`}
                                checked={true}
                                onChange={(e) =>
                                  handleItemSelection(e.target.checked, {
                                    source_table: sourceTables[idx],
                                    target_table: targetTable,
                                  })
                                }
                                className="h-3 w-3 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                              />
                              <label
                                htmlFor={`target-${idx}`}
                                className="text-xs font-semibold text-black"
                              >
                                {targetTable}
                              </label>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() =>
                                  openDrawer(
                                    data.category,
                                    "editTable",
                                    id,
                                    data.pipelineId,
                                    sourceTable
                                  )
                                }
                                className="text-purple-600 hover:text-purple-700"
                                aria-label={`Edit ${sourceTable}`}
                              >
                                <Pencil className="w-4 h-4" />
                              </button>

                              {/* <button
                                                            onClick={() =>
                                                              openDrawer(
                                                                data.category,
                                                                "editTable",
                                                                id,
                                                                data.pipelineId,
                                                                sourceTable
                                                              )
                                                            }
                                                            className="text-red-600 hover:text-red-700"
                                                            aria-label={`Delete ${sourceTable}`}
                                                          >
                                                            <Trash2 className="w-4 h-4" />
                                                          </button> */}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {selectedMode == "subset" && (
        <button
          className="w-full py-1 px-4 flex items-center justify-center border border-dashed border-[#8e78b7]  text-[#8e78b7] rounded-md  bg-transparent transition-all duration-200 ease-in-out
                                                          hover:bg-[#8e78b7] hover:text-white mt-2"
          onClick={() =>
            sourceTable
              ? openDrawer(
                  data?.category,
                  "addtable",
                  id,
                  data?.pipelineId,
                  sourceTable
                )
              : hotToast.error("No source table selected")
          }
        >
          + Add table
        </button>
      )}
      {/* <div className="flex space-x-2 mt-4">
        <button className="bg-transparent hover:bg-[#8e78b7] text-xs text-gray-700 font-semibold hover:text-white py-2 px-10 border border-gray-700 hover:border-transparent rounded"
        onClick={
          ()=>{
            setSelectedConnection("");
            setSelectedSchema("");
            setSchemacount([])
            setTables([]);
          }
          }
        
        >
          Cancel
        </button>
        <button 
          onClick={handleOkClick}
          className="bg-transparent hover:bg-[#8e78b7] text-xs text-gray-700 font-semibold hover:text-white py-2 px-10 border border-gray-700 hover:border-transparent rounded">
          OK
        </button>
      </div> */}
    </div>
  );
}

TargetNode.propTypes = {
  id: PropTypes.string.isRequired,
  data: PropTypes.object.isRequired,
  selected: PropTypes.bool,
};
