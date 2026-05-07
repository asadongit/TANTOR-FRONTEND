import React from 'react';
import { X, Clock } from 'lucide-react';
import { useTaskQueueDetail } from '../../../../../../hooks/mdm/taskQueue';

const formatDate = (isoStr) => {
    if (!isoStr) return '—';
    return new Date(isoStr).toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
    });
};

const formatTime = (isoStr) => {
    if (!isoStr) return null;
    return new Date(isoStr).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
};

const formatLabel = (str) => {
    if (!str) return '—';
    return str.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
};

const TimeChip = ({ time }) => (
    <span className="inline-flex items-center gap-1 text-xs text-[#818181] rounded-full px-2.5 py-0.5 border border-[#CCCCCC]">
        <Clock className="w-3 h-3" />
        {time}
    </span>
);

const StatusBadge = ({ status }) => {
    const map = {
        'IN PROGRESS': { color: '#E08E40', bg: 'rgba(255,201,63,0.25)' },
        PENDING:       { color: '#E08E40', bg: 'rgba(255,201,63,0.25)' },
        COMPLETED:     { color: '#069B68', bg: 'rgba(42,199,146,0.25)' },
        OVERDUE:       { color: '#EF4D5F', bg: 'rgba(242,118,167,0.30)' },
    };
    const key = status?.toUpperCase() ?? '';
    const style = map[key] || { color: '#6B7280', bg: '#F3F4F6' };
    const label = status
        ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase().replace('_', ' ')
        : '—';
    return (
        <span className="inline-block rounded-md px-2.5 py-1 text-xs font-normal whitespace-nowrap"
              style={{ color: style.color, backgroundColor: style.bg }}>
            {label}
        </span>
    );
};

const PriorityBadge = ({ priority }) => {
    const map = {
        Critical: { color: '#EF4D5F', bg: 'rgba(242,118,167,0.3)' },
        High:     { color: '#EF4D5F', bg: 'rgba(242,118,167,0.3)' },
        Medium:   { color: '#E08E40', bg: 'rgba(255,201,63,0.25)' },
        Low:      { color: '#069B68', bg: 'rgba(42,199,146,0.25)' },
    };
    const style = map[priority] || { color: '#6B7280', bg: '#F3F4F6' };
    return (
        <span className="inline-block rounded-md px-2.5 py-1 text-xs font-normal whitespace-nowrap"
              style={{ color: style.color, backgroundColor: style.bg }}>
            {priority}
        </span>
    );
};

const InfoRow = ({ label, children }) => (
    <div className="flex items-center justify-between py-2.5">
        <span className="text-sm text-[#818181] min-w-[110px]">{label}</span>
        <div className="flex items-center justify-end flex-1 text-right">{children}</div>
    </div>
);

