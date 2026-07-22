import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../../../../context/AuthContext';
import SearchableDropdown from '../../../components/SearchableDropdown';
import SearchablePaginationDropdown from '../../../components/SearchablePaginationDropdown';
import {
    useEntitySearch,
    useRelTypeAttributes,
    useCreateCrossDomainLink,
} from '../../../../../../hooks/mdm/crossDomainLink';


const ROLE_OPTIONS = [
    { value: 'HAS',   label: 'HAS' },
    { value: 'HOLDS', label: 'HOLDS' },
    { value: 'USES',  label: 'USES' },
];

const STATUS_OPTIONS = [
    { value: 'Active',   label: 'Active' },
    { value: 'Inactive', label: 'Inactive' },
];

const labelClass = 'text-sm font-medium text-[#332849] font-[Satoshi,sans-serif] leading-none mb-1.5 block';

const SectionTitle = ({ step, title }) => (
    <p className="text-sm font-semibold text-[#8E77BB] font-[Satoshi,sans-serif] mb-3">
        Step {step}: {title}
    </p>
);

const SelectedEntityCard = ({ label, goldenId, onClear }) => (
    <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg p-2.5 mt-2 flex items-start justify-between gap-2">
        <div>
            <p className="text-[13px] font-semibold text-[#23252D] font-[Satoshi,sans-serif] m-0">
                {label}
            </p>
            <p className="text-xs text-[#818181] font-[Satoshi,sans-serif] mt-0.5 mb-0">
                Golden ID: {goldenId}
            </p>
        </div>
        <button
            type="button"
            onClick={onClear}
            className="bg-transparent border-none cursor-pointer text-[#9CA3AF] p-0.5 flex-shrink-0"
        >
            <X size={14} />
        </button>
    </div>
);

const CreateCrossDomainLinkModal = ({ isOpen, onClose, onSuccess, relTypes = [] }) => {
    const { decodedToken } = useAuth?.() ?? {};

    const [selectedTypeCode, setSelectedTypeCode] = useState('');
    const [selectedRelType,  setSelectedRelType]  = useState(null);

    const [fromAttrName, setFromAttrName] = useState('');
    const [toAttrName,   setToAttrName]   = useState('');
    const [fromGoldenId, setFromGoldenId] = useState('');
    const [toGoldenId,   setToGoldenId]   = useState('');
    const [fromLabel,    setFromLabel]    = useState('');
    const [toLabel,      setToLabel]      = useState('');

    const [role,          setRole]          = useState('');
    const [ownershipPct,  setOwnershipPct]  = useState('');
    const [status,        setStatus]        = useState('');
    const [effectiveFrom, setEffectiveFrom] = useState('');
    const [effectiveTo,   setEffectiveTo]   = useState('');
    const [notes,         setNotes]         = useState('');

    /* ── Hooks ── */
    const { attributes, isLoading: attrLoading } = useRelTypeAttributes(selectedTypeCode);

    const fromDomainId   = attributes.from?.domain_id   ?? '';
    const fromDomainName = attributes.from?.domain_name ?? '';
    const toDomainId     = attributes.to?.domain_id     ?? '';
    const toDomainName   = attributes.to?.domain_name   ?? '';

    const fromSearch = useEntitySearch(fromDomainId, fromDomainName, fromAttrName);
    const toSearch   = useEntitySearch(toDomainId,   toDomainName,   toAttrName);

    const { isSubmitting, create } = useCreateCrossDomainLink(() => {
        onSuccess?.();
        handleClose();
    });

    /* ── Sync rel type ── */
    useEffect(() => {
        if (!selectedTypeCode) {
            setSelectedRelType(null);
            resetStep2();
            return;
        }
        const rel = relTypes.find(r => r.type_code === selectedTypeCode);
        setSelectedRelType(rel ?? null);
        resetStep2();
    }, [selectedTypeCode]);

    const resetStep2 = () => {
        setFromAttrName('');
        setToAttrName('');
        setFromGoldenId('');
        setToGoldenId('');
        setFromLabel('');
        setToLabel('');
    };

    const resetAll = () => {
        setSelectedTypeCode('');
        setSelectedRelType(null);
        resetStep2();
        setRole('');
        setOwnershipPct('');
        setStatus('');
        setEffectiveFrom('');
        setEffectiveTo('');
        setNotes('');
    };

    const handleClose = () => { resetAll(); onClose(); };

    const handleFromEntitySelect = (goldenId) => {
        const row = fromSearch.getRowByGoldenId(goldenId);
        setFromGoldenId(goldenId);
        setFromLabel(row ? String(row[fromAttrName] ?? goldenId) : goldenId);
    };

    const handleToEntitySelect = (goldenId) => {
        const row = toSearch.getRowByGoldenId(goldenId);
        setToGoldenId(goldenId);
        setToLabel(row ? String(row[toAttrName] ?? goldenId) : goldenId);
    };

    const fromAttrOptions = (attributes.from?.attributes ?? []).map(a => ({
        value: a.attribute_name,
        label: a.display_name,
    }));
    const toAttrOptions = (attributes.to?.attributes ?? []).map(a => ({
        value: a.attribute_name,
        label: a.display_name,
    }));

    const relTypeOptions = relTypes.map(r => ({
        value: r.type_code,
        label: `${r.from} to ${r.to} (${r.cardinality})`,
    }));

    const isValid =
        selectedTypeCode &&
        fromAttrName && toAttrName &&
        fromGoldenId && toGoldenId &&
        role && status &&
        effectiveFrom && effectiveTo;

    const today = new Date().toISOString().split('T')[0];

    const handleSubmit = async () => {
        const rel = relTypes.find(r => r.type_code === selectedTypeCode);
        const payload = {
            xref_type_id:         rel?.xref_type_id,
            source_golden_id:     fromGoldenId,
            target_golden_id:     toGoldenId,
            relationship_role:    role,
            ownership_percentage: ownershipPct ? parseFloat(ownershipPct) : null,
            is_active:            status === 'Active',
            effective_from:       effectiveFrom,
            effective_to:         effectiveTo || null,
            comments:             notes || null,
            created_by:           decodedToken?.preferred_username || 'admin',
        };
        const result = await create(payload);
        if (!result.ok) toast.error(result.message || 'Something went wrong');
        else toast.success('Link created successfully');
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        >
            <div
                className="w-[690px] max-h-[90vh] bg-white rounded-2xl border border-[#CCCCCC] flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
                    <span className="text-lg font-semibold text-[#282F49] font-[Satoshi,sans-serif]">
                        Create Cross-Domain Link
                    </span>
                    <button
                        onClick={handleClose}
                        className="bg-transparent border-none cursor-pointer text-[#818181] flex items-center"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="overflow-y-auto px-6 py-2 flex flex-col gap-5 flex-1">

                    {/* Info banner */}
                    <div className="bg-[#FAF8FF] rounded-lg px-4 py-3">
                        <p className="m-0 text-sm text-[#332849] font-[Satoshi,sans-serif] leading-relaxed font-normal">
                            <span className="text-[#8E77BB] font-medium">Note:</span> Create a relationship between two golden records. First select the relationship type — the From and To domains will be pre-filled based on the type you choose.
                        </p>
                    </div>

                    {/* STEP 1 */}
                    <div>
                        <SectionTitle step={1} title="Choose Relationship Type" />
                        <div className="flex flex-col gap-1">
                            <label className={labelClass}>
                                Relationship Type <span className="text-[#E05252]">*</span>
                            </label>
                            <SearchableDropdown
                                value={selectedTypeCode}
                                onChange={setSelectedTypeCode}
                                options={relTypeOptions}
                                placeholder="Select"
                            />
                            <span className="text-xs text-[#818181] font-[Satoshi,sans-serif]">
                                Cardinality and domain mappings are defined in the type.
                            </span>
                        </div>
                    </div>

                    {/* STEP 2 */}
                    <div>
                        <SectionTitle step={2} title="Select Entities" />
                        <div className="grid grid-cols-2 gap-4">

                            {/* FROM column */}
                            <div className="flex flex-col gap-3">
                                <div>
                                    <label className={labelClass}>
                                        From Attribute <span className="text-[#E05252]">*</span>
                                    </label>
                                    <SearchableDropdown
                                        value={fromAttrName}
                                        onChange={(v) => { setFromAttrName(v); setFromGoldenId(''); setFromLabel(''); }}
                                        options={fromAttrOptions}
                                        placeholder={attrLoading ? 'Loading…' : 'Select attribute'}
                                        disabled={!selectedTypeCode || attrLoading}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>
                                        From Entity <span className="text-[#E05252]">*</span>
                                    </label>
                                    <SearchablePaginationDropdown
                                        value={fromGoldenId}
                                        onChange={handleFromEntitySelect}
                                        options={fromSearch.options}
                                        placeholder={fromSearch.loading ? 'Loading…' : 'Search entity'}
                                        disabled={!fromAttrName}
                                        onSearch={fromSearch.handleSearch}
                                        hasMore={fromSearch.hasMore}
                                        loadingMore={fromSearch.loadingMore}
                                        onLoadMore={fromSearch.handleLoadMore}
                                    />
                                    {fromGoldenId && (
                                        <SelectedEntityCard
                                            label={fromLabel}
                                            goldenId={fromGoldenId}
                                            onClear={() => { setFromGoldenId(''); setFromLabel(''); }}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* TO column */}
                            <div className="flex flex-col gap-3">
                                <div>
                                    <label className={labelClass}>
                                        To Attribute <span className="text-[#E05252]">*</span>
                                    </label>
                                    <SearchableDropdown
                                        value={toAttrName}
                                        onChange={(v) => { setToAttrName(v); setToGoldenId(''); setToLabel(''); }}
                                        options={toAttrOptions}
                                        placeholder={attrLoading ? 'Loading…' : 'Select attribute'}
                                        disabled={!selectedTypeCode || attrLoading}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>
                                        To Entity <span className="text-[#E05252]">*</span>
                                    </label>
                                    <SearchablePaginationDropdown
                                        value={toGoldenId}
                                        onChange={handleToEntitySelect}
                                        options={toSearch.options}
                                        placeholder={toSearch.loading ? 'Loading…' : 'Search entity'}
                                        disabled={!toAttrName}
                                        onSearch={toSearch.handleSearch}
                                        hasMore={toSearch.hasMore}
                                        loadingMore={toSearch.loadingMore}
                                        onLoadMore={toSearch.handleLoadMore}
                                    />
                                    {toGoldenId && (
                                        <SelectedEntityCard
                                            label={toLabel}
                                            goldenId={toGoldenId}
                                            onClear={() => { setToGoldenId(''); setToLabel(''); }}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* STEP 3 */}
                    <div>
                        <SectionTitle step={3} title="Relationship Details" />

                        {/* Role + Ownership */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className={labelClass}>
                                    Role <span className="text-[#E05252]">*</span>
                                </label>
                                <SearchableDropdown
                                    value={role}
                                    onChange={setRole}
                                    options={ROLE_OPTIONS}
                                    placeholder="Select"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Ownership Percentage</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        placeholder="Enter Ownership Percentage"
                                        value={ownershipPct}
                                        onChange={e => setOwnershipPct(e.target.value)}
                                        className="w-full border border-[#CCCCCC] rounded-lg py-[9px] pl-3 pr-9 text-sm text-[#282F49] font-[Satoshi,sans-serif] outline-none box-border"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#818181] text-[13px]">
                                        %
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Status */}
                        <div className="mb-4 w-[calc(50%-8px)]">
                            <label className={labelClass}>
                                Status <span className="text-[#E05252]">*</span>
                            </label>
                            <SearchableDropdown
                                value={status}
                                onChange={setStatus}
                                options={STATUS_OPTIONS}
                                placeholder="Select"
                            />
                        </div>

                        {/* Effective Dates */}
                        <div>
                            <p className="text-sm font-semibold text-[#23252D] font-[Satoshi,sans-serif] mb-2.5 mt-0">
                                Effective Dates
                            </p>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className={labelClass}>
                                        Effective From <span className="text-[#E05252]">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        min={today}
                                        value={effectiveFrom}
                                        onChange={e => setEffectiveFrom(e.target.value)}
                                        className={`w-full border border-[#CCCCCC] rounded-lg px-3 py-[9px] text-sm font-[Satoshi,sans-serif] outline-none box-border ${effectiveFrom ? 'text-[#282F49]' : 'text-[#9CA3AF]'}`}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>
                                        Effective To <span className="text-[#E05252]">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        min={effectiveFrom || today}
                                        value={effectiveTo}
                                        onChange={e => setEffectiveTo(e.target.value)}
                                        className={`w-full border border-[#CCCCCC] rounded-lg px-3 py-[9px] text-sm font-[Satoshi,sans-serif] outline-none box-border ${effectiveTo ? 'text-[#282F49]' : 'text-[#9CA3AF]'}`}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className={labelClass}>Notes / Comments</label>
                            <textarea
                                rows={3}
                                placeholder="joint ownership details, special conditions"
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                className="w-full border border-[#CCCCCC] rounded-lg px-3 py-2.5 text-sm text-[#282F49] font-[Satoshi,sans-serif] outline-none resize-none box-border leading-relaxed"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="h-[68px] flex items-center justify-end gap-3 px-6 shadow-[0px_-4px_9px_rgba(0,0,0,0.08)] flex-shrink-0">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-5 py-2.5 text-sm font-medium text-[#8E77BB] border border-[#8E77BB] rounded-lg bg-white cursor-pointer font-[Satoshi,sans-serif]"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!isValid || isSubmitting}
                        className={`px-5 py-2.5 text-sm font-medium text-white border-none rounded-lg font-[Satoshi,sans-serif] transition-colors
                            ${isValid && !isSubmitting
                                ? 'bg-[#8E77BB] cursor-pointer hover:bg-[#7a67a0]'
                                : 'bg-[#CBC0E0] cursor-not-allowed'
                            }`}
                    >
                        {isSubmitting ? 'Creating…' : 'Create Link'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateCrossDomainLinkModal;