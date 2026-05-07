import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useParentNodes, useMoveNode } from "../../../../../../hooks/mdm/nodeManagement";

const inputBase =
    'w-full border border-[#CCCCCC] rounded-lg px-3.5 py-2.5 text-sm font-normal text-[#282F49] outline-none bg-white leading-none box-border focus:border-[#8e78b7] font-[Satoshi,sans-serif]';

const labelBase =
    'text-sm font-medium text-[#332849] font-[Satoshi,sans-serif] leading-none mb-1.5 block';

const ChevronIcon = () => (
    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#818181]">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
    </div>
);

const CalendarIcon = () => (
    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#818181]">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    </div>
);

const MoveNodeModal = ({ isOpen, onClose, onSuccess, node }) => {
    const [newParentId, setNewParentId]     = useState('');
    const [effectiveFrom, setEffectiveFrom] = useState('');
    const [prefilled, setPrefilled]         = useState(false);

    const { parentNodes, loading: parentNodesLoading } = useParentNodes(
        node?.hierarchy_type_id,
        isOpen
    );

    const { isSubmitting, move } = useMoveNode(async () => {
        onSuccess?.();
        handleClose();
    });

    // Reset when modal opens/closes
    useEffect(() => {
        if (isOpen && node) {
            setEffectiveFrom('');
            setPrefilled(false);
        }
        if (!isOpen) {
            setNewParentId('');
            setEffectiveFrom('');
            setPrefilled(false);
        }
    }, [isOpen, node]);

    // Prefill newParentId once parentNodes has loaded
    useEffect(() => {
        if (prefilled || parentNodesLoading) return;

        if (parentNodes.length > 0) {
            // node.parent_node_id is "HN-REGION-JZ" — match against n.node_id
            const match = parentNodes.find((n) => n.node_id === node?.parent_node_id);
            setNewParentId(match ? match.node_id : '');
            setPrefilled(true);
        } else if (!parentNodesLoading) {
            // hierarchy loaded but empty — no parent possible
            setNewParentId('');
            setPrefilled(true);
        }
    }, [parentNodes, parentNodesLoading, node, prefilled]);

    const handleClose = () => {
        setNewParentId('');
        setEffectiveFrom('');
        setPrefilled(false);
        onClose();
    };

    const handleSubmit = async () => {
        const result = await move({
            node_id:            node.internal_node_id,  // "HN-BRANCH-JAM001"
            new_parent_node_id: newParentId || null,
            effective_from:     effectiveFrom || null,
        });
        if (!result.ok) toast.error(result.message);
        else toast.success(result.data?.message || 'Node moved successfully');
    };

    // Current parent label
    const currentParentLabel = (() => {
        if (!node?.parent_node_id || node.parent_node_id === '-') return 'None (Root)';
        const found = parentNodes.find((n) => n.node_id === node.parent_node_id);
        return found
            ? `${found.node_id} - ${found.node_name}`
            : node.parent && node.parent !== '-'
                ? node.parent
                : node.parent_node_id;
    })();

    if (!isOpen || !node) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={handleClose}
        >
            <div
                className="w-[560px] bg-white rounded-2xl border border-[#CCCCCC] mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 rounded-t-2xl bg-white shadow-[0px_4px_9px_0px_rgba(0,0,0,0.10)]">
                    <span className="text-lg font-medium text-[#282F49] font-[Satoshi,sans-serif]">
                        Move Hierarchy Node
                    </span>
                    <button
                        onClick={handleClose}
                        className="bg-transparent border-none cursor-pointer p-1 text-[#818181] hover:text-[#282F49] transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <div className="px-6 py-5 grid grid-cols-2 gap-5 bg-white">

                    {/* Node to Move — read-only */}
                    <div className="flex flex-col gap-1.5">
                        <label className={labelBase}>Node to Move</label>
                        <input
                            type="text"
                            readOnly
                            value={`${node.node_id} - ${node.name}`}
                            className={`${inputBase} bg-[#F9F9F9] cursor-not-allowed text-[#818181]`}
                        />
                    </div>

                    {/* Current Parent — read-only */}
                    <div className="flex flex-col gap-1.5">
                        <label className={labelBase}>Current Parent</label>
                        <input
                            type="text"
                            readOnly
                            value={currentParentLabel}
                            className={`${inputBase} bg-[#F9F9F9] cursor-not-allowed text-[#818181]`}
                        />
                    </div>

                    {/* New Parent — dropdown */}
                    <div className="flex flex-col gap-1.5">
                        <label className={labelBase}>New Parent</label>
                        <div className="relative">
                            <select
                                value={newParentId}
                                onChange={(e) => setNewParentId(e.target.value)}
                                disabled={parentNodesLoading}
                                className={`${inputBase} appearance-none pr-9 disabled:bg-[#F9F9F9] disabled:cursor-not-allowed`}
                            >
                                <option value="">None (Root)</option>
                                {parentNodes
                                    .filter((n) => n.node_id !== node.internal_node_id) // exclude self
                                    .map((n) => (
                                        <option key={n.node_id} value={n.node_id}>
                                            {n.node_id} - {n.node_name}
                                        </option>
                                    ))}
                            </select>
                            <ChevronIcon />
                        </div>
                    </div>

                    {/* Effective From */}
                    <div className="flex flex-col gap-1.5">
                        <label className={labelBase}>Effective From</label>
                        <div className="relative">
                            <input
                                type="date"
                                value={effectiveFrom}
                                onChange={(e) => setEffectiveFrom(e.target.value)}
                                className={`${inputBase} pr-9 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer`}
                            />
                            <CalendarIcon />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="h-[68px] flex items-center justify-end gap-3 px-6 rounded-b-2xl bg-white shadow-[0px_-4px_9px_0px_rgba(0,0,0,0.08)]">
                    <button
                        onClick={handleClose}
                        className="px-5 py-2.5 text-sm font-medium text-[#282F49] border border-[#CCCCCC] rounded-lg bg-white cursor-pointer font-[Satoshi,sans-serif] hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || parentNodesLoading}
                        className={`px-5 py-2.5 text-sm font-medium text-white border-none rounded-lg font-[Satoshi,sans-serif] transition-colors ${
                            !isSubmitting && !parentNodesLoading
                                ? 'bg-[#8e78b7] cursor-pointer hover:bg-[#7a67a0]'
                                : 'bg-[#CBC0E0] cursor-not-allowed'
                        }`}
                    >
                        {isSubmitting ? 'Moving...' : 'Move Node'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MoveNodeModal;