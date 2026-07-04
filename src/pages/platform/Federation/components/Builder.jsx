import CircularProgress from "@mui/material/CircularProgress";
import { useVirtualizer } from "@tanstack/react-virtual";
import Switch from "@mui/material/Switch";
import { ChevronDown, X, Download, ArrowUpDown, GripVertical, Play, Info } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { QueryDetailsModal, EditorToast } from "./EditorModals";

function CustomSelect({ options, value, onChange, placeholder = "Select View" }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const filtered = options
        .filter((o) => typeof o === "string" || typeof o === "number")
        .filter((o) => String(o).toLowerCase().includes(search.toLowerCase()));

    const handleSelect = (val) => {
        onChange(val);
        setOpen(false);
        setSearch("");
    };

    return (
        <div ref={ref} className="relative w-56">
            {/* Trigger */}
            <div
                onClick={() => setOpen((p) => !p)}
                title={value || ""}
                className="flex items-center justify-between px-3 py-1.5 bg-white border border-gray-200 rounded-md cursor-pointer select-none text-[13px] hover:border-[#8e78b7] transition-colors"
            >
                <span className={`truncate max-w-[170px] ${value ? "text-gray-700" : "text-gray-400"}`}>
                    {value || placeholder}
                </span>
                <svg
                    width="14" height="14" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2"
                    className={`flex-shrink-0 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                >
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </div>

            {/* Dropdown */}
            {open && (
                <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-gray-200 rounded-lg shadow-xl z-[9999] overflow-hidden">
                    {/* Search */}
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
                        <svg
                            width="13" height="13" viewBox="0 0 24 24"
                            fill="none" stroke="currentColor" strokeWidth="2"
                            className="flex-shrink-0 text-gray-400"
                        >
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            autoFocus
                            type="text"
                            placeholder="Search view..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full text-[13px] text-gray-600 placeholder-gray-400 outline-none bg-transparent"
                        />
                    </div>

                    {/* Options */}
                    <div className="max-h-52 overflow-y-auto">
                        {filtered.length === 0 ? (
                            <div className="px-4 py-3 text-[13px] text-gray-400 text-center">
                                No results found
                            </div>
                        ) : (
                            filtered.map((opt) => (
                                <div
                                    key={opt}
                                    title={opt}
                                    onClick={() => handleSelect(opt)}
                                    className={`px-4 py-2.5 text-[13px] cursor-pointer truncate transition-colors ${
                                        opt === value
                                            ? "text-[#79669c] font-medium bg-[#ede9f6]"
                                            : "text-gray-700 hover:bg-[#f0edf8]"
                                    }`}
                                >
                                    {opt}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

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
    handleResultsScroll,
    toTitleCase
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
        <div className="h-full overflow-auto qe-scroll" onScroll={handleResultsScroll} ref={tableContainerRef}>
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
                                title={toTitleCase(col)}
                                onClick={() => handleSort(col)}
                                className={`text-left px-3.5 py-2.5 text-[12px] font-semibold text-gray-600 bg-gray-50 border-b border-gray-200 whitespace-nowrap cursor-grab select-none sticky top-0 z-10 ${dragOverCol === vi ? "border-l-2 border-l-[#8e78b7]" : ""}`}
                            >
                                <div className="flex items-center gap-1">
                                    <GripVertical size={11} className="opacity-40 flex-shrink-0" />
                                    <span className="overflow-hidden text-ellipsis whitespace-nowrap">{toTitleCase(col)}</span>
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
                                            title={String(val ?? "")}
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
            {!hasMore && !loadingMore && (
                <div className="text-center text-[11px] text-gray-400 py-3 select-none">
                    No more rows
                </div>
            )}
        </div>
    );
};

/* ─────────────────────────────────────────────
   Builder
──────────────────────────────────────────────── */
export default function Builder({ handleSwitch, checked, views = [] }) {
    const { token, hostnameV1 } = useAuth();

    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [data, setData] = useState([]);
    const [columnDefs, setColumnDefs] = useState([]);
    const [selectedView, setSelectedView] = useState("");
    const [showResults, setShowResults] = useState(false);
    const [toast, setToast] = useState({ show: false, message: "", type: "" });

    const [pageSize, setPageSize] = useState(100);
    const [pageNo, setPageNo] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    const [fullDataLoading, setFullDataLoading] = useState(false);
    const downloadMenuRef = useRef(null);

    const [queryLoading, setQueryLoading] = useState(false);
    const [isQueryModalOpen, setIsQueryModalOpen] = useState(false);
    const [viewsDetails, setViewsDetails] = useState(null);
    const ExternalAPI= window._env_?.VITE_EXTERNAL_API;

    const [colOrder, setColOrder] = useState([]);
    const [dragOverCol, setDragOverCol] = useState(null);
    const dragSrcCol = useRef(null);
    const [sortConfig, setSortConfig] = useState({ key: "", direction: "asc" });

    useEffect(() => {
        setColOrder(columnDefs.map((_, i) => i));
        setSortConfig({ key: "", direction: "asc" });
    }, [columnDefs]);

    const orderedCols = colOrder.map((i) => columnDefs[i]);
    const handleColDragStart = (e, vi) => { dragSrcCol.current = vi; e.dataTransfer.effectAllowed = "move"; };
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
        setSortConfig((prev) => ({ key, direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc" }));
    const sortedData = [...data].sort((a, b) => {
        if (!sortConfig.key) return 0;
        const av = a[sortConfig.key], bv = b[sortConfig.key];
        if (typeof av === "number" && typeof bv === "number")
            return sortConfig.direction === "asc" ? av - bv : bv - av;
        return sortConfig.direction === "asc"
            ? String(av || "").localeCompare(String(bv || ""))
            : String(bv || "").localeCompare(String(av || ""));
    });
    const toTitleCase = (s) => s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

    // ── Toast helper ──────────────────────────────────────────────────────────
    const showToast = (message, type = "error") => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
    };

    // ── Click outside → close download menu ──────────────────────────────────
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target)) {
                setShowDownloadMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // ── CSV helpers ───────────────────────────────────────────────────────────
    const convertToCSV = (jsonData) => {
        const headers = Object.keys(jsonData[0]).join(",");
        const csvRows = jsonData.map((obj) => Object.values(obj).map((val) => `"${val}"`).join(","));
        return [headers, ...csvRows].join("\n");
    };
    const downloadCSV = (csvContent, filename) => {
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
    const handleDownloadCurrentPage = () => {
        setShowDownloadMenu(false);
        if (!data.length) { showToast("No data to download"); return; }
        downloadCSV(convertToCSV(data), `data_page_${pageNo}.csv`);
    };

    // ── Core fetch: one page of the selected view ────────────────────────────
    // Throws Error("EMPTY") when the table/page has no rows, so callers can
    // distinguish "nothing to show" from a real failure.
    const fetchViewData = async (page, size = pageSize) => {
        const cachingResponse = await fetch(`${hostnameV1}/checkCaching/${selectedView}`);
        const cachingData = await cachingResponse.json();
        const payload = { page, page_size: size };

        const response = await fetch(`${hostnameV1}/execute_view/${selectedView}`, {
            method: "POST",
            headers: { accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(payload),
        });

        if (cachingData.result) {
            const json = await response.json().catch(() => null);
            if (response.status !== 200) throw new Error(json?.detail || "Error fetching data");
            if (json?.detail) throw new Error("EMPTY");
            return Array.isArray(json) ? json : [];
        }

        const text = await response.text();
        if (response.status !== 200) {
            let detail = "Error fetching data";
            try { detail = JSON.parse(text)?.detail || detail; } catch { /* not JSON */ }
            throw new Error(detail);
        }
        const rows = text
            .trim()
            .split("\n")
            .filter((r) => r.trim() !== "")
            .map((r) => { try { return JSON.parse(r); } catch { return null; } })
            .filter(Boolean);
        if (rows.length === 0) throw new Error("EMPTY");
        return rows;
    };

    const handleDownloadFullData = async () => {
        setShowDownloadMenu(false);
        if (!selectedView) { showToast("Select a view first to download full data"); return; }
        setFullDataLoading(true);
        showToast("Fetching full data, please wait…", "success");
        try {
            let allRows = [];
            let page = 1;
            const batchSize = 1000;
            while (true) {
                let rows;
                try {
                    rows = await fetchViewData(page, batchSize);
                } catch (err) {
                    if (err.message === "EMPTY") break;
                    throw err;
                }
                allRows = allRows.concat(rows);
                if (rows.length < batchSize) break;
                page++;
            }
            if (!allRows.length) { showToast("No data available to download"); return; }
            downloadCSV(convertToCSV(allRows), `${selectedView}_full_${Date.now()}.csv`);
            showToast(`Downloaded ${allRows.length} rows successfully`, "success");
        } catch (err) {
            showToast("Failed to download full data");
        } finally {
            setFullDataLoading(false);
        }
    };

    const handleViewChange = (value) => {
        setSelectedView(value);
        setColumnDefs([]);
        setData([]);
        setShowResults(false);
        setViewsDetails(null);
    };

    // ── Execute (append=true fetches the next page for infinite scroll) ──────
    const executeQuery = async (page = 1, { append = false } = {}) => {
        if (!selectedView) { showToast("Select a view first"); return; }

        if (append) {
            setLoadingMore(true);
        } else {
            setLoading(true);
            setData([]);
            setColumnDefs([]);
            setViewsDetails(null);
        }
        setShowResults(true);

        try {
            const rows = await fetchViewData(page);
            if (append) {
                setData((prev) => [...prev, ...rows]);
            } else {
                setColumnDefs(Object.keys(rows[0] || {}));
                setData(rows);
            }
            setHasMore(rows.length === pageSize);
            setPageNo(page);
        } catch (err) {
            if (err.message === "EMPTY") {
                if (!append) { setData([]); showToast("Table is empty"); }
                setHasMore(false);
            } else {
                showToast(err.message || "Something went wrong!");
            }
        } finally {
            if (append) setLoadingMore(false); else setLoading(false);
        }
    };

    // ── Infinite scroll ────────────────────────────────────────────────────────
    const handleResultsScroll = (e) => {
        if (loading || loadingMore || !hasMore) return;
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - scrollTop - clientHeight < 120) {
            executeQuery(pageNo + 1, { append: true });
        }
    };

    // Re-run on page size change if there's an active result set
    useEffect(() => {
        if (selectedView && data.length > 0) executeQuery(1);
    }, [pageSize]);

    // ── Query Details ─────────────────────────────────────────────────────────
    const handleQueryDetails = async () => {
        if (!selectedView) return;
        if (viewsDetails === null) {
            try {
                setQueryLoading(true);
                setIsQueryModalOpen(true);
                const response = await fetch(`${hostnameV1}/analyzeQuery`, {
                    method: "POST",
                    headers: { accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ viewname: selectedView, pageNo }),
                });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                setViewsDetails(data || null);
            } catch (error) {
                console.error("Error fetching data:", error);
                setViewsDetails({ status: "Failed", message: "Unable to fetch data" });
            } finally {
                setQueryLoading(false);
                setIsQueryModalOpen(true);
            }
        } else {
            setIsQueryModalOpen(true);
        }
    };

    return (
        <>
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
                {/* ── Toolbar ── */}
                <div className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-200 bg-white flex-shrink-0">
                    <CustomSelect
                        options={views}
                        value={selectedView}
                        onChange={handleViewChange}
                        placeholder="Select View"
                    />

                    <button
                        type="button"
                        onClick={() => executeQuery(1)}
                        disabled={loading || !selectedView}
                        className="flex items-center gap-1.5 bg-[#8e78b7] hover:bg-[#79669c] disabled:opacity-60 disabled:cursor-not-allowed text-white text-[13px] font-semibold px-3.5 py-1.5 rounded-md transition-colors whitespace-nowrap"
                    >
                        <Play size={13} />
                        {loading ? "Running…" : "Execute"}
                    </button>

                    <div className="flex-1" />

                    {/* Rows per page (fetch batch size) */}
                    <select
                        value={pageSize}
                        onChange={(e) => { setPageSize(Number(e.target.value)); setPageNo(1); }}
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
                                        <div className="font-medium">Current Page</div>
                                        <div className="text-[11px] text-gray-400">Page {pageNo} · {data.length} rows</div>
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
                            onChange={handleSwitch}
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
                                {data.length > 0 && (
                                    <span className="text-[11px] font-normal text-gray-400 ml-1">
                                        · {data.length} rows
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-0.5 mr-1">
                                <button
                                    type="button"
                                    title="Query Details"
                                    onClick={handleQueryDetails}
                                    disabled={!selectedView}
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
                                    handleResultsScroll={handleResultsScroll}
                                    toTitleCase={toTitleCase}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full select-none">
                                    <span className="text-[30px] font-light text-[#c4b5e8] tracking-widest mb-2.5">&lt;/&gt;</span>
                                    <p className="text-[14px] text-[#9b8eb5] mb-1">No results returned</p>
                                    <p className="text-[12px] text-[#c4b5e8]">Try a different view</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Toast */}
                <EditorToast
                    toast={toast}
                    onClose={() => setToast({ show: false, message: "", type: "" })}
                />
            </div>

            <QueryDetailsModal
                isOpen={isQueryModalOpen}
                onClose={() => setIsQueryModalOpen(false)}
                viewsDetails={viewsDetails}
                queryLoading={queryLoading}
            />
        </>
    );
}