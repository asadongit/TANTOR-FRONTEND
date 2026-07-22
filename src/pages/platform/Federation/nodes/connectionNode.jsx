/*eslint-disable*/
import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { Handle, Position, useUpdateNodeInternals } from "reactflow";
import { Cable, X, ChevronDown, ChevronUp, Pencil, FileCode, Search, Loader2, RefreshCw } from "lucide-react";
import { useStateContext } from "../context/contextViewProvider";
import { Columns } from "../BusinessView/Columns";
import { Modal } from "@mui/material";
import ComplexQueryEditor from "../components/ComplexQueryEditor";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import { secureQuery } from '../../../datagovernance/DataCatalogue/Components/function.js';
import { useToast } from "../context/ToastContext";
import { useFederationPolicyIds, useFederationConnectionsBaseNodes, useFederationSchemas, useFederationTables, useFederationColumns } from "../../../../hooks/platform/federation";


const SearchableSelect = ({ id, openDropdownId, setOpenDropdownId, options, value, onChange, placeholder, disabled = false, isLoading = false }) => {
  const isOpen = openDropdownId === id;
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpenDropdownId(null);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isLoading) {
      setOpenDropdownId((prev) => (prev === id ? null : id));
      if (openDropdownId !== id) setSearchTerm("");
    }
  };

  const handleOptionClick = (option) => {
    onChange({ target: { value: option } });
    setOpenDropdownId(null);
    setSearchTerm("");
  };

  return (
    <div ref={containerRef} className="relative w-full text-black">
      <div
        className={`w-full px-3 py-2 border-2 rounded-lg text-gray-500 hover:bg-gray-50 cursor-pointer flex justify-between items-center ${disabled || isLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        onClick={handleSelectClick}
      >
        <span>{value || placeholder}</span>
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isOpen ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </div>
      {isOpen && !disabled && !isLoading && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                className="w-full p-2 pl-8 border rounded-md"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-2 text-gray-500">No options available</div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleOptionClick(option)}
                >
                  {option}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export function ConnectionNode({ id, data, onSave }) {
  const { showToast } = useToast();
  const { token, hostnameV1 } = useAuth();
  const { handleConnectionPayload, connectionPayload, setColumnSettings, columnSettings, complexCheck, finalPayload, handleFinalPayload, incrementNodeCount, decrementNodeCount, setNodes, notifyComplexQuerySaved, setHideBusinessPreview } = useStateContext("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [connections, setConnections] = useState([]);
  const [selectedConnection, setSelectedConnection] = useState(data?.selectedConnection || "");
  const [selectedConnection, setSelectedConnection] = useState(data?.selectedConnection || "");
  const [schemas, setSchemas] = useState([]);
  const [selectedSchema, setSelectedSchema] = useState(data?.selectedSchema || "");
  const [selectedSchema, setSelectedSchema] = useState(data?.selectedSchema || "");
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(data?.selectedTable || "");
  const [selectedTable, setSelectedTable] = useState(data?.selectedTable || "");
  const [columns, setColumns] = useState([]);
  const [allowedColumns, setAllowedColumns] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState(data?.selectedColumns || []);
  const [selectedColumns, setSelectedColumns] = useState(data?.selectedColumns || []);
  const [selectedColumn, setSelectedColumn] = useState("");
  const [columnData, setColumnData] = useState([]);
    const [previousColId, setPreviousColId] = useState("");
    const [colId, setColId] = useState(data?._isRestoring && data?.selectedConnection && data?.selectedSchema && data?.selectedTable ? `${data.selectedConnection}_${data.selectedSchema}_${data.selectedTable}` : "");
  const [selectedColumnsOrder, setSelectedColumnsOrder] = useState([]);
  const hasIncrementedRef = useRef(false);

  const [columnSearchTerm, setColumnSearchTerm] = useState("");

  const locationState = useLocation().state;
  const resolvedQueryType = (() => {
    if (locationState?.queryType) return locationState.queryType;
    const editPayloadStr = sessionStorage.getItem("editOriginalPayload");
    if (editPayloadStr) {
      try {
        const p = JSON.parse(editPayloadStr);
        const cq = p?.extra_info?.complex_query ?? p?.complex_query;
        if (cq) return "Complex";
      } catch (_) {}
    }
    const createQueryType = sessionStorage.getItem("createQueryType");
    if (createQueryType) return createQueryType;
    return "Regular";
  })();
  const modalState = { ...(locationState || {}), queryType: resolvedQueryType };

  useEffect(() => {
    handleFinalPayload((prevData) => ({
      ...prevData,
      view_type: "Integrated View",
    }));
  }, []);

  useEffect(() => {
    if (!hasIncrementedRef.current) {
      incrementNodeCount('connection');
      hasIncrementedRef.current = true;
    }
  }, []);

  const hasRestoredPayloadRef = useRef(false);
  useEffect(() => {
    if (data?._isRestoring && !hasRestoredPayloadRef.current && allowedColumns?.length > 0 && selectedConnection && selectedSchema && selectedTable) {
      const filteredColumns = allowedColumns
        .filter((col) => columns.some((c) => c?.column?.toLowerCase() === col?.column_name?.toLowerCase()))
        .map((col) => ({
          column: col.column_name,
          datatype: columns.find((c) => c?.column?.toLowerCase() === col?.column_name?.toLowerCase())?.datatype || "unknown",
        }));

      const newPayload = {
        id, type: "Connection", view: colId, selectedConnection, selectedSchema, selectedTable,
        selectedColumns, def: `Select * from ${selectedConnection}.${selectedSchema}.${selectedTable}`,
        Columns: filteredColumns,
      };

      handleConnectionPayload((prev) => {
        if (prev && prev.some((p) => p.id === id)) return prev;
        return [...(prev || []), newPayload];
      });

      hasRestoredPayloadRef.current = true;
    }
  }, [data?._isRestoring, allowedColumns, columns, colId, selectedConnection, selectedSchema, selectedTable, selectedColumns]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const { isFetching: isFetchingPolicies, refetch: refetchPolicyIds } = useFederationPolicyIds();
  const { data: apiConnectionsRaw, isFetching: isLoadingConnections, refetch: refetchConnections } = useFederationConnectionsBaseNodes();
  const { data: apiSchemasRaw, isFetching: isLoadingSchemas, refetch: refetchSchemas } = useFederationSchemas(selectedConnection);
  const { data: apiTablesRaw, isFetching: isLoadingTables, refetch: refetchTables } = useFederationTables(selectedConnection, selectedSchema);
  const { data: apiColumnsRaw, isFetching: isLoadingColumns, refetch: refetchColumns } = useFederationColumns(selectedConnection, selectedSchema, selectedTable);

  const handleRefresh = async (e) => {
    e.stopPropagation();
    setIsRefreshing(true);
    try {
      await refetchPolicyIds();
      const promises = [refetchConnections()];
      if (selectedConnection) promises.push(refetchSchemas());
      if (selectedSchema) promises.push(refetchTables());
      if (selectedTable) promises.push(refetchColumns());
      await Promise.all(promises);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (apiConnectionsRaw) setConnections(apiConnectionsRaw);
  }, [apiConnectionsRaw]);

  useEffect(() => {
    if (apiSchemasRaw) setSchemas(apiSchemasRaw);
  }, [apiSchemasRaw]);

  useEffect(() => {
    if (apiTablesRaw) setTables(apiTablesRaw);
  }, [apiTablesRaw]);

  useEffect(() => {
    if (apiColumnsRaw) {
      const processedCols = apiColumnsRaw.map(c => ({ column_name: c.column, datatype: c.datatype }));
      setAllowedColumns(processedCols);
      setColumns(processedCols.map(c => ({ column: c.column_name, datatype: c.datatype }))); // compatibility map
      setColumnData(processedCols);
    }
  }, [apiColumnsRaw]);

  const handleConnectionChange = (event) => {
    const conn = event.target.value;
    setSelectedConnection(conn);
    setSelectedSchema("");
    setSelectedTable("");
    setColumns([]);
    setAllowedColumns([]);
    setSelectedColumns([]);
    setColumnData([]);
    setColId("");
    setColumnSearchTerm("");
    handleFinalPayload((prevData) => {
      const newData = { ...prevData };
      if (newData.filter_data) delete newData.filter_data;
      return newData;
    });
  };

  const handleSchemaChange = (event) => {
    const schema = event.target.value;
    setSelectedSchema(schema);
    setSelectedTable("");
    setColumns([]);
    setAllowedColumns([]);
    setSelectedColumns([]);
    setColumnData([]);
    setColId("");
    setColumnSearchTerm("");
    handleFinalPayload((prevData) => {
      const newData = { ...prevData };
      if (newData.filter_data) delete newData.filter_data;
      return newData;
    });
  };

  const handleTableChange = (event) => {
    const table = event.target.value;
    const unique = `${selectedConnection}_${selectedSchema}_${table}`;
    setColId(unique);
    setSelectedTable(table);
    setColumns([]);
    setAllowedColumns([]);
    setSelectedColumns([]);
    setColumnData([]);
    setColumnSearchTerm("");
    handleFinalPayload((prevData) => {
      const newData = { ...prevData };
      if (newData.filter_data) delete newData.filter_data;
      return newData;
    });
  };

  const handleColumnChange = (column) => {
    const isColumnChecked = selectedColumns.includes(column);
    const updatedCheckedColumns = isColumnChecked
      ? selectedColumns.filter((col) => col !== column)
      : [...selectedColumns, column];

    setSelectedColumns(updatedCheckedColumns);
    setSelectedColumnsOrder(updatedCheckedColumns);

    setColumnSettings((prevSettings) => {
      if (isColumnChecked) {
        const updatedSettings = { ...prevSettings };
        if (updatedSettings[colId]) {
          updatedSettings[colId] = { ...updatedSettings[colId] };
          delete updatedSettings[colId][column];
          if (Object.keys(updatedSettings[colId]).length === 0) delete updatedSettings[colId];
        }
        return updatedSettings;
      } else {
        const currentConfig = prevSettings[colId]?.[column];
        const newConfig = Array.isArray(currentConfig) 
          ? [ { ...currentConfig[0], originalOutput: "Yes" }, ...currentConfig.slice(1) ]
          : { ...currentConfig, originalOutput: "Yes" };

        return {
          ...prevSettings,
          [colId]: {
            ...(prevSettings[colId] || {}),
            [column]: newConfig,
          },
        };
      }
    });
  };

  const handleChange = (column) => {
    toggleModal(true);
    setSelectedColumn(column);
  };

  const visibleColumns = columns
    .filter((col) => allowedColumns.some((allowedCol) => (allowedCol.column_name || allowedCol.column)?.toLowerCase() === col.column?.toLowerCase()))
    .filter((col) => col.column?.toLowerCase().includes(columnSearchTerm?.toLowerCase() || ""));

  const handleSelectAllChange = (isChecked) => {
    const visibleColumnNames = visibleColumns.map((col) => col.column);

    if (isChecked) {
      const newCols = visibleColumnNames.filter((c) => !selectedColumns.includes(c));
      setSelectedColumns((prev) => [...prev, ...newCols]);
      setSelectedColumnsOrder((prev) => [...prev, ...newCols]);
      setColumnSettings((prevSettings) => {
        const updatedSettings = { ...prevSettings };
        visibleColumnNames.forEach((column) => {
          const currentConfig = updatedSettings[colId]?.[column];
          const newConfig = Array.isArray(currentConfig)
            ? [ { ...currentConfig[0], originalOutput: "Yes" }, ...currentConfig.slice(1) ]
            : { ...currentConfig, originalOutput: "Yes" };

          updatedSettings[colId] = {
            ...updatedSettings[colId],
            [column]: newConfig,
          };
        });
        return updatedSettings;
      });
    } else {
      setSelectedColumns((prev) => prev.filter((c) => !visibleColumnNames.includes(c)));
      setSelectedColumnsOrder((prev) => prev.filter((c) => !visibleColumnNames.includes(c)));
      setColumnSettings((prevSettings) => {
        const updatedSettings = { ...prevSettings };
        visibleColumnNames.forEach((column) => {
          if (updatedSettings[colId]) delete updatedSettings[colId][column];
        });
        return updatedSettings;
      });
    }
  };

  const isAllSelected =
    visibleColumns.length > 0 &&
    visibleColumns.every((col) => selectedColumns.includes(col.column));

  useEffect(() => {
    if (colId && columnSettings[colId]) {
      const columnsWithOutputOrAggregate = Object.keys(columnSettings[colId]).filter((column) => {
        const columnData = columnSettings[colId][column];
        if (Array.isArray(columnData)) {
          return columnData[0]?.originalOutput === "Yes" || columnData[0]?.output === "Yes" || columnData.some(c => c.aggregate || c.alias);
        } else if (columnData) {
          return columnData.originalOutput === "Yes" || columnData.output === "Yes" || (columnData.aggregate && columnData.aggregate.trim() !== "");
        }
        return false;
      });
      setSelectedColumns(columnsWithOutputOrAggregate);
    }
  }, [columnSettings, colId]);

  const handleSave = () => {
    if (!selectedConnection) { showToast('Please select a connection', 'error'); return; }
    if (!selectedSchema) { showToast('Please select a schema', 'error'); return; }
    if (!selectedTable) { showToast('Please select a table', 'error'); return; }

    if (!finalPayload.operation && previousColId !== colId) {
      handleFinalPayload((prevData) => ({
        ...prevData,
        joins: prevData?.joins?.filter((join) => join.view1 !== previousColId && join.view2 !== previousColId),
      }));
      if (previousColId) {
        setColumnSettings((prevSettings) => {
          const updatedSettings = { ...prevSettings };
          delete updatedSettings[previousColId];
          return updatedSettings;
        });
      }
    } else if (finalPayload.operation) {
      handleFinalPayload({});
      const updatedSettings = { ...columnSettings };
      delete updatedSettings.Union;
      setColumnSettings(updatedSettings);
    }

    const filteredColumns = allowedColumns
      .filter((col) => columns.some((c) => c?.column?.toLowerCase() === col?.column_name?.toLowerCase()))
      .map((col) => ({
        column: col.column_name,
        datatype: columns.find((c) => c?.column?.toLowerCase() === col?.column_name?.toLowerCase())?.datatype || "unknown",
      }));

    const newPayload = {
      id, type: "Connection", view: colId, selectedConnection, selectedSchema, selectedTable,
      selectedColumns, def: `Select * from ${selectedConnection}.${selectedSchema}.${selectedTable}`,
      Columns: filteredColumns,
    };

    const currentPayloads = connectionPayload || [];
    const updatedPayloads = [...currentPayloads];
    const existingIndex = updatedPayloads.findIndex((payload) => payload.id === id);
    if (existingIndex !== -1) updatedPayloads[existingIndex] = newPayload;
    else updatedPayloads.push(newPayload);

    handleConnectionPayload(updatedPayloads);

    setNodes((nds) =>
      nds.map((n) =>
        n.id === id
          ? {
              ...n,
              data: {
                ...n.data,
                selectedConnection,
                selectedSchema,
                selectedTable,
                selectedColumns,
              },
            }
          : n
      )
    );

    onSave?.(newPayload);
    showToast('Data Saved Successfully', 'success');
    setPreviousColId(colId);
  };

  const cleanFinalPayload = (finalPayload, viewName) => {
    let updatedPayload = { ...finalPayload };
    if (updatedPayload.defs?.[viewName]) { delete updatedPayload.defs[viewName]; if (!Object.keys(updatedPayload.defs).length) delete updatedPayload.defs; }
    if (updatedPayload.union_fields?.[viewName]) { delete updatedPayload.union_fields[viewName]; if (!Object.keys(updatedPayload.union_fields).length) delete updatedPayload.union_fields; }
    if (updatedPayload.union) { updatedPayload.union = updatedPayload.union.filter((item) => item !== viewName); if (!updatedPayload.union.length) delete updatedPayload.union; }
    if (updatedPayload.metadata) {
      if (updatedPayload.metadata.views) { updatedPayload.metadata.views = updatedPayload.metadata.views.filter((view) => view !== viewName); if (!updatedPayload.metadata.views.length) delete updatedPayload.metadata.views; }
      if (!Object.keys(updatedPayload.metadata).length) delete updatedPayload.metadata;
    }
    return updatedPayload;
  };

  const handleDelete = (id) => {
    const updatedPayload = connectionPayload.filter((node) => node.id !== id);
    handleConnectionPayload(updatedPayload);

    if (!finalPayload.operation) {
      handleFinalPayload((prevData) => ({ ...prevData, joins: prevData?.joins?.filter((join) => join.view1 !== colId && join.view2 !== colId) }));
    } else if (finalPayload.operation) {
      handleFinalPayload(cleanFinalPayload(finalPayload, colId));
    }

    setColumnSettings((prevSettings) => {
      const updatedSettings = { ...prevSettings };
      delete updatedSettings[colId];
      delete updatedSettings["Union"];
      return updatedSettings;
    });

    decrementNodeCount('connection');
    window.deleteNode?.(id);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const toggleModal = (value) => setIsModalOpen(value);

  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const toggleEditorModal = (value) => {
    setIsEditorModalOpen(value);
    setHideBusinessPreview(value);
  };

  const updateNodeInternals = useUpdateNodeInternals();

  useEffect(() => {
    updateNodeInternals(id);
  }, [id, updateNodeInternals, selectedConnection, selectedSchema, selectedTable, columns, isCollapsed, columnSearchTerm]);

  const handleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    updateNodeInternals(id);
  };

  return (
    <>
      <div className="bg-white rounded-lg p-4 shadow-lg min-w-[300px] relative group">
        <Handle type="target" position={Position.Left} />
        <Handle type="source" position={Position.Right} />
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Cable className="w-5 h-5 text-[#8E77BB]" />
            <h3 className="text-black font-medium">Connection</h3>
          </div>
          <div>
            {modalState.queryType === "Complex" && (
              <button onClick={() => toggleEditorModal(true)} className="p-1 rounded-md hover:bg-gray-200">
                <FileCode className="h-5 text-gray-500" />
              </button>
            )}
            <button onClick={handleCollapse} className="p-1 rounded-md hover:bg-gray-200">
              {isCollapsed ? <ChevronDown className="h-5 text-gray-500" /> : <ChevronUp className="h-5 text-gray-500" />}
            </button>
            <button onClick={() => handleDelete(id)} className="p-1 rounded-md hover:bg-gray-200">
              <X className="h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {!isCollapsed && (
          <>
            <div className="space-y-4">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <label className="block text-sm font-medium text-black">Connection</label>
                  <button onClick={handleRefresh} className="p-1 rounded-md hover:bg-gray-200" title="Refresh Connections">
                    <RefreshCw className={`h-3.5 w-3.5 text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <SearchableSelect id="connection" openDropdownId={openDropdownId} setOpenDropdownId={setOpenDropdownId} options={connections} value={selectedConnection} onChange={handleConnectionChange} placeholder="Select a connection" isLoading={isLoadingConnections || isFetchingPolicies} />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">Schema</label>
                <SearchableSelect id="schema" openDropdownId={openDropdownId} setOpenDropdownId={setOpenDropdownId} options={schemas} value={selectedSchema} onChange={handleSchemaChange} placeholder="Select a schema" disabled={!selectedConnection} isLoading={isLoadingSchemas} />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">Table</label>
                <SearchableSelect id="table" openDropdownId={openDropdownId} setOpenDropdownId={setOpenDropdownId} options={tables} value={selectedTable} onChange={handleTableChange} placeholder="Select a table" disabled={!selectedSchema} isLoading={isLoadingTables} />
              </div>

              {isLoadingColumns && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-[#8E77BB]" />
                  <span className="ml-2 text-sm text-gray-600">Loading columns...</span>
                </div>
              )}

              {!isLoadingColumns && allowedColumns?.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Select Columns</label>
                  <div className="pt-1 space-y-2">

                    <div className="relative mb-2" onWheelCapture={(e) => e.stopPropagation()}>
                      <Search className="absolute left-2 top-2.5 w-3.5 h-3.5 text-gray-700" />
                      <input
                        type="text"
                        className="w-full pl-7 pr-3 py-1.5 text-gray-700 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#8E77BB]"
                        placeholder="Search columns..."
                        value={columnSearchTerm}
                        onChange={(e) => setColumnSearchTerm(e.target.value)}
                      />
                      {columnSearchTerm && (
                        <button className="absolute right-2 top-2 text-gray-700 hover:text-gray-600" onClick={() => setColumnSearchTerm("")}>
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="selectAll"
                        checked={isAllSelected}
                        onChange={(e) => handleSelectAllChange(e.target.checked)}
                        className="text-purple-600 focus:ring-purple-500"
                      />
                      <label htmlFor="selectAll" className="text-sm text-gray-700 font-medium">
                        Select All
                      </label>
                    </div>

                    <div
                      className="max-h-32 overflow-y-auto space-y-2 custom-scrollbar"
                      onWheelCapture={(e) => e.stopPropagation()}
                    >
                      {visibleColumns.length === 0 ? (
                        <div className="text-sm text-gray-400 py-1 text-center">No columns match</div>
                      ) : (
                        visibleColumns.map((col) => (
                          <div className="flex justify-between" key={col.column}>
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={col.column}
                                value={col.column}
                                checked={selectedColumns.includes(col.column)}
                                onChange={() => handleColumnChange(col.column)}
                                className="text-purple-600 focus:ring-purple-500"
                              />
                              <label htmlFor={col.column} className="text-sm text-gray-700">{col.column}</label>
                            </div>
                            <Pencil
                              name="edit"
                              onClick={() => handleChange(col.column)}
                              className="mr-3 h-4 w-4 text-[#8E77BB] cursor-pointer hover:text-[#7a64a0]"
                            />
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleSave}
              className="w-full text-white bg-[#8e78b7] hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-3 py-1.5 dark:bg-[#8e78b7] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7] mt-3"
            >
              OK
            </button>
          </>
        )}

        <style jsx>{`
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #a0aec0; border-radius: 3px; }
          @keyframes spin { to { transform: rotate(360deg); } }
          .animate-spin { animation: spin 1s linear infinite; }
        `}</style>
      </div>

      <Modal
        open={isModalOpen}
        onClose={(event, reason) => {
          if (reason !== 'backdropClick') {
            toggleModal(false);
          }
        }}
        BackdropProps={{ style: { backgroundColor: "transparent" } }}>
        <div className="absolute top-0 right-0 h-full w-[450px]">
          <Columns
            id={colId}
            columnName={selectedColumn}
            dataType={columns.find((col) => col?.column?.toLowerCase() === selectedColumn?.toLowerCase())?.datatype || "unknown"}
            toggleModal={toggleModal}
            selectedColumns={selectedColumns}
            setSelectedColumns={setSelectedColumns}
          />
        </div>
      </Modal>
      <Modal open={isEditorModalOpen} onClose={() => toggleEditorModal(false)} BackdropProps={{ style: { backgroundColor: "transparent" } }}>
        <div className="absolute top-0 right-0 h-full">
        <ComplexQueryEditor
          setShowQueryEditor={toggleEditorModal}
          onQuerySave={(savedQuery) => {
            notifyComplexQuerySaved();
          }}
        />
        </div>
      </Modal>
    </>
  );
}

ConnectionNode.propTypes = {
  id: PropTypes.string.isRequired,
  onSave: PropTypes.func,
};