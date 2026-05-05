import React, { useState, useEffect } from 'react';
import { Search, RefreshCcw, Plus, X, MoreVertical,} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAgentCatalog } from '../../../../../hooks/mdm/agentMesh';
import EditIcon from '../../../../../assets/mdm/edit.svg';
import DeleteIcon from '../../../../../assets/mdm/delete.svg';
import Breadcrumb from '../../../../../components/Breadcrumb';
import DataTable from '../../../../../components/DataTable';
import SearchIcon from '../../../../../assets/mdm/search.svg';
import ReplayIcon from '../../../../../assets/mdm/replay.svg';

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

const ActionMenu = ({ row, onEdit, onDelete }) => {
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
                    <div className="fixed inset-0 z-[1000]" onClick={() => setIsOpen(false)} />
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

const AgentCatalog = () => {
    const [searchTerm, setSearchTerm] = useState('');

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
        {
            label: 'Action',
            sortable: false,
            render: (row) => (
                <ActionMenu
                    row={row}
                    onEdit={(r) => toast(`Edit: ${r.agent_name}`)}
                    onDelete={(r) => toast.error(`Delete: ${r.agent_name}`)}
                />
            ),
        },
    ];

    return (
        <div className="p-4 m-4 bg-white min-h-screen">
            <Breadcrumb />

            {/* Page header */}
            <div className="flex items-start justify-between mb-4 mt-2">
                <div>
                    <h1 className="text-2xl font-bold text-[#282F49]">Agent Catalog</h1>
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

            {/* Agent Catalog section */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        {/* Search */}
                        <div className="relative">
                            <img src={SearchIcon} alt="Search" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#818181] pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search agents..."
                                className="w-[280px] rounded-lg border border-gray-200 py-1.5 pl-9 pr-8 text-sm focus:outline-none"
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
                        data={filteredAgents}
                        isLoading={isLoading}
                        refetch={() => fetchData(true)}
                    />
            </div>
        </div>
    );
};

export default AgentCatalog;