// ─── AddDomain.jsx ────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { useAuth } from '../../../../../../context/AuthContext';
import AddAttributeModal from './AddAttributeModal';
import SearchableDropdown from '../../../components/SearchableDropdown';
import { useAddDomain } from '../../../../../../hooks/mdm/domainManagement';

const inputClass =
    'w-full border border-[#CCCCCC] rounded-lg px-3.5 py-2.5 text-sm font-normal text-[#282F49] outline-none bg-white font-[Satoshi,sans-serif] leading-none box-border focus:border-[#8e78b7]';
const labelClass =
    'text-sm font-medium text-[#282F49] font-[Satoshi,sans-serif] leading-none mb-1.5 block';

const DOMAIN_TYPE_OPTIONS = [
    { label: 'PARTY',      value: 'PARTY' },
    { label: 'INSTRUMENT', value: 'INSTRUMENT' },
    { label: 'REFERENCE',  value: 'REFERENCE' },
    { label: 'MASTER',     value: 'MASTER' },
];

const VERSIONING_OPTIONS = [
    { label: 'Yes', value: 'Yes' },
    { label: 'No',  value: 'No' },
];

const toDomainCode = (name) => name.trim().toUpperCase().replace(/\s+/g, '_');

const toApiAttribute = (attr) => ({
    attribute_name:        attr.attributeName,
    display_name:          attr.displayName,
    data_type:             attr.dataType.toLowerCase(),
    length_precision:      attr.lengthPrecision || null,
    required:              attr.required ? attr.required.toLowerCase() : 'no',
    rule_ids:              attr.dqRuleIds?.length > 0 ? attr.dqRuleIds : null,
    regex:                 attr.customRegex || null,
    match_weight:          attr.matchWeight ? Number(attr.matchWeight) : null,
    survivorship_strategy: attr.survivorshipStrategy || null,
});

export const AddDomainModal = ({ isOpen, onClose, onComplete }) => {
    const { decodedToken } = useAuth();
    const [formData, setFormData] = useState({
        domainName: '', tableName: '', domainType: '', enableVersioning: '', description: '',
    });
    const [error, setError]               = useState('');
    const [attributes, setAttributes]     = useState([]);
    const [showAddAttribute, setShowAddAttribute] = useState(false);

    const { isSubmitting, addDomain } = useAddDomain(onComplete);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        setError('');
        const result = await addDomain({
            domain_name:       formData.domainName,
            domain_code:       toDomainCode(formData.domainName || formData.tableName),
            table_name:        formData.tableName,
            domain_type:       formData.domainType,
            enable_versioning: formData.enableVersioning === 'Yes',
            description:       formData.description,
            created_by:        decodedToken?.preferred_username,
            attributes:        attributes.map(toApiAttribute),
        });
        if (result.ok) {
            handleClose();
        } else {
            setError(result.message);
        }
    };

    const handleClose = () => {
        setFormData({ domainName: '', tableName: '', domainType: '', enableVersioning: '', description: '' });
        setAttributes([]);
        setError('');
        onClose();
    };

    const isFormValid = formData.tableName && formData.domainType;

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={handleClose}>
                <div className="w-[690px] bg-white rounded-2xl border border-[#CCCCCC] mx-4" onClick={(e) => e.stopPropagation()}>

                    {/* Header */}
                    <div className="flex items-center justify-between gap-4 px-6 py-4 rounded-t-2xl bg-white shadow-[0px_4px_9px_0px_rgba(0,0,0,0.10)]">
                        <span className="text-lg font-medium text-[#282F49]">Add Domain</span>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowAddAttribute(true)}
                                className="flex items-center gap-1.5 px-3.5 py-[7px] text-[13px] font-medium text-[#8e78b7] border border-[#8e78b7] rounded-lg bg-white cursor-pointer"
                            >
                                {attributes.length === 0 ? <><Plus size={14} />Add Attribute</> : <>View Attributes ({attributes.length})</>}
                            </button>
                            <button onClick={handleClose} className="bg-transparent border-none cursor-pointer p-1 text-[#818181] flex items-center">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="px-6 pt-2 pb-6 grid grid-cols-2 gap-5 bg-white">
                        <div className="flex flex-col gap-1.5">
                            <label className={`${labelClass} mb-0`}>Domain Name</label>
                            <input type="text" name="domainName" placeholder="Domain Name" value={formData.domainName} onChange={handleChange} className={inputClass} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className={`${labelClass} mb-0`}>Table Name <span className="text-[#E05252]">*</span></label>
                            <input type="text" name="tableName" placeholder="Table Name" value={formData.tableName} onChange={handleChange} className={inputClass} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className={`${labelClass} mb-0`}>Domain Type <span className="text-[#E05252]">*</span></label>
                            <SearchableDropdown value={formData.domainType} onChange={(val) => setFormData((p) => ({ ...p, domainType: val }))} options={DOMAIN_TYPE_OPTIONS} placeholder="Select Domain Type" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className={`${labelClass} mb-0`}>Enable Versioning</label>
                            <SearchableDropdown value={formData.enableVersioning} onChange={(val) => setFormData((p) => ({ ...p, enableVersioning: val }))} options={VERSIONING_OPTIONS} placeholder="Select" />
                        </div>
                        <div className="flex flex-col gap-1.5 col-span-2">
                            <label className={`${labelClass} mb-0`}>Description</label>
                            <textarea name="description" placeholder="Describe" value={formData.description} onChange={handleChange} rows={4} className={`${inputClass} resize-y leading-relaxed`} />
                        </div>
                        {error && (
                            <div className="col-span-2 text-sm text-[#E05252] bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="h-[72px] flex items-center justify-end gap-4 px-6 rounded-b-2xl bg-white shadow-[0px_-4px_9px_0px_rgba(0,0,0,0.10)]">
                        <button onClick={handleClose} className="px-5 py-2.5 text-sm font-medium text-[#282F49] border border-[#CCCCCC] rounded-lg bg-white cursor-pointer">Cancel</button>
                        <button
                            onClick={handleSubmit}
                            disabled={!isFormValid || isSubmitting}
                            className={`px-5 py-2.5 text-sm font-medium text-white border-none rounded-lg ${isFormValid && !isSubmitting ? 'bg-[#8e78b7] cursor-pointer' : 'bg-[#CBC0E0] cursor-not-allowed'}`}
                        >
                            {isSubmitting ? 'Creating...' : 'Create Domain'}
                        </button>
                    </div>
                </div>
            </div>

            <AddAttributeModal
                isOpen={showAddAttribute}
                onClose={() => setShowAddAttribute(false)}
                onSaveAttributes={(saved) => setAttributes(saved)}
                initialAttributes={attributes}
            />
        </>
    );
};

export default AddDomainModal;