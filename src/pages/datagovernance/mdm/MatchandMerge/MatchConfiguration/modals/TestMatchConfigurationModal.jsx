import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { X, Search } from 'lucide-react';
import { useDomains, useRulesByDomain, useTestMatchConfig } from '../../../../../../hooks/mdm/matchMerge';

// ─── DomainDropdown ───────────────────────────────────────────────────────────

const DomainDropdown = ({ domains, selected, onSelect, disabled }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [popoverStyle, setPopoverStyle] = useState({});
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

    const handleOpen = () => {
        if (disabled) return;
        if (!open && ref.current) {
            const rect = ref.current.getBoundingClientRect();
            setPopoverStyle({ position: 'fixed', top: rect.bottom + 4, left: rect.left, width: rect.width });
        }
        setOpen((p) => !p);
    };

    return (
        <div ref={ref} className="relative w-full">
            <button
                type="button"
                disabled={disabled}
                onClick={handleOpen}
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
                <div
                    style={popoverStyle}
                    className="bg-white border border-gray-200 rounded-[10px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] z-[9999] overflow-hidden"
                >
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

// ─── TestMatchConfigurationModal ──────────────────────────────────────────────

const TestMatchConfigurationModal = ({ isOpen, onClose, ruleId = null }) => {
    const isRuleMode = ruleId !== null;

    const { domains, loading: domainsLoading } = useDomains(isOpen && !isRuleMode);
    const { rules, rulesLoading, apiError, setApiError, fetchByDomain, fetchByRuleId } = useRulesByDomain();
    const { isRunning, results, runTest, reset } = useTestMatchConfig();

    const [selectedDomain, setSelectedDomain] = useState(null);
    const [fieldValues, setFieldValues] = useState({});

    // Reset everything on close
    useEffect(() => {
        if (!isOpen) {
            setSelectedDomain(null);
            setFieldValues({});
            reset();
        }
    }, [isOpen, reset]);

    // Initialise field values whenever rules load
    useEffect(() => {
        const init = {};
        rules.forEach((r) => { init[r.rule_id] = { a: '', b: '' }; });
        setFieldValues(init);
    }, [rules]);

    // Domain-mode: auto-select first domain
    useEffect(() => {
        if (!isRuleMode && domains.length > 0 && !selectedDomain) {
            const first = domains[0];
            setSelectedDomain(first);
            fetchByDomain(first.domain_id);
        }
    }, [domains, isRuleMode, selectedDomain, fetchByDomain]);

    // Rule-mode: load by rule id
    useEffect(() => {
        if (isOpen && isRuleMode && ruleId) fetchByRuleId(ruleId);
    }, [isOpen, isRuleMode, ruleId, fetchByRuleId]);

    const handleDomainSelect = (domain) => {
        setSelectedDomain(domain);
        reset();
        fetchByDomain(domain.domain_id);
    };

    const setField = useCallback((rId, side, val) => {
        setFieldValues((prev) => ({ ...prev, [rId]: { ...prev[rId], [side]: val } }));
    }, []);

    const filledPairs = useMemo(
        () => rules.filter((r) => fieldValues[r.rule_id]?.a?.trim() && fieldValues[r.rule_id]?.b?.trim()),
        [rules, fieldValues]
    );

    const canRun = filledPairs.length > 0 && !isRunning;
    const fieldsReady = isRuleMode ? rules.length > 0 : (selectedDomain && rules.length > 0);

    const handleRunTest = async () => {
        if (!canRun) return;
        const payload = isRuleMode
            ? {
                rule_id: ruleId,
                record_a: fieldValues[ruleId]?.a?.trim(),
                record_b: fieldValues[ruleId]?.b?.trim(),
            }
            : {
                domain_id: selectedDomain.domain_id,
                records: filledPairs.map((r) => ({
                    rule_id: r.rule_id,
                    record_a: fieldValues[r.rule_id].a.trim(),
                    record_b: fieldValues[r.rule_id].b.trim(),
                })),
            };
        await runTest(isRuleMode, payload);
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={onClose}
        >
            <div
                className="w-[690px] bg-white rounded-2xl border border-[#CCCCCC] mx-4 max-h-[90vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-4 flex-shrink-0">
                    <span className="text-lg font-medium text-[#282F49] font-[Satoshi,sans-serif]">
                        Test Match Configuration
                    </span>
                    <button
                        onClick={onClose}
                        className="bg-transparent border-none cursor-pointer p-1 text-[#818181] flex items-center hover:text-gray-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="px-5 py-2 overflow-y-auto flex-1">
                    {/* Instructions */}
                    <div className="bg-[#FAF8FF] rounded-[10px] px-4 py-3 mb-5">
                        <p className="text-sm text-[#332849] font-normal leading-relaxed m-0 font-[Satoshi,sans-serif]">
                            Input Data: Enter values for Record A and B.
                        </p>
                        <p className="text-sm text-[#332849] font-normal leading-relaxed m-0 font-[Satoshi,sans-serif]">
                            Compare: Click Run Test to view scores and weights.
                        </p>
                    </div>

                    {/* Domain selector (domain mode only) */}
                    {!isRuleMode && (
                        <div className="flex flex-col gap-1.5 mb-5">
                            <label className="text-sm font-medium text-[#332849] font-[Satoshi,sans-serif] leading-none mb-1.5 block">
                                Domain <span className="text-[#E05252]">*</span>
                            </label>
                            <DomainDropdown
                                domains={domains}
                                selected={selectedDomain}
                                onSelect={handleDomainSelect}
                                disabled={domainsLoading}
                            />
                        </div>
                    )}

                    {/* API error / empty state */}
                    {apiError && !rulesLoading && (
                        <p className="text-sm text-[#818181] font-[Satoshi,sans-serif] text-center py-4 m-0">
                            No match rules available
                        </p>
                    )}

                    {/* Loading state */}
                    {rulesLoading && (
                        <div className="flex items-center justify-center py-8">
                            <span className="text-sm text-[#818181] font-[Satoshi,sans-serif]">
                                {isRuleMode ? 'Loading rule...' : 'Loading rules...'}
                            </span>
                        </div>
                    )}

                    {/* Input grid */}
                    {fieldsReady && !rulesLoading && (
                        <div className="grid grid-cols-2 gap-3">
                            {/* Record A */}
                            <div className="bg-[#FAFAFA] rounded-lg p-3.5 flex flex-col gap-3">
                                <p className="text-lg font-bold text-[#332849] m-0 font-[Satoshi,sans-serif]">Record A</p>
                                {rules.map((rule) => (
                                    <div key={rule.rule_id}>
                                        <p className="text-[11px] font-medium text-[#332849] m-0 mb-1.5 font-[Satoshi,sans-serif] uppercase tracking-[0.04em]">
                                            {rule.source_attribute}
                                        </p>
                                        <input
                                            type="text"
                                            placeholder={`Enter ${rule.source_attribute}`}
                                            value={fieldValues[rule.rule_id]?.a ?? ''}
                                            onChange={(e) => setField(rule.rule_id, 'a', e.target.value)}
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-[13px] text-[#282F49] outline-none bg-white font-[Satoshi,sans-serif] box-border focus:border-[#8e78b7] transition-colors"
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Record B */}
                            <div className="bg-[#FAFAFA] rounded-lg p-3.5 flex flex-col gap-3">
                                <p className="text-lg font-bold text-[#282F49] m-0 font-[Satoshi,sans-serif]">Record B</p>
                                {rules.map((rule) => (
                                    <div key={rule.rule_id}>
                                        <p className="text-[11px] font-medium text-[#332849] m-0 mb-1.5 font-[Satoshi,sans-serif] uppercase tracking-[0.04em]">
                                            {rule.target_attribute}
                                        </p>
                                        <input
                                            type="text"
                                            placeholder={`Enter ${rule.target_attribute}`}
                                            value={fieldValues[rule.rule_id]?.b ?? ''}
                                            onChange={(e) => setField(rule.rule_id, 'b', e.target.value)}
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-[13px] text-[#282F49] outline-none bg-white font-[Satoshi,sans-serif] box-border focus:border-[#8e78b7] transition-colors"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {fieldsReady && !rulesLoading && (
                    <div className="px-5 py-4 flex-shrink-0">
                        <button
                            onClick={handleRunTest}
                            disabled={!canRun}
                            className={[
                                'w-full py-2.5 px-4 text-sm font-medium text-white border-none rounded-lg font-[Satoshi,sans-serif] transition-colors',
                                canRun
                                    ? 'bg-[#8E77BB] hover:bg-[#7a67a0] cursor-pointer'
                                    : 'bg-[#CBC0E0] cursor-not-allowed',
                            ].join(' ')}
                        >
                            {isRunning ? 'Running...' : 'Run Test'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TestMatchConfigurationModal;