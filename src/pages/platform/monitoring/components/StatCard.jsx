function StatCard({ title, data = [], unit }) {
  return (
    <div className="bg-gray-100 text-black rounded-xl p-4 shadow w-full max-w-md">
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <div className="space-y-2">
        {data.map((item, idx) => (
          <div
            key={idx}
            className="flex justify-between border-b border-gray-300 pb-1"
          >
            <span className="text-sm text-gray-600">{item.label}</span>
            <span className="text-sm font-medium text-black">
              {item.value} {unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StatCard;