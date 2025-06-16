import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, MoreHorizontal, Pencil, Trash2, RotateCw, X, ChevronLeft, ChevronRight, Play, Edit, RefreshCw } from 'lucide-react';
import { Icon } from "@iconify-icon/react";
import Breadcrumb from '../../../../../components/Breadcrumb';
import { useNavigate } from 'react-router-dom';


const Rules = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [viewMode, setViewMode] = useState('both');
  const rowsPerPage = 5;
  const navigate = useNavigate();

  const metricsData = [
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#8d77ba] bg-opacity-25",
      iconcolor: "text-[#8d77ba]",
      title: "Overall",
      count: "90%"
    },
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#8d77ba] bg-opacity-25",
      iconcolor: "text-[#8d77ba]",
      title: "Accuracy",
      count: "92%"
    },
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#8d77ba] bg-opacity-25",
      iconcolor: "text-[#8d77ba]",
      title: "Consistency",
      count: "86%"
    },
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#8d77ba] bg-opacity-25",
      iconcolor: "text-[#8d77ba]",
      title: "Completeness",
      count: "94%"
    },
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#8d77ba] bg-opacity-25",
      iconcolor: "text-[#8d77ba]",
      title: "Validity",
      count: "88%"
    },
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#8d77ba] bg-opacity-25",
      iconcolor: "text-[#8d77ba]",
      title: "Uniqueness",
      count: "90%"
    }
  ];

  const tableData = [
    {
      category: 'pre build',
      type: 'metadata',
      group: 'uniqueness',
      name: 'abcd',
      severity: 'High',
      status: 'Active',
      created_date: '24/10/2024',
      updated_date: '24/10/2024',
      last_run: '24/10/2024'
    },
    {
      category: 'custom',
      type: 'data',
      group: 'completeness',
      name: 'rule_xyz',
      severity: 'Medium',
      status: 'Inactive',
      created_date: '20/10/2024',
      updated_date: '22/10/2024',
      last_run: '23/10/2024'
    },
    {
      category: 'pre build',
      type: 'data',
      group: 'validity',
      name: 'rule_123',
      severity: 'Low',
      status: 'Active',
      created_date: '15/10/2024',
      updated_date: '16/10/2024',
      last_run: '20/10/2024'
    },
    {
      category: 'custom',
      type: 'data',
      group: 'accuracy',
      name: 'check_values',
      severity: 'High',
      status: 'Active',
      created_date: '10/10/2024',
      updated_date: '12/10/2024',
      last_run: '18/10/2024'
    },
    {
      category: 'pre build',
      type: 'metadata',
      group: 'consistency',
      name: 'format_check',
      severity: 'Medium',
      status: 'Active',
      created_date: '05/10/2024',
      updated_date: '07/10/2024',
      last_run: '15/10/2024'
    }
  ];

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleCreateRule = () => {
    navigate('/datagovernance/data-assurance/rules/create');
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

  const handleActionClick = (action, item, index) => {
    console.log(`${action} action for item at index ${index}:`, item);
  };

  return (
    <div className="p-6">

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
            <p className="text-gray-900 text-3xl font-bold leading-none">{metric.count}</p>
          </div>
        ))}
      </div>

      {(viewMode === 'list' || viewMode === 'both') && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#29304a] text-white">
                <th className="text-left p-4 first:rounded-tl-lg">ID</th>
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
                  <td className="p-4 font-medium">{indexOfFirstItem + index + 1}</td>
                  <td className="p-4 text-gray-600">{item.category}</td>
                  <td className="p-4 text-gray-600">{item.type}</td>
                  <td className="p-4 text-[#8e78b7] font-medium">{item.group}</td>
                  <td className="p-4 text-[#8e78b7] font-medium">{item.name}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.severity === 'High' ? 'bg-red-100 text-red-700' :
                      item.severity === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {item.severity}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.status === 'Active' ? 'bg-green-100 text-green-700' :
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
                      <button
                        onClick={() => handleActionClick('Play', item, index)}
                        className="p-1.5 hover:bg-[#8e78b7] hover:bg-opacity-10 rounded-full"
                        title="Run Rule"
                      >
                        <Play className="h-4 w-4 text-[#8e78b7]" />
                      </button>
                      <button
                        onClick={() => handleActionClick('Edit', item, index)}
                        className="p-1.5 hover:bg-blue-100 rounded-full"
                        title="Edit Rule"
                      >
                        <Pencil className="h-4 w-4 text-[#8e78b7]" />
                      </button>
                      <button
                        onClick={() => handleActionClick('Refresh', item, index)}
                        className="p-1.5 hover:bg-green-100 rounded-full"
                        title="Refresh Rule"
                      >
                        <RefreshCw className="h-4 w-4 text-[#8e78b7]" />
                      </button>
                      <button
                        onClick={() => handleActionClick('Delete', item, index)}
                        className="p-1.5 hover:bg-red-100 rounded-full"
                        title="Delete Rule"
                      >
                        <Trash2 className="h-4 w-4 text-[#8e78b7]" />
                      </button>
                    </div>
                  </td>
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
      )}


    </div>
  );
};

export default Rules;