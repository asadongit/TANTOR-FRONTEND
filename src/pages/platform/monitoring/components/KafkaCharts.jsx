import { Skeleton } from "@mui/material";
import React, { useState, useMemo, useEffect } from "react";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export const GroupedLineChart = ({
  groupedData,
  loading,
  xAxisLabel,
  yAxisLabel,
  title,
}) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <Skeleton variant="text" width={200} height={30} />
        <Skeleton variant="rectangular" height={350} sx={{ mt: 2 }} />
      </div>
    );
  }
  const LINES_PER_PAGE = 5;
  const [currentPage, setCurrentPage] = useState(0);
  const [visibleTopics, setVisibleTopics] = useState([]);

  useEffect(() => {
    setCurrentPage(0);
  }, [groupedData]);

  const { chartData, allTopicNames } = useMemo(() => {
    if (!groupedData || Object.keys(groupedData).length === 0) {
      return { chartData: [], allTopicNames: [] };
    }

    // Extract all timestamps as numbers (milliseconds)
    const allTimestamps = Array.from(
      new Set(
        Object.values(groupedData).flatMap(
          (topic) => topic?.points?.map((point) => point.x) || []
        )
      )
    ).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    const chartData = allTimestamps.map((timestamp) => {
      const dataPoint = { name: timestamp };
      Object.keys(groupedData).forEach((topicName) => {
        const point = groupedData[topicName]?.points?.find(
          (p) => new Date(p.x).getTime() === new Date(timestamp).getTime()
        );
        dataPoint[topicName] = point ? point.y : null;
      });
      return dataPoint;
    });

    const allTopicNames = Object.keys(groupedData).sort();
    return { chartData, allTopicNames };
  }, [JSON.stringify(groupedData)]);

  useEffect(() => {
    setVisibleTopics(allTopicNames);
  }, [allTopicNames]);

  const colors = useMemo(
    () => [
      "#8884d8",
      "#82ca9d",
      "#ffc658",
      "#ff7300",
      "#0088fe",
      "#ff0000",
      "#00c49f",
      "#a4de6c",
      "#d0ed57",
      "#83a6ed",
      "#c74eab",
      "#4eabc7",
      "#e07b39",
      "#39e07b",
      "#a05195",
      "#51a095",
    ],
    []
  );

  if (!groupedData || Object.keys(groupedData).length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            {title || "Chart"}
          </h3>
        </div>
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">No data available.</p>
        </div>
      </div>
    );
  }

  const startIndex = currentPage * LINES_PER_PAGE;
  const endIndex = startIndex + LINES_PER_PAGE;
  const topicsForCurrentPage = allTopicNames.slice(startIndex, endIndex);
  const totalPages = Math.ceil(allTopicNames.length / LINES_PER_PAGE);

  const handleLegendClick = (o) => {
    const clickedTopic = o.value;

    // If all are visible, show only clicked
    if (visibleTopics.length === allTopicNames.length) {
      setVisibleTopics([clickedTopic]);
    }
    // If only clicked one is visible, reset to all
    else if (visibleTopics.length === 1 && visibleTopics[0] === clickedTopic) {
      setVisibleTopics(allTopicNames);
    }
    // Otherwise show only clicked
    else {
      setVisibleTopics([clickedTopic]);
    }
  };

  return (
    <div className="bg-white ml-0 m-6 p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          {title || "Chart"}
        </h3>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 0))}
              disabled={currentPage === 0}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage + 1} of {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(p + 1, totalPages - 1))
              }
              disabled={currentPage === totalPages - 1}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
        {/* Show All Button */}
        {visibleTopics.length !== allTopicNames.length && (
          <button
            onClick={() => setVisibleTopics(allTopicNames)}
            className="ml-4 px-3 py-1 bg-indigo-100 text-indigo-600 rounded-md hover:bg-indigo-200"
          >
            Show All
          </button>
        )}
      </div>
      <div className="relative h-96">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              label={{
                value: xAxisLabel,
                position: "insideBottom",
                offset: -3,
              }}
              tickFormatter={(unixTime) =>
                new Date(unixTime).toLocaleString([], {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              }
            />
            <YAxis
              label={{ value: yAxisLabel, angle: -90, position: "insideLeft" }}
            />
            <Tooltip
              labelFormatter={(label) =>
                new Date(label).toLocaleString([], {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              }
            />
            <Legend onClick={handleLegendClick} />
            {topicsForCurrentPage
              .filter((topic) => visibleTopics.includes(topic))
              .map((topicName) => (
                <Line
                  key={topicName}
                  type="monotone"
                  dataKey={topicName}
                  stroke={
                    colors[allTopicNames.indexOf(topicName) % colors.length]
                  }
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                  connectNulls={true}
                />
              ))}
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
];
const RADIAN = Math.PI / 180;

const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  index,
  name,
}) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  // Only display label if slice is large enough
  if (percent * 100 < 5) {
    return null;
  }

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontWeight="bold"
      fontSize="14px"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export const KafkaPieChart = ({ data, loading, title, tooltipUnit = "" }) => {
   if (loading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 h-[450px] flex flex-col">
        <Skeleton variant="text" width={200} height={25} />
        <Skeleton variant="circular" width={150} height={150} sx={{ mt: 4, mx: "auto" }} />
      </div>
    );
  }
  // Force re-render when data changes
  const chartKey = useMemo(() => {
    return JSON.stringify(data);
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 h-[250px] flex flex-col justify-between">
        <h3 className="text-md font-semibold text-gray-800 mb-2">
          {title || ""}
        </h3>
        <div className="flex-grow flex items-center justify-center">
          <p className="text-gray-500 text-sm">
            No data available for the pie chart.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 h-[450px] flex flex-col">
      <h3 className="text-md font-semibold text-gray-800 mb-2">
        {title || "Kafka Instance Disk Read Distribution (MB)"}
      </h3>
      <div className="relative flex-grow min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart
            key={chartKey} // Force re-render when data changes
            margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={90}
              innerRadius={45}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}-${entry.value}`} // Include value in key for uniqueness
                  fill={
                    COLORS.length > index
                      ? COLORS.at(index % COLORS.length)
                      : "gray"
                  }
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => `${value.toFixed(2)} ${tooltipUnit}`}
            />
            <Legend
              layout="horizontal"
              align="center"
              verticalAlign="bottom"
              wrapperStyle={{ paddingTop: "10px" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
