import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useDomains, useEditRuleSet } from '../../../../../../hooks/mdm/matchMerge';

const inputCls =
    'w-full border border-[#CCCCCC] rounded-lg px-3.5 py-2.5 text-sm font-normal text-[#282F49] outline-none bg-white font-[Satoshi,sans-serif] leading-none box-border focus:border-[#8e78b7] transition-colors';

const labelCls =
    'text-sm font-medium text-[#332849] font-[Satoshi,sans-serif] leading-none mb-1.5 block';

// ─── DomainDropdown ───────────────────────────────────────────────────────────

const DomainDropdown = ({ domains, selected, onSelect, disabled }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const ref = useRef(null);

    const filtered = useMemo(
        () => domains.filter((d) => d.domain_name.toLowerCase().includes(search.toLowerCase())),
        [domains, search]
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
                onClick={() => !disabled && setOpen((p) => !p)}
                className={[
                    'w-full border border-[#CCCCCC] rounded-lg px-3.5 py-2.5 text-sm font-normal font-[Satoshi,sans-serif]',
                    'leading-none box-border outline-none flex items-center justify-between gap-2',
                    disabled ? 'bg-[#F9F9F9] cursor-not-allowed' : 'bg-white cursor-pointer hover:border-[#8e78b7]',
                    !selected ? 'text-[#A0AEC0]' : 'text-[#282F49]',
                ].join(' ')}
            >
                <span>{selected?.domain_name ?? 'Select domain'}</span>
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
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search domain..."
                            className="border-none outline-none text-[13px] text-gray-700 w-full bg-transparent font-[Satoshi,sans-serif]"
                        />
                    </div>
                    <div className="max-h-[200px] overflow-y-auto">
                        {filtered.length === 0 && (
                            <div className="p-3 text-[13px] text-gray-400 text-center">No results</div>
                        )}
                        {filtered.map((d) => (
                            <div
                                key={d.domain_id}
                                onClick={() => { onSelect(d); setOpen(false); setSearch(''); }}
                                className={[
                                    'px-3.5 py-2.5 text-[13px] cursor-pointer font-[Satoshi,sans-serif] transition-colors',
                                    selected?.domain_id === d.domain_id
                                        ? 'text-[#8E77BB] bg-[#f5f0ff]'
                                        : 'text-gray-700 hover:bg-[#faf7ff]',
                                ].join(' ')}
                            >
                                {d.domain_name}
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
    const selected = options.find((o) => o.value === value);

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
                onClick={() => !disabled && setOpen((p) => !p)}
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
                    {options.map((opt) => (
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

const MATCH_TYPE_OPTIONS = [
    { value: 'DETERMINISTIC', label: 'Deterministic' },
    { value: 'PROBABILISTIC', label: 'Probabilistic' },
    { value: 'HYBRID', label: 'Hybrid' },
];

const STATUS_OPTIONS = [
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' },
];

// ─── EditRuleSetModal ─────────────────────────────────────────────────────────

const EditRuleSetModal = ({ isOpen, onClose, onSuccess, rulesetData }) => {
    const { domains, loading: domainsLoading } = useDomains(isOpen);
    const { isSubmitting, update } = useEditRuleSet();

    const [form, setForm] = useState({
        rule_name: '',
        domain: null,
        match_type: '',
        rule_description: '',
        auto_match_threshold: '',
        review_threshold: '',
        status: '',
    });

    useEffect(() => {
        if (!rulesetData || !isOpen || domainsLoading) return;
        const matchedDomain = domains.find(
            (d) => d.domain_id === rulesetData.domain_id || d.domain_name === rulesetData.domain
        );
        setForm({
            rule_name: rulesetData.ruleName ?? rulesetData.rule_name ?? '',
            domain: matchedDomain ?? null,
            match_type: (rulesetData.type ?? rulesetData.match_type ?? '').toUpperCase(),
            rule_description: rulesetData.rule_description ?? rulesetData.description ?? '',
            auto_match_threshold: rulesetData.autoMerge ?? rulesetData.auto_match_threshold ?? '',
            review_threshold: rulesetData.review ?? rulesetData.review_threshold ?? '',
            status: rulesetData.status ?? 'Active',
        });
    }, [rulesetData, domains, domainsLoading, isOpen]);

    const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

    const isValid =
        form.rule_name.trim() &&
        form.domain &&
        form.match_type &&
        form.auto_match_threshold !== '' &&
        form.review_threshold !== '' &&
        form.status;

    const handleClose = () => onClose();

    const handleSubmit = async () => {
        if (!isValid) return;
        const { ok, data, message } = await update({
            rule_set_id: rulesetData?.id ?? rulesetData?.rule_set_id,
            rule_name: form.rule_name.trim(),
            domain_id: form.domain.domain_id,
            match_type: form.match_type,
            rule_description: form.rule_description.trim(),
            auto_match_threshold: Number(form.auto_match_threshold),
            review_threshold: Number(form.review_threshold),
            status: form.status,
        });
        if (ok) {
            toast.success(data?.message || 'Ruleset updated successfully');
            onSuccess?.();
            handleClose();
        } else {
            toast.error(message);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        >
            <div
                className="w-[560px] bg-white rounded-2xl border border-[#CCCCCC] mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 rounded-t-2xl bg-white shadow-[0px_4px_9px_0px_rgba(0,0,0,0.10)]">
                    <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-lg font-medium text-[#282F49] font-[Satoshi,sans-serif]">
                            Edit Ruleset —
                        </span>
                        <span className="text-lg font-medium text-[#8E77BB] font-[Satoshi,sans-serif]">
                            {rulesetData?.ruleName ?? rulesetData?.rule_name ?? ''}
                        </span>
                    </div>
                    <button
                        onClick={handleClose}
                        className="bg-transparent border-none cursor-pointer p-1 text-[#818181] flex items-center hover:text-gray-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <div className="px-6 py-5 grid grid-cols-2 gap-5 bg-white">

                    {/* Ruleset Name */}
                    <div className="col-span-2 flex flex-col gap-1.5">
                        <label className={labelCls}>
                            Ruleset Name <span className="text-[#E05252]">*</span>
                        </label>
                        <input
                            type="text"
                            className={inputCls}
                            placeholder="e.g. Customer Standard Match"
                            value={form.rule_name}
                            onChange={(e) => set('rule_name')(e.target.value)}
                        />
                    </div>

                    {/* Domain */}
                    <div className="flex flex-col gap-1.5">
                        <label className={labelCls}>
                            Domain <span className="text-[#E05252]">*</span>
                        </label>
                        <DomainDropdown
                            domains={domains}
                            selected={form.domain}
                            onSelect={set('domain')}
                            disabled={domainsLoading}
                        />
                    </div>

                    {/* Match Type */}
                    <div className="flex flex-col gap-1.5">
                        <label className={labelCls}>
                            Match Type <span className="text-[#E05252]">*</span>
                        </label>
                        <CustomSelect
                            options={MATCH_TYPE_OPTIONS}
                            value={form.match_type}
                            onChange={set('match_type')}
                            placeholder="Select type"
                        />
                    </div>

                    {/* Description */}
                    <div className="col-span-2 flex flex-col gap-1.5">
                        <label className={labelCls}>Description</label>
                        <textarea
                            rows={3}
                            className={`${inputCls} resize-none leading-relaxed`}
                            placeholder="Describe the purpose of this ruleset..."
                            value={form.rule_description}
                            onChange={(e) => set('rule_description')(e.target.value)}
                        />
                    </div>

                    {/* Auto-Merge Threshold */}
                    <div className="flex flex-col gap-1.5">
                        <label className={labelCls}>
                            Auto-Merge Threshold (%) <span className="text-[#E05252]">*</span>
                        </label>
                        <input
                            type="number"
                            min={0}
                            max={100}
                            className={inputCls}
                            placeholder="e.g. 95"
                            value={form.auto_match_threshold}
                            onChange={(e) => set('auto_match_threshold')(e.target.value)}
                        />
                    </div>

                    {/* Review Threshold */}
                    <div className="flex flex-col gap-1.5">
                        <label className={labelCls}>
                            Review Threshold (%) <span className="text-[#E05252]">*</span>
                        </label>
                        <input
                            type="number"
                            min={0}
                            max={100}
                            className={inputCls}
                            placeholder="e.g. 75"
                            value={form.review_threshold}
                            onChange={(e) => set('review_threshold')(e.target.value)}
                        />
                    </div>

                    {/* Status */}
                    <div className="col-span-2 flex flex-col gap-1.5">
                        <label className={labelCls}>
                            Status <span className="text-[#E05252]">*</span>
                        </label>
                        <CustomSelect
                            options={STATUS_OPTIONS}
                            value={form.status}
                            onChange={set('status')}
                            placeholder="Select status"
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
                        className={[
                            'px-5 py-2.5 text-sm font-medium text-white border-none rounded-lg font-[Satoshi,sans-serif] transition-colors',
                            isValid && !isSubmitting
                                ? 'bg-[#8e78b7] cursor-pointer hover:bg-[#7a67a0]'
                                : 'bg-[#CBC0E0] cursor-not-allowed',
                        ].join(' ')}
                    >
                        {isSubmitting ? 'Updating...' : 'Update Ruleset'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditRuleSetModal;