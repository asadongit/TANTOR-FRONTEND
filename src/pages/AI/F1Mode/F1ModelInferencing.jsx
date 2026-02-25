import React, { useState, useMemo, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { TrendingUp, ChevronLeft, ChevronRight, Search, X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAIPlayground } from '../../../context/AIPlaygroundContext';
import BatchIcon from '../../../assets/ai/workspace_premium.svg';

const UNIQUE_COLORS = [
    '#e6194b', '#3cb44b', '#4363d8', '#f58231', '#911eb4', '#42d4f4', '#f032e6', '#bfef45',
    '#fabed4', '#469990', '#dcbeff', '#9A6324', '#fffac8', '#800000', '#aaffc3', '#808000',
    '#ffd8b1', '#000075', '#a9a9a9', '#ffffff', '#e6beff', '#4a86e8', '#ff9900', '#0d7377',
    '#14a085', '#f7dc6f', '#2e86c1', '#cb4335', '#1abc9c', '#8e44ad',
];
const getUniqueColor = (i) => UNIQUE_COLORS[i % UNIQUE_COLORS.length];

const formatMetricLabel = (key) =>
    key.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

const isLogLossMetric = (key) =>
    typeof key === 'string' && key.toLowerCase().replace(' ', '_') === 'log_loss';

function BestModelCard({ bestAlgorithm, bestScore, metricName }) {
    const isLogLoss = metricName?.toLowerCase() === 'log_loss';
    const displayValue =
        bestScore !== null && bestScore !== undefined
            ? isLogLoss ? bestScore.toFixed(4) : (bestScore * 100).toFixed(2) + '%'
            : '-';
    const displayMetric = formatMetricLabel(metricName || 'accuracy');

    return (
        <div
            className="rounded-2xl p-4 flex items-stretch gap-3 mb-5"
            style={{
                background: 'linear-gradient(144.28deg, rgba(141, 23, 24, 0.4) 20.92%, rgba(255, 255, 255, 0.4) 75.9%)',
                border: '1px solid #f0d9d9',
            }}
        >
            <div className="bg-white rounded-xl px-4 py-3 flex items-center gap-3" style={{ flex: '1 1 0', minWidth: 0, border: '1px solid #e5e7eb' }}>
                <div className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FFF8F2' }}>
                    <img
                        src={BatchIcon} alt="Best Model" className="w-5 h-5"
                        style={{ filter: 'brightness(0) saturate(100%) invert(62%) sepia(67%) saturate(487%) hue-rotate(346deg) brightness(97%) contrast(89%)' }}
                    />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#E08E40]">Best Model</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Based on {isLogLoss ? 'lowest' : 'highest'} train {displayMetric.toLowerCase()}
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-xl px-4 py-3 flex items-center" style={{ flex: '1 1 0', minWidth: 0, border: '1px solid #e5e7eb' }}>
                <div style={{ minWidth: 0, width: '100%' }}>
                    <p className="text-xs text-gray-500 mb-0.5">Model</p>
                    <p className="text-md font-medium text-gray-800" title={bestAlgorithm} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {bestAlgorithm || '-'}
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-xl px-4 py-3 flex items-center" style={{ flex: '1 1 0', minWidth: 0, border: '1px solid #e5e7eb' }}>
                <div>
                    <p className="text-xs text-gray-500 mb-1">{displayMetric}</p>
                    <p className="text-md font-bold text-gray-900">{displayValue}</p>
                </div>
            </div>
        </div>
    );
}

function F1MetricsChart({ allResults }) {
    const MODELS_PER_PAGE = 10;

    const TRAIN_METRICS = useMemo(() => {
        const metricSet = new Set();
        allResults.forEach((result) => {
            if (result.metrics?.train) {
                Object.keys(result.metrics.train).forEach((k) => metricSet.add(k));
            }
        });
        return Array.from(metricSet);
    }, [allResults]);

    const [currentPage, setCurrentPage] = useState(0);
    const [searchQueryStr, setSearchQueryStr] = useState('');
    const [sortKeys, setSortKeys] = useState([]);
    const [tooltipData, setTooltipData] = useState(null);
    const tooltipRef = useRef(null);

    const metricsData = useMemo(() => {
        return TRAIN_METRICS.map((metricKey) => {
            const row = { metric: formatMetricLabel(metricKey) };
            allResults.forEach((result, idx) => {
                const val = result.metrics?.train?.[metricKey];
                if (val !== undefined && val !== null) {
                    row[`${result.algorithm}_${idx}`] = isLogLossMetric(metricKey)
                        ? parseFloat(val.toFixed(4))
                        : parseFloat((val * 100).toFixed(2));
                } else {
                    row[`${result.algorithm}_${idx}`] = null;
                }
            });
            return row;
        });
    }, [allResults, TRAIN_METRICS]);

    const availableMetrics = metricsData.map((m) => m.metric);

    const getModelMetricValue = (result, idx, metricLabel) => {
        const row = metricsData.find((m) => m.metric === metricLabel);
        return row ? (row[`${result.algorithm}_${idx}`] ?? null) : null;
    };

    const sortedResults = useMemo(() => {
        if (sortKeys.length === 0) return allResults;
        return [...allResults].sort((a, b) => {
            const idxA = allResults.indexOf(a);
            const idxB = allResults.indexOf(b);
            for (const { metric, direction } of sortKeys) {
                const aVal = getModelMetricValue(a, idxA, metric) ?? -Infinity;
                const bVal = getModelMetricValue(b, idxB, metric) ?? -Infinity;
                if (aVal === bVal) continue;
                return direction === 'desc' ? bVal - aVal : aVal - bVal;
            }
            return 0;
        });
    }, [allResults, sortKeys, metricsData]);

    const filteredModels = useMemo(() => {
        if (!searchQueryStr.trim()) return sortedResults;
        return sortedResults.filter((r) =>
            r.algorithm.toLowerCase().includes(searchQueryStr.toLowerCase())
        );
    }, [sortedResults, searchQueryStr]);

    const totalPages = Math.ceil(filteredModels.length / MODELS_PER_PAGE);
    const startIndex = currentPage * MODELS_PER_PAGE;
    const endIndex = Math.min(startIndex + MODELS_PER_PAGE, filteredModels.length);
    const currentModels = filteredModels.slice(startIndex, endIndex);

    const paginatedMetricsData = metricsData.map((row) => {
        const filtered = { metric: row.metric };
        currentModels.forEach((result) => {
            const globalIdx = allResults.indexOf(result);
            const key = `${result.algorithm}_${globalIdx}`;
            if (row[key] !== undefined) filtered[key] = row[key];
        });
        return filtered;
    });

    useEffect(() => {
        const handleClick = (e) => {
            if (tooltipRef.current && !tooltipRef.current.contains(e.target)) setTooltipData(null);
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
        if (state?.isTooltipActive && state.activePayload?.length) {
            setTooltipData({ x: e?.clientX ?? 0, y: e?.clientY ?? 0, metric: state.activeLabel, payload: state.activePayload });
        }
    };

    const handleMetricSortClick = (metric) => {
        setSortKeys((prev) => {
            const existing = prev.find((k) => k.metric === metric);
            if (!existing) return [...prev, { metric, direction: 'desc' }];
            return prev.map((k) => k.metric === metric ? { ...k, direction: k.direction === 'desc' ? 'asc' : 'desc' } : k);
        });
        setCurrentPage(0);
    };
    const handleRemoveSortKey = (metric) => { setSortKeys((prev) => prev.filter((k) => k.metric !== metric)); setCurrentPage(0); };
    const clearAllSorts = () => { setSortKeys([]); setCurrentPage(0); };

    const getSortIcon = (metric) => {
        const key = sortKeys.find((k) => k.metric === metric);
        if (!key) return <ArrowUpDown className="w-3.5 h-3.5 opacity-40 group-hover:opacity-70 transition-opacity" />;
        return key.direction === 'desc' ? <ArrowDown className="w-3.5 h-3.5 text-white" /> : <ArrowUp className="w-3.5 h-3.5 text-white" />;
    };

    const formatTooltipValue = (metricLabel, value) => {
        if (value === null || value === undefined) return '-';
        return isLogLossMetric(metricLabel) ? String(value.toFixed(4)) : `${value}%`;
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
                    <button onClick={() => setTooltipData(null)} className="text-gray-400 hover:text-gray-600 ml-3"><X className="w-3.5 h-3.5" /></button>
                </div>
                <div style={{ maxHeight: `${tooltipMaxHeight - 48}px`, overflowY: 'scroll', overscrollBehavior: 'contain' }}>
                    {payload.map((entry, index) => {
                        const parts = entry.dataKey.split('_');
                        const globalIdx = parseInt(parts[parts.length - 1]);
                        const fullName = allResults[globalIdx]?.algorithm || entry.name;
                        return (
                            <div key={index} className="flex items-start gap-2 mb-1.5">
                                <span style={{ color: entry.color, flexShrink: 0, marginTop: '2px', fontSize: '10px' }}>●</span>
                                <span className="text-xs text-gray-600" style={{ wordBreak: 'break-word' }}>
                                    {fullName}: <strong>{formatTooltipValue(metric, entry.value)}</strong>
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
        if (!payload?.length) return null;
        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px 16px', paddingTop: '12px', paddingLeft: '4px' }}>
                {payload.map((entry, index) => {
                    const parts = entry.dataKey?.split('_') || [];
                    const globalIdx = parseInt(parts[parts.length - 1]);
                    const fullName = allResults[globalIdx]?.algorithm || entry.value;
                    return (
                        <div key={index} title={fullName} style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                            <span style={{ color: entry.color, flexShrink: 0, fontSize: '10px', lineHeight: 1 }}>●</span>
                            <span style={{ fontSize: '12px', color: '#4b5563', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0, flex: 1, cursor: 'default', direction: 'rtl', textAlign: 'left' }}>
                                {fullName}
                            </span>
                        </div>
                    );
                })}
            </div>
        );
    };

    const metricsSubtitle = TRAIN_METRICS.map(formatMetricLabel).join(', ') + ' (train)';

    return (
        <div className="bg-gray-50 p-4 rounded-lg">
            <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200 shadow-sm">

                {/* Header row */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" style={{ color: '#8D1718' }} />
                        <h2 className="text-lg font-semibold text-gray-900">Model Metrics Comparison</h2>
                    </div>
                    {totalPages > 1 && (
                        <div className="flex items-center gap-2">
                            <button onClick={() => setCurrentPage((p) => Math.max(0, p - 1))} disabled={currentPage === 0} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                                <ChevronLeft className="w-5 h-5 text-gray-600" />
                            </button>
                            <span className="text-sm text-gray-600 whitespace-nowrap" style={{ minWidth: 110, textAlign: 'center' }}>
                                {startIndex + 1}-{endIndex} of {filteredModels.length}
                            </span>
                            <button onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))} disabled={currentPage === totalPages - 1} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                                <ChevronRight className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>
                    )}
                </div>

                <p className="text-xs text-gray-500 mb-3">{metricsSubtitle}</p>

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
                        onFocus={(e) => (e.currentTarget.style.boxShadow = '0 0 0 2px #f0a0a0')}
                        onBlur={(e) => (e.currentTarget.style.boxShadow = 'none')}
                    />
                    {searchQueryStr && (
                        <button onClick={() => { setSearchQueryStr(''); setCurrentPage(0); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Sort controls */}
                {availableMetrics.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap mb-4">
                        <span className="text-xs font-medium text-gray-500 whitespace-nowrap">Sort by:</span>
                        {availableMetrics.map((metric) => {
                            const sortKey = sortKeys.find((k) => k.metric === metric);
                            const priority = sortKey ? sortKeys.indexOf(sortKey) + 1 : null;
                            return (
                                <button
                                    key={metric}
                                    onClick={() => handleMetricSortClick(metric)}
                                    className="group flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all"
                                    style={
                                        sortKey
                                            ? { background: '#8D1718', color: 'white', borderColor: '#8D1718', boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }
                                            : { background: 'white', color: '#6b7280', borderColor: '#e5e7eb' }
                                    }
                                    onMouseEnter={(e) => { if (!sortKey) { e.currentTarget.style.borderColor = '#8D1718'; e.currentTarget.style.color = '#8D1718'; } }}
                                    onMouseLeave={(e) => { if (!sortKey) { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#6b7280'; } }}
                                >
                                    {priority && <span className="opacity-75 text-[10px] font-bold">#{priority}</span>}
                                    {metric}
                                    {getSortIcon(metric)}
                                    {sortKey && (
                                        <span onClick={(e) => { e.stopPropagation(); handleRemoveSortKey(metric); }} className="ml-0.5 opacity-70 hover:opacity-100 transition-opacity">
                                            <X className="w-3 h-3" />
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                        {sortKeys.length > 0 && (
                            <button onClick={clearAllSorts} className="text-xs text-gray-400 hover:text-red-400 transition-colors underline underline-offset-2">Clear all</button>
                        )}
                    </div>
                )}

                {/* Line Chart */}
                {filteredModels.length === 0 ? (
                    <div className="h-72 flex items-center justify-center bg-gray-50 rounded-lg">
                        <div className="text-center text-gray-500">
                            <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm font-medium">No models match your search</p>
                            <button onClick={() => { setSearchQueryStr(''); setCurrentPage(0); }} className="mt-3 text-xs underline" style={{ color: '#8D1718' }}>Clear search</button>
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
                                {/* ✅ FIX 5: auto domain so log_loss values are not clipped to 100 */}
                                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={{ stroke: '#e5e7eb' }} domain={['auto', 'auto']} />
                                <Tooltip content={() => null} />
                                <Legend content={<CustomLegend />} />
                                {currentModels.map((result) => {
                                    const globalIdx = allResults.indexOf(result);
                                    const modelKey = `${result.algorithm}_${globalIdx}`;
                                    return (
                                        <Line
                                            key={modelKey}
                                            type="monotone"
                                            dataKey={modelKey}
                                            name={result.algorithm}
                                            stroke={getUniqueColor(globalIdx)}
                                            strokeWidth={2}
                                            dot={{ fill: getUniqueColor(globalIdx), r: 4 }}
                                            activeDot={{ r: 6 }}
                                            connectNulls={false}
                                        />
                                    );
                                })}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
            <PortalTooltip />
        </div>
    );
}

export default function F1ModelInferencing() {
    const { F1Mode: F1ModeCtx } = useAIPlayground();
    const launch = F1ModeCtx?.launch;
    const bestAlgorithm = launch?.best_algorithm;
    const bestScore = launch?.best_score;
    const allResults = launch?.all_results || [];
    const firstMetric = launch?.metric?.[0] || 'accuracy';

    if (!launch) {
        return (
            <div className="flex items-center justify-center h-64">
                <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>No launch data available. Run a race first.</p>
            </div>
        );
    }

    return (
        <div className="p-5 mt-2">
            <BestModelCard bestAlgorithm={bestAlgorithm} bestScore={bestScore} metricName={firstMetric} />
            <F1MetricsChart allResults={allResults} />
        </div>
    );
}