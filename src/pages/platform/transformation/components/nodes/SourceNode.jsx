import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Handle, Position } from "reactflow";
import { X, Database } from "lucide-react";
import { useAuth } from "../../../../../context/AuthContext";
import { useTransformation } from "../TransformationContext";
import { isNumericType, isStringType, isFloatType } from "./DataTypeMapping";
import { SourceDatabaseType } from "./components/sourceDatabaseType";
import { SourceFileType } from "./components/sourceFileType";

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
  const [preProcedureSearch, setPreProcedureSearch] = useState("");
  const [postProcedureSearch, setPostProcedureSearch] = useState("");
  const [enableCountLogging, setEnableCountLogging] = useState(false);
  const hasRestoredEnableCountLogging = useRef(false);

  const [sourceType, setSourceType] = useState(data.sourceType || ""); // "database" or "file"
  const [fileType, setFileType] = useState(data.fileType || "CSV");
  const [filePath, setFilePath] = useState(data.filePath || "");
  const [fileName, setFileName] = useState(data.fileName || "");
  const [fileColumns, setFileColumns] = useState(data.fileColumns || [{ id: 1, name: "", datatype: "string", customDatatype: "", format: "" }]);
  const [sourceTypeDropdownOpen, setSourceTypeDropdownOpen] = useState(false);
  const [fileTypeDropdownOpen, setFileTypeDropdownOpen] = useState(false);

  const [customDatatypeModalOpen, setCustomDatatypeModalOpen] = useState(false);
  const [customDatatypeInput, setCustomDatatypeInput] = useState("");
  const [currentEditingColumn, setCurrentEditingColumn] = useState(null);
  const [customQuery, setCustomQuery] = useState(data.customQuery || "");
  const hostnamev1 = window._env_?.VITE_FAST_API;
  const { token, decodedToken, project } = useAuth();
  const { dispatch, ACTION_TYPES } = useTransformation();

  const connectionDropdownRef = useRef(null);
  const schemaDropdownRef = useRef(null);
  const tableDropdownRef = useRef(null);
  const sourceTypeDropdownRef = useRef(null);
  const fileTypeDropdownRef = useRef(null);


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
    if (sourceType !== "database") return;
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
  }, [hostnamev1, token, sourceType]);

  const fetchTablesAndColumns = useCallback(async (connectionName, schemaName) => {
    if (sourceType !== "database") return;
    if (!connectionName || !schemaName) return;

    try {
      setLoading(prev => ({ ...prev, tables: true }));
      setDataFetchStatus(prev => ({ ...prev, tables: "loading" }));
      setTables([]);

      const response = await fetch(
        `${hostnamev1}/tables/${encodeURIComponent(connectionName)}/${encodeURIComponent(schemaName)}`,
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
  }, [hostnamev1, token, sourceType]);

  const fetchColumns = useCallback(async (connectionName, schemaName, tableName) => {
    if (!connectionName || !schemaName || !tableName) return;
    try {
      const response = await fetch(
        `${hostnamev1}/columns/${encodeURIComponent(connectionName)}/${encodeURIComponent(schemaName)}/${encodeURIComponent(tableName)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.column_json || [];
    } catch (error) {
      console.error("Error fetching columns:", error);
      return [];
    }
  }, [hostnamev1, token]);

  const fetchProcedures = useCallback(async (connectionName) => {
    if (sourceType !== "database") return;
    if (!connectionName) return;

    try {
      setLoading(prev => ({ ...prev, procedures: true }));

      const response = await fetch(`${hostnamev1}/connection-saves/stored-procs/${connectionName}`, {
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
      setProcedures([]);
    } finally {
      setLoading(prev => ({ ...prev, procedures: false }));
    }
  }, [hostnamev1, token, sourceType]);

  const addPreProcedureDropdown = () => {
    const newId = Math.max(...selectedPreProcedures.map(p => p.id), 0) + 1;
    setSelectedPreProcedures(prev => [...prev, { id: newId, procedure: null }]);
  };

  const addPostProcedureDropdown = () => {
    const newId = Math.max(...selectedPostProcedures.map(p => p.id), 0) + 1;
    setSelectedPostProcedures(prev => [...prev, { id: newId, procedure: null }]);
  };

  const removePreProcedureDropdown = (procedureItemId) => {
    if (selectedPreProcedures.length > 1) {
      const procedureToRemove = selectedPreProcedures.find(p => p.id === procedureItemId);

      if (procedureToRemove && procedureToRemove.procedure) {
        dispatch({
          type: ACTION_TYPES.REMOVE_PROCEDURE_EXECUTION,
          payload: {
            sourceNodeId: id,
            procedureItemId: procedureItemId,
            procedureType: "pre"
          }
        });

        const mappingKey = `pre_${procedureItemId}_${procedureToRemove.procedure.procedure_name}`;
        setStoredParameterMappings(prev => {
          const updated = { ...prev };
          delete updated[mappingKey];
          return updated;
        });
      }

      setSelectedPreProcedures(prev => prev.filter(p => p.id !== procedureItemId));
      setPreProcedureDropdownOpen(prev => {
        const updated = { ...prev };
        delete updated[procedureItemId];
        return updated;
      });

      setTimeout(() => {
        setSelectedPreProcedures(prev => {
          const updatedProcedures = prev.map((proc, index) => {
            if (proc.procedure) {
              const procedureOrder = index + 1;
              const procedureJSON = {
                "EventType": "BeforeSourceRead",
                "Dataset": alias || "unnamed_source",
                "ProcName": proc.procedure.procedure_name,
                "ProcParams": [],
                "ProcOrder": procedureOrder,
                "parameterMapping": storedParameterMappings[`pre_${proc.id}_${proc.procedure.procedure_name}`] || {},
                "procedureId": `${proc.procedure.procedure_name}_BeforeSourceRead_${procedureOrder}`,
                "procedureItemId": proc.id,
                "procedureType": "pre",
                "timestamp": Date.now()
              };

              dispatch({
                type: ACTION_TYPES.UPDATE_PROCEDURE_EXECUTION,
                payload: {
                  sourceNodeId: id,
                  procedureMapping: procedureJSON
                }
              });
            }
            return proc;
          });
          return updatedProcedures;
        });
      }, 0);
    }
  };

  const removePostProcedureDropdown = (procedureItemId) => {
    if (selectedPostProcedures.length > 1) {
      const procedureToRemove = selectedPostProcedures.find(p => p.id === procedureItemId);

      if (procedureToRemove && procedureToRemove.procedure) {
        dispatch({
          type: ACTION_TYPES.REMOVE_PROCEDURE_EXECUTION,
          payload: {
            sourceNodeId: id,
            procedureItemId: procedureItemId,
            procedureType: "post"
          }
        });

        const mappingKey = `post_${procedureItemId}_${procedureToRemove.procedure.procedure_name}`;
        setStoredParameterMappings(prev => {
          const updated = { ...prev };
          delete updated[mappingKey];
          return updated;
        });
      }

      setSelectedPostProcedures(prev => prev.filter(p => p.id !== procedureItemId));
      setPostProcedureDropdownOpen(prev => {
        const updated = { ...prev };
        delete updated[procedureItemId];
        return updated;
      });

      setTimeout(() => {
        setSelectedPostProcedures(prev => {
          const updatedProcedures = prev.map((proc, index) => {
            if (proc.procedure) {
              const procedureOrder = index + 1;
              const procedureJSON = {
                "EventType": "AfterSourceRead",
                "Dataset": alias || "unnamed_source",
                "ProcName": proc.procedure.procedure_name,
                "ProcParams": [],
                "ProcOrder": procedureOrder,
                "parameterMapping": storedParameterMappings[`post_${proc.id}_${proc.procedure.procedure_name}`] || {},
                "procedureId": `${proc.procedure.procedure_name}_AfterSourceRead_${procedureOrder}`,
                "procedureItemId": proc.id,
                "procedureType": "post",
                "timestamp": Date.now()
              };

              dispatch({
                type: ACTION_TYPES.UPDATE_PROCEDURE_EXECUTION,
                payload: {
                  sourceNodeId: id,
                  procedureMapping: procedureJSON
                }
              });
            }
            return proc;
          });
          return updatedProcedures;
        });
      }, 0);
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
    if (procedure.procedure_parameter) {
      procedure.procedure_parameter.forEach(param => {
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

  const handleParameterMapping = (parameterName, value) => {
    setParameterColumnMapping(prev => ({
      ...prev,
      [parameterName]: value
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
      "timestamp": Date.now(),
      "isUpdated": true
    };

    dispatch({
      type: ACTION_TYPES.UPDATE_PROCEDURE_EXECUTION,
      payload: {
        sourceNodeId: id,
        procedureMapping: procedureJSON
      }
    });
    closeParametersModal();
  };

  const areAllParametersMapped = () => {
    if (!selectedProcedureForModal?.procedure_parameter) return true;

    return selectedProcedureForModal.procedure_parameter.every(param =>
      parameterColumnMapping[param.name] && parameterColumnMapping[param.name].trim() !== ""
    );
  };

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  useEffect(() => {
    data.setEnableCountLogging = setEnableCountLogging;

    if (sourceType === "file") {
      const fileColumnsFormatted = fileColumns
        .filter(col => col.name.trim() !== "")
        .map(col => ({
          name: col.name,
          datatype: col.datatype === 'custom' ? (col.customDatatype || 'custom') : col.datatype
        }));

      const columnFormat = {};
      fileColumns
        .filter(col => col.name.trim() !== "" && ['date', 'datetime', 'timestamp'].includes(col.datatype))
        .forEach(col => {
          columnFormat[col.name] = col.format || "";
        });

      data.onDataChange({
        sourceType: "file",
        fileType: fileType,
        filePath: filePath,
        fileName: fileName,
        fileColumns: fileColumns,
        columns: fileColumnsFormatted,
        column_format: Object.keys(columnFormat).length > 0 ? [columnFormat] : undefined,
        alias: alias,
        enableCountLogging: enableCountLogging,
      });

      dispatch({
        type: ACTION_TYPES.UPDATE_SELECTED_SOURCE_COLUMNS,
        payload: {
          sourceNodeId: id,
          columns: fileColumnsFormatted.map(col => col.name)
        }
      });

      dispatch({
        type: ACTION_TYPES.SET_ORIGINAL_SOURCE_COLUMNS,
        payload: {
          sourceNodeId: id,
          columns: fileColumnsFormatted
        }
      });

      dispatch({
        type: ACTION_TYPES.SET_ORIGINAL_SOURCE_COLUMN_NAMES,
        payload: {
          sourceNodeId: id,
          columns: fileColumnsFormatted.map(col => col.name)
        }
      });

      dispatch({
        type: ACTION_TYPES.SET_SOURCE_ORIGINAL_COLUMNS,
        payload: {
          sourceNodeId: id,
          columns: fileColumnsFormatted
        }
      });

    } else if (sourceType === "database") {


      if (selectedObjectType === "source-query") {

        const fileColumnsFormatted = fileColumns
          .filter(col => col.name.trim() !== "")
          .map(col => ({
            name: col.name,
            datatype: col.datatype === 'custom' ? (col.customDatatype || 'custom') : col.datatype
          }));

        data.onDataChange({
          sourceType: "database",
          connection: selectedConnection.name,
          connectionId: selectedConnection.id,
          connectionType: selectedConnection.type,
          schema: selectedSchema,
          table: selectedTable,
          columns: fileColumnsFormatted,
          alias: alias,
          objectType: selectedObjectType,
          customQuery: customQuery,
          fileColumns: fileColumns,
          enableCountLogging: enableCountLogging,
        });



        dispatch({
          type: ACTION_TYPES.UPDATE_SELECTED_SOURCE_COLUMNS,
          payload: {
            sourceNodeId: id,
            columns: fileColumnsFormatted.map(col => col.name)
          }
        });

        dispatch({
          type: ACTION_TYPES.SET_ORIGINAL_SOURCE_COLUMNS,
          payload: {
            sourceNodeId: id,
            columns: fileColumnsFormatted
          }
        });

        dispatch({
          type: ACTION_TYPES.SET_ORIGINAL_SOURCE_COLUMN_NAMES,
          payload: {
            sourceNodeId: id,
            columns: fileColumnsFormatted.map(col => col.name)
          }
        });

        dispatch({
          type: ACTION_TYPES.SET_SOURCE_ORIGINAL_COLUMNS,
          payload: {
            sourceNodeId: id,
            columns: fileColumnsFormatted
          }
        });

      } else {

        const currentTable = selectedObjectType === "procedures" && tableSelections.selectedTable
          ? tableSelections.selectedTable
          : selectedTable;

        const currentColumns = selectedObjectType === "procedures" && tableSelections.selectedColumns.length > 0
          ? tableSelections.selectedColumns
          : selectedColumns;

        const enrichedPreProcedures = selectedPreProcedures
          .filter(p => p.procedure)
          .map(p => {
            const mappingKey = `pre_${p.id}_${p.procedure.procedure_name}`;
            const parameterMapping =
              storedParameterMappings[mappingKey] ||
              p.procedure.parameterMapping ||
              p.procedure.originalParameterMapping ||
              {};
            const originalParameterMapping =
              p.procedure.originalParameterMapping ||
              storedParameterMappings[mappingKey] ||
              p.procedure.parameterMapping ||
              {};
            return {
              ...p.procedure,
              parameterMapping,
              originalParameterMapping,
              procedureItemId: p.id,
              procedureType: "pre"
            };
          });

        const enrichedPostProcedures = selectedPostProcedures
          .filter(p => p.procedure)
          .map(p => {
            const mappingKey = `post_${p.id}_${p.procedure.procedure_name}`;
            const parameterMapping =
              storedParameterMappings[mappingKey] ||
              p.procedure.parameterMapping ||
              p.procedure.originalParameterMapping ||
              {};
            const originalParameterMapping =
              p.procedure.originalParameterMapping ||
              storedParameterMappings[mappingKey] ||
              p.procedure.parameterMapping ||
              {};
            return {
              ...p.procedure,
              parameterMapping,
              originalParameterMapping,
              procedureItemId: p.id,
              procedureType: "post"
            };
          });



        data.onDataChange({
          sourceType: "database",
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
          preProcedures: enrichedPreProcedures,
          postProcedures: enrichedPostProcedures,
          enableCountLogging: enableCountLogging,
          customQuery: customQuery,
        });

        dispatch({
          type: ACTION_TYPES.UPDATE_SELECTED_SOURCE_COLUMNS,
          payload: {
            sourceNodeId: id,
            columns: currentColumns.map(col => col.name)
          }
        });

        dispatch({
          type: ACTION_TYPES.SET_ORIGINAL_SOURCE_COLUMNS,
          payload: {
            sourceNodeId: id,
            columns: currentColumns.map(col => ({
              name: col.name,
              datatype: col.datatype
            }))
          }
        });

        dispatch({
          type: ACTION_TYPES.SET_ORIGINAL_SOURCE_COLUMN_NAMES,
          payload: {
            sourceNodeId: id,
            columns: currentColumns.map(col => col.name)
          }
        });

        dispatch({
          type: ACTION_TYPES.SET_SOURCE_ORIGINAL_COLUMNS,
          payload: {
            sourceNodeId: id,
            columns: currentColumns.map(col => ({
              name: col.name,
              datatype: col.datatype
            }))
          }
        });
      }
    }
  }, [sourceType, fileType, filePath, fileName, fileColumns, selectedConnection, selectedSchema, selectedTable, selectedColumns, alias, id, dispatch, ACTION_TYPES, selectedObjectType, tableSelections, selectedPreProcedures, selectedPostProcedures, storedParameterMappings, enableCountLogging, customQuery]);



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

  const filteredColumns = useMemo(() =>
    columns.filter(col =>
      col.column_name?.toLowerCase().includes(columnSearch.toLowerCase())
    ),
    [columns, columnSearch]);

  const filteredPreProcedures = procedures.filter(procedure =>
    procedure.procedure_name?.toLowerCase().includes(preProcedureSearch.toLowerCase())
  );

  const filteredPostProcedures = procedures.filter(procedure =>
    procedure.procedure_name?.toLowerCase().includes(postProcedureSearch.toLowerCase())
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
      if (
        sourceTypeDropdownRef.current &&
        !sourceTypeDropdownRef.current.contains(event.target)
      ) setSourceTypeDropdownOpen(false);
      if (
        fileTypeDropdownRef.current &&
        !fileTypeDropdownRef.current.contains(event.target)
      ) setFileTypeDropdownOpen(false);

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
    if (sourceType === "file") {
      const baseAlias = fileName ? `df_${fileName.replace(/\.[^/.]+$/, "")}` : `unnamed_source_${id}`;
      const sourceNodesFromWindow = window.allNodes ?
        window.allNodes.filter(n => n.type === "source") : [];

      const usedAliases = sourceNodesFromWindow
        .filter(node =>
          node.id !== id &&
          node.data &&
          typeof node.data.alias === "string"
        )
        .map(node => node.data.alias);

      if (!usedAliases.includes(baseAlias)) {
        return baseAlias;
      }

      let suffix = 1;
      let aliasWithSuffix = `${baseAlias}_${suffix}`;
      while (usedAliases.includes(aliasWithSuffix)) {
        suffix += 1;
        aliasWithSuffix = `${baseAlias}_${suffix}`;
      }
      return aliasWithSuffix;
    }

    if (sourceType === "database" && selectedObjectType === "source-query") {
      const baseAlias = `unnamed_source_${id}`;
      const sourceNodesFromWindow = window.allNodes ?
        window.allNodes.filter(n => n.type === "source") : [];

      const usedAliases = sourceNodesFromWindow
        .filter(node =>
          node.id !== id &&
          node.data &&
          typeof node.data.alias === "string"
        )
        .map(node => node.data.alias);

      if (!usedAliases.includes(baseAlias)) {
        return baseAlias;
      }

      let suffix = 1;
      let aliasWithSuffix = `${baseAlias}_${suffix}`;
      while (usedAliases.includes(aliasWithSuffix)) {
        suffix += 1;
        aliasWithSuffix = `${baseAlias}_${suffix}`;
      }
      return aliasWithSuffix;
    }

    if (!selectedTable) return "";

    const baseAlias = `df_${selectedTable}`;
    const sourceNodesFromWindow = window.allNodes ?
      window.allNodes.filter(n => n.type === "source") : [];

    const usedAliases = sourceNodesFromWindow
      .filter(node =>
        node.id !== id &&
        node.data &&
        node.data.table === selectedTable &&
        typeof node.data.alias === "string"
      )
      .map(node => node.data.alias);

    if (!usedAliases.includes(baseAlias)) {
      return baseAlias;
    }

    let suffix = 1;
    let aliasWithSuffix = `${baseAlias}_${suffix}`;
    while (usedAliases.includes(aliasWithSuffix)) {
      suffix += 1;
      aliasWithSuffix = `${baseAlias}_${suffix}`;
    }
    return aliasWithSuffix;
  }, [id, selectedTable, sourceType, fileName, selectedObjectType]);

  const lastAliasTableRef = useRef(data.table || "");

  useEffect(() => {
    if (sourceType === "database" && selectedObjectType !== "source-query" && selectedTable) {
      if (!alias || (lastAliasTableRef.current && lastAliasTableRef.current !== selectedTable)) {
        setAlias(getNextAlias());
        lastAliasTableRef.current = selectedTable;
      }
    } else if (sourceType === "database" && selectedObjectType === "source-query") {
      if (!alias) {
        setAlias(getNextAlias());
      }
    } else if (sourceType === "file") {
      if (!alias) {
        setAlias(getNextAlias());
      }
    }
  }, [selectedTable, alias, getNextAlias, sourceType, selectedObjectType]);

  const handleObjectTypeChange = useCallback((newObjectType) => {
    if (newObjectType === selectedObjectType) return;
    if (newObjectType === "source-query") {
      if (selectedObjectType === "tables") {
        setTableSelections({
          selectedTable: selectedTable,
          selectedColumns: selectedColumns,
        });
      } else if (selectedObjectType === "procedures") {
        setProcedureSelections({
          selectedProcedure: selectedTable,
          selectedParameters: selectedColumns,
        });
      }
      setSelectedColumns([]);
    }

    if (selectedObjectType === "procedures" && newObjectType === "tables") {
      setProcedureSelections({
        selectedProcedure: selectedTable,
        selectedParameters: selectedColumns
      });

      setSelectedTable(tableSelections.selectedTable);
      setSelectedColumns(tableSelections.selectedColumns);
    } else if (selectedObjectType === "tables" && newObjectType === "procedures") {
      setTableSelections({
        selectedTable: selectedTable,
        selectedColumns: selectedColumns
      });

      if (selectedConnection.name && procedures.length === 0) {
        fetchProcedures(selectedConnection.name);
      }

      setSelectedTable(procedureSelections.selectedProcedure);
      setSelectedColumns(procedureSelections.selectedParameters);
    }

    setSelectedObjectType(newObjectType);
  }, [selectedObjectType, selectedTable, selectedColumns, tableSelections, procedureSelections, selectedConnection.name, procedures.length, fetchProcedures]);

  useEffect(() => {
    let hasUpdated = false;

    if (data.sourceType && !sourceType) {
      setSourceType(data.sourceType);
      hasUpdated = true;
    }

    if (data.sourceType === "file") {
      if (data.fileType && !fileType) {
        setFileType(data.fileType);
        hasUpdated = true;
      }
      if (data.filePath && !filePath) {
        setFilePath(data.filePath);
        hasUpdated = true;
      }
      if (data.fileName && !fileName) {
        setFileName(data.fileName);
        hasUpdated = true;
      }
      if (data.fileColumns && Array.isArray(data.fileColumns) && fileColumns.length === 1 && !fileColumns[0].name) {
        const restoredColumns = data.fileColumns.map(col => ({
          ...col,
          customDatatype: col.customDatatype || ""
        }));
        setFileColumns(restoredColumns);
        hasUpdated = true;
      }
    }

    if (data.sourceType === "database" || (!data.sourceType && (data.connection || data.schema || data.table))) {
      if (!sourceType) {
        setSourceType("database");
        hasUpdated = true;
      }

      if (data.connection && data.connectionId && data.connectionType && !selectedConnection.name) {
        setSelectedConnection({
          name: data.connection,
          id: data.connectionId,
          type: data.connectionType
        });
        hasUpdated = true;

        if (schemas.length === 0) {
          fetchSchemas(data.connection);
        }
      }

      if (data.schema && !selectedSchema) {
        setSelectedSchema(data.schema);
        hasUpdated = true;

        if (data.connection && tables.length === 0) {
          fetchTablesAndColumns(data.connection, data.schema);
        }
      }

      if (data.table && !selectedTable) {
        setSelectedTable(data.table);
        hasUpdated = true;

        if (data.connection && data.schema && !hasFetchedColumns.current) {
          hasFetchedColumns.current = true;
          fetchColumns(data.connection, data.schema, data.table).then(cols => {
            if (cols.length > 0) setColumns(cols);
          });
        }
      }

      if (data.columns && Array.isArray(data.columns) && selectedColumns.length === 0) {
        setSelectedColumns(data.columns);
        hasUpdated = true;
      }


      if (data.objectType && (!selectedObjectType || selectedObjectType === "")) {
        setSelectedObjectType(data.objectType);
        hasUpdated = true;

        if (data.objectType === "procedures" && data.connection && procedures.length === 0) {
          fetchProcedures(data.connection);
        }
      } else if (!selectedObjectType && !data.objectType) {
        if (data.table && !data.preProcedures && !data.postProcedures) {
          setSelectedObjectType("tables");
          hasUpdated = true;
        } else if ((data.preProcedures && data.preProcedures.length > 0) || (data.postProcedures && data.postProcedures.length > 0)) {
          setSelectedObjectType("procedures");
          hasUpdated = true;
        } else if (!selectedObjectType) {
          setSelectedObjectType("tables");
          hasUpdated = true;
        }
      }

      if (data.preProcedures && Array.isArray(data.preProcedures) && data.preProcedures.length > 0 && selectedPreProcedures.length === 1 && !selectedPreProcedures[0].procedure) {
        const restoredPreProcedures = data.preProcedures.map((proc, index) => ({
          id: index + 1,
          procedure: proc,
        }));

        setSelectedPreProcedures(restoredPreProcedures);
        hasUpdated = true;
      }

      if (data.postProcedures && Array.isArray(data.postProcedures) && data.postProcedures.length > 0 && selectedPostProcedures.length === 1 && !selectedPostProcedures[0].procedure) {
        const restoredPostProcedures = data.postProcedures.map((proc, index) => ({
          id: index + 1,
          procedure: proc
        }));
        setSelectedPostProcedures(restoredPostProcedures);
        hasUpdated = true;
      }

      if (data.objectType === "procedures" && data.table && !tableSelections.selectedTable) {
        setTableSelections({
          selectedTable: data.table,
          selectedColumns: data.columns || []
        });
        hasUpdated = true;
      }
    }

    if (data.alias && !alias) {
      setAlias(data.alias);
      hasUpdated = true;
    }

    if (
      typeof data.enableCountLogging === 'boolean' &&
      !hasRestoredEnableCountLogging.current
    ) {
      setEnableCountLogging(data.enableCountLogging);
      hasRestoredEnableCountLogging.current = true;
      hasUpdated = true;
    }

  }, [
    data.sourceType,
    data.fileType,
    data.filePath,
    data.fileName,
    data.fileColumns,
    data.connection,
    data.connectionId,
    data.connectionType,
    data.schema,
    data.table,
    data.alias,
    data.objectType,
    data.enableCountLogging
  ]);

  const hasInitializedSelectedColumns = useRef(false);
  const hasFetchedColumns = useRef(false);

  useEffect(() => {
    if (
      data.table &&
      data.columns &&
      selectedTable === data.table &&
      !hasInitializedSelectedColumns.current
    ) {
      if (data.columns.length > 0) {
        setSelectedColumns(data.columns);

        if (selectedObjectType === "tables") {
          setTableSelections(prev => ({
            ...prev,
            selectedTable: data.table,
            selectedColumns: data.columns
          }));
        }
      }

      hasInitializedSelectedColumns.current = true;
    }
  }, [data.table, data.columns, selectedTable, selectedObjectType]);


  useEffect(() => {
    if (selectedObjectType === "procedures" && procedures.length > 0 && data.preProcedures) {
      if (selectedPreProcedures.length === 1 && !selectedPreProcedures[0].procedure && data.preProcedures.length > 0) {
        const restoredPreProcedures = data.preProcedures.map((procData, index) => {
          const foundProcedure = procedures.find(p => p.procedure_name === procData.procedure_name);
          return {
            id: index + 1,
            procedure: foundProcedure || procData
          };
        });
        setSelectedPreProcedures(restoredPreProcedures);

        const restoredPreMappings = {};
        data.preProcedures.forEach((procData, index) => {
          if (procData.parameterMapping && Object.keys(procData.parameterMapping).length > 0) {
            const mappingKey = `pre_${index + 1}_${procData.procedure_name}`;
            restoredPreMappings[mappingKey] = procData.parameterMapping;
          }
        });

        setStoredParameterMappings(prev => ({
          ...prev,
          ...restoredPreMappings
        }));

        data.preProcedures.forEach((procData, index) => {
          const procedureOrder = index + 1;
          const mappedParams = procData.parameterMapping
            ? Object.entries(procData.parameterMapping)
              .filter(([param, value]) => value !== "")
              .map(([param, value]) => value)
            : [];

          const procedureJSON = {
            "EventType": "BeforeSourceRead",
            "Dataset": alias || "unnamed_source",
            "ProcName": procData.procedure_name,
            "ProcParams": mappedParams,
            "ProcOrder": procedureOrder,
            "parameterMapping": procData.parameterMapping || {},
            "procedureId": `${procData.procedure_name}_BeforeSourceRead_${procedureOrder}`,
            "procedureItemId": index + 1,
            "procedureType": "pre",
            "timestamp": Date.now(),
            "isRestored": true
          };

          dispatch({
            type: ACTION_TYPES.UPDATE_PROCEDURE_EXECUTION,
            payload: {
              sourceNodeId: id,
              procedureMapping: procedureJSON
            }
          });
        });
      }
    }

    if (selectedObjectType === "procedures" && procedures.length > 0 && data.postProcedures) {
      if (selectedPostProcedures.length === 1 && !selectedPostProcedures[0].procedure && data.postProcedures.length > 0) {
        const restoredPostProcedures = data.postProcedures.map((procData, index) => {
          const foundProcedure = procedures.find(p => p.procedure_name === procData.procedure_name);
          return {
            id: index + 1,
            procedure: foundProcedure || procData
          };
        });
        setSelectedPostProcedures(restoredPostProcedures);

        const restoredPostMappings = {};
        data.postProcedures.forEach((procData, index) => {
          if (procData.parameterMapping && Object.keys(procData.parameterMapping).length > 0) {
            const mappingKey = `post_${index + 1}_${procData.procedure_name}`;
            restoredPostMappings[mappingKey] = procData.parameterMapping;
          }
        });

        setStoredParameterMappings(prev => ({
          ...prev,
          ...restoredPostMappings
        }));

        data.postProcedures.forEach((procData, index) => {
          const procedureOrder = index + 1;
          const mappedParams = procData.parameterMapping
            ? Object.entries(procData.parameterMapping)
              .filter(([param, value]) => value !== "")
              .map(([param, value]) => value)
            : [];

          const procedureJSON = {
            "EventType": "AfterSourceRead",
            "Dataset": alias || "unnamed_source",
            "ProcName": procData.procedure_name,
            "ProcParams": mappedParams,
            "ProcOrder": procedureOrder,
            "parameterMapping": procData.parameterMapping || {},
            "procedureId": `${procData.procedure_name}_AfterSourceRead_${procedureOrder}`,
            "procedureItemId": index + 1,
            "procedureType": "post",
            "timestamp": Date.now(),
            "isRestored": true
          };

          dispatch({
            type: ACTION_TYPES.UPDATE_PROCEDURE_EXECUTION,
            payload: {
              sourceNodeId: id,
              procedureMapping: procedureJSON
            }
          });
        });
      }
    }
  }, [procedures, selectedObjectType, data.preProcedures, data.postProcedures, dispatch, ACTION_TYPES, id, alias]);

  useEffect(() => {
    if (data.preProcedures && Array.isArray(data.preProcedures) && data.preProcedures.length > 0) {
      const initialPreMappings = {};
      data.preProcedures.forEach((procData, index) => {
        if (procData.parameterMapping && Object.keys(procData.parameterMapping).length > 0) {
          const mappingKey = `pre_${index + 1}_${procData.procedure_name}`;
          initialPreMappings[mappingKey] = procData.parameterMapping;
        }
      });

      if (Object.keys(initialPreMappings).length > 0) {
        setStoredParameterMappings(prev => ({
          ...prev,
          ...initialPreMappings
        }));
      }

      data.preProcedures.forEach((procData, index) => {
        const procedureOrder = index + 1;
        const mappedParams = procData.parameterMapping
          ? Object.entries(procData.parameterMapping)
            .filter(([param, value]) => value !== "")
            .map(([param, value]) => value)
          : [];

        const procedureJSON = {
          "EventType": "BeforeSourceRead",
          "Dataset": alias || "unnamed_source",
          "ProcName": procData.procedure_name,
          "ProcParams": mappedParams,
          "ProcOrder": procedureOrder,
          "parameterMapping": procData.parameterMapping || {},
          "procedureId": `${procData.procedure_name}_BeforeSourceRead_${procedureOrder}`,
          "procedureItemId": index + 1,
          "procedureType": "pre",
          "timestamp": Date.now(),
          "isRestored": true
        };

        dispatch({
          type: ACTION_TYPES.UPDATE_PROCEDURE_EXECUTION,
          payload: {
            sourceNodeId: id,
            procedureMapping: procedureJSON
          }
        });
      });
    }

    if (data.postProcedures && Array.isArray(data.postProcedures) && data.postProcedures.length > 0) {
      const initialPostMappings = {};
      data.postProcedures.forEach((procData, index) => {
        if (procData.parameterMapping && Object.keys(procData.parameterMapping).length > 0) {
          const mappingKey = `post_${index + 1}_${procData.procedure_name}`;
          initialPostMappings[mappingKey] = procData.parameterMapping;
        }
      });

      if (Object.keys(initialPostMappings).length > 0) {
        setStoredParameterMappings(prev => ({
          ...prev,
          ...initialPostMappings
        }));
      }

      data.postProcedures.forEach((procData, index) => {
        const procedureOrder = index + 1;
        const mappedParams = procData.parameterMapping
          ? Object.entries(procData.parameterMapping)
            .filter(([param, value]) => value !== "")
            .map(([param, value]) => value)
          : [];

        const procedureJSON = {
          "EventType": "AfterSourceRead",
          "Dataset": alias || "unnamed_source",
          "ProcName": procData.procedure_name,
          "ProcParams": mappedParams,
          "ProcOrder": procedureOrder,
          "parameterMapping": procData.parameterMapping || {},
          "procedureId": `${procData.procedure_name}_AfterSourceRead_${procedureOrder}`,
          "procedureItemId": index + 1,
          "procedureType": "post",
          "timestamp": Date.now(),
          "isRestored": true
        };

        dispatch({
          type: ACTION_TYPES.UPDATE_PROCEDURE_EXECUTION,
          payload: {
            sourceNodeId: id,
            procedureMapping: procedureJSON
          }
        });
      });
    }
  }, [data.preProcedures, data.postProcedures, dispatch, ACTION_TYPES, id, alias]);

  const addFileColumn = () => {
    const newId = Math.max(...fileColumns.map(col => col.id), 0) + 1;
    setFileColumns(prev => [...prev, { id: newId, name: "", datatype: "string", customDatatype: "" }]);
  };

  const removeFileColumn = (columnId) => {
    if (fileColumns.length > 1) {
      setFileColumns(prev => prev.filter(col => col.id !== columnId));
    }
  };

  const updateFileColumn = (columnId, field, value) => {
    setFileColumns(prev =>
      prev.map(col => {
        if (col.id === columnId) {
          if (field === 'datatype' && value === 'custom') {
            setCurrentEditingColumn(columnId);
            setCustomDatatypeInput(col.customDatatype || "");
            setCustomDatatypeModalOpen(true);
            return col;
          }
          if (field === 'datatype' && value !== 'custom') {
            return { ...col, [field]: value, customDatatype: '' };
          }
          return { ...col, [field]: value };
        }
        return col;
      })
    );
  };

  const handleCustomDatatypeSave = () => {
    if (customDatatypeInput.trim() === "") return;

    setFileColumns(prev =>
      prev.map(col => {
        if (col.id === currentEditingColumn) {
          return {
            ...col,
            datatype: 'custom',
            customDatatype: customDatatypeInput.trim()
          };
        }
        return col;
      })
    );

    setCustomDatatypeModalOpen(false);
    setCustomDatatypeInput("");
    setCurrentEditingColumn(null);
  };

  const handleCustomDatatypeCancel = () => {
    setCustomDatatypeModalOpen(false);
    setCustomDatatypeInput("");
    setCurrentEditingColumn(null);
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-md border-2 border-[#8E77BB] min-w-[320px] max-w-[320px] relative group">
      <button
        onClick={() => window.deleteNode?.(id)}
        className="absolute top-1.5 right-2 p-1"
      >
        <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
      </button>

      <Handle type="target" position={Position.Left} style={{ width: 10, height: 10 }} />
      <Handle type="source" position={Position.Right} style={{ width: 10, height: 10 }} />

      <div className="flex items-center space-x-3 mb-3">
        <Database className="w-5 h-5 text-[#8E77BB]" />
        <h3 className="text-black font-medium">Source</h3>
      </div>

      <div className="space-y-3">
        {/* Source Type Selection */}
        <div>
          <label className="text-xs font-semibold text-black mb-0.5 block">
            Source Type
          </label>
          <div className="relative" ref={sourceTypeDropdownRef}>
            <button
              type="button"
              className="w-full p-1.5 text-[11px] bg-white rounded-sm border border-gray-300 text-gray-800 text-left flex justify-between items-center focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 pr-8"
              onClick={() => setSourceTypeDropdownOpen(v => !v)}
            >
              {sourceType === "database" ? "Database" : sourceType === "file" ? "File" : "Select source type"}
              <span className="ml-auto pl-2">&#9662;</span>
            </button>

            {sourceTypeDropdownOpen && (
              <div className="absolute z-10 left-0 right-0 bg-white border border-gray-300 rounded shadow mt-1">
                <div
                  className={`p-2 text-[11px] text-black cursor-pointer hover:bg-gray-100 ${sourceType === "database" ? "bg-gray-100" : ""}`}
                  onClick={() => {
                    setSourceType("database");
                    setSourceTypeDropdownOpen(false);

                    // Reset file-specific states when switching to database
                    setFileType("CSV");
                    setFilePath("");
                    setFileName("");
                    setFileColumns([{ id: 1, name: "", datatype: "string", customDatatype: "" }]);
                  }}
                >
                  Database
                </div>

                <div
                  className={`p-2 text-[11px] text-black cursor-pointer hover:bg-gray-100 ${sourceType === "file" ? "bg-gray-100" : ""}`}
                  onClick={() => {
                    setSourceType("file");
                    setSourceTypeDropdownOpen(false);
                    setSelectedConnection({ name: "", id: "", type: "" });
                    setSelectedSchema("");
                    setSelectedTable("");
                    setSelectedColumns([]);
                    setSelectedObjectType("");

                    setSchemas([]);
                    setTables([]);
                    setColumns([]);
                    setProcedures([]);

                    setConnectionDropdownOpen(false);
                    setSchemaDropdownOpen(false);
                    setTableDropdownOpen(false);

                    setConnectionSearch("");
                    setSchemaSearch("");
                    setTableSearch("");
                    setColumnSearch("");
                  }}
                >
                  File
                </div>
              </div>
            )}
          </div>
        </div>

        {sourceType === "database" && (
          <SourceDatabaseType
            selectedConnection={selectedConnection}
            setSelectedConnection={setSelectedConnection}
            selectedSchema={selectedSchema}
            setSelectedSchema={setSelectedSchema}
            selectedTable={selectedTable}
            setSelectedTable={setSelectedTable}
            selectedColumns={selectedColumns}
            setSelectedColumns={setSelectedColumns}
            selectedObjectType={selectedObjectType}
            setSelectedObjectType={setSelectedObjectType}
            tableSelections={tableSelections}
            setTableSelections={setTableSelections}
            procedureSelections={procedureSelections}
            setProcedureSelections={setProcedureSelections}
            selectedPreProcedures={selectedPreProcedures}
            setSelectedPreProcedures={setSelectedPreProcedures}
            selectedPostProcedures={selectedPostProcedures}
            setSelectedPostProcedures={setSelectedPostProcedures}
            preProcedureDropdownOpen={preProcedureDropdownOpen}
            setPreProcedureDropdownOpen={setPreProcedureDropdownOpen}
            postProcedureDropdownOpen={postProcedureDropdownOpen}
            setPostProcedureDropdownOpen={setPostProcedureDropdownOpen}
            parametersModalOpen={parametersModalOpen}
            setParametersModalOpen={setParametersModalOpen}
            selectedProcedureForModal={selectedProcedureForModal}
            setSelectedProcedureForModal={setSelectedProcedureForModal}
            parameterColumnMapping={parameterColumnMapping}
            setParameterColumnMapping={setParameterColumnMapping}
            modalProcedureType={modalProcedureType}
            setModalProcedureType={setModalProcedureType}
            modalProcedureItemId={modalProcedureItemId}
            setModalProcedureItemId={setModalProcedureItemId}
            storedParameterMappings={storedParameterMappings}
            setStoredParameterMappings={setStoredParameterMappings}
            preProcedureSearch={preProcedureSearch}
            setPreProcedureSearch={setPreProcedureSearch}
            postProcedureSearch={postProcedureSearch}
            setPostProcedureSearch={setPostProcedureSearch}
            enableCountLogging={enableCountLogging}
            setEnableCountLogging={setEnableCountLogging}
            customQuery={customQuery}
            setCustomQuery={setCustomQuery}
            fileColumns={fileColumns}
            setFileColumns={setFileColumns}
            alias={alias}
            setAlias={setAlias}
            connections={connections}
            schemas={schemas}
            tables={tables}
            columns={columns}
            procedures={procedures}
            loading={loading}
            dataFetchStatus={dataFetchStatus}
            connectionSearch={connectionSearch}
            setConnectionSearch={setConnectionSearch}
            schemaSearch={schemaSearch}
            setSchemaSearch={setSchemaSearch}
            tableSearch={tableSearch}
            setTableSearch={setTableSearch}
            columnSearch={columnSearch}
            setColumnSearch={setColumnSearch}
            connectionDropdownOpen={connectionDropdownOpen}
            setConnectionDropdownOpen={setConnectionDropdownOpen}
            schemaDropdownOpen={schemaDropdownOpen}
            setSchemaDropdownOpen={setSchemaDropdownOpen}
            tableDropdownOpen={tableDropdownOpen}
            setTableDropdownOpen={setTableDropdownOpen}
            filteredConnections={filteredConnections}
            filteredSchemas={filteredSchemas}
            filteredTables={filteredTables}
            filteredColumns={filteredColumns}
            filteredPreProcedures={filteredPreProcedures}
            filteredPostProcedures={filteredPostProcedures}
            fetchSchemas={fetchSchemas}
            fetchTablesAndColumns={fetchTablesAndColumns}
            fetchColumns={fetchColumns}
            fetchProcedures={fetchProcedures}
            handleObjectTypeChange={handleObjectTypeChange}
            addPreProcedureDropdown={addPreProcedureDropdown}
            addPostProcedureDropdown={addPostProcedureDropdown}
            removePreProcedureDropdown={removePreProcedureDropdown}
            removePostProcedureDropdown={removePostProcedureDropdown}
            handlePreProcedureSelect={handlePreProcedureSelect}
            handlePostProcedureSelect={handlePostProcedureSelect}
            openParametersModal={openParametersModal}
            closeParametersModal={closeParametersModal}
            handleParameterMapping={handleParameterMapping}
            applyProcedureMapping={applyProcedureMapping}
            areAllParametersMapped={areAllParametersMapped}
            addFileColumn={addFileColumn}
            removeFileColumn={removeFileColumn}
            updateFileColumn={updateFileColumn}
            id={id}
            data={data}
            dispatch={dispatch}
            ACTION_TYPES={ACTION_TYPES}
            hostnamev1={hostnamev1}
            token={token}
            decodedToken={decodedToken}
            project={project}
            setColumns={setColumns}
            setLoading={setLoading}
            setDataFetchStatus={setDataFetchStatus}
            setProcedures={setProcedures}

          />
        )}

        {sourceType === "file" && (
          <SourceFileType
            fileType={fileType}
            setFileType={setFileType}
            filePath={filePath}
            setFilePath={setFilePath}
            fileName={fileName}
            setFileName={setFileName}
            fileColumns={fileColumns}
            setFileColumns={setFileColumns}
            alias={alias}
            setAlias={setAlias}
            enableCountLogging={enableCountLogging}
            setEnableCountLogging={setEnableCountLogging}
            fileTypeDropdownOpen={fileTypeDropdownOpen}
            setFileTypeDropdownOpen={setFileTypeDropdownOpen}
            fileTypeDropdownRef={fileTypeDropdownRef}
            addFileColumn={addFileColumn}
            removeFileColumn={removeFileColumn}
            updateFileColumn={updateFileColumn}
            id={id}
            data={data}
            dispatch={dispatch}
            ACTION_TYPES={ACTION_TYPES}
          />
        )}

        {sourceType === "database" && selectedConnection.type && (
          <div className="mt-3 pt-2 border-t border-gray-200">
            <span className="text-[10px] text-gray-500">
              Connection Type: <span className="font-semibold text-[#8E77BB]">{selectedConnection.type}</span>
            </span>
          </div>
        )}

        {sourceType === "file" && (
          <div className="mt-3 pt-2 border-t border-gray-200">
            <span className="text-[10px] text-gray-500">
              Source Type: <span className="font-semibold text-[#8E77BB]">File ({fileType})</span>
            </span>
          </div>
        )}

        {customDatatypeModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-lg p-4 w-[400px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-black">
                  Custom Datatype
                </h3>
                <button
                  onClick={handleCustomDatatypeCancel}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-black mb-1 block">
                    Enter custom datatype name:
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 text-sm bg-white rounded border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
                    value={customDatatypeInput}
                    onChange={(e) => setCustomDatatypeInput(e.target.value)}
                    placeholder="e.g., varchar(255), decimal(10,2), etc."
                    autoFocus
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={handleCustomDatatypeCancel}
                  className="px-3 py-1.5 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCustomDatatypeSave}
                  className={`px-3 py-1.5 text-sm rounded focus:outline-none focus:ring-2 ${customDatatypeInput.trim() !== ""
                    ? "bg-[#8E77BB] text-white hover:bg-[#7A6BA3] focus:ring-[#8E77BB]"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  disabled={customDatatypeInput.trim() === ""}
                >
                  Save
                </button>
              </div>
            </div>
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

              {selectedProcedureForModal.procedure_parameter && selectedProcedureForModal.procedure_parameter.length > 0 ? (
                <div className="space-y-2">
                  {selectedProcedureForModal.procedure_parameter.map((param, index) => {
                    const isNumericParam = isNumericType(param.data_type);
                    const isStringParam = isStringType(param.data_type);

                    return (
                      <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded border">
                        <div className="w-1/3">
                          <p className="text-sm font-medium text-black">{param.name}</p>
                          <p className="text-xs text-gray-500">{param.data_type}</p>
                        </div>

                        <div className="flex-1">
                          {isNumericParam ? (
                            <input
                              type="number"
                              value={parameterColumnMapping[param.name] || ""}
                              onChange={(e) => handleParameterMapping(param.name, e.target.value)}
                              placeholder="Enter numeric value"
                              className="w-full p-2 text-sm bg-white rounded border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
                            />
                          ) : isStringParam ? (
                            <input
                              type="text"
                              value={parameterColumnMapping[param.name] || ""}
                              onChange={(e) => handleParameterMapping(param.name, e.target.value)}
                              placeholder="Enter text value"
                              className="w-full p-2 text-sm bg-white rounded border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
                            />
                          ) : (
                            <input
                              type="text"
                              value={parameterColumnMapping[param.name] || ""}
                              onChange={(e) => handleParameterMapping(param.name, e.target.value)}
                              placeholder="Enter value"
                              className="w-full p-2 text-sm bg-white rounded border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-500">No parameters found for this procedure.</p>
                  <p className="text-xs text-gray-400 mt-2">You can still apply the mapping to execute the procedure without parameters.</p>
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
                  className={`px-3 py-1.5 text-sm rounded focus:outline-none focus:ring-2 ${areAllParametersMapped()
                    ? "bg-[#8E77BB] text-white hover:bg-[#7A6BA3] focus:ring-[#8E77BB]"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  disabled={!areAllParametersMapped()}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

