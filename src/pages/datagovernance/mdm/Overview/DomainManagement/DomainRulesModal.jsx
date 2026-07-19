import React, { useState, useCallback } from 'react';
import { X, Plus, MoreVertical } from 'lucide-react';
import DataTable from '../../../../../components/DataTable.jsx';
import AddRuleModal from './modals/AddRuleModal.jsx';
import EditRuleModal from './modals/EditRuleModal.jsx';
import EditIcon from '../../../../../assets/mdm/edit.svg';
import DeleteIcon from '../../../../../assets/mdm/delete.svg';
import { useDomainRules, useDeleteRule } from '../../../../../hooks/mdm/domainManagement.jsx';
import DeleteConfirmModal from '../../components/DeleteConfirmModal.jsx';
import { createPortal } from 'react-dom';

/* ─────────────────────────────────────────────
   Badges
───────────────────────────────────────────── */
const RuleTypeBadge = ({ type }) => (
    <span className="bg-[#D9D9D980] text-[#818181] px-2 py-1.5 rounded text-xs font-normal whitespace-nowrap leading-none">
        {type}
    </span>
);

const SeverityBadge = ({ severity }) => {
    const styles = {
        ERROR:   'text-[#EF4D5F] bg-[#FEE7EA]',
        WARNING: 'text-[#E08E40] bg-[#FEF3E2]',
        INFO:    'text-[#0891B2] bg-[#ECFEFF]',
    };
    return (
        <span className={`${styles[severity] ?? 'text-[#6B7280] bg-[#F3F4F6]'} px-2 py-0.5 rounded-md text-xs font-medium`}>
            {severity}
        </span>
    );
};

const SupportPartialBadge = ({ value }) => (
    <span className={`${value ? 'text-[#069B68] bg-[#DCFCE7]' : 'text-[#EF4D5F] bg-[#FEE7EA]'} px-2 py-0.5 rounded-md text-xs font-medium`}>
        {value ? 'Yes' : 'No'}
    </span>
);

const StatusBadge = ({ status }) => (
    <span
        className={`${
            status ? 'text-[#069B68] bg-[#2AC79240]' : 'text-[#EF4D5F] bg-[#F276A74D]'
        } px-2 py-1 rounded-md text-xs font-normal`}
    >
        {status ? 'Active' : 'Inactive'}
    </span>
);

const RowActions = ({ row, onEdit, onDelete }) => {
    const [open, setOpen] = useState(false);
    const [pos, setPos]   = useState({ top: 0, left: 0 });

    const handleOpen = (e) => {
        e.stopPropagation();
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        setPos({ top: rect.bottom + 4, left: rect.right - 160 });
        setOpen((p) => !p);
    };

    return (
        <div className="relative inline-block">
            <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={handleOpen}
                className="bg-transparent border-none cursor-pointer p-1 rounded-full flex items-center"
            >
                <MoreVertical size={18} className="text-[#818181]" />
            </button>

            {open && createPortal(
                <>
                    <div
                        className="fixed inset-0 z-[9998]"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={() => setOpen(false)}
                    />
                    <div
                        className="fixed z-[9999] bg-white rounded-2xl shadow-[0px_10px_30px_rgba(0,0,0,0.15)] p-2 min-w-[160px] flex flex-col gap-1"
                        style={{ top: pos.top, left: pos.left }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
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
                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] border-none cursor-pointer bg-white w-full"
                        >
                            <img src={DeleteIcon} alt="Delete" className="w-4 h-4" />
                            <span className="text-[#E05252] text-sm font-medium">Delete</span>
                        </button>
                    </div>
                </>,
                document.body
            )}
        </div>
    );
};

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
const DomainRulesModal = ({ isOpen, onClose, domainId, domainName }) => {
    const [addRuleOpen, setAddRuleOpen] = useState(false);
    const [editRuleData, setEditRuleData] = useState(null);

    const { rules, isLoading, fetchRules } = useDomainRules(domainId, isOpen);
    const { isDeleting, deleteRule } = useDeleteRule(fetchRules);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const handleEdit   = useCallback((row) => setEditRuleData(row), []);
    const handleDelete = useCallback((row) => setDeleteTarget(row), []);

    const confirmDelete = useCallback(async () => {
        const result = await deleteRule(deleteTarget.rule_id);
        if (result.ok) setDeleteTarget(null);
    }, [deleteTarget, deleteRule]);

    const [hoveredAttribute, setHoveredAttribute] = useState(null);

    const columns = [
        {
            key: 'rule_name',
            label: 'Rule Name',
            render: (row) => (
                <span className="text-[#8E77BB] text-sm font-normal">{row.rule_name}</span>
            ),
        },
        {
            key: 'attributes',
            label: 'Attribute',
            render: (row) => {
                const names = row.attributes?.map(a => a.attribute_name) || [];
                return (
                    <span title={names.join(', ')}>
                        {names.join(', ') || '-'}
                    </span>
                );
            },
        },
        {
            key: 'validation_type',
            label: 'Validation Type',
            render: (row) => <RuleTypeBadge type={row.validation_type} />,
        },
        { key: 'expression', label: 'Expression', wrap: true },
        {
            key: 'support_partial',
            label: 'Supports Partial',
            render: (row) => <SupportPartialBadge value={row.support_partial} />,
        },
        {
            key: 'severity',
            label: 'Severity',
            render: (row) => <SeverityBadge severity={row.severity} />,
        },
        {
            label: 'Actions',
            sortable: false,
            maxWidth: '70px',
            render: (row) => (
                <RowActions row={row} onEdit={handleEdit} onDelete={handleDelete} />
            ),
        },
    ];
    if (!isOpen) return null;

    return (
        <>
            <div
                className="fixed inset-0 bg-black/40 z-[1000]"
                onClick={onClose}
            />

            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1001] w-[944px] max-w-[95vw] max-h-[90vh] bg-white rounded-2xl border border-[#CCCCCC] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#EEEEEE] shrink-0">
                    <span className="text-base font-medium text-[#332849]">
                        Validation Rules —{' '}
                        <span className="text-[#8E77BB]">{domainName}</span>
                    </span>
                    <button
                        onClick={onClose}
                        className="bg-transparent border-none cursor-pointer p-1 rounded-md"
                    >
                        <X size={20} className="text-[#818181]" />
                    </button>
                </div>

                {/* Sub-header */}
                <div className="flex items-center justify-between px-6 py-2 shrink-0">
                    <span className="text-lg font-medium text-[#332849] font-[Satoshi,sans-serif]">Job Information</span>
                    <button
                        onClick={() => setAddRuleOpen(true)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#8E77BB] hover:bg-[#7a67a0] text-white border-none rounded-lg text-sm font-medium cursor-pointer transition-colors"
                    >
                        <Plus size={15} />
                        Add Rule
                    </button>
                </div>

                {/* Table */}
                <div className="flex-1 min-h-0 px-6 pb-6 -mt-2">
                    <DataTable
                        columns={columns}
                        data={rules}
                        isLoading={isLoading}
                        isError={false}
                        refetch={fetchRules}
                        title=""
                    />
                </div>
            </div>

            <AddRuleModal
                isOpen={addRuleOpen}
                onClose={() => setAddRuleOpen(false)}
                domainId={domainId}
                onComplete={() => { setAddRuleOpen(false); fetchRules(); }}
            />
            <EditRuleModal
                isOpen={!!editRuleData}
                onClose={() => setEditRuleData(null)}
                domainId={domainId}
                ruleData={editRuleData}
                onComplete={() => { setEditRuleData(null); fetchRules(); }}
            />

            <DeleteConfirmModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
                isDeleting={isDeleting}
                title="Delete Rule"
                message={`Are you sure you want to delete "${deleteTarget?.rule_name}"? This action cannot be undone.`}
            />
        </>
    );
};

export default DomainRulesModal;