const TaskDetailSidebar = ({ taskId, taskLabel, onClose }) => {
    const { data, isLoading, isError, fetchDetail } = useTaskQueueDetail(taskId);

    const info        = data?.basic_info ?? {};
    const description = data?.description ?? '';
    const activityLog = data?.activity_log ?? [];

    return (
        <>
            <div className="fixed inset-0 z-30" onClick={onClose} />

            <div className="fixed top-16 bottom-0 right-0 z-40 w-[800px] bg-white flex flex-col shadow-[-8px_0px_10px_0px_rgba(0,0,0,0.1)] overflow-hidden">
                <div className="flex items-center justify-between px-6 py-[18px] bg-white border-b border-[#CCCCCC] shrink-0">
                    <span className="text-[18px] font-medium text-[#332849] leading-none">
                        {taskLabel ?? `Task #${taskId}`}
                    </span>
                    <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 transition-colors">
                        <X size={20} className="text-[#818181]" />
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-7 h-7 border-2 border-[#8E77BB] border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm text-[#818181]">Loading task details…</span>
                        </div>
                    </div>
                ) : isError ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <span className="text-sm text-[#EF4D5F]">Failed to load task details.</span>
                            <button onClick={fetchDetail} className="text-sm text-[#8E77BB] underline">
                                Retry
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">

                        <section className='bg-[#FAFAFA] p-3'>
                            <h2 className="text-base font-medium text-[#332849]">Basic Information</h2>
                            <div
                                className="grid grid-cols-2 rounded-lg overflow-hidden"
                            >
                                <div
                                    className="flex flex-col pr-4 py-2  border-r border-[#CCCCCC]"
                                >
                                    <InfoRow label="Task ID">
                                        <span className="text-sm font-normal text-[#332849]">{taskLabel ?? `#${taskId}`}</span>
                                    </InfoRow>
                                    <InfoRow label="Entity ID">
                                        <span className="text-sm font-normal text-[#332849]">{info.entity_id ?? '—'}</span>
                                    </InfoRow>
                                    <InfoRow label="Assigned To">
                                        <span className="text-sm font-normal text-[#332849]">{info.assigned_to ?? '—'}</span>
                                    </InfoRow>
                                    <InfoRow label="Type">
                                        <span className="text-sm font-normal text-[#332849]">{formatLabel(info.task_type)}</span>
                                    </InfoRow>
                                </div>

                                <div className="flex flex-col px-4 py-1">
                                    <InfoRow label="Created">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-normal text-[#332849]">{formatDate(info.assigned_date)}</span>
                                            {formatTime(info.assigned_date) && (
                                                <TimeChip time={formatTime(info.assigned_date)} />
                                            )}
                                        </div>
                                    </InfoRow>
                                    <InfoRow label="Status">
                                        <StatusBadge status={info.status} />
                                    </InfoRow>
                                    <InfoRow label="Priority">
                                        {info.priority
                                            ? <PriorityBadge priority={info.priority} />
                                            : <span className="text-sm text-[#332849]">—</span>}
                                    </InfoRow>
                                    <InfoRow label="Due Date">
                                        {info.due_date ? (
                                            <span
                                                className="text-sm font-normal text-[#332849]"
                                            >
                                                {formatDate(info.due_date)}
                                            </span>
                                        ) : (
                                            <span className="text-sm text-[#332849]">—</span>
                                        )}
                                    </InfoRow>
                                </div>
                            </div>
                        </section>

                        <section className='bg-[#FAFAFA] p-3'>
                            <h2 className="text-base font-medium text-[#332849] mb-3">Task Description</h2>
                                <p className="text-base font-normal text-[#818181] leading-relaxed">
                                    {description || <span className="text-[#A0AEC0]">No description provided.</span>}
                                </p>
                        </section>

                        <section>
                            <h2 className="text-base font-medium text-[#332849] mb-3">Activity Log</h2>
                            <div className="border border-[#F3F4F6] rounded-lg overflow-hidden">
                                {activityLog.length === 0 ? (
                                    <div className="px-4 py-6 text-center text-sm text-[#A0AEC0]">
                                        No activity recorded yet.
                                    </div>
                                ) : (
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-[#FAFAFA] border-b border-[#F3F4F6]">
                                                <th className="text-left text-xs font-medium text-[#818181] px-4 py-3 w-[40%]">Timestamp</th>
                                                <th className="text-left text-xs font-medium text-[#818181] px-4 py-3 w-[25%]">User</th>
                                                <th className="text-left text-xs font-medium text-[#818181] px-4 py-3">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {activityLog.map((entry, i) => (
                                                <tr key={i} className={i < activityLog.length - 1 ? 'border-b border-[#F3F4F6]' : ''}>
                                                    <td className="py-3 px-4 align-top">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-sm text-[#818181]">{formatDate(entry.timestamp)}</span>
                                                            {formatTime(entry.timestamp) && (
                                                                <TimeChip time={formatTime(entry.timestamp)} />
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 align-top">
                                                        <span className="text-sm text-[#332849]">{entry.user ?? '—'}</span>
                                                    </td>
                                                    <td className="py-3 px-4 align-top">
                                                        <span className="text-sm text-[#332849]">{entry.action ?? '—'}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </section>
                    </div>
                )}

            </div>
        </>
    );
};

export default TaskDetailSidebar;