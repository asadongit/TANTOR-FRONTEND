import React, { useState } from 'react';
import { TrendingUp, Lightbulb, Search, RefreshCw, Info, Award } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { AIPlaygroundLayout } from '../AIPlaygroundLayout';
import { useLocation } from 'react-router-dom';

const ModelInferencing = () => {
  const [activeTab, setActiveTab] = useState('performance');

  const bestModel = {
    name: 'GradientBoostingClassifier',
    accuracy: '90.07%',
    experimentId: '000012',
  };

  const algorithmData = [
    { name: 'Algorithm 1', accuracy: 70, precision: 70, recall: 70, f1: 70, logLoss: 70 },
    { name: 'Algorithm 2', accuracy: 85, precision: 80, recall: 75, f1: 88, logLoss: 90 },
    { name: 'Algorithm 3', accuracy: 60, precision: 65, recall: 62, f1: 70, logLoss: 68 },
    { name: 'Algorithm 4', accuracy: 90, precision: 92, recall: 89, f1: 91, logLoss: 93 },
    { name: 'Algorithm 5', accuracy: 75, precision: 78, recall: 76, f1: 74, logLoss: 77 },
    { name: 'Algorithm 6', accuracy: 82, precision: 80, recall: 81, f1: 83, logLoss: 85 },
    { name: 'Algorithm 7', accuracy: 67, precision: 70, recall: 72, f1: 68, logLoss: 69 },
    { name: 'Algorithm 8', accuracy: 88, precision: 86, recall: 89, f1: 87, logLoss: 90 },
    { name: 'Algorithm 9', accuracy: 74, precision: 76, recall: 75, f1: 73, logLoss: 78 },
    { name: 'Algorithm 10', accuracy: 91, precision: 89, recall: 90, f1: 92, logLoss: 94 },
  ];

  const fairnessMetrics = {
    gender: {
      parityDifference: 0.0025,
      parityRatio: 0.0025,
      accuracyDifference: 0.0025,
    },
    age: {
      parityDifference: 0.0025,
      parityRatio: 0.0025,
      accuracyDifference: 0.0025,
    },
  };

  const metricsData = [
    { metric: 'Accuracy', LogisticRegression: 70, RidgeClassifier: 73, GradientBoostingClassifier: 90 },
    { metric: 'F1 Score', LogisticRegression: 58, RidgeClassifier: 75, GradientBoostingClassifier: 88 },
    { metric: 'Precision', LogisticRegression: 60, RidgeClassifier: 76, GradientBoostingClassifier: 92 },
    { metric: 'Recall', LogisticRegression: 77, RidgeClassifier: 74, GradientBoostingClassifier: 90 },
  ];

  const fairnessChartData = {
    difference: [
      { metric: 'accuracy_score_difference', value: 0.081 },
      { metric: 'demographic_parity_difference', value: 0.003 },
    ],
    ratio: [
      { metric: 'demographic_parity_ratio', value: 0.896 },
    ],
  };

  const profileRadialData = [
    { metric: 'test_recall', value: 0.95 },
    { metric: 'test_precision', value: 0.92 },
    { metric: 'test_accuracy', value: 0.90 },
    { metric: 'train_f1', value: 0.88 },
    { metric: 'train_precision', value: 0.91 },
    { metric: 'train_accuracy', value: 0.93 },
    { metric: 'test_f1', value: 0.89 },
  ];


  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-semibold text-gray-700 mb-2">{payload[0].payload.metric}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs text-gray-600">
              <span style={{ color: entry.color }}>●</span> {entry.name}: {entry.value}%
            </p>
          ))}
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
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg px-4 py-3 flex items-center gap-3 shadow-sm">
                <div className="p-2 bg-yellow-50 rounded-lg">
                  <Award className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <div className="text-yellow-600 text-sm font-medium">Best Model</div>
                  <div className="text-xs text-gray-500">Based on highest test accuracy</div>
                </div>
              </div>

              <div className="bg-white rounded-lg px-4 py-3 shadow-sm">
                <div className="text-gray-500 text-xs mb-1">Algorithm</div>
                <div className="text-gray-900 font-semibold text-base">{bestModel.name}</div>
              </div>

              <div className="bg-white rounded-lg px-4 py-3 shadow-sm">
                <div className="text-gray-500 text-xs mb-1">Accuracy</div>
                <div className="text-gray-900 font-semibold text-xl">{bestModel.accuracy}</div>
              </div>

              <div className="bg-white rounded-lg px-4 py-3 shadow-sm">
                <div className="text-gray-500 text-xs mb-1">Experiment ID</div>
                <div className="text-gray-900 font-semibold text-base">{bestModel.experimentId}</div>
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
                  <Line
                    type="monotone"
                    dataKey="LogisticRegression"
                    stroke="#9ca3af"
                    strokeWidth={2}
                    dot={{ fill: '#9ca3af', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="RidgeClassifier"
                    stroke="#a78bfa"
                    strokeWidth={2}
                    dot={{ fill: '#a78bfa', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="GradientBoostingClassifier"
                    stroke="#6ee7b7"
                    strokeWidth={2}
                    dot={{ fill: '#6ee7b7', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
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
                              <td className="py-2 px-3 text-gray-700">{algo.name}</td>
                              <td className="py-2 px-3 text-gray-700">{algo.accuracy}%</td>
                              <td className="py-2 px-3 text-gray-700">{algo.precision}%</td>
                              <td className="py-2 px-3 text-gray-700">{algo.recall}%</td>
                              <td className="py-2 px-3 text-gray-700">{algo.f1}%</td>
                              <td className="py-2 px-3 text-gray-700">{algo.logLoss}%</td>
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
                              <td className="py-2 px-3 text-gray-700">{algo.name}</td>
                              <td className="py-2 px-3 text-gray-700">{algo.accuracy}%</td>
                              <td className="py-2 px-3 text-gray-700">{algo.precision}%</td>
                              <td className="py-2 px-3 text-gray-700">{algo.recall}%</td>
                              <td className="py-2 px-3 text-gray-700">{algo.f1}%</td>
                              <td className="py-2 px-3 text-gray-700">{algo.logLoss}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-xs text-gray-500 flex items-center justify-between">
                  <span>10 to 10 of results</span>
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
              </div>
            )}

            {activeTab === 'fairness' && (
              <div>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">Fairness Metrics Overview</h2>
                    <p className="text-xs text-gray-500">Evaluate bias across demographic groups. Select a model to view fairness metrics specific to that model.</p>
                  </div>
                  <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option>Model 1</option>
                    <option>Model 2</option>
                    <option>Model 3</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-xs text-gray-600 mb-2">Parity Difference (Gender)</h3>
                    <p className="text-2xl font-semibold text-gray-900">{fairnessMetrics.gender.parityDifference}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-xs text-gray-600 mb-2">Parity Ratio (Gender)</h3>
                    <p className="text-2xl font-semibold text-gray-900">{fairnessMetrics.gender.parityRatio}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-xs text-gray-600 mb-2">Accuracy Difference (Gender)</h3>
                    <p className="text-2xl font-semibold text-gray-900">{fairnessMetrics.gender.accuracyDifference}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-xs text-gray-600 mb-2">Parity Difference (Age)</h3>
                    <p className="text-2xl font-semibold text-gray-900">{fairnessMetrics.age.parityDifference}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-xs text-gray-600 mb-2">Parity Ratio (Age)</h3>
                    <p className="text-2xl font-semibold text-gray-900">{fairnessMetrics.age.parityRatio}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-xs text-gray-600 mb-2">Accuracy Difference (Age)</h3>
                    <p className="text-2xl font-semibold text-gray-900">{fairnessMetrics.age.accuracyDifference}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'charts' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Fairness Charts</h2>

                  <div className="mb-4">
                    <label className="text-sm text-gray-600 mr-2">Select demographic:</label>
                    <select className="border border-gray-300 rounded px-3 py-1.5 text-sm">
                      <option>gender</option>
                      <option>age</option>
                      <option>race</option>
                    </select>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">
                      Fairness Scores for 'gender' (GradientBoostingClassifier)
                    </h3>

                    <div className="space-y-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Difference Metrics (Ideal = 0.0)</h4>
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={fairnessChartData.difference} layout="vertical" margin={{ left: 160, right: 40 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis
                                type="number"
                                domain={[0, 0.1]}
                                tick={{ fill: '#6b7280', fontSize: 11 }}
                                label={{ value: 'Score (Lower absolute value is better)', position: 'bottom', style: { fill: '#6b7280', fontSize: 11 } }}
                              />
                              <YAxis
                                type="category"
                                dataKey="metric"
                                tick={{ fill: '#6b7280', fontSize: 11 }}
                                width={150}
                              />
                              <Tooltip />
                              <Bar dataKey="value" fill="#5b9bd5" />
                              <line x1="0" y1="0" x2="0" y2="100%" stroke="#000" strokeDasharray="5 5" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Ratio Metrics (Ideal = 1.0)</h4>
                        <div className="h-32">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={fairnessChartData.ratio} layout="vertical" margin={{ left: 160, right: 40 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis
                                type="number"
                                domain={[0, 1.5]}
                                tick={{ fill: '#6b7280', fontSize: 11 }}
                                label={{ value: 'Score (Closer to 1.0 is better)', position: 'bottom', style: { fill: '#6b7280', fontSize: 11 } }}
                              />
                              <YAxis
                                type="category"
                                dataKey="metric"
                                tick={{ fill: '#6b7280', fontSize: 11 }}
                                width={150}
                              />
                              <Tooltip />
                              <Bar dataKey="value" fill="#5b9bd5" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Radial Charts</h2>

                  <div className="mb-4">
                    <label className="text-sm text-gray-600 mr-2">Select demographic:</label>
                    <select className="border border-gray-300 rounded px-3 py-1.5 text-sm">
                      <option>gender</option>
                      <option>age</option>
                      <option>race</option>
                    </select>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">
                      Overall Profile for 'gender' (GradientBoostingClassifier)
                    </h3>

                    <div className="h-96 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={profileRadialData}>
                          <PolarGrid stroke="#d1d5db" />
                          <PolarAngleAxis
                            dataKey="metric"
                            tick={{ fill: '#6b7280', fontSize: 11 }}
                          />
                          <PolarRadiusAxis
                            angle={90}
                            domain={[0, 1]}
                            tick={{ fill: '#6b7280', fontSize: 10 }}
                          />
                          <Radar
                            name="Performance"
                            dataKey="value"
                            stroke="#8b5cf6"
                            fill="#a78bfa"
                            fillOpacity={0.6}
                            strokeWidth={2}
                          />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
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