import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import { aithemestyle } from '../../../../components/themeContext';
import DataTable from '../../../../components/DataTable';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis, PieChart, Pie, Area, AreaChart } from 'recharts';
import { ArrowUp, ArrowDown, BookOpen, Rocket, Gauge, Bell, Clock, Activity, TrendingUp, Target, Zap } from 'lucide-react';

function ML({ selectedPeriod, refreshKey }) {
    const navigate = useNavigate();
    const { token } = useAuth();
    const hostnameAI = window._env_?.VITE_AI_API;
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedMetric, setSelectedMetric] = useState('all');


    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const sevenDay = selectedPeriod === '7 Days';
                const fifteenDay = selectedPeriod === '15 Days';
                const thirtyDay = selectedPeriod === '30 Days';
                const url = `${hostnameAI}/observability/overall-report?seven_day_avg=${sevenDay}&fifteen_day_avg=${fifteenDay}&thirty_day_avg=${thirtyDay}`;
                const res = await fetch(
                    url,
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );
                const json = await res.json();
                setData(json);
            } catch (e) {
                setData(null);
            }
            setLoading(false);
        }
        fetchData();
    }, [hostnameAI, token, selectedPeriod, refreshKey]);

    if (loading) return (
        <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-3 text-gray-600">Loading...</span>
        </div>
    );
    if (!data) return (
        <div className="flex items-center justify-center py-12">
            <div className="text-red-500 text-center">
                <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="mt-2">Error loading data.</p>
            </div>
        </div>
    );

    let metrics = {};
    let avgPerf = {};
    let predictions = {};
    let dataDrift = {};
    let modelDrift = {};

    metrics = data.data?.metrics || {};
    avgPerf = data.data?.avg_model_performance || {};
    predictions = data.data?.predictions || {};
    dataDrift = data.data?.data_drift?.average_scores || {};
    modelDrift = data.data?.model_drift?.average_metric_shifts || {};


    const perfData = Object.entries(data.data?.model_performance_over_time || {}).map(([date, metrics]) => ({
        date,
        accuracy: metrics?.avg_accuracy != null ? metrics.avg_accuracy * 100 : null,
        precision: metrics?.avg_precision != null ? metrics.avg_precision * 100 : null,
        f1: metrics?.avg_f1 != null ? metrics.avg_f1 * 100 : null,
    }));


    const handleLegendClick = (payload) => {
        if (!payload) return;
        const label = payload.value ?? payload.dataKey ?? payload;
        let key = null;
        if (label === 'Accuracy') key = 'accuracy';
        else if (label === 'Precision') key = 'precision';
        else if (label === 'F1 Score' || label === 'F1') key = 'f1';
        if (!key) return;
        setSelectedMetric(prev => prev === key ? 'all' : key);
    };

    const systemHealthScore = Math.round(data.data?.system_health?.score ?? 0);
    const dataQuality = data.data?.system_health?.data_quality ?? data.data?.system_health?.data_quality ?? null;
    const avgLatencyRaw = data.data?.latency?.average_latency_interval ?? 0;

    const avgLatencyMs = avgLatencyRaw ? Math.round(Number(avgLatencyRaw)) : 0;
    const avgLatencyMin = avgLatencyRaw ? (Number(avgLatencyRaw) / 60000).toFixed(2) : '0.00';

    const modelDriftVal = (data.data?.model_drift?.avg_metrics_shift ?? data.data?.model_drift?.avg_metrics_shift ?? data.data?.model_drift?.average_metrics_shift ?? data.data?.model_drift?.avg_metrics_shift) ?? data.data?.model_drift?.avg_metrics_shift ?? data.data?.model_drift?.avg_metrics_shift ?? null;
    const modelDriftDisplay = modelDriftVal != null ? (typeof modelDriftVal === 'number' ? modelDriftVal.toFixed(3) : modelDriftVal) : '0.000';

    const predictionsCount = data.data?.predictions?.predictions_count ?? data.data?.predictions?.predictions ?? null;

    const StatsCardWithTrend = ({ label, value, icon: IconCmp, trend, trendValue }) => {
        const isUp = trend === "up";
        const TrendIcon = isUp ? ArrowUp : ArrowDown;
        const trendColor = isUp ? "text-emerald-500" : "text-red-500";

        return (
            <div className="bg-white rounded-xl px-4 py-3 flex flex-col justify-center min-h-[90px] gap-3">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <IconCmp className="w-4 h-4 shrink-0" style={{ color: aithemestyle.iconColor }} />
                        <span className="text-[#282f49] text-[18px] font-medium truncate">{label}</span>
                    </div>
                    <div className="text-3xl font-normal text-[#818181] tabular-nums leading-none shrink-0">
                        {value == null ? <div className="h-6 w-14 bg-gray-200 rounded animate-pulse" /> : value}
                    </div>
                </div>

                {(trend && trendValue && value != null) && (
                    <div className={`flex items-center gap-1 ${trendColor} text-sm font-semibold leading-none justify-end`}>
                        <TrendIcon className="w-4 h-4" />
                        <span className="tabular-nums">{trendValue}</span>
                    </div>
                )}
            </div>
        );
    };


    const recentAlerts = data.data?.alerts?.recent_alerts || [];


    const activeModels = data.data?.metrics?.deployed_models ?? 0;
    const avgAccuracy = avgPerf.train?.accuracy ? `${(avgPerf.train.accuracy * 100).toFixed(1)}%` : '0%';
    const p95Latency = avgLatencyRaw ? `${Math.round(Number(avgLatencyRaw))}ms` : '0ms';

    const handleModelClick = async (m) => {
        try {
            const res = await fetch(`${hostnameAI}/canvas/model_list?model_id=${encodeURIComponent(m.model_id)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch model data');
            const list = await res.json();
            const modelData = Array.isArray(list) && list.length > 0 ? list[0] : m;
            navigate(`/ai/hub/models/library/${encodeURIComponent(String(m.model_id))}`, { state: { modelData } });
        } catch (e) {
            console.error(e);

            navigate(`/ai/hub/models/library/${encodeURIComponent(String(m.model_id))}`, { state: { modelData: m } });
        }
    };

    return (
        <div className="space-y-6 mx-auto pt-6 pb-6">


            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">


                <div className="lg:col-span-3">
                    <div className="bg-white rounded-2xl p-6 flex flex-col items-center h-full">
                        <div className="w-64 h-52 relative">
                            <RadialBarChart
                                width={256}
                                height={208}
                                innerRadius="80%"
                                outerRadius="100%"
                                data={[{ value: systemHealthScore }]}
                                startAngle={90}
                                endAngle={-270}
                            >
                                <defs>
                                    <linearGradient id="gr" x1="0" x2="1" y1="0" y2="1">
                                        <stop offset="0%" stopColor="#8e78b7" />
                                        <stop offset="100%" stopColor="#8e78b7" />
                                    </linearGradient>
                                </defs>

                                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />

                                <RadialBar
                                    minAngle={15}
                                    background
                                    clockWise={false}
                                    cornerRadius={999}
                                    dataKey="value"
                                    fill="url(#gr)"
                                    isAnimationActive={true}
                                    animationDuration={1200}
                                />
                            </RadialBarChart>

                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <div className="text-4xl sm:text-5xl font-extrabold tabular-nums text-[#818181]">
                                    {systemHealthScore}
                                </div>
                                <div className="text-xs tracking-widest text-[#282f49] mt-1">HEALTH SCORE</div>
                            </div>
                        </div>

                        <div className="mt-4 text-[18px] font-medium text-[#282f49]">System Health</div>
                    </div>
                </div>


                <div className="lg:col-span-5">
                    <div className="grid grid-cols-2 gap-6 h-full">
                        <div className="bg-white rounded-xl p-3 flex flex-col justify-between">
                            <div className="flex items-center gap-2 py-2 pl-2">
                                <BookOpen className="w-5 h-5 shrink-0" style={{ color: aithemestyle.iconColor }} />
                                <span className="text-[18px] font-medium text-[#282f49]">Model Drift</span>
                            </div>
                            <div className="py-2 pl-2">
                                <div className="text-2xl font-normal text-[#818181] tabular-nums">
                                    {modelDriftDisplay ? `${(modelDriftDisplay * 100).toFixed(1)}%` : '0%'}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-3 flex flex-col justify-between">
                            <div className="flex items-center gap-2 py-2 pl-2">
                                <Rocket className="w-5 h-5 shrink-0" style={{ color: aithemestyle.iconColor }} />
                                <span className="text-[18px] font-medium text-[#282f49]">Accuracy</span>
                            </div>
                            <div className="py-2 pl-2">
                                <div className="text-2xl font-normal text-[#818181] tabular-nums">
                                    {avgPerf.train?.accuracy ? `${(avgPerf.train.accuracy * 100).toFixed(1)}%` : '0%'}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-3 flex flex-col justify-between">
                            <div className="flex items-center gap-2 py-2 pl-2">
                                <Gauge className="w-5 h-5 shrink-0" style={{ color: aithemestyle.iconColor }} />
                                <span className="text-[18px] font-medium text-[#282f49]">Avg Latency</span>
                            </div>
                            <div className="py-2 pl-2">
                                <div className="text-2xl font-normal text-[#818181] tabular-nums">{avgLatencyMin} min</div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-3 flex flex-col justify-between">
                            <div className="flex items-center gap-2 py-2 pl-2">
                                <Clock className="w-5 h-5 shrink-0" style={{ color: aithemestyle.iconColor }} />
                                <span className="text-[18px] font-medium text-[#282f49]">Data Quality</span>
                            </div>
                            <div className="py-2 pl-2">
                                <div className="text-2xl font-normal text-[#818181] tabular-nums">
                                    {dataQuality != null ? `${dataQuality}%` : 'N/A'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>


                <div className="lg:col-span-4">
                    <div className="bg-white rounded-xl p-4 h-full">
                        <h3 className="text-[18px] font-medium text-[#282f49] mb-3">Recent Alerts</h3>
                        <div className="flex flex-col gap-2">
                            {recentAlerts.slice(0, 4).map((a, i) => {
                                const iconColor =
                                    a.severity === 'critical'
                                        ? 'text-red-500'
                                        : a.severity === 'warning'
                                        ? 'text-yellow-400'
                                        : 'text-cyan-400';

                                return (
                                    <div
                                        key={i}
                                        className="bg-gray-50 rounded-lg px-3 py-2 flex items-start gap-3"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div
                                                className="text-xs font-medium text-[#282f49] truncate"
                                                title={a.run_name ?? 'Unknown'}
                                            >
                                                {a.run_name ?? 'Unknown'}
                                            </div>
                                            <div className="text-[10px] text-[#282f49]">
                                                {a.alert_type} · {new Date(a.timestamp).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <Bell className={`w-4 h-4 ${iconColor} shrink-0`} />
                                    </div>
                                );
                            })}

                            {recentAlerts.length === 0 && (
                                <div className="text-xs text-gray-500 text-center py-4">No recent alerts</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>


            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatsCardWithTrend
                    label="Active Models"
                    value={activeModels}
                    icon={Activity}
                />
                <StatsCardWithTrend
                    label="Predictions"
                    value={predictionsCount}
                    icon={TrendingUp}
                />
                <StatsCardWithTrend
                    label="Average Model Drift"
                    value={modelDriftVal != null ? `${(modelDriftVal * 100).toFixed(1)}%` : '0%'}
                    icon={BookOpen}
                />
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                <div className="lg:col-span-7 bg-white rounded-xl p-6">
                    <h3 className="text-[18px] font-medium text-[#282f49] mb-6">Model Performance Over Time</h3>

                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={perfData}>
                            <defs>
                                <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#34d399" stopOpacity={0.1}/>
                                </linearGradient>
                                <linearGradient id="colorPrecision" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.1}/>
                                </linearGradient>
                                <linearGradient id="colorF1" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8e78b7" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#8e78b7" stopOpacity={0.1}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#6b7280" />
                            <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                            <Tooltip contentStyle={{ fontSize: '12px', backgroundColor: '#fff', border: '1px solid #e5e7eb' }} />

                            <Legend onClick={handleLegendClick} wrapperStyle={{ cursor: 'pointer' }} />


                            {(selectedMetric === 'all' || selectedMetric === 'f1') && (
                                <Area type="monotone" dataKey="f1" stroke="#8e78b7" strokeWidth={2} fillOpacity={1} fill="url(#colorF1)" name="F1 Score" />
                            )}
                            {(selectedMetric === 'all' || selectedMetric === 'precision') && (
                                <Area type="monotone" dataKey="precision" stroke="#a78bfa" strokeWidth={2} fillOpacity={1} fill="url(#colorPrecision)" name="Precision" />
                            )}
                            {(selectedMetric === 'all' || selectedMetric === 'accuracy') && (
                                <Area type="monotone" dataKey="accuracy" stroke="#34d399" strokeWidth={2} fillOpacity={1} fill="url(#colorAccuracy)" name="Accuracy" />
                            )}
                        </AreaChart>
                    </ResponsiveContainer>
                </div>


                <div className="lg:col-span-5 bg-white rounded-xl p-6">
                    <h3 className="text-[18px] font-medium text-[#282f49] mb-6">Predictions Distribution</h3>
                    <div className="flex items-center justify-between h-[300px]">

                        <div className="flex-shrink-0" style={{ width: '60%', height: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Tooltip />
                                    <Pie
                                        data={Object.entries(data.data?.predictions_distribution || {}).map(([type, count]) => ({
                                            name: type.charAt(0).toUpperCase() + type.slice(1),
                                            value: count,
                                        }))}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        fill="#8e78b7"
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>


                        <div className="flex flex-col justify-center gap-3 pl-4" style={{ width: '40%' }}>
                            {Object.entries(data.data?.predictions_distribution || {}).map(([type, count], idx) => (
                                <div key={type} className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{
                                            backgroundColor: idx === 0 ? '#8e78b7' : `hsl(${280 - idx * 40}, 70%, 65%)`
                                        }}
                                    />
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-base font-medium text-[#282f49] truncate">
                                            {type.charAt(0).toUpperCase() + type.slice(1)}
                                        </span>
                                        <span className="text-base font-medium text-[#282f49]">{count}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                <div className="bg-white rounded-xl p-6">
                    <h3 className="text-[18px] font-medium text-[#282f49] mb-6">Data Drift Over Time</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart
                            data={Object.entries(data.data?.data_drift_over_time || {}).map(([date, val]) => ({
                                date,
                                value: val == null ? null : Number(val),
                            }))}
                            margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorDataDrift" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#6b7280" />
                            <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                            <Tooltip
                                formatter={(value) => (value == null ? 'N/A' : value)}
                                contentStyle={{ fontSize: '12px', backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#ef4444"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorDataDrift)"
                                connectNulls={false}
                                name="Data Drift"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>


                <div className="bg-white rounded-xl p-6">
                    <h3 className="text-[18px] font-medium text-[#282f49] mb-6">Prediction Drift Over Time</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart
                            data={Object.entries(data.data?.prediction_drift_over_time || {}).map(([date, val]) => ({
                                date,
                                value: val == null ? null : Number(val),
                            }))}
                            margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorPredictionDrift" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#6b7280" />
                            <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                            <Tooltip
                                formatter={(value) => (value == null ? 'N/A' : value)}
                                contentStyle={{ fontSize: '12px', backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorPredictionDrift)"
                                connectNulls={false}
                                name="Prediction Drift"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>


            <div className="bg-white rounded-xl p-6">
                <h3 className="text-[18px] font-medium text-[#282f49] mb-4">Model Performance</h3>
                <DataTable
                    columns={[
                        {
                            key: 'model_name',
                            label: 'Model',
                            sortable: true,
                            render: (row) => (
                                <div className="cursor-pointer text-[#8e78b7] hover:underline" onClick={() => handleModelClick(row)} title={row.model_name}>
                                    {row.model_name}
                                </div>
                            )
                        },
                        {
                            key: 'train_metrics',
                            label: 'Accuracy',
                            sortable: false,
                            render: (row) => {
                                const acc = row.train_metrics?.accuracy;
                                return typeof acc === 'number' ? `${(acc * 100).toFixed(1)}%` : 'N/A';
                            }
                        },
                        {
                            key: 'f1',
                            label: 'F1',
                            sortable: false,
                            render: (row) => {
                                const f1 = row.train_metrics?.f1;
                                return typeof f1 === 'number' ? `${(f1 * 100).toFixed(1)}%` : 'N/A';
                            }
                        },
                        {
                            key: 'latency',
                            label: 'Latency',
                            sortable: false,
                            render: (row) => {
                                const latencyDisplay = row.latency != null 
                                    ? `${Math.round(Number(row.latency))}ms`
                                    : (avgLatencyMs ? `${avgLatencyMs}ms` : 'N/A');
                                return latencyDisplay;
                            }
                        },
                        {
                            key: 'status',
                            label: 'Status',
                            sortable: false,
                            render: (row) => {
                                const acc = row.train_metrics?.accuracy;
                                let statusLabel = 'No Data';
                                let statusClass = 'bg-gray-100 text-gray-700';
                                let customStyle = {};
                                if (typeof acc === 'number') {
                                    if (acc >= 0.9) {
                                        statusLabel = 'Healthy';
                                        statusClass = 'bg-emerald-100 text-emerald-800';
                                    } else if (acc >= 0.7) {
                                        statusLabel = 'Good';
                                        statusClass = 'text-xs font-medium';
                                        customStyle = { backgroundColor: '#2AC79240', color: '#047857' };
                                    } else {
                                        statusLabel = 'Low';
                                        statusClass = 'text-xs font-medium';
                                        customStyle = { backgroundColor: '#FBD6E5', color: '#EF4D5F' };
                                    }
                                }
                                return (
                                    <span 
                                        className={`inline-flex items-center px-2.5 py-1.5 rounded-md ${statusClass}`}
                                        style={customStyle}
                                    >
                                        {statusLabel}
                                    </span>
                                );
                            }
                        }
                    ]}
                    data={data.data?.model_performance || []}
                    isLoading={loading}
                />
            </div>

        </div>
    );
}

export default ML;