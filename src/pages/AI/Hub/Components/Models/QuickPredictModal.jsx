import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

const QuickPredictModal = ({ isOpen, onClose, modelData }) => {
  const [selectedView, setSelectedView] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [activeTab, setActiveTab] = useState('data-drift');
  const [expandedSections, setExpandedSections] = useState({
    overall: true,
    schema: false,
    missing: false,
    feature: false,
    prediction: false,
    distribution: false
  });

  // Sample data for the results
  const overallSummaryData = [
    { sno: 1, overall_drift: 'True', schema_coverage: '0.98', missing_drift: 2, feature_drift: 4, prediction_drift: 'True', note: 'Using raw referenc...' },
    { sno: 2, overall_drift: 'False', schema_coverage: '0.75', missing_drift: 3, feature_drift: 5, prediction_drift: 'False', note: 'Using sample stat...' },
    { sno: 3, overall_drift: 'True', schema_coverage: '0.85', missing_drift: 4, feature_drift: 6, prediction_drift: 'True', note: 'Incorporating co...' },
    { sno: 4, overall_drift: 'False', schema_coverage: '0.65', missing_drift: 5, feature_drift: 7, prediction_drift: 'False', note: 'Using bootstrap...' },
    { sno: 5, overall_drift: 'True', schema_coverage: '0.90', missing_drift: 6, feature_drift: 8, prediction_drift: 'True', note: 'Analyzing time se...' },
    { sno: 6, overall_drift: 'False', schema_coverage: '0.80', missing_drift: 7, feature_drift: 9, prediction_drift: 'False', note: 'Employing cross-...' },
    { sno: 7, overall_drift: 'True', schema_coverage: '0.92', missing_drift: 8, feature_drift: 10, prediction_drift: 'True', note: 'Utilizing neural n...' },
    { sno: 8, overall_drift: 'False', schema_coverage: '0.70', missing_drift: 9, feature_drift: 11, prediction_drift: 'False', note: 'Applying cluster...' },
    { sno: 9, overall_drift: 'True', schema_coverage: '0.95', missing_drift: 10, feature_drift: 12, prediction_drift: 'True', note: 'Conducting A/B t...' },
  ];

  const handleProcessData = () => {
    if (!selectedView) {
      alert('Please select a view first');
      return;
    }
    setShowResults(true);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Quick Predict</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pt-3 pb-5 space-y-6">
          {/* Model Info */}
          <div className="space-y-2">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Model Name:</span>{' '}
              <span className="text-[#8e78b7]">{modelData?.name || 'Project - Analysis'}</span>
            </div>
            <p className="text-sm text-gray-600">
              Run a quick prediction using a sample or uploaded dataset and review drift insights before proceeding.
            </p>
          </div>

          {/* Fetch Data Section */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Fetch Data from Views</h3>
              <p className="text-xs text-gray-500 mb-3">Load data directly from available database views.</p>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Available Views
              </label>
              <select
                value={selectedView}
                onChange={(e) => setSelectedView(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none text-sm"
              >
                <option value="">Select</option>
                <option value="demo_churn_2">Demo Churn 2</option>
                <option value="customer_data">Customer Data View</option>
                <option value="transaction_data">Transaction Data View</option>
                <option value="model_predictions">Model Predictions View</option>
                <option value="feature_store">Feature Store View</option>
              </select>

              <button
                onClick={handleProcessData}
                disabled={!selectedView}
                className="px-6 py-2 bg-[#8e78b7] text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                Process Data
              </button>
            </div>
          </div>

          {/* Tabs and Results Section */}
          {showResults && (
            <div className="space-y-4">
              {/* Tabs */}
              <div className="flex gap-6 border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('data-drift')}
                  className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
                    activeTab === 'data-drift'
                      ? 'text-[#8e78b7]'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Data Drift
                  {activeTab === 'data-drift' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8e78b7]" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('model-drift')}
                  className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
                    activeTab === 'model-drift'
                      ? 'text-[#8e78b7]'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Model Drift
                  {activeTab === 'model-drift' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8e78b7]" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('prediction')}
                  className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
                    activeTab === 'prediction'
                      ? 'text-[#8e78b7]'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Prediction
                  {activeTab === 'prediction' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8e78b7]" />
                  )}
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'data-drift' && (
                <div className="space-y-3">
                  {/* Overall Summary */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleSection('overall')}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-sm font-semibold text-gray-800">Overall Summary</span>
                      {expandedSections.overall ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      )}
                    </button>
                    {expandedSections.overall && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="px-4 py-3 text-left font-medium text-gray-700">Sno</th>
                              <th className="px-4 py-3 text-left font-medium text-gray-700">Overall_drift</th>
                              <th className="px-4 py-3 text-left font-medium text-gray-700">Schema coverage</th>
                              <th className="px-4 py-3 text-left font-medium text-gray-700">Missing drift count</th>
                              <th className="px-4 py-3 text-left font-medium text-gray-700">Feature drift count</th>
                              <th className="px-4 py-3 text-left font-medium text-gray-700">Prediction drift</th>
                              <th className="px-4 py-3 text-left font-medium text-gray-700">Note</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 bg-white">
                            {overallSummaryData.map((row) => (
                              <tr key={row.sno} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-gray-700">{row.sno}</td>
                                <td className="px-4 py-3">
                                  <span className={row.overall_drift === 'True' ? 'text-red-600' : 'text-gray-700'}>
                                    {row.overall_drift}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-gray-700">{row.schema_coverage}</td>
                                <td className="px-4 py-3 text-gray-700">{row.missing_drift}</td>
                                <td className="px-4 py-3 text-gray-700">{row.feature_drift}</td>
                                <td className="px-4 py-3">
                                  <span className={row.prediction_drift === 'True' ? 'text-red-600' : 'text-gray-700'}>
                                    {row.prediction_drift}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-gray-500">{row.note}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Other Collapsible Sections */}
                  {['Schema Coverage', 'Missing / schema drift (top)', 'Feature drift (top 10)', 'Prediction drift', 'Prediction distribution'].map((title, index) => {
                    const key = ['schema', 'missing', 'feature', 'prediction', 'distribution'][index];
                    return (
                      <div key={key} className="border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleSection(key)}
                          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <span className="text-sm font-medium text-gray-800">{title}</span>
                          {expandedSections[key] ? (
                            <ChevronUp className="w-5 h-5 text-gray-500" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-500" />
                          )}
                        </button>
                        {expandedSections[key] && (
                          <div className="p-4 text-sm text-gray-600 bg-white">
                            Data for {title} would be displayed here...
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === 'model-drift' && (
                <div className="p-8 text-center text-gray-500">
                  Model Drift analysis will be displayed here
                </div>
              )}

              {activeTab === 'prediction' && (
                <div className="p-8 text-center text-gray-500">
                  Prediction results will be displayed here
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickPredictModal;