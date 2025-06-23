import React, { useState, useEffect, useRef } from 'react';
import { Plus, RefreshCcw, Search, MoreHorizontal, Pencil, Trash2, RotateCw, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Icon } from "@iconify-icon/react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import Breadcrumb from '../../../components/Breadcrumb';
import { useAuth } from '../../../context/AuthContext';

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
  const [transformationData, setTransformationData] = useState([]);
  const [dashboardData, setDashboardData] = useState({
    cards: { total: 0, success: 0, failed: 0, average_duration: 0 },
    last5transformations: [],
    movementgraph: []
  });
  const {project, decodedToken, token} = useAuth()
  const rowsPerPage = 5;

  const hostname = import.meta.env.VITE_FAST_API;

  const metricsData = [
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#8d77ba] bg-opacity-25",
      iconcolor: "text-[#8d77ba]",
      title: "Total",
      count: dashboardData.cards.total
    },
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#8d77ba] bg-opacity-25",
      iconcolor: "text-[#8d77ba]",
      title: "Successful",
      count: dashboardData.cards.success
    },
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#8d77ba] bg-opacity-25",
      iconcolor: "text-[#8d77ba]",
      title: "Failed",
      count: dashboardData.cards.failed
    },
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#8d77ba] bg-opacity-25",
      iconcolor: "text-[#8d77ba]",
      title: "Average Duration",
      count: dashboardData.cards.average_duration
    }
  ];


  useEffect(() => {
    fetchTransformationData();
    fetchDashboardData();
  }, [project, decodedToken]);

  const fetchTransformationData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${hostname}/etl/transformation/tableview?project=${project}&created_by=${decodedToken.preferred_username}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setTransformationData(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching transformation data:", error);
      setToast({
        show: true,
        message: 'Failed to fetch transformation data',
        type: 'error'
      });
      setIsLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(
        `${hostname}/etl/dashboarddata?project=${project}&created_by=${decodedToken.preferred_username}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setDashboardData(response.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setToast({
        show: true,
        message: 'Failed to fetch dashboard data',
        type: 'error'
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleRefresh = async () => {
    setSearchTerm('');
    setIsLoading(true);

    try {
      await fetchTransformationData();
      await fetchDashboardData();
      setToast({
        show: true,
        message: 'Transformation data refreshed successfully',
        type: 'success'
      });
    } catch (error) {
      setToast({
        show: true,
        message: 'Failed to refresh transformation data',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setToast({ show: false, message: '', type: '' });
      }, 3000);
    }
  };

  const filteredData = transformationData.filter(item =>
    item.transformation_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.created_by && item.created_by.toLowerCase().includes(searchTerm.toLowerCase()))
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
    const chartData = dashboardData.movementgraph || [];

    const colors = {
      total: '#ff5555',
      success: '#55aa55',
      failed: '#5555aa'
    };

    if (!chartData.length) {
      return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Icon icon="material-symbols:trending-up" className="w-5 h-5 text-[#8d77ba]" />
            <h3 className="text-lg font-semibold text-gray-800">Movement</h3>
          </div>
          <div className="h-64 flex items-center justify-center">
            <p className="text-gray-500">No movement data available</p>
          </div>
        </div>
      );
    }

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
                {new Date(item.date).getDate()}
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
    const lastTransformations = dashboardData.last5transformations || [];

    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Icon icon="material-symbols:history" className="w-5 h-5 text-[#8d77ba]" />
          <h3 className="text-lg font-semibold text-gray-800">Last 5 Transformations</h3>
        </div>

        <div className="space-y-2">
          {lastTransformations.length > 0 ? (
            lastTransformations.map((name, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-700 text-sm">{name}</span>
              </div>
            ))
          ) : (
            <div className="py-2 text-center text-gray-500">
              No transformation history available
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleTriggerETL = async (workflowName) => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${hostname}/etl/manualtrigger/${workflowName}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      if (response.status === 200) {
        setToast({
          show: true,
          message: 'ETL Job in progress',
          type: 'success'
        });
      }
    } catch (error) {
      console.error("Error triggering ETL job:", error);
      setToast({
        show: true,
        message: 'Failed to trigger ETL job',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setToast({ show: false, message: '', type: '' });
      }, 3000);
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
            className="p-1 px-1.5 rounded-lg border border-gray-400 hover:bg-gray-50"
            onClick={handleRefresh}
            title="Refresh data"
            disabled={isLoading}
          >
            <RefreshCcw className={`h-5 w-5 text-gray-600 ${isLoading ? 'icon-rotate' : ''}`} />
          </button>

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
        {isLoading ? (
          <div className="flex justify-center items-center p-10">
            <RotateCw className="h-8 w-8 text-gray-400 icon-rotate" />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-[#29304a] text-white">
              <th className="text-left p-4">ID</th>
                <th className="text-left p-4">Name</th>
                <th className="text-left p-4">Description</th>
                <th className="text-left p-4">Created</th>
                <th className="text-left p-4">Updated</th>
                <th className="text-left p-4">Owner</th>
                <th className="text-left p-4">Status</th>
                <th className='text-left p-4'>Source Records</th>
                <th className='text-left p-4'>Target Records</th>
                <th className='text-left p-4'>Duration</th>
                <th className="text-left p-4">Quick Action</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((item, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium">{indexOfFirstItem + index + 1}</td>
                  <td className="p-4 font-medium">

                    <span
                      title={item.transformation_name}
                      style={{ cursor: item.transformation_name.length > 18 ? 'pointer' : 'default' }}
                    >
                      {item.transformation_name.length > 18
                        ? item.transformation_name.slice(0, 18) + '...'
                        : item.transformation_name}
                    </span>
                  </td>
                  <td className="p-4">{item.description || "-"}</td>
                  <td className="p-4">{formatDate(item.created_at)}</td>
                  <td className="p-4">{formatDate(item.updated_at)}</td>
                  <td className="p-4">{item.created_by || "-"}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.status === 'creating' ? 'bg-blue-100 text-blue-800' :
                      item.status === 'active' ? 'bg-green-100 text-green-800' :
                      item.status === 'failed' ? 'bg-red-100 text-red-800' :
                      item.status === 'Ready to run' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {item.status || "unknown"}
                    </span>
                  </td>
                  <td className="p-4">{item.source_count || "-"}</td>
                  <td className="p-4">{item.target_count || "-"}</td>
                  <td className="p-4">{item.duration || "-"}</td>



                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <button
                        className={`p-1 rounded ${item.status === 'Ready to run' ? 'hover:bg-gray-100' : 'opacity-50 cursor-not-allowed'}`}
                        disabled={item.status !== 'Ready to run'}
                        onClick={() => item.status === 'Ready to run' && handleTriggerETL(item.transformation_name)}
                      >
                        <Icon icon="material-symbols:play-arrow" className={`w-5 h-5 ${item.status === 'Ready to run' ? 'text-gray-600' : 'text-gray-400'}`} />
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
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="flex justify-end items-center px-4 py-3 border-t">
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <span className="text-sm text-gray-600">Page</span>
            <select
              value={currentPage}
              onChange={e => goToPage(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none"
            >
              {[...Array(totalPages)].map((_, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {idx + 1}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-600">of {totalPages}</span>

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