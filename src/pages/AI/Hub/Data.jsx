import { FileText, Database, FolderKanban, Box, Bot, Scale, Lightbulb, ChevronRight, ArrowUp, ArrowDown, Info, Activity, AlertTriangle, Search, Grid, RefreshCw, List, BookOpenText } from 'lucide-react';
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useState } from 'react';
import Breadcrumb from '../../../components/Breadcrumb';
import DataTable from './DataTable';

const Data = () => {
  const [showInfo, setShowInfo] = useState({});

  const statsData = [
    { label: 'Sources', value: '07', icon: FileText },
    { label: 'Datasets', value: '70', icon: Database },
    { label: 'Size (GB)', value: '61', icon: Box },
    { label: 'Additions (1week)', value: '61', icon: FolderKanban },
  ];


  const lastAccessedData = [
    { name: 'Churn', count: 2, trend: 'up' },
    { name: 'NPA', count: 3, trend: 'up' },
    { name: 'CS', count: 4, trend: 'down' },
    { name: 'Fraud', count: 4, trend: 'up' },
    { name: 'NPA', count: 3, trend: 'down' },
    { name: 'Fraud', count: 4, trend: 'up' },
    { name: 'Campaign', count: 2, trend: 'down'},
    { name: 'M_risk', count: 6, trend: 'up' },
  ];

  const qualityData = [
    { name: 'Good', value: 45, color: '#10B981' },
    { name: 'Average', value: 30, color: '#FBBF24' },
    { name: 'Poor', value: 25, color: '#EF4444' },
  ];

  const StatCard = ({ label, value, icon: Icon, trend }) => (
    <div className="bg-white rounded-lg px-4 py-1 border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="px-2 py-4">
            <Icon className="w-5 h-5 text-purple-600" />
          </div>
          <span className="text-gray-600 text-xs sm:text-sm">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg sm:text-xl font-bold text-gray-800">{value}</span>
        </div>
      </div>
    </div>
  );

  const ChartCard = ({ title, icon: Icon, infoText, children, className = "" }) => {
    const [showInfoLocal, setShowInfoLocal] = useState(false);

    return (
      <div className={`bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            <span className="text-gray-700 font-medium text-sm sm:text-base">{title}</span>
          </div>
          <div className="relative">
            <Info
              className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600"
              onMouseEnter={() => setShowInfoLocal(true)}
              onMouseLeave={() => setShowInfoLocal(false)}
            />
            {showInfoLocal && (
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

  return (
    <div className="p-3 sm:p-4 lg:p-6 bg-gray-50 min-h-screen">
      <Breadcrumb />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">Data</h1>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search database"
              className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <List className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6">
        <div className="bg-gradient-to-r from-purple-400 via-purple-300 to-purple-200 rounded-xl p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statsData.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard
            title="Quality"
            icon={Scale}
            infoText="Data quality distribution across all datasets"
          >
            <div className="flex flex-col items-center">
                <PieChart width={350} height={170}>
                  <Pie
                    data={qualityData}
                    cx={170}
                    cy={170}
                    startAngle={180}
                    endAngle={0}
                    innerRadius={150}
                    outerRadius={160}
                    dataKey="value"
                  >
                    {qualityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
                <div className="flex items-end justify-center">
                  <div className="text-center mb-10">
                    <div className="bg-[#8e78b7] text-white px-7 py-1 rounded-full text-xs font-medium">
                      Good Quality
                  </div>
                </div>
              </div>
              <div className="flex justify-center gap-6">
                {qualityData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-xs text-gray-600">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>

          <ChartCard
            title="Last Accessed"
            icon={Activity}
            infoText="Recently accessed datasets and their frequency"
          >
            <div className="space-y-2 max-h-[240px] overflow-y-auto">
              {lastAccessedData.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{item.count}</span>
                    {item.trend === 'up' ? (<ArrowUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />):
                    (<ArrowDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-500"/>)
                    }
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <BookOpenText className="w-4 h-4 text-[#8e78b7]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>

        <div>
            <DataTable />
        </div>

      </div>
    </div>
  );
};

export default Data;