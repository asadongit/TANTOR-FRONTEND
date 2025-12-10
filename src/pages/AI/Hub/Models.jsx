import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Search, RefreshCcw, ArrowUp, ArrowDown, Info } from 'lucide-react';
import { Icon } from '@iconify-icon/react';
import Breadcrumb from '../../../components/Breadcrumb';
import DataTable from '../../../components/DataTable';

function Models() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState('both');

  const metricsData = [
    {
      title: 'Projects',
      count: 39,
      trend: 'up',
      trendValue: '10%',
      icon: 'material-symbols:check-circle-outline',
      color: 'border-l-purple-500',
    },
    {
      title: 'Projects',
      count: 15,
      trend: 'up',
      trendValue: '6%',
      icon: 'material-symbols:check-circle-outline',
      color: 'border-l-green-500',
    },
    {
      title: 'Projects',
      count: '82%',
      trend: 'up',
      trendValue: '2%',
      icon: 'material-symbols:check-circle-outline',
      color: 'border-l-yellow-500',
    },
    {
      title: 'Projects',
      count: 9,
      trend: 'down',
      trendValue: '2%',
      icon: 'material-symbols:check-circle-outline',
      color: 'border-l-pink-500',
    },
    {
      title: 'Projects',
      count: '17sec',
      trend: 'down',
      trendValue: '2%',
      icon: 'material-symbols:check-circle-outline',
      color: 'border-l-cyan-500',
    },
  ];

  const alertsData = [
    { name: 'M_credit', issue: 'Drift 5%', trend: 'down', type: 'drift' },
    { name: 'M_CS', issue: 'Latency 3s', trend: 'down', type: 'latency' },
    { name: 'M_churn', issue: 'Drift 4%', trend: 'down', type: 'drift' },
    { name: 'M_risk', issue: 'Latency 2s', trend: 'up', type: 'latency' },
    { name: 'M_campaign', issue: 'Drift 3%', trend: 'down', type: 'drift' },
    { name: 'M_risk', issue: 'Latency 2s', trend: 'up', type: 'latency' },
  ];

  const modelFlowData = {
    aiModel: { id: 'ai-model', label: '564', sublabel: 'AI Model', x: 20, y: 80 },
    classificationAgents: [
      { id: 'class-1', label: 'Classification Agent', x: 130, y: 30 },
      { id: 'class-2', label: 'Classification Agent', x: 130, y: 105 },
    ],
    middleAgents: [
      { id: 'loan-agent', label: 'Loan Agent', color: '#4ADE80', x: 250, y: 10 },
      { id: 'gst-agent', label: 'GST Agent', color: '#FB923C', x: 250, y: 45 },
      { id: 'loan-agent-1', label: 'Loan Agent 1', color: '#F87171', x: 250, y: 80 },
      { id: 'multi-agent', label: 'Multi Agent', color: '#60A5FA', x: 250, y: 115 },
      { id: 'gst-agent-1', label: 'GST Agent 1', color: '#4ADE80', x: 250, y: 150 },
    ],
    preprocessingLayer: { id: 'preprocess', label: 'data preprocessing layer', x: 350, y: 60 },
    output: { id: 'output', label: 'Output', x: 480, y: 85 },
  };

  const projectsData = [
    { sno: 1, name: 'Project - Churn', description: 'Churn', created_date: '01/10/2025', type: 'Salish', status: 'Deployed' },
    { sno: 2, name: 'Project - Analysis', description: 'Churn', created_date: '01/10/2025', type: 'Salish', status: 'Archived' },
    { sno: 3, name: 'Project - Retention', description: 'Retention', created_date: '15/11/2025', type: 'Mekong', status: 'Deployed' },
    { sno: 4, name: 'Project - Acquisition', description: 'Acquisition', created_date: '01/12/2025', type: 'Amazon', status: 'Deployed' },
    { sno: 5, name: 'Project - Engagement', description: 'Engagement', created_date: '20/12/2025', type: 'Nile', status: 'In progress' },
    { sno: 6, name: 'Project - Onboarding', description: 'Onboarding', created_date: '05/01/2026', type: 'Yangtze', status: 'Inactive' },
    { sno: 7, name: 'Project - Feedback', description: 'Feedback', created_date: '30/01/2026', type: 'Danube', status: 'Deployed' },
    { sno: 8, name: 'Project - Analysis', description: 'Analysis', created_date: '15/02/2026', type: 'Thames', status: 'Archived' },
    { sno: 9, name: 'Project - Strategy', description: 'Strategy', created_date: '01/03/2026', type: 'Seine', status: 'Deployed' },
    { sno: 10, name: 'Project - Optimization', description: 'Optimization', created_date: '15/03/2026', type: 'Mississippi', status: 'Archived' },
  ];

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Deployed':
        return 'bg-green-100 text-green-700';
      case 'Archived':
        return 'bg-gray-100 text-gray-600';
      case 'In progress':
        return 'bg-blue-100 text-blue-700';
      case 'Inactive':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const columns = [
    { key: 'sno', label: 'Sno', sortable: true },
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (row) => <span className="text-purple-600 hover:underline cursor-pointer">{row.name}</span>,
    },
    { key: 'description', label: 'Description', sortable: true },
    { key: 'created_date', label: 'Created Date', sortable: true },
    { key: 'type', label: 'Type', sortable: true },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => (
        <span className={`px-3 py-1 rounded-md text-xs font-medium ${getStatusStyle(row.status)}`}>
          {row.status}
        </span>
      ),
    },
    { label: 'Action', sortable: false },
  ];

  const actions = [
    {
      label: 'Library',
      icon: <Icon icon="material-symbols:library-books-outline" className="w-5 h-5" />,
      onClick: (row) => console.log('Library:', row),
      tooltip: 'Library',
    },
    {
      label: 'F1 Mode',
      icon: <Icon icon="material-symbols:speed-outline" className="w-5 h-5" />,
      onClick: (row) => console.log('F1 Mode:', row),
      tooltip: 'F1 Mode',
    },
    {
      label: 'AI Canvas',
      icon: <Icon icon="material-symbols:draw-outline" className="w-5 h-5" />,
      onClick: (row) => console.log('AI Canvas:', row),
      tooltip: 'AI Canvas',
    },
    {
      label: 'Deploy',
      icon: <Icon icon="material-symbols:rocket-launch-outline" className="w-5 h-5" />,
      onClick: (row) => console.log('Deploy:', row),
      tooltip: 'Deploy',
    },
    {
      label: 'Archive',
      icon: <Icon icon="material-symbols:archive-outline" className="w-5 h-5" />,
      onClick: (row) => console.log('Archive:', row),
      tooltip: 'Archive',
    },
    {
      label: 'Delete',
      icon: <Icon icon="material-symbols:delete-outline" className="w-5 h-5" />,
      onClick: (row) => console.log('Delete:', row),
      tooltip: 'Delete',
    },
  ];

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return projectsData;
    const q = searchTerm.toLowerCase();
    return projectsData.filter((row) =>
      Object.values(row || {}).some((val) =>
        String(val ?? '').toLowerCase().includes(q)
      )
    );
  }, [searchTerm, projectsData]);

  const StatCard = ({ title, count, trend, trendValue, icon, color }) => (
    <div className="bg-white rounded-xl px-5 py-4 border border-purple-200 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-50 rounded-lg">
            <Icon icon={icon} className="w-5 h-5 text-purple-600" />
          </div>
          <span className="text-gray-600 text-sm">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-gray-800">{count}</span>
          {trend === 'up' ? (
            <ArrowUp className="w-4 h-4 text-orange-500" />
          ) : (
            <ArrowDown className="w-4 h-4 text-orange-500" />
          )}
        </div>
      </div>
    </div>
  );

  const ModelFlowDiagram = ({ data }) => {
    const svgRef = useRef(null);
    const containerRef = useRef(null);
    const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [showInfo, setShowInfo] = useState(false);

    const handleWheel = useCallback((e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setTransform((prev) => ({
        ...prev,
        scale: Math.min(Math.max(prev.scale * delta, 0.5), 2),
      }));
    }, []);

    const handleMouseDown = useCallback((e) => {
      setIsDragging(true);
      setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    }, [transform.x, transform.y]);

    const handleMouseMove = useCallback((e) => {
      if (!isDragging) return;
      setTransform((prev) => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      }));
    }, [isDragging, dragStart]);

    const handleMouseUp = useCallback(() => {
      setIsDragging(false);
    }, []);

    const resetZoom = () => {
      setTransform({ x: 0, y: 0, scale: 1 });
    };

    return (
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm h-full">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon icon="material-symbols:account-tree-outline" className="w-5 h-5 text-purple-600" />
            <h3 className="text-sm font-semibold text-gray-800">Model Flow</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTransform((prev) => ({ ...prev, scale: Math.min(prev.scale * 1.2, 2) }))}
              className="p-1 hover:bg-gray-100 rounded text-gray-500"
              title="Zoom In"
            >
              <Icon icon="material-symbols:zoom-in" className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTransform((prev) => ({ ...prev, scale: Math.max(prev.scale * 0.8, 0.5) }))}
              className="p-1 hover:bg-gray-100 rounded text-gray-500"
              title="Zoom Out"
            >
              <Icon icon="material-symbols:zoom-out" className="w-4 h-4" />
            </button>
            <button
              onClick={resetZoom}
              className="p-1 hover:bg-gray-100 rounded text-gray-500"
              title="Reset"
            >
              <Icon icon="material-symbols:fit-screen" className="w-4 h-4" />
            </button>
            <div className="relative">
              <Info
                className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600"
                onMouseEnter={() => setShowInfo(true)}
                onMouseLeave={() => setShowInfo(false)}
              />
              {showInfo && (
                <div className="absolute right-0 top-6 z-10 w-48 p-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg">
                  Interactive model flow diagram. Use scroll to zoom, drag to pan.
                </div>
              )}
            </div>
          </div>
        </div>
        <div
          ref={containerRef}
          className="h-[260px] overflow-hidden cursor-grab active:cursor-grabbing rounded-lg bg-gray-50"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <svg
            ref={svgRef}
            viewBox="0 0 600 220"
            className="w-full h-full"
            style={{
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            }}
          >
            <g className="cursor-pointer hover:opacity-80 transition-opacity">
              <rect x={data.aiModel.x} y={data.aiModel.y} width="80" height="80" rx="8" fill="#7C3AED" />
              <text x={data.aiModel.x + 40} y={data.aiModel.y + 35} textAnchor="middle" fill="white" fontSize="24" fontWeight="bold">
                {data.aiModel.label}
              </text>
              <text x={data.aiModel.x + 40} y={data.aiModel.y + 55} textAnchor="middle" fill="white" fontSize="10">
                {data.aiModel.sublabel}
              </text>
            </g>

            {data.classificationAgents.map((agent, idx) => (
              <g key={agent.id} className="cursor-pointer hover:opacity-80 transition-opacity">
                <rect x={agent.x} y={agent.y} width="90" height="35" rx="6" fill="#A78BFA" />
                <text x={agent.x + 45} y={agent.y + 15} textAnchor="middle" fill="white" fontSize="8">
                  Classification
                </text>
                <text x={agent.x + 45} y={agent.y + 26} textAnchor="middle" fill="white" fontSize="8">
                  Agent
                </text>
              </g>
            ))}

            {data.middleAgents.map((agent) => (
              <g key={agent.id} className="cursor-pointer hover:opacity-80 transition-opacity">
                <rect x={agent.x} y={agent.y} width="70" height="28" rx="5" fill={agent.color} />
                <text x={agent.x + 35} y={agent.y + 18} textAnchor="middle" fill="white" fontSize="8">
                  {agent.label}
                </text>
              </g>
            ))}

            <g className="cursor-pointer hover:opacity-80 transition-opacity">
              <rect x={data.preprocessingLayer.x} y={data.preprocessingLayer.y} width="100" height="80" rx="8" fill="#FDE68A" opacity="0.9" />
              <text x={data.preprocessingLayer.x + 50} y={data.preprocessingLayer.y + 35} textAnchor="middle" fill="#92400E" fontSize="9">
                data preprocessing
              </text>
              <text x={data.preprocessingLayer.x + 50} y={data.preprocessingLayer.y + 50} textAnchor="middle" fill="#92400E" fontSize="9">
                layer
              </text>
            </g>

            <g className="cursor-pointer hover:opacity-80 transition-opacity">
              <rect x={data.output.x} y={data.output.y} width="80" height="35" rx="6" fill="#4ADE80" />
              <text x={data.output.x + 40} y={data.output.y + 22} textAnchor="middle" fill="white" fontSize="10">
                {data.output.label}
              </text>
            </g>

            <path d="M100 120 Q115 50 130 47" stroke="#A78BFA" strokeWidth="2" fill="none" opacity="0.6" />
            <path d="M100 120 Q115 120 130 122" stroke="#A78BFA" strokeWidth="2" fill="none" opacity="0.6" />

            {data.middleAgents.map((agent, idx) => (
              <g key={`lines-${agent.id}`}>
                <path
                  d={`M220 ${idx < 2 ? 47 : 122} Q235 ${agent.y + 14} 250 ${agent.y + 14}`}
                  stroke={agent.color}
                  strokeWidth="2"
                  fill="none"
                  opacity="0.6"
                />
                <path
                  d={`M320 ${agent.y + 14} Q335 100 350 100`}
                  stroke={agent.color}
                  strokeWidth="2"
                  fill="none"
                  opacity="0.4"
                />
              </g>
            ))}

            <path d="M450 100 L480 102" stroke="#4ADE80" strokeWidth="2" fill="none" />
          </svg>
        </div>
      </div>
    );
  };

  const AlertsPanel = () => {
    const [showInfo, setShowInfo] = useState(false);

    return (
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm h-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon icon="material-symbols:notifications-outline" className="w-5 h-5 text-purple-600" />
            <h3 className="text-sm font-semibold text-gray-800">Alerts</h3>
          </div>
          <div className="relative">
            <Info
              className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600"
              onMouseEnter={() => setShowInfo(true)}
              onMouseLeave={() => setShowInfo(false)}
            />
            {showInfo && (
              <div className="absolute right-0 top-6 z-10 w-48 p-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg">
                Model alerts for drift and latency issues.
              </div>
            )}
          </div>
        </div>
        <div className="space-y-3">
          {alertsData.map((alert, index) => (
            <div key={index} className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${
                  alert.type === 'drift' ? 'bg-orange-400' : 'bg-blue-400'
                }`} />
                <span className="text-sm text-gray-700">{alert.name}</span>
              </div>
              <span className={`text-xs flex items-center gap-1 ${
                alert.trend === 'up' ? 'text-green-500' : 'text-orange-500'
              }`}>
                {alert.issue}
                {alert.trend === 'up' ? (
                  <ArrowUp className="w-3 h-3" />
                ) : (
                  <ArrowDown className="w-3 h-3" />
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-4">
      <Breadcrumb link="/" />

      <div className="flex gap-4 items-center justify-between">
        <h1 className="text-2xl font-semibold">Models</h1>

        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search"
              className="pl-10 pr-4 py-2 w-[250px] border border-gray-300 rounded-lg focus:outline-none focus:border-purple-400"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>

          <button
            className={`p-1.5 rounded-lg border ${
              viewMode === 'list' ? 'bg-gray-100 border-gray-500' : 'border-gray-300'
            } hover:bg-gray-50`}
            onClick={() => setViewMode(viewMode === 'list' ? 'both' : 'list')}
            title={viewMode === 'list' ? 'Show All Views' : 'Show List Only'}
          >
            <Icon
              icon="material-symbols-light:format-list-bulleted"
              width="22"
              height="22"
              className="text-purple-600"
            />
          </button>

          <button
            className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50"
            onClick={handleRefresh}
            title="Refresh data"
            disabled={isLoading}
          >
            <RefreshCcw className={`h-5 w-5 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {viewMode !== 'list' && (
        <>
          <div className="bg-gradient-to-r from-purple-400 via-purple-300 to-purple-200 rounded-2xl p-4">
            <div className="grid grid-cols-5 gap-4">
              {metricsData.map((metric, index) => (
                <StatCard key={index} {...metric} />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <ModelFlowDiagram data={modelFlowData} />
            </div>
            <div>
              <AlertsPanel />
            </div>
          </div>
        </>
      )}

      <DataTable
        columns={columns}
        data={filteredData}
        actions={actions}
        isLoading={isLoading}
        isError={false}
        refetch={handleRefresh}
        title=""
      />
    </div>
  );
}

export default Models;