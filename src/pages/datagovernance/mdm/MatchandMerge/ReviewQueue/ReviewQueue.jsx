import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { X, RefreshCcw } from 'lucide-react';
import { toast } from 'react-hot-toast';

import DoneAllIcon from '../../../../../assets/mdm/done_all.svg';
import PendingActionsIcon from '../../../../../assets/mdm/pending_actions.svg';
import SpeedIcon from '../../../../../assets/mdm/speed.svg';
import Flag2Icon from '../../../../../assets/mdm/flag_2.svg';
import PersonAddIcon from '../../../../../assets/mdm/person_add.svg';
import EditIcon from '../../../../../assets/mdm/edit_2.svg';
import DeleteIcon from '../../../../../assets/mdm/delete.svg';
import Breadcrumb from '../../../../../components/Breadcrumb';
import SearchableDropdown from '../../components/SearchableDropdown';
import DataTable from '../../../../../components/DataTable';
import CompareSidebar from './modals/CompareSidebar';
import AssignTaskModal from './modals/AssignTaskModal';
import { useReviewQueue } from '../../../../../hooks/mdm/reviewQueue';

const ActionMenu = ({ row, onAssign, onEdit, onDelete }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

    const handleOpen = (e) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setMenuPos({ top: rect.bottom + 4, left: rect.right - 160 });
        setIsOpen((prev) => !prev);
    };

    return (
        <div className="relative inline-block">
            <button
                onClick={handleOpen}
                className="bg-transparent border-none cursor-pointer p-1 rounded-full flex items-center"
            >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="#818181">
                    <circle cx="12" cy="5" r="1.5" />
                    <circle cx="12" cy="12" r="1.5" />
                    <circle cx="12" cy="19" r="1.5" />
                </svg>
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-[1000]"
                        onClick={() => setIsOpen(false)}
                    />
                    <div
                        className="fixed z-[9999] bg-white rounded-2xl shadow-[0px_10px_30px_rgba(0,0,0,0.15)] p-2 min-w-[160px] flex flex-col gap-1"
                        style={{ top: menuPos.top, left: menuPos.left }}
                    >
                        <button
                            onClick={() => { onAssign?.(row); setIsOpen(false); }}
                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] border-none cursor-pointer bg-[#F3EFFF] w-full"
                        >
                            <img src={PersonAddIcon} alt="Assign" className="w-4 h-4" />
                            <span className="text-[#8e78b7] text-sm font-medium">Assign</span>
                        </button>

                        <button
                            onClick={() => { onEdit?.(row); setIsOpen(false); }}
                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] border-none cursor-pointer bg-white w-full"
                        >
                            <img src={EditIcon} alt="Edit" className="w-4 h-4" />
                            <span className="text-[#444] text-sm font-medium">Edit</span>
                        </button>

                        <button
                            onClick={() => { onDelete?.(row); setIsOpen(false); }}
                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] border-none cursor-pointer bg-white w-full"
                        >
                            <img src={DeleteIcon} alt="Delete" className="w-4 h-4" />
                            <span className="text-[#EF4D5F] text-sm font-medium">Delete</span>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

// ─── Priority Badge ───────────────────────────────────────────────────────────

const PriorityBadge = ({ priority }) => {
    if (!priority) return <span className="text-[#A0AEC0] text-xs">—</span>;

    const lower = priority.toLowerCase();
    let cls = 'text-[#6B7280] bg-[#F3F4F6]';
    if (lower === 'high')   cls = 'text-[#EF4D5F] bg-[#F276A74D]';
    else if (lower === 'medium') cls = 'text-[#E08E40] bg-[#FFC93F40]';
    else if (lower === 'low')    cls = 'text-[#069B68] bg-[#2AC79240]';

    return (
        <span className={`${cls} px-2 py-1.5 text-xs font-normal rounded-md inline-block`}>
            {priority}
        </span>
    );
};

// ─── Constants ────────────────────────────────────────────────────────────────

