import React, { useState, useEffect, useRef } from 'react';
import { Plus, RefreshCcw, Search, MoreHorizontal, Pencil, Trash2, RotateCw, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Icon } from "@iconify-icon/react";
import { useNavigate } from "react-router-dom";
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

function Transformation() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [viewMode, setViewMode] = useState('both');
  const rowsPerPage = 5;

  const metricsData = [
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#8d77ba] bg-opacity-25",
      iconcolor: "text-[#8d77ba]",
      title: "Total",
      count: "40"
    },
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#8d77ba] bg-opacity-25",
      iconcolor: "text-[#8d77ba]",
      title: "Successful",
      count: "26"
    },
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#8d77ba] bg-opacity-25",
      iconcolor: "text-[#8d77ba]",
      title: "Failed",
      count: "7"
    },
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#8d77ba] bg-opacity-25",
      iconcolor: "text-[#8d77ba]",
      title: "Average Duration",
      count: "16"
    },
  ];

  const transformationData = [
    {
      id: '1',
      name: 'U12',
      desc: 'ABC',
      created: '1/1/25',
      updated: '1/1/25',
      owner: 'xyz',
      sourceRecords: '300',
      targetRecords: '200',
      duration: '27',
      status: 'active'
    },
    {
      id: '2',
      name: 'W23',
      desc: 'DEF',
      created: '3/3/25',
      updated: '10/3/25',
      owner: 'ccc',
      sourceRecords: '170',
      targetRecords: '22',
      duration: '05',
      status: 'active'
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
        message: 'Transformation data refreshed successfully',
        type: 'success'
      });

      setTimeout(() => {
        setToast({ show: false, message: '', type: '' });
      }, 3000);
    }, 1000);
  };

  const filteredData = transformationData.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.owner.toLowerCase().includes(searchTerm.toLowerCase())
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

  const MovementChart = () => {
    const chartData = [
      { day: '1', total: 20, success: 15, failed: 4 },
      { day: '2', total: 25, success: 19, failed: 6 },
      { day: '3', total: 28, success: 22, failed: 6 },
      { day: '4', total: 32, success: 26, failed: 6 },
      { day: '5', total: 30, success: 24, failed: 6 },
      { day: '6', total: 35, success: 28, failed: 7 },
      { day: '7', total: 33, success: 26, failed: 7 }
    ];

    const colors = {
      total: '#ff5555',
      success: '#55aa55',
      failed: '#5555aa'
    };

    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Icon icon="material-symbols:trending-up" className="w-5 h-5 text-[#8d77ba]" />
          <h3 className="text-lg font-semibold text-gray-800">Movement</h3>
        </div>

        <div className="relative h-64 mb-4">
          <svg className="w-full h-full" viewBox="0 0 400 200">
            {[30, 25, 20, 15, 10, 5].map((value, index) => (
              <g key={value}>
                <text x="15" y={30 + index * 25} className="text-xs fill-gray-500" textAnchor="middle">
                  {value}
                </text>
                <line x1="25" y1={30 + index * 25} x2="370" y2={30 + index * 25} stroke="#f0f0f0" strokeWidth="1" />
              </g>
            ))}

            {chartData.map((item, index) => (
              <text key={index} x={50 + index * 50} y="190" className="text-xs fill-gray-500" textAnchor="middle">
                {item.day}
              </text>
            ))}

            <polyline
              points={chartData.map((item, index) => `${50 + index * 50},${180 - (item.total * 5)}`).join(' ')}
              fill="none"
              stroke={colors.total}
              strokeWidth="2"
            />
            {chartData.map((item, index) => (
              <circle
                key={`total-${index}`}
                cx={50 + index * 50}
                cy={180 - (item.total * 5)}
                r="3"
                fill={colors.total}
              />
            ))}

            <polyline
              points={chartData.map((item, index) => `${50 + index * 50},${180 - (item.success * 5)}`).join(' ')}
              fill="none"
              stroke={colors.success}
              strokeWidth="2"
            />
            {chartData.map((item, index) => (
              <circle
                key={`success-${index}`}
                cx={50 + index * 50}
                cy={180 - (item.success * 5)}
                r="3"
                fill={colors.success}
              />
            ))}

            <polyline
              points={chartData.map((item, index) => `${50 + index * 50},${180 - (item.failed * 5)}`).join(' ')}
              fill="none"
              stroke={colors.failed}
              strokeWidth="2"
            />
            {chartData.map((item, index) => (
              <circle
                key={`failed-${index}`}
                cx={50 + index * 50}
                cy={180 - (item.failed * 5)}
                r="3"
                fill={colors.failed}
              />
            ))}
          </svg>
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.total }}></div>
            <span className="text-gray-600">Total</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.success }}></div>
            <span className="text-gray-600">Success</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.failed }}></div>
            <span className="text-gray-600">Failed</span>
          </div>
        </div>
      </div>
    );
  };

  const LastTransformations = () => {
    const lastTransformations = [
      { id: 1, name: 'Transformation 1' },
      { id: 2, name: 'Transformation 2' },
      { id: 3, name: 'Transformation 3' },
      { id: 4, name: 'Transformation 4' },
      { id: 5, name: 'Transformation 5' }
    ];

    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Icon icon="material-symbols:history" className="w-5 h-5 text-[#8d77ba]" />
          <h3 className="text-lg font-semibold text-gray-800">Last 5 Transformations</h3>
        </div>

        <div className="space-y-2">
          {lastTransformations.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-700 text-sm">{item.id}</span>
            </div>
          ))}
        </div>
      </div>
    );
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

      <Breadcrumb title="Platform" link={"/"} />

      <div className="flex gap-4 mb-6 items-center justify-between">
        <h1 className="text-2xl font-semibold">Transformation</h1>

        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search transformations"
              className="pl-10 pr-4 py-2 w-[300px] border border-gray-300 rounded-lg focus:outline-none"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>

          <button
            className={`p-1 px-1.5 rounded-lg border ${viewMode === 'list' ? 'bg-gray-100 border-gray-500' : 'border-gray-400'} hover:bg-gray-50`}
            onClick={() => setViewMode(viewMode === 'list' ? 'both' : 'list')}
            title={viewMode === 'list' ? "Show All Views" : "Show List Only"}
          >
            <Icon
              icon="material-symbols-light:format-list-bulleted"
              width="24"
              height="24"
              className="text-[#8d77ba]"
            />
          </button>

          <button
            className="p-1 px-1.5 rounded-lg border border-gray-400 hover:bg-gray-50"
            title="Download"
          >
            <Icon
              icon="material-symbols:download"
              width="24"
              height="24"
              className="text-[#8d77ba]"
            />
          </button>

          <button
            onClick={() => navigate('/transformation/studio')}
            className="px-4 py-2 rounded-lg bg-[#8d77ba] text-white flex items-center gap-2 hover:bg-opacity-90"
          >
            <Icon
              icon="material-symbols:add"
              width="20"
              height="20"
              className="text-white"
            />
            <span>Create</span>
          </button>
        </div>
      </div>

      {viewMode !== 'list' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                <p className={`text-gray-900 text-3xl font-bold leading-none ${
                  metric.title === 'Total' ? 'text-gray-700' :
                  metric.title === 'Successful' ? 'text-gray-700' :
                  metric.title === 'Failed' ? 'text-gray-700' : 'text-gray-700'
                }`}>{metric.count}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <MovementChart />
            <LastTransformations />
          </div>
        </>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden mt-4 mb-6">
        <table className="w-full">
          <thead>
            <tr className="bg-[#29304a] text-white">
              <th className="text-left p-4">ID</th>
              <th className="text-left p-4">Name</th>
              <th className="text-left p-4">Desc</th>
              <th className="text-left p-4">Created</th>
              <th className="text-left p-4">Updated</th>
              <th className="text-left p-4">Owner</th>
              <th className="text-left p-4">Source Records</th>
              <th className="text-left p-4">Target Records</th>
              <th className="text-left p-4">Duration (in mins)</th>
              <th className="text-left p-4">Quick Action</th>
              <th className="text-left p-4">Select All</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((item, index) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="p-4 font-medium">{item.id}</td>
                <td className="p-4 text-[#8e78b7] font-medium">{item.name}</td>
                <td className="p-4">{item.desc}</td>
                <td className="p-4">{item.created}</td>
                <td className="p-4">{item.updated}</td>
                <td className="p-4">{item.owner}</td>
                <td className="p-4">{item.sourceRecords}</td>
                <td className="p-4">{item.targetRecords}</td>
                <td className="p-4">{item.duration}</td>
                <td className="p-4">
                  <div className="flex items-center gap-1">
                    <button className="p-1 rounded hover:bg-gray-100">
                      <Icon icon="material-symbols:play-arrow" className="w-5 h-5 text-gray-600" />
                    </button>
                    <button className="p-1 rounded hover:bg-gray-100">
                      <Icon icon="material-symbols:edit-outline" className="w-5 h-5 text-gray-600" />
                    </button>
                    <button className="p-1 rounded hover:bg-gray-100">
                      <Icon icon="material-symbols:content-copy-outline" className="w-5 h-5 text-gray-600" />
                    </button>
                    <button className="p-1 rounded hover:bg-gray-100">
                      <Icon icon="material-symbols:info-outline" className="w-5 h-5 text-gray-600" />
                    </button>
                    <button className="p-1 rounded hover:bg-gray-100">
                      <Icon icon="material-symbols:delete-outline" className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </td>
                <td className="p-4">
                  <input type="checkbox" className="rounded text-[#8e78b7]" />
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

    </div>
  );
}

export default Transformation;