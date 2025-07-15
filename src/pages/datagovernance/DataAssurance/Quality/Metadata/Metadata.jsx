import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, X, Eye } from 'lucide-react';
import { Icon } from "@iconify-icon/react";
import Breadcrumb from '../../../../../components/Breadcrumb';
import { useAuth } from '../../../../../context/AuthContext.jsx';

const rotateAnimation = `
  @keyframes rotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .icon-rotate {
    animation: rotate 1s linear infinite;
  }
`;

const SkeletonCard = () => (
  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 animate-pulse">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
      <div className="h-4 bg-gray-200 rounded w-20"></div>
    </div>
    <div className="h-6 bg-gray-200 rounded w-16 mt-4"></div>
  </div>
);

const SkeletonTableRow = () => (
  <tr className="border-b animate-pulse">
    <td className="p-4"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
    <td className="p-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
    <td className="p-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
    <td className="p-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
    <td className="p-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
    <td className="p-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
    <td className="p-4"><div className="h-4 w-24 bg-gray-200 rounded"></div></td>
  </tr>
);

const GroupScoresModal = ({ groups, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full md:w-3/4 lg:w-1/2 transform transition-all duration-300">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Group Scores</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
          aria-label="Close modal"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
      <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-gray-200">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#8e78b7] text-white">
              <th className="p-4 font-semibold text-sm uppercase tracking-wide">Group Name</th>
              <th className="p-4 font-semibold text-sm uppercase tracking-wide">Average Score</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group, index) => (
              <tr
                key={index}
                className="border-b border-gray-200 hover:bg-[#8e78b7]/10 transition-colors duration-150"
              >
                <td className="p-4 text-gray-800">{group.group_name}</td>
                <td className="p-4 text-gray-800 font-medium">{group.average_score}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-6 flex justify-end">
        <button
          onClick={onClose}
          className="px-6 py-2 bg-[#8e78b7] text-white rounded-lg hover:bg-[#7d669e] transition-colors duration-200"
        >
          Close
        </button>
      </div>
    </div>
  </div>
);

const Metadata = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [viewMode, setViewMode] = useState('both');
  const [metricsData, setMetricsData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState(null);
  const rowsPerPage = 5;
  const { token, decodedToken } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const scoreResponse = await fetch(`${window._env_?.VITE_FAST_API}/scores/metadata/scorecards`, {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ owner: decodedToken?.preferred_username }),
        });

        if (!scoreResponse.ok) {
          throw new Error('Failed to fetch metadata scores');
        }

        const scoreData = await scoreResponse.json();
        const mappedMetrics = Object.keys(scoreData).map((key) => ({
          icon: "material-symbols:tab-group-outline",
          bgcolor: "bg-[#8d77ba] bg-opacity-25",
          iconcolor: "text-[#8d77ba]",
          title: key,
          count: scoreData[key] === 'N/A' ? 'N/A' : `${scoreData[key]}`
        }));
        setMetricsData(mappedMetrics);

        // Fetch table data
        const tableResponse = await fetch(`${window._env_?.VITE_FAST_API}/scores/metadata/dashboard/table`, {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ owner: decodedToken?.preferred_username }),
        });

        if (!tableResponse.ok) {
          throw new Error('Failed to fetch table data');
        }

        const tableData = await tableResponse.json();
        const mappedTableData = tableData.map((item, index) => ({
          id: (index + 1).toString(),
          connection: item.connection_type,
          database: item.schema.split('.')[0],
          schema: item.schema.split('.')[1] || item.schema,
          overall: `${item.overall_score}%`,
          groups: item.groups,
          lastRun: new Date(item.last_run_date).toLocaleDateString('en-GB')
        }));
        setTableData(mappedTableData);

      } catch (error) {
        setToast({
          show: true,
          message: `Error: ${error.message}`,
          type: 'error',
        });
      } finally {
        setIsLoading(false);
      }

      setTimeout(() => {
        setToast({ show: false, message: '', type: '' });
      }, 3000);
    };

    fetchData();
  }, [token, decodedToken]);

  const handleRefresh = async () => {
    setSearchTerm('');
    setIsLoading(true);

    try {
      // Refresh metadata scores
      const scoreResponse = await fetch(`${window._env_?.VITE_FAST_API}/scores/metadata/scorecards`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ owner: decodedToken?.preferred_username }),
      });

      if (!scoreResponse.ok) {
        throw new Error('Failed to refresh metadata scores');
      }

      const scoreData = await scoreResponse.json();
      const mappedMetrics = Object.keys(scoreData).map((key) => ({
        icon: "material-symbols:tab-group-outline",
        bgcolor: "bg-[#8d77ba] bg-opacity-25",
        iconcolor: "text-[#8d77ba]",
        title: key,
        count: scoreData[key] === 'N/A' ? 'N/A' : `${scoreData[key]}`
      }));
      setMetricsData(mappedMetrics);

      // Refresh table data
      const tableResponse = await fetch(`${window._env_?.VITE_FAST_API}/scores/metadata/dashboard/table`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ owner: decodedToken?.preferred_username }),
      });

      if (!tableResponse.ok) {
        throw new Error('Failed to refresh table data');
      }

      const tableData = await tableResponse.json();
      const mappedTableData = tableData.map((item, index) => ({
        id: (index + 1).toString(),
        connection: item.connection_type,
        database: item.schema.split('.')[0],
        schema: item.schema.split('.')[1] || item.schema,
        overall: `${item.overall_score}%`,
        groups: item.groups,
        lastRun: new Date(item.last_run_date).toLocaleDateString('en-GB')
      }));
      setTableData(mappedTableData);

      setToast({
        show: true,
        message: 'Metadata metrics refreshed successfully',
        type: 'success',
      });
    } catch (error) {
      setToast({
        show: true,
        message: `Error: ${error.message}`,
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }

    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const filteredData = tableData.filter(item =>
    item.connection.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.database.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.schema.toLowerCase().includes(searchTerm.toLowerCase())
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

  return (
    <div className="p-6">
      <style>{rotateAnimation}</style>

      {toast.show && (
        <div className={`fixed top-6 right-6 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 animate-fadeIn ${
          toast.type === 'success' ? 'bg-green-100 text-green-800 border-l-4 border-green-500' :
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
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {selectedGroups && (
        <GroupScoresModal
          groups={selectedGroups}
          onClose={() => setSelectedGroups(null)}
        />
      )}

      <Breadcrumb />

      <div className="flex gap-4 mb-6 items-center justify-between">
        <h1 className="text-2xl font-semibold">Metadata</h1>

        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search metadata"
              className="pl-10 pr-4 py-2 w-[300px] border border-gray-300 rounded-lg focus:outline-none"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>

          <button
            className={`p-1 px-1.5 rounded-lg border ${viewMode === 'list' ? 'bg-gray-100 border-gray-500' : 'border-gray-400'} hover:bg-gray-50`}
            onClick={() => setViewMode(viewMode === 'both' ? 'list' : 'both')}
            title={viewMode === 'both' ? "Hide Card View" : "Show Both Views"}
          >
            <Icon
              icon="material-symbols-light:format-list-bulleted"
              width="24"
              height="24"
              className="text-gray-600"
            />
          </button>

          <button
            className="p-1 px-1.5 rounded-lg border border-gray-400 hover:bg-gray-50"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <Icon
              icon="material-symbols:autorenew-rounded"
              width="24"
              height="24"
              className={`text-gray-600 ${isLoading ? 'icon-rotate' : ''}`}
            />
          </button>
        </div>
      </div>

      {viewMode !== 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          {isLoading ? (
            Array(metricsData.length || 6).fill().map((_, index) => (
              <SkeletonCard key={index} />
            ))
          ) : (
            metricsData.map((metric, index) => (
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
                <p className="text-gray-900 text-2xl font-bold leading-none mt-4">{metric.count}</p>
              </div>
            ))
          )}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#29304a] text-white">
              <th className="text-left p-4 first:rounded-tl-lg">ID</th>
              <th className="text-left p-4">Connection</th>
              <th className="text-left p-4">Database</th>
              <th className="text-left p-4">Schema</th>
              <th className="text-left p-4">Overall</th>
              <th className="text-left p-4 last:rounded-tr-lg flex justify-center items-center">Group Scores</th>
              <th className="text-left p-4 last:rounded-tr-lg">Last run</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array(rowsPerPage).fill().map((_, index) => (
                <SkeletonTableRow key={index} />
              ))
            ) : (
              currentItems.map((item, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium">{item.id}</td>
                  <td className="p-4">
                    <span className="text-[#8e78b7] font-medium">{item.connection}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-[#8e78b7] font-medium">{item.database}</span>
                  </td>
                  <td className="p-4 text-gray-600">{item.schema}</td>
                  <td className="p-4">{item.overall}</td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => setSelectedGroups(item.groups)}
                      className="text-[#8e78b7] hover:text-[#6b5b8d]"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                  </td>
                  <td className="p-4">{item.lastRun}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="flex justify-end items-center px-4 py-3 border-t">
          <div className="flex items-center gap-1">
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 1 || isLoading}
              className={`p-2 rounded-lg ${currentPage === 1 || isLoading ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="flex items-center">
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToPage(index + 1)}
                  disabled={isLoading}
                  className={`px-3 py-1 mx-1 rounded-md ${
                    currentPage === index + 1
                      ? 'bg-[#8e78b7] text-white'
                      : isLoading
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages || isLoading}
              className={`p-2 rounded-lg ${currentPage === totalPages || isLoading ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Metadata;