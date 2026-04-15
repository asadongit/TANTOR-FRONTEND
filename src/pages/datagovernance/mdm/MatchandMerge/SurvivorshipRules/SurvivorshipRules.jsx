import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Search, Plus, X, MoreVertical } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Breadcrumb from '../../../../../components/Breadcrumb.jsx';
import ArrowDownIcon from '../../../../../assets/mdm/keyboard_arrow_down.svg';
import DataTable from '../../../../../components/DataTable.jsx';

import SourcePriorityIcon from '../../../../../assets/mdm/list_alt_check.svg';
import MostRecentIcon from '../../../../../assets/mdm/history_2.svg';
import TrustedSourceIcon from '../../../../../assets/mdm/folder_special.svg';
import MostCompleteIcon from '../../../../../assets/mdm/flag_check.svg';
import LongestValueIcon from '../../../../../assets/mdm/two_pager_store.svg';
import MostFrequentIcon from '../../../../../assets/mdm/acute.svg';
import EditIcon from '../../../../../assets/mdm/edit.svg';
import DeleteIcon from '../../../../../assets/mdm/delete.svg';

import CreateSurvivorshipRuleModal from './modals/CreateSurvivorshipRuleModal.jsx';
import EditSurvivorshipRuleModal from './modals/EditSurvivorshipRuleModal.jsx';
import {
    useDomains,
    useSurvivorshipRules,
    useSurvivorshipStrategyCounts,
    useDeleteSurvivorshipRule,
} from '../../../../../hooks/mdm/survivorshipRules.jsx';

const STRATEGY_STYLES = {
    LONGEST_VALUE: { label: 'Longest Value', color: '#E08E40', bg: '#FFF1CF' },
    MOST_RECENT: { label: 'Most Recent', color: '#16ABC2', bg: '#C5EAF0' },
    MOST_TRUSTED: { label: 'Most Trusted', color: '#8491F7', bg: '#DBE0FC' },
    MOST_COMPLETE: { label: 'Most Complete', color: '#D989DC', bg: '#FEE3FF' },
    SOURCE_PRIORITY: { label: 'Source Priority', color: '#96CF7B', bg: '#DEF0D6' },
    MAX_VALUE: { label: 'Max Value', color: '#96CF7B', bg: '#DEF0D6' },
};

const STRATEGY_CARD_CONFIG = {
    SOURCE_PRIORITY: { title: 'Source Priority', icon: SourcePriorityIcon, bgcolor: '#DEF0D6', iconColor: '#96CF7B' },
    MOST_RECENT: { title: 'Most Recent', icon: MostRecentIcon, bgcolor: '#C5EAF0', iconColor: '#16ABC2' },
    MOST_TRUSTED: { title: 'Most Trusted', icon: TrustedSourceIcon, bgcolor: '#DBE0FC', iconColor: '#8491F7' },
    MOST_COMPLETE: { title: 'Most Complete', icon: MostCompleteIcon, bgcolor: '#FEE3FF', iconColor: '#D989DC' },
    LONGEST_VALUE: { title: 'Longest Value', icon: LongestValueIcon, bgcolor: '#FFF1CF', iconColor: '#E08E40' },
    MAX_VALUE: { title: 'Max Value', icon: MostFrequentIcon, bgcolor: '#FDDCE3', iconColor: '#EF4D5F' },
};

const getStrategyStyle = (strategy) =>
    STRATEGY_STYLES[strategy] || { label: strategy, color: '#6B7280', bg: '#F3F4F6' };

const DomainDropdown = ({ value, options, onChange, isLoading }) => (
    <div className="relative">
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={isLoading}
            className="appearance-none pl-3 pr-8 py-1.5 text-sm text-[#332849] rounded-lg cursor-pointer bg-[#FAFAFA] border border-[#CCCCCC] focus:outline-none focus:ring-2 focus:ring-purple-300 disabled:opacity-50"
            style={{ minWidth: 160 }}
        >
            {isLoading && <option value="">Loading...</option>}
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
        <img
            src={ArrowDownIcon}
            alt=""
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4"
        />
    </div>
);

const StrategyBadge = ({ strategy }) => {
    const { label, color, bg } = getStrategyStyle(strategy);
    return (
        <span
            className="inline-block whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-normal"
            style={{ color, backgroundColor: bg }}
        >
            {label}
        </span>
    );
};

const StatusBadge = ({ isActive }) => (
    <span
        className="inline-block rounded-md px-2 py-1.5 text-xs font-normal"
        style={{
            color: isActive ? '#069B68' : '#EF4D5F',
            backgroundColor: isActive ? '#2AC79240' : '#F276A74D',
        }}
    >
        {isActive ? 'Active' : 'Inactive'}
    </span>
);

const RowActions = ({ row, onEdit, onDelete, isDeleting }) => {
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
            <button
                onClick={handleOpen}
                className="bg-transparent border-none cursor-pointer p-1 rounded-full flex items-center"
            >
                <MoreVertical size={18} className="text-[#818181]" />
            </button>

            {open && (
                <>
                    <div
                        className="fixed inset-0 z-[1000]"
                        onClick={() => setOpen(false)}
                    />
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
                            onClick={() => { onDelete?.(row); setOpen(false); }}
                            disabled={isDeleting}
                            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] border-none w-full bg-white ${isDeleting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                                }`}
                        >
                            <img src={DeleteIcon} alt="Delete" className="w-4 h-4" />
                            <span className="text-[#E05252] text-sm font-medium">
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </span>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

const DeleteConfirmModal = ({ isOpen, attributeName, onConfirm, onCancel, isDeleting }) => {
    if (!isOpen) return null;

    return (
        <>
            <div
                className="fixed inset-0 bg-black/30 z-[10000]"
                onClick={onCancel}
            />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10001] bg-white rounded-2xl p-7 w-[360px] shadow-[0px_20px_50px_rgba(0,0,0,0.15)]">
                <h3 className="text-base font-semibold text-[#282F49] mb-1.5">Delete Rule</h3>
                <p className="text-[13px] text-[#818181] mb-6 leading-relaxed">
                    Are you sure you want to delete the rule for{' '}
                    <span className="text-[#332849] font-medium">"{attributeName}"</span>?
                    This action cannot be undone.
                </p>

                <div className="flex gap-2.5">
                    <button
                        onClick={onCancel}
                        disabled={isDeleting}
                        className="flex-1 py-2.5 rounded-[10px] border border-[#E5E7EB] bg-white text-[#332849] text-[13px] font-medium cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className={`flex-1 py-2.5 rounded-[10px] border-none bg-[#EF4D5F] text-white text-[13px] font-medium transition-colors ${isDeleting ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:bg-[#d94455]'
                            }`}
                    >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </>
    );
};

const SurvivorshipRules = () => {
    const [selectedDomainId, setSelectedDomainId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const { domains, loading: domainsLoading } = useDomains();

    const { rules: tableData, isLoading: tableLoading, isError: tableError, fetchRules } =
        useSurvivorshipRules(selectedDomainId);

    const { strategyCounts, fetchStrategyCounts } = useSurvivorshipStrategyCounts();

    const { isDeleting, deleteRule } = useDeleteSurvivorshipRule(async () => {
        await fetchRules();
        await fetchStrategyCounts();
        setDeleteTarget(null);
    });

    useEffect(() => {
        if (domains.length > 0 && !selectedDomainId) {
            setSelectedDomainId(domains[0].domain_id);
        }
    }, [domains, selectedDomainId]);

    const domainOptions = useMemo(
        () => domains.map((d) => ({ value: d.domain_id, label: d.domain_name })),
        [domains]
    );

    const ruleMetrics = useMemo(
        () =>
            strategyCounts
                .filter(({ strategy }) => STRATEGY_CARD_CONFIG[strategy])
                .map(({ strategy, count }) => ({ ...STRATEGY_CARD_CONFIG[strategy], count })),
        [strategyCounts]
    );

    const filteredData = useMemo(
        () =>
            tableData.filter((item) =>
                Object.values(item).some((v) =>
                    String(v ?? '').toLowerCase().includes(searchTerm.toLowerCase())
                )
            ),
        [tableData, searchTerm]
    );

    const selectedDomainLabel = useMemo(
        () => domainOptions.find((d) => d.value === selectedDomainId)?.label ?? '',
        [domainOptions, selectedDomainId]
    );

    const handleEdit = useCallback((row) => {
        setEditingRule(row);
        setIsEditModalOpen(true);
    }, []);

    const handleDelete = useCallback((row) => {
        setDeleteTarget(row);
    }, []);

    const confirmDelete = useCallback(async () => {
        if (!deleteTarget) return;
        const result = await deleteRule(deleteTarget.surv_rule_id);
        if (!result.ok) toast.error(result.message);
        else toast.success('Survivorship rule deleted successfully');
    }, [deleteTarget, deleteRule]);

    const handleRuleSuccess = useCallback(async () => {
        await fetchRules();
        await fetchStrategyCounts();
    }, [fetchRules, fetchStrategyCounts]);

    const columns = useMemo(
        () => [
            {
                key: 'attribute_name',
                label: 'Attribute',
                render: (row) => (
                    <span className="text-[#8E77BB] font-medium">{row.attribute_name}</span>
                ),
            },
            {
                key: 'data_type',
                label: 'Data Type',
                render: (row) =>
                    row.data_type ? (
                        <span className="bg-[#D9D9D980] text-[#818181] px-2 py-0.5 rounded text-xs font-normal tracking-wide">
                            {row.data_type}
                        </span>
                    ) : (
                        <span className="text-[#ccc]">—</span>
                    ),
            },
            {
                key: 'primary_rule',
                label: 'Primary Strategy',
                render: (row) =>
                    row.primary_strategy ? (
                        <StrategyBadge strategy={row.primary_strategy} />
                    ) : (
                        <span className="text-[#ccc]">—</span>
                    ),
            },
            {
                key: 'fallback_rule',
                label: 'Fallback Strategy',
                render: (row) =>
                    row.fallback_strategy ? (
                        <StrategyBadge strategy={row.fallback_strategy} />
                    ) : (
                        <span className="text-[#ccc]">—</span>
                    ),
            },
            {
                key: 'source_priority_order',
                label: 'Source Priority',
                render: (row) =>
                    row.source_priority_order ? (
                        <span className="text-[#332849] text-sm font-normal">
                            {row.source_priority_order
                                .split(',')
                                .map((s) => s.trim())
                                .join(' → ')}
                        </span>
                    ) : (
                        <span className="text-[#ccc]">—</span>
                    ),
            },
            {
                key: 'is_active',
                label: 'Status',
                render: (row) => <StatusBadge isActive={row.is_active} />,
            },
            {
                label: 'Actions',
                key: 'actions',
                sortable: false,
                render: (row) => (
                    <RowActions
                        row={row}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        isDeleting={isDeleting && deleteTarget?.surv_rule_id === row.surv_rule_id}
                    />
                ),
            },
        ],
        [handleEdit, handleDelete, isDeleting, deleteTarget]
    );

    return (
        <div className="p-4 m-4 bg-white min-h-screen">
            <Breadcrumb />

            {/* Header */}
            <div className="flex items-start justify-between mb-4 mt-2">
                <div>
                    <h1 className="text-2xl font-bold text-[#282F49]">Survivorship Rules</h1>
                    <p className="text-sm text-[#818181] mt-0.5">
                        Configure how golden record values are selected from sources
                    </p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#8E77BB] text-white rounded-lg hover:bg-[#7a67a0] transition-colors text-sm font-medium"
                >
                    <Plus className="h-4 w-4" />
                    New rule
                </button>
            </div>

            {/* Metric Cards */}
            <div
                className="rounded-2xl p-4 mb-6"
                style={{
                    background:
                        'linear-gradient(270deg, #EFE7FF 17.24%, #8E77BB 93.06%, #2B125C 141.05%)',
                }}
            >
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {ruleMetrics.map((metric, i) => (
                        <div
                            key={i}
                            className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="flex items-center justify-center w-9 h-9 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: metric.bgcolor }}
                                >
                                    <img src={metric.icon} alt={metric.title} className="w-4 h-4" />
                                </div>
                                <span className="text-base font-medium text-[#332849]">{metric.title}</span>
                            </div>
                            <span className="text-lg font-bold text-[#282F49]">
                                {String(metric.count).padStart(2, '0')}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Table section */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-medium text-[#332849]">
                        {selectedDomainLabel
                            ? `${selectedDomainLabel} - Attribute Rules`
                            : 'Attribute Rules'}
                    </h2>

                    <div className="flex items-center gap-2">
                        <DomainDropdown
                            value={selectedDomainId}
                            options={domainOptions}
                            onChange={setSelectedDomainId}
                            isLoading={domainsLoading}
                        />

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-[220px] rounded-lg border border-gray-200 py-1.5 pl-9 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
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
                    isLoading={tableLoading}
                    isError={tableError}
                    refetch={fetchRules}
                    title=""
                />
            </div>

            <CreateSurvivorshipRuleModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={handleRuleSuccess}
            />
            <EditSurvivorshipRuleModal
                isOpen={isEditModalOpen}
                onClose={() => { setIsEditModalOpen(false); setEditingRule(null); }}
                onSuccess={handleRuleSuccess}
                rule={editingRule}
            />
            <DeleteConfirmModal
                isOpen={!!deleteTarget}
                attributeName={deleteTarget?.attribute_name ?? ''}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
                isDeleting={isDeleting}
            />
        </div>
    );
};

export default SurvivorshipRules;