import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, RefreshCcw, Plus, X, Edit } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.jsx';
import DataTable from '../../../components/DataTable.jsx';
import { toast } from 'react-hot-toast';
import Breadcrumb from '../../../components/Breadcrumb.jsx';
import AddRuleModal from './components/AddRuleModal.jsx';
import axios from 'axios';
import { getOperatorLabel } from './constants';

import CaptivePortalIcon from '../../../assets/mdm/captive_portal.svg';
import CDCIcon from '../../../assets/mdm/CDC.svg';
import ComplianceIcon from '../../../assets/mdm/Compliance.svg';
import LinkedServicesIcon from '../../../assets/mdm/linked_services.svg';

/* ─────────────────────────────────────────────
   Badges
───────────────────────────────────────────── */
const StatusBadge = ({ activeFlag }) => {
    const lower = activeFlag?.toLowerCase();
    const isY = lower === 'y' || lower === 'yes' || lower === 'active';
    
    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors duration-200 ${
                isY
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
        >
            {isY ? 'Active' : 'Inactive'}
        </span>
    );
};

const StatusToggle = ({ activeFlag, onClick, disabled }) => {
    const lower = activeFlag?.toLowerCase();
    const isY = lower === 'y' || lower === 'yes' || lower === 'active';
    
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isY ? 'bg-[#8E77BB]' : 'bg-gray-200'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            role="switch"
            aria-checked={isY}
            title={isY ? 'Deactivate Rule' : 'Activate Rule'}
        >
            <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isY ? 'translate-x-4' : 'translate-x-0'
                }`}
            />
        </button>
    );
};

/* ─────────────────────────────────────────────
   Metric cards config
───────────────────────────────────────────── */
const metrics = [
    { title: 'Total Rules', key: 'total_rules', icon: CaptivePortalIcon, bgcolor: 'bg-[#C5EAF0]' },
    { title: 'Active Rules', key: 'active_rules', icon: CDCIcon, bgcolor: 'bg-[#FFC93F40]' },
    { title: 'Inactive Rules', key: 'inactive_rules', icon: ComplianceIcon, bgcolor: 'bg-[#FEE4FF]' },
    { title: 'Draft Rules', key: 'draft_rules', icon: LinkedServicesIcon, bgcolor: 'bg-[#DBE0FC]' },
];

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
const Dedup = () => {
    const { token, project } = useAuth();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState(null);
    const [togglingId, setTogglingId] = useState(null);
    const [rules, setRules] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    /* ── Fetch Data ── */
    const fetchData = useCallback(async (isSilent = false) => {
        if (!token) return;
        if (!isSilent) setIsLoading(true);
        try {
            const response = await axios.get(
                `${window._env_?.VITE_FAST_API || 'http://localhost:8000'}/dedup/dedup-rules`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'x-project': project || 'none',
                    },
                }
            );
            setRules(response.data || []);
            return { ok: true };
        } catch (err) {
            console.error('Error fetching dedup rules:', err);
            setRules([]);
            return { ok: false, message: err.message };
        } finally {
            setIsLoading(false);
        }
    }, [token, project]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    /* ── Handlers ── */
    const handleRefresh = async () => {
        setSearchTerm('');
        const result = await fetchData(true);
        if (result.ok) toast.success('Data refreshed successfully!');
        else toast.error('Failed to refresh data.');
    };

    const handleAddRule = () => {
        setEditingRule(null);
        setIsAddModalOpen(true);
    };

    const handleEdit = (row) => {
        setEditingRule(row);
        setIsAddModalOpen(true);
    };

    const handleToggle = async (row) => {
        if (!token) return;
        setTogglingId(row.rule_id);
        try {
            const response = await axios.put(
                `${window._env_?.VITE_FAST_API || 'http://localhost:8000'}/dedup/dedup-rules/${row.rule_id}/toggle`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            if (response.status === 200) {
                toast.success(`Rule status updated successfully.`);
                fetchData(true);
            } else {
                toast.error('Failed to toggle rule status.');
            }
        } catch (err) {
            console.error('Error toggling rule status:', err);
            toast.error(err.response?.data?.detail || 'Failed to toggle rule status.');
        } finally {
            setTogglingId(null);
        }
    };

    /* ── Derived state ── */
    const filteredData = React.useMemo(
        () =>
            rules.filter((item) =>
                Object.values(item).some((v) =>
                    String(v).toLowerCase().includes(searchTerm.toLowerCase())
                )
            ),
        [rules, searchTerm]
    );

    const counts = React.useMemo(() => {
        const total = rules.length;
        const active = rules.filter(r => r.active_flag?.toLowerCase() === 'y').length;
        const inactive = total - active;
        return {
            total_rules: total,
            active_rules: active,
            inactive_rules: inactive,
            draft_rules: 0,
        };
    }, [rules]);

    /* ── Column definitions ── */
    const columns = [
        {
            key: 'rule_name',
            label: 'Rule Name',
            render: (row) => (
                <span className="font-semibold text-gray-800 text-sm">
                    {row.rule_name}
                </span>
            ),
        },
        // { key: 'connection_id', label: 'Connection ID' },
        // { key: 'schema_name', label: 'Schema Name' },
        { key: 'table_name', label: 'Table Name' },
        { key: 'metric_column', label: 'Attribute' },
        {
            key: 'operator',
            label: 'Operator',
            render: (row) => (
                <span className="px-2.5 py-1 bg-[#F3EFFF] text-[#8E77BB] rounded-md font-medium text-xs font-semibold">
                    {getOperatorLabel(row.operator)}
                </span>
            )
        },
        {
            key: 'threshold_value',
            label: 'Threshold Value',
            render: (row) => (
                <span className="text-gray-700 font-medium text-sm">
                    {row.threshold_value ?? '-'}
                </span>
            )
        },
        { key: 'score', label: 'Score' },
        // { key: 'risk_column', label: 'Risk Column' },
        {
            key: 'active_flag',
            label: 'Status',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <StatusToggle 
                        activeFlag={row.active_flag} 
                        onClick={() => handleToggle(row)}
                        disabled={togglingId === row.rule_id}
                    />
                    <StatusBadge activeFlag={row.active_flag} />
                </div>
            ),
        },
        {
            label: 'Actions',
            sortable: false,
            render: (row) => (
                <div className="flex items-center gap-4">
                    {/* Edit Button */}
                    <button
                        onClick={() => handleEdit(row)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-[#8E77BB] transition-colors border-none bg-transparent cursor-pointer flex items-center"
                        title="Edit Rule"
                    >
                        <Edit size={16} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <Breadcrumb title={"MDM"} title2={"Rule Canvas"} title3={"Rule Management"}/>

            {/* Page header */}
            <div className="flex items-start justify-between mb-4 mt-2">
                <div>
                    <h1 className="text-2xl font-bold text-[#282F49]">Rule Management</h1>
                    {/* <p className="text-sm text-[#818181] mt-0.5">
                        Configure Deduplication Rules
                    </p> */}
                </div>
                <div className="flex justify-between gap-3 font-medium text-sm">
                    <button
                        title="Refresh"
                        onClick={handleRefresh}
                        disabled={isLoading}
                        className="p-2.5 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-wait cursor-pointer"
                    >
                        <RefreshCcw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={handleAddRule}
                        className="flex items-center gap-2 px-4 py-2 bg-[#8E77BB] text-white rounded-lg hover:bg-[#7a67a0] transition-colors text-sm font-medium cursor-pointer"
                    >
                        <Plus className="h-4 w-4" />
                        Add Rule
                    </button>
                </div>
            </div>

            {/* Metric cards */}
            <div
                className="rounded-2xl p-4 mb-6"
                style={{
                    background:
                        'linear-gradient(270deg, #EFE7FF 17.24%, #8E77BB 93.06%, #2B125C 141.05%)',
                }}
            >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {metrics.map((m, i) => (
                        <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div
                                    className={`flex items-center justify-center w-10 h-10 ${m.bgcolor} rounded-full`}
                                >
                                    <img src={m.icon} alt={m.title} className="w-5 h-5" />
                                </div>
                                <span className="text-lg font-medium text-[#332849]">
                                    {m.title}
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-[#282F49]">
                                {isLoading ? (
                                    <span className="inline-block h-7 w-12 bg-gray-200 rounded animate-pulse" />
                                ) : (
                                    counts[m.key]
                                )}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Table section */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-medium text-[#332849]">Configured Rules</h2>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search rules..."
                                className="w-[220px] rounded-lg border border-gray-200 py-1.5 pl-9 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={filteredData}
                    isLoading={isLoading}
                    refetch={() => fetchData(true)}
                />
            </div>

            {/* Modals */}
            <AddRuleModal
                isOpen={isAddModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false);
                    setEditingRule(null);
                }}
                ruleData={editingRule}
                onComplete={() => {
                    setIsAddModalOpen(false);
                    setEditingRule(null);
                    fetchData();
                }}
            />
        </div>
    );
};

export default Dedup;