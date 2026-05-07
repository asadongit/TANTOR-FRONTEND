import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
    useMatchResultIds,
    useStewards,
    useCreateTask,
} from '../../../../../../hooks/mdm/taskQueue';
import { useAuth } from '../../../../../../context/AuthContext';
import SearchableDropdown from '../../../components/SearchableDropdown';

const inputBase =
    'w-full border border-[#CCCCCC] rounded-lg px-3.5 py-2.5 text-sm font-normal text-[#282F49] outline-none bg-white leading-none box-border focus:border-[#8e78b7] font-[Satoshi,sans-serif] transition-colors';

const labelBase =
    'text-sm font-medium text-[#332849] font-[Satoshi,sans-serif] leading-none mb-1.5 block';

const TASK_TYPE_OPTIONS = [
    { value: 'Match Review',   label: 'Match Review',   apiValue: 'MATCH_REVIEW'   },
    { value: 'Data Quality',   label: 'Data Quality',   apiValue: 'DATA_QUALITY'   },
    { value: 'Merge Approval', label: 'Merge Approval', apiValue: 'MERGE_APPROVAL' },
];

const PRIORITY_OPTIONS = [
    { value: 'High',   label: 'High'   },
    { value: 'Medium', label: 'Medium' },
    { value: 'Low',    label: 'Low'    },
];

const EMPTY_FORM = {
    task_type:        '',
    entity_id:        '',
    match_result_id:  '',
    assigned_to:      '',
    assigned_role:    '',
    priority:         '',
    due_date:         '',
    description:      '',
};

const MatchResultDropdown = ({ value, onChange, records, loading }) => {
    const [open, setOpen]     = useState(false);
    const [search, setSearch] = useState('');
    const ref                 = useRef(null);

    const entries  = Object.entries(records || {});
    const filtered = entries.filter(([id]) =>
        id.toLowerCase().includes(search.toLowerCase())
    );
    const selected = value ? records?.[value] : null;

    useEffect(() => {
        const onClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    return (
        <div className="relative" ref={ref}>
            {/* Trigger */}
            <button
                type="button"
                disabled={loading}
                onClick={() => !loading && setOpen((p) => !p)}
                className={`
                    w-full border border-[#CCCCCC] rounded-lg px-3.5 text-left bg-white
                    outline-none font-[Satoshi,sans-serif] transition-colors
                    disabled:bg-[#F9F9F9] disabled:cursor-not-allowed
                    hover:border-[#8e78b7] focus:border-[#8e78b7]
                `}
                style={{ height: '40px' }}
            >
                <div className="flex items-center justify-between gap-2 h-full">
                    <div className="flex flex-col justify-center min-w-0 flex-1">
                        {loading ? (
                            <span className="text-sm text-[#A0AEC0]">Loading...</span>
                        ) : value && selected ? (
                            <>
                                <span className="text-sm font-medium text-[#282F49] truncate leading-none">
                                    {value}
                                </span>
                                <span className="text-xs text-[#818181] truncate leading-none mt-0.5">
                                    {selected.source_record_id}
                                    {selected.source_attribute_value != null
                                        ? ` · ${selected.source_attribute_value}`
                                        : ''}
                                    {' \u2192 '}
                                    {selected.target_golden_id}
                                    {selected.target_attribute_value != null
                                        ? ` · ${selected.target_attribute_value}`
                                        : ''}
                                </span>
                            </>
                        ) : (
                            <span className="text-sm text-[#A0AEC0]">Select Match Result ID</span>
                        )}
                    </div>
                    <svg
                        width="16" height="16" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor" strokeWidth="2"
                        className="flex-shrink-0 text-[#818181]"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>

            {/* Dropdown panel */}
            {open && (
                <div
                    className="absolute z-[9999] left-0 right-0 mt-1 bg-white border border-[#CCCCCC] rounded-lg shadow-lg overflow-hidden"
                    style={{ maxHeight: '264px' }}
                >
                    <div className="px-3 py-2 border-b border-[#EEEEEE]">
                        <input
                            autoFocus
                            type="text"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full text-sm text-[#332849] bg-transparent outline-none font-[Satoshi,sans-serif] placeholder-[#A0AEC0]"
                        />
                    </div>
                    <div className="overflow-y-auto" style={{ maxHeight: '216px' }}>
                        {filtered.length === 0 ? (
                            <div className="px-3 py-3 text-sm text-[#818181] font-[Satoshi,sans-serif]">
                                No results
                            </div>
                        ) : (
                            filtered.map(([id, detail]) => (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => { onChange(id); setOpen(false); setSearch(''); }}
                                    className="w-full text-left px-3 py-2.5 hover:bg-[#F2EBFF] transition-colors border-b border-[#F5F5F5] last:border-0"
                                >
                                    <span className="block text-sm font-medium text-[#332849] font-[Satoshi,sans-serif] leading-none">
                                        {id}
                                    </span>
                                    <span className="block text-xs text-[#818181] font-[Satoshi,sans-serif] leading-none mt-1">
                                        {detail.source_record_id}
                                        {detail.source_attribute_value != null
                                            ? ` \u00b7 ${detail.source_attribute_value}`
                                            : ''}
                                        {' \u2192 '}
                                        {detail.target_golden_id}
                                        {detail.target_attribute_value != null
                                            ? ` \u00b7 ${detail.target_attribute_value}`
                                            : ''}
                                    </span>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const AddTaskModal = ({ isOpen, onClose, onSuccess }) => {
    const { decodedToken } = useAuth();
    const [formData, setFormData] = useState(EMPTY_FORM);

    const isMatchReview = formData.task_type === 'Match Review';

    const { records: matchRecords, loading: matchLoading } = useMatchResultIds(isOpen && isMatchReview);
    const { stewards, loading: stewardsLoading }           = useStewards(isOpen);
    const { isSubmitting, create }                         = useCreateTask(async () => {
        onSuccess?.();
        handleClose();
    });

    useEffect(() => {
        if (!isOpen) setFormData(EMPTY_FORM);
    }, [isOpen]);

    const stewardOptions = useMemo(
        () => stewards.map((s) => ({ value: s.username, label: s.username })),
        [stewards]
    );

    const set = (key) => (value) =>
        setFormData((prev) => ({ ...prev, [key]: value }));

    const setRaw = (key) => (e) =>
        setFormData((prev) => ({ ...prev, [key]: e.target.value }));

    const handleTaskTypeChange = (value) => {
        setFormData((prev) => ({
            ...prev,
            task_type:       value,
            entity_id:       '',
            match_result_id: '',
        }));
    };

    const handleAssignedToChange = (username) => {
        const selected = stewards.find((s) => s.username === username);
        setFormData((prev) => ({
            ...prev,
            assigned_to:   selected?.username || '',
            assigned_role: selected?.role     || '',
        }));
    };

    const handleSubmit = async () => {
        const taskOption = TASK_TYPE_OPTIONS.find((t) => t.value === formData.task_type);
        const payload = {
            task_type:     taskOption?.apiValue || formData.task_type,
            task_subtype:  taskOption?.apiValue || formData.task_type,
            assigned_to:   formData.assigned_to,
            assigned_role: formData.assigned_role,
            priority:      formData.priority,
            due_date:      formData.due_date ? `${formData.due_date}T00:00:00` : undefined,
            description:   formData.description || undefined,
            created_by:    decodedToken?.preferred_username || 'admin',
        };

        if (isMatchReview) {
            const detail        = matchRecords?.[formData.match_result_id];
            payload.match_result_id = formData.match_result_id;
            payload.domain_code     = detail?.source_domain || 'CUST';
        } else {
            payload.entity_id   = formData.entity_id;
            const parts         = formData.entity_id?.split('-');
            payload.domain_code = parts?.[1] || 'CUST';
        }

        const result = await create(payload);
        if (!result.ok) toast.error(result.message || 'Failed to create task');
        else toast.success(result.data?.message || 'Task created successfully');
    };

    const handleClose = () => {
        setFormData(EMPTY_FORM);
        onClose();
    };

    const isValid =
        formData.task_type &&
        formData.assigned_to &&
        formData.priority &&
        formData.due_date &&
        (isMatchReview ? formData.match_result_id : formData.entity_id);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#00000099]"
            onClick={handleClose}
        >
            <div
                className="w-[690px] bg-white rounded-2xl border border-[#CCCCCC] mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-6 py-4 rounded-t-2xl bg-white shadow-[0px_4px_9px_0px_rgba(0,0,0,0.10)]">
                    <span className="text-lg font-medium text-[#282F49] font-[Satoshi,sans-serif]">
                        Create Stewardship Task
                    </span>
                    <button
                        onClick={handleClose}
                        className="bg-transparent border-none cursor-pointer p-1 text-[#818181] flex items-center hover:text-[#282F49] transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="px-6 py-5 grid grid-cols-2 gap-5 bg-white">

                    <div className="flex flex-col gap-1.5">
                        <label className={labelBase}>
                            Task Type <span className="text-[#E05252]">*</span>
                        </label>
                        <SearchableDropdown
                            value={formData.task_type}
                            onChange={handleTaskTypeChange}
                            options={TASK_TYPE_OPTIONS}
                            placeholder="Select"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        {isMatchReview ? (
                            <>
                                <label className={labelBase}>
                                    Match Result ID <span className="text-[#E05252]">*</span>
                                </label>
                                <MatchResultDropdown
                                    value={formData.match_result_id}
                                    onChange={set('match_result_id')}
                                    records={matchRecords}
                                    loading={matchLoading}
                                />
                            </>
                        ) : (
                            <>
                                <label className={labelBase}>
                                    Entity ID{formData.task_type && <span className="text-[#E05252]"> *</span>}
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter Entity ID"
                                    value={formData.entity_id}
                                    onChange={setRaw('entity_id')}
                                    disabled={!formData.task_type}
                                    className={`${inputBase} disabled:bg-[#F9F9F9] disabled:cursor-not-allowed`}
                                    style={{ height: '40px' }}
                                />
                            </>
                        )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className={labelBase}>
                            Assigned To <span className="text-[#E05252]">*</span>
                        </label>
                        <SearchableDropdown
                            value={formData.assigned_to}
                            onChange={handleAssignedToChange}
                            options={stewardOptions}
                            placeholder={stewardsLoading ? 'Loading...' : 'Select'}
                            disabled={stewardsLoading}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className={labelBase}>
                            Priority <span className="text-[#E05252]">*</span>
                        </label>
                        <SearchableDropdown
                            value={formData.priority}
                            onChange={set('priority')}
                            options={PRIORITY_OPTIONS}
                            placeholder="Select"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className={labelBase}>
                            Due Date <span className="text-[#E05252]">*</span>
                        </label>
                        <input
                            type="date"
                            value={formData.due_date}
                            onChange={setRaw('due_date')}
                            min={new Date().toISOString().split('T')[0]}
                            className={inputBase}
                            style={{ height: '40px', colorScheme: 'light' }}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5 col-span-2">
                        <label className={labelBase}>Description</label>
                        <textarea
                            rows={4}
                            placeholder="Describe the task requirements..."
                            value={formData.description}
                            onChange={setRaw('description')}
                            className={`${inputBase} resize-none leading-relaxed`}
                        />
                    </div>
                </div>

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
                        {isSubmitting ? 'Creating...' : 'Create Task'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddTaskModal;