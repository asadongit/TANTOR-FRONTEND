import React from 'react';

const PerformanceTab = ({ algorithmData }) => {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Model Performance Overview</h2>
      <p className="text-xs text-gray-500 mb-6">Compare training and testing performance across standard evaluation metrics.</p>

      {algorithmData.length > 0 ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Test Metrics</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-2 px-3 font-medium text-gray-600">Algorithms</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-600">Accuracy</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-600">Precision</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-600">Recall</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-600">F1</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-600">Log Loss</th>
                    </tr>
                  </thead>
                  <tbody>
                    {algorithmData.map((algo, idx) => (
                      <tr key={idx} className="border-t border-gray-200 hover:bg-gray-50">
                        <td className="py-2 px-3 text-gray-700" title={algo.fullName}>
                          {algo.displayName}
                        </td>
                        <td className="py-2 px-3 text-gray-700">{algo.testAccuracy !== 'N/A' ? `${algo.testAccuracy}%` : algo.testAccuracy}</td>
                        <td className="py-2 px-3 text-gray-700">{algo.testPrecision !== 'N/A' ? `${algo.testPrecision}%` : algo.testPrecision}</td>
                        <td className="py-2 px-3 text-gray-700">{algo.testRecall !== 'N/A' ? `${algo.testRecall}%` : algo.testRecall}</td>
                        <td className="py-2 px-3 text-gray-700">{algo.testF1 !== 'N/A' ? `${algo.testF1}%` : algo.testF1}</td>
                        <td className="py-2 px-3 text-gray-700">{algo.testLogLoss}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Train Metrics</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-2 px-3 font-medium text-gray-600">Algorithms</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-600">Accuracy</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-600">Precision</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-600">Recall</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-600">F1</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-600">Log Loss</th>
                    </tr>
                  </thead>
                  <tbody>
                    {algorithmData.map((algo, idx) => (
                      <tr key={idx} className="border-t border-gray-200 hover:bg-gray-50">
                        <td className="py-2 px-3 text-gray-700" title={algo.fullName}>
                          {algo.displayName}
                        </td>
                        <td className="py-2 px-3 text-gray-700">{algo.trainAccuracy !== 'N/A' ? `${algo.trainAccuracy}%` : algo.trainAccuracy}</td>
                        <td className="py-2 px-3 text-gray-700">{algo.trainPrecision !== 'N/A' ? `${algo.trainPrecision}%` : algo.trainPrecision}</td>
                        <td className="py-2 px-3 text-gray-700">{algo.trainRecall !== 'N/A' ? `${algo.trainRecall}%` : algo.trainRecall}</td>
                        <td className="py-2 px-3 text-gray-700">{algo.trainF1 !== 'N/A' ? `${algo.trainF1}%` : algo.trainF1}</td>
                        <td className="py-2 px-3 text-gray-700">{algo.trainLogLoss}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="mt-4 text-xs text-gray-500 flex items-center justify-between">
            <span>{algorithmData.length} to {algorithmData.length} of results</span>
            <div className="flex items-center gap-2">
              <span>Show per page:</span>
              <select className="border border-gray-300 rounded px-2 py-1 text-xs">
                <option>10</option>
                <option>20</option>
                <option>50</option>
              </select>
              <button className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-50">&lt;</button>
              <button className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-50">&gt;</button>
            </div>
          </div>
        </>
      ) : (
        <div className="py-12 text-center bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-500">No performance data available</p>
          <p className="text-xs text-gray-400 mt-1">Model metrics are not present in the results</p>
        </div>
      )}
    </div>
  );
};

export default PerformanceTab;