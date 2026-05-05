import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useDomains, useEditHierarchy } from "../../../../../hooks/mdm/hierarchyDefinition";

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

const EditHierarchyModal = ({ isOpen, onClose, onSuccess, hierarchy }) => {
    const [formData, setFormData] = useState({
        hierarchy_type_id: '',
        hierarchy_code: '',
        hierarchy_name: '',
        description: '',
        domain_id: '',
        max_levels: '',
        allow_multiple_parents: false,
        effective_dating_enabled: false,
    });

    const { domains, loading: domainsLoading } = useDomains(isOpen);

    const { isSubmitting, update } = useEditHierarchy(async () => {
        onSuccess?.();
        handleClose();
    });

    // Populate form when hierarchy prop changes
    useEffect(() => {
        if (hierarchy && isOpen && domains.length > 0) {
            // Match domain_id from the name returned in the table row
            const matchedDomain = domains.find(
                (d) => d.domain_name === hierarchy.domain
            );

            setFormData({
                hierarchy_type_id: hierarchy.hierarchy_type_id ?? '',
                hierarchy_code: hierarchy.hierarchy_code ?? '',
                hierarchy_name: hierarchy.name ?? hierarchy.hierarchy_name ?? '',
                description: hierarchy.description ?? '',
                domain_id: matchedDomain?.domain_id ?? hierarchy.domain_id ?? '',  // ← resolved
                max_levels: hierarchy.levels ?? '',
                allow_multiple_parents: hierarchy.dag === 'Yes',
                effective_dating_enabled: hierarchy.dated === 'Yes',
            });
        }
    }, [hierarchy, isOpen, domains]);  // ← depend on domains, not domainsLoading

    const set = (key) => (e) =>
        setFormData((prev) => ({ ...prev, [key]: e.target.value }));

    const setCheck = (key) => (e) =>
        setFormData((prev) => ({ ...prev, [key]: e.target.checked }));

    const handleSubmit = async () => {
        const result = await update({
            hierarchy_type_id: formData.hierarchy_type_id,
            hierarchy_code: formData.hierarchy_code.trim(),
            hierarchy_name: formData.hierarchy_name.trim(),
            description: formData.description.trim(),
            entity_type: null,                                    // ← add this
            domain_id: formData.domain_id,
            max_levels: parseInt(formData.max_levels, 10),
            allow_multiple_parents: formData.allow_multiple_parents,
            effective_dating_enabled: formData.effective_dating_enabled,
        });
        if (!result.ok) toast.error(result.message);
        else toast.success(result.data?.message || 'Hierarchy updated successfully');
    };

    const handleClose = () => {
        onClose();
    };

    const isValid =
        formData.hierarchy_code &&
        formData.hierarchy_name &&
        formData.domain_id &&
        formData.max_levels;

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
                        Edit Hierarchy —{' '}
                        <span className="text-[#8e78b7]">{hierarchy?.hierarchy_code}</span>
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
                    {/* Hierarchy Code */}
                    <div className="flex flex-col gap-1.5">
                        <label className={labelBase}>
                            Hierarchy Code <span className="text-[#E05252]">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Enter Hierarchy Code"
                            value={formData.hierarchy_code}
                            onChange={set('hierarchy_code')}
                            className={inputBase}
                        />
                    </div>

                    {/* Hierarchy Name */}
                    <div className="flex flex-col gap-1.5">
                        <label className={labelBase}>
                            Hierarchy Name <span className="text-[#E05252]">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Enter Hierarchy Name"
                            value={formData.hierarchy_name}
                            onChange={set('hierarchy_name')}
                            className={inputBase}
                        />
                    </div>

                    {/* Domain */}
                    <div className="flex flex-col gap-1.5">
                        <label className={labelBase}>
                            Domain <span className="text-[#E05252]">*</span>
                        </label>
                        <SelectField
                            value={formData.domain_id}
                            onChange={set('domain_id')}
                            placeholder={domainsLoading ? 'Loading...' : 'Select'}
                            disabled={domainsLoading}
                        >
                            {domains.map((d) => (
                                <option key={d.domain_id} value={d.domain_id}>
                                    {d.domain_name}
                                </option>
                            ))}
                        </SelectField>
                    </div>

                    {/* Maximum Levels */}
                    <div className="flex flex-col gap-1.5">
                        <label className={labelBase}>
                            Maximum Levels <span className="text-[#E05252]">*</span>
                        </label>
                        <input
                            type="number"
                            placeholder="Enter Maximum Levels"
                            value={formData.max_levels}
                            onChange={set('max_levels')}
                            min={1}
                            className={inputBase}
                        />
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

                    {/* Checkboxes */}
                    <div className="col-span-2 flex flex-col gap-3">
                        <label className="flex items-center gap-2.5 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={formData.allow_multiple_parents}
                                onChange={setCheck('allow_multiple_parents')}
                                className="w-4 h-4 accent-[#8e78b7] cursor-pointer"
                            />
                            <span className="text-sm text-[#332849] font-[Satoshi,sans-serif]">
                                Enable DAG Structure — Allow multiple parents
                            </span>
                        </label>

                        <label className="flex items-center gap-2.5 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={formData.effective_dating_enabled}
                                onChange={setCheck('effective_dating_enabled')}
                                className="w-4 h-4 accent-[#8e78b7] cursor-pointer"
                            />
                            <span className="text-sm text-[#332849] font-[Satoshi,sans-serif]">
                                Track Date Ranges — Enable effective dating
                            </span>
                        </label>
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
                        className={`px-5 py-2.5 text-sm font-medium text-white border-none rounded-lg font-[Satoshi,sans-serif] transition-colors ${isValid && !isSubmitting
                            ? 'bg-[#8e78b7] cursor-pointer hover:bg-[#7a67a0]'
                            : 'bg-[#CBC0E0] cursor-not-allowed'
                            }`}
                    >
                        {isSubmitting ? 'Updating...' : 'Update Hierarchy'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditHierarchyModal;