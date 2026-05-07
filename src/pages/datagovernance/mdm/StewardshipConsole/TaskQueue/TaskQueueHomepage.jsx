import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, RefreshCw, MoreVertical } from 'lucide-react';
import Breadcrumb from '../../../../../components/Breadcrumb.jsx';
import DataTable from '../../../../../components/DataTable.jsx';
import SearchableDropdown from '../../components/SearchableDropdown';
import TotalPendingIcon from '../../../../../assets/mdm/pending_actions.svg';
import HighPriorityIcon from '../../../../../assets/mdm/flag_2.svg';
import OverdueIcon from '../../../../../assets/mdm/calendar_today.svg';
import CompletedIcon from '../../../../../assets/mdm/check_circle_unread.svg';
import SyncAltIcon from '../../../../../assets/mdm/sync_alt.svg';
import { useTaskQueueHomepage } from '../../../../../hooks/mdm/taskQueue.jsx';
import CompareIcon from '../../../../../assets/mdm/compare_arrows.svg';
import ReassignIcon from '../../../../../assets/mdm/person_add.svg';
import CompareSidebar from '../../MatchandMerge/ReviewQueue/modals/CompareSidebar.jsx';
import ReassignTaskModal from './modals/ReassignTaskModal';
import TaskDetailSidebar from './modals/TaskDetailSidebar.jsx';
import AddTaskModal from './modals/AddTaskModal.jsx';
//  Constants
const STATUS_OPTIONS = [
    { value: 'All Status', label: 'All Status' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'IN PROGRESS', label: 'In Progress' },
    { value: 'OVERDUE', label: 'Overdue' },
];

const TYPE_OPTIONS = [
    { value: 'All Types', label: 'All Types' },
    { value: 'Match Review', label: 'Match Review' },
    { value: 'Data Quality', label: 'Data Quality' },
    { value: 'Merge Approval', label: 'Merge Approval' },
];

const PRIORITY_STYLES = {
    Critical: { color: '#EF4D5F', bg: 'rgba(242, 118, 167, 0.3)' },
    High: { color: '#EF4D5F', bg: 'rgba(242, 118, 167, 0.3)' },
    Medium: { color: '#E08E40', bg: 'rgba(255, 201, 63, 0.25)' },
    Low: { color: '#069B68', bg: 'rgba(42, 199, 146, 0.25)' },
};

const STATUS_STYLES = {
    COMPLETED: { color: '#069B68', bg: 'rgba(42, 199, 146, 0.25)' },
    PENDING: { color: '#E08E40', bg: 'rgba(255, 201, 63, 0.25)' },
    'IN PROGRESS': { color: '#E08E40', bg: 'rgba(255, 201, 63, 0.25)' },
    OVERDUE: { color: '#EF4D5F', bg: 'rgba(242, 118, 167, 0.30)' },
};

const STATUS_LABELS = {
    COMPLETED: 'Completed',
    PENDING: 'Pending',
    'IN PROGRESS': 'In Progress',
    OVERDUE: 'Overdue',
};

//  Shared filter text style
const filterTextStyle = {
    fontFamily: 'Satoshi, sans-serif',
    fontWeight: 400,
    fontSize: '14px',
    lineHeight: '100%',
    letterSpacing: '0%',
    color: '#818181',
};

//  Helpers
const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const [day, month, year] = dateStr.split('/');
    return new Date(`${year}-${month}-${day}`);
};

const formatDisplay = (isoVal) =>
    isoVal
        ? new Date(isoVal + 'T00:00:00').toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric',
        })
        : null;

//  Badges
const PriorityBadge = ({ priority }) => {
    const style = PRIORITY_STYLES[priority] || { color: '#6B7280', bg: '#F3F4F6' };
    return (
        <span
            className="inline-block rounded-md px-2.5 py-1 text-xs font-normal whitespace-nowrap"
            style={{ color: style.color, backgroundColor: style.bg }}
        >
            {priority}
        </span>
    );
};

const StatusBadge = ({ status }) => {
    const style = STATUS_STYLES[status] || { color: '#6B7280', bg: '#F3F4F6' };
    return (
        <span
            className="inline-block rounded-md px-2.5 py-1 text-xs font-normal whitespace-nowrap"
            style={{ color: style.color, backgroundColor: style.bg }}
        >
            {STATUS_LABELS[status] || status}
        </span>
    );
};

const TypeBadge = ({ type }) => (
    <span className="inline-block bg-[#D9D9D980] text-[#818181] px-2.5 py-1 rounded text-xs font-normal whitespace-nowrap">
        {type}
    </span>
);

//  Summary Card
const SummaryCard = ({ icon, iconBg, label, value }) => (
    <div className="bg-white rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
        <div className="flex items-center gap-2.5">
            <div
                className="flex items-center justify-center w-9 h-9 rounded-full flex-shrink-0"
                style={{ backgroundColor: iconBg }}
            >
                <img src={icon} alt={label} className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-[#818181]">{label}</span>
        </div>
        <span className="text-3xl font-bold text-[#282F49] leading-none">
            {String(value ?? 0).padStart(2, '0')}
        </span>
    </div>
);

//  Date Input pill
const DateInput = ({ value, onChange, placeholder, inputRef }) => (
    <div
        className="relative flex items-center flex-shrink-0 bg-white border border-[#CCCCCC] rounded-lg cursor-pointer hover:border-gray-300 transition-colors gap-1.5 px-3"
        style={{ width: '141px', height: '40px' }}
        onClick={() => inputRef.current?.showPicker?.() ?? inputRef.current?.click()}
    >
        <svg className="w-4 h-4 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="1.8" />
            <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="1.8" />
        </svg>
        <span className="flex-1 truncate text-[14px] font-normal font-[Satoshi]" style={{ color: value ? '#332849' : '#818181' }}>
            {formatDisplay(value) ?? placeholder}
        </span>
        {value && (
            <button
                onClick={(e) => { e.stopPropagation(); onChange(''); }}
                className="text-gray-300 hover:text-gray-500 flex-shrink-0"
            >
                <X className="w-3 h-3" />
            </button>
        )}
        <input
            ref={inputRef}
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer -z-10"
            tabIndex={-1}
        />
    </div>
);

// ── Row Actions Dropdown ──────────────────────────────────────────────────────
const RowActions = ({ row, onCompare, onReassign }) => {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState({ top: 0, left: 0 });
    const handleOpen = (e) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setPos({ top: rect.bottom + 4, left: rect.right - 136 });
        setOpen((p) => !p);
    };

    const handleCompare = () => {
        setOpen(false);
        onCompare(row);
    };

    const actions = [
        {
            icon: CompareIcon,
            label: 'Compare',
            color: '#332849',
            bg: '#FFFFFF',
            hoverBg: '#F2EBFF',
            disabled: row.type !== 'Match Review',
            onClick: handleCompare,
        },
        {
            icon: ReassignIcon,
            label: 'Reassign',
            color: '#332849',
            bg: '#FFFFFF',
            hoverBg: '#F2EBFF',
            disabled: false,
            onClick: () => { setOpen(false); onReassign(row); },
        },
    ];

    return (
        <div className="relative inline-block">
            <button
                onClick={handleOpen}
                className="bg-transparent border-none cursor-pointer p-1 rounded-full flex items-center"
            >
                <MoreVertical size={18} className="text-[#818181]" />
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-[1000]" onClick={() => setOpen(false)} />
                    <div
                        className="fixed z-[9999] bg-white rounded-lg flex flex-col p-3 gap-3"
                        style={{ top: pos.top, left: pos.left, width: '136px', boxShadow: '0px 2px 9px rgba(0,0,0,0.1)' }}
                    >
                        {actions.map(({ icon, label, color, bg, hoverBg, disabled, onClick }) => (
                            <button
                                key={label}
                                onClick={onClick}
                                disabled={disabled}
                                className="flex flex-row items-center w-full rounded transition-colors"
                                style={{
                                    padding: '8px 12px',
                                    gap: '10px',
                                    height: '35px',
                                    background: bg,
                                    borderRadius: '4px',
                                    opacity: disabled ? 0.4 : 1,
                                    cursor: disabled ? 'not-allowed' : 'pointer',
                                }}
                                onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = hoverBg; }}
                                onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.background = bg; }}
                            >
                                <img src={icon} alt={label} className="w-5 h-5 flex-shrink-0" />
                                <span className="font-[Satoshi] font-normal text-sm whitespace-nowrap" style={{ color }}>
                                    {label}
                                </span>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

//  Main Component
const TaskQueueHomepage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('All Types');
    const [statusFilter, setStatusFilter] = useState('All Status');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [selectedRows, setSelectedRows] = useState([]);
    const [compareRow, setCompareRow] = useState(null);
    const [detailRow, setDetailRow] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const fromDateRef = useRef(null);
    const toDateRef = useRef(null);

    const { counts, tasks, isLoading, isError, fetchHomepage } = useTaskQueueHomepage();
    const [reassignModal, setReassignModal] = useState({ open: false, isBulk: false, row: null });

    const handleSwapDates = () => {
        setFromDate(toDate);
        setToDate(fromDate);
    };

    const handleCompare = (row) => {
        setCompareRow({
            pairId: row.pair_id,
            record1: row.entity_id,
            score: row.match_score ?? '—',
        });
    };

    const summaryCards = [
        { icon: TotalPendingIcon, iconBg: '#FFF1CF', label: 'Total Pending', value: counts.total_pending },
        { icon: HighPriorityIcon, iconBg: '#FBD6E5', label: 'High Priority', value: counts.high_priority },
        { icon: OverdueIcon, iconBg: '#C5EAF0', label: 'Overdue', value: counts.overdue },
        { icon: CompletedIcon, iconBg: '#CAF1E4', label: 'Completed Today', value: counts.completed_today },
    ];

    const filteredTasks = useMemo(() => {
        return tasks.filter((t) => {
            const matchSearch = searchTerm
                ? Object.values(t).some((v) =>
                    String(v ?? '').toLowerCase().includes(searchTerm.toLowerCase())
                )
                : true;
            const matchType = typeFilter === 'All Types' || t.type === typeFilter;
            const matchStatus = statusFilter === 'All Status' || t.status === statusFilter;
            const matchFrom = fromDate ? parseDate(t.due_date) >= new Date(fromDate) : true;
            const matchTo = toDate ? parseDate(t.due_date) <= new Date(toDate) : true;
            return matchSearch && matchType && matchStatus && matchFrom && matchTo;
        });
    }, [tasks, searchTerm, typeFilter, statusFilter, fromDate, toDate]);

    //  Checkbox selection
    const allSelected = filteredTasks.length > 0 && selectedRows.length === filteredTasks.length;

    const toggleAll = () => {
        setSelectedRows(allSelected ? [] : filteredTasks.map((t) => t.actual_task_id));
    };

    const toggleRow = (id) => {
        setSelectedRows((prev) =>
            prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
        );
    };

    const columns = useMemo(() => [
        {
            key: 'checkbox',
            label: (
                <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="w-4 h-4 accent-[#8E77BB] cursor-pointer"
                />
            ),
            sortable: false,
            render: (row) => (
                <div onClick={(e) => e.stopPropagation()}>  {/* ← add this wrapper */}
                    <input
                        type="checkbox"
                        checked={selectedRows.includes(row.actual_task_id)}
                        onChange={() => toggleRow(row.actual_task_id)}
                        className="w-4 h-4 accent-[#8E77BB] cursor-pointer"
                    />
                </div>
            ),
        },
        {
            key: 'task_id',
            label: 'Task ID',
            render: (row) => (
                <span
                    className="cursor-pointer text-[#8E77BB]"
                    onClick={() =>
                        setDetailRow({ taskId: row.actual_task_id, taskLabel: row.task_id })
                    }
                >
                    {row.task_id}
                </span>
            ),
        },
        {
            key: 'entity_id',
            label: 'Entity ID',
            render: (row) => <span className="text-[#332849] text-sm">{row.entity_id}</span>,
        },
        {
            key: 'type',
            label: 'Type',
            render: (row) => row.type ? <TypeBadge type={row.type} /> : <span className="text-[#ccc]">—</span>,
        },
        {
            key: 'assigned_to',
            label: 'Assigned To',
            render: (row) => <span className="text-[#332849] text-sm">{row.assigned_to ?? '—'}</span>,
        },
        {
            key: 'priority',
            label: 'Priority',
            render: (row) => row.priority ? <PriorityBadge priority={row.priority} /> : <span className="text-[#ccc]">—</span>,
        },
        {
            key: 'due_date',
            label: 'Due Date',
            render: (row) => <span className="text-[#332849] text-sm">{row.due_date ?? '—'}</span>,
        },
        {
            key: 'status',
            label: 'Status',
            render: (row) => row.status ? <StatusBadge status={row.status} /> : <span className="text-[#ccc]">—</span>,
        },
        {
            key: 'actions',
            label: '',
            sortable: false,
            render: (row) => (
                <div onClick={(e) => e.stopPropagation()}>  {/* ← add this wrapper */}
                    <RowActions
                        row={row}
                        onCompare={handleCompare}
                        onReassign={(r) => setReassignModal({ open: true, isBulk: false, row: r })}
                    />
                </div>
            ),
        },
    ], [selectedRows, filteredTasks, allSelected]);

    return (
        <>
            <div className="p-4 m-4 bg-white min-h-screen">
                <Breadcrumb />

                {/* Header */}
                <div className="flex items-start justify-between mb-4 mt-2">
                    <div>
                        <h1 className="text-2xl font-bold text-[#282F49]">Task Queue</h1>
                        <p className="text-sm text-[#818181] mt-0.5">
                            Unassigned tasks pool - claim tasks to work on
                        </p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-4 bg-[#8E77BB] text-white rounded-lg hover:bg-[#7a67a0] transition-colors font-[Satoshi] font-medium text-sm whitespace-nowrap flex-shrink-0"
                        style={{ height: '40px' }}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        Add Task
                    </button>
                </div>

                {/* Summary Cards */}
                <div
                    className="rounded-2xl p-4 mb-6"
                    style={{
                        background: 'linear-gradient(270deg, #EFE7FF 17.24%, #8E77BB 93.06%, #2B125C 141.05%)',
                    }}
                >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {summaryCards.map((card, i) => (
                            <SummaryCard key={i} {...card} />
                        ))}
                    </div>
                </div>

                {/* Filter Row */}
                <div className="flex items-center justify-between mb-3 w-full gap-2 flex-wrap">

                    {/* Left */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                        <span className="flex-shrink-0" style={{ ...filterTextStyle, color: '#332849', fontWeight: 500 }}>
                            Tasks
                        </span>
                        <div
                            className="relative flex items-center"
                            style={{ width: '180px', height: '40px', borderRadius: '8px', border: '1px solid #CCCCCC', padding: '8px', gap: '8px' }}
                        >
                            <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <input
                                type="text"
                                placeholder="Search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex-1 min-w-0 bg-transparent focus:outline-none"
                                style={filterTextStyle}
                            />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Right */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {selectedRows.length > 0 ? (
                            <>
                                <span className="text-sm text-[#332849] font-medium whitespace-nowrap font-[Satoshi]">
                                    Selected Records ({selectedRows.length})
                                </span>
                                <button
                                    onClick={() => setReassignModal({ open: true, isBulk: true, row: null })}
                                    className="flex items-center justify-center px-4 bg-[#8E77BB] text-white rounded-lg hover:bg-[#7a67a0] transition-colors font-[Satoshi] font-medium text-sm whitespace-nowrap flex-shrink-0"
                                    style={{ height: '40px' }}
                                >
                                    Bulk Reassign
                                </button>
                            </>
                        ) : (
                            <>
                                <DateInput value={fromDate} onChange={setFromDate} placeholder="From Date" inputRef={fromDateRef} />
                                <button onClick={handleSwapDates} className="flex items-center justify-center flex-shrink-0 p-1.5 rounded hover:bg-gray-100 transition-colors">
                                    <img src={SyncAltIcon} alt="swap dates" className="w-4 h-4" />
                                </button>
                                <DateInput value={toDate} onChange={setToDate} placeholder="To Date" inputRef={toDateRef} />
                                <div className="flex-shrink-0" style={{ width: '121px', height: '40px' }}>
                                    <SearchableDropdown value={typeFilter} onChange={setTypeFilter} options={TYPE_OPTIONS} placeholder="All Types" />
                                </div>
                                <div className="flex-shrink-0" style={{ width: '121px', height: '40px' }}>
                                    <SearchableDropdown value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} placeholder="All Status" />
                                </div>
                                <button onClick={fetchHomepage} className="flex items-center justify-center flex-shrink-0 border border-[#CCCCCC] rounded-lg hover:bg-gray-50 transition-colors" style={{ width: '40px', height: '40px' }}>
                                    <RefreshCw className="w-4 h-4 text-gray-400" />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Table */}
                <DataTable
                    columns={columns}
                    data={filteredTasks}
                    isLoading={isLoading}
                    isError={isError}
                    refetch={fetchHomepage}
                    title=""
                    onRowClick={(row) =>
                        setDetailRow({ taskId: row.actual_task_id, taskLabel: row.task_id })
                    }
                />
                <ReassignTaskModal
                    isOpen={reassignModal.open}
                    onClose={() => {                                                    // ← update this
                        setReassignModal({ open: false, isBulk: false, row: null });
                        setSelectedRows([]);
                    }}
                    onSuccess={() => {                                                  // ← update this
                        setReassignModal({ open: false, isBulk: false, row: null });
                        setSelectedRows([]);
                        fetchHomepage();
                    }}
                    isBulk={reassignModal.isBulk}
                    row={reassignModal.row}
                    selectedRows={new Set(selectedRows)}
                    tableData={tasks}
                />
            </div>

            {compareRow && (
                <CompareSidebar
                    row={compareRow}
                    onClose={() => setCompareRow(null)}
                    onResolved={() => { setCompareRow(null); fetchHomepage(); }}
                />
            )}

            {detailRow && (
                <TaskDetailSidebar
                    taskId={detailRow.taskId}
                    taskLabel={detailRow.taskLabel}
                    onClose={() => setDetailRow(null)}
                />
            )}
            {isCreateModalOpen && (
                <AddTaskModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onSuccess={() => { setIsCreateModalOpen(false); fetchHomepage(); }}
                />
            )}
        </>
    );
};

export default TaskQueueHomepage;