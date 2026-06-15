import React, { useState, useEffect } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../../../../../context/AuthContext';
import { toast } from 'react-hot-toast';
import SearchableDropdown from '../../../components/SearchableDropdown';
import MultiSelectDropdown from '../../../components/MultiSelectDropdown';
import { useDQDimensions, useRulesByDimensions, useEditAttribute } from '../../../../../../hooks/mdm/domainManagement';

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



const isLengthValid = (dataType, lengthPrecision) => {
    const mode = getLengthMode(dataType);
    if (!mode) return true;
    if (mode === 'length') return !!lengthPrecision?.toString().trim();
    // precision_scale
    const parts = (lengthPrecision || '').split('/');
    return !!(parts[0]?.trim() && parts[1]?.trim());
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

const EditAttributeModal = ({ isOpen, onClose, onComplete, attributeData, domainName, domainId }) => {
    const { decodedToken } = useAuth();

    const [formData, setFormData] = useState({
        attributeName: '', displayName: '', sourceAttributeName: '', sourceDisplayName: '', dataType: '', lengthPrecision: '',
        required: '', dqDimension: [], ruleIds: [], 
    });

const { dimensions, isLoading: dimsLoading } = useDQDimensions();
const { rules, isLoading: rulesLoading, fetchRules } = useRulesByDimensions();
const { isSubmitting, editAttribute } = useEditAttribute();

const handleChange = (field, value) => setFormData(p => ({ ...p, [field]: value }));

useEffect(() => {
    if (formData.dqDimension?.length > 0) {
        fetchRules(formData.dqDimension);
    }
}, [formData.dqDimension]);

useEffect(() => {
    if (attributeData) {
        const rawType   = attributeData.data_type || attributeData.dataType || '';
        const rawLength = attributeData.length_precision || attributeData.lengthPrecision || '';
        const resolvedDtValue = resolveDataTypeValue(rawType, rawLength);

        const dqRules = attributeData.dq_rules || attributeData.dqRules || [];  // fix: was referencing undefined variable

        const derivedDimensions = [...new Set(
            dqRules.map(r => r.dq_dimension).filter(Boolean)
        )];

        setFormData({
            attributeName:       attributeData.attribute_name || attributeData.attributeName || '',
            displayName:         attributeData.display_name || attributeData.displayName || '',
            sourceAttributeName: attributeData.staging_column || '',
            sourceDisplayName:   attributeData.staging_display_name || '',
            dataType:            resolvedDtValue,
            lengthPrecision:     rawLength,
            required:            attributeData.is_mandatory ? 'Yes' : 'No',
            dqDimension:         derivedDimensions,
            ruleIds:             dqRules.map(r => r.rule_id),
        });
    }
}, [attributeData]);

if (!isOpen) return null;


    const handleDataTypeChange = (val) => {
        setFormData(p => ({ ...p, dataType: val, lengthPrecision: '' }));
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
        // Check if DQ Dimension is selected but DQ Rule is not
        if (formData.dqDimension?.length > 0 && (!formData.ruleIds || formData.ruleIds.length === 0)) {
            toast.error('DQ Rule is required when DQ Dimension is selected.');
            return;
        }

        const result = await editAttribute({
            domain_id:  domainId,
            updated_by: decodedToken?.preferred_username || null,
            attributes: [{
                attribute_id:          attributeData.attribute_id,
                attribute_name:        formData.attributeName || null,
                display_name:          formData.displayName || null,
                source_attribute_name: formData.sourceAttributeName || null,  
                source_display_name:   formData.sourceDisplayName || null,    
                data_type:             getPayloadType(formData.dataType),
                length_precision:      getLengthMode(formData.dataType) ? (formData.lengthPrecision || null) : null,
                required:              formData.required || null,
                rule:                  formData.ruleIds.length > 0 ? formData.ruleIds : [],
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
        // If DQ Dimension is selected, DQ Rule must be selected
        !(formData.dqDimension?.length > 0 && (!formData.ruleIds || formData.ruleIds.length === 0)) &&
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

                    {/* Row 1: Attribute Name | Display Name | Source Attribute Name | Source Display Name */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Golden Attribute Name <span className="text-[#E05252]">*</span></label>
                            <input type="text" placeholder="Enter Golden Attribute Name" value={formData.attributeName}
                                onChange={e => handleChange('attributeName', e.target.value)} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Golden Attribute Display Name <span className="text-[#E05252]">*</span></label>
                            <input type="text" placeholder="Enter Golden Attribute Display Name" value={formData.displayName}
                                onChange={e => handleChange('displayName', e.target.value)} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Source Attribute Name</label>
                            <input type="text" placeholder="Enter Source Attribute Name" value={formData.sourceAttributeName}
                                onChange={e => handleChange('sourceAttributeName', e.target.value)} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Source Attribute Display Name</label>
                            <input type="text" placeholder="Enter Source Attribute Display Name" value={formData.sourceDisplayName}
                                onChange={e => handleChange('sourceDisplayName', e.target.value)} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Data Type <span className="text-[#E05252]">*</span></label>
                            <SearchableDropdown
                                value={formData.dataType}
                                onChange={handleDataTypeChange}
                                options={DATA_TYPE_OPTIONS}
                                placeholder="Select Data Type"
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Required</label>
                            <SearchableDropdown
                                value={formData.required}
                                onChange={val => handleChange('required', val)}
                                options={REQUIRED_OPTIONS}
                                placeholder="Select"
                            />
                        </div>
                        {lengthMode && (
                            <LengthPrecisionInput
                                dataType={formData.dataType}
                                lengthPrecision={formData.lengthPrecision}
                                onChange={handleChange}
                            />
                        )}
                        <div>
                            <label className={labelClass}>DQ Dimension</label>
                            <MultiSelectDropdown
                                options={dimensions.map(d => ({ rule_id: d, rule_name: d }))}
                                selectedIds={formData.dqDimension}
                                onToggle={(id) => {
                                    const next = formData.dqDimension.includes(id)
                                        ? formData.dqDimension.filter(v => v !== id)
                                        : [...formData.dqDimension, id];
                                    handleChange('dqDimension', next);
                                    handleChange('ruleIds', []);
                                }}
                                onSelectAll={(currentIds) => {
                                    handleChange('dqDimension', currentIds.length === dimensions.length ? [] : [...dimensions]);
                                    handleChange('ruleIds', []);
                                }}
                                placeholder={dimsLoading ? 'Loading...' : 'Select Dimension'}
                            />
                        </div>
                        {formData.dqDimension?.length > 0 && (
                            <div>
                                <label className={labelClass}>DQ Rule <span className="text-[#E05252]">*</span></label>
                                <MultiSelectDropdown
                                    options={rules.map(r => ({ rule_id: r.rule_id, rule_name: r.rule_name }))}
                                    selectedIds={formData.ruleIds}
                                    onToggle={(id) => {
                                        const next = formData.ruleIds.includes(id)
                                            ? formData.ruleIds.filter(v => v !== id)
                                            : [...formData.ruleIds, id];
                                        handleChange('ruleIds', next);
                                    }}
                                    onSelectAll={(currentIds) => {
                                        const allIds = rules.map(r => r.rule_id);
                                        handleChange('ruleIds', currentIds.length === allIds.length ? [] : allIds);
                                    }}
                                    placeholder={rulesLoading ? 'Loading rules...' : 'Select Rules'}
                                />
                            </div>
                        )}
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