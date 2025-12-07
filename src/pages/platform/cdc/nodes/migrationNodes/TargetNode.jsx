import React, { useState, useCallback, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { Position } from "reactflow";
import { useDrawerContext } from "../../context/DrawerContext";
import { Handle } from "../../components/CustomHandle";
import { useWorkflow } from "../../context/WorkflowContext";
import {
  Minus,
  X,
  Search,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { toast as hotToast } from "react-hot-toast";
import { SkeletonLoader } from "../../components/skeltonLoader";
import { useAuth } from "../../../../../context/AuthContext";
import {
  useConnections,
  useSchemaCount,
  useSchemas,
  useTables,
  useBulkTables,
} from "../../hooks/DataFetch";
import AutoComplete from "../../components/AutoComplete";
export function TargetNode({ id, data, selected }) {
  const [loading, setLoading] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState("");
  const [selectedSchema, setSelectedSchema] = useState("");
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { openDrawer } = useDrawerContext();
  const [sourceConnection, setSourceConnection] = useState("");
  const [sourceSchema, setSourceSchema] = useState("");

  const [bulkList, setBulkList] = useState([]);
  const [selectedConnectionObj, setSelectedConnectionObj] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isEditModeInitialized, setIsEditModeInitialized] = useState(false);
  const [previousMode, setPreviousMode] = useState("");

  const [nodeData, setNodeData] = useState(() => ({
    connection: "",
    schema: "",
    mode: "",
    bulk_list: [],
    subset_list: [],
    target_conn_id: "",
    type: "",
  }));
  const { data: connections, isLoading: isLoadingConnections } =
    useConnections("target");
  const { data: schemaCount } = useSchemaCount(selectedConnection);
  const { data: schemas, isLoading: isLoadingSchemas } =
    useSchemas(selectedConnection);
  const { data: tables } = useTables(
    selectedConnection,
    selectedSchema,
    selectedMode
  );
  const { data: bulkTables = [] } = useBulkTables(
    sourceConnection,
    selectedConnection,
    sourceSchema
  );

  // Ensure connections is always an array
  const safeConnections = Array.isArray(connections) ? connections : [];

  const pipelineId = data?.pipelineId;
  const isPipelineNode = pipelineId !== undefined;
  const ID = isPipelineNode ? pipelineId : id;
  const {
    pipelines,
    completeMapping,
    pipelineMappings,
    setPipelineMappings,
    inProgressMappings,
    updateData,
    deleteMapping,
    addBulkMapping,
    updateBulkMappings,
    deselectMapping,
    bulkMappings,
    setBulkMappings,
    editMode,
  } = useWorkflow();

  // Check if this is edit mode
  const isEditMode = data?.isEditMode || editMode;

  // Get the latest source data from pipelines context (for real-time updates)
  const latestSourceData = useMemo(() => {
    if (isPipelineNode && pipelines?.[ID]?.data?.source) {
      return pipelines[ID].data.source;
    }
    // Fallback to data.source
    const sourceArray = data?.source;
    return Array.isArray(sourceArray) ? sourceArray[0] : sourceArray;
  }, [isPipelineNode, pipelines, ID, data?.source]);

  // Initialize and sync source data from props/context (runs on source changes)
  useEffect(() => {
    if (latestSourceData) {
      setSourceConnection(latestSourceData?.connection || "");
      setSourceSchema(latestSourceData?.schema || "");

      // Get source tables from bulk_list - this should update when source changes
      const currentSourceTables = latestSourceData?.bulk_list || [];
      setBulkList(currentSourceTables);

      const newMode = latestSourceData?.mode || "bulk";

      // Check if mode changed after initialization (user switched scope)
      if (isEditModeInitialized && previousMode && previousMode !== newMode) {
        // Mode changed - reset target mappings
        const key = isPipelineNode ? ID : `${data?.source?.id}-${ID}`;

        // Clear bulk mappings
        if (setBulkMappings) {
          setBulkMappings(prev => ({
            ...prev,
            [key]: [],
          }));
        }

        // Clear pipeline mappings (for subset mode)
        if (setPipelineMappings) {
          setPipelineMappings(prev => ({
            ...prev,
            [key]: [],
            [ID]: [],
          }));
        }

        // Reset selected items
        setSelectedItems([]);
      }

      // Update mode
      setSelectedMode(newMode);
      setPreviousMode(newMode);
    }
  }, [latestSourceData, isEditModeInitialized, previousMode, ID, isPipelineNode, setBulkMappings, setPipelineMappings]);

  // Initialize node with pre-populated data in edit mode (only once when connections are loaded)
  useEffect(() => {
    if (isEditMode && !isEditModeInitialized && safeConnections?.length > 0) {
      const targetData = data?.target;

      if (targetData && Object.keys(targetData).length > 0) {
        // Find the connection object from connections data
        const connectionObj = safeConnections.find(
          (conn) =>
            conn.connection_id === targetData.target_conn_id ||
            conn.connection_name === targetData.connection
        );

        if (connectionObj) {
          setSelectedConnectionObj(connectionObj);
          setSelectedConnection(connectionObj.connection_name);
        } else if (targetData.connection) {
          setSelectedConnection(targetData.connection);
        }

        // Pre-populate schema
        if (targetData.schema) {
          setSelectedSchema(targetData.schema);
        }

        // Pre-populate mode and track it
        if (targetData.mode) {
          setSelectedMode(targetData.mode);
          setPreviousMode(targetData.mode);
        }

        // Pre-populate based on mode
        if (targetData.mode === "subset") {
          // For subset mode, use bulk_list from target (which contains the mappings)
          // and initialize pipelineMappings
          if (targetData.bulk_list && Array.isArray(targetData.bulk_list)) {
            setSelectedItems(targetData.bulk_list);

            const key = isPipelineNode ? ID : `${data?.source?.id}-${ID}`;
            if (setPipelineMappings && (!pipelineMappings[key] || pipelineMappings[key].length === 0)) {
              setPipelineMappings(prev => ({
                ...prev,
                [key]: targetData.bulk_list.map(item => ({
                  source_table: item.source_table,
                  target_table: item.target_table,
                  schedule: item.schedule || {},
                  whereCondition: item.whereCondition || "",
                })),
              }));
            }
          }
        } else if (targetData.bulk_list && Array.isArray(targetData.bulk_list)) {
          // Bulk mode - use bulkMappings
          setSelectedItems(targetData.bulk_list);

          // Initialize bulk mappings in context if not already present
          const key = isPipelineNode ? ID : `${data?.source?.id}-${ID}`;
          if (!bulkMappings[key] || bulkMappings[key].length === 0) {
            const mappingsToAdd = targetData.bulk_list.map((mapping) => ({
              source_table: mapping.source_table,
              target_table: mapping.target_table,
              schedule: mapping.schedule || {},
              whereCondition: mapping.whereCondition || "",
              source_columns: mapping.source_columns || [],
            }));

            setBulkMappings((prev) => ({
              ...prev,
              [key]: mappingsToAdd,
            }));
          }
        }

        // Pre-populate node data with all target properties
        setNodeData((prevData) => ({
          ...prevData,
          ...targetData,
          target_conn_id: connectionObj?.connection_id || targetData.target_conn_id,
          type: connectionObj?.connection_type || targetData.type,
        }));

        setIsEditModeInitialized(true);
      }
    }
  }, [isEditMode, safeConnections, data?.target, isEditModeInitialized, ID, isPipelineNode, bulkMappings, setBulkMappings, pipelineMappings, setPipelineMappings]);

  const filteredTables = useMemo(() => {
    if (selectedMode == "bulk") {
      // Prefer API-driven bulkTables if present
      const apiData = Array.isArray(bulkTables) ? bulkTables : [];
      const apiFiltered =
        apiData.length > 0
          ? apiData.filter((item) => bulkList?.includes(item.source_table))
          : [];

      if (apiFiltered.length > 0) {
        return apiFiltered;
      }

      // In edit mode after initialization, if source changed but API hasn't returned yet,
      // we should not show stale data from nodeJson
      if (isEditModeInitialized && bulkList.length > 0) {
        // Return empty to wait for API, or show loading state
        // Only fall back to nodeJson bulk_list if bulkList matches
        const nodeBulkList = Array.isArray(data?.target?.bulk_list)
          ? data.target.bulk_list
          : [];

        // Filter nodeBulkList to only include items whose source_table is in current bulkList
        const filteredNodeBulkList = nodeBulkList.filter(
          (m) => m && m.source_table && bulkList.includes(m.source_table)
        );

        if (filteredNodeBulkList.length > 0) {
          // Convert [{source_table,target_table},...] into grouped format
          const grouped = filteredNodeBulkList.reduce((acc, m) => {
            if (!m || !m.source_table || !m.target_table) return acc;
            const key = m.source_table;
            if (!acc[key]) {
              acc[key] = {
                source_table: key,
                target_tables: [],
                metadata_id: m.metadata_id,
              };
            }
            acc[key].target_tables.push(m.target_table);
            return acc;
          }, {});

          return Object.values(grouped);
        }

        return [];
      }

      // Fallback to nodeJson target.bulk_list (edit mode prefill - initial load only)
      const nodeBulkList = Array.isArray(data?.target?.bulk_list)
        ? data.target.bulk_list
        : [];

      // Convert [{source_table,target_table},...] into grouped format
      const grouped = nodeBulkList.reduce((acc, m) => {
        if (!m || !m.source_table || !m.target_table) return acc;
        const key = m.source_table;
        if (!acc[key]) {
          acc[key] = {
            source_table: key,
            target_tables: [],
            metadata_id: m.metadata_id,
          };
        }
        acc[key].target_tables.push(m.target_table);
        return acc;
      }, {});

      return Object.values(grouped);
    }

    // subset mode
    if (!Array.isArray(tables) || tables.length === 0) return [];
    const processedData =
      selectedMode === "subset"
        ? tables.map((item) => ({
            target_table: item.source_table,
            connection_name: item.connection_name,
            connection_id: item.connection_id,
            source_schema: item.source_schema,
          }))
        : [];

    return processedData.filter((table) =>
      table?.target_table?.toLowerCase().includes(searchTerm?.toLowerCase() || "")
    );
  }, [selectedMode, tables, bulkList, searchTerm, selectedSchema, bulkTables, data?.target?.bulk_list, isEditModeInitialized]);

  useEffect(() => {
    if (filteredTables) {
      setLoading(false);
    }
  }, [filteredTables]);

  const handleOkClick = () => {
    if (selectedConnection && selectedSchema && selectedMode) {
      const updatedNodeData = {
        connection: selectedConnection,
        schema: selectedSchema,
        mode: selectedMode,
        bulk_list: selectedItems, // Keep the full mapping objects
      };

      updateData(ID, isPipelineNode, "target", updatedNodeData);
    }
  };
  const firstSource = Array.isArray(data?.source) ? data.source[0] : undefined;

  const constructedKey = `${firstSource?.id}-${ID}`;
  const pipelineData = isPipelineNode
    ? pipelineMappings[pipelineId] || pipelineMappings[ID] || []
    : pipelineMappings[constructedKey] || [];

  const targetTables = useMemo(() => pipelineData.map((mapping) => mapping.target_table), [pipelineData]);
  const sourceTables = useMemo(() => pipelineData.map((mapping) => mapping.source_table), [pipelineData]);

  const sourceTable = isPipelineNode
    ? inProgressMappings[pipelineId]?.source_table
    : inProgressMappings[firstSource?.id]?.source_table;

  const showTablesList = Boolean(
    selectedMode === "bulk"
      ? !loading || filteredTables?.length > 0
      : selectedMode === "subset"
      ? pipelineData.length > 0
      : false
  );
  const handleAddTable = () => {
    if (sourceTable) {
      const tableData = {
        table_name: sourceTable,
        Data: isPipelineNode
          ? pipelines[ID]?.data
          : Array.isArray(data?.source)
          ? data.source[0]
          : undefined,
        pipelineId: data?.pipelineId,
      };

      openDrawer(data?.category, "addtable", id, data?.pipelineId, tableData);
    } else {
      hotToast.error("No source table selected");
    }
  };

  // Sync state to context when values change (but not during initial edit mode load)
  useEffect(() => {
    if (selectedConnection && selectedSchema && ID) {
      const key = isPipelineNode ? ID : `${data?.source?.[0]?.id || data?.source?.id}-${ID}`;
      const updatedNodeData = {
        connection: selectedConnection,
        schema: selectedSchema,
        mode: selectedMode,
        bulk_list:
          selectedMode === "bulk" ? bulkMappings[key] || [] : pipelineMappings[key] || [],
        target_conn_id: nodeData?.target_conn_id,
        type: nodeData?.type,
        source: data?.source?.[0] || data?.source,
        define: data?.source?.[0]?.define || data?.define,
      };
      setNodeData(updatedNodeData);

      updateData(ID, isPipelineNode, "target", updatedNodeData);
    }
  }, [
    selectedConnection,
    selectedSchema,
    selectedMode,
    bulkMappings,
    pipelineMappings,
    isEditModeInitialized,
  ]);

  const [openSections, setOpenSections] = useState({});

  const toggleSection = (sourceIdx) => {
    setOpenSections((prev) => ({
      ...prev,
      [sourceIdx]: !prev[sourceIdx],
    }));
  };

  useEffect(() => {
    if (filteredTables?.length > 0 && Object.keys(openSections).length === 0) {
      const initialState = {};
      filteredTables.forEach((_, idx) => {
        initialState[idx] = true;
      });
      setOpenSections(initialState);
    }
  }, [filteredTables]);

  // Handle connection selection
  const handleConnectionSelect = (selectedConn) => {
    const connName = selectedConn?.connection_name || "";
    const connId = selectedConn?.connection_id || null;
    const connType = selectedConn?.connection_type || null;

    setSelectedConnectionObj(selectedConn);
    setSelectedConnection(connName);
    // Only reset if user is actively changing (not during init)
    if (isEditModeInitialized || !isEditMode) {
      setSelectedSchema("");
    }
    setNodeData((prevData) => ({
      ...prevData,
      target_conn_id: connId,
      type: connType,
    }));
  };

  // Handle schema selection
  const handleSchemaChange = (schemaName) => {
    setSelectedSchema(schemaName || "");
    // Only reset if user is actively changing
    if (isEditModeInitialized || !isEditMode) {
      setSelectedItems([]);
      setLoading(true);
    }
  };

  // For subset mode, also show the dropdown to add new mappings when there's a source table selected
  const showSubsetDropdown = selectedMode === "subset" &&
    filteredTables &&
    filteredTables.length > 0 &&
    sourceTable;

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

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />

      <div className="space-y-1.5">
        <div>
          <label className="text-xs font-medium text-black mb-0.5 block">
            Connection
          </label>
          <div className="w-full">
            {/* AutoComplete connection selector fixed to use onSelect and returnFullObject */}
            <AutoComplete
              options={safeConnections || []}
              value={selectedConnectionObj}
              placeholder="Select Connection"
              onSelect={handleConnectionSelect}
              valueKey="connection_id"
              labelKey="connection_name"
              returnFullObject={true}
              className="w-full"
              disabled={!safeConnections || safeConnections.length === 0}
              isLoading={!safeConnections}
              loadingText="Loading connections..."
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-black mb-0.5 block">
            Schema
          </label>
          <div className="relative w-full flex items-center gap-2">
            <div className="w-full relative">
              <AutoComplete
                options={schemas || []}
                value={selectedSchema}
                placeholder="Select Schema"
                onChange={(e) => handleSchemaChange(e?.target?.value || "")}
                disabled={!selectedConnection || schemaLoading}
                isLoading={schemaLoading}
                loadingText="Loading schemas..."
                valueKey="table_schema"
                labelKey="table_schema"
                className="w-full min-w-0"
              />

              {schemaLoading && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <div className="animate-spin h-4 w-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>

            <span className="text-black font-bold">
              {schemaCount?.schema_count}
            </span>
          </div>
        </div>
      </div>

      {showSearch && tables?.length > 0 && (
        <input
          type="search"
          placeholder="Search datasets..."
          className="w-full p-2 mb-2 text-xs text-black border border-gray-300 rounded-lg focus:outline-none focus:border-[#8e78b7]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      )}

      {/* Show dropdown for adding new subset mappings */}
      {showSubsetDropdown && (
        <div>
          <div className="flex items-center space-x-2 my-2">
            <span className="text-sm font-semibold text-black">Map for:</span>
            <span className="text-sm text-gray-700">
              {sourceTable || "No source selected"}
            </span>
          </div>

          <AutoComplete
            id="connection-select"
            options={filteredTables || []}
            placeholder="Select Table"
            onChange={(e) => {
              const selectedTable = e?.target?.value || "";

              if (selectedTable) {
                completeMapping(
                  ID,
                  firstSource?.id,
                  selectedTable,
                  isPipelineNode
                );
              }
            }}
            valueKey="target_table"
            labelKey="target_table"
            className="w-full"
            disabled={!filteredTables || filteredTables.length === 0}
          />
        </div>
      )}

      {showTablesList && selectedConnection && selectedSchema && (
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
            className="space-y-2 max-h-60 overflow-y-auto mt-2"
            onWheelCapture={(e) => e.stopPropagation()}
          >
            {loading ? (
              <>
                <SkeletonLoader />
                <SkeletonLoader />
                <SkeletonLoader />
              </>
            ) : selectedMode === "bulk" && filteredTables.length === 0 ? (
              <div className="text-sm text-gray-500 py-2">No tables found</div>
            ) : selectedMode === "subset" && targetTables.length === 0 ? (
              <div className="text-sm text-gray-500 py-2">No mappings found. Select a source table first.</div>
            ) : (
              <div>
                {selectedMode == "bulk" ? (
                  filteredTables.map((sourceGroup, sourceIdx) => {
                    const isOpen = openSections[sourceIdx] ?? true;
                    const allTargetsSelected = sourceGroup.target_tables.every(
                      (targetTable) =>
                        bulkMappings[
                          isPipelineNode ? ID : constructedKey
                        ]?.some(
                          (item) =>
                            item.source_table === sourceGroup.source_table &&
                            item.target_table === targetTable
                        )
                    );

                    return (
                      <div
                        key={sourceIdx}
                        className="border rounded-md p-2 m-2"
                      >
                        <div className="flex items-center mb-2">
                          <input
                            type="checkbox"
                            id={`source-${sourceIdx}`}
                            checked={
                              allTargetsSelected &&
                              sourceGroup.target_tables.length > 0
                            }
                            onChange={(e) => {
                              const checked = e.target.checked;

                              if (checked) {
                                sourceGroup.target_tables.forEach(
                                  (targetTable) => {
                                    addBulkMapping(
                                      firstSource?.id,
                                      ID,
                                      {
                                        source_table: sourceGroup.source_table,
                                        target_table: targetTable,
                                      },
                                      isPipelineNode
                                    );
                                  }
                                );
                              } else {
                                sourceGroup.target_tables.forEach(
                                  (targetTable) => {
                                    deselectMapping(
                                      ID,
                                      {
                                        source_table: sourceGroup.source_table,
                                        target_table: targetTable,
                                      },
                                      isPipelineNode
                                    );
                                  }
                                );
                              }
                            }}
                            className="h-4 w-4 mr-2 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />

                          <button
                            onClick={() => toggleSection(sourceIdx)}
                            className="text-sm font-bold text-black hover:text-purple-600 focus:outline-none"
                          >
                            {sourceGroup.source_table}
                          </button>
                        </div>

                        {isOpen && (
                          <div className="ml-6 space-y-2">
                            {sourceGroup.target_tables.map(
                              (targetTable, targetIdx) => {
                                const isTargetSelected = bulkMappings[
                                  isPipelineNode ? ID : constructedKey
                                ]?.some(
                                  (item) =>
                                    item.source_table ===
                                      sourceGroup.source_table &&
                                    item.target_table === targetTable
                                );

                                return (
                                  <div
                                    key={targetIdx}
                                    className="flex items-center justify-between"
                                  >
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        id={`target-${sourceIdx}-${targetIdx}`}
                                        checked={isTargetSelected}
                                        onChange={(e) => {
                                          const checked = e.target.checked;
                                          if (checked) {
                                            addBulkMapping(
                                              firstSource?.id,
                                              ID,
                                              {
                                                source_table:
                                                  sourceGroup.source_table,
                                                target_table: targetTable,
                                              },
                                              isPipelineNode
                                            );
                                          } else {
                                            deselectMapping(
                                              ID,
                                              {
                                                target_table: targetTable,
                                                source_table:
                                                  sourceGroup.source_table,
                                              },
                                              isPipelineNode
                                            );
                                          }
                                        }}
                                        className="h-3 w-3 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                      />
                                      <label
                                        htmlFor={`target-${sourceIdx}-${targetIdx}`}
                                        className="text-xs font-semibold text-black"
                                      >
                                        {targetTable}
                                      </label>
                                    </div>

                                    <button
                                      onClick={() =>
                                        openDrawer(
                                          data?.category,
                                          "condition",
                                          id,
                                          data?.pipelineId,
                                          {
                                            source_table:
                                              sourceGroup.source_table,
                                            target_table: targetTable,
                                            metadata_id:
                                              sourceGroup.metadata_id,
                                          }
                                        )
                                      }
                                      className="text-purple-600 hover:text-purple-700"
                                    >
                                    </button>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  // Subset mode - show mapped tables
                  <div className="max-w-sm mx-auto">
                    <div>
                      {targetTables.map((targetTable, idx) => (
                        <div
                          key={`target-table-${idx}`}
                          className="flex items-center justify-between mt-4"
                        >
                          <div className="flex items-center space-x-2 ">
                            <input
                              type="checkbox"
                              id={`target-${idx}`}
                              checked={true}
                              readOnly
                              className="h-3 w-3 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <label
                              htmlFor={`target-${idx}`}
                              className="text-xs font-semibold text-black"
                            >
                              <span className="text-gray-500">{sourceTables[idx]}</span>
                              <span className="mx-1">→</span>
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
                                  { source_table: sourceTables[idx], target_table: targetTable }
                                )
                              }
                              className="text-purple-600 hover:text-purple-700"
                              aria-label={`Edit mapping`}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                deleteMapping(
                                  firstSource?.id,
                                  ID,
                                  idx,
                                  isPipelineNode
                                )
                              }
                              className="text-red-600 hover:text-red-700"
                              aria-label={`Delete mapping`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ...existing add table button for subset mode... */}
      {selectedMode == "subset" && selectedSchema && (
        <button
          className="w-full py-1 px-4 flex items-center justify-center border border-dashed border-[#8e78b7]  text-[#8e78b7] rounded-md  bg-transparent transition-all duration-200 ease-in-out
                                                          hover:bg-[#8e78b7] hover:text-white mt-2"
          onClick={handleAddTable}
        >
          + Add table
        </button>
      )}

    </div>
  );
}

TargetNode.propTypes = {
  id: PropTypes.string.isRequired,
  data: PropTypes.object.isRequired,
  selected: PropTypes.bool,
};
