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
    { label: 'VARCHAR',      value: 'VARCHAR',     payloadType: 'VARCHAR',     lengthMode: null },
    { label: 'VARCHAR(n)',   value: 'VARCHAR_N',   payloadType: 'VARCHAR',     lengthMode: 'length' },
    { label: 'TEXT',         value: 'TEXT',        payloadType: 'TEXT',        lengthMode: null },
    { label: 'INTEGER',      value: 'INTEGER',     payloadType: 'INTEGER',     lengthMode: null },
    { label: 'BIGINT',       value: 'BIGINT',      payloadType: 'BIGINT',      lengthMode: null },
    { label: 'NUMERIC(p,s)', value: 'NUMERIC_PS',  payloadType: 'NUMERIC',     lengthMode: 'precision_scale' },
    { label: 'DATE',         value: 'DATE',        payloadType: 'DATE',        lengthMode: null },
    { label: 'TIMESTAMPTZ',  value: 'TIMESTAMPTZ', payloadType: 'TIMESTAMPTZ', lengthMode: null },
    { label: 'BOOLEAN',      value: 'BOOLEAN',     payloadType: 'BOOLEAN',     lengthMode: null },
    { label: 'JSONB',        value: 'JSONB',       payloadType: 'JSONB',       lengthMode: null },
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

const getLengthMode = (dtValue) =>
    DATA_TYPE_OPTIONS.find(o => o.value === dtValue)?.lengthMode ?? null;

const getPayloadType = (dtValue) =>
    DATA_TYPE_OPTIONS.find(o => o.value === dtValue)?.payloadType ?? dtValue;

const resolveDataTypeValue = (rawType, lengthPrecision) => {
    if (!rawType) return '';
    const upper = rawType.toUpperCase();
    if (upper === 'VARCHAR' && lengthPrecision) return 'VARCHAR_N';
    if (upper === 'NUMERIC' && lengthPrecision) return 'NUMERIC_PS';
    return DATA_TYPE_OPTIONS.find(o => o.payloadType === upper && o.lengthMode === null)?.value || upper;
};

const LengthPrecisionInput = ({ dataType, lengthPrecision, onChange }) => {
    const mode = getLengthMode(dataType);
    if (!mode) return null;

    if (mode === 'length') {
        return (
            <div>
                <label className={labelClass}>
                    Length (n) <span className="text-[#E05252]">*</span>
                </label>
                <input
                    type="number"
                    min={1}
                    placeholder="e.g. 100"
                    value={lengthPrecision}
                    onChange={e => onChange('lengthPrecision', e.target.value)}
                    className={inputClass}
                />
            </div>
        );
    }

    const parts = (lengthPrecision || '').split('/');
    const precision = parts[0] || '';
    const scale     = parts[1] || '';

    return (
        <>
            <div>
                <label className={labelClass}>
                    Precision (p) <span className="text-[#E05252]">*</span>
                </label>
                <input
                    type="number"
                    min={1}
                    placeholder="e.g. 10"
                    value={precision}
                    onChange={e => onChange('lengthPrecision', `${e.target.value}/${scale}`)}
                    className={inputClass}
                />
            </div>
            <div>
                <label className={labelClass}>
                    Scale (s) <span className="text-[#E05252]">*</span>
                </label>
                <input
                    type="number"
                    min={0}
                    placeholder="e.g. 2"
                    value={scale}
                    onChange={e => onChange('lengthPrecision', `${precision}/${e.target.value}`)}
                    className={inputClass}
                />
            </div>
        </>
    );
};

const isLengthValid = (dataType, lengthPrecision) => {
    const mode = getLengthMode(dataType);
    if (!mode) return true;
    if (mode === 'length') return !!lengthPrecision?.toString().trim();
    // precision_scale
    const parts = (lengthPrecision || '').split('/');
    return !!(parts[0]?.trim() && parts[1]?.trim());
};

