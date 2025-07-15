import React, { useState, useEffect, useCallback, useRef } from "react";
import { Handle, Position } from "reactflow";
import { X, Database, Loader, Plus } from "lucide-react";
import { useAuth } from "../../../../../context/AuthContext";
import { useTransformation } from "../TransformationContext";
import { isNumericType, isStringType, isFloatType } from "./DataTypeMapping";

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
  const [selectedObjectType, setSelectedObjectType] = useState("");

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

  const [procedures, setProcedures] = useState([]);
  const [selectedPreProcedures, setSelectedPreProcedures] = useState([{ id: 1, procedure: null }]);
  const [selectedPostProcedures, setSelectedPostProcedures] = useState([{ id: 1, procedure: null }]);
  const [preProcedureDropdownOpen, setPreProcedureDropdownOpen] = useState({});
  const [postProcedureDropdownOpen, setPostProcedureDropdownOpen] = useState({});
  const [parametersModalOpen, setParametersModalOpen] = useState(false);
  const [selectedProcedureForModal, setSelectedProcedureForModal] = useState(null);
  const [parameterColumnMapping, setParameterColumnMapping] = useState({});
  const [modalProcedureType, setModalProcedureType] = useState(null);
  const [modalProcedureItemId, setModalProcedureItemId] = useState(null);
  const [storedParameterMappings, setStoredParameterMappings] = useState({});

  const hostnamev1 = import.meta.env.VITE_FAST_API;
  const { token, decodedToken, project } = useAuth();
  const { dispatch, ACTION_TYPES } = useTransformation();

  const connectionDropdownRef = useRef(null);
  const schemaDropdownRef = useRef(null);
  const tableDropdownRef = useRef(null);
  const preProcedureDropdownRef = useRef(null);
  const postProcedureDropdownRef = useRef(null);

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
      setDataFetchStatus(prev => ({ ...prev, tables: "ssuccess" }));
    } catch (error) {
      console.error("Error fetching tables:", error);
      setDataFetchStatus(prev => ({ ...prev, tables: "error" }));
    } finally {
      setLoading(prev => ({ ...prev, tables: false }));
    }
  }, [hostnamev1, token]);

  const fetchProcedures = useCallback(async (connectionName, tableName) => {
    if (!connectionName || !tableName) return;

    try {
      setLoading(prev => ({ ...prev, procedures: true }));

      const response = await fetch(`${hostnamev1}/connection-saves/stored-procs/${connectionName}/${tableName}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const proceduresData = await response.json();
      setProcedures(proceduresData);
    } catch (error) {
      console.error("Error fetching procedures:", error);
      setProcedures([]); // Set empty array on error
    } finally {
      setLoading(prev => ({ ...prev, procedures: false }));
    }
  }, [hostnamev1, token]);


  const addPreProcedureDropdown = () => {
    const newId = Math.max(...selectedPreProcedures.map(p => p.id), 0) + 1;
    setSelectedPreProcedures(prev => [...prev, { id: newId, procedure: null }]);
  };

  const addPostProcedureDropdown = () => {
    const newId = Math.max(...selectedPostProcedures.map(p => p.id), 0) + 1;
    setSelectedPostProcedures(prev => [...prev, { id: newId, procedure: null }]);
  };

  const removePreProcedureDropdown = (id) => {
    if (selectedPreProcedures.length > 1) {
      setSelectedPreProcedures(prev => prev.filter(p => p.id !== id));
      setPreProcedureDropdownOpen(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    }
  };

  const removePostProcedureDropdown = (id) => {
    if (selectedPostProcedures.length > 1) {
      setSelectedPostProcedures(prev => prev.filter(p => p.id !== id));
      setPostProcedureDropdownOpen(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    }
  };

  const handlePreProcedureSelect = (procedureItem, procedure) => {
    setSelectedPreProcedures(prev =>
      prev.map(p => p.id === procedureItem.id ? { ...p, procedure } : p)
    );
    setPreProcedureDropdownOpen(prev => ({ ...prev, [procedureItem.id]: false }));
  };

  const handlePostProcedureSelect = (procedureItem, procedure) => {
    setSelectedPostProcedures(prev =>
      prev.map(p => p.id === procedureItem.id ? { ...p, procedure } : p)
    );
    setPostProcedureDropdownOpen(prev => ({ ...prev, [procedureItem.id]: false }));
  };

  const openParametersModal = (procedure, procedureType = null, procedureItemId = null) => {
    setSelectedProcedureForModal(procedure);
    setModalProcedureType(procedureType);
    setModalProcedureItemId(procedureItemId);
    setParametersModalOpen(true);

    const mappingKey = `${procedureType}_${procedureItemId}_${procedure.procedure_name}`;
    const storedMapping = storedParameterMappings[mappingKey] || {};

    const initialMapping = {};
    if (procedure.procedure_parameters) {
      procedure.procedure_parameters.forEach(param => {
        initialMapping[param.name] = storedMapping[param.name] || "";
      });
    }
    setParameterColumnMapping(initialMapping);
  };

  const closeParametersModal = () => {
    setParametersModalOpen(false);
    setSelectedProcedureForModal(null);
    setParameterColumnMapping({});
    setModalProcedureType(null);
    setModalProcedureItemId(null);
  };

  const handleParameterMapping = (parameterName, columnName) => {
    setParameterColumnMapping(prev => ({
      ...prev,
      [parameterName]: columnName
    }));
  };

  const applyProcedureMapping = () => {
    if (!selectedProcedureForModal || !modalProcedureItemId || !modalProcedureType) return;

    const mappedParams = Object.entries(parameterColumnMapping)
      .filter(([param, column]) => column !== "")
      .map(([param, column]) => column);

    const mappingKey = `${modalProcedureType}_${modalProcedureItemId}_${selectedProcedureForModal.procedure_name}`;
    setStoredParameterMappings(prev => ({
      ...prev,
      [mappingKey]: parameterColumnMapping
    }));

    let eventType = "";
    let procedureOrder = 1;

    if (modalProcedureType === "pre") {
      eventType = "BeforeSourceRead";
      const procedureIndex = selectedPreProcedures.findIndex(p => p.id === modalProcedureItemId);
      procedureOrder = procedureIndex + 1;
    } else if (modalProcedureType === "post") {
      eventType = "AfterSourceRead";
      const procedureIndex = selectedPostProcedures.findIndex(p => p.id === modalProcedureItemId);
      procedureOrder = procedureIndex + 1;
    }

    const procedureJSON = {
      "EventType": eventType,
      "Dataset": alias || "unnamed_source",
      "ProcName": selectedProcedureForModal.procedure_name,
      "ProcParams": mappedParams,
      "ProcOrder": procedureOrder,
      "parameterMapping": parameterColumnMapping,
      "procedureId": `${selectedProcedureForModal.procedure_name}_${eventType}_${procedureOrder}`,
      "procedureItemId": modalProcedureItemId,
      "procedureType": modalProcedureType,
      "timestamp": Date.now()
    };

    dispatch({
      type: ACTION_TYPES.UPDATE_PROCEDURE_EXECUTION,
      payload: {
        sourceNodeId: id,
        procedureMapping: procedureJSON
      }
    });

    console.log("Applied Procedure Mapping:", procedureJSON);
    closeParametersModal();
  };

  const getAvailableColumns = () => {
    if (selectedObjectType === "tables" && selectedColumns.length > 0) {
      return selectedColumns.map(col => col.name);
    } else if (selectedObjectType === "procedures" && tableSelections.selectedColumns.length > 0) {
      return tableSelections.selectedColumns.map(col => col.name);
    }
    return [];
  };

  const getFilteredColumnsForParameter = (parameterDataType) => {
    let availableColumns = [];

    if (selectedObjectType === "tables" && selectedColumns.length > 0) {
      availableColumns = selectedColumns;
    } else if (selectedObjectType === "procedures" && tableSelections.selectedColumns.length > 0) {
      availableColumns = tableSelections.selectedColumns;
    }

    if (!parameterDataType || availableColumns.length === 0) {
      return availableColumns.map(col => col.name);
    }

    const compatibleColumns = availableColumns.filter(col => {
      const columnDataType = col.datatype;

      if (isNumericType(parameterDataType)) {
        return isNumericType(columnDataType) || isFloatType(columnDataType);
      } else if (isFloatType(parameterDataType)) {
        return isFloatType(columnDataType) || isNumericType(columnDataType);
      } else if (isStringType(parameterDataType)) {
        return isStringType(columnDataType);
      } else {
        return columnDataType?.toLowerCase().includes(parameterDataType?.toLowerCase()) ||
               isStringType(columnDataType);
      }
    });

    return compatibleColumns.map(col => col.name);
  };

  const areAllParametersMapped = () => {
    if (!selectedProcedureForModal?.procedure_parameters) return false;

    return selectedProcedureForModal.procedure_parameters.every(param =>
      parameterColumnMapping[param.name] && parameterColumnMapping[param.name].trim() !== ""
    );
  };

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
      preProcedures: selectedPreProcedures.filter(p => p.procedure).map(p => p.procedure),
      postProcedures: selectedPostProcedures.filter(p => p.procedure).map(p => p.procedure),
    });

    dispatch({
      type: ACTION_TYPES.UPDATE_SELECTED_SOURCE_COLUMNS,
      payload: {
        sourceNodeId: id,
        columns: currentColumns.map(col => col.name)
      }
    });
  }, [selectedConnection, selectedSchema, selectedTable, selectedColumns, alias, id, dispatch, ACTION_TYPES, selectedObjectType, tableSelections, selectedPreProcedures, selectedPostProcedures]);

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

      const clickedInProcedureDropdown = Object.keys(preProcedureDropdownOpen).some(id => {
        const ref = document.querySelector(`[data-pre-procedure-ref="${id}"]`);
        return ref && ref.contains(event.target);
      });

      const clickedInPostProcedureDropdown = Object.keys(postProcedureDropdownOpen).some(id => {
        const ref = document.querySelector(`[data-post-procedure-ref="${id}"]`);
        return ref && ref.contains(event.target);
      });

      if (!clickedInProcedureDropdown) {
        setPreProcedureDropdownOpen({});
      }

      if (!clickedInPostProcedureDropdown) {
        setPostProcedureDropdownOpen({});
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [preProcedureDropdownOpen, postProcedureDropdownOpen]);

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


                    if (selectedConnection.name && tableSelections.selectedTable) {
                      fetchProcedures(selectedConnection.name, tableSelections.selectedTable);
                    }

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
              <div className="space-y-3">
                <div className="space-y-3">

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-black">
                        Pre Procedure
                      </label>
                      <button
                        type="button"
                        onClick={addPreProcedureDropdown}
                        className="flex items-center justify-center w-4 h-4 bg-[#8E77BB] text-white rounded-full hover:bg-[#7A6BA3] focus:outline-none"
                        title="Add pre procedure"
                      >
                        <Plus size={10} />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {selectedPreProcedures.map((procedureItem, index) => (
                        <div key={procedureItem.id} className="flex gap-1 items-center">
                          <div className={`relative ${procedureItem.procedure ? 'flex-1' : 'w-full'}`} data-pre-procedure-ref={procedureItem.id}>
                            <button
                              type="button"
                              className="w-full p-1.5 text-[11px] bg-white rounded-sm border border-gray-300 text-black text-left flex justify-between items-center focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 pr-8"
                              onClick={() => setPreProcedureDropdownOpen(prev => ({ ...prev, [procedureItem.id]: !prev[procedureItem.id] }))
                              }
                            >
                              {procedureItem.procedure
                                ? procedureItem.procedure.procedure_name
                                : 'Select pre procedure'}
                              <span className="ml-auto pl-2">&#9662;</span>
                            </button>
                            {preProcedureDropdownOpen[procedureItem.id] && (
                              <div className="absolute z-50 top-full left-0 right-0 bg-white border border-gray-300 rounded shadow mt-1 max-h-20 overflow-y-auto">
                                {procedures.length === 0 ? (
                                  <div className="p-2 text-[11px] text-gray-500">No procedures available</div>
                                ) : (
                                  procedures.map((procedure, idx) => (
                                    <div
                                      key={idx}
                                      className={`p-2 text-[11px] text-black cursor-pointer hover:bg-gray-100 ${procedureItem.procedure && procedureItem.procedure.procedure_name === procedure.procedure_name ? "bg-gray-100" : ""}`}
                                      onClick={() => handlePreProcedureSelect(procedureItem, procedure)}
                                    >
                                      {procedure.procedure_name}
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>

                          {procedureItem.procedure && (
                            <button
                              type="button"
                              onClick={() => openParametersModal(procedureItem.procedure, "pre", procedureItem.id)}
                              className="px-2 py-1.5 text-[11px] bg-[#8E77BB] text-white rounded-sm border border-[#8E77BB] hover:bg-[#7A6BA3] focus:outline-none focus:ring-1 focus:ring-gray-400 whitespace-nowrap"
                              title="View parameters"
                            >
                              Parameters
                            </button>
                          )}

                          {selectedPreProcedures.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removePreProcedureDropdown(procedureItem.id)}
                              className="flex items-center justify-center w-6 h-6 text-red-500 hover:text-red-700 focus:outline-none"
                              title="Remove pre procedure"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Post Procedure Section */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-black">
                        Post Procedure
                      </label>
                      <button
                        type="button"
                        onClick={addPostProcedureDropdown}
                        className="flex items-center justify-center w-4 h-4 bg-[#8E77BB] text-white rounded-full hover:bg-[#7A6BA3] focus:outline-none"
                        title="Add post procedure"
                      >
                        <Plus size={10} />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {selectedPostProcedures.map((procedureItem, index) => (
                        <div key={procedureItem.id} className="flex gap-1 items-center">
                          <div className={`relative ${procedureItem.procedure ? 'flex-1' : 'w-full'}`} data-post-procedure-ref={procedureItem.id}>
                            <button
                              type="button"
                              className="w-full p-1.5 text-[11px] bg-white rounded-sm border border-gray-300 text-black text-left flex justify-between items-center focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 pr-8"
                              onClick={() => setPostProcedureDropdownOpen(prev => ({ ...prev, [procedureItem.id]: !prev[procedureItem.id] }))
                              }
                            >
                              {procedureItem.procedure
                                ? procedureItem.procedure.procedure_name
                                : 'Select post procedure'}
                              <span className="ml-auto pl-2">&#9662;</span>
                            </button>
                            {postProcedureDropdownOpen[procedureItem.id] && (
                              <div className="absolute z-50 top-full left-0 right-0 bg-white border border-gray-300 rounded shadow mt-1 max-h-20 overflow-y-auto">
                                {procedures.length === 0 ? (
                                  <div className="p-2 text-[11px] text-gray-500">No procedures available</div>
                                ) : (
                                  procedures.map((procedure, idx) => (
                                    <div
                                      key={idx}
                                      className={`p-2 text-[11px] text-black cursor-pointer hover:bg-gray-100 ${procedureItem.procedure && procedureItem.procedure.procedure_name === procedure.procedure_name ? "bg-gray-100" : ""}`}
                                      onClick={() => handlePostProcedureSelect(procedureItem, procedure)}
                                    >
                                      {procedure.procedure_name}
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>

                          {procedureItem.procedure && (
                            <button
                              type="button"
                              onClick={() => openParametersModal(procedureItem.procedure, "post", procedureItem.id)}
                              className="px-2 py-1.5 text-[11px] bg-[#8E77BB] text-white rounded-sm border border-[#8E77BB] hover:bg-[#7A6BA3] focus:outline-none focus:ring-1 focus:ring-gray-400 whitespace-nowrap"
                              title="View parameters"
                            >
                              Parameters
                            </button>
                          )}

                          {selectedPostProcedures.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removePostProcedureDropdown(procedureItem.id)}
                              className="flex items-center justify-center w-6 h-6 text-red-500 hover:text-red-700 focus:outline-none"
                              title="Remove post procedure"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
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

      {parametersModalOpen && selectedProcedureForModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-4 w-[500px] max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-black">
                  Parameter Mapping
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  {selectedProcedureForModal.procedure_name}
                </p>
              </div>
              <button
                onClick={closeParametersModal}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <X size={18} />
              </button>
            </div>

            {selectedProcedureForModal.procedure_parameters && selectedProcedureForModal.procedure_parameters.length > 0 ? (
              <div className="space-y-2">
                {selectedProcedureForModal.procedure_parameters.map((param, index) => {
                  const filteredColumns = getFilteredColumnsForParameter(param.data_type);

                  return (
                    <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded border">
                      <div className="w-1/3">
                        <p className="text-sm font-medium text-black">{param.name}</p>
                        <p className="text-xs text-gray-500">{param.data_type}</p>
                      </div>

                      <div className="flex-1">
                        {filteredColumns.length > 0 ? (
                          <select
                            value={parameterColumnMapping[param.name] || ""}
                            onChange={(e) => handleParameterMapping(param.name, e.target.value)}
                            className="w-full p-2 text-sm bg-white rounded border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
                          >
                            <option value="">Select Column</option>
                            {filteredColumns.map((column, colIdx) => (
                              <option key={colIdx} value={column}>
                                {column}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border">
                            No compatible columns ({param.data_type})
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {getAvailableColumns().length === 0 && (
                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-center">
                    <p className="text-sm text-yellow-800">
                      No table columns available for mapping.<br />
                      Please select a table and columns first.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500">No parameters found for this procedure.</p>
              </div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={closeParametersModal}
                className="px-3 py-1.5 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={applyProcedureMapping}
                className={`px-3 py-1.5 text-sm rounded focus:outline-none focus:ring-2 ${
                  areAllParametersMapped() && getAvailableColumns().length > 0
                    ? "bg-[#8E77BB] text-white hover:bg-[#7A6BA3] focus:ring-[#8E77BB]"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
                disabled={!areAllParametersMapped() || getAvailableColumns().length === 0 || !selectedProcedureForModal.procedure_parameters || selectedProcedureForModal.procedure_parameters.length === 0}
              >
                Apply Mapping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
