import { FileText, Database, FolderKanban, Box, Bot, Scale, Lightbulb, ChevronRight, ArrowUp, ArrowDown, Info, Activity, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useState } from 'react';

const Dashboard = () => {
  const statsData = [
    { label: 'Sources', value: '07', icon: FileText, trend: 'up' },
    { label: 'Size (GB)', value: '70', icon: Database, trend: 'up' },
    { label: 'Projects', value: '61', icon: FolderKanban, trend: 'up' },
    { label: 'Models', value: '273', icon: Box, trend: 'up' },
    { label: 'Agents', value: '27', icon: Bot, trend: 'up' },
    { label: 'Fairness', value: '0.9', icon: Scale, trend: 'up' },
  ];

  const modelLifecycleData = [
    { name: 'Deployed', value: 40, color: '#F97316' },
    { name: 'Training', value: 25, color: '#FBBF24' },
    { name: 'Active', value: 20, color: '#3B82F6' },
    { name: 'In-Active', value: 15, color: '#1E3A8A' },
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

  const driftAlerts = [
    { name: 'Project_churn_v4', issue: 'Data drift', value: '8%', trend: 'down' },
    { name: 'Project_churn_v9', issue: 'Algorithm bias', value: '20%', trend: 'down' },
    { name: 'Project_churn_v5', issue: 'Feature instability', value: '12%', trend: 'up' },
    { name: 'Project_churn_v6', issue: 'User disengagement', value: '15%', trend: 'up' },
    { name: 'Project_churn_v8', issue: 'Data quality issues', value: '5%', trend: 'up' },
    { name: 'Project_churn_v8', issue: '', value: '', trend: null },
  ];

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

  const recentActivity = [
    { name: 'Pm_Churn_Rec', status: null },
    { name: 'Pm_Churn_Campgain', status: 'Archived' },
    { name: 'Dg_Agent', status: 'Deployed' },
    { name: 'PII_Agent', status: 'Deployed' },
    { name: 'Orcl_Cust', status: 'Deployed' },
  ];

  const StatCard = ({ label, value, icon: Icon, trend }) => (
    <div className="bg-white rounded-xl px-5 py-4 border border-purple-200 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-50 rounded-lg">
            <Icon className="w-5 h-5 text-purple-600" />
          </div>
          <span className="text-gray-600 text-sm">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-gray-800">{value}</span>
          {trend === 'up' && <ArrowUp className="w-4 h-4 text-orange-500" />}
        </div>
      </div>
    </div>
  );

  const ChartCard = ({ title, icon: Icon, infoText, children }) => {
    const [showInfo, setShowInfo] = useState(false);

    return (
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
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
    switch (status) {
      case 'Deployed': return 'bg-orange-500';
      case 'Archived': return 'bg-gray-400';
      default: return 'bg-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-400 via-purple-300 to-purple-200 rounded-2xl p-4">
        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-3 grid grid-cols-3 gap-4">
            <StatCard {...statsData[0]} />
            <StatCard {...statsData[1]} />
            <StatCard {...statsData[2]} />
            <StatCard {...statsData[3]} />
            <StatCard {...statsData[4]} />
            <StatCard {...statsData[5]} />
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-purple-50 rounded-lg">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-gray-700 font-medium">Accuracy</span>
            </div>
            <div className="flex justify-around">
              <div className="text-center">
                <p className="text-sm text-gray-500">Model</p>
                <p className="text-2xl font-bold text-orange-500 flex items-center justify-center">
                  87% <ArrowDown className="w-4 h-4 ml-1" />
                </p>
              </div>
              <div className="border-l border-gray-200"></div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Agents</p>
                <p className="text-2xl font-bold text-orange-500 flex items-center justify-center">
                  97% <ArrowDown className="w-4 h-4 ml-1" />
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <ChartCard
          title="Model Lifecycle"
          icon={Box}
          infoText="Shows the distribution of models across different lifecycle stages: Deployed, Training, Active, and Inactive."
        >
          <div className="flex items-center justify-center">
            <PieChart width={180} height={180}>
              <Pie
                data={modelLifecycleData}
                cx={90}
                cy={90}
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
              >
                {modelLifecycleData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </div>
          <div className="flex justify-center gap-4 mt-4 flex-wrap">
            {modelLifecycleData.map((item, index) => (
              <div key={index} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-xs text-gray-600">{item.name}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard
          title="Token Usage"
          icon={Activity}
          infoText="Displays the token consumption trend over time. Higher values indicate increased usage."
        >
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={tokenUsageData}>
              <defs>
                <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={(value) => `${value}%`} />
              <Tooltip formatter={(value) => [`${value}%`, 'Usage']} />
              <Area
                type="monotone"
                dataKey="usage"
                stroke="#3B82F6"
                strokeWidth={2}
                fill="url(#colorUsage)"
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 3 }}
                label={{ position: 'top', fontSize: 10, fill: '#6B7280' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Drift Alerts"
          icon={AlertTriangle}
          infoText="Alerts for model drift."
        >
          <div className="space-y-3 max-h-[220px] overflow-y-auto">
            {driftAlerts.map((alert, index) => (
              <div key={index} className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-700">{alert.name}</p>
                  <p className="text-xs text-gray-400">{alert.issue}</p>
                </div>
                {alert.value && (
                  <span className={`text-sm font-medium flex items-center ${alert.trend === 'up' ? 'text-green-500' : 'text-orange-500'}`}>
                    {alert.value}
                    {alert.trend === 'up' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />}
                  </span>
                )}
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <ChartCard
          title="Popular use cases"
          icon={Lightbulb}
          infoText="Most frequently used use cases across organization."
        >
          <div className="space-y-3">
            {popularUseCases.map((useCase, index) => (
              <div key={index} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <FileText className="w-4 h-4 text-purple-600" />
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
          icon={Bot}
          infoText="Agents ranked by their performance metrics and  ratings."
        >
          <div className="space-y-3">
            {topAgents.map((agent, index) => (
              <div key={index} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">{agent.name}</p>
                    <p className="text-xs text-gray-400">{agent.description}</p>
                  </div>
                </div>
                <span className="text-sm text-yellow-500 flex items-center">
                  ★ {agent.rating}
                </span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard
          title="Recent Activity"
          icon={Activity}
          infoText="Latest activities and deployments in workspace."
        >
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-gray-700">{activity.name}</span>
                {activity.status && (
                  <span className={`text-xs px-3 py-1 rounded-md text-white ${getStatusColor(activity.status)}`}>
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