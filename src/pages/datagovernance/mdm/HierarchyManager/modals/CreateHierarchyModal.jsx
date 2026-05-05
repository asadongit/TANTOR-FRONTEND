import React, { useState, useEffect } from 'react';
import { X, Plus, ChevronLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useDomains, useCreateHierarchy } from "../../../../../hooks/mdm/hierarchyDefinition";

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

const emptyLevel = (levelNumber) => ({
    _id: Date.now() + Math.random(),
    level_number: levelNumber,
    level_name: '',
    level_code: '',
    description: '',
});

const EMPTY_FORM = {
    hierarchy_code: '',
    hierarchy_name: '',
    domain_id: '',
    description: '',
    allow_multiple_parents: false,
    effective_dating_enabled: false,
};

// ── Add Levels Sub-Modal ──────────────────────────────────────────────────────
const AddLevelsModal = ({ isOpen, onClose, onConfirm, initialLevels, readOnly = false }) => {
    const [levels, setLevels] = useState([emptyLevel(1)]);

    useEffect(() => {
        if (isOpen) {
            setLevels(initialLevels?.length ? initialLevels : [emptyLevel(1)]);
        }
    }, [isOpen]);

    const updateLevel = (id, field, value) =>
        setLevels((prev) =>
            prev.map((l) => (l._id === id ? { ...l, [field]: value } : l))
        );

    const addRow = () =>
        setLevels((prev) => [...prev, emptyLevel(prev.length + 1)]);

    const handleConfirm = () => {
        onConfirm(levels);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40">
            <div
                className="bg-white rounded-2xl border border-[#CCCCCC] mx-4 flex flex-col overflow-hidden"
                style={{ width: 690, maxHeight: '90vh' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex-shrink-0 flex items-center justify-between px-6 bg-white rounded-t-2xl" style={{ height: 72 }}>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="bg-transparent border-none cursor-pointer p-1 text-[#818181] hover:text-[#282F49] transition-colors flex items-center"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <span className="text-lg font-medium text-[#282F49] font-[Satoshi,sans-serif]">
                            {readOnly ? 'View Levels' : 'Add Levels'}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="bg-transparent border-none cursor-pointer p-1 text-[#818181] hover:text-[#282F49] transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="overflow-y-auto flex flex-col gap-5 px-6 py-5">

                    {/* Note banner */}
                    <div className="flex items-start px-3 py-2 rounded-lg bg-[#FAFAFA]">
                        <p className="text-base font-medium text-[#332849] font-[Satoshi,sans-serif]" style={{ lineHeight: '22px' }}>
                            <span className="font-semibold text-[#8E77BB]">Note:</span>{' '}
                            Add levels in sequence (e.g., Level 1 → Level 2 → Level 3) to maintain proper hierarchy structure.
                        </p>
                    </div>

                    {/* Table */}
                    <div className="rounded-lg border border-[#CCCCCC] overflow-hidden">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className="bg-[#F9F9F9] border-b border-[#CCCCCC] px-4 text-left font-medium text-[#332849] font-[Satoshi,sans-serif]"
                                        style={{ fontSize: 16, lineHeight: '22px', height: 54, width: 81 }}>
                                        Level
                                    </th>
                                    <th className="bg-[#F9F9F9] border-b border-[#CCCCCC] px-4 text-left font-medium text-[#332849] font-[Satoshi,sans-serif]"
                                        style={{ fontSize: 16, lineHeight: '22px', height: 54 }}>
                                        Name
                                    </th>
                                    <th className="bg-[#F9F9F9] border-b border-[#CCCCCC] px-4 text-left font-medium text-[#332849] font-[Satoshi,sans-serif]"
                                        style={{ fontSize: 16, lineHeight: '22px', height: 54, width: 105 }}>
                                        Code
                                    </th>
                                    <th className="bg-[#F9F9F9] border-b border-[#CCCCCC] px-4 text-left font-medium text-[#332849] font-[Satoshi,sans-serif]"
                                        style={{ fontSize: 16, lineHeight: '22px', height: 54, width: 181 }}>
                                        Description
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {levels.map((level) => (
                                    <tr key={level._id} className="bg-white border-b border-[#CCCCCC] last:border-0">
                                        <td className="px-4 text-[#8E77BB] font-normal font-[Satoshi,sans-serif]"
                                            style={{ fontSize: 14, lineHeight: '19px', height: 52, width: 81 }}>
                                            {String(level.level_number).padStart(2, '0')}
                                        </td>

                                        {readOnly ? (
                                            <>
                                                <td className="px-4 text-[#332849] font-normal font-[Satoshi,sans-serif]"
                                                    style={{ fontSize: 14, lineHeight: '19px', height: 52 }}>
                                                    {level.level_name || '—'}
                                                </td>
                                                <td className="px-4 text-[#332849] font-normal font-[Satoshi,sans-serif]"
                                                    style={{ fontSize: 14, lineHeight: '19px', height: 52, width: 105 }}>
                                                    {level.level_code || '—'}
                                                </td>
                                                <td className="px-4 text-[#332849] font-normal font-[Satoshi,sans-serif]"
                                                    style={{ fontSize: 14, lineHeight: '19px', height: 52, width: 181 }}>
                                                    {level.description || '—'}
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="px-2" style={{ height: 52 }}>
                                                    <input
                                                        type="text"
                                                        placeholder="Enter Name"
                                                        value={level.level_name}
                                                        onChange={(e) => updateLevel(level._id, 'level_name', e.target.value)}
                                                        className="w-full border-0 outline-none text-[#332849] placeholder-[#C0BAC8] bg-transparent font-[Satoshi,sans-serif] focus:bg-[#F9F7FF] rounded px-2 py-1"
                                                        style={{ fontSize: 14 }}
                                                    />
                                                </td>
                                                <td className="px-2" style={{ height: 52, width: 105 }}>
                                                    <input
                                                        type="text"
                                                        placeholder="Enter Code"
                                                        value={level.level_code}
                                                        onChange={(e) => updateLevel(level._id, 'level_code', e.target.value)}
                                                        className="w-full border-0 outline-none text-[#332849] placeholder-[#C0BAC8] bg-transparent font-[Satoshi,sans-serif] focus:bg-[#F9F7FF] rounded px-2 py-1"
                                                        style={{ fontSize: 14 }}
                                                    />
                                                </td>
                                                <td className="px-2" style={{ height: 52, width: 181 }}>
                                                    <input
                                                        type="text"
                                                        placeholder="Enter Description"
                                                        value={level.description}
                                                        onChange={(e) => updateLevel(level._id, 'description', e.target.value)}
                                                        className="w-full border-0 outline-none text-[#332849] placeholder-[#C0BAC8] bg-transparent font-[Satoshi,sans-serif] focus:bg-[#F9F7FF] rounded px-2 py-1"
                                                        style={{ fontSize: 14 }}
                                                    />
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}

                                {/* Add Level row */}
                                {!readOnly && (
                                    <tr className="bg-white">
                                        <td colSpan={4} className="px-4" style={{ height: 52 }}>
                                            <button
                                                onClick={addRow}
                                                className="flex items-center gap-2 text-[#8E77BB] font-normal font-[Satoshi,sans-serif] hover:text-[#7a67a0] transition-colors bg-transparent border-none cursor-pointer"
                                                style={{ fontSize: 14 }}
                                            >
                                                <Plus size={16} />
                                                Add Level
                                            </button>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer */}
                <div
                    className="flex-shrink-0 flex items-center justify-end gap-4 px-6 bg-white rounded-b-2xl"
                    style={{ height: 72, boxShadow: '0px -4px 9px rgba(0, 0, 0, 0.1)' }}
                >
                    <button
                        onClick={onClose}
                        className="px-4 py-2.5 text-sm font-medium text-[#8E77BB] border border-[#8E77BB] rounded-lg bg-white cursor-pointer font-[Satoshi,sans-serif] hover:bg-[#F9F5FF] transition-colors"
                    >
                        {readOnly ? 'Close' : 'Cancel'}
                    </button>
                    {!readOnly && (
                        <button
                            onClick={handleConfirm}
                            className="px-4 py-2.5 text-sm font-medium text-white bg-[#8E77BB] border-none rounded-lg cursor-pointer font-[Satoshi,sans-serif] hover:bg-[#7a67a0] transition-colors"
                        >
                            Add Levels
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// ── Main Create Hierarchy Modal ───────────────────────────────────────────────
const CreateHierarchyModal = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [levels, setLevels] = useState([]);
    const [isLevelsModalOpen, setIsLevelsModalOpen] = useState(false);
    const [levelsModalReadOnly, setLevelsModalReadOnly] = useState(false);

    const { domains, loading: domainsLoading } = useDomains(isOpen);

    const { isSubmitting, create } = useCreateHierarchy(async () => {
        onSuccess?.();
        handleClose();
    });

    useEffect(() => {
        if (!isOpen) {
            setFormData(EMPTY_FORM);
            setLevels([]);
        }
    }, [isOpen]);

    const set = (key) => (e) =>
        setFormData((prev) => ({ ...prev, [key]: e.target.value }));

    const setCheck = (key) => (e) =>
        setFormData((prev) => ({ ...prev, [key]: e.target.checked }));

    const openAddLevels = () => {
        setLevelsModalReadOnly(false);
        setIsLevelsModalOpen(true);
    };

    const openViewLevels = () => {
        setLevelsModalReadOnly(true);
        setIsLevelsModalOpen(true);
    };

    const handleSubmit = async () => {
        const result = await create({
            hierarchy_code: formData.hierarchy_code.trim(),
            hierarchy_name: formData.hierarchy_name.trim(),
            domain_id: formData.domain_id,
            description: formData.description.trim() || null,
            allow_multiple_parents: formData.allow_multiple_parents,
            effective_dating_enabled: formData.effective_dating_enabled,
            levels: levels.map(({ level_number, level_name, level_code, description }) => ({
                level_number,
                level_name: level_name.trim(),
                level_code: level_code.trim(),
                description: description?.trim() || null,
            })),
        });

        if (!result.ok) {
            const msg =
                typeof result.message === 'string'
                    ? result.message
                    : Array.isArray(result.message)
                    ? result.message.map((e) => e?.msg ?? JSON.stringify(e)).join('; ')
                    : 'An unexpected error occurred';
            toast.error(msg);
        } else {
            toast.success(result.data?.message || 'Hierarchy created successfully');
        }
    };

    const handleClose = () => {
        setFormData(EMPTY_FORM);
        setLevels([]);
        onClose();
    };

    const isValid =
        formData.hierarchy_code &&
        formData.hierarchy_name &&
        formData.domain_id;

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div
                    className="bg-white rounded-2xl border border-[#CCCCCC] mx-4 flex flex-col overflow-hidden"
                    style={{ width: 690 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div
                        className="flex-shrink-0 flex items-center justify-between px-6 bg-white rounded-t-2xl"
                        style={{ height: 72 }}
                    >
                        <span className="font-medium text-[#282F49] font-[Satoshi,sans-serif]" style={{ fontSize: 18, lineHeight: '24px' }}>
                            Create New Hierarchy
                        </span>
                        <button
                            onClick={handleClose}
                            className="bg-transparent border-none cursor-pointer p-1 text-[#818181] hover:text-[#282F49] transition-colors flex items-center"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex flex-col gap-4 px-6 pt-2 pb-6">

                        {/* Row 1: Code + Name */}
                        <div className="flex gap-4">
                            <div className="flex flex-col gap-1.5 flex-1">
                                <label className="text-sm font-medium text-[#332849] font-[Satoshi,sans-serif]" style={{ fontSize: 14, lineHeight: '19px' }}>
                                    Hierarchy Code <span className="text-[#E05252]">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter Hierarchy Code"
                                    value={formData.hierarchy_code}
                                    onChange={set('hierarchy_code')}
                                    className="border border-[#CCCCCC] rounded-lg px-4 text-sm text-[#282F49] outline-none bg-white font-[Satoshi,sans-serif] focus:border-[#8e78b7] placeholder-[#818181]"
                                    style={{ height: 40, fontSize: 14 }}
                                />
                            </div>
                            <div className="flex flex-col gap-1.5 flex-1">
                                <label className="text-sm font-medium text-[#332849] font-[Satoshi,sans-serif]" style={{ fontSize: 14, lineHeight: '19px' }}>
                                    Hierarchy Name <span className="text-[#E05252]">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter Hierarchy Name"
                                    value={formData.hierarchy_name}
                                    onChange={set('hierarchy_name')}
                                    className="border border-[#CCCCCC] rounded-lg px-4 text-sm text-[#282F49] outline-none bg-white font-[Satoshi,sans-serif] focus:border-[#8e78b7] placeholder-[#818181]"
                                    style={{ height: 40, fontSize: 14 }}
                                />
                            </div>
                        </div>

                        {/* Domain — full width */}
                        <div className="flex flex-col gap-1.5">
                            <label className="font-medium text-[#332849] font-[Satoshi,sans-serif]" style={{ fontSize: 14, lineHeight: '19px' }}>
                                Domain <span className="text-[#E05252]">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    value={formData.domain_id}
                                    onChange={set('domain_id')}
                                    disabled={domainsLoading}
                                    className={`w-full border border-[#CCCCCC] rounded-lg px-4 outline-none bg-white font-[Satoshi,sans-serif] focus:border-[#8e78b7] appearance-none pr-10 disabled:bg-[#F9F9F9] disabled:cursor-not-allowed ${!formData.domain_id ? 'text-[#818181]' : 'text-[#282F49]'}`}
                                    style={{ height: 40, fontSize: 14 }}
                                >
                                    <option value="" disabled>{domainsLoading ? 'Loading...' : 'Select Domain'}</option>
                                    {domains.map((d) => (
                                        <option key={d.domain_id} value={d.domain_id}>{d.domain_name}</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#818181]">
                                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Description — full width */}
                        <div className="flex flex-col gap-1.5">
                            <label className="font-medium text-[#332849] font-[Satoshi,sans-serif]" style={{ fontSize: 14, lineHeight: '19px' }}>
                                Description
                            </label>
                            <input
                                type="text"
                                placeholder="Enter Description"
                                value={formData.description}
                                onChange={set('description')}
                                className="w-full border border-[#CCCCCC] rounded-lg px-4 text-sm text-[#282F49] outline-none bg-white font-[Satoshi,sans-serif] focus:border-[#8e78b7] placeholder-[#818181]"
                                style={{ height: 40, fontSize: 14 }}
                            />
                        </div>

                        {/* Checkboxes */}
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={formData.allow_multiple_parents}
                                    onChange={setCheck('allow_multiple_parents')}
                                    className="w-4 h-4 accent-[#8e78b7] cursor-pointer"
                                />
                                <span className="font-medium text-[#332849] font-[Satoshi,sans-serif]" style={{ fontSize: 14, lineHeight: '19px' }}>
                                    Enable DAG Structure — Allow multiple parents
                                </span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={formData.effective_dating_enabled}
                                    onChange={setCheck('effective_dating_enabled')}
                                    className="w-4 h-4 accent-[#8e78b7] cursor-pointer"
                                />
                                <span className="font-medium text-[#332849] font-[Satoshi,sans-serif]" style={{ fontSize: 14, lineHeight: '19px' }}>
                                    Track Date Ranges — Enable effective dating
                                </span>
                            </label>
                        </div>

                        {/* Add Levels section */}
                        <div className="rounded-lg bg-[#FAFAFA] p-4 flex flex-col gap-4">
                            {/* Top row: title + subtitle + view levels button */}
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col gap-1">
                                    <span className="font-medium text-[#282F49] font-[Satoshi,sans-serif]" style={{ fontSize: 18, lineHeight: '24px' }}>
                                        Add Levels
                                    </span>
                                    <span className="font-medium text-[#818181] font-[Satoshi,sans-serif]" style={{ fontSize: 14, lineHeight: '19px' }}>
                                        Add and configure the organizational tiers for this hierarchy.
                                    </span>
                                </div>
                                {levels.length > 0 && (
                                    <button
                                        onClick={openViewLevels}
                                        className="flex items-center justify-center bg-white rounded-lg px-3 py-2.5 font-medium text-[#8E77BB] font-[Satoshi,sans-serif] border-none cursor-pointer hover:bg-[#F9F5FF] transition-colors"
                                        style={{ fontSize: 14, lineHeight: '19px' }}
                                    >
                                        View Levels {String(levels.length).padStart(2, '0')}
                                    </button>
                                )}
                            </div>

                            {/* Dashed Add Levels button */}
                            <button
                                onClick={openAddLevels}
                                className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-[#8E77BB] bg-white text-[#8E77BB] font-medium font-[Satoshi,sans-serif] hover:bg-[#F9F5FF] transition-colors cursor-pointer"
                                style={{ height: 36, fontSize: 14 }}
                            >
                                <Plus size={16} />
                                {levels.length > 0 ? 'Edit Levels' : 'Add Levels'}
                            </button>
                        </div>
                    </div>

                    {/* Footer */}
                    <div
                        className="flex-shrink-0 flex items-center justify-end gap-4 px-6 bg-white rounded-b-2xl"
                        style={{ height: 72, boxShadow: '0px -4px 9px rgba(0, 0, 0, 0.1)' }}
                    >
                        <button
                            onClick={handleClose}
                            className="px-4 py-2.5 font-medium text-[#8E77BB] border border-[#8E77BB] rounded-lg bg-white cursor-pointer font-[Satoshi,sans-serif] hover:bg-[#F9F5FF] transition-colors"
                            style={{ fontSize: 14 }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!isValid || isSubmitting}
                            className={`px-4 py-2.5 font-medium text-white border-none rounded-lg font-[Satoshi,sans-serif] transition-colors ${
                                isValid && !isSubmitting
                                    ? 'bg-[#8E77BB] cursor-pointer hover:bg-[#7a67a0]'
                                    : 'bg-[#CBC0E0] cursor-not-allowed'
                            }`}
                            style={{ fontSize: 14 }}
                        >
                            {isSubmitting ? 'Creating...' : 'Create New Hierarchy'}
                        </button>
                    </div>
                </div>
            </div>

            <AddLevelsModal
                isOpen={isLevelsModalOpen}
                onClose={() => setIsLevelsModalOpen(false)}
                onConfirm={(confirmedLevels) => setLevels(confirmedLevels)}
                initialLevels={levels}
                readOnly={levelsModalReadOnly}
            />
        </>
    );
};

export default CreateHierarchyModal;