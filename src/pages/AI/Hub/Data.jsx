import { FileText, Database, FolderKanban, Box, Scale, ArrowUp, ArrowDown, Info, Activity, Search, List, RefreshCw, BookOpenText, Archive, Trash2, Rocket, Palette, BookOpen, Gauge, LayoutGrid, Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell } from 'recharts';
import { useState, useMemo, useEffect } from 'react';
import Breadcrumb from '../../../components/Breadcrumb';
import DataTable from '../../../components/DataTable';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import DeleteModal from './Components/DeleteModal';
import { useAIPlayground } from '../../../context/AIPlaygroundContext';
// import { updateRecentAccess } from './Components/Hooks';
import { updateRecentAccess } from './Components/Hooks';
import { toast } from 'react-hot-toast';

const Data = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // ADDED: all | active | inactive | archived
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [dashboardRefreshTrigger, setDashboardRefreshTrigger] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isTableView, setIsTableView] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [aiCanvasLoading, setAiCanvasLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [recentAccessed, setRecentAccessed] = useState([]);
  const [recentAccessedLoading, setRecentAccessedLoading] = useState(false);
  const [recentAccessedError, setRecentAccessedError] = useState(null);
  const { setProjectState, setDatasetState, setMode } = useAIPlayground();

  const navigate = useNavigate();
  const { token, decodedToken } = useAuth();
  const hostnameAI = window._env_?.VITE_AI_API;

  useEffect(() => {
    setMode('write')
  }, []);

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

  useEffect(() => {
    const fetchDashboardData = async () => {
      setDashboardLoading(true);
      setDashboardError(null);
      try {
        const response = await fetch(`${hostnameAI}/canvas/data_dashboard/summary?user_id=${decodedToken.sub}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        const data = await response.json();
        setDashboardData(data);
      } catch (err) {
        setDashboardError(err.message);
      } finally {
        setDashboardLoading(false);
      }
    };

    if (decodedToken.sub) {
      fetchDashboardData();
    }
  }, [hostnameAI, token, decodedToken.sub, dashboardRefreshTrigger]); // CHANGED

  useEffect(() => {
    const fetchRecentAccessed = async () => {
      if (!decodedToken?.sub) return;
      setRecentAccessedLoading(true);
      setRecentAccessedError(null);
      try {
        const resp = await fetch(
          `${hostnameAI}/canvas/entity/recent_access/list?user_id=${decodedToken.sub}&entity_type=data&limit=5`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!resp.ok) throw new Error('Failed to fetch recent accessed data');
        const data = await resp.json();
        setRecentAccessed(data?.recent_entities || []);
      } catch (err) {
        setRecentAccessedError(err.message);
      } finally {
        setRecentAccessedLoading(false);
      }
    };
    fetchRecentAccessed();
  }, [hostnameAI, token, decodedToken?.sub, dashboardRefreshTrigger]);

  const statsData = useMemo(() => {
    if (dashboardLoading || !dashboardData) {
      return [
        { label: 'Sources', value: null, icon: FileText },
        { label: 'Datasets', value: null, icon: Database },
        { label: 'Size (GB)', value: null, icon: Box },
        { label: 'Additions (1week)', value: null, icon: FolderKanban },
      ];
    }
    return [
      { label: 'Sources', value: dashboardData.counts.sources.current.toString(), icon: FileText },
      { label: 'Datasets', value: dashboardData.counts.datasets.current.toString(), icon: Database },
      { label: 'Size (GB)', value: dashboardData.metrics.dataset_size_gb.current.toString(), icon: Box },
      { label: 'Additions (1week)', value: dashboardData.counts.datasets.additions_1week?.toString() ?? "0", icon: FolderKanban },
    ];
  }, [dashboardData, dashboardLoading]);

  const lastAccessedData = useMemo(() => {
    if (recentAccessed && Array.isArray(recentAccessed) && recentAccessed.length > 0) {
      return recentAccessed.map(item => ({
        id: item.entity_id || item.id || item.dataset_id || item.uuid || item.file_id, // CHANGED
        name: item.entity_name || item.name || 'Unknown',
        accessed_at: item.accessed_at ? new Date(item.accessed_at) : null,
      }));
    }
    return [];
  }, [recentAccessed]);

  const qualityData = [
    { name: 'Good', value: 45, color: '#10B981' },
    { name: 'Average', value: 30, color: '#FBBF24' },
    { name: 'Poor', value: 25, color: '#EF4444' },
  ];

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
    setDashboardRefreshTrigger(prev => prev + 1);
  };

  const toggleView = () => {
    setIsTableView(prev => !prev);
  };


  const columns = [
    { key: 'sno', label: 'Sno', sortable: true, width: '90px', render: (row, index) => index + 1 },
    {
      key: 'file_name',
      label: 'Dataset Name',
      sortable: true,
      width: '250px',
      render: (row) => (
        <span
          className="block min-w-0 whitespace-normal break-words text-[#8e78b7] hover:underline cursor-pointer"
          onClick={() => handleLibrary(row)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleLibrary(row)}
          title={row.file_name ?? ''}
          style={{ overflowWrap: 'anywhere' }}
        >
          {row.file_name}
        </span>
      ),
    },
    {key: 'description', label: 'Description', sortable: true },
    { key: 'row_count', label: 'Rows', sortable: true },
    { key: 'column_count', label: 'Columns', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'created_at', label: 'Created Date', sortable: true, render: (row) => new Date(row.created_at).toLocaleDateString('en-GB') },
    {
      key: 'size_mb',
      label: 'Size',
      sortable: true,
      render: (row) => (row?.size_mb ?? row?.size_mb === 0) ? `${row.size_mb} MB` : ''
    },
    { key: 'username', label: 'User', sortable: true },
    { key: 'project_name', label: 'Project', sortable: true },
    { label: 'Action', sortable: false },
  ];

  const handleDelete = (row) => {
    setDeleteTarget(row);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const id = deleteTarget.id || deleteTarget.dataset_id || deleteTarget.uuid || deleteTarget.file_id || deleteTarget.file_name;
      const url = `${hostnameAI}/canvas/dataset/${id}/delete`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          accept: "application/json",
        },
      });
      if (!resp.ok) throw new Error("Failed to delete dataset");
      setDeleteModalOpen(false);
      setDeleteTarget(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      alert(err.message || "Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleLibrary = async (row) => {
    const datasetId =
      row?.id ||
      row?.dataset_id ||
      row?.uuid ||
      row?.file_id ||
      row?.file_name;

    navigate(`/ai/hub/data/library/${encodeURIComponent(String(datasetId))}`, {
      state: { datasetData: row }
    });

    await updateRecentAccess({
      row,
      entityType: 'data',
      hostnameAI,
      token,
      userId: decodedToken?.sub,
      setRecentList: setRecentAccessed,
      setRecentLoading: setRecentAccessedLoading,
      limit: 5,
    });
  };

  const handleF1Mode = async (row) => {
    console.log('F1 Mode:', row);
    await updateRecentAccess({
      row,
      entityType: 'data',
      hostnameAI,
      token,
      userId: decodedToken?.sub,
      setRecentList: setRecentAccessed,
      setRecentLoading: setRecentAccessedLoading,
      limit: 5,
    });
  };

  const handleAICanvas = async (row) => {
    try {
      setAiCanvasLoading(true);
      setLoadingMessage('Fetching dataset information...');

      const datasetResponse = await fetch(
        `${hostnameAI}/canvas/dataset/${row.id}`,
        {
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!datasetResponse.ok) {
        throw new Error('Failed to fetch dataset information');
      }

      const datasetData = await datasetResponse.json();
      const { dataset_name, project_name, profiling_data } = datasetData;

      setProjectState({
        selectedProject: project_name
      });

      setDatasetState({
        tableName: dataset_name,
        sessionId: '',
        columnNames: [],
        profileReportHtml: profiling_data?.profile_report_html || ''
      });

      const username = decodedToken?.preferred_username || "admin";

      const ingestionParams = new URLSearchParams({
        domain: '',
        project_name: project_name,
        profiling_required: 'false',
        tag: '',
        source: '',
        sub_tag: '',
        table_name: dataset_name,
        category: '',
        user_name: username
      });

      const ingestionResponse = await fetch(
        `${hostnameAI}/data/ingestion`,
        {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Bearer ${token}`
          },
          body: ingestionParams.toString()
        }
      );

      if (!ingestionResponse.ok) {
        throw new Error("Failed to ingest data");
      }

      const ingestionData = await ingestionResponse.json();

      setLoadingMessage('Opening AI Canvas...');

      setDatasetState(prev => ({
        ...prev,
        sessionId: ingestionData.session_id || '',
        columnNames: ingestionData.column_names || []
      }));

      setMode('dataset');
      navigate('/ai/playground');
      await updateRecentAccess({
        row,
        entityType: 'data',
        hostnameAI,
        token,
        userId: decodedToken?.sub,
        setRecentList: setRecentAccessed,
        setRecentLoading: setRecentAccessedLoading,
        limit: 5,
      });
    } catch (err) {
      console.error('AI Canvas error:', err);
      alert(err.message || 'Failed to open AI Canvas');
      setAiCanvasLoading(false);
    } finally {
    }
  };

  const handleArchive = async (row) => {
    console.log('Archive:', row);
    await updateRecentAccess({
      row,
      entityType: 'data',
      hostnameAI,
      token,
      userId: decodedToken?.sub,
      setRecentList: setRecentAccessed,
      setRecentLoading: setRecentAccessedLoading,
      limit: 5,
    });
  };

  const actions = [
    {
      label: 'Library',
      icon: <BookOpen className="w-4 h-4" />,
      onClick: handleLibrary,
      tooltip: 'Library',
    },
    {
      label: 'F1 Mode',
      icon: <Gauge className="w-4 h-4" />,
      onClick: handleF1Mode,
      tooltip: 'F1 Mode',
    },
    {
      label: 'AI Playground',
      icon: <Palette className="w-4 h-4" />,
      onClick: handleAICanvas,
      tooltip: 'AI Playground',
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

    const statusFiltered =
      statusFilter === 'all'
        ? base
        : base.filter(row => String(row.status ?? '').toLowerCase() === statusFilter);

    if (!searchTerm.trim()) return statusFiltered;

    const q = searchTerm.toLowerCase();
    return statusFiltered.filter((row) =>
      Object.values(row || {}).some((val) =>
        String(val ?? '').toLowerCase().includes(q)
      )
    );
  }, [searchTerm, tableData, statusFilter]);

  const StatsCardSimple = ({ label, value, icon: Icon }) => (
    <div className="bg-white rounded-xl px-6 py-5 border border-purple-200 flex items-center min-h-[90px]">
      <div className="flex items-center gap-3 flex-1">
        <Icon className="w-5 h-5 text-[#8e78b7]" />
        <span className="text-black text-xl font-medium">{label}</span>
      </div>
      <div className="flex items-center justify-end min-w-[40px]">
        {value == null ? (
          <div className="h-7 w-10 bg-gray-200 rounded animate-pulse"></div>
        ) : (
          <span className="text-2xl font-medium text-gray-900 tabular-nums">{value}</span>
        )}
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

  const handleLastAccessedClick = async (item) => {
    const dataId = item?.id;
    if (!dataId) return;

    try {
      const resp = await fetch(
        `${hostnameAI}/canvas/list_data_info?data_id=${encodeURIComponent(String(dataId))}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            accept: 'application/json',
          },
        }
      );
      if (!resp.ok) throw new Error('Failed to fetch dataset info');

      const payload = await resp.json();
      const datasetRow =
        (Array.isArray(payload) ? payload[0] : payload?.data?.[0] || payload?.dataset || payload) || { id: dataId };

      navigate(`/ai/hub/data/library/${encodeURIComponent(String(dataId))}`, {
        state: { datasetData: datasetRow },
      });

      await updateRecentAccess({
        row: datasetRow,
        entityType: 'data',
        hostnameAI,
        token,
        userId: decodedToken?.sub,
        setRecentList: setRecentAccessed,
        setRecentLoading: setRecentAccessedLoading,
        limit: 5,
      });
    } catch (err) {
      alert(err?.message || 'Failed to open dataset');
    }
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6 bg-gray-50 min-h-screen">
      <Breadcrumb />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-medium text-gray-900">Data</h1>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 border border-gray-300 rounded-lg text-sm px-3 bg-white"
              title="Filter by Status"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
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
            {/* --- Updated Stats Card Row --- */}
            <div className="bg-gradient-to-r from-[#8e78b7] via-purple-300 to-purple-100 rounded-xl p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statsData.map((stat, index) => (
                  <StatsCardSimple
                    key={index}
                    label={stat.label}
                    value={stat.value}
                    icon={stat.icon}
                  />
                ))}
              </div>
            </div>
            {/* --- End Stats Card Row --- */}

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
                infoText="Recently accessed datasets and their last access time"
              >
                {recentAccessedLoading ? (
                  <div className="py-8">
                    <div className="space-y-3">
                      {[...Array(5)].map((_, idx) => (
                        <div key={idx} className="flex items-center justify-between px-2">
                          <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/4 mx-4 animate-pulse"></div>
                          <div className="h-4 w-6 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : recentAccessedError ? (
                  <div className="text-center py-8 text-red-500">{recentAccessedError}</div>
                ) : lastAccessedData.length > 0 ? (
                  <div className="max-h-[240px] overflow-y-auto">
                    {lastAccessedData.map((item, index) => (
                      <div key={index}>
                        <div className="flex items-center justify-between py-3 px-2 hover:bg-gray-50">
                          <span
                            className="text-sm text-gray-700 flex-1 cursor-pointer hover:underline"
                            onClick={() => handleLastAccessedClick(item)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && handleLastAccessedClick(item)}
                            title={item.name}
                          >
                            {item.name}
                          </span>
                          <span className="text-xs text-gray-500 mx-4">
                            {item.accessed_at
                              ? item.accessed_at.toLocaleString('en-GB', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : ''}
                          </span>
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
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No recently accessed datasets
                  </div>
                )}
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

      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Dataset"
        description={`Are you sure you want to delete "${deleteTarget?.file_name || deleteTarget?.id || ''}"? This action cannot be undone.`}
        loading={deleteLoading}
        confirmText="Delete"
      />

      {aiCanvasLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex flex-col items-center">
              <Loader2 className="w-16 h-16 text-[#8e78b7] animate-spin mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading AI Canvas</h3>
              <p className="text-gray-600 text-center">{loadingMessage}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Data;