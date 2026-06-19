import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Loader2, ArrowLeft, ChevronLeft } from 'lucide-react';
import { useDomains, useTestMatchAttributes, useTestMatchConfig } from '../../../../../../hooks/mdm/matchMerge';
import SearchableDropdown from '../../../components/SearchableDropdown';
import TestResultsPanel from './TestResultsPanel';

const AttributesSkeleton = ({ rows = 4 }) => (
    <div className="grid grid-cols-2 gap-3">
        {['A', 'B'].map((side) => (
            <div key={side} className="bg-[#FAFAFA] rounded-lg p-3.5 flex flex-col gap-3">
                <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="flex flex-col gap-1.5">
                        <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                        <div className="h-9 w-full bg-gray-200 rounded-lg animate-pulse" />
                    </div>
                ))}
            </div>
        ))}
    </div>
);

const TestMatchConfigurationModal = ({ isOpen, onClose }) => {
    const { domains, loading: domainsLoading } = useDomains(isOpen);
    const {
        attributes,
        attrsLoading,
        apiError: attrsError,
        fetchByDomainCode,
        reset: resetAttrs,
    } = useTestMatchAttributes();
    const { isRunning, results, apiError: testError, runTest, reset: resetTest } = useTestMatchConfig();

    const [selectedDomain, setSelectedDomain] = useState(null);
    const [fieldValues, setFieldValues] = useState({});
    const [page, setPage] = useState('input');

    useEffect(() => {
        if (!isOpen) {
            setSelectedDomain(null);
            setFieldValues({});
            setPage('input');
            resetAttrs();
            resetTest();
        }
    }, [isOpen, resetAttrs, resetTest]);

    useEffect(() => {
        const init = {};
        attributes.forEach((attr) => { init[attr.name] = { a: '', b: '' }; });
        setFieldValues(init);
    }, [attributes]);

    useEffect(() => {
        if (domains.length > 0 && !selectedDomain) {
            const first = domains[0];
            setSelectedDomain(first);
            fetchByDomainCode(first.domain_code);
        }
    }, [domains, selectedDomain, fetchByDomainCode]);

    useEffect(() => {
        if (results && !isRunning) setPage('results');
    }, [results, isRunning]);

    const domainOptions = useMemo(
        () => domains.map((d) => ({ value: d.domain_code, label: d.domain_name })),
        [domains]
    );

    const handleDomainChange = (domainCode) => {
        const domain = domains.find((d) => d.domain_code === domainCode);
        if (!domain) return;
        setSelectedDomain(domain);
        resetAttrs();
        resetTest();
        setPage('input');
        fetchByDomainCode(domain.domain_code);
    };

    const setField = useCallback((attrName, side, val) => {
        setFieldValues((prev) => ({ ...prev, [attrName]: { ...prev[attrName], [side]: val } }));
    }, []);

    const canRun = useMemo(
        () => !isRunning && attributes.some(
            (attr) => fieldValues[attr.name]?.a?.trim() || fieldValues[attr.name]?.b?.trim()
        ),
        [isRunning, attributes, fieldValues]
    );

    const handleRunTest = async () => {
        if (!canRun || !selectedDomain) return;
        const record_a = {};
        const record_b = {};
        attributes.forEach((attr) => {
            record_a[attr.name] = fieldValues[attr.name]?.a?.trim() || null;
            record_b[attr.name] = fieldValues[attr.name]?.b?.trim() || null;
        });
        await runTest({ domain_code: selectedDomain.domain_code, record_a, record_b });
    };

    const handleBack = () => {
        setPage('input');
        resetTest();
    };

    const showGrid = attributes.length > 0 && !attrsLoading;
    const showAttrsLoading = attrsLoading;
    const showAttrsError = !attrsLoading && !!attrsError && attributes.length === 0;

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={onClose}
        >
            <div
                className={[
                    'bg-white rounded-2xl border border-[#CCCCCC] mx-4 max-h-[92vh] flex flex-col overflow-hidden transition-all duration-300 min-w-[1000px]',
                ].join(' ')}
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── Header */}
                <div className="flex items-center justify-between px-5 py-4 flex-shrink-0 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        {page === 'results' && (
                            <button
                                onClick={handleBack}
                                className="flex items-center gap-1 text-[#818181] text-md font-medium font-[Satoshi] bg-transparent border-none cursor-pointer px-0 hover:opacity-80 transition-opacity mr-1"
                            >
                                <ChevronLeft size={24} />
                            </button>
                        )}
                        <span className="text-lg font-medium text-[#282F49] font-[Satoshi,sans-serif]">
                            {page === 'results' ? 'Test Results' : 'Test Match Configuration'}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="bg-transparent border-none cursor-pointer p-1 text-[#818181] flex items-center hover:text-gray-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* ── Page 1: Inputs */}
                {page === 'input' && (
                    <>
                        <div className="px-5 py-4 overflow-y-auto flex-1 flex flex-col gap-4">
                            {/* Instructions */}
                            <div className="bg-[#FAF8FF] rounded-[10px] px-4 py-3">
                                <p className="text-sm text-[#332849] font-normal leading-relaxed m-0 font-[Satoshi,sans-serif]">
                                    Input Data: Enter values for Record A and B.
                                </p>
                                <p className="text-sm text-[#332849] font-normal leading-relaxed m-0 font-[Satoshi,sans-serif]">
                                    Compare: Click Run Test to view scores and weights.
                                </p>
                            </div>

                            {/* Domain selector */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#332849] font-[Satoshi,sans-serif] leading-none block">
                                    Domain <span className="text-[#E05252]">*</span>
                                </label>
                                <SearchableDropdown
                                    value={selectedDomain?.domain_code ?? ''}
                                    onChange={handleDomainChange}
                                    options={domainOptions}
                                    placeholder={domainsLoading ? 'Loading domains...' : 'Select domain'}
                                />
                            </div>

                            {showAttrsLoading && <AttributesSkeleton rows={4} />}

                            {showAttrsError && (
                                <div className="bg-[#FFF5F5] border border-[#EF4D5F] rounded-xl px-4 py-3">
                                    <p className="text-sm text-[#EF4D5F] font-[Satoshi,sans-serif] m-0">{attrsError}</p>
                                </div>
                            )}

                            {showGrid && (
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Record A */}
                                    <div className="bg-[#FAFAFA] rounded-lg p-3.5 flex flex-col gap-3">
                                        <p className="text-lg font-bold text-[#332849] m-0 font-[Satoshi,sans-serif]">Record A</p>
                                        {attributes.map((attr) => (
                                            <div key={attr.name}>
                                                <p className="text-[11px] font-medium text-[#332849] m-0 mb-1.5 font-[Satoshi,sans-serif] uppercase tracking-[0.04em]">
                                                    {attr.label}
                                                </p>
                                                <input
                                                    type="text"
                                                    placeholder={`Enter ${attr.label}`}
                                                    value={fieldValues[attr.name]?.a ?? ''}
                                                    onChange={(e) => setField(attr.name, 'a', e.target.value)}
                                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-[13px] text-[#282F49] outline-none bg-white font-[Satoshi,sans-serif] box-border focus:border-[#8e78b7] transition-colors"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    {/* Record B */}
                                    <div className="bg-[#FAFAFA] rounded-lg p-3.5 flex flex-col gap-3">
                                        <p className="text-lg font-bold text-[#282F49] m-0 font-[Satoshi,sans-serif]">Record B</p>
                                        {attributes.map((attr) => (
                                            <div key={attr.name}>
                                                <p className="text-[11px] font-medium text-[#332849] m-0 mb-1.5 font-[Satoshi,sans-serif] uppercase tracking-[0.04em]">
                                                    {attr.label}
                                                </p>
                                                <input
                                                    type="text"
                                                    placeholder={`Enter ${attr.label}`}
                                                    value={fieldValues[attr.name]?.b ?? ''}
                                                    onChange={(e) => setField(attr.name, 'b', e.target.value)}
                                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-[13px] text-[#282F49] outline-none bg-white font-[Satoshi,sans-serif] box-border focus:border-[#8e78b7] transition-colors"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>

                        {testError && !isRunning && (
                            <div className="px-5 pt-3 mb-2">
                                <div className="bg-[#FFF5F5] border border-[#EF4D5F] rounded-xl px-4 py-3">
                                    <p className="text-sm text-[#EF4D5F] font-[Satoshi,sans-serif] m-0">{testError}</p>
                                </div>
                            </div>
                        )}

                        {showGrid && (
                            <div className="px-5 py-4 flex-shrink-0 border-t border-gray-100">
                                <button
                                    onClick={handleRunTest}
                                    disabled={!canRun}
                                    className={[
                                        'w-full py-2.5 px-4 text-sm font-medium text-white border-none rounded-lg font-[Satoshi,sans-serif] transition-colors flex items-center justify-center gap-2',
                                        canRun
                                            ? 'bg-[#8E77BB] hover:bg-[#7a67a0] cursor-pointer'
                                            : 'bg-[#CBC0E0] cursor-not-allowed',
                                    ].join(' ')}
                                >
                                    {isRunning ? (
                                        <>
                                            <Loader2 size={15} className="animate-spin" />
                                            Running...
                                        </>
                                    ) : 'Run Test'}
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* ── Page 2: Results */}
                {page === 'results' && (
                    <div className="px-5 py-4 overflow-y-auto flex-1">
                        <TestResultsPanel results={results} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default TestMatchConfigurationModal;