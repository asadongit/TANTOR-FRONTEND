import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area, ResponsiveContainer, LabelList } from 'recharts';
import { ArrowUp, ArrowDown, BookOpen, Rocket, Gauge, Bell, Clock, Activity, TrendingUp, Target, Zap } from 'lucide-react';
import { useAuth } from '../../../../../../../context/AuthContext';
import { aithemestyle } from '../../../../../../../components/themeContext';
function Observability({ modelData }) {
    if (!modelData) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-gray-600">No model data available</div>
            </div>
        );
    }

    const { token } = useAuth();
    const hostnameAI = window._env_?.VITE_AI_API;
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState('7 Days');
    const [refreshKey, setRefreshKey] = useState(0);
    const [selectedClass, setSelectedClass] = useState(null); // New state for selected class

    const featureImportance = data?.data?.feature_importance?.data || {};
    const isMulticlass = data?.data?.feature_importance?.multiclass;

    // Set default selectedClass to first key if multiclass and not set
    useEffect(() => {
        if (data && isMulticlass && !selectedClass && Object.keys(featureImportance).length > 0) {
            setSelectedClass(Object.keys(featureImportance)[0]);
        }
    }, [data, isMulticlass, featureImportance, selectedClass]);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const sevenDay = selectedPeriod === '7 Days';
                const fifteenDay = selectedPeriod === '15 Days';
                const thirtyDay = selectedPeriod === '30 Days';
                const url = `${hostnameAI}/observability/model-report?model_id=${encodeURIComponent(modelData.id)}&seven_day_avg=${sevenDay}&fifteen_day_avg=${fifteenDay}&thirty_day_avg=${thirtyDay}`;
                const res = await fetch(url, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok) {
                    console.error('Fetch failed with status:', res.status, res.statusText);
                    throw new Error(`HTTP ${res.status}`);
                }
                const json = await res.json();
                setData(json);
            } catch (e) {
                console.error('Error fetching data:', e);
                setData(null);
            }
            setLoading(false);
        }
        fetchData();
    }, [hostnameAI, token, selectedPeriod, refreshKey, modelData.id]);

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

    const avgPerf = data.data?.avg_model_performance?.train || {};
    const dataDriftRaw = data.data?.data_drift?.avg_psi ?? null;
    const dataDrift = dataDriftRaw !== null
        ? Number(dataDriftRaw.toExponential(2).split('e')[0])
        : null;
    console.log("data frift", dataDrift);
    const modelDrift = data.data?.model_drift?.avg_metrics_shift ?? null;
    const predictionsCount = data.data?.predictions?.predictions_count ?? 0;
    const avgLatency = data.data?.latency?.average_latency_interval ?? 0;
    const avgLatencyMin = avgLatency ? (Number(avgLatency) / 60000).toFixed(2) : '0.00';
    
    // Check if model is regression
    const isRegressionModel = modelData.modeling_type === 'regression' || (avgPerf.r2 !== null  && avgPerf.rmse !==  null );

    const dataDriftData = Object.entries(data.data?.data_drift_over_time || {}).map(([date, val]) => ({
        date,
        value: val == null ? null : Number(val),
    }));

    const predictionDriftData = Object.entries(data.data?.prediction_drift_over_time || {}).map(([date, val]) => ({
        date,
        value: val == null ? null : Number(val),
    }));

    // Replace the featureData builder with this updated version that uses original importance (max 1),
    // sorts descending, limits to top 7, and adds rank & a combined label for the Y axis.
    const featureData = (() => {
        // helper to convert the importance map to a standard array
        const toArray = (importanceObj) =>
            Object.entries(importanceObj || {}).map(([feature, importance]) => ({
                feature,
                originalImportance: Number(importance) || 0, // value expected in [0,1]
            }));

        let arr = [];
        if (isMulticlass && selectedClass && featureImportance[selectedClass]) {
            arr = toArray(featureImportance[selectedClass]);
        } else if (!isMulticlass && featureImportance.global_importance) {
            arr = toArray(featureImportance.global_importance);
        }

        // sort desc, keep top 7 (like the provided image), and add rank + label
        arr = arr
            .sort((a, b) => b.originalImportance - a.originalImportance)
            .slice(0, 7)
            .map((item, idx) => ({
                ...item,
                importance: item.originalImportance, // use as-is, domain will be [0,1]
                rank: idx + 1,
                featureLabel: `#${idx + 1}  ${item.feature}`, // left-side label (rank + feature)
            }));

        return arr;
    })();

    const periods = ['7 Days', '15 Days', '30 Days'];

    const StatsCard = ({ label, value, icon: IconCmp }) => (
        <div className="bg-white rounded-xl px-4 py-4 flex flex-col justify-between min-h-[110px] min-w-0">
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <IconCmp className="w-[19px] h-[19px] text-[#8e78b7] shrink-0" />
                    <span className="satoshi-medium-md truncate leading-none">{label}</span>
                </div>
            </div>

            <div className="flex items-end justify-between mt-4">
                <div className="font-bold text-gray-900 tabular-nums leading-none">
                    {value == null ? (
                        <div
                            className="bg-gray-200 rounded animate-pulse"
                            style={{ width: '19px', height: '27px', opacity: 1 }}
                        />
                    ) : (
                        <span
                            className="text-[19px]"
                            style={{
                                display: 'inline-block',
                                width: 'auto',
                                height: '27px',
                                lineHeight: '27px',
                                opacity: 1,
                            }}
                        >
                            {value}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 px-6 pt-2 pb-1 mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h1 className="text-2xl sm:text-3xl font-medium text-gray-900"></h1>
                <div className="flex items-center gap-2">
                    <div className="inline-flex rounded-md" role="group" aria-label="Periods">
                        {periods.map(p => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => setSelectedPeriod(p)}
                                className={`px-2 py-1 text-sm -ml-px border-[1px] border-[#8e78b7] first:ml-0 first:rounded-l-md last:rounded-r-md focus:outline-none
                                    ${selectedPeriod === p
                                        ? 'bg-[#8e78b7] text-white'
                                        : 'bg-transparent text-gray-700'
                                    }`}
                                aria-pressed={selectedPeriod === p}
                            >
                                {p}
                            </button>
                        ))}
                    </div>

                </div>
            </div>

            <div className={`${aithemestyle.statsCardGradient270} rounded-xl p-4`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {isRegressionModel ? (
                        <>
                            <StatsCard
                                label="R² Score"
                                value={avgPerf.r2 !== undefined ? `${(avgPerf.r2).toFixed(3)}` : 'N/A'}
                                icon={Target}
                            />
                            <StatsCard
                                label="MAE"
                                value={avgPerf.mae !== undefined ? `${(avgPerf.mae).toFixed(2)}` : 'N/A'}
                                icon={TrendingUp}
                            />
                            <StatsCard
                                label="RMSE"
                                value={avgPerf.rmse !== undefined ? `${(avgPerf.rmse).toFixed(2)}` : 'N/A'}
                                icon={Activity}
                            />
                            <StatsCard
                                label="MAPE"
                                value={avgPerf.mape !== undefined ? `${(avgPerf.mape * 100).toFixed(2)}%` : 'N/A'}
                                icon={Zap}
                            />
                        </>
                    ) : (
                        <>
                            <StatsCard
                                label="Accuracy"
                                value={avgPerf.accuracy ? `${(avgPerf.accuracy * 100).toFixed(1)}%` : 'N/A'}
                                icon={Target}
                            />
                            <StatsCard
                                label="Precision"
                                value={avgPerf.precision ? `${(avgPerf.precision * 100).toFixed(1)}%` : 'N/A'}
                                icon={TrendingUp}
                            />
                            <StatsCard
                                label="Recall"
                                value={avgPerf.recall ? `${(avgPerf.recall * 100).toFixed(1)}%` : 'N/A'}
                                icon={Activity}
                            />
                            <StatsCard
                                label="F1 Score"
                                value={avgPerf.f1 ? `${(avgPerf.f1 * 100).toFixed(1)}%` : 'N/A'}
                                icon={Zap}
                            />
                        </>
                    )}
                    <StatsCard
                        label="Model Drift"
                        value={modelDrift != null ? `${(modelDrift * 100).toFixed(1)}%` : 'N/A'}
                        icon={BookOpen}
                    />
                    <StatsCard
                        label="Data Drift (PSI)"
                        value={dataDrift != null ? dataDrift.toFixed(2) : 'N/A'}
                        icon={Gauge}
                    />
                    <StatsCard
                        label="Predictions Count"
                        value={predictionsCount}
                        icon={Clock}
                    />
                    <StatsCard
                        label="Avg Latency"
                        value={`${avgLatencyMin} min`}
                        icon={Bell}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Data Drift Over Time</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={dataDriftData}>
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

                <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Prediction Drift Over Time</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={predictionDriftData}>
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

            <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-start justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">Feature Importance</h3>
                    {isMulticlass && (
                        <div className="ml-4">
                            <label htmlFor="class-select" className="sr-only">Select Class</label>
                            <select
                                id="class-select"
                                value={selectedClass || ''}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="block w-full max-w-[400px] px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                            >
                                {Object.keys(featureImportance).map((cls) => (
                                    <option key={cls} value={cls}>Class {cls}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={featureData} layout="vertical" margin={{ top: 10, right: 60, left: 20, bottom: 10 }}>
                        <defs>
                            {/* preserve existing chart color */}
                            <linearGradient id="featureImportanceGrad" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#8e78b7" stopOpacity={1} />
                                <stop offset="100%" stopColor="#8e78b7" stopOpacity={1} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis
                            type="number"
                            domain={[0, 1]}
                            tick={{ fontSize: 12 }}
                            stroke="#6b7280"
                            allowDecimals={true}
                        />
                        <YAxis
                            dataKey="featureLabel"
                            type="category"
                            tick={{ fontSize: 13, fill: '#374151' }}
                            // remove the leading rank prefix like "#1 " so only feature name shows
                            tickFormatter={(val) => String(val).replace(/^#\d+\s+/, '')}
                            stroke="#6b7280"
                            width={220}
                        />
                        <Tooltip
                            formatter={(value) => (value == null ? 'N/A' : Number(value).toFixed(3))}
                            contentStyle={{ fontSize: '12px', backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                        />
                        <Bar dataKey="importance" fill="url(#featureImportanceGrad)" barSize={18} radius={[6, 6, 6, 6]}>
                            <LabelList
                                dataKey="originalImportance"
                                position="right"
                                formatter={(val) => (val == null ? '' : Number(val).toFixed(3))}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

export default Observability;