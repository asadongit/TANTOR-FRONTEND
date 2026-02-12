import React, { useEffect } from 'react';
import { Info } from 'lucide-react';

const FairnessTab = ({ 
  selectedFairnessModel, 
  setSelectedFairnessModel, 
  apiResults, 
  selectedModelFairnessData 
}) => {
  
  const formatMetricName = (metricKey) => {
    return metricKey
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Fairness Metrics Overview</h2>
          <p className="text-xs text-gray-500">Evaluate bias across demographic groups. Select a model to view fairness metrics specific to that model.</p>
        </div>
        <select 
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[250px]"
          value={selectedFairnessModel}
          onChange={(e) => setSelectedFairnessModel(e.target.value)}
          title={selectedFairnessModel}
        >
          {apiResults.map((result) => (
            <option key={result.run_id} value={result.run_name} title={result.run_name}>
              {result.run_name}
            </option>
          ))}
        </select>
      </div>

      {selectedModelFairnessData && (
        <>
          <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-xs text-gray-600 mb-1">Selected Model:</p>
            <p className="text-sm font-medium text-gray-900">{selectedModelFairnessData.modelName}</p>
          </div>

          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">Fairness Assessment</p>
                <p className="text-xs text-blue-700 mt-1">{selectedModelFairnessData.fairnessAssessment}</p>
              </div>
            </div>
          </div>

          {selectedModelFairnessData.demographics && selectedModelFairnessData.demographics.length > 0 ? (
            <div className="space-y-6">
              {selectedModelFairnessData.demographics.map((demographic) => {
                const data = selectedModelFairnessData[demographic];
                if (!data) return null;

                const displayName = demographic.charAt(0).toUpperCase() + demographic.slice(1);
                
                // Get all available metrics for this demographic (excluding null values)
                const availableMetrics = Object.entries(data).filter(([key, value]) => value !== null);

                if (availableMetrics.length === 0) return null;

                return (
                  <div key={demographic}>
                    <h3 className="text-base font-semibold text-gray-900 mb-4">{displayName} Fairness Metrics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {availableMetrics.map(([metricKey, metricValue]) => (
                        <div key={metricKey} className="bg-gray-50 rounded-lg p-4">
                          <h4 className="text-xs text-gray-600 mb-2">
                            {formatMetricName(metricKey)} ({displayName})
                          </h4>
                          <p className="text-2xl font-semibold text-gray-900">
                            {typeof metricValue === 'number' ? metricValue.toFixed(4) : metricValue}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-500">No fairness metrics available</p>
              <p className="text-xs text-gray-400 mt-1">Fairness data is not present for this model</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const ChartsTab = ({ 
  selectedChartsModel, 
  setSelectedChartsModel, 
  selectedChartDemographic, 
  setSelectedChartDemographic, 
  apiResults, 
  selectedModelChartData 
}) => {
  const availableDemographics = React.useMemo(() => {
    if (!selectedModelChartData) return [];
    
    const demographics = new Set();
    
    // Extract demographics from fairness bar charts
    if (selectedModelChartData.fairnessBarCharts) {
      Object.keys(selectedModelChartData.fairnessBarCharts).forEach(key => {
        if (selectedModelChartData.fairnessBarCharts[key]) {
          demographics.add(key);
        }
      });
    }
    
    // Extract demographics from profile radial charts
    if (selectedModelChartData.profileRadialCharts) {
      Object.keys(selectedModelChartData.profileRadialCharts).forEach(key => {
        if (selectedModelChartData.profileRadialCharts[key]) {
          demographics.add(key);
        }
      });
    }
    
    return Array.from(demographics).sort();
  }, [selectedModelChartData]);

  useEffect(() => {
    if (availableDemographics.length > 0 && !availableDemographics.includes(selectedChartDemographic)) {
      setSelectedChartDemographic(availableDemographics[0]);
    }
  }, [availableDemographics, selectedChartDemographic, setSelectedChartDemographic]);

  return (
    <div className="bg-gray-50 p-4 rounded-lg -mx-4 -mb-3">
      <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200 shadow-sm">
        <div className="space-y-6">
          <div>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Fairness Visualizations</h2>
                <p className="text-xs text-gray-500">View fairness metrics through bar charts and radial profiles.</p>
              </div>
              <div className="flex gap-3">
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Select Model:</label>
                  <select 
                    className="border border-gray-300 rounded px-3 py-1.5 text-sm min-w-[250px]"
                    value={selectedChartsModel}
                    onChange={(e) => setSelectedChartsModel(e.target.value)}
                    title={selectedChartsModel}
                  >
                    {apiResults.map((result) => (
                      <option key={result.run_id} value={result.run_name} title={result.run_name}>
                        {result.run_name}
                      </option>
                    ))}
                  </select>
                </div>
                {availableDemographics.length > 0 && (
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Select Demographic:</label>
                    <select 
                      className="border border-gray-300 rounded px-3 py-1.5 text-sm"
                      value={selectedChartDemographic}
                      onChange={(e) => setSelectedChartDemographic(e.target.value)}
                    >
                      {availableDemographics.map((demographic) => (
                        <option key={demographic} value={demographic}>
                          {demographic.charAt(0).toUpperCase() + demographic.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {selectedModelChartData && (
              <>
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Fairness Assessment</p>
                      <p className="text-xs text-blue-700 mt-1">{selectedModelChartData.fairnessAssessment}</p>
                    </div>
                  </div>
                </div>

                {availableDemographics.length > 0 ? (
                  <>
                    <div className="bg-gray-50 rounded-lg p-6 mb-6">
                      <h3 className="text-base font-semibold text-gray-900 mb-4">
                        Fairness Bar Chart for '{selectedChartDemographic.charAt(0).toUpperCase() + selectedChartDemographic.slice(1)}' ({selectedModelChartData.modelName})
                      </h3>

                      {selectedModelChartData.fairnessBarCharts[selectedChartDemographic] ? (
                        <div className="flex justify-center">
                          <img 
                            src={`data:image/png;base64,${selectedModelChartData.fairnessBarCharts[selectedChartDemographic]}`}
                            alt={`Fairness bar chart for ${selectedChartDemographic}`}
                            className="max-w-full h-auto rounded-lg shadow-md"
                          />
                        </div>
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          <p>No bar chart data available for {selectedChartDemographic}</p>
                        </div>
                      )}
                    </div>

                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-base font-semibold text-gray-900 mb-4">
                        Profile Radial Chart for '{selectedChartDemographic.charAt(0).toUpperCase() + selectedChartDemographic.slice(1)}' ({selectedModelChartData.modelName})
                      </h3>

                      {selectedModelChartData.profileRadialCharts[selectedChartDemographic] ? (
                        <div className="flex justify-center">
                          <img 
                            src={`data:image/png;base64,${selectedModelChartData.profileRadialCharts[selectedChartDemographic]}`}
                            alt={`Profile radial chart for ${selectedChartDemographic}`}
                            className="max-w-full h-auto rounded-lg shadow-md"
                          />
                        </div>
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          <p>No radial chart data available for {selectedChartDemographic}</p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="py-12 text-center bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-500">No chart data available</p>
                    <p className="text-xs text-gray-400 mt-1">No demographic charts are present for this model</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export { FairnessTab, ChartsTab };