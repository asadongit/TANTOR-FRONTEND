import React, { useState, useEffect, useMemo } from 'react';
import DataTable from '../../../../../../components/DataTable';
import EditIcon from '../../../../../../assets/mdm/edit.svg';

const StatusBadge = ({ status }) => {
    const isActive = status?.toLowerCase() === 'active';
    return (
        <span className={[
            'px-2 py-1 text-xs font-normal rounded inline-block',
            isActive ? 'text-[#069B68] bg-[#2AC79240]' : 'text-[#EF4D5F] bg-[#F276A74D]',
        ].join(' ')}>
            {isActive ? 'Active' : 'Inactive'}
        </span>
    );
};

const extractHours = (slaTarget) => {
    const match = String(slaTarget ?? '').match(/\d+(\.\d+)?/);
    return match ? match[0] : '';
};

const ConfigureSLAModal = ({
    isOpen,
    onClose,
    slaConfig,
    isLoading,
    isError,
    refetch,
    updateSLAConfig,
    isUpdating,
    updateError,
}) => {
    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState('');

    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            setEditingId(null);
            setEditValue('');
        }
    }, [isOpen]);

    const handleEditClick = (row) => {
        setEditingId(row.sla_id);
        setEditValue(extractHours(row.sla_target));
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditValue('');
    };

    const handleSave = async (row) => {
        try {
            await updateSLAConfig(row.sla_id, editValue);
            setEditingId(null);
            setEditValue('');
        } catch {
        }
    };

    const columns = useMemo(() => [
        {
            key: 'task_type_label',
            label: 'Task Type',
            render: (row) => (
                <span className="text-sm font-normal text-[#23252D]">{row.task_type_label}</span>
            ),
        },
        {
            key: 'sla_target',
            label: 'SLA Target',
            render: (row) => {
                const isEditing = editingId === row.sla_id;
                return isEditing ? (
                    <input
                        type="number"
                        min={1}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="border border-[#c4b5f4] rounded-md px-2 py-1 text-sm text-gray-700 w-24 focus:outline-none focus:ring-2 focus:ring-[#8e78b7]"
                        autoFocus
                    />
                ) : (
                    <span className="text-sm text-gray-600">{row.sla_target}</span>
                );
            },
        },
        {
            key: 'warning_at',
            label: 'Warning At',
            render: (row) => (
                <span className="text-sm text-gray-600">{row.warning_at}</span>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (row) => <StatusBadge status={row.status} />,
        },
        {
            key: 'actions',
            label: 'Actions',
            sortable: false,
            render: (row) => {
                const isEditing = editingId === row.sla_id;
                const isSaving = isUpdating && editingId === row.sla_id;

                return isEditing ? (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleSave(row)}
                            disabled={isSaving || !editValue}
                            title="Save"
                            className="p-1 rounded-full hover:bg-green-50 transition-colors disabled:opacity-40"
                        >
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
                                stroke="#098C60" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </button>
                        <button
                            onClick={handleCancel}
                            disabled={isSaving}
                            title="Cancel"
                            className="p-1 rounded-full hover:bg-red-50 transition-colors disabled:opacity-40"
                        >
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
                                stroke="#D01616" strokeWidth="2.5" strokeLinecap="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => handleEditClick(row)}
                        title="Edit"
                        className="flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] border-none cursor-pointer w-full"
                    >
                        <img src={EditIcon} alt="Edit" className="w-4 h-4" />
                    </button>
                );
            },
        },
    ], [editingId, editValue, isUpdating]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[500] flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-[790px] mx-4 flex flex-col"
                style={{ height: '90vh', maxHeight: '90vh', overflow: 'hidden' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-6 pt-5 flex-shrink-0">
                    <h2 className="text-lg font-medium text-[#282F49]">Configure SLA Settings</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1"
                    >
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
                            stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className="px-6 pt-3 flex-shrink-0">
                    <p className="text-base font-normal text-[#332849] bg-[#FAF8FF] rounded-lg px-3 py-2">
                        Define Service Level Agreements for different task types.
                    </p>
                </div>

                {updateError && (
                    <div className="px-6 pt-3 flex-shrink-0">
                        <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
                            {updateError}
                        </p>
                    </div>
                )}

                <div className="px-6 pb-6 overflow-y-auto min-h-0 flex-1">
                    <DataTable
                        columns={columns}
                        data={slaConfig}
                        isLoading={isLoading}
                        isError={isError}
                        refetch={refetch}
                        title=""
                    />
                </div>
            </div>
        </div>
    );
};

export default ConfigureSLAModal;