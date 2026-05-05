import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useHierarchiesList, useParentNodes, useCreateNode } from "../../../../../../hooks/mdm/nodeManagement";

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

const EMPTY_FORM = {
    node_name: '',
    node_code: '',
    hierarchy_type_id: '',
    parent_node_id: '',
    effective_from: '',
    description: '',
};

const CreateNodeModal = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState(EMPTY_FORM);

    const { hierarchies, loading: hierarchiesLoading } = useHierarchiesList(isOpen);
    const { parentNodes, loading: parentNodesLoading } = useParentNodes(formData.hierarchy_type_id, isOpen);

    const { isSubmitting, create } = useCreateNode(async () => {
        onSuccess?.();
        handleClose();
    });

    useEffect(() => {
        if (!isOpen) setFormData(EMPTY_FORM);
    }, [isOpen]);

    // Reset parent when hierarchy changes
    useEffect(() => {
        setFormData((prev) => ({ ...prev, parent_node_id: '' }));
    }, [formData.hierarchy_type_id]);

    const set = (key) => (e) =>
        setFormData((prev) => ({ ...prev, [key]: e.target.value }));

    const handleSubmit = async () => {
        const result = await create({
            node_name: formData.node_name.trim(),
            node_code: formData.node_code.trim(),
            hierarchy_type_id: formData.hierarchy_type_id,
            parent_node_id: formData.parent_node_id || null,
            effective_from: formData.effective_from || null,
            description: formData.description.trim() || null,
        });
        if (!result.ok) toast.error(result.message);
        else toast.success(result.data?.message || 'Node created successfully');
    };

    const handleClose = () => {
        setFormData(EMPTY_FORM);
        onClose();
    };

    const isValid =
        formData.node_name.trim() &&
        formData.node_code.trim() &&
        formData.hierarchy_type_id;

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
                        Add Hierarchy Node
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

                    {/* Node Code */}
                    <div className="flex flex-col gap-1.5">
                        <label className={labelBase}>
                            Node Code
                        </label>
                        <input
                            type="text"
                            placeholder="Enter Node Code"
                            value={formData.node_code}
                            onChange={set('node_code')}
                            className={inputBase}
                        />
                    </div>

                    {/* Hierarchy */}
                    <div className="flex flex-col gap-1.5">
                        <label className={labelBase}>
                            Hierarchy <span className="text-[#E05252]">*</span>
                        </label>
                        <SelectField
                            value={formData.hierarchy_type_id}
                            onChange={set('hierarchy_type_id')}
                            placeholder={hierarchiesLoading ? 'Loading...' : 'Select'}
                            disabled={hierarchiesLoading}
                        >
                            {hierarchies.map((h) => (
                                <option key={h.hierarchy_type_id} value={h.hierarchy_type_id}>
                                    {h.hierarchy_name}
                                </option>
                            ))}
                        </SelectField>
                    </div>

                    {/* Parent Node */}
                    <div className="flex flex-col gap-1.5">
                        <label className={labelBase}>Parent Node</label>
                        <SelectField
                            value={formData.parent_node_id}
                            onChange={set('parent_node_id')}
                            placeholder={
                                !formData.hierarchy_type_id
                                    ? 'Select'
                                    : parentNodesLoading
                                    ? 'Loading...'
                                    : 'Select'
                            }
                            disabled={!formData.hierarchy_type_id || parentNodesLoading}
                        >
                            {parentNodes.map((n) => (
                                <option key={n.node_id} value={n.node_id}>
                                    {n.node_name}
                                </option>
                            ))}
                        </SelectField>
                    </div>

                    {/* Effective From */}
                    <div className="flex flex-col gap-1.5">
                        <label className={labelBase}>Effective From</label>
                        <div className="relative">
                            <input
                                type="date"
                                value={formData.effective_from}
                                onChange={set('effective_from')}
                                placeholder="DD/MM/YYYY"
                                className={`${inputBase} pr-9 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer`}
                            />
                            <CalendarIcon />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="flex flex-col gap-1.5 col-span-2">
                        <label className={labelBase}>Description</label>
                        <textarea
                            rows={3}
                            placeholder="Enter description"
                            value={formData.description}
                            onChange={set('description')}
                            className={`${inputBase} resize-none leading-relaxed`}
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
                        {isSubmitting ? 'Adding...' : 'Add Node'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateNodeModal;