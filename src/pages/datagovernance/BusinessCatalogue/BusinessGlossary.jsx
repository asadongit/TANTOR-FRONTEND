import React, { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown, List, RefreshCcw, Plus, ArrowUpRight } from 'lucide-react';
import { Icon } from "@iconify-icon/react";
import Breadcrumb from '../../../components/Breadcrumb.jsx';
import { useNavigate } from 'react-router-dom';


const BusinessGlossary = () => {

  const tableData = [
    { id: '#1', Name: 'Account Data', Description: 'Category1', status: 'Approved', Domain: 'Healthcare', AssetType: 'Term' },
    { id: '#2', Name: 'Account Holder', Description: 'Category1', status: 'Approved', Domain: 'Healthcare', AssetType: 'Cateogory' },
    { id: '#3', Name: 'Audit Trail', Description: 'Category1', status: 'Approved', Domain: 'Healthcare', AssetType: 'Subcategory' },
  ];

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('both');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const rowsPerPage = 5;

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
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
      Completed: "px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full",
      Pending: "px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full",
      Failed: "px-2 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full",
    };
    return <span className={styles[status] || "px-2 py-1 text-xs font-medium text-gray-800 bg-gray-100 rounded-full"}>{status}</span>;
  };

  const filteredData = tableData
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
        aValue = parseInt(aValue.replace('#', ''), 10) || 0;
        bValue = parseInt(bValue.replace('#', ''), 10) || 0;
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return sortConfig.direction === 'asc'
        ? aValue.toString().localeCompare(bValue.toString())
        : bValue.toString().localeCompare(aValue.toString());
    });

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  // *** LINES ADDED BACK IN ***
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;

  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const goToPage = (pageNumber) => setCurrentPage(pageNumber);
  const goToPreviousPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1) };
  const goToNextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1) };

  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const handleViewDetails = (item) => {
    const urlFriendlyName = item.Name.toLowerCase().replace(/\s+/g, '-');
    navigate(`/datagovernance/business-catalogue/glossary/${urlFriendlyName}`);
  };

  return (
    <div className="p-6">
      <Breadcrumb />

      <div className="flex gap-4 mb-6 items-center justify-between">
        <h1 className="text-2xl font-semibold">Business Glossary</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search Gloassary..."
              className="pl-10 pr-4 py-2 w-[300px] border border-gray-300 rounded-lg focus:outline-none"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          <button
            disabled={isLoading}
            className="text-black border border-gray-300 shadow-lg hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-3 py-2.5 me-2 dark:bg-[#ffffff] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
          >
            <RefreshCcw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#29304a] text-white">
                <th className="text-left p-4 cursor-pointer hover:bg-[#3a4563]" onClick={() => handleSort('id')}>
                  <span className="inline-flex items-center">ID {getSortIcon('id')}</span>
                </th>
                <th className="text-left p-4 cursor-pointer hover:bg-[#3a4563]" onClick={() => handleSort('Name')}>
                  <span className="inline-flex items-center">Name {getSortIcon('Name')}</span>
                </th>
                <th className="text-left p-4 cursor-pointer hover:bg-[#3a4563]" onClick={() => handleSort('Description')}>
                  <span className="inline-flex items-center">Description {getSortIcon('Description')}</span>
                </th>
                <th className="text-left p-4 cursor-pointer hover:bg-[#3a4563]" onClick={() => handleSort('status')}>
                  <span className="inline-flex items-center">status  {getSortIcon('status')}</span>
                </th>
                <th className="text-left p-4 cursor-pointer hover:bg-[#3a4563]" onClick={() => handleSort('Domain')}>
                  <span className="inline-flex items-center">Domain {getSortIcon('Domain')}</span>
                </th>
                <th className="text-left p-4 cursor-pointer hover:bg-[#3a4563]" onClick={() => handleSort('AssetType')}>
                  <span className="inline-flex items-center">Asset Type {getSortIcon('AssetType')}</span>
                </th>
                <th className="text-left p-4 cursor-pointer hover:bg-[#3a4563]">
                  <span className="inline-flex items-center">Quick Action</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((item, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="p-4">{item.id}</td>
                  <td className="p-4">{item.Name}</td>
                  <td className="p-4">{item.Description}</td>
                  <td className="p-4">{item.status}</td>
                  <td className="p-4">{item.Domain}</td>
                  <td className="p-4">{item.AssetType}</td>
                  <td className="p-4 items-center">
                    <button
                      className="p-1.5 hover:bg-[#8e78b7] hover:bg-opacity-10 rounded-full"
                      title="View Details"
                      onClick={() => handleViewDetails(item)}
                    >
                      <ArrowUpRight className="h-5 w-5 text-[#8e78b7]" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center px-4 py-3 border-t">
          <span className="text-sm text-gray-600">
            Showing {filteredData.length > 0 ? indexOfFirstItem + 1 : 0} to {Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length} results
          </span>
          <div className="flex items-center gap-1">
            <button onClick={goToPreviousPage} disabled={currentPage === 1} className="p-2 rounded-lg disabled:text-gray-300 disabled:cursor-not-allowed text-gray-600 hover:bg-gray-100">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages > 0 ? totalPages : 1}
            </span>
            <button onClick={goToNextPage} disabled={currentPage === totalPages} className="p-2 rounded-lg disabled:text-gray-300 disabled:cursor-not-allowed text-gray-600 hover:bg-gray-100">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessGlossary;