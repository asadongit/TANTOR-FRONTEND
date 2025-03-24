import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import PropTypes from "prop-types";
import { Position } from "reactflow";
import {
  Minus,
  X,
  Search,
  Pencil,
  ArrowDownUp,
  CirclePlus,
  Trash2,
} from "lucide-react";
import { useDrawerContext } from "../context/DrawerContext";
import { CustomHandle } from "../components/CustomHandle";
import { useWorkflow } from "../context/WorkflowContext";
import { SkeletonLoader } from "../components/skeltonLoader";
// export function SourceNode({ id, data, selected, dragging, isConnectable }) {

export function SourceNode({ id, data, selected }) {
  // console.log("SOURCE NODE DATA--------", data);
  const hostname = import.meta.env.VITE_FAST_API;
  const hostnamev2 = import.meta.env.VITE_FAST_API_V2;
  const token = import.meta.env.VITE_ACCESS_TOKEN;

  const [connections, setConnections] = useState([]);
  const [schemaCount, setSchemaCount] = useState({});
  const [selectedItems, setSelectedItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [schemas, setSchemas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState("");
  const [selectedSchema, setSelectedSchema] = useState("");
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState({});
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [nodeData, setNodeData] = useState(() => ({
    connection: "",
    schema: "",
    mode: "",
    bulk_list: [],
    subset_list: [],
    op_types: {
      create: false,
      update: false,
      delete: false,
      schemaChanges: false,
      datafederation: false,
    },
  }));

  const pipelineId = data?.pipelineId;
  const isPipelineNode = pipelineId !== undefined;
  const ID = isPipelineNode ? pipelineId : id;

  const { openDrawer } = useDrawerContext();
  const { selectSource, pipelineMappings, deleteMapping, updateData } =
    useWorkflow();

  const fetchConnections = useCallback(async () => {
    try {
      const response = await fetch(`${hostname}/connection-saves`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch connections: ${response.status}`);
      }

      const connectionsData = await response.json();
      const filteredData = connectionsData.filter(
        (item) =>
          item.pool_type === "both" ||
          (item.pool_type === "source" && item.created_by === "sorv") ||
          item.created_by === "novhi"
      );

      setConnections(filteredData);
    } catch (error) {
      console.error("Error fetching connections:", error);
    }
  }, []);

  const fetchSchemaCount = useCallback(async (connectionName) => {
    if (!connectionName) {
      setSchemaCount({});
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
        throw new Error(`Failed to fetch schema count: ${response.status}`);
      }

      const schemaCountData = await response.json();
      setSchemaCount(schemaCountData);
    } catch (error) {
      console.error("Error fetching schema count:", error);
      setSchemaCount({});
    }
  }, []);

  const fetchSchemas = useCallback(async (connectionName) => {
    if (!connectionName) {
      setSchemas([]);
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
        throw new Error(`Failed to fetch schemas: ${response.status}`);
      }

      const schemaDetails = await response.json();
      setSchemas(schemaDetails);
    } catch (error) {
      console.error("Error fetching schemas:", error);
      setSchemas([]);
    } finally {
      setSchemaLoading(false);
    }
  }, []);

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
        source_table: item.table_name,
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

  const fetchDDL = useCallback(async (connectionName, schemaName) => {
    if (!connectionName || !schemaName) return;

    setLoading(true);
    setTables([]);

    try {
      const response = await fetch(
        `${hostnamev2}/metadata-archivals-tables?schema_name=${schemaName}&source_conn_name=${connectionName}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch DDL: ${response.status}`);
      }

      const ddlData = await response.json();
      setTables(ddlData);
    } catch (error) {
      console.error("Error fetching DDL:", error);
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
        bulk_list: selectedItems,
        subset_list: pipelineMappings?.[ID] ?? [],
        op_types: nodeData.op_types,
      };

      setNodeData(updatedNodeData);
      updateData(ID, isPipelineNode, "source", updatedNodeData);
    }
  }, [selectedConnection, selectedSchema, selectedMode, selectedItems]);

  const filteredTables = useMemo(() => {
    if (!tables || !tables.length) return [];

    return tables
      .filter((table) => table && table.source_table)
      .filter((table) =>
        table.source_table
          .toLowerCase()
          .includes(searchTerm?.toLowerCase() || "")
      );
  }, [tables, searchTerm]);

  const handleSelectConnection = (connectionName) => {
    setSelectedConnection(connectionName);
    setSelectedSchema("");
    setSelectedItems([]);
    setTables([]);
    setSelectedMode("");

    if (connectionName) {
      fetchSchemas(connectionName);
      fetchSchemaCount(connectionName);
    }
  };

  const handleSelectSchema = (schemaName) => {
    setSelectedSchema(schemaName);
    setSelectedItems([]);
    setTables([]);
    setSelectedMode("");
  };

  const handleModeChange = (mode) => {
    setSelectedMode(mode);
    setSelectedItems([]);
    setTables([]);

    if (!selectedConnection || !selectedSchema) return;

    const name = `${selectedConnection}_${selectedSchema}_${mode}`;

    mode === "bulk"
      ? fetchDDL(selectedConnection, selectedSchema)
      : fetchTables(selectedConnection, selectedSchema);

    updateData(data?.define?.id, isPipelineNode, "define", { name });
  };

  const handleSelectAll = (isChecked) => {
    if (isChecked) {
      const validTables = filteredTables.filter((table) => table !== null);

      setSelectedItems(
        validTables.map((table) => ({
          metadata_id: table.metadata_id,
          schedule: "",
        }))
      );
    } else {
      setSelectedItems([]);
    }
  };

  const handleItemSelection = (checked, tableId) => {
    setSelectedItems((prev) => {
      if (checked) {
        return [...prev, { metadata_id: tableId, schedule: "" }];
      } else {
        return prev.filter((item) => item.metadata_id !== tableId);
      }
    });
  };

  const handleOkClick = () => {
    if (selectedConnection && selectedSchema && selectedMode) {
      const updatedNodeData = {
        connection: selectedConnection,
        schema: selectedSchema,
        mode: selectedMode,
        bulk_list: selectedItems,
        subset_list: pipelineMappings?.[ID] ?? [],
        op_types: nodeData.op_types,
      };

      setNodeData(updatedNodeData);
      updateData(ID, isPipelineNode, "source", updatedNodeData);
    }
  };

  const areAllSelected =
    filteredTables.length > 0 &&
    selectedItems.length ===
      filteredTables.filter((table) => table !== null).length;

  const isSubmitEnabled = Boolean(
    selectedConnection && selectedSchema && selectedMode
  );

  const showTablesList = Boolean(
    selectedMode === "bulk"
      ? tables.length > 0 || loading
      : (pipelineMappings[pipelineId]?.length ?? 0) > 0
  );

  const pipelineData = pipelineMappings[pipelineId] || [];
  const sourceTables = pipelineData.map((mapping) => mapping.sourceTable);

  return (
    <div
      className={`bg-white rounded-lg p-3 pt-2 shadow-md border-2 ${
        selected ? "border-[#8E77BB]" : "border-gray-300"
      } w-fit min-w-[18vw] max-w-[90vw] relative group grid grid-cols-[repeat(auto-fit,minmax(min-content,1fr))]`}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-1">
          <iconify-icon
            icon="material-symbols-light:analytics-outline"
            width="24"
            height="24"
            style={{ color: "#8e78b7" }}
          ></iconify-icon>
          <h3 className="text-black font-medium">Source</h3>
        </div>

        {!data?.pipelineId && (
          <div className="flex space-x-2">
            <button className="p-1" aria-label="Minimize">
              <Minus className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
            <button
              onClick={() => window.deleteNode?.(id)}
              className="p-1"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          </div>
        )}
      </div>

      <CustomHandle type="target" position={Position.Left} />
      <CustomHandle type="source" position={Position.Right} />

      <div className="space-y-1.5">
        <div>
          <label
            htmlFor="connection-select"
            className="text-xs font-medium text-black mb-0.5 block"
          >
            Connection
          </label>
          <div className="w-full">
            <select
              id="connection-select"
              className="w-full p-1 text-[10px] bg-white rounded-sm border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
              value={selectedConnection}
              onChange={(e) => handleSelectConnection(e.target.value)}
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
          <label
            htmlFor="schema-select"
            className="text-xs font-medium text-black mb-0.5 block"
          >
            Schema
          </label>
          <div className="relative w-full flex items-center gap-2">
            <div className="w-full relative">
              <select
                id="schema-select"
                className="w-full min-w-0 p-1 text-[10px] bg-white rounded-sm border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                value={selectedSchema}
                onChange={(e) => handleSelectSchema(e.target.value)}
                disabled={!selectedConnection || schemaLoading}
              >
                {schemaLoading ? (
                  <option value="">Loading schemas...</option>
                ) : (
                  <>
                    <option value="">Select Schema</option>
                    {schemas.map((schema) => (
                      <option
                        key={schema.table_schema}
                        value={schema.table_schema}
                      >
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

            {schemaCount?.schema_count && (
              <span className="text-black font-bold">
                {schemaCount.schema_count}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4 mt-3">
        <label className="text-xs font-medium text-black mb-0.5 block">
          {data.category} Scope
        </label>
        <div className="flex gap-4">
          <div className="flex items-center">
            <input
              type="radio"
              id={`table-bulk-${ID}`}
              name={`table-mode-${ID}`}
              value="bulk"
              checked={selectedMode === "bulk"}
              onChange={() => handleModeChange("bulk")}
              disabled={!selectedConnection || !selectedSchema}
              className="h-3 w-3 border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor={`table-bulk-${ID}`}
              className="ml-2 text-xs text-gray-500"
            >
              Bulk
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="radio"
              id={`table-subset-${ID}`}
              name={`table-mode-${ID}`}
              value="subset"
              checked={selectedMode === "subset"}
              onChange={() => handleModeChange("subset")}
              disabled={!selectedConnection || !selectedSchema}
              className="h-3 w-3 border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor={`table-subset-${ID}`}
              className="ml-2 text-xs text-gray-500"
            >
              Subset
            </label>
          </div>
        </div>
      </div>

      <div className="mt-2">
        {filteredTables &&
          filteredTables.length > 0 &&
          selectedMode === "subset" && (
            <select
              id="table-select"
              className="w-full p-1 text-[10px] bg-white rounded-sm border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
              onChange={(e) => selectSource(ID, e.target.value)}
            >
              <option value="">Select Table</option>
              {filteredTables.map((table, idx) => (
                <option key={idx} value={table.source_table}>
                  {table.source_table}
                </option>
              ))}
            </select>
          )}
      </div>

      {showTablesList && (
        <div>
          <div className="flex items-center justify-between my-3">
            <div
              className="flex items-center gap-1 cursor-pointer"
              onClick={() => setShowSearch(!showSearch)}
            >
              <label className="text-sm font-medium text-black">Data Set</label>
              <Search size={16} className="text-gray-500" />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-gray-700">
                  Status
                </span>
                <ArrowDownUp size={16} className="text-gray-500" />
              </div>

              <button
                className="flex items-center gap-1 px-2 py-1 text-sm font-medium text-[#8e78b7] border border-[#8e78b7] rounded-md hover:bg-[#8e78b7] hover:text-white transition"
                onClick={() =>
                  openDrawer(data.category, "scope", id, data.pipelineId)
                }
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="M12 13.5q-.633 0-1.066-.434Q10.5 12.633 10.5 12t.434-1.066Q11.367 10.5 12 10.5t1.066.434q.434.433.434 1.066t-.434 1.066q-.433.434-1.066.434ZM11.5 8V4h1v4h-1Zm0 12v-4h1v4h-1Zm4.5-7.5v-1h4v1h-4Zm-12 0v-1h4v1H4Z"
                  />
                </svg>
                <span>Scope</span>
              </button>
            </div>
          </div>

          {showSearch && (
            <input
              type="search"
              placeholder="Search datasets..."
              className="w-full p-2 mb-2 text-sm text-black border border-gray-300 rounded-lg focus:outline-none focus:border-[#8e78b7]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          )}

          <div
            className="space-y-2 max-h-40 overflow-y-auto"
            onWheelCapture={(e) => {
              e.stopPropagation();
            }}
          >
            {loading ? (
              <>
                <SkeletonLoader />
                <SkeletonLoader />
                <SkeletonLoader />
              </>
            ) : (
              <>
                {filteredTables.length > 0 && selectedMode !== "subset" && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 mt-2">
                      <input
                        type="checkbox"
                        id="select-all"
                        className="h-3 w-3 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        checked={areAllSelected}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                      <label
                        htmlFor="select-all"
                        className="text-xs font-semibold text-black"
                      >
                        Select all
                      </label>
                    </div>
                  </div>
                )}

                {!loading && filteredTables.length === 0 ? (
                  <div className="text-sm text-gray-500 py-2">
                    No tables found
                  </div>
                ) : selectedMode !== "subset" ? (
                  filteredTables
                    .filter((table) => table !== null)
                    .map((table, idx) => (
                      <div
                        key={`table-row-${idx}`}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`table-${idx}`}
                            checked={selectedItems.some(
                              (item) => item.metadata_id === table.metadata_id
                            )}
                            onChange={(e) =>
                              handleItemSelection(
                                e.target.checked,
                                table.metadata_id
                              )
                            }
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
                          onClick={() =>
                            openDrawer(
                              data.category,
                              "editTable",
                              id,
                              data.pipelineId,
                              table
                            )
                          }
                          className="text-purple-600 hover:text-purple-700"
                          aria-label={`Edit ${table.source_table}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                ) : (
                  <>
                    <div className="max-w-sm mx-auto">
                      <div>
                        {sourceTables.map((sourceTable, idx) => (
                          <div
                            key={`source-table-${idx}`}
                            className="flex items-center justify-between mt-4"
                          >
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`source-${idx}`}
                                checked={true}
                                onChange={(e) =>
                                  handleItemSelection(e.target.checked, {
                                    source_table: sourceTable,
                                  })
                                }
                                className="h-3 w-3 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                              />
                              <label
                                htmlFor={`source-${idx}`}
                                className="text-xs font-semibold text-black"
                              >
                                {sourceTable}
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

                              <button
                                onClick={() => deleteMapping(pipelineId, idx)}
                                className="text-red-600 hover:text-red-700"
                                aria-label={`Delete ${sourceTable}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
      {/* <div className="flex justify-center mt-4">
                        <button className="text-purple-600 hover:text-purple-700" onClick={openDropdown}>
                          <CirclePlus className="w-6 h-6" />
                        </button>
                      </div> */}
      {/* OK Button */}
      {/* <div className="flex mt-4">
        <button
          className={`w-full ${
            isSubmitEnabled
              ? "bg-[#8e78b7] text-white"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          } hover:bg-[#8e78b7] text-xs font-semibold hover:text-white py-2 px-10 border hover:border-transparent rounded`}
          onClick={handleOkClick}
          disabled={!isSubmitEnabled}
        >
          OK
        </button>
      </div> */}
    </div>
  );
}

SourceNode.propTypes = {
  id: PropTypes.string.isRequired,
  data: PropTypes.shape({
    category: PropTypes.string,
    pipelineId: PropTypes.string,
  }).isRequired,
};
