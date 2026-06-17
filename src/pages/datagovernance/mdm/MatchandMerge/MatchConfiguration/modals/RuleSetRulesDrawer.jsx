import React, { useState, useMemo, useEffect } from 'react';
import { X, Plus, Search } from 'lucide-react';
import EditIcon from '../../../../../../assets/mdm/edit.svg';
import BlockIcon from '../../../../../../assets/mdm/block.svg';
import { AddRuleModal, EditRuleModal } from './Addeditrulemodal';
import ToggleStatusConfirmModal from './ToggleStatusConfirmModal.jsx';
import {useRuleSetRules, useToggleRuleStatus, useReorderMatchRules } from '../../../../../../hooks/mdm/matchMerge.jsx';

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
    useEffect(() => {
        setOrderedRules(rules);
    }, [rules]);

    const [searchTerm, setSearchTerm] = useState('');
    const [addOpen, setAddOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [toggleTarget, setToggleTarget] = useState(null);
    const [toggleModalOpen, setToggleModalOpen] = useState(false);
    const [orderedRules, setOrderedRules] = useState([]);
    const [draggedIndex, setDraggedIndex] = useState(null);

    const { isToggling, toggle } = useToggleRuleStatus(() => {
        fetchRules();
        setToggleModalOpen(false);
        setToggleTarget(null);
    });
    const { reorderRules } = useReorderMatchRules();

    const handleToggleConfirm = () => toggle(toggleTarget?.rule_id);
    const handleToggleCancel = () => { if (!isToggling) { setToggleModalOpen(false); setToggleTarget(null); } };

    const handleDragStart = (index) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();

        if (
            draggedIndex === null ||
            draggedIndex === index
        ) {
            return;
        }

        const updated = [...orderedRules];

        const draggedRule = updated[draggedIndex];

        updated.splice(draggedIndex, 1);

        updated.splice(index, 0, draggedRule);

        setOrderedRules(updated);
        setDraggedIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        reorderRules({
            rule_set_id: ruleSet.id,
            rule_ids: orderedRules.map((r) => r.rule_id),
        });
    };


    const filteredRules = useMemo(() => {
        if (!searchTerm.trim()) return orderedRules;

        return orderedRules.filter((row) =>
            Object.values(row).some((v) =>
                String(v)
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase())
            )
        );
    }, [orderedRules, searchTerm]);


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
            <div className="px-4 overflow-auto flex-1">
                <div className="border rounded-lg overflow-y-auto" style={{ maxHeight: "calc(100vh - 240px)" }}>
                    <table className="w-full bg-white" style={{ borderCollapse: "collapse", borderSpacing: 0 }}>
                    <thead>
                        <tr>
                            <th className="text-left satoshi-medium-3" style={{ background: "#F9F9F9", padding: "16px", fontSize: "16px", lineHeight: "22px", borderBottom: "1px solid #E5E5E5", width: "50px" }}></th>
                            <th className="text-left satoshi-medium-3" style={{ background: "#F9F9F9", padding: "16px", fontSize: "16px", lineHeight: "22px", borderBottom: "1px solid #E5E5E5", width: "60px" }}>Sno</th>
                            <th className="text-left satoshi-medium-3" style={{ background: "#F9F9F9", padding: "16px", fontSize: "16px", lineHeight: "22px", borderBottom: "1px solid #E5E5E5" }}>Rule Name</th>
                            <th className="text-left satoshi-medium-3" style={{ background: "#F9F9F9", padding: "16px", fontSize: "16px", lineHeight: "22px", borderBottom: "1px solid #E5E5E5" }}>Attribute</th>
                            <th className="text-left satoshi-medium-3" style={{ background: "#F9F9F9", padding: "16px", fontSize: "16px", lineHeight: "22px", borderBottom: "1px solid #E5E5E5" }}>Algorithm</th>
                            <th className="text-left satoshi-medium-3" style={{ background: "#F9F9F9", padding: "16px", fontSize: "16px", lineHeight: "22px", borderBottom: "1px solid #E5E5E5" }}>Weight</th>
                            <th className="text-left satoshi-medium-3" style={{ background: "#F9F9F9", padding: "16px", fontSize: "16px", lineHeight: "22px", borderBottom: "1px solid #E5E5E5" }}>Threshold</th>
                            <th className="text-left satoshi-medium-3" style={{ background: "#F9F9F9", padding: "16px", fontSize: "16px", lineHeight: "22px", borderBottom: "1px solid #E5E5E5" }}>Blocking</th>
                            <th className="text-left satoshi-medium-3" style={{ background: "#F9F9F9", padding: "16px", fontSize: "16px", lineHeight: "22px", borderBottom: "1px solid #E5E5E5" }}>Null Handling</th>
                            <th className="text-left satoshi-medium-3" style={{ background: "#F9F9F9", padding: "16px", fontSize: "16px", lineHeight: "22px", borderBottom: "1px solid #E5E5E5" }}>Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredRules.map((rule, index) => (
                        <tr
                            key={rule.rule_id}
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                            style={{ height: "52px" }}
                            className={`border-b cursor-move transition-colors align-middle ${
                                draggedIndex === index ? "bg-[#F3EFFF]" : "hover:bg-gray-50"
                            }`}
                        >
                            {/* Drag handle */}
                            <td style={{ padding: "11.50px 16px", fontSize: "14px", fontWeight: 400, lineHeight: "18.5px", color: "#818181" }}>
                                ⋮⋮
                            </td>

                            {/* Sno */}
                            <td style={{ padding: "11.50px 16px", fontSize: "14px", fontWeight: 400, lineHeight: "18.5px", color: "#23252D" }}>
                                {rule.sequence_order}
                            </td>

                            {/* Rule Name */}
                            <td style={{ padding: "11.50px 16px", fontSize: "14px", fontWeight: 400, lineHeight: "18.5px", color: "#23252D" }}>
                                {rule.rule_name}
                            </td>

                            {/* Attribute */}
                            <td style={{ padding: "11.50px 16px", fontSize: "14px", fontWeight: 400, lineHeight: "18.5px", color: "#23252D" }}>
                                {rule.target_attribute}
                            </td>

                            {/* Algorithm */}
                            <td style={{ padding: "11.50px 16px", fontSize: "14px", fontWeight: 400, lineHeight: "18.5px", color: "#23252D" }}>
                                <AlgoBadge algo={rule.algorithm} />
                            </td>

                            {/* Weight */}
                            <td style={{ padding: "11.50px 16px", fontSize: "14px", fontWeight: 400, lineHeight: "18.5px", color: "#23252D" }}>
                                {rule.weight}%
                            </td>

                            {/* Threshold */}
                            <td style={{ padding: "11.50px 16px", fontSize: "14px", fontWeight: 400, lineHeight: "18.5px", color: "#23252D" }}>
                                {rule.threshold}%
                            </td>

                            {/* Blocking */}
                            <td style={{ padding: "11.50px 16px", fontSize: "14px", fontWeight: 400, lineHeight: "18.5px", color: "#23252D" }}>
                                {rule.blocking}
                            </td>

                            {/* Null Handling */}
                            <td style={{ padding: "11.50px 16px", fontSize: "14px", fontWeight: 400, lineHeight: "18.5px", color: "#23252D" }}>
                                {rule.null_handling}
                            </td>

                            {/* Actions */}
                            <td style={{ padding: "11.50px 16px", fontSize: "14px", fontWeight: 400, lineHeight: "18.5px", color: "#23252D" }}>
                                <RowActions
                                    row={rule}
                                    onEdit={(r) => { setEditTarget(r); setEditOpen(true); }}
                                    onToggle={(r) => { setToggleTarget(r); setToggleModalOpen(true); }}
                                />
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>
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
                ruleName={toggleTarget?.rule_name}
                currentStatus={toggleTarget?.status}
                onConfirm={handleToggleConfirm}
                onCancel={handleToggleCancel}
                isLoading={isToggling}
            />
        </>
    );
};

export default RuleSetRulesDrawer;