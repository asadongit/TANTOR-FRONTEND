import {
  Database,
  ArrowRightLeft,
  Trash2,
  PlugIcon as Pipeline,
  Workflow,
} from "lucide-react";


import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    ResponsiveContainer, 
    Tooltip, // Add this import
    Legend // Add this if using legends
  } from 'recharts';

import { Icon } from "@iconify-icon/react";

const data = [
  {
    day: "1 day",
    Connection: 10,
    Migration: 15,
    Purge: 8,
    Pipelines: 12,
    Transformations: 20,
  },
  {
    day: "2 day",
    Connection: 15,
    Migration: 18,
    Purge: 10,
    Pipelines: 15,
    Transformations: 22,
  },
  {
    day: "3 day",
    Connection: 12,
    Migration: 20,
    Purge: 15,
    Pipelines: 18,
    Transformations: 23,
  },
  {
    day: "4 day",
    Connection: 18,
    Migration: 22,
    Purge: 12,
    Pipelines: 20,
    Transformations: 24,
  },
  {
    day: "5 day",
    Connection: 15,
    Migration: 25,
    Purge: 18,
    Pipelines: 22,
    Transformations: 25,
  },
  {
    day: "6 day",
    Connection: 20,
    Migration: 23,
    Purge: 15,
    Pipelines: 25,
    Transformations: 25,
  },
  {
    day: "7 day",
    Connection: 22,
    Migration: 20,
    Purge: 20,
    Pipelines: 23,
    Transformations: 25,
  },
];

const DataView = () => {

  const cards = [
    {
      icon: "material-symbols:database-upload-outline",
      bgcolor: "bg-[#d8d3e4] bg-opacity-25",
      iconcolor: "text-purple-700",
      title: "Base",
      count: "27",
    },
    {
      icon: "material-symbols-light:two-pager-store-outline",
      bgcolor: "bg-[#FFC93F] bg-opacity-25",
      iconcolor: "text-orange-700",
      title: "Migration",
      count: "11",
    },
    {
      icon: "material-symbols:cloud-sync-outline",
      bgcolor: "bg-[#96CF7B] bg-opacity-25",
      iconcolor: "text-green-700",
      title: "Purge",
      count: "07",
    },
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#16ABC2] bg-opacity-25",
      iconcolor: "text-cyan-700",
      title: "Pipelines",
      count: "17",
    },
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#16ABC2] bg-opacity-25",
      iconcolor: "text-cyan-700",
      title: "Transformations",
      count: "06",
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">Platform</h1>
          <div className="text-sm text-muted-foreground">
            Oct 31, 2024 - Dec 31, 2024
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {cards.map((card) => (
          <div
            key={card.title}
            className={`bg-white p-6 rounded-lg shadow-sm border-gray-200`}
          >
            <div className="flex items-center mb-2">
              <div
                className={`flex items-center justify-center aspect-square w-8 md:w-10 ${card.bgcolor} rounded-full ${card.iconcolor} mr-2`}
              >
                <Icon icon={card.icon} />
              </div>
              <h3 className="text-lg font-semibold">{card.title}</h3>
            </div>
            <p className="text-black text-5xl font-bold">{card.count}</p>
            <button className="mt-4 text-purple-600 text-sm hover:text-purple-700">
              See details
            </button>
          </div>
        ))}
      </div>



      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 mt-10">
  {/* First Chart */}
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-lg font-semibold mb-4">Platform Activity</h2>
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="Connection" 
            stroke="#ff0000" 
            strokeWidth={2}
            dot={{ r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="Migration" 
            stroke="#0000ff" 
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>

  {/* Second Chart */}
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-lg font-semibold mb-4">Performance Metrics</h2>
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="Purge" 
            stroke="#800080" 
            strokeWidth={2}
            dot={{ r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="Pipelines" 
            stroke="#00ff00" 
            strokeWidth={2}
            dot={{ r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="Transformations" 
            stroke="#ffa500" 
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
</div>

    </div>
  );
};

export default DataView;
