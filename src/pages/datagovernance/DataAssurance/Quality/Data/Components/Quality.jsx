import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify-icon/react';
import { Search, RefreshCcw, ChevronLeft, ChevronRight, X, Eye } from 'lucide-react';
import { useAuth } from '../../../../../../context/AuthContext.jsx';

const GroupScoresModal = ({ groups, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-md w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Group Scores</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="max-h-64 overflow-y-auto mt -4">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-3">Group Name</th>
              <th className="text-left p-3">Average Score</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group, index) => (
              <tr key={index} className="border-b">
                <td className="p-3">{group.group_name}</td>
                <td className="p-3">{group.average_score}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

function Quality({ query }) {
  const selectedQuery = query;
  const { token, decodedToken } = useAuth();
  const [overallQualityData, setOverallQualityData] = useState({});
  const [datasetQualityData, setDatasetQualityData] = useState({
    group_scores: {
      Overall: 'N/A',
      Accuracy: 'N/A',
      Consistency: 'N/A',
      Completeness: 'N/A',
      Validity: 'N/A',
      Uniqueness: 'N/A',
    },
    connection_details: {
      connection: 'N/A',
      database: 'N/A',
      schema: 'N/A',
      table: 'N/A',
    },
  });
  const [tableData, setTableData] = useState([]);
  const [viewMode, setViewMode] = useState('dataset');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [selectedGroups, setSelectedGroups] = useState(null);
  const rowsPerPage = 5;

  useEffect(() => {
    const fetchOverallQualityData = async () => {
      setIsLoading(true);
      try {
        const scoreResponse = await fetch(`${window._env_?.VITE_FAST_API}/scores/data/scorecards`, {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ owner: decodedToken?.preferred_username }),
        });
        if (!scoreResponse.ok) throw new Error('Failed to fetch overall quality data');
        const scoreData = await scoreResponse.json();
        setOverallQualityData(scoreData);

        const tableResponse = await fetch(`${window._env_?.VITE_FAST_API}/scores/data/dashboard/table`, {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ owner: decodedToken?.preferred_username }),
        });
        if (!tableResponse.ok) throw new Error('Failed to fetch table data');
        const tableData = await tableResponse.json();
        const mappedTableData = tableData.map((item, index) => {
          const tableParts = item.table.split('.');
          return {
            id: `#${(index + 1).toString().padStart(2, '0')}`,
            connection: item.connection_type,
            database: tableParts[0],
            schema: tableParts[1],
            dataset: tableParts[2],
            overall: `${item.overall_score}%`,
            groups: item.groups,
            lastRun: item.last_run_date ? new Date(item.last_run_date).toLocaleDateString('en-GB') : 'N/A',
          };
        });
        setTableData(mappedTableData);
      } catch (error) {
        console.error('Error fetching overall quality data:', error);
        setToast({
          show: true,
          message: 'Failed to fetch overall quality data',
          type: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    };

    const fetchDatasetQualityData = async () => {
      if (!selectedQuery || selectedQuery.trim() === '') {
        setDatasetQualityData({
          group_scores: {
            Overall: 'N/A',
            Accuracy: 'N/A',
            Consistency: 'N/A',
            Completeness: 'N/A',
            Validity: 'N/A',
            Uniqueness: 'N/A',
          },
          connection_details: {
            connection: 'N/A',
            database: 'N/A',
            schema: 'N/A',
            table: 'N/A',
          },
        });
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`${window._env_?.VITE_FAST_API}/scores/data/overview`, {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            query: selectedQuery,
            owner: decodedToken?.preferred_username,
          }),
        });
        if (!response.ok) throw new Error('Failed to fetch dataset quality data');
        const data = await response.json();
        setDatasetQualityData(data);
      } catch (error) {
        console.error('Error fetching dataset quality data:', error);
        setToast({
          show: true,
          message: 'Failed to fetch dataset quality data',
          type: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (viewMode === 'overall') {
      fetchOverallQualityData();
    } else {
      fetchDatasetQualityData();
    }
  }, [viewMode, selectedQuery, token, decodedToken]);

  const handleRefresh = async () => {
    if (viewMode === 'overall') {
      setIsLoading(true);
      try {
        const scoreResponse = await fetch(`${window._env_?.VITE_FAST_API}/scores/data/scorecards`, {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ owner: decodedToken?.preferred_username }),
        });
        if (!scoreResponse.ok) throw new Error('Failed to refresh overall quality data');
        const scoreData = await scoreResponse.json();
        setOverallQualityData(scoreData);

        const tableResponse = await fetch(`${window._env_?.VITE_FAST_API}/scores/data/dashboard/table`, {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ owner: decodedToken?.preferred_username }),
        });
        if (!tableResponse.ok) throw new Error('Failed to refresh table data');
        const tableData = await tableResponse.json();
        const mappedTableData = tableData.map((item, index) => {
          const tableParts = item.table.split('.');
          return {
            id: `#${(index + 1).toString().padStart(2, '0')}`,
            connection: item.connection_type,
            database: tableParts[0],
            schema: tableParts[1],
            dataset: tableParts[2],
            overall: `${item.overall_score}%`,
            groups: item.groups,
            lastRun: item.last_run_date ? new Date(item.last_run_date).toLocaleDateString('en-GB') : 'N/A',
          };
        });
        setTableData(mappedTableData);

        setToast({
          show: true,
          message: 'Overall quality data refreshed',
          type: 'success',
        });
      } catch (error) {
        console.error('Error:', error);
        setToast({
          show: true,
          message: 'Failed to refresh overall quality data',
          type: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(true);
      try {
        const response = await fetch(`${window._env_?.VITE_FAST_API}/scores/data/overview`, {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            query: selectedQuery,
            owner: decodedToken?.preferred_username,
          }),
        });
        if (!response.ok) throw new Error('Failed to refresh dataset quality data');
        const data = await response.json();
        setDatasetQualityData(data);
        setToast({
          show: true,
          message: 'Dataset quality data refreshed',
          type: 'success',
        });
      } catch (error) {
        console.error('Error:', error);
        setToast({
          show: true,
          message: 'Failed to refresh dataset quality data',
          type: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    }
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleToggle = () => {
    setViewMode((prev) => (prev === 'dataset' ? 'overall' : 'dataset'));
  };

  const metricsData = viewMode === 'dataset'
    ? Object.keys(datasetQualityData.group_scores).map((key) => ({
      title: key,
      count: datasetQualityData.group_scores[key],
    }))
    : Object.keys(overallQualityData).map((key) => ({
      title: key,
      count: typeof overallQualityData[key] === 'number'
        ? `${overallQualityData[key].toFixed(1)}`
        : overallQualityData[key],
    }));

  const filteredData = tableData.filter(
    (item) =>
      item.connection.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.database.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.schema.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.dataset.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const currentItems = filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const SkeletonCard = () => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
        <div className="h-4 w-24 bg-gray-200 rounded"></div>
      </div>
      <div className="h-8 w-16 bg-gray-200 rounded"></div>
    </div>
  );

  const SkeletonTableRow = () => (
    <tr className="border-b animate-pulse">
      <td className="p-4"><div className="h-4 w-12 bg-gray-200 rounded"></div></td>
      <td className="p-4"><div className="h-4 w-24 bg-gray-200 rounded"></div></td>
      <td className="p-4"><div className="h-4 w-24 bg-gray-200 rounded"></div></td>
      <td className="p-4"><div className="h-4 w-24 bg-gray-200 rounded"></div></td>
      <td className="p-4"><div className="h-4 w-24 bg-gray-200 rounded"></div></td>
      <td className="p-4"><div className="h-4 w-16 bg-gray-200 rounded"></div></td>
      <td className="p-4"><div className="h-4 w-24 bg-gray-200 rounded"></div></td>
      <td className="p-4"><div className="h-4 w-24 bg-gray-200 rounded"></div></td>
    </tr>
  );

  return (
    <div>
      {toast.show && (
        <div
          className={`fixed top-6 right-6 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 ${toast.type === 'success'
            ? 'bg-green-100 text-green-800'
            : toast.type === 'error'
              ? 'bg-red-100 text-red-800'
              : 'bg-blue-100 text-blue-800'
            }`}
        >
          <Icon
            icon={
              toast.type === 'success'
                ? 'mdi:check-circle'
                : toast.type === 'error'
                  ? 'mdi:alert-circle'
                  : 'mdi:information'
            }
            className="h-5 w-5"
          />
          <p>{toast.message}</p>
          <button onClick={() => setToast({ show: false, message: '', type: '' })} className="ml-2">
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

      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Quality</h2>

        <div className="flex items-center gap-4">
          {viewMode === 'overall' && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search data..."
                  className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8d77ba] transition-all"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="p-2 rounded-lg bg-[#8d77ba] text-white hover:bg-[#7b66a6] transition-colors disabled:opacity-50"
              >
                <RefreshCcw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-medium ${viewMode === 'dataset' ? 'text-[#8d77ba]' : 'text-gray-500'}`}
            >
              Dataset
            </span>
            <button
              onClick={handleToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${viewMode === 'overall' ? 'bg-[#8d77ba]' : 'bg-gray-300'
                }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${viewMode === 'overall' ? 'translate-x-6' : 'translate-x-1'
                  }`}
              />
            </button>
            <span
              className={`text-sm font-medium ${viewMode === 'overall' ? 'text-[#8d77ba]' : 'text-gray-500'}`}
            >
              Overall
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {isLoading
          ? Array(Object.keys(viewMode === 'dataset' ? datasetQualityData.group_scores : overallQualityData).length)
            .fill()
            .map((_, index) => <SkeletonCard key={index} />)
          : metricsData.map((metric, index) => (
            <div
              key={index}
              className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-10 h-10 bg-[#8d77ba] bg-opacity-25 rounded-full text-[#8d77ba]">
                  <Icon icon="material-symbols:tab-group-outline" className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-medium text-gray-700">{metric.title}</h3>
              </div>
              <p className="text-gray-900 text-2xl font-bold">
                {typeof metric.count === 'string' && metric.count.toLowerCase() === 'n/a' ? metric.count : `${metric.count}%`}
              </p>
            </div>
          ))}
      </div>

      {viewMode === 'dataset' && (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
            Dataset Information
          </h3>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 animate-pulse">
              {Array(6)
                .fill()
                .map((_, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
                    <div>
                      <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 w-48 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="flex items-start gap-4">
                <Icon icon="mdi:connection" className="h-5 w-5 text-[#8d77ba] mt-1" />
                <div>
                  <p className="text-gray-800 font-medium">Connection</p>
                  <p className="text-gray-500">{datasetQualityData.connection_details.connection}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Icon icon="mdi:database" className="h-5 w-5 text-[#8d77ba] mt-1" />
                <div>
                  <p className="text-gray-800 font-medium">Database</p>
                  <p className="text-gray-500">{datasetQualityData.connection_details.database}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Icon icon="mdi:database-outline" className="h-5 w-5 text-[#8d77ba] mt-1" />
                <div>
                  <p className="text-gray-800 font-medium">Schema</p>
                  <p className="text-gray-500">{datasetQualityData.connection_details.schema}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Icon icon="mdi:table" className="h-5 w-5 text-[#8d77ba] mt-1" />
                <div>
                  <p className="text-gray-800 font-medium">Dataset</p>
                  <p className="text-gray-500">{datasetQualityData.connection_details.table}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Icon icon="mdi:code-brackets" className="h-5 w-5 text-[#8d77ba] mt-1" />
                <div>
                  <p className="text-gray-800 font-medium">Query</p>
                  <p className="text-gray-500 truncate max-w-sm"
                    title={selectedQuery || 'No query selected'}>
                    {selectedQuery || 'No query selected'}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Icon icon="mdi:information-outline" className="h-5 w-5 text-[#8d77ba] mt-1" />
                <div>
                  <p className="text-gray-800 font-medium">Type</p>
                  <p className="text-gray-500">Query</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {viewMode === 'overall' && (
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <table className="w-full">
            <thead>
              <tr className="bg-[#29304a] text-white">
                <th className="text-left p-4">ID</th>
                <th className="text-left p-4">Connection</th>
                <th className="text-left p-4">Database</th>
                <th className="text-left p-4">Schema</th>
                <th className="text-left p-4">Dataset</th>
                <th className="text-left p-4">Overall</th>
                <th className="text-left p-4 flex justify-center items-center">Group Scores</th>
                <th className="text-left p-4">Last Run</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array(rowsPerPage)
                  .fill()
                  .map((_, index) => <SkeletonTableRow key={index} />)
                : currentItems.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium">{item.id}</td>
                    <td className="p-4 text-[#8e78b7] font-medium">{item.connection}</td>
                    <td className="p-4 text-[#8e78b7] font-medium">{item.database}</td>
                    <td className="p-4 text-gray-600">{item.schema}</td>
                    <td className="p-4 text-gray-600">{item.dataset}</td>
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
                ))}
            </tbody>
          </table>

          <div className="flex justify-between items-center px-4 py-3 border-t">
            <div className="text-sm text-gray-600">
              Showing {Math.min((currentPage - 1) * rowsPerPage + 1, filteredData.length)} to{' '}
              {Math.min(currentPage * rowsPerPage, filteredData.length)} of{' '}
              {filteredData.length} entries
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg ${currentPage === 1 ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded-md ${currentPage === page ? 'bg-[#8d77ba] text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg ${currentPage === totalPages ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Quality;