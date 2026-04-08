import React, { useState, useEffect } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../../../../../context/AuthContext';
import { toast } from 'react-hot-toast';
import SearchableDropdown from '../../../components/SearchableDropdown';
import MultiSelectDropdown from '../../../components/MultiSelectDropdown';
import { useAllRules, useEditAttribute } from '../../../../../../hooks/mdm/domainManagement';

const inputClass =
    'w-full border border-[#CCCCCC] rounded-lg px-3.5 py-2.5 text-sm font-normal text-[#282F49] outline-none bg-white font-[Satoshi,sans-serif] leading-none box-border focus:border-[#8E77BB] focus:ring-2 focus:ring-purple-100 transition-all';
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

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
const EditAttributeModal = ({ isOpen, onClose, onComplete, attributeData, domainName, domainId }) => {
    console.log("attribute data @@@ ",attributeData)
    const { decodedToken } = useAuth();
    const [formData, setFormData] = useState({
        attributeName: '', displayName: '', dataType: '', lengthPrecision: '',
        required: '', ruleIds: [], customRegex: '', matchWeight: '', survivorshipStrategy: '',
    });

    const { rules: allRules }             = useAllRules();
    const { isSubmitting, editAttribute } = useEditAttribute();

    useEffect(() => {
        if (attributeData) {
            setFormData({
                attributeName:        attributeData.attributeName || '',
                displayName:          attributeData.display_name || '',
                dataType:             attributeData.dataType || attributeData.data_type || '',
                lengthPrecision:      attributeData.lengthPrecision || attributeData.length_precision || '',
                required:             attributeData.required || '',
                ruleIds:              (attributeData.dqRules || []).map((r) => r.rule_id),
                customRegex:          attributeData.regex || attributeData.customRegex || '',
                matchWeight:
                    attributeData.matchWeight && attributeData.matchWeight !== '--'
                        ? attributeData.matchWeight : '',
                survivorshipStrategy: attributeData.survivorship || attributeData.survivorshipStrategy || '',
            });
        }
    }, [attributeData]);

    if (!isOpen) return null;

    const handleChange = (field, value) => setFormData((p) => ({ ...p, [field]: value }));

    const toggleRule = (ruleId) => {
        handleChange(
            'ruleIds',
            formData.ruleIds.includes(ruleId)
                ? formData.ruleIds.filter((id) => id !== ruleId)
                : [...formData.ruleIds, ruleId]
        );
    };

    const toggleAllRules = () => {
        handleChange(
            'ruleIds',
            formData.ruleIds.length === allRules.length ? [] : allRules.map((r) => r.rule_id)
        );
    };

    const handleSubmit = async () => {
        if (!formData.attributeName.trim() || !formData.displayName.trim() || !formData.dataType) {
            toast.error('Attribute Name, Display Name, and Data Type are required.');
            return;
        }

        const result = await editAttribute({
            domain_id:  domainId,
            updated_by: decodedToken?.preferred_username || null,
            attributes: [{
                attribute_id:          attributeData.attribute_id,
                attribute_name:        formData.attributeName || null,
                display_name:          formData.displayName || null,
                data_type:             formData.dataType || null,
                length_precision:      formData.lengthPrecision || null,
                required:              formData.required || null,
                rule:                  formData.ruleIds.length > 0 ? formData.ruleIds : [],
                regex:                 formData.customRegex || null,
                match_weight:          formData.matchWeight ? parseInt(formData.matchWeight, 10) : null,
                survivorship_strategy: formData.survivorshipStrategy || null,
            }],
        });

        if (result.ok) {
            toast.success(result.data?.message || 'Attribute updated successfully.');
            onComplete?.(result.data);
            onClose();
        } else {
            toast.error(result.message);
        }
    };

    const canSubmit = formData.attributeName.trim() && formData.displayName.trim() && formData.dataType && !isSubmitting;

    return (
        <>
            <div className="fixed inset-0 z-[60] bg-black/40" onClick={onClose} />
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <div className="w-[700px] bg-white rounded-2xl border border-[#CCCCCC] flex flex-col overflow-hidden shadow-xl" onClick={(e) => e.stopPropagation()}>

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-2.5">
                            <button onClick={onClose} className="bg-transparent border-none cursor-pointer p-0.5 text-[#818181] flex items-center">
                                <ArrowLeft size={18} />
                            </button>
                            <div className="flex items-center gap-1">
                                <span className="font-medium text-lg text-[#282F49] font-[Satoshi,sans-serif]">Edit Attribute —&nbsp;</span>
                                <span className="font-medium text-lg text-[#8E77BB] font-[Satoshi,sans-serif]">{domainName || 'Product Master'}</span>
                            </div>
                        </div>
                        <button onClick={onClose} className="bg-transparent border-none cursor-pointer p-1 text-[#818181] flex hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Form body */}
                    <div className="px-6 py-2 flex flex-col gap-4 overflow-y-auto max-h-[70vh]">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Attribute Name <span className="text-[#E05252]">*</span></label>
                                <input type="text" placeholder="Enter Attribute Name" value={formData.attributeName} onChange={(e) => handleChange('attributeName', e.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Display Name <span className="text-[#E05252]">*</span></label>
                                <input type="text" placeholder="Enter Display Name" value={formData.displayName} onChange={(e) => handleChange('displayName', e.target.value)} className={inputClass} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Data Type <span className="text-[#E05252]">*</span></label>
                                <SearchableDropdown
                                    value={formData.dataType}
                                    onChange={(val) => handleChange('dataType', val)}
                                    options={DATA_TYPE_OPTIONS}
                                    placeholder="Select Data Type"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Length / Precision</label>
                                <input type="text" placeholder="Enter Length / Precision" value={formData.lengthPrecision} onChange={(e) => handleChange('lengthPrecision', e.target.value)} className={inputClass} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Required</label>
                                <SearchableDropdown
                                    value={formData.required}
                                    onChange={(val) => handleChange('required', val)}
                                    options={REQUIRED_OPTIONS}
                                    placeholder="Select"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>DQ Rule</label>
                                <MultiSelectDropdown
                                    selectedIds={formData.ruleIds}
                                    onToggle={toggleRule}
                                    onSelectAll={toggleAllRules}
                                    options={allRules}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Custom Regex (if applicable)</label>
                                <input type="text" placeholder="Enter Custom Regex" value={formData.customRegex} onChange={(e) => handleChange('customRegex', e.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Match Weight (%)</label>
                                <input type="number" placeholder="Enter Match Weight" value={formData.matchWeight} onChange={(e) => handleChange('matchWeight', e.target.value)} className={inputClass} min={0} max={100} />
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Survivorship Strategy</label>
                            <SearchableDropdown
                                value={formData.survivorshipStrategy}
                                onChange={(val) => handleChange('survivorshipStrategy', val)}
                                options={SURVIVORSHIP_OPTIONS}
                                placeholder="Select Survivorship Strategy"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 px-6 py-4 rounded-b-2xl shadow-[0px_-4px_9px_0px_rgba(0,0,0,0.08)] bg-white mt-2">
                        <button onClick={onClose} className="px-5 py-2.5 rounded-lg border border-[#8E77BB] text-[#8E77BB] text-sm font-medium bg-white hover:bg-purple-50 transition-colors font-[Satoshi,sans-serif]">Cancel</button>
                        <button
                            onClick={handleSubmit}
                            disabled={!canSubmit}
                            className={`px-5 py-2.5 rounded-lg text-sm font-medium text-white border-none font-[Satoshi,sans-serif] transition-colors ${canSubmit ? 'bg-[#8E77BB] cursor-pointer hover:bg-[#7a67a0]' : 'bg-[#C4B8E0] cursor-not-allowed'}`}
                        >
                            {isSubmitting ? 'Saving…' : 'Update Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default EditAttributeModal;