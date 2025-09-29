/*eslint-disable*/
import React, { useState, useEffect } from "react";
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

const SearchableSelect = ({ options, value, onChange, placeholder, disabled = false, isLoading = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isLoading) {
      setIsOpen((prev) => !prev);
    }
  };

  const handleOptionClick = (option) => {
    onChange({ target: { value: option } });
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="relative w-full text-black">
      <div
        className={`w-full px-3 py-2 border-2 rounded-lg text-gray-500 hover:bg-gray-50 cursor-pointer flex justify-between items-center ${
          disabled || isLoading ? "opacity-50 cursor-not-allowed" : ""
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
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg">
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
  const { handleConnectionPayload, connectionPayload, setColumnSettings, columnSettings, complexCheck, finalPayload, handleFinalPayload } = useStateContext("");
  const [isCollapsed, setIsCollapsed] = useState(false);
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

      const response = await fetch(`${hostnameV1}/connections/list`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ matched_policy_ids: fetchedPolicyIds }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Fetch error:", errorText);
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

    setIsLoadingSchemas(true);
    try {
      if (policyIds.length === 0) {
        setSchemas([]);
        return;
      }

      const response = await fetch(`${hostnameV1}/schemas/list`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matched_policy_ids: policyIds,
          connection_name: conn,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Fetch error:", errorText);
        throw new Error(`Failed to fetch schemas: ${errorText}`);
      }

      const data = await response.json();
      const connectionData = data.find((item) => item[conn]);
      const schemaList = connectionData ? connectionData[conn] : [];
      setSchemas(schemaList);
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

    setIsLoadingTables(true);
    try {
      if (policyIds.length === 0) {
        setTables([]);
        return;
      }

      const response = await fetch(`${hostnameV1}/tables/list`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matched_policy_ids: policyIds,
          connection_name: selectedConnection,
          schema_name: [schema],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Fetch error:", errorText);
        throw new Error(`Failed to fetch tables: ${errorText}`);
      }

      const data = await response.json();

      if (!data || !data.schemas || !Array.isArray(data.schemas)) {
        console.error("Invalid response structure:", data);
        throw new Error("Invalid response structure from /tables/list");
      }

      const schemaData = data.schemas.find(
        (item) => item.connection_name === selectedConnection && item.schema === schema
      );
      if (schemaData && schemaData.tables) {
        setTables(schemaData.tables);
      } else {
        setTables([]);
      }
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

    setIsLoadingColumns(true);
    try {
      const detailedColumnsResponse = await fetch(
        `${hostnameV1}/${selectedConnection}/schemas/${selectedSchema}/tables/${table}/columns`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!detailedColumnsResponse.ok) {
        const errorText = await detailedColumnsResponse.text();
        console.error("Fetch error:", errorText);
        throw new Error(`Failed to fetch detailed columns: ${errorText}`);
      }
      const detailedColumnsData = await detailedColumnsResponse.json();
      setColumns(detailedColumnsData);

      const secureQueryResponse = await secureQuery({ user_query: "" }, token);
      const fetchedPolicyIds = secureQueryResponse.matched_policy_ids || [];

      if (fetchedPolicyIds.length === 0) {
        setAllowedColumns([]);
        setColumnData([]);
        return;
      }

      const allowedColumnsResponse = await fetch(`${hostnameV1}/columns/list`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matched_policy_ids: fetchedPolicyIds,
          connection_name: selectedConnection,
          schema_name: [selectedSchema],
          table_name: [table],
        }),
      });

      if (!allowedColumnsResponse.ok) {
        const errorText = await allowedColumnsResponse.text();
        console.error("Fetch error:", errorText);
        throw new Error(`Failed to fetch allowed columns: ${errorText}`);
      }

      const allowedColumnsData = await allowedColumnsResponse.json();

      if (!allowedColumnsData || !allowedColumnsData.columns) {
        console.error("Invalid response structure:", allowedColumnsData);
        setAllowedColumns([]);
        setColumnData([]);
        return;
      }

      const columnData = allowedColumnsData.columns.find(
        (item) =>
          item.connection_name.toLowerCase() === selectedConnection.toLowerCase() &&
          item.schema.toLowerCase() === selectedSchema.toLowerCase() &&
          item.table_name.toLowerCase() === table.toLowerCase()
      );

      const formattedColumns = columnData && columnData.columns
        ? columnData.columns.map((item) => ({
            column: item.column_name,
            datatype: item.metadata?.DATA_TYPE || "unknown",
          }))
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
            if (Object.keys(updatedSettings[colId]).length === 0) {
              delete updatedSettings[colId];
            }
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
            [column]: {
              ...(prevSettings[colId]?.[column] || {}),
              output: "Yes",
            },
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

  const handleSelectAllChange = (isChecked) => {
    if (isChecked) {
      const columnNames = allowedColumns.map((col) => col.column);
      setSelectedColumns(columnNames);
      setSelectedColumnsOrder(columnNames);
      setColumnSettings((prevSettings) => {
        const updatedSettings = { ...prevSettings };
        columnNames.forEach((column) => {
          updatedSettings[colId] = {
            ...updatedSettings[colId],
            [column]: {
              ...(updatedSettings[colId]?.[column] || {}),
              output: "Yes",
            },
          };
        });
        return updatedSettings;
      });
    } else {
      setSelectedColumns([]);
      setSelectedColumnsOrder([]);
      setColumnSettings((prevSettings) => {
        const updatedSettings = { ...prevSettings };
        allowedColumns.forEach((column) => {
          updatedSettings[colId] = {
            ...updatedSettings[colId],
            [column.column]: {
              ...(updatedSettings[colId]?.[column.column] || {}),
              output: "No",
            },
          };
        });
        return updatedSettings;
      });
    }
  };

  const isAllSelected = selectedColumns.length === allowedColumns.length && allowedColumns.length > 0;

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
    if (!selectedConnection || !selectedSchema || !selectedTable) {
      showToast('Please select a connection, schema, and table', 'error');
      return;
    }

    if (!finalPayload.operation && previousColId !== colId) {
      handleFinalPayload((prevData) => ({
        ...prevData,
        joins: prevData?.joins?.filter(
          (join) => join.view1 !== previousColId && join.view2 !== previousColId
        ),
      }));
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
      id,
      type: "Connection",
      view: colId,
      selectedConnection,
      selectedSchema,
      selectedTable,
      selectedColumns,
      def: `Select * from ${selectedConnection}.${selectedSchema}.${selectedTable}`,
      Columns: filteredColumns,
    };

    const currentPayloads = connectionPayload || [];
    const updatedPayloads = [...currentPayloads];
    const existingIndex = updatedPayloads.findIndex((payload) => payload.id === id);

    if (existingIndex !== -1) {
      updatedPayloads[existingIndex] = newPayload;
    } else {
      updatedPayloads.push(newPayload);
    }

    handleConnectionPayload(updatedPayloads);
    onSave?.(newPayload);
    showToast('Data Saved Successfully', 'success');
    setPreviousColId(colId);
  };

  const cleanFinalPayload = (finalPayload, viewName) => {
    let updatedPayload = { ...finalPayload };

    if (updatedPayload.defs && updatedPayload.defs[viewName]) {
      delete updatedPayload.defs[viewName];
      if (Object.keys(updatedPayload.defs).length === 0) delete updatedPayload.defs;
    }

    if (updatedPayload.union_fields && updatedPayload.union_fields[viewName]) {
      delete updatedPayload.union_fields[viewName];
      if (Object.keys(updatedPayload.union_fields).length === 0) delete updatedPayload.union_fields;
    }

    if (updatedPayload.union) {
      updatedPayload.union = updatedPayload.union.filter((item) => item !== viewName);
      if (updatedPayload.union.length === 0) delete updatedPayload.union;
    }

    if (updatedPayload.metadata) {
      if (updatedPayload.metadata.views) {
        updatedPayload.metadata.views = updatedPayload.metadata.views.filter((view) => view !== viewName);
        if (updatedPayload.metadata.views.length === 0) delete updatedPayload.metadata.views;
      }
      if (Object.keys(updatedPayload.metadata).length === 0) delete updatedPayload.metadata;
    }

    return updatedPayload;
  };

  const handleDelete = (id) => {
    const updatedPayload = connectionPayload.filter((node) => node.id !== id);
    handleConnectionPayload(updatedPayload);

    if (!finalPayload.operation) {
      handleFinalPayload((prevData) => ({
        ...prevData,
        joins: prevData?.joins?.filter(
          (join) => join.view1 !== colId && join.view2 !== colId
        ),
      }));
    } else if (finalPayload.operation) {
      const cleanedPayload = cleanFinalPayload(finalPayload, colId);
      handleFinalPayload(cleanedPayload);
    }

    setColumnSettings((prevSettings) => {
      const updatedSettings = { ...prevSettings };
      delete updatedSettings[colId];
      delete updatedSettings["Union"];
      return updatedSettings;
    });

    window.deleteNode?.(id);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const toggleModal = (value) => {
    setIsModalOpen(value);
  };

  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const toggleEditorModal = (value) => {
    setIsEditorModalOpen(value);
  };

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
              <button
                onClick={() => toggleEditorModal(true)}
                className="p-1 rounded-md hover:bg-gray-200"
              >
                <FileCode className="h-5 text-gray-500" />
              </button>
            )}
            <button
              onClick={handleCollapse}
              className="p-1 rounded-md hover:bg-gray-200"
            >
              {isCollapsed ? <ChevronDown className="h-5 text-gray-500" /> : <ChevronUp className="h-5 text-gray-500" />}
            </button>
            <button
              onClick={() => handleDelete(id)}
              className="p-1 rounded-md hover:bg-gray-200"
            >
              <X className="h-5 text-gray-500" />
            </button>
          </div>
        </div>
        {!isCollapsed && (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-1">Connection</label>
                <SearchableSelect
                  options={connections}
                  value={selectedConnection}
                  onChange={handleConnectionChange}
                  placeholder="Select a connection"
                  isLoading={isLoadingConnections}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">Schema</label>
                <SearchableSelect
                  options={schemas}
                  value={selectedSchema}
                  onChange={handleSchemaChange}
                  placeholder="Select a schema"
                  disabled={!selectedConnection}
                  isLoading={isLoadingSchemas}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">Table</label>
                <SearchableSelect
                  options={tables}
                  value={selectedTable}
                  onChange={handleTableChange}
                  placeholder="Select a table"
                  disabled={!selectedSchema}
                  isLoading={isLoadingTables}
                />
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
                  <div className="p-3 space-y-2">
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
                    <div className="max-h-32 overflow-y-auto space-y-2 custom-scrollbar">
                      {allowedColumns
                        .filter((col) =>
                          columns.some((c) => c.column.toLowerCase() === col.column.toLowerCase())
                        )
                        .map((col) => (
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
                              <label htmlFor={col.column} className="text-sm text-gray-700">
                                {col.column}
                              </label>
                            </div>
                            <Pencil
                              name="edit"
                              onClick={() => handleChange(col.column)}
                              className="mr-3 h-4 w-4 text-[#8E77BB] cursor-pointer hover:text-[#7a64a0]"
                            />
                          </div>
                        ))}
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
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: #a0aec0;
            border-radius: 3px;
          }
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
          .animate-spin {
            animation: spin 1s linear infinite;
          }
        `}</style>
      </div>
      <Modal
        open={isModalOpen}
        onClose={() => toggleModal(false)}
        BackdropProps={{
          style: {
            backgroundColor: "transparent",
          },
        }}
      >
        <div className="absolute top-0 right-0 h-full w-full sm:w-1/2 md:w-1/3 lg:w-[22%]">
          <Columns
            id={colId}
            columnName={selectedColumn}
            dataType={columns.find((col) => col.column.toLowerCase() === selectedColumn.toLowerCase())?.datatype || "unknown"}
            toggleModal={toggleModal}
          />
        </div>
      </Modal>
      <Modal
        open={isEditorModalOpen}
        onClose={() => toggleEditorModal(false)}
        BackdropProps={{
          style: {
            backgroundColor: "transparent",
          },
        }}
      >
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