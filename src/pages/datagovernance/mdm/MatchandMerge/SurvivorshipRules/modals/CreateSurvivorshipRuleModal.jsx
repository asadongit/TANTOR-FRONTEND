import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../../../../context/AuthContext';
import { useDomains, useAttributes, useCreateSurvivorshipRule } from '../../../../../../hooks/mdm/survivorshipRules';

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
            className={`${inputBase} appearance-none pr-9 disabled:bg-[#F9F9F9] disabled:cursor-not-allowed ${!value ? 'text-[#A0AEC0]' : 'text-[#282F49]'
                }`}
        >
            <option value="" disabled>{placeholder || 'Select'}</option>
            {children}
        </select>
        <ChevronIcon />
    </div>
);

const STRATEGIES = [
    { value: 'LONGEST_VALUE', label: 'LONGEST_VALUE' },
    { value: 'MOST_TRUSTED', label: 'MOST_TRUSTED' },
    { value: 'MOST_COMPLETE', label: 'MOST_COMPLETE' },
    { value: 'MOST_RECENT', label: 'MOST_RECENT' },
    { value: 'SOURCE_PRIORITY', label: 'SOURCE_PRIORITY' },
    { value: 'MAX_VALUE', label: 'MAX_VALUE' },
];

const FALLBACK_STRATEGIES = [
    { value: 'LONGEST_VALUE', label: 'LONGEST_VALUE' },
    { value: 'MOST_TRUSTED', label: 'MOST_TRUSTED' },
    { value: 'MOST_COMPLETE', label: 'MOST_COMPLETE' },
    { value: 'MOST_RECENT', label: 'MOST_RECENT' },
    { value: 'SOURCE_PRIORITY', label: 'SOURCE_PRIORITY' },
    { value: 'MAX_VALUE', label: 'MAX_VALUE' },
];

const EMPTY_FORM = {
    domain_id: '',
    attribute_id: '',
    attribute_name: '',
    primary_strategy: '',
    fallback_strategy: '',
    custom_expression: '',
};

const CreateSurvivorshipRuleModal = ({ isOpen, onClose, onSuccess }) => {
    const { decodedToken } = useAuth();

    const [formData, setFormData] = useState(EMPTY_FORM);

    const { domains, loading: domainsLoading } = useDomains(isOpen);
    const { attributes, loading: attributesLoading } = useAttributes(formData.domain_id, isOpen);

    const { isSubmitting, create } = useCreateSurvivorshipRule(async () => {
        onSuccess?.();
        handleClose();
    });

    useEffect(() => {
        if (!isOpen) setFormData(EMPTY_FORM);
    }, [isOpen]);

    const set = (key) => (e) =>
        setFormData((prev) => ({ ...prev, [key]: e.target.value }));

    const handleDomainChange = (e) =>
        setFormData((prev) => ({
            ...prev,
            domain_id: e.target.value,
            attribute_id: '',
            attribute_name: '',
        }));

    const handleAttributeChange = (e) => {
        const selected = attributes.find((a) => a.attribute_id === parseInt(e.target.value, 10));
        setFormData((prev) => ({
            ...prev,
            attribute_id: selected?.attribute_id || '',
            attribute_name: selected?.attribute_name || '',
        }));
    };

    const handleSubmit = async () => {
        const result = await create({
            domain_id: formData.domain_id,
            attribute_id: formData.attribute_id,
            attribute_name: formData.attribute_name,
            primary_strategy: formData.primary_strategy,
            fallback_strategy: formData.fallback_strategy,
            created_by: decodedToken?.preferred_username,
            custom_expression: formData.custom_expression || null,
        });
        if (!result.ok) toast.error(result.message);
        else toast.success(result.data?.message || 'Rule created successfully');
    };

    const handleClose = () => {
        setFormData(EMPTY_FORM);
        onClose();
    };

    const isValid = formData.domain_id && formData.attribute_id && formData.primary_strategy;

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-50 bg-black/40"  />
            <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                <div className="w-[560px] bg-white rounded-2xl border border-[#CCCCCC] mx-4 pointer-events-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 rounded-t-2xl bg-white shadow-[0px_4px_9px_0px_rgba(0,0,0,0.10)]">
                    <span className="text-lg font-medium text-[#282F49] font-[Satoshi,sans-serif]">
                        Create Survivorship Rule
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
                    {/* Domain */}
                    <div className="flex flex-col gap-1.5">
                        <label className={labelBase}>
                            Domain <span className="text-[#E05252]">*</span>
                        </label>
                        <SelectField
                            value={formData.domain_id}
                            onChange={handleDomainChange}
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

                    {/* Attribute */}
                    <div className="flex flex-col gap-1.5">
                        <label className={labelBase}>
                            Attribute <span className="text-[#E05252]">*</span>
                        </label>
                        <SelectField
                            value={formData.attribute_id}
                            onChange={handleAttributeChange}
                            placeholder={
                                !formData.domain_id
                                    ? 'Select domain first'
                                    : attributesLoading
                                        ? 'Loading...'
                                        : 'Select'
                            }
                            disabled={!formData.domain_id || attributesLoading}
                        >
                            {attributes.map((a) => (
                                <option key={a.attribute_id} value={a.attribute_id}>
                                    {a.display_name}
                                </option>
                            ))}
                        </SelectField>
                    </div>

                    {/* Primary Strategy */}
                    <div className="flex flex-col gap-1.5">
                        <label className={labelBase}>
                            Primary Strategy <span className="text-[#E05252]">*</span>
                        </label>
                        <SelectField
                            value={formData.primary_strategy}
                            onChange={set('primary_strategy')}
                            placeholder="Select"
                        >
                            {STRATEGIES.map((s) => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </SelectField>
                    </div>

                    {/* Fallback Strategy */}
                    <div className="flex flex-col gap-1.5">
                        <label className={labelBase}>Fallback Strategy</label>
                        <SelectField
                            value={formData.fallback_strategy}
                            onChange={set('fallback_strategy')}
                            placeholder="Select"
                        >
                            {FALLBACK_STRATEGIES.map((s) => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </SelectField>
                    </div>

                    {/* Source Priority */}
                    <div className="flex flex-col gap-1.5 col-span-2">
                        <label className={labelBase}>Source Priority</label>
                        <textarea
                            rows={4}
                            placeholder="Describe the Source Priority"
                            value={formData.custom_expression}
                            onChange={set('custom_expression')}
                            className={`${inputBase} resize-none leading-relaxed`}
                        />
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
                        {isSubmitting ? 'Creating...' : 'Create Rule'}
                    </button>
                </div>
            </div>
        </div>
            </>
    );

};

export default CreateSurvivorshipRuleModal;