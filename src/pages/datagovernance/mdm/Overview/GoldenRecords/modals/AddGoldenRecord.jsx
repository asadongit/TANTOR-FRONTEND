import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../../../../../../context/AuthContext';
import { useGoldenRecordAttributes, useCreateGoldenRecord } from '../../../../../../hooks/mdm/goldenRecords';

const inputClass =
    'w-full border border-[#CCCCCC] rounded-lg px-3.5 py-2.5 text-sm font-normal text-[#282F49] outline-none bg-white font-[Satoshi,sans-serif] leading-none box-border focus:border-[#8e78b7]';
const labelClass =
    'text-sm font-medium text-[#332849] font-[Satoshi,sans-serif] leading-none mb-1.5 block';
const STATUS_OPTIONS = ['Active', 'Inactive'];
const CreateGoldenRecordModal = ({ isOpen, onClose, onSuccess, domainId }) => {
    const { decodedToken } = useAuth();
    const [formData, setFormData] = useState({});
    const [submitError, setSubmitError] = useState('');

    const { attributes, isLoading: loadingAttrs, isError: attrError } = useGoldenRecordAttributes(domainId, isOpen);
    const { isSubmitting, createGoldenRecord } = useCreateGoldenRecord(() => {
        onSuccess?.();
        handleClose();
    });

    const handleChange = (attributeName, value) => {
        setFormData((prev) => ({ ...prev, [attributeName]: value }));
    };

    const handleSubmit = async () => {
        setSubmitError('');
    if (!formData['status']) {
        setSubmitError('Status is required');
        return;
    }
        const result = await createGoldenRecord({
            domain_id: domainId,
            data: {
                ...formData,
                created_by: decodedToken?.preferred_username || 'SYSTEM',
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

    const errorMessage = attrError
        ? 'Failed to load attributes'
        : submitError || '';

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
                        Create New Golden Record
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
                    {loadingAttrs ? (
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
                            {attributes.map((attr) => (
                                <div key={attr.attribute_id} className="flex flex-col gap-1.5">
                                    <label className={labelClass}>
                                        {attr.attribute_name
                                            .replace(/_/g, ' ')
                                            .replace(/\b\w/g, (c) => c.toUpperCase())}
                                    </label>
                                    <input
                                        type="text"
                                        placeholder={`Enter ${attr.attribute_name.replace(/_/g, ' ')}`}
                                        value={formData[attr.attribute_name] || ''}
                                        onChange={(e) => handleChange(attr.attribute_name, e.target.value)}
                                        className={inputClass}
                                    />
                                </div>
                            ))}
                            {/* Status Field - hardcoded */}
                            <div className="flex flex-col gap-1.5">
                                <label className={labelClass}>Status<span className="text-[#E05252]"> *</span></label>
                                <select
                                    value={formData['status'] || ''}
                                    onChange={(e) => handleChange('status', e.target.value)}
                                    className={inputClass}
                                >
                                    <option value="" disabled>Select status</option>
                                    {STATUS_OPTIONS.map((opt) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>

                            {errorMessage && (
                                <div className="col-span-2 text-sm text-[#E05252] bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 font-[Satoshi,sans-serif]">
                                    {errorMessage}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Attr load error when grid is empty */}
                    {!loadingAttrs && attributes.length === 0 && attrError && (
                        <div className="mt-4 text-sm text-[#E05252] bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 font-[Satoshi,sans-serif]">
                            Failed to load attributes
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
                        disabled={isSubmitting || loadingAttrs}
                        className={`px-5 py-2.5 text-sm font-medium text-white border-none rounded-lg font-[Satoshi,sans-serif] transition-colors
                            ${!isSubmitting && !loadingAttrs
                                ? 'bg-[#8e78b7] cursor-pointer hover:bg-[#7a67a0]'
                                : 'bg-[#CBC0E0] cursor-not-allowed'}`}
                    >
                        {isSubmitting ? 'Creating...' : 'Create Record'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateGoldenRecordModal;