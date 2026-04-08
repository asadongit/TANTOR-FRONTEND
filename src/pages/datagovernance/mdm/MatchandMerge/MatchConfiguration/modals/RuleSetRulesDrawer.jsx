import React, { useState, useMemo } from 'react';
import { X, Plus, Search } from 'lucide-react';
import DataTable from '../../../../../../components/DataTable';
import EditIcon from '../../../../../../assets/mdm/edit.svg';
import BlockIcon from '../../../../../../assets/mdm/block.svg';
import { AddRuleModal, EditRuleModal } from './Addeditrulemodal';
import ToggleStatusConfirmModal from './ToggleStatusConfirmModal.jsx';
import { useRuleSetRules, useToggleRuleStatus } from '../../../../../../hooks/mdm/matchMerge.jsx';

// ─── Local display components ─────────────────────────────────────────────────

const AlgoBadge = ({ algo }) => (
    <span className="text-[#818181] bg-[#D9D9D980] px-2 py-1.5 text-xs font-normal rounded whitespace-nowrap">
        {algo}
    </span>
);

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

const RowActions = ({ row, onEdit, onToggle }) => {
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
            <button
                onClick={handleOpen}
                className="bg-none border-none cursor-pointer p-1 rounded-full flex items-center"
            >
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
                        {/* Edit */}
                        <button
                            onClick={() => { onEdit?.(row); setOpen(false); }}
                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] border-none cursor-pointer bg-[#F3EFFF] w-full"
                        >
                            <img src={EditIcon} alt="Edit" className="w-4 h-4" />
                            <span className="text-[#8e78b7] text-sm font-medium">Edit</span>
                        </button>

                        {/* Disable / Enable */}
                        <button
                            onClick={() => { onToggle?.(row); setOpen(false); }}
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
                            <span
                                className="text-sm font-medium"
                                style={{ color: isActive ? '#EF4D5F' : '#069B68' }}
                            >
                                {isActive ? 'Disable' : 'Enable'}
                            </span>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

// ─── RuleSetRulesDrawer ───────────────────────────────────────────────────────

const RuleSetRulesDrawer = ({ isOpen, onClose, ruleSet, selectedDomain }) => {
    const { rules, total, isLoading, isError, fetchRules } = useRuleSetRules(ruleSet?.id, isOpen);

    const [searchTerm, setSearchTerm] = useState('');
    const [addOpen, setAddOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [toggleTarget, setToggleTarget] = useState(null);
    const [toggleModalOpen, setToggleModalOpen] = useState(false);

    const { isToggling, toggle } = useToggleRuleStatus(() => {
        fetchRules();
        setToggleModalOpen(false);
        setToggleTarget(null);
    });

    const handleToggleConfirm = () => toggle(toggleTarget?.rule_id);
    const handleToggleCancel = () => { if (!isToggling) { setToggleModalOpen(false); setToggleTarget(null); } };

    const filteredRules = useMemo(() => {
        if (!searchTerm.trim()) return rules;
        return rules.filter((row) =>
            Object.values(row).some((v) =>
                String(v).toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
    }, [rules, searchTerm]);

    const columns = useMemo(() => [
        {
            key: 'attribute',
            label: 'Attribute',
            render: (row) => <span className="text-sm font-normal text-[#23252D]">{row.attribute}</span>,
        },
        { key: 'algorithm', label: 'Algorithm', render: (row) => <AlgoBadge algo={row.algorithm} /> },
        { key: 'weight', label: 'Weight', render: (row) => <span className="text-sm font-normal text-gray-600">{row.weight}</span> },
        { key: 'threshold', label: 'Threshold', render: (row) => <span className="text-sm font-normal text-gray-600">{row.threshold}</span> },
        { key: 'blocking', label: 'Blocking', render: (row) => <span className="text-sm font-normal text-gray-600">{row.blocking}</span> },
        { key: 'null_handling', label: 'Null Handling', render: (row) => <span className="text-sm font-normal text-gray-500">{row.null_handling}</span> },
        { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
        {
            key: 'actions',
            label: 'Actions',
            sortable: false,
            render: (row) => (
                <RowActions
                    row={row}
                    onEdit={(r) => { setEditTarget(r); setEditOpen(true); }}
                    onToggle={(r) => { setToggleTarget(r); setToggleModalOpen(true); }}
                />
            ),
        },
    ], []);

    if (!isOpen) return null;

    const domainId = selectedDomain?.domain_id ?? ruleSet?.domain_id;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-30" onClick={onClose} />

            {/* Drawer */}
            <div
                className="fixed top-16 bottom-0 right-0 z-40 bg-white flex flex-col overflow-hidden"
                style={{ width: 745, boxShadow: '-8px 0px 10px 0px #0000001A' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-[18px] bg-white border-b border-[#CCCCCC] shrink-0">
                    <span className="text-lg font-medium text-[#282F49] leading-none">
                        {ruleSet?.ruleName ?? 'Rule Set Rules'}
                    </span>
                    <button
                        onClick={onClose}
                        className="p-1 rounded hover:bg-gray-100 transition-colors"
                    >
                        <X size={20} className="text-[#818181]" />
                    </button>
                </div>

                {/* Sub-header */}
                <div className="flex items-center justify-between px-6 py-4 shrink-0">
                    <span className="text-lg font-medium text-[#332849] leading-none">
                        {isLoading ? '…' : `${total} Rules Configured`}
                    </span>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-[200px] rounded-lg border border-gray-200 py-1.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                            />
                        </div>
                        <button
                            onClick={() => setAddOpen(true)}
                            className="flex items-center gap-1.5 px-4 py-2 text-white text-sm font-medium rounded-lg bg-[#8E77BB] hover:bg-[#7a67a0] transition-colors"
                        >
                            <Plus size={15} />
                            Add rule
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="px-4 overflow-auto flex-1">
                    <DataTable
                        columns={columns}
                        data={filteredRules}
                        isLoading={isLoading}
                        isError={isError}
                        refetch={fetchRules}
                        title=""
                    />
                </div>
            </div>

            <AddRuleModal
                isOpen={addOpen}
                onClose={() => setAddOpen(false)}
                onSuccess={fetchRules}
                ruleSet={ruleSet}
                domainId={ruleSet?.domain_id}
            />

            <EditRuleModal
                isOpen={editOpen}
                onClose={() => { setEditOpen(false); setEditTarget(null); }}
                onSuccess={fetchRules}
                ruleData={editTarget}
                domainId={ruleSet?.domain_id}
            />

            <ToggleStatusConfirmModal
                isOpen={toggleModalOpen}
                ruleName={toggleTarget?.attribute}
                currentStatus={toggleTarget?.status}
                onConfirm={handleToggleConfirm}
                onCancel={handleToggleCancel}
                isLoading={isToggling}
            />
        </>
    );
};

export default RuleSetRulesDrawer;