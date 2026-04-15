import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../../../../../../context/AuthContext';
import { useEditDomain } from '../../../../../../hooks/mdm/domainManagement';

const inputClass =
    'w-full rounded-lg border border-[#CCCCCC] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-200 focus:border-[#8E77BB] transition-all font-[Satoshi,sans-serif] text-[#332849]';
const labelClass =
    'text-sm font-medium text-[#332849] font-[Satoshi,sans-serif] leading-none block';
const selectClass =
    `${inputClass} appearance-none bg-white pr-9`;

/* Inline chevron SVG as a bg-image (keeps native <select> accessible) */
const chevronBg = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23818181' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
};

const EditDomainModal = ({ isOpen, onClose, onComplete, domainData }) => {
    const { decodedToken } = useAuth();
    const [formData, setFormData] = useState({
        domainCode: '', domainName: '', domainType: '', status: '', description: '',
    });
    const [apiError, setApiError] = useState(null);

    const { isSubmitting, editDomain } = useEditDomain(onComplete);

    useEffect(() => {
        if (domainData) {
            setFormData({
                domainCode:   domainData.domainCode || '',
                domainName:   domainData.domainName || '',
                domainType:   domainData.type || '',
                status:       domainData.status || '',
                description:  domainData.description ||
                    'Master domain for all customer entities including individuals, corporates, and trusts.',
            });
        }
    }, [domainData]);

    if (!isOpen) return null;

    const handleChange = (field, value) => { setApiError(null); setFormData((p) => ({ ...p, [field]: value })); };

    const handleSubmit = async () => {
        setApiError(null);
        const result = await editDomain({
            domain_id:   domainData?.id,
            domain_name: formData.domainName,
            domain_type: formData.domainType,
            status:      formData.status,
            description: formData.description,
            updated_by:  decodedToken?.preferred_username,
        });
        if (result.ok) {
            onClose();
        } else {
            setApiError(result.message);
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-50 bg-black/60" onClick={onClose} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-[700px] shadow-xl" onClick={(e) => e.stopPropagation()}>

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 pt-6 pb-4">
                        <div className="flex items-center gap-1">
                            <span className="font-medium text-lg text-[#282F49] font-[Satoshi,sans-serif]">
                                Edit Domain Configuration —&nbsp;
                            </span>
                            <span className="font-medium text-lg text-[#8E77BB] font-[Satoshi,sans-serif]">
                                {domainData?.domainName || 'Product Master'}
                            </span>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Form */}
                    <div className="px-6 py-5 flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className={labelClass}>Domain Code</label>
                                <input
                                    type="text"
                                    value={formData.domainCode}
                                    readOnly
                                    disabled
                                    className="w-full rounded-lg border border-[#CCCCCC] px-3 py-2 text-sm outline-none bg-[#F5F5F5] text-[#888888] cursor-not-allowed font-[Satoshi,sans-serif]"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className={labelClass}>Domain Name <span className="text-[#EF4D5F]">*</span></label>
                                <input type="text" value={formData.domainName} onChange={(e) => handleChange('domainName', e.target.value)} className={inputClass} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className={labelClass}>Domain Type <span className="text-[#EF4D5F]">*</span></label>
                                <select value={formData.domainType} onChange={(e) => handleChange('domainType', e.target.value)} className={selectClass} style={chevronBg}>
                                    <option value="">Select type</option>
                                    <option value="PARTY">PARTY</option>
                                    <option value="INSTRUMENT">INSTRUMENT</option>
                                    <option value="REFERENCE">REFERENCE</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className={labelClass}>Status <span className="text-[#EF4D5F]">*</span></label>
                                <select value={formData.status} onChange={(e) => handleChange('status', e.target.value)} className={selectClass} style={chevronBg}>
                                    <option value="">Select status</option>
                                    <option value="Active">Active</option>
                                    <option value="Draft">Draft</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className={labelClass}>Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                rows={4}
                                className="w-full rounded-lg border border-[#CCCCCC] py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-purple-200 focus:border-[#8E77BB] transition-all resize-none font-[Satoshi,sans-serif] text-[#332849]"
                            />
                        </div>

                        {apiError && (
                            <p className="text-[13px] text-[#EF4D5F] font-[Satoshi,sans-serif]">{apiError}</p>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 px-6 py-4 rounded-b-2xl bg-white shadow-[0px_-4px_9px_0px_rgba(0,0,0,0.1)]">
                        <button onClick={onClose} disabled={isSubmitting} className="px-5 py-2 rounded-lg border border-[#8E77BB] text-sm font-medium text-[#8E77BB] bg-white hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-[Satoshi,sans-serif]">
                            Cancel
                        </button>
                        <button onClick={handleSubmit} disabled={isSubmitting} className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-[#8E77BB] hover:bg-[#7a67a0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed font-[Satoshi,sans-serif]">
                            {isSubmitting ? 'Updating...' : 'Update Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default EditDomainModal;