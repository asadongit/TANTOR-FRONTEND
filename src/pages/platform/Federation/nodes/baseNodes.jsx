import { useCallback, useEffect, useRef, useState } from "react";
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
  RefreshCw
} from "lucide-react";
import { useStateContext } from "../context/contextViewProvider";
import { defaultSetting } from "../BaseView/ColumnSettings";
import { useAuth } from "../../../../context/AuthContext";
import { useFederationBaseViewsV2, useFederationViewColumns, useFederationConnectionsBaseNodes, useFederationSchemas, useFederationTables, useFederationColumns, useFederationPolicyIds } from "../../../../hooks/platform/federation";
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

  const filteredOptions = options
    .map((option) => typeof option === "object" ? option.connection_name : option)
    .filter((option) => option.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleSelectClick = () => {
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
    <div ref={containerRef} className="relative w-full">
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
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [apiViews, setApiViews] = useState([]);
  const [selectedView, setSelectedView] = useState("");
  const [apiColumns, setApiColumns] = useState([]);

  // ── Column search state ───────────────────────────────────────────────────
  const [columnSearchTerm, setColumnSearchTerm] = useState("");

  const { token, project, decodedToken, setSelectedProject, hostnameV1, hostnameV2 } = useAuth();
  const { settingsList, setSettingsList, userSelections, setUserSelections, userCheckedColumns, setUserCheckedColumns } = useStateContext();

  const paramsStr = new URLSearchParams({
    view_type: "Base",
    project: (project === "default" || project === "none") ? "default" : project,
    created_by: decodedToken?.preferred_username,
  }).toString();

  const { isFetching: isFetchingPolicies, refetch: refetchPolicyIds } = useFederationPolicyIds();
  const { data: apiViewsRaw, isFetching: isLoadingViews, refetch: refetchViews } = useFederationBaseViewsV2(paramsStr);
  const { data: apiColumnsRaw, isFetching: isLoadingColumns, refetch: refetchColumns } = useFederationViewColumns(selectedView);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = async (e) => {
    e.stopPropagation();
    setIsRefreshing(true);
    try {
      await refetchPolicyIds();
      const promises = [refetchViews()];
      if (selectedView) promises.push(refetchColumns());
      await Promise.all(promises);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (apiViewsRaw?.result) {
      setApiViews(apiViewsRaw.result.map(v => v.view_name).sort((a, b) => a.localeCompare(b)));
    }
  }, [apiViewsRaw]);

  useEffect(() => {
    if (apiColumnsRaw) {
      setApiColumns(apiColumnsRaw);
    }
  }, [apiColumnsRaw]);

  const getFilterModalColumns = () =>
    apiColumns.length > 0 ? apiColumns.map((column) => ({ name: column.column_name, type: column.data_type })) : [];

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
        if (item.name === columnName) return { ...item, originalOutput: isColumnChecked ? "No" : "Yes" };
        return item;
      });
      if (!isColumnChecked && !prev.some((item) => item.name === columnName)) {
        updatedSettingsList.push({ ...defaultSetting, id: Date.now().toString(36) + Math.random().toString(36).substr(2), name: columnName, type: dataType, originalOutput: "Yes" });
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
      setSettingsList((prev) => prev.map((item) => ({ ...item, originalOutput: "No" })));
    } else {
      const updatedCheckedColumns = [];
      const newSettingList = [];

      targetColumns.forEach((item) => {
        updatedCheckedColumns.push(item.column_name);
        newSettingList.push({ ...defaultSetting, id: Date.now().toString(36) + Math.random().toString(36).substr(2), name: item.column_name, type: item.data_type, originalOutput: "Yes" });
      });

      const updatedSettingsList = [...settingsList];
      newSettingList.forEach((newSetting) => {
        const existingIndex = updatedSettingsList.findIndex((s) => s.name === newSetting.name);
        if (existingIndex !== -1) updatedSettingsList[existingIndex] = { ...updatedSettingsList[existingIndex], originalOutput: "Yes" };
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
            <div className="flex items-center space-x-2 mb-1">
              <label className="block text-gray-700">View</label>
              <button onClick={handleRefresh} className="p-1 rounded-md hover:bg-gray-200" title="Refresh Views">
                <RefreshCw className={`h-3.5 w-3.5 text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <SearchableSelect id="view" openDropdownId={openDropdownId} setOpenDropdownId={setOpenDropdownId} options={apiViews} value={selectedView} onChange={handleChangeView} placeholder="Select View" isLoading={isLoadingViews || isFetchingPolicies} />
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
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [selectedConnection, setSelectedConnection] = useState("");
  const [selectedSchema, setSelectedSchema] = useState("");
  const [selectedTable, setSelectedTable] = useState("");
  const [apiConnections, setApiConnections] = useState([]);
  const [apiSchemas, setApiSchemas] = useState([]);
  const [apiTables, setApiTables] = useState([]);
  const [apiColumns, setApiColumns] = useState([]);
  const [allowedColumns, setAllowedColumns] = useState([]);
  const [isAllSelected, setIsAllSelected] = useState(false);

  // ── Column search state ───────────────────────────────────────────────────
  const [columnSearchTerm, setColumnSearchTerm] = useState("");

  const { settingsList, setSettingsList, userSelections, setUserSelections, userCheckedColumns, setUserCheckedColumns } = useStateContext();
  const { token, project, decodedToken, setSelectedProject, hostnameV1, hostnameV2 } = useAuth();

  const { isFetching: isFetchingPolicies, refetch: refetchPolicyIds } = useFederationPolicyIds();
  const { data: apiConnectionsRaw, isFetching: isLoadingConnections, refetch: refetchConnections } = useFederationConnectionsBaseNodes();
  const { data: apiSchemasRaw, isFetching: isLoadingSchemas, refetch: refetchSchemas } = useFederationSchemas(selectedConnection);
  const { data: apiTablesRaw, isFetching: isLoadingTables, refetch: refetchTables } = useFederationTables(selectedConnection, selectedSchema);
  const { data: apiColumnsRaw, isFetching: isLoadingColumns, refetch: refetchColumns } = useFederationColumns(selectedConnection, selectedSchema, selectedTable);

  const [isRefreshing, setIsRefreshing] = useState(false);
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
    if (apiConnectionsRaw) setApiConnections(apiConnectionsRaw);
  }, [apiConnectionsRaw]);

  useEffect(() => {
    if (apiSchemasRaw) setApiSchemas(apiSchemasRaw);
  }, [apiSchemasRaw]);

  useEffect(() => {
    if (apiTablesRaw) setApiTables(apiTablesRaw);
  }, [apiTablesRaw]);

  useEffect(() => {
    if (apiColumnsRaw) {
      const mapped = apiColumnsRaw.map(c => ({ column: c.column, datatype: c.datatype }));
      setApiColumns(mapped);
      // We must also populate allowedColumns, mapping to column_name to match original behavior
      setAllowedColumns(apiColumnsRaw.map(c => ({ column_name: c.column, datatype: c.datatype })));
    }
  }, [apiColumnsRaw]);

  const getFilterModalColumns = () => {
    if (apiColumns.length > 0 && allowedColumns.length > 0) {
      return apiColumns
        .filter((column) => allowedColumns.some((allowedCol) => allowedCol?.column_name?.toLowerCase() === column?.column?.toLowerCase()))
        .map((column) => ({ name: column.column, type: column.datatype }));
    }
    return [];
  };

  // ── Derived: filtered visible columns ────────────────────────────────────
  const visibleColumns = apiColumns
    .filter((col) => allowedColumns.some((allowedCol) => allowedCol?.column_name?.toLowerCase() === col?.column?.toLowerCase()))
    .filter((col) => col?.column?.toLowerCase().includes(columnSearchTerm?.toLowerCase() || ""));
      
  const handleColumnChange = (column) => {
    const columnName = column.column;
    const dataType = column.datatype;
    const isColumnChecked = userCheckedColumns.includes(columnName);
    const updatedCheckedColumns = isColumnChecked
      ? userCheckedColumns.filter((name) => name !== columnName)
      : [...userCheckedColumns, columnName];

    setSettingsList((prev) => {
      const updatedSettingsList = prev.map((item) => {
        if (item.name === columnName) return { ...item, originalOutput: isColumnChecked ? "No" : "Yes" };
        return item;
      });
      if (!isColumnChecked && !prev.some((item) => item.name === columnName)) {
        updatedSettingsList.push({ ...defaultSetting, id: Date.now().toString(36) + Math.random().toString(36).substr(2), name: columnName, type: dataType, originalOutput: "Yes" });
      }
      return updatedSettingsList;
    });
    setUserCheckedColumns(updatedCheckedColumns);
    const currentApiColumnsConsidered = apiColumns.filter((col) =>
      allowedColumns.some((allowedCol) => allowedCol?.column_name?.toLowerCase() === col?.column?.toLowerCase())
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
      setSettingsList((prev) => prev.map((item) => ({ ...item, originalOutput: "No" })));
    } else {
      const updatedCheckedColumns = targetColumns.map((item) => item.column);
      const newSettingList = targetColumns.map((item) => ({ ...defaultSetting, id: Date.now().toString(36) + Math.random().toString(36).substr(2), name: item.column, type: item.datatype, originalOutput: "Yes" }));

      const updatedSettingsList = [...settingsList];
      newSettingList.forEach((newSetting) => {
        const existingIndex = updatedSettingsList.findIndex((s) => s.name === newSetting.name);
        if (existingIndex !== -1) updatedSettingsList[existingIndex] = { ...updatedSettingsList[existingIndex], originalOutput: "Yes" };
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
              <div className="flex items-center space-x-2 mb-1">
                <label className="block text-sm font-medium text-black">Connection</label>
                <button onClick={handleRefresh} className="p-1 rounded-md hover:bg-gray-200" title="Refresh Connections">
                  <RefreshCw className={`h-3.5 w-3.5 text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <SearchableSelect id="connection" openDropdownId={openDropdownId} setOpenDropdownId={setOpenDropdownId} options={apiConnections} value={selectedConnection} onChange={handleConnectionChange} placeholder="Select a connection" isLoading={isLoadingConnections || isFetchingPolicies} />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">Schema</label>
              <SearchableSelect id="schema" openDropdownId={openDropdownId} setOpenDropdownId={setOpenDropdownId} options={apiSchemas} value={selectedSchema} onChange={handleSchemaChange} placeholder="Select a schema" disabled={!selectedConnection} isLoading={isLoadingSchemas} />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">Table</label>
              <SearchableSelect id="table" openDropdownId={openDropdownId} setOpenDropdownId={setOpenDropdownId} options={apiTables} value={selectedTable} onChange={handleTableChange} placeholder="Select a table" disabled={!selectedSchema} isLoading={isLoadingTables} />
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