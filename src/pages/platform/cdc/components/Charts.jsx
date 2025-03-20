import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const Charts = () => {
  const statusMetrics = [
    { name: "Ready to run", percentage: 21.8, color: "bg-[#ECE9FF]" },
    { name: "Completed", percentage: 16.8, color: "bg-[#D3CCF5]" },
    { name: "Created", percentage: 20.8, color: "bg-[#A698EB]" },
    { name: "Running", percentage: 8.8, color: "bg-[#8F7EE1]" },
    { name: "Stopped", percentage: 26.8, color: "bg-[#735ABF]" },
  ];

  const lineChartData = [
    { name: "Mon", JOBS: 12, cpc: 3.2 },
    { name: "Tue", JOBS: 18, cpc: 2.8 },
    { name: "Wed", JOBS: 9, cpc: 3.6 },
    { name: "Thu", JOBS: 12, cpc: 3.1 },
    { name: "Fri", JOBS: 8, cpc: 3.3 },
    { name: "Sat", JOBS: 17, cpc: 3.8 },
    { name: "Sun", JOBS: 10, cpc: 0.5 },
  ];

  const pieChartData = statusMetrics.map((item) => ({
    name: item.name,
    value: item.percentage,
  }));

  const COLOR_PALETTE = ["#ECE9FF", "#D3CCF5", "#A698EB", "#8F7EE1", "#735ABF"];

  const RADIAN = Math.PI / 180;
  const PieChartLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    index,
  }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    const width = 36;
    const height = 24;

    return (
      <g>
        <defs>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow
              dx="1"
              dy="1"
              stdDeviation="2"
              floodColor="rgba(0, 0, 0, 0.2)"
            />
          </filter>
        </defs>

        <rect
          x={x - width / 2}
          y={y - height / 2}
          width={width}
          height={height}
          rx={6}
          ry={6}
          fill="#F9F8FF"
          // stroke="#A698EB"
          // strokeWidth="1.5"
          filter="url(#shadow)"
        />

        <text
          x={x}
          y={y}
          fill="#5D45DB"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={12}
          fontWeight="500"
        >
          {`${(percent * 100).toFixed(0)}%`}
        </text>
      </g>
    );
  };
  return (
    <div className="flex flex-wrap w-full gap-4">
      <div className="flex-1 min-w-64 bg-white rounded-lg shadow-sm dark:bg-gray-800 p-4 md:p-6">
        <div className="flex justify-between mb-5">
          <div>
            <h2 className="text-lg font-medium text-gray-800">Creation</h2>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={lineChartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#ddd"
                vertical={false}
              />
              <XAxis dataKey="name" stroke="#E2E7E7" />
              <YAxis
                stroke="#E2E7E7"
                tickFormatter={(tick) => `${tick}`}
                domain={[0, 20]}
                tickCount={5}
              />
              <Tooltip />
              <Line
                type="linear"
                dataKey="JOBS"
                stroke="#16ABC2"
                strokeWidth={1}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex-1 min-w-64 bg-white rounded-lg shadow-sm dark:bg-gray-800 p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-800">Status</h2>
          <div className="relative">
            <select className="appearance-none rounded-md border border-gray-300 py-1 px-3 pr-8 text-sm bg-white">
              <option>Weekly</option>
              <option>Monthly</option>
              <option>Yearly</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-start">
          <div className="order-2 md:order-1 w-full md:w-1/3 flex flex-col space-y-4 pt-4 md:pt-16">
            {statusMetrics.map((item, index) => (
              <div key={item.name} className="flex items-center">
                <div className={`h-6 w-6 rounded ${item.color} mr-3`}></div>
                <span className="text-sm text-gray-700">{item.name}</span>
              </div>
            ))}
          </div>

          <div className="order-1 md:order-2 w-full md:w-2/3 flex justify-center">
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={PieChartLabel}
                    innerRadius={60}
                    outerRadius={140}
                    fill="#8884d8"
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLOR_PALETTE[index % COLOR_PALETTE.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Charts;
