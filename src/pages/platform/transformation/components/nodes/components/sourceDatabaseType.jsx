import React, { useMemo, useState, useRef, useEffect } from "react";
import { Loader, Plus, X } from "lucide-react";
import { DATE_FORMATS } from "../../drawer/operations/timeZoneFormatMapping";

export const SourceDatabaseType = ({
  selectedConnection,
  setSelectedConnection,
  selectedSchema,
  setSelectedSchema,
  selectedTable,
  setSelectedTable,
  selectedColumns,
  setSelectedColumns,
  selectedObjectType,
  setTableSelections,
  selectedPreProcedures,
  selectedPostProcedures,
  preProcedureDropdownOpen,
  setPreProcedureDropdownOpen,
  postProcedureDropdownOpen,
  setPostProcedureDropdownOpen,
  preProcedureSearch,
  setPreProcedureSearch,
  postProcedureSearch,
  setPostProcedureSearch,
  enableCountLogging,
  setEnableCountLogging,
  customQuery,
  setCustomQuery,
  fileColumns,
  alias,
  setAlias,
  connections,
  schemas,
  tables,
  columns,
  loading,
  dataFetchStatus,
  connectionSearch,
  setConnectionSearch,
  schemaSearch,
  setSchemaSearch,
  tableSearch,
  setTableSearch,
  columnSearch,
  setColumnSearch,
  connectionDropdownRef,
  schemaDropdownRef,
  tableDropdownRef,
  connectionDropdownOpen,
  setConnectionDropdownOpen,
  schemaDropdownOpen,
  setSchemaDropdownOpen,
  tableDropdownOpen,
  setTableDropdownOpen,
  filteredConnections,
  filteredSchemas,
  filteredTables,
  filteredColumns,
  filteredPreProcedures,
  filteredPostProcedures,
  fetchSchemas,
  fetchTablesAndColumns,
  fetchColumns,
  handleObjectTypeChange,
  addPreProcedureDropdown,
  addPostProcedureDropdown,
  removePreProcedureDropdown,
  removePostProcedureDropdown,
  handlePreProcedureSelect,
  handlePostProcedureSelect,
  openParametersModal,
  addFileColumn,
  removeFileColumn,
  updateFileColumn,
  id,
  data,
  dispatch,
  ACTION_TYPES,
  setColumns,
  sourceQueryTable,
  setSourceQueryTable,
  sourceQueryTableDropdownOpen,
  setSourceQueryTableDropdownOpen,
}) => {
  // Build a Set for O(1) column checked lookups instead of O(n) .some() per row
  const checkedSet = useMemo(() => {
    const s = new Set();
    selectedColumns.forEach(c => s.add(`${c.name}||${c.datatype}`));
    return s;
  }, [selectedColumns]);

  // Incremental rendering: start with 50 visible columns, expand on scroll
  const COLUMN_PAGE_SIZE = 50;
  const [visibleCount, setVisibleCount] = useState(COLUMN_PAGE_SIZE);
  const columnListRef = useRef(null);

  // Reset visible count when search or table changes
  useEffect(() => {
    setVisibleCount(COLUMN_PAGE_SIZE);
    if (columnListRef.current) columnListRef.current.scrollTop = 0;
  }, [columnSearch, selectedTable]);

  const handleColumnListScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 60) {
      setVisibleCount(prev => Math.min(prev + COLUMN_PAGE_SIZE, filteredColumns.length));
    }
  };

  const [sourceQueryTableSearch, setSourceQueryTableSearch] = useState("");

  const [dateFormatModalOpen, setDateFormatModalOpen] = useState(false);
  const [selectedColumnForFormat, setSelectedColumnForFormat] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState("");
  const [customFormatInput, setCustomFormatInput] = useState("");


  const handleDatatypeChange = (columnId, value) => {
    updateFileColumn(columnId, 'datatype', value);
    if (['date', 'datetime', 'timestamp'].includes(value)) {
      const column = fileColumns.find(col => col.id === columnId);
      const existingFormat = column?.format || "";
      const isPredefined = DATE_FORMATS.some(df => df.format === existingFormat);
      if (isPredefined) {
        setSelectedFormat(existingFormat);
        setCustomFormatInput("");
      } else {
        setSelectedFormat("custom");
        setCustomFormatInput(existingFormat);
      }
      setSelectedColumnForFormat(columnId);
      setDateFormatModalOpen(true);
    }
  };

  const handleFormatSave = () => {
    if (selectedColumnForFormat) {
      const formatToSave = selectedFormat === "custom" ? customFormatInput : selectedFormat;
      updateFileColumn(selectedColumnForFormat, 'format', formatToSave);
    }
    setDateFormatModalOpen(false);
    setSelectedColumnForFormat(null);
    setSelectedFormat("");
    setCustomFormatInput("");
  };

  const handleFormatCancel = () => {
    setDateFormatModalOpen(false);
    setSelectedColumnForFormat(null);
    setSelectedFormat("");
    setCustomFormatInput("");
  };

  return (
    <>
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
            <div className="flex gap-2">
              <button
                type="button"
                className={`flex-1 p-1.5 text-[11px] rounded-sm border text-center focus:outline-none focus:ring-1 focus:ring-gray-400 ${
                  selectedObjectType === "tables"
                    ? "bg-[#8E77BB] text-white border-[#8E77BB]"
                    : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
                }`}
                onClick={() => handleObjectTypeChange("tables")}
              >
                Tables
              </button>
              <button
                type="button"
                className={`flex-1 p-1.5 text-[11px] rounded-sm border text-center focus:outline-none focus:ring-1 focus:ring-gray-400 ${
                  selectedObjectType === "source-query"
                    ? "bg-[#8E77BB] text-white border-[#8E77BB]"
                    : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
                }`}
                onClick={() => handleObjectTypeChange("source-query")}
              >
                Source Query
              </button>
              <button
                type="button"
                className={`flex-1 p-1.5 text-[11px] rounded-sm border text-center focus:outline-none focus:ring-1 focus:ring-gray-400 ${
                  selectedObjectType === "procedures"
                    ? "bg-[#8E77BB] text-white border-[#8E77BB]"
                    : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
                }`}
                onClick={() => handleObjectTypeChange("procedures")}
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
                          onClick={async () => {
                            setSelectedTable(table.table_name);
                            setSelectedColumns([]);
                            setTableDropdownOpen(false);
                            setTableSelections({
                              selectedTable: table.table_name,
                              selectedColumns: []
                            });
                            const cols = await fetchColumns(
                              selectedConnection.name,
                              selectedSchema,
                              table.table_name
                            );
                            setColumns(cols);
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

          {selectedObjectType === "source-query" && (
            <div>
              <div className="mt-2">
                <label className="text-xs font-semibold text-black mb-0.5 block">
                  Table
                </label>
                <div className="relative">
                  <button
                    type="button"
                    className="w-full p-1.5 text-[11px] bg-white rounded-sm border border-gray-300 text-gray-800 text-left flex justify-between items-center focus:outline-none focus:ring-1 focus:ring-gray-400"
                    onClick={() => setSourceQueryTableDropdownOpen(v => !v)}
                  >
                    {sourceQueryTable || "Select table"}
                    <span className="ml-auto pl-2">&#9662;</span>
                  </button>
                  {sourceQueryTableDropdownOpen && (
                    <div className="absolute z-10 left-0 right-0 bg-white border border-gray-300 rounded shadow mt-1 max-h-[150px] overflow-y-auto">  
                      <input
                        type="search"
                        placeholder="Search tables..."
                        className="w-full p-1 text-[11px] text-black border-b border-gray-200 sticky top-0"
                        value={sourceQueryTableSearch}
                        onChange={e => setSourceQueryTableSearch(e.target.value)}
                        autoFocus
                      />
                      {filteredTables
                        .filter(t => t.table_name?.toLowerCase().includes(sourceQueryTableSearch.toLowerCase()))
                        .map((table) => (
                          <div
                            key={table.table_name}
                            className={`p-2 text-[11px] text-black cursor-pointer hover:bg-gray-100 ${
                              sourceQueryTable === table.table_name ? "bg-gray-100 font-medium" : ""
                            }`}
                            onClick={() => {
                              setSourceQueryTable(table.table_name);
                              setSourceQueryTableDropdownOpen(false);
                              setSourceQueryTableSearch("");
                            }}
                          >
                            {table.table_name}
                          </div>
                        ))
                      }
                      {filteredTables.filter(t =>
                        t.table_name?.toLowerCase().includes(sourceQueryTableSearch.toLowerCase())
                      ).length === 0 && (
                        <div className="p-2 text-[11px] text-gray-500">No tables found</div>
                      )}                  
                      
                      {filteredTables.map((table) => (
                        <div
                          key={table.table_name}
                          className={`p-2 text-[11px] text-black cursor-pointer hover:bg-gray-100 ${
                            sourceQueryTable === table.table_name ? "bg-gray-100 font-medium" : ""
                          }`}
                          onClick={() => {
                            setSourceQueryTable(table.table_name);
                            setSourceQueryTableDropdownOpen(false);
                          }}
                        >
                          {table.table_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {(
                <div className="mt-4">
                  <label className="text-xs font-semibold text-black mb-0.5 block">
                    Query
                  </label>
                  <textarea
                    placeholder={`Enter your SQL query for ${selectedTable}...`}
                    className="w-full p-2 text-[11px] bg-white rounded-sm border border-gray-300 text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 resize-vertical min-h-[80px]"
                    value={customQuery}
                    onChange={(e) => setCustomQuery(e.target.value)}
                  />
                </div>
              )}

              {(
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-black">
                      Column Mapping
                    </label>
                    <button
                      type="button"
                      onClick={addFileColumn}
                      className="flex items-center justify-center w-4 h-4 bg-[#8E77BB] text-white rounded-full hover:bg-[#7A6BA3] focus:outline-none"
                      title="Add column"
                    >
                      <Plus size={10} />
                    </button>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-sm p-2">
                    {fileColumns.map((column) => (
                      <div key={column.id} className="flex gap-2 items-center">
                        <input
                          type="text"
                          className="flex-1 p-1.5 text-[11px] bg-white rounded-sm border border-gray-300 text-gray-800"
                          value={column.name}
                          onChange={e => updateFileColumn(column.id, 'name', e.target.value)}
                          placeholder="Column name"
                        />
                        <select
                          className="flex-1 p-1.5 text-[11px] bg-white rounded-sm border border-gray-300 text-gray-800"
                          value={column.datatype === 'custom' ? (column.customDatatype || 'custom') : column.datatype}
                          // onChange={e => updateFileColumn(column.id, 'datatype', e.target.value)}
                          onChange={e => handleDatatypeChange(column.id, e.target.value)}

                        >
                          <option value="string">string</option>
                          <option value="integer">integer</option>
                          <option value="float">float</option>
                          <option value="boolean">boolean</option>
                          <option value="date">date</option>
                          <option value="datetime">datetime</option>
                                          <option value="timestamp">timestamp</option>

                          <option value="custom">custom</option>
                          {column.datatype === 'custom' && column.customDatatype && (
                            <option value={column.customDatatype}>{column.customDatatype}</option>
                          )}
                        </select>
                        {fileColumns.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeFileColumn(column.id)}
                            className="flex items-center justify-center w-6 h-6 text-red-500 hover:text-red-700 focus:outline-none"
                            title="Remove column"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {(selectedTable || selectedObjectType === "procedures" || selectedObjectType === "source-query") && (
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
                        <div
                          className={`relative ${procedureItem.procedure ? 'flex-1' : 'w-full'}`}
                          data-pre-procedure-ref={procedureItem.id}
                          style={{ minWidth: 0, maxWidth: '180px', width: '180px' }}
                        >
                          <button
                            type="button"
                            className="w-full p-1.5 text-[11px] bg-white rounded-sm border border-gray-300 text-black text-left flex justify-between items-center focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 pr-8"
                            style={{
                              minWidth: 0,
                              maxWidth: '180px',
                              width: '180px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                            onClick={() => setPreProcedureDropdownOpen(prev => ({ ...prev, [procedureItem.id]: !prev[procedureItem.id] }))}
                            title={procedureItem.procedure ? procedureItem.procedure.procedure_name : 'Select pre procedure'}
                          >
                            <span
                              className="truncate block"
                              style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                              title={procedureItem.procedure ? procedureItem.procedure.procedure_name : 'Select pre procedure'}
                            >
                              {procedureItem.procedure
                                ? procedureItem.procedure.procedure_name
                                : 'Select pre procedure'}
                            </span>
                            <span className="ml-auto pl-2">&#9662;</span>
                          </button>
                          {preProcedureDropdownOpen[procedureItem.id] && (
                            <div className="absolute z-50 top-full left-0 right-0 bg-white border border-gray-300 rounded shadow mt-1 max-h-20 overflow-y-auto">
                              <input
                                type="search"
                                placeholder="Search procedures..."
                                className="w-full p-1 text-[11px] text-black border-b border-gray-200"
                                value={preProcedureSearch}
                                onChange={e => setPreProcedureSearch(e.target.value)}
                                autoFocus
                              />
                              {filteredPreProcedures.length === 0 ? (
                                <div className="p-2 text-[11px] text-gray-500">No procedures available</div>
                              ) : (
                                filteredPreProcedures.map((procedure, idx) => (
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
                        <div
                          className={`relative ${procedureItem.procedure ? 'flex-1' : 'w-full'}`}
                          data-post-procedure-ref={procedureItem.id}
                          style={{ minWidth: 0, maxWidth: '180px', width: '180px' }}
                        >
                          <button
                            type="button"
                            className="w-full p-1.5 text-[11px] bg-white rounded-sm border border-gray-300 text-black text-left flex justify-between items-center focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 pr-8"
                            style={{
                              minWidth: 0,
                              maxWidth: '180px',
                              width: '180px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                            onClick={() => setPostProcedureDropdownOpen(prev => ({ ...prev, [procedureItem.id]: !prev[procedureItem.id] }))}
                            title={procedureItem.procedure ? procedureItem.procedure.procedure_name : 'Select post procedure'}
                          >
                            <span
                              className="truncate block"
                              style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                              title={procedureItem.procedure ? procedureItem.procedure.procedure_name : 'Select post procedure'}
                            >
                              {procedureItem.procedure
                                ? procedureItem.procedure.procedure_name
                                : 'Select post procedure'}
                            </span>
                            <span className="ml-auto pl-2">&#9662;</span>
                          </button>
                          {postProcedureDropdownOpen[procedureItem.id] && (
                            <div className="absolute z-50 top-full left-0 right-0 bg-white border border-gray-300 rounded shadow mt-1 max-h-20 overflow-y-auto">
                              <input
                                type="search"
                                placeholder="Search procedures..."
                                className="w-full p-1 text-[11px] text-black border-b border-gray-200"
                                value={postProcedureSearch}
                                onChange={e => setPostProcedureSearch(e.target.value)}
                                autoFocus
                              />
                              {filteredPostProcedures.length === 0 ? (
                                <div className="p-2 text-[11px] text-gray-500">No procedures available</div>
                              ) : (
                                filteredPostProcedures.map((procedure, idx) => (
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
                  Columns ({selectedColumns.length}/{columns.length})
                </label>
                <input
                  type="search"
                  placeholder="Search columns..."
                  className="ml-2 p-1 text-[11px] text-black border border-gray-400 rounded-sm w-32"
                  value={columnSearch}
                  onChange={e => setColumnSearch(e.target.value)}
                />
              </div>

              <div
                ref={columnListRef}
                className="max-h-40 mt-2 overflow-y-auto border text-black border-gray-300 rounded-sm p-2"
                onScroll={handleColumnListScroll}
              >
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

                {filteredColumns.slice(0, visibleCount).map((column, idx) => {
                  const isChecked = checkedSet.has(`${column.column_name}||${column.DATA_TYPE}`);
                  return (
                    <div key={column.column_name} className="mb-1.5">
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
                {visibleCount < filteredColumns.length && (
                  <div className="text-center py-1 text-[10px] text-gray-400">
                    Scroll for more ({filteredColumns.length - visibleCount} remaining)
                  </div>
                )}
                {filteredColumns.length === 0 && (
                  <div className="text-center py-2 text-[11px] text-gray-500">
                    No columns match your search
                  </div>
                )}
              </div>
            </div>
          ) : selectedTable && columns.length === 0 ? (
            <div>
              <div className="flex items-center justify-center py-4">
                <div className="text-center">
                  <Loader size={16} className="animate-spin text-[#8E77BB] mx-auto mb-2" />
                  <div className="text-[11px] text-gray-500">Loading columns...</div>
                </div>
              </div>
            </div>
          ) : selectedTable && selectedObjectType !== "source-query" ? (
            <div className="text-center py-2 text-[11px] text-gray-500">
              No columns found for this table
            </div>
          ) : null}

          {((selectedTable) ||
            (selectedObjectType === "source-query")) && (
            <div className="mt-2">
              <label className="flex items-center text-xs font-semibold text-black">
                <input
                  type="checkbox"
                  className="mr-1.5 h-3.5 w-3.5"
                  checked={enableCountLogging}
                  onChange={(e) => {
                    const newValue = e.target.checked;
                    setEnableCountLogging(newValue);
                    if (data.onDataChange) {
                      data.onDataChange({ enableCountLogging: newValue });
                    }
                    if (window.allNodes) {
                      const nodeIndex = window.allNodes.findIndex(n => n.id === id);
                      if (nodeIndex !== -1) {
                        window.allNodes[nodeIndex].data.enableCountLogging = newValue;
                      }
                    }
                    dispatch({
                      type: ACTION_TYPES.UPDATE_SOURCE,
                      payload: {
                        id: id,
                        data: { enableCountLogging: newValue }
                      }
                    });
                    window.allNodesLastUpdate = Date.now();
                    if (window.triggerSidebarUpdate) {
                      window.triggerSidebarUpdate();
                    }
                  }}
                />
                <span>Enable Count Logging</span>
              </label>
            </div>
          )}
        </>
      )}
      {dateFormatModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-4 w-[400px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-black">Select Date Format</h3>
              <button onClick={handleFormatCancel} className="text-gray-400 hover:text-gray-600 focus:outline-none">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-black mb-1 block">
                  Choose a date format:
                </label>
                <select
                  className="w-full p-2 text-sm bg-white rounded border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
                  value={selectedFormat}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedFormat(value);
                    if (value !== "custom") setCustomFormatInput("");
                  }}
                >
                  <option value="">Select format</option>
                  {DATE_FORMATS.map((df) => (
                    <option key={df.format} value={df.format}>
                      {df.format} - {df.example}
                    </option>
                  ))}
                  <option value="custom">Custom</option>
                </select>
              </div>
              {selectedFormat === "custom" && (
                <div>
                  <label className="text-sm font-medium text-black mb-1 block">
                    Enter custom date format:
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 text-sm bg-white rounded border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
                    value={customFormatInput}
                    onChange={(e) => setCustomFormatInput(e.target.value)}
                    placeholder="e.g., yyyy-MM-dd HH:mm:ss"
                  />
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={handleFormatCancel}
                className="px-3 py-1.5 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleFormatSave}
                className={`px-3 py-1.5 text-sm rounded focus:outline-none focus:ring-2 ${
                  (selectedFormat === "custom" ? customFormatInput.trim() !== "" : selectedFormat.trim() !== "")
                    ? "bg-[#8E77BB] text-white hover:bg-[#7A6BA3] focus:ring-[#8E77BB]"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
                disabled={selectedFormat === "custom" ? customFormatInput.trim() === "" : selectedFormat.trim() === ""}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};