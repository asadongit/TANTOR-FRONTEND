import React, { useState, useCallback, useMemo } from 'react';
import { Search, Plus, X, MoreVertical, Info } from 'lucide-react';
import Breadcrumb from "../../../../components/Breadcrumb";
import DataTable from "../../../../components/DataTable";
import HierarchyIcon from "../../../../assets/mdm/hierarchy.svg";
import LevelsIcon from "../../../../assets/mdm/total_levels.svg";
import NodesIcon from "../../../../assets/mdm/total_nodes.svg";
import CrossDomainIcon from "../../../../assets/mdm/cross_domains.svg";
import EditIcon from "../../../../assets/mdm/edit.svg";
import ViewIcon from "../../../../assets/mdm/view.svg";
import ArrowDownIcon from "../../../../assets/mdm/keyboard_arrow_down.svg";
import CreateHierarchyModal from './modals/CreateHierarchyModal.jsx';
import EditHierarchyModal from './modals/EditHierarchyModal.jsx';
import { useHierarchyDefinition } from "../../../../hooks/mdm/hierarchyDefinition";
import SearchableDropdown from "../components/SearchableDropdown";

const StatusBadge = ({ status }) => {
    const isActive = status === 'Active';
    return (
        <span
            className="inline-block rounded-md px-2 py-1.5 text-xs font-normal"
            style={{
                color: isActive ? '#069B68' : '#EF4D5F',
                backgroundColor: isActive ? '#2AC79240' : '#F276A74D',
            }}
        >
            {status}
        </span>
    );
};

const YesNoBadge = ({ value }) => (
    <span className="text-sm text-[#332849]">{value}</span>
);

const RowActions = ({ row, onEdit, onView }) => {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState({ top: 0, left: 0 });
    
    const handleOpen = (e) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();

        setPos({
            top: rect.bottom + 6,   // slight spacing below button
            left: rect.right       // align to right edge
        });

        setOpen((p) => !p);
    };

    return (
        <div className="relative inline-block">
            <button
                onClick={handleOpen}
                className="bg-transparent border-none cursor-pointer p-1 rounded-full flex items-center"
            >
                <MoreVertical size={18} className="text-[#818181]" />
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-[1000]" onClick={() => setOpen(false)} />
                    <div
                    className="fixed z-[9999] -translate-x-full bg-white rounded-lg shadow-[0px_2px_9px_rgba(0,0,0,0.1)] p-3 flex flex-col gap-2"
                    style={{ top: pos.top, left: pos.left }}
                    >
                    {/* View */}
                    <button
                    onClick={() => { onView?.(row); setOpen(false); }}
                    className="flex items-center gap-2 px-3 py-2 w-full rounded-md bg-transparent hover:bg-[#F2EBFF] transition-colors"
                    >
                    <img src={ViewIcon} alt="View" className="w-5 h-5" />
                    <span className="text-[#8E77BB] text-sm font-normal">View</span>
                    </button>

                    {/* Edit */}
                    <button
                    onClick={() => { onEdit?.(row); setOpen(false); }}
                    className="flex items-center gap-2 px-3 py-2 w-full rounded-md bg-transparent hover:bg-[#F2EBFF] transition-colors"
                    >
                    <img src={EditIcon} alt="Edit" className="w-5 h-5" />
                    <span className="text-[#332849] text-sm font-normal">Edit</span>
                    </button>
                    </div>
                </>
            )}
        </div>
    );
};

const METRIC_CONFIG = [
    { key: 'total_hierarchies', title: 'Total Hierarchies', icon: HierarchyIcon, bgcolor: '#FEE4FF' },
    { key: 'total_levels',      title: 'Total Levels',      icon: LevelsIcon,    bgcolor: '#DBE0FC' },
    { key: 'total_nodes',       title: 'Total Nodes',       icon: NodesIcon,     bgcolor: '#FDDCE3' },
    { key: 'cross_domain',      title: 'Cross-Domain',      icon: CrossDomainIcon, bgcolor: '#C5EAF0' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Status' },
  { value: 'Active', label: 'Active' },
  { value: 'Failed', label: 'Failed' },
  { value: 'Inactive', label: 'Inactive' },
];

const HierarchyDefinition = () => {
    const [searchTerm, setSearchTerm]     = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [isAddModalOpen, setIsAddModalOpen]   = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingHierarchy, setEditingHierarchy] = useState(null);
    const [showInfo, setShowInfo] = useState(false);

    const { data, isLoading, isError, fetchHierarchyDefinition } = useHierarchyDefinition();
    const { counts, hierarchies } = data;

    const filteredData = useMemo(
        () =>
            hierarchies.filter((item) => {
                const matchesSearch = Object.values(item).some((v) =>
                    String(v ?? '').toLowerCase().includes(searchTerm.toLowerCase())
                );
                const matchesStatus = !statusFilter || item.status === statusFilter;
                return matchesSearch && matchesStatus;
            }),
        [hierarchies, searchTerm, statusFilter]
    );

    const handleEdit = useCallback((row) => {
        setEditingHierarchy(row);
        setIsEditModalOpen(true);
    }, []);

    const handleView = useCallback((row) => {
        //  view logic 
    }, []);

    const handleSuccess = useCallback(async () => {
        await fetchHierarchyDefinition();
    }, [fetchHierarchyDefinition]);

    const columns = useMemo(
        () => [
            {
                key: 'hierarchy_code',
                label: 'Hierarchy Code',
                render: (row) => (
                    <span className="text-[#8E77BB] font-medium">{row.hierarchy_code}</span>
                ),
            },
            {
                key: 'name',
                label: 'Name',
                render: (row) => (
                    <span className="text-[#332849] text-sm">{row.name}</span>
                ),
            },
            {
                key: 'domain',
                label: 'Domain',
                render: (row) => (
                    <span className="text-sm text-[#332849]">{row.domain}</span>
                ),
            },
            {
                key: 'levels',
                label: 'Levels',
                render: (row) => <span className="text-sm text-[#332849]">{row.levels}</span>,
            },
            {
                key: 'dag',
                label: 'DAG',
                render: (row) => <YesNoBadge value={row.dag} />,
            },
            {
                key: 'dated',
                label: 'Dated',
                render: (row) => <YesNoBadge value={row.dated} />,
            },
            {
                key: 'status',
                label: 'Status',
                render: (row) => <StatusBadge status={row.status} />,
            },
            {
                key: 'actions',
                label: 'Actions',
                sortable: false,
                render: (row) => <RowActions row={row} onEdit={handleEdit} onView={handleView} />,
            },
        ],
        [handleEdit]
    );

    return (
        <div className="p-4 m-4 bg-white min-h-screen">
            <Breadcrumb />

            {/* Header */}
            <div className="flex items-start justify-between mb-5 mt-2">
                <div>
                    <h1 className="text-2xl font-bold text-[#282F49]">Hierarchy Definition</h1>
                    <p className="text-sm text-[#818181] mt-0.5">
                        Create and configure hierarchy structures and levels
                    </p>
                </div>

                <div className="flex items-center gap-2 relative">
                <div
                    onMouseEnter={() => setShowInfo(true)}
                    onMouseLeave={() => setShowInfo(false)}
                    className="relative"
                >
                    <Info size={18} className="text-[#818181] cursor-pointer" />

                    {showInfo && (
                        <div className="absolute right-0 top-7 w-[418px] bg-[#332849] rounded-xl p-4 z-50">
                            
                            <p className="font-bold text-sm leading-[19px] text-white mb-3 font-[Satoshi,sans-serif]">
                                Configuration Options
                            </p>

                            <div className="mb-3">
                                <p className="font-bold text-sm leading-[19px] text-white font-[Satoshi,sans-serif]">
                                    Enable DAG Structure [ ON ]
                                </p>
                                <p className="font-medium text-sm leading-[19px] text-[#D1C6E8] font-[Satoshi,sans-serif]">
                                    Allow nodes to have multiple parents (Matrix) instead of a single parent (Tree).
                                </p>
                                <p className="font-medium text-sm leading-[19px] text-[#B9AEE0] font-[Satoshi,sans-serif]">
                                    Stored in: MDM_HIERARCHY_TYPE.allow_multiple_parents
                                </p>
                            </div>

                            <div>
                                <p className="font-bold text-sm leading-[19px] text-white font-[Satoshi,sans-serif]">
                                    Track Date Ranges [ OFF ]
                                </p>
                                <p className="font-medium text-sm leading-[19px] text-[#D1C6E8] font-[Satoshi,sans-serif]">
                                    Enable versioning for relationships using effective start and end dates.
                                </p>
                                <p className="font-medium text-sm leading-[19px] text-[#B9AEE0] font-[Satoshi,sans-serif]">
                                    Stored in: MDM_HIERARCHY_TYPE.is_effective_dated
                                </p>
                            </div>

                        </div>
                    )}
                </div>

                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#8E77BB] text-white rounded-lg hover:bg-[#7a67a0] transition-colors text-sm font-medium"
                >
                    <Plus className="h-4 w-4" />
                    New Hierarchy
                </button>
                </div>
            </div>

            {/* Metric Cards — gradient wrapper like Survivorship */}
            <div
                className="rounded-2xl p-4 mb-6"
                style={{
                    background: 'linear-gradient(270deg, #EFE7FF 17.24%, #8E77BB 93.06%, #2B125C 141.05%)',
                }}
            >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {METRIC_CONFIG.map((metric) => (
                        <div
                            key={metric.key}
                            className="bg-white rounded-xl p-4 shadow-sm flex flex-col gap-3"
                        >
                            {/* Top row: icon + label */}
                            <div className="flex items-center gap-2.5">
                                <div
                                    className="flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: metric.bgcolor }}
                                >
                                    <img src={metric.icon} alt={metric.title} className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium text-[#332849]">{metric.title}</span>
                            </div>
                            {/* Count below */}
                            <span className="text-2xl font-bold text-[#282F49] leading-none">
                                {(counts[metric.key] ?? 0).toLocaleString()}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Table section — bordered box */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-base font-medium text-[#332849]">Hierarchies</h2>
                    <div className="flex items-center gap-2">
                        <SearchableDropdown
                            value={statusFilter}
                            onChange={setStatusFilter}
                            options={STATUS_OPTIONS}
                            placeholder="Status"
                        />
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-[200px] rounded-lg border border-gray-200 py-1.5 pl-9 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
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
                    isError={isError}
                    refetch={fetchHierarchyDefinition}
                    title=""
                />
            </div>

            <CreateHierarchyModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={handleSuccess}
            />
            <EditHierarchyModal
                isOpen={isEditModalOpen}
                onClose={() => { setIsEditModalOpen(false); setEditingHierarchy(null); }}
                onSuccess={handleSuccess}
                hierarchy={editingHierarchy}
            />
        </div>
    );
};

export default HierarchyDefinition;