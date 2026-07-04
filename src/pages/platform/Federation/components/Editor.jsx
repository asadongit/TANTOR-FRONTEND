import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  ChevronDown,
  X,
  Play,
  Download,
  ArrowUpDown,
  GripVertical,
  Info,
} from "lucide-react";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-mysql";
import CircularProgress from "@mui/material/CircularProgress";
import Switch from "@mui/material/Switch";
import Builder from "./Builder";
import EditorSidebar from "./EditorSidebar";
import {
  QueryDetailsModal,
  ApiDetailsModal,
  EditorToast,
} from "./EditorModals";
import Breadcrumb from "../../../../components/Breadcrumb";
import { useAuth } from "../../../../context/AuthContext";
import { secureQuery } from "../../../datagovernance/DataCatalogue/Components/function.js";
import { useFederationPolicyIds, useFederationConnections, useFederationBuilderViews } from "../../../../hooks/platform/federation";

// ─── CSS that cannot be expressed in Tailwind ────────────────────────────────
const EDITOR_STYLES = `
  @keyframes qe-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

  .qe-scroll::-webkit-scrollbar { width: 4px; height: 4px; }
  .qe-scroll::-webkit-scrollbar-thumb { background: #d4cbe8; border-radius: 4px; }
  .qe-scroll::-webkit-scrollbar-track { background: transparent; }

  .qe-tr:hover td { background: #faf9ff !important; }
`;

const sidebarDataCache = {};

const ResultsTable = ({
  orderedCols,
  sortedData,
  dragOverCol,
  sortConfig,
  handleColDragStart,
  handleColDragOver,
  handleColDrop,
  handleColDragEnd,
  handleSort,
  loadingMore,
  hasMore,
  displayCount,
  dataBufferLength,
  handleResultsScroll
}) => {
  const tableContainerRef = useRef(null);

  const rowVirtualizer = useVirtualizer({
    count: sortedData.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 37,
    overscan: 10,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
  const paddingBottom = virtualRows.length > 0 ? totalSize - virtualRows[virtualRows.length - 1].end : 0;

  return (
    <div
      ref={tableContainerRef}
      className="h-full overflow-auto qe-scroll"
      onScroll={handleResultsScroll}
    >
      <table className="w-full border-collapse bg-white">
        <thead>
          <tr>
            {orderedCols.map((col, vi) => (
              <th
                key={col}
                draggable
                onDragStart={(e) => handleColDragStart(e, vi)}
                onDragOver={(e) => handleColDragOver(e, vi)}
                onDrop={(e) => handleColDrop(e, vi)}
                onDragEnd={handleColDragEnd}
                title={col}
                onClick={() => handleSort(col)}
                className={`text-left px-3.5 py-2.5 text-[12px] font-semibold text-gray-600 bg-gray-50 border-b border-gray-200 whitespace-nowrap cursor-grab select-none sticky top-0 z-10 ${dragOverCol === vi ? "border-l-2 border-l-[#8e78b7]" : ""}`}
              >
                <div className="flex items-center gap-1">
                  <GripVertical size={11} className="opacity-40 flex-shrink-0" />
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap">{col}</span>
                  <ArrowUpDown size={11} className={`flex-shrink-0 ${sortConfig.key === col ? "opacity-100" : "opacity-30"}`} />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paddingTop > 0 && (
            <tr>
              <td style={{ height: `${paddingTop}px` }} colSpan={orderedCols.length} />
            </tr>
          )}
          {virtualRows.map((virtualRow) => {
            const row = sortedData[virtualRow.index];
            return (
              <tr 
                key={virtualRow.index} 
                data-index={virtualRow.index}
                ref={rowVirtualizer.measureElement}
                className="qe-tr border-b border-gray-100"
              >
                {orderedCols.map((col, ci) => {
                  const val = row[col];
                  const isLink = typeof val === "string" && val.startsWith("http");
                  return (
                    <td
                      key={ci}
                      title={val}
                      className="px-3.5 py-2 text-[13px] text-gray-700 whitespace-nowrap max-w-[260px] overflow-hidden text-ellipsis align-middle"
                    >
                      {isLink ? (
                        <a href={val} target="_blank" rel="noopener noreferrer" className="text-[#8e78b7] underline">
                          {val}
                        </a>
                      ) : (val === 0 ? 0 : val ?? "–")}
                    </td>
                  );
                })}
              </tr>
            );
          })}
          {paddingBottom > 0 && (
            <tr>
              <td style={{ height: `${paddingBottom}px` }} colSpan={orderedCols.length} />
            </tr>
          )}
        </tbody>
      </table>
      
      {loadingMore && (
        <div className="flex justify-center py-3">
          <CircularProgress size={20} sx={{ color: "#8e78b7" }} />
        </div>
      )}
      {!hasMore && !loadingMore && displayCount >= dataBufferLength && (
        <div className="text-center text-[11px] text-gray-400 py-3 select-none">
          No more rows
        </div>
      )}
    </div>
  );
};

export default function Editor() {
  const {
    token,
    project,
    decodedToken,
    hostnameV1,
  } = useAuth();

  const [searchTerm, setSearchTerm]               = useState("");
  const [connectionsLoading, setConnectionsLoading] = useState(true);
  const [policyIds, setPolicyIds]                 = useState([]);
  const [originalConnections, setOriginalConnections] = useState([]);
  const [displayedConnections, setDisplayedConnections] = useState([]);
  const [selectedConnection, setSelectedConnection] = useState("");
  const [schemas, setSchemas]   = useState({});
  const [tables, setTables]     = useState({});
  const [columns, setColumns]   = useState({});
  const [expandedItems, setExpandedItems] = useState({});
  // Views
  const [originalViews, setOriginalViews]   = useState([]);
  const [displayedViews, setDisplayedViews] = useState([]);
  const [selectedView, setSelectedView]     = useState("");

  // Refresh trigger
  const [connectionsRefreshKey, setConnectionsRefreshKey] = useState(0);

  // ── Query editor ──────────────────────────────────────────────────────────
  const [query, setQuery]             = useState("");
  const [securedQuery, setSecuredQuery] = useState("");
  const [loading, setLoading]         = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const [dataBuffer, setDataBuffer]   = useState([]);
  const [displayCount, setDisplayCount] = useState(100);
  const data = dataBuffer.slice(0, displayCount);
  
  const [columnDefs, setColumnDefs]   = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [pageSize, setPageSize]       = useState(100);
  const [nextUri, setNextUri]         = useState(null);
  const [hasMore, setHasMore]         = useState(false);
  
  const [checked, setChecked]         = useState(true); // true = Editor, false = Builder
  const [shownViews, setShownViews]   = useState([]);

  // ── Modals ────────────────────────────────────────────────────────────────
  const [isQueryModalOpen, setIsQueryModalOpen] = useState(false);
  const [viewsDetails, setViewsDetails]         = useState(null);
  const [queryLoading, setQueryLoading]         = useState(false);
  const [isApiModalOpen, setIsApiModalOpen]     = useState(false);
  const [apiDetails, setApiDetails]             = useState({ viewName: "", curl: "" });
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  // ── Download ──────────────────────────────────────────────────────────────
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [fullDataLoading, setFullDataLoading]   = useState(false);
  const downloadMenuRef = useRef(null);
  const ExternalAPI = window._env_?.VITE_EXTERNAL_API;

  // ── Resize ────────────────────────────────────────────────────────────────
  const [editorHeightPct, setEditorHeightPct] = useState(45);
  const [sidebarWidth, setSidebarWidth]       = useState(280);
  const isDragging  = useRef(false);
  const isHDragging = useRef(false);
  const panelRef    = useRef(null);
  const containerRef = useRef(null);

  // ── Ace editor refs ───────────────────────────────────────────────────────
  const aceEditorRef = useRef(null);
  const queryRef     = useRef(query);
  useEffect(() => { queryRef.current = query; }, [query]);

  // ── Table column drag-reorder & sort ─────────────────────────────────────
  const [colOrder, setColOrder]         = useState([]);
  const [dragOverCol, setDragOverCol]   = useState(null);
  const [sortConfig, setSortConfig]     = useState({ key: "", direction: "asc" });
  const dragSrcCol = useRef(null);

  useEffect(() => {
    setColOrder(columnDefs.map((_, i) => i));
    setSortConfig({ key: "", direction: "asc" });
  }, [columnDefs]);

  const orderedCols = colOrder.map((i) => columnDefs[i]);

  const handleColDragStart = (e, vi) => {
    dragSrcCol.current = vi;
    e.dataTransfer.effectAllowed = "move";
  };
  const handleColDragOver = (e, vi) => { e.preventDefault(); setDragOverCol(vi); };
  const handleColDrop = (e, vi) => {
    e.preventDefault();
    const src = dragSrcCol.current;
    if (src === null || src === vi) { setDragOverCol(null); return; }
    const next = [...colOrder];
    const [m] = next.splice(src, 1);
    next.splice(vi, 0, m);
    setColOrder(next);
    setDragOverCol(null);
    dragSrcCol.current = null;
  };
  const handleColDragEnd = () => { setDragOverCol(null); dragSrcCol.current = null; };
  const handleSort = (key) =>
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const av = a[sortConfig.key], bv = b[sortConfig.key];
    if (typeof av === "number" && typeof bv === "number")
      return sortConfig.direction === "asc" ? av - bv : bv - av;
    return sortConfig.direction === "asc"
      ? String(av || "").localeCompare(String(bv || ""))
      : String(bv || "").localeCompare(String(av || ""));
  });

  // ── Click outside → close download menu ──────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target))
        setShowDownloadMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Fetch connections + views from /connections/list (cached via React Query) ────────────
  const { data: federationData, isFetching: isFedFetching, refetch: refetchFederationData } = useFederationConnections();
  const { data: builderViews, isFetching: isViewsFetching, refetch: refetchBuilderViews } = useFederationBuilderViews();
  const { refetch: refetchPolicyIds } = useFederationPolicyIds();

  useEffect(() => {
    if (federationData) {
      setOriginalConnections(federationData.connections);
      setOriginalViews(federationData.views);
      setPolicyIds(federationData.policyIds);
      
      // Update displayed items conditionally to respect search filter
      const term = searchTerm.trim().toLowerCase();
      if (!term) {
        setDisplayedConnections(federationData.connections);
        setDisplayedViews(federationData.views);
      }
      setConnectionsLoading(false);
    } else {
      setConnectionsLoading(isFedFetching);
    }
  }, [federationData, isFedFetching]);

  // ── Unified search filter ─────────────────────────────────────────────────
  useEffect(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      setDisplayedConnections([...originalConnections]);
      setDisplayedViews([...originalViews]);
    } else {
      setDisplayedConnections(
        originalConnections.filter((c) =>
          c.connection_name.toLowerCase().includes(term)
        )
      );
      setDisplayedViews(originalViews.filter((v) => v.toLowerCase().includes(term)));
    }
  }, [searchTerm, originalConnections, originalViews]);

  // ── Fetch builder views list (separate endpoint via React Query) ──────────────────────────
  // ── Fetch builder views list (separate endpoint via React Query) ──────────────────────────

  useEffect(() => {
    if (builderViews) {
      setShownViews(builderViews);
    }
  }, [builderViews]);

  // ── Toast helper ──────────────────────────────────────────────────────────
  const showToast = (message, type = "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  // ── Refresh sidebar (explicit — bypasses & clears cache) ──────────────────
  const refreshConnections = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (token) delete sidebarDataCache[token];
    // Do not wipe out originalConnections and displayedConnections manually.
    // React Query's structural sharing means if the API returns the exact same
    // connections, federationData won't change referentially, and the useEffect
    // won't fire. Thus we'd be stuck with empty arrays if we wipe them here!
    setSearchTerm("");
    setSchemas({});
    setTables({});
    setColumns({});
    setExpandedItems({});
    setSelectedConnection("");
    setSelectedView("");
    
    // Explicitly show the loading animation for manual refreshes
    setConnectionsLoading(true);
    try {
      await refetchPolicyIds();
      await Promise.all([
        refetchFederationData(),
        refetchBuilderViews()
      ]);
    } finally {
      setConnectionsLoading(false);
    }
  };

  // ── Tree expand helpers ───────────────────────────────────────────────────
  const toggleExpanded = (id) =>
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleConnectionClick = async (event, connection) => {
    setSelectedConnection(connection);
    const connId = `conn-${connection}`;
    toggleExpanded(connId);
    if (!expandedItems[connId] && !schemas[connection]) {
      try {
        setSchemas((p) => ({ ...p, [connection]: "loading" }));
        if (policyIds.length === 0) {
          setSchemas((p) => ({ ...p, [connection]: [] }));
          return;
        }
        const res = await fetch(`${hostnameV1}/schemas/list`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ matched_policy_ids: policyIds, connection_name: connection }),
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        const connectionData = data.find((item) => item[connection]);
        const schemaNames = connectionData ? connectionData[connection] : [];
        setSchemas((p) => ({ ...p, [connection]: schemaNames }));
      } catch (err) {
        setSchemas((p) => ({ ...p, [connection]: "error" }));
        showToast(`Failed to load schemas: ${err.message}`);
      }
    }
  };

  const handleSchemaClick = async (event, connection, schema) => {
    const schemaId = `schema-${connection}-${schema}`;
    toggleExpanded(schemaId);
    if (!expandedItems[schemaId] && !tables[`${connection}-${schema}`]) {
      try {
        setTables((p) => ({ ...p, [`${connection}-${schema}`]: "loading" }));
        if (policyIds.length === 0) {
          setTables((p) => ({ ...p, [`${connection}-${schema}`]: [] }));
          return;
        }
        const res = await fetch(`${hostnameV1}/tables/list`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ matched_policy_ids: policyIds, connection_name: connection, schema_name: [schema] }),
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        const tableData = data.schemas.find(
          (item) =>
            item.connection_name.toLowerCase() === connection.toLowerCase() &&
            item.schema.toLowerCase() === schema.toLowerCase()
        );
        const tableNames = tableData?.tables ?? [];
        setTables((p) => ({ ...p, [`${connection}-${schema}`]: tableNames }));
      } catch (err) {
        setTables((p) => ({ ...p, [`${connection}-${schema}`]: "error" }));
        showToast(`Failed to load tables: ${err.message}`);
      }
    }
  };

  const handleTableClick = async (event, connection, schema, table) => {
    const tableId = `table-${connection}-${schema}-${table}`;
    toggleExpanded(tableId);
    if (!expandedItems[tableId] && !columns[`${connection}-${schema}-${table}`]) {
      try {
        setColumns((p) => ({ ...p, [`${connection}-${schema}-${table}`]: "loading" }));
        if (policyIds.length === 0) {
          setColumns((p) => ({ ...p, [`${connection}-${schema}-${table}`]: [] }));
          return;
        }
        const res = await fetch(`${hostnameV1}/columns/list`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ matched_policy_ids: policyIds, connection_name: connection, schema_name: [schema], table_name: [table] }),
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        if (!data?.columns || !Array.isArray(data.columns))
          throw new Error("Invalid response structure from /columns/list");
        const columnData = data.columns.find(
          (item) =>
            item.connection_name.toLowerCase() === connection.toLowerCase() &&
            item.schema.toLowerCase() === schema.toLowerCase() &&
            item.table_name.toLowerCase() === table.toLowerCase()
        );
        const formatted = columnData?.columns
          ? columnData.columns.map((item) => ({
              column: item.column_name,
              datatype: item.metadata?.DATA_TYPE || "unknown",
              metadata: item.metadata,
            }))
          : [];
        setColumns((p) => ({ ...p, [`${connection}-${schema}-${table}`]: formatted }));
      } catch (err) {
        setColumns((p) => ({ ...p, [`${connection}-${schema}-${table}`]: "error" }));
        showToast(`Failed to load columns: ${err.message}`);
      }
    }
  };

  const handleTableDoubleClick = (connection, schema, table) => {
    const q = `Select * from ${connection}.${schema}.${table}`;
    setQuery(q);
    setSecuredQuery("");
    executeQuery(q);
  };

  // ── View handlers ─────────────────────────────────────────────────────────
  const handleViewClick = (viewName) => {
    setSelectedView(viewName);
  };

  const handleViewDoubleClick = (viewName) => {
    if (loading) return;
    const q = `SELECT * FROM ${viewName}`;
    setQuery(q);
    setSecuredQuery("");
    executeQuery(q);
  };

  // ── SQL helpers ───────────────────────────────────────────────────────────
  function removeComments(sql) {
    let out = "";
    let inMulti = false;
    for (const line of sql.split("\n")) {
      const t = line.trim();
      if (inMulti) { if (t.includes("*/")) inMulti = false; continue; }
      if (t.startsWith("/*")) { inMulti = true; continue; }
      if (t.startsWith("--")) continue;
      out += line + "\n";
    }
    return out.trim();
  }

  const extractViewName = (q) => {
    const m = q.match(/CREATE\s+VIEW\s+([^\s(]+)\s*(?:AS\s*SELECT|AS\s*\(|AS\s*{)/i);
    return m ? m[1].replace(/[`"]/g, "") : null;
  };

  const generateCurl = async (viewName) => {
    try {
      const url = `${ExternalAPI}/view/${viewName}`;
      const res = await fetch(`${hostnameV1}/generate_curl`, {
        method: "POST",
        headers: { accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url, page: 1 }),
      });
      return await res.text();
    } catch {
      return "Error generating cURL";
    }
  };

  // ── Execute query (Native Pagination with Client-Side Buffer) ──────────────
  const executeQuery = async (queryText, { append = false } = {}) => {
    const newQuery = removeComments(queryText);
    if (!newQuery.trim()) { showToast("Enter query first"); return; }

    const isCreateView = newQuery.toUpperCase().startsWith("CREATE VIEW");
    let viewName = null;
    if (isCreateView) {
      viewName = extractViewName(newQuery);
      if (!viewName) { showToast("Invalid view name in CREATE VIEW query"); return; }
    }

    if (append) {
      if (!nextUri) return;
      setLoadingMore(true);
    } else {
      setDataBuffer([]);
      setDisplayCount(pageSize);
      setColumnDefs([]);
      setViewsDetails(null);
      setLoading(true);
      setNextUri(null);
    }
    setShowResults(true);

    try {
      let secureQueryStr = securedQuery;

      if (!append) {
        const sqRes = await fetch(`${window._env_?.VITE_FAST_API}/secure-query`, {
          method: "POST",
          headers: { accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ user_query: newQuery }),
        });

        if (!sqRes.ok) {
          const errData = await sqRes.json();
          const isAccessDenied = errData.detail?.toLowerCase().includes("access denied");
          if (isAccessDenied) {
            await fetch(`${hostnameV1}/save_query`, {
              method: "POST",
              headers: { accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                query: newQuery, status: "failed",
                owner: decodedToken?.preferred_username,
                project: project === "default" || project === "none" ? "default" : project,
                type: "df",
              }),
            });
          }
          showToast(errData.detail || "Error in query validation");
          throw new Error("secure-query failed");
        }

        const sqData = await sqRes.json();
        if (!sqData?.secure_query) throw new Error("Invalid response from secure-query");
        secureQueryStr = sqData.secure_query;
        setSecuredQuery(secureQueryStr);
      }

      let runRes;
      if (append) {
        runRes = await fetch(`${hostnameV1}/runQueryNative/next`, {
          method: "POST",
          headers: { accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ next_uri: nextUri }),
        });
      } else {
        const payload = {
          query: secureQueryStr,
          project: project === "default" || project === "none" ? "default" : project,
          created_by: decodedToken?.preferred_username,
        };
        runRes = await fetch(`${hostnameV1}/runQueryNative`, {
          method: "POST",
          headers: { accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
      }

      if (!runRes.ok) {
        const text = await runRes.text();
        try { showToast(JSON.parse(text).detail || "Error in query execution"); }
        catch { showToast(text || "Error in query execution"); }
        throw new Error("runQuery failed");
      }

      if (isCreateView) {
        const curl = await generateCurl(viewName);
        setApiDetails({ viewName, curl });
        setIsApiModalOpen(true);
        showToast(`View ${viewName} created successfully`, "success");
      } else {
        let resData = await runRes.json();
        let aggregatedRows = [];
        let currentCols = resData.columns || [];
        let currentNextUri = resData.next_uri;

        const mapRows = (d, cols) => {
            if (!d || !d.length) return [];
            const colNames = cols.map(c => c.name);
            return d.map(rowArray => {
                const rowObj = {};
                colNames.forEach((name, idx) => rowObj[name] = rowArray[idx]);
                return rowObj;
            });
        };

        aggregatedRows = mapRows(resData.data, currentCols);

        while (aggregatedRows.length < pageSize && currentNextUri) {
           const pollRes = await fetch(`${hostnameV1}/runQueryNative/next`, {
             method: "POST",
             headers: { accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}` },
             body: JSON.stringify({ next_uri: currentNextUri }),
           });
           if (!pollRes.ok) break;
           const pollData = await pollRes.json();
           
           if (!currentCols.length && pollData.columns) currentCols = pollData.columns;
           aggregatedRows = aggregatedRows.concat(mapRows(pollData.data, currentCols));
           currentNextUri = pollData.next_uri;
        }

        const colNames = currentCols.map(c => c.name);

        if (append) {
          setDataBuffer((prev) => [...prev, ...aggregatedRows]);
        } else {
          setColumnDefs(colNames);
          setDataBuffer(aggregatedRows);
          setDisplayCount(pageSize);
        }
        
        setNextUri(currentNextUri || null);
        setHasMore(!!currentNextUri);
      }

      if (!append) {
        await fetch(`${hostnameV1}/save_query`, {
          method: "POST",
          headers: { accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            query: newQuery, status: "success",
            owner: decodedToken?.preferred_username,
            project: project === "default" || project === "none" ? "default" : project,
            type: "df",
          }),
        });
      }
    } catch (err) {
      if (!["secure-query failed", "runQuery failed", "Invalid response from secure-query"].includes(err.message)) {
        console.error("Unexpected error:", err);
        showToast("Unexpected error occurred");
      }
    } finally {
      if (append) setLoadingMore(false); else setLoading(false);
    }
  };

  // ── Infinite scroll ────────────────────────────────────────────────────────
  const handleResultsScroll = (e) => {
    if (loading || loadingMore) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 120) {
      if (displayCount < dataBuffer.length) {
         setDisplayCount(prev => prev + pageSize);
      } 
      else if (hasMore) {
         executeQuery(query, { append: true }).then(() => {
             setDisplayCount(prev => prev + pageSize);
         });
      }
    }
  };

  // ── Query Details ─────────────────────────────────────────────────────────
  const handleQueryDetails = async () => {
    if (!securedQuery) return;
    if (viewsDetails === null) {
      try {
        setQueryLoading(true);
        setIsQueryModalOpen(true);
        const res = await fetch(`${hostnameV1}/analyzeQuery`, {
          method: "POST",
          headers: { accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ sql_query: securedQuery, pageNo: 1 }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setViewsDetails((await res.json()) || null);
      } catch (err) {
        setViewsDetails({ status: "Failed", message: "Unable to fetch data" });
      } finally {
        setQueryLoading(false);
        setIsQueryModalOpen(true);
      }
    } else {
      setIsQueryModalOpen(true);
    }
  };

  // ── CSV Download ──────────────────────────────────────────────────────────
  const convertToCSV = (rows) => {
    if (!rows || rows.length === 0) return "";
    const headers = Object.keys(rows[0]).join(",");
    const csvRows = rows.map((r) => Object.values(r).map((v) => `"${v}"`).join(","));
    return [headers, ...csvRows].join("\n");
  };
  const downloadCSV = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = Object.assign(document.createElement("a"), {
      href: url, download: filename,
      style: { visibility: "hidden" },
    });
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  const handleDownloadCurrentPage = () => {
    setShowDownloadMenu(false);
    if (!data.length) { showToast("No data to download"); return; }
    // Now downloads what is currently visible in the local buffer view
    downloadCSV(convertToCSV(data), `data_current_view.csv`);
  };
  
  const handleDownloadFullData = async () => {
    setShowDownloadMenu(false);
    if (!securedQuery) { showToast("Run a query first to download full data"); return; }
    setFullDataLoading(true);
    showToast("Fetching full data sequentially, please wait…", "success");
    try {
      let res = await fetch(`${hostnameV1}/runQueryNative`, {
        method: "POST",
        headers: { accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ query: securedQuery, project: project === "default" || project === "none" ? "default" : project, created_by: decodedToken?.preferred_username }),
      });
      if (!res.ok) throw new Error("Failed to start full fetch");
      
      let allRows = [];
      let resData = await res.json();
      let currentNextUri = resData.next_uri;
      
      const appendData = (dataChunk, cols) => {
         if (!dataChunk || dataChunk.length === 0) return;
         const colNames = cols.map(c => c.name);
         const rows = dataChunk.map(rowArray => {
             const rowObj = {};
             colNames.forEach((cName, idx) => rowObj[cName] = rowArray[idx]);
             return rowObj;
         });
         allRows = allRows.concat(rows);
      };

      appendData(resData.data, resData.columns);

      while (currentNextUri) {
         res = await fetch(`${hostnameV1}/runQueryNative/next`, {
             method: "POST",
             headers: { accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}` },
             body: JSON.stringify({ next_uri: currentNextUri }),
         });
         if (!res.ok) throw new Error("Failed during full fetch");
         resData = await res.json();
         appendData(resData.data, resData.columns);
         currentNextUri = resData.next_uri;
      }
      
      if (!allRows.length) { showToast("No data available to download"); return; }
      downloadCSV(convertToCSV(allRows), `data_full_${Date.now()}.csv`);
      showToast(`Downloaded ${allRows.length} rows successfully`, "success");
    } catch (err) {
      showToast("Failed to download full data");
    } finally {
      setFullDataLoading(false);
    }
  };

  // ── Resize drag handlers ──────────────────────────────────────────────────
  const handleDragStart = useCallback((e) => {
    e.preventDefault();
    isDragging.current = true;
    const onMove = (ev) => {
      if (!isDragging.current || !panelRef.current) return;
      const rect = panelRef.current.getBoundingClientRect();
      const pct = ((ev.clientY - rect.top) / rect.height) * 100;
      setEditorHeightPct(Math.min(80, Math.max(20, pct)));
    };
    const onUp = () => {
      isDragging.current = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, []);

  const handleSidebarDragStart = useCallback((e) => {
    e.preventDefault();
    isHDragging.current = true;
    const onMove = (ev) => {
      if (!isHDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setSidebarWidth(Math.min(400, Math.max(160, ev.clientX - rect.left)));
    };
    const onUp = () => {
      isHDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col bg-[#f7f8fa] p-4">
      <style>{EDITOR_STYLES}</style>

      <div className="flex-shrink-0 -mb-1">
        <Breadcrumb title="Platform" link="/" title2="Federation" link2="/federation" title3={checked ? "Editor" : "Query Views"} />
      </div>

      <div ref={containerRef} className="flex flex-1 min-h-0 overflow-hidden">
        {checked ? (
          <>
            {/* ════════════ LEFT SIDEBAR ════════════════════════════════════ */}
            <EditorSidebar
              sidebarWidth={sidebarWidth}
              connectionsLoading={connectionsLoading}
              displayedConnections={displayedConnections}
              displayedViews={displayedViews}
              originalViews={originalViews}
              schemas={schemas}
              tables={tables}
              columns={columns}
              expandedItems={expandedItems}
              selectedConnection={selectedConnection}
              selectedView={selectedView}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onRefresh={refreshConnections}
              onConnectionClick={handleConnectionClick}
              onSchemaClick={handleSchemaClick}
              onTableClick={handleTableClick}
              onTableDoubleClick={handleTableDoubleClick}
              onColumnClick={() => {}}
              onViewClick={handleViewClick}
              onViewDoubleClick={handleViewDoubleClick}
              queryLoading={loading}
            />

            {/* ══ Horizontal drag handle ════════════════════════════════════ */}
            <div
              className="w-1.5 flex-shrink-0 flex items-center justify-center bg-gray-100 border-x border-gray-200 cursor-col-resize hover:bg-[#ede9f6] active:bg-[#ede9f6] transition-colors z-10 relative"
              onMouseDown={handleSidebarDragStart}
            >
              <div className="flex flex-col gap-0.5">
                {[0,1,2,3,4].map((i) => (
                  <span key={i} className="w-1 h-1 rounded-full bg-gray-400" />
                ))}
              </div>
            </div>

            {/* ════════════ RIGHT PANEL ════════════════════════════════════ */}
            <main
              ref={panelRef}
              className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white"
            >
              {/* ── Toolbar ── */}
              <div className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-200 bg-white flex-shrink-0">
                {/* Run */}
                <button
                  type="button"
                  onClick={() => executeQuery(query)}
                  disabled={loading}
                  className="flex items-center gap-1.5 bg-[#8e78b7] hover:bg-[#79669c] disabled:opacity-60 disabled:cursor-not-allowed text-white text-[13px] font-semibold px-3.5 py-1.5 rounded-md transition-colors whitespace-nowrap"
                >
                  <Play size={13} />
                  {loading ? "Running…" : "Run"}
                </button>


                <div className="flex-1" />

                {/* Rows per page (fetch batch size) */}
                <select
                  value={pageSize}
                  onChange={(e) => { 
                    const newSize = Number(e.target.value);
                    setPageSize(newSize); 
                    setDisplayCount(newSize); 
                  }}
                  className="border border-gray-200 rounded-md text-[12.5px] text-gray-600 px-2 py-1 bg-white outline-none focus:border-[#8e78b7] cursor-pointer"
                >
                  {[100, 200, 500, 800, 1000].map((n) => (
                    <option key={n} value={n}>{n} rows</option>
                  ))}
                </select>

                {/* Export */}
                <div className="relative" ref={downloadMenuRef}>
                  <button
                    type="button"
                    onClick={() => setShowDownloadMenu((p) => !p)}
                    disabled={fullDataLoading}
                    className="flex items-center gap-1.5 border border-gray-200 text-gray-600 text-[12.5px] px-3 py-1.5 rounded-md hover:border-[#8e78b7] hover:text-[#8e78b7] hover:bg-[#f8f5ff] transition-all whitespace-nowrap"
                  >
                    {fullDataLoading ? (
                      <div className="w-3 h-3 rounded-full border-2 border-[#e0d9f5] border-t-[#8e78b7] animate-spin" />
                    ) : (
                      <Download size={13} />
                    )}
                    Export
                    <ChevronDown size={11} />
                  </button>
                  {showDownloadMenu && (
                    <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 w-52 overflow-hidden">
                      <button
                        className="flex items-center gap-2 w-full px-3.5 py-2.5 text-[13px] text-gray-700 hover:bg-[#f8f5ff] transition-colors"
                        onClick={handleDownloadCurrentPage}
                      >
                        <Download size={13} />
                        <div className="text-left">
                          <div className="font-medium">Loaded View</div>
                          <div className="text-[11px] text-gray-400">{data.length} rows visible</div>
                        </div>
                      </button>
                      <div className="border-t border-gray-100" />
                      <button
                        className="flex items-center gap-2 w-full px-3.5 py-2.5 text-[13px] text-gray-700 hover:bg-[#f8f5ff] transition-colors"
                        onClick={handleDownloadFullData}
                      >
                        <Download size={13} />
                        <div className="text-left">
                          <div className="font-medium">Full Data</div>
                          <div className="text-[11px] text-gray-400">All pages · may take a moment</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                {/* Editor / Builder toggle */}
                <div className="flex items-center gap-1">
                  <Switch
                    checked={checked}
                    onChange={() => { setDataBuffer([]); setColumnDefs([]); setQuery(""); setChecked(!checked); }}
                    inputProps={{ "aria-label": "controlled" }}
                    size="small"
                    sx={{
                      "& .MuiSwitch-switchBase.Mui-checked": { color: "#8e78b7" },
                      "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "#8e78b7" },
                    }}
                  />
                  <span className="text-[13px] text-gray-500 whitespace-nowrap">
                    {checked ? "Editor" : "Query Views"}
                  </span>
                </div>
              </div>

              {/* ── Ace Editor pane ── */}
              <div
                style={
                  showResults
                    ? { height: `${editorHeightPct}%`, flexShrink: 0, overflow: "hidden" }
                    : { flex: 1, overflow: "hidden", minHeight: 0 }
                }
              >
                <AceEditor
                  aria-label="editor"
                  mode="mysql"
                  theme="background"
                  name="editor"
                  fontSize={13}
                  wrapEnabled
                  showPrintMargin={false}
                  showGutter
                  placeholder="Write SQL here…"
                  editorProps={{ $blockScrolling: true }}
                  setOptions={{ enableBasicAutocompletion: true, enableLiveAutocompletion: true, enableSnippets: true }}
                  value={query}
                  onChange={setQuery}
                  ref={aceEditorRef}
                  commands={[{
                    name: "executeQuery",
                    bindKey: { win: "Ctrl-Enter", mac: "Command-Enter" },
                    exec: () => {
                      const ace = aceEditorRef.current?.editor;
                      const sel = ace ? ace.getSelectedText() : "";
                      executeQuery(sel?.trim() ? sel : queryRef.current);
                    },
                  }]}
                  style={{ width: "100%", height: "100%" }}
                  showLineNumbers
                />
              </div>

              {/* ── Drag handle (vertical resize) ── */}
              {showResults && (
                <div
                  className="h-2 flex-shrink-0 flex items-center justify-center bg-gray-50 border-y border-gray-200 cursor-row-resize hover:bg-[#ede9f6] transition-colors select-none"
                  onMouseDown={handleDragStart}
                >
                  <div className="flex gap-0.5">
                    {[0,1,2,3,4].map((i) => <span key={i} className="w-1 h-1 rounded-full bg-gray-400" />)}
                  </div>
                </div>
              )}

              {/* ── Results pane ── */}
              {showResults && (
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  {/* Tab bar */}
                  <div className="flex items-center justify-between border-b border-gray-200 bg-white flex-shrink-0">
                    <div className="flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-semibold text-[#8e78b7] border-b-2 border-[#8e78b7] whitespace-nowrap">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18" />
                      </svg>
                      Results
                      {dataBuffer.length > 0 && (
                        <span className="text-[11px] font-normal text-gray-400 ml-1">
                          · {data.length} / {dataBuffer.length}{hasMore ? "+" : ""} rows
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5 mr-1">
                      <button
                        type="button"
                        title="Query Details"
                        onClick={handleQueryDetails}
                        disabled={!securedQuery}
                        className="text-gray-400 hover:text-[#8e78b7] disabled:opacity-40 disabled:cursor-not-allowed p-1.5 rounded transition-colors"
                      >
                        <Info size={15} />
                      </button>
                      <button
                        type="button"
                        title="Close results"
                        onClick={() => setShowResults(false)}
                        className="text-gray-400 hover:text-[#8e78b7] p-1.5 rounded transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Results body */}
                  <div className="qe-scroll flex-1 overflow-auto bg-white min-h-0">
                    {loading ? (
                      <div className="flex items-center justify-center h-full">
                        <CircularProgress sx={{ color: "#8e78b7" }} />
                      </div>
                    ) : data.length > 0 ? (
                      <ResultsTable
                        orderedCols={orderedCols}
                        sortedData={sortedData}
                        dragOverCol={dragOverCol}
                        sortConfig={sortConfig}
                        handleColDragStart={handleColDragStart}
                        handleColDragOver={handleColDragOver}
                        handleColDrop={handleColDrop}
                        handleColDragEnd={handleColDragEnd}
                        handleSort={handleSort}
                        loadingMore={loadingMore}
                        hasMore={hasMore}
                        displayCount={displayCount}
                        dataBufferLength={dataBuffer.length}
                        handleResultsScroll={handleResultsScroll}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full select-none">
                        <span className="text-[30px] font-light text-[#c4b5e8] tracking-widest mb-2.5">&lt;/&gt;</span>
                        <p className="text-[14px] text-[#9b8eb5] mb-1">No results returned</p>
                        <p className="text-[12px] text-[#c4b5e8]">Try a different query</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </main>

            {/* Toast */}
            <EditorToast
              toast={toast}
              onClose={() => setToast({ show: false, message: "", type: "" })}
            />
          </>
        ) : (
          <Builder
            handleSwitch={() => { setDataBuffer([]); setColumnDefs([]); setQuery(""); setChecked(!checked); }}
            checked={checked}
            views={originalViews}
          />
        )}
      </div>

      {/* ── Modals (rendered outside the flex container) ── */}

      <QueryDetailsModal
        isOpen={isQueryModalOpen}
        onClose={() => setIsQueryModalOpen(false)}
        viewsDetails={viewsDetails}
        queryLoading={queryLoading}
      />
      <ApiDetailsModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
        apiDetails={apiDetails}
      />
    </div>
  );
}