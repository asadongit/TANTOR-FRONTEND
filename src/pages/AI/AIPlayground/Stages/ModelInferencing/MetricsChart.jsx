import React, { useState, useMemo, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { TrendingUp, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const MetricsChart = ({ metricsData, apiResults, truncateName, legendTruncateLength, chartColors }) => {
  const MODELS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [tooltipData, setTooltipData] = useState(null);
  const tooltipRef = useRef(null);

  const filteredModels = useMemo(() => {
    if (!searchQuery.trim()) return apiResults;
    return apiResults.filter(result =>
      result.run_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [apiResults, searchQuery]);

  const totalPages = Math.ceil(filteredModels.length / MODELS_PER_PAGE);
  const startIndex = currentPage * MODELS_PER_PAGE;
  const endIndex = Math.min(startIndex + MODELS_PER_PAGE, filteredModels.length);
  const currentModels = filteredModels.slice(startIndex, endIndex);

  const getGlobalIndex = (result) => apiResults.findIndex(r => r.run_id === result.run_id);

  const paginatedMetricsData = metricsData.map(metric => {
    const filteredMetric = { metric: metric.metric };
    currentModels.forEach((result) => {
      const globalIndex = getGlobalIndex(result);
      const modelKey = `${truncateName(result.run_name, legendTruncateLength)}_${globalIndex}`;
      if (metric[modelKey] !== undefined) {
        filteredMetric[modelKey] = metric[modelKey];
      }
    });
    return filteredMetric;
  });

  useEffect(() => {
    const handleClick = (e) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target)) {
        setTooltipData(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleChartMouseMove = (state, e) => {
    if (state && state.isTooltipActive && state.activePayload?.length) {
      const mouseX = e?.clientX ?? 0;
      const mouseY = e?.clientY ?? 0;
      setTooltipData({
        x: mouseX,
        y: mouseY,
        metric: state.activeLabel,
        payload: state.activePayload,
      });
    }
  };

  const handleChartMouseLeave = () => {
  };

  const PortalTooltip = () => {
    if (!tooltipData) return null;

    const { x, y, metric, payload } = tooltipData;
    const tooltipWidth = 420;
    const tooltipMaxHeight = 260;

    // Flip left if near right edge
    const left = x + 16 + tooltipWidth > window.innerWidth
      ? x - tooltipWidth - 16
      : x + 16;

    // Flip up if near bottom edge
    const top = y + tooltipMaxHeight > window.innerHeight
      ? y - tooltipMaxHeight
      : y;

    return ReactDOM.createPortal(
      <div
        ref={tooltipRef}
        style={{
          position: 'fixed',
          top,
          left,
          zIndex: 9999,
          maxWidth: `${tooltipWidth}px`,
          minWidth: '300px',
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          padding: '12px',
          pointerEvents: 'auto',
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-gray-700">{metric}</p>
          <button
            onClick={() => setTooltipData(null)}
            className="text-gray-400 hover:text-gray-600 ml-3"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div
          style={{
            maxHeight: `${tooltipMaxHeight - 48}px`,
            overflowY: 'scroll', 
            overscrollBehavior: 'contain',
          }}
        >
          {payload.map((entry, index) => {
            const dataKeyParts = entry.dataKey.split('_');
            const globalIdx = parseInt(dataKeyParts[dataKeyParts.length - 1]);
            const fullModelName = apiResults[globalIdx]?.run_name || entry.name;
            return (
              <div key={index} className="flex items-start gap-2 mb-1.5">
                <span style={{ color: entry.color, flexShrink: 0, marginTop: '2px', fontSize: '10px' }}>●</span>
                <span className="text-xs text-gray-600 mr-1" style={{ wordBreak: 'break-word' }}>
                  {fullModelName}: <strong>{entry.value}%</strong>
                </span>
              </div>
            );
          })}
        </div>
      </div>,
      document.body
    );
  };

  const CustomLegend = ({ payload }) => {
    if (!payload || payload.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-x-6 gap-y-2 pt-3 px-2">
        {payload.map((entry, index) => {
          const dataKeyParts = entry.dataKey?.split('_') || [];
          const globalIdx = parseInt(dataKeyParts[dataKeyParts.length - 1]);
          const fullName = apiResults[globalIdx]?.run_name || entry.value;
          const displayName = fullName.length > 45
            ? '...' + fullName.slice(-42)
            : fullName;
          return (
            <div key={index} className="flex items-center gap-1.5" style={{ maxWidth: '280px', minWidth: '220px' }}>
              <span style={{ color: entry.color, flexShrink: 0, fontSize: '10px' }}>●</span>
              <span
                className="text-xs text-gray-600 cursor-default"
                style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}
                title={fullName}
              >
                {displayName}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className='bg-gray-50 p-4 rounded-lg'>
      <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200 shadow-sm">

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#8e78b7]" />
            <h2 className="text-lg font-semibold text-gray-900">Model Metrics Comparison</h2>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <span className="text-sm text-gray-600 whitespace-nowrap" style={{ minWidth: '110px', textAlign: 'center' }}>
                {startIndex + 1}–{endIndex} of {filteredModels.length}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                disabled={currentPage === totalPages - 1}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-500 mb-3">
          Accuracy, precision, recall & F1 score
        </p>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(0); }}
            placeholder="Search models by name..."
            className="w-full pl-9 pr-9 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent placeholder-gray-400"
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(''); setCurrentPage(0); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {metricsData.length > 0 ? (
          filteredModels.length === 0 ? (
            <div className="h-72 sm:h-80 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center text-gray-500">
                <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm font-medium">No models match your search</p>
                <p className="text-xs mt-1">Try a different keyword</p>
                <button onClick={() => { setSearchQuery(''); setCurrentPage(0); }} className="mt-3 text-xs text-[#8e78b7] hover:underline">
                  Clear search
                </button>
              </div>
            </div>
          ) : (
            <div className="h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={paginatedMetricsData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  onMouseMove={handleChartMouseMove}
                  onMouseLeave={handleChartMouseLeave}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="metric" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={{ stroke: '#e5e7eb' }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={{ stroke: '#e5e7eb' }} domain={[0, 100]} />
                  <Tooltip content={() => null} />  {/* disable default tooltip */}
                  <Legend content={<CustomLegend />} />
                  {currentModels.map((result) => {
                    const globalIndex = getGlobalIndex(result);
                    const modelKey = `${truncateName(result.run_name, legendTruncateLength)}_${globalIndex}`;
                    return (
                      <Line
                        key={result.run_id}
                        type="monotone"
                        dataKey={modelKey}
                        name={truncateName(result.run_name, legendTruncateLength)}
                        stroke={chartColors[globalIndex % chartColors.length]}
                        strokeWidth={2}
                        dot={{ fill: chartColors[globalIndex % chartColors.length], r: 4 }}
                        activeDot={{ r: 6 }}
                        connectNulls={false}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )
        ) : (
          <div className="h-72 sm:h-80 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center text-gray-500">
              <p className="text-sm font-medium">No metrics data available</p>
              <p className="text-xs mt-1">Train metrics are not present in the results</p>
            </div>
          </div>
        )}
      </div>

      <PortalTooltip />
    </div>
  );
};

export default MetricsChart;