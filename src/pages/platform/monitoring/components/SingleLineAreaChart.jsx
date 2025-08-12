import React from "react";
import { Skeleton } from "@mui/material";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const SingleLineAreaChart = ({ title, data, unit = "", color = "#8884d8", loading }) => {
  if (loading) {
    return (
      <div className="h-72 w-full mb-8 mt-4">
        <Skeleton variant="text" width={180} height={28} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" width="100%" height="90%" />
      </div>
    );
  }

  return (
    <div className="h-72 w-full mb-8 mt-4">
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" dy={10} />
          <YAxis
            tickFormatter={(value) => `${value} ${unit}`}
            width={60}
            dx={0}
          />
          <Tooltip
            formatter={(value) => [`${value} ${unit}`, title]}
            labelClassName="font-semibold"
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            fill={color}
            name={title}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SingleLineAreaChart;
