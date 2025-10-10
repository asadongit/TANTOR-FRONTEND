import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, ChevronLeft, ChevronRight, Search, ArrowUpDown, ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';
import toast from "react-hot-toast";
import GenerateReportPanel from './GenerateReportPanel';
import { useAuth } from '../../../context/AuthContext';
import Breadcrumb from '../../../components/Breadcrumb';

const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) => {
  if (!totalItems || totalPages <= 1) return null;
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  return (
    <div className="flex justify-between items-center px-4 py-3 border-t">
      <span className="text-sm text-gray-600">
        Showing <span className="font-semibold">{startItem}</span> to <span className="font-semibold">{endItem}</span> of <span className="font-semibold">{totalItems}</span> results
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg disabled:text-gray-300 disabled:cursor-not-allowed text-gray-600 hover:bg-gray-100"
          title="Back"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg disabled:text-gray-300 disabled:cursor-not-allowed text-gray-600 hover:bg-gray-100"
          title="Next"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

const TableRowSkeleton = () => (
  <tr className="border-b animate-pulse">
    {Array.from({ length: 7 }).map((_, i) => (
      <td key={i} className="p-3">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
      </td>
    ))}
  </tr>
);

const PaginationSkeleton = () => (
  <div className="flex justify-between items-center px-4 py-3 border-t animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-48"></div>
    <div className="flex items-center gap-2">
      <div className="p-2 rounded-lg bg-gray-200 h-9 w-9"></div>
      <div className="h-4 bg-gray-200 rounded w-24"></div>
      <div className="p-2 rounded-lg bg-gray-200 h-9 w-9"></div>
    </div>
  </div>
);

const Reports = () => {
  const { token, decodedToken } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [refreshing, setRefreshing] = useState(false);
  const itemsPerPage = 10;
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const userId = decodedToken?.preferred_username;
      if (!userId) {
        throw new Error('User ID not found');
      }

      const response = await fetch(`${window._env_?.VITE_FAST_API}/listReport?user_id=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch reports: ${response.statusText}`);
      }

      const data = await response.json();
      setReports(data.reports || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setSearchQuery('');
    setSortConfig({ key: null, direction: null });
    const toastId = toast.loading('Refreshing reports...');

    try {
      const userId = decodedToken?.preferred_username;
      if (!userId) {
        throw new Error('User ID not found');
      }

      const response = await fetch(`${window._env_?.VITE_FAST_API}/listReport?user_id=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch reports: ${response.statusText}`);
      }

      const data = await response.json();
      setReports(data.reports || []);
      setError(null);
      setCurrentPage(1);
      toast.success('Reports refreshed successfully!', { id: toastId });
    } catch (error) {
      console.error('Error refreshing reports:', error);
      setError(error.message);
      toast.error('Failed to refresh reports', { id: toastId });
    } finally {
      setRefreshing(false);
    }
  };

  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="h-4 w-4 ml-1 inline" />;
    }
    return sortConfig.direction === 'asc'
      ? <ArrowUp className="h-4 w-4 ml-1 inline" />
      : <ArrowDown className="h-4 w-4 ml-1 inline" />;
  };

  const filteredReports = reports.filter(report => {
    const searchLower = searchQuery.toLowerCase();
    return (
      report.ref_number?.toLowerCase().includes(searchLower) ||
      report.report_name?.toLowerCase().includes(searchLower) ||
      report.status?.toLowerCase().includes(searchLower) ||
      report.remarks?.toLowerCase().includes(searchLower) ||
      formatDateTime(report.report_date_time).toLowerCase().includes(searchLower)
    );
  });

  const sortedReports = [...filteredReports].sort((a, b) => {
    if (!sortConfig.key) return 0;

    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];

    if (sortConfig.key === 'report_date_time') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    } else {
      aValue = String(aValue || '').toLowerCase();
      bValue = String(bValue || '').toLowerCase();
    }

    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const totalPages = Math.ceil(sortedReports.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentReports = sortedReports.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleDownload = async (fileUrl, reportName) => {
    const toastId = toast.loading('Downloading report...');

    try {
      const response = await fetch(`${window._env_?.VITE_FAST_API}/downloadReport`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ path: fileUrl })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `Failed to download report: ${response.statusText}`);
      }

      const blob = await response.blob();

      let filename = reportName || 'report';
      if (!filename.toLowerCase().endsWith('.xlsx')) {
        filename += '.xlsx';
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Report downloaded successfully!', { id: toastId });
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error(error.message || 'Failed to download report. Please try again.', { id: toastId });
    }
  };

  const getStatusBadge = (status) => {
    const lowerStatus = status?.toLowerCase();
    let styles = "px-2 py-1 text-xs font-medium rounded-full ";
    switch (lowerStatus) {
      case 'completed':
        styles += "text-green-800 bg-green-100";
        break;
      case 'pending':
      case 'in progress':
        styles += "text-yellow-800 bg-yellow-100";
        break;
      case 'failed':
        styles += "text-red-800 bg-red-100";
        break;
      default:
        styles += "text-gray-800 bg-gray-100";
        break;
    }
    return <span className={styles}>{status}</span>;
  };

  const handleGenerateReportSuccess = () => {
    fetchReports();
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <Breadcrumb />
      <div className="mb-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Reports</h1>
            <p className="text-gray-600 mt-2">Generate and view data governance reports and analytics.</p>
          </div>
          {/* Search Bar and Refresh Button */}
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              title="Refresh"
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className={`p-2.5 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-wait ${refreshing || loading ? '' : 'hover:bg-gray-100'
                }`}
            >
              <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#8e78b7] text-white rounded-lg hover:bg-[#7a67a0] transition-colors shadow-sm"
              title="Generate Report" >
              <span>Generate Report</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        {loading ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-800 text-white">
                  <tr>
                    <th className="text-left p-3 font-semibold tracking-wider">S.No</th>
                    <th className="text-left p-3 font-semibold tracking-wider">Reference Number</th>
                    <th className="text-left p-3 font-semibold tracking-wider">Report Name</th>
                    <th className="text-left p-3 font-semibold tracking-wider">Date & Time</th>
                    <th className="text-left p-3 font-semibold tracking-wider">Status</th>
                    <th className="text-left p-3 font-semibold tracking-wider">Remarks</th>
                    <th className="text-left p-3 font-semibold tracking-wider">Download</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} />)}
                </tbody>
              </table>
            </div>
            <PaginationSkeleton />
          </>
        ) : error ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <p className="text-gray-900 font-medium">Error loading reports</p>
              <p className="text-gray-600 mt-1">{error}</p>
              <button
                onClick={fetchReports}
                className="mt-4 px-4 py-2 bg-[#8e78b7] text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </div>
        ) : reports.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No reports available</p>
            </div>
          </div>
        ) : sortedReports.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No reports match your search</p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-3 text-blue-600 hover:text-blue-700 text-sm"
              >
                Clear search
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-800 text-white">
                  <tr>
                    <th className="text-left p-3 font-semibold tracking-wider">S.No</th>
                    <th
                      className="text-left p-3 font-semibold tracking-wider cursor-pointer hover:bg-gray-700 transition-colors"
                      onClick={() => handleSort('ref_number')}
                    >
                      Reference Number {getSortIcon('ref_number')}
                    </th>
                    <th
                      className="text-left p-3 font-semibold tracking-wider cursor-pointer hover:bg-gray-700 transition-colors"
                      onClick={() => handleSort('report_name')}
                    >
                      Report Name {getSortIcon('report_name')}
                    </th>
                    <th
                      className="text-left p-3 font-semibold tracking-wider cursor-pointer hover:bg-gray-700 transition-colors"
                      onClick={() => handleSort('report_date_time')}
                    >
                      Date {getSortIcon('report_date_time')}
                    </th>
                    <th
                      className="text-left p-3 font-semibold tracking-wider cursor-pointer hover:bg-gray-700 transition-colors"
                      onClick={() => handleSort('status')}
                    >
                      Status {getSortIcon('status')}
                    </th>
                    <th
                      className="text-left p-3 font-semibold tracking-wider cursor-pointer hover:bg-gray-700 transition-colors"
                      onClick={() => handleSort('remarks')}
                    >
                      Remarks {getSortIcon('remarks')}
                    </th>
                    <th className="text-left p-3 font-semibold tracking-wider">Download</th>
                  </tr>
                </thead>
                <tbody>
                  {currentReports.map((report, index) => (
                    <tr key={report.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-3 text-gray-700 font-medium">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      <td className="p-3 text-gray-600">{report.ref_number}</td>
                      <td className="p-3 text-gray-600">{report.report_name}</td>
                      <td className="p-3 text-gray-600">{formatDateTime(report.report_date_time)}</td>
                      <td className="p-3">{getStatusBadge(report.status)}</td>
                      <td className="p-3 text-gray-600">{report.remarks}</td>
                      <td className="p-3">
                        <button
                          onClick={() => handleDownload(report.file_url, report.ref_number)}
                          disabled={report.status?.toLowerCase() !== 'completed'}
                          className={`inline-flex items-center p-2 rounded-lg transition-colors ${report.status?.toLowerCase() === 'completed'
                            ? 'text-green-600 hover:bg-green-700 hover:text-white cursor-pointer'
                            : 'text-gray-400 cursor-not-allowed opacity-50'
                            }`}
                          title={report.status?.toLowerCase() === 'completed' ? 'Download Report' : 'Report not available'}
                        >
                          <FileSpreadsheet className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalItems={sortedReports.length}
              itemsPerPage={itemsPerPage}
            />
          </>
        )}
      </div>

      <GenerateReportPanel
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        token={token}
        onReportGenerated={handleGenerateReportSuccess}
      />
    </div>
  );
};

export default Reports;