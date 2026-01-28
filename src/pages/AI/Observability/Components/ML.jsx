import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer } from 'recharts';
import { ArrowUp, ArrowDown, BookOpen, Rocket, Gauge, Bell } from 'lucide-react';

function ML({ project, model }) {
    const { token } = useAuth();
    const hostnameAI = window._env_?.VITE_AI_API;
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [driftOrder, setDriftOrder] = useState('most');


    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                let url;
                if (project && project.id && model && model.model_id) {
                    url = `${hostnameAI}/observability/reporting?model=true&model_id=${model.model_id}&project=true&project_id=${project.id}&overall=false`;
                } else {
                    url = `${hostnameAI}/observability/reporting?model=false&project=false&overall=true`;
                }
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
    }, [hostnameAI, token, project, model]);

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
    let modelProjectModeLatency = {};

    if (project && project.id && model && model.model_id && data.data) {
        metrics = data.data.metrics || {};
        predictions = data.data.predictions || {};

        avgPerf = {
            train: {
                accuracy: metrics.train_metrics?.train_accuracy ?? 0,
                precision: metrics.train_metrics?.train_precision ?? 0,
                recall: metrics.train_metrics?.train_recall ?? 0,
                f1: metrics.train_metrics?.train_f1 ?? 0
            },
            test: {
                accuracy: metrics.test_metrics?.test_accuracy ?? 0,
                precision: metrics.test_metrics?.test_precision ?? 0,
                recall: metrics.test_metrics?.test_recall ?? 0,
                f1: metrics.test_metrics?.test_f1 ?? 0
            }
        };

        modelProjectModeLatency = data.data.latency?.average_latency || 'N/A';

        dataDrift = data.data.data_drift?.latest_score?.aggregated_metrics || {};

        modelDrift = data.data.model_drift?.current_metrics || {};
    } else {

      metrics = data.data?.metrics || {};
        avgPerf = data.data?.avg_model_performance || {};
        predictions = data.data?.predictions || {};
        dataDrift = data.data?.data_drift?.average_scores || {};
        modelDrift = data.data?.model_drift?.average_metric_shifts || {};
    }

    const perfData = [
        { name: 'Accuracy', Train: (avgPerf.train?.accuracy * 100).toFixed(2), Test: (avgPerf.test?.accuracy * 100).toFixed(2) },
        { name: 'Precision', Train: (avgPerf.train?.precision * 100).toFixed(2), Test: (avgPerf.test?.precision * 100).toFixed(2) },
        { name: 'Recall', Train: (avgPerf.train?.recall * 100).toFixed(2), Test: (avgPerf.test?.recall * 100).toFixed(2) },
        { name: 'F1', Train: (avgPerf.train?.f1 * 100).toFixed(2), Test: (avgPerf.test?.f1 * 100).toFixed(2) }
    ];

    const dataDriftEntries = Object.entries(dataDrift)
        .map(([name, value]) => ({ name, value }));
    const dataDriftData = dataDriftEntries
        .sort((a, b) =>
            driftOrder === 'most'
                ? Math.abs(b.value) - Math.abs(a.value)
                : Math.abs(a.value) - Math.abs(b.value)
        )
        .slice(0, 5);

    const modelDriftData = [
        { name: 'ROCAUC', value: modelDrift.roc_auc },
        { name: 'Accuracy', value: modelDrift.accuracy },
        { name: 'Log Loss', value: modelDrift.log_loss },
        { name: 'Macro F1', value: modelDrift.macro_f1 }
    ];

    const StatsCardWithTrend = ({ label, value, icon: IconCmp, trend, trendValue }) => {
        const isUp = trend === "up";
        const TrendIcon = isUp ? ArrowUp : ArrowDown;
        const trendColor = isUp ? "text-emerald-500" : "text-red-500";

        return (
            <div className="bg-white rounded-xl px-6 py-5 border border-purple-200 flex flex-col justify-between min-h-[120px]">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <IconCmp className="w-5 h-5 text-[#8e78b7] shrink-0" />
                        <span className="text-gray-900 text-xl font-medium truncate">{label}</span>
                    </div>
                </div>

                <div className="flex items-end justify-between mt-6">
                    <div className="text-2xl font-bold text-gray-900 tabular-nums leading-none">
                        {value == null ? <div className="h-10 w-16 bg-gray-200 rounded animate-pulse" /> : value}
                    </div>

                    {(trend && trendValue && value != null) ? (
                        <div className={`flex items-center gap-2 ${trendColor} text-xl font-semibold leading-none`}>
                            <TrendIcon className="w-7 h-7" />
                            <span className="tabular-nums">{trendValue}</span>
                        </div>
                    ) : (
                        <div className="h-7 w-14" />
                    )}
                </div>
            </div>
        );
    };

    const isProjectModelMode = project && project.id && model && model.model_id && data.data;

    const metricsData = [
        {
            title: "Total Projects",
            value: metrics.total_projects,
            trend: null,
            trendValue: "",
            icon: BookOpen,
            show: !isProjectModelMode,
        },
        {
            title: "Total Models",
            value: metrics.total_models,
            trend: null,
            trendValue: "",
            icon: Rocket,
            show: !isProjectModelMode,
        },
        {
            title: "Predictions",
            value: predictions.predictions_with_confidence ?? predictions.predictions,
            trend: null,
            trendValue: "",
            icon: Gauge,
            show: true,
        },
        {
            title: isProjectModelMode ? "Avg Latency" : "Avg Accuracy",
            value: isProjectModelMode ? modelProjectModeLatency : (avgPerf.train?.accuracy ? `${(avgPerf.train.accuracy * 100).toFixed(1)}%` : "0%"),
            trend: null,
            trendValue: "",
            icon: Gauge,
            show: true,
        }
    ].filter(stat => stat.show);

    return (
        <div className="space-y-8 mt-4 px-4 sm:px-6 lg:px-8">

            <div className={`bg-gradient-to-r from-[#8e78b7] via-purple-300 to-purple-100 rounded-xl p-4`}>
                <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${isProjectModelMode ? '2' : '4'} gap-4`}>
                    {metricsData.map((stat, index) => (
                        <StatsCardWithTrend
                            key={index}
                            label={stat.title}
                            value={stat.value}
                            icon={stat.icon}
                            trend={stat.trend}
                            trendValue={stat.trendValue}
                        />
                    ))}
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Average Model Performance</h3>
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={perfData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip contentStyle={{ fontSize: '12px' }} />
                        <Legend />
                        <Bar dataKey="Train" fill="#8e78b7" />
                        <Bar dataKey="Test" fill="#a78bfa" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-md font-semibold text-gray-900">Data Drift</h3>
                        <div className="flex gap-2">
                            <button
                                className={`px-3 py-1 rounded text-xs font-medium border ${driftOrder === 'most' ? 'bg-purple-200 border-purple-400 text-purple-900' : 'bg-white border-gray-300 text-gray-700'}`}
                                onClick={() => setDriftOrder('most')}
                            >
                                Most Drift
                            </button>
                            <button
                                className={`px-3 py-1 rounded text-xs font-medium border ${driftOrder === 'least' ? 'bg-purple-200 border-purple-400 text-purple-900' : 'bg-white border-gray-300 text-gray-700'}`}
                                onClick={() => setDriftOrder('least')}
                            >
                                Least Drift
                            </button>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={dataDriftData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip contentStyle={{ fontSize: '12px' }} />
                            <Line type="monotone" dataKey="value" stroke="#8e78b7" strokeWidth={3} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6">
                    <h3 className="text-md font-semibold text-gray-900 mb-6">Model Drift</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={modelDriftData}>
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip contentStyle={{ fontSize: '12px' }} />
                            <Line type="monotone" dataKey="value" stroke="#a78bfa" strokeWidth={3} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {isProjectModelMode && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Feature Drift Details</h3>
                    <div className="overflow-x-auto">
                        {(() => {
                            const features = data.data.data_drift?.latest_score?.report_1_raw_features || [];
                            if (features.length === 0) return <p className="text-gray-500">No feature data available.</p>;
                            const columns = Array.from(new Set(features.flatMap(f => Object.keys(f))));
                            return (
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            {columns.map(col => (
                                                <th key={col} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    {col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {features.map((feature, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                {columns.map(col => (
                                                    <td key={col} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {feature[col] != null ? (typeof feature[col] === 'number' ? feature[col].toFixed(4) : feature[col]) : 'N/A'}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            );
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
}

export default ML;
