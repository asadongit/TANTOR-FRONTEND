import React, { useState, useCallback } from 'react';
import { X, Plus, MoreVertical } from 'lucide-react';
import DataTable from '../../../../../components/DataTable.jsx';
import AddRuleModal from './modals/AddRuleModal.jsx';
import EditRuleModal from './modals/EditRuleModal.jsx';
import EditIcon from '../../../../../assets/mdm/edit.svg';
import DeleteIcon from '../../../../../assets/mdm/delete.svg';
import { useDomainRules } from '../../../../../hooks/mdm/domainManagement.jsx';

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

const StatusBadge = ({ status }) => (
    <span
        className={`${
            status ? 'text-[#069B68] bg-[#2AC79240]' : 'text-[#EF4D5F] bg-[#F276A74D]'
        } px-2 py-1 rounded-md text-xs font-normal`}
    >
        {status ? 'Active' : 'Inactive'}
    </span>
);

/* ─────────────────────────────────────────────
   Row Actions
───────────────────────────────────────────── */
const RowActions = ({ row, onEdit, onDelete }) => {
    const [open, setOpen] = useState(false);
    const [pos, setPos]   = useState({ top: 0, left: 0 });

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
                        className="fixed inset-0 z-[1002]"
                        onClick={() => setOpen(false)}
                    />
                    <div
                        className="fixed z-[1003] bg-white rounded-2xl shadow-[0px_10px_30px_rgba(0,0,0,0.15)] p-2 min-w-[160px] flex flex-col gap-1"
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
                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] border-none cursor-pointer bg-white w-full"
                        >
                            <img src={DeleteIcon} alt="Delete" className="w-4 h-4" />
                            <span className="text-[#E05252] text-sm font-medium">Delete</span>
                        </button>
                    </div>
                </>
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

    const handleEdit   = useCallback((row) => setEditRuleData(row), []);
    const handleDelete = useCallback((row) => {
        // TODO: wire delete API
        console.log('Delete rule:', row);
    }, []);

    if (!isOpen) return null;

    const columns = [
        {
            key: 'rule_name',
            label: 'Rule Name',
            render: (row) => (
                <span className="text-[#8E77BB] text-sm font-normal">{row.rule_name}</span>
            ),
        },
        { key: 'attribute_name', label: 'Domain' },
        {
            key: 'validation_type',
            label: 'Data Type',
            render: (row) => <RuleTypeBadge type={row.validation_type} />,
        },
        { key: 'expression', label: 'Expression', wrap: true },
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
                <div className="flex items-center justify-between px-6 py-3.5 shrink-0">
                    <span className="text-sm font-medium text-[#332849]">Job Information</span>
                    <button
                        onClick={() => setAddRuleOpen(true)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#8E77BB] hover:bg-[#7a67a0] text-white border-none rounded-lg text-sm font-medium cursor-pointer transition-colors"
                    >
                        <Plus size={15} />
                        Add Rule
                    </button>
                </div>

                {/* Table */}
                <div className="flex-1 min-h-0 px-6 pb-6">
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
        </>
    );
};

export default DomainRulesModal;