import React, { useState, useEffect } from "react";
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

const Charts = ({ data }) => {
  const [statusData, setStatusData] = useState([]);
  const [lineChartData, setLineChartData] = useState([]);
  const [timeFilter, setTimeFilter] = useState("Weekly");
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    if (!data || !Array.isArray(data)) return;
    
    filterDataByTimePeriod();
  }, [data, timeFilter]);

  useEffect(() => {
    if (!filteredData.length) return;
    
    processStatusData();
    processTimelineData();
  }, [filteredData]);

  const filterDataByTimePeriod = () => {
    if (!data || !Array.isArray(data)) return;
    
    const now = new Date();
    let filtered = [];
    
    switch (timeFilter) {
      case "Weekly":
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        
        filtered = data.filter(item => {
          if (!item.scheduler || !item.scheduler.startdatetime) return false;
          const date = new Date(item.scheduler.startdatetime);
          return date >= oneWeekAgo && date <= now;
        });
        break;
        
      case "Monthly":
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        filtered = data.filter(item => {
          if (!item.scheduler || !item.scheduler.startdatetime) return false;
          const date = new Date(item.scheduler.startdatetime);
          return date >= firstDayOfMonth && date <= now;
        });
        break;
        
      case "Yearly":
        const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
        
        filtered = data.filter(item => {
          if (!item.scheduler || !item.scheduler.startdatetime) return false;
          const date = new Date(item.scheduler.startdatetime);
          return date >= firstDayOfYear && date <= now;
        });
        break;
        
      default:
        filtered = data.slice(); 
    }
    
    if (filtered.length === 0) {
      filtered = data.slice(); 
    }
    
    setFilteredData(filtered);
  };

  const processStatusData = () => {
    const statusCounts = {};
    filteredData.forEach(item => {
      const status = item.status || "Unknown";
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const total = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
    
    const formattedData = Object.entries(statusCounts).map(([status, count], index) => {
      return {
        name: getDisplayStatus(status),
        value: (count / total) * 100,
        percentage: (count / total) * 100,
        color: getColorForStatus(status, index),
        count
      };
    });

    setStatusData(formattedData);
  };

  const getDisplayStatus = (status) => {
    const statusMap = {
      "Pending": "Pending",
      "Running": "Running",
      "Stopped": "Stopped",
      "Completed": "Completed",
      "Created": "Job Created",
      "Ready": "Ready to Run",
    };

    for (const [key, value] of Object.entries(statusMap)) {
      if (status.startsWith(key)) {
        return value;
      }
    }
    
    return status;
  };

  const getColorForStatus = (status, index) => {
    const statusColorMap = {
      "Pending": "bg-[#E6E1FF]",
      "Running": "bg-[#9D85F2]",
      "Stopped": "bg-[#735ABF]",
      "Completed": "bg-[#D3CCF5]",
      "Created": "bg-[#A698EB]",
      "Ready": "bg-[#C5BAFF]",
    };
    
    const COLOR_CLASSES = ["bg-[#E6E1FF]", "bg-[#C5BAFF]", "bg-[#9D85F2]", "bg-[#A698EB]", "bg-[#735ABF]"];
    
    for (const [key, value] of Object.entries(statusColorMap)) {
      if (status.startsWith(key)) {
        return value;
      }
    }
    
    return COLOR_CLASSES[index % COLOR_CLASSES.length];
  };

  const processTimelineData = () => {
    const groupedData = {};
    
    filteredData.forEach(item => {
      if (!item.created_at) return;
      
      const date = new Date(item.created_at);
      let key;
      
      if (timeFilter === "Weekly") {
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        key = days[date.getDay()];
      } else if (timeFilter === "Monthly") {
        key = `Week ${Math.ceil(date.getDate() / 7)}`;
      } else {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        key = months[date.getMonth()];
      }
      
      if (!groupedData[key]) {
        groupedData[key] = { name: key, JOBS: 0, cpc: 0 };
      }
      
      groupedData[key].JOBS += 1;
    });
    
    let result = Object.values(groupedData);
    
    if (timeFilter === "Weekly") {
      const dayOrder = { "Mon": 0, "Tue": 1, "Wed": 2, "Thu": 3, "Fri": 4, "Sat": 5, "Sun": 6 };
      result.sort((a, b) => dayOrder[a.name] - dayOrder[b.name]);
    } else if (timeFilter === "Monthly") {
      const weekOrder = { "Week 1": 0, "Week 2": 1, "Week 3": 2, "Week 4": 3, "Week 5": 4 };
      result.sort((a, b) => weekOrder[a.name] - weekOrder[b.name]);
    } else {
      const monthOrder = { "Jan": 0, "Feb": 1, "Mar": 2, "Apr": 3, "May": 4, "Jun": 5, 
                          "Jul": 6, "Aug": 7, "Sep": 8, "Oct": 9, "Nov": 10, "Dec": 11 };
      result.sort((a, b) => monthOrder[a.name] - monthOrder[b.name]);
    }
    
    result.forEach(item => {
      item.cpc = parseFloat((item.JOBS * 0.2 + Math.random()).toFixed(1));
    });
    
    setLineChartData(result);
  };



  const COLOR_PALETTE = ["#E6E1FF", "#C5BAFF", "#9D85F2", "#A698EB", "#735ABF", "#5D45DB"];

  const RADIAN = Math.PI / 180;
  
  const PieChartLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    index,
    name
  }) => {
    
    const startRadius = outerRadius * 1.05;
    const startX = cx + startRadius * Math.cos(-midAngle * RADIAN);
    const startY = cy + startRadius * Math.sin(-midAngle * RADIAN);

    const lineLength = 30;
    const lineEndX = cx + (outerRadius + lineLength) * Math.cos(-midAngle * RADIAN);
    const lineEndY = cy + (outerRadius + lineLength) * Math.sin(-midAngle * RADIAN);

    const isRightSide = lineEndX > cx;
    const horizontalLength = 15;
    const horizEndX = isRightSide ? lineEndX + horizontalLength : lineEndX - horizontalLength;

    const textX = isRightSide ? horizEndX + 5 : horizEndX - 5;
    const textAnchor = isRightSide ? "start" : "end";

    const lineColor = COLOR_PALETTE[index % COLOR_PALETTE.length];

 
    const angle = Math.abs(midAngle % 360);
    

    const isSmallValue = percent < 0.05;

    return (
      <g>
        <line
          x1={startX}
          y1={startY}
          x2={lineEndX}
          y2={lineEndY}
          stroke={lineColor}
          strokeWidth={1.5}
        />
        
        <line
          x1={lineEndX}
          y1={lineEndY}
          x2={horizEndX}
          y2={lineEndY}
          stroke={lineColor}
          strokeWidth={1.5}
        />
        
        <text
          x={textX}
          y={lineEndY}
          textAnchor={textAnchor}
          fill="#5D45DB"
          fontWeight="500"
          fontSize={12}
        >
          {`${(percent * 100).toFixed(1)}%`}
        </text>
      </g>
    );
  };

  const getTimeFilterLabel = () => {
    switch (timeFilter) {
      case "Weekly":
        return "This Week";
      case "Monthly":
        return "This Month";
      case "Yearly":
        return "This Year";
      default:
        return "";
    }
  };

  return (
    <div className="flex flex-wrap w-full gap-4">
      <div className="flex-1 min-w-64 bg-white rounded-lg shadow-sm dark:bg-gray-800 p-4 md:p-6">
        <div className="flex justify-between mb-5">
          <div>
            <h2 className="text-lg font-medium text-gray-800">Creation</h2>
            {/* <p className="text-sm text-gray-500">{getTimeFilterLabel()}</p> */}
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
                domain={[0, 'auto']}
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
          <div>
            <h2 className="text-lg font-medium text-gray-800">Status</h2>
            {/* <p className="text-sm text-gray-500">{getTimeFilterLabel()}</p> */}
          </div>
          <div className="relative">
            <select 
              className="appearance-none rounded-md border border-gray-300 py-1 px-3 pr-8 text-sm bg-white"
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
            >
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
          <div className="order-2 md:order-1 w-full md:w-1/3 flex flex-col space-y-4 pt-4 md:pt-8">
            {statusData.map((item, index) => (
              <div key={item.name} className="flex items-center">
                <div className={`h-6 w-6 rounded ${item.color} mr-3`}></div>
                <span className="text-sm text-gray-700">
                  {item.name}{" "}
                  <span className="text-xs text-gray-500">
                    ({item.percentage.toFixed(1)}%)
                  </span>
                </span>
              </div>
            ))}
          </div>

          <div className="order-1 md:order-2 w-full md:w-2/3 flex justify-center">
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={PieChartLabel}
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    strokeWidth={0}
                    paddingAngle={1}
                  >
                    {statusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLOR_PALETTE[index % COLOR_PALETTE.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [`${value.toFixed(1)}%`, name]}
                  />
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