import { Search, List, RefreshCw, CheckCircle, Target, BookOpenText, Trash2, Plus, LayoutGrid, Folder, Database, Bot, ArrowUp, ArrowDown, Archive } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Breadcrumb from '../../../components/Breadcrumb';
import DataTable from '../../../components/DataTable';
import { useAuth } from '../../../context/AuthContext';
import { CreateProjectModal } from '../AIPlayground/modals/Dashboard/CreateProjectModal';
import DeleteModal from './Components/DeleteModal';
import ArchiveModal from './Components/ArchieveModal';
import StatusFilterDropdown from './Components/StateSelector';
import { updateRecentAccess } from './Components/Hooks';

const Projects = () => {
    const navigate = useNavigate();
    const { token, decodedToken } = useAuth();
    const hostnameAI = window._env_?.VITE_AI_API;

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState(['active']); // Array of selected statuses: active, archived
    const [isLoading, setIsLoading] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [dashboardRefreshTrigger, setDashboardRefreshTrigger] = useState(0);
    const [viewMode, setViewMode] = useState('both');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    const [tableData, setTableData] = useState([]);
    const [error, setError] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const [archiveModalOpen, setArchiveModalOpen] = useState(false);
    const [archiveTarget, setArchiveTarget] = useState(null);
    const [archiveLoading, setArchiveLoading] = useState(false);

    const [dashboardData, setDashboardData] = useState(null);
    const [dashboardLoading, setDashboardLoading] = useState(false);
    const [dashboardError, setDashboardError] = useState(null);

    const [recentProjects, setRecentProjects] = useState([]);
    const [recentProjectsLoading, setRecentProjectsLoading] = useState(false);
    const [recentProjectsError, setRecentProjectsError] = useState(null);

    useEffect(() => {
        const fetchProjects = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(`${hostnameAI}/canvas/project_list/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) throw new Error('Failed to fetch projects');
                const data = await response.json();
                setTableData(Array.isArray(data) ? data : []);
            } catch (err) {
                setError(err?.message || 'Failed to fetch projects');
            } finally {
                setIsLoading(false);
            }
        };

        if (hostnameAI && token) fetchProjects();
    }, [hostnameAI, token, refreshTrigger]);

    useEffect(() => {
        const fetchDashboard = async () => {
            setDashboardLoading(true);
            setDashboardError(null);
            try {
                const response = await fetch(
                    `${hostnameAI}/canvas/project_dashboard/summary?user_id=${decodedToken?.sub}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (!response.ok) throw new Error('Failed to fetch project dashboard');
                const data = await response.json();
                setDashboardData(data);
            } catch (err) {
                setDashboardError(err?.message || 'Failed to fetch project dashboard');
            } finally {
                setDashboardLoading(false);
            }
        };

        if (hostnameAI && token && decodedToken?.sub) fetchDashboard();
    }, [hostnameAI, token, decodedToken?.sub, dashboardRefreshTrigger]);

    useEffect(() => {
        const fetchRecentProjects = async () => {
            if (!hostnameAI || !token || !decodedToken?.sub) return;
            setRecentProjectsLoading(true);
            setRecentProjectsError(null);
            try {
                const url = `${hostnameAI}/canvas/entity/recent_access/list?user_id=${decodedToken.sub}&entity_type=project&limit=2`;
                const resp = await fetch(url, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!resp.ok) throw new Error('Failed to fetch recent projects');
                const data = await resp.json();
                setRecentProjects(Array.isArray(data?.recent_entities) ? data.recent_entities : []);
            } catch (err) {
                setRecentProjectsError(err?.message || 'Failed to fetch recent projects');
            } finally {
                setRecentProjectsLoading(false);
            }
        };
        fetchRecentProjects();
    }, [hostnameAI, token, decodedToken?.sub, dashboardRefreshTrigger]);

    const trendUp = (t) => String(t || '').toLowerCase() === 'increased';
    const pct = (v) => (v == null ? 0 : Number(v));

    const statsCards = useMemo(() => {
        if (dashboardLoading || !dashboardData?.counts) {
            return [
                { label: 'Projects', value: null, icon: Folder, trend: null, trendValue: null },
                { label: 'Models', value: null, icon: Bot, trend: null, trendValue: null },
                { label: 'Datasets', value: null, icon: Database, trend: null, trendValue: null },
            ];
        }

        const counts = dashboardData.counts;

        return [
            {
                label: 'Projects',
                value: String(counts.projects?.current ?? 0),
                icon: Folder,
                trend: trendUp(counts.projects?.trend) ? 'up' : 'down',
                trendValue: `${pct(counts.projects?.percentage_change)}%`,
            },
            {
                label: 'Models',
                value: String(counts.models?.current ?? 0),
                icon: Bot,
                trend: trendUp(counts.models?.trend) ? 'up' : 'down',
                trendValue: `${pct(counts.models?.percentage_change)}%`,
            },
            {
                label: 'Datasets',
                value: String(counts.datasets?.current ?? 0),
                icon: Database,
                trend: trendUp(counts.datasets?.trend) ? 'up' : 'down',
                trendValue: `${pct(counts.datasets?.percentage_change)}%`,
            },
        ];
    }, [dashboardData, dashboardLoading]);

    const StatsCardWithTrend = ({ label, value, icon: Icon, trend, trendValue }) => {
        const isUp = trend === 'up';
        const TrendIcon = isUp ? ArrowUp : ArrowDown;
        const trendColor = isUp ? 'text-emerald-500' : 'text-red-500';

        return (
            <div className="bg-white rounded-xl px-6 py-5 border border-purple-200 flex flex-col justify-between min-h-[120px]">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <Icon className="w-5 h-5 text-[#8e78b7] shrink-0" />
                        <span className="text-gray-900 text-2xl font-medium truncate">{label}</span>
                    </div>
                </div>

                <div className="flex items-end justify-between mt-6">
                    <div className="text-2xl font-bold text-gray-900 tabular-nums leading-none">
                        {value == null ? (
                            <div className="h-10 w-16 bg-gray-200 rounded animate-pulse"></div>
                        ) : (
                            value
                        )}
                    </div>

                    {(trend && trendValue && value != null) ? (
                        <div className={`flex items-center gap-2 ${trendColor} text-2xl font-semibold leading-none`}>
                            <TrendIcon className="w-7 h-7" />
                            <span className="tabular-nums">{trendValue}</span>
                        </div>
                    ) : (
                        <div className="h-7 w-14" />
                    )}
                </div>
            </div>
        );
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleRefresh = () => {
        setRefreshTrigger((prev) => prev + 1);
        setDashboardRefreshTrigger((prev) => prev + 1);
    };

    const getStatusStyle = (status) => {
        const normalized = String(status || '').toLowerCase();
        switch (normalized) {
            case 'active':
                return 'bg-green-100 text-green-700';
            case 'inactive':
                return 'bg-red-100 text-red-600';
            default:
                return 'bg-gray-100 text-gray-600';
        }
    };

    const handleProjectLibrary = async (row) => {
        navigate(`/ai/hub/projects/${row.id}/library`, { state: { ProjectData: row } });
        await updateRecentAccess({
            row,
            entityType: 'project',
            hostnameAI,
            token,
            userId: decodedToken?.sub,
            setRecentList: setRecentProjects,
            setRecentLoading: setRecentProjectsLoading,
            limit: 2,
        });
    };

    const handleDelete = (row) => {
        setDeleteTarget(row);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        try {
            const id = deleteTarget.id;
            const url = `${hostnameAI}/canvas/project/${id}/delete`;
            const resp = await fetch(url, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    accept: "application/json",
                },
            });
            if (!resp.ok) throw new Error("Failed to delete project");
            setDeleteModalOpen(false);
            setDeleteTarget(null);
            setRefreshTrigger((prev) => prev + 1);
        } catch (err) {
            alert(err.message || "Delete failed");
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleArchive = (row) => {
        setArchiveTarget(row);
        setArchiveModalOpen(true);
    };

    const confirmArchive = async () => {
        if (!archiveTarget) return;
        setArchiveLoading(true);
        try {
            const id = archiveTarget.id;
            const url = `${hostnameAI}/canvas/archive_project/${id}`;
            const resp = await fetch(url, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ project_id: id }),
            });
            if (!resp.ok) throw new Error("Failed to archive project");
            setArchiveModalOpen(false);
            setArchiveTarget(null);
            setRefreshTrigger((prev) => prev + 1);
        } catch (err) {
            alert(err.message || "Archive failed");
        } finally {
            setArchiveLoading(false);
        }
    };

    const columns = [
        {
            key: 'sno',
            label: 'S.No',
            sortable: false,
            width: '100px',
            render: (_row, idx) => idx + 1,
        },
        {
            key: 'name',
            label: 'Name',
            sortable: true,
            render: (row) => (
                <span
                    className="text-[#8e78b7] hover:underline cursor-pointer whitespace-normal break-words"
                    style={{ overflowWrap: 'anywhere' }}
                    onClick={() => handleProjectLibrary(row)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleProjectLibrary(row)}
                    title={row.name ?? ''}
                >
                    {row.name}
                </span>
            ),
        },
        { key: 'description', label: 'Description', sortable: true },
        { key: 'created_at', label: 'Created Date', sortable: true, render: (row) => row.created_at ? new Date(row.created_at).toLocaleDateString('en-GB') : '—' },
        { key: 'owner_name', label: 'Created By', sortable: true, render: (row) => row.owner_name ?? '—' },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (row) => (
                <span className={`px-3 py-1 rounded-md text-xs font-medium ${getStatusStyle(row.status)}`}>
                    {String(row.status || '').toLowerCase() === 'active' ? 'Active' : String(row.status || '—')}
                </span>
            ),
        },
        { label: 'Action', sortable: false },
    ];

    const actions = [
        {
            label: 'Project Library',
            icon: <BookOpenText className="w-4 h-4" />,
            onClick: handleProjectLibrary,
            tooltip: 'Project Library',
        },
        {
            label: 'Archive',
            icon: <Archive className="w-4 h-4" />,
            onClick: handleArchive,
            tooltip: 'Archive',
        },
        {
            label: 'Delete',
            icon: <Trash2 className="w-4 h-4" />,
            onClick: handleDelete,
            tooltip: 'Delete',
        },
    ];

    const filteredData = useMemo(() => {
        const base = tableData.filter(row => String(row.status).toLowerCase() !== "deleted");

        const statusFiltered = base.filter(row => {
            const rowStatus = String(row.status ?? '').toLowerCase();
            return statusFilter.includes(rowStatus);
        });

        if (!searchTerm.trim()) return statusFiltered;
        const q = searchTerm.toLowerCase();
        return statusFiltered.filter((row) =>
            Object.values(row || {}).some((val) => String(val ?? '').toLowerCase().includes(q))
        );
    }, [searchTerm, tableData, statusFilter]);

    const fetchProjectById = async (projectId) => {
        const resp = await fetch(`${hostnameAI}/canvas/project_list/?project_id=${encodeURIComponent(projectId)}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!resp.ok) throw new Error('Failed to fetch project');
        const data = await resp.json();
        const project = Array.isArray(data) ? data[0] : null;
        if (!project) throw new Error('Project not found');
        return project;
    };

    const handleRecentProjectClick = async (recent) => {
        const projectId = recent?.entity_id;
        if (!projectId) return;

        try {
            const project = await fetchProjectById(projectId);
            navigate(`/ai/hub/projects/${project.id}/library`, { state: { ProjectData: project } });

            await updateRecentAccess({
                row: project,
                entityType: 'project',
                hostnameAI,
                token,
                userId: decodedToken?.sub,
                setRecentList: setRecentProjects,
                setRecentLoading: setRecentProjectsLoading,
                limit: 2,
            });
        } catch (err) {
            alert(err?.message || 'Failed to open project');
        }
    };

    const LastAccessedCard = () => (
        <div className="bg-white rounded-xl px-5 py-4 border border-purple-200 shadow-sm flex flex-col h-full min-h-[110px]">
            <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-[#8e78b7]" />
                <span className="text-gray-700 text-sm font-medium">Last Accessed</span>
            </div>
            <div className="flex-1 flex flex-col justify-center">
                {(recentProjectsLoading || dashboardLoading) ? (
                    <div className="text-sm text-gray-500">Loading…</div>
                ) : recentProjectsError ? (
                    <div className="text-sm text-red-600">{recentProjectsError}</div>
                ) : recentProjects.length ? (
                    <div className="grid grid-cols-1 gap-2">
                        {recentProjects.map((project, idx) => {
                            const fullName = project.entity_name ?? '—';
                            return (
                                <button
                                    key={project.entity_id ?? idx}
                                    type="button"
                                    className="flex items-center gap-2 bg-gray-100 px-2 py-1.5 rounded-md min-w-0 text-left hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8e78b7]/40"
                                    onClick={() => handleRecentProjectClick(project)}
                                    title={fullName}
                                >
                                    <Target className="w-4 h-4 text-gray-500 shrink-0" />
                                    <span className="block min-w-0 flex-1 text-sm text-gray-700 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                                        {fullName}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-sm text-gray-500">No recent projects</div>
                )}
            </div>
        </div>
    );

    return (
        <div className="p-3 sm:p-4 lg:p-6 bg-gray-50 min-h-screen">
            <Breadcrumb />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">Projects</h1>
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* ADD: Status filter dropdown */}
                    <div className="relative">
                        <StatusFilterDropdown
                            selectedStatuses={statusFilter}
                            onStatusChange={setStatusFilter}
                            statusOptions={[
                                { value: 'active', label: 'Active' },
                                { value: 'archived', label: 'Archived' }
                            ]}
                        />
                    </div>
                    <div className="relative flex-1 sm:flex-initial">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search"
                            className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                            value={searchTerm}
                            onChange={handleSearchChange}
                        />
                    </div>
                    <button
                        className={`p-2 rounded-lg border ${viewMode === 'list' ? 'bg-gray-100 border-gray-500' : 'border-gray-300'} hover:bg-gray-50`}
                        onClick={() => setViewMode(viewMode === 'list' ? 'both' : 'list')}
                        title={viewMode === 'list' ? 'Show All Views' : 'Show List Only'}
                    >
                        {viewMode === 'list' ? <LayoutGrid className="w-5 h-5 text-gray-600" /> : <List className="w-5 h-5 text-gray-600" />}
                    </button>
                    <button
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        onClick={handleRefresh}
                        disabled={isLoading}
                    >
                        <RefreshCw className={`w-5 h-5 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        className="flex items-center gap-2 px-4 py-2 bg-[#8e78b7] text-white rounded-lg hover:bg-[#7d6aa3] transition-colors"
                        onClick={() => setIsCreateModalOpen(true)}
                        type="button"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="text-sm font-medium">Create Project</span>
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                {viewMode === 'both' && (
                    <div className="bg-gradient-to-r from-[#8e78b7] via-purple-300 to-purple-100 rounded-xl p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {statsCards.map((stat, index) => (
                                <StatsCardWithTrend
                                    key={index}
                                    label={stat.label}
                                    value={stat.value}
                                    icon={stat.icon}
                                    trend={stat.trend}
                                    trendValue={stat.trendValue}
                                />
                            ))}
                            <LastAccessedCard />
                        </div>
                    </div>
                )}

                <DataTable
                    columns={columns}
                    data={filteredData}
                    actions={actions}
                    isLoading={isLoading}
                    isError={!!error}
                    refetch={handleRefresh}
                    resetSortTrigger={refreshTrigger}
                />
            </div>

            <CreateProjectModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={() => {
                    setIsCreateModalOpen(false);
                    setRefreshTrigger((prev) => prev + 1); // refresh table + stats
                }}
            />
            <DeleteModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Project"
                description={`Are you sure you want to delete "${deleteTarget?.name || deleteTarget?.id || ''}"? This action cannot be undone.`}
                loading={deleteLoading}
                confirmText="Delete"
            />
            <ArchiveModal
                isOpen={archiveModalOpen}
                onClose={() => setArchiveModalOpen(false)}
                onConfirm={confirmArchive}
                title="Archive Project"
                description={`Are you sure you want to archive "${archiveTarget?.name || archiveTarget?.id || ''}"?`}
                loading={archiveLoading}
                confirmText="Archive"
            />
        </div>
    );
};

export default Projects;