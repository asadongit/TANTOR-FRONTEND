import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

const CatalogueChart = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-lg">
      <h3 className="text-lg font-medium mb-6">Catalogue trend</h3>
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid
              horizontal={true}
              vertical={false}
              stroke="#f0f0f0"
              strokeDasharray="3 3"
            />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              stroke="#666"
              fontSize={12}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              stroke="#666"
              fontSize={12}
              domain={[0, 30]}
              ticks={[5, 10, 15, 20, 25, 30]}
            />
            <Line
              type="monotone"
              dataKey="Database"
              stroke="#FF9999"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="Schema"
              stroke="#9747FF"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="Tables"
              stroke="#47B5FF"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="View"
              stroke="#47FF86"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CatalogueChart;