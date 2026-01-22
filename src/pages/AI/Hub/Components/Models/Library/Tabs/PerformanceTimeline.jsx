import React, { useState } from 'react';
import { Icon } from '@iconify-icon/react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { StatCard, StatsContainer } from '../../../StatsCard';

function PerformanceTimeline() {
  const [selectedMetric, setSelectedMetric] = useState('RMSE');
  const [dateRange, setDateRange] = useState([30, 70]);

  const metrics = [
    { key: 'RMSE', value: '711k', trend: 'down', trendValue: '1%' },
    { key: 'MAE', value: '165k', trend: 'up', trendValue: '4%' },
    { key: 'R2', value: '0.675', trend: 'up', trendValue: '3%' },
    { key: 'Adj. R2', value: '0.71', trend: 'up', trendValue: '2%' },
  ];

  const chartData = {
    RMSE: [
      { day: 'Mon', value: 320 },
      { day: 'Tue', value: 300 },
      { day: 'Wed', value: 450 },
      { day: 'Thu', value: 670 },
      { day: 'Fri', value: 600 },
      { day: 'Sat', value: 680 },
      { day: 'Sun', value: 750 },
    ],
    MAE: [
      { day: 'Mon', value: 150 },
      { day: 'Tue', value: 180 },
      { day: 'Wed', value: 220 },
      { day: 'Thu', value: 280 },
      { day: 'Fri', value: 250 },
      { day: 'Sat', value: 300 },
      { day: 'Sun', value: 320 },
    ],
    R2: [
      { day: 'Mon', value: 0.55 },
      { day: 'Tue', value: 0.58 },
      { day: 'Wed', value: 0.62 },
      { day: 'Thu', value: 0.65 },
      { day: 'Fri', value: 0.64 },
      { day: 'Sat', value: 0.67 },
      { day: 'Sun', value: 0.675 },
    ],
    'Adj. R2': [
      { day: 'Mon', value: 0.52 },
      { day: 'Tue', value: 0.56 },
      { day: 'Wed', value: 0.60 },
      { day: 'Thu', value: 0.66 },
      { day: 'Fri', value: 0.68 },
      { day: 'Sat', value: 0.70 },
      { day: 'Sun', value: 0.71 },
    ],
  };

  const getYAxisDomain = (metric) => {
    if (metric === 'R2' || metric === 'Adj. R2') {
      return [0, 1];
    }
    return [0, 1000];
  };

  const marks = {
    0: '',
    25: '',
    50: '01/06/2025',
    75: '10/10/2025',
    100: '',
  };

  return (
    <div className="space-y-6">
      <div className="px-4 py-6">
        <Slider
          range
          min={0}
          max={100}
          value={dateRange}
          onChange={setDateRange}
          marks={marks}
          trackStyle={[{ backgroundColor: '#A78BFA' }]}
          handleStyle={[
            { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
            { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
          ]}
          railStyle={{ backgroundColor: '#E9D5FF' }}
          dotStyle={{ borderColor: '#E9D5FF' }}
          activeDotStyle={{ borderColor: '#A78BFA' }}
        />
      </div>

      <StatsContainer>
        <div className="flex gap-4">
          {metrics.map((metric) => (
            <StatCard
              key={metric.key}
              title={metric.key}
              value={metric.value}
              trend={metric.trend}
              trendValue={metric.trendValue}
              onClick={() => setSelectedMetric(metric.key)}
              isSelected={selectedMetric === metric.key}
              className="flex-1"
              variant="default"
            />
          ))}
        </div>
      </StatsContainer>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData[selectedMetric]}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 12 }}
                dy={10}
              />
              <YAxis
                domain={getYAxisDomain(selectedMetric)}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 12 }}
                dx={-10}
                label={{
                  value: selectedMetric,
                  angle: -90,
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fill: '#6B7280', fontSize: 12 },
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
                labelStyle={{ color: '#374151', fontWeight: 600 }}
                itemStyle={{ color: '#7C3AED' }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#60A5FA"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: '#60A5FA', stroke: '#fff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default PerformanceTimeline;