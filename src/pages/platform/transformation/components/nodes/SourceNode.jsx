import React, { useState, useEffect, useCallback, useRef } from "react";
import { Handle, Position } from "reactflow";
import { X, Database, Loader } from "lucide-react";
import { useAuth } from "../../../../../context/AuthContext";
import { useTransformation } from "../TransformationContext";

export const SourceNode = ({ id, data }) => {
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
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [selectedObjectType, setSelectedObjectType] = useState(""); // "tables" or "procedures"
  // Add state to preserve table and procedure selections
  const [tableSelections, setTableSelections] = useState({
    selectedTable: "",
    selectedColumns: []
  });
  const [procedureSelections, setProcedureSelections] = useState({
    selectedProcedure: "",
    selectedParameters: []
  });
  const [connectionSearch, setConnectionSearch] = useState("");
  const [schemaSearch, setSchemaSearch] = useState("");
  const [tableSearch, setTableSearch] = useState("");
  const [columnSearch, setColumnSearch] = useState("");
  const [dataFetchStatus, setDataFetchStatus] = useState({
    connections: "idle",
    schemas: "idle",
    tables: "idle",
  });
  const [connectionDropdownOpen, setConnectionDropdownOpen] = useState(false);
  const [schemaDropdownOpen, setSchemaDropdownOpen] = useState(false);
  const [tableDropdownOpen, setTableDropdownOpen] = useState(false);
  const [alias, setAlias] = useState(data.alias || "");

  const hostnamev1 = import.meta.env.VITE_FAST_API;
  const { token, decodedToken, project } = useAuth();
  const { dispatch, ACTION_TYPES } = useTransformation();

  const connectionDropdownRef = useRef(null);
  const schemaDropdownRef = useRef(null);
  const tableDropdownRef = useRef(null);

  const fetchConnections = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, connections: true }));
      setDataFetchStatus(prev => ({ ...prev, connections: "loading" }));

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
        .filter(conn => conn.pool_type === "source" || conn.pool_type === "both");

      setConnections(filteredConnections);
      setDataFetchStatus(prev => ({ ...prev, connections: "success" }));
    } catch (error) {
      console.error("Error fetching connections:", error);
      setDataFetchStatus(prev => ({ ...prev, connections: "error" }));
    } finally {
      setLoading(prev => ({ ...prev, connections: false }));
    }
  }, [hostnamev1, token, decodedToken]);

  const fetchSchemas = useCallback(async (connectionName) => {
    if (!connectionName) return;

    try {
      setLoading(prev => ({ ...prev, schemas: true }));
      setDataFetchStatus(prev => ({ ...prev, schemas: "loading" }));
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
      setDataFetchStatus(prev => ({ ...prev, schemas: "success" }));
    } catch (error) {
      console.error("Error fetching schemas:", error);
      setDataFetchStatus(prev => ({ ...prev, schemas: "error" }));
    } finally {
      setLoading(prev => ({ ...prev, schemas: false }));
    }
  }, [hostnamev1, token]);

  const fetchTablesAndColumns = useCallback(async (connectionName, schemaName) => {
    if (!connectionName || !schemaName) return;

    try {
      setLoading(prev => ({ ...prev, tables: true }));
      setDataFetchStatus(prev => ({ ...prev, tables: "loading" }));
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
      setDataFetchStatus(prev => ({ ...prev, tables: "success" }));
    } catch (error) {
      console.error("Error fetching tables:", error);
      setDataFetchStatus(prev => ({ ...prev, tables: "error" }));
    } finally {
      setLoading(prev => ({ ...prev, tables: false }));
    }
  }, [hostnamev1, token]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  useEffect(() => {
    const currentTable = selectedObjectType === "procedures" && tableSelections.selectedTable
      ? tableSelections.selectedTable
      : selectedTable;

    const currentColumns = selectedObjectType === "procedures" && tableSelections.selectedColumns.length > 0
      ? tableSelections.selectedColumns
      : selectedColumns;

    data.onDataChange({
      connection: selectedConnection.name,
      connectionId: selectedConnection.id,
      connectionType: selectedConnection.type,
      schema: selectedSchema,
      table: currentTable,
      columns: currentColumns.map(col => ({
        name: col.name,
        datatype: col.datatype
      })),
      alias: alias,
      objectType: selectedObjectType,
    });

    dispatch({
      type: ACTION_TYPES.UPDATE_SELECTED_SOURCE_COLUMNS,
      payload: {
        sourceNodeId: id,
        columns: currentColumns.map(col => col.name)
      }
    });
  }, [selectedConnection, selectedSchema, selectedTable, selectedColumns, alias, id, dispatch, ACTION_TYPES, selectedObjectType, tableSelections]);

  const getColumnsForTable = (tableName) => {
    const tableObj = tables.find(t => t.table_name === tableName);
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

  const filteredColumns = columns.filter(col =>
    col.column_name?.toLowerCase().includes(columnSearch.toLowerCase())
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

  const getNextAlias = useCallback(() => {
    const sourceNodesFromWindow = window.allNodes ?
      window.allNodes.filter(n => n.type === "source") : [];

    let maxNumber = 0;

    sourceNodesFromWindow.forEach(node => {
      if (node.id !== id) {
        const aliasMatch = (node.data?.alias || "").match(/^unnamed_source_(\d+)$/);
        if (aliasMatch && aliasMatch[1]) {
          const num = parseInt(aliasMatch[1], 10);
          if (!isNaN(num) && num > maxNumber) {
            maxNumber = num;
          }
        }
      }
    });

    return `unnamed_source_${maxNumber + 1}`;
  }, [id]);

  useEffect(() => {
    if (selectedTable && !alias) {
      setAlias(getNextAlias());
    }
  }, [selectedTable, alias, getNextAlias]);

  return (
    <div className="bg-white rounded-lg p-4 shadow-md border-2 border-[#8E77BB] min-w-[280px] max-w-[320px] relative group">
      <button
        onClick={() => window.deleteNode?.(id)}
        className="absolute top-1.5 right-2 p-1"
      >
        <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
      </button>

      <Handle type="target" position={Position.Left} style={{ width: 10, height: 10 }} />
      <Handle type="source" position={Position.Right} style={{ width: 10, height: 10 }} />

      <div className="flex items-center space-x-3 mb-3">
        <Database className="w-5 h-5 text-[#96CF7B]" />
        <h3 className="text-black font-medium">Source</h3>
      </div>

      <div className="space-y-3">
        <div>

          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-black mb-0.5 block">
              Connection
            </label>
            {dataFetchStatus.connections === 'loading' && (
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
                : dataFetchStatus.connections === 'loading'
                  ? 'Loading connections...'
                  : 'Select connection'}
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
                      setSelectedColumns([]);
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
          {dataFetchStatus.connections === 'error' && (
            <p className="text-[10px] text-red-500 mt-1">Failed to load connections</p>
          )}
          {dataFetchStatus.connections === 'success' && connections.length === 0 && (
            <p className="text-[10px] text-amber-500 mt-1">No connections found</p>
          )}
        </div>

        <div>

          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-black mb-0.5 block">
              Schema
            </label>
            {dataFetchStatus.schemas === 'loading' && (
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
                  ? 'Select connection first'
                  : dataFetchStatus.schemas === 'loading'
                    ? 'Loading schemas...'
                    : 'Select schema'}
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
                      setSelectedColumns([]);
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
          {dataFetchStatus.schemas === 'error' && (
            <p className="text-[10px] text-red-500 mt-1">Failed to load schemas</p>
          )}
          {dataFetchStatus.schemas === 'success' && schemas.length === 0 && (
            <p className="text-[10px] text-amber-500 mt-1">No schemas found</p>
          )}
        </div>

        {selectedSchema && (
          <>
            <div>
              {/* <label className="text-xs font-semibold text-black mb-1 block">
                Object Type
              </label> */}
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`flex-1 p-1.5 text-[11px] rounded-sm border text-center focus:outline-none focus:ring-1 focus:ring-gray-400 ${
                    selectedObjectType === "tables"
                      ? "bg-[#8E77BB] text-white border-[#8E77BB]"
                      : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
                  }`}
                  onClick={() => {
                    if (selectedObjectType === "procedures") {
                      setProcedureSelections({
                        selectedProcedure: selectedTable,
                        selectedParameters: selectedColumns
                      });
                    }

                    setSelectedObjectType("tables");

                    setSelectedTable(tableSelections.selectedTable);
                    setSelectedColumns(tableSelections.selectedColumns);

                    if (!loading.tables && tables.length === 0 && !tableSelections.selectedTable) {
                      fetchTablesAndColumns(selectedConnection.name, selectedSchema);
                    }
                  }}
                >
                  Tables
                </button>
                <button
                  type="button"
                  className={`flex-1 p-1.5 text-[11px] rounded-sm border text-center focus:outline-none focus:ring-1 focus:ring-gray-400 ${
                    selectedObjectType === "procedures"
                      ? "bg-[#8E77BB] text-white border-[#8E77BB]"
                      : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
                  }`}
                  onClick={() => {
                    if (selectedObjectType === "tables") {
                      setTableSelections({
                        selectedTable: selectedTable,
                        selectedColumns: selectedColumns
                      });
                    }

                    setSelectedObjectType("procedures");

                    setSelectedTable(procedureSelections.selectedProcedure);
                    setSelectedColumns(procedureSelections.selectedParameters);
                  }}
                >
                  Procedures
                </button>
              </div>
            </div>

            {selectedObjectType === "tables" && (
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-black mb-0.5 block">
                    Table
                  </label>
                  {dataFetchStatus.tables === 'loading' && (
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
                        : dataFetchStatus.tables === 'loading'
                          ? 'Loading tables...'
                          : 'Select table'}
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
                              setSelectedColumns([]);
                              const tableColumns = getColumnsForTable(table.table_name);
                              setColumns(tableColumns);
                              setTableDropdownOpen(false);

                              setTableSelections({
                                selectedTable: table.table_name,
                                selectedColumns: []
                              });
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
                {dataFetchStatus.tables === 'error' && (
                  <p className="text-[10px] text-red-500 mt-1">Failed to load tables</p>
                )}
                {dataFetchStatus.tables === 'success' && tables.length === 0 && (
                  <p className="text-[10px] text-amber-500 mt-1">No tables found</p>
                )}
              </div>
            )}

{(selectedTable || selectedObjectType === "procedures") && (
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
            {selectedObjectType === "procedures" && (
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-black mb-0.5 block">
                    Procedure
                  </label>
                </div>
                <div className="p-3 text-center text-[11px] text-gray-500 border border-gray-300 rounded-sm bg-gray-50">
                  Procedures functionality coming soon
                </div>
              </div>
            )}



            {selectedObjectType === "tables" && selectedTable && columns.length > 0 ? (
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-black mb-0.5 block">
                    Columns
                  </label>
                  <input
                    type="search"
                    placeholder="Search columns..."
                    className="ml-2 p-1 text-[11px] text-black border border-gray-400 rounded-sm w-32"
                    value={columnSearch}
                    onChange={e => setColumnSearch(e.target.value)}
                  />
                </div>
                <div className="max-h-40 mt-2 overflow-y-auto border text-black border-gray-300 rounded-sm p-2">
                  <div className="mb-2">
                    <label className="flex items-center text-[11px]">
                      <input
                        type="checkbox"
                        className="mr-1.5 h-3.5 w-3.5"
                        checked={selectedColumns.length === columns.length && columns.length > 0}
                        onChange={(e) => {
                          const newColumns = e.target.checked
                            ? columns.map(col => ({
                                name: col.column_name,
                                datatype: col.DATA_TYPE
                              }))
                            : [];

                          setSelectedColumns(newColumns);
                          setTableSelections(prev => ({
                            ...prev,
                            selectedColumns: newColumns
                          }));
                        }}
                      />
                      <span className="font-medium">Select All</span>
                    </label>
                  </div>

                  {filteredColumns.map((column, idx) => {
                    const isChecked = selectedColumns.some(
                      c => c.name === column.column_name && c.datatype === column.DATA_TYPE
                    );
                    return (
                      <div key={idx} className="mb-1.5">
                        <label className="flex items-center text-[11px]">
                          <input
                            type="checkbox"
                            className="mr-1.5 h-3.5 w-3.5"
                            checked={isChecked}
                            onChange={(e) => {
                              let newColumns;
                              if (e.target.checked) {
                                newColumns = [
                                  ...selectedColumns,
                                  { name: column.column_name, datatype: column.DATA_TYPE }
                                ];
                              } else {
                                newColumns = selectedColumns.filter(
                                  c => !(c.name === column.column_name && c.datatype === column.DATA_TYPE)
                                );
                              }

                              setSelectedColumns(newColumns);
                              setTableSelections(prev => ({
                                ...prev,
                                selectedColumns: newColumns
                              }));
                            }}
                          />
                          <span>{column.column_name}</span>
                          <span className="text-[9px] text-gray-500 ml-1.5">({column.DATA_TYPE})</span>
                        </label>
                      </div>
                    );
                  })}
                  {filteredColumns.length === 0 && (
                    <div className="text-center py-2 text-[11px] text-gray-500">
                      No columns match your search
                    </div>
                  )}
                </div>
              </div>
            ) : selectedObjectType === "tables" && selectedTable && columns.length === 0 ? (
              <div className="text-center py-2 text-[11px] text-gray-500">
                No columns found for this table
              </div>
            ) : null}
          </>
        )}
      </div>

      {selectedConnection.type && (
        <div className="mt-3 pt-2 border-t border-gray-200">
          <span className="text-[10px] text-gray-500">
            Connection Type: <span className="font-semibold text-[#8E77BB]">{selectedConnection.type}</span>
          </span>
        </div>
      )}


    </div>
  );
};
