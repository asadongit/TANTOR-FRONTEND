import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../../../../../../context/AuthContext';
import { usePrefillGoldenRecord, useUpdateGoldenRecord } from '../../../../../../hooks/mdm/goldenRecords';

const inputClass =
    'w-full border border-[#CCCCCC] rounded-lg px-3.5 py-2.5 text-sm font-normal text-[#282F49] outline-none bg-white font-[Satoshi,sans-serif] leading-none box-border focus:border-[#8e78b7]';
const labelClass =
    'text-sm font-medium text-[#332849] font-[Satoshi,sans-serif] leading-none mb-1.5 block';
const STATUS_OPTIONS = ['Active', 'Inactive', 'Merged', 'Expired'];

const EditGoldenRecordModal = ({ isOpen, onClose, onSuccess, recordData }) => {
    const { decodedToken } = useAuth();
    const [formData, setFormData] = useState({});
    const [submitError, setSubmitError] = useState('');

    const { prefillData, isLoading: loadingPrefill, isError: prefillError, fetchPrefill } = usePrefillGoldenRecord();
    const { isSubmitting, updateGoldenRecord } = useUpdateGoldenRecord(() => {
        onSuccess?.();
        handleClose();
    });

    // Fetch prefill data when modal opens
    useEffect(() => {
        if (isOpen && recordData?.golden_id) {
            fetchPrefill(recordData.golden_id);
        }
    }, [isOpen, recordData?.golden_id]);

    // Populate form once prefill data arrives
    useEffect(() => {
        if (prefillData) {
            setFormData(prefillData);
        }
    }, [prefillData]);

    const handleChange = (key, value) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async () => {
        setSubmitError('');
        if (!formData['status']) {
        setSubmitError('Status is required');
        return;
    }
        const result = await updateGoldenRecord({
            golden_id: recordData.golden_id,
            data: {
                ...formData,
                updated_by: decodedToken?.preferred_username || 'SYSTEM',
            },
        });
        if (!result.ok) setSubmitError(result.message);
    };

    const handleClose = () => {
        setFormData({});
        setSubmitError('');
        onClose();
    };

    if (!isOpen) return null;

    const errorMessage = prefillError
        ? 'Failed to load record data'
        : submitError || '';

    const fields = Object.entries(formData);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={handleClose}
        >
            <div
                className="w-[690px] max-h-[90vh] bg-white rounded-2xl border border-[#CCCCCC] mx-4 flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between gap-4 px-6 py-4 rounded-t-2xl bg-white flex-shrink-0">
                    <span className="text-lg font-medium text-[#282F49] font-[Satoshi,sans-serif]">
                        Edit Golden Record
                        {recordData?.golden_id && (
                            <span className="ml-2 text-sm text-[#8E77BB] font-normal">
                                ({recordData.golden_id})
                            </span>
                        )}
                    </span>
                    <button
                        onClick={handleClose}
                        className="bg-transparent border-none cursor-pointer p-1 text-[#818181] flex items-center"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 pt-2 pb-6">
                    {loadingPrefill ? (
                        <div className="grid grid-cols-2 gap-5 pt-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="flex flex-col gap-1.5 animate-pulse">
                                    <div className="h-4 w-24 bg-gray-200 rounded" />
                                    <div className="h-10 bg-gray-100 rounded-lg" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-5 pt-4">
                            {fields.map(([key, value]) => {
                                const isReadOnly = ['golden_id', 'trust_score'].includes(key.toLowerCase());
                                const disabledClass = 'w-full border border-[#CCCCCC] rounded-lg px-3.5 py-2.5 text-sm font-normal text-[#AAAAAA] outline-none bg-[#F5F5F5] font-[Satoshi,sans-serif] leading-none box-border cursor-not-allowed';

                                return (
                                    <div key={key} className="flex flex-col gap-1.5">
                                        <label className={labelClass}>
                                            {key.toLowerCase() === 'status'
                                                ? <>Status <span className="text-[#E05252]">*</span></>
                                                : key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
                                            }
                                        </label>
                                        {key.toLowerCase() === 'status' ? (
                                            <select
                                                value={value ?? ''}
                                                onChange={(e) => handleChange(key, e.target.value)}
                                                className={inputClass}
                                                required
                                            >
                                                <option value="" disabled>Select status</option>
                                                {STATUS_OPTIONS.map((opt) => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type="text"
                                                placeholder={isReadOnly ? '-' : `Enter ${key.replace(/_/g, ' ')}`}
                                                value={value ?? ''}
                                                disabled={isReadOnly}
                                                onChange={(e) => !isReadOnly && handleChange(key, e.target.value)}
                                                className={isReadOnly ? disabledClass : inputClass}
                                            />
                                        )}
                                    </div>
                                );
                            })}

                            {errorMessage && (
                                <div className="col-span-2 text-sm text-[#E05252] bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 font-[Satoshi,sans-serif]">
                                    {errorMessage}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="h-[72px] flex items-center justify-end gap-4 px-6 rounded-b-2xl bg-white shadow-[0px_-4px_9px_0px_rgba(0,0,0,0.10)] flex-shrink-0">
                    <button
                        onClick={handleClose}
                        className="px-5 py-2.5 text-sm font-medium text-[#282F49] border border-[#CCCCCC] rounded-lg bg-white cursor-pointer font-[Satoshi,sans-serif]"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || loadingPrefill}
                        className={`px-5 py-2.5 text-sm font-medium text-white border-none rounded-lg font-[Satoshi,sans-serif] transition-colors
                            ${!isSubmitting && !loadingPrefill
                                ? 'bg-[#8e78b7] cursor-pointer hover:bg-[#7a67a0]'
                                : 'bg-[#CBC0E0] cursor-not-allowed'}`}
                    >
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditGoldenRecordModal;