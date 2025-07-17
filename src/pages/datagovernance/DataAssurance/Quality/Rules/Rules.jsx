import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, ChevronLeft, ChevronRight, Play, Pencil, RefreshCw, Trash2, BookOpen, List, Clock, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { Icon } from '@iconify-icon/react';
import Breadcrumb from '../../../../../components/Breadcrumb';
import { useNavigate } from 'react-router-dom';
import RuleRunSummary from './RuleRunSummary';
import { useAuth } from "../../../../../context/AuthContext";
import { useLocation } from 'react-router-dom';

const Rules = () => {
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [viewMode, setViewMode] = useState('both');
  const [selectedRows, setSelectedRows] = useState([]);
  const [showRunSummary, setShowRunSummary] = useState(false);
  const [runForId, setRunForId] = useState(null);
  const [detailedRules, setDetailedRules] = useState([]);
  const [ruleRunResults, setRuleRunResults] = useState([]);
  const [isPopupLoading, setIsPopupLoading] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [schedulerData, setSchedulerData] = useState({
    freq: '',
    date: '',
    time: '',
    rule_ids: []
  });
  const [sortConfig, setSortConfig] = useState({ key: 'last_run_date', direction: 'desc' })
  const rowsPerPage = 5;
  const navigate = useNavigate();
  const [metricData, setMetricData] = useState({});
  const [tableData, setTableData] = useState([]);
  const selectAllRef = useRef(null);
  const [showSelectAllOptions, setShowSelectAllOptions] = useState(false);
  const { decodedToken } = useAuth();

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ show: false, message: '', type: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const metricsData = () => {
    const keys = Object.keys(metricData);
    const sortedKeys = keys.sort((a, b) => {
      if (a.toLowerCase() === 'overall') return -1;
      if (b.toLowerCase() === 'overall') return 1;
      return a.localeCompare(b);
    });

    return sortedKeys.map((key) => ({
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#8d77ba] bg-opacity-25",
      iconcolor: "text-[#8d77ba]",
      title: key,
      count: metricData[key] || "-"
    }));
  };

  const fetchCounts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${window._env_?.VITE_FAST_API}/rules/dashboard/counts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
        body: JSON.stringify({ owner: decodedToken?.preferred_username }),
      });
      if (response.status === 200) {
        const data = await response.json();
        setMetricData(data);
      } else {
        console.error('Non-200 response:', response.status);
      }
    } catch (error) {
      console.error('Error fetching counts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTableData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${window._env_?.VITE_FAST_API}/rules/dashboard/table`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
        body: JSON.stringify({ owner: decodedToken?.preferred_username }),
      });
      const data = await response.json();
      setTableData(data.data_rules || []);
    } catch (error) {
      console.error('Error fetching table data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRuleDetails = async (ids) => {
    try {
      const response = await fetch(`${window._env_?.VITE_FAST_API}/rules/details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
        body: JSON.stringify({ ids, owner: decodedToken?.preferred_username }),
      });
      const data = await response.json();
      return data.rules || [];
    } catch (error) {
      console.error('Error fetching rule details:', error);
      setToast({
        show: true,
        message: 'Failed to fetch rule details',
        type: 'error',
      });
      return [];
    }
  };

  const fetchRuleRunResults = async (ids) => {
    try {
      const response = await fetch(`${window._env_?.VITE_FAST_API}/rules/rulerun`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
        body: JSON.stringify({ ids, owner: decodedToken?.preferred_username }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
        console.error('API Error running rules:', response.status, errorData);
        return [];
      }

      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error('Network or parsing error running rules:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchCounts();
    fetchTableData();
  }, []);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleCreateRule = () => {
    navigate('/datagovernance/data-assurance/rules/create');
  };

  const handleOpenRuleLibrary = () => {
    navigate('/datagovernance/data-assurance/rule-library');
  };

  const handleSelectRow = (id) => {
    setSelectedRows(prev =>
      prev.includes(id)
        ? prev.filter(rowId => rowId !== id)
        : [...prev, id]
    );
  };

  const handleRunSelected = async (item, isRunForId = false) => {
    let idsToRun = [];

    if (isRunForId) {
      idsToRun = [item.id];
      setRunForId(item.id);
    } else if (selectedRows.length > 0) {
      idsToRun = selectedRows;
      setRunForId(null);
    } else {
      idsToRun = [item.id];
      setRunForId(item.id);
    }

    setIsPopupLoading(true);
    setShowRunSummary(true);

    const [detailedRulesData, results] = await Promise.all([
      fetchRuleDetails(idsToRun),
      fetchRuleRunResults(idsToRun)
    ]);

    const enrichedRulesData = detailedRulesData.map((rule) => {
      const tableItem = tableData.find((item) => item.id === rule.id);
      return {
        ...rule,
        type: tableItem ? tableItem.type : rule.type,
      };
    });

    setDetailedRules(enrichedRulesData);
    setRuleRunResults(results);
    setIsPopupLoading(false);
  };

  const handleQuickAction = (action, item) => {
    if (action === 'Run') {
      console.log(`Running rule: ${item.id}`);
      setShowRunSummary(false);
    } else if (action === 'Edit') {
      handleActionClick('Edit', item, tableData.findIndex(i => i.id === item.id));
      setShowRunSummary(false);
    } else if (action === 'Schedule') {
      handleScheduleSelected(item, true);
    }
  };

  const handleScheduleSelected = (item, isScheduleForId = false) => {
    let idsToSchedule = [];

    if (isScheduleForId) {
      idsToSchedule = [item.id];
    } else if (selectedRows.length > 0) {
      idsToSchedule = selectedRows;
    } else {
      idsToSchedule = [item.id];
    }

    setSchedulerData(prev => ({ ...prev, rule_ids: idsToSchedule }));
    setShowScheduler(true);
  };

  const handleScheduleSubmit = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${window._env_?.VITE_FAST_API}/rules/scheduler`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
        body: JSON.stringify({
          ...schedulerData,
          owner: decodedToken?.preferred_username
        }),
      });

      if (response.ok) {
        setToast({
          show: true,
          message: `Successfully scheduled ${schedulerData.rule_ids.length} rule(s)`,
          type: 'success',
        });
        setShowScheduler(false);
        setSchedulerData({ freq: 'Daily', date: '2016-02-10', time: '18:00', rule_ids: [] });
      } else {
        throw new Error('Failed to schedule rules');
      }
    } catch (error) {
      console.error('Error scheduling rules:', error);
      setToast({
        show: true,
        message: 'Failed to schedule rules',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleScheduleAllSelected = () => {
    if (selectedRows.length === 0) return;
    setSchedulerData(prev => ({ ...prev, rule_ids: selectedRows }));
    setShowScheduler(true);
    setShowSelectAllOptions(false);
  };

  const handleSort = (key) => {
    setSortConfig(prev => {
      const newDirection = prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc';
      return { key, direction: newDirection };
    });
    setCurrentPage(1); // Reset to first page on sort
  };

  const getSortIcon = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'asc' ? (
        <ArrowUp className="h-4 w-4 inline-block ml-1" />
      ) : (
        <ArrowDown className="h-4 w-4 inline-block ml-1" />
      );
    }
    return <ArrowUpDown className="h-4 w-4 inline-block ml-1 opacity-50" />;
  };

  const filteredData = tableData
    .filter(item =>
      Object.values(item).some(val =>
        val && val.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
    .sort((a, b) => {
      if (!sortConfig.key) return 0;

      const aLastRun = a.last_run_date || '';
      const bLastRun = b.last_run_date || '';
      const lastRunComparison =
        sortConfig.direction === 'asc'
          ? aLastRun.localeCompare(bLastRun)
          : bLastRun.localeCompare(aLastRun);

      if (sortConfig.key === 'last_run_date' && lastRunComparison === 0) {
        const aUpdated = a.updated_date || '';
        const bUpdated = b.updated_date || '';
        return sortConfig.direction === 'asc'
          ? aUpdated.localeCompare(bUpdated)
          : bUpdated.localeCompare(aUpdated);
      }

      if (sortConfig.key === 'id') {
        const aValue = parseInt(a.id, 10);
        const bValue = parseInt(b.id, 10);
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      const aValue = a[sortConfig.key] || '';
      const bValue = b[sortConfig.key] || '';
      return sortConfig.direction === 'asc'
        ? aValue.toString().localeCompare(bValue.toString())
        : bValue.toString().localeCompare(bValue.toString());
    });

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleRefreshSelected = async (item, isRefreshForId = false) => {
    let idsToRefresh = [];

    if (isRefreshForId) {
      idsToRefresh = [item.id];
    } else if (selectedRows.length > 0) {
      idsToRefresh = selectedRows;
    } else {
      idsToRefresh = [item.id];
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${window._env_?.VITE_FAST_API}/rules/dashboard/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
        body: JSON.stringify({ ids: idsToRefresh }),
      });

      if (response.ok) {
        const data = await response.json();
        setToast({
          show: true,
          message: `Successfully refreshed ${idsToRefresh.length} rule(s)`,
          type: 'success',
        });
        fetchTableData();
        fetchCounts();
      } else {
        throw new Error('Failed to refresh rules');
      }
    } catch (error) {
      console.error('Error refreshing rules:', error);
      setToast({
        show: true,
        message: 'Failed to refresh rules',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const [deleteConfirmation, setDeleteConfirmation] = useState({
    show: false,
    ids: [],
    isSingle: false,
    item: null
  });

  const handleDeleteSelected = async (item, isDeleteForId = false) => {
    let idsToDelete = [];

    if (isDeleteForId) {
      idsToDelete = [item.id];
    } else if (selectedRows.length > 0) {
      idsToDelete = selectedRows;
    } else {
      idsToDelete = [item.id];
    }

    setDeleteConfirmation({
      show: true,
      ids: idsToDelete,
      isSingle: isDeleteForId,
      item: item
    });
  };

  const handleDeleteAllSelected = async () => {
    if (selectedRows.length === 0) return;
    setDeleteConfirmation({
      show: true,
      ids: selectedRows,
      isSingle: false,
      item: null
    });
    setShowSelectAllOptions(false);
  };

  const performDelete = async (idsToDelete) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${window._env_?.VITE_FAST_API}/rules/deleterule`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
        body: JSON.stringify({ ids: idsToDelete, owner: decodedToken?.preferred_username }),
      });

      if (response.ok) {
        setTableData(prev => prev.filter(rule => !idsToDelete.includes(rule.id)));
        setSelectedRows(prev => prev.filter(id => !idsToDelete.includes(id)));
        setToast({
          show: true,
          message: `Successfully deleted ${idsToDelete.length} rule(s)`,
          type: 'success',
        });
        fetchCounts();
      } else {
        throw new Error('Failed to delete rules');
      }
    } catch (error) {
      console.error('Error deleting rules:', error);
      setToast({
        show: true,
        message: 'Failed to delete rules',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = async (action, item, index) => {
    if (action === 'Edit') {
      try {
        const response = await fetch(`${window._env_?.VITE_FAST_API}/rules/details`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ids: [item.id], owner: decodedToken?.preferred_username }),
        });
        const data = await response.json();
        navigate('/datagovernance/data-assurance/rules/create', {
          state: { edit: true, ruleData: data }
        });
      } catch (error) {
        console.error('Error fetching rule details:', error);
        setToast({
          show: true,
          message: 'Failed to fetch rule details',
          type: 'error',
        });
      }
    } else if (action === 'Delete') {
      try {
        const response = await fetch(`${window._env_?.VITE_FAST_API}/rules/deleterule`, {
          method: 'PATCH',
          headers: {
            'accept': 'application/json',
          },
          body: JSON.stringify({ ids: [item.id] }),
        });

        if (response.ok) {
          setTableData(prev => prev.filter(rule => rule.id !== item.id));
          setSelectedRows(prev => prev.filter(id => id !== item.id));
          setToast({
            show: true,
            message: `Rule ID ${item.id} deleted successfully`,
            type: 'success',
          });
          fetchCounts();
        } else {
          const errorData = await response.json();
          setToast({
            show: true,
            message: errorData.message || 'Failed to delete rule',
            type: 'error',
          });
        }
      } catch (error) {
        console.error('Error deleting rule:', error);
        setToast({
          show: true,
          message: 'Failed to delete rule',
          type: 'error',
        });
      }
    } else {
      console.log(`${action} action for item at index ${index}:`, item);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectAllRef.current && !selectAllRef.current.contains(event.target)) {
        setShowSelectAllOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const currentItemIds = currentItems.map(item => item.id);
      setSelectedRows(prev => [...new Set([...prev, ...currentItemIds])]);
      setShowSelectAllOptions(true);
    } else {
      const currentItemIds = currentItems.map(item => item.id);
      setSelectedRows(prev => prev.filter(id => !currentItemIds.includes(id)));
      setShowSelectAllOptions(false);
    }
  };

  const areAllCurrentItemsSelected = currentItems.length > 0 &&
    currentItems.every(item => selectedRows.includes(item.id));

  const isIndeterminate = currentItems.some(item => selectedRows.includes(item.id)) &&
    !areAllCurrentItemsSelected;

  const handleRunAllSelected = async () => {
    if (selectedRows.length === 0) return;

    setIsPopupLoading(true);
    setShowRunSummary(true);
    setRunForId(null);

    const detailedRulesData = await fetchRuleDetails(selectedRows);
    const results = await fetchRuleRunResults(selectedRows);

    const enrichedRulesData = detailedRulesData.map((rule) => {
      const tableItem = tableData.find((item) => item.id === rule.id);
      return {
        ...rule,
        type: tableItem ? tableItem.type : rule.type,
      };
    });

    setDetailedRules(enrichedRulesData);
    setRuleRunResults(results);
    setIsPopupLoading(false);
    setShowSelectAllOptions(false);
  };

  const handleRefreshAllSelected = async () => {
    if (selectedRows.length === 0) return;
    await handleRefreshSelected(null);
    setShowSelectAllOptions(false);
  };

  const renderMetricsSkeleton = () => {
    return Array(6).fill().map((_, index) => (
      <div
        key={index}
        className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 animate-pulse"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div className="h-4 w-20 bg-gray-200 rounded"></div>
        </div>
        <div className="h-8 w-16 bg-gray-200 rounded"></div>
      </div>
    ));
  };

  const renderTableSkeleton = () => {
    return Array(rowsPerPage).fill().map((_, index) => (
      <tr key={index} className="border-b">
        <td className="p-4">
          <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
        </td>
        <td className="p-4">
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
        </td>
        <td className="p-4">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
        </td>
        <td className="p-4">
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
        </td>
        <td className="p-4">
          <div className="h-4 w-28 bg-gray-200 rounded animate-pulse"></div>
        </td>
        <td className="p-4">
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
        </td>
        <td className="p-4">
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
        </td>
        <td className="p-4">
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
        </td>
        <td className="p-4">
          <div className="h-4 w-28 bg-gray-200 rounded animate-pulse"></div>
        </td>
        <td className="p-4">
          <div className="h-4 w-28 bg-gray-200 rounded animate-pulse"></div>
        </td>
        <td className="p-4">
          <div className="h-4 w-28 bg-gray-200 rounded animate-pulse"></div>
        </td>
        <td className="p-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-6 w-6 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-6 w-6 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-6 w-6 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-6 w-6 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        </td>
      </tr>
    ));
  };

  const [autoOpenRuleRunSummary, setAutoOpenRuleRunSummary] = useState(false);
  const [autoSelectedRuleIds, setAutoSelectedRuleIds] = useState([]);

  useEffect(() => {
    if (autoOpenRuleRunSummary && autoSelectedRuleIds.length > 0) {
      const handleAutoOpen = async () => {
        setIsPopupLoading(true);
        setShowRunSummary(true);

        const [detailedRulesData, results] = await Promise.all([
          fetchRuleDetails(autoSelectedRuleIds),
          fetchRuleRunResults(autoSelectedRuleIds)
        ]);

        const enrichedRulesData = detailedRulesData.map((rule) => {
          const tableItem = tableData.find((item) => item.id === rule.id);
          return {
            ...rule,
            type: tableItem ? tableItem.type : rule.type,
          };
        });

        setDetailedRules(enrichedRulesData);
        setRuleRunResults(results);
        setIsPopupLoading(false);
        setAutoOpenRuleRunSummary(false);
      };

      handleAutoOpen();
    }
  }, [autoOpenRuleRunSummary, autoSelectedRuleIds]);

  useEffect(() => {
    const locationState = location.state;
    if (locationState?.fromRuleRunSummary && locationState?.selectedRuleIds) {
      setAutoSelectedRuleIds(locationState.selectedRuleIds);
      setAutoOpenRuleRunSummary(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  return (
    <div className="p-6">
      {toast.show && (
        <div className={`fixed top-6 right-6 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 animate-fadeIn ${toast.type === 'success' ? 'bg-green-100 text-green-800 border-l-4 border-green-500' :
          'bg-red-100 text-red-800 border-l-4 border-red-500'
          }`}>
          <Icon
            icon={toast.type === 'success' ? 'mdi:check-circle' : 'mdi:alert-circle'}
            className="h-5 w-5"
          />
          <p>{toast.message}</p>
          <button
            onClick={() => setToast({ show: false, message: '', type: '' })}
            className="ml-2 text-gray-500 hover:text-gray-700"
          >
            <Icon icon="mdi:close" className="h-4 w-4" />
          </button>
        </div>
      )}

      <Breadcrumb />

      <div className="flex gap-4 mb-6 items-center justify-between">
        <h1 className="text-2xl font-semibold">Rules</h1>

        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search rules"
              className="pl-10 pr-4 py-2 w-[300px] border border-gray-300 rounded-lg focus:outline-none"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          <button
            type="button"
            title={"Rule library"}
            onClick={handleOpenRuleLibrary}
            className="text-black shadow-lg hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-3 py-2.5 me-2 dark:bg-[#ffffff] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
          >
            <BookOpen className="h-5 w-5" />
          </button>
          <button
            type="button"
            title={viewMode === 'both' ? "Hide Cards View" : "Show Both Views"}
            onClick={() => setViewMode(viewMode === 'both' ? 'table' : 'both')}
            className="text-black shadow-lg hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-3 py-2.5 me-2 dark:bg-[#ffffff] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
          >
            <List className="h-5 w-5" />
          </button>

          <button
            className="flex items-center gap-2 px-3 py-1.5 bg-[#8e78b7] text-white rounded-lg hover:bg-[#7a67a0] transition-colors"
            onClick={handleCreateRule}
          >
            <Plus className="h-4 w-4" />
            <span>Create</span>
          </button>
        </div>
      </div>

      {viewMode === 'both' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          {isLoading || Object.keys(metricData).length === 0
            ? renderMetricsSkeleton()
            : metricsData().map((metric, index) => (
              <div
                key={index}
                className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`flex items-center justify-center w-10 h-10 ${metric.bgcolor} rounded-full ${metric.iconcolor}`}
                  >
                    <Icon icon={metric.icon} className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-700 leading-tight">{metric.title}</h3>
                </div>
                <p className="text-gray-900 text-3xl font-bold">{metric.count}</p>
              </div>
            ))}
        </div>
      )}

      {(viewMode === 'both' || viewMode === 'table') && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead>
                <tr className="bg-[#29304a] text-white">
                  <th className="text-left p-4 first:rounded-tl-lg relative" ref={selectAllRef}>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={areAllCurrentItemsSelected}
                        ref={el => el && (el.indeterminate = isIndeterminate)}
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-[#8e78b7] rounded"
                      />
                      {showSelectAllOptions && selectedRows.length > 0 && (
                        <div className="absolute left-8 top-10 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-md z-10">
                          <button
                            onClick={handleRunAllSelected}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm font-medium text-gray-700 transition-colors flex items-center gap-2"
                          >
                            <Play className="h-3 w-3 text-[#8e78b7]" />
                            Run Selected
                          </button>
                          <button
                            onClick={handleRefreshAllSelected}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm font-medium text-gray-700 transition-colors flex items-center gap-2"
                          >
                            <RefreshCw className="h-3 w-3 text-[#8e78b7]" />
                            Refresh Selected
                          </button>
                          <button
                            onClick={handleScheduleAllSelected}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm font-medium text-gray-700 transition-colors flex items-center gap-2"
                          >
                            <Clock className="h-3 w-3 text-[#8e78b7]" />
                            Schedule Selected
                          </button>
                          <button
                            onClick={handleDeleteAllSelected}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm font-medium text-gray-700 transition-colors flex items-center gap-2"
                          >
                            <Trash2 className="h-3 w-3 text-[#8e78b7]" />
                            Delete Selected
                          </button>
                        </div>
                      )}
                    </div>
                  </th>
                  <th className="text-left p-4 cursor-pointer hover:bg-[#3a4563]" onClick={() => handleSort('id')}>
                    <span className="inline-flex items-center">ID {getSortIcon('id')}</span>
                  </th>
                  <th className="text-left p-4 cursor-pointer hover:bg-[#3a4563]" onClick={() => handleSort('category')}>
                    <span className="inline-flex items-center">Category {getSortIcon('category')}</span>
                  </th>
                  <th className="text-left p-4 cursor-pointer hover:bg-[#3a4563]" onClick={() => handleSort('type')}>
                    <span className="inline-flex items-center">Type {getSortIcon('type')}</span>
                  </th>
                  <th className="text-left p-4 cursor-pointer hover:bg-[#3a4563]" onClick={() => handleSort('group_name')}>
                    <span className="inline-flex items-center">Group {getSortIcon('group_name')}</span>
                  </th>
                  <th className="text-left p-4 cursor-pointer hover:bg-[#3a4563]" onClick={() => handleSort('name')}>
                    <span className="inline-flex items-center">Name {getSortIcon('name')}</span>
                  </th>
                  <th className="text-left p-4 cursor-pointer hover:bg-[#3a4563]" onClick={() => handleSort('severity')}>
                    <span className="inline-flex items-center">Severity {getSortIcon('severity')}</span>
                  </th>
                  <th className="text-left p-4 cursor-pointer hover:bg-[#3a4563]" onClick={() => handleSort('status')}>
                    <span className="inline-flex items-center">Status {getSortIcon('status')}</span>
                  </th>
                  <th className="text-left p-4 cursor-pointer hover:bg-[#3a4563]" onClick={() => handleSort('created_date')}>
                    <span className="inline-flex items-center">Created Date {getSortIcon('created_date')}</span>
                  </th>
                  <th className="text-left p-4 cursor-pointer hover:bg-[#3a4563]" onClick={() => handleSort('updated_date')}>
                    <span className="inline-flex items-center">Updated Date {getSortIcon('updated_date')}</span>
                  </th>
                  <th className="text-left p-4 cursor-pointer hover:bg-[#3a4563]" onClick={() => handleSort('last_run_date')}>
                    <span className="inline-flex items-center">Last Run {getSortIcon('last_run_date')}</span>
                  </th>
                  <th className="text-center p-4 last:rounded-tr-lg">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading || tableData.length === 0
                  ? renderTableSkeleton()
                  : currentItems.map((item, index) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(item.id)}
                          onChange={() => handleSelectRow(item.id)}
                          className="h-4 w-4 text-[#8e78b7] rounded"
                        />
                      </td>
                      <td className="p-4 font-medium">{item.id}</td>
                      <td className="p-4 text-gray-600">{item.category}</td>
                      <td className="p-4 text-gray-600">{item.type}</td>
                      <td className="p-4 text-[#8e78b7] font-medium">{item.group_name}</td>
                      <td className="p-4 text-[#8e78b7] font-medium">{item.name}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.severity === 'High' ? 'bg-red-100 text-red-700' :
                          item.severity === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                          {item.severity}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.status === 'Active' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                          }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600">{item.created_date}</td>
                      <td className="p-4 text-gray-600">{item.updated_date}</td>
                      <td className="p-4 text-gray-600">{item.last_run_date}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="relative group">
                            <button
                              onClick={() => handleRunSelected(item, true)}
                              className="p-1.5 hover:bg-[#8e78b7] hover:bg-opacity-10 rounded-full"
                              title="Run"
                            >
                              <Play className="h-4 w-4 text-[#8e78b7]" />
                            </button>
                            {selectedRows.length > 0 && (
                              <div className="absolute right-0 top-4 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-md hidden group-hover:block z-10">
                                <button
                                  onClick={() => handleRunSelected(item, true)}
                                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm font-medium text-gray-700 transition-colors"
                                >
                                  Run ID {item.id}
                                </button>
                                <button
                                  onClick={handleRunAllSelected}
                                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm font-medium text-gray-700 transition-colors"
                                >
                                  Run Selected IDs
                                </button>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleActionClick('Edit', item, index)}
                            className="p-1.5 hover:bg-blue-100 rounded-full"
                            title="Edit Rule"
                          >
                            <Pencil className="h-4 w-4 text-[#8e78b7]" />
                          </button>
                          <div className="relative group">
                            <button
                              onClick={() => handleRefreshSelected(item, true)}
                              className="p-1.5 hover:bg-green-100 rounded-full"
                              title="Refresh Rule"
                            >
                              <RefreshCw className="h-4 w-4 text-[#8e78b7]" />
                            </button>
                            {selectedRows.length > 0 && (
                              <div className="absolute right-0 top-4 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-md hidden group-hover:block z-10">
                                <button
                                  onClick={() => handleRefreshSelected(item, true)}
                                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm font-medium text-gray-700 transition-colors"
                                >
                                  Refresh ID {item.id}
                                </button>
                                <button
                                  onClick={handleRefreshAllSelected}
                                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm font-medium text-gray-700 transition-colors"
                                >
                                  Refresh Selected IDs
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="relative group">
                            <button
                              onClick={() => handleScheduleSelected(item, true)}
                              className="p-1.5 hover:bg-purple-100 rounded-full"
                              title="Schedule Rule"
                            >
                              <Clock className="h-4 w-4 text-[#8e78b7]" />
                            </button>
                            {selectedRows.length > 0 && (
                              <div className="absolute right-0 top-4 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-md hidden group-hover:block z-10">
                                <button
                                  onClick={() => handleScheduleSelected(item, true)}
                                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm font-medium text-gray-700 transition-colors"
                                >
                                  Schedule ID {item.id}
                                </button>
                                <button
                                  onClick={handleScheduleAllSelected}
                                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm font-medium text-gray-700 transition-colors"
                                >
                                  Schedule Selected IDs
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="relative group">
                            <button
                              onClick={() => handleDeleteSelected(item, true)}
                              className="p-1.5 hover:bg-red-100 rounded-full"
                              title="Delete Rule"
                            >
                              <Trash2 className="h-4 w-4 text-[#8e78b7]" />
                            </button>
                            {selectedRows.length > 0 && (
                              <div className="absolute right-0 top-4 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-md hidden group-hover:block z-10">
                                <button
                                  onClick={() => handleDeleteSelected(item, true)}
                                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm font-medium text-gray-700 transition-colors"
                                >
                                  Delete ID {item.id}
                                </button>
                                <button
                                  onClick={handleDeleteAllSelected}
                                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm font-medium text-gray-700 transition-colors"
                                >
                                  Delete Selected IDs
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end items-center px-4 py-3 border-t">
            <div className="flex items-center gap-1">
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="flex items-center">
                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToPage(index + 1)}
                    className={`px-3 py-1 mx-1 rounded-md ${currentPage === index + 1
                      ? 'bg-[#8e78b7] text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                      }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
      {deleteConfirmation.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Confirm Deletion</h3>
            <p className="mb-6">
              {deleteConfirmation.ids.length > 1
                ? `Are you sure you want to delete ${deleteConfirmation.ids.length} selected rules?`
                : `Are you sure you want to delete rule ID ${deleteConfirmation.ids[0]}?`}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmation({ show: false, ids: [], isSingle: false, item: null })}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setDeleteConfirmation({ show: false, ids: [], isSingle: false, item: null });
                  performDelete(deleteConfirmation.ids);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {showScheduler && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full">
            <h3 className="text-xl font-medium mb-4">Scheduler</h3>
            <p className="mb-4 text-gray-600">
              Scheduling rule: {schedulerData.rule_ids.join(', ')}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
              <select
                value={schedulerData.freq}
                onChange={(e) => setSchedulerData(prev => ({ ...prev, freq: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8e78b7]"
              >
                <option value="Daily">Once</option>
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={schedulerData.date}
                onChange={(e) => setSchedulerData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8e78b7]"
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <input
                type="time"
                value={schedulerData.time}
                onChange={(e) => setSchedulerData(prev => ({ ...prev, time: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8e78b7]"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowScheduler(false);
                  setSchedulerData({ freq: 'Daily', date: '2016-02-10', time: '18:00', rule_ids: [] });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleScheduleSubmit}
                className="px-4 py-2 bg-[#8e78b7] text-white rounded-md hover:bg-[#7a67a0]"
              >
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      <RuleRunSummary
        show={showRunSummary}
        onClose={() => {
          setShowRunSummary(false);
          setRunForId(null);
          setDetailedRules([]);
          setRuleRunResults([]);
          setIsPopupLoading(false);
        }}
        selectedRules={detailedRules}
        ruleRunResults={ruleRunResults}
        onQuickAction={handleQuickAction}
        isLoading={isPopupLoading}
      />
    </div>
  );
};

export default Rules;