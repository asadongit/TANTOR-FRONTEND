import { Skeleton } from "@mui/material";
import React from "react";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

const StatCard = ({ data, loading, title, unit, icon, brokerColors = {} }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 max-w-md w-full">
        {/* Icon + Title Skeleton */}
        <div className="flex items-center mb-4">
          <Skeleton variant="circular" width={40} height={40} className="mr-3" />
          <Skeleton variant="text" width={150} height={28} />
        </div>

        {/* List Item Skeletons */}
        <ul className="divide-y divide-gray-100">
          {[...Array(3)].map((_, idx) => (
            <li key={idx} className="py-3 flex items-center justify-between">
              <Skeleton variant="text" width="40%" height={20} />
              <Skeleton variant="text" width="20%" height={20} />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden max-w-md w-full hover:shadow-lg transition-shadow duration-200">
      {/* Gradient Header */}
      <div className="flex items-center px-6 py-4 bg-gradient-to-r from-[#8e78b7] to-purple-400">
        {icon && (
          <div className="bg-white/20 rounded-full p-2 mr-3 text-white">
            {icon}
          </div>
        )}
        <h2 className="text-xl font-semibold text-white">{title}</h2>
      </div>

      {/* Data List */}
      <div className="p-6">
        <ul className="divide-y divide-gray-100">
          {data.map((item) => (
            <li
              key={item.label}
              className="py-3 flex items-center justify-between hover:bg-gray-50 px-2 rounded-lg transition"
            >
              {/* Label with Color Dot */}
              <div className="flex items-center space-x-3">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: brokerColors[item.label] || "#8e78b7",
                  }}
                ></span>
                <span className="font-medium text-gray-700">{item.label}</span>
              </div>

              {/* Value, Unit & Trend */}
              <div className="flex items-center space-x-2">
                <span className="font-bold text-gray-900">{item.value}</span>
                <span className="text-gray-500 text-sm">{unit}</span>

                {item.trend === "up" && (
                  <ArrowUp className="text-green-500 w-4 h-4" />
                )}
                {item.trend === "down" && (
                  <ArrowDown className="text-red-500 w-4 h-4" />
                )}
                {item.trend === "neutral" && (
                  <Minus className="text-gray-400 w-4 h-4" />
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default StatCard;
