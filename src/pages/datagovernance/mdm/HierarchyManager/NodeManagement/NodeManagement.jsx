import React, { useState, useCallback, useMemo } from 'react';
import { Search, Plus, X, MoreVertical } from 'lucide-react';
import Breadcrumb from "../../../../../components/Breadcrumb";
import DataTable from "../../../../../components/DataTable";
import TotalNodesIcon from "../../../../../assets/mdm/assistant_on_hub_nm.svg";
import ActiveNodesIcon from "../../../../../assets/mdm/check_circle.svg";   // swap to dedicated icon when available
import RootNodesIcon from "../../../../../assets/mdm/subdirectory_arrow_right.svg";        // swap to dedicated icon when available
import MaxDepthIcon from "../../../../../assets/mdm/layer.svg";      // swap to dedicated icon when available
import EditIcon from "../../../../../assets/mdm/edit.svg";
import SearchableDropdown from "../../components/SearchableDropdown";
import MoveIcon from "../../../../../assets/mdm/open_with.svg";
import ArrowDownIcon from "../../../../../assets/mdm/keyboard_arrow_down.svg";
import CreateNodeModal from "./modals/CreateNodeModal";
import EditNodeModal from "./modals/EditNodeModal";
import MoveNodeModal from "./modals/MoveNodeModal";
import { useNodeManagement } from "../../../../../hooks/mdm/nodeManagement";

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

//  Level badge 
const LevelBadge = ({ level }) => {
    const LEVEL_COLORS = [
    { color: '#16ABC2', bg: '#16ABC240' }, 
    ];

    const num = parseInt(String(level).replace(/\D/g, ''), 10) || 0;
    const { color, bg } = LEVEL_COLORS[num % LEVEL_COLORS.length];

    return (
        <span
            className="inline-block rounded-md px-2 py-1 text-xs font-medium"
            style={{ color, backgroundColor: bg }}
        >
            {level}
        </span>
    );
};

// Row action menu 
const RowActions = ({ row, onEdit, onView }) => {
    const [open, setOpen] = useState(false);
    const [pos, setPos]   = useState({ top: 0, left: 0 });

    const handleOpen = (e) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setPos({ top: rect.bottom + 6, left: rect.right });
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
                        <button
                            onClick={() => { onView?.(row); setOpen(false); }}
                            className="flex items-center gap-2 px-3 py-2 w-full rounded-md bg-transparent hover:bg-[#F2EBFF] transition-colors"
                        >
                            <img src={MoveIcon} alt="Move" className="w-5 h-5" />
                            <span className="text-[#8E77BB] text-sm font-normal">Move</span>
                        </button>
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

//  Metric card config 
const METRIC_CONFIG = [
    { key: 'total_nodes',  title: 'Total Nodes',  icon: TotalNodesIcon,  bgcolor: '#FFF1CF' },
    { key: 'active_nodes', title: 'Active Nodes', icon: ActiveNodesIcon, bgcolor: '#CAF1E4' },
    { key: 'root_nodes',   title: 'Root Nodes',   icon: RootNodesIcon,   bgcolor: '#FEE4FF' },
    { key: 'max_depth',    title: 'Max Depth',    icon: MaxDepthIcon,    bgcolor: '#C5EAF0' },
];


const STATUS_OPTIONS = [
  { value: '', label: 'Status' },
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
];

//  Page component 
const NodeManagement = () => {
    const [searchTerm,   setSearchTerm]   = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [isAddModalOpen,  setIsAddModalOpen]  = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingNode, setEditingNode] = useState(null);
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
    const [movingNode, setMovingNode] = useState(null);

    const { data, isLoading, isError, fetchNodeManagement } = useNodeManagement();
    const { counts, nodes } = data;

    const filteredData = useMemo(
        () =>
            nodes.filter((item) => {
                const matchesSearch = Object.values(item).some((v) =>
                    String(v ?? '').toLowerCase().includes(searchTerm.toLowerCase())
                );
                const matchesStatus = !statusFilter || item.status === statusFilter;
                return matchesSearch && matchesStatus;
            }),
        [nodes, searchTerm, statusFilter]
    );

    const handleEdit = useCallback((row) => {
        setEditingNode(row);
        setIsEditModalOpen(true);
    }, []);

    const handleView = useCallback((row) => {
    setMovingNode(row);
    setIsMoveModalOpen(true);
    }, []);

    const handleSuccess = useCallback(async () => {
        await fetchNodeManagement();
    }, [fetchNodeManagement]);

    const columns = useMemo(
        () => [
            {
                key: 'node_id',
                label: 'Node ID',
                render: (row) => (
                    <span className="text-[#8E77BB] font-medium">{row.internal_node_id}</span>
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
                key: 'hierarchy',
                label: 'Hierarchy',
                render: (row) => (
                    <span className="text-sm text-[#332849]">{row.hierarchy}</span>
                ),
            },
            {
                key: 'parent',
                label: 'Parent',
                render: (row) => (
                    <span className="text-sm text-[#332849]">{row.parent}</span>
                ),
            },
            {
                key: 'level',
                label: 'Level',
                render: (row) => <LevelBadge level={row.level} />,
            },
            {
                key: 'children',
                label: 'Children',
                render: (row) => (
                    <span className="text-sm text-[#332849]">{row.children}</span>
                ),
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
                render: (row) => (
                    <RowActions row={row} onEdit={handleEdit} onView={handleView} />
                ),
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
                    <h1 className="text-2xl font-bold text-[#282F49]">Node Management</h1>
                    <p className="text-sm text-[#818181] mt-0.5">
                        Add, edit, move, and delete hierarchy nodes
                    </p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#8E77BB] text-white rounded-lg hover:bg-[#7a67a0] transition-colors text-sm font-medium"
                >
                    <Plus className="h-4 w-4" />
                    Add Node
                </button>
            </div>

            {/* Metric Cards */}
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
                            <div className="flex items-center gap-2.5">
                                <div
                                    className="flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: metric.bgcolor }}
                                >
                                    <img src={metric.icon} alt={metric.title} className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium text-[#332849]">{metric.title}</span>
                            </div>
                            <span className="text-2xl font-bold text-[#282F49] leading-none">
                                {(counts[metric.key] ?? 0).toLocaleString()}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Table section */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-base font-medium text-[#332849]">Hierarchy Nodes</h2>
                    <div className="flex items-center gap-2">
                        <div className="min-w-[140px]">
                            <SearchableDropdown
                                value={statusFilter}
                                onChange={setStatusFilter}
                                options={STATUS_OPTIONS}
                                placeholder="Status"
                                />
                        </div>

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
                    refetch={fetchNodeManagement}
                    title=""
                />
            </div>

            <CreateNodeModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={handleSuccess}
            />
            <EditNodeModal
                isOpen={isEditModalOpen}
                onClose={() => { setIsEditModalOpen(false); setEditingNode(null); }}
                onSuccess={handleSuccess}
                node={editingNode}
            />
            <MoveNodeModal
                isOpen={isMoveModalOpen}
                onClose={() => { setIsMoveModalOpen(false); setMovingNode(null); }}
                onSuccess={handleSuccess}
                node={movingNode}
            />
        </div>
    );
};

export default NodeManagement;