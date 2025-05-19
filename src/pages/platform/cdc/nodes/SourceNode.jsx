import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import PropTypes, { node } from "prop-types";
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
import { Handle } from "../components/CustomHandle";
import { useWorkflow } from "../context/WorkflowContext";
import { SkeletonLoader } from "../components/skeltonLoader";
import { useConnections, useDDL, useSchemaCount, useSchemas, useTables } from "../hooks/DataFetch";

export function SourceNode({ id, data, selected }) {
  const [loading, setLoading] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState("");
  const [selectedSchema, setSelectedSchema] = useState("");
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedConnectionObj, setSelectedConnectionObj] = useState(null);
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
    table_op_types: {}, // Initialize empty table_op_types object
    name:"",
    source_conn_id:""
  }));

  const { data: connections, isLoading: isLoadingConnections } = useConnections('source');
  const { data: schemaCount } = useSchemaCount(selectedConnection);
  const { data: schemas, isLoading: isLoadingSchemas } = useSchemas(selectedConnection);
  const { data: tables } = useTables(selectedConnection, selectedSchema,selectedMode);
  const { data: ddl } = useDDL(selectedConnection, selectedSchema);
  const pipelineId = data?.pipelineId;
  const isPipelineNode = pipelineId !== undefined;
  const ID = isPipelineNode ? pipelineId : id;

  const { openDrawer } = useDrawerContext();
  const { selectSource, pipelineMappings, deleteMapping, updateData, pipelines } =
    useWorkflow();

  useEffect(() => {
    if (selectedConnection && selectedSchema && ID) {
      const updatedNodeData = {
        connection: selectedConnection,
        schema: selectedSchema,
        mode: selectedMode,
        bulk_list: selectedItems,
        subset_list: pipelineMappings?.[ID] ?? [],
        op_types: nodeData?.op_types ?? [],
        table_op_types: nodeData?.table_op_types ?? {}, // Preserve table_op_types
        source_conn_id: nodeData?.source_conn_id ?? null,
        define: data?.define?.[0] ?? null,
      };

      setNodeData(updatedNodeData);
      updateData(ID, isPipelineNode, "source", updatedNodeData);
    }
  }, [selectedConnection, selectedSchema, selectedMode, selectedItems, pipelineMappings]);

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
  const handleSelectConnection = (selectedConnection) => {
    setSelectedConnectionObj(selectedConnection);
    setSelectedConnection(selectedConnection.connection_name);
    setSelectedSchema("");
    setSelectedItems([]);
    setSelectedMode("");
    setNodeData((prevData) => ({
      ...prevData,
      "source_conn_id": selectedConnection.connection_id,
    }));
  };
  const handleSelectSchema = (schemaName) => {
    setSelectedSchema(schemaName);
    setSelectedItems([]);
    setSelectedMode("");
  };

  const handleModeChange = (mode) => {
    setSelectedMode(mode);
    setSelectedItems([]);

    if (!selectedConnection || !selectedSchema) return;

  };
  const handleSelectAll = (isChecked) => {
    if (isChecked) {
      const validTables = filteredTables.filter((table) => table !== null);

      setSelectedItems(
        validTables.map((item) =>item.source_table))
    } else {
      setSelectedItems([]);
    }
  };

  const handleItemSelection = (checked, table) => {
    setSelectedItems((prev) => {
      if (checked) {
        // return [...prev, { metadata_id: tableId, schedule: {} }];
        return [...prev, table];

      } else {
        return prev.filter((item) => item!== table);
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

  const connectedTargets = (data?.target || []).filter(target => target && target.id !== undefined).map(target => target.id);

  const firstTargetID = connectedTargets.length > 0 ? connectedTargets[0] : null;

  const constructedKey = firstTargetID ? `${data?.source?.id}-${firstTargetID}` : null;

  const pipelineData = isPipelineNode
    ? pipelineMappings[pipelineId] || []
    : constructedKey && pipelineMappings[constructedKey] ? pipelineMappings[constructedKey] : [];

  const sourceTables = pipelineData.map((mapping) => mapping.source_table);
  const showTablesList = Boolean(
    selectedMode === "bulk"
      ? tables && tables.length > 0 || loading
      : (pipelineMappings[pipelineId]?.length ?? 0) > 0 ||
        (constructedKey && (pipelineMappings[constructedKey]?.length ?? 0) > 0)
  );

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

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />

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
              value={selectedConnectionObj ? JSON.stringify(selectedConnectionObj) : ""}
                onChange={(e) => {
                const selectedConnection = JSON.parse(e.target.value);
                handleSelectConnection(selectedConnection)
              }}
            >

              <option value="">Select Connection</option>
              {connections?.length > 0 ? (
                connections.map((connection, idx) => (
                  <option key={idx} value={JSON.stringify(connection)}>
                    {connection.connection_name}
                  </option>
                ))
              ) : (
                <option disabled>No connections available</option>
              )}
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
                disabled={!selectedConnection || isLoadingSchemas}
              >
                {isLoadingSchemas ? (
                  <option value="">Loading schemas...</option>
                ) : (
                  <>
                    <option value="">Select Schema</option>
                    {schemas?.map((schema) => (
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

              {isLoadingSchemas && (
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
          {data.category || 'Source'} Scope
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
              onChange={(e) => selectSource(ID, e.target.value, connectedTargets, isPipelineNode)}
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
                  openDrawer(data.category || 'source', "scope", id, data.pipelineId)
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
                              // (item) => item.metadata_id === table.metadata_id
                              (item) => item === table.source_table

                            )}
                            onChange={(e) =>
                              handleItemSelection(
                                e.target.checked,
                                // table.metadata_id
                                table.source_table
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
                              data.category || 'source',
                              "editTable",
                              id,
                              data.pipelineId,
                              table
                            )
                          }
                          className="text-purple-600 hover:text-purple-700"
                          aria-label={`Edit ${table.source_table}`}
                        >
                          {/* <Pencil className="w-4 h-4" /> */}
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
                                    data.category || 'source',
                                    "editTable",
                                    id,
                                    data.pipelineId,
                                    sourceTable
                                  )
                                }
                                className="text-purple-600 hover:text-purple-700"
                                aria-label={`Edit ${sourceTable}`}
                              >
                                {/* <Pencil className="w-4 h-4" /> */}
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
    </div>
  );
}

SourceNode.propTypes = {
  id: PropTypes.string.isRequired,
  data: PropTypes.shape({
    category: PropTypes.string,
    pipelineId: PropTypes.string,
    source: PropTypes.object,
    target: PropTypes.array,
  }).isRequired,
  selected: PropTypes.bool,
};

SourceNode.defaultProps = {
  selected: false,
};