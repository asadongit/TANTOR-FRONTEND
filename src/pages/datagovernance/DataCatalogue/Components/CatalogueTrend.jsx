import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const LINE_COLORS = ['#8884d8', '#82ca9d','#64b5f6','#f06292','#90a4ae', '#4db6ac', '#ffb74d', ];

const CatalogueChart = ({ data, dataKeys, isDatabase }) => {
  if (!data || data.length === 0 || !dataKeys || dataKeys.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">{isDatabase ? "Database Trend":"Catalogue Trend"}</h3>
        <div className="flex items-center justify-center h-[300px] text-gray-500">
          <p>No trend data available to display.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
    <h3 className="text-lg font-medium mb-4">{isDatabase ? "Database Trend":"Catalogue Trend"}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day"
            height={30}
            tick={{ fontSize: 12 }}
           />
          <YAxis allowDecimals={false} />
          <Tooltip />
          {dataKeys.map((key, index) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key} 
              stroke={LINE_COLORS[index % LINE_COLORS.length]}
              strokeWidth={2}
              activeDot={{ r: 8 }}
              name={key.charAt(0).toUpperCase() + key.slice(1)} 
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CatalogueChart;