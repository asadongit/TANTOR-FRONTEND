import React from 'react';
import { TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const MetricsChart = ({ metricsData, apiResults, truncateName, legendTruncateLength, chartColors }) => {
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-semibold text-gray-700 mb-2">{payload[0].payload.metric}</p>
          {payload.map((entry, index) => {
            const displayName = entry.name || entry.dataKey.split('_').slice(0, -1).join('_');
            
            const fullModelName = apiResults.find((result, idx) => 
              entry.dataKey === `${truncateName(result.run_name, legendTruncateLength)}_${idx}`
            )?.run_name || displayName;
            
            return (
              <p key={index} className="text-xs text-gray-600">
                <span style={{ color: entry.color }}>●</span> {fullModelName}: {entry.value}%
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className='bg-gray-50 p-4 rounded-lg'>
      <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#8e78b7]" />
            <h2 className="text-lg font-semibold text-gray-900">Model Metrics Comparison</h2>
          </div>
        </div>

        <p className="text-xs text-gray-500 mb-4">Accuracy, precision, recall & F1 score across all models</p>

        {metricsData.length > 0 ? (
          <div className="h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metricsData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="metric"
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  domain={[0, 100]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: '15px', fontSize: '12px' }}
                  iconType="circle"
                />
                {apiResults.map((result, index) => {
                  const modelName = `${truncateName(result.run_name, legendTruncateLength)}_${index}`;
                  return (
                    <Line
                      key={result.run_id}
                      type="monotone"
                      dataKey={modelName}
                      name={truncateName(result.run_name, legendTruncateLength)}
                      stroke={chartColors[index % chartColors.length]}
                      strokeWidth={2}
                      dot={{ fill: chartColors[index % chartColors.length], r: 4 }}
                      activeDot={{ r: 6 }}
                      connectNulls={false}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-72 sm:h-80 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center text-gray-500">
              <p className="text-sm font-medium">No metrics data available</p>
              <p className="text-xs mt-1">Train metrics are not present in the results</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricsChart;