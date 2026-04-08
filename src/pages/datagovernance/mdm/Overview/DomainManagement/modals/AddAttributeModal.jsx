import React, { useState, useEffect } from 'react';
import { X, Plus, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../../../../../context/AuthContext';
import { toast } from 'react-hot-toast';
import SearchableDropdown from '../../../components/SearchableDropdown';
import MultiSelectDropdown from '../../../components/MultiSelectDropdown';
import { useAllRules, useAddAttribute } from '../../../../../../hooks/mdm/domainManagement';

const inputClass =
    'w-full border border-[#CCCCCC] rounded-lg px-3.5 py-2.5 text-sm font-normal text-[#282F49] outline-none bg-white font-[Satoshi,sans-serif] leading-none box-border focus:border-[#8e78b7]';
const labelClass =
    'text-sm font-medium text-[#332849] font-[Satoshi,sans-serif] leading-none mb-1.5 block';

const DATA_TYPE_OPTIONS = [
    { label: 'VARCHAR',      value: 'VARCHAR' },
    { label: 'VARCHAR(n)',   value: 'VARCHAR(n)' },
    { label: 'TEXT',         value: 'TEXT' },
    { label: 'INTEGER',      value: 'INTEGER' },
    { label: 'BIGINT',       value: 'BIGINT' },
    { label: 'NUMERIC(p,s)', value: 'NUMERIC(p,s)' },
    { label: 'DATE',         value: 'DATE' },
    { label: 'TIMESTAMPTZ',  value: 'TIMESTAMPTZ' },
    { label: 'BOOLEAN',      value: 'BOOLEAN' },
    { label: 'JSONB',        value: 'JSONB' },
];

const REQUIRED_OPTIONS = [
    { label: 'Yes', value: 'Yes' },
    { label: 'No',  value: 'No' },
];

const SURVIVORSHIP_OPTIONS = [
    { label: 'Most Recent',    value: 'most_recent' },
    { label: 'Most Frequent',  value: 'most_frequent' },
    { label: 'Longest',        value: 'longest' },
    { label: 'Shortest',       value: 'shortest' },
    { label: 'First Non-Null', value: 'first_non_null' },
    { label: 'Last Non-Null',  value: 'last_non_null' },
    { label: 'Max',            value: 'max' },
    { label: 'Min',            value: 'min' },
    { label: 'Manual',         value: 'manual' },
];

const emptyAttribute = () => ({
    id: Date.now() + Math.random(),
    attributeName: '',
    displayName: '',
    dataType: '',
    lengthPrecision: '',
    required: '',
    dqRuleIds: [],
    customRegex: '',
    matchWeight: '',
    survivorshipStrategy: '',
    expanded: true,
});

const isAttrValid = (attr) =>
    attr.attributeName.trim() && attr.displayName.trim() && attr.dataType;

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
const AddAttributeModal = ({
    isOpen,
    onClose,
    onSaveAttributes,
    initialAttributes = [],
    domainName,
    domainId,
    onComplete,
}) => {
    const { decodedToken } = useAuth();
    const [attributes, setAttributes] = useState(
        initialAttributes.length > 0
            ? initialAttributes.map((a) => ({ ...a, expanded: false }))
            : [emptyAttribute()]
    );

    /* ── Hooks ── */
    const { rules: allRules } = useAllRules();
    const { isSubmitting, addAttribute } = useAddAttribute();

    useEffect(() => {
        if (isOpen) {
            setAttributes(
                initialAttributes.length > 0
                    ? initialAttributes.map((a, i) => ({
                          ...a,
                          expanded: i === initialAttributes.length - 1,
                      }))
                    : [emptyAttribute()]
            );
        }
    }, [isOpen]);

    /* ── Helpers ── */
    const updateAttr = (id, field, value) =>
        setAttributes((prev) => prev.map((a) => (a.id === id ? { ...a, [field]: value } : a)));

    const toggleRuleForAttr = (attrId, ruleId) => {
        setAttributes((prev) =>
            prev.map((a) => {
                if (a.id !== attrId) return a;
                const has = a.dqRuleIds.includes(ruleId);
                return { ...a, dqRuleIds: has ? a.dqRuleIds.filter((id) => id !== ruleId) : [...a.dqRuleIds, ruleId] };
            })
        );
    };

    const selectAllRulesForAttr = (attrId, currentIds) => {
        setAttributes((prev) =>
            prev.map((a) =>
                a.id === attrId
                    ? { ...a, dqRuleIds: currentIds.length === allRules.length ? [] : allRules.map((r) => r.rule_id) }
                    : a
            )
        );
    };

    const toggleExpand = (id) =>
        setAttributes((prev) =>
            prev.map((a) => ({ ...a, expanded: a.id === id ? !a.expanded : false }))
        );

    const addAnother = () =>
        setAttributes((prev) => [
            ...prev.map((a) => ({ ...a, expanded: false })),
            emptyAttribute(),
        ]);

    const removeAttr = (id) =>
        setAttributes((prev) => {
            const next = prev.filter((a) => a.id !== id);
            return next.length > 0 ? next : [emptyAttribute()];
        });

    /* ── Submit ── */
    const handleSubmit = async () => {
        if (domainId) {
            const payload = {
                domain_id: domainId,
                attributes: attributes.map((attr) => ({
                    attribute_name:       attr.attributeName,
                    display_name:         attr.displayName,
                    data_type:            attr.dataType,
                    length_precision:     attr.lengthPrecision || null,
                    required:             attr.required ? attr.required : 'no',
                    rule_ids:             attr.dqRuleIds?.length > 0 ? attr.dqRuleIds : null,
                    regex:                attr.customRegex || null,
                    match_weight:         attr.matchWeight ? Number(attr.matchWeight) : null,
                    survivorship_strategy: attr.survivorshipStrategy || null,
                })),
                created_by: decodedToken?.preferred_username,
            };

            const result = await addAttribute(payload);
            if (result.ok) {
                toast.success('Attributes added successfully.');
                onComplete?.();
                onClose();
            } else {
                toast.error(result.message);
            }
        } else {
            onSaveAttributes?.(attributes);
            onClose();
        }
    };

    if (!isOpen) return null;

    const lastAttr  = attributes[attributes.length - 1];
    const canAddAnother = isAttrValid(lastAttr);
    const canSubmit     = attributes.every(isAttrValid);

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40"
            onClick={onClose}
        >
            <div
                className="w-[830px] h-[90vh] bg-white rounded-2xl border border-[#CCCCCC] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="shrink-0 flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-2.5">
                        <button onClick={onClose} className="bg-transparent border-none cursor-pointer p-0.5 text-[#818181] flex items-center">
                            <ArrowLeft size={18} />
                        </button>
                        <span className="text-lg font-medium text-[#282F49]">
                            Add Attribute
                            {attributes.length > 0 && (
                                <span className="text-sm font-normal text-[#8e78b7] ml-2">
                                    ({attributes.length}{' '}
                                    {attributes.length === 1 ? 'Attribute' : 'Attributes'})
                                </span>
                            )}
                        </span>
                    </div>
                    <button onClick={onClose} className="bg-transparent border-none cursor-pointer p-1 text-[#818181] flex">
                        <X size={20} />
                    </button>
                </div>

                {/* Note */}
                <div className="shrink-0 px-6 pt-1 pb-3">
                    <div className="bg-[#FAFAFA] rounded-lg px-4 py-3">
                        <span className="text-sm text-[#332849] leading-relaxed">
                            <span className="font-medium text-[#8e78b7]">Note: </span>
                            Define the schema and validation rules for each attribute. You can add multiple
                            attributes at once by clicking "Add Another Attribute" below.
                        </span>
                    </div>
                </div>

                {/* Accordion list */}
                <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-2 flex flex-col gap-2.5">
                    {attributes.map((attr, index) => (
                        <div key={attr.id} className="shrink-0 bg-[#FAFAFA] rounded-xl overflow-visible">
                            {/* Accordion header */}
                            <div className="flex items-center">
                                <button
                                    onClick={() => toggleExpand(attr.id)}
                                    className="flex-1 flex items-center justify-between px-4 py-3.5 bg-transparent border-none cursor-pointer"
                                >
                                    <span className="text-base font-medium text-[#332849]">
                                        Attribute {index + 1}
                                        {attr.attributeName && (
                                            <span className="text-sm font-normal text-[#818181] ml-2">
                                                — {attr.attributeName}
                                            </span>
                                        )}
                                    </span>
                                    {attr.expanded
                                        ? <ChevronUp size={16} className="text-[#818181]" />
                                        : <ChevronDown size={16} className="text-[#818181]" />}
                                </button>
                                {attributes.length > 1 && (
                                    <button
                                        onClick={() => removeAttr(attr.id)}
                                        className="pr-4 text-[#818181] hover:text-[#E05252] bg-transparent border-none cursor-pointer flex items-center transition-colors"
                                    >
                                        <X size={15} />
                                    </button>
                                )}
                            </div>

                            {/* Accordion body */}
                            {attr.expanded && (
                                <div className="px-4 pb-4 grid grid-cols-2 gap-3.5">
                                    <div>
                                        <label className={labelClass}>
                                            Attribute Name <span className="text-[#E05252]">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Enter Attribute Name"
                                            value={attr.attributeName}
                                            onChange={(e) => updateAttr(attr.id, 'attributeName', e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>

                                    <div>
                                        <label className={labelClass}>
                                            Display Name <span className="text-[#E05252]">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Enter Display Name"
                                            value={attr.displayName}
                                            onChange={(e) => updateAttr(attr.id, 'displayName', e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>

                                    <div>
                                        <label className={labelClass}>
                                            Data Type <span className="text-[#E05252]">*</span>
                                        </label>
                                        <SearchableDropdown
                                            value={attr.dataType}
                                            onChange={(val) => updateAttr(attr.id, 'dataType', val)}
                                            options={DATA_TYPE_OPTIONS}
                                            placeholder="Select Data Type"
                                        />
                                    </div>

                                    <div>
                                        <label className={labelClass}>Length / Precision</label>
                                        <input
                                            type="text"
                                            placeholder="Enter Length / Precision"
                                            value={attr.lengthPrecision}
                                            onChange={(e) => updateAttr(attr.id, 'lengthPrecision', e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>

                                    <div>
                                        <label className={labelClass}>Required</label>
                                        <SearchableDropdown
                                            value={attr.required}
                                            onChange={(val) => updateAttr(attr.id, 'required', val)}
                                            options={REQUIRED_OPTIONS}
                                            placeholder="Select"
                                        />
                                    </div>

                                    <div>
                                        <label className={labelClass}>DQ Rule</label>
                                        <MultiSelectDropdown
                                            selectedIds={attr.dqRuleIds}
                                            onToggle={(ruleId) => toggleRuleForAttr(attr.id, ruleId)}
                                            onSelectAll={(currentIds) => selectAllRulesForAttr(attr.id, currentIds)}
                                            options={allRules}
                                        />
                                    </div>

                                    <div>
                                        <label className={labelClass}>Custom Regex (if applicable)</label>
                                        <input
                                            type="text"
                                            placeholder="Enter Custom Regex"
                                            value={attr.customRegex}
                                            onChange={(e) => updateAttr(attr.id, 'customRegex', e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>

                                    <div>
                                        <label className={labelClass}>Match Weight (%)</label>
                                        <input
                                            type="text"
                                            placeholder="Enter Match Weight"
                                            value={attr.matchWeight}
                                            onChange={(e) => updateAttr(attr.id, 'matchWeight', e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>

                                    <div className="col-span-2">
                                        <label className={labelClass}>Survivorship Strategy</label>
                                        <SearchableDropdown
                                            value={attr.survivorshipStrategy}
                                            onChange={(val) => updateAttr(attr.id, 'survivorshipStrategy', val)}
                                            options={SURVIVORSHIP_OPTIONS}
                                            placeholder="Select Survivorship Strategy"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="shrink-0 bg-white rounded-b-2xl shadow-[0px_-4px_9px_0px_rgba(0,0,0,0.08)]">
                    <div className="flex items-center justify-between gap-3 px-6 py-4">
                        <button
                            onClick={addAnother}
                            disabled={!canAddAnother}
                            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-transparent text-sm font-medium transition-colors duration-150
                                ${canAddAnother
                                    ? 'border border-dashed border-[#8e78b7] text-[#8e78b7] cursor-pointer hover:bg-[#F3EFFF]'
                                    : 'border border-dashed border-[#CCCCCC] text-[#BBBBBB] cursor-not-allowed'}`}
                        >
                            <Plus size={15} />
                            Add Another Attribute
                        </button>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={onClose}
                                className="px-5 py-2.5 text-sm font-medium text-[#282F49] border border-[#CCCCCC] rounded-lg bg-white cursor-pointer hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!canSubmit || isSubmitting}
                                className={`px-5 py-2.5 text-sm font-medium text-white border-none rounded-lg
                                    ${canSubmit && !isSubmitting
                                        ? 'bg-[#8e78b7] cursor-pointer hover:bg-[#7a67a0]'
                                        : 'bg-[#C4B8E0] cursor-not-allowed'}`}
                            >
                                {isSubmitting ? 'Saving...' : 'Save Attributes'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddAttributeModal;