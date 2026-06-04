// ─── EditRuleModal.jsx ────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { X, ChevronLeft } from 'lucide-react';
import { useAuth } from '../../../../../../context/AuthContext';
import {
    useEditRule,
    useValidationTypes,
    useAttributesByDomain,
    useDQDimensions
} from '../../../../../../hooks/mdm/domainManagement';
import SearchableDropdown from '../../../components/SearchableDropdown';

const inputClass =
    'w-full border border-[#CCCCCC] rounded-lg px-3.5 py-2.5 text-sm font-normal text-[#282F49] outline-none bg-white font-[Satoshi,sans-serif] leading-none box-border focus:border-[#8e78b7]';
const labelClass =
    'text-sm font-medium text-[#282F49] font-[Satoshi,sans-serif] leading-none mb-1.5 block';



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
                placeholder={selectedAttrs.length > 0 && !open ? '' : 'Search attribute...'}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
                onFocus={() => setOpen(true)}
                className={`${inputClass} pr-9`}
            />
            {selectedAttrs.length > 0 && !open && (
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-sm font-medium text-[#8e78b7] font-[Satoshi,sans-serif]">
                    {selectedAttrs.length} selected
                </span>
            )}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#818181]">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </div>
            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => { setOpen(false); setSearch(''); }} />
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
                                        className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm cursor-pointer font-normal text-[#282F49] hover:bg-[#F3EFFF]"
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
    const [form, setForm] = useState({
    rule_name: '', rule_type: '', expression: '', severity: '', status: '',
    dq_dimension: '', rule_weight: 1, support_partial: '', partial_formula: '', threshold_days: '',
    });
    const [selectedAttrs, setSelectedAttrs] = useState([]);
    const { dimensions } = useDQDimensions();
    const [error, setError]         = useState('');

    const { validationTypes }   = useValidationTypes(isOpen);
    const { attributes }        = useAttributesByDomain(domainId, isOpen);
    const { isSubmitting, editRule } = useEditRule();

    useEffect(() => {
        if (!ruleData || attributes.length === 0) return;
        setForm({
            rule_name:       ruleData.rule_name || '',
            rule_type:       ruleData.validation_type || '',
            expression:      ruleData.expression || '',
            severity:        ruleData.severity || '',
            status:          ruleData.status ? 'true' : 'false',
            dq_dimension:    ruleData.dq_dimension || '',
            rule_weight:     ruleData.rule_weight ?? 1,
            support_partial: ruleData.support_partial != null ? String(ruleData.support_partial) : '',
            partial_formula: ruleData.partial_formula || '',
            threshold_days:  ruleData.threshold_days != null ? String(ruleData.threshold_days) : '',
        });
        setSelectedAttrs(
            ruleData.attributes?.length > 0
                ? attributes.filter((a) =>
                    ruleData.attributes.some((r) => r.attribute_id === a.attribute_id)
                )
                : []
        );
    }, [ruleData, attributes]);

    if (!isOpen) return null;

    const handleChange    = (field, value) => setForm((p) => ({ ...p, [field]: value }));
    const handleAttrToggle = (attr) =>
        setSelectedAttrs((prev) => {
            const exists = prev.find((a) => a.attribute_id === attr.attribute_id);
            return exists ? prev.filter((a) => a.attribute_id !== attr.attribute_id) : [...prev, attr];
        });

    const isFormValid =
    form.rule_name && form.rule_type && form.severity && form.status &&
    form.dq_dimension &&
    form.support_partial &&
    (form.support_partial === 'false' || form.partial_formula) &&
    (form.partial_formula !== 'TIME_DECAY' || form.threshold_days !== '');

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
        dq_dimension:    form.dq_dimension || null,
        rule_weight:     Number(form.rule_weight),
        support_partial: form.support_partial === 'true',
        partial_formula: form.support_partial === 'true' ? form.partial_formula : null,
        threshold_days:  form.partial_formula === 'TIME_DECAY' ? Number(form.threshold_days) : null,
    });
        if (result.ok) {
            onComplete?.();
            handleClose();
        } else {
            setError(result.message);
        }
    };

    const handleClose = () => {
        setForm({ rule_name: '', rule_type: '', expression: '', severity: '', status: '',
        dq_dimension: '', rule_weight: 1, support_partial: '', partial_formula: '', threshold_days: '' });
        setSelectedAttrs([]);
        setError('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[1002] flex items-center justify-center bg-black/40">
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

                    {/* Rule Name */}
                    <div className="flex flex-col gap-1.5">
                        <label className={`${labelClass} mb-0`}>Rule Name <span className="text-[#E05252]">*</span></label>
                        <input type="text" placeholder="Enter Rule Name" value={form.rule_name} onChange={(e) => handleChange('rule_name', e.target.value)} className={inputClass} />
                    </div>

                    {/* Attribute */}
                    <div className="flex flex-col gap-1.5">
                        <label className={`${labelClass} mb-0`}>Attribute <span className="text-[#E05252]">*</span></label>
                        <AttrSearchDropdown attributes={attributes} selectedAttrs={selectedAttrs} onToggle={handleAttrToggle} />
                    </div>

                    {/* DQ Dimension */}
                    <div className="flex flex-col gap-1.5">
                        <label className={`${labelClass} mb-0`}>DQ Dimension <span className="text-[#E05252]">*</span></label>
                        <SearchableDropdown
                            value={form.dq_dimension || ''}
                            onChange={(v) => handleChange('dq_dimension', v)}
                            options={dimensions.map((d) => ({ label: d, value: d }))}
                            placeholder="Select"
                        />
                    </div>

                    {/* Rule Type */}
                    <div className="flex flex-col gap-1.5">
                        <label className={`${labelClass} mb-0`}>Validation Type <span className="text-[#E05252]">*</span></label>
                        <SearchableDropdown
                            value={form.rule_type}
                            onChange={(v) => handleChange('rule_type', v)}
                            options={validationTypes.map((t) => ({ label: t.charAt(0) + t.slice(1).toLowerCase().replace(/_/g, ' '), value: t }))}
                            placeholder="Select"
                        />
                    </div>

                    {/* Expression */}
                    <div className="flex flex-col gap-1.5">
                        <label className={`${labelClass} mb-0`}>Expression</label>
                        <input type="text" placeholder="Enter Expression" value={form.expression} onChange={(e) => handleChange('expression', e.target.value)} className={inputClass} />
                    </div>

                    {/* Rule Weight */}
                    <div className="flex flex-col gap-1.5">
                        <label className={`${labelClass} mb-0`}>Rule Weight <span className="text-[#E05252]">*</span></label>
                        <div className="flex items-center border border-[#CCCCCC] rounded-lg overflow-hidden w-full">
                            <button type="button" onClick={() => handleChange('rule_weight', Math.max(1, form.rule_weight - 1))}
                                className="w-9 h-[42px] flex-shrink-0 flex items-center justify-center text-[#818181] hover:bg-[#F3EFFF] hover:text-[#8e78b7] transition-colors bg-white border-none cursor-pointer text-lg leading-none">−</button>
                            <span className="flex-1 text-center text-sm font-medium text-[#282F49] font-[Satoshi,sans-serif] select-none">{form.rule_weight}</span>
                            <button type="button" onClick={() => handleChange('rule_weight', Math.min(10, form.rule_weight + 1))}
                                className="w-9 h-[42px] flex-shrink-0 flex items-center justify-center text-[#818181] hover:bg-[#F3EFFF] hover:text-[#8e78b7] transition-colors bg-white border-none cursor-pointer text-lg leading-none">+</button>
                        </div>
                    </div>

                    {/* Support Partial */}
                    <div className="flex flex-col gap-1.5">
                        <label className={`${labelClass} mb-0`}>Support Partial <span className="text-[#E05252]">*</span></label>
                        <SearchableDropdown
                            value={form.support_partial}
                            onChange={(v) => {
                                handleChange('support_partial', v);
                                if (v === 'false') {
                                    handleChange('partial_formula', '');
                                    handleChange('threshold_days', '');
                                }
                            }}
                            options={[{ label: 'Yes', value: 'true' }, { label: 'No', value: 'false' }]}
                            placeholder="Select"
                        />
                    </div>

                    {/* Partial Formula — col 2, only when Yes */}
                    {form.support_partial === 'true' ? (
                        <div className="flex flex-col gap-1.5">
                            <label className={`${labelClass} mb-0`}>Partial Formula <span className="text-[#E05252]">*</span></label>
                            <SearchableDropdown
                                value={form.partial_formula}
                                onChange={(v) => {
                                    handleChange('partial_formula', v);
                                    if (v !== 'TIME_DECAY') handleChange('threshold_days', '');
                                }}
                                options={[
                                    { label: 'Age Overshoot', value: 'AGE_OVERSHOOT' },
                                    { label: 'Time Decay', value: 'TIME_DECAY' },
                                    { label: 'Age Ratio', value: 'AGE_RATIO' },
                                    { label: 'Range Distance', value: 'RANGE_DISTANCE' },
                                ]}
                                placeholder="Select"
                            />
                        </div>
                    ) : null}

                    {/* Threshold Days — only when TIME_DECAY */}
                    {form.partial_formula === 'TIME_DECAY' && (
                        <div className="flex flex-col gap-1.5">
                            <label className={`${labelClass} mb-0`}>Threshold Days <span className="text-[#E05252]">*</span></label>
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder="Enter number of days"
                                value={form.threshold_days}
                                onChange={(e) => handleChange('threshold_days', e.target.value.replace(/[^0-9]/g, ''))}
                                className={inputClass}
                            />
                        </div>
                    )}

                    {/* Severity */}
                    <div className="flex flex-col gap-1.5">
                        <label className={`${labelClass} mb-0`}>Severity <span className="text-[#E05252]">*</span></label>
                        <SearchableDropdown
                            value={form.severity}
                            onChange={(v) => handleChange('severity', v)}
                            options={[{ label: 'Error', value: 'ERROR' }, { label: 'Warning', value: 'WARNING' }, { label: 'Info', value: 'INFO' }]}
                            placeholder="Select"
                        />
                    </div>

                    {/* Status */}
                    <div className="flex flex-col gap-1.5">
                        <label className={`${labelClass} mb-0`}>Status <span className="text-[#E05252]">*</span></label>
                        <SearchableDropdown
                            value={form.status}
                            onChange={(v) => handleChange('status', v)}
                            options={[{ label: 'Active', value: 'true' }, { label: 'Inactive', value: 'false' }]}
                            placeholder="Select"
                        />
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