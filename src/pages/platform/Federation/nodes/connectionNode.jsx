/*eslint-disable*/
import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { Handle, Position, useUpdateNodeInternals } from "reactflow";
import { Cable, X, ChevronDown, ChevronUp, Pencil, FileCode, Search, Loader2 } from "lucide-react";
import { useStateContext } from "../context/contextViewProvider";
import { Columns } from "../BusinessView/Columns";
import { Modal } from "@mui/material";
import ComplexQueryEditor from "../components/ComplexQueryEditor";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import { secureQuery } from '../../../datagovernance/DataCatalogue/Components/function.js';
import { useToast } from "../context/ToastContext";


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

export function ConnectionNode({ id, onSave }) {
  const { showToast } = useToast();
  const { token, hostnameV1 } = useAuth();
  const { handleConnectionPayload, connectionPayload, setColumnSettings, columnSettings, complexCheck, finalPayload, handleFinalPayload, incrementNodeCount, decrementNodeCount } = useStateContext("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [connections, setConnections] = useState([]);
  const [selectedConnection, setSelectedConnection] = useState("");
  const [schemas, setSchemas] = useState([]);
  const [selectedSchema, setSelectedSchema] = useState("");
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [columns, setColumns] = useState([]);
  const [allowedColumns, setAllowedColumns] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [selectedColumn, setSelectedColumn] = useState("");
  const [columnData, setColumnData] = useState([]);
  const [previousColId, setPreviousColId] = useState("");
  const [colId, setColId] = useState("");
  const [selectedColumnsOrder, setSelectedColumnsOrder] = useState([]);
  const [policyIds, setPolicyIds] = useState([]);
  const hasIncrementedRef = useRef(false);

  const [columnSearchTerm, setColumnSearchTerm] = useState("");

  // Loading states
  const [isLoadingConnections, setIsLoadingConnections] = useState(false);
  const [isLoadingSchemas, setIsLoadingSchemas] = useState(false);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [isLoadingColumns, setIsLoadingColumns] = useState(false);

  const modalState = useLocation().state || {
    queryType: "Regular",
    viewType: "Business",
  };

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

  const fetchConnections = async () => {
    setIsLoadingConnections(true);
    try {
      const secureQueryResponse = await secureQuery({ user_query: "" }, token);
      const fetchedPolicyIds = secureQueryResponse.matched_policy_ids || [];
      setPolicyIds(fetchedPolicyIds);

      if (fetchedPolicyIds.length === 0) {
        setConnections([]);
        return;
      }

      const response = await fetch(`${hostnameV1}/federation/connections/list`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ matched_policy_ids: fetchedPolicyIds }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch connections: ${errorText}`);
      }

      const connectionsData = await response.json();
      const names = connectionsData.map((item) => item.connection_name);
      setConnections(names);
    } catch (error) {
      console.error("Error fetching connections:", error);
      showToast('Failed to load connections', 'error');
      setConnections([]);
    } finally {
      setIsLoadingConnections(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, [token, hostnameV1]);

  const handleConnectionChange = async (event) => {
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

    setIsLoadingSchemas(true);
    try {
      if (policyIds.length === 0) { setSchemas([]); return; }

      const response = await fetch(`${hostnameV1}/schemas/list`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ matched_policy_ids: policyIds, connection_name: conn }),
      });

      if (!response.ok) throw new Error(`Failed to fetch schemas: ${await response.text()}`);

      const data = await response.json();
      const connectionData = data.find((item) => item[conn]);
      setSchemas(connectionData ? connectionData[conn] : []);
    } catch (error) {
      console.error("Error fetching schema data:", error);
      setSchemas([]);
      showToast('Failed to load schemas', 'error');
    } finally {
      setIsLoadingSchemas(false);
    }
  };

  const handleSchemaChange = async (event) => {
    const schema = event.target.value;
    setSelectedSchema(schema);
    setSelectedTable("");
    setColumns([]);
    setAllowedColumns([]);
    setSelectedColumns([]);
    setColumnData([]);
    setColId("");
    setColumnSearchTerm("");

    setIsLoadingTables(true);
    try {
      if (policyIds.length === 0) { setTables([]); return; }

      const response = await fetch(`${hostnameV1}/tables/list`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ matched_policy_ids: policyIds, connection_name: selectedConnection, schema_name: [schema] }),
      });

      if (!response.ok) throw new Error(`Failed to fetch tables: ${await response.text()}`);

      const data = await response.json();
      if (!data || !data.schemas || !Array.isArray(data.schemas)) throw new Error("Invalid response structure from /tables/list");

      const schemaData = data.schemas.find(
        (item) => item.connection_name === selectedConnection && item.schema === schema
      );
      setTables(schemaData?.tables || []);
    } catch (error) {
      console.error("Error fetching table data:", error);
      setTables([]);
      showToast('Failed to load tables', 'error');
    } finally {
      setIsLoadingTables(false);
    }
  };

  const handleTableChange = async (event) => {
    const table = event.target.value;
    const unique = `${selectedConnection}_${selectedSchema}_${table}`;
    setColId(unique);
    setSelectedTable(table);
    setColumns([]);
    setAllowedColumns([]);
    setSelectedColumns([]);
    setColumnData([]);
    setColumnSearchTerm(""); // reset column search

    setIsLoadingColumns(true);
    try {
      const detailedColumnsResponse = await fetch(
        `${hostnameV1}/${selectedConnection}/schemas/${selectedSchema}/tables/${table}/columns`,
        { method: "GET", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );

      if (!detailedColumnsResponse.ok) throw new Error(`Failed to fetch detailed columns: ${await detailedColumnsResponse.text()}`);
      const detailedColumnsData = await detailedColumnsResponse.json();
      setColumns(detailedColumnsData);

      const secureQueryResponse = await secureQuery({ user_query: "" }, token);
      const fetchedPolicyIds = secureQueryResponse.matched_policy_ids || [];

      if (fetchedPolicyIds.length === 0) { setAllowedColumns([]); setColumnData([]); return; }

      const allowedColumnsResponse = await fetch(`${hostnameV1}/columns/list`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ matched_policy_ids: fetchedPolicyIds, connection_name: selectedConnection, schema_name: [selectedSchema], table_name: [table] }),
      });

      if (!allowedColumnsResponse.ok) throw new Error(`Failed to fetch allowed columns: ${await allowedColumnsResponse.text()}`);

      const allowedColumnsData = await allowedColumnsResponse.json();
      if (!allowedColumnsData || !allowedColumnsData.columns) { setAllowedColumns([]); setColumnData([]); return; }

      const columnData = allowedColumnsData.columns.find(
        (item) =>
          item.connection_name.toLowerCase() === selectedConnection.toLowerCase() &&
          item.schema.toLowerCase() === selectedSchema.toLowerCase() &&
          item.table_name.toLowerCase() === table.toLowerCase()
      );

      const formattedColumns = columnData?.columns
        ? columnData.columns.map((item) => ({ column: item.column_name, datatype: item.metadata?.DATA_TYPE || "unknown" }))
        : [];

      setAllowedColumns(formattedColumns);
      setColumnData(formattedColumns);
      updateNodeInternals(id);
    } catch (error) {
      console.error("Error fetching columns:", error);
      setColumns([]);
      setAllowedColumns([]);
      setColumnData([]);
      showToast('Failed to load columns', 'error');
    } finally {
      setIsLoadingColumns(false);
    }
  };

  const handleColumnChange = (column) => {
    setSelectedColumns((prev) => {
      if (prev.includes(column)) {
        setColumnSettings((prevSettings) => {
          const updatedSettings = { ...prevSettings };
          if (updatedSettings[colId]) {
            delete updatedSettings[colId][column];
            if (Object.keys(updatedSettings[colId]).length === 0) delete updatedSettings[colId];
          }
          return updatedSettings;
        });
        setSelectedColumnsOrder((prevOrder) => prevOrder.filter((col) => col !== column));
        return prev.filter((col) => col !== column);
      } else {
        setColumnSettings((prevSettings) => ({
          ...prevSettings,
          [colId]: {
            ...(prevSettings[colId] || {}),
            [column]: { ...(prevSettings[colId]?.[column] || {}), output: "Yes" },
          },
        }));
        setSelectedColumnsOrder((prevOrder) => [...prevOrder, column]);
        return [...prev, column];
      }
    });
  };

  const handleChange = (column) => {
    toggleModal(true);
    setSelectedColumn(column);
  };

  const visibleColumns = allowedColumns
    .filter((col) => columns.some((c) => c.column.toLowerCase() === col.column.toLowerCase()))
    .filter((col) => col.column.toLowerCase().includes(columnSearchTerm.toLowerCase()));

  const handleSelectAllChange = (isChecked) => {
    const visibleColumnNames = visibleColumns.map((col) => col.column);

    if (isChecked) {
      const newCols = visibleColumnNames.filter((c) => !selectedColumns.includes(c));
      setSelectedColumns((prev) => [...prev, ...newCols]);
      setSelectedColumnsOrder((prev) => [...prev, ...newCols]);
      setColumnSettings((prevSettings) => {
        const updatedSettings = { ...prevSettings };
        visibleColumnNames.forEach((column) => {
          updatedSettings[colId] = {
            ...updatedSettings[colId],
            [column]: { ...(updatedSettings[colId]?.[column] || {}), output: "Yes" },
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
        const columnData = columnSettings[colId][column] || {};
        return columnData.output === "Yes" || (columnData.aggregate && columnData.aggregate.trim() !== "");
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
      .filter((col) => columns.some((c) => c.column.toLowerCase() === col.column.toLowerCase()))
      .map((col) => ({
        column: col.column,
        datatype: columns.find((c) => c.column.toLowerCase() === col.column.toLowerCase())?.datatype || "unknown",
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
  const toggleEditorModal = (value) => setIsEditorModalOpen(value);

  const updateNodeInternals = useUpdateNodeInternals();

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
                <label className="block text-sm font-medium text-black mb-1">Connection</label>
                <SearchableSelect id="connection" openDropdownId={openDropdownId} setOpenDropdownId={setOpenDropdownId} options={connections} value={selectedConnection} onChange={handleConnectionChange} placeholder="Select a connection" isLoading={isLoadingConnections} />
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

      <Modal open={isModalOpen} onClose={() => toggleModal(false)} BackdropProps={{ style: { backgroundColor: "transparent" } }}>
        <div className="absolute top-0 right-0 h-full w-full sm:w-1/2 md:w-1/3 lg:w-[22%]">
          <Columns
            id={colId}
            columnName={selectedColumn}
            dataType={columns.find((col) => col.column.toLowerCase() === selectedColumn.toLowerCase())?.datatype || "unknown"}
            toggleModal={toggleModal}
          />
        </div>
      </Modal>
      <Modal open={isEditorModalOpen} onClose={() => toggleEditorModal(false)} BackdropProps={{ style: { backgroundColor: "transparent" } }}>
        <div className="absolute top-0 right-0 h-full">
          <ComplexQueryEditor setShowQueryEditor={toggleEditorModal} />
        </div>
      </Modal>
    </>
  );
}

ConnectionNode.propTypes = {
  id: PropTypes.string.isRequired,
  onSave: PropTypes.func,
};