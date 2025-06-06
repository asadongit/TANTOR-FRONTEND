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
  const [viewMode, setViewMode] = useState('both');
  const rowsPerPage = 5;

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

  const ScoreMovement = () => {
    const chartData = [
      { day: '1 day', Connection: 20, Migration: 15, Purge: 12, Pipelines: 10, Transformations: 18 },
      { day: '2 day', Connection: 25, Migration: 8, Purge: 18, Pipelines: 12, Transformations: 20 },
      { day: '3 day', Connection: 22, Migration: 15, Purge: 10, Pipelines: 8, Transformations: 23 },
      { day: '4 day', Connection: 27, Migration: 12, Purge: 18, Pipelines: 22, Transformations: 23 },
      { day: '5 day', Connection: 26, Migration: 10, Purge: 14, Pipelines: 24, Transformations: 20 },
      { day: '6 day', Connection: 24, Migration: 9, Purge: 14, Pipelines: 18, Transformations: 25 },
      { day: '7 day', Connection: 20, Migration: 17, Purge: 17, Pipelines: 14, Transformations: 26 }
    ];

    const colors = {
      Connection: '#ff9999',
      Migration: '#9999ff',
      Purge: '#66cccc',
      Pipelines: '#99cc99',
      Transformations: '#ffcc66'
    };

    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Icon icon="material-symbols:trending-up" className="w-5 h-5 text-[#8d77ba]" />
          <h3 className="text-lg font-semibold text-gray-800">Score movement</h3>
        </div>

        <div className="relative h-64 mb-4">
          <svg className="w-full h-full" viewBox="0 0 400 200">
            {/* Y-axis labels */}
            {[30, 25, 20, 15, 10, 5].map((value, index) => (
              <g key={value}>
                <text x="15" y={30 + index * 25} className="text-xs fill-gray-500" textAnchor="middle">
                  {value}
                </text>
                <line x1="25" y1={30 + index * 25} x2="370" y2={30 + index * 25} stroke="#f0f0f0" strokeWidth="1" />
              </g>
            ))}

            {/* X-axis labels */}
            {chartData.map((item, index) => (
              <text key={index} x={50 + index * 50} y="190" className="text-xs fill-gray-500" textAnchor="middle">
                {item.day}
              </text>
            ))}

            {/* Data lines */}
            {Object.keys(colors).map((key) => {
              const points = chartData.map((item, index) => {
                const x = 50 + index * 50;
                const y = 180 - (item[key] * 5);
                return `${x},${y}`;
              }).join(' ');

              return (
                <g key={key}>
                  <polyline
                    points={points}
                    fill="none"
                    stroke={colors[key]}
                    strokeWidth="2"
                  />
                  {chartData.map((item, index) => (
                    <circle
                      key={index}
                      cx={50 + index * 50}
                      cy={180 - (item[key] * 5)}
                      r="3"
                      fill={colors[key]}
                    />
                  ))}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-sm">
          {Object.entries(colors).map(([key, color]) => (
            <div key={key} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
              <span className="text-gray-600">{key}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const SchemaOverallScore = () => {
    const schemaData = {
      highest: [
        { name: 'Oracle_1', score: '97%' },
        { name: 'Oracle_1', score: '97%' },
        { name: 'Oracle_1', score: '97%' },
        { name: 'Oracle_1', score: '97%' },
        { name: 'Oracle_1', score: '97%' }
      ],
      lowest: [
        { name: 'Oracle_1', score: '97%' },
        { name: 'Oracle_1', score: '97%'},
        { name: 'Oracle_1', score: '97%' },
        { name: 'Oracle_1', score: '97%' },
        { name: 'Oracle_1', score: '97%' }
      ]
    };

    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Icon icon="material-symbols:bar-chart" className="w-5 h-5 text-[#8d77ba]" />
          <h3 className="text-lg font-semibold text-gray-800">Schema overall score</h3>
        </div>

        <div className="grid grid-cols-2 gap-6">

          <div>
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-md text-sm font-medium mb-3 inline-block">
              Highest
            </div>
            <div className="space-y-2">
              {schemaData.highest.map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <span className="text-gray-700 text-sm">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{item.score}</span>

                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="bg-gray-100 text-gray-800 px-3 py-1 rounded-md text-sm font-medium mb-3 inline-block">
              Lowest
            </div>
            <div className="space-y-2">
              {schemaData.lowest.map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <span className="text-gray-700 text-sm">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{item.score}</span>

                  </div>
                </div>
              ))}
            </div>
          </div>
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

      <Breadcrumb />

      <div className="flex gap-4 mb-6 items-center justify-between">
        <h1 className="text-2xl font-semibold">Data Assurance</h1>

        <div className="flex items-center gap-2">
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
            className="p-1 px-1.5 rounded-lg border border-gray-400 hover:bg-gray-50"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <Icon
              icon="material-symbols:autorenew-rounded"
              width="24"
              height="24"
              className={`text-gray-600 ${isLoading ? 'icon-rotate' : ''}`}
            />
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
      )}

      {/* Score Movement and Schema Overall Score Components */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <ScoreMovement />
        <SchemaOverallScore />
      </div>
    </div>
  );
};

export default DataAssurance;