import React, { useState, useEffect } from 'react';
import { Search, RefreshCcw, Plus, X, MoreVertical, LayoutGrid, List } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAgentCatalog } from '../../../../../hooks/mdm/agentMesh';


import DoneAllIcon from '../../../../../assets/mdm/done_all.svg';
import PendingActionsIcon from '../../../../../assets/mdm/pending_actions.svg';
import SpeedIcon from '../../../../../assets/mdm/speed.svg';
import Flag2Icon from '../../../../../assets/mdm/flag_2.svg';
import EditIcon from '../../../../../assets/mdm/edit.svg';
import DeleteIcon from '../../../../../assets/mdm/delete.svg';
import Breadcrumb from '../../../../../components/Breadcrumb';
import DataTable from '../../../../../components/DataTable';
import SearchIcon from '../../../../../assets/mdm/search.svg';
import ReplayIcon from '../../../../../assets/mdm/replay.svg';


const metrics = [
    { title: 'Active Agents', key: 'active_agents', icon: DoneAllIcon, bgcolor: 'bg-[#CAF1E4]' },
    { title: 'Tasks Today', key: 'tasks_today', icon: PendingActionsIcon, bgcolor: 'bg-[#FFF1CF]' },
    { title: 'Avg Latency', key: 'avg_latency', icon: SpeedIcon, bgcolor: 'bg-[#C5EAF0]' },
    { title: 'Success Rate', key: 'success_rate', icon: Flag2Icon, bgcolor: 'bg-[#FBD6E5]' },
];

const TYPE_COLORS = {
    CORE: { bg: 'bg-[#16ABC240]', text: 'text-[#16ABC2]' },
    SPECIALIZED: { bg: 'bg-[#F276A74D]', text: 'text-[#EF4D5F]' },
    INTERFACE: { bg: 'bg-[#2AC79240]', text: 'text-[#069B68]' }
};

const AgentTypeBadge = ({ type }) => {
    const c = TYPE_COLORS[type] ?? { bg: 'bg-gray-100', text: 'text-gray-600' };
    const label = type.charAt(0) + type.slice(1).toLowerCase();
    return (
        <span className={`${c.bg} ${c.text} px-[8px] py-[6px] text-xs font-normal rounded-[4px]`}>
            {label}
        </span>
    );
};

const StatusBadge = ({ status }) => {
    const lower = status?.toLowerCase();
    const classes =
        lower === 'active'
            ? 'text-[#069B68] bg-[#2AC79240]'
            : lower === 'inactive'
                ? 'text-[#EF4D5F] bg-[#F276A74D]'
                : 'text-[#6B7280] bg-[#F3F4F6]';
    return (
        <span className={`${classes} px-2 py-1.5 text-xs font-normal rounded-md`}>
            {status?.charAt(0) + status?.slice(1).toLowerCase()}
        </span>
    );
};


const AgentCard = ({ agent }) => {
    const accuracy = agent.accuracy ?? '96.5%';

    return (
        <div className="rounded-[8px] border border-[#CCCCCC] p-3 flex flex-col gap-4">
            {/* Row 1: name + status badge */}
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#282F49]">{agent.agent_name}</span>
                <span
                    className="px-3 py-1 text-xs font-medium rounded-lg text-[#098C60] bg-[#098C601A]"
                >
                    {agent.status?.charAt(0) + agent.status?.slice(1).toLowerCase()}
                </span>
            </div>

            {/* Divider row: Tasks | vertical line | Accuracy */}
            <div className="flex items-stretch gap-0">
                <div className="flex-1">
                    <p className="text-base font-bold text-[#282F49]">
                        {agent.tasks_per_day?.toLocaleString()}
                    </p>
                    <p className="text-xs font-medium text-[#818181] mt-0.5">Tasks</p>
                </div>

                <div className="self-stretch w-[1.5px] bg-[#CCCCCC] mx-6 mt-1" style={{ maxHeight: '70%' }} />

                <div className="flex-1">
                    <p className="text-base font-bold text-[#282F49]">{accuracy}</p>
                    <p className="text-xs font-medium text-[#818181] mt-0.5">Accuracy</p>
                </div>
            </div>
        </div>
    );
};

const RowActions = ({ row, onEdit, onDelete, isDeleting = false }) => {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState({ top: 0, left: 0 });

    const handleOpen = (e) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setPos({ top: rect.bottom + 4, left: rect.right - 160 });
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
                    <div
                        className="fixed inset-0 z-[1000]"
                        onClick={() => setOpen(false)}
                    />
                    <div
                        className="fixed z-[9999] bg-white rounded-2xl shadow-[0px_10px_30px_rgba(0,0,0,0.15)] p-2 min-w-[160px] flex flex-col gap-1"
                        style={{ top: pos.top, left: pos.left }}
                    >
                        <button
                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] border-none cursor-pointer bg-[#F3EFFF] w-full"
                        >
                            <img src={EditIcon} alt="Edit" className="w-4 h-4" />
                            <span className="text-[#8e78b7] text-sm font-medium">Edit</span>
                        </button>

                        <button
                            disabled={isDeleting}
                            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] border-none w-full bg-white ${isDeleting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                                }`}
                        >
                            <img src={DeleteIcon} alt="Delete" className="w-4 h-4" />
                            <span className="text-[#E05252] text-sm font-medium">
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </span>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

const AgentDashboard = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid');

    const { isLoading, agents, metricCounts, fetchData } = useAgentCatalog();

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleRefresh = async () => {
        setSearchTerm('');
        const result = await fetchData(true);
        if (result.ok) toast.success('Data refreshed successfully!');
        else toast.error('Failed to refresh data.');
    };

    const filteredAgents = React.useMemo(
        () =>
            agents.filter((a) =>
                Object.values(a).some((v) =>
                    String(v).toLowerCase().includes(searchTerm.toLowerCase())
                )
            ),
        [agents, searchTerm]
    );

    const counts = {
        active_agents: metricCounts?.active_agents ?? 0,
        tasks_today: metricCounts?.tasks_today ?? 0,
        avg_latency: metricCounts?.avg_latency ?? '—',
        success_rate: metricCounts?.success_rate ?? '—',
    };

    const columns = [
        {
            key: 'agent_name',
            label: 'Agent',
            render: (row) => (
                <span className="text-[#8E77BB] font-normal text-sm cursor-pointer hover:underline">
                    {row.agent_name}
                </span>
            ),
        },
        {
            key: 'agent_type',
            label: 'Type',
            render: (row) => <AgentTypeBadge type={row.agent_type} />,
        },
        { key: 'description', label: 'Description' },
        { key: 'llm', label: 'LLM' },
        {
            key: 'tools',
            label: 'Tools',
            render: (row) => <span className="text-[#23252D]">{row.tools}</span>,
        },
        {
            key: 'tasks_per_day',
            label: 'Tasks/Day',
            render: (row) => <span>{row.tasks_per_day?.toLocaleString()}</span>,
        },
        {
            key: 'status',
            label: 'Status',
            render: (row) => <StatusBadge status={row.status} />,
        },
        { key: 'actions', label: 'Actions', sortable: false, render: (row) => <RowActions row={row} /> },
    ];

    return (
        <div className="p-4 m-4 bg-white min-h-screen">
            <Breadcrumb />

            {/* Page header */}
            <div className="flex items-start justify-between mb-4 mt-2">
                <div>
                    <h1 className="text-2xl font-bold text-[#282F49]">Agent Dashboard</h1>
                    <p className="text-sm text-[#818181] mt-0.5">
                        Manage and validate high-confidence match pairs.
                    </p>
                </div>
                <div className="flex justify-between gap-3 font-medium text-sm">
                    <button
                        title="Refresh"
                        onClick={handleRefresh}
                        disabled={isLoading}
                        className="p-2 border border-[#818181] rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-wait"
                    >
                        <img src={ReplayIcon} alt="Search" className={`w-4 h-4 text-[#818181] pointer-events-none ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Metric cards – same gradient banner as DomainManagement */}
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
                                    <span className="inline-block h-7 w-16 bg-gray-200 rounded animate-pulse" />
                                ) : (
                                    typeof counts[m.key] === 'number'
                                        ? counts[m.key].toLocaleString()
                                        : counts[m.key]
                                )}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Agent Catalog section */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-medium text-[#332849]">Agent Catalog</h2>
                    <div className="flex items-center gap-2">
                        {/* Search */}
                        <div className="relative">
                            <img src={SearchIcon} alt="Search" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search agents..."
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

                        {/* View toggle */}
                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 transition-colors ${viewMode === 'grid'
                                    ? 'bg-[#8E77BB] text-white'
                                    : 'bg-white text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 transition-colors ${viewMode === 'list'
                                    ? 'bg-[#8E77BB] text-white'
                                    : 'bg-white text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                <List className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {viewMode === 'grid' && (
                    isLoading ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="bg-white rounded-xl p-4 h-24 animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {filteredAgents.map((agent) => (
                                <AgentCard key={agent.agent_id} agent={agent} />
                            ))}
                        </div>
                    )
                )}

                {/* List view */}
                {viewMode === 'list' && (
                    <DataTable
                        columns={columns}
                        data={filteredAgents}
                        isLoading={isLoading}
                        refetch={() => fetchData(true)}
                    />
                )}
            </div>
        </div>
    );
};

export default AgentDashboard;