import { Search, List, RefreshCw, CheckCircle, TrendingUp, TrendingDown, Target, BookOpenText, Trash2, Plus, LayoutGrid } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Breadcrumb from '../../../components/Breadcrumb';
import DataTable from '../../../components/DataTable';
import { useAuth } from '../../../context/AuthContext';
import { CreateProjectModal } from '../AIPlayground/modals/Dashboard/CreateProjectModal';
import DeleteModal from './Components/DeleteModal';
import { updateRecentAccess } from './Components/Hooks';

const Projects = () => {
    const navigate = useNavigate();
    const { token, decodedToken } = useAuth();
    const hostnameAI = window._env_?.VITE_AI_API;

    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [viewMode, setViewMode] = useState('both');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    const [tableData, setTableData] = useState([]);
    const [error, setError] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const [dashboardData, setDashboardData] = useState(null);
    const [dashboardLoading, setDashboardLoading] = useState(false);
    const [dashboardError, setDashboardError] = useState(null);

    // New state for recent projects
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
    }, [hostnameAI, token, decodedToken?.sub]);

    // Fetch recent projects from new API
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
                // Expecting { user_id, recent_entities: [...] }
                setRecentProjects(Array.isArray(data?.recent_entities) ? data.recent_entities : []);
            } catch (err) {
                setRecentProjectsError(err?.message || 'Failed to fetch recent projects');
            } finally {
                setRecentProjectsLoading(false);
            }
        };
        fetchRecentProjects();
    }, [hostnameAI, token, decodedToken?.sub, refreshTrigger]);

    const statsCards = useMemo(() => {
        if (!dashboardData?.counts) {
            return [
                { label: 'Projects', value: '—', trend: '', trendUp: true },
                { label: 'Models', value: '—', trend: '', trendUp: true },
                { label: 'Datasets', value: '—', trend: '', trendUp: true },
                { label: 'Change (1week)', value: '—', trend: '', trendUp: true },
            ];
        }

        const counts = dashboardData.counts;
        const trendUp = (t) => t === 'increased';

        return [
            {
                label: 'Projects',
                value: String(counts.projects?.current ?? 0),
                trend: `${counts.projects?.percentage_change ?? 0}%`,
                trendUp: trendUp(counts.projects?.trend),
            },
            {
                label: 'Models',
                value: String(counts.models?.current ?? 0),
                trend: `${counts.models?.percentage_change ?? 0}%`,
                trendUp: trendUp(counts.models?.trend),
            },
            {
                label: 'Datasets',
                value: String(counts.datasets?.current ?? 0),
                trend: `${counts.datasets?.percentage_change ?? 0}%`,
                trendUp: trendUp(counts.datasets?.trend),
            },
            {
                label: 'Snapshot',
                value: dashboardData.snapshot_info?.snapshot_date
                    ? new Date(dashboardData.snapshot_info.snapshot_date).toLocaleDateString('en-GB')
                    : '—',
                trend: dashboardData.snapshot_info?.snapshot_created_at
                    ? `Updated ${new Date(dashboardData.snapshot_info.snapshot_created_at).toLocaleDateString('en-GB')}`
                    : '',
                trendUp: true,
            },
        ];
    }, [dashboardData]);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleRefresh = () => {
        setIsLoading(true);
        setRefreshTrigger((prev) => prev + 1);
        setTimeout(() => setIsLoading(false), 1000);
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

    const columns = [
        {
            key: 'name',
            label: 'Name',
            sortable: true,
            render: (row) => (
                <span
                    className="text-[#8e78b7] hover:underline cursor-pointer"
                    onClick={() => handleProjectLibrary(row)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleProjectLibrary(row)}
                >
                    {row.name}
                </span>
            ),
        },
        { key: 'description', label: 'Description', sortable: true },
        { key: 'owner_name', label: 'Owner', sortable: true, render: (row) => row.owner_name ?? '—' },
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
        { key: 'created_at', label: 'Created', sortable: true, render: (row) => row.created_at ? new Date(row.created_at).toLocaleDateString('en-GB') : '—' },
        { key: 'updated_at', label: 'Updated', sortable: true, render: (row) => row.updated_at ? new Date(row.updated_at).toLocaleDateString('en-GB') : '—' },
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
            label: 'Delete',
            icon: <Trash2 className="w-4 h-4" />,
            onClick: handleDelete,
            tooltip: 'Delete',
        },
    ];

    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) {
            return tableData.filter(row => String(row.status).toLowerCase() !== "deleted");
        }
        const q = searchTerm.toLowerCase();
        return tableData
            .filter(row => String(row.status).toLowerCase() !== "deleted")
            .filter((row) =>
                Object.values(row || {}).some((val) => String(val ?? '').toLowerCase().includes(q))
            );
    }, [searchTerm, tableData]);

    const StatCard = ({ label, value, trend, trendUp }) => (
        <div className="bg-white rounded-lg p-4 border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-[#8e78b7]" />
                    <span className="text-gray-600 text-sm">{label}</span>
                </div>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-gray-800">{value}</span>
                {!!trend && (
                    <div className={`flex items-center gap-1 ${trendUp ? 'text-green-500' : 'text-red-500'}`}>
                        {trendUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        <span className="text-sm font-medium">{trend}</span>
                    </div>
                )}
            </div>
        </div>
    );

    const LastAccessedCard = () => (
        <div className="bg-white rounded-lg p-4 border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-[#8e78b7]" />
                <span className="text-gray-600 text-sm">Recent Projects</span>
            </div>
            {recentProjectsLoading ? (
                <div className="text-sm text-gray-500">Loading…</div>
            ) : recentProjectsError ? (
                <div className="text-sm text-red-600">{recentProjectsError}</div>
            ) : recentProjects.length ? (
                <div className="flex flex-col gap-2">
                    {recentProjects.map((project, idx) => (
                        <div key={project.entity_id ?? idx} className="flex items-center gap-3 bg-gray-100 px-2 py-1.5 rounded-md">
                            <Target className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-700 font-medium">{project.entity_name ?? '—'}</span>
                            <span className="text-xs text-gray-500">
                                {project.accessed_at ? new Date(project.accessed_at).toLocaleString('en-GB') : ''}
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-sm text-gray-500">No recent projects</div>
            )}
        </div>
    );

    return (
        <div className="p-3 sm:p-4 lg:p-6 bg-gray-50 min-h-screen">
            <Breadcrumb />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">Projects</h1>
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="relative flex-1 sm:flex-initial">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search database"
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                            {statsCards.map((stat, index) => (
                                <StatCard key={index} {...stat} />
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
        </div>
    );
};

export default Projects;