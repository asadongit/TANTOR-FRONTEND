import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Plus, ChevronDown, Search } from 'lucide-react';
import Breadcrumb from '../../../../../components/Breadcrumb.jsx';
import DataTable from '../../../../../components/DataTable.jsx';
import ProbabilisticIcon from '../../../../../assets/mdm/folder_match.svg';
import DeterministicIcon from '../../../../../assets/mdm/device_hub.svg';
import HybridIcon from '../../../../../assets/mdm/assistant_on_hub.svg';
import EditIcon from '../../../../../assets/mdm/edit.svg';
import BlockIcon from '../../../../../assets/mdm/block.svg';
import PlayArrowIcon from '../../../../../assets/mdm/play_arrow.svg';
import CreateRuleSetModal from './modals/CreateRuleSetModal.jsx';
import EditRuleSetModal from './modals/EditRuleSetModal.jsx';
import RuleSetRulesDrawer from './modals/RuleSetRulesDrawer.jsx';
import { EditRuleModal } from './modals/Addeditrulemodal.jsx';
import TestMatchConfigurationModal from './modals/TestMatchConfigurationModal.jsx';
import ToggleStatusConfirmModal from './modals/ToggleStatusConfirmModal.jsx';
import {
    useMatchConfigHomepage,
    useDomains,
    useMatchRules,
    useToggleRuleStatus,
} from '../../../../../hooks/mdm/matchMerge.jsx';

const METRICS = [
    { key: 'DETERMINISTIC', title: 'Deterministic', desc: 'Exact match on identifiers', icon: DeterministicIcon, bgColor: '#2AC79240' },
    { key: 'PROBABILISTIC', title: 'Probabilistic', desc: 'Fuzzy matching with scores', icon: ProbabilisticIcon, bgColor: '#FFC93F40' },
    { key: 'HYBRID', title: 'Hybrid', desc: 'Combined approach', icon: HybridIcon, bgColor: '#16ABC240' },
];

const TYPE_CONFIG = {
    DETERMINISTIC: { label: 'Deterministic', color: '#069B68', bg: '#2AC79240' },
    PROBABILISTIC: { label: 'Probabilistic', color: '#E08E40', bg: '#FFC93F40' },
    HYBRID: { label: 'Hybrid', color: '#16ABC2', bg: '#16ABC240' },
};

// ─── Small display components ─────────────────────────────────────────────────

const TypeBadge = ({ type }) => {
    const cfg = TYPE_CONFIG[type?.toUpperCase()] ?? { label: type, color: '#6B7280', bg: '#F3F4F6' };
    return (
        <span
            className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-normal rounded whitespace-nowrap"
            style={{ color: cfg.color, backgroundColor: cfg.bg }}
        >
            {cfg.label}
            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth={2.2}>
                <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
        </span>
    );
};

const StatusBadge = ({ status }) => {
    const isActive = status?.toLowerCase() === 'active';
    return (
        <span className={[
            'px-2 py-1.5 text-xs font-normal rounded inline-block',
            isActive ? 'text-[#069B68] bg-[#2AC79240]' : 'text-[#EF4D5F] bg-[#F276A74D]',
        ].join(' ')}>
            {isActive ? 'Active' : 'Inactive'}
        </span>
    );
};

const DomainTag = ({ name }) => (
    <span className="text-[#818181] bg-[#D9D9D980] px-2 py-1.5 text-xs font-normal rounded inline-block">
        {name}
    </span>
);

const AlgoBadge = ({ algo }) => (
    <span className="text-[#818181] bg-[#D9D9D980] px-2 py-1.5 text-xs font-normal rounded inline-block whitespace-nowrap">
        {algo}
    </span>
);

const Skeleton = ({ className }) => (
    <span className={`inline-block bg-white/40 rounded animate-pulse ${className}`} />
);

// ─── RowActions (RuleSet table) ───────────────────────────────────────────────

const RowActions = ({ row, onEdit, onRules }) => {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState({ top: 0, left: 0 });

    const handleOpen = (e) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setPos({ top: rect.bottom + 4, left: rect.right - 160 });
        setOpen((p) => !p);
    };

    return (
        <div className="relative inline-block">
            <button onClick={handleOpen} className="bg-none border-none cursor-pointer p-1 rounded-full flex items-center">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="#818181">
                    <circle cx="12" cy="5" r="1.5" />
                    <circle cx="12" cy="12" r="1.5" />
                    <circle cx="12" cy="19" r="1.5" />
                </svg>
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-[1000]" onClick={() => setOpen(false)} />
                    <div
                        className="fixed z-[9999] bg-white rounded-2xl shadow-[0px_10px_30px_rgba(0,0,0,0.15)] p-2 min-w-[160px] flex flex-col gap-1"
                        style={{ top: pos.top, left: pos.left }}
                    >
                        <button
                            onClick={() => { onEdit?.(row); setOpen(false); }}
                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] border-none cursor-pointer bg-[#F3EFFF] w-full"
                        >
                            <img src={EditIcon} alt="Edit" className="w-4 h-4" />
                            <span className="text-[#8e78b7] text-sm font-medium">Edit</span>
                        </button>
                        <button
                            onClick={() => { onRules?.(row); setOpen(false); }}
                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] border-none cursor-pointer bg-white w-full"
                        >
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#818181" strokeWidth={2}>
                                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                            <span className="text-[#818181] text-sm font-medium">Rules</span>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

// ─── DomainDropdown ───────────────────────────────────────────────────────────

const DomainDropdown = ({ domains, selected, onSelect }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const ref = useRef(null);

    const filtered = useMemo(
        () => domains.filter((d) => d.domain_name.toLowerCase().includes(search.toLowerCase())),
        [domains, search]
    );

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div ref={ref} className="relative min-w-[200px]">
            <button
                onClick={() => setOpen((p) => !p)}
                className="flex items-center justify-between gap-2 w-full px-2.5 py-[7px] border border-gray-300 rounded-lg text-[13px] text-gray-700 bg-white cursor-pointer outline-none hover:border-[#8E77BB] transition-colors"
            >
                <span>{selected?.domain_name ?? 'Select domain...'}</span>
                <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
            </button>

            {open && (
                <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-gray-200 rounded-[10px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] z-[999] overflow-hidden min-w-[220px]">
                    <div className="flex items-center gap-1.5 p-2 border-b border-gray-100">
                        <Search size={13} className="text-gray-400 flex-shrink-0" />
                        <input
                            autoFocus
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search domain..."
                            className="border-none outline-none text-[13px] text-gray-700 w-full bg-transparent"
                        />
                    </div>
                    <div className="max-h-[200px] overflow-y-auto">
                        {filtered.length === 0 && (
                            <div className="p-3 text-[13px] text-gray-400 text-center">No results</div>
                        )}
                        {filtered.map((d) => (
                            <div
                                key={d.domain_id}
                                onClick={() => { onSelect(d); setOpen(false); setSearch(''); }}
                                className={[
                                    'px-3 py-2 text-[13px] cursor-pointer transition-colors',
                                    selected?.domain_id === d.domain_id
                                        ? 'text-[#8E77BB] bg-[#f5f0ff]'
                                        : 'text-gray-700 hover:bg-[#f5f0ff]',
                                ].join(' ')}
                            >
                                {d.domain_name}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── MatchRulesTab ────────────────────────────────────────────────────────────

const MatchRulesTab = ({ filteredRules, isLoading, isError, onRefetch, selectedDomain, onTestRule }) => {
    const [editRuleOpen, setEditRuleOpen] = useState(false);
    const [editRuleTarget, setEditRuleTarget] = useState(null);
    const [toggleTarget, setToggleTarget] = useState(null);
    const [toggleModalOpen, setToggleModalOpen] = useState(false);

    const { isToggling, toggle } = useToggleRuleStatus(() => {
        onRefetch();
        setToggleModalOpen(false);
        setToggleTarget(null);
    });

    const handleToggleConfirm = () => toggle(toggleTarget?.rule_id);
    const handleToggleCancel = () => { if (!isToggling) { setToggleModalOpen(false); setToggleTarget(null); } };

    const RuleRowActions = ({ row }) => {
        const [open, setOpen] = useState(false);
        const [pos, setPos] = useState({ top: 0, left: 0 });
        const isActive = row.status?.toLowerCase() === 'active';

        const handleOpen = (e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            setPos({ top: rect.bottom + 4, left: rect.right - 160 });
            setOpen((p) => !p);
        };

        return (
            <div className="relative inline-block">
                <button onClick={handleOpen} className="bg-none border-none cursor-pointer p-1 rounded-full flex items-center">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="#818181">
                        <circle cx="12" cy="5" r="1.5" />
                        <circle cx="12" cy="12" r="1.5" />
                        <circle cx="12" cy="19" r="1.5" />
                    </svg>
                </button>
                {open && (
                    <>
                        <div className="fixed inset-0 z-[1000]" onClick={() => setOpen(false)} />
                        <div
                            className="fixed z-[9999] bg-white rounded-2xl shadow-[0px_10px_30px_rgba(0,0,0,0.15)] p-2 min-w-[160px] flex flex-col gap-1"
                            style={{ top: pos.top, left: pos.left }}
                        >
                            <button
                                onClick={() => { setEditRuleTarget(row); setEditRuleOpen(true); setOpen(false); }}
                                className="flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] border-none cursor-pointer bg-[#F3EFFF] w-full"
                            >
                                <img src={EditIcon} alt="Edit" className="w-4 h-4" />
                                <span className="text-[#8e78b7] text-sm font-medium">Edit</span>
                            </button>

                            <button
                                onClick={() => { onTestRule(row.rule_id); setOpen(false); }}
                                className="flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] border-none cursor-pointer bg-white w-full"
                            >
                                <img src={PlayArrowIcon} alt="Test" className="w-4 h-4" />
                                <span className="text-[#818181] text-sm font-medium">Test</span>
                            </button>

                            <button
                                onClick={() => { setToggleTarget(row); setToggleModalOpen(true); setOpen(false); }}
                                className="flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] border-none cursor-pointer bg-white w-full"
                            >
                                <img
                                    src={BlockIcon}
                                    alt={isActive ? 'Disable' : 'Enable'}
                                    className="w-4 h-4"
                                    style={{
                                        filter: isActive
                                            ? 'invert(27%) sepia(99%) saturate(2000%) hue-rotate(330deg) brightness(90%)'
                                            : 'invert(39%) sepia(72%) saturate(400%) hue-rotate(100deg) brightness(90%)',
                                    }}
                                />
                                <span className="text-sm font-medium" style={{ color: isActive ? '#EF4D5F' : '#069B68' }}>
                                    {isActive ? 'Disable' : 'Enable'}
                                </span>
                            </button>
                        </div>
                    </>
                )}
            </div>
        );
    };

    const columns = useMemo(() => [
        { key: 'rule_name', label: 'Rule Name', render: (row) => <span className="text-sm font-normal text-[#8E77BB]">{row.rule_name}</span> },
        { key: 'algorithm', label: 'Algorithm', render: (row) => <AlgoBadge algo={row.algorithm} /> },
        { key: 'weight', label: 'Weight', render: (row) => <span className="text-sm text-gray-600">{row.weight}</span> },
        { key: 'threshold', label: 'Threshold', render: (row) => <span className="text-sm text-gray-600">{row.threshold}</span> },
        { key: 'blocking', label: 'Blocking', render: (row) => <span className="text-sm text-gray-600">{row.blocking}</span> },
        { key: 'null_handling', label: 'Null Handling', render: (row) => <span className="text-sm text-gray-500">{row.null_handling}</span> },
        { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
        { key: 'actions', label: 'Actions', sortable: false, render: (row) => <RuleRowActions row={row} /> },
    ], []);

    return (
        <div>
            {/* Match Thresholds Banner */}
            {/* {!isError && (
                <div className="bg-[#FAFAFA] rounded-xl p-3.5 mb-4">
                    <p className="text-lg font-medium text-[#332849] mb-3">Match Thresholds</p>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-[#F7FFFC] border border-[#36AD8F] rounded-lg px-4 py-3 flex items-center justify-between">
                            <div>
                                <p className="text-base font-medium text-[#332849]">Auto-Merge</p>
                                <p className="text-xs text-[#818181]">Automatic merge</p>
                            </div>
                            <span className="text-2xl font-bold text-[#36AD8F]">≥95%</span>
                        </div>
                        <div className="bg-[#FFF8F2] border border-[#E08E40] rounded-lg px-4 py-3 flex items-center justify-between">
                            <div>
                                <p className="text-base font-medium text-[#332849]">Review</p>
                                <p className="text-xs text-[#818181]">Manual review</p>
                            </div>
                            <span className="text-2xl font-bold text-[#E08E40]">75—95%</span>
                        </div>
                        <div className="bg-[#FAFAFA] border border-[#818181] rounded-lg px-4 py-3 flex items-center justify-between">
                            <div>
                                <p className="text-base font-medium text-[#332849]">No Match</p>
                                <p className="text-xs text-[#818181]">Not duplicates</p>
                            </div>
                            <span className="text-2xl font-bold text-[#818181]">&lt;75%</span>
                        </div>
                    </div>
                </div>
            )} */}

            {isError && !isLoading && (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <div className="text-center max-w-[320px]">
                        <p className="text-[15px] font-medium text-[#23252D] mb-1.5">No match rules found</p>
                        <p className="text-[13px] text-[#818181] leading-relaxed">No rules have been configured for this domain yet.</p>
                    </div>
                </div>
            )}

            {!isError && (
                <DataTable
                    columns={columns}
                    data={filteredRules}
                    isLoading={isLoading}
                    isError={isError}
                    refetch={onRefetch}
                    title=""
                />
            )}

            <ToggleStatusConfirmModal
                isOpen={toggleModalOpen}
                ruleName={toggleTarget?.rule_name}
                currentStatus={toggleTarget?.status}
                onConfirm={handleToggleConfirm}
                onCancel={handleToggleCancel}
                isLoading={isToggling}
            />
            <EditRuleModal
                isOpen={editRuleOpen}
                onClose={() => { setEditRuleOpen(false); setEditRuleTarget(null); }}
                onSuccess={onRefetch}
                ruleData={editRuleTarget}
                domainId={selectedDomain?.domain_id}
            />
        </div>
    );
};

// ─── MatchConfiguration (page) ────────────────────────────────────────────────

const MatchConfiguration = () => {
    const [activeTab, setActiveTab] = useState('ruleset');
    const [statusFilter, setStatusFilter] = useState('All');
    const [typeFilter, setTypeFilter] = useState('');
    const [selectedDomain, setSelectedDomain] = useState(null);

    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [rulesDrawerOpen, setRulesDrawerOpen] = useState(false);
    const [rulesDrawerTarget, setRulesDrawerTarget] = useState(null);
    const [testOpen, setTestOpen] = useState(false);
    const [testRuleId, setTestRuleId] = useState(null);

    // Hooks
    const { isLoading, isError, metricCounts, ruleSets, fetchData } = useMatchConfigHomepage();
    const { domains } = useDomains(true);
    const { rules, isLoading: rulesLoading, isError: rulesError, fetchRules } = useMatchRules(
        selectedDomain?.domain_id
    );

    // Auto-select first domain
    useEffect(() => {
        if (domains.length > 0 && !selectedDomain) setSelectedDomain(domains[0]);
    }, [domains]);

    const openOverallTest = () => { setTestRuleId(null); setTestOpen(true); };
    const openRuleTest = (ruleId) => { setTestRuleId(ruleId); setTestOpen(true); };

    const handleDomainSelect = (domain) => {
        setSelectedDomain(domain);
        setTypeFilter('');
    };

    const filteredRuleSets = useMemo(() => {
        if (statusFilter === 'All') return ruleSets;
        return ruleSets.filter((r) => r.status === statusFilter);
    }, [ruleSets, statusFilter]);

    const filteredRules = useMemo(() => {
        if (!typeFilter) return rules;
        return rules.filter((r) => r.algorithm?.toUpperCase() === typeFilter);
    }, [rules, typeFilter]);

    const ruleSetColumns = useMemo(() => [
        { key: 'ruleName', label: 'Rule Set Name', render: (row) => (
            <span className="font-normal text-left text-sm text-[#8E77BB]">
                {row.ruleName}
            </span>
        ), },
        { key: 'domain', label: 'Domain', render: (row) => <DomainTag name={row.domain} /> },
        { key: 'type', label: 'Type', render: (row) => <TypeBadge type={row.type} /> },
        { key: 'rules', label: 'Rules', render: (row) => <span className="text-sm font-normal text-gray-600">{row.rules} Rules</span> },
        { key: 'autoMerge', label: 'Auto-Merge ≥', render: (row) => <span className="text-sm font-normal" style={{ color: '#098C60' }}>{row.autoMerge}%</span> },
        { key: 'review', label: 'Review ≥', render: (row) => <span className="text-sm font-normal" style={{ color: '#F95607' }}>{row.review}%</span> },
        { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
        {
            key: 'actions',
            label: 'Actions',
            sortable: false,
            render: (row) => (
                <RowActions
                    row={row}
                    onEdit={(r) => { setEditTarget(r); setEditOpen(true); }}
                    onRules={(r) => { setRulesDrawerTarget(r); setRulesDrawerOpen(true); }}
                />
            ),
        },
    ], []);

    return (
        <div className="p-4 m-4 bg-white min-h-screen">
            <Breadcrumb />

            {/* Page header */}
            <div className="flex items-start justify-between mb-4 mt-2">
                <div>
                    <h1 className="text-2xl font-bold text-[#282F49]">Match Configuration</h1>
                    <p className="text-sm text-[#818181] mt-0.5">Configure matching algorithms, rules, and thresholds</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={openOverallTest}
                        className="flex gap-2 items-center text-sm py-2 px-3 text-[#818181] border border-[#818181] rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
                    >
                        <img src={PlayArrowIcon} alt="Test" className="w-4 h-4" />
                        Test
                    </button>
                    <button
                        onClick={() => setCreateOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#8E77BB] text-white rounded-lg hover:bg-[#7a67a0] text-sm font-medium transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        Create Ruleset
                    </button>
                </div>
            </div>

            {/* Metric cards */}
            <div className="rounded-2xl p-4 mb-6" style={{ background: 'linear-gradient(270deg, #EFE7FF 17.24%, #8E77BB 93.06%, #2B125C 141.05%)' }}>
                <div className="grid grid-cols-3 gap-3">
                    {METRICS.map((m) => (
                        <div key={m.key} className="bg-white rounded-xl p-4 shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                                <div
                                    className="flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: m.bgColor }}
                                >
                                    <img src={m.icon} alt={m.title} className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-base font-semibold text-[#332849]">{m.title}</span>
                                    <span className="text-xs text-[#818181]">{m.desc}</span>
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-[#282F49]">
                                {isLoading
                                    ? <Skeleton className="h-7 w-16" />
                                    : `${metricCounts?.[m.key] ?? 0} Rules`}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tabs */}
            <div>
                <div className="flex items-end justify-between mb-3">
                    <div className="flex gap-6">
                        {[
                            { key: 'ruleset', label: 'Match Rule Set' },
                            { key: 'rules', label: 'Match Rules' },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={[
                                    'py-1.5 px-4 rounded-t-md text-base font-bold transition-colors',
                                    activeTab === tab.key
                                        ? 'text-[#8E77BB] border-b-[3px] border-[#8E77BB] bg-[#FAF8FF]'
                                        : 'text-gray-400 hover:text-gray-600',
                                ].join(' ')}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 mb-1">
                        {activeTab === 'ruleset' && (
                            <div className="relative">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="appearance-none text-sm pl-3 pr-8 py-1.5 border border-gray-200 rounded-lg text-gray-600 focus:outline-none focus:border-[#8E77BB] bg-white"
                                >
                                    <option>All</option>
                                    <option>Active</option>
                                    <option>Inactive</option>
                                    <option>Draft</option>
                                </select>
                                <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        )}

                        {activeTab === 'rules' && (
                            <>
                                <DomainDropdown
                                    domains={domains}
                                    selected={selectedDomain}
                                    onSelect={handleDomainSelect}
                                />
                                <div className="relative">
                                    <select
                                        value={typeFilter}
                                        onChange={(e) => setTypeFilter(e.target.value)}
                                        className="appearance-none text-sm pl-3 pr-8 py-[7px] border border-gray-200 rounded-lg text-gray-600 focus:outline-none focus:border-[#8E77BB] bg-white"
                                    >
                                        <option value="">All Types</option>
                                        <option value="EXACT">EXACT</option>
                                        <option value="JARO_WINKLER">JARO_WINKLER</option>
                                        <option value="LEVENSHTEIN">LEVENSHTEIN</option>
                                        <option value="DATE_MATCH">DATE_MATCH</option>
                                        <option value="EMAIL_MATCH">EMAIL_MATCH</option>
                                    </select>
                                    <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {activeTab === 'ruleset' && (
                    <DataTable
                        columns={ruleSetColumns}
                        data={filteredRuleSets}
                        isLoading={isLoading}
                        isError={isError}
                        refetch={fetchData}
                        title=""
                    />
                )}

                {activeTab === 'rules' && (
                    <MatchRulesTab
                        filteredRules={filteredRules}
                        isLoading={rulesLoading}
                        isError={rulesError}
                        onRefetch={() => fetchRules(selectedDomain?.domain_id)}
                        selectedDomain={selectedDomain}
                        onTestRule={openRuleTest}
                    />
                )}
            </div>

            {/* Modals */}
            <CreateRuleSetModal
                isOpen={createOpen}
                onClose={() => setCreateOpen(false)}
                onSuccess={fetchData}
            />
            <EditRuleSetModal
                isOpen={editOpen}
                onClose={() => { setEditOpen(false); setEditTarget(null); }}
                onSuccess={fetchData}
                rulesetData={editTarget}
            />
            <RuleSetRulesDrawer
                isOpen={rulesDrawerOpen}
                onClose={() => { setRulesDrawerOpen(false); setRulesDrawerTarget(null); }}
                ruleSet={rulesDrawerTarget}
                selectedDomain={selectedDomain}
            />
            <TestMatchConfigurationModal
                isOpen={testOpen}
                onClose={() => { setTestOpen(false); setTestRuleId(null); }}
                ruleId={testRuleId}
            />
        </div>
    );
};

export default MatchConfiguration;