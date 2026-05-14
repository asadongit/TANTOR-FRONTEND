import React, { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import InfoIcon from '../../../../../../assets/mdm/info.svg';
import { useAuth } from '../../../../../../context/AuthContext';
import SearchableDropdown from '../../../components/SearchableDropdown';
import { useDomains, useCreateRelationshipType } from '../../../../../../hooks/mdm/crossDomainLink';

const inputClass =
    'w-full border border-[#CCCCCC] rounded-lg px-3.5 py-2.5 text-sm font-normal text-[#282F49] outline-none bg-white font-[Satoshi,sans-serif] leading-none box-border focus:border-[#8e78b7]';
const labelClass =
    'text-sm font-medium text-[#332849] font-[Satoshi,sans-serif] leading-none mb-1.5 block';

const CARDINALITY_OPTIONS = [
    { value: '1:N', label: '1:N' },
    { value: 'N:1', label: 'N:1' },
    { value: '1:1', label: '1:1' },
    { value: 'M:N', label: 'M:N' },
];

const MANDATORY_OPTIONS = [
    { value: 'true',  label: 'Yes' },
    { value: 'false', label: 'No'  },
];

const CreateRelationshipTypeModal = ({ isOpen, onClose, onSuccess }) => {
    const { decodedToken } = useAuth();
    const { domains, loading: domainsLoading } = useDomains(isOpen);

    const [formData, setFormData] = useState({
        type_code:        '',
        description:      '',
        source_domain_id: '',
        target_domain_id: '',
        cardinality:      '',
        is_mandatory:     '',
    });

    const { isSubmitting, create } = useCreateRelationshipType((data) => {
        toast.success(data?.message || 'Relationship type created successfully');
        onSuccess?.();
        handleClose();
    });

    const domainOptions = domainsLoading
        ? [{ value: '', label: 'Loading…' }]
        : domains.map(d => ({ value: d.domain_id, label: d.domain_name }));

    const handleClose = () => {
        setFormData({
            type_code:        '',
            description:      '',
            source_domain_id: '',
            target_domain_id: '',
            cardinality:      '',
            is_mandatory:     '',
        });
        onClose();
    };

    const handleSubmit = async () => {
        const result = await create({
            type_code:        formData.type_code,
            description:      formData.description,
            source_domain_id: formData.source_domain_id,
            target_domain_id: formData.target_domain_id,
            cardinality:      formData.cardinality,
            is_mandatory:     formData.is_mandatory === 'true',
            created_by:       decodedToken?.preferred_username || 'admin',
        });
        if (!result.ok) toast.error(result.message || 'Something went wrong');
    };

    const set = (key) => (v) => setFormData(prev => ({ ...prev, [key]: v }));

    const isValid =
        formData.type_code.trim() &&
        formData.description.trim() &&
        formData.source_domain_id &&
        formData.target_domain_id &&
        formData.cardinality &&
        formData.is_mandatory !== '';

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        >
            <div
                className="w-[690px] bg-white rounded-2xl border border-[#CCCCCC] mx-4"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 rounded-t-2xl bg-white shadow-[0px_4px_9px_0px_rgba(0,0,0,0.10)]">
                    <span className="text-lg font-medium text-[#282F49] font-[Satoshi,sans-serif]">
                        Create New Relationship Type
                    </span>
                    <button
                        onClick={handleClose}
                        className="bg-transparent border-none cursor-pointer p-1 text-[#818181] flex items-center"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-3 flex flex-col gap-5 bg-white">

                    {/* Info banner */}
                    <div className="flex items-start gap-2 rounded-lg px-4 py-3 bg-[#FAF8FF]">
                        <img src={InfoIcon} alt="info" className="w-4 h-4 mt-1 flex-shrink-0" />
                        <p className="text-[#8E77BB] text-base font-normal m-0 leading-snug font-[Satoshi,sans-serif]">
                            Define a new type of relationship between two domains. Once created, users can
                            create links of this type via "+ New Link".
                        </p>
                    </div>

                    {/* Type Code */}
                    <div className="flex flex-col gap-1.5 w-[313px]">
                        <label className={labelClass}>
                            Type Code <span className="text-[#E05252]">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Enter Type Code"
                            value={formData.type_code}
                            onChange={e => setFormData(prev => ({ ...prev, type_code: e.target.value }))}
                            className={inputClass}
                        />
                        <span className="text-xs text-[#818181] font-[Satoshi,sans-serif]">
                            Unique identifier for this type
                        </span>
                    </div>

                    {/* Description */}
                    <div className="flex flex-col gap-1.5">
                        <label className={labelClass}>
                            Description <span className="text-[#E05252]">*</span>
                        </label>
                        <textarea
                            rows={2}
                            placeholder="Description"
                            value={formData.description}
                            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            className={`${inputClass} resize-none leading-relaxed`}
                        />
                    </div>

                    {/* From Domain / To Domain */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className={labelClass}>
                                From Domain <span className="text-[#E05252]">*</span>
                            </label>
                            <SearchableDropdown
                                value={formData.source_domain_id}
                                onChange={set('source_domain_id')}
                                options={domainOptions}
                                placeholder="Select"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className={labelClass}>
                                To Domain <span className="text-[#E05252]">*</span>
                            </label>
                            <SearchableDropdown
                                value={formData.target_domain_id}
                                onChange={set('target_domain_id')}
                                options={domainOptions}
                                placeholder="Select"
                            />
                        </div>
                    </div>

                    {/* Cardinality / Is Mandatory */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className={labelClass}>
                                Cardinality <span className="text-[#E05252]">*</span>
                            </label>
                            <SearchableDropdown
                                value={formData.cardinality}
                                onChange={set('cardinality')}
                                options={CARDINALITY_OPTIONS}
                                placeholder="Select"
                            />
                            <span className="text-xs text-[#818181] font-[Satoshi,sans-serif]">
                                How many records on each side
                            </span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className={labelClass}>Is this mandatory?</label>
                            <SearchableDropdown
                                value={formData.is_mandatory}
                                onChange={set('is_mandatory')}
                                options={MANDATORY_OPTIONS}
                                placeholder="Select"
                            />
                        </div>
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
                        className={`px-5 py-2.5 text-sm font-medium text-white border-none rounded-lg font-[Satoshi,sans-serif]
                            ${isValid && !isSubmitting
                                ? 'bg-[#8e78b7] cursor-pointer hover:bg-[#7a67a0]'
                                : 'bg-[#CBC0E0] cursor-not-allowed'
                            }`}
                    >
                        {isSubmitting ? 'Creating…' : 'Create Type'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateRelationshipTypeModal;