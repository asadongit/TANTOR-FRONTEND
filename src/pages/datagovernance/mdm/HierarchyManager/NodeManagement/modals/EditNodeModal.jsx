import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useParentNodes, useEditNode } from "../../../../../../hooks/mdm/nodeManagement";

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

const SelectField = ({ value, onChange, children, placeholder, disabled }) => (
    <div className="relative">
        <select
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={`${inputBase} appearance-none pr-9 disabled:bg-[#F9F9F9] disabled:cursor-not-allowed ${!value ? 'text-[#A0AEC0]' : 'text-[#282F49]'}`}
        >
            <option value="" disabled>{placeholder || 'Select'}</option>
            {children}
        </select>
        <ChevronIcon />
    </div>
);

const EditNodeModal = ({ isOpen, onClose, onSuccess, node }) => {
    const [formData, setFormData] = useState({
        node_id: '',
        node_name: '',
        hierarchy_type_id: '',
        hierarchy_name: '',
        parent_node_id: '',
        status: true,
        description: '',
    });

    const { parentNodes, loading: parentNodesLoading } = useParentNodes(
        formData.hierarchy_type_id,
        isOpen
    );

    const { isSubmitting, update } = useEditNode(async () => {
        onSuccess?.();
        handleClose();
    });

    // Populate form when node prop changes
    useEffect(() => {
        if (node && isOpen) {
            setFormData({
                node_id:   node.internal_node_id ?? '', 
                node_code: node.node_id          ?? '', 
                node_name:         node.name             ?? node.node_name ?? '',
                hierarchy_type_id: node.hierarchy_type_id ?? '',
                hierarchy_name:    node.hierarchy         ?? '',
                parent_node_id:    node.parent_node_id   ?? '',
                status:            node.status === 'Active',
                description:       node.description       ?? '',
            });
        }
    }, [node, isOpen]);

    const set = (key) => (e) =>
        setFormData((prev) => ({ ...prev, [key]: e.target.value }));

    const handleSubmit = async () => {
        const result = await update({
            node_id:        formData.node_id,
            node_name:      formData.node_name.trim(),
            parent_node_id: formData.parent_node_id || null,
            status:         formData.status,
            description:    formData.description.trim() || null,
        });
        if (!result.ok) toast.error(result.message);
        else toast.success(result.data?.message || 'Node updated successfully');
    };

    const handleClose = () => {
        onClose();
    };

    const isValid = formData.node_name.trim();

    if (!isOpen) return null;

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
                        Edit Hierarchy Node
                    </span>
                    <button
                        onClick={handleClose}
                        className="bg-transparent border-none cursor-pointer p-1 text-[#818181] flex items-center hover:text-[#282F49] transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <div className="px-6 py-5 grid grid-cols-2 gap-5 bg-white">

                    {/* Node ID — read-only */}
                    {/* Node Code — read-only display */}
                {/* Node Code — read-only display */}
                <div className="flex flex-col gap-1.5">
                    <label className={labelBase}>Node ID</label>
                    <input
                        type="text"
                        value={formData.node_id} 
                        readOnly
                        className={`${inputBase} bg-[#F9F9F9] cursor-not-allowed text-[#818181]`}
                    />
                </div>

                    {/* Node Name */}
                    <div className="flex flex-col gap-1.5">
                        <label className={labelBase}>
                            Node Name <span className="text-[#E05252]">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Enter Node Name"
                            value={formData.node_name}
                            onChange={set('node_name')}
                            className={inputBase}
                        />
                    </div>

                    {/* Hierarchy — read-only (can't change hierarchy after creation) */}
                    <div className="flex flex-col gap-1.5">
                        <label className={labelBase}>Hierarchy</label>
                        <input
                            type="text"
                            value={formData.hierarchy_name}
                            readOnly
                            className={`${inputBase} bg-[#F9F9F9] cursor-not-allowed text-[#818181]`}
                        />
                    </div>

                    {/* Parent Node */}
                    <div className="flex flex-col gap-1.5">
                        <label className={labelBase}>Parent Node</label>
                        <SelectField
                            value={formData.parent_node_id}
                            onChange={set('parent_node_id')}
                            placeholder={parentNodesLoading ? 'Loading...' : 'None (Root)'}
                            disabled={parentNodesLoading}
                        >
                            <option value="">None (Root)</option>
                            {parentNodes
                                .filter((n) => n.node_id !== formData.node_id) // can't be own parent
                                .map((n) => (
                                    <option key={n.node_id} value={n.node_id}>
                                        {n.node_name}
                                    </option>
                                ))}
                        </SelectField>
                    </div>

                    {/* Status */}
                    <div className="flex flex-col gap-1.5">
                        <label className={labelBase}>Status</label>
                        <div className="relative">
                            <select
                                value={formData.status ? 'true' : 'false'}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        status: e.target.value === 'true',
                                    }))
                                }
                                className={`${inputBase} appearance-none pr-9`}
                            >
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                            </select>
                            <ChevronIcon />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="flex flex-col gap-1.5">
                        <label className={labelBase}>Description</label>
                        <input
                            type="text"
                            placeholder="Optional description..."
                            value={formData.description}
                            onChange={set('description')}
                            className={inputBase}
                        />
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
                        disabled={!isValid || isSubmitting}
                        className={`px-5 py-2.5 text-sm font-medium text-white border-none rounded-lg font-[Satoshi,sans-serif] transition-colors ${
                            isValid && !isSubmitting
                                ? 'bg-[#8e78b7] cursor-pointer hover:bg-[#7a67a0]'
                                : 'bg-[#CBC0E0] cursor-not-allowed'
                        }`}
                    >
                        {isSubmitting ? 'Updating...' : 'Update'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditNodeModal;