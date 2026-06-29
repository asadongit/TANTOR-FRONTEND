import CircularProgress from "@mui/material/CircularProgress";
import Switch from "@mui/material/Switch";
import {
    Typography
} from "@mui/material";
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import { ChevronDown, X, Download, ArrowUpDown, GripVertical } from 'lucide-react';
import { Icon } from "@iconify/react";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../../../context/AuthContext";

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

    const filtered = options.filter((o) =>
        o.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (val) => {
        onChange(null, val);
        setOpen(false);
        setSearch("");
    };

    return (
        <div ref={ref} className="relative w-52">
            {/* Trigger */}
            <div
                onClick={() => setOpen((p) => !p)}
                title={value || ""}
                className="flex items-center justify-between px-4 py-2.5 bg-white border border-gray-300 rounded-lg cursor-pointer select-none text-sm hover:border-gray-400 transition-colors min-h-[42px]"
            >
                <span className={`truncate max-w-[160px] ${value ? "text-gray-800" : "text-gray-400"}`}>
                    {value || placeholder}
                </span>
                <svg
                    width="16" height="16" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2"
                    className={`flex-shrink-0 text-gray-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                >
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </div>

            {/* Dropdown */}
            {open && (
                <div className="absolute top-[calc(100%+2px)] left-0 w-full bg-white border border-gray-200 rounded-lg shadow-xl z-[9999] overflow-hidden">

                    {/* Search */}
                    <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100">
                        <svg
                            width="15" height="15" viewBox="0 0 24 24"
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
                            className="w-full text-sm text-gray-600 placeholder-gray-400 outline-none bg-transparent"
                        />
                    </div>

                    {/* Options */}
                    <div className="max-h-52 overflow-y-auto">
                        {filtered.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-gray-400 text-center">
                                No results found
                            </div>
                        ) : (
                            filtered.map((opt) => (
                                <div
                                    key={opt}
                                    title={opt}
                                    onClick={() => handleSelect(opt)}
                                    className={`px-4 py-3 text-sm cursor-pointer truncate transition-colors
                    ${opt === value
                                            ? "text-[#8e78b7] font-medium bg-purple-50"
                                            : "text-gray-700 hover:bg-gray-50"
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

export default function Builder({ handleSwitch, checked }) {
    const { token, project, decodedToken, setSelectedProject, hostnameV1, hostnameV2 } = useAuth();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [columnDefs, setColumnDefs] = useState([]);
    const [curl, setCurl] = useState("pervious curl is");
    const [selectedView, setSelectedView] = useState("");
    const [shownViews, setShownViews] = useState([]);
    const [viewsMeta, setViewsMeta] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: '' });

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
    useEffect(() => { setColOrder(columnDefs.map((_, i) => i)); setSortConfig({ key: "", direction: "asc" }); }, [columnDefs]);
    const orderedCols = colOrder.map(i => columnDefs[i]);
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
    const handleSort = (key) => setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc" }));
    const sortedData = [...data].sort((a, b) => {
        if (!sortConfig.key) return 0;
        const av = a[sortConfig.key], bv = b[sortConfig.key];
        if (typeof av === "number" && typeof bv === "number") return sortConfig.direction === "asc" ? av - bv : bv - av;
        return sortConfig.direction === "asc" ? String(av || "").localeCompare(String(bv || "")) : String(bv || "").localeCompare(String(av || ""));
    });
    const toTitleCase = s => s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

    useEffect(() => {
        const fetchViews = async () => {
            try {
                const params = new URLSearchParams({
                    project: project,
                    created_by: decodedToken?.preferred_username,
                });
                const response = await fetch(`${hostnameV2}/get-all-views_v2?${params}`);
                const data = await response.json();
                if (data && data.result) {
                    setViewsMeta(data.result);
                    setShownViews(data.result.map(v => v.view_name));
                } else {
                    console.error("Invalid response from the API");
                }
            } catch (error) {
                console.error("Error fetching views:", error);
            }
        };
        fetchViews();
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target)) {
                setShowDownloadMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const convertToCSV = (jsonData) => {
        const headers = Object.keys(jsonData[0]).join(',');
        const csvRows = jsonData.map(obj => Object.values(obj).map(val => `"${val}"`).join(','));
        return [headers, ...csvRows].join('\n');
    };

    const triggerCSVDownload = (csvContent, filename) => {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleDownloadCurrentPage = () => {
        setShowDownloadMenu(false);
        if (!data || data.length === 0) {
            setToast({ show: true, message: "No data to download", type: "error" });
            setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
            return;
        }
        const csvContent = convertToCSV(data);
        triggerCSVDownload(csvContent, `data_page_${pageNo}.csv`);
    };

    const handleDownloadFullData = async () => {
        setShowDownloadMenu(false);
        if (!selectedView) {
            setToast({ show: true, message: "Select a view first to download full data", type: "error" });
            setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
            return;
        }
        setFullDataLoading(true);
        setToast({ show: true, message: "Fetching full data, please wait...", type: "success" });
        try {
            let allRows = [];
            let currentPage = 1;
            let morePages = true;
            const batchSize = 1000;

            while (morePages) {
                const payload = { page: currentPage, page_size: batchSize };
                const cachingResponse = await fetch(`${hostnameV1}/checkCaching/${selectedView}`);
                const cachingData = await cachingResponse.json();

                let response;
                if (cachingData.result) {
                    response = await fetch(`${hostnameV1}/execute_view/${selectedView}`, {
                        method: "POST",
                        headers: { accept: "application/json", "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                        body: JSON.stringify(payload),
                    });
                    if (!response.ok) throw new Error("Failed to fetch page " + currentPage);
                    const rows = await response.json();
                    allRows = allRows.concat(rows);
                    if (rows.length < batchSize) morePages = false;
                    else currentPage++;
                } else {
                    response = await fetch(`${hostnameV1}/execute_view/${selectedView}`, {
                        method: "POST",
                        headers: { accept: "application/json", "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                        body: JSON.stringify(payload),
                    });
                    if (!response.ok) throw new Error("Failed to fetch page " + currentPage);
                    const dataText = await response.text();
                    const rows = dataText.trim().split("\n")
                        .filter(r => r.trim() !== "")
                        .map(r => JSON.parse(r));
                    allRows = allRows.concat(rows);
                    if (rows.length < batchSize) morePages = false;
                    else currentPage++;
                }
            }

            if (allRows.length === 0) {
                setToast({ show: true, message: "No data available to download", type: "error" });
                setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
                return;
            }
            const csvContent = convertToCSV(allRows);
            triggerCSVDownload(csvContent, `${selectedView}_full_${Date.now()}.csv`);
            setToast({ show: true, message: `Downloaded ${allRows.length} rows successfully`, type: "success" });
            setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
        } catch (error) {
            console.error("Error downloading full data:", error);
            setToast({ show: true, message: "Failed to download full data", type: "error" });
            setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
        } finally {
            setFullDataLoading(false);
        }
    };

    const handleViewChange = async (event, value) => {
        setSelectedView(value);
        setColumnDefs([]);
        setData([]);
    };

    const checkCaching = async (pay) => {
        try {
            const cachingResponse = await fetch(`${hostnameV1}/checkCaching/${selectedView}`);
            const cachingData = await cachingResponse.json();

            if (cachingData.result) {
                fetch(`${hostnameV1}/execute_view/${selectedView}`, {
                    method: "POST",
                    headers: { accept: "application/json", "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                    body: JSON.stringify(pay),
                })
                    .then((response) => response.json().then((data) => ({ status: response.status, data })))
                    .then(({ status, data }) => {
                        if (status === 200) {
                            if (data.detail) {
                                setToast({ show: true, message: "Table is empty", type: "error" });
                                setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
                                setData([]);
                            } else {
                                const rows = data;
                                const colns = Object.keys(rows[0]);
                                setColumnDefs(colns);
                                setData(rows);
                                setHasMore(rows.length === pageSize);
                            }
                        } else {
                            if (data) {
                                const res = JSON.parse(data);
                                setToast({ show: true, message: res.detail, type: "error" });
                                setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
                            }
                        }
                    })
                    .catch((error) => {
                        console.error("Error fetching data:", error);
                        setToast({ show: true, message: "Something went wrong!", type: "error" });
                        setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
                    })
                    .finally(() => setLoading(false));
            } else {
                fetch(`${hostnameV1}/execute_view/${selectedView}`, {
                    method: "POST",
                    headers: { accept: "application/json", "Content-Type": "application/json", 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(pay),
                })
                    .then((response) => response.text().then((data) => ({ status: response.status, data })))
                    .then(({ status, data }) => {
                        if (status === 200) {
                            const dataArray = data.split("\n")
                                .filter(item => item.trim() !== "")
                                .map(item => { try { return JSON.parse(item); } catch (e) { return null; } })
                                .filter(item => item !== null);

                            if (dataArray.length === 0) {
                                setToast({ show: true, message: "Table is empty", type: "error" });
                                setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
                                setData([]);
                            } else {
                                const rows = data.trim().split("\n").map((row) => JSON.parse(row));
                                const columns = Object.keys(rows[0]);
                                setColumnDefs(columns);
                                setData(rows);
                                setHasMore(rows.length === pageSize);
                            }
                        } else {
                            if (data) {
                                const res = JSON.parse(data);
                                setToast({ show: true, message: res.detail, type: "error" });
                                setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
                            }
                        }
                    })
                    .catch((error) => {
                        console.error("Error fetching data:", error);
                        setToast({ show: true, message: "Something went wrong!", type: "error" });
                        setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
                    })
                    .finally(() => setLoading(false));
            }
        } catch (error) {
            console.error("Error checking caching status:", error);
            setToast({ show: true, message: "Failed to check caching status", type: "error" });
            setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
            setLoading(false);
        }
    };

    const executeQuery = (query = "", page = 1) => {
        setLoading(true);
        setViewsDetails(null);
        const payload = { page, page_size: pageSize };
        checkCaching(payload);
        const url = `${ExternalAPI}/view/${selectedView}`;
        fetch(`${hostnameV1}/generate_curl`, {
            method: "POST",
            headers: { accept: "application/json", "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ url, page }),
        })
            .then((response) => response.text().then((text) => setCurl(text)))
            .catch((error) => console.error("Error fetching curl:", error));
    };

    const handleNextPage = () => {
        const nextPage = pageNo + 1;
        setPageNo(nextPage);
        executeQuery("", nextPage);
    };

    const handlePreviousPage = () => {
        if (pageNo > 1) {
            const prevPage = pageNo - 1;
            setPageNo(prevPage);
            executeQuery("", prevPage);
        }
    };

    const handleQueryDetails = async () => {
        if (viewsDetails === null) {
            try {
                setQueryLoading(true);
                setIsQueryModalOpen(true);
                const response = await fetch(`${hostnameV1}/analyzeQuery`, {
                    method: 'POST',
                    headers: { accept: "application/json", "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                    body: JSON.stringify({ viewname: selectedView, pageNo })
                });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                if (data) {
                    setLoading(false);
                    setViewsDetails(data);
                } else {
                    setViewsDetails(null);
                    console.error("Invalid response from the API");
                }
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

    useEffect(() => {
        if (selectedView && data.length > 0) {
            executeQuery("", 1);
        }
    }, [pageSize]);

    const isSelectedMV = viewsMeta.find(v => v.view_name === selectedView)?.ismaterializedview === true;

    const handleRefreshMV = async () => {
        if (!selectedView) return;
        setRefreshing(true);
        try {
            const response = await fetch(`${hostnameV1}/refresh_view/${selectedView}`, {
                method: "POST",
                headers: { accept: "application/json", "Authorization": `Bearer ${token}` },
            });
            const result = await response.json();
            setToast({ show: true, message: "View refreshed successfully", type: "success" });
        } catch (error) {
            console.error("Error refreshing view:", error);
            setToast({ show: true, message: "Failed to refresh materialized view", type: "error" });
        } finally {
            setRefreshing(false);
            setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
        }
    };

    return (
        <>
            <div className="w-full h-full flex flex-col overflow-hidden">
                {/* ── Top bar ─────────────────────────────────────────────── */}
                <div className="w-full flex justify-between flex-none items-center py-2" style={{ minHeight: "60px" }}>
                    <div className="flex items-center ml-4 gap-3">
                        <CustomSelect
                            options={shownViews}
                            value={selectedView}
                            onChange={handleViewChange}
                            placeholder="Select View"
                        />
                        <button
                            type="button"
                            onClick={executeQuery}
                            disabled={refreshing}
                            className="text-white px-8 py-2 bg-[#8e78b7] hover:bg-[#7a63a8] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Execute
                        </button>


                        {isSelectedMV && (
                            <>
                                <div className="w-px h-6 bg-gray-300" />
                                <button
                                    type="button"
                                    onClick={handleRefreshMV}
                                    title="Refresh materialized view"
                                    disabled={refreshing || loading}
                                    className="px-4 py-2 border border-[#8e78b7] text-[#8e78b7] hover:bg-[#f3f0f9] rounded-lg text-sm focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                >
                                    {refreshing ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[#8e78b7]" />
                                            <span>Refreshing…</span>
                                        </>
                                    ) : (
                                        <span>Refresh View Data</span>
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative" ref={downloadMenuRef}>
                            <button
                                type="button"
                                onClick={() => setShowDownloadMenu((prev) => !prev)}
                                disabled={fullDataLoading || refreshing}
                                title="Download CSV"
                                className="text-black shadow-lg hover:bg-[#8e78b7] hover:text-white focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-3 py-1.5 bg-white focus:outline-none flex items-center gap-1 transition-colors"
                            >
                                {fullDataLoading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[#8e78b7]" />
                                ) : (
                                    <Download className="h-4 w-4" />
                                )}
                                <ChevronDown className="h-3 w-3" />
                            </button>
                            {showDownloadMenu && (
                                <div className="absolute right-0 mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
                                    <button onClick={handleDownloadCurrentPage} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-[#f3f0f9] hover:text-[#8e78b7] flex items-center gap-2 transition-colors">
                                        <Download className="h-4 w-4 flex-shrink-0" />
                                        <div>
                                            <div className="font-medium">Current Page</div>
                                            <div className="text-xs text-gray-400">Page {pageNo} · {data.length} rows</div>
                                        </div>
                                    </button>
                                    <div className="border-t border-gray-100" />
                                    <button onClick={handleDownloadFullData} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-[#f3f0f9] hover:text-[#8e78b7] flex items-center gap-2 transition-colors">
                                        <Download className="h-4 w-4 flex-shrink-0" />
                                        <div>
                                            <div className="font-medium">Full Data</div>
                                            <div className="text-xs text-gray-400">All pages · may take a moment</div>
                                        </div>
                                    </button>
                                </div>
                            )}
                        </div>
                        <Switch
                            checked={checked}
                            onChange={handleSwitch}
                            inputProps={{ "aria-label": "controlled" }}
                        />
                        <span>{checked ? "Editor" : "Builder"}</span>
                    </div>
                </div>

                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    {(data?.length > 0 || loading) && (
                        <>
                            <div className="flex-1 flex flex-col min-h-0">
                                <h2 className="text-xl font-bold pb-3">Output</h2>
                                {loading ? (
                                    <div className="bg-white rounded-lg shadow w-full flex-1 overflow-hidden flex justify-center items-center">
                                        <CircularProgress sx={{ color: "#8e78b7" }} />
                                    </div>
                                ) : (
                                    <div className="flex-1 min-h-0 overflow-auto rounded-lg border border-gray-200">
                                        <table className="w-full bg-white" style={{ borderCollapse: "collapse" }}>
                                            <thead className="border-b border-gray-200">
                                                <tr>
                                                    {orderedCols.map((col, vi) => (
                                                        <th
                                                            key={col}
                                                            draggable
                                                            onDragStart={e => handleColDragStart(e, vi)}
                                                            onDragOver={e => handleColDragOver(e, vi)}
                                                            onDrop={e => handleColDrop(e, vi)}
                                                            onDragEnd={handleColDragEnd}
                                                            title={toTitleCase(col)}
                                                            onClick={() => handleSort(col)}
                                                            style={{
                                                                background: "#F9F9F9",
                                                                color: "#332849",
                                                                padding: "12px 16px",
                                                                fontSize: "13px",
                                                                fontWeight: 600,
                                                                whiteSpace: "nowrap",
                                                                maxWidth: "160px",
                                                                overflow: "hidden",
                                                                cursor: "grab",
                                                                userSelect: "none",
                                                                borderLeft: dragOverCol === vi ? "1px solid #332849" : "none",
                                                                transition: "background 0.15s ease",
                                                                position: "sticky",
                                                                top: 0,
                                                                zIndex: 10,
                                                                textAlign: "left",
                                                                verticalAlign: "middle",
                                                            }}
                                                        >
                                                            <div style={{ display: "flex", alignItems: "center", gap: "6px", overflow: "hidden" }}>
                                                                <GripVertical size={12} style={{ opacity: 0.5, flexShrink: 0 }} />
                                                                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>
                                                                    {toTitleCase(col)}
                                                                </span>
                                                                <ArrowUpDown size={13} style={{ flexShrink: 0, opacity: sortConfig.key === col ? 1 : 0.5 }} />
                                                            </div>
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sortedData.map((row, ri) => (
                                                    <tr key={ri} style={{ borderBottom: "1px solid #e5e5e5" }} className="hover:bg-gray-50">
                                                        {orderedCols.map((col, ci) => {
                                                            const val = row[col];
                                                            const isLink = typeof val === "string" && val.startsWith("http");
                                                            return (
                                                                <td key={ci} style={{ padding: "11px 16px", fontSize: "14px", color: "#23252D", whiteSpace: "nowrap", maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis", verticalAlign: "middle", }} title={String(val ?? "")}>
                                                                    {isLink ? <a href={val} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">{val}</a> : (val === 0 ? 0 : val ?? "-")}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Accordion and bottom controls */}
                            {!loading && (
                                <div className="flex-none mt-2">
                                    <Accordion
                                        style={{ width: "100%", padding: "0px", marginBottom: "15px" }}
                                        className="transition-all duration-300"
                                    >
                                        <AccordionSummary expandIcon={<ChevronDown />} aria-controls="panel2-content" id="panel2-header">
                                            <div className="flex">
                                                <div className="bg-[#8E77BB] mr-6 text-white rounded-lg px-2.5 py-0.5">POST</div>
                                                <Typography component="span">/api/v1/view/{selectedView}</Typography>
                                            </div>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            <Typography>{curl}</Typography>
                                        </AccordionDetails>
                                    </Accordion>

                                    <div className="w-[100%] flex justify-between">
                                        <div className="flex gap-4 items-center">
                                            <button
                                                type="button"
                                                onClick={handleQueryDetails}
                                                className="text-white px-8 py-1.5 bg-[#8e78b7] hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm dark:bg-[#8e78b7] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
                                            >
                                                Query Details
                                            </button>
                                            <select
                                                value={pageSize}
                                                onChange={(e) => { setPageSize(Number(e.target.value)); setPageNo(1); }}
                                                className="px-4 py-1.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#8e78b7]"
                                            >
                                                <option value={100}>100</option>
                                                <option value={200}>200</option>
                                                <option value={500}>500</option>
                                                <option value={800}>800</option>
                                                <option value={1000}>1000</option>
                                            </select>
                                        </div>
                                        <div className="w-[60%] flex justify-end">
                                            <button
                                                type="button"
                                                onClick={handlePreviousPage}
                                                disabled={pageNo === 1}
                                                className={`px-8 py-1.5 focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm focus:outline-none mr-4 ${pageNo === 1 ? "text-gray-400 bg-gray-200 cursor-not-allowed" : "text-white bg-[#8e78b7] hover:bg-[#7a63a8]"}`}
                                            >
                                                Previous
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleNextPage}
                                                disabled={!hasMore}
                                                className={`px-8 py-1.5 rounded-lg text-sm ${!hasMore ? "text-gray-400 bg-gray-200 cursor-not-allowed" : "text-white focus:ring-1 focus:ring-[#8e78b7] bg-[#8e78b7] hover:bg-[#7a63a8]"}`}
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Toast */}
                {toast.show && (
                    <div className={`fixed top-6 right-6 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 animate-fadeIn ${toast.type === "success" ? "bg-green-100 text-green-800 border-l-4 border-green-500" : "bg-red-100 text-red-800 border-l-4 border-red-500"}`}>
                        <Icon icon={toast.type === "success" ? "mdi:check-circle" : "mdi:alert-circle"} className="h-5 w-5" />
                        <p>{toast.message}</p>
                        <button onClick={() => setToast({ show: false, message: "", type: "" })} className="ml-2 text-gray-500 hover:text-gray-700">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* Query Details Modal */}
            {isQueryModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg min-w-[32vw] min-h-[50vh] flex flex-col justify-between">
                        <div className="p-2 pl-4 border-b flex justify-between items-center bg-[#282F49] text-white rounded-t-lg">
                            <h2 className="text-xl font-semibold">Query Details</h2>
                        </div>
                        <div className="mt-4 mx-10 flex justify-center">
                            {viewsDetails && viewsDetails.length > 0 && (
                                <div>
                                    {Object.entries(viewsDetails[0]).filter(([key]) => key !== "query").map(([key, value]) => (
                                        <div key={key} style={{ marginBottom: '10px', fontSize: '16px', fontWeight: '400', color: '#8E77BB', lineHeight: '1.5' }}>
                                            <strong style={{ color: '#8E77BB' }}>{key.replace(/_/g, " ").toUpperCase()}:</strong>{" "}
                                            <span style={{ color: '#555' }}>{value || "N/A"}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {queryLoading && <CircularProgress sx={{ color: "#8e78b7" }} />}
                        </div>
                        <div className="py-3 pr-4 flex justify-end gap-4">
                            <button onClick={() => setIsQueryModalOpen(false)} className="px-6 py-1 bg-[#8E77BB] text-white rounded-lg hover:bg-opacity-80">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}