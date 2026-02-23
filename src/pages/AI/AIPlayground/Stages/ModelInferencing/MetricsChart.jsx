import React, { useState, useMemo, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { TrendingUp, ChevronLeft, ChevronRight, Search, X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const UNIQUE_COLORS = [
  '#e6194b', '#3cb44b', '#4363d8', '#f58231', '#911eb4', '#42d4f4', '#f032e6', '#bfef45',
  '#fabed4', '#469990', '#dcbeff', '#9A6324', '#fffac8', '#800000', '#aaffc3', '#808000',
  '#ffd8b1', '#000075', '#a9a9a9', '#ffffff', '#e6beff', '#4a86e8', '#ff9900', '#0d7377',
  '#14a085', '#f7dc6f', '#2e86c1', '#cb4335', '#1abc9c', '#8e44ad', '#f39c12', '#27ae60',
  '#2980b9', '#c0392b', '#16a085', '#d35400', '#7d3c98', '#1f618d', '#117a65', '#b7950b',
  '#784212', '#1a5276', '#0e6655', '#6e2f1a', '#4d5656', '#1b4f72', '#0b5345', '#7b241c',
  '#6c3483', '#1f618d', '#148f77', '#9a7d0a', '#6e2f1a', '#922b21', '#1a5276', '#196f3d',
  '#7d6608', '#784212', '#512e5f', '#154360', '#0e6655', '#78281f', '#4a235a', '#1b2631',
];

const getUniqueColor = (index) => UNIQUE_COLORS[index % UNIQUE_COLORS.length];

const SortPill = ({ metric, priority, direction, onRemove, onToggle }) => (
  <div
    className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer select-none transition-all"
    style={{ background: '#ede9f6', color: '#6b52a8', border: '1px solid #c4b5f4' }}
    onClick={onToggle}
    title={`Click to toggle direction, × to remove`}
  >
    <span className="opacity-60 text-[10px] font-bold mr-0.5">#{priority}</span>
    <span className="max-w-[110px] truncate">{metric}</span>
    {direction === 'desc' ? <ArrowDown className="w-3 h-3 ml-0.5" /> : <ArrowUp className="w-3 h-3 ml-0.5" />}
    <button
      onClick={(e) => { e.stopPropagation(); onRemove(); }}
      className="ml-0.5 hover:opacity-60 transition-opacity"
    >
      <X className="w-3 h-3" />
    </button>
  </div>
);

const MetricsChart = ({ metricsData, apiResults, truncateName, legendTruncateLength, chartColors }) => {
  const MODELS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState(0);
  const [searchQueryStr, setSearchQueryStr] = useState('');
  const [tooltipData, setTooltipData] = useState(null);
  const tooltipRef = useRef(null);

  const [sortKeys, setSortKeys] = useState([]);
  const availableMetrics = useMemo(() => metricsData.map(m => m.metric), [metricsData]);

  const getModelMetricValue = (result, metricName) => {
    const metricRow = metricsData.find(m => m.metric === metricName);
    if (!metricRow) return null;
    const globalIndex = apiResults.findIndex(r => r.run_id === result.run_id);
    const modelKey = `${truncateName(result.run_name, legendTruncateLength)}_${globalIndex}`;
    return metricRow[modelKey] ?? null;
  };

  const sortedApiResults = useMemo(() => {
    if (sortKeys.length === 0) return apiResults;
    return [...apiResults].sort((a, b) => {
      for (const { metric, direction } of sortKeys) {
        const aVal = getModelMetricValue(a, metric) ?? -Infinity;
        const bVal = getModelMetricValue(b, metric) ?? -Infinity;
        if (aVal === bVal) continue;
        return direction === 'desc' ? bVal - aVal : aVal - bVal;
      }
      return 0;
    });
  }, [apiResults, sortKeys, metricsData]);

  const filteredModels = useMemo(() => {
    if (!searchQueryStr.trim()) return sortedApiResults;
    return sortedApiResults.filter(result =>
      result.run_name.toLowerCase().includes(searchQueryStr.toLowerCase())
    );
  }, [sortedApiResults, searchQueryStr]);

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
    const handleScroll = (e) => {
      if (tooltipRef.current && tooltipRef.current.contains(e.target)) return;
      setTooltipData(null);
    };

    document.addEventListener('mousedown', handleClick);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, []);

  const handleChartMouseMove = (state, e) => {
    if (state && state.isTooltipActive && state.activePayload?.length) {
      setTooltipData({
        x: e?.clientX ?? 0,
        y: e?.clientY ?? 0,
        metric: state.activeLabel,
        payload: state.activePayload,
      });
    }
  };

  const handleMetricSortClick = (metric) => {
    setSortKeys(prev => {
      const existing = prev.find(k => k.metric === metric);
      if (!existing) {
        return [...prev, { metric, direction: 'desc' }];
      }
      return prev.map(k => k.metric === metric ? { ...k, direction: k.direction === 'desc' ? 'asc' : 'desc' } : k);
    });
    setCurrentPage(0);
  };

  const handleRemoveSortKey = (metric) => {
    setSortKeys(prev => prev.filter(k => k.metric !== metric));
    setCurrentPage(0);
  };

  const clearAllSorts = () => { setSortKeys([]); setCurrentPage(0); };

  const getSortIcon = (metric) => {
    const key = sortKeys.find(k => k.metric === metric);
    if (!key) return <ArrowUpDown className="w-3.5 h-3.5 opacity-40 group-hover:opacity-70 transition-opacity" />;
    return key.direction === 'desc'
      ? <ArrowDown className="w-3.5 h-3.5 text-white" />
      : <ArrowUp className="w-3.5 h-3.5 text-white" />;
  };

  const PortalTooltip = () => {
    if (!tooltipData) return null;
    const { x, y, metric, payload } = tooltipData;
    const tooltipWidth = 420;
    const tooltipMaxHeight = 260;
    const left = x + 16 + tooltipWidth > window.innerWidth ? x - tooltipWidth - 16 : x + 16;
    const top = y + tooltipMaxHeight > window.innerHeight ? y - tooltipMaxHeight : y;

    return ReactDOM.createPortal(
      <div
        ref={tooltipRef}
        style={{
          position: 'fixed', top, left, zIndex: 9999,
          maxWidth: `${tooltipWidth}px`, minWidth: '300px',
          background: 'white', border: '1px solid #e5e7eb',
          borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          padding: '12px', pointerEvents: 'auto',
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-gray-700">{metric}</p>
          <button onClick={() => setTooltipData(null)} className="text-gray-400 hover:text-gray-600 ml-3">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div style={{ maxHeight: `${tooltipMaxHeight - 48}px`, overflowY: 'scroll', overscrollBehavior: 'contain' }}>
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
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '8px 16px',
          paddingTop: '12px',
          paddingLeft: '4px',
        }}
      >
        {payload.map((entry, index) => {
          const dataKeyParts = entry.dataKey?.split('_') || [];
          const globalIdx = parseInt(dataKeyParts[dataKeyParts.length - 1]);
          const fullName = apiResults[globalIdx]?.run_name || entry.value;
          return (
            <div
              key={index}
              title={fullName}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}
            >
              <span style={{ color: entry.color, flexShrink: 0, fontSize: '10px', lineHeight: 1 }}>●</span>
              <span
                style={{
                  fontSize: '12px',
                  color: '#4b5563',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  minWidth: 0,
                  flex: 1,
                  cursor: 'default',
                  direction: 'rtl',
                  textAlign: 'left',
                }}
              >
                {fullName}
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
            <TrendingUp className="w-5 h-5" style={{ color: '#8e78b7' }} />
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

        <p className="text-xs text-gray-500 mb-3">Accuracy, precision, recall & F1 score</p>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQueryStr}
            onChange={(e) => { setSearchQueryStr(e.target.value); setCurrentPage(0); }}
            placeholder="Search models by name..."
            className="w-full pl-9 pr-9 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 placeholder-gray-400"
            style={{ outline: 'none' }}
            onFocus={e => e.currentTarget.style.boxShadow = '0 0 0 2px #c4b5f4'}
            onBlur={e => e.currentTarget.style.boxShadow = 'none'}
          />
          {searchQueryStr && (
            <button onClick={() => { setSearchQueryStr(''); setCurrentPage(0); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort Controls */}
        {availableMetrics.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <span className="text-xs font-medium text-gray-500 whitespace-nowrap">Sort by:</span>
            {availableMetrics.map(metric => {
              const sortKey = sortKeys.find(k => k.metric === metric);
              const priority = sortKey ? sortKeys.indexOf(sortKey) + 1 : null;
              return (
                <button
                  key={metric}
                  onClick={() => handleMetricSortClick(metric)}
                  className="group flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all"
                  style={
                    sortKey
                      ? { background: '#8e78b7', color: 'white', borderColor: '#8e78b7', boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }
                      : { background: 'white', color: '#6b7280', borderColor: '#e5e7eb' }
                  }
                  onMouseEnter={e => {
                    if (!sortKey) {
                      e.currentTarget.style.borderColor = '#8e78b7';
                      e.currentTarget.style.color = '#8e78b7';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!sortKey) {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.color = '#6b7280';
                    }
                  }}
                  title={`Sort by ${metric}`}
                >
                  {priority && <span className="opacity-75 text-[10px] font-bold">#{priority}</span>}
                  {metric}
                  {getSortIcon(metric)}
                  {sortKey && (
                    <span
                      onClick={(e) => { e.stopPropagation(); handleRemoveSortKey(metric); }}
                      className="ml-0.5 opacity-70 hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </span>
                  )}
                </button>
              );
            })}
            {sortKeys.length > 0 && (
              <button
                onClick={clearAllSorts}
                className="text-xs text-gray-400 hover:text-red-400 transition-colors underline underline-offset-2"
              >
                Clear all
              </button>
            )}
          </div>
        )}

        {metricsData.length > 0 ? (
          filteredModels.length === 0 ? (
            <div className="h-72 sm:h-80 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center text-gray-500">
                <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm font-medium">No models match your search</p>
                <p className="text-xs mt-1">Try a different keyword</p>
                <button
                  onClick={() => { setSearchQueryStr(''); setCurrentPage(0); }}
                  className="mt-3 text-xs underline"
                  style={{ color: '#8e78b7' }}
                >
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
                  onMouseLeave={() => { }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="metric" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={{ stroke: '#e5e7eb' }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={{ stroke: '#e5e7eb' }} domain={[0, 100]} />
                  <Tooltip content={() => null} />
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
                        stroke={getUniqueColor(globalIndex)}
                        strokeWidth={2}
                        dot={{ fill: getUniqueColor(globalIndex), r: 4 }}
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