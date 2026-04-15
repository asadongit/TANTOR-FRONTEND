// ─── EditRuleModal.jsx ────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { X, ChevronLeft } from 'lucide-react';
import { useAuth } from '../../../../../../context/AuthContext';
import {
    useEditRule,
    useValidationTypes,
    useAttributesByDomain,
} from '../../../../../../hooks/mdm/domainManagement';

const inputClass =
    'w-full border border-[#CCCCCC] rounded-lg px-3.5 py-2.5 text-sm font-normal text-[#282F49] outline-none bg-white font-[Satoshi,sans-serif] leading-none box-border focus:border-[#8e78b7]';
const labelClass =
    'text-sm font-medium text-[#282F49] font-[Satoshi,sans-serif] leading-none mb-1.5 block';

const ChevronIcon = () => (
    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#818181]">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
    </div>
);

const SelectField = ({ value, onChange, children, placeholder }) => (
    <div className="relative">
        <select
            value={value}
            onChange={onChange}
            className={`${inputClass} appearance-none pr-9 ${value ? 'text-[#282F49]' : 'text-[#A0AEC0]'}`}
        >
            <option value="" disabled>{placeholder || 'Select'}</option>
            {children}
        </select>
        <ChevronIcon />
    </div>
);

const AttrSearchDropdown = ({ attributes, selectedAttrs, onToggle }) => {
    const [search, setSearch] = useState('');
    const [open, setOpen]     = useState(false);

    const filtered = attributes.filter(
        (a) =>
            a.attribute_name.toLowerCase().includes(search.toLowerCase()) ||
            a.display_name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="relative">
            <input
                type="text"
                placeholder="Search attribute..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
                onFocus={() => setOpen(true)}
                className={`${inputClass} pr-9`}
            />
            <ChevronIcon />
            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute top-full left-0 right-0 z-20 bg-white border border-[#CCCCCC] rounded-lg shadow-lg max-h-[200px] overflow-y-auto mt-1">
                        {filtered.length === 0 ? (
                            <div className="px-3.5 py-2.5 text-sm text-[#818181]">No attributes found</div>
                        ) : (
                            filtered.map((a) => {
                                const isSelected = selectedAttrs.find((s) => s.attribute_id === a.attribute_id);
                                return (
                                    <div
                                        key={a.attribute_id}
                                        onClick={() => onToggle(a)}
                                        className={`flex items-center gap-2.5 px-3.5 py-2.5 text-sm cursor-pointer font-normal
                                            ${isSelected ? 'bg-[#F3EFFF] text-[#8e78b7]' : 'text-[#282F49] hover:bg-[#F3EFFF]'}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={!!isSelected}
                                            onChange={() => {}}
                                            className="accent-[#8E77BB] w-3.5 h-3.5 cursor-pointer"
                                        />
                                        <span>{a.display_name}</span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export const EditRuleModal = ({ isOpen, onClose, domainId, ruleData, onComplete }) => {
    const { decodedToken } = useAuth();
    const [form, setForm]           = useState({ rule_name: '', rule_type: '', expression: '', severity: '', status: '' });
    const [selectedAttrs, setSelectedAttrs] = useState([]);
    const [error, setError]         = useState('');

    const { validationTypes }   = useValidationTypes(isOpen);
    const { attributes }        = useAttributesByDomain(domainId, isOpen);
    const { isSubmitting, editRule } = useEditRule();

    useEffect(() => {
        if (!ruleData) return;
        setForm({
            rule_name:  ruleData.rule_name || '',
            rule_type:  ruleData.validation_type || '',
            expression: ruleData.expression || '',
            severity:   ruleData.severity || '',
            status:     ruleData.status ? 'true' : 'false',
        });
    }, [ruleData]);

    if (!isOpen) return null;

    const handleChange    = (field, value) => setForm((p) => ({ ...p, [field]: value }));
    const handleAttrToggle = (attr) =>
        setSelectedAttrs((prev) => {
            const exists = prev.find((a) => a.attribute_id === attr.attribute_id);
            return exists ? prev.filter((a) => a.attribute_id !== attr.attribute_id) : [...prev, attr];
        });

    const isFormValid = form.rule_name && form.rule_type && form.severity && form.status;

    const handleSubmit = async () => {
        setError('');
        const result = await editRule({
            rule_id:         ruleData.rule_id,
            rule_name:       form.rule_name,
            attribute_id:    selectedAttrs.length > 0 ? selectedAttrs.map((a) => a.attribute_id) : null,
            validation_type: form.rule_type,
            expression:      form.expression || null,
            severity:        form.severity,
            status:          form.status === 'true',
            updated_by:      decodedToken?.preferred_username,
        });
        if (result.ok) {
            onComplete?.();
            handleClose();
        } else {
            setError(result.message);
        }
    };

    const handleClose = () => {
        setForm({ rule_name: '', rule_type: '', expression: '', severity: '', status: '' });
        setSelectedAttrs([]);
        setError('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[1002] flex items-center justify-center bg-black/40" onClick={handleClose}>
            <div className="w-[690px] bg-white rounded-2xl border border-[#CCCCCC] mx-4" onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className="flex items-center justify-between gap-4 px-6 py-4 rounded-t-2xl bg-white shadow-[0px_4px_9px_0px_rgba(0,0,0,0.10)]">
                    <div className="flex items-center gap-2">
                        <button onClick={handleClose} className="bg-transparent border-none cursor-pointer p-0.5 text-[#818181] flex items-center">
                            <ChevronLeft size={18} />
                        </button>
                        <span className="text-lg font-medium text-[#282F49] font-[Satoshi,sans-serif]">
                            Edit Rule — <span className="text-[#8E77BB]">{ruleData?.rule_name}</span>
                        </span>
                    </div>
                    <button onClick={handleClose} className="bg-transparent border-none cursor-pointer p-1 text-[#818181] flex items-center"><X size={20} /></button>
                </div>

                {/* Form */}
                <div className="px-6 pt-5 pb-6 grid grid-cols-2 gap-5 bg-white">
                    <div className="flex flex-col gap-1.5">
                        <label className={`${labelClass} mb-0`}>Rule Name</label>
                        <input type="text" placeholder="Enter Rule Name" value={form.rule_name} onChange={(e) => handleChange('rule_name', e.target.value)} className={inputClass} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className={`${labelClass} mb-0`}>Attribute</label>
                        <AttrSearchDropdown attributes={attributes} selectedAttrs={selectedAttrs} onToggle={handleAttrToggle} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className={`${labelClass} mb-0`}>Data Type</label>
                        <SelectField value={form.rule_type} onChange={(e) => handleChange('rule_type', e.target.value)} placeholder="Select">
                            {validationTypes.map((t) => (
                                <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase().replace(/_/g, ' ')}</option>
                            ))}
                        </SelectField>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className={`${labelClass} mb-0`}>Expression</label>
                        <input type="text" placeholder="Enter Expression" value={form.expression} onChange={(e) => handleChange('expression', e.target.value)} className={inputClass} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className={`${labelClass} mb-0`}>Severity</label>
                        <SelectField value={form.severity} onChange={(e) => handleChange('severity', e.target.value)} placeholder="Select">
                            <option value="ERROR">Error</option>
                            <option value="WARNING">Warning</option>
                            <option value="INFO">Info</option>
                        </SelectField>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className={`${labelClass} mb-0`}>Status</label>
                        <SelectField value={form.status} onChange={(e) => handleChange('status', e.target.value)} placeholder="Select">
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </SelectField>
                    </div>
                    {error && (
                        <div className="col-span-2 text-sm text-[#E05252] bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 font-[Satoshi,sans-serif]">{error}</div>
                    )}
                </div>

                {/* Footer */}
                <div className="h-[72px] flex items-center justify-end gap-4 px-6 rounded-b-2xl bg-white shadow-[0px_-4px_9px_0px_rgba(0,0,0,0.10)]">
                    <button onClick={handleClose} className="px-5 py-2.5 text-sm font-medium text-[#282F49] border border-[#CCCCCC] rounded-lg bg-white cursor-pointer font-[Satoshi,sans-serif]">Cancel</button>
                    <button
                        onClick={handleSubmit}
                        disabled={!isFormValid || isSubmitting}
                        className={`px-5 py-2.5 text-sm font-medium text-white border-none rounded-lg font-[Satoshi,sans-serif] ${isFormValid && !isSubmitting ? 'bg-[#8e78b7] cursor-pointer' : 'bg-[#CBC0E0] cursor-not-allowed'}`}
                    >
                        {isSubmitting ? 'Updating...' : 'Update Rule'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditRuleModal;