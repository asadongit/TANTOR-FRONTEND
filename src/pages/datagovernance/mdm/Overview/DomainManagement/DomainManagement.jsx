import React, { useState, useCallback } from 'react';
import { Search, RefreshCcw, Plus, X, MoreVertical } from 'lucide-react';
import { useAuth } from '../../../../../context/AuthContext.jsx';
import MDMDataTable from '../../../../../components/MDMDataTable.jsx';
import { toast } from 'react-hot-toast';
import Breadcrumb from '../../../../../components/Breadcrumb.jsx';
import AddDomainModal from './modals/AddDomainModal.jsx';
import CaptivePortalIcon from '../../../../../assets/mdm/captive_portal.svg';
import CDCIcon from '../../../../../assets/mdm/CDC.svg';
import ComplianceIcon from '../../../../../assets/mdm/Compliance.svg';
import LinkedServicesIcon from '../../../../../assets/mdm/linked_services.svg';
import EditIcon from '../../../../../assets/mdm/edit.svg';
import DeleteIcon from '../../../../../assets/mdm/delete.svg';
import EditDomainModal from './modals/EditDomainModal.jsx';
import DomainDetailsSidebar from './DomainDetailsSidebar.jsx';
import RulesIcon from '../../../../../assets/mdm/fact_check.svg';
import DomainRulesModal from './DomainRulesModal.jsx';
import {
    useDomainManagementHomepage,
    useDeleteDomain,
} from '../../../../../hooks/mdm/domainManagement.jsx';

/* ─────────────────────────────────────────────
   Action Menu
───────────────────────────────────────────── */
const ActionMenu = ({ row, onEdit, onRules, onDelete }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

    const handleOpen = (e) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setMenuPos({ top: rect.bottom + 4, left: rect.right - 160 });
        setIsOpen((prev) => !prev);
    };

    return (
        <div className="relative inline-block">
            <button
                onClick={handleOpen}
                className="bg-transparent border-none cursor-pointer p-1 rounded-full flex items-center"
            >
                <MoreVertical size={18} className="text-[#818181]" />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-[1000]"
                        onClick={() => setIsOpen(false)}
                    />
                    <div
                        className="fixed z-[9999] bg-white rounded-2xl shadow-[0px_10px_30px_rgba(0,0,0,0.15)] p-2 min-w-[160px] flex flex-col gap-1"
                        style={{ top: menuPos.top, left: menuPos.left }}
                    >
                        <button
                            onClick={() => { onEdit?.(row); setIsOpen(false); }}
                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] border-none cursor-pointer bg-[#F3EFFF] w-full"
                        >
                            <img src={EditIcon} alt="Edit" className="w-4 h-4" />
                            <span className="text-[#8e78b7] text-sm font-medium">Edit</span>
                        </button>

                        <button
                            onClick={() => { onRules?.(row); setIsOpen(false); }}
                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] border-none cursor-pointer bg-white w-full"
                        >
                            <img src={RulesIcon} alt="Rules" className="w-4 h-4" />
                            <span className="text-[#444] text-sm font-medium">Rules</span>
                        </button>

                        <button
                            onClick={() => { onDelete?.(row); setIsOpen(false); }}
                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] border-none cursor-pointer bg-white w-full"
                        >
                            <img src={DeleteIcon} alt="Delete" className="w-4 h-4" />
                            <span className="text-[#E05252] text-sm font-medium">Delete</span>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

/* ─────────────────────────────────────────────
   Badges
───────────────────────────────────────────── */
const DQScoreBadge = ({ score }) => {
    const num = parseFloat(score);
    const colorClass =
        num < 70 ? 'text-[#EF4D5F]' : num < 85 ? 'text-[#E08E40]' : 'text-[#36AD8F]';
    return <span className={`${colorClass} text-sm font-medium`}>{score}%</span>;
};

const StatusBadge = ({ status }) => {
    const lower = status?.toLowerCase();
    const classes =
        lower === 'active'
            ? 'text-[#069B68] bg-[#2AC79240]'
            : lower === 'draft'
            ? 'text-[#EF4D5F] bg-[#F276A74D]'
            : 'text-[#6B7280] bg-[#F3F4F6]';
    return (
        <span className={`${classes} px-2 py-1.5 text-xs font-normal rounded-md`}>
            {status}
        </span>
    );
};

/* ─────────────────────────────────────────────
   Metric cards config
───────────────────────────────────────────── */
const metrics = [
    { title: 'Active Domains',    key: 'active_domains',    icon: CaptivePortalIcon, bgcolor: 'bg-[#C5EAF0]' },
    { title: 'Total Attributes',  key: 'total_attributes',  icon: CDCIcon,           bgcolor: 'bg-[#FFC93F40]' },
    { title: 'Validation Rules',  key: 'validation_rules',  icon: ComplianceIcon,    bgcolor: 'bg-[#FEE4FF]' },
    { title: 'Cross-Domain Links',key: 'cross_domain_links',icon: LinkedServicesIcon, bgcolor: 'bg-[#DBE0FC]' },
];

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
const DomainManagement = () => {
    const { decodedToken } = useAuth();
    const [searchTerm, setSearchTerm]     = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingDomain, setEditingDomain]   = useState(null);
    const [selectedDomain, setSelectedDomain] = useState(null);
    const [rulesModal, setRulesModal]         = useState(null);

    /* ── Hooks ── */
    const { isLoading, metricCounts, domains, fetchData } = useDomainManagementHomepage();

    const { deleteDomain } = useDeleteDomain(fetchData);

    /* ── Handlers ── */
    const handleEdit   = (row) => setEditingDomain(row);
    const handleRules  = (row) => setRulesModal({ id: row.id, domainName: row.domainName });

    const handleDelete = async (row) => {
        const result = await deleteDomain(row.id, decodedToken?.preferred_username);
        if (result.ok) {
            toast.success(`Domain '${row.domainName}' deleted successfully.`);
        } else {
            toast.error(result.message);
        }
    };

    const handleRefresh = async () => {
        setSearchTerm('');
        const result = await fetchData(true);
        if (result.ok) toast.success('Data refreshed successfully!');
        else toast.error('Failed to refresh data.');
    };

    /* ── Derived state ── */
    const filteredData = React.useMemo(
        () =>
            domains.filter((item) =>
                Object.values(item).some((v) =>
                    String(v).toLowerCase().includes(searchTerm.toLowerCase())
                )
            ),
        [domains, searchTerm]
    );

    const counts = {
        active_domains:   metricCounts?.active_domains   ?? 0,
        total_attributes: metricCounts?.total_attributes ?? 0,
        validation_rules: metricCounts?.validation_rules ?? 0,
        cross_domain_links: metricCounts?.cross_domain_links ?? 0,
    };

    /* ── Column definitions ── */
    const columns = [
        {
            key: 'domainName',
            label: 'Domain Name',
            render: (row) => (
                <button
                    className="text-[#8E77BB] hover:underline font-normal text-left text-sm"
                    onClick={() => setSelectedDomain(row)}
                >
                    {row.domainName}
                </button>
            ),
        },
        { key: 'domainCode', label: 'Domain Code' },
        { key: 'tableName',  label: 'Table Name' },
        { key: 'type',       label: 'Type' },
        {
            key: 'attributes',
            label: 'Attributes',
            render: (row) => (
                <span className="text-[#8E77BB] font-normal">{row.attributes}</span>
            ),
        },
        {
            key: 'records',
            label: 'Records',
            render: (row) => <span>{row.records?.toLocaleString()}</span>,
        },
        {
            key: 'dqScore',
            label: 'DQ Score',
            render: (row) => <DQScoreBadge score={row.dqScore} />,
        },
        {
            key: 'status',
            label: 'Status',
            render: (row) => <StatusBadge status={row.status} />,
        },
        {
            label: 'Action',
            sortable: false,
            render: (row) => (
                <ActionMenu
                    row={row}
                    onEdit={handleEdit}
                    onRules={handleRules}
                    onDelete={handleDelete}
                />
            ),
        },
    ];

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <Breadcrumb />

            {/* Page header */}
            <div className="flex items-start justify-between mb-4 mt-2">
                <div>
                    <h1 className="text-2xl font-bold text-[#282F49]">Domain Management</h1>
                    <p className="text-sm text-[#818181] mt-0.5">
                        Configure master data domain schemas, attributes, and validation rules
                    </p>
                </div>
                <div className="flex justify-between gap-3 font-medium text-sm">
                    <button
                        title="Refresh"
                        onClick={handleRefresh}
                        disabled={isLoading}
                        className="p-2.5 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-wait"
                    >
                        <RefreshCcw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#8E77BB] text-white rounded-lg hover:bg-[#7a67a0] transition-colors text-sm font-medium"
                    >
                        <Plus className="h-4 w-4" />
                        Add Domain
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
                    <h2 className="text-lg font-medium text-[#332849]">Configured Domains</h2>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search domains..."
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

                <MDMDataTable
                    columns={columns}
                    data={filteredData}
                    isLoading={isLoading}
                    refetch={() => fetchData(true)}
                />
            </div>

            {/* Modals */}
            <AddDomainModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onComplete={() => { setIsAddModalOpen(false); fetchData(); }}
            />
            <EditDomainModal
                isOpen={!!editingDomain}
                onClose={() => setEditingDomain(null)}
                domainData={editingDomain}
                onComplete={() => { setEditingDomain(null); fetchData(); }}
            />
            <DomainDetailsSidebar
                domain={selectedDomain}
                onClose={() => setSelectedDomain(null)}
                onEdit={(row) => { setSelectedDomain(null); setEditingDomain(row); }}
            />
            <DomainRulesModal
                isOpen={!!rulesModal}
                onClose={() => setRulesModal(null)}
                domainId={rulesModal?.id}
                domainName={rulesModal?.domainName}
            />
        </div>
    );
};

export default DomainManagement;