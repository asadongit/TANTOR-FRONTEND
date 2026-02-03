import { FileText, Clock, AlertTriangle, TrendingUp, Search, Plus, RefreshCw, MoreVertical, Edit, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';
import Breadcrumb from '../../../components/Breadcrumb';
import DataTable from '../../../components/DataTable';
import { useNavigate } from 'react-router-dom';
import { useAIPlayground } from '../../../context/AIPlaygroundContext';
import { useAuth } from '../../../context/AuthContext';
import InterventionsTab from '../Orchestration/Tabs/InterventionsTab';
import toast from 'react-hot-toast';
import ScheduleDetailsModal from './modals/ScheduleDetailsModal';

const Orchestration = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [schedulerSearchTerm, setSchedulerSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('Recent Activity');
    const [summaryData, setSummaryData] = useState(null);
    const [schedulerData, setSchedulerData] = useState([]);
    const [recentActivityData, setRecentActivityData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [schedulerLoading, setSchedulerLoading] = useState(false);
    const [activityLoading, setActivityLoading] = useState(false);
    const [refreshLoading, setRefreshLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const navigate = useNavigate();
    const hostnameAI = window._env_?.VITE_AI_API;
    const { token, decodedToken } = useAuth();
    const { setSchedulerState, setMode } = useAIPlayground();

    useEffect(() => {
        setMode('write')
    }, []);

    useEffect(() => {
        const fetchUserId = async () => {
            const username = decodedToken?.preferred_username;

            if (!username) {
                console.error('Username not found in decoded token');
                return;
            }

            try {
                const response = await fetch(
                    `${hostnameAI}/users/users/get-id?username=${username}`,
                    {
                        method: 'GET',
                        headers: {
                            'accept': 'application/json'
                        }
                    }
                );

                if (!response.ok) {
                    throw new Error('Failed to fetch user ID');
                }

                const data = await response.json();

                setSchedulerState(prevState => ({
                    ...prevState,
                    owner_id: data.user_id
                }));
            } catch (error) {
                console.error('Error fetching user ID:', error);
            }
        };

        fetchUserId();
    }, [decodedToken?.preferred_username]);

    useEffect(() => {
        fetchSummaryData();
    }, []);

    useEffect(() => {
        if (activeTab === 'Scheduler') {
            fetchSchedulerData();
        } else if (activeTab === 'Recent Activity') {
            fetchRecentActivity();
        }
    }, [activeTab]);

    const fetchSummaryData = async () => {
        try {
            const response = await fetch(`${hostnameAI}/orchestration/schedules/dashboard/summary`);
            const data = await response.json();
            setSummaryData(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching summary data:', error);
            setLoading(false);
        }
    };

    const fetchSchedulerData = async () => {
        setSchedulerLoading(true);
        try {
            const response = await fetch(`${hostnameAI}/orchestration/schedules/summary`);
            const data = await response.json();

            const transformedData = data.map((item, index) => ({
                sno: index + 1,
                id: item.schedule_id,
                schedule_name: item.name || '-',
                frequency: item.frequency || '-',
                last_drift_check: item.last_drift_check || null,
                next_run: item.next_run || '-',
                status: item.status || '-',
                project_name: item.project_name || null,
                model_name: item.model_name || null,
                data_drift_check: item.data_drift_check || 0,
                model_drift_check: item.model_drift_check || 0,
                created_by: item.created_by || null
            }));

            setSchedulerData(transformedData);
            setSchedulerLoading(false);
        } catch (error) {
            console.error('Error fetching scheduler data:', error);
            setSchedulerLoading(false);
        }
    };

    const fetchRecentActivity = async () => {
        setActivityLoading(true);
        try {
            const response = await fetch(`${hostnameAI}/orchestration/airflow/dags/recent?limit=10`);
            const data = await response.json();

            const transformedActivities = data.dags.map((dag) => ({
                message: dag.message,
                status: dag.status,
                run_time: dag.run_time,
                dag_name: dag.dag_name
            }));

            setRecentActivityData(transformedActivities);
            setActivityLoading(false);
        } catch (error) {
            console.error('Error fetching recent activity:', error);
            setActivityLoading(false);
        }
    };

    const formatRuntime = (runtimeData) => {
        if (!runtimeData) return 'N/A';

        const formatted = runtimeData.formatted;
        if (!formatted) return 'N/A';

        const parts = [];
        if (formatted.hours > 0) {
            parts.push(`${formatted.hours}h`);
        }
        if (formatted.minutes > 0) {
            parts.push(`${formatted.minutes}m`);
        }
        if (formatted.seconds > 0 || parts.length === 0) {
            parts.push(`${formatted.seconds}s`);
        }

        return parts.join(' ');
    };

    const getActivityIcon = (status) => {
        switch (status) {
            case 'Prediction Successful':
                return Clock;
            case 'Model Drift Detected':
            case 'Data Drift Detected':
                return AlertTriangle;
            default:
                return Clock;
        }
    };

    const getActivityIconColor = (status) => {
        switch (status) {
            case 'Prediction Successful':
                return 'text-green-500';
            case 'Model Drift Detected':
            case 'Data Drift Detected':
                return 'text-amber-500';
            default:
                return 'text-gray-400';
        }
    };

    const statsData = summaryData ? [
        {
            label: 'Active Schedules',
            value: summaryData.active_schedules_count.toString(),
            icon: FileText,
        },
        {
            label: 'Intervention Needed',
            value: summaryData.intervention_needed_count.toString(),
            icon: AlertTriangle,
        },
        {
            label: 'Average Runtime',
            value: formatRuntime(summaryData.avg_prediction_runtime),
            icon: Clock,
        },
        {
            label: 'Data Drift Alerts',
            value: summaryData.alert_counts.data_drift.toString(),
            icon: TrendingUp,
        },
        {
            label: 'Model Drift Alerts',
            value: summaryData.alert_counts.model_drift.toString(),
            icon: AlertTriangle,
        },
    ] : [];

    const tabs = ['Recent Activity', 'Scheduler', 'Interventions'];

    const filteredSchedulerData = schedulerData.filter(item => {
        const searchLower = schedulerSearchTerm.toLowerCase();
        return (
            item.schedule_name.toLowerCase().includes(searchLower) ||
            item.frequency.toLowerCase().includes(searchLower) ||
            item.next_run.toLowerCase().includes(searchLower) ||
            item.status.toLowerCase().includes(searchLower) ||
            item.sno.toString().includes(searchLower)
        );
    });

    const handleRefresh = async () => {
        setRefreshLoading(true);
        setActiveTab('Recent Activity');

        try {
            await fetchSummaryData();
            await fetchRecentActivity();
            toast.success('Refreshed Successfully', {
                duration: 4000,
                position: 'top-right',
            });
        } catch (error) {
            console.error('Error refreshing data:', error);
            toast.error('Failed to refresh data', {
                duration: 4000,
                position: 'top-right',
            });
        } finally {
            setRefreshLoading(false);
        }
    };

    const renderLastDriftCheck = (row) => {
        if (row.last_drift_check === null || row.last_drift_check === undefined) {
            return <span className="text-gray-500">-</span>;
        }

        const status = row.last_drift_check;
        let statusColor = '';
        let displayText = status;

        switch (status) {
            case 'Prediction Successful':
                statusColor = 'bg-green-100 text-green-700';
                break;
            case 'Data Drift Detected':
            case 'Model Drift Detected':
                statusColor = 'bg-red-100 text-red-700';
                break;
            default:
                statusColor = 'bg-gray-100 text-gray-700';
        }

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                {displayText}
            </span>
        );
    };

    const renderStatus = (row) => (
        <span className={`px-3 py-1 rounded-md text-xs font-medium ${getStatusColor(row.status)}`}>
            {row.status}
        </span>
    );

    const StatCard = ({ label, value, icon: Icon }) => (
        <div className="bg-white rounded-lg px-4 py-3 border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
                <Icon className="w-5 h-5 text-[#8e78b7]" />
                <span className="text-gray-700 font-semibold text-md">{label}</span>
            </div>
            <div className="pl-8">
                <span className="text-xl sm:text-2xl font-bold text-gray-800">{value}</span>
            </div>
        </div>
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'Running':
            case 'active':
                return 'bg-green-100 text-green-700';
            case 'Blocked':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const getDriftStatusColor = (status) => {
        switch (status) {
            case 'Safe':
                return 'bg-green-100 text-green-700';
            case 'High':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const handleNavigate = () => {
        setSchedulerState({
            owner_id: '',
            project: '',
            model: '',
            model_id: '',
            project_id: '',
            flow_type: 'single_run',
            scheduler: {
                mode: 'auto',
                frequency: '',
                runningDays: [],
                endDateTime: '',
                intervalType: 'single_run',
                intervalValue: '',
                startDateTime: '',
            },
            source: {
                source_conn_type: '',
                source_schema: '',
                source_table: ''
            },
            target: {
                destination_conn_type: '',
                destination_schema: '',
                destination_table: ''
            },
            data_drift_threshold: {
                distribution_drift_threshold: 0,
                statistical_significance_level: 0,
                information_stability_threshold: 0,
                target_stability_threshold: 0
            },
            model_drift_threshold: {
                prediction_drift_threshold: 0,
                performance_drift_threshold: 0
            },
            data_drift_check: 0,
            model_drift_check: 0,
            recipients: [],
            created_by: '',
            workflow_name: ''
        })
        navigate('/ai/orchestration/new')

    }

    const handleEdit = (row) => {
        console.log("Edit schedule:", row);
    };

    const handleDetails = (row) => {        
        const validStatuses = ['Prediction Successful', 'Model Drift Detected', 'Data Drift Detected'];
        
        if (!row.last_drift_check || !validStatuses.includes(row.last_drift_check)) {
            toast.error('Last run check value is not supported', {
                duration: 4000,
                position: 'top-right',
            });
            return;
        }

        setSelectedSchedule(row);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setTimeout(() => {
            setSelectedSchedule(null);
        }, 300);
    };

    const actions = [
        {
            label: "Edit",
            icon: <Edit className="w-4 h-4" />,
            onClick: handleEdit,
            tooltip: "Edit Schedule",
        },
        {
            label: "Details",
            icon: <Eye className="w-4 h-4" />,
            onClick: handleDetails,
            tooltip: "View Details",
        },
    ];

    return (
        <div className="p-3 sm:p-4 lg:p-6 bg-gray-50 min-h-screen">
            <Breadcrumb />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">Orchestration</h1>
                <div className="flex items-center gap-2 sm:gap-3">
                    <button
                        onClick={handleRefresh}
                        disabled={refreshLoading}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        <RefreshCw className={`w-4 h-4 ${refreshLoading ? 'animate-spin' : ''}`} />
                        <span className="text-sm font-medium">Refresh</span>
                    </button>
                    <button
                        onClick={handleNavigate}
                        className="flex items-center gap-2 px-4 py-2 bg-[#8e78b7] text-white rounded-lg hover:bg-[#7d6aa3] transition-colors">
                        <Plus className="w-4 h-4" />
                        <span className="text-sm font-medium">New Schedule</span>
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                {loading ? (
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                            {[1, 2, 3, 4, 5].map((_, index) => (
                                <div key={index} className="bg-gray-100 rounded-lg px-4 py-3 border border-gray-200 animate-pulse">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-5 h-5 bg-gray-300 rounded"></div>
                                        <div className="h-4 bg-gray-300 rounded w-24"></div>
                                    </div>
                                    <div className="pl-8">
                                        <div className="h-8 bg-gray-300 rounded w-16"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="bg-gradient-to-r from-[#8e78b7] via-purple-300 to-purple-100 rounded-xl p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                            {statsData.map((stat, index) => (
                                <StatCard key={index} {...stat} />
                            ))}
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="border-b border-gray-200">
                        <div className="flex gap-5 pt-2 pb-0 pl-5">
                            {tabs.map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2 text-md font-medium rounded-lg transition-colors relative ${activeTab === tab
                                        ? 'text-[#8e78b7] bg-purple-50'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                >
                                    {tab}
                                    {activeTab === tab && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#8e78b7] rounded-t"></div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="px-4 py-1">
                        {activeTab === 'Recent Activity' && (
                            <div className="space-y-1">
                                {activityLoading ? (
                                    <div className="text-center py-8 text-gray-500">Loading...</div>
                                ) : recentActivityData.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">No recent activity</div>
                                ) : (
                                    recentActivityData.map((activity, index) => {
                                        const ActivityIcon = getActivityIcon(activity.status);
                                        const iconColor = getActivityIconColor(activity.status);

                                        return (
                                            <div
                                                key={index}
                                                className="flex items-start gap-3 py-2 px-3 hover:bg-gray-50 rounded-lg transition-colors group"
                                            >
                                                <div className={`mt-1 ${iconColor}`}>
                                                    <ActivityIcon className="w-4 h-4 flex-shrink-0" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-md text-gray-700 leading-relaxed">
                                                        {activity.message}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}

                        {activeTab === 'Scheduler' && (
                            <>
                                <div className="flex justify-end pt-2">
                                    <div className="relative w-full sm:w-80">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search..."
                                            value={schedulerSearchTerm}
                                            onChange={(e) => setSchedulerSearchTerm(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                {schedulerLoading ? (
                                    <div className="text-center py-8 text-gray-500">Loading...</div>
                                ) : filteredSchedulerData.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        {schedulerSearchTerm ? 'No schedules found matching your search' : 'No data present'}
                                    </div>
                                ) : (
                                    <DataTable
                                        columns={[
                                            { key: 'sno', label: 'Sno', sortable: true, width: '80px' },
                                            { key: 'schedule_name', label: 'Schedule Name', sortable: true },
                                            { key: 'frequency', label: 'Frequency', sortable: true },
                                            {
                                                key: 'last_drift_check',
                                                label: 'Last Run Check',
                                                sortable: true,
                                                render: renderLastDriftCheck
                                            },
                                            { key: 'next_run', label: 'Next Run', sortable: true },
                                            {
                                                key: 'status',
                                                label: 'Status',
                                                sortable: true,
                                                render: renderStatus
                                            },
                                            { label: 'Action', sortable: false, width: '100px' },
                                        ]}
                                        data={filteredSchedulerData}
                                        actions={actions}
                                        isLoading={false}
                                        isError={false}
                                    />
                                )}
                            </>
                        )}

                        {activeTab === 'Interventions' && (
                            <InterventionsTab />
                        )}
                    </div>
                </div>
            </div>

            <ScheduleDetailsModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                scheduleData={selectedSchedule}
            />
        </div>
    );
};

export default Orchestration;