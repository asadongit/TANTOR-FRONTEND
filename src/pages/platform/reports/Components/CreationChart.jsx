import { useState } from "react";
import { Icon } from "@iconify-icon/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const CreationChart = ({ data }) => {
  const [showDescription, setShowDescription] = useState(false);

  const handleDescriptionToggle = () => {
    setShowDescription((prev) => !prev);
  };

  return (
    <div className="col-span-1 p-4 bg-white border rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Creation</h2>
        <div className="relative flex items-center">
          <Icon
            icon="material-symbols:info-outline"
            className="text-gray-500 cursor-pointer"
            onClick={() => handleDescriptionToggle()}
            title="This is the description of updates card."
          />
          {showDescription && (
            <div className="absolute top-0 left-8 bg-white border rounded-lg shadow-md p-2 text-xs text-gray-600">
              This is the description of updates card.
            </div>
          )}
        </div>
      </div>
      <hr className="my-2" />
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

export default CreationChart;
