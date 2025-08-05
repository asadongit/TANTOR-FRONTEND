import React, { useCallback, useEffect, useState } from 'react';
import { Search, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown, RefreshCcw, ArrowUpRight, Download } from 'lucide-react';
import Breadcrumb from '../../../components/Breadcrumb.jsx';
import { useNavigate } from 'react-router-dom';


const SkeletonRow = () => (
  <tr className="border-b animate-pulse">
    <td className="p-4"><div className="h-4 bg-gray-200 rounded w-1/2"></div></td>
    <td className="p-4"><div className="h-4 bg-gray-200 rounded w-3/4"></div></td>
    <td className="p-4"><div className="h-4 bg-gray-200 rounded w-full"></div></td>
    <td className="p-4"><div className="h-4 bg-gray-200 rounded w-1/3"></div></td>
    <td className="p-4"><div className="h-4 bg-gray-200 rounded w-2/3"></div></td>
    <td className="p-4"><div className="h-4 bg-gray-200 rounded w-1/2"></div></td>
    <td className="p-4">
      <div className="flex items-center">
        <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
      </div>
    </td>
  </tr>
);


const BusinessGlossary = () => {
  const [glossaryData, setGlossaryData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const rowsPerPage = 10;

  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${window._env_?.VITE_FAST_API}/business_glossary/homepage`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const formattedData = data.map(item => ({
        id: `${item.id}`,
        Name: item.name,
        Description: item.description || 'N/A',
        status: item.status,
        Domain: item.domain_name,
        AssetType: item.asset_type,
      }));
      setGlossaryData(formattedData);
    } catch (e) {
      console.error("Failed to fetch business glossary data:", e);
      setError('Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleSort = (key) => {
    setSortConfig(prev => {
      if (prev.key === key && prev.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return { key, direction: 'asc' };
    });
    setCurrentPage(1);
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="h-4 w-4 inline-block ml-1 opacity-50" />;
    }
    return sortConfig.direction === 'asc'
      ? <ArrowUp className="h-4 w-4 inline-block ml-1" />
      : <ArrowDown className="h-4 w-4 inline-block ml-1" />;
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: "px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full",
      approved: "px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full",
      pending: "px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full",
      failed: "px-2 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full",
    };
    return <span className={styles[status?.toLowerCase()] || "px-2 py-1 text-xs font-medium text-gray-800 bg-gray-100 rounded-full"}>{status}</span>;
  };

  const filteredData = glossaryData
    .filter(item =>
      Object.values(item).some(val =>
        val.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      let aValue = a[sortConfig.key] || '';
      let bValue = b[sortConfig.key] || '';

      if (sortConfig.key === 'id') {
        aValue = parseInt(aValue, 10) || 0;
        bValue = parseInt(bValue, 10) || 0;
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return sortConfig.direction === 'asc'
        ? aValue.toString().localeCompare(bValue.toString())
        : bValue.toString().localeCompare(aValue.toString());
    });

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const goToPreviousPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1) };
  const goToNextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1) };

  const handleViewDetails = (item) => {
    const urlFriendlyName = item.Name.toLowerCase().replace(/\s+/g, '-');
    navigate(`/datagovernance/business-catalogue/glossary/${urlFriendlyName}`);
  };

  const renderTableBody = () => {
    if (isLoading) {
      return Array.from({ length: rowsPerPage }).map((_, index) => (
        <SkeletonRow key={index} />
      ));
    }

    if (glossaryData.length === 0 && !error) {
      return (
        <tr>
          <td colSpan="7" className="text-center p-8 text-gray-500">
            No data available.
          </td>
        </tr>
      );
    }

    if (currentItems.length > 0) {
      return currentItems.map((item, index) => (
        <tr key={index} className="border-b hover:bg-gray-50">
          <td className="p-3 text-gray-700">{indexOfFirstItem + index + 1}</td>
          <td className="p-3 font-medium text-gray-900">{item.Name}</td>
          <td className="p-3 text-gray-600 max-w-xs truncate">{item.Description}</td>
          <td className="p-3">{getStatusBadge(item.status)}</td>
          <td className="p-3 text-gray-600">{item.Domain}</td>
          <td className="p-3 text-gray-600">{item.AssetType}</td>
          <td className="p-3 items-center">
            <button
              className="p-1.5 hover:bg-[#8e78b7] hover:bg-opacity-10 rounded-full transition-colors"
              title="View Details"
              onClick={() => handleViewDetails(item)}
            >
              <ArrowUpRight className="h-5 w-5 text-[#8e78b7]" />
            </button>
          </td>
        </tr>
      ));
    }

    return (
      <tr>
        <td colSpan="7" className="text-center p-8 text-gray-500">
          No results found for your search.
        </td>
      </tr>
    );
  };

    const handleDownload = () => {
      if (filteredData.length === 0) {
        return; 
      }

      const dataToExport = filteredData.map((item, index) => ({
        s_no: index + 1,
        Name: item.Name,
        Description: item.Description,
        status: item.status,
        Domain: item.Domain,
        AssetType: item.AssetType,
      }));

      const exportColumns = [
        { key: 's_no', label: 'S.No.' },
        { key: 'Name', label: 'Name' },
        { key: 'Description', label: 'Description' },
        { key: 'status', label: 'Status' },
        { key: 'Domain', label: 'Domain' },
        { key: 'AssetType', label: 'Asset Type' },
      ];

      const escapeCSV = (value) => {
        const str = String(value ?? '');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const header = exportColumns.map(c => c.label).join(',');
      const rows = dataToExport.map(row =>
        exportColumns.map(c => escapeCSV(row[c.key])).join(',')
      );
      const csvContent = [header, ...rows].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      const today = new Date().toISOString().slice(0, 10);
      link.setAttribute('download', `business-glossary_${today}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Breadcrumb />

      <div className="flex flex-wrap gap-4 mb-6 items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Business Glossary</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search Glossary..."
              className="pl-10 pr-4 py-2 w-full sm:w-[300px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8e78b7]"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
          <button
            onClick={handleDownload}
            disabled={filteredData.length === 0}
            className="text-black border border-gray-300 shadow-sm hover:bg-gray-100 focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-3 py-2.5 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download as CSV"
          >
            <Download className="h-5 w-5" />
          </button>
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="text-black border border-gray-300 shadow-sm hover:bg-gray-100 focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-3 py-2.5 flex items-center justify-center dark:bg-white dark:hover:bg-gray-50 focus:outline-none dark:focus:ring-[#8e78b7] disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCcw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
      }

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#29304a] text-white">
                {['id', 'Name', 'Description', 'status', 'Domain', 'AssetType'].map(key => (
                  <th key={key} className="text-left p-4 cursor-pointer hover:bg-[#3a4563] whitespace-nowrap" onClick={() => handleSort(key)}>
                    <span className="inline-flex items-center">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str?.toUpperCase())} {getSortIcon(key)}
                    </span>
                  </th>
                ))}
                <th className="text-left p-4 whitespace-nowrap">
                  <span className="inline-flex items-center">Quick Action</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {renderTableBody()}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap justify-between items-center px-4 py-3 border-t">
          <span className="text-sm text-gray-600 mb-2 sm:mb-0">
            Showing {filteredData.length > 0 ? indexOfFirstItem + 1 : 0} to {Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length} results
          </span>
          <div className="flex items-center gap-1">
            <button onClick={goToPreviousPage} disabled={currentPage === 1 || isLoading} className="p-2 rounded-lg disabled:text-gray-300 disabled:cursor-not-allowed text-gray-600 hover:bg-gray-100">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm text-gray-600 px-2">
              Page {currentPage} of {totalPages > 0 ? totalPages : 1}
            </span>
            <button onClick={goToNextPage} disabled={currentPage === totalPages || isLoading} className="p-2 rounded-lg disabled:text-gray-300 disabled:cursor-not-allowed text-gray-600 hover:bg-gray-100">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessGlossary;