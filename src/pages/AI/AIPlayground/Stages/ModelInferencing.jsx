import React, { useState, useMemo } from 'react';
import { TrendingUp, Lightbulb, Search, RefreshCw, Info, Award } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { AIPlaygroundLayout } from '../AIPlaygroundLayout';
import { useLocation } from 'react-router-dom';
import { useAIPlayground } from '../../../../context/AIPlaygroundContext';

const ModelInferencing = () => {
  const { workflowState } = useAIPlayground();
  const [activeTab, setActiveTab] = useState('performance');
  const [selectedFairnessModel, setSelectedFairnessModel] = useState('');
  const [selectedChartsModel, setSelectedChartsModel] = useState('');
  const [selectedChartDemographic, setSelectedChartDemographic] = useState('age');


  const truncateName = (name, maxLength = 30) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + '...';
  };

  const apiResults = useMemo(() => {
    return workflowState?.modelSelection?.apiResponse?.results || [];
  }, [workflowState]);

  const legendTruncateLength = useMemo(() => {
    const modelCount = apiResults.length;
    if (modelCount <= 2) return 60;
    if (modelCount <= 4) return 40; 
    return 30;
  }, [apiResults]);

  useMemo(() => {
    if (apiResults.length > 0 && !selectedFairnessModel) {
      setSelectedFairnessModel(apiResults[0].run_name);
    }
    if (apiResults.length > 0 && !selectedChartsModel) {
      setSelectedChartsModel(apiResults[0].run_name);
    }
  }, [apiResults]);

  const bestModel = useMemo(() => {
    if (apiResults.length === 0) {
      return {
        metricName: 'N/A',
        name: 'N/A',
        value: '0%',
      };
    }
    
    const metricsConfig = workflowState?.modelSelection?.config?.metrics || [];
    const firstEnabledMetric = metricsConfig.find(metric => metric.enabled);
    
    if (!firstEnabledMetric) {
      return {
        metricName: 'N/A',
        name: 'N/A',
        value: '0%',
      };
    }

    const metricNameMap = {
      'Accuracy': 'train_accuracy',
      'Precision': 'train_precision',
      'Recall': 'train_recall',
      'F1 Score': 'train_f1',
      'Log Loss': 'train_log_loss',
    };

    const metricKey = metricNameMap[firstEnabledMetric.name];
    
    // Find the model with the highest value for this metric
    // Note: For Log Loss, lower is better, so we handle it differently
    const best = apiResults.reduce((prev, current) => {
      const prevValue = prev.metrics?.[metricKey] || 0;
      const currValue = current.metrics?.[metricKey] || 0;
      
      // if (firstEnabledMetric.name === 'Log Loss') {
      //   // For Log Loss, lower is better
      //   return currValue < prevValue && currValue > 0 ? current : prev;
      // } else {
        return currValue > prevValue ? current : prev;
      // }
    });

    const bestValue = best.metrics?.[metricKey] || 0;
    
    let formattedValue;
    if (firstEnabledMetric.name === 'Log Loss') {
      formattedValue = bestValue.toFixed(4);
    } else {
      formattedValue = `${(bestValue * 100).toFixed(2)}%`;
    }

    return {
      metricName: firstEnabledMetric.name,
      name: best.run_name,
      value: formattedValue,
    };
  }, [apiResults, workflowState]);

  const algorithmData = useMemo(() => {
    return apiResults.map((result) => {
      const metrics = result.metrics || {};
      
      return {
        name: result.run_name,
        fullName: result.run_name,
        displayName: truncateName(result.run_name),
        testAccuracy: metrics.test_accuracy !== undefined ? (metrics.test_accuracy * 100).toFixed(2) : 'N/A',
        testPrecision: metrics.test_precision !== undefined ? (metrics.test_precision * 100).toFixed(2) : 'N/A',
        testRecall: metrics.test_recall !== undefined ? (metrics.test_recall * 100).toFixed(2) : 'N/A',
        testF1: metrics.test_f1 !== undefined ? (metrics.test_f1 * 100).toFixed(2) : 'N/A',
        testLogLoss: metrics.test_log_loss !== undefined ? metrics.test_log_loss.toFixed(4) : 'N/A',
        trainAccuracy: metrics.train_accuracy !== undefined ? (metrics.train_accuracy * 100).toFixed(2) : 'N/A',
        trainPrecision: metrics.train_precision !== undefined ? (metrics.train_precision * 100).toFixed(2) : 'N/A',
        trainRecall: metrics.train_recall !== undefined ? (metrics.train_recall * 100).toFixed(2) : 'N/A',
        trainF1: metrics.train_f1 !== undefined ? (metrics.train_f1 * 100).toFixed(2) : 'N/A',
        trainLogLoss: metrics.train_log_loss !== undefined ? metrics.train_log_loss.toFixed(4) : 'N/A',
      };
    });
  }, [apiResults]);

  const availableMetrics = useMemo(() => {
    if (apiResults.length === 0) return [];
    
    const firstResult = apiResults[0];
    const metrics = firstResult.metrics || {};
    
    const allPossibleMetrics = [
      { name: 'Accuracy', key: 'accuracy' },
      { name: 'Precision', key: 'precision' },
      { name: 'Recall', key: 'recall' },
      { name: 'F1 Score', key: 'f1' },
      { name: 'Log Loss', key: 'log_loss' }
    ];
    
    return allPossibleMetrics.filter(metric => {
      const trainKey = `train_${metric.key}`;
      const testKey = `test_${metric.key}`;
      return metrics.hasOwnProperty(trainKey) || metrics.hasOwnProperty(testKey);
    });
  }, [apiResults]);

  const metricsData = useMemo(() => {
    if (availableMetrics.length === 0) return [];
    
    return availableMetrics.map(metricObj => {
      const dataPoint = { metric: metricObj.name };
      
      apiResults.forEach((result, index) => {
        const modelName = `${truncateName(result.run_name, legendTruncateLength)}_${index}`;
        
        const metricValue = result.metrics?.[`train_${metricObj.key}`];
        
        if (metricValue !== undefined && metricValue !== null && !isNaN(metricValue)) {
          dataPoint[modelName] = parseFloat((metricValue * 100).toFixed(2));
        } else {
          dataPoint[modelName] = 0;
        }
      });
      
      return dataPoint;
    });
  }, [apiResults, availableMetrics, legendTruncateLength]);

  const selectedModelFairnessData = useMemo(() => {
    const selectedModel = apiResults.find(result => result.run_name === selectedFairnessModel);
    if (!selectedModel) return null;

    const metrics = selectedModel.metrics || {};
    
    const demographics = ['age', 'gender'];
    const fairnessData = {};

    demographics.forEach(demo => {
      fairnessData[demo] = {
        demographic_parity_difference: metrics[`fairness_${demo}_demographic_parity_difference`] || 0,
        demographic_parity_ratio: metrics[`fairness_${demo}_demographic_parity_ratio`] || 0,
        accuracy_score_difference: metrics[`fairness_${demo}_accuracy_score_difference`] || 0,
      };
    });

    return {
      modelName: selectedModel.run_name,
      fairnessAssessment: selectedModel.fairness_assessment_message || 'N/A',
      ...fairnessData
    };
  }, [apiResults, selectedFairnessModel]);

  const selectedModelChartData = useMemo(() => {
    const selectedModel = apiResults.find(result => result.run_name === selectedChartsModel);
    if (!selectedModel) return null;

    return {
      modelName: selectedModel.run_name,
      fairnessBarCharts: selectedModel.fairness_bar_charts || {},
      profileRadialCharts: selectedModel.profile_radial_charts || {},
      fairnessAssessment: selectedModel.fairness_assessment_message || 'N/A',
    };
  }, [apiResults, selectedChartsModel]);

  const chartColors = ['#9ca3af', '#a78bfa', '#6ee7b7', '#fb923c', '#f472b6', '#60a5fa'];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-semibold text-gray-700 mb-2">{payload[0].payload.metric}</p>
          {payload.map((entry, index) => {
            const displayName = entry.name || entry.dataKey.split('_').slice(0, -1).join('_');
            
            const fullModelName = apiResults.find((result, idx) => 
              entry.dataKey === `${truncateName(result.run_name, legendTruncateLength)}_${idx}`
            )?.run_name || displayName;
            
            return (
              <p key={index} className="text-xs text-gray-600">
                <span style={{ color: entry.color }}>●</span> {fullModelName}: {entry.value}%
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <AIPlaygroundLayout>
      <div className="min-h-screen">
        <div className='px-4 py-2'>
          <div className="mb-4">
            <h1 className="text-base sm:text-lg font-semibold text-gray-900">Model Performance Dashboard</h1>
            <p className="text-xs text-gray-500 mt-0.5">Evaluate and compare model performance.</p>
          </div>

          <div className="bg-gradient-to-r from-[#8e78b7] via-purple-300 to-purple-100 rounded-xl p-4 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg px-4 py-3 flex items-center gap-3 shadow-sm">
                <div className="p-2 bg-yellow-50 rounded-lg">
                  <Award className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <div className="text-yellow-600 text-sm font-medium">Best Model</div>
                  <div className="text-xs text-gray-500">Based on highest train {bestModel.metricName?.toLowerCase()}</div>
                </div>
              </div>

              <div className="bg-white rounded-lg px-4 py-3 shadow-sm">
                <div className="text-gray-500 text-xs mb-1">Model</div>
                <div className="text-gray-900 font-semibold text-sm" title={bestModel.name}>
                  {truncateName(bestModel.name, 50)}
                </div>
              </div>

              <div className="bg-white rounded-lg px-4 py-3 shadow-sm">
                <div className="text-gray-500 text-xs mb-1">{bestModel.metricName}</div>
                <div className="text-gray-900 font-semibold text-xl">{bestModel.value}</div>
              </div>
            </div>
          </div>
        </div>

        <div className='bg-gray-50 p-4 rounded-lg'>
          <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#8e78b7]" />
                <h2 className="text-lg font-semibold text-gray-900">Model Metrics Comparison</h2>
              </div>
            </div>

            <p className="text-xs text-gray-500 mb-4">Accuracy, precision, recall & F1 score across all models</p>

            {metricsData.length > 0 ? (
              <div className="h-72 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metricsData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="metric"
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                      axisLine={{ stroke: '#e5e7eb' }}
                      domain={[0, 100]}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      wrapperStyle={{ paddingTop: '15px', fontSize: '12px' }}
                      iconType="circle"
                    />
                    {apiResults.map((result, index) => {
                      const modelName = `${truncateName(result.run_name, legendTruncateLength)}_${index}`;
                      return (
                        <Line
                          key={result.run_id}
                          type="monotone"
                          dataKey={modelName}
                          name={truncateName(result.run_name, legendTruncateLength)}
                          stroke={chartColors[index % chartColors.length]}
                          strokeWidth={2}
                          dot={{ fill: chartColors[index % chartColors.length], r: 4 }}
                          activeDot={{ r: 6 }}
                          connectNulls={false}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 sm:h-80 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center text-gray-500">
                  <p className="text-sm font-medium">No metrics data available</p>
                  <p className="text-xs mt-1">Train metrics are not present in the results</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className='p-2'>
          <div className="bg-white rounded-t-lg border-b border-gray-200">
            <div className="flex gap-6 px-4">
              <button
                onClick={() => setActiveTab('performance')}
                className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'performance'
                  ? 'border-[#8e78b7] text-[#8e78b7]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Performance
              </button>
              <button
                onClick={() => setActiveTab('fairness')}
                className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'fairness'
                  ? 'border-[#8e78b7] text-[#8e78b7]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Fairness
              </button>
              <button
                onClick={() => setActiveTab('charts')}
                className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'charts'
                  ? 'border-[#8e78b7] text-[#8e78b7]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Charts
              </button>
            </div>
          </div>

          <div className="bg-white rounded-b-lg px-4 py-3 shadow-sm">
            {activeTab === 'performance' && (
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
            )}

            {activeTab === 'fairness' && (
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

                    {(selectedModelFairnessData.gender || selectedModelFairnessData.age) ? (
                      <div className="space-y-6">
                        {selectedModelFairnessData.gender && (
                          <div>
                            <h3 className="text-base font-semibold text-gray-900 mb-4">Gender Fairness Metrics</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="text-xs text-gray-600 mb-2">Demographic Parity Difference (Gender)</h4>
                                <p className="text-2xl font-semibold text-gray-900">
                                  {selectedModelFairnessData.gender.demographic_parity_difference.toFixed(4)}
                                </p>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="text-xs text-gray-600 mb-2">Demographic Parity Ratio (Gender)</h4>
                                <p className="text-2xl font-semibold text-gray-900">
                                  {selectedModelFairnessData.gender.demographic_parity_ratio.toFixed(4)}
                                </p>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="text-xs text-gray-600 mb-2">Accuracy Score Difference (Gender)</h4>
                                <p className="text-2xl font-semibold text-gray-900">
                                  {selectedModelFairnessData.gender.accuracy_score_difference.toFixed(4)}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {selectedModelFairnessData.age && (
                          <div>
                            <h3 className="text-base font-semibold text-gray-900 mb-4">Age Fairness Metrics</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="text-xs text-gray-600 mb-2">Demographic Parity Difference (Age)</h4>
                                <p className="text-2xl font-semibold text-gray-900">
                                  {selectedModelFairnessData.age.demographic_parity_difference.toFixed(4)}
                                </p>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="text-xs text-gray-600 mb-2">Demographic Parity Ratio (Age)</h4>
                                <p className="text-2xl font-semibold text-gray-900">
                                  {selectedModelFairnessData.age.demographic_parity_ratio.toFixed(4)}
                                </p>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="text-xs text-gray-600 mb-2">Accuracy Score Difference (Age)</h4>
                                <p className="text-2xl font-semibold text-gray-900">
                                  {selectedModelFairnessData.age.accuracy_score_difference.toFixed(4)}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
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
            )}

            {activeTab === 'charts' && (
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
                          <div>
                            <label className="text-xs text-gray-600 block mb-1">Select Demographic:</label>
                            <select 
                              className="border border-gray-300 rounded px-3 py-1.5 text-sm"
                              value={selectedChartDemographic}
                              onChange={(e) => setSelectedChartDemographic(e.target.value)}
                            >
                              <option value="age">Age</option>
                              <option value="gender">Gender</option>
                            </select>
                          </div>
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

                          <div className="bg-gray-50 rounded-lg p-6 mb-6">
                            <h3 className="text-base font-semibold text-gray-900 mb-4">
                              Fairness Bar Chart for '{selectedChartDemographic}' ({selectedModelChartData.modelName})
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
                              Profile Radial Chart for '{selectedChartDemographic}' ({selectedModelChartData.modelName})
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
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AIPlaygroundLayout>
  );
};

export default ModelInferencing;