import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAttributes, useAddMatchRule, useEditMatchRule } from '../../../../../../hooks/mdm/matchMerge';

// ─── Style tokens ─────────────────────────────────────────────────────────────

const inputCls =
    'w-full border border-[#CCCCCC] rounded-lg px-3.5 py-2.5 text-sm font-normal text-[#282F49] outline-none bg-white font-[Satoshi,sans-serif] leading-none box-border focus:border-[#8e78b7] transition-colors';

const labelCls =
    'text-sm font-medium text-[#332849] font-[Satoshi,sans-serif] leading-none mb-1.5 block';

// ─── AttributeDropdown ────────────────────────────────────────────────────────

const AttributeDropdown = ({ attributes, selected, onSelect, disabled }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const ref = useRef(null);

    const filtered = useMemo(
        () => attributes.filter(a =>
            (a.display_name ?? a.attribute_name).toLowerCase().includes(search.toLowerCase())
        ),
        [attributes, search]
    );

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div ref={ref} className="relative w-full">
            <button
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setOpen(p => !p)}
                className={[
                    'w-full border border-[#CCCCCC] rounded-lg px-3.5 py-2.5 text-sm font-normal font-[Satoshi,sans-serif]',
                    'leading-none box-border outline-none flex items-center justify-between gap-2',
                    disabled ? 'bg-[#F9F9F9] cursor-not-allowed' : 'bg-white cursor-pointer hover:border-[#8e78b7]',
                    !selected ? 'text-[#A0AEC0]' : 'text-[#282F49]',
                ].join(' ')}
            >
                <span>{selected ? (selected.display_name ?? selected.attribute_name) : 'Select attribute'}</span>
                <svg
                    width="16" height="16" fill="none" viewBox="0 0 24 24"
                    stroke="#818181" strokeWidth="2"
                    className={`flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : 'rotate-0'}`}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {open && (
                <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-gray-200 rounded-[10px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] z-[9999] overflow-hidden">
                    <div className="flex items-center gap-1.5 p-2 border-b border-gray-100">
                        <Search size={13} className="text-gray-400 flex-shrink-0" />
                        <input
                            autoFocus
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search attribute..."
                            className="border-none outline-none text-[13px] text-gray-700 w-full bg-transparent font-[Satoshi,sans-serif]"
                        />
                    </div>
                    <div className="max-h-[200px] overflow-y-auto">
                        {filtered.length === 0 && (
                            <div className="p-3 text-[13px] text-gray-400 text-center">No results</div>
                        )}
                        {filtered.map(a => (
                            <div
                                key={a.attribute_id}
                                onClick={() => { onSelect(a); setOpen(false); setSearch(''); }}
                                className={[
                                    'px-3.5 py-2.5 text-[13px] cursor-pointer font-[Satoshi,sans-serif] transition-colors',
                                    selected?.attribute_id === a.attribute_id
                                        ? 'text-[#8E77BB] bg-[#f5f0ff]'
                                        : 'text-gray-700 hover:bg-[#faf7ff]',
                                ].join(' ')}
                            >
                                {a.display_name ?? a.attribute_name}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── CustomSelect ─────────────────────────────────────────────────────────────

const CustomSelect = ({ options, value, onChange, placeholder = 'Select', disabled }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const selected = options.find(o => o.value === value);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div ref={ref} className="relative w-full">
            <button
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setOpen(p => !p)}
                className={[
                    'w-full border border-[#CCCCCC] rounded-lg px-3.5 py-2.5 text-sm font-normal font-[Satoshi,sans-serif]',
                    'leading-none box-border outline-none flex items-center justify-between gap-2',
                    disabled ? 'bg-[#F9F9F9] cursor-not-allowed' : 'bg-white cursor-pointer hover:border-[#8e78b7]',
                    !selected ? 'text-[#A0AEC0]' : 'text-[#282F49]',
                ].join(' ')}
            >
                <span>{selected?.label ?? placeholder}</span>
                <svg
                    width="16" height="16" fill="none" viewBox="0 0 24 24"
                    stroke="#818181" strokeWidth="2"
                    className={`flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : 'rotate-0'}`}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {open && (
                <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-gray-200 rounded-[10px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] z-[9999] overflow-hidden">
                    {options.map(opt => (
                        <div
                            key={opt.value}
                            onClick={() => { onChange(opt.value); setOpen(false); }}
                            className={[
                                'px-3.5 py-2.5 text-[13px] cursor-pointer font-[Satoshi,sans-serif] transition-colors',
                                value === opt.value
                                    ? 'text-[#8E77BB] bg-[#f5f0ff]'
                                    : 'text-gray-700 hover:bg-[#faf7ff]',
                            ].join(' ')}
                        >
                            {opt.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ─── Constants ────────────────────────────────────────────────────────────────

const ALGORITHM_OPTIONS = [
    { value: 'EXACT', label: 'EXACT' },
    { value: 'NORMALIZED_EXACT_MATCH', label: 'NORMALIZED_EXACT_MATCH' },
    { value: 'JARO', label: 'JARO' },
    { value: 'JARO_WINKLER', label: 'JARO_WINKLER' },
    { value: 'LEVENSHTEIN', label: 'LEVENSHTEIN' },
    { value: 'DAMERAU_LEVENSHTEIN', label: 'DAMERAU_LEVENSHTEIN' },
    { value: 'BEIDER_MORSE', label: 'BEIDER_MORSE' },
    { value: 'DATE_MATCH', label: 'DATE_MATCH' },
    { value: 'LSH', label: 'LSH' },
];

const NULL_HANDLING_OPTIONS = [
    { value: 'EXCLUDE', label: 'EXCLUDE' },
    { value: 'NO_MATCH', label: 'NO_MATCH' },
    { value: 'MATCH', label: 'MATCH' },
];

const INIT_FORM = {
    rule_name: '',
    rule_description: '',
    attribute: null,
    algorithm: '',
    weight: '',
    threshold: '',
    null_handling: '',
    is_blocking_key: false,
};

// ─── Shared sub-components ────────────────────────────────────────────────────

const ModalShell = ({ onClose, header, children, footer }) => (
    <div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40"
        onClick={onClose}
    >
        <div
            className="w-[560px] bg-white rounded-2xl border border-[#CCCCCC] mx-4"
            onClick={e => e.stopPropagation()}
        >
            <div className="flex items-center justify-between px-6 py-4 rounded-t-2xl bg-white shadow-[0px_4px_9px_0px_rgba(0,0,0,0.10)]">
                {header}
                <button
                    onClick={onClose}
                    className="bg-transparent border-none cursor-pointer p-1 text-[#818181] flex items-center hover:text-gray-600 transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="px-6 py-5 grid grid-cols-2 gap-5 bg-white">
                {children}
            </div>

            <div className="h-[68px] flex items-center justify-end gap-3 px-6 rounded-b-2xl bg-white shadow-[0px_-4px_9px_0px_rgba(0,0,0,0.08)]">
                {footer}
            </div>
        </div>
    </div>
);

const RuleFormFields = ({ form, set, attributes, attrsLoading }) => (
    <>
        <div className="col-span-2 flex flex-col gap-1.5">
            <label className={labelCls}>Rule Name <span className="text-[#E05252]">*</span></label>
            <input
                type="text"
                className={inputCls}
                placeholder="e.g. PAN Exact Match"
                value={form.rule_name}
                onChange={e => set('rule_name')(e.target.value)}
            />
        </div>

        <div className="col-span-2 flex flex-col gap-1.5">
            <label className={labelCls}>Rule Description</label>
            <textarea
                rows={2}
                className={`${inputCls} resize-none leading-relaxed`}
                placeholder="Describe the purpose of this rule..."
                value={form.rule_description}
                onChange={e => set('rule_description')(e.target.value)}
            />
        </div>

        <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Attribute <span className="text-[#E05252]">*</span></label>
            <AttributeDropdown
                attributes={attributes}
                selected={form.attribute}
                onSelect={set('attribute')}
                disabled={attrsLoading}
            />
        </div>

        <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Algorithm <span className="text-[#E05252]">*</span></label>
            <CustomSelect
                options={ALGORITHM_OPTIONS}
                value={form.algorithm}
                onChange={set('algorithm')}
                placeholder="Select algorithm"
            />
        </div>

        <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Weight (%) <span className="text-[#E05252]">*</span></label>
            <input
                type="number"
                min={0}
                max={100}
                className={inputCls}
                placeholder="e.g. 25"
                value={form.weight}
                onChange={e => set('weight')(e.target.value)}
            />
        </div>

        <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Threshold (%) <span className="text-[#E05252]">*</span></label>
            <input
                type="number"
                min={0}
                max={100}
                className={inputCls}
                placeholder="e.g. 100"
                value={form.threshold}
                onChange={e => set('threshold')(e.target.value)}
            />
        </div>

        <div className="col-span-2 flex flex-col gap-1.5">
            <label className={labelCls}>Null Handling <span className="text-[#E05252]">*</span></label>
            <CustomSelect
                options={NULL_HANDLING_OPTIONS}
                value={form.null_handling}
                onChange={set('null_handling')}
                placeholder="Select null handling"
            />
        </div>

        <div className="col-span-2 flex items-center gap-2.5">
            <input
                id="rule-blocking"
                type="checkbox"
                checked={form.is_blocking_key}
                onChange={e => set('is_blocking_key')(e.target.checked)}
                className="w-4 h-4 rounded accent-[#8e78b7] cursor-pointer"
            />
            <label
                htmlFor="rule-blocking"
                className="text-sm font-medium text-[#332849] font-[Satoshi,sans-serif] cursor-pointer select-none"
            >
                Use as blocking key
            </label>
        </div>
    </>
);

const CancelButton = ({ onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className="px-5 py-2.5 text-sm font-medium text-[#282F49] border border-[#CCCCCC] rounded-lg bg-white cursor-pointer font-[Satoshi,sans-serif] hover:bg-gray-50 transition-colors"
    >
        Cancel
    </button>
);

const SubmitButton = ({ onClick, disabled, isSubmitting, idleLabel, loadingLabel }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={[
            'px-5 py-2.5 text-sm font-medium text-white border-none rounded-lg font-[Satoshi,sans-serif] transition-colors',
            disabled
                ? 'bg-[#CBC0E0] cursor-not-allowed'
                : 'bg-[#8e78b7] cursor-pointer hover:bg-[#7a67a0]',
        ].join(' ')}
    >
        {isSubmitting ? loadingLabel : idleLabel}
    </button>
);

// ─── AddRuleModal ─────────────────────────────────────────────────────────────

export const AddRuleModal = ({ isOpen, onClose, onSuccess, ruleSet, domainId }) => {
    const { attributes, loading: attrsLoading } = useAttributes(domainId, isOpen);
    const { isSubmitting, addMatchRule } = useAddMatchRule();

    const [form, setForm] = useState(INIT_FORM);
    const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

    const isValid =
        form.rule_name.trim() &&
        form.attribute &&
        form.algorithm &&
        form.weight !== '' &&
        form.threshold !== '' &&
        form.null_handling !== '';

    const handleClose = () => { setForm(INIT_FORM); onClose(); };

    const handleSubmit = async () => {
        if (!isValid) return;
        const { ok, data, message } = await addMatchRule({
            rule_set_id: ruleSet?.id,
            rule_name: form.rule_name.trim(),
            rule_description: form.rule_description.trim(),
            attribute: form.attribute.attribute_name,
            algorithm: form.algorithm,
            threshold: Number(form.threshold),
            weight: Number(form.weight),
            null_handling: form.null_handling,
            is_blocking_key: form.is_blocking_key,
        });
        if (ok) {
            toast.success(data?.message || 'Rule created successfully');
            onSuccess?.();
            handleClose();
        } else {
            toast.error(message);
        }
    };

    if (!isOpen) return null;

    return (
        <ModalShell
            onClose={handleClose}
            header={
                <span className="text-lg font-medium text-[#282F49] font-[Satoshi,sans-serif]">
                    Add Rule
                </span>
            }
            footer={
                <>
                    <CancelButton onClick={handleClose} />
                    <SubmitButton
                        onClick={handleSubmit}
                        disabled={!isValid || isSubmitting}
                        isSubmitting={isSubmitting}
                        idleLabel="Add Rule"
                        loadingLabel="Adding..."
                    />
                </>
            }
        >
            <RuleFormFields form={form} set={set} attributes={attributes} attrsLoading={attrsLoading} />
        </ModalShell>
    );
};

// ─── EditRuleModal ────────────────────────────────────────────────────────────

export const EditRuleModal = ({ isOpen, onClose, onSuccess, ruleData, domainId }) => {
    const { attributes, loading: attrsLoading } = useAttributes(domainId, isOpen);
    const { isSubmitting, editMatchRule } = useEditMatchRule();

    const [form, setForm] = useState(INIT_FORM);
    const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

    useEffect(() => {
        if (!isOpen || !ruleData) return;
        setForm({
            rule_name: ruleData.rule_name ?? '',
            rule_description: ruleData.rule_description ?? '',
            attribute: ruleData.attribute ?? null,
            algorithm: ruleData.algorithm ?? '',
            weight: ruleData.weight ?? '',
            threshold: ruleData.threshold ?? '',
            null_handling: ruleData.null_handling ?? '',
            is_blocking_key: ruleData.blocking === 'Yes' || ruleData.is_blocking_key || false,
        });
    }, [isOpen, ruleData]);

    useEffect(() => {
        if (!attributes.length || !ruleData) return;
        const match = attributes.find(a =>
            a.attribute_name === (ruleData.attribute ?? ruleData.rule_name) ||
            a.display_name === (ruleData.attribute ?? ruleData.rule_name)
        );
        if (match) setForm(f => ({ ...f, attribute: match }));
    }, [attributes, ruleData]);

    const isValid =
        form.rule_name.trim() &&
        form.attribute &&
        form.algorithm &&
        form.weight !== '' &&
        form.threshold !== '' &&
        form.null_handling !== '';

    const handleClose = () => { setForm(INIT_FORM); onClose(); };

    const handleSubmit = async () => {
        if (!isValid) return;
        const { ok, data, message } = await editMatchRule({
            rule_id: ruleData?.rule_id,
            rule_name: form.rule_name.trim(),
            rule_description: form.rule_description.trim(),
            attribute: form.attribute.attribute_name,
            algorithm: form.algorithm,
            threshold: Number(form.threshold),
            weight: Number(form.weight),
            null_handling: form.null_handling,
            is_blocking_key: form.is_blocking_key,
        });
        if (ok) {
            toast.success(data?.message || 'Rule updated successfully');
            onSuccess?.();
            handleClose();
        } else {
            toast.error(message);
        }
    };

    if (!isOpen) return null;

    return (
        <ModalShell
            onClose={handleClose}
            header={
                <span className="text-lg font-medium text-[#282F49] font-[Satoshi,sans-serif]">
                    Edit Match Rule
                    {ruleData?.rule_name && (
                        <span className="text-[#8E77BB]"> — {ruleData.rule_name}</span>
                    )}
                </span>
            }
            footer={
                <>
                    <CancelButton onClick={handleClose} />
                    <SubmitButton
                        onClick={handleSubmit}
                        disabled={!isValid || isSubmitting}
                        isSubmitting={isSubmitting}
                        idleLabel="Update Rule"
                        loadingLabel="Updating..."
                    />
                </>
            }
        >
            <RuleFormFields form={form} set={set} attributes={attributes} attrsLoading={attrsLoading} />
        </ModalShell>
    );
};