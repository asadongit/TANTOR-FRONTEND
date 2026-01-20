import { FileText, Clock, AlertTriangle, TrendingUp, Search, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import Breadcrumb from '../../../components/Breadcrumb';
import DataTable from '../../../components/DataTable';
import { useNavigate } from 'react-router-dom';
import { useAIPlayground } from '../../../context/AIPlaygroundContext';
import { useAuth } from '../../../context/AuthContext';
import InterventionsTab from '../Orchestration/Tabs/InterventionsTab';

const Orchestration = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('Recent Activity');
    const [summaryData, setSummaryData] = useState(null);
    const [schedulerData, setSchedulerData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [schedulerLoading, setSchedulerLoading] = useState(false);
    const navigate = useNavigate();
    const hostnameAI = window._env_?.VITE_AI_API;
    const { token, decodedToken } = useAuth();
    const { schedulerState, setSchedulerState } = useAIPlayground();

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
                last_drift_check: '-',
                next_run: item.next_run || '-',
                status: item.status || '-'
            }));

            setSchedulerData(transformedData);
            setSchedulerLoading(false);
        } catch (error) {
            console.error('Error fetching scheduler data:', error);
            setSchedulerLoading(false);
        }
    };

    const formatRuntime = (milliseconds) => {
        if (!milliseconds) return 'N/A';
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
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
            value: formatRuntime(summaryData.avg_prediction_runtime_ms),
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

    const recentActivities = [
        { text: 'Model Credit_Default_v3 ran successfully', icon: Clock },
        { text: 'Data drift detected on Income_Band', icon: AlertTriangle },
        { text: 'Run blocked for Fraud_XGB_v2', icon: AlertTriangle },
        { text: 'Owner approved override — model executed', icon: Clock },
        { text: 'Retrain scheduled for Retail_PD_LGBM', icon: Clock },
        { text: 'Auto-retrain completed for Fraud_XGB_v2', icon: Clock },
        { text: 'Run blocked for Fraud_XGB_v2', icon: AlertTriangle },
    ];

    const tabs = ['Recent Activity', 'Scheduler', 'Interventions'];

    const renderLastDriftCheck = (row) => {
        if (row.last_drift_check === '-' || row.drift_status === '-') {
            return <span className="text-gray-500">-</span>;
        }
        return (
            <div className="flex items-center gap-2">
                <span className="text-gray-700">{row.last_drift_check}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDriftStatusColor(row.drift_status)}`}>
                    • {row.drift_status}
                </span>
            </div>
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
            case 'Active':
                return 'bg-green-100 text-green-700';
            case 'Blocked':
                return 'bg-red-100 text-red-700';
            case 'Waiting':
                return 'bg-gray-100 text-gray-700';
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

    return (
        <div className="p-3 sm:p-4 lg:p-6 bg-gray-50 min-h-screen">
            <Breadcrumb />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">Orchestration</h1>
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="relative flex-1 sm:flex-initial">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                    </div>
                    <button
                        onClick={() => navigate('/ai/orchestration/new')}
                        className="flex items-center gap-2 px-4 py-2 bg-[#8e78b7] text-white rounded-lg hover:bg-[#7d6aa3] transition-colors">
                        <Plus className="w-4 h-4" />
                        <span className="text-sm font-medium">New Schedule</span>
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-gradient-to-r from-[#8e78b7] via-purple-300 to-purple-100 rounded-xl p-4">
                    {loading ? (
                        <div className="text-center py-8 text-white">Loading...</div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                            {statsData.map((stat, index) => (
                                <StatCard key={index} {...stat} />
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="border-b border-gray-200">
                        <div className="flex gap-5 pt-2 pb-0 pl-5">
                            {tabs.map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors relative ${activeTab === tab
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
                                {recentActivities.map((activity, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-3 py-3 px-3 hover:bg-gray-50 rounded-lg transition-colors"
                                    >
                                        <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                        <span className="text-sm text-gray-700">{activity.text}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'Scheduler' && (
                            <>
                                {schedulerLoading ? (
                                    <div className="text-center py-8 text-gray-500">Loading...</div>
                                ) : schedulerData.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">No data present</div>
                                ) : (
                                    <DataTable
                                        columns={[
                                            { key: 'sno', label: 'Sno', sortable: true, width: '80px' },
                                            { key: 'schedule_name', label: 'Schedule Name', sortable: true },
                                            { key: 'frequency', label: 'Frequency', sortable: true },
                                            {
                                                key: 'last_drift_check',
                                                label: 'Last Drift Check',
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
                                        ]}
                                        data={schedulerData}
                                        actions={[]}
                                        isLoading={false}
                                        isError={false}
                                    />
                                )}
                            </>
                        )}

                        {activeTab === 'Interventions' && (
                            <InterventionsTab/>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Orchestration;