const METRIC_CONFIG = [
    { title: 'Resolved Today', key: 'resolved_today',  icon: DoneAllIcon,      bgcolor: 'bg-[#CAF1E4]' },
    { title: 'Pending Review', key: 'pending_review',   icon: PendingActionsIcon, bgcolor: 'bg-[#FFF1CF]' },
    { title: 'Average Score',  key: 'average_score',    icon: SpeedIcon,        bgcolor: 'bg-[#C5EAF0]' },
    { title: 'High Priority',  key: 'high_priority',    icon: Flag2Icon,        bgcolor: 'bg-[#FBD6E5]' },
];

const STATUS_OPTIONS = [
    { value: '',       label: 'All Status' },
    { value: 'High',   label: 'High'       },
    { value: 'Medium', label: 'Medium'     },
    { value: 'Low',    label: 'Low'        },
];

// ─── ReviewQueue ──────────────────────────────────────────────────────────────

const ReviewQueue = () => {
    const { metricCounts, tableData, isLoading, isError, fetchData } = useReviewQueue();

    const [searchTerm,   setSearchTerm]   = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [compareRow,   setCompareRow]   = useState(null);
    const [assignRow,    setAssignRow]    = useState(null);
    const [bulkAssign,   setBulkAssign]   = useState(false);

    const handleAssign     = (row) => setAssignRow(row);
    const handleBulkAssign = ()    => setBulkAssign(true);
    const handleEdit       = (row) => { /* TODO */ };
    const handleDelete     = (row) => { /* TODO */ };

    const handleRefresh = async () => {
        setSearchTerm('');
        const { ok } = await fetchData();
        if (ok) toast.success('Data refreshed successfully!');
        else    toast.error('Failed to refresh data.');
    };

    const filteredData = useMemo(() =>
        tableData.filter((item) => {
            const matchesSearch = !searchTerm || Object.values(item).some((v) =>
                String(v).toLowerCase().includes(searchTerm.toLowerCase())
            );
            const matchesStatus = !statusFilter ||
                item.priority?.toLowerCase() === statusFilter.toLowerCase();
            return matchesSearch && matchesStatus;
        }),
        [tableData, searchTerm, statusFilter]
    );

    const allFilteredIds = useMemo(() => filteredData.map((r) => r.resultId), [filteredData]);
    const allSelected  = allFilteredIds.length > 0 && allFilteredIds.every((id) => selectedRows.has(id));
    const someSelected = allFilteredIds.some((id) => selectedRows.has(id)) && !allSelected;

    const toggleAll = () => {
        setSelectedRows((prev) => {
            const next = new Set(prev);
            if (allSelected) allFilteredIds.forEach((id) => next.delete(id));
            else             allFilteredIds.forEach((id) => next.add(id));
            return next;
        });
    };

    const toggleRow = (id) => {
        setSelectedRows((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const counts = {
        resolved_today: metricCounts?.resolved_today ?? 0,
        pending_review: metricCounts?.pending_review ?? 0,
        average_score:  metricCounts?.average_score  ?? '0%',
        high_priority:  metricCounts?.high_priority  ?? 0,
    };

    const columns = useMemo(() => [
        {
            key: 'checkbox',
            label: (
                <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected; }}
                    onChange={toggleAll}
                    className="cursor-pointer w-[15px] h-[15px] accent-[#8E77BB]"
                />
            ),
            sortable: false,
            render: (row) => (
                <input
                    type="checkbox"
                    checked={selectedRows.has(row.resultId)}
                    onChange={() => toggleRow(row.resultId)}
                    onClick={(e) => e.stopPropagation()}
                    className="cursor-pointer w-[15px] h-[15px] accent-[#8E77BB]"
                />
            ),
        },
        {
            key: 'pairId',
            label: 'Match ID',
            render: (row) => (
                <button className="text-[#8E77BB] hover:underline font-normal text-left text-sm">
                    {row.pairId}
                </button>
            ),
        },
        {
            key: 'record1',
            label: 'Record 1',
            render: (row) => <span className="text-sm text-[#23252D]">{row.record1}</span>,
        },
        {
            key: 'record2',
            label: 'Record 2',
            render: (row) => <span className="text-sm text-[#23252D]">{row.record2}</span>,
        },
        {
            key: 'score',
            label: 'Score',
            render: (row) => <span className="text-sm text-[#23252D]">{row.score}</span>,
        },
        {
            key: 'priority',
            label: 'Priority',
            render: (row) => <PriorityBadge priority={row.priority} />,
        },
        {
            key: 'assignedTo',
            label: 'Assigned To',
            render: (row) => (
                <span className="text-sm text-[#332849]">{row.assignedTo || 'Unassigned'}</span>
            ),
        },
        {
            key: 'actions',
            label: '',
            sortable: false,
            render: (row) => (
                <div className="flex items-center gap-2">
                    <button
                        className="px-3 py-1 text-sm border border-[#8E77BB] rounded-lg hover:bg-gray-50 text-[#8E77BB] font-normal"
                        onClick={() => setCompareRow(row)}
                    >
                        Compare
                    </button>
                    <ActionMenu
                        row={row}
                        onAssign={handleAssign}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                </div>
            ),
        },
    ], [selectedRows, allSelected, someSelected, filteredData]);

    return (
        <div className="p-4 m-4 bg-white min-h-screen">
            <Breadcrumb />

            {/* ── Header ── */}
            <div className="flex items-start justify-between mb-4 mt-2">
                <div>
                    <h1 className="text-2xl font-bold text-[#282F49]">Review Queue</h1>
                    <p className="text-sm text-[#818181] mt-0.5">
                        Manage and validate high-confidence match pairs.
                    </p>
                </div>
                <button
                    title="Refresh"
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="p-2.5 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-wait"
                >
                    <RefreshCcw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* ── Metric Cards ── */}
            <div className="rounded-2xl p-4 mb-6" style={{ background: 'linear-gradient(270deg, #EFE7FF 17.24%, #8E77BB 93.06%, #2B125C 141.05%)' }}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {METRIC_CONFIG.map((m) => (
                        <div key={m.key} className="bg-white rounded-xl p-4 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0 ${m.bgcolor}`}>
                                    <img src={m.icon} alt={m.title} className="w-5 h-5" />
                                </div>
                                <span className="text-base font-medium text-[#332849]">{m.title}</span>
                            </div>
                            <p className="text-2xl font-bold text-[#282F49]">
                                {isLoading
                                    ? <span className="inline-block h-7 w-12 bg-gray-200 rounded animate-pulse" />
                                    : counts[m.key]
                                }
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Table Section ── */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-medium text-[#332849]">Match Pairs</h2>

                    <div className="flex items-center gap-2">
                        {selectedRows.size > 0 && (
                            <button
                                onClick={handleBulkAssign}
                                className="flex items-center gap-2 px-4 py-2 bg-[#8E77BB] text-white rounded-lg hover:bg-[#7a67a0] transition-colors text-sm font-medium"
                            >
                                Bulk Assign ({selectedRows.size})
                            </button>
                        )}

                        <div className="w-[150px]">
                            <SearchableDropdown
                                value={statusFilter}
                                onChange={setStatusFilter}
                                options={STATUS_OPTIONS}
                                placeholder="Status"
                            />
                        </div>

                        <div className="relative">
                            <svg
                                className="absolute left-3 top-1/2 -translate-y-1/2"
                                width="13" height="13" viewBox="0 0 24 24"
                                fill="none" stroke="#9ca3af" strokeWidth="2"
                            >
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.35-4.35" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search..."
                                className="pl-8 pr-8 py-[7px] w-[200px] text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#8E77BB] text-[#374151] bg-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={filteredData}
                    isLoading={isLoading}
                    isError={isError}
                    refetch={handleRefresh}
                    title=""
                />
            </div>

            {/* ── Modals ── */}
            {compareRow && (
                <CompareSidebar
                    row={compareRow}
                    onClose={() => setCompareRow(null)}
                    onResolved={fetchData}
                    readOnly
                />
            )}
            {assignRow && (
                <AssignTaskModal
                    isOpen={!!assignRow}
                    onClose={() => setAssignRow(null)}
                    onSuccess={() => { fetchData(); setAssignRow(null); }}
                    isBulk={false}
                    row={assignRow}
                />
            )}
            {bulkAssign && (
                <AssignTaskModal
                    isOpen={bulkAssign}
                    onClose={() => setBulkAssign(false)}
                    onSuccess={() => { fetchData(); setBulkAssign(false); setSelectedRows(new Set()); }}
                    isBulk={true}
                    selectedRows={selectedRows}
                    tableData={tableData}
                />
            )}
        </div>
    );
};

export default ReviewQueue;