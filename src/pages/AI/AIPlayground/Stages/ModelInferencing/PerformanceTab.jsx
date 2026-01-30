import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useState } from 'react';

const PerformanceTab = ({ algorithmData }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const totalPages = Math.ceil(algorithmData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentData = algorithmData.slice(startIndex, endIndex);

  const handlePrevious = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNext = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

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
                    {currentData.map((algo, idx) => (
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
                    {currentData.map((algo, idx) => (
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
            <span>
              Showing {startIndex + 1} to {Math.min(endIndex, algorithmData.length)} of {algorithmData.length} results
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className={`${currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'hover:bg-gray-50 text-gray-700'
                  }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <span className="text-gray-600">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className={`${currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'hover:bg-gray-50 text-gray-700'
                  }`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
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