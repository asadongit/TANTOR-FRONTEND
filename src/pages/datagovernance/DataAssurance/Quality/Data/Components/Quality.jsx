import React, { useState, useEffect } from 'react';
import { Icon } from "@iconify-icon/react";
import { Search, RefreshCcw, ChevronLeft, ChevronRight, X } from 'lucide-react';

function Quality() {
  // State for API data (Overall Data Quality)
  const [overallQualityData, setOverallQualityData] = useState({
    Overall: 0,
    Accuracy: 0,
    Consistency: 0,
    Completeness: 0,
    Validity: 0,
    Uniqueness: 0
  });

  // Static values for Selected Dataset Quality
  const [datasetQualityData] = useState({
    Overall: 87.5,
    Accuracy: 92.3,
    Consistency: 85.7,
    Completeness: 89.2,
    Validity: 91.0,
    Uniqueness: 88.6
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
        const response = await fetch(`${window._env_?.VITE_FAST_API}/scores/data/scorecards`);
        const data = await response.json();
        setOverallQualityData(data);
      } catch (error) {
        console.error('Error fetching quality data:', error);
        setToast({
          show: true,
          message: 'Failed to fetch quality data',
          type: 'error'
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (viewMode === 'overall') {
      fetchOverallQualityData();
    }
  }, [viewMode]);

  const handleRefresh = () => {
    if (viewMode === 'overall') {
      setIsLoading(true);
      fetch(`${window._env_?.VITE_FAST_API}/scores/data/scorecards`)
        .then(response => response.json())
        .then(data => {
          setOverallQualityData(data);
          setIsLoading(false);
          setToast({
            show: true,
            message: 'Quality data refreshed',
            type: 'success'
          });
        })
        .catch(error => {
          console.error('Error:', error);
          setIsLoading(false);
        });
    } else {
      setToast({
        show: true,
        message: 'Dataset quality data is static',
        type: 'info'
      });
    }
    setTimeout(() => setToast({ show: false }), 3000);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleToggle = () => {
    setViewMode(prev => prev === 'dataset' ? 'overall' : 'dataset');
  };

  // Prepare metrics data based on current view mode
  const metricsData = [
    {
      title: "Overall", count: viewMode === 'dataset'
        ? `${datasetQualityData.Overall.toFixed(1)}%`
        : `${overallQualityData.Overall.toFixed(1)}%`
    },
    {
      title: "Accuracy", count: viewMode === 'dataset'
        ? `${datasetQualityData.Accuracy.toFixed(1)}%`
        : `${overallQualityData.Accuracy.toFixed(1)}%`
    },
    {
      title: "Consistency", count: viewMode === 'dataset'
        ? `${datasetQualityData.Consistency.toFixed(1)}%`
        : `${overallQualityData.Consistency.toFixed(1)}%`
    },
    {
      title: "Completeness", count: viewMode === 'dataset'
        ? `${datasetQualityData.Completeness.toFixed(1)}%`
        : `${overallQualityData.Completeness.toFixed(1)}%`
    },
    {
      title: "Validity", count: viewMode === 'dataset'
        ? `${datasetQualityData.Validity.toFixed(1)}%`
        : `${overallQualityData.Validity.toFixed(1)}%`
    },
    {
      title: "Uniqueness", count: viewMode === 'dataset'
        ? `${datasetQualityData.Uniqueness.toFixed(1)}%`
        : `${overallQualityData.Uniqueness.toFixed(1)}%`
    }
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
      lastRun: '24/10/2024'
    },
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
      lastRun: '24/10/2024'
    },
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
      lastRun: '24/10/2024'
    },
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
      lastRun: '24/10/2024'
    },
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
      lastRun: '24/10/2024'
    }
  ].filter(item =>
    item.connection.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.database.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.schema.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(sampleAssuranceData.length / rowsPerPage);
  const currentItems = sampleAssuranceData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="">
      {toast.show && (
        <div className={`fixed top-6 right-6 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 ${toast.type === 'success' ? 'bg-green-100 text-green-800' :
            toast.type === 'error' ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
          }`}>
          <Icon
            icon={
              toast.type === 'success' ? 'mdi:check-circle' :
                toast.type === 'error' ? 'mdi:alert-circle' :
                  'mdi:information'
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
        <h2 className="text-xl font-semibold text-gray-800">Quality</h2>

        <div className="flex items-center gap-4">
          {viewMode === 'overall' && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8d77ba]"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                <RefreshCcw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${viewMode === 'dataset' ? 'text-[#8d77ba]' : 'text-gray-500'
              }`}>
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
            <span className={`text-sm font-medium ${viewMode === 'overall' ? 'text-[#8d77ba]' : 'text-gray-500'
              }`}>
              Overall
            </span>
          </div>

        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        {metricsData.map((metric, index) => (
          <div
            key={index}
            className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-10 h-10 bg-[#8d77ba] bg-opacity-25 rounded-full text-[#8d77ba]">
                <Icon icon="material-symbols:tab-group-outline" className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-medium text-gray-700">{metric.title}</h3>
            </div>
            <p className="text-gray-900 text-3xl font-bold">{metric.count}</p>
          </div>
        ))}
      </div>

      {viewMode === 'dataset' && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Dataset Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div><strong>Connection:</strong> Oracle</div>
            <div><strong>Database:</strong> HR_PROD</div>
            <div><strong>Schema:</strong> EMPLOYEES</div>
            <div><strong>Dataset:</strong> SALARY_DATA</div>
            <div><strong>Query:</strong> SELECT * FROM employees.salaries</div>
            <div><strong>Type:</strong> Table</div>
          </div>
        </div>
      )}

      {viewMode === 'overall' && (
        <>
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
                {currentItems.map((item, index) => (
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

            {/* Pagination */}
            <div className="flex justify-between items-center px-4 py-3 border-t">
              <div className="text-sm text-gray-600">
                Showing {Math.min((currentPage - 1) * rowsPerPage + 1, sampleAssuranceData.length)} to{' '}
                {Math.min(currentPage * rowsPerPage, sampleAssuranceData.length)} of{' '}
                {sampleAssuranceData.length} entries
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg ${currentPage === 1 ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
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
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg ${currentPage === totalPages ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Quality;