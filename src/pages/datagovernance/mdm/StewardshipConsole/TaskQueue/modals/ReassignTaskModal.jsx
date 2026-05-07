import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../../../../context/AuthContext';
import SearchableDropdown from '../../../components/SearchableDropdown';
import { useStewards } from '../../../../../../hooks/mdm/reviewQueue';
import { useReassignTasks } from '../../../../../../hooks/mdm/taskQueue.jsx';

const inputClass =
    'w-full border border-[#CCCCCC] rounded-lg px-3.5 py-2.5 text-sm font-normal text-[#282F49] outline-none bg-white font-[Satoshi,sans-serif] leading-none box-border focus:border-[#8e78b7]';
const labelClass =
    'text-sm font-medium text-[#332849] font-[Satoshi,sans-serif] leading-none mb-1.5 block';

const ASSIGNMENT_METHOD_OPTIONS = [
    { value: 'Manual', label: 'Manual' },
];

const PRIORITY_OPTIONS = [
    { value: 'High',   label: 'High'   },
    { value: 'Medium', label: 'Medium' },
    { value: 'Low',    label: 'Low'    },
];

const EMPTY_FORM = {
    assigned_to:       '',
    assignment_method: 'MANUAL',
    assigned_role:     '',
    priority:          '',
    due_date:          '',
    notes:             '',
};

const ReassignTaskModal = ({
    isOpen,
    onClose,
    onSuccess,
    isBulk = false,
    row = null,
    selectedRows = new Set(),
    tableData = [],
}) => {
    const { decodedToken } = useAuth();
    const { stewardOptions } = useStewards(isOpen);
    const { isSubmitting, reassign } = useReassignTasks();

    const [formData, setFormData] = useState(EMPTY_FORM);

    useEffect(() => {
        if (!isOpen) setFormData(EMPTY_FORM);
    }, [isOpen]);

    const handleClose = () => {
        setFormData(EMPTY_FORM);
        onClose();
    };

    const handleSubmit = async () => {
        const taskIds = isBulk
            ? tableData.filter((r) => selectedRows.has(r.actual_task_id)).map((r) => r.actual_task_id)
            : [row.actual_task_id];  // ← make sure row has actual_task_id not task_id

        const payload = {
            task_ids:      taskIds,
            assigned_to:   formData.assigned_to,
            assigned_role: formData.assigned_role || undefined,
            priority:      formData.priority      || undefined,
            due_date:      formData.due_date      || undefined,
            notes:         formData.notes         || undefined,
            updated_by:    decodedToken?.preferred_username,
        };

        const { ok, data, message } = await reassign(payload);
        if (ok) {
            toast.success(data?.message || 'Task(s) reassigned successfully');
            onSuccess?.();
            handleClose();
        } else {
            toast.error(message || 'Something went wrong');
        }
    };

    const isValid = formData.assigned_to;
    const bulkCount = selectedRows.size;

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={handleClose}
        >
            <div
                className="w-[690px] bg-white rounded-2xl border border-[#CCCCCC] mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 rounded-t-2xl bg-white">
                    <span className="text-lg font-medium text-[#282F49] font-[Satoshi,sans-serif]">
                        {isBulk ? 'Bulk Assign' : 'Reassign Task'}
                    </span>
                    <button
                        onClick={handleClose}
                        className="bg-transparent border-none cursor-pointer p-1 text-[#818181] flex items-center"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Bulk banner */}
                {isBulk && (
                    <div className="mx-6 px-3 py-2 rounded-lg bg-[#FAF8FF]">
                        <p className="text-sm font-normal text-[#332849] font-[Satoshi,sans-serif]">
                            You have selected{' '}
                            <span className="font-medium text-[#8e78b7]">
                                {bulkCount} task{bulkCount !== 1 ? 's' : ''}
                            </span>{' '}
                            for bulk assignment.
                        </p>
                    </div>
                )}

                {/* Form */}
                <div className={`px-6 grid grid-cols-2 gap-5 bg-white ${isBulk ? 'py-4' : 'py-5'}`}>

                    {/* Assignment Method */}
                    <div className="flex flex-col gap-1.5">
                        <label className={labelClass}>Assignment Method</label>
                        <SearchableDropdown
                            value={formData.assignment_method}
                            onChange={(v) => setFormData((p) => ({ ...p, assignment_method: v }))}
                            options={ASSIGNMENT_METHOD_OPTIONS}
                            placeholder="Select"
                        />
                    </div>

                    {/* Assign To */}
                    <div className="flex flex-col gap-1.5">
                        <label className={labelClass}>
                            Assign To <span className="text-[#E05252]">*</span>
                        </label>
                        <SearchableDropdown
                            value={formData.assigned_to}
                            onChange={(v) => setFormData((p) => ({ ...p, assigned_to: v }))}
                            options={stewardOptions}
                            placeholder="Select"
                        />
                    </div>

                    {/* Priority */}
                    <div className="flex flex-col gap-1.5">
                        <label className={labelClass}>Priority</label>
                        <SearchableDropdown
                            value={formData.priority}
                            onChange={(v) => setFormData((p) => ({ ...p, priority: v }))}
                            options={PRIORITY_OPTIONS}
                            placeholder="Select"
                        />
                    </div>

                    {/* Due Date */}
                    <div className="flex flex-col gap-1.5">
                        <label className={labelClass}>Due Date</label>
                        <input
                            type="date"
                            value={formData.due_date}
                            onChange={(e) => setFormData((p) => ({ ...p, due_date: e.target.value }))}
                            className={`${inputClass} h-10`}
                        />
                    </div>

                    {/* Notes */}
                    <div className="flex flex-col gap-1.5 col-span-2">
                        <label className={labelClass}>Notes</label>
                        <textarea
                            rows={4}
                            placeholder="Add any notes for the assignee.."
                            value={formData.notes}
                            onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                            className={`${inputClass} resize-none leading-relaxed`}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="h-[68px] flex items-center justify-end gap-3 px-6 rounded-b-2xl bg-white shadow-[0px_-4px_9px_0px_rgba(0,0,0,0.08)]">
                    <button
                        onClick={handleClose}
                        className="px-5 py-2.5 text-sm font-medium text-[#8e78b7] border border-[#8e78b7] rounded-lg bg-white cursor-pointer font-[Satoshi,sans-serif]"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!isValid || isSubmitting}
                        className={`px-5 py-2.5 text-sm font-medium text-white border-none rounded-lg font-[Satoshi,sans-serif] transition-colors
                            ${isValid && !isSubmitting
                                ? 'bg-[#8e78b7] cursor-pointer hover:bg-[#7a67a0]'
                                : 'bg-[#CBC0E0] cursor-not-allowed'
                            }`}
                    >
                        {isSubmitting ? 'Assigning...' : 'Assign'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReassignTaskModal;