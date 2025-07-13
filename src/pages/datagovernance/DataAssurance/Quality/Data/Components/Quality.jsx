import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify-icon/react';
import { Search, RefreshCcw, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useAuth } from '../../../../../../context/AuthContext.jsx';

function Quality({query}) {
  const selectedQuery = query;
  const { token, decodedToken } = useAuth();
  const [overallQualityData, setOverallQualityData] = useState({
    Overall: 0,
    Accuracy: 0,
    Consistency: 0,
    Completeness: 0,
    Validity: 0,
    Uniqueness: 0,
  });

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

  const [viewMode, setViewMode] = useState('dataset');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const rowsPerPage = 5;

  useEffect(() => {
    const fetchOverallQualityData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_FAST_API}/scores/data/scorecards`, {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ owner: decodedToken?.preferred_username }),
        });
        if (!response.ok) throw new Error('Failed to fetch overall quality data');
        const data = await response.json();
        setOverallQualityData(data);
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
        const response = await fetch(`${import.meta.env.VITE_FAST_API}/scores/data/overview`, {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            query: selectedQuery,
            owner: decodedToken?.preferred_username || 'sabhyata02',
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

  const handleRefresh = () => {
    if (viewMode === 'overall') {
      setIsLoading(true);
      fetch(`${import.meta.env.VITE_FAST_API}/scores/data/scorecards`, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => {
          if (!response.ok) throw new Error('Failed to refresh overall quality data');
          return response.json();
        })
        .then((data) => {
          setOverallQualityData(data);
          setIsLoading(false);
          setToast({
            show: true,
            message: 'Overall quality data refreshed',
            type: 'success',
          });
        })
        .catch((error) => {
          console.error('Error:', error);
          setIsLoading(false);
          setToast({
            show: true,
            message: 'Failed to refresh overall quality data',
            type: 'error',
          });
        });
    } else {
      setIsLoading(true);
      fetch(`${import.meta.env.VITE_FAST_API}/scores/data/overview`, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: selectedQuery,
          owner: decodedToken?.preferred_username || 'sabhyata02',
        }),
      })
        .then((response) => {
          if (!response.ok) throw new Error('Failed to refresh dataset quality data');
          return response.json();
        })
        .then((data) => {
          setDatasetQualityData(data);
          setIsLoading(false);
          setToast({
            show: true,
            message: 'Dataset quality data refreshed',
            type: 'success',
          });
        })
        .catch((error) => {
          console.error('Error:', error);
          setIsLoading(false);
          setToast({
            show: true,
            message: 'Failed to refresh dataset quality data',
            type: 'error',
          });
        });
    }
    setTimeout(() => setToast({ show: false }), 3000);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleToggle = () => {
    setViewMode((prev) => (prev === 'dataset' ? 'overall' : 'dataset'));
  };

  const metricsData = [
    {
      title: 'Overall',
      count:
        viewMode === 'dataset'
          ? datasetQualityData.group_scores.Overall
          : typeof overallQualityData.Overall === 'number'
            ? `${overallQualityData.Overall.toFixed(1)}%`
            : overallQualityData.Overall,
    },
    {
      title: 'Accuracy',
      count:
        viewMode === 'dataset'
          ? datasetQualityData.group_scores.Accuracy
          : typeof overallQualityData.Accuracy === 'number'
            ? `${overallQualityData.Accuracy.toFixed(1)}%`
            : overallQualityData.Accuracy,
    },
    {
      title: 'Consistency',
      count:
        viewMode === 'dataset'
          ? datasetQualityData.group_scores.Consistency
          : typeof overallQualityData.Consistency === 'number'
            ? `${overallQualityData.Consistency.toFixed(1)}%`
            : overallQualityData.Consistency,
    },
    {
      title: 'Completeness',
      count:
        viewMode === 'dataset'
          ? datasetQualityData.group_scores.Completeness
          : typeof overallQualityData.Completeness === 'number'
            ? `${overallQualityData.Completeness.toFixed(1)}%`
            : overallQualityData.Completeness,
    },
    {
      title: 'Validity',
      count:
        viewMode === 'dataset'
          ? datasetQualityData.group_scores.Validity
          : typeof overallQualityData.Validity === 'number'
            ? `${overallQualityData.Validity.toFixed(1)}%`
            : overallQualityData.Validity,
    },
    {
      title: 'Uniqueness',
      count:
        viewMode === 'dataset'
          ? datasetQualityData.group_scores.Uniqueness
          : typeof overallQualityData.Uniqueness === 'number'
            ? `${overallQualityData.Uniqueness.toFixed(1)}%`
            : overallQualityData.Uniqueness,
    },
  ];

  const sampleAssuranceData = [
    {
      id: '#01',
      connection: 'Oracle',
      database: 'Oracle',
      schema: 'Oracle_1',
      overall: '97%',
      accuracy: '99%',
      validity: '99%',
      uniqueness: '99%',
      completeness: '98%',
      lastRun: '24/10/2024',
    },
    {
      id: '#02',
      connection: 'Oracle',
      database: 'Oracle',
      schema: 'Oracle_1',
      overall: '97%',
      accuracy: '99%',
      validity: '99%',
      uniqueness: '99%',
      completeness: '98%',
      lastRun: '24/10/2024',
    },
    {
      id: '#03',
      connection: 'Oracle',
      database: 'Oracle',
      schema: 'Oracle_1',
      overall: '97%',
      accuracy: '99%',
      validity: '99%',
      uniqueness: '99%',
      completeness: '98%',
      lastRun: '24/10/2024',
    },
    {
      id: '#04',
      connection: 'Oracle',
      database: 'Oracle',
      schema: 'Oracle_1',
      overall: '97%',
      accuracy: '99%',
      validity: '99%',
      uniqueness: '99%',
      completeness: '98%',
      lastRun: '24/10/2024',
    },
    {
      id: '#05',
      connection: 'Oracle',
      database: 'Oracle',
      schema: 'Oracle_1',
      overall: '97%',
      accuracy: '99%',
      validity: '99%',
      uniqueness: '99%',
      completeness: '98%',
      lastRun: '24/10/2024',
    },
  ].filter(
    (item) =>
      item.connection.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.database.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.schema.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(sampleAssuranceData.length / rowsPerPage);
  const currentItems = sampleAssuranceData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

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
      <td className="p-4"><div className="h-4 w-16 bg-gray-200 rounded"></div></td>
      <td className="p-4"><div className="h-4 w-16 bg-gray-200 rounded"></div></td>
      <td className="p-4"><div className="h-4 w-16 bg-gray-200 rounded"></div></td>
      <td className="p-4"><div className="h-4 w-16 bg-gray-200 rounded"></div></td>
      <td className="p-4"><div className="h-4 w-16 bg-gray-200 rounded"></div></td>
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
          <button onClick={() => setToast({ show: false })} className="ml-2">
            <X className="h-4 w-4" />
          </button>
        </div>
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
                  placeholder="Search connections..."
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
          ? Array(6)
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
              <p className="text-gray-900 text-2xl font-bold">{metric.count}</p>
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
                <th className="text-left p-4">Overall</th>
                <th className="text-left p-4">Accuracy</th>
                <th className="text-left p-4">Validity</th>
                <th className="text-left p-4">Uniqueness</th>
                <th className="text-left p-4">Completeness</th>
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
                    <td className="p-4">{item.overall}</td>
                    <td className="p-4">{item.accuracy}</td>
                    <td className="p-4">{item.validity}</td>
                    <td className="p-4">{item.uniqueness}</td>
                    <td className="p-4">{item.completeness}</td>
                    <td className="p-4">{item.lastRun}</td>
                  </tr>
                ))}
            </tbody>
          </table>

          <div className="flex justify-between items-center px-4 py-3 border-t">
            <div className="text-sm text-gray-600">
              Showing {Math.min((currentPage - 1) * rowsPerPage + 1, sampleAssuranceData.length)} to{' '}
              {Math.min(currentPage * rowsPerPage, sampleAssuranceData.length)} of{' '}
              {sampleAssuranceData.length} entries
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