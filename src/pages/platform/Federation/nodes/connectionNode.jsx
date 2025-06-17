/*eslint-disable*/
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Handle, Position, useUpdateNodeInternals } from "reactflow";
import { Cable, X, ChevronDown, ChevronUp, Pencil, FileCode, Search } from "lucide-react";
import { useStateContext } from "../context/contextViewProvider";
import { Columns } from "../BusinessView/Columns";
import { Modal } from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import ComplexQueryEditor from "../components/ComplexQueryEditor";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import { secureQuery } from '../../../datagovernance/DataCatalogue/Components/function.js';

export function ConnectionNode({ id, onSave }) {
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
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [selectedColumn, setSelectedColumn] = useState("");
  const [columnData, setColumnData] = useState([]);
  const [previousColId, setPreviousColId] = useState("");
  const [colId, setColId] = useState("");
  const [selectedColumnsOrder, setSelectedColumnsOrder] = useState([]);

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

  // Fetch connections
  const fetchConnections = async () => {
    try {
      const secureQueryResponse = await secureQuery({ user_query: "" }, token);
      const policyIds = secureQueryResponse.matched_policy_ids || [];

      if (policyIds.length === 0) {
        toast.error("No policies matched for fetching connections");
        return;
      }

      const response = await fetch(`${hostnameV1}/connections/list`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ matched_policy_ids: policyIds }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch connections");
      }

      const connectionsData = await response.json();
      const names = connectionsData.map((item) => item.connection_name);
      setConnections(names);
    } catch (error) {
      console.error("Error fetching connections:", error);
      toast.error("Failed to load connections");
    }
  };

  useEffect(() => {
    fetchConnections();
  }, [token, hostnameV1]);

  // Fetch schemas
  const handleConnectionChange = async (event) => {
    const conn = event.target.value;
    setSelectedConnection(conn);
    setSelectedSchema("");
    setSelectedTable("");
    setColumns([]);
    setSelectedColumns([]);
    setColumnData([]);

    try {
      const secureQueryResponse = await secureQuery({ user_query: "" }, token);
      const policyIds = secureQueryResponse.matched_policy_ids || [];

      if (policyIds.length === 0) {
        toast.error("No policies matched for fetching schemas");
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
        throw new Error("Failed to fetch schemas");
      }

      const data = await response.json();
      const connectionData = data.find((item) => item[conn]);
      const schemaList = connectionData ? connectionData[conn] : [];
      setSchemas(schemaList);
    } catch (error) {
      console.error("Error fetching schema data:", error);
      setSchemas([]);
      toast.error("Failed to load schemas");
    }
  };

  // Fetch tables
  const handleSchemaChange = async (event) => {
    const schema = event.target.value;
    setSelectedSchema(schema);
    setSelectedTable("");
    setColumns([]);
    setSelectedColumns([]);
    setColumnData([]);

    try {
      const secureQueryResponse = await secureQuery({ user_query: "" }, token);
      const policyIds = secureQueryResponse.matched_policy_ids || [];

      if (policyIds.length === 0) {
        toast.error("No policies matched for fetching tables");
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
          schema_name: schema,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch tables");
      }

      const data = await response.json();
      setTables(data.tables || []);
    } catch (error) {
      console.error("Error fetching table data:", error);
      setTables([]);
      toast.error("Failed to load tables");
    }
  };

  // Fetch columns
  const handleTableChange = async (event) => {
    const table = event.target.value;
    const unique = `${selectedConnection}_${selectedSchema}_${table}`;
    setColId(unique);
    setSelectedTable(table);
    setColumns([]);
    setSelectedColumns([]);
    setColumnData([]);

    try {
      // Fetch columns from /columns/list
      const secureQueryResponse = await secureQuery({ user_query: "" }, token);
      const policyIds = secureQueryResponse.matched_policy_ids || [];

      if (policyIds.length === 0) {
        toast.error("No policies matched for fetching columns");
        return;
      }

      const listResponse = await fetch(`${hostnameV1}/columns/list`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matched_policy_ids: policyIds,
          connection_name: selectedConnection,
          schema_name: selectedSchema,
          table_name: table,
        }),
      });

      if (!listResponse.ok) {
        throw new Error("Failed to fetch columns");
      }

      const listData = await listResponse.json();
      const columnNames = listData.columns.map((col) => col.column_name);
      setColumns(columnNames);

      // Fetch column details (including datatype) from existing API
      const detailsResponse = await fetch(
        `${hostnameV1}/${selectedConnection}/schemas/${selectedSchema}/tables/${table}/columns`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!detailsResponse.ok) {
        throw new Error("Failed to fetch column details");
      }

      const detailsData = await detailsResponse.json();
      setColumnData(detailsData);
      updateNodeInternals(id);
    } catch (error) {
      console.error("Error fetching column data:", error);
      setColumns([]);
      setColumnData([]);
      toast.error("Failed to load columns");
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
      setSelectedColumns(columns);
      setSelectedColumnsOrder(columns);
      setColumnSettings((prevSettings) => {
        const updatedSettings = { ...prevSettings };
        columns.forEach((column) => {
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
        columns.forEach((column) => {
          updatedSettings[colId] = {
            ...updatedSettings[colId],
            [column]: {
              ...(updatedSettings[colId]?.[column] || {}),
              output: "No",
            },
          };
        });
        return updatedSettings;
      });
    }
  };

  const isAllSelected = selectedColumns.length === columns.length;

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
      toast.error("Please select a connection, schema, and table");
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

    const newPayload = {
      id,
      type: "Connection",
      view: colId,
      selectedConnection,
      selectedSchema,
      selectedTable,
      selectedColumns,
      def: `Select * from ${selectedConnection}.${selectedSchema}.${selectedTable}`,
      Columns: columnData,
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
    toast.success("Data Saved Successfully");
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

  const SearchableSelect = ({ options, value, onChange, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const filteredOptions = options
      .map((option) => (typeof option === "object" ? option.connection_name : option))
      .filter((option) => option.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleSelectClick = () => {
      setIsOpen(!isOpen);
    };

    const handleOptionClick = (option) => {
      onChange({ target: { value: option } });
      setIsOpen(false);
      setSearchTerm("");
    };

    return (
      <div className="relative w-full text-black">
        <div
          className="w-full px-3 py-2 border-2 rounded-lg text-gray-500 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
          onClick={handleSelectClick}
        >
          <span>{value || placeholder}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
        {isOpen && (
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
              {filteredOptions.map((option) => (
                <div
                  key={option}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleOptionClick(option)}
                >
                  {option}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
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
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">Schema</label>
                <SearchableSelect
                  options={schemas}
                  value={selectedSchema}
                  onChange={handleSchemaChange}
                  placeholder="Select a schema"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">Table</label>
                <SearchableSelect
                  options={tables}
                  value={selectedTable}
                  onChange={handleTableChange}
                  placeholder="Select a table"
                />
              </div>
              {columns?.length && (
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
                      {columns.map((column) => (
                        <div className="flex justify-between" key={column}>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={column}
                              value={column}
                              checked={selectedColumns.includes(column)}
                              onChange={() => handleColumnChange(column)}
                              className="text-purple-600 focus:ring-purple-500"
                            />
                            <label htmlFor={column} className="text-sm text-gray-700">
                              {column}
                            </label>
                          </div>
                          <Pencil
                            name="edit"
                            onClick={() => handleChange(column)}
                            className="mr-3 h-4 w-4 text-[#8E77BB]"
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
            dataType={columnData.find((col) => col.column === selectedColumn)?.datatype}
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