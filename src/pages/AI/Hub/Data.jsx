// Add rotate animation CSS for refresh icon
const rotateAnimation = `
  @keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(-360deg); }
  }
  .icon-rotate {
    animation: rotate 1s linear infinite;
  }
`;
import { FileText, Database, FolderKanban, Box, Scale, ArrowUp, ArrowDown, Info, Activity, Search, List, RefreshCw, BookOpenText, Archive, Trash2, Rocket, Palette, BookOpen, Gauge, LayoutGrid, Loader2, X, Zap , RefreshCcw, MoreHorizontal} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Customized } from 'recharts';
import { useState, useMemo, useEffect } from 'react';
import Breadcrumb from '../../../components/Breadcrumb';
import DataTable from '../../../components/DataTable';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import DeleteModal from './Components/DeleteModal';
import ArchiveModal from './Components/ArchieveModal';
import UnarchiveModal from './Components/UnarchieveModal';
import { useAIPlayground } from '../../../context/AIPlaygroundContext';
// import { updateRecentAccess } from './Components/Hooks';
import { updateRecentAccess, unarchiveEntity } from './Components/Hooks';
import StatusFilterDropdown from './Components/StateSelector';
import { toast } from 'react-hot-toast';
import { aithemestyle } from '../../../components/themeContext';
import DatasetsIcon from '../../../assets/ai/datadataseticon.svg';
import SizeIcon from '../../../assets/ai/datasizeicon.svg';
import AdditionIcons from '../../../assets/ai/dataadditionicon.svg';
import BoltIcon from '../../../assets/ai/bolt.svg';
import GauageBg from '../../../assets/ai/Container.svg';
import Searchicon from '../../../assets/governance/search.svg';
import lastaccessedicon from '../../../assets/ai/menu_book.svg';
import history from '../../../assets/ai/history.svg';
import speed2 from '../../../assets/ai/speed2.svg';



const F1ModeModal = ({ isOpen }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex flex-col items-center">
          <Loader2 className="w-16 h-16 animate-spin mb-4" style={{ color: aithemestyle.iconColor }} />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Opening F1 Mode</h3>
          <p className="text-gray-600 text-center">Fetching dataset information...</p>
        </div>
      </div>
    </div>
  );
};


const Data = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(['active']); // Array of selected statuses: active, archived
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
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [unarchiveModalOpen, setUnarchiveModalOpen] = useState(false);
  const [unarchiveTarget, setUnarchiveTarget] = useState(null);
  const [unarchiveLoading, setUnarchiveLoading] = useState(false);
  const [aiCanvasLoading, setAiCanvasLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [recentAccessed, setRecentAccessed] = useState([]);
  const [recentAccessedLoading, setRecentAccessedLoading] = useState(false);
  const [recentAccessedError, setRecentAccessedError] = useState(null);

  const [f1ModalOpen, setF1ModalOpen] = useState(false);

  const {
    setProjectState,
    setDatasetState,
    setMode,
    setF1Mode,
    setWorkflowsState,
    setActiveWorkflowId,
    createWorkflow,
    setIsAIPlaygroundActive,
  } = useAIPlayground();

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
        setTableData(data.map((item, index) => ({ ...item, sno: index + 1 })));
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
        { label: 'Datasets', value: null, icon: DatasetsIcon },
        { label: 'Size (GB)', value: null, icon: SizeIcon },
        { label: 'Additions (1week)', value: null, icon: AdditionIcons },
      ];
    }
    return [
      { label: 'Datasets', value: dashboardData.counts.datasets.current.toString(), icon: DatasetsIcon },
      { label: 'Size (GB)', value: dashboardData.metrics.dataset_size_gb.current.toString(), icon: SizeIcon },
      { label: 'Additions (1week)', value: dashboardData.weekly_additions?.datasets_added_last_7_days?.toString() ?? "0", icon: AdditionIcons },
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
    { name: 'Poor', value: 25, color: aithemestyle.piechart.poor },
    { name: 'Poor', value: 25, color: aithemestyle.piechart.poor },
    { name: 'Average', value: 25, color: aithemestyle.piechart.average },
    { name: 'Average', value: 25, color: aithemestyle.piechart.average },
    { name: 'Good', value: 25, color: aithemestyle.piechart.good },
    { name: 'Good', value: 25, color: aithemestyle.piechart.good },
  ];

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
    setDashboardRefreshTrigger(prev => prev + 1);
    setSearchTerm('');
    toast.success('Refresh successfully');
  };

  const toggleView = () => {
    setIsTableView(prev => !prev);
  };


  const columns = [
    { key: 'sno', label: 'Sno', sortable: true, width: '90px' },
    {
      key: 'file_name',
      label: 'Name',
      sortable: true,
      width: '200px',
      render: (row) => (
        <span
          className="block min-w-0 whitespace-normal break-words hover:underline cursor-pointer"
          onClick={() => handleLibrary(row)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleLibrary(row)}
          title={row.file_name ?? ''}
          style={{ overflowWrap: 'anywhere', color: aithemestyle.iconColor }}
        >
          {row.file_name}
        </span>
      ),
    },
    { key: 'created_at', label: 'Created Date', sortable: true, render: (row) => new Date(row.created_at).toLocaleDateString('en-GB') },
    { key: 'last_used_at', label: 'Last Used', width: '100px', sortable: true, render: (row) => row.updated_at ? new Date(row.updated_at).toLocaleDateString('en-GB') : '' },
    { key: 'size_mb', label: 'Size', width: '100px', sortable: true, render: (row) => (row?.size_mb ?? row?.size_mb === 0) ? `${row.size_mb} MB` : '' },
    { key: 'row_count', width: '100px', label: 'Rows', sortable: true },
    { key: 'column_count', width: '100px', label: 'Columns', sortable: true },
    { key: 'project_name', label: 'Project', sortable: true },
    { key: 'username', label: 'Created By', sortable: true },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      width: '100px',
      render: (row) => {
        const status = String(row.status || '').toLowerCase();
        let statusClass = '';
        let statusText = status.charAt(0).toUpperCase() + status.slice(1);

        switch (status) {
          case 'active':
            statusClass = 'text-[#069B68]';
            break;
          case 'archived':
            statusClass = 'text-[#818181]';
            break;
          default:
            statusClass = 'bg-blue-100 text-blue-800';
        }

        return (
          <span
            className={`inline-flex items-center px-2.5 py-1.5 rounded-md text-xs font-medium  ${statusClass}`}
            style={
              status === 'active'
                ? { background: '#2AC79240' }
                : status === 'archived'
                  ? { background: '#D9D9D980' }
                  : {}
            }
          >
            {statusText}
          </span>
        );
      },
    },
    { label: 'Action', width: '50px', sortable: false },
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
      toast.success('Dataset deleted successfully');
    } catch (err) {
      toast.error(err.message || "Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  const confirmArchive = async () => {
    if (!archiveTarget) return;
    setArchiveLoading(true);
    try {
      const id = archiveTarget.id || archiveTarget.dataset_id || archiveTarget.uuid || archiveTarget.file_id || archiveTarget.file_name;
      const url = `${hostnameAI}/canvas/archive_data/${id}`;
      const resp = await fetch(url, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          accept: "application/json",
        },
      });
      if (!resp.ok) throw new Error("Failed to archive data");
      setArchiveModalOpen(false);
      setArchiveTarget(null);
      setRefreshTrigger((prev) => prev + 1);
      toast.success('Dataset archived successfully');
    } catch (err) {
      toast.error(err.message || "Archive failed");
    } finally {
      setArchiveLoading(false);
    }
  };

  const confirmUnarchive = async () => {
    if (!unarchiveTarget) return;
    setUnarchiveLoading(true);
    try {
      const id = unarchiveTarget.id || unarchiveTarget.dataset_id || unarchiveTarget.uuid || unarchiveTarget.file_id || unarchiveTarget.file_name;
      await unarchiveEntity({
        component: 'data',
        component_id: id,
        hostnameAI,
        token,
      });
      setUnarchiveModalOpen(false);
      setUnarchiveTarget(null);
      setRefreshTrigger((prev) => prev + 1);
      toast.success('Dataset unarchived successfully');
    } catch (err) {
      toast.error(err.message || "Unarchive failed");
    } finally {
      setUnarchiveLoading(false);
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

  const handleF1ModeClick = async (row) => {
    setF1ModalOpen(true);
    try {
      const sqRes = await fetch(`${window._env_?.VITE_FAST_API}/secure-query`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_query: '' }),
      });
      if (!sqRes.ok) throw new Error('Failed to fetch policy IDs');
      const sqData = await sqRes.json();

      const tableName = row?.file_name || row?.dataset_name || row?.table_name || row?.name;

      const res = await fetch(`${hostnameAI}/data/f1/ingestion`, {
        method: 'POST',
        headers: { accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_name: tableName,
          user_name: decodedToken?.preferred_username,
          policy_id: sqData.matched_policy_ids,
        }),
      });
      if (!res.ok) throw new Error('Failed to ingest data for F1 Mode');
      const ingestionData = await res.json();

      setF1Mode({
        session_id: ingestionData.session_id,
        column_names: ingestionData.column_names || [],
        selected_table: tableName,
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

      navigate('/ai/f1mode');
    } catch (err) {
      toast.error('Failed to launch F1 Mode', {
        duration: 4000,
        position: 'top-right',
      });
    } finally {
      setF1ModalOpen(false);
    }
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
        profileReportHtml: profiling_data?.profile_report_html || '',
        isEnsemble: false,
        WorkflowCount: 1,
      });

      const username = decodedToken?.preferred_username || "admin";

      const secureQueryResponse = await fetch(
        `${window._env_?.VITE_FAST_API}/secure-query`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_query: "" }),
        }
      );

      if (!secureQueryResponse.ok) {
        throw new Error("Failed to fetch policy IDs");
      }

      const secureQueryData = await secureQueryResponse.json();
      const policyIds = secureQueryData.matched_policy_ids;

      const ingestionParams = {
        table_name: dataset_name,
        project_name: project_name,
        profiling_required: false,
        user_name: username,
        policy_id: policyIds
      };

      const ingestionResponse = await fetch(
        `${hostnameAI}/ingestion/ingestion`,
        {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(ingestionParams),
        }
      );

      if (!ingestionResponse.ok) {
        throw new Error("Failed to ingest data");
      }

      const ingestionData = await ingestionResponse.json();

      setLoadingMessage('Opening AI Playground...');

      setDatasetState(prev => ({
        ...prev,
        ensembleId: ingestionData.ensemble_id || prev.ensembleId || '',
        sessionId: ingestionData.session_id || '',
        columnNames: ingestionData.column_names || []
      }));

      const createWorkflowResponse = await fetch(`${hostnameAI}/ingestion/create-workflow`, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ensemble_id: ingestionData.ensemble_id || row?.id || '',
          no_of_workflows: 1,
          workflow_names: ['workflow 01']
        })
      });

      if (!createWorkflowResponse.ok) {
        throw new Error(`Failed to create workflow: ${createWorkflowResponse.status}`);
      }

      const createWorkflowData = await createWorkflowResponse.json();
      const workflowEntries = Object.entries(createWorkflowData?.workflows || {});
      const [workflowIdFromMap, workflowNameFromMap] = workflowEntries[0] || [];
      const workflowId = workflowIdFromMap || createWorkflowData?.workflow_ids?.[0];
      const workflowName = workflowNameFromMap || 'workflow 01';

      if (!workflowId) {
        throw new Error('No workflow ID returned from create-workflow API');
      }

      setWorkflowsState({});
      setActiveWorkflowId(null);
      createWorkflow(workflowId, workflowName);
      setActiveWorkflowId(workflowId);
      setIsAIPlaygroundActive(true);

      setMode('write');
      navigate('/ai/playground/model-genesis', {
        state: {
          isEnsemble: false,
          ensembleCount: 1,
        }
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
    } catch (err) {
      toast.error('Failed to open AI Playground', {
        duration: 4000,
        position: 'top-right',
      });
      setAiCanvasLoading(false);
    } finally {
    }
  };

  const handleArchive = (row) => {
    setArchiveTarget(row);
    setArchiveModalOpen(true);
  };

  const handleUnarchive = (row) => {
    setUnarchiveTarget(row);
    setUnarchiveModalOpen(true);
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
      icon: <Zap className="w-4 h-4" style={{ color: 'rgba(129, 129, 129, 1)' }} />,
      onClick: handleF1ModeClick,
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
      show: (row) => String(row.status ?? '').toLowerCase() !== 'archived',
    },
    {
      label: 'Unarchive',
      icon: <Archive className="w-4 h-4" />,
      onClick: handleUnarchive,
      tooltip: 'Unarchive',
      show: (row) => String(row.status ?? '').toLowerCase() === 'archived',
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

    const statusFiltered = base.filter(row => {
      const rowStatus = String(row.status ?? '').toLowerCase();
      return statusFilter.includes(rowStatus);
    });

    if (!searchTerm.trim()) return statusFiltered;

    const q = searchTerm.toLowerCase();
    return statusFiltered.filter((row) =>
      Object.values(row || {}).some((val) =>
        String(val ?? '').toLowerCase().includes(q)
      )
    );
  }, [searchTerm, tableData, statusFilter]);

  const StatsCardSimple = ({ label, value, icon: Icon }) => (
    <div className="bg-white rounded-xl px-4 py-4 flex items-center min-h-[80px] min-w-0">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <img src={Icon} alt={label} width={24} height={24} className="shrink-0 mr-1" />
        <span className="satoshi-medium truncate">{label}</span>
      </div>
      <div className="flex items-center justify-end ml-2 shrink-0">
        {value == null ? (
          <div className="h-6 w-10 bg-gray-200 rounded animate-pulse"></div>
        ) : (
          <span className="satoshi-count">{value}</span>
        )}
      </div>
    </div>
  );

  const ChartCard = ({ title, icon: Icon, infoText, children, className = "" }) => {
    const [showInfoLocal, setShowInfoLocal] = useState(false);

    return (
      <div className={`bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: aithemestyle.iconColor }} />
            <span className="satoshi-medium-md">{title}</span>
          </div>
          <div className="relative">
            <Info
              className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600"
              onMouseEnter={() => setShowInfoLocal(true)}
              onMouseLeave={() => setShowInfoLocal(false)}
            />
            {showInfoLocal && (
              <div className="absolute right-0 top-6 z-10 w-48 p-2 text-white text-xs rounded-lg shadow-lg" style={{ backgroundColor: '#332849' }}>
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
      <style>{rotateAnimation}</style>

      <div className="sticky top-0 z-40 bg-gray-50 -mx-3 sm:-mx-4 lg:-mx-6 px-3 sm:px-4 lg:px-6">
        <Breadcrumb skipLinkSegments={['hub']} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 py-3 sm:py-4 lg:py-6" style={{ height: '18px' }}>
          <h1 className="satoshi-heading">Data</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <StatusFilterDropdown
              selectedStatuses={statusFilter}
              onStatusChange={setStatusFilter}
              statusOptions={[
                { value: 'active', label: 'Active' },
                { value: 'archived', label: 'Archived' }
              ]}
              style={{ color: '#818181' }}
            />
          </div>

          <div className="relative flex-1 sm:flex-initial">
            <img src={Searchicon} alt="Search" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={handleSearchChange}
              style={{
                width: '248px',
                height: '40px',
                borderRadius: '8px',
                paddingLeft: '40px', // to account for icon
                paddingRight: '8px',
                paddingTop: '8px',
                paddingBottom: '8px',
                borderWidth: '1px',
                borderColor: '#d1d5db',
                fontSize: '14px',
                boxSizing: 'border-box',
                background: '#fff',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              className="focus:ring-2 focus:ring-[#8E77BB] focus:border-transparent"
            />
          </div>

          
          {/* <button
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            onClick={toggleView}
            title={isTableView ? "Grid View" : "List View"}
          >
            {isTableView ? (
              <LayoutGrid className="w-5 h-5 text-gray-600" />
            ) : (
              <List className="w-5 h-5 text-gray-600" />
            )}
          </button> */}

          
          <button
            className="p-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCcw size={20} className={isLoading ? 'icon-rotate' : ''} style={{ color: '#818181' }} strokeWidth={1.7} />
          </button>
        </div>
        </div>
      </div>

      <div className="space-y-6">
        {!isTableView && (
          <>
            {/* --- Updated Stats Card Row --- */}
            <div className={`${aithemestyle.statsCardGradient270} rounded-xl p-4`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <ChartCard
                title="Quality"
                icon={() => <img src={speed2} alt="Quality" style={{ color: aithemestyle.iconColor }} className="w-4 h-4 sm:w-5 sm:h-5" />}
                infoText="Data quality distribution across all datasets"
                className="lg:col-span-2"
              >
                <div className="flex flex-col items-center w-full">
                  <div className="relative w-full flex justify-center">
                    <ResponsiveContainer width="95%" height={280}>
                      <PieChart>
                        <defs>
                          <linearGradient id="qualityInnerGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={aithemestyle.piechart.innerGradientFrom} />
                            <stop offset="100%" stopColor={aithemestyle.piechart.innerGradientTo} />
                          </linearGradient>
                        </defs>
                        {/* Render SVG background first so Pie is above */}
                        <Customized
                          component={({ width, height }) => {
                            const svgWidth = width * 1;
                            const svgHeight = height * 0.90;
                            const svgX = (width - svgWidth) / 2 ;
                            const svgY = (height - svgHeight) / 2;
                            return (
                              <g>
                                <image
                                  href={GauageBg}
                                  x={svgX}
                                  y={svgY}
                                  width={svgWidth}
                                  height={svgHeight}
                                  preserveAspectRatio="xMidYMid meet"
                                />
                              </g>
                            );
                          }}
                        />
                        {/* Colored Pie arcs above SVG */}
                        <Pie
                          data={qualityData}
                          cx="50%"
                          cy="100%"
                          startAngle={180}
                          endAngle={0}
                          innerRadius={255}
                          outerRadius={275}
                          paddingAngle={1}
                          dataKey="value"
                        >
                          {qualityData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        
                        
                        
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                      <div className="w-full flex justify-center">
                        <div className="text-white text-xs font-semibold rounded-full whitespace-nowrap" 
                          style={{ backgroundColor: aithemestyle.piechart.labelColor, height: '28px', width: '140px', padding: '6px 0', textAlign: 'center' }}>
                          Good Quality
                        </div>
                        </div>
                      </div>
                  </div>
                  <div className="flex justify-center gap-6 mt-3">
                    {[...new Map(qualityData.map(item => [item.name + item.color, item])).values()].map((item, index) => (
                      <div key={item.name + item.color} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-md" style={{ backgroundColor: item.color }}></div>
                        <span className="text-xs text-gray-600">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </ChartCard>

              <ChartCard
                title="Last Accessed"
                icon={() => <img src={history} alt="History"  style={{ color: aithemestyle.iconColor }} />}
                infoText="Recently accessed datasets and their last access time"
                className="lg:col-span-1"
              >
                {recentAccessedLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, idx) => (
                      <div key={idx} className="flex items-center justify-between px-2 py-2">
                        <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                        <div className="h-4 w-6 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                ) : recentAccessedError ? (
                  <div className="text-center py-8 text-red-500">{recentAccessedError}</div>
                ) : lastAccessedData.length > 0 ? (
                  <div style={{ maxHeight: '220px' }}>
                    {lastAccessedData.map((item, index) => (
                      <div key={index}>
                        <div className="flex items-center py-2.5 px-2 hover:bg-gray-50 min-w-0 gap-2">
                          <span
                            className="text-sm text-gray-700 flex-1 min-w-0 truncate cursor-pointer hover:underline"
                            onClick={() => handleLastAccessedClick(item)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && handleLastAccessedClick(item)}
                            title={item.name}
                          >
                            {item.name}
                          </span>
                          <span className="text-xs text-gray-400 shrink-0 w-[110px] text-right tabular-nums">
                            {item.accessed_at
                              ? item.accessed_at.toLocaleString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                              : '—'}
                          </span>
                          <button
                            className="p-1 hover:bg-gray-100 rounded cursor-pointer shrink-0"
                            onClick={() => handleLastAccessedClick(item)}
                            title={`Open ${item.name}`}
                          >
                            <img src={lastaccessedicon} alt="Last Accessed" className="w-4 h-4" style={{ color: aithemestyle.iconColor }} />
                          </button>
                        </div>
                        {index < lastAccessedData.length - 1 && (
                          <div className="border-b border-gray-100"></div>
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

      <ArchiveModal
        isOpen={archiveModalOpen}
        onClose={() => setArchiveModalOpen(false)}
        onConfirm={confirmArchive}
        title="Archive Dataset"
        description={`Are you sure you want to archive "${archiveTarget?.file_name || archiveTarget?.id || ''}"? This action can be undone.`}
        loading={archiveLoading}
        confirmText="Archive"
      />

      <UnarchiveModal
        isOpen={unarchiveModalOpen}
        onClose={() => setUnarchiveModalOpen(false)}
        onConfirm={confirmUnarchive}
        title="Unarchive Dataset"
        description={`Are you sure you want to unarchive "${unarchiveTarget?.file_name || unarchiveTarget?.id || ''}"? This action can be undone.`}
        loading={unarchiveLoading}
        confirmText="Unarchive"
      />

      <F1ModeModal isOpen={f1ModalOpen} />

      {aiCanvasLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex flex-col items-center">
              <Loader2 className="w-16 h-16 text-[#8e78b7] animate-spin mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Opening AI Playground</h3>
              <p className="text-gray-600 text-center">{loadingMessage}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Data;