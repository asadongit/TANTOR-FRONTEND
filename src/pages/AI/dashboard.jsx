import { FileText, Database, FolderKanban, Box, Bot, Scale, Lightbulb, ChevronRight, ArrowUp, ArrowDown, Info, Activity, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAIPlayground } from '../../context/AIPlaygroundContext';
import { useAuth } from '../../context/AuthContext';
import { aithemestyle } from '../../components/themeContext';
import popularUseCaseUrl from '../../assets/ai/popularusecase.svg?url';
import performaceIconUrl from '../../assets/ai/performaceicon.svg?url';


const Dashboard = () => {
  const navigate = useNavigate();
  const { setMode } = useAIPlayground();
  const { token, decodedToken } = useAuth();
  const hostnameAI = window._env_?.VITE_AI_API;

  const [modelLifecycleData, setModelLifecycleData] = useState([]);
  const [recentActivityData, setRecentActivityData] = useState([]);
  const [summaryData, setSummaryData] = useState({});

  const getColorForStatus = (status) => {
    switch (status) {
      case 'Deployed': return aithemestyle.modelLifecycleColors.deployed;
      case 'Saved': return aithemestyle.modelLifecycleColors.saved;
      case 'Archived': return aithemestyle.modelLifecycleColors.archived;
      default: return '#6B7280';
    }
  };

  const truncateName = (name, maxLength = 30) => {
    return name.length > maxLength ? name.substring(0, maxLength) + '...' : name;
  };

  const formatPct = (n) => {
    const num = Number(n);
    if (!Number.isFinite(num)) return "0%";
    const rounded = Math.abs(num) >= 10 ? Math.round(num) : Math.round(num * 10) / 10;
    return `${rounded}%`;
  };

  useEffect(() => {
    setMode('write');
  }, []);

  useEffect(() => {
    const fetchLifecycle = async () => {
      try {
        const response = await fetch(`${hostnameAI}/canvas/models/lifecycle`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();
        const transformedData = Object.entries(data.model_status_counts).map(([status, { count, percentage }]) => ({
          name: status,
          value: count,
          percentage: percentage,
          color: getColorForStatus(status)
        }));
        setModelLifecycleData(transformedData);
      } catch (error) {
        console.error('Error fetching model lifecycle:', error);
      }
    };
    fetchLifecycle();
  }, [hostnameAI, token]);

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        const response = await fetch(`${hostnameAI}/canvas/recent-access`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();
        const transformedData = data.map(item => ({
          name: item.name,
          status: item.status,
          entity_type: item.entity_type,
          entity_id: item.entity_id
        }));
        setRecentActivityData(transformedData);
      } catch (error) {
        console.error('Error fetching recent activity:', error);
      }
    };
    fetchRecentActivity();
  }, [hostnameAI, token]);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await fetch(`${hostnameAI}/canvas/summary`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();
        setSummaryData(data);
      } catch (error) {
        console.error('Error fetching summary:', error);
      }
    };
    fetchSummary();
  }, [hostnameAI, token]);

  const statsData = [
    { label: 'Sources', value: summaryData.counts?.sources?.current || '0', icon: FileText, trend: summaryData.counts?.sources?.trend === 'increased' ? 'up' : summaryData.counts?.sources?.trend === 'decreased' ? 'down' : null, trendValue: summaryData.counts?.sources?.percentage_change },
    { label: 'Size (GB)', value: summaryData.metrics?.total_dataset_size_gb?.current?.toFixed(2) || '0', icon: Database, trend: summaryData.metrics?.total_dataset_size_gb?.trend === 'increased' ? 'up' : summaryData.metrics?.total_dataset_size_gb?.trend === 'decreased' ? 'down' : null, trendValue: summaryData.metrics?.total_dataset_size_gb?.percentage_change },
    { label: 'Projects', value: summaryData.counts?.projects?.current || '0', icon: FolderKanban, trend: summaryData.counts?.projects?.trend === 'increased' ? 'up' : summaryData.counts?.projects?.trend === 'decreased' ? 'down' : null, trendValue: summaryData.counts?.projects?.percentage_change, onClick: () => navigate('/ai/hub/projects') },
    { label: 'Models', value: summaryData.counts?.models?.current || '0', icon: Box, trend: summaryData.counts?.models?.trend === 'increased' ? 'up' : summaryData.counts?.models?.trend === 'decreased' ? 'down' : null, trendValue: summaryData.counts?.models?.percentage_change, onClick: () => navigate('/ai/hub/models') },
    { label: 'Datasets', value: summaryData.counts?.datasets?.current || '0', icon: Bot, trend: summaryData.counts?.datasets?.trend === 'increased' ? 'up' : summaryData.counts?.datasets?.trend === 'decreased' ? 'down' : null, trendValue: summaryData.counts?.datasets?.percentage_change, onClick: () => navigate('/ai/hub/data') },
    { label: 'Fairness', value: summaryData.metrics?.avg_fairness_ratio?.current?.toFixed(2) || '0', icon: Scale, trend: null, trendValue: null },
  ];

  const tokenUsageData = [
    { month: 'Jan', usage: 0.5 },
    { month: 'Feb', usage: 1.2 },
    { month: 'Mar', usage: 1.8 },
    { month: 'Apr', usage: 2.5 },
    { month: 'May', usage: 2.9 },
    { month: 'Jun', usage: 3.5 },
    { month: 'Jul', usage: 3.9 },
  ];

  const driftAlerts = summaryData.recent_drift_alerts?.map(alert => ({
    name: truncateName(alert.model_name),
    type: alert.alert_type,
    model_id: alert.model_id,
    model_name: alert.model_name,
    severity: alert.severity
  })) || [];

  const popularUseCases = [
    { name: 'UC_Churn' },
    { name: 'UC_Acquisition' },
    { name: 'UC_Retention' },
    { name: 'UC_Engagement' },
  ];

  const topAgents = [
    { name: 'PII Agents', description: 'lorem ipsum', rating: 4.5 },
    { name: 'Data Analysts', description: 'analyzing data trends', rating: 4.2 },
    { name: 'System Administrators', description: 'managing IT infrastructure', rating: 4.7 },
    { name: 'Cybersecurity Experts', description: 'protecting against threats', rating: 4.9 },
  ];

  const StatCard = ({ label, value, icon: Icon, trend, trendValue, onClick }) => (
    <div className={`bg-white rounded-xl px-4 py-3 border border-purple-200 shadow-sm min-w-0 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`} onClick={onClick}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-2 bg-purple-50 rounded-lg shrink-0">
            <Icon className="w-4 h-4" style={{ color: aithemestyle.iconColor }} />
          </div>
          <span className="text-gray-600 text-sm truncate">{label}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-lg font-bold text-gray-800 tabular-nums">{value}</span>
          {trend && trendValue && (
            <div className="flex items-center gap-0.5">
              {trend === 'up' ? (
                <ArrowUp className="w-3 h-3" style={{ color: aithemestyle.trendup }} />
              ) : (
                <ArrowDown className="w-3 h-3" style={{ color: aithemestyle.trendDown }} />
              )}
              <span className="text-xs font-medium" style={{ color: trend === 'up' ? aithemestyle.trendup : aithemestyle.trendDown }}>{trendValue}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const ChartCard = ({ title, icon: Icon, infoText, children }) => {
    const [showInfo, setShowInfo] = useState(false);

    return (
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-purple-600" />
            <span className="text-gray-700 font-medium">{title}</span>
          </div>
          <div className="relative">
            <Info
              className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600"
              onMouseEnter={() => setShowInfo(true)}
              onMouseLeave={() => setShowInfo(false)}
            />
            {showInfo && (
              <div className="absolute right-0 top-6 z-10 w-48 p-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg">
                {infoText}
              </div>
            )}
          </div>
        </div>
        {children}
      </div>
    );
  };

  const getStatusColor = (status) => {
    const s = aithemestyle.recentActivityStatus;
    switch (status?.toLowerCase()) {
      case 'deployed': return s.deployed;
      case 'archived': return s.archived;
      case 'active':   return s.active;
      case 'inactive': return s.inactive;
      default:         return s.default;
    }
  };

  const handleRecentActivityClick = async (activity) => {
    const { entity_type, entity_id, name } = activity;
    try {
      if (entity_type === 'data') {
        const response = await fetch(`${hostnameAI}/canvas/list_data_info?data_id=${encodeURIComponent(entity_id)}`, {
          headers: { 'Authorization': `Bearer ${token}`, 'accept': 'application/json' }
        });
        if (!response.ok) throw new Error('Failed to fetch dataset');
        const data = await response.json();
        const dataset = Array.isArray(data) ? data[0] : data;
        navigate(`/ai/hub/data/library/${encodeURIComponent(entity_id)}`, { state: { datasetData: dataset } });
      } else if (entity_type === 'model') {
        const response = await fetch(`${hostnameAI}/canvas/model_list?model_id=${encodeURIComponent(entity_id)}`, {
          headers: { 'Authorization': `Bearer ${token}`, 'accept': 'application/json' }
        });
        if (!response.ok) throw new Error('Failed to fetch model');
        const data = await response.json();
        const model = Array.isArray(data) ? data[0] : data;
        navigate(`/ai/hub/models/library/${encodeURIComponent(String(entity_id))}`, { state: { modelData: model } });
      } else if (entity_type === 'project') {
        const response = await fetch(`${hostnameAI}/canvas/project_list/?project_id=${encodeURIComponent(entity_id)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch project');
        const data = await response.json();
        const project = Array.isArray(data) ? data[0] : data;
        navigate(`/ai/hub/projects/${entity_id}/library`, { state: { ProjectData: project } });
      }
    } catch (error) {
      console.error(`Error opening ${entity_type} library for ${name}:`, error);
    }
  };

  return (
    <div className="space-y-4 min-w-0 overflow-x-hidden">
      <div className={` rounded-2xl p-4`} style={{ background: aithemestyle.statsCardGradient }}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* <StatCard {...statsData[0]} /> */}
            <StatCard {...statsData[1]} />
            <StatCard {...statsData[2]} />
            <StatCard {...statsData[3]} />
            <StatCard {...statsData[4]} />
            <StatCard {...statsData[5]} />
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-purple-50 rounded-lg">
                <FileText className="w-5 h-5" style={{ color: aithemestyle.iconColor }} />
              </div>
              <span className="text-gray-700 font-medium">Accuracy</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex-1 flex flex-col items-center">
                <p className="text-sm text-gray-500">Model</p>
                <p className="text-2xl font-bold text-gray-800 flex items-center gap-1">
                  {summaryData.metrics?.avg_model_accuracy?.current ? `${(summaryData.metrics.avg_model_accuracy.current * 100).toFixed(1)}%` : '0%'}
                  {summaryData.metrics?.avg_model_accuracy?.trend === 'increased' ? (
                    <ArrowUp className="w-5 h-5" style={{ color: aithemestyle.trendup }} />
                  ) : (
                    <ArrowDown className="w-5 h-5" style={{ color: aithemestyle.trendDown }} />
                  )}
                  <span className="text-sm font-medium" style={{ color: summaryData.metrics?.avg_model_accuracy?.trend === 'increased' ? aithemestyle.trendup : aithemestyle.trendDown }}>
                    {summaryData.metrics?.avg_model_accuracy?.percentage_change ? `${formatPct(summaryData.metrics.avg_model_accuracy.percentage_change)}` : ''}
                  </span>
                </p>
              </div>
              <div className="h-12 w-px bg-gray-200 mx-4" />
              <div className="flex-1 flex flex-col items-center">
                <p className="text-sm text-gray-500">Agents</p>
                <p className="text-2xl font-bold text-gray-800 flex items-center gap-1">
                  97%
                  <ArrowDown className="w-5 h-5 text-orange-500" />
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
        <ChartCard
          title="Model Lifecycle"
          icon={(props) => <Box {...props} style={{ color: aithemestyle.iconColor }} />}
          infoText="Shows the distribution of models across different lifecycle stages: Saved, Deployed, and Archived."
        >
          <div className="flex items-center justify-center overflow-hidden">
            <PieChart width={220} height={220}>
              <Pie
                data={modelLifecycleData}
                cx={110}
                cy={110}
                innerRadius={56}
                outerRadius={88}
                dataKey="value"
              >
                {modelLifecycleData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name, props) => [`${value} (${props.payload.percentage}%)`, name]} />
            </PieChart>
          </div>
          <div className="flex justify-center items-center mt-1 mb-1 flex-wrap gap-x-2 gap-y-1">
            {modelLifecycleData.map((item, index) => (
              <div key={index} className="flex items-center gap-2 px-2 py-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-xs text-gray-600 font-medium">{item.name}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard
          title="Token Usage"
          icon={(props) => <Activity {...props} style={{ color: aithemestyle.iconColor }} />}
          infoText="Displays the token consumption trend over time. Higher values indicate increased usage."
        >
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={tokenUsageData} margin={{ left: -17, right: 8, top: 16, bottom: 0 }}>
              <defs>
                <linearGradient id="tokenUsageGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={aithemestyle.tokenUsageChart.gradientTo} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={aithemestyle.tokenUsageChart.gradientFrom} stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={(value) => `${value}%`} width={40} />
              <Tooltip formatter={(value) => [`${value}%`, 'Usage']} />
              <Area
                type="monotone"
                dataKey="usage"
                stroke={aithemestyle.tokenUsageChart.line}
                strokeWidth={2}
                fill={aithemestyle.tokenUsageChart.area}
                dot={{ fill: aithemestyle.tokenUsageChart.dot, strokeWidth: 2, r: 3 }}
                label={{ position: 'top', fontSize: 10, fill: '#6B7280' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Drift Alerts"
          icon={(props) => <AlertTriangle {...props} style={{ color: aithemestyle.iconColor }} />}
          infoText="Alerts for model drift."
        >
          <div className="flex flex-col flex-1 min-h-[220px] max-h-[250px] h-full">
            <div className="space-y-3 flex-1 overflow-y-auto pr-3">
              {driftAlerts.map((alert, index) => (
                <div key={index} className="flex justify-between items-center gap-2">
                  <div className="min-w-0">
                    <span
                      className="text-sm font-medium text-gray-700 cursor-pointer hover:underline block truncate"
                      onClick={() => handleRecentActivityClick({ entity_type: 'model', entity_id: alert.model_id, name: alert.model_name })}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && handleRecentActivityClick({ entity_type: 'model', entity_id: alert.model_id, name: alert.model_name })}
                      title={alert.model_name}
                    >
                      {alert.name}
                    </span>
                    <p className="text-xs text-gray-400">{alert.type}</p>
                  </div>
                  <span className="text-sm font-medium text-orange-500 shrink-0 w-16 text-right">{alert.severity}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
        <ChartCard
          title="Popular use cases"
          icon={(props) => <Lightbulb {...props} style={{ color: aithemestyle.iconColor }} />}
          infoText="Most frequently used use cases across organization."
        >
          <div className="space-y-3">
            {popularUseCases.map((useCase, index) => (
              <div key={index} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                <div className="flex items-center gap-3">
                                      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: aithemestyle.popularUsecaseColors.iconBackground }}>
                    <img src={popularUseCaseUrl} alt="icon" className="w-4 h-4" />
                  </div>
                  <span className="text-sm text-gray-700">{useCase.name}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard
          title="Top Performing Agents"
          icon={({ className }) => <img src={performaceIconUrl} alt="icon" className={className} style={{ color: aithemestyle.iconColor }} />}
          infoText="Agents ranked by their performance metrics and  ratings."
        >
          <div className="space-y-3">
            {topAgents.map((agent, index) => {
              const colors = aithemestyle.agentIconColors[index % aithemestyle.agentIconColors.length];
              return (
                <div key={index} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: colors.bg }}>
                      <img src={performaceIconUrl} alt="icon" className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">{agent.name}</p>
                      <p className="text-xs text-gray-400">{agent.description}</p>
                    </div>
                  </div>
                  <span className="text-sm  flex items-center gap-0.5">
                    <span style={{ color: '#FF9500' }}>★</span> <span style={{ color: '#494747' }}>{agent.rating}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </ChartCard>

        <ChartCard
          title="Recent Activity"
          icon={(props) => <Activity {...props} style={{ color: aithemestyle.iconColor }} />}
          infoText="Latest activities and deployments in workspace."
        >
          <div className="space-y-3 max-h-[264px] overflow-y-auto pr-3">
            {recentActivityData.map((activity, index) => (
              <div key={index} className="flex items-center gap-2">
                <span
                  className="text-sm text-gray-700 cursor-pointer hover:underline flex-1 min-w-0 truncate"
                  onClick={() => handleRecentActivityClick(activity)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleRecentActivityClick(activity)}
                  title={activity.name}
                >
                  {truncateName(activity.name)}
                </span>
                {activity.status && (
                  <span
                    className="text-xs w-20 py-1 rounded-md text-center shrink-0 font-medium"
                    style={{ backgroundColor: getStatusColor(activity.status).bg, color: getStatusColor(activity.status).text }}
                  >
                    {activity.status}
                  </span>
                )}
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

export default Dashboard;