import { useCallback, useEffect, useState } from "react";
import {
  Cable,
  X,
  ChevronDown,
  ChevronUp,
  Pencil,
  Search,
  SquareKanban,
  Database,
  FileCode,
} from "lucide-react";
import { useStateContext } from "../context/contextViewProvider";
import { defaultSetting } from "../BaseView/ColumnSettings";
import { useAuth } from "../../../../context/AuthContext";
import { secureQuery } from '../../../datagovernance/DataCatalogue/Components/function.js';
import { useToast } from "../context/ToastContext";

const SearchableSelect = ({ options, value, onChange, placeholder, disabled = false, isLoading = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredOptions = options
    .map((option) => typeof option === "object" ? option.connection_name : option)
    .filter((option) => option.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleSelectClick = () => {
    if (!disabled && !isLoading) setIsOpen(!isOpen);
  };

  const handleOptionClick = (option) => {
    onChange({ target: { value: option } });
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="relative w-full">
      <div
        className={`w-full px-3 py-2 border-2 rounded-lg text-gray-500 hover:bg-gray-50 cursor-pointer flex justify-between items-center ${disabled || isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
        onClick={handleSelectClick}
      >
        <span>{value || placeholder}</span>
        {isLoading ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </div>

      {isOpen && !isLoading && !disabled && (
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
                <div key={option} className="p-2 hover:bg-gray-100 cursor-pointer" onClick={() => handleOptionClick(option)}>
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

export function BaseNode({ id, data }) {
  const { showToast } = useToast();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [apiViews, setApiViews] = useState([]);
  const [selectedView, setSelectedView] = useState("");
  const [apiColumns, setApiColumns] = useState([]);
  const [isLoadingViews, setIsLoadingViews] = useState(false);
  const [isLoadingColumns, setIsLoadingColumns] = useState(false);

  // ── Column search state ───────────────────────────────────────────────────
  const [columnSearchTerm, setColumnSearchTerm] = useState("");

  const { token, project, decodedToken, setSelectedProject, hostnameV1, hostnameV2 } = useAuth();
  const { settingsList, setSettingsList, userSelections, setUserSelections, userCheckedColumns, setUserCheckedColumns } = useStateContext();

  const getFilterModalColumns = () =>
    apiColumns.length > 0 ? apiColumns.map((column) => ({ name: column.column_name, type: column.data_type })) : [];

  useEffect(() => {
    (async () => {
      setIsLoadingViews(true);
      try {
        const params = new URLSearchParams({
          view_type: "Base",
          project: (project === "default" || project === "none") ? "default" : project,
          created_by: decodedToken?.preferred_username,
        });

        const response = await fetch(`${hostnameV2}/get-all-views_v2?${params}`, {
          method: "GET",
          headers: { "Content-Type": "application/json", authorization: `Bearer ${token}` },
        });

        const data = await response.json();
        if (response.ok) setApiViews(data.result.sort((a, b) => a.localeCompare(b)));
        else showToast('Error fetching views', 'error');
      } catch (error) {
        console.error("Fetch error", error);
        showToast('Error fetching views', 'error');
      } finally {
        setIsLoadingViews(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (selectedView) {
      (async () => {
        setIsLoadingColumns(true);
        try {
          const response = await fetch(`${hostnameV1}/fetch_view_columns`, {
            headers: { "Content-Type": "application/json", authorization: `Bearer ${token}` },
            body: JSON.stringify({ view_names: [selectedView] }),
            method: "POST",
          });
          let data = await response.json();
          if (response.status == 200) setApiColumns(data.result[selectedView]);
          else showToast('Error occurred while trying to fetch columns', 'error');
        } catch (error) {
          showToast('Error occurred while trying to fetch columns', 'error');
        } finally {
          setIsLoadingColumns(false);
        }
      })();
    }
  }, [selectedView]);

  const handleChangeView = (event) => {
    const selectedViewName = event.target.value.toLowerCase();
    setUserCheckedColumns([]);
    setApiColumns([]);
    setSelectedView(selectedViewName);
    setIsAllSelected(false);
    setColumnSearchTerm(""); // reset column search on view change
    setUserSelections((prev) => {
      const updatedSelections = new Map();
      updatedSelections.set("viewName", selectedViewName);
      return updatedSelections;
    });
    setSettingsList([]);
  };

  const handleColumnCheck = (column) => {
    const columnName = column.column_name;
    const dataType = column.data_type;
    const isColumnChecked = userCheckedColumns.includes(columnName);
    const updatedCheckedColumns = isColumnChecked
      ? userCheckedColumns.filter((name) => name !== columnName)
      : [...userCheckedColumns, columnName];

    setSettingsList((prev) => {
      const updatedSettingsList = prev.map((item) => {
        if (item.name === columnName) return { ...item, output: isColumnChecked ? "No" : "Yes" };
        return item;
      });
      if (!isColumnChecked && !prev.some((item) => item.name === columnName)) {
        updatedSettingsList.push({ ...defaultSetting, name: columnName, type: dataType });
      }
      return updatedSettingsList;
    });

    setUserCheckedColumns(updatedCheckedColumns);
    setIsAllSelected(updatedCheckedColumns.length === apiColumns.length);
  };

  const handleClose = () => data.deleteNode(id);

  const handleEditColumn = (columnName) => {
    apiColumns.forEach((item) => {
      if (item.column_name == columnName)
        data.handleColumnSetting({ column: item, viewName: selectedView, viewType: "Source" });
    });
  };

  // ── Derived: columns visible after search filter ──────────────────────────
  const filteredApiColumns = apiColumns.filter((item) =>
    item.column_name.toLowerCase().includes(columnSearchTerm.toLowerCase())
  );

  const handleSelectAllColumns = () => {
    // Scoped to filtered columns
    const targetColumns = columnSearchTerm ? filteredApiColumns : apiColumns;

    if (isAllSelected) {
      const targetNames = targetColumns.map((c) => c.column_name);
      setUserCheckedColumns((prev) => prev.filter((c) => !targetNames.includes(c)));
      setSettingsList((prev) => prev.map((item) => ({ ...item, output: "No" })));
    } else {
      const updatedCheckedColumns = [];
      const newSettingList = [];

      targetColumns.forEach((item) => {
        updatedCheckedColumns.push(item.column_name);
        newSettingList.push({ ...defaultSetting, name: item.column_name, type: item.data_type });
      });

      const updatedSettingsList = [...settingsList];
      newSettingList.forEach((newSetting) => {
        const existingIndex = updatedSettingsList.findIndex((s) => s.name === newSetting.name);
        if (existingIndex !== -1) updatedSettingsList[existingIndex] = { ...updatedSettingsList[existingIndex], output: "Yes" };
        else updatedSettingsList.push(newSetting);
      });
      setUserCheckedColumns((prev) => [...new Set([...prev, ...updatedCheckedColumns])]);
      setSettingsList(updatedSettingsList);
    }

    setIsAllSelected((prev) => !prev);
  };

  return (
    <div className="w-80 p-4 mt-1 bg-white rounded-lg shadow-lg relative group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <SquareKanban className="w-5 h-5 text-[#8E77BB]" />
          <h2 className="text-lg font-medium">Source View</h2>
        </div>
        <div className="flex items-center space-x-2">
          {data.queryType === "Complex" && (
            <button onClick={(e) => { e.preventDefault(); data.setShowQueryEditor((prev) => !prev); }}>
              <FileCode className="w-5 h-5 text-[#8E77BB]" />
            </button>
          )}
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1 rounded-md hover:bg-gray-200">
            {isCollapsed ? <ChevronDown className="w-5 h-5 text-black" /> : <ChevronUp className="w-5 h-5 text-black" />}
          </button>
          <button onClick={handleClose} className="p-1 rounded-md hover:bg-gray-200">
            <X className="h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="space-y-4">
          <div className="mb-4">
            <label className="block text-gray-700 mb-1">View</label>
            <SearchableSelect options={apiViews} value={selectedView} onChange={handleChangeView} placeholder="Select View" isLoading={isLoadingViews} />
          </div>

          {isLoadingColumns && (
            <div className="flex items-center justify-center py-4">
              <svg className="animate-spin h-5 w-5 text-[#8E77BB]" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="ml-2 text-sm text-gray-600">Loading columns...</span>
            </div>
          )}

          {!isLoadingColumns && apiColumns && apiColumns.length > 0 && (
            <div className={`mb-4 ${selectedView ? "" : "hidden"}`}>
              <h3 className="font-semibold text-gray-700 mb-2">Select Columns</h3>
              <div className="pt-1 space-y-2">

                {/* ── Column search input ───────────────────────────── */}
                <div className="relative mb-2" onWheelCapture={(e) => e.stopPropagation()}>
                  <Search className="absolute left-2 top-2.5 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    className="w-full pl-7 pr-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#8E77BB]"
                    placeholder="Search columns..."
                    value={columnSearchTerm}
                    onChange={(e) => setColumnSearchTerm(e.target.value)}
                  />
                  {columnSearchTerm && (
                    <button className="absolute right-2 top-2 text-gray-400 hover:text-gray-600" onClick={() => setColumnSearchTerm("")}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center mb-2 cursor-pointer">
                  <input type="checkbox" className="mr-2" checked={isAllSelected} onChange={handleSelectAllColumns} />
                  <label htmlFor="select-all" className="text-gray-700 cursor-pointer">
                    Select All
                  </label>
                </div>

                <div
                  className="max-h-32 overflow-y-auto pr-1 custom-scrollbar"
                  onWheelCapture={(e) => e.stopPropagation()}
                >
                  {filteredApiColumns.length === 0 ? (
                    <div className="text-sm text-gray-400 py-1 text-center">No columns match</div>
                  ) : (
                    filteredApiColumns.map((item) => (
                      <div key={item.column_name} className="flex items-center mb-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={userCheckedColumns.includes(item.column_name)}
                          onChange={() => handleColumnCheck(item)}
                        />
                        <label htmlFor={item.column_name} className="text-gray-700 cursor-pointer">{item.column_name}</label>
                        <Pencil
                          name="edit"
                          onClick={() => handleEditColumn(item.column_name)}
                          className="ml-auto h-4 w-4 text-gray-500 hover:text-gray-700 cursor-pointer"
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => data.handleOk({ userCheckedColumns, viewType: "Source", settings: settingsList, userSelections, apiColumns: getFilterModalColumns() })}
            className="w-full p-3 text-white bg-[rgb(142,119,187)] hover:bg-[rgba(142,119,187,0.8)] rounded-lg text-center font-sans"
          >
            Ok
          </button>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #a0aec0; border-radius: 3px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}

export function ConnectionNode({ id, data }) {
  const { showToast } = useToast();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState("");
  const [selectedSchema, setSelectedSchema] = useState("");
  const [selectedTable, setSelectedTable] = useState("");
  const [apiConnections, setApiConnections] = useState([]);
  const [apiSchemas, setApiSchemas] = useState([]);
  const [apiTables, setApiTables] = useState([]);
  const [apiColumns, setApiColumns] = useState([]);
  const [allowedColumns, setAllowedColumns] = useState([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [isLoadingConnections, setIsLoadingConnections] = useState(false);
  const [isLoadingSchemas, setIsLoadingSchemas] = useState(false);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [isLoadingColumns, setIsLoadingColumns] = useState(false);

  // ── Column search state ───────────────────────────────────────────────────
  const [columnSearchTerm, setColumnSearchTerm] = useState("");

  const { settingsList, setSettingsList, userSelections, setUserSelections, userCheckedColumns, setUserCheckedColumns } = useStateContext();
  const { token, project, decodedToken, setSelectedProject, hostnameV1, hostnameV2 } = useAuth();

  const getFilterModalColumns = () => {
    if (apiColumns.length > 0 && allowedColumns.length > 0) {
      return apiColumns
        .filter((column) => allowedColumns.some((allowedCol) => allowedCol.column_name.toLowerCase() === column.column.toLowerCase()))
        .map((column) => ({ name: column.column, type: column.datatype }));
    }
    return [];
  };

  useEffect(() => {
    const fetchConnections = async () => {
      setIsLoadingConnections(true);
      try {
        const secureQueryResponse = await secureQuery({ user_query: "" }, token);
        const policyIds = secureQueryResponse.matched_policy_ids || [];
        if (policyIds.length === 0) { setApiConnections([]); return; }

        const response = await fetch(`${hostnameV1}/federation/connections/list`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ matched_policy_ids: policyIds }),
        });
        if (!response.ok) throw new Error("Failed to fetch connections");
        const connectionsData = await response.json();
        setApiConnections(connectionsData.map((item) => item.connection_name));
      } catch (error) {
        console.error("Error fetching connections:", error);
        showToast('Failed to load connections', 'error');
        setApiConnections([]);
      } finally {
        setIsLoadingConnections(false);
      }
    };
    fetchConnections();
  }, [token, hostnameV1]);

  useEffect(() => {
    if (selectedConnection) {
      const fetchSchemas = async () => {
        setIsLoadingSchemas(true);
        try {
          const secureQueryResponse = await secureQuery({ user_query: "" }, token);
          const policyIds = secureQueryResponse.matched_policy_ids || [];
          if (policyIds.length === 0) { setApiSchemas([]); return; }

          const response = await fetch(`${hostnameV1}/schemas/list`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ matched_policy_ids: policyIds, connection_name: selectedConnection }),
          });
          if (!response.ok) throw new Error("Failed to fetch schemas");
          const data = await response.json();
          const connectionData = data.find((item) => item[selectedConnection]);
          setApiSchemas(connectionData ? connectionData[selectedConnection] : []);
        } catch (error) {
          console.error("Error fetching schema data:", error);
          showToast('Failed to load schemas', 'error');
          setApiSchemas([]);
        } finally {
          setIsLoadingSchemas(false);
        }
      };
      fetchSchemas();
    }
  }, [selectedConnection, token, hostnameV1]);

  useEffect(() => {
    if (selectedSchema) {
      const fetchTables = async () => {
        setIsLoadingTables(true);
        try {
          const secureQueryResponse = await secureQuery({ user_query: "" }, token);
          const policyIds = secureQueryResponse.matched_policy_ids || [];
          if (policyIds.length === 0) { setApiTables([]); return; }

          const response = await fetch(`${hostnameV1}/tables/list`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ matched_policy_ids: policyIds, connection_name: selectedConnection, schema_name: [selectedSchema] }),
          });
          if (!response.ok) throw new Error("Failed to fetch tables");
          const data = await response.json();
          const schemaData = data.schemas?.find((item) => item.connection_name === selectedConnection && item.schema === selectedSchema);
          setApiTables(schemaData?.tables || []);
        } catch (error) {
          console.error("Error fetching table data:", error);
          showToast('Failed to load tables', 'error');
          setApiTables([]);
        } finally {
          setIsLoadingTables(false);
        }
      };
      fetchTables();
    }
  }, [selectedSchema, selectedConnection, token, hostnameV1]);

  useEffect(() => {
    if (selectedTable) {
      const fetchColumns = async () => {
        setIsLoadingColumns(true);
        try {
          const detailedColumnsResponse = await fetch(
            `${hostnameV1}/${selectedConnection}/schemas/${selectedSchema}/tables/${selectedTable}/columns`,
            { method: "GET", headers: { authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
          );
          if (!detailedColumnsResponse.ok) throw new Error("Failed to fetch detailed columns");
          setApiColumns(await detailedColumnsResponse.json());

          const secureQueryResponse = await secureQuery({ user_query: "" }, token);
          const policyIds = secureQueryResponse.matched_policy_ids || [];
          if (policyIds.length === 0) { setAllowedColumns([]); return; }

          const allowedColumnsResponse = await fetch(`${hostnameV1}/columns/list`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ matched_policy_ids: policyIds, connection_name: selectedConnection, schema_name: [selectedSchema], table_name: [selectedTable] }),
          });
          if (!allowedColumnsResponse.ok) throw new Error("Failed to fetch allowed columns");
          const allowedColumnsData = await allowedColumnsResponse.json();
          if (allowedColumnsData?.columns) {
            const columns = allowedColumnsData.columns
              .find((item) => item.connection_name === selectedConnection && item.schema === selectedSchema && item.table_name === selectedTable)
              ?.columns.map((col) => ({ column_name: col.column_name, datatype: col.metadata.DATA_TYPE })) || [];
            setAllowedColumns(columns);
          } else {
            setAllowedColumns([]);
          }
        } catch (error) {
          console.error("Error fetching columns:", error);
          showToast('Failed to load columns', 'error');
          setApiColumns([]);
          setAllowedColumns([]);
        } finally {
          setIsLoadingColumns(false);
        }
      };
      fetchColumns();
    }
  }, [selectedTable, selectedConnection, selectedSchema, token, hostnameV1]);

  // ── Derived: filtered visible columns ────────────────────────────────────
  const visibleColumns = apiColumns
    .filter((col) => allowedColumns.some((allowedCol) => allowedCol.column_name.toLowerCase() === col.column.toLowerCase()))
    .filter((col) => col.column.toLowerCase().includes(columnSearchTerm.toLowerCase()));

  const handleColumnChange = (column) => {
    const columnName = column.column;
    const dataType = column.datatype;
    const isColumnChecked = userCheckedColumns.includes(columnName);
    const updatedCheckedColumns = isColumnChecked
      ? userCheckedColumns.filter((name) => name !== columnName)
      : [...userCheckedColumns, columnName];

    setSettingsList((prev) => {
      const updatedSettingsList = prev.map((item) => {
        if (item.name === columnName) return { ...item, output: isColumnChecked ? "No" : "Yes" };
        return item;
      });
      if (!isColumnChecked && !prev.some((item) => item.name === columnName)) {
        updatedSettingsList.push({ ...defaultSetting, name: columnName, type: dataType });
      }
      return updatedSettingsList;
    });
    setUserCheckedColumns(updatedCheckedColumns);
    const currentApiColumnsConsidered = apiColumns.filter((col) =>
      allowedColumns.some((allowedCol) => allowedCol.column_name.toLowerCase() === col.column.toLowerCase())
    );
    setIsAllSelected(updatedCheckedColumns.length === currentApiColumnsConsidered.length);
  };

  const handleEditColumn = (columnName) => {
    apiColumns.forEach((item) => {
      if (item.column == columnName) {
        data.handleColumnSetting({ column: item, connection: selectedConnection, schema: selectedSchema, table: selectedTable, viewType: "Connection" });
      }
    });
  };

  const handleSelectAllChange = () => {
    // Scoped to visible (filtered) columns
    const targetColumns = visibleColumns;

    if (isAllSelected) {
      const targetNames = targetColumns.map((c) => c.column);
      setUserCheckedColumns((prev) => prev.filter((c) => !targetNames.includes(c)));
      setSettingsList((prev) => prev.map((item) => ({ ...item, output: "No" })));
    } else {
      const updatedCheckedColumns = targetColumns.map((item) => item.column);
      const newSettingList = targetColumns.map((item) => ({ ...defaultSetting, name: item.column, type: item.datatype }));

      const updatedSettingsList = [...settingsList];
      newSettingList.forEach((newSetting) => {
        const existingIndex = updatedSettingsList.findIndex((s) => s.name === newSetting.name);
        if (existingIndex !== -1) updatedSettingsList[existingIndex] = { ...updatedSettingsList[existingIndex], output: "Yes" };
        else updatedSettingsList.push(newSetting);
      });
      setUserCheckedColumns((prev) => [...new Set([...prev, ...updatedCheckedColumns])]);
      setSettingsList(updatedSettingsList);
    }
    setIsAllSelected((prev) => !prev);
  };

  const resetSelections = () => {
    setApiSchemas([]); setApiTables([]); setApiColumns([]); setAllowedColumns([]);
    setSelectedSchema(""); setSelectedTable(""); setUserCheckedColumns([]);
    setIsAllSelected(false); setSettingsList([]); setColumnSearchTerm("");
  };

  const handleConnectionChange = (event) => {
    setSelectedConnection(event.target.value);
    resetSelections();
    setUserSelections((prev) => {
      const updatedSelections = new Map(prev);
      updatedSelections.set("connection", event.target.value);
      updatedSelections.delete("schema");
      updatedSelections.delete("table");
      return updatedSelections;
    });
  };

  const handleSchemaChange = (event) => {
    setSelectedSchema(event.target.value);
    setApiTables([]); setApiColumns([]); setAllowedColumns([]);
    setSelectedTable(""); setUserCheckedColumns([]); setSettingsList([]);
    setIsAllSelected(false); setColumnSearchTerm("");
    setUserSelections((prev) => {
      const updatedSelections = new Map(prev);
      updatedSelections.set("schema", event.target.value);
      updatedSelections.delete("table");
      return updatedSelections;
    });
  };

  const handleTableChange = (event) => {
    setSelectedTable(event.target.value);
    setApiColumns([]); setAllowedColumns([]); setUserCheckedColumns([]);
    setIsAllSelected(false); setSettingsList([]); setColumnSearchTerm("");
    setUserSelections((prev) => {
      const updatedSelections = new Map(prev);
      updatedSelections.set("table", event.target.value);
      return updatedSelections;
    });
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-lg min-w-[300px] relative group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Cable className="w-5 h-5 text-[#8E77BB]" />
          <h2 className="text-black font-medium">Connection</h2>
        </div>
        <div className="flex items-center space-x-2">
          {data.queryType === "Complex" && (
            <button onClick={(e) => { e.preventDefault(); data.setShowQueryEditor((prev) => !prev); }}>
              <FileCode className="w-5 h-5 text-[#8E77BB]" />
            </button>
          )}
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1 rounded-md hover:bg-gray-200">
            {isCollapsed ? <ChevronDown className="w-5 h-5 text-black" /> : <ChevronUp className="w-5 h-5 text-black" />}
          </button>
          <button onClick={() => data.deleteNode(id)} className="p-1 rounded-md hover:bg-gray-200">
            <X className="h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1">Connection</label>
              <SearchableSelect options={apiConnections} value={selectedConnection} onChange={handleConnectionChange} placeholder="Select a connection" isLoading={isLoadingConnections} />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">Schema</label>
              <SearchableSelect options={apiSchemas} value={selectedSchema} onChange={handleSchemaChange} placeholder="Select a schema" disabled={!selectedConnection} isLoading={isLoadingSchemas} />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">Table</label>
              <SearchableSelect options={apiTables} value={selectedTable} onChange={handleTableChange} placeholder="Select a table" disabled={!selectedSchema} isLoading={isLoadingTables} />
            </div>

            {isLoadingColumns && (
              <div className="flex items-center justify-center py-4">
                <svg className="animate-spin h-5 w-5 text-[#8E77BB]" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="ml-2 text-sm text-gray-600">Loading columns...</span>
              </div>
            )}

            {!isLoadingColumns && selectedTable && allowedColumns.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-black mb-1">Select Columns</label>
                <div className="pt-1 space-y-2">

                  {/* ── Column search input ───────────────────────────── */}
                  <div className="relative mb-2" onWheelCapture={(e) => e.stopPropagation()}>
                    <Search className="absolute left-2 top-2.5 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text"
                      className="w-full pl-7 pr-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#8E77BB]"
                      placeholder="Search columns..."
                      value={columnSearchTerm}
                      onChange={(e) => setColumnSearchTerm(e.target.value)}
                    />
                    {columnSearchTerm && (
                      <button className="absolute right-2 top-2 text-gray-400 hover:text-gray-600" onClick={() => setColumnSearchTerm("")}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="selectAll" checked={isAllSelected} onChange={handleSelectAllChange} className="text-purple-600 focus:ring-purple-500" />
                    <label htmlFor="selectAll" className="text-sm text-gray-700 font-medium">
                      Select All
                    </label>
                  </div>

                  {/* ── Column list ───────────────────────────────────── */}
                  <div
                    className="max-h-32 overflow-y-auto space-y-2 custom-scrollbar"
                    onWheelCapture={(e) => e.stopPropagation()}
                  >
                    {visibleColumns.length === 0 ? (
                      <div className="text-sm text-gray-400 py-1 text-center">No columns match</div>
                    ) : (
                      visibleColumns.map((item) => (
                        <div key={item.column} className="flex items-center mb-2 cursor-pointer">
                          <input
                            type="checkbox"
                            id={item.column}
                            value={item.column}
                            checked={userCheckedColumns.includes(item.column)}
                            onChange={() => handleColumnChange(item)}
                            className="text-purple-600 focus:ring-purple-500 mr-2"
                          />
                          <label htmlFor={item.column} className="text-sm text-gray-700">{item.column}</label>
                          <Pencil
                            name="edit"
                            onClick={() => handleEditColumn(item.column)}
                            className="ml-auto h-4 w-4 text-gray-500 hover:text-gray-700 cursor-pointer"
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
            onClick={() => data.handleOk({ userCheckedColumns, viewType: "Connection", settings: settingsList, userSelections, apiColumns: getFilterModalColumns() })}
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
  );
}