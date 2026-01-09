import { Search, List, RefreshCw, CheckCircle, TrendingUp, TrendingDown, Target, BookOpenText, Trash2, Plus, LayoutGrid } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Breadcrumb from '../../../components/Breadcrumb';
import DataTable from '../../../components/DataTable';

const Projects = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [viewMode, setViewMode] = useState('both'); // 'both' or 'list'

    const statsCards = [
        { label: 'Projects', value: '17', trend: '2%', trendUp: true },
        { label: 'Projects', value: '39', trend: '2%', trendUp: true },
        { label: 'Projects', value: '67', trend: '2%', trendUp: true },
        { label: 'Notebooks', value: '5', trend: '2%', trendUp: false },
    ];

    const lastAccessed = [
        { id: 1, name: 'Project 1' },
        { id: 2, name: 'Project 2' },
    ];

    const projectsData = [
        {
            sno: 1,
            id: 'churn',
            name: 'Project - Churn',
            description: 'Churn',
            created_date: '01/10/2025',
            owner: 'Salah',
            status: 'Active'
        },
        {
            sno: 2,
            id: 'analysis',
            name: 'Project - Analysis',
            description: 'Churn',
            created_date: '01/10/2025',
            owner: 'Salah',
            status: 'Inactive'
        },
        {
            sno: 3,
            id: 'retention',
            name: 'Project - Retention',
            description: 'Retention',
            created_date: '15/11/2025',
            owner: 'Mekong',
            status: 'Active'
        },
        {
            sno: 4,
            id: 'acquisition',
            name: 'Project - Acquisition',
            description: 'Acquisition',
            created_date: '01/12/2025',
            owner: 'Amazon',
            status: 'Active'
        },
        {
            sno: 5,
            id: 'engagement',
            name: 'Project - Engagement',
            description: 'Engagement',
            created_date: '20/12/2025',
            owner: 'Nile',
            status: 'Inactive'
        },
        {
            sno: 6,
            id: 'onboarding',
            name: 'Project - Onboarding',
            description: 'Onboarding',
            created_date: '05/01/2026',
            owner: 'Yangtze',
            status: 'Active'
        },
        {
            sno: 7,
            id: 'feedback',
            name: 'Project - Feedback',
            description: 'Feedback',
            created_date: '30/01/2026',
            owner: 'Danube',
            status: 'Active'
        },
        {
            sno: 8,
            id: 'analysis-2',
            name: 'Project - Analysis',
            description: 'Analysis',
            created_date: '15/02/2026',
            owner: 'Thames',
            status: 'Inactive'
        },
        {
            sno: 9,
            id: 'strategy',
            name: 'Project - Strategy',
            description: 'Strategy',
            created_date: '01/03/2026',
            owner: 'Seine',
            status: 'Active'
        },
        {
            sno: 10,
            id: 'optimization',
            name: 'Project - Optimization',
            description: 'Optimization',
            created_date: '15/03/2026',
            owner: 'Mississippi',
            status: 'Active'
        }
    ];

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleRefresh = () => {
        setIsLoading(true);
        setRefreshTrigger(prev => prev + 1);
        setTimeout(() => setIsLoading(false), 1000);
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Active':
                return 'bg-green-100 text-green-700';
            case 'Inactive':
                return 'bg-red-100 text-red-600';
            default:
                return 'bg-gray-100 text-gray-600';
        }
    };

    const handleProjectLibrary = (row) => {
        navigate(`/ai/hub/projects/${row.id}/library`, { state: { ProjectData: row } });
    };

    const handleDelete = (row) => {
        console.log('Delete:', row);
    };

    const columns = [
        { key: 'sno', label: 'Sno', sortable: true, width: '90px' },
        {
            key: 'name',
            label: 'Name',
            sortable: true,
            render: (row) => <span className="text-[#8e78b7] hover:underline cursor-pointer">{row.name}</span>,
        },
        { key: 'description', label: 'Description', sortable: true },
        { key: 'created_date', label: 'Created Date', sortable: true },
        { key: 'owner', label: 'Owner', sortable: true },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (row) => (
                <span className={`px-3 py-1 rounded-md text-xs font-medium ${getStatusStyle(row.status)}`}>
                    {row.status}
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
            label: 'Delete',
            icon: <Trash2 className="w-4 h-4" />,
            onClick: handleDelete,
            tooltip: 'Delete',
        },
    ];

    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) return projectsData;
        const q = searchTerm.toLowerCase();
        return projectsData.filter((row) =>
            Object.values(row || {}).some((val) =>
                String(val ?? '').toLowerCase().includes(q)
            )
        );
    }, [searchTerm]);

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
                <div className={`flex items-center gap-1 ${trendUp ? 'text-green-500' : 'text-red-500'}`}>
                    {trendUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span className="text-sm font-medium">{trend}</span>
                </div>
            </div>
        </div>
    );

    const LastAccessedCard = () => (
        <div className="bg-white rounded-lg p-4 border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-[#8e78b7]" />
                <span className="text-gray-600 text-sm">Last Accessed</span>
            </div>
            <div className="flex items-center gap-2">
                {lastAccessed.map((project) => (
                    <div key={project.id} className="flex items-center gap-2 bg-gray-100 px-2 py-1.5 rounded-md">
                        <Target className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700">{project.name}</span>
                    </div>
                ))}
            </div>
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
                        className={`p-2 rounded-lg border ${viewMode === 'list' ? 'bg-gray-100 border-gray-500' : 'border-gray-300'
                            } hover:bg-gray-50`}
                        onClick={() => setViewMode(viewMode === 'list' ? 'both' : 'list')}
                        title={viewMode === 'list' ? 'Show All Views' : 'Show List Only'}
                    >
                        {viewMode === 'list' ? (
                            <LayoutGrid className="w-5 h-5 text-gray-600" />
                        ) : (
                            <List className="w-5 h-5 text-gray-600" />
                        )}
                    </button>
                    <button
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        onClick={handleRefresh}
                        disabled={isLoading}
                    >
                        <RefreshCw className={`w-5 h-5 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        className="flex items-center gap-2 px-4 py-2 bg-[#8e78b7] text-white rounded-lg hover:bg-[#7d6aa3] transition-colors">
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
                    isError={false}
                    refetch={handleRefresh}
                    resetSortTrigger={refreshTrigger}
                />
            </div>
        </div>
    );
};

export default Projects;