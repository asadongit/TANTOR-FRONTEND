import React, { useState, useEffect, useMemo, useRef } from "react";
import toast from 'react-hot-toast';
import Breadcrumb from "../../../components/Breadcrumb";
import { useAuth } from '../../../context/AuthContext';
import axios from 'axios';
import DataTable from '../../../components/DataTable';
import { Search, RefreshCw, Maximize2, X, ArrowRight, ArrowLeft, SplitSquareVertical, Download, ChevronDown } from "lucide-react";
import * as XLSX from 'xlsx';

function Audit() {
    const hostname = window._env_?.VITE_FAST_API;
    const { decodedToken, token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [auditData, setAuditData] = useState([]);

    const [modalOpen, setModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState({ type: null, data: null });
    const [selectedRow, setSelectedRow] = useState(null);
    const [viewMode, setViewMode] = useState('single');

    const [userId, setUserId] = useState("");
    const [module, setModule] = useState("");
    const [action, setAction] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [showPreviousState, setShowPreviousState] = useState(true);
    const [showNewState, setShowNewState] = useState(true);

    const [limit, setLimit] = useState("50");
    const [customLimit, setCustomLimit] = useState("");
    const [isCustomLimit, setIsCustomLimit] = useState(false);

    const [showDownloadOptions, setShowDownloadOptions] = useState(false);
    const downloadRef = useRef(null);

    const moduleOptions = [
        { value: "connection", label: "Connection" },
        { value: "project", label: "Project" },
        { value: "transformation", label: "Transformation" },
        { value: "migration", label: "Migration" },
        { value: "metadata", label: "Metadata" },
        { value: "cdc", label: "CDC" },
        { value: "user-report", label: "User Report" },
        { value: "reports", label: "Dashboard Reports" },
    ];

    const actionOptions = [
        { value: "CREATE", label: "Create" },
        { value: "UPDATE", label: "Update" },
        { value: "DELETE", label: "Delete" },
        { value: "READ", label: "Read" },
        { value: "TRIGGER", label: "Trigger" },
        { value: "OTHER", label: "Other" },
    ];

    const limitOptions = [
        { value: "none", label: "None (All Records)" },
        { value: "50", label: "50 records" },
        { value: "100", label: "100 records" },
        { value: "150", label: "150 records" },
        { value: "200", label: "200 records" },
        { value: "custom", label: "Custom limit..." }
    ];


    const openStateModal = (row, type) => {
        setSelectedRow(row);
        setModalContent({
            type,
            data: type === 'previous' ? row.previous_state : row.new_state
        });
        setModalOpen(true);
    };

    const toggleStateView = () => {
        if (modalContent.type === 'previous') {
            setModalContent({
                type: 'new',
                data: selectedRow.new_state
            });
        } else {
            setModalContent({
                type: 'previous',
                data: selectedRow.previous_state
            });
        }
    };

    const toggleComparisonView = () => {
        setViewMode(viewMode === 'single' ? 'compare' : 'single');
    };

    const isReportRow = selectedRow?.module === "reports";

    const formatDateTime = (value) => {
        if (!value) return "—";
        const date = new Date(value);
        return isNaN(date.getTime()) ? value : date.toLocaleString();
    };

    const renderKeyValue = (label, value) => (
        <div>
            <div className="text-[11px] uppercase tracking-wide text-gray-500">{label}</div>
            <div className="text-sm font-medium break-words">{value ?? "—"}</div>
        </div>
    );

    const renderReportState = (state) => {
        if (!state) {
            return <div className="text-sm text-gray-500">No data available</div>;
        }

        const chart = state.chart || {};
        const dashboard = state.dashboard || {};
        const api = state.api || {};

        return (
            <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {renderKeyValue("Summary", state.summary)}
                    {renderKeyValue("Object", state.object_type)}
                    {renderKeyValue("Operation", state.operation)}
                    {renderKeyValue("User", state.username)}
                    {renderKeyValue("Event Time", formatDateTime(state.event_time))}
                    {renderKeyValue("Log Id", state.log_id)}
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                    <div className="border rounded p-3 bg-white/50">
                        <div className="font-semibold mb-2">Chart</div>
                        <div className="space-y-2">
                            {renderKeyValue("Name", chart.name)}
                            {renderKeyValue("Id", chart.id)}
                            {renderKeyValue("Created", formatDateTime(chart.created_on))}
                            {renderKeyValue("Updated", formatDateTime(chart.updated_on))}
                            {renderKeyValue("Parent Dashboards", (chart.parent_dashboard_titles || chart.parent_dashboard_ids || [])?.join(", ") || "—")}
                        </div>
                    </div>
                    <div className="border rounded p-3 bg-white/50">
                        <div className="font-semibold mb-2">Dashboard</div>
                        <div className="space-y-2">
                            {renderKeyValue("Title", dashboard.title)}
                            {renderKeyValue("Id", dashboard.id)}
                            {renderKeyValue("Created", formatDateTime(dashboard.created_on))}
                            {renderKeyValue("Updated", formatDateTime(dashboard.updated_on))}
                        </div>
                    </div>
                </div>

                <div className="border rounded p-3 bg-white/50">
                    <div className="font-semibold mb-2">API Request</div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {renderKeyValue("Path", api.path)}
                        {renderKeyValue("Page", api.page)}
                        {renderKeyValue("Page Size", api.page_size)}
                        {renderKeyValue("Order By", api.order_by)}
                        {renderKeyValue("Direction", api.order_direction)}
                        {renderKeyValue("Has Filters", api.has_filters)}
                    </div>
                </div>

                {state.raw_details && (
                    <div>
                        <div className="font-semibold mb-2">Raw Details</div>
                        <pre className="bg-gray-50 p-3 rounded overflow-auto text-xs">
                            {JSON.stringify(state.raw_details, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        );
    };

    const renderStatePanel = (data, emptyMessage = "No state data available") => {
        if (isReportRow) {
            return (
                <div className="bg-gray-50 p-4 rounded overflow-auto h-full text-sm">
                    {renderReportState(data) || <div className="text-sm text-gray-500">{emptyMessage}</div>}
                </div>
            );
        }

        return (
            <pre className="bg-gray-50 p-4 rounded overflow-auto h-full text-sm">
                {data ? JSON.stringify(data, null, 2) : emptyMessage}
            </pre>
        );
    };

    const columns = useMemo(() => {
        const baseColumns = [
            { key: "user_id", label: "User" },
            { key: "module", label: "Module" },
            { key: "action", label: "Type" },
            {
                key: "performed_at",
                label: "Timestamp",
                render: (row) => (
                    <span className="text-xs">
                        {new Date(row.performed_at).toLocaleString()}
                    </span>
                )
            },
            // { key: "ip_address", label: "IP Address" },
        ];

        if (showPreviousState) {
            baseColumns.push({
                key: "previous_state",
                label: "Previous State",
                width: "120px",
                render: (row) => (
                    row.previous_state ? (
                        <button
                            onClick={() => openStateModal(row, 'previous')}
                            className="p-1 bg-gray-100 rounded hover:bg-gray-200 flex items-center justify-center"
                            title="View previous state"
                        >
                            <Maximize2 size={16} className="text-blue-600" />
                        </button>
                    ) : <span className="text-gray-400">null</span>
                )
            });
        }

        if (showNewState) {
            baseColumns.push({
                key: "new_state",
                label: "New State",
                width: "120px",
                render: (row) => (
                    row.new_state ? (
                        <button
                            onClick={() => openStateModal(row, 'new')}
                            className="p-1 bg-gray-100 rounded hover:bg-gray-200 flex items-center justify-center"
                            title="View new state"
                        >
                            <Maximize2 size={16} className="text-green-600" />
                        </button>
                    ) : <span className="text-gray-400">null</span>
                )
            });
        }

        return baseColumns;
    }, [showPreviousState, showNewState]);

    const fetchAuditData = async (initialUsername = null) => {
        try {
            setLoading(true);

            const params = new URLSearchParams();

            let userIdToUse = initialUsername || userId;
            if (!userIdToUse) {
                userIdToUse = decodedToken?.preferred_username;
            }
            if (userIdToUse) params.append("user_id", userIdToUse);

            if (module) params.append("module", module);
            if (action) params.append("action", action);
            if (startDate) params.append("start_date", new Date(startDate).toISOString());
            if (endDate) params.append("end_date", new Date(endDate).toISOString());
            params.append("show_previous_state", showPreviousState);
            params.append("show_new_state", showNewState);
            params.append("reports_details", module === "reports");

            if (limit !== "none") {
                if (!isCustomLimit) {
                    params.append("limit", limit);
                } else if (customLimit && !isNaN(parseInt(customLimit))) {
                    params.append("limit", customLimit);
                }
            }

            const response = await axios.get(`${hostname}/audit/events`, {
                params,
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setAuditData(response.data.sort((a, b) => new Date(b.performed_at) - new Date(a.performed_at)));
        } catch (error) {
            console.error("Error fetching audit data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLimitChange = (e) => {
        const selectedLimit = e.target.value;
        setLimit(selectedLimit);
        setIsCustomLimit(selectedLimit === "custom");
    };

    const handleCustomLimitChange = (e) => {
        setCustomLimit(e.target.value);
    };

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        fetchAuditData();
    };

    const handleResetFilters = () => {
        setUserId("");
        setModule("");
        setAction("");
        setStartDate("");
        setEndDate("");
        setShowPreviousState(true);
        setShowNewState(true);
        setLimit("50");
        setCustomLimit("");
        setIsCustomLimit(false);
    };

    useEffect(() => {
        function handleClickOutside(event) {
            if (downloadRef.current && !downloadRef.current.contains(event.target)) {
                setShowDownloadOptions(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [downloadRef]);

    const prepareDataForExport = () => {
        return auditData.map(row => {
            const exportRow = { ...row };

            if (exportRow.performed_at) {
                exportRow.performed_at = new Date(exportRow.performed_at).toLocaleString();
            }

            if (exportRow.previous_state) {
                exportRow.previous_state = JSON.stringify(exportRow.previous_state);
            }

            if (exportRow.new_state) {
                exportRow.new_state = JSON.stringify(exportRow.new_state);
            }

            return exportRow;
        });
    };

    const downloadCSV = () => {
        const data = prepareDataForExport();
        const visibleColumns = columns.map(col => col.key);
        const headerRow = columns.map(col => col.label).join(',');
        const csvRows = data.map(row => {
            return visibleColumns.map(key => {
                let cellData = row[key] === null || row[key] === undefined ? '' : String(row[key]);
                cellData = cellData.replace(/"/g, '""');
                return `"${cellData}"`;
            }).join(',');
        });

        const csvString = [headerRow, ...csvRows].join('\n');

        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `audit_data_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setShowDownloadOptions(false);
    };

    const downloadExcel = () => {
        const data = prepareDataForExport();
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);

        XLSX.utils.book_append_sheet(wb, ws, "Audit Data");

        XLSX.writeFile(wb, `audit_data_${new Date().toISOString().split('T')[0]}.xlsx`);

        setShowDownloadOptions(false);
    };

    useEffect(() => {
        if (decodedToken?.preferred_username) {
            fetchAuditData(decodedToken.preferred_username);
        }
    }, []);

    const maxDateTime = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    return (
        <div className="p-6">
            <Breadcrumb title="Platform" link={"/"} />
            <div className="flex gap-4 mb-6 items-center justify-between">
                <h1 className="text-2xl font-semibold">Audit</h1>
            </div>

            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <h2 className="text-lg font-medium mb-4">Filters</h2>
                <form onSubmit={handleFilterSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                            <input
                                type="text"
                                className="w-full p-2 border rounded"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                placeholder="Enter user ID"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Module</label>
                            <select
                                className="w-full p-2 border rounded"
                                value={module}
                                onChange={(e) => setModule(e.target.value)}
                            >
                                <option value="">All Modules</option>
                                {moduleOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                            <select
                                className="w-full p-2 border rounded"
                                value={action}
                                onChange={(e) => setAction(e.target.value)}
                            >
                                <option value="">All Actions</option>
                                {actionOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                            <input
                                type="datetime-local"
                                className="w-full p-2 border rounded"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                max={maxDateTime}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                            <input
                                type="datetime-local"
                                className="w-full p-2 border rounded"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                max={maxDateTime}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Result Limit</label>
                            <div className="flex gap-2">
                                <select
                                    className="w-full p-2 border rounded"
                                    value={limit}
                                    onChange={handleLimitChange}
                                >
                                    {limitOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                {isCustomLimit && (
                                    <input
                                        type="number"
                                        className="w-1/3 p-2 border rounded"
                                        value={customLimit}
                                        onChange={handleCustomLimitChange}
                                        placeholder="Enter limit"
                                        min="1"
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-wrap justify-between items-center">
                        <div className="flex items-center space-x-6 mb-3 md:mb-0">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="showPrevState"
                                    className="mr-2"
                                    checked={showPreviousState}
                                    onChange={(e) => setShowPreviousState(e.target.checked)}
                                />
                                <label htmlFor="showPrevState" className="text-sm text-gray-700">Show Previous State</label>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="showNewState"
                                    className="mr-2"
                                    checked={showNewState}
                                    onChange={(e) => setShowNewState(e.target.checked)}
                                />
                                <label htmlFor="showNewState" className="text-sm text-gray-700">Show New State</label>
                            </div>
                        </div>

                        <div className="flex space-x-2">
                            <div className="relative" ref={downloadRef}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (auditData.length === 0) {
                                            toast.error("No data to download");
                                        } else {
                                            setShowDownloadOptions(!showDownloadOptions);
                                        }
                                    }}
                                    className="px-4 py-2 border rounded hover:bg-gray-50 text-gray-700 flex items-center"
                                    title={auditData.length === 0 ? "No data to download" : "Download data"}
                                >
                                    <Download size={16} className="mr-1" />
                                    Download
                                    <ChevronDown size={14} className="ml-1" />
                                </button>

                                {showDownloadOptions && (
                                    <div className="absolute left-0 mt-1 w-40 bg-white shadow-lg rounded-md overflow-hidden z-50 border">
                                        <ul>
                                            <li>
                                                <button
                                                    type="button"
                                                    onClick={downloadCSV}
                                                    className="w-full px-4 py-2 text-left hover:bg-gray-100"
                                                >
                                                    CSV
                                                </button>
                                            </li>
                                            <li>
                                                <button
                                                    type="button"
                                                    onClick={downloadExcel}
                                                    className="w-full px-4 py-2 text-left hover:bg-gray-100"
                                                >
                                                    Excel
                                                </button>
                                            </li>
                                        </ul>
                                    </div>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="px-4 py-2 border rounded hover:bg-gray-50 text-gray-700 flex items-center"
                            >
                                <RefreshCw size={16} className="mr-1" /> Reset
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-[#8e78b7] text-white rounded hover:bg-[#8e78b7] flex items-center"
                            >
                                <Search size={16} className="mr-1" /> Search
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            <DataTable
                columns={columns}
                data={auditData}
                isLoading={loading}
                refetch={fetchAuditData}
                title="Audit Events"
            />

            {modalOpen && selectedRow && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="font-semibold text-lg">
                                {viewMode === 'single' ?
                                    `${modalContent.type === 'previous' ? 'Previous' : 'New'} State` :
                                    'State Comparison'
                                }
                                <span className="ml-2 text-sm text-gray-500">
                                    ({selectedRow.module} / {selectedRow.action})
                                </span>
                            </h3>
                            <div className="flex items-center space-x-2">
                                {selectedRow.previous_state && selectedRow.new_state && (
                                    <>
                                        {viewMode === 'single' && (
                                            <button
                                                onClick={toggleStateView}
                                                className="p-1.5 rounded hover:bg-gray-100 text-gray-700 flex items-center"
                                                title={`Switch to ${modalContent.type === 'previous' ? 'new' : 'previous'} state`}
                                            >
                                                {modalContent.type === 'previous' ?
                                                    <ArrowRight size={18} /> :
                                                    <ArrowLeft size={18} />
                                                }
                                            </button>
                                        )}
                                        <button
                                            onClick={toggleComparisonView}
                                            className={`p-1.5 rounded hover:bg-gray-100 ${viewMode === 'compare' ? 'bg-blue-100' : ''}`}
                                            title={viewMode === 'single' ? 'Compare states' : 'Single state view'}
                                        >
                                            <SplitSquareVertical size={18} />
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => setModalOpen(false)}
                                    className="p-1.5 rounded hover:bg-gray-100 text-gray-700"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="p-4 flex-grow overflow-auto">
                            {viewMode === 'single' ? (
                                renderStatePanel(modalContent.data)
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                                    <div className="flex flex-col h-full">
                                        <h4 className="font-medium text-blue-600 mb-2">Previous State</h4>
                                        <div className="flex-1">
                                            {renderStatePanel(selectedRow.previous_state, 'No previous state data available')}
                                        </div>
                                    </div>
                                    <div className="flex flex-col h-full">
                                        <h4 className="font-medium text-green-600 mb-2">New State</h4>
                                        <div className="flex-1">
                                            {renderStatePanel(selectedRow.new_state, 'No new state data available')}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="border-t p-4 flex justify-end">
                            <button
                                onClick={() => setModalOpen(false)}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Audit;
