import React, { useState, useEffect, useCallback, useRef } from "react";
import { Handle, Position } from "reactflow";
import { X, Database, Loader } from "lucide-react";
import { useAuth } from "../../../../../context/AuthContext";
import { useTransformation } from "../TransformationContext";

export const TargetNode = ({ id, data }) => {
  const [connections, setConnections] = useState([]);
  const [schemas, setSchemas] = useState([]);
  const [tables, setTables] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState({
    connections: false,
    schemas: false,
    tables: false,
  });
  const [selectedConnection, setSelectedConnection] = useState({
    name: "",
    id: "",
    type: "",
  });
  const [selectedSchema, setSelectedSchema] = useState("");
  const [selectedTable, setSelectedTable] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loadType, setLoadType] = useState("FullLoad");
  const [loadStrategy, setLoadStrategy] = useState("append");
  const [dataFetchStatus, setDataFetchStatus] = useState({
    connections: "idle",
    schemas: "idle",
    tables: "idle",
  });

  const [connectionSearch, setConnectionSearch] = useState("");
  const [schemaSearch, setSchemaSearch] = useState("");
  const [tableSearch, setTableSearch] = useState("");
  const [connectionDropdownOpen, setConnectionDropdownOpen] = useState(false);
  const [schemaDropdownOpen, setSchemaDropdownOpen] = useState(false);
  const [tableDropdownOpen, setTableDropdownOpen] = useState(false);

  const [alias, setAlias] = useState(data.alias || "");

  const [columnMapping, setColumnMapping] = useState(data.columnMapping || {});
  const [targetMapping, setTargetMapping] = useState(data.targetMapping || {});

  const connectionDropdownRef = useRef(null);
  const schemaDropdownRef = useRef(null);
  const tableDropdownRef = useRef(null);

  const hostnamev1 = window._env_?.VITE_FAST_API;
  const { token, decodedToken, project } = useAuth();
  const { getAllSelectedSourceColumns } = useTransformation();

  const fetchConnections = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, connections: true }));
      setDataFetchStatus((prev) => ({ ...prev, connections: "loading" }));

      const connectionResponse = await fetch(`${hostnamev1}/connection-saves`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!connectionResponse.ok) {
        throw new Error(`HTTP error! status: ${connectionResponse.status}`);
      }

      const connectionsData = await connectionResponse.json();

      const currentUser = decodedToken?.preferred_username;

      const filteredConnections = connectionsData
        .filter(conn => conn.created_by === currentUser)
        .filter(conn => conn.project === project)
        .filter(conn => conn.pool_type === "target" || conn.pool_type === "both");

      setConnections(filteredConnections);
      setDataFetchStatus((prev) => ({ ...prev, connections: "success" }));
    } catch (error) {
      console.error("Error fetching connections:", error);
      setDataFetchStatus((prev) => ({ ...prev, connections: "error" }));
    } finally {
      setLoading((prev) => ({ ...prev, connections: false }));
    }
  }, [hostnamev1, token, decodedToken]);

  const fetchSchemas = useCallback(
    async (connectionName) => {
      if (!connectionName) return;

      try {
        setLoading((prev) => ({ ...prev, schemas: true }));
        setDataFetchStatus((prev) => ({ ...prev, schemas: "loading" }));
        setSchemas([]);

        const response = await fetch(`${hostnamev1}/schema/${connectionName}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const schemaData = await response.json();
        setSchemas(schemaData);
        setDataFetchStatus((prev) => ({ ...prev, schemas: "success" }));
      } catch (error) {
        console.error("Error fetching schemas:", error);
        setDataFetchStatus((prev) => ({ ...prev, schemas: "error" }));
      } finally {
        setLoading((prev) => ({ ...prev, schemas: false }));
      }
    },
    [hostnamev1, token]
  );

  const fetchTablesAndColumns = useCallback(
    async (connectionName, schemaName) => {
      if (!connectionName || !schemaName) return;

      try {
        setLoading((prev) => ({ ...prev, tables: true }));
        setDataFetchStatus((prev) => ({ ...prev, tables: "loading" }));
        setTables([]);

        const response = await fetch(
          `${hostnamev1}/connection-master-metadata/find-by-conn-name-type?conn_name=${connectionName}&schema_name=${schemaName}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const tableData = await response.json();
        setTables(tableData);
        setDataFetchStatus((prev) => ({ ...prev, tables: "success" }));
      } catch (error) {
        console.error("Error fetching tables:", error);
        setDataFetchStatus((prev) => ({ ...prev, tables: "error" }));
      } finally {
        setLoading((prev) => ({ ...prev, tables: false }));
      }
    },
    [hostnamev1, token]
  );

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  useEffect(() => {
    data.onDataChange({
      connection: selectedConnection.name,
      connectionId: selectedConnection.id,
      connectionType: selectedConnection.type,
      schema: selectedSchema,
      table: selectedTable,
      loadType: loadType,
      loadStrategy: loadStrategy,
      columns:
        tables.find(t => t.table_name === selectedTable)?.column_json?.map(col => ({
          name: col.column_name,
          datatype: col.DATA_TYPE
        })) || [],
      alias: alias,
      columnMapping,
      targetMapping,
    });
  }, [
    selectedConnection, selectedSchema, selectedTable, loadType, loadStrategy,
    tables, alias, columnMapping, targetMapping
  ]);

  const getNextAlias = useCallback(() => {
    const targetNodesFromWindow = window.allNodes ?
      window.allNodes.filter(n => n.type === "target") : [];

    let maxNumber = 0;

    targetNodesFromWindow.forEach(node => {
      if (node.id !== id) {
        const aliasMatch = (node.data?.alias || "").match(/^unnamed_target_(\d+)$/);
        if (aliasMatch && aliasMatch[1]) {
          const num = parseInt(aliasMatch[1], 10);
          if (!isNaN(num) && num > maxNumber) {
            maxNumber = num;
          }
        }
      }
    });

    return `unnamed_target_${maxNumber + 1}`;
  }, [id]);

  useEffect(() => {
    if (selectedTable && !alias) {
      setAlias(getNextAlias());
    }
  }, [selectedTable, alias, getNextAlias]);

  const getColumnsForTable = (tableName) => {
    const tableObj = tables.find((t) => t.table_name === tableName);
    return tableObj?.column_json || [];
  };

  const filteredConnections = connections.filter(conn =>
    conn.connection_name?.toLowerCase().includes(connectionSearch.toLowerCase())
  );
  const filteredSchemas = schemas.filter(schema =>
    schema.table_schema?.toLowerCase().includes(schemaSearch.toLowerCase())
  );
  const filteredTables = tables.filter(table =>
    table.table_name?.toLowerCase().includes(tableSearch.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        connectionDropdownRef.current &&
        !connectionDropdownRef.current.contains(event.target)
      ) setConnectionDropdownOpen(false);
      if (
        schemaDropdownRef.current &&
        !schemaDropdownRef.current.contains(event.target)
      ) setSchemaDropdownOpen(false);
      if (
        tableDropdownRef.current &&
        !tableDropdownRef.current.contains(event.target)
      ) setTableDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getAllSourceColumns = () => {
    // 1. All selected columns from all source nodes (context)
    let allCols = getAllSelectedSourceColumns();

    // 2. Add ALL columns from all transformation drawer operations (target_column and source_column)
    if (data && Array.isArray(data.transformations)) {
      data.transformations.forEach(tr => {
        // Add target_column(s)
        if (Array.isArray(tr.target_column)) {
          allCols = allCols.concat(tr.target_column);
        }
        // Add source_column(s)
        if (Array.isArray(tr.source_column)) {
          allCols = allCols.concat(tr.source_column);
        }
      });
    }

    // Remove duplicates and falsy values
    return Array.from(new Set(allCols.filter(Boolean)));
  };

  const getAllTargetColumns = () => {
    let targetCols = [];
    if (Array.isArray(columns) && columns.length > 0) {
      targetCols = columns.map(col => (typeof col === "string" ? col : col.name || col));
    } else {
      const tableObj = tables.find(t => t.table_name === selectedTable);
      if (tableObj && Array.isArray(tableObj.column_json)) {
        targetCols = tableObj.column_json.map(col => col.column_name);
      }
    }
    return targetCols;
  };

  useEffect(() => {
    if (data.columnMapping && JSON.stringify(data.columnMapping) !== JSON.stringify(columnMapping)) {
      setColumnMapping(data.columnMapping);
    }
  }, [data.columnMapping]);

  // Update targetMapping to always have all target columns as keys
  useEffect(() => {
    const targetCols = getAllTargetColumns();
    setTargetMapping(prev => {
      const updated = {};
      targetCols.forEach(col => {
        updated[col] = prev && Object.prototype.hasOwnProperty.call(prev, col) ? prev[col] : "";
      });
      return updated;
    });
    // eslint-disable-next-line
  }, [columns, tables, selectedTable, data.transformations]);

  const sourceColumnOptions = getAllSourceColumns().map(col => ({
    value: col,
    label: col
  }));

  return (
    <div className="bg-white rounded-lg p-4 shadow-md border-2 border-[#8E77BB] min-w-[280px] max-w-[320px] relative group">
      <button
        onClick={() => window.deleteNode?.(id)}
        className="absolute top-1.5 right-2 p-1"
      >
        <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
      </button>

      <Handle type="target" position={Position.Left} style={{ width: 10, height: 10 }} />

      <div className="flex items-center space-x-3 mb-3">
        <Database className="w-5 h-5 text-[#96CF7B]" />
        <h3 className="text-black font-medium">Target</h3>
      </div>

      <div className="space-y-3">
        <div>

          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-black mb-0.5 block">
              Connection
            </label>
            {dataFetchStatus.connections === "loading" && (
              <div className="flex items-center">
                <Loader size={10} className="animate-spin text-[#8E77BB] mr-1" />
                <span className="text-[10px] text-gray-500">Loading...</span>
              </div>
            )}
          </div>
          <div className="relative" ref={connectionDropdownRef}>
            <button
              type="button"
              className="w-full p-1.5 text-[11px] bg-white rounded-sm border border-gray-300 text-gray-800 text-left flex justify-between items-center focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 pr-8"
              onClick={() => setConnectionDropdownOpen(v => !v)}
              disabled={loading.connections}
            >
              {selectedConnection.name
                ? `${selectedConnection.name} (${selectedConnection.type})`
                : dataFetchStatus.connections === "loading"
                  ? "Loading connections..."
                  : "Select connection"}
              <span className="ml-auto pl-2">&#9662;</span>
            </button>
            {connectionDropdownOpen && (
              <div className="absolute z-10 left-0 right-0 bg-white border border-gray-300 rounded shadow mt-1 max-h-52 overflow-auto">
                <input
                  type="search"
                  placeholder="Search connections..."
                  className="w-full p-1 text-[11px] text-black border-b border-gray-200"
                  value={connectionSearch}
                  onChange={e => setConnectionSearch(e.target.value)}
                  autoFocus
                />
                {filteredConnections.length === 0 && (
                  <div className="p-2 text-xs text-gray-500">No connections found</div>
                )}
                {filteredConnections.map((connection, idx) => (
                  <div
                    key={idx}
                    className={`p-2 text-[11px] text-black cursor-pointer hover:bg-gray-100 ${selectedConnection.name === connection.connection_name ? "bg-gray-100" : ""}`}
                    onClick={() => {
                      setSelectedConnection({
                        name: connection.connection_name,
                        id: connection.connection_id,
                        type: connection.connection_type,
                      });
                      setSelectedSchema("");
                      setSelectedTable("");
                      setColumns([]);
                      fetchSchemas(connection.connection_name);
                      setConnectionDropdownOpen(false);
                    }}
                  >
                    {connection.connection_name} ({connection.connection_type})
                  </div>
                ))}
              </div>
            )}
            {loading.connections && (
              <div className="absolute right-2 top-2">
                <Loader size={12} className="animate-spin text-gray-400" />
              </div>
            )}
          </div>
          {dataFetchStatus.connections === "error" && (
            <p className="text-[10px] text-red-500 mt-1">
              Failed to load connections
            </p>
          )}
          {dataFetchStatus.connections === "success" &&
            connections.length === 0 && (
              <p className="text-[10px] text-amber-500 mt-1">
                No connections found
              </p>
            )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-black mb-0.5 block">
              Schema
            </label>
            {dataFetchStatus.schemas === "loading" && (
              <div className="flex items-center">
                <Loader size={10} className="animate-spin text-[#8E77BB] mr-1" />
                <span className="text-[10px] text-gray-500">Loading...</span>
              </div>
            )}
          </div>
          <div className="relative" ref={schemaDropdownRef}>
            <button
              type="button"
              className="w-full p-1.5 text-[11px] bg-white rounded-sm border border-gray-300 text-gray-800 text-left flex justify-between items-center focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 pr-8"
              onClick={() => setSchemaDropdownOpen(v => !v)}
              disabled={!selectedConnection.name || loading.schemas}
            >
              {selectedSchema
                ? selectedSchema
                : !selectedConnection.name
                  ? "Select connection first"
                  : dataFetchStatus.schemas === "loading"
                    ? "Loading schemas..."
                    : "Select schema"}
              <span className="ml-auto pl-2">&#9662;</span>
            </button>
            {schemaDropdownOpen && (
              <div className="absolute z-10 left-0 right-0 bg-white border border-gray-300 rounded shadow mt-1 max-h-52 overflow-auto">
                <input
                  type="search"
                  placeholder="Search schemas..."
                  className="w-full p-1 text-[11px] text-black border-b border-gray-200"
                  value={schemaSearch}
                  onChange={e => setSchemaSearch(e.target.value)}
                  autoFocus
                />
                {filteredSchemas.length === 0 && (
                  <div className="p-2 text-xs text-gray-500">No schemas found</div>
                )}
                {filteredSchemas.map((schema, idx) => (
                  <div
                    key={idx}
                    className={`p-2 text-[11px] text-black cursor-pointer hover:bg-gray-100 ${selectedSchema === schema.table_schema ? "bg-gray-100" : ""}`}
                    onClick={() => {
                      setSelectedSchema(schema.table_schema);
                      setSelectedTable("");
                      setColumns([]);
                      fetchTablesAndColumns(selectedConnection.name, schema.table_schema);
                      setSchemaDropdownOpen(false);
                    }}
                  >
                    {schema.table_schema}
                  </div>
                ))}
              </div>
            )}
            {loading.schemas && (
              <div className="absolute right-2 top-2">
                <Loader size={12} className="animate-spin text-gray-400" />
              </div>
            )}
          </div>
          {dataFetchStatus.schemas === "error" && (
            <p className="text-[10px] text-red-500 mt-1">
              Failed to load schemas
            </p>
          )}
          {dataFetchStatus.schemas === "success" && schemas.length === 0 && (
            <p className="text-[10px] text-amber-500 mt-1">
              No schemas found
            </p>
          )}
        </div>

        {selectedSchema && (
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-black mb-0.5 block">
                Table
              </label>
              {dataFetchStatus.tables === "loading" && (
                <div className="flex items-center">
                  <Loader size={10} className="animate-spin text-[#8E77BB] mr-1" />
                  <span className="text-[10px] text-gray-500">Loading...</span>
                </div>
              )}
            </div>
            <div className="space-y-1.5" ref={tableDropdownRef}>
              <div className="relative">
                <button
                  type="button"
                  className="w-full p-1.5 text-[11px] bg-white rounded-sm border border-gray-300 text-gray-800 text-left flex justify-between items-center focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 pr-8"
                  onClick={() => setTableDropdownOpen(v => !v)}
                  disabled={loading.tables}
                >
                  {selectedTable
                    ? selectedTable
                    : dataFetchStatus.tables === "loading"
                      ? "Loading tables..."
                      : "Select table"}
                  <span className="ml-auto pl-2">&#9662;</span>
                </button>
                {tableDropdownOpen && (
                  <div className="absolute z-10 left-0 right-0 bg-white border border-gray-300 rounded shadow mt-1 max-h-52 overflow-auto">
                    <input
                      type="search"
                      placeholder="Search tables..."
                      className="w-full p-1 text-[11px] text-black border-b border-gray-200"
                      value={tableSearch}
                      onChange={e => setTableSearch(e.target.value)}
                      autoFocus
                    />
                    {filteredTables.length === 0 && (
                      <div className="p-2 text-xs text-gray-500">No tables found</div>
                    )}
                    {filteredTables.map((table, idx) => (
                      <div
                        key={idx}
                        className={`p-2 text-[11px] text-black cursor-pointer hover:bg-gray-100 ${selectedTable === table.table_name ? "bg-gray-100" : ""}`}
                        onClick={() => {
                          setSelectedTable(table.table_name);
                          const tableColumns = getColumnsForTable(table.table_name);
                          setColumns(tableColumns.map((col) => col.column_name));
                          setTableDropdownOpen(false);
                        }}
                      >
                        {table.table_name}
                      </div>
                    ))}
                  </div>
                )}
                {loading.tables && (
                  <div className="absolute right-2 top-2">
                    <Loader size={12} className="animate-spin text-gray-400" />
                  </div>
                )}
              </div>
            </div>
            {dataFetchStatus.tables === "error" && (
              <p className="text-[10px] text-red-500 mt-1">
                Failed to load tables
              </p>
            )}
            {dataFetchStatus.tables === "success" && tables.length === 0 && (
              <p className="text-[10px] text-amber-500 mt-1">
                No tables found
              </p>
            )}
          </div>
        )}

        {selectedTable && (
          <div className="mt-2">
            <label className="text-xs font-semibold text-black mb-0.5 block">
              Alias Name
            </label>
            <input
              type="text"
              className="w-full p-1.5 text-[11px] bg-white rounded-sm border border-gray-300 text-gray-800"
              value={alias}
              onChange={e => setAlias(e.target.value)}
              placeholder="Enter alias name"
            />
          </div>
        )}

        {selectedTable && (
          <>
            <div>
              <label className="text-xs font-semibold text-black mb-0.5 block">
                Load Type
              </label>
              <div className="relative">
                <select
                  className="w-full p-1.5 text-[11px] bg-white rounded-sm border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 pr-8"
                  value={loadType}
                  onChange={(e) => setLoadType(e.target.value)}
                >
                  <option value="FullLoad">Full Load</option>
                  <option value="Delta">Delta</option>
                  <option value="SCD1">SCD Type 1</option>
                  <option value="SCD2">SCD Type 2</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-black mb-0.5 block">
                Load Strategy
              </label>
              <div className="relative">
                <select
                  className="w-full p-1.5 text-[11px] bg-white rounded-sm border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 pr-8"
                  value={loadStrategy}
                  onChange={(e) => setLoadStrategy(e.target.value)}
                >
                  <option value="append">Append</option>
                  <option value="overwrite">Overwrite</option>
                </select>
              </div>
            </div>
          </>
        )}

        {selectedTable && data.connectedSources > 0 && (
          <div className="mt-4">
            <div className="text-xs font-semibold text-black mb-1">Target Mapping</div>
            <div
              className="border border-gray-300 rounded p-2"
              style={{ maxHeight: "220px", overflowY: "auto", minHeight: "80px" }}
            >
              <div className="grid grid-cols-2 gap-2 text-black font-semibold text-xs mb-2">
                <div>Target Columns</div>
                <div>Source Columns</div>
              </div>
              <div>
                {getAllTargetColumns().map((targetCol) => (
                  <div key={targetCol} className="grid grid-cols-2 gap-2 items-center mb-2">
                    <div className="text-xs text-gray-800">{targetCol}</div>
                    <select
                      className="w-full p-1.5 text-[11px] bg-white rounded-sm border border-gray-300 text-gray-800"
                      value={targetMapping[targetCol] || ""}
                      onChange={e => {
                        const value = e.target.value;
                        setTargetMapping(prev => ({
                          ...prev,
                          [targetCol]: value
                        }));
                      }}
                    >
                      <option value="">-- Select source column --</option>
                      {sourceColumnOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      {selectedConnection.type && (
        <div className="mt-3 pt-2 border-t border-gray-200">
          <span className="text-[10px] text-gray-500">
            Connection Type:{" "}
            <span className="font-semibold text-[#8E77BB]">
              {selectedConnection.type}
            </span>
          </span>
        </div>
      )}
    </div>
  );
};