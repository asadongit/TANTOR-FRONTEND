/**
 * @file ChartBlock.jsx
 * @description Renders various visual charts (bar, line, area, pie) using recharts
 * based on a parsed JSON configuration payload.
 */

import React from 'react';
import {

    ResponsiveContainer, BarChart, Bar, LineChart, Line,
    PieChart, Pie, AreaChart, Area, XAxis, YAxis,
    CartesianGrid, Tooltip, Legend, Cell
} from 'recharts';

const CHART_COLORS = ['#4285F4', '#34C759', '#FF9F0A', '#AF52DE', '#FF3B30', '#5856D6', '#007AFF'];

export const ChartBlock = ({ config }) => {
    const [data, setData] = React.useState(null);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        try {
            const parsed = JSON.parse(config);
            setData(parsed);
        } catch (e) {
            setError('Invalid chart configuration');
        }
    }, [config]);

    if (error) return <div style={{ padding: 12, color: '#DC2626', fontSize: 13 }}>{error}</div>;
    if (!data) return null;

    const { type, title, data: chartData = [], xKey = '', yKeys = [] } = data || {};

    const renderChart = () => {
        if (!Array.isArray(chartData) || chartData.length === 0) {
            return <div style={{ padding: 20, textAlign: 'center', color: '#8E8E93', fontSize: 13 }}>No chart data available</div>;
        }

        if (type !== 'pie' && (!yKeys || !Array.isArray(yKeys) || yKeys.length === 0)) {
            return <div style={{ padding: 20, textAlign: 'center', color: '#8E8E93', fontSize: 13 }}>Incomplete chart configuration (missing y-keys)</div>;
        }

        const commonProps = {
            data: chartData,
            margin: { top: 20, right: 30, left: 20, bottom: 20 }
        };

        switch (type) {
            case 'bar':
                return (
                    <BarChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F1F0" />
                        <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8E8E93' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8E8E93' }} />
                        <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: 'var(--shadow-lg)' }} />
                        <Legend verticalAlign="top" height={36} />
                        {yKeys.map((key, i) => (
                            <Bar key={key} dataKey={key} fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[4, 4, 0, 0]} />
                        ))}
                    </BarChart>
                );
            case 'line':
                return (
                    <LineChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F1F0" />
                        <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8E8E93' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8E8E93' }} />
                        <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: 'var(--shadow-lg)' }} />
                        <Legend verticalAlign="top" height={36} />
                        {yKeys.map((key, i) => (
                            <Line key={key} type="monotone" dataKey={key} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        ))}
                    </LineChart>
                );
            case 'area':
                return (
                    <AreaChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F1F0" />
                        <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8E8E93' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8E8E93' }} />
                        <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: 'var(--shadow-lg)' }} />
                        <Legend verticalAlign="top" height={36} />
                        {yKeys.map((key, i) => (
                            <Area key={key} type="monotone" dataKey={key} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.1} />
                        ))}
                    </AreaChart>
                );
            case 'pie':
                return (
                    <PieChart>
                        <Pie
                            data={chartData}
                            dataKey={yKeys[0]}
                            nameKey={xKey}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={{ fontSize: 12, fill: '#1C1C1E' }}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`pie-${entry[xKey] || index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: 'var(--shadow-lg)' }} />
                        <Legend />
                    </PieChart>
                );
            default:
                return <div>Unsupported chart type: {type}</div>;
        }
    };

    return (
        <div style={{
            margin: '20px 0',
            padding: '24px',
            background: 'white',
            borderRadius: 16,
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)'
        }}>
            {title && <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20, textAlign: 'center' }}>{title}</div>}
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                    {renderChart()}
                </ResponsiveContainer>
            </div>
        </div>
    );
};
