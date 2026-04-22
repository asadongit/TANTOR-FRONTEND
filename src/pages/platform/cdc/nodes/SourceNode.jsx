import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
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
    table_op_types: {},
    name: "",
    source_conn_id: "",
    source_conn_type: "",
  }));

  const [tableSearchTerm, setTableSearchTerm] = useState("");

  const [selectedSubsetTable, setSelectedSubsetTable] = useState("");
  const [connectionDropdownOpen, setConnectionDropdownOpen] = useState(false);
  const [connectionSearch, setConnectionSearch] = useState("");
  const [schemaDropdownOpen, setSchemaDropdownOpen] = useState(false);
  const [schemaSearch, setSchemaSearch] = useState("");
  const [tableDropdownOpen, setTableDropdownOpen] = useState(false);
  const [tableSearch, setTableSearch] = useState(""); // keep for subset dropdown internal search

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
      // derive plain table-name list from pipelineMappings
      const rawSubset = pipelineMappings?.[ID] ?? [];
      const subsetNames = rawSubset.map(item =>
        typeof item === "string" ? item : item.source_table
      );

      const updatedNodeData = {
        connection: selectedConnection,
        schema: selectedSchema,
        mode: selectedMode,
        bulk_list: selectedItems,
        subset_list: subsetNames,                      // updated
        op_types: nodeData?.op_types ?? {},
        table_op_types: nodeData?.table_op_types ?? {},
        source_conn_id: nodeData?.source_conn_id ?? null,
        source_conn_type: nodeData?.source_conn_type ?? null, // Add connection type
        define: data?.define?.[0] ?? null,
      };

      setNodeData(updatedNodeData);
      updateData(ID, isPipelineNode, "source", updatedNodeData);
    }
  }, [selectedConnection, selectedSchema, selectedMode, selectedItems, pipelineMappings]);

  // Filtered connections and schemas for dropdowns
  const filteredConnections = useMemo(() => {
    if (!connections) return [];
    if (!connectionSearch) return connections;
    return connections.filter(conn =>
      conn.connection_name.toLowerCase().includes(connectionSearch.toLowerCase())
    );
  }, [connections, connectionSearch]);

  const filteredSchemas = useMemo(() => {
    if (!schemas) return [];
    if (!schemaSearch) return schemas;
    return schemas.filter(schema =>
      schema.table_schema.toLowerCase().includes(schemaSearch.toLowerCase())
    );
  }, [schemas, schemaSearch]);

  const filteredTables = useMemo(() => {
    if (!tables || !tables.length) return [];

    return tables
      .filter((table) => table && table.source_table)
      .filter((table) =>
        table.source_table
          .toLowerCase()
          .includes((tableSearchTerm || tableSearch)?.toLowerCase() || "")
      );
  }, [tables, tableSearchTerm, tableSearch]);

  const handleSelectConnection = (selectedConnection) => {
    setSelectedConnectionObj(selectedConnection);
    setSelectedConnection(selectedConnection.connection_name);
    setSelectedSchema("");
    setSelectedItems([]);
    setSelectedMode("");
    setTableSearchTerm("");

    setNodeData((prevData) => ({
      ...prevData,
      "source_conn_id": selectedConnection.connection_id,
      "source_conn_type": selectedConnection.connection_type,
    }));
  };
  const handleSelectSchema = (schemaName) => {
    setSelectedSchema(schemaName);
    setSelectedItems([]);
    setSelectedMode("");
    setTableSearchTerm("");
  };

  const handleModeChange = (mode) => {
    setSelectedMode(mode);
    setSelectedItems([]);
    setTableSearchTerm("");
    if (mode === "subset") {
      setSelectedSubsetTable("");
    }
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
    <div className="bg-white rounded-lg p-4 text-black shadow-md border-2 border-[#8E77BB] min-w-[320px] max-w-[500px] relative group">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center space-x-3">
          <iconify-icon
            icon="material-symbols-light:analytics-outline"
            width="22"
            height="22"
            style={{ color: "#8e78b7" }}
          ></iconify-icon>
          <h3 className="text-black font-medium">Source</h3>
        </div>

        {!data?.pipelineId && (
          <button onClick={() => window.deleteNode?.(id)} className="p-1">
            <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      <Handle type="target" position={Position.Left} style={{ width: 10, height: 10 }} />
      <Handle type="source" position={Position.Right} style={{ width: 10, height: 10 }} />

      {/* Connection */}
      <div className="mb-2 w-full">
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Connection
        </label>

        <div className="w-full relative">
          <button
            type="button"
            className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm text-left focus:outline-none focus:ring-2 focus:ring-purple-300 flex justify-between items-center"
            onClick={() => setConnectionDropdownOpen((open) => !open)}
          >
            <span className={selectedConnectionObj ? "text-gray-900" : "text-gray-400"}>
              {selectedConnectionObj ? selectedConnectionObj.connection_name : "Select Connection"}
            </span>
            <span className="text-gray-500">&#9662;</span>
          </button>

          {connectionDropdownOpen && (
            <div className="absolute z-10 bg-white border border-gray-200 rounded-md shadow w-full mt-1 max-h-56 overflow-auto">
              <input
                type="text"
                placeholder="Search connection..."
                className="w-full px-3 py-2 text-sm border-b border-gray-200 focus:outline-none"
                value={connectionSearch}
                onChange={(e) => setConnectionSearch(e.target.value)}
                autoFocus
              />
              <div>
                {filteredConnections.length > 0 ? (
                  filteredConnections.map((connection, idx) => (
                    <div
                      key={idx}
                      className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${
                        selectedConnectionObj?.connection_id === connection.connection_id ? "bg-gray-50" : ""
                      }`}
                      onClick={() => {
                        handleSelectConnection(connection);
                        setConnectionDropdownOpen(false);
                        setConnectionSearch("");
                      }}
                    >
                      {connection.connection_name}
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-400">No connections found</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Schema */}
      <div className="mb-2 w-full">
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Schema
        </label>

        <div className="relative w-full flex items-center gap-2">
          <div className="w-full relative">
            <button
              type="button"
              className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm text-left focus:outline-none focus:ring-2 focus:ring-purple-300 flex justify-between items-center disabled:bg-gray-50 disabled:text-gray-400"
              onClick={() => setSchemaDropdownOpen((open) => !open)}
              disabled={!selectedConnection || isLoadingSchemas}
            >
              <span className={selectedSchema ? "text-gray-900" : "text-gray-400"}>
                {selectedSchema || "Select Schema"}
              </span>
              <span className="text-gray-500">&#9662;</span>
            </button>

            {schemaDropdownOpen && (
              <div className="absolute z-10 bg-white border border-gray-200 rounded-md shadow w-full mt-1 max-h-56 overflow-auto">
                <input
                  type="text"
                  placeholder="Search schema..."
                  className="w-full px-3 py-2 text-sm border-b border-gray-200 focus:outline-none"
                  value={schemaSearch}
                  onChange={(e) => setSchemaSearch(e.target.value)}
                  autoFocus
                />
                <div>
                  {isLoadingSchemas ? (
                    <div className="px-3 py-2 text-sm text-gray-400">Loading schemas...</div>
                  ) : filteredSchemas.length > 0 ? (
                    filteredSchemas.map((schema) => (
                      <div
                        key={schema.table_schema}
                        className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${
                          selectedSchema === schema.table_schema ? "bg-gray-50" : ""
                        }`}
                        onClick={() => {
                          handleSelectSchema(schema.table_schema);
                          setSchemaDropdownOpen(false);
                          setSchemaSearch("");
                        }}
                      >
                        {schema.table_schema}
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-400">No schemas found</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {schemaCount?.schema_count && (
            <span className="text-black font-bold">{schemaCount.schema_count}</span>
          )}
        </div>
      </div>

      {/* Scope */}
      <div className="mt-2">
        <label className="block text-sm font-semibold text-gray-700 mb-1">
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
            />
            <label htmlFor={`table-bulk-${ID}`} className="ml-1">
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
            />
            <label htmlFor={`table-subset-${ID}`} className="ml-1">
              Subset
            </label>
          </div>
        </div>
      </div>

      {selectedMode === "bulk" && (
        <div className="mt-3">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Search Tables
          </label>
          <input
            type="text"
            className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            placeholder="Search table names"
            value={tableSearchTerm}
            onChange={(e) => setTableSearchTerm(e.target.value)}
          />
        </div>
      )}

      {selectedMode === "subset" && (
        <div className="mt-3">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Table
          </label>
          <div className="w-full relative">
            <button
              type="button"
              className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm text-left focus:outline-none focus:ring-2 focus:ring-purple-300 flex justify-between items-center"
              onClick={() => setTableDropdownOpen((open) => !open)}
            >
              <span className={selectedSubsetTable ? "text-gray-900" : "text-gray-400"}>
                {selectedSubsetTable || "Select Table"}
              </span>
              <span className="text-gray-500">&#9662;</span>
            </button>

            {tableDropdownOpen && (
              <div className="absolute z-10 bg-white border border-gray-200 rounded-md shadow w-full mt-1 max-h-56 overflow-auto">
                <input
                  type="text"
                  placeholder="Search table..."
                  className="w-full px-3 py-2 text-sm border-b border-gray-200 focus:outline-none"
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  autoFocus
                />
                <div>
                  {filteredTables.length > 0 ? (
                    filteredTables.map((table, idx) => (
                      <div
                        key={idx}
                        className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${
                          selectedSubsetTable === table.source_table ? "bg-gray-50" : ""
                        }`}
                        onClick={() => {
                          const tbl = table.source_table;
                          setSelectedSubsetTable(tbl);
                          selectSource(ID, tbl, connectedTargets, isPipelineNode);
                          const updatedNodeData = {
                            ...nodeData,
                            subset_list: nodeData.subset_list.includes(tbl)
                              ? nodeData.subset_list
                              : [...nodeData.subset_list, tbl],
                          };
                          setNodeData(updatedNodeData);
                          updateData(ID, isPipelineNode, "source", updatedNodeData);
                          setTableDropdownOpen(false);
                          setTableSearch("");
                        }}
                      >
                        {table.source_table}
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-400">No tables found</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showTablesList && (
        <div className="mt-3">
          <div className="flex items-center justify-between my-3">
            <div className="flex items-center gap-1">
              <label className="text-sm font-medium text-black">Data Set</label>
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
                onClick={() => openDrawer(data.category || "source", "scope", id, data.pipelineId)}
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