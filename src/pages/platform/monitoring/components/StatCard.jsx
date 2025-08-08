function StatCard({ title, data = [], unit, icon }) {
  return (
    <div
      className="bg-white text-gray-800 rounded-2xl p-8 shadow-md w-full max-w-lg h-full min-h-56 transition-all duration-300 hover:shadow-lg"
    >
      <h2 className="text-2xl font-extrabold mb-6 text-gray-900 flex items-center">
        {icon && (
          <div className="bg-[#8e78b7] text-white p-3 rounded-lg mr-4">
            {icon}
          </div>
        )}
        {title}
      </h2>
      <div className="space-y-6">
        {data.map((item, idx) => (
          <div
            key={idx}
            className="flex justify-between items-center py-2 transition-all duration-200 hover:bg-gray-100 rounded-md px-2 -mx-2"
          >
            <span className="text-sm font-medium text-gray-600">{item.label}</span>
            <span className="text-lg font-bold text-gray-800">
              {item.value} {unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StatCard;
