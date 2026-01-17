import { FileText, Database, FolderKanban, Box, Scale, ArrowUp, ArrowDown, Info, Activity, Search, List, RefreshCw, BookOpenText, Archive, Trash2, Rocket, Palette, BookOpen, Gauge, LayoutGrid } from 'lucide-react';
import { PieChart, Pie, Cell } from 'recharts';
import { useState, useMemo, useEffect } from 'react';
import Breadcrumb from '../../../components/Breadcrumb';
import DataTable from '../../../components/DataTable';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';


const Data = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isTableView, setIsTableView] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { token, decodedToken } = useAuth();
  const hostnameAI = window._env_?.VITE_AI_API;
  console.log(decodedToken.sub)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${hostnameAI}/canvas/list_data_info`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const data = await response.json();
        setTableData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [hostnameAI, token, refreshTrigger]);

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
    { name: 'Campaign', count: 2, trend: 'down' },
    { name: 'M_risk', count: 6, trend: 'up' },
  ];

  const qualityData = [
    { name: 'Good', value: 45, color: '#10B981' },
    { name: 'Average', value: 30, color: '#FBBF24' },
    { name: 'Poor', value: 25, color: '#EF4444' },
  ];

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setRefreshTrigger(prev => prev + 1);
    setTimeout(() => setIsLoading(false), 1000);
  };

  const toggleView = () => {
    setIsTableView(prev => !prev);
  };

  const getQualityStyle = (quality) => {
    switch (quality) {
      case 'Good':
        return 'bg-green-100 text-green-700';
      case 'Average':
        return 'bg-yellow-100 text-yellow-700';
      case 'Poor':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const columns = [
    { key: 'sno', label: 'Sno', sortable: true, width: '90px', render: (row, index) => index + 1 },
    {
      key: 'file_name',
      label: 'File Name',
      sortable: true,
      width: '250px',
      render: (row) => <span className="text-[#8e78b7] hover:underline cursor-pointer">{row.file_name}</span>,
    },
    { key: 'row_count', label: 'Rows', sortable: true },
    { key: 'column_count', label: 'Columns', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'created_at', label: 'Created Date', sortable: true, render: (row) => new Date(row.created_at).toLocaleDateString('en-GB') },
    { key: 'size', label: 'Size', sortable: true },
    { label: 'Action', sortable: false },
  ];

  const actions = [
    {
      label: 'Library',
      icon: <BookOpen className="w-4 h-4" />,
      onClick: (row) => {
        navigate(`/ai/hub/data/library/${row.file_name}`, {
          state: { datasetData: row }
        });
      },
      tooltip: 'Library',
    },
    {
      label: 'F1 Mode',
      icon: <Gauge className="w-4 h-4" />,
      onClick: (row) => console.log('F1 Mode:', row),
      tooltip: 'F1 Mode',
    },
    {
      label: 'AI Canvas',
      icon: <Palette className="w-4 h-4" />,
      onClick: (row) => console.log('AI Canvas:', row),
      tooltip: 'AI Canvas',
    },
    {
      label: 'Archive',
      icon: <Archive className="w-4 h-4" />,
      onClick: (row) => console.log('Archive:', row),
      tooltip: 'Archive',
    },
    {
      label: 'Delete',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (row) => console.log('Delete:', row),
      tooltip: 'Delete',
    },
  ];

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return tableData;
    const q = searchTerm.toLowerCase();
    return tableData.filter((row) =>
      Object.values(row || {}).some((val) =>
        String(val ?? '').toLowerCase().includes(q)
      )
    );
  }, [searchTerm, tableData]);

  const StatCard = ({ label, value, icon: Icon }) => (
    <div className="bg-white rounded-lg px-4 py-1 border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="px-2 py-4">
            <Icon className="w-5 h-5 text-[#8e78b7]" />
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
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-[#8e78b7]" />
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">Data</h1>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search database"
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <button
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            onClick={toggleView}
            title={isTableView ? "Grid View" : "List View"}
          >
            {isTableView ? (
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
        </div>
      </div>

      <div className="space-y-6">
        {!isTableView && (
          <>
            <div className="bg-gradient-to-r from-[#8e78b7] via-purple-300 to-purple-100 rounded-xl p-4">
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
                <div className="max-h-[240px] overflow-y-auto">
                  {lastAccessedData.map((item, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between py-3 px-2 hover:bg-gray-50">
                        <span className="text-sm text-gray-700 flex-1">{item.name}</span>
                        <span className="text-sm font-medium text-gray-900 mx-8">{item.count}</span>
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <BookOpenText className="w-4 h-4 text-[#8e78b7]" />
                        </button>
                      </div>
                      {index < lastAccessedData.length - 1 && (
                        <div className="border-b border-gray-200"></div>
                      )}
                    </div>
                  ))}
                </div>
              </ChartCard>
            </div>
          </>
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
    </div>
  );
};

export default Data;