const EditAttributeModal = ({ isOpen, onClose, onComplete, attributeData, domainName, domainId }) => {
    console.log("attribute data @@@ ", attributeData);
    const { decodedToken } = useAuth();

    const [formData, setFormData] = useState({
        attributeName: '', displayName: '', dataType: '', lengthPrecision: '',
        required: '', ruleIds: [], customRegex: '', matchWeight: '', survivorshipStrategy: '',
    });

    const { rules: allRules }             = useAllRules();
    const { isSubmitting, editAttribute } = useEditAttribute();

    useEffect(() => {
        if (attributeData) {
            const rawType        = attributeData.dataType || attributeData.data_type || '';
            const rawLength      = attributeData.lengthPrecision || attributeData.length_precision || '';
            const resolvedDtValue = resolveDataTypeValue(rawType, rawLength);

            setFormData({
                attributeName:        attributeData.attributeName || '',
                displayName:          attributeData.display_name || '',
                dataType:             resolvedDtValue,
                lengthPrecision:      rawLength,
                required:             attributeData.required || '',
                ruleIds:              (attributeData.dqRules || []).map(r => r.rule_id),
                customRegex:          attributeData.regex || attributeData.customRegex || '',
                matchWeight:
                    attributeData.matchWeight && attributeData.matchWeight !== '--'
                        ? attributeData.matchWeight : '',
                survivorshipStrategy: attributeData.survivorship || attributeData.survivorshipStrategy || '',
            });
        }
    }, [attributeData]);

    if (!isOpen) return null;

    const handleChange = (field, value) => setFormData(p => ({ ...p, [field]: value }));

    const handleDataTypeChange = (val) => {
        setFormData(p => ({ ...p, dataType: val, lengthPrecision: '' }));
    };

    const toggleRule = (ruleId) => {
        handleChange(
            'ruleIds',
            formData.ruleIds.includes(ruleId)
                ? formData.ruleIds.filter(id => id !== ruleId)
                : [...formData.ruleIds, ruleId]
        );
    };

    const toggleAllRules = () => {
        handleChange(
            'ruleIds',
            formData.ruleIds.length === allRules.length ? [] : allRules.map(r => r.rule_id)
        );
    };

    const handleSubmit = async () => {
        if (!formData.attributeName.trim() || !formData.displayName.trim() || !formData.dataType) {
            toast.error('Attribute Name, Display Name, and Data Type are required.');
            return;
        }
        if (!isLengthValid(formData.dataType, formData.lengthPrecision)) {
            const mode = getLengthMode(formData.dataType);
            toast.error(
                mode === 'length'
                    ? 'Length (n) is required for VARCHAR(n).'
                    : 'Precision (p) and Scale (s) are required for NUMERIC(p,s).'
            );
            return;
        }

        const result = await editAttribute({
            domain_id:  domainId,
            updated_by: decodedToken?.preferred_username || null,
            attributes: [{
                attribute_id:          attributeData.attribute_id,
                attribute_name:        formData.attributeName || null,
                display_name:          formData.displayName || null,
                data_type:             getPayloadType(formData.dataType),   // "VARCHAR", "NUMERIC", etc.
                length_precision:      getLengthMode(formData.dataType) ? (formData.lengthPrecision || null) : null,
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

    const canSubmit =
        formData.attributeName.trim() &&
        formData.displayName.trim() &&
        formData.dataType &&
        isLengthValid(formData.dataType, formData.lengthPrecision) &&
        !isSubmitting;

    const lengthMode = getLengthMode(formData.dataType);

    return (
        <>
            <div className="fixed inset-0 z-[60] bg-black/40" onClick={onClose} />
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <div
                    className="w-[700px] bg-white rounded-2xl border border-[#CCCCCC] flex flex-col overflow-hidden shadow-xl"
                    onClick={e => e.stopPropagation()}
                >
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
                                <input type="text" placeholder="Enter Attribute Name" value={formData.attributeName}
                                    onChange={e => handleChange('attributeName', e.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Display Name <span className="text-[#E05252]">*</span></label>
                                <input type="text" placeholder="Enter Display Name" value={formData.displayName}
                                    onChange={e => handleChange('displayName', e.target.value)} className={inputClass} />
                            </div>
                        </div>

                        <div className={`grid gap-4 ${lengthMode === 'precision_scale' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                            <div>
                                <label className={labelClass}>Data Type <span className="text-[#E05252]">*</span></label>
                                <SearchableDropdown
                                    value={formData.dataType}
                                    onChange={handleDataTypeChange}
                                    options={DATA_TYPE_OPTIONS}
                                    placeholder="Select Data Type"
                                />
                            </div>
                            <LengthPrecisionInput
                                dataType={formData.dataType}
                                lengthPrecision={formData.lengthPrecision}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Required</label>
                                <SearchableDropdown
                                    value={formData.required}
                                    onChange={val => handleChange('required', val)}
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
                                <input type="text" placeholder="Enter Custom Regex" value={formData.customRegex}
                                    onChange={e => handleChange('customRegex', e.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Match Weight (%)</label>
                                <input type="number" placeholder="Enter Match Weight" value={formData.matchWeight}
                                    onChange={e => handleChange('matchWeight', e.target.value)} className={inputClass} min={0} max={100} />
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Survivorship Strategy</label>
                            <SearchableDropdown
                                value={formData.survivorshipStrategy}
                                onChange={val => handleChange('survivorshipStrategy', val)}
                                options={SURVIVORSHIP_OPTIONS}
                                placeholder="Select Survivorship Strategy"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 px-6 py-4 rounded-b-2xl shadow-[0px_-4px_9px_0px_rgba(0,0,0,0.08)] bg-white mt-2">
                        <button onClick={onClose}
                            className="px-5 py-2.5 rounded-lg border border-[#8E77BB] text-[#8E77BB] text-sm font-medium bg-white hover:bg-purple-50 transition-colors font-[Satoshi,sans-serif]">
                            Cancel
                        </button>
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