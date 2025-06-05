import React, { useState, useEffect, useRef } from 'react';
import { Plus, RefreshCcw, Search, MoreHorizontal, Pencil, Trash2, RotateCw, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Icon } from "@iconify-icon/react";
import Breadcrumb from '../../../components/Breadcrumb';

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

const DataAssurance = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const rowsPerPage = 10;

  const metricsData = [
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#16ABC2] bg-opacity-25",
      iconcolor: "text-cyan-700",
      title: "Overall",
      count: "90%"
    },
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#16ABC2] bg-opacity-25",
      iconcolor: "text-cyan-700",
      title: "Accuracy",
      count: "92%"
    },
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#16ABC2] bg-opacity-25",
      iconcolor: "text-cyan-700",
      title: "Consistency",
      count: "86%"
    },
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#16ABC2] bg-opacity-25",
      iconcolor: "text-cyan-700",
      title: "Completeness",
      count: "94%"
    },
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#16ABC2] bg-opacity-25",
      iconcolor: "text-cyan-700",
      title: "Validity",
      count: "88%"
    },
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#16ABC2] bg-opacity-25",
      iconcolor: "text-cyan-700",
      title: "Uniqueness",
      count: "90%"
    }
  ];

  const assuranceData = [
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
  ];

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleRefresh = async () => {
    setSearchTerm('');
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setToast({
        show: true,
        message: 'Data assurance metrics refreshed successfully',
        type: 'success'
      });

      setTimeout(() => {
        setToast({ show: false, message: '', type: '' });
      }, 3000);
    }, 1000);
  };

  const filteredData = assuranceData.filter(item =>
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

  const handleClickOutside = () => {
    setActiveMenu(null);
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

      <Breadcrumb />

      <div className="flex gap-4 mb-6 items-center justify-between">
        <h1 className="text-2xl font-semibold">Data Assurance</h1>

        <div className="flex items-center gap-4 ml-auto">
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
            className="p-2.5 rounded-lg bg-gray-100 disabled:opacity-50"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCcw className={`h-5 w-5 ${isLoading ? 'icon-rotate' : ''}`} />
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
            <p className="text-gray-900 text-3xl font-bold leading-none">{metric.count}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#29304a] text-white">
              <th className="text-left p-4 first:rounded-tl-lg">ID</th>
              <th className="text-left p-4">Connection</th>
              <th className="text-left p-4">Database</th>
              <th className="text-left p-4">Schema</th>
              <th className="text-left p-4">Overall</th>
              <th className="text-left p-4">Accuracy</th>
              <th className="text-left p-4">Validity</th>
              <th className="text-left p-4">Uniqueness</th>
              <th className="text-left p-4">Completeness</th>
              <th className="text-left p-4 last:rounded-tr-lg">Last run</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((item, index) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="p-4 font-medium">{item.id}</td>
                <td className="p-4">
                  <span className="text-[#8e78b7] font-medium">{item.connection}</span>
                </td>
                <td className="p-4">
                  <span className="text-[#8e78b7] font-medium">{item.database}</span>
                </td>
                <td className="p-4 text-gray-600">{item.schema}</td>
                <td className="p-4 ">{item.overall}</td>
                <td className="p-4 ">{item.accuracy}</td>
                <td className="p-4 ">{item.validity}</td>
                <td className="p-4 ">{item.uniqueness}</td>
                <td className="p-4 ">{item.completeness}</td>
                <td className="p-4">{item.lastRun}</td>
              </tr>
            ))}
          </tbody>
        </table>

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
                  className={`px-3 py-1 mx-1 rounded-md ${
                    currentPage === index + 1
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
    </div>
  );
};

export default DataAssurance;