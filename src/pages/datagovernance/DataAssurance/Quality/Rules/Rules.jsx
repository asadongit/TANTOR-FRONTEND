import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, ChevronLeft, ChevronRight, Play, Pencil, RefreshCw, Trash2 } from 'lucide-react';
import { Icon } from '@iconify-icon/react';
import Breadcrumb from '../../../../../components/Breadcrumb';
import { useNavigate } from 'react-router-dom';
import RuleRunSummary from './RuleRunSummary';

const Rules = () => {
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
  const rowsPerPage = 5;
  const navigate = useNavigate();
  const [metricData, setMetricData] = useState([]);
  const [tableData, setTableData] = useState([]);
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ show: false, message: '', type: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const metricsData = [
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#8d77ba] bg-opacity-25",
      iconcolor: "text-[#8d77ba]",
      title: "Overall",
      count: metricData?.Overall || "-"
    },
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#8d77ba] bg-opacity-25",
      iconcolor: "text-[#8d77ba]",
      title: "Accuracy",
      count: metricData?.Accuracy || "-"
    },
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#8d77ba] bg-opacity-25",
      iconcolor: "text-[#8d77ba]",
      title: "Consistency",
      count: metricData?.Consistency || "-"
    },
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#8d77ba] bg-opacity-25",
      iconcolor: "text-[#8d77ba]",
      title: "Completeness",
      count: metricData?.Completeness || "-"
    },
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#8d77ba] bg-opacity-25",
      iconcolor: "text-[#8d77ba]",
      title: "Validity",
      count: metricData?.Validity || "-"
    },
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#8d77ba] bg-opacity-25",
      iconcolor: "text-[#8d77ba]",
      title: "Uniqueness",
      count: metricData?.Uniqueness || "-"
    }
  ];

  const fetchCounts = async () => {
    fetch(`${import.meta.env.VITE_FAST_API}/rules/dashboard/counts`)
      .then(response => response.json())
      .then(data => {
        console.log(data);
        setMetricData(data);
      })
      .catch(error => {
        console.error('Error fetching counts:', error);
      });
  };

  const fetchTableData = async () => {
    setIsLoading(true);
    fetch(`${import.meta.env.VITE_FAST_API}/rules/dashboard/table`)
      .then(response => response.json())
      .then(data => {
        console.log(data.data_rules);
        setTableData(data.data_rules || []);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching table data:', error);
        setIsLoading(false);
      });
  };

  const fetchRuleDetails = async (ids) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_FAST_API}/rules/details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
        body: JSON.stringify({ ids }),
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
      const response = await fetch(`${import.meta.env.VITE_FAST_API}/rules/rulerun`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
        body: JSON.stringify({ ids }),
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
    }
  };

  const filteredData = tableData.filter(item =>
    Object.values(item).some(val =>
      val && val.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

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
      const response = await fetch(`${import.meta.env.VITE_FAST_API}/rules/dashboard/refresh`, {
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
        fetchTableData(); // Refresh the table data
        fetchCounts(); // Refresh the metrics
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

  // The actual delete function (previously in handleDeleteSelected)
  const performDelete = async (idsToDelete) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_FAST_API}/rules/deleterule`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
        body: JSON.stringify({ ids: idsToDelete }),
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
        const response = await fetch(`${import.meta.env.VITE_FAST_API}/rules/details`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ids: [item.id] }),
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
        const response = await fetch(`${import.meta.env.VITE_FAST_API}/rules/deleterule`, {
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
  const [showSelectAllOptions, setShowSelectAllOptions] = useState(false);
  const selectAllRef = useRef(null);

  // Add this useEffect to handle clicks outside the dropdown
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

  // Modify the handleSelectAll function
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setShowSelectAllOptions(true);
      setSelectedRows(currentItems.map(item => item.id));
    } else {
      setShowSelectAllOptions(false);
      setSelectedRows([]);
    }
  };

  // Add these new functions
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
            className={`p-1 px-1.5 rounded-lg border ${viewMode === 'cards' ? 'bg-gray-100 border-gray-500' : 'border-gray-400'} hover:bg-gray-50`}
            onClick={() => setViewMode(viewMode === 'both' ? 'cards' : 'both')}
            title={viewMode === 'both' ? "Hide Table View" : "Show Both Views"}
          >
            <Icon
              icon="material-symbols-light:format-list-bulleted"
              width="24"
              height="24"
              className="text-gray-600"
            />
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        {metricsData.map((metric, index) => (
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

      {(viewMode === 'list' || viewMode === 'both') && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead>
                <tr className="bg-[#29304a] text-white">
                  <th className="text-left p-4 first:rounded-tl-lg relative" ref={selectAllRef}>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedRows.length > 0 && currentItems.every(item => selectedRows.includes(item.id))}
                        indeterminate={
                          selectedRows.length > 0 &&
                          !currentItems.every(item => selectedRows.includes(item.id))
                        }
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-[#8e78b7] rounded"
                        ref={(el) => {
                          if (el) {
                            el.indeterminate =
                              selectedRows.length > 0 &&
                              !currentItems.every(item => selectedRows.includes(item.id));
                          }
                        }}
                      />
                      {showSelectAllOptions && selectedRows.length > 0 && (
                        <div className="absolute left-8 top-10 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-md z-10">
                          <button
                            onClick={handleRunAllSelected}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm font-medium text-gray-700 transition-colors flex items-center gap-2"
                          >
                            <Play className="h-3 w-3 text-[#8e78b7]" />
                            Run IDs
                          </button>
                          <button
                            onClick={handleRefreshAllSelected}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm font-medium text-gray-700 transition-colors flex items-center gap-2"
                          >
                            <RefreshCw className="h-3 w-3 text-[#8e78b7]" />
                            Refresh IDs
                          </button>
                          <button
                            onClick={handleDeleteAllSelected}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm font-medium text-gray-700 transition-colors flex items-center gap-2"
                          >
                            <Trash2 className="h-3 w-3 text-[#8e78b7]" />
                            Delete IDs
                          </button>
                        </div>
                      )}
                    </div>
                  </th>
                  <th className="text-left p-4">ID</th>
                  <th className="text-left p-4">Category</th>
                  <th className="text-left p-4">Type</th>
                  <th className="text-left p-4">Group</th>
                  <th className="text-left p-4">Name</th>
                  <th className="text-left p-4">Severity</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Created Date</th>
                  <th className="text-left p-4">Updated Date</th>
                  <th className="text-left p-4">Last Run</th>
                  <th className="text-left p-4 last:rounded-tr-lg">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
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
                    <td className="p-4 text-gray-600">{item.last_run}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="relative group">
                          <button
                            onClick={() => handleRunSelected(item)}
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
                                onClick={() => handleRunSelected(item)}
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
                        </button><div className="relative group">
                          <button
                            onClick={() => handleRefreshSelected(item)}
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
                                onClick={() => handleRefreshSelected(item)}
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm font-medium text-gray-700 transition-colors"
                              >
                                Refresh Selected IDs
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="relative group">
                          <button
                            onClick={() => handleDeleteSelected(item)}
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
                                onClick={() => handleDeleteSelected(item)}
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
                onClick={async () => {
                  setDeleteConfirmation({ show: false, ids: [], isSingle: false, item: null });
                  await handleDeleteSelected(deleteConfirmation.item, deleteConfirmation.isSingle);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
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