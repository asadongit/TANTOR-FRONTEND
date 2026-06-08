import { useState, useRef, useEffect, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { ChevronDown, X, Plus, ChevronUp, Check, ArrowLeft } from "lucide-react";
import SettingsInputComponentIcons from '../../../../../../assets/mdm/settings_input_component.svg';
import ListAltCheckIcons from '../../../../../../assets/mdm/list_alt_check.svg';
import DashboardCustomizeIcons from '../../../../../../assets/mdm/dashboard_customize.svg';
import MultiSelectDropdown from "../../../components/MultiSelectDropdown";
import SearchableDropdown from "../../../components/SearchableDropdown";
import { useAddDomain, useDQDimensions, useRulesByDimensions } from "../../../../../../hooks/mdm/domainManagement";
import { useAuth } from '../../../../../../context/AuthContext';
const DOMAIN_TYPE_OPTIONS = [
    { label: "PARTY", value: "PARTY" },
    { label: "INSTRUMENT", value: "INSTRUMENT" },
    { label: "REFERENCE", value: "REFERENCE" },
    { label: "MASTER", value: "MASTER" },
];
const VERSIONING_OPTIONS = [
    { label: "Yes", value: "Yes" },
    { label: "No", value: "No" },
];
const CRITICALITY_OPTIONS = [
    { label: "Low",    value: "low" },
    { label: "Medium", value: "medium" },
    { label: "High",   value: "high" },
];
const DATA_TYPE_OPTIONS = [
    { label: "VARCHAR", value: "VARCHAR", payloadType: "VARCHAR", lengthMode: null },
    { label: "VARCHAR(n)", value: "VARCHAR_N", payloadType: "VARCHAR", lengthMode: "length" },
    { label: "TEXT", value: "TEXT", payloadType: "TEXT", lengthMode: null },
    { label: "INTEGER", value: "INTEGER", payloadType: "INTEGER", lengthMode: null },
    { label: "BIGINT", value: "BIGINT", payloadType: "BIGINT", lengthMode: null },
    { label: "NUMERIC(p,s)", value: "NUMERIC_PS", payloadType: "NUMERIC", lengthMode: "precision_scale" },
    { label: "DATE", value: "DATE", payloadType: "DATE", lengthMode: null },
    { label: "TIMESTAMPTZ", value: "TIMESTAMPTZ", payloadType: "TIMESTAMPTZ", lengthMode: null },
    { label: "BOOLEAN", value: "BOOLEAN", payloadType: "BOOLEAN", lengthMode: null },
    { label: "JSONB", value: "JSONB", payloadType: "JSONB", lengthMode: null },
];

const REQUIRED_OPTIONS = [
    { label: "Yes", value: "yes" },
    { label: "No", value: "no" },
];


const getLengthMode = (dtValue) =>
    DATA_TYPE_OPTIONS.find(o => o.value === dtValue)?.lengthMode ?? null;

const getPayloadType = (dtValue) =>
    DATA_TYPE_OPTIONS.find(o => o.value === dtValue)?.payloadType ?? dtValue;

const emptyAttr = () => ({
    id: Date.now() + Math.random(),
    attributeName: "", displayName: "",
    sourceAttributeName: "", sourceDisplayName: "",
    dataType: "",
    lengthPrecision: "",
    scaleValue: "",
    required: "",
    criticality: "",
    dqRule: [], dqDimension: [], expanded: true,
});

const inputClass =
    "w-full border border-[#CCCCCC] rounded-lg px-3.5 py-2.5 text-sm font-normal text-[#282F49] outline-none bg-white font-[Satoshi] leading-none box-border focus:border-[#8e78b7]";
const labelClass =
    "text-sm font-medium text-[#282F49] font-[Satoshi] leading-none mb-1.5 block";

const STEPS = ["Domain Definition", "Attributes", "360° View Layout"];
const STEP_ICONS = [SettingsInputComponentIcons, ListAltCheckIcons, DashboardCustomizeIcons];

const ACTIVE_ICON_FILTER =
    'invert(51%) sepia(29%) saturate(672%) hue-rotate(221deg) brightness(88%) contrast(87%)';

function SvgIcon({ src, size = 20, className = '', style = {} }) {
    return (
        <img src={src} alt="" className={className}
            style={{ width: size, height: size, minWidth: size, minHeight: size, maxWidth: size, maxHeight: size, display: 'block', objectFit: 'contain', ...style }}
        />
    );
}

const Stepper = ({ current }) => (
    <div className="bg-white rounded-md p-4 relative overflow-hidden">
        <div className="flex items-center justify-between w-full">
            {STEPS.map((label, i) => {
                const done = i < current;
                const active = i === current;
                return (
                    <Fragment key={i}>
                        <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-md flex items-center justify-center transition-all flex-shrink-0 ${active ? 'bg-[#F2EBFF] border border-[#8E77BB]' : done ? 'bg-[#D4FFEF]' : 'bg-[#F9F9F9]'}`}>
                                {done ? (
                                    <div className="bg-[#2ba995] rounded-full p-1"><Check size={12} className="text-white stroke-[4]" /></div>
                                ) : (
                                    <SvgIcon src={STEP_ICONS[i]} size={16} style={active ? { filter: ACTIVE_ICON_FILTER } : { opacity: 0.5 }} />
                                )}
                            </div>
                            <span className={`text-sm font-medium whitespace-nowrap ${active ? 'text-[#8e78b7]' : done ? 'text-[#36AD8F]' : 'text-[#818181]'}`}>
                                {label}
                            </span>
                        </div>
                        {i < STEPS.length - 1 && (
                            <div className="flex-1 flex items-center justify-center px-2">
                                <div className="w-full border-t border-dashed border-[#818181] relative flex items-center justify-end">
                                    <div className="absolute right-0 w-1.5 h-1.5 border-t border-r border-dashed border-[#818181] rotate-45 -mr-0.5" />
                                </div>
                            </div>
                        )}
                    </Fragment>
                );
            })}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[5px]" style={{ background: 'linear-gradient(90deg, #8E77BB 0%, #F2EBFF 100%)' }} />
    </div>
);

const Step1 = ({ data, onChange }) => (
    <div className="p-6">
        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
            {[
                { name: "domainName", label: "Domain Name ", placeholder: "Domain Name" },
                { name: "domainCode", label: "Domain Code", placeholder: "Domain Code" },
                { name: "tableName", label: "Table Name", placeholder: "Table Name" },
            ].map(f => (
                <div key={f.name}>
                    <label className={labelClass}>{f.label}<span className="text-[#E05252]">*</span></label>
                    <input value={data[f.name]} onChange={e => onChange(f.name, e.target.value)} placeholder={f.placeholder} className={inputClass} />
                </div>
            ))}
            <div>
                <label className={labelClass}>Domain Type <span className="text-[#E05252]">*</span></label>
                <SearchableDropdown value={data.domainType} onChange={v => onChange("domainType", v)} options={DOMAIN_TYPE_OPTIONS} placeholder="Select Domain Type" />
            </div>
            <div>
                <label className={labelClass}>Enable Versioning <span className="text-[#E05252]">*</span></label>
                <SearchableDropdown value={data.enableVersioning} onChange={v => onChange("enableVersioning", v)} options={VERSIONING_OPTIONS} placeholder="Select" />
            </div>
            <div className="col-span-2">
                <label className={labelClass}>Description</label>
                <textarea value={data.description} onChange={e => onChange("description", e.target.value)} placeholder="Describe" rows={3} className={`${inputClass} resize-y leading-relaxed`} />
            </div>
        </div>
    </div>
);

const LengthPrecisionInput = ({ dataType, lengthPrecision, onChange }) => {
    const mode = getLengthMode(dataType);
    if (!mode) return null;

    if (mode === "length") {
        return (
            <div>
                <label className={labelClass}>Length (n) <span className="text-[#E05252]">*</span></label>
                <input
                    value={lengthPrecision}
                    onChange={e => onChange("lengthPrecision", e.target.value)}
                    placeholder="e.g. 100"
                    className={inputClass}
                    type="number"
                    min={1}
                />
            </div>
        );
    }

    const parts = (lengthPrecision || "").split("/");
    const precision = parts[0] || "";
    const scale = parts[1] || "";

    const handlePrecision = (val) => onChange("lengthPrecision", `${val}/${scale}`);
    const handleScale = (val) => onChange("lengthPrecision", `${precision}/${val}`);

    return (
        <>
            <div>
                <label className={labelClass}>Precision (p) <span className="text-[#E05252]">*</span></label>
                <input
                    value={precision}
                    onChange={e => handlePrecision(e.target.value)}
                    placeholder="e.g. 10"
                    className={inputClass}
                    type="number"
                    min={1}
                />
            </div>
            <div>
                <label className={labelClass}>Scale (s) <span className="text-[#E05252]">*</span></label>
                <input
                    value={scale}
                    onChange={e => handleScale(e.target.value)}
                    placeholder="e.g. 2"
                    className={inputClass}
                    type="number"
                    min={0}
                />
            </div>
        </>
    );
};

const AttributeCard = ({ attr, index, total, onUpdate, onRemove }) => {
    const upd = (f, v) => onUpdate(attr.id, f, v);

    const { dimensions, isLoading: dimsLoading } = useDQDimensions();
    const { rules, isLoading: rulesLoading, fetchRules } = useRulesByDimensions();

    useEffect(() => {
        if (attr.dqDimension && attr.dqDimension.length > 0) {
            fetchRules(attr.dqDimension);
        } else {
            upd("dqRule", []);
        }
    }, [attr.dqDimension]);

    const handleDataTypeChange = (v) => {
        upd("dataType", v);
        upd("lengthPrecision", "");
    };

    const dimensionOptions = dimensions.map(d => ({ label: d, value: d }));
    const ruleOptions = rules.map(r => ({ rule_id: r.rule_id, rule_name: r.rule_name }));

    const lengthMode = getLengthMode(attr.dataType);

    return (
        <div className="bg-[#FAFAFA] rounded-lg mb-2.5 overflow-visible">
            <div className="flex items-center">
                <button type="button" onClick={() => upd("expanded", !attr.expanded)}
                    className="flex-1 flex items-center justify-between px-4 py-3.5 bg-transparent border-none cursor-pointer">
                    <span className="text-sm font-semibold text-[#332849]">
                        Attribute {index + 1}
                        {attr.attributeName && <span className="text-[13px] font-normal text-[#818181] ml-2">— {attr.attributeName}</span>}
                    </span>
                    {attr.expanded ? <ChevronUp size={15} color="#818181" /> : <ChevronDown size={15} color="#818181" />}
                </button>
                {total > 1 && (
                    <button type="button" onClick={() => onRemove(attr.id)} className="pr-3.5 bg-transparent border-none cursor-pointer text-[#818181]">
                        <X size={14} />
                    </button>
                )}
            </div>
            {attr.expanded && (
                <div className="px-4 pb-4 grid grid-cols-3 gap-x-4 gap-y-3.5">
                    {/* Attribute Name */}
                    <div>
                        <label className={labelClass}>Golden Attribute Name <span className="text-[#E05252]">*</span></label>
                        <input value={attr.attributeName} onChange={e => upd("attributeName", e.target.value)} placeholder="Enter Golden Attribute Name" className={inputClass} />
                    </div>

                    {/* Display Name */}
                    <div>
                        <label className={labelClass}> Golden Attribute Display Name <span className="text-[#E05252]">*</span></label>
                        <input value={attr.displayName} onChange={e => upd("displayName", e.target.value)} placeholder="Enter Golden Display Name" className={inputClass} />
                    </div>

                    {/* Source Attribute Name */}
                    <div>
                        <label className={labelClass}>Staging Attribute Name</label>
                        <input value={attr.sourceAttributeName} onChange={e => upd("sourceAttributeName", e.target.value)} placeholder="Enter Staging Attribute Name" className={inputClass} />
                    </div>

                    {/* Source Display Name */}
                    <div>
                        <label className={labelClass}>Staging Attribute Display Name</label>
                        <input value={attr.sourceDisplayName} onChange={e => upd("sourceDisplayName", e.target.value)} placeholder="Enter Staging Display Name" className={inputClass} />
                    </div>

                    {/* Data Type */}
                    <div>
                        <label className={labelClass}>Data Type <span className="text-[#E05252]">*</span></label>
                        <SearchableDropdown value={attr.dataType} onChange={handleDataTypeChange} options={DATA_TYPE_OPTIONS} placeholder="Select Data Type" />
                    </div>

                    {/* Conditional Length / Precision inputs — only shown for VARCHAR_N and NUMERIC_PS */}
                    <LengthPrecisionInput
                        dataType={attr.dataType}
                        lengthPrecision={attr.lengthPrecision}
                        onChange={upd}
                    />

                    {/* Required */}
                    <div>
                        <label className={labelClass}>Required</label>
                        <SearchableDropdown value={attr.required} onChange={v => upd("required", v)} options={REQUIRED_OPTIONS} placeholder="Select" />
                    </div>

                    {/* Criticality */}
                    <div>
                        <label className={labelClass}>Criticality <span className="text-[#E05252]">*</span></label>
                        <SearchableDropdown value={attr.criticality} onChange={v => upd("criticality", v)} options={CRITICALITY_OPTIONS} placeholder="Select Criticality" />
                    </div>

                    {/* DQ Dimension */}
                    <div>
                        <label className={labelClass}>DQ Dimension <span className="text-[#E05252]">*</span></label>
                        <MultiSelectDropdown
                            options={dimensionOptions.map(d => ({ rule_id: d.value, rule_name: d.label }))}
                            selectedIds={Array.isArray(attr.dqDimension) ? attr.dqDimension : attr.dqDimension ? [attr.dqDimension] : []}
                            onToggle={(id) => {
                                const current = Array.isArray(attr.dqDimension) ? attr.dqDimension : attr.dqDimension ? [attr.dqDimension] : [];
                                const next = current.includes(id)
                                    ? current.filter(v => v !== id)
                                    : [...current, id];
                                upd("dqDimension", next);
                                upd("dqRule", []);
                            }}
                            onSelectAll={(currentIds) => {
                                const allIds = dimensionOptions.map(d => d.value);
                                const next = currentIds.length === allIds.length ? [] : allIds;
                                upd("dqDimension", next);
                                upd("dqRule", []);
                            }}
                            placeholder={dimsLoading ? "Loading..." : "Select Dimension"}
                        />
                    </div>

                    {/* DQ Rule */}
                    <div>
                        <label className={labelClass}>DQ Rule <span className="text-[#E05252]">*</span></label>
                        <MultiSelectDropdown
                            options={ruleOptions}
                            selectedIds={attr.dqRule}
                            onToggle={(id) => {
                                const next = attr.dqRule.includes(id)
                                    ? attr.dqRule.filter(v => v !== id)
                                    : [...attr.dqRule, id];
                                upd("dqRule", next);
                            }}
                            onSelectAll={(currentIds) => {
                                const allIds = ruleOptions.map(r => r.rule_id);
                                upd("dqRule", currentIds.length === allIds.length ? [] : allIds);
                            }}
                            placeholder={
                                rulesLoading
                                    ? "Loading rules..."
                                    : (!attr.dqDimension || (Array.isArray(attr.dqDimension) && attr.dqDimension.length === 0))
                                        ? "Select dimension first"
                                        : "Select Rules"
                            }
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

const Step2 = ({ attributes, setAttributes }) => {
    const updateAttr = (id, field, value) =>
        setAttributes(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
    const removeAttr = (id) =>
        setAttributes(prev => { const n = prev.filter(a => a.id !== id); return n.length ? n : [emptyAttr()]; });

    return (
        <div className="px-5 py-4">
            <div className="p-2 text-sm font-medium text-[#332849] bg-[#FAFAFA] rounded-lg mb-3">
                <span className="font-semibold text-[#8e78b7]">Note: </span>
                Define the schema and validation rules for each attribute. You can add multiple attributes at once by clicking "Add Another Attribute" below.
            </div>
            <div className="">
                {attributes.map((attr, i) => (
                    <AttributeCard key={attr.id} attr={attr} index={i} total={attributes.length} onUpdate={updateAttr} onRemove={removeAttr} />
                ))}
            </div>
        </div>
    );
};

const FieldTag = ({ label, onRemove }) => (
    <span className="inline-flex items-center gap-1.5 bg-[#FFFFFF] border border-[#CCCCCC] text-[#818181] rounded-lg px-3 py-1 text-sm font-medium">
        {label}
        <button type="button" onClick={onRemove} className="bg-transparent border-none cursor-pointer text-[#818181] flex p-0"><X size={12} /></button>
    </span>
);

const AddFieldsModal = ({ isOpen, onClose, onSubmit, availableOptions, title = "Add Fields" }) => {
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState([]);
    useEffect(() => { if (isOpen) { setSelected([]); setSearch(""); } }, [isOpen]);

    const filtered = availableOptions.filter(o =>
        o.label.toLowerCase().includes(search.toLowerCase())
    );
    const toggle = (val) =>
        setSelected(p => p.includes(val) ? p.filter(v => v !== val) : [...p, val]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] bg-[#00000099] flex items-center justify-center" onClick={onClose}>
            <div className="w-[480px] bg-white rounded-2xl border border-[#CCCCCC] mx-4" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 pt-4 pb-3 rounded-t-2xl bg-white shadow-[0px_4px_9px_0px_rgba(0,0,0,0.10)]">
                    <span className="text-lg font-medium text-[#282F49] font-[Satoshi,sans-serif]">
                        {title.startsWith("Add Fields") && title.includes("-")
                            ? <>
                                Add Fields –{" "}
                                <span className="text-[#8E77BB]">{title.split("- ")[1]}</span>
                            </>
                            : title
                        }
                    </span>
                    <button type="button" onClick={onClose} className="bg-transparent border-none cursor-pointer p-1 text-[#818181] flex items-center hover:text-[#282F49] transition-colors"><X size={20} /></button>
                </div>
                <div className="px-6 py-3 bg-white flex flex-col gap-3">
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" fill="none" stroke="#9CA3AF" strokeWidth="2" viewBox="0 0 24 24">
                            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                        </svg>
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search" className="w-full border border-[#CCCCCC] rounded-lg pl-9 pr-3.5 py-2 text-sm font-normal text-[#282F49] outline-none bg-white leading-none box-border focus:border-[#8e78b7] font-[Satoshi,sans-serif]" />
                    </div>
                    <div className="max-h-56 overflow-y-auto rounded-lg">
                        {filtered.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-[#9CA3AF] text-center">No options found</div>
                        ) : filtered.map((o, i) => {
                            const checked = selected.includes(o.value);
                            return (
                                <button key={o.value} type="button" onClick={() => toggle(o.value)}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 bg-white border-none text-left cursor-pointer transition-colors ${i !== filtered.length - 1 ? 'border-b border-[#F5F5F5]' : ''} hover:bg-[#FAFAFA]`}>
                                    <span className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border transition-colors ${checked ? 'bg-[#8E77BB] border-[#8E77BB]' : 'bg-white border-[#CCCCCC]'}`}>
                                        {checked && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                    </span>
                                    <span className="text-sm font-normal text-[#282F49] font-[Satoshi,sans-serif]">{o.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
                <div className="h-[68px] flex items-center justify-end gap-3 px-6 rounded-b-2xl bg-white shadow-[0px_-4px_9px_0px_rgba(0,0,0,0.08)]">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-[#282F49] border border-[#CCCCCC] rounded-lg bg-white cursor-pointer font-[Satoshi,sans-serif] hover:bg-gray-50 transition-colors">Cancel</button>
                    <button type="button" onClick={() => { onSubmit(selected); onClose(); }} disabled={selected.length === 0}
                        className={`px-5 py-2.5 text-sm font-medium text-white border-none rounded-lg font-[Satoshi,sans-serif] transition-colors ${selected.length > 0 ? 'bg-[#8e78b7] cursor-pointer hover:bg-[#7a67a0]' : 'bg-[#CBC0E0] cursor-not-allowed'}`}>
                        Add Fields
                    </button>
                </div>
            </div>
        </div>
    );
};

const AddTabModal = ({ isOpen, onClose, onSubmit }) => {
    const [name, setName] = useState("");
    useEffect(() => { if (isOpen) setName(""); }, [isOpen]);
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] bg-[#00000099] flex items-center justify-center" onClick={onClose}>
            <div className="w-[480px] bg-white rounded-2xl border border-[#CCCCCC] mx-4" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 pt-4 pb-2 rounded-t-2xl bg-white shadow-[0px_4px_9px_0px_rgba(0,0,0,0.10)]">
                    <span className="text-lg font-medium text-[#282F49] font-[Satoshi]">Add New Tab to 360° View</span>
                    <button type="button" onClick={onClose} className="bg-transparent border-none cursor-pointer p-1 text-[#818181] flex items-center hover:text-[#282F49] transition-colors"><X size={20} /></button>
                </div>
                <div className="px-6 pt-4 pb-8 bg-white flex flex-col gap-5">
                    <div className="bg-[#FAFAFA] rounded-lg px-3.5 py-2.5 text-sm text-[#332849] font-medium">
                        <span className="font-semibold text-[#8E77BB]">Note: </span>
                        Create a new tab section – each tab appears as a navigation item in the 360° Entity View.
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-[#332849] font-[Satoshi] leading-none mb-1.5 block">Tab Name</label>
                        <input value={name} onChange={e => setName(e.target.value)} placeholder="Enter Tab Name" className="w-full border border-[#CCCCCC] rounded-lg px-3.5 py-2.5 text-sm font-normal text-[#282F49] outline-none bg-white leading-none box-border focus:border-[#8e78b7] font-[Satoshi,sans-serif]" />
                    </div>
                </div>
                <div className="h-[68px] flex items-center justify-end gap-3 px-6 rounded-b-2xl bg-white shadow-[0px_-4px_9px_0px_rgba(0,0,0,0.08)]">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-[#282F49] border border-[#CCCCCC] rounded-lg bg-white cursor-pointer font-[Satoshi,sans-serif] hover:bg-gray-50 transition-colors">Cancel</button>
                    <button type="button" disabled={!name.trim()} onClick={() => { if (name.trim()) { onSubmit(name.trim()); onClose(); } }}
                        className={`px-5 py-2.5 text-sm font-medium text-white border-none rounded-lg font-[Satoshi,sans-serif] transition-colors ${name.trim() ? 'bg-[#8e78b7] cursor-pointer hover:bg-[#7a67a0]' : 'bg-[#CBC0E0] cursor-not-allowed'}`}>
                        Create
                    </button>
                </div>
            </div>
        </div>
    );
};

const Step3 = ({ attributes, viewConfig, setViewConfig }) => {
    const [addFieldsTarget, setAddFieldsTarget] = useState(null);
    const [addTabOpen, setAddTabOpen] = useState(false);

    const attrOptions = attributes.filter(a => a.attributeName.trim()).map(a => ({ label: a.displayName || a.attributeName, value: a.attributeName }));
    const p1Options = attrOptions;
    const p2Options = attrOptions.filter(o => o.value !== viewConfig.p1);

    const removeSidebar = (val) => setViewConfig(p => ({ ...p, sidebarFields: p.sidebarFields.filter(v => v !== val) }));
    const addSidebarFields = (vals) => setViewConfig(p => ({ ...p, sidebarFields: [...new Set([...p.sidebarFields, ...vals])].slice(0, 3) }));
    const addTab = (name) => {
        const newTab = { id: Date.now(), name, fields: [] };
        setViewConfig(p => ({ ...p, tabs: [...p.tabs, newTab] }));
        setAddFieldsTarget(newTab.id);
    };
    const removeTab = (id) => setViewConfig(p => ({ ...p, tabs: p.tabs.filter(t => t.id !== id) }));
    const addTabFields = (tabId, vals) => setViewConfig(p => ({ ...p, tabs: p.tabs.map(t => t.id === tabId ? { ...t, fields: [...new Set([...t.fields, ...vals])] } : t) }));
    const removeTabField = (tabId, val) => setViewConfig(p => ({ ...p, tabs: p.tabs.map(t => t.id === tabId ? { ...t, fields: t.fields.filter(f => f !== val) } : t) }));
    const getLabel = (val) => attrOptions.find(o => o.value === val)?.label || val;

    const sidebarOptions = attrOptions.filter(
        o => o.value !== viewConfig.p1 && o.value !== viewConfig.p2
    );

    return (
        <div className="p-5">
            <div className="mb-1 bg-[#FAFAFA] px-4 py-2 rounded-lg">
                <span className="text-sm text-[#8E77BB] font-medium">Configure 360° View Layout</span>
                <p className="text-sm text-[#332849] font-medium">Organise attributes into tabs. Select a tab on the left, then assign fields to it on the right. You can also configure which fields appear in the sidebar summary and as the entity title/subtitle.</p>
            </div>
            <div className="px-3">
                <div className="grid grid-cols-2 gap-5 my-5">
                    <div>
                        <label className={labelClass}>Entity Title Field <span className="text-[#E05252]">*</span></label>
                        <SearchableDropdown value={viewConfig.p1} onChange={v => setViewConfig(p => ({
                            ...p,
                            p1: v,
                            sidebarFields: p.sidebarFields.filter(f => f !== v),
                        }))} options={p1Options} placeholder="Select" />
                    </div>
                    <div>
                        <label className={labelClass}>Entity Subtitle Field <span className="text-[#E05252]">*</span></label>
                        <SearchableDropdown value={viewConfig.p2} onChange={v => setViewConfig(p => ({
                            ...p,
                            p2: v,
                            sidebarFields: p.sidebarFields.filter(f => f !== v),
                        }))} options={p2Options} placeholder="Select" />
                    </div>
                </div>
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-1">
                        <div>
                            <span className="text-lg font-medium text-[#332849]">Sidebar Summary Fields (shown below avatar)</span>
                            <p className="text-xs font-normal text-[#818181] mt-0.5 mb-0">Add the most important fields to be visible at a glance under the user profile.</p>
                        </div>
                        <button type="button" onClick={() => setAddFieldsTarget("sidebar")}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-[#8E77BB] rounded-lg bg-white text-[#8E77BB] text-[13px] font-medium cursor-pointer">
                            <Plus size={13} /> Add Fields
                        </button>
                    </div>
                    {viewConfig.sidebarFields.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mt-4 px-3.5 py-2.5 rounded-lg bg-[#FAFAFA]">
                            {viewConfig.sidebarFields.map(v => <FieldTag key={v} label={getLabel(v)} onRemove={() => removeSidebar(v)} />)}
                        </div>
                    ) : (
                        <div className="px-4 py-3 border border-dashed border-[#E5E7EB] rounded-xl text-[#9CA3AF] text-[13px] text-center mt-2">No sidebar fields selected. Max 3 fields.</div>
                    )}
                </div>
                <div>
                    <div className="flex items-center justify-between mb-3.5">
                        <div>
                            <span className="text-lg font-medium text-[#332849]">Tab Configuration</span>
                            <p className="text-xs font-normal text-[#818181] mt-0.5 mb-0">Create tabs and assign fields to organize the 360° detail view</p>
                        </div>
                        <button type="button" onClick={() => setAddTabOpen(true)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-[#8E77BB] border-none rounded-lg text-white text-[13px] font-medium cursor-pointer">
                            <Plus size={13} /> Add Tab
                        </button>
                    </div>
                    {viewConfig.tabs.length === 0 && (
                        <div className="px-4 py-3 border border-dashed border-[#E5E7EB] rounded-xl text-[#9CA3AF] text-[13px] text-center">No tabs added yet. Click "Add Tab" to create a tab section.</div>
                    )}
                    {viewConfig.tabs.map(tab => (
                        <div key={tab.id} className="rounded-lg mb-3 overflow-hidden bg-[#FAFAFA]">
                            <div className="flex items-center justify-between px-4 py-3">
                                <span className="text-base font-medium text-[#332849]">{tab.name}</span>
                                <div className="flex gap-2 items-center">
                                    <button type="button" onClick={() => setAddFieldsTarget(tab.id)}
                                        className="flex items-center gap-1.5 px-3 py-[5px] border border-dashed border-[#8E77BB] rounded-lg bg-white text-[#8E77BB] text-[12px] font-medium cursor-pointer">
                                        <Plus size={11} /> Add Fields
                                    </button>
                                    <button type="button" onClick={() => removeTab(tab.id)} className="bg-transparent border-none cursor-pointer text-[#818181]"><X size={14} /></button>
                                </div>
                            </div>
                            {tab.fields.length > 0 ? (
                                <div className="flex flex-wrap gap-2 px-4 pb-3">
                                    {tab.fields.map(f => <FieldTag key={f} label={getLabel(f)} onRemove={() => removeTabField(tab.id, f)} />)}
                                </div>
                            ) : (
                                <div className="px-4 py-2.5 text-[#9CA3AF] text-[13px]">No fields added to this tab yet.</div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            <AddFieldsModal
                isOpen={!!addFieldsTarget}
                onClose={() => setAddFieldsTarget(null)}
                title={addFieldsTarget === "sidebar" ? "Add Fields - Sidebar" : `Add Fields - ${viewConfig.tabs.find(t => t.id === addFieldsTarget)?.name || ""}`}
                availableOptions={addFieldsTarget === "sidebar" ? sidebarOptions : attrOptions}
                onSubmit={(vals) => {
                    if (addFieldsTarget === "sidebar") addSidebarFields(vals);
                    else addTabFields(addFieldsTarget, vals);
                    setAddFieldsTarget(null);
                }}
            />
            <AddTabModal isOpen={addTabOpen} onClose={() => setAddTabOpen(false)} onSubmit={addTab} />
        </div>
    );
};

export default function AddDomainWizard() {
    const navigate = useNavigate();
    const { decodedToken } = useAuth();
    const { isSubmitting: submitting, addDomain } = useAddDomain();
    const [step, setStep] = useState(0);

    const [domain, setDomain] = useState({
        domainName: "", domainCode: "", tableName: "", domainType: "",
        enableVersioning: "", description: "",
    });
    const [attributes, setAttributes] = useState([emptyAttr()]);
    const [viewConfig, setViewConfig] = useState({ p1: "", p2: "", sidebarFields: [], tabs: [] });

    const updateDomain = (k, v) => setDomain(p => ({ ...p, [k]: v }));

    const step1Valid =
        domain.domainName.trim() &&
        domain.domainCode.trim() &&
        domain.tableName.trim() &&
        domain.domainType &&
        domain.enableVersioning;

    const isAttrValid = (a) => {
        if (!a.attributeName.trim() || !a.displayName.trim() || !a.dataType) return false;
        const mode = getLengthMode(a.dataType);
        if (mode === "length") {
            return !!a.lengthPrecision.toString().trim();
        }
        if (mode === "precision_scale") {
            const parts = (a.lengthPrecision || "").split("/");
            return !!(parts[0]?.trim() && parts[1]?.trim());
        }
        return true;
    };
    const step2Valid = attributes.every(isAttrValid);

    const step3Valid = viewConfig.p1 && viewConfig.p2;

    const lastAttr = attributes[attributes.length - 1];
    const canAddAttr = isAttrValid(lastAttr);

    const handleAddAnother = () => {
        setAttributes(prev => [...prev.map(a => ({ ...a, expanded: false })), emptyAttr()]);
    };

    const buildPayload = () => {
        const domainCode = domain.domainCode.trim() || domain.domainName.trim().toUpperCase().replace(/\s+/g, "_") || domain.tableName.trim().toUpperCase();
        return {
            domain_name: domain.domainName,
            domain_code: domainCode,
            table_name: domain.tableName,
            domain_type: domain.domainType,
            enable_versioning: domain.enableVersioning === "Yes",
            description: domain.description,
            created_by: decodedToken?.preferred_username,
            attributes: attributes.map(a => {
                const mode = getLengthMode(a.dataType);
                const length_precision = mode ? (a.lengthPrecision || null) : null;
                return {
                    attribute_name: a.attributeName,
                    display_name: a.displayName,
                    source_attribute_name: a.sourceAttributeName,
                    source_display_name: a.sourceDisplayName,
                    data_type: getPayloadType(a.dataType),   // "VARCHAR", "NUMERIC", etc.
                    length_precision,
                    required: a.required || "no",
                    criticality: a.criticality || null,
                    rule_ids: a.dqRule.length > 0 ? a.dqRule : null,
                };
            }),
            entity_view: {
                p1: viewConfig.p1 || null,
                p2: viewConfig.p2 || null,
                p3: viewConfig.sidebarFields[0] || null,
                p4: viewConfig.sidebarFields[1] || null,
                p5: viewConfig.sidebarFields[2] || null,
                tab_config: viewConfig.tabs.map(t => ({ group_name: t.name, view_type: "GRID", attributes: t.fields })),
            },
        };
    };

    const handleCreate = async () => {
        const payload = buildPayload();
        const result = await addDomain(payload);
        if (result.ok) {
            navigate("/datagovernance/mdm/overview/domain-management");
        } else {
            toast.error(result.message || "Failed to create domain. Please try again.", {
                duration: 3000,
                position: "top-right",
            });
        }
    };

    const handleBack = async () => {
        navigate("/datagovernance/mdm/overview/domain-management");
    };

    const nextDisabled = step === 0 ? !step1Valid : !step2Valid;
    const nextActive = !nextDisabled;

    return (
        <div className="font-[Satoshi] bg-[#F5F5F7] h-full flex flex-col px-4 py-3 overflow-hidden">

            {/* Top bar */}
            <div className="flex-shrink-0 bg-white px-5 py-3 flex items-center gap-3 rounded-lg mb-3">
                <button type="button" className="bg-transparent border-none cursor-pointer text-[#282F49] flex items-center p-0" onClick={handleBack}>
                    <ArrowLeft size={18} />
                </button>
                <h1 className="m-0 text-xl font-bold text-[#282F49]">Create New Domain & Configure 360° View</h1>
            </div>

            {/* Stepper */}
            <div className="flex-shrink-0">
                <Stepper current={step} />
            </div>

            {/* Body card */}
            <div className="flex-1 min-h-0 bg-white mt-3 rounded-lg flex flex-col overflow-hidden">

                {/* Scrollable content */}
                <div className="flex-1 min-h-0 overflow-y-auto">
                    {step === 0 && <Step1 data={domain} onChange={updateDomain} />}
                    {step === 1 && <Step2 attributes={attributes} setAttributes={setAttributes} />}
                    {step === 2 && <Step3 attributes={attributes} viewConfig={viewConfig} setViewConfig={setViewConfig} />}
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 px-6 py-3 bg-white border-t border-[#F0F0F0] flex items-start justify-between shadow-[0px_-4px_9px_0px_rgba(0,0,0,0.10)]">
                    <div className="flex-1 min-w-0 mr-4">
                        {step === 1 && (
                            <button
                                type="button"
                                onClick={handleAddAnother}
                                disabled={!canAddAttr}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-transparent text-[13px] font-medium transition-colors"
                                style={{
                                    border: `1.5px dashed ${canAddAttr ? "#8e78b7" : "#CCCCCC"}`,
                                    color: canAddAttr ? "#8e78b7" : "#BBBBBB",
                                    cursor: canAddAttr ? "pointer" : "not-allowed",
                                }}
                            >
                                <Plus size={14} />
                                Add Another Attribute
                            </button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        {step > 0 && (
                            <button type="button" onClick={() => { setStep(s => s - 1)}}
                                className="px-6 py-2.5 border border-[#CCCCCC] rounded-lg bg-white text-sm font-medium text-[#282F49] cursor-pointer">
                                Previous
                            </button>
                        )}
                        {step < 2 ? (
                            <button type="button" onClick={() => { setStep(s => s + 1) }} disabled={nextDisabled}
                                className={`px-6 py-2.5 border-none rounded-lg text-white text-sm font-medium ${nextActive ? "bg-[#8E77BB] cursor-pointer" : "bg-[#C4B8E0] cursor-not-allowed"}`}>
                                {step === 0 ? "Continue to Attributes" : "Continue to 360° View Layout"}
                            </button>
                        ) : (
                            <button type="button" onClick={handleCreate} disabled={!step3Valid || submitting}
                                className={`px-7 py-2.5 border-none rounded-lg text-white text-sm font-semibold ${step3Valid && !submitting ? "bg-[#8E77BB] cursor-pointer" : "bg-[#C4B8E0] cursor-not-allowed"}`}>
                                {submitting ? "Creating Domain..." : "Finish"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}