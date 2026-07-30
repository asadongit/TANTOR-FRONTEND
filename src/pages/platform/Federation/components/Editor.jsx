import { memo, useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  ChevronDown,
  X,
  Play,
  Download,
  ArrowUpDown,
  GripVertical,
  Info,
  Pencil,
  History,
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
import EditorSaveViewModal from "./EditorSaveViewModal";
import QueryHistoryDrawer from "./QueryHistoryDrawer";
import {
  useFederationPolicyIds,
  useFederationConnections,
  useFederationBuilderViews,
} from "../../../../hooks/platform/federation";

// ─── CSS ─────────────────────────────────────────────────────────────────────
const EDITOR_STYLES = `
  /* ── Scrollbars ── */
  .qe-scroll::-webkit-scrollbar { width: 5px; height: 5px; }
  .qe-scroll::-webkit-scrollbar-thumb { background: #d4cbe8; border-radius: 10px; }
  .qe-scroll::-webkit-scrollbar-track { background: transparent; }

  /* ── Results row hover ── */
  .qe-tr { transition: background 0.08s; }
  .qe-tr:hover td { background: #f8f5ff !important; }

  /* ── Tab strip ── */
  .tab-strip { scrollbar-width: none; -ms-overflow-style: none; }
  .tab-strip::-webkit-scrollbar { display: none; }

  /* ── Tab item ── */
  .tab-item {
    transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
    position: relative;
  }
  /* Active tab bottom-covering line (hides the strip border) */
  .tab-item.tab-active::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 1px;
    background: #fff;
  }

  /* ── Tab close btn ── */
  .tab-close-btn {
    opacity: 0;
    transform: scale(0.8);
    transition: opacity 0.15s ease, transform 0.15s ease, color 0.1s ease, background 0.1s ease;
  }
  .tab-item:hover .tab-close-btn {
    opacity: 1;
    transform: scale(1);
  }

  /* ── Run button pulse on hover ── */
  .qe-run-btn:not(:disabled):hover {
    box-shadow: 0 0 0 3px rgba(142, 120, 183, 0.22);
  }
  .qe-run-btn { transition: background 0.15s ease, box-shadow 0.2s ease; }

  /* ── Secondary toolbar btn ── */
  .qe-btn-secondary { transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease, box-shadow 0.15s ease; }
  .qe-btn-secondary:not(:disabled):hover { box-shadow: 0 1px 6px rgba(142,120,183,0.15); }
`;

const sidebarDataCache = {};

// ─── Tab factory ──────────────────────────────────────────────────────────────
const createTab = (n) => ({
  id: crypto.randomUUID(),
  label: `Query ${n}`,
  // Editor
  query: "",
  securedQuery: "",
  // Results
  dataBuffer: [],
  columnDefs: [],
  colOrder: [],
  sortConfig: { key: "", direction: "asc" },
  dragOverCol: null,
  queryError: null,
  querySuccess: false,
  loading: false,
  loadingMore: false,
  showResults: false,
  nextUri: null,
  hasMore: false,
  displayCount: 100,
  executedQuery: "",
  // Query details modal data (per-tab cache)
  viewsDetails: null,
});

// ─── ResultsTable (virtualised, memoised) ────────────────────────────────────
const ResultsTable = memo(({
  orderedCols, sortedData, dragOverCol, sortConfig,
  handleColDragStart, handleColDragOver, handleColDrop, handleColDragEnd,
  handleSort, loadingMore, hasMore, displayCount, dataBufferLength,
  handleResultsScroll,
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
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - virtualRows[virtualRows.length - 1].end
      : 0;

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
                className={`text-left px-3.5 py-2.5 text-[12px] font-semibold text-gray-600 bg-gray-50 border-b border-gray-200 whitespace-nowrap cursor-grab select-none sticky top-0 z-10 ${
                  dragOverCol === vi ? "border-l-2 border-l-[#8e78b7]" : ""
                }`}
              >
                <div className="flex items-center gap-1">
                  <GripVertical size={11} className="opacity-40 flex-shrink-0" />
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap">{col}</span>
                  <ArrowUpDown
                    size={11}
                    className={`flex-shrink-0 ${sortConfig.key === col ? "opacity-100" : "opacity-30"}`}
                  />
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
                  const isLink =
                    typeof val === "string" && val.startsWith("http");
                  return (
                    <td
                      key={ci}
                      title={val}
                      className="px-3.5 py-2 text-[13px] text-gray-700 whitespace-nowrap max-w-[260px] overflow-hidden text-ellipsis align-middle"
                    >
                      {isLink ? (
                        <a
                          href={val}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#8e78b7] underline"
                        >
                          {val}
                        </a>
                      ) : (
                        val === 0 ? 0 : val ?? "–"
                      )}
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
      {!hasMore && !loadingMore && displayCount >= dataBufferLength && dataBufferLength > 0 && (
        <div className="text-center text-[11px] text-gray-400 py-3 select-none">
          No more rows
        </div>
      )}
    </div>
  );
});

// ─── TabBar ───────────────────────────────────────────────────────────────────
const TabBar = memo(({ tabs, activeTabId, onTabClick, onTabClose, onTabRename, onAddTab }) => {
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef(null);

  const startRename = (e, tab) => {
    e.stopPropagation();
    setEditingId(tab.id);
    setEditValue(tab.label);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  };

  const commitRename = () => {
    if (editingId && editValue.trim()) {
      onTabRename(editingId, editValue.trim());
    }
    setEditingId(null);
  };

  const cancelRename = () => setEditingId(null);

  return (
    <div
      className="tab-strip flex items-stretch flex-shrink-0 overflow-x-auto"
      style={{
        minHeight: 34,
        background: "#f8f9fa",
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabClick(tab.id)}
            className={[
              "tab-item group flex items-center gap-1.5 px-3 cursor-pointer select-none flex-shrink-0 relative",
              isActive ? "tab-active" : "",
              "min-w-[110px] max-w-[190px]",
            ].join(" ")}
            style={{
              paddingTop: 6,
              paddingBottom: 6,
              background: isActive
                ? "#ffffff"
                : "transparent",
              color: isActive ? "#5a4780" : "#7c6fa0",
              borderRight: "1px solid #e5e7eb",
              borderTop: isActive
                ? "2px solid #8e78b7"
                : "2px solid transparent",
              marginBottom: isActive ? -1 : 0,
              zIndex: isActive ? 2 : 0,
              boxShadow: isActive
                ? "2px 0 6px rgba(142,120,183,0.08), -2px 0 6px rgba(142,120,183,0.04)"
                : "none",
            }}
          >
            {/* SQL icon dot — colored when active */}
            <span
              className="flex-shrink-0 w-[7px] h-[7px] rounded-full transition-colors"
              style={{
                background: isActive ? "#8e78b7" : "#c4b5e8",
                boxShadow: isActive ? "0 0 0 2px rgba(142,120,183,0.18)" : "none",
              }}
            />

            {/* Label or rename input */}
            {editingId === tab.id ? (
              <input
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); commitRename(); }
                  if (e.key === "Escape") { e.preventDefault(); cancelRename(); }
                  e.stopPropagation();
                }}
                onClick={(e) => e.stopPropagation()}
                style={{ fontSize: 12, fontWeight: 500 }}
                className="flex-1 min-w-0 bg-transparent outline-none border-b border-[#8e78b7] text-[#5a4780] leading-snug"
              />
            ) : (
              <span
                className="flex-1 min-w-0 truncate leading-snug"
                style={{ fontSize: 12, fontWeight: isActive ? 600 : 400, letterSpacing: isActive ? "0.01em" : 0 }}
                onDoubleClick={(e) => startRename(e, tab)}
                title={`${tab.label}  ·  Double-click to rename`}
              >
                {tab.label}
              </span>
            )}

            {/* Per-tab loading pulse */}
            {tab.loading && (
              <span
                className="flex-shrink-0 w-[7px] h-[7px] rounded-full animate-pulse"
                style={{ background: "#8e78b7" }}
              />
            )}

            {/* Close button */}
            {tabs.length > 1 && editingId !== tab.id && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onTabClose(tab.id); }}
                className="tab-close-btn flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[#9d8fc0] hover:text-red-500 hover:bg-red-50"
                title="Close tab"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        );
      })}

      {/* ── New tab + button ── */}
      <div className="flex items-center px-1">
        <button
          type="button"
          onClick={onAddTab}
          title="New query tab"
          className="flex items-center justify-center flex-shrink-0 transition-colors rounded-md"
          style={{
            width: 28,
            height: 28,
            color: "#6b7280",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#111827"; e.currentTarget.style.background = "#e2e4e9"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#6b7280"; e.currentTarget.style.background = "transparent"; }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-1" style={{ borderBottom: "1px solid #e5e7eb", marginBottom: -1 }} />
    </div>
  );
});

// ─── Main Editor ──────────────────────────────────────────────────────────────
export default function Editor() {
  const navigate = useNavigate();
  const { token, project, decodedToken, hostnameV1 } = useAuth();

  // ── Sidebar / connection state (shared across tabs) ───────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [connectionsLoading, setConnectionsLoading] = useState(true);
  const [policyIds, setPolicyIds] = useState([]);
  const [originalConnections, setOriginalConnections] = useState([]);
  const [displayedConnections, setDisplayedConnections] = useState([]);
  const [selectedConnection, setSelectedConnection] = useState("");
  const [schemas, setSchemas] = useState({});
  const [tables, setTables] = useState({});
  const [columns, setColumns] = useState({});
  const [expandedItems, setExpandedItems] = useState({});
  const [originalViews, setOriginalViews] = useState([]);
  const [displayedViews, setDisplayedViews] = useState([]);
  const [selectedView, setSelectedView] = useState("");

  // ── Multi-tab state ───────────────────────────────────────────────────────
  // `tabs[0].id` is valid here because useState initializer runs first,
  // making `tabs` available before `activeTabId` useState is called.
  const [tabs, setTabs] = useState(() => [createTab(1)]);
  const [activeTabId, setActiveTabId] = useState(tabs[0].id);
  const tabCounterRef = useRef(1);

  // Derive active tab — useMemo keeps the reference stable between renders
  // unless the actual tab object changes.
  const activeTab = useMemo(
    () => tabs.find((t) => t.id === activeTabId) ?? tabs[0],
    [tabs, activeTabId]
  );

  // ── Tab helpers ───────────────────────────────────────────────────────────
  /** Update any tab by id; supports functional patch `(prev) => patch` */
  const updateTab = useCallback((id, patchOrFn) => {
    setTabs((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const patch = typeof patchOrFn === "function" ? patchOrFn(t) : patchOrFn;
        return { ...t, ...patch };
      })
    );
  }, []);

  /** Shorthand: update the currently active tab */
  const updateActiveTab = useCallback(
    (patchOrFn) => {
      setTabs((prev) =>
        prev.map((t) => {
          if (t.id !== activeTabId) return t;
          const patch = typeof patchOrFn === "function" ? patchOrFn(t) : patchOrFn;
          return { ...t, ...patch };
        })
      );
    },
    [activeTabId]
  );

  const addTab = useCallback(() => {
    tabCounterRef.current += 1;
    const newTab = createTab(tabCounterRef.current);
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }, []);

  const deleteTab = useCallback(
    (id) => {
      setTabs((prev) => {
        if (prev.length <= 1) return prev; // never delete the last tab
        const idx = prev.findIndex((t) => t.id === id);
        const next = prev.filter((t) => t.id !== id);
        if (id === activeTabId) {
          // Prefer the right sibling, fall back to left
          setActiveTabId(next[Math.min(idx, next.length - 1)].id);
        }
        return next;
      });
    },
    [activeTabId]
  );

  const renameTab = useCallback((id, label) => {
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, label } : t)));
  }, []);

  // ── Shared (non-tab) state ────────────────────────────────────────────────
  const [pageSize, setPageSize] = useState(100);
  const [checked, setChecked] = useState(true); // true = Editor, false = Builder
  const [shownViews, setShownViews] = useState([]);
  const [isSaveViewModalOpen, setIsSaveViewModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isQueryModalOpen, setIsQueryModalOpen] = useState(false);
  const [queryLoading, setQueryLoading] = useState(false); // for query-details modal
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [apiDetails, setApiDetails] = useState({ viewName: "", curl: "" });
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [fullDataLoading, setFullDataLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editViewName, setEditViewName] = useState("");
  const [editOriginalPayload, setEditOriginalPayload] = useState(null);

  const downloadMenuRef = useRef(null);
  const ExternalAPI = window._env_?.VITE_EXTERNAL_API;

  // ── Resize ────────────────────────────────────────────────────────────────
  const [editorHeightPct, setEditorHeightPct] = useState(45);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const isDragging = useRef(false);
  const isHDragging = useRef(false);
  const panelRef = useRef(null);
  const containerRef = useRef(null);

  // ── Ace editor ────────────────────────────────────────────────────────────
  const aceEditorRef = useRef(null);
  // Ref mirrors activeTab so the Ace keyboard command closure always has the
  // latest query without re-mounting the editor.
  const activeTabRef = useRef(activeTab);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

  // ── Derived values from active tab ────────────────────────────────────────
  const orderedCols = useMemo(
    () => activeTab.colOrder.map((i) => activeTab.columnDefs[i]).filter(Boolean),
    [activeTab.colOrder, activeTab.columnDefs]
  );

  const sortedData = useMemo(() => {
    const sliced = activeTab.dataBuffer.slice(0, activeTab.displayCount);
    const { key, direction } = activeTab.sortConfig;
    if (!key) return sliced;
    return [...sliced].sort((a, b) => {
      const av = a[key], bv = b[key];
      if (typeof av === "number" && typeof bv === "number")
        return direction === "asc" ? av - bv : bv - av;
      return direction === "asc"
        ? String(av || "").localeCompare(String(bv || ""))
        : String(bv || "").localeCompare(String(av || ""));
    });
  }, [activeTab.dataBuffer, activeTab.displayCount, activeTab.sortConfig]);

  // ── Edit-mode (sessionStorage) ────────────────────────────────────────────
  useEffect(() => {
    const editModeStr = sessionStorage.getItem("editMode");
    const editName = sessionStorage.getItem("editViewName");
    const editPayloadStr = sessionStorage.getItem("editOriginalPayload");

    if (editModeStr === "true" && editName && editPayloadStr) {
      try {
        const payload = JSON.parse(editPayloadStr);
        if (payload.type === "Custom View") {
          setIsEditMode(true);
          setEditViewName(editName);
          setEditOriginalPayload(payload);
          if (payload.raw_query) updateActiveTab({ query: payload.raw_query });
        }
      } catch (err) {
        console.error("Error parsing edit payload:", err);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCancelEdit = () => {
    sessionStorage.removeItem("editMode");
    sessionStorage.removeItem("editViewName");
    sessionStorage.removeItem("editOriginalPayload");
    navigate("/federation");
  };

  // ── Click-outside → close download menu ──────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target))
        setShowDownloadMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Fetch connections + views (React Query) ───────────────────────────────
  const {
    data: federationData,
    isFetching: isFedFetching,
    refetch: refetchFederationData,
  } = useFederationConnections();
  const { data: builderViews, refetch: refetchBuilderViews } = useFederationBuilderViews();
  const { refetch: refetchPolicyIds } = useFederationPolicyIds();

  useEffect(() => {
    if (federationData) {
      setOriginalConnections(federationData.connections);
      setOriginalViews(federationData.views);
      setPolicyIds(federationData.policyIds);
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

  useEffect(() => {
    if (builderViews) setShownViews(builderViews);
  }, [builderViews]);

  // ── Toast helper ──────────────────────────────────────────────────────────
  const showToast = useCallback((message, type = "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  }, []);

  // ── Refresh sidebar ───────────────────────────────────────────────────────
  const refreshConnections = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (token) delete sidebarDataCache[token];
    setSearchTerm("");
    setSchemas({});
    setTables({});
    setColumns({});
    setExpandedItems({});
    setSelectedConnection("");
    setSelectedView("");
    setConnectionsLoading(true);
    try {
      await refetchPolicyIds();
      await Promise.all([refetchFederationData(), refetchBuilderViews()]);
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
        setSchemas((p) => ({
          ...p,
          [connection]: connectionData ? connectionData[connection] : [],
        }));
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
          body: JSON.stringify({
            matched_policy_ids: policyIds,
            connection_name: connection,
            schema_name: [schema],
          }),
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        const tableData = data.schemas.find(
          (item) =>
            item.connection_name.toLowerCase() === connection.toLowerCase() &&
            item.schema.toLowerCase() === schema.toLowerCase()
        );
        setTables((p) => ({
          ...p,
          [`${connection}-${schema}`]: tableData?.tables ?? [],
        }));
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
          body: JSON.stringify({
            matched_policy_ids: policyIds,
            connection_name: connection,
            schema_name: [schema],
            table_name: [table],
          }),
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
        setColumns((p) => ({
          ...p,
          [`${connection}-${schema}-${table}`]: formatted,
        }));
      } catch (err) {
        setColumns((p) => ({ ...p, [`${connection}-${schema}-${table}`]: "error" }));
        showToast(`Failed to load columns: ${err.message}`);
      }
    }
  };

  const handleTableDoubleClick = (connection, schema, table) => {
    const q = `Select * from ${connection}.${schema}.${table}`;
    updateActiveTab({ query: q, securedQuery: "" });
    executeQuery(q);
  };

  // ── View handlers ─────────────────────────────────────────────────────────
  const handleViewClick = (viewName) => setSelectedView(viewName);

  const handleViewDoubleClick = (viewName) => {
    if (activeTab.loading) return;
    const q = `SELECT * FROM ${viewName}`;
    updateActiveTab({ query: q, securedQuery: "" });
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

  const generateCurl = async (viewName) => {
    try {
      const url = `${ExternalAPI}/view/${viewName}`;
      const res = await fetch(`${hostnameV1}/generate_curl`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url, page: 1 }),
      });
      return await res.text();
    } catch {
      return "Error generating cURL";
    }
  };

  // ── Execute query (tab-aware) ──────────────────────────────────────────────
  // `tabId` is captured at call-time so async updates always target the right
  // tab even if the user switches while the query is running.
  // `nextUri` is passed explicitly for the append case to avoid stale state.
  const executeQuery = async (
    queryText,
    { append = false, tabId: _tabId, nextUri: _nextUri } = {}
  ) => {
    const execTabId = _tabId ?? activeTabId;
    const newQuery = removeComments(queryText);
    if (!newQuery.trim()) { showToast("Enter query first"); return; }

    // Shared row-mapping utility
    const mapRows = (d, cols) => {
      if (!d?.length || !cols?.length) return [];
      const names = cols.map((c) => c.name);
      return d.map((rowArray) => {
        const obj = {};
        names.forEach((name, idx) => { obj[name] = rowArray[idx]; });
        return obj;
      });
    };

    // ── Initial state update ──────────────────────────────────────────────
    if (append) {
      if (!_nextUri) return;
      updateTab(execTabId, { loadingMore: true });
    } else {
      updateTab(execTabId, {
        dataBuffer: [],
        displayCount: pageSize,
        columnDefs: [],
        colOrder: [],
        sortConfig: { key: "", direction: "asc" },
        viewsDetails: null,
        loading: true,
        nextUri: null,
        queryError: null,
        querySuccess: false,
        showResults: true,
      });
    }

    try {
      if (!append) {
        // ── Governance ──────────────────────────────────────────────────────
        const sqRes = await fetch(`${window._env_?.VITE_FAST_API}/editor-governance`, {
          method: "POST",
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ user_query: newQuery }),
        });

        if (!sqRes.ok) {
          const errData = await sqRes.json();
          if (errData.detail?.toLowerCase().includes("access denied")) {
            await fetch(`${hostnameV1}/save_query`, {
              method: "POST",
              headers: {
                accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                query: newQuery,
                status: "failed",
                owner: decodedToken?.preferred_username,
                project: project === "default" || project === "none" ? "default" : project,
                type: "df",
              }),
            });
          }
          updateTab(execTabId, {
            queryError: errData.detail || "Error in query validation",
          });
          return;
        }

        const sqData = await sqRes.json();
        if (!sqData?.governed_query) {
          updateTab(execTabId, { queryError: "Invalid response from editor-governance" });
          return;
        }
        const secureQueryStr = sqData.governed_query;
        updateTab(execTabId, { securedQuery: secureQueryStr });

        // ── Run query ───────────────────────────────────────────────────────
        const runRes = await fetch(`${hostnameV1}/runQueryNative`, {
          method: "POST",
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            query: secureQueryStr,
            project: project === "default" || project === "none" ? "default" : project,
            created_by: decodedToken?.preferred_username,
          }),
        });

        if (!runRes.ok) {
          const text = await runRes.text();
          let errMsg = "Error in query execution";
          try { errMsg = JSON.parse(text).detail || errMsg; } catch { errMsg = text || errMsg; }
          updateTab(execTabId, { queryError: errMsg });
          return;
        }

        let resData = await runRes.json();
        let currentCols = resData.columns || [];
        let aggregatedRows = mapRows(resData.data, currentCols);
        let currentNextUri = resData.next_uri;

        // Poll until we have at least `pageSize` rows
        while (aggregatedRows.length < pageSize && currentNextUri) {
          const pollRes = await fetch(`${hostnameV1}/runQueryNative/next`, {
            method: "POST",
            headers: {
              accept: "application/json",
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ next_uri: currentNextUri }),
          });
          if (!pollRes.ok) {
            const pollErrText = await pollRes.text();
            let pollErrMsg = "Error in query execution";
            try { pollErrMsg = JSON.parse(pollErrText).detail || pollErrMsg; } catch { pollErrMsg = pollErrText || pollErrMsg; }
            updateTab(execTabId, { queryError: pollErrMsg, dataBuffer: [], columnDefs: [], colOrder: [] });
            return;
          }
          const pollData = await pollRes.json();
          if (pollData.error) {
            updateTab(execTabId, { queryError: pollData.error || "Query returned an error", dataBuffer: [], columnDefs: [], colOrder: [] });
            return;
          }
          if (!currentCols.length && pollData.columns) currentCols = pollData.columns;
          aggregatedRows = aggregatedRows.concat(mapRows(pollData.data, currentCols));
          currentNextUri = pollData.next_uri;
        }

        const colNames = currentCols.map((c) => c.name);
        updateTab(execTabId, {
          columnDefs: colNames,
          colOrder: colNames.map((_, i) => i),
          sortConfig: { key: "", direction: "asc" },
          dataBuffer: aggregatedRows,
          displayCount: pageSize,
          nextUri: currentNextUri || null,
          hasMore: !!currentNextUri,
          querySuccess: true,
          executedQuery: newQuery,
        });

        // Fire-and-forget query history save
        fetch(`${hostnameV1}/save_query`, {
          method: "POST",
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            query: newQuery,
            status: "success",
            owner: decodedToken?.preferred_username,
            project: project === "default" || project === "none" ? "default" : project,
            type: "df",
          }),
        });

      } else {
        // ── Append / load-more path ─────────────────────────────────────────
        const runRes = await fetch(`${hostnameV1}/runQueryNative/next`, {
          method: "POST",
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ next_uri: _nextUri }),
        });

        if (!runRes.ok) {
          const text = await runRes.text();
          let errMsg = "Error in query execution";
          try { errMsg = JSON.parse(text).detail || errMsg; } catch { errMsg = text || errMsg; }
          updateTab(execTabId, { queryError: errMsg });
          return;
        }

        let resData = await runRes.json();
        let currentCols = resData.columns || [];
        let aggregatedRows = mapRows(resData.data, currentCols);
        let currentNextUri = resData.next_uri;

        while (aggregatedRows.length < pageSize && currentNextUri) {
          const pollRes = await fetch(`${hostnameV1}/runQueryNative/next`, {
            method: "POST",
            headers: {
              accept: "application/json",
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ next_uri: currentNextUri }),
          });
          if (!pollRes.ok) break;
          const pollData = await pollRes.json();
          if (pollData.error) break;
          if (!currentCols.length && pollData.columns) currentCols = pollData.columns;
          aggregatedRows = aggregatedRows.concat(mapRows(pollData.data, currentCols));
          currentNextUri = pollData.next_uri;
        }

        // Append to existing buffer using functional update to avoid stale refs
        updateTab(execTabId, (prev) => ({
          dataBuffer: [...prev.dataBuffer, ...aggregatedRows],
          displayCount: prev.displayCount + pageSize,
          nextUri: currentNextUri || null,
          hasMore: !!currentNextUri,
        }));
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      showToast("Unexpected error occurred");
    } finally {
      updateTab(execTabId, append ? { loadingMore: false } : { loading: false });
    }
  };

  // ── Infinite scroll ───────────────────────────────────────────────────────
  const handleResultsScroll = (e) => {
    const { loading, loadingMore, displayCount, dataBuffer, hasMore, nextUri, query } =
      activeTab;
    if (loading || loadingMore) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 120) {
      if (displayCount < dataBuffer.length) {
        updateActiveTab({ displayCount: displayCount + pageSize });
      } else if (hasMore && nextUri) {
        // Capture IDs at scroll time to avoid closure stale issues
        const snapTabId = activeTabId;
        const snapNextUri = nextUri;
        executeQuery(query, { append: true, tabId: snapTabId, nextUri: snapNextUri });
      }
    }
  };

  // ── Column drag-reorder & sort ────────────────────────────────────────────
  const dragSrcCol = useRef(null);

  const handleColDragStart = (e, vi) => {
    dragSrcCol.current = vi;
    e.dataTransfer.effectAllowed = "move";
  };
  const handleColDragOver = (e, vi) => {
    e.preventDefault();
    updateActiveTab({ dragOverCol: vi });
  };
  const handleColDrop = (e, vi) => {
    e.preventDefault();
    const src = dragSrcCol.current;
    if (src === null || src === vi) { updateActiveTab({ dragOverCol: null }); return; }
    const next = [...activeTab.colOrder];
    const [m] = next.splice(src, 1);
    next.splice(vi, 0, m);
    updateActiveTab({ colOrder: next, dragOverCol: null });
    dragSrcCol.current = null;
  };
  const handleColDragEnd = () => {
    updateActiveTab({ dragOverCol: null });
    dragSrcCol.current = null;
  };
  const handleSort = (key) =>
    updateActiveTab({
      sortConfig: {
        key,
        direction:
          activeTab.sortConfig.key === key && activeTab.sortConfig.direction === "asc"
            ? "desc"
            : "asc",
      },
    });

  // ── Query Details ─────────────────────────────────────────────────────────
  const handleQueryDetails = async () => {
    if (!activeTab.securedQuery) return;
    if (activeTab.viewsDetails === null) {
      try {
        setQueryLoading(true);
        setIsQueryModalOpen(true);
        const res = await fetch(`${hostnameV1}/analyzeQuery`, {
          method: "POST",
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ sql_query: activeTab.securedQuery, pageNo: 1 }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        updateActiveTab({ viewsDetails: (await res.json()) || null });
      } catch {
        updateActiveTab({ viewsDetails: { status: "Failed", message: "Unable to fetch data" } });
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
    if (!rows?.length) return "";
    const headers = Object.keys(rows[0]).join(",");
    return [headers, ...rows.map((r) => Object.values(r).map((v) => `"${v}"`).join(","))].join("\n");
  };

  const downloadCSV = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = Object.assign(document.createElement("a"), {
      href: url,
      download: filename,
      style: { visibility: "hidden" },
    });
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadCurrentPage = () => {
    setShowDownloadMenu(false);
    const currentData = activeTab.dataBuffer.slice(0, activeTab.displayCount);
    if (!currentData.length) { showToast("No data to download"); return; }
    downloadCSV(convertToCSV(currentData), "data_current_view.csv");
  };

  const handleDownloadFullData = async () => {
    setShowDownloadMenu(false);
    if (!activeTab.securedQuery) { showToast("Run a query first to download full data"); return; }
    setFullDataLoading(true);
    showToast("Fetching full data sequentially, please wait…", "success");
    try {
      let res = await fetch(`${hostnameV1}/runQueryNative`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: activeTab.securedQuery,
          project: project === "default" || project === "none" ? "default" : project,
          created_by: decodedToken?.preferred_username,
        }),
      });
      if (!res.ok) throw new Error("Failed to start full fetch");

      let allRows = [];
      let resData = await res.json();
      let currentNextUri = resData.next_uri;

      const appendData = (dataChunk, cols) => {
        if (!dataChunk?.length) return;
        const colNames = cols.map((c) => c.name);
        const rows = dataChunk.map((rowArray) => {
          const obj = {};
          colNames.forEach((n, idx) => (obj[n] = rowArray[idx]));
          return obj;
        });
        allRows = allRows.concat(rows);
      };

      appendData(resData.data, resData.columns);

      while (currentNextUri) {
        res = await fetch(`${hostnameV1}/runQueryNative/next`, {
          method: "POST",
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
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
    } catch {
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
      setEditorHeightPct(Math.min(80, Math.max(20, ((ev.clientY - rect.top) / rect.height) * 100)));
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

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col bg-[#f7f8fa] p-4">
      <style>{EDITOR_STYLES}</style>

      {/* Breadcrumb */}
      <div className="flex-shrink-0 -mb-1">
        <Breadcrumb
          title="Platform"
          link="/"
          title2="Federation"
          link2="/federation"
          title3={checked ? "Editor" : "Query Views"}
        />
      </div>

      {/* Edit-mode banner */}
      {isEditMode && (
        <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2.5 mb-1 rounded-lg bg-[#f3f0fb] border border-[#d4cbe8] shadow-sm">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-[#e9e4f5]">
            <Pencil size={14} className="text-[#8e78b7]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium text-[#9b8eb5] leading-none mb-0.5 uppercase tracking-wide">
              Editing View
            </p>
            <p className="text-[13px] font-semibold text-[#5a4780] truncate" title={editViewName}>
              {editViewName}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCancelEdit}
            className="flex items-center gap-1.5 text-[12.5px] font-medium text-[#8e78b7] hover:text-white hover:bg-[#8e78b7] px-3 py-1.5 rounded-md transition-colors border border-[#c4b5e8] hover:border-[#8e78b7]"
            title="Cancel editing and go back to Federation"
          >
            Cancel Edit
          </button>
        </div>
      )}

      {/* Main layout */}
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
              queryLoading={activeTab.loading}
            />

            {/* Horizontal drag handle */}
            <div
              className="w-1.5 flex-shrink-0 flex items-center justify-center bg-gray-100 border-x border-gray-200 cursor-col-resize hover:bg-[#ede9f6] active:bg-[#ede9f6] transition-colors z-10 relative"
              onMouseDown={handleSidebarDragStart}
            >
              <div className="flex flex-col gap-0.5">
                {[0, 1, 2, 3, 4].map((i) => (
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
              <div
                className="flex items-center gap-2 px-4 flex-shrink-0"
                style={{
                  height: 46,
                  background: "#ffffff",
                  borderBottom: "1px solid #e9e4f5",
                  boxShadow: "0 1px 3px rgba(142,120,183,0.06)",
                }}
              >
                {/* Run */}
                <button
                  type="button"
                  onClick={() => executeQuery(activeTab.query)}
                  disabled={activeTab.loading}
                  className="flex items-center gap-1.5 bg-[#8e78b7] hover:bg-[#79669c] disabled:opacity-60 disabled:cursor-not-allowed text-white text-[13px] font-semibold px-4 py-[7px] rounded-lg transition-colors whitespace-nowrap"
                >
                  {activeTab.loading ? (
                    <div className="w-3 h-3 rounded-full border-[1.5px] border-white/40 border-t-white animate-spin" />
                  ) : (
                    <Play size={13} fill="white" />
                  )}
                  {activeTab.loading ? "Running…" : "Run"}
                </button>

                {/* Divider */}
                <div className="w-px h-5 bg-gray-200 mx-1" />

                {/* Create / Edit View */}
                <button
                  type="button"
                  title={
                    !(activeTab.querySuccess && activeTab.dataBuffer.length > 0)
                      ? isEditMode
                        ? "First run a successful query to update the view"
                        : "First run a successful query to create a view"
                      : ""
                  }
                  onClick={() => setIsSaveViewModalOpen(true)}
                  disabled={!(activeTab.querySuccess && activeTab.dataBuffer.length > 0)}
                  className="qe-btn-secondary flex items-center gap-1.5 text-[13px] font-medium px-3.5 py-[7px] rounded-lg whitespace-nowrap"
                  style={{
                    background: (activeTab.querySuccess && activeTab.dataBuffer.length > 0) ? "#f8f5ff" : "#f5f5f5",
                    border: "1px solid",
                    borderColor: (activeTab.querySuccess && activeTab.dataBuffer.length > 0) ? "#c4b5e8" : "#e0e0e0",
                    color: (activeTab.querySuccess && activeTab.dataBuffer.length > 0) ? "#7c63b0" : "#b0b0b0",
                    cursor: (activeTab.querySuccess && activeTab.dataBuffer.length > 0) ? "pointer" : "not-allowed",
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  {isEditMode ? "Edit Custom View" : "Create Custom View"}
                </button>

                <div className="flex-1" />

                {/* History */}
                <button
                  type="button"
                  onClick={() => setIsHistoryOpen(true)}
                  className="qe-btn-secondary flex items-center gap-1.5 text-[12.5px] font-medium px-3 py-[7px] rounded-lg whitespace-nowrap"
                  style={{ border: "1px solid #e5dff5", color: "#7c6fa0", background: "#faf8ff" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#c4b5e8"; e.currentTarget.style.color = "#5a4780"; e.currentTarget.style.background = "#f3f0fb"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e5dff5"; e.currentTarget.style.color = "#7c6fa0"; e.currentTarget.style.background = "#faf8ff"; }}
                >
                  <History size={13} />
                  History
                </button>

                {!isEditMode && (
                  <>
                    {/* Page size badge */}
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        const newSize = Number(e.target.value);
                        setPageSize(newSize);
                        updateActiveTab({ displayCount: newSize });
                      }}
                      className="text-[12px] font-medium cursor-pointer outline-none rounded-lg px-2.5 py-[7px]"
                      style={{ border: "1px solid #e5dff5", color: "#7c6fa0", background: "#faf8ff" }}
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
                        className="qe-btn-secondary flex items-center gap-1.5 text-[12.5px] font-medium px-3 py-[7px] rounded-lg whitespace-nowrap"
                        style={{ border: "1px solid #e5dff5", color: "#7c6fa0", background: "#faf8ff" }}
                        onMouseEnter={(e) => { if (!fullDataLoading) { e.currentTarget.style.borderColor = "#c4b5e8"; e.currentTarget.style.color = "#5a4780"; e.currentTarget.style.background = "#f3f0fb"; } }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e5dff5"; e.currentTarget.style.color = "#7c6fa0"; e.currentTarget.style.background = "#faf8ff"; }}
                      >
                        {fullDataLoading ? (
                          <div className="w-3 h-3 rounded-full border-[1.5px] border-[#e0d9f5] border-t-[#8e78b7] animate-spin" />
                        ) : (
                          <Download size={13} />
                        )}
                        Export
                        <ChevronDown size={10} className={`transition-transform duration-150 ${showDownloadMenu ? "rotate-180" : ""}`} />
                      </button>
                      {showDownloadMenu && (
                        <div
                          className="absolute top-full right-0 mt-1.5 bg-white rounded-xl overflow-hidden z-50 w-52"
                          style={{ border: "1px solid #e5dff5", boxShadow: "0 8px 24px rgba(100,80,160,0.14), 0 2px 6px rgba(100,80,160,0.08)" }}
                        >
                          <button
                            className="flex items-center gap-2.5 w-full px-4 py-3 text-[13px] text-gray-700 hover:bg-[#f8f5ff] transition-colors"
                            onClick={handleDownloadCurrentPage}
                          >
                            <div className="w-7 h-7 rounded-lg bg-[#f0edf8] flex items-center justify-center flex-shrink-0">
                              <Download size={12} className="text-[#8e78b7]" />
                            </div>
                            <div className="text-left">
                              <div className="font-medium text-[12.5px] text-gray-700">Loaded View</div>
                              <div className="text-[11px] text-gray-400">
                                {activeTab.dataBuffer.slice(0, activeTab.displayCount).length} rows visible
                              </div>
                            </div>
                          </button>
                          <div className="mx-3 h-px bg-gray-100" />
                          <button
                            className="flex items-center gap-2.5 w-full px-4 py-3 text-[13px] text-gray-700 hover:bg-[#f8f5ff] transition-colors"
                            onClick={handleDownloadFullData}
                          >
                            <div className="w-7 h-7 rounded-lg bg-[#f0edf8] flex items-center justify-center flex-shrink-0">
                              <Download size={12} className="text-[#8e78b7]" />
                            </div>
                            <div className="text-left">
                              <div className="font-medium text-[12.5px] text-gray-700">Full Data</div>
                              <div className="text-[11px] text-gray-400">All pages · may take a moment</div>
                            </div>
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Editor ↔ Builder toggle */}
                {!isEditMode && (
                  <div
                    className="flex items-center gap-1.5 pl-2"
                    style={{ borderLeft: "1px solid #e9e4f5" }}
                  >
                    <Switch
                      checked={checked}
                      onChange={() => {
                        updateActiveTab({ dataBuffer: [], columnDefs: [], colOrder: [], query: "" });
                        setChecked(!checked);
                      }}
                      inputProps={{ "aria-label": "controlled" }}
                      size="small"
                      sx={{
                        "& .MuiSwitch-switchBase.Mui-checked": { color: "#8e78b7" },
                        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                          backgroundColor: "#c4b5e8",
                        },
                      }}
                    />
                    <span className="text-[12.5px] font-medium whitespace-nowrap" style={{ color: "#7c6fa0" }}>
                      {checked ? "Editor" : "Query Views"}
                    </span>
                  </div>
                )}
              </div>

              {/* ── Tab bar ── */}
              <TabBar
                tabs={tabs}
                activeTabId={activeTabId}
                onTabClick={setActiveTabId}
                onTabClose={deleteTab}
                onTabRename={renameTab}
                onAddTab={addTab}
              />

              {/* ── Ace Editor pane ── */}
              <div
                style={
                  activeTab.showResults
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
                  setOptions={{
                    enableBasicAutocompletion: true,
                    enableLiveAutocompletion: true,
                    enableSnippets: true,
                  }}
                  value={activeTab.query}
                  onChange={(v) => updateActiveTab({ query: v, querySuccess: false })}
                  ref={aceEditorRef}
                  commands={[
                    {
                      name: "executeQuery",
                      bindKey: { win: "Ctrl-Enter", mac: "Command-Enter" },
                      exec: () => {
                        const ace = aceEditorRef.current?.editor;
                        const sel = ace ? ace.getSelectedText() : "";
                        executeQuery(sel?.trim() ? sel : activeTabRef.current.query);
                      },
                    },
                  ]}
                  style={{ width: "100%", height: "100%" }}
                  showLineNumbers
                />
              </div>

              {/* ── Vertical drag handle ── */}
              {activeTab.showResults && (
                <div
                  className="h-2 flex-shrink-0 flex items-center justify-center bg-gray-50 border-y border-gray-200 cursor-row-resize hover:bg-[#ede9f6] transition-colors select-none"
                  onMouseDown={handleDragStart}
                >
                  <div className="flex gap-0.5">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <span key={i} className="w-1 h-1 rounded-full bg-gray-400" />
                    ))}
                  </div>
                </div>
              )}

              {/* ── Results pane ── */}
              {activeTab.showResults && (
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  {/* Results header */}
                  <div className="flex items-center justify-between border-b border-gray-200 bg-white flex-shrink-0">
                    <div className="flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-semibold text-[#8e78b7] border-b-2 border-[#8e78b7] whitespace-nowrap">
                      <svg
                        width="14" height="14" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <path d="M3 9h18M3 15h18M9 3v18" />
                      </svg>
                      Results
                      {activeTab.dataBuffer.length > 0 && (
                        <span className="text-[11px] font-normal text-gray-400 ml-1">
                          · {activeTab.dataBuffer.slice(0, activeTab.displayCount).length}
                          {" / "}
                          {activeTab.dataBuffer.length}
                          {activeTab.hasMore ? "+" : ""} rows
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5 mr-1">
                      <button
                        type="button"
                        title="Query Details"
                        onClick={handleQueryDetails}
                        disabled={!activeTab.securedQuery}
                        className="text-gray-400 hover:text-[#8e78b7] disabled:opacity-40 disabled:cursor-not-allowed p-1.5 rounded transition-colors"
                      >
                        <Info size={15} />
                      </button>
                      <button
                        type="button"
                        title="Close results"
                        onClick={() => updateActiveTab({ showResults: false })}
                        className="text-gray-400 hover:text-[#8e78b7] p-1.5 rounded transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Results body */}
                  <div className="qe-scroll flex-1 overflow-auto bg-white min-h-0">
                    {activeTab.loading ? (
                      <div className="flex items-center justify-center h-full">
                        <CircularProgress sx={{ color: "#8e78b7" }} />
                      </div>
                    ) : activeTab.queryError ? (
                      <div className="flex flex-col items-center justify-center h-full px-6">
                        <svg
                          width="30" height="30" viewBox="0 0 24 24"
                          fill="none" stroke="#f87171" strokeWidth="1.5"
                          strokeLinecap="round" strokeLinejoin="round"
                          className="mb-3 opacity-80"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <p className="text-[14px] font-medium text-gray-600 mb-2">Query failed</p>
                        <p className="text-[12px] text-gray-500 font-mono text-center leading-relaxed max-w-xl break-words">
                          {activeTab.queryError}
                        </p>
                      </div>
                    ) : sortedData.length > 0 ? (
                      <ResultsTable
                        orderedCols={orderedCols}
                        sortedData={sortedData}
                        dragOverCol={activeTab.dragOverCol}
                        sortConfig={activeTab.sortConfig}
                        handleColDragStart={handleColDragStart}
                        handleColDragOver={handleColDragOver}
                        handleColDrop={handleColDrop}
                        handleColDragEnd={handleColDragEnd}
                        handleSort={handleSort}
                        loadingMore={activeTab.loadingMore}
                        hasMore={activeTab.hasMore}
                        displayCount={activeTab.displayCount}
                        dataBufferLength={activeTab.dataBuffer.length}
                        handleResultsScroll={handleResultsScroll}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full select-none">
                        <span className="text-[30px] font-light text-[#c4b5e8] tracking-widest mb-2.5">
                          &lt;/&gt;
                        </span>
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
            handleSwitch={() => {
              updateActiveTab({ dataBuffer: [], columnDefs: [], colOrder: [], query: "" });
              setChecked(!checked);
            }}
            checked={checked}
          />
        )}
      </div>

      {/* ── Modals ── */}
      <QueryDetailsModal
        isOpen={isQueryModalOpen}
        onClose={() => setIsQueryModalOpen(false)}
        viewsDetails={activeTab.viewsDetails}
        queryLoading={queryLoading}
      />
      <ApiDetailsModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
        apiDetails={apiDetails}
      />
      <EditorSaveViewModal
        isOpen={isSaveViewModalOpen}
        onClose={() => setIsSaveViewModalOpen(false)}
        query={activeTab.executedQuery}
        securedQuery={activeTab.securedQuery}
        project={project}
        policyIds={policyIds}
        onSaveSuccess={(savedViewName) => {
          showToast(`View ${savedViewName} saved successfully.`, "success");
        }}
        isEditMode={isEditMode}
        editViewName={editViewName}
        editOriginalPayload={editOriginalPayload}
      />
      <QueryHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectQuery={(q) => updateActiveTab({ query: q })}
      />
    </div>
  );
}