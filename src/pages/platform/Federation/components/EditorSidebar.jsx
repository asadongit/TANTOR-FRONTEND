import {
  Search,
  ChevronRight,
  ChevronDown,
  Database,
  Table,
  Type,
  Hash,
  X,
  RefreshCw,
  Eye,
} from "lucide-react";

/* ─────────────────────────────────────────────
   Small reusable spinner (matches purple theme)
──────────────────────────────────────────────── */
const Spinner = ({ size = 18 }) => (
  <div
    className="rounded-full border-2 border-[#e0d9f5] border-t-[#8e78b7] animate-spin"
    style={{ width: size, height: size, flexShrink: 0 }}
  />
);

/* ─────────────────────────────────────────────
   Main Sidebar component
──────────────────────────────────────────────── */
export default function EditorSidebar({
  /* dimensions */
  sidebarWidth,
  /* data */
  connectionsLoading,
  displayedConnections,
  displayedViews,
  originalViews,
  schemas,
  tables,
  columns,
  expandedItems,
  selectedConnection,
  selectedView,
  /* search */
  searchTerm,
  setSearchTerm,
  /* handlers */
  onRefresh,
  onConnectionClick,
  onSchemaClick,
  onTableClick,
  onTableDoubleClick,
  onColumnClick,
  onViewClick,
  onViewDoubleClick,
  /* query running flag (prevents double-click during load) */
  queryLoading,
}) {
  return (
    <aside
      className="flex flex-col bg-white overflow-hidden flex-shrink-0"
      style={{ width: sidebarWidth }}
    >
      {/* ── Header: title + refresh ─────────────────────────── */}
      <div className="flex items-center justify-between px-3 pt-2.5 pb-2 border-b border-gray-100 flex-shrink-0">
        <span className="text-[11px] font-bold tracking-widest text-gray-400 uppercase select-none">
          Explorer
        </span>

        <button
          type="button"
          title="Refresh connections & views"
          onClick={onRefresh}
          className="p-1 rounded text-gray-400 hover:text-[#8e78b7] hover:bg-[#f0edf8] transition-colors"
        >
          <RefreshCw size={13} />
        </button>
      </div>

      {/* ── Unified search box ──────────────────────────────── */}
      <div className="px-2.5 py-2 flex-shrink-0 relative">
        <Search
          size={12}
          className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search connections &amp; views…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-7 pr-7 py-1.5 rounded-md border border-gray-200 text-[13.5px] text-gray-600 placeholder-gray-300 bg-white outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] transition"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* ── Scrollable tree ─────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto px-1.5 pb-3 qe-scroll"
        style={{ scrollbarWidth: "thin" }}
      >
        {/* Loading state — single spinner for both connections & views */}
        {connectionsLoading ? (
          <div className="flex justify-center pt-8">
            <Spinner size={22} />
          </div>
        ) : (
          <>
            {/* ── CONNECTIONS section ─────────────────────── */}
            <div className="mt-1 mb-0.5">
              <p className="text-[11.5px] font-bold tracking-widest uppercase text-gray-400 px-2 py-1 select-none">
                Connections
              </p>

              {displayedConnections.length === 0 ? (
                <p className="text-[13px] text-gray-400 px-2 py-1">
                  {searchTerm ? "No matching connections" : "No connections found"}
                </p>
              ) : (
                displayedConnections.map((conn) => {
                  const connId = `conn-${conn.connection_name}`;
                  const connSchemas = schemas[conn.connection_name];
                  const isConnExp = expandedItems[connId];
                  return (
                    <div key={conn.connection_name}>
                      {/* Connection row */}
                      <div
                        className={`qe-item flex items-center gap-1.5 px-2 py-1.5 rounded cursor-pointer text-[14px] font-medium select-none transition-colors hover:bg-[#f0edf8] ${
                          selectedConnection === conn.connection_name
                            ? "bg-[#ede9f6] text-[#79669c]"
                            : ""
                        }`}
                        style={selectedConnection === conn.connection_name ? undefined : { color: "#4a5170" }}
                        onClick={(e) => onConnectionClick(e, conn.connection_name)}
                      >
                        {isConnExp ? (
                          <ChevronDown size={12} className="text-[#8e78b7] flex-shrink-0" />
                        ) : (
                          <ChevronRight size={12} className="text-gray-400 flex-shrink-0" />
                        )}
                        <Database size={12} className="text-[#8e78b7] flex-shrink-0" />
                        <span
                          className="truncate flex-1"
                          title={conn.connection_name}
                        >
                          {conn.connection_name}
                        </span>
                      </div>

                      {/* Schemas */}
                      {isConnExp && (
                        <div className="ml-4 border-l border-gray-100 pl-1.5">
                          {connSchemas === "loading" && (
                            <div className="flex items-center gap-1.5 px-2 py-1">
                              <Spinner size={12} />
                              <span className="text-[12px] text-gray-400">Loading…</span>
                            </div>
                          )}
                          {connSchemas === "error" && (
                            <p className="text-[12px] text-red-500 px-2 py-1">
                              Error loading schemas
                            </p>
                          )}
                          {Array.isArray(connSchemas) && connSchemas.length === 0 && (
                            <p className="text-[12px] text-gray-400 px-2 py-1">No schemas</p>
                          )}
                          {Array.isArray(connSchemas) &&
                            connSchemas.map((schema, si) => {
                              const schId = `schema-${conn.connection_name}-${schema}`;
                              const tblData = tables[`${conn.connection_name}-${schema}`];
                              const isSchExp = expandedItems[schId];
                              return (
                                <div key={`${schema}-${si}`}>
                                  <div
                                    className="qe-item flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer text-[13.5px] text-gray-700 hover:bg-[#f0edf8] transition-colors select-none"
                                    onClick={(e) =>
                                      onSchemaClick(e, conn.connection_name, schema)
                                    }
                                  >
                                    {isSchExp ? (
                                      <ChevronDown size={11} className="text-[#8e78b7] flex-shrink-0" />
                                    ) : (
                                      <ChevronRight size={11} className="text-gray-400 flex-shrink-0" />
                                    )}
                                    <Database size={11} className="text-[#8e78b7] flex-shrink-0" />
                                    <span className="truncate flex-1" title={schema}>
                                      {schema}
                                    </span>
                                  </div>

                                  {/* Tables */}
                                  {isSchExp && (
                                    <div className="ml-3.5 border-l border-gray-100 pl-1.5">
                                      {tblData === "loading" && (
                                        <div className="flex items-center gap-1.5 px-2 py-1">
                                          <Spinner size={11} />
                                          <span className="text-[12px] text-gray-400">Loading…</span>
                                        </div>
                                      )}
                                      {tblData === "error" && (
                                        <p className="text-[12px] text-red-500 px-2 py-1">Error</p>
                                      )}
                                      {Array.isArray(tblData) && tblData.length === 0 && (
                                        <p className="text-[12px] text-gray-400 px-2 py-1">
                                          No tables
                                        </p>
                                      )}
                                      {Array.isArray(tblData) &&
                                        tblData.map((table, ti) => {
                                          const tblId = `table-${conn.connection_name}-${schema}-${table}`;
                                          const colData =
                                            columns[`${conn.connection_name}-${schema}-${table}`];
                                          const isTblExp = expandedItems[tblId];
                                          return (
                                            <div key={`${table}-${ti}`}>
                                              <div
                                                className="qe-item flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer text-[13.5px] text-gray-700 hover:bg-[#f0edf8] transition-colors select-none"
                                                onClick={(e) =>
                                                  onTableClick(e, conn.connection_name, schema, table)
                                                }
                                                onDoubleClick={() => {
                                                  if (!queryLoading)
                                                    onTableDoubleClick(
                                                      conn.connection_name,
                                                      schema,
                                                      table
                                                    );
                                                }}
                                              >
                                                {isTblExp ? (
                                                  <ChevronDown size={11} className="text-[#8e78b7] flex-shrink-0" />
                                                ) : (
                                                  <ChevronRight size={11} className="text-gray-400 flex-shrink-0" />
                                                )}
                                                <Table size={11} className="text-[#8e78b7] flex-shrink-0" />
                                                <span className="truncate flex-1" title={table}>
                                                  {table}
                                                </span>
                                              </div>

                                              {/* Columns */}
                                              {isTblExp && (
                                                <div className="ml-3.5 border-l border-gray-100 pl-1.5">
                                                  {colData === "loading" && (
                                                    <div className="flex items-center gap-1.5 px-2 py-1">
                                                      <Spinner size={10} />
                                                      <span className="text-[11.5px] text-gray-400">Loading…</span>
                                                    </div>
                                                  )}
                                                  {colData === "error" && (
                                                    <p className="text-[11.5px] text-red-500 px-2 py-1">Error</p>
                                                  )}
                                                  {Array.isArray(colData) && colData.length === 0 && (
                                                    <p className="text-[11.5px] text-gray-400 px-2 py-1">
                                                      No columns
                                                    </p>
                                                  )}
                                                  {Array.isArray(colData) &&
                                                    colData.map((col, ci) => {
                                                      const baseType = col.datatype
                                                        .split("(")[0]
                                                        .toLowerCase();
                                                      const isNum = [
                                                        "int",
                                                        "integer",
                                                        "decimal",
                                                        "double",
                                                      ].includes(baseType);
                                                      return (
                                                        <div
                                                          key={`${col.column}-${ci}`}
                                                          className="flex items-center gap-1.5 px-2 py-0.5 text-[13px] text-gray-600 select-none"
                                                        >
                                                          {isNum ? (
                                                            <Hash size={10} className="text-[#8e78b7] flex-shrink-0" />
                                                          ) : (
                                                            <Type size={10} className="text-[#8e78b7] flex-shrink-0" />
                                                          )}
                                                          <span
                                                            className="truncate flex-1"
                                                            title={col.column}
                                                          >
                                                            {col.column}
                                                          </span>
                                                        </div>
                                                      );
                                                    })}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* ── VIEWS section ───────────────────────────── */}
            {(originalViews.length > 0 || searchTerm) && (
              <div className="mt-2 border-t border-gray-100 pt-1">
                <p className="text-[11.5px] font-bold tracking-widest uppercase text-gray-400 px-2 py-1 select-none">
                  Views
                </p>

                {displayedViews.length === 0 ? (
                  <p className="text-[13px] text-gray-400 px-2 py-1">
                    {searchTerm ? "No matching views" : "No views available"}
                  </p>
                ) : (
                  displayedViews.map((viewName) => (
                    <div
                      key={viewName}
                      title={`Double-click to run: SELECT * FROM ${viewName}`}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded cursor-pointer text-[14px] font-medium select-none transition-colors hover:bg-[#f0edf8] ${
                        selectedView === viewName ? "bg-[#ede9f6] text-[#79669c]" : ""
                      }`}
                      style={selectedView === viewName ? undefined : { color: "#4a5170" }}
                      onClick={() => onViewClick(viewName)}
                      onDoubleClick={() => onViewDoubleClick(viewName)}
                    >
                      <Eye size={12} className="text-[#8e78b7] flex-shrink-0" />
                      <span className="truncate flex-1">{viewName}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}