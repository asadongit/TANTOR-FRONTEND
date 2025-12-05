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
import { Handle } from "../../components/CustomHandle";
import { SkeletonLoader } from "../../components/skeltonLoader";
import {
  useConnections,
  useDDL,
  useSchemaCount,
  useSchemas,
  useTables,
} from "../../hooks/DataFetch";
import { useDrawerContext } from "../../context/DrawerContext";
import { useWorkflow } from "../../context/WorkflowContext";
import { useAuth } from "../../../../../context/AuthContext";
import AutoComplete from "../../components/AutoComplete";
export function SourceNode({ id, data, selected }) {
  // console.log("sourceData--------",data)
  const [loading, setLoading] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState("");
  const [selectedSchema, setSelectedSchema] = useState("");
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedConnectionObj, setSelectedConnectionObj] = useState(null);
  const [isEditModeInitialized, setIsEditModeInitialized] = useState(false);
  const [nodeData, setNodeData] = useState(() => ({
    connection: "",
    schema: "",
    mode: "",
    bulk_list: [],
    subset_list: [],
    op_types: {
      datafederation: false,
    },
    name: "",
    source_conn_id: "",
    type: "",
  }));
  const [previousMode, setPreviousMode] = useState("");

  const { data: connections, isLoading: isLoadingConnections } =
    useConnections("source");
  const { data: schemaCount } = useSchemaCount(selectedConnection);
  const { data: schemas, isLoading: isLoadingSchemas } =
    useSchemas(selectedConnection);
  const { data: tables } = useTables(
    selectedConnection,
    selectedSchema,
    selectedMode
  );
  const { data: ddl } = useDDL(selectedConnection, selectedSchema);

  // Ensure connections is always an array
  const safeConnections = Array.isArray(connections) ? connections : [];

  const pipelineId = data?.pipelineId;
  const isPipelineNode = pipelineId !== undefined;
  const ID = isPipelineNode ? pipelineId : id;

  const { openDrawer } = useDrawerContext();
  const {
    selectSource,
    pipelineMappings,
    setPipelineMappings,
    deleteMapping,
    updateData,
    pipelines,
    editMode,
    isPipelineInitialized,
    setBulkMappings,
  } = useWorkflow();

  // Check if this is edit mode
  const isEditMode = data?.isEditMode || editMode;

  // Initialize node with pre-populated data in edit mode (only once when connections are loaded)
  useEffect(() => {
    if (isEditMode && !isEditModeInitialized && safeConnections?.length > 0) {
      const sourceData = data?.source;

      if (sourceData && Object.keys(sourceData).length > 0) {
        // Find the connection object from connections data
        const connectionObj = safeConnections.find(conn =>
          conn.connection_id === sourceData.source_conn_id ||
          conn.connection_name === sourceData.connection
        );

        if (connectionObj) {
          setSelectedConnectionObj(connectionObj);
          setSelectedConnection(connectionObj.connection_name);
        } else if (sourceData.connection) {
          setSelectedConnection(sourceData.connection);
        }

        // Pre-populate schema
        if (sourceData.schema) {
          setSelectedSchema(sourceData.schema);
        }

        // Pre-populate mode and track it
        if (sourceData.mode) {
          setSelectedMode(sourceData.mode);
          setPreviousMode(sourceData.mode);
        }

        // Pre-populate selected items based on mode
        if (sourceData.mode === "subset") {
          // For subset mode, extract source tables from subset_list
          if (sourceData.subset_list && Array.isArray(sourceData.subset_list)) {
            const sourceTables = sourceData.subset_list.map(item => item.source_table);
            setSelectedItems(sourceTables);

            // Initialize pipelineMappings for subset mode
            if (setPipelineMappings) {
              setPipelineMappings(prev => ({
                ...prev,
                [ID]: sourceData.subset_list.map(item => ({
                  source_table: item.source_table,
                  target_table: item.target_table,
                  schedule: item.schedule || {},
                  whereCondition: item.whereCondition || "",
                })),
              }));
            }
          }
        } else if (sourceData.bulk_list && Array.isArray(sourceData.bulk_list)) {
          setSelectedItems(sourceData.bulk_list);
        }

        // Pre-populate node data with all source properties
        setNodeData(prevData => ({
          ...prevData,
          ...sourceData,
          source_conn_id: connectionObj?.connection_id || sourceData.source_conn_id,
          type: connectionObj?.connection_type || sourceData.type,
        }));

        setIsEditModeInitialized(true);
      }
    }
  }, [isEditMode, safeConnections, data?.source, isEditModeInitialized, ID, setPipelineMappings]);

  // Sync state to context when values change
  // This should run whenever selectedItems changes, regardless of edit mode state
  useEffect(() => {
    if (selectedConnection && selectedSchema && ID) {
      const updatedNodeData = {
        connection: selectedConnection,
        schema: selectedSchema,
        mode: selectedMode,
        bulk_list: selectedItems,
        subset_list: pipelineMappings?.[ID] ?? [],
        op_types: nodeData?.op_types ?? { datafederation: false },
        source_conn_id: nodeData?.source_conn_id ?? null,
        type: nodeData?.type,
        define: data?.define?.[0] ?? data?.define ?? null,
      };

      setNodeData(updatedNodeData);
      updateData(ID, isPipelineNode, "source", updatedNodeData);
    }
  }, [
    selectedConnection,
    selectedSchema,
    selectedMode,
    selectedItems,
    pipelineMappings,
    ID,
    isPipelineNode,
    nodeData?.op_types,
    nodeData?.source_conn_id,
    nodeData?.type,
  ]);

  const filteredTables = useMemo(() => {
    if (!tables || !Array.isArray(tables) || !tables.length) return [];

    return tables
      .filter((table) => table && table.source_table)
      .filter((table) =>
        table.source_table
          .toLowerCase()
          .includes(searchTerm?.toLowerCase() || "")
      );
  }, [tables, searchTerm]);
  const handleSelectConnection = (selectedConnection) => {
    const connName = selectedConnection?.connection_name || "";
    const connId = selectedConnection?.connection_id || null;
    const connType = selectedConnection?.connection_type || null;

    setSelectedConnectionObj(selectedConnection);
    setSelectedConnection(connName);
    // Always reset when user changes connection (both create and edit mode after init)
    setSelectedSchema("");
    setSelectedItems([]);
    setSelectedMode("");
    setNodeData((prevData) => ({
      ...prevData,
      source_conn_id: connId,
      type: connType,
    }));
  };

  const handleSelectSchema = (schemaName) => {
    setSelectedSchema(schemaName || "");
    // Always reset when user changes schema
    setSelectedItems([]);
    setSelectedMode("");
  };

  const handleModeChange = (mode) => {
    // Check if mode is actually changing
    const isModeChanging = selectedMode !== mode;

    setSelectedMode(mode);
    // Always reset items when mode changes
    setSelectedItems([]);

    // If mode changed and we're in edit mode, clear the target mappings too
    if (isModeChanging && isEditModeInitialized) {
      const key = ID;

      // Clear pipeline mappings (for subset mode)
      if (setPipelineMappings) {
        setPipelineMappings(prev => ({
          ...prev,
          [key]: [],
        }));
      }
    }

    setPreviousMode(mode);

    if (!selectedConnection || !selectedSchema) return;
  };
  const handleSelectAll = (isChecked) => {
    if (isChecked) {
      const validTables = filteredTables.filter((table) => table !== null);

      setSelectedItems(validTables.map((item) => item.source_table));
    } else {
      setSelectedItems([]);
    }
  };

  const handleItemSelection = (checked, table) => {
    setSelectedItems((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      if (checked) {
        // return [...prev, { metadata_id: tableId, schedule: {} }];
        return [...safePrev, table];
      } else {
        return safePrev.filter((item) => item !== table);
      }
    });
  };

  // Handle deleting a source table in subset mode
  const handleDeleteSubsetSource = (sourceTableToDelete, idx) => {
    // Remove from pipelineMappings
    if (setPipelineMappings) {
      setPipelineMappings(prev => {
        const key = ID;
        const currentMappings = prev[key] || [];
        const updatedMappings = currentMappings.filter(
          mapping => mapping.source_table !== sourceTableToDelete
        );
        return {
          ...prev,
          [key]: updatedMappings,
        };
      });
    }

    // Also remove from selectedItems if tracking source tables
    setSelectedItems(prev => {
      const safePrev = Array.isArray(prev) ? prev : [];
      return safePrev.filter(item => {
        if (typeof item === 'string') {
          return item !== sourceTableToDelete;
        }
        return item?.source_table !== sourceTableToDelete;
      });
    });
  };

  const areAllSelected =
    Array.isArray(filteredTables) && filteredTables.length > 0 &&
    Array.isArray(selectedItems) && selectedItems.length ===
      filteredTables.filter((table) => table !== null).length;


  const connectedTargets = (Array.isArray(data?.target) ? data.target : [])
    .filter((target) => target && target.id !== undefined)
    .map((target) => target.id);

  const firstTargetID =
    connectedTargets.length > 0 ? connectedTargets[0] : null;

  const constructedKey = firstTargetID
    ? `${data?.source?.id}-${firstTargetID}`
    : null;

  const pipelineData = isPipelineNode
    ? pipelineMappings[pipelineId] || []
    : constructedKey && pipelineMappings[constructedKey]
    ? pipelineMappings[constructedKey]
    : [];

  // For subset mode, show the source tables from pipelineMappings
  const subsetSourceTables = useMemo(() => {
    if (selectedMode !== "subset") return [];

    const mappings = pipelineMappings[ID] || pipelineMappings[pipelineId] || [];
    return mappings.map(m => m.source_table);
  }, [selectedMode, pipelineMappings, ID, pipelineId]);

  // Update sourceTables to use subsetSourceTables when in subset mode
  const sourceTables = selectedMode === "subset" && isEditMode
    ? subsetSourceTables.length > 0 ? subsetSourceTables : pipelineData.map((mapping) => mapping.source_table)
    : pipelineData.map((mapping) => mapping.source_table);

  const showTablesList = Boolean(
    selectedMode === "bulk"
      ? (tables && tables.length > 0) || loading
      : selectedMode === "subset"
      ? (pipelineMappings[pipelineId]?.length ?? 0) > 0 ||
        (pipelineMappings[ID]?.length ?? 0) > 0 ||
        (constructedKey && (pipelineMappings[constructedKey]?.length ?? 0) > 0) ||
        (filteredTables && filteredTables.length > 0)
      : false
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

           <AutoComplete
              options={safeConnections || []}
              placeholder="Select Connection"
              labelKey="connection_name"
              valueKey="id"
              className="w-full"
              onSelect={(connection) => handleSelectConnection(connection)}
              value={selectedConnectionObj}
              returnFullObject={true}
              isLoading={isLoadingConnections}
              loadingText="Loading connections..."
            />
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

              <AutoComplete
                options={schemas || []}
                value={selectedSchema}
                placeholder="Select Schema"
                onChange={(e) => handleSelectSchema(e.target.value)}
                disabled={!selectedConnection || isLoadingSchemas}
                isLoading={isLoadingSchemas}
                loadingText="Loading schemas..."
                valueKey="table_schema"
                labelKey="table_schema"
              />
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
          {data.category || "Source"} Scope
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

            <AutoComplete
              options={filteredTables}
              placeholder="Select Table"
              onChange={(e) => {
                const selectedTable = e?.target?.value || "";

                if (selectedTable) {
                  selectSource(
                    ID,
                    selectedTable,
                    connectedTargets,
                    isPipelineNode
                  );
                }
              }}
              valueKey="source_table"
              labelKey="source_table"
              className="w-full"
            />
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
                              data?.category || "migration",
                              "AddFilter",
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
                                readOnly
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
                                    data?.category || "migration",
                                    "AddFilter",
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
                                onClick={() => handleDeleteSubsetSource(sourceTable, idx)}
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
