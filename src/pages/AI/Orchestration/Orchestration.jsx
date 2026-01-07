import { FileText, Clock, RotateCcw, AlertTriangle, TrendingUp, Search, Plus } from 'lucide-react';
import { useState } from 'react';
import Breadcrumb from '../../../components/Breadcrumb';
import DataTable from '../../../components/DataTable';
import { useNavigate } from 'react-router-dom';


const Orchestration = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('Recent Activity');
    const navigate = useNavigate();

    const statsData = [
        {
            label: 'Active Schedules',
            value: '24',
            icon: FileText,
            subtitle: '4 running now',
            subtitleColor: 'text-gray-500'
        },
        {
            label: 'Intervention Needed',
            value: '3',
            icon: AlertTriangle,
            subtitle: 'Drift > threshold',
            subtitleColor: 'text-red-500'
        },
        {
            label: 'Average Runtime',
            value: '12m 40s',
            icon: Clock,
            subtitle: 'Optimized',
            subtitleColor: 'text-gray-500'
        },
        {
            label: 'Auto-Retrains',
            value: '8',
            icon: RotateCcw,
            subtitle: 'Last 7 days',
            subtitleColor: 'text-gray-500'
        },
        {
            label: 'Data Drift Alerts',
            value: '8',
            icon: TrendingUp,
            subtitle: 'Last 24 hours',
            subtitleColor: 'text-gray-500'
        },
        {
            label: 'Model Drift Alerts',
            value: '3',
            icon: AlertTriangle,
            subtitle: 'Critical',
            subtitleColor: 'text-red-500'
        },
    ];

    const recentActivities = [
        { text: 'Model Credit_Default_v3 ran successfully', icon: Clock },
        { text: 'Data drift detected on Income_Band', icon: AlertTriangle },
        { text: 'Run blocked for Fraud_XGB_v2', icon: AlertTriangle },
        { text: 'Owner approved override — model executed', icon: Clock },
        { text: 'Retrain scheduled for Retail_PD_LGBM', icon: RotateCcw },
        { text: 'Auto-retrain completed for Fraud_XGB_v2', icon: Clock },
        { text: 'Run blocked for Fraud_XGB_v2', icon: AlertTriangle },
    ];

    const schedulerData = [
        { sno: 1, model_name: 'Customer_Churn_v4', frequency: 'Daily at 09:00', last_drift_check: '0.02', drift_status: 'Safe', next_run: 'In 45 minutes', status: 'Running' },
        { sno: 2, model_name: 'Sales_Report_Q3', frequency: 'Weekly on Mondays at 10:00', last_drift_check: '0.20', drift_status: 'High', next_run: 'In 3 hours', status: 'Blocked' },
        { sno: 3, model_name: 'Inventory_Analysis', frequency: 'Monthly on the 1st of each month', last_drift_check: '0.02', drift_status: 'Safe', next_run: 'In 2 days', status: 'Waiting' },
        { sno: 4, model_name: 'User_Engagement_Stats', frequency: 'Daily at 08:30', last_drift_check: '0.02', drift_status: 'Safe', next_run: 'In 30 minutes', status: 'Waiting' },
        { sno: 5, model_name: 'Market_Research_Update', frequency: 'Bi-weekly on Wednesdays', last_drift_check: '0.20', drift_status: 'High', next_run: 'In 1 day', status: 'Blocked' },
        { sno: 6, model_name: 'Website_Traffic_Report', frequency: 'Daily at 11:00', last_drift_check: '0.02', drift_status: 'Safe', next_run: 'In 50 minutes', status: 'Running' },
    ];

    const interventionsData = [
        { model_name: 'Fraud_Detection_XGB', scheduled: 'Today | 14:00', drift_current: 0.45, drift_threshold: 0.30, status: 'Blocked' },
        { model_name: 'Fraud_Detection_XGB', scheduled: '24 Dec,25 | 14:00', drift_current: 0.70, drift_threshold: 0.30, status: 'Blocked' },
        { model_name: 'Fraud_Detection_XGB', scheduled: 'Today, 14:00', drift_current: 0.70, drift_threshold: 0.80, status: 'Blocked' },
    ];

    const tabs = ['Recent Activity', 'Scheduler', 'Interventions'];

    const renderLastDriftCheck = (row) => (
        <div className="flex items-center gap-2">
            <span className="text-gray-700">{row.last_drift_check}</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDriftStatusColor(row.drift_status)}`}>
                • {row.drift_status}
            </span>
        </div>
    );

    const renderStatus = (row) => (
        <span className={`px-3 py-1 rounded-md text-xs font-medium ${getStatusColor(row.status)}`}>
            {row.status}
        </span>
    );

    const StatCard = ({ label, value, icon: Icon, subtitle, subtitleColor }) => (
        <div className="bg-white rounded-lg px-4 py-3 border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
                <Icon className="w-5 h-5 text-[#8e78b7]" />
                <span className="text-gray-700 font-semibold text-md">{label}</span>
            </div>
            <div className="flex items-end justify-between">
                <span className="text-xl sm:text-2xl font-bold text-gray-800">{value}</span>
                {subtitle && (
                    <span className={`text-sm ${subtitleColor}`}>{subtitle}</span>
                )}
            </div>
        </div>
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'Running':
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {statsData.map((stat, index) => (
                            <StatCard key={index} {...stat} />
                        ))}
                    </div>
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
                            <DataTable
                                columns={[
                                    { key: 'sno', label: 'Sno', sortable: true, width: '80px' },
                                    { key: 'model_name', label: 'Model Name', sortable: true },
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

                        {activeTab === 'Interventions' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 my-6">
                                {interventionsData.map((intervention, index) => (
                                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between mb-3 gap-2">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">{intervention.model_name}</h3>
                                                <p className="text-xs sm:text-sm text-gray-500 mt-1">Scheduled: {intervention.scheduled}</p>
                                            </div>
                                            <span className="px-2 sm:px-3 py-1 bg-red-100 text-red-700 rounded-md text-xs font-medium whitespace-nowrap">
                                                {intervention.status}
                                            </span>
                                        </div>


                                        <div className="mb-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs sm:text-sm text-gray-600">Drift Score (PSI)</span>
                                                <span className="text-xs sm:text-sm font-medium text-gray-900">Current: {intervention.drift_current}</span>
                                            </div>

                                            <div className="relative">
                                                <div className="w-full bg-gray-200 rounded-full h-2 relative overflow-hidden">
                                                    <div
                                                        className={`absolute top-0 left-0 h-full rounded-full ${intervention.drift_current > intervention.drift_threshold
                                                            ? 'bg-red-400'
                                                            : 'bg-green-400'
                                                            }`}
                                                        style={{ width: `${Math.min((intervention.drift_current / 1) * 100, 100)}%` }}
                                                    ></div>
                                                </div>
                                                <div
                                                    className="absolute top-1/2 -translate-y-1/2 w-0.5 h-5 bg-gray-800"
                                                    style={{ left: `${(intervention.drift_threshold / 1) * 100}%` }}
                                                ></div>
                                            </div>

                                            <div className="flex justify-end mt-1">
                                                <span className="text-xs text-gray-500">Threshold: {intervention.drift_threshold}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <button className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                                                Force Run
                                            </button>
                                            <button className="flex-1 px-3 sm:px-4 py-2 bg-[#8e78b7] text-white rounded-lg hover:bg-[#7d6aa3] transition-colors text-sm font-medium">
                                                Retrain
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Orchestration;