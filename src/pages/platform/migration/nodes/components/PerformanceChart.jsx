import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const PerformanceChart = ({ performanceData }) => {
  // Convert metrics to percentage and format data for the chart
  const formatData = () => {
    if (!performanceData) return [];

    const metricsToInclude = ['accuracy', 'precision', 'recall', 'f1', 'roc_auc'];

    return metricsToInclude.map(metric => ({
      name: metric.charAt(0).toUpperCase() + metric.slice(1).replace('_', ' '),
      value: Math.round(performanceData[metric] * 10000) / 100
    }));
  };

  const data = formatData();

  return (
    <div className="w-full h-64 mt-4 mb-6">
      {/* <h4 className="text-lg mb-2 text-white">Performance Metrics</h4> */}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis
            dataKey="name"
            tick={{ fill: '#fff' }}
            angle={0}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tick={{ fill: '#fff' }}
            domain={[0, 100]}
            label={{
              // value: 'Percentage (%)',
              angle: -90,
              position: 'insideLeft',
              fill: '#fff',
              offset: 0
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '0.375rem',
              color: '#fff'
            }}
            formatter={(value) => [`${value}%`]}
          />
          {/* Add reference lines for better readability */}
          {/* <ReferenceLine y={90} stroke="#666" strokeDasharray="3 3" />
          <ReferenceLine y={95} stroke="#666" strokeDasharray="3 3" /> */}
          <Line
            type="monotone"
            dataKey="value"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{
              stroke: '#3b82f6',
              strokeWidth: 2,
              r: 4,
              fill: '#1f2937'
            }}
            activeDot={{
              stroke: '#3b82f6',
              strokeWidth: 2,
              r: 6,
              fill: '#60a5fa'
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PerformanceChart;