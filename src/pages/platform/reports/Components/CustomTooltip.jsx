
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload) {
    return (
      <div className="bg-white border rounded-lg p-4 shadow-lg">
        <p className="font-semibold text-sm mb-2">Day {label}</p>
        <div className="space-y-1">
          {payload.map((entry) => (
            <div key={entry.name} className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm">
                {entry.name}: <strong>{entry.value}</strong>
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default CustomTooltip;