import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../../../context/AuthContext';
import { OPERATORS } from '../constants';

const inputClass =
    'w-full border border-[#CCCCCC] rounded-lg px-3.5 py-2.5 text-sm font-normal text-[#282F49] outline-none bg-white font-[Satoshi,sans-serif] leading-none box-border focus:border-[#8e78b7]';
const labelClass =
    'text-sm font-medium text-[#282F49] font-[Satoshi,sans-serif] leading-none mb-1.5 block';


const ChevronIcon = () => (
    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#818181]">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
    </div>
);

const SelectField = ({ value, onChange, children, placeholder, disabled }) => (
    <div className="relative">
        <select
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={`${inputClass} appearance-none pr-9 ${disabled ? 'bg-[#F5F5F5] cursor-not-allowed text-[#A0AEC0]' : value ? 'text-[#282F49]' : 'text-[#A0AEC0]'}`}
        >
            <option value="" disabled>{placeholder || 'Select'}</option>
            {children}
        </select>
        <ChevronIcon />
    </div>
);

export const AddRuleModal = ({ isOpen, onClose, onComplete, ruleData }) => {
    const { token, project } = useAuth();
    const [form, setForm] = useState({
        rule_name: '',
        metric_column: '',
        operator: '',
        score: '',
        connection_id: '',
        connection_name: '',
        schema_name: '',
        table_name: '',
        threshold_value: '',
    });
    
    const [connections, setConnections] = useState([]);
    const [schemas, setSchemas] = useState([]);
    const [tables, setTables] = useState([]);

    const [isLoadingConnections, setIsLoadingConnections] = useState(false);
    const [isLoadingSchemas, setIsLoadingSchemas] = useState(false);
    const [isLoadingTables, setIsLoadingTables] = useState(false);

    const [columns, setColumns] = useState([]);
    const [isLoadingColumns, setIsLoadingColumns] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Prepopulate form on editing
    useEffect(() => {
        if (isOpen && ruleData) {
            const conn = connections.find(c => c.connection_id === ruleData.connection_id);
            setForm({
                rule_name: ruleData.rule_name || '',
                metric_column: ruleData.metric_column || '',
                operator: ruleData.operator || '',
                score: ruleData.score !== undefined ? String(ruleData.score) : '',
                connection_id: ruleData.connection_id || '',
                connection_name: conn ? conn.connection_name : (ruleData.connection_id || ''),
                schema_name: ruleData.schema_name || '',
                table_name: ruleData.table_name || '',
                threshold_value: ruleData.threshold_value || '',
            });
        } else if (isOpen && !ruleData) {
            setForm({
                rule_name: '',
                metric_column: '',
                operator: '',
                score: '',
                connection_id: '',
                connection_name: '',
                schema_name: '',
                table_name: '',
                threshold_value: '',
            });
        }
    }, [isOpen, ruleData, connections]);

    // Filter operators based on the selected column's data type (text/character varying vs other)
    const selectedColumnObj = columns?.find(c => c.column_name === form.metric_column);
    const selectedDataType = selectedColumnObj?.DATA_TYPE || selectedColumnObj?.data_type || '';
    const isTextType = selectedDataType.toLowerCase().includes('char') || selectedDataType.toLowerCase().includes('text');

    const availableOperators = isTextType
        ? OPERATORS.filter(op => op.value === 'EQ' || op.value === 'NE')
        : OPERATORS;

    // Reset operator if it is no longer valid for the selected attribute type
    useEffect(() => {
        if (form.operator) {
            const isValid = availableOperators.some(op => op.value === form.operator);
            if (!isValid) {
                setForm(prev => ({ ...prev, operator: '' }));
            }
        }
    }, [form.metric_column, availableOperators, form.operator]);

    // 1. Fetch Connections
    useEffect(() => {
        const fetchConnections = async () => {
            if (!token || !isOpen) return;
            setIsLoadingConnections(true);
            try {
                const response = await axios.get(
                    `${window._env_?.VITE_FAST_API}/connection-saves`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'x-project': project || 'none',
                        },
                    }
                );
                setConnections(response.data || []);
            } catch (err) {
                console.error('Error fetching connections:', err);
                setConnections([]);
            } finally {
                setIsLoadingConnections(false);
            }
        };
        fetchConnections();
    }, [token, project, isOpen]);

    // 2. Fetch Schemas
    useEffect(() => {
        const fetchSchemas = async () => {
            if (!token || !form.connection_name || !isOpen) {
                setSchemas([]);
                return;
            }
            setIsLoadingSchemas(true);
            try {
                const response = await axios.get(
                    `${window._env_?.VITE_FAST_API}/schema/${form.connection_name}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                setSchemas(response.data || []);
            } catch (err) {
                console.error('Error fetching schemas:', err);
                setSchemas([]);
            } finally {
                setIsLoadingSchemas(false);
            }
        };
        fetchSchemas();
    }, [token, form.connection_name, isOpen]);

    // 3. Fetch Tables
    useEffect(() => {
        const fetchTables = async () => {
            if (!token || !form.connection_name || !form.schema_name || !isOpen) {
                setTables([]);
                return;
            }
            setIsLoadingTables(true);
            try {
                const response = await axios.get(
                    `${window._env_?.VITE_FAST_API}/connection-master-metadata/find-by-conn-name-type?conn_name=${form.connection_name}&schema_name=${form.schema_name}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                setTables(response.data || []);
            } catch (err) {
                console.error('Error fetching tables:', err);
                setTables([]);
            } finally {
                setIsLoadingTables(false);
            }
        };
        fetchTables();
    }, [token, form.connection_name, form.schema_name, isOpen]);

    // 4. Fetch Columns
    useEffect(() => {
        const fetchColumns = async () => {
            if (!token || !form.connection_name || !form.schema_name || !form.table_name || !isOpen) {
                setColumns([]);
                return;
            }
            setIsLoadingColumns(true);
            try {
                const response = await fetch(
                    `${window._env_?.VITE_FAST_API}/columns/${encodeURIComponent(form.connection_name)}/${encodeURIComponent(form.schema_name)}/${encodeURIComponent(form.table_name)}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setColumns(data.column_json || []);
            } catch (err) {
                console.error("Error fetching columns:", err);
                setColumns([]);
            } finally {
                setIsLoadingColumns(false);
            }
        };
        fetchColumns();
    }, [token, form.connection_name, form.schema_name, form.table_name, isOpen]);

    if (!isOpen) return null;

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleClose = () => {
        setForm({
            rule_name: '',
            metric_column: '',
            operator: '',
            score: '',
            connection_id: '',
            connection_name: '',
            schema_name: '',
            table_name: '',
            threshold_value: '',
        });
        setSchemas([]);
        setTables([]);
        setColumns([]);
        setError('');
        onClose();
    };

    const isFormValid =
        form.rule_name.trim() !== '' &&
        form.metric_column.trim() !== '' &&
        form.operator !== '' &&
        form.score.trim() !== '' &&
        form.connection_id !== '' &&
        form.schema_name !== '' &&
        form.table_name !== '' &&
        form.threshold_value.trim() !== '';

    const handleSubmit = async () => {
        setError('');
        setIsSubmitting(true);
        try {
            const payload = {
                rule_name: form.rule_name.trim(),
                metric_column: form.metric_column.trim(),
                operator: form.operator,
                score: parseInt(form.score, 10),
                risk_column: `${form.metric_column.trim()}_score`,
                priority_no: 1,
                connection_id: form.connection_id || null,
                schema_name: form.schema_name || null,
                table_name: form.table_name || null,
                threshold_value: form.threshold_value.trim() || null,
            };
            console.log("PAYLOADDDDDD",payload)
            
            const url = ruleData
                ? `${window._env_?.VITE_FAST_API}/dedup/dedup-rules/${ruleData.rule_id}`
                : `${window._env_?.VITE_FAST_API}/dedup/dedup-rules`;

            const response = ruleData
                ? await axios.put(url, payload, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                  })
                : await axios.post(url, payload, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                  });

            if (response.status === 201 || response.status === 200) {
                onComplete?.();
                handleClose();
            } else {
                setError(ruleData ? 'Failed to update deduplication rule.' : 'Failed to add deduplication rule.');
            }
        } catch (err) {
            const msg =
                err?.response?.data?.detail ||
                err?.response?.data?.message ||
                'Failed to add deduplication rule.';
            setError(typeof msg === 'object' ? JSON.stringify(msg) : msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[1002] flex items-center justify-center bg-black/40">
            <div className="w-[720px] bg-white rounded-2xl border border-[#CCCCCC] mx-4" onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className="flex items-center justify-between gap-4 px-6 py-4 rounded-t-2xl bg-white shadow-[0px_4px_9px_0px_rgba(0,0,0,0.10)]">
                    <span className="text-lg font-medium text-[#282F49] font-[Satoshi,sans-serif]">{ruleData ? 'Edit Deduplication Rule' : 'Add Deduplication Rule'}</span>
                    <button onClick={handleClose} className="bg-transparent border-none cursor-pointer p-1 text-[#818181] flex items-center">
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <div className="px-6 pt-4 pb-6 flex flex-col gap-5 bg-white max-h-[80vh] overflow-y-auto font-[Satoshi,sans-serif]">
                    
                    {/* Database Target Section */}
                    <div className="flex flex-col gap-3">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-1">Database Target</span>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className={labelClass}>Connection <span className="text-[#E05252]">*</span></label>
                                <SelectField
                                    value={form.connection_name}
                                    onChange={(e) => {
                                        const selected = connections?.find(c => c.connection_name === e.target.value);
                                        setForm(prev => ({
                                            ...prev,
                                            connection_name: e.target.value,
                                            connection_id: selected?.connection_id || '',
                                            schema_name: '',
                                            table_name: ''
                                        }));
                                    }}
                                    placeholder={isLoadingConnections ? "Loading..." : "Select Connection"}
                                >
                                    {connections?.map((c) => (
                                        <option key={c.connection_id} value={c.connection_name}>
                                            {c.connection_name}
                                        </option>
                                    ))}
                                </SelectField>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className={labelClass}>Schema <span className="text-[#E05252]">*</span></label>
                                <SelectField
                                    value={form.schema_name}
                                    onChange={(e) => {
                                        setForm(prev => ({
                                            ...prev,
                                            schema_name: e.target.value,
                                            table_name: ''
                                        }));
                                    }}
                                    placeholder={!form.connection_name ? "Select Connection" : isLoadingSchemas ? "Loading..." : "Select Schema"}
                                    disabled={!form.connection_name}
                                >
                                    {schemas?.map((s) => (
                                        <option key={s.table_schema} value={s.table_schema}>
                                            {s.table_schema}
                                        </option>
                                    ))}
                                </SelectField>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className={labelClass}>Table <span className="text-[#E05252]">*</span></label>
                                <SelectField
                                    value={form.table_name}
                                    onChange={(e) => {
                                        setForm(prev => ({
                                            ...prev,
                                            table_name: e.target.value,
                                            metric_column: ''
                                        }));
                                    }}
                                    placeholder={!form.schema_name ? "Select Schema" : isLoadingTables ? "Loading..." : "Select Table"}
                                    disabled={!form.schema_name}
                                >
                                    {tables?.map((t) => (
                                        <option key={t.table_name} value={t.table_name}>
                                            {t.table_name}
                                        </option>
                                    ))}
                                </SelectField>
                            </div>
                        </div>
                    </div>

                    {/* Rule Properties Section */}
                    <div className="flex flex-col gap-3">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-1">Rule Properties</span>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className={`${labelClass} mb-0`}>Rule Name <span className="text-[#E05252]">*</span></label>
                                <input
                                    type="text"
                                    placeholder="Enter Rule Name"
                                    value={form.rule_name}
                                    onChange={(e) => handleChange('rule_name', e.target.value)}
                                    className={inputClass}
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className={`${labelClass} mb-0`}>Attribute <span className="text-[#E05252]">*</span></label>
                                <SelectField
                                    value={form.metric_column}
                                    onChange={(e) => handleChange('metric_column', e.target.value)}
                                    placeholder={!form.table_name ? "Select Table first" : isLoadingColumns ? "Loading..." : "Select Attribute"}
                                    disabled={!form.table_name || isLoadingColumns}
                                >
                                    {columns?.map((col) => (
                                        <option key={col.column_name} value={col.column_name}>
                                            {col.column_name}
                                        </option>
                                    ))}
                                </SelectField>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className={`${labelClass} mb-0`}>Operator <span className="text-[#E05252]">*</span></label>
                                <SelectField
                                    value={form.operator}
                                    onChange={(e) => handleChange('operator', e.target.value)}
                                    placeholder="Select Operator"
                                >
                                    {availableOperators.map((op) => (
                                        <option key={op.value} value={op.value}>
                                            {op.label}
                                        </option>
                                    ))}
                                </SelectField>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className={`${labelClass} mb-0`}>Threshold Value <span className="text-[#E05252]">*</span></label>
                                <input
                                    type="text"
                                    placeholder="Enter Threshold Value (e.g. 100000)"
                                    value={form.threshold_value}
                                    onChange={(e) => handleChange('threshold_value', e.target.value)}
                                    className={inputClass}
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className={`${labelClass} mb-0`}>Score <span className="text-[#E05252]">*</span></label>
                                <input
                                    type="number"
                                    placeholder="Enter Score (e.g. 20)"
                                    value={form.score}
                                    onChange={(e) => handleChange('score', e.target.value)}
                                    className={inputClass}
                                    min="0"
                                    max="100"
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="text-sm text-[#E05252] bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="h-[72px] flex items-center justify-end gap-4 px-6 rounded-b-2xl bg-white shadow-[0px_-4px_9px_0px_rgba(0,0,0,0.10)]">
                    <button onClick={handleClose} className="px-5 py-2.5 text-sm font-medium text-[#282F49] border border-[#CCCCCC] rounded-lg bg-white cursor-pointer">
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!isFormValid || isSubmitting}
                        className={`px-5 py-2.5 text-sm font-medium text-white border-none rounded-lg ${isFormValid && !isSubmitting ? 'bg-[#8e78b7] cursor-pointer' : 'bg-[#CBC0E0] cursor-not-allowed'}`}
                    >
                        {isSubmitting ? (ruleData ? 'Saving...' : 'Adding...') : (ruleData ? 'Save Changes' : 'Add Rule')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddRuleModal;