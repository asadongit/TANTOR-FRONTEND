import React, { useState, useMemo, useRef } from 'react';
import { Search, X, RefreshCw, MoreVertical } from 'lucide-react';
import Breadcrumb from '../../../../../components/Breadcrumb.jsx';
import DataTable from '../../../../../components/DataTable.jsx';
import SearchableDropdown from '../../components/SearchableDropdown';
import SyncAltIcon from '../../../../../assets/mdm/sync_alt.svg';
import { useReviewHistoryHomepage } from '../../../../../hooks/mdm/reviewHistory.jsx';
import DetailsModal from './modals/DetailsModal.jsx';

const filterTextStyle = {
    fontFamily: 'Satoshi, sans-serif',
    fontWeight: 400,
    fontSize: '14px',
    lineHeight: '100%',
    color: '#818181',
};

const DECISION_OPTIONS = [
    { value: 'All',           label: 'All'           },
    { value: 'Merged',        label: 'Merged'        },
    { value: 'Not Duplicate', label: 'Not Duplicate' },
    { value: 'Hold',          label: 'Hold'          },
    { value: 'Defer',         label: 'Defer'         },
];

const DECISION_STYLES = {
    merged:        { color: '#069B68', bg: 'rgba(42, 199, 146, 0.25)' },
    'not duplicate': { color: '#818181', bg: 'rgba(217, 217, 217, 0.5)' },
};

const DecisionBadge = ({ decision }) => {
    const style = DECISION_STYLES[decision?.toLowerCase()] || { color: '#6B7280', bg: '#F3F4F6' };
    return (
        <span
            className="inline-block rounded-md px-2.5 py-1 text-xs font-normal whitespace-nowrap"
            style={{ color: style.color, backgroundColor: style.bg }}
        >
            {decision}
        </span>
    );
};

const SummaryCard = ({ label, value }) => (
    <div className="bg-white flex flex-col items-start p-4 gap-2 rounded-lg flex-1">
        <span className="text-2xl font-bold text-[#282F49] leading-8 font-[Satoshi]">
            {value ?? '—'}
        </span>
        <span className="text-sm font-medium text-[#818181] font-[Satoshi]">
            {label}
        </span>
    </div>
);

const formatDisplay = (isoVal) =>
    isoVal
        ? new Date(isoVal + 'T00:00:00').toLocaleDateString('en-GB', {
              day: '2-digit', month: 'short', year: 'numeric',
          })
        : null;

const DateInput = ({ value, onChange, placeholder, inputRef }) => (
    <div
        className="relative flex items-center flex-shrink-0 bg-white border border-[#CCCCCC] rounded-lg cursor-pointer gap-1.5 px-3"
        style={{ width: '141px', height: '40px' }}
        onClick={() => inputRef.current?.showPicker?.() ?? inputRef.current?.click()}
    >
        <svg className="w-4 h-4 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="1.8"/>
            <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="1.8"/>
        </svg>
        <span className="flex-1 truncate text-[13px] font-normal font-[Satoshi]" style={{ color: value ? '#332849' : '#818181' }}>
            {formatDisplay(value) ?? placeholder}
        </span>
        {value && (
            <button onClick={(e) => { e.stopPropagation(); onChange(''); }} className="text-gray-300 hover:text-gray-500">
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

const RowActions = ({ row, onDetails }) => {
    const [open, setOpen] = useState(false);
    const [pos, setPos]   = useState({ top: 0, left: 0 });

    const handleOpen = (e) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setPos({ top: rect.bottom + 4, left: rect.right - 120 });
        setOpen((p) => !p);
    };

    return (
        <div className="relative inline-block">
            <button onClick={handleOpen} className="bg-transparent border-none cursor-pointer p-1 rounded-full">
                <MoreVertical size={18} className="text-[#818181]" />
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-[1000]" onClick={() => setOpen(false)} />
                    <div
                        className="fixed z-[9999] bg-white rounded-lg flex flex-col p-3"
                        style={{ top: pos.top, left: pos.left, width: '120px', boxShadow: '0px 2px 9px rgba(0,0,0,0.1)' }}
                    >
                        <button
                            onClick={() => { setOpen(false); onDetails(row); }}
                            className="flex items-center w-full rounded px-3 py-2 text-sm font-normal text-[#332849] font-[Satoshi] hover:bg-[#F2EBFF] transition-colors"
                        >
                            Details
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

const ReviewHistoryHomepage = () => {
    const [searchTerm,      setSearchTerm]      = useState('');
    const [reviewerFilter,  setReviewerFilter]  = useState('');
    const [decisionFilter,  setDecisionFilter]  = useState('All');
    const [fromDate,        setFromDate]        = useState('');
    const [toDate,          setToDate]          = useState('');
    const [detailsModal,    setDetailsModal]    = useState({ open: false, row: null });

    const fromDateRef = useRef(null);
    const toDateRef   = useRef(null);

    const { counts, reviews, isLoading, isError, fetchHomepage } = useReviewHistoryHomepage();

    const [entityFilter, setEntityFilter] = useState('');

    const entityOptions = useMemo(() => {
        const unique = [...new Set(reviews.map((r) => r.entity_id).filter(Boolean))];
        return [{ value: '', label: 'Entity ID' }, ...unique.map((e) => ({ value: e, label: e }))];
    }, [reviews]);

    const reviewerOptions = useMemo(() => {
        const unique = [...new Set(reviews.map((r) => r.reviewer).filter(Boolean))];
        return [{ value: '', label: 'Reviewers' }, ...unique.map((r) => ({ value: r, label: r }))];
    }, [reviews]);

    const filteredReviews = useMemo(() => {
        return reviews.filter((r) => {
            const matchSearch   = searchTerm
                ? Object.values(r).some((v) => String(v ?? '').toLowerCase().includes(searchTerm.toLowerCase()))
                : true;
            const matchEntity   = !entityFilter || r.entity_id === entityFilter;
            const matchReviewer = !reviewerFilter || r.reviewer === reviewerFilter;
            const matchDecision = decisionFilter === 'All' || (r.decision ?? '').toLowerCase() === decisionFilter.toLowerCase();
            const matchFrom     = fromDate ? new Date(r.review_date) >= new Date(fromDate) : true;
            const matchTo       = toDate   ? new Date(r.review_date) <= new Date(toDate)   : true;
            return matchSearch && matchEntity && matchReviewer && matchDecision && matchFrom && matchTo;
        });
    }, [reviews, searchTerm, entityFilter, reviewerFilter, decisionFilter, fromDate, toDate]);

    const handleReset = () => {
        setSearchTerm('');
        setEntityFilter('');
        setReviewerFilter('');
        setDecisionFilter('All');
        setFromDate('');
        setToDate('');
    };

    const summaryCards = [
    { label: 'Total Reviewed',  value: String(counts.total_reviewed  ?? 0).padStart(2, '0') },
    { label: 'Merged',          value: String(counts.merged          ?? 0).padStart(2, '0') },
    { label: 'Not Duplicate',   value: String(counts.not_duplicate   ?? 0).padStart(2, '0') },
    { label: 'Held/Deferred',   value: String(counts.held_deferred   ?? 0).padStart(2, '0') },
    { label: 'Avg Review Time', value: counts.avg_review_time ?? '—'                        },
];
    const columns = useMemo(() => [
        {
            key: 'task_id',
            label: 'Task ID',
            render: (row) => <span className="cursor-pointer text-[#8E77BB]">{row.task_id}</span>,
        },
        {
            key: 'entity_id',
            label: 'Entity ID',
            render: (row) => <span className="text-[#332849] text-sm">{row.entity_id ?? '—'}</span>,
        },
        {
            key: 'match_pair',
            label: 'Match Pair',
            render: (row) => <span className="text-[#332849] text-sm">{row.match_pair ?? '—'}</span>,
        },
        {
            key: 'reviewer',
            label: 'Reviewer',
            render: (row) => <span className="text-[#332849] text-sm">{row.reviewer ?? '—'}</span>,
        },
        {
            key: 'decision',
            label: 'Decision',
            render: (row) => row.decision ? <DecisionBadge decision={row.decision} /> : <span className="text-[#ccc]">—</span>,
        },
        {
            key: 'review_date',
            label: 'Review Date',
            render: (row) => <span className="text-[#332849] text-sm">{row.review_date ?? '—'}</span>,
        },
        {
            key: 'resolution_time',
            label: 'Resolution Time',
            render: (row) => <span className="text-[#332849] text-sm">{row.resolution_time ?? '—'}</span>,
        },
        {
            key: 'actions',
            label: '',
            sortable: false,
            render: (row) => <RowActions row={row} onDetails={(r) => setDetailsModal({ open: true, row: r })} />,
        },
    ], []);

    return (
    <>
        <div className="p-4 m-4 bg-white min-h-screen">
            <Breadcrumb />

            {/* Header */}
            <div className="flex items-start justify-between mb-4 mt-2">
                <div>
                    <h1 className="text-2xl font-bold text-[#282F49]">Review History</h1>
                    <p className="text-sm text-[#818181] mt-0.5">Audit trail of completed stewardship actions</p>
                </div>
                <button
                    className="flex items-center gap-2 px-4 bg-white border border-[#CCCCCC] text-[#282F49] rounded-lg font-[Satoshi] font-medium text-sm whitespace-nowrap"
                    style={{ height: '40px' }}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Export
                </button>
            </div>

            {/* Summary Cards */}
            <div
                className="rounded-2xl p-4 mb-6"
                style={{ background: 'linear-gradient(270deg, #EFE7FF 17.24%, #8E77BB 93.06%, #2B125C 141.05%)' }}
            >
                <div className="flex flex-row items-start gap-2.5">
                    {summaryCards.map((card, i) => (
                        <SummaryCard key={i} {...card} />
                    ))}
                </div>
            </div>

            {/* Filter Row */}
            <div className="flex flex-row justify-between items-end w-full mb-3" style={{ height: '80px' }}>

                {/* Left - Title + Search */}
                <div className="flex flex-col justify-center items-start gap-4" style={{ width: '227px' }}>
                    <span className="text-lg font-medium text-[#332849] font-[Satoshi]">
                        Completed Reviews
                    </span>
                    <div
                        className="flex flex-row items-center bg-white border border-[#CCCCCC] rounded-lg px-2 gap-2 w-full"
                        style={{ height: '40px' }}
                    >
                        <Search className="h-5 w-5 text-[#818181] flex-shrink-0" />
                        <input
                            type="text"
                            placeholder="Search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 min-w-0 bg-transparent focus:outline-none text-sm font-normal font-[Satoshi] text-[#818181]"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-gray-600">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Right - Filters */}
                <div className="flex flex-row items-center gap-4" style={{ height: '40px' }}>
                    {/* Entity ID */}
                    <div style={{ width: '121px', height: '40px' }}>
                        <SearchableDropdown value={entityFilter} onChange={setEntityFilter} options={entityOptions} placeholder="Entity ID" />
                    </div>

                    {/* Reviewers */}
                    <div style={{ width: '128px', height: '40px' }}>
                        <SearchableDropdown value={reviewerFilter} onChange={setReviewerFilter} options={reviewerOptions} placeholder="Reviewers" />
                    </div>

                    {/* Decision */}
                    <div style={{ width: '121px', height: '40px' }}>
                        <SearchableDropdown value={decisionFilter} onChange={setDecisionFilter} options={DECISION_OPTIONS} placeholder="Decision" />
                    </div>

                    {/* Date Picker Container */}
                    <div className="flex flex-row items-center gap-3" style={{ width: '326px', height: '40px' }}>
                        <DateInput value={fromDate} onChange={setFromDate} placeholder="From Date" inputRef={fromDateRef} />
                        <button onClick={() => { setFromDate(toDate); setToDate(fromDate); }} className="flex items-center justify-center flex-shrink-0 p-1 hover:bg-gray-100 rounded transition-colors">
                            <img src={SyncAltIcon} alt="swap dates" className="w-5 h-5" />
                        </button>
                        <DateInput value={toDate} onChange={setToDate} placeholder="To Date" inputRef={toDateRef} />
                    </div>

                    {/* Refresh */}
                    <button
                        onClick={() => { handleReset(); fetchHomepage(); }}
                        className="flex items-center justify-center bg-white border border-[#CCCCCC] rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0"
                        style={{ width: '40px', height: '40px' }}
                    >
                        <RefreshCw className="w-5 h-5 text-[#818181]" />
                    </button>
                </div>
            </div>

            {/* Table */}
            <DataTable
                columns={columns}
                data={filteredReviews}
                isLoading={isLoading}
                isError={isError}
                refetch={fetchHomepage}
                title=""
            />
        </div>

        <DetailsModal
            isOpen={detailsModal.open}
            onClose={() => setDetailsModal({ open: false, row: null })}
            row={detailsModal.row}
        />
    </>
);
};

export default ReviewHistoryHomepage;

