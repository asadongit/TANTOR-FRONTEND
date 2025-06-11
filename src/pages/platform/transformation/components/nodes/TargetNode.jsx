import React, { useState, useEffect, useCallback } from "react";
import { Handle, Position } from "reactflow";
import { X, Database, Loader } from "lucide-react";
import { useAuth } from "../../../../../context/AuthContext";

export const TargetNode = ({ id, data }) => {
  const [connections, setConnections] = useState([]);
  const [schemas, setSchemas] = useState([]);
  const [tables, setTables] = useState([]);
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

  const hostnamev1 = import.meta.env.VITE_FAST_API;
  const { token, decodedToken } = useAuth();

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

      const filteredConnections =
        currentUser === "admin"
          ? connectionsData
          : connectionsData.filter((conn) => conn.created_by === currentUser);

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
    });
  }, [selectedConnection, selectedSchema, selectedTable, loadType, loadStrategy]);

  const filteredTables = tables.filter((table) =>
    table.table_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg p-4 shadow-md border-2 border-[#8E77BB] min-w-[280px] max-w-[320px] relative group">
      <button
        onClick={() => window.deleteNode?.(id)}
        className="absolute top-1.5 right-2 p-1"
      >
        <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
      </button>

      <Handle type="target" position={Position.Left} />

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
          <div className="relative">
            <select
              className="w-full p-1.5 text-[11px] bg-white rounded-sm border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 pr-8"
              value={selectedConnection.name}
              onChange={(e) => {
                const connection = connections.find(
                  (c) => c.connection_name === e.target.value
                );
                if (connection) {
                  setSelectedConnection({
                    name: connection.connection_name,
                    id: connection.connection_id,
                    type: connection.connection_type,
                  });
                  setSelectedSchema("");
                  setSelectedTable("");
                  fetchSchemas(connection.connection_name);
                }
              }}
              disabled={loading.connections}
            >
              <option value="">
                {dataFetchStatus.connections === "loading"
                  ? "Loading connections..."
                  : "Select connection"}
              </option>
              {connections.map((connection, idx) => (
                <option key={idx} value={connection.connection_name}>
                  {connection.connection_name} ({connection.connection_type})
                </option>
              ))}
            </select>
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
          <div className="relative">
            <select
              className="w-full p-1.5 text-[11px] bg-white rounded-sm border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 pr-8"
              value={selectedSchema}
              onChange={(e) => {
                setSelectedSchema(e.target.value);
                setSelectedTable("");
                if (e.target.value) {
                  fetchTablesAndColumns(selectedConnection.name, e.target.value);
                }
              }}
              disabled={!selectedConnection.name || loading.schemas}
            >
              <option value="">
                {!selectedConnection.name
                  ? "Select connection first"
                  : dataFetchStatus.schemas === "loading"
                  ? "Loading schemas..."
                  : "Select schema"}
              </option>
              {schemas.map((schema, idx) => (
                <option key={idx} value={schema.table_schema}>
                  {schema.table_schema}
                </option>
              ))}
            </select>
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

            <div className="space-y-1.5">


              <div className="relative">
                <select
                  className="w-full p-1.5 text-[11px] bg-white rounded-sm border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 pr-8"
                  value={selectedTable}
                  onChange={(e) => {
                    const tableName = e.target.value;
                    setSelectedTable(tableName);
                  }}
                  disabled={loading.tables}
                >
                  <option value="">
                    {dataFetchStatus.tables === "loading"
                      ? "Loading tables..."
                      : "Select table"}
                  </option>
                  {filteredTables.map((table, idx) => (
                    <option key={idx} value={table.table_name}>
                      {table.table_name}
                    </option>
                  ))}
                </select>
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
