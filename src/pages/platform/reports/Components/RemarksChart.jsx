import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { Icon } from "@iconify/react";
import CustomTooltip from "./CustomTooltip";


const RemarksChart = ({ data }) => {
  const [visibleLines, setVisibleLines] = useState({
    Database: true,
    Schema: true,
    Tables: true,
    View: true
  });
  const [activeIndex, setActiveIndex] = useState(null);
  const [showDescription, setShowDescription] = useState(false);

  const handleDescriptionToggle = () => setShowDescription(!showDescription);

  const legendItems = [
    { dataKey: 'Database', color: '#FF9999', name: 'Database' },
    { dataKey: 'Schema', color: '#9747FF', name: 'Schema' },
    { dataKey: 'Tables', color: '#47B5FF', name: 'Tables' },
    { dataKey: 'View', color: '#47FF86', name: 'View' }
  ];

  return (
    <div className="col-span-1 p-4 bg-white border rounded-lg shadow-md h-[400px] flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Remarks</h2>
        <div className="relative flex items-center">
          <Icon
            icon="material-symbols:info-outline"
            className="text-gray-500 cursor-pointer"
            onClick={handleDescriptionToggle}
          />
          {showDescription && (
            <div className="absolute top-0 left-8 bg-white border rounded-lg shadow-md p-2 text-xs text-gray-600 w-48">
              This chart shows daily creation metrics across different categories.
            </div>
          )}
        </div>
      </div>
      <hr className="my-2" />

      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 2, right: 2, left: -20, bottom: 2 }}
            onMouseMove={(e) => {
              if (e.activeTooltipIndex !== undefined) {
                setActiveIndex(e.activeTooltipIndex);
              }
            }}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <CartesianGrid
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
              tick={{ dy: 5 }}
            />
            
            <YAxis
              axisLine={false}
              tickLine={false}
              stroke="#666"
              fontSize={12}
              domain={[0, 30]}
              ticks={[5, 10, 15, 20, 25, 30]}
            />
            
            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                stroke: '#e2e8f0',
                strokeWidth: 2,
                strokeDasharray: '5 5'
              }}
            />

            {activeIndex !== null && (
              <ReferenceLine 
                x={data[activeIndex].day} 
                stroke="#e2e8f0" 
                strokeWidth={2}
              />
            )}

            {visibleLines.Database && (
              <Line
                type="monotone"
                dataKey="Database"
                stroke="#FF9999"
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 6,
                  fill: '#fff',
                  stroke: '#FF9999',
                  strokeWidth: 2
                }}
              />
            )}
            
            {visibleLines.Schema && (
              <Line
                type="monotone"
                dataKey="Schema"
                stroke="#9747FF"
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 6,
                  fill: '#fff',
                  stroke: '#9747FF',
                  strokeWidth: 2
                }}
              />
            )}
            
            {visibleLines.Tables && (
              <Line
                type="monotone"
                dataKey="Tables"
                stroke="#47B5FF"
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 6,
                  fill: '#fff',
                  stroke: '#47B5FF',
                  strokeWidth: 2
                }}
              />
            )}
            
            {visibleLines.View && (
              <Line
                type="monotone"
                dataKey="View"
                stroke="#47FF86"
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 6,
                  fill: '#fff',
                  stroke: '#47FF86',
                  strokeWidth: 2
                }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
        
      </div>
            {/* Legend with persistent items */}
            <div className="flex flex-wrap gap-4 mb-2">
        {legendItems.map((item) => (
          <div 
            key={item.dataKey}
            className="flex items-center cursor-pointer"
            onClick={() => setVisibleLines(prev => ({
              ...prev,
              [item.dataKey]: !prev[item.dataKey]
            }))}
          >
            <div 
              className="w-4 h-4 rounded-full mr-2 transition-opacity"
              style={{ 
                backgroundColor: item.color,
                opacity: visibleLines[item.dataKey] ? 1 : 0.4
              }}
            />
            <span 
              className="text-sm transition-opacity"
              style={{ 
                color: item.color,
                opacity: visibleLines[item.dataKey] ? 1 : 0.6
              }}
            >
              {item.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RemarksChart;
