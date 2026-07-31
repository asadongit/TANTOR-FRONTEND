import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { secureQuery } from '../../../../datagovernance/DataCatalogue/Components/function';
import { aithemestyle } from '../../../../../components/themeContext';
import { useAuth } from '../../../../../context/AuthContext';

// Reusable expand/collapse section header (module-level)
const ExpandableSection = ({ title, expanded, onToggle, children }) => (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #EDE8F8' }}>
        <button
            onClick={onToggle}
            className="w-full flex items-center justify-between px-5 py-4 transition-colors"
            style={{ background: '#FAF8FF' }}
        >
            <span style={{ color: '#8E77BB', fontSize: '18px', fontWeight: 500 }}>
                {title}
            </span>
            <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                style={{
                    transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                }}
            >
                <path
                    d="M5 7.5L10 12.5L15 7.5"
                    stroke="#818181"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </button>
        {expanded && (
            <div className="p-5 bg-white">
                {children}
            </div>
        )}
    </div>
);

// ModelDriftContent Component
const ModelDriftContent = ({ modelDriftData, errorProfileExpanded, setErrorProfileExpanded, confusionMatrixExpanded, setConfusionMatrixExpanded }) => {
    const [activeHeatmap, setActiveHeatmap] = useState('shift');

    // Error Profile Table Component
    const ErrorProfileTable = ({ errorProfile }) => {
        if (!errorProfile || errorProfile.length === 0) {
            return (
                <div className="text-center py-8 text-gray-500">
                    No error profile data available
                </div>
            );
        }

        return (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="w-1/2 px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                                Class
                            </th>
                            <th className="w-1/2 px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                                Error Rate Shift
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {errorProfile.map((item, idx) => {
                            return (
                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                    <td className="w-1/2 px-6 py-4 text-sm font-medium text-gray-900">
                                        Class {item.class}
                                    </td>
                                    <td className="w-1/2 px-6 py-4 text-sm text-gray-700">
                                        {typeof item.error_rate_shift === 'number'
                                            ? item.error_rate_shift.toFixed(4)
                                            : 'N/A'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    // Confusion Matrix Heatmap Component
    const ConfusionMatrixHeatmap = ({ matrixData, title, type }) => {
        if (!matrixData) {
            return (
                <div className="text-center py-8 text-gray-500" style={{ fontSize: '16px' }}>
                    No {title.toLowerCase()} data available
                </div>
            );
        }

        const [hoveredCell, setHoveredCell] = useState(null);

        // Extract prediction and true labels
        const predLabels = Object.keys(matrixData).sort();
        const trueLabels = predLabels.length > 0
            ? Object.keys(matrixData[predLabels[0]]).sort()
            : [];

        // Find max value for color scaling
        let maxValue = 0;
        predLabels.forEach(pred => {
            trueLabels.forEach(true_label => {
                const value = matrixData[pred]?.[true_label] || 0;
                if (Math.abs(value) > maxValue) maxValue = Math.abs(value);
            });
        });

        // Color scale function
        const getColor = (value) => {
            if (maxValue === 0) return 'rgb(243, 244, 246)';

            const normalized = Math.abs(value) / maxValue;

            if (type === 'shift') {
                // Red scale for shifts
                if (value === 0) return 'rgb(243, 244, 246)';
                const intensity = Math.floor(255 - (normalized * 155));
                return `rgb(255, ${intensity}, ${intensity})`;
            } else {
                // Purple scale for current/reference
                const intensity = Math.floor(255 - (normalized * 155));
                return `rgb(${intensity}, ${intensity}, 255)`;
            }
        };

        return (
            <div className="space-y-4">
                {/* Floating tooltip rendered outside overflow container */}
                {hoveredCell && (
                    <div
                        className="fixed z-50 px-3 py-2 bg-gray-900 text-white text-xs rounded pointer-events-none whitespace-nowrap"
                        style={{ top: hoveredCell.y, left: hoveredCell.x, transform: 'translate(-50%, -110%)', fontSize: '16px' }}
                    >
                        Pred: {hoveredCell.pred}, True: {hoveredCell.trueLabel}<br />
                        Value: {hoveredCell.value}
                    </div>
                )}

                <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex justify-center">
                        <div className="flex">

                            <div className="flex-1">
                                {/* X-axis labels — mirrors the exact layout of each matrix row */}
                                <div className="flex items-center mb-2">
                                    {/* spacer matching row-label width */}
                                    <span className="w-10 mr-2 shrink-0" />
                                    {trueLabels.map((label, idx) => (
                                        <span
                                            key={idx}
                                            className="text-xs font-medium text-gray-600 text-center mx-0.5 shrink-0"
                                            style={{ fontSize: '16px', minWidth: '64px', maxWidth: '80px', flex: '1 1 0' }}
                                        >
                                            {label.replace('true_', '')}
                                        </span>
                                    ))}
                                </div>

                                {/* Matrix */}
                                {predLabels.map((pred, rowIdx) => (
                                    <div key={rowIdx} className="flex items-center mb-1">
                                        <span className="text-xs font-medium text-gray-600 w-10 shrink-0 text-right mr-2" style={{ fontSize: '16px' }}>
                                            {pred.replace('pred_', '')}
                                        </span>
                                        <div className="flex-1 flex">
                                            {trueLabels.map((true_label, colIdx) => {
                                                const value = matrixData[pred]?.[true_label] || 0;
                                                return (
                                                    <div
                                                        key={colIdx}
                                                        className="relative flex-1 aspect-square mx-0.5 rounded transition-all hover:scale-105 hover:shadow-md cursor-pointer"
                                                        style={{
                                                            backgroundColor: getColor(value),
                                                            minWidth: '64px',
                                                            maxWidth: '80px'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                            setHoveredCell({
                                                                pred: pred.replace('pred_', ''),
                                                                trueLabel: true_label.replace('true_', ''),
                                                                value: typeof value === 'number' ? value.toFixed(6) : 'N/A',
                                                                x: rect.left + rect.width / 2,
                                                                y: rect.top
                                                            });
                                                        }}
                                                        onMouseLeave={() => setHoveredCell(null)}
                                                    >
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <span className="text-xs font-medium text-gray-700" style={{ fontSize: '16px' }}>
                                                                {typeof value === 'number' ? String(value).substring(0, 4) + (String(value).length > 4 ? '...' : '') : '0'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}

                                {/* X-axis title */}
                                <div className="text-center mt-4">
                                    <span className="text-xs font-medium text-gray-600" style={{ fontSize: '16px' }}>
                                        Actual
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="mt-6 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-center gap-4">
                            <span className="text-xs text-gray-600" style={{ fontSize: '16px' }}>Low</span>
                            <div className="flex gap-1">
                                {[0, 0.25, 0.5, 0.75, 1].map((val, idx) => (
                                    <div
                                        key={idx}
                                        className="w-8 h-4 rounded"
                                        style={{
                                            backgroundColor: type === 'shift'
                                                ? `rgb(255, ${Math.floor(255 - val * 155)}, ${Math.floor(255 - val * 155)})`
                                                : `rgb(${Math.floor(255 - val * 155)}, ${Math.floor(255 - val * 155)}, 255)`
                                        }}
                                    />
                                ))}
                            </div>
                            <span className="text-xs text-gray-600" style={{ fontSize: '16px' }}>High</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const errorProfile = modelDriftData?.class_wise?.error_profile;
    const confusionMatrix = modelDriftData?.class_wise?.confusion_matrix;

    return (
        <div className="space-y-8">




            {/* Error Profile Section */}
            {errorProfile && (
                <ExpandableSection
                    title="Class-wise Error Profile"
                    expanded={errorProfileExpanded}
                    onToggle={() => setErrorProfileExpanded(prev => !prev)}
                >
                    <ErrorProfileTable errorProfile={errorProfile} />
                </ExpandableSection>
            )}

            {/* Confusion Matrix Section */}
            {confusionMatrix && (
                <ExpandableSection
                    title="Confusion Matrix Analysis"
                    expanded={confusionMatrixExpanded}
                    onToggle={() => setConfusionMatrixExpanded(prev => !prev)}
                >
                    {/* Tab Navigation */}
                    <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
                        {['shift', 'current', 'reference'].map((type) => (
                            <button
                                key={type}
                                onClick={() => setActiveHeatmap(type)}
                                className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
                                    activeHeatmap === type
                                        ? 'bg-white text-[#8e78b7] shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                                style={{ fontSize: '16px' }}
                            >
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Active Heatmap */}
                    <div className="transition-opacity duration-300">
                        {activeHeatmap === 'shift' && (
                            <ConfusionMatrixHeatmap
                                matrixData={confusionMatrix.shift}
                                title="Shift Matrix"
                                type="shift"
                            />
                        )}
                        {activeHeatmap === 'current' && (
                            <ConfusionMatrixHeatmap
                                matrixData={confusionMatrix.current}
                                title="Current Matrix"
                                type="current"
                            />
                        )}
                        {activeHeatmap === 'reference' && (
                            <ConfusionMatrixHeatmap
                                matrixData={confusionMatrix.reference}
                                title="Reference Matrix"
                                type="reference"
                            />
                        )}
                    </div>
                </ExpandableSection>
            )}

            {!errorProfile && !confusionMatrix && (
                <div className="text-center py-8 text-gray-500">
                    No model drift details available
                </div>
            )}
        </div>
    );
};

const QuickPredictModal = ({ isOpen, onClose, modelData }) => {
  const [selectedView, setSelectedView] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [activeTab, setActiveTab] = useState('data-drift');

  // Global expand states for all tab sections
  const [dataDriftExpanded, setDataDriftExpanded] = useState(true);
  const [predictionsExpanded, setPredictionsExpanded] = useState(true);
  const [errorProfileExpanded, setErrorProfileExpanded] = useState(true);
  const [confusionMatrixExpanded, setConfusionMatrixExpanded] = useState(true);

  const [loading, setLoading] = useState(false);
  const { token, decodedToken } = useAuth();
  const hostnameAI = window._env_?.VITE_AI_API;


  const [error, setError] = useState(null);
  const [queryResult, setQueryResult] = useState(null);

  const [availableViews, setAvailableViews] = useState([]);
  const [viewsLoading, setViewsLoading] = useState(false);
  const [viewsError, setViewsError] = useState(null);

  const fetchViews = async () => {
    setViewsLoading(true);
    setViewsError(null);
    try {
      const secureRes = await secureQuery({ user_query: "" }, token);
      const policyIds = secureRes.matched_policy_ids;
      if (policyIds && policyIds.length > 0) {
        const tablesRes = await fetch(`${hostnameAI}/schemas/predictions-source-schema/tables`, {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ policy_id: policyIds })
        });
        if (!tablesRes.ok) throw new Error('Failed to fetch tables');
        const tablesData = await tablesRes.json();
        setAvailableViews(tablesData.tables || []);
      }
    } catch (err) {
      console.error('Error fetching views:', err);
      setViewsError(err.message);
    } finally {
      setViewsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchViews();
    }
  }, [isOpen]);

  const handleProcessData = async () => {
    if (!selectedView) {
      alert('Please select a view first');
      return;
    }

    setLoading(true);
    setError(null);
    setQueryResult(null);

    try {
      // Use authentication token from Keycloak context, NOT from localStorage
      // Token is managed in-memory by Keycloak for security (no XSS exposure)
      const response = await fetch(`${hostnameAI}/quick/predict-quick-action?filename=${selectedView}&run_name=${modelData?.run_name}&user_id=${decodedToken?.sub}`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: ''
      });
      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Quick predict response:', data);
      setQueryResult(data);
      setShowResults(true);
    } catch (err) {
      console.error('Quick predict API error:', err);
      setError(err?.message || 'Failed to process data');
      setShowResults(false);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-medium" style={{color: '#282F49'}}>Quick Predict</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-6 pt-5 pb-6 space-y-4">
          {/* Model Info */}
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium" style={{color: '#332849'}}>Model Name:</span>{' '}
              <span className="font-medium" style={{color: '#818181'}}>{modelData?.run_name || 'Project - Analysis'}</span>
            </div>
            <p className="text-sm font-medium" style={{color: '#818181'}}>
              Run a quick prediction using a sample or uploaded dataset and review drift insights before proceeding.
            </p>
          </div>

          {/* Fetch Data Section */}
          <div className="space-y-4 rounded-xl p-5" style={{background: '#FAFAFA'}}>
            <div>
              <h3 className="text-sm font-medium mb-1" style={{color: '#282F49'}}>Fetch Data from Views</h3>
              <p className="text-xs font-medium" style={{color: '#818181'}}>Load data directly from available database views.</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium" style={{color: '#332849'}}>
                Available Views
              </label>
              <select
                value={selectedView}
                onChange={(e) => setSelectedView(e.target.value)}
                style={{
                  width: '340px',
                  height: '44px',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  borderWidth: '1px',
                  opacity: 1,
                  transform: 'rotate(0deg)',
                  display: 'block'
                }}
                className="border border-gray-200 focus:outline-none text-sm bg-white"
                disabled={viewsLoading}
              >
                <option value="">
                  {viewsLoading ? 'Loading...' : viewsError ? 'Error loading views' : 'Select'}
                </option>
                {availableViews.map(table => (
                  <option key={table} value={table}>{table}</option>
                ))}
              </select>
              {viewsError && (
                <p className="text-xs text-red-500 mt-1">{viewsError}</p>
              )}

              <button
                onClick={handleProcessData}
                disabled={!selectedView || loading}
                style={{
                  width: '115px',
                  height: '40px',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  opacity: 1,
                  transform: 'rotate(0deg)',
                  marginTop: '16px'
                }}
                className="text-white disabled:bg-[#CBC0E0] disabled:cursor-not-allowed bg-[#8E77BB] hover:bg-[#7a68a5] transition-colors text-sm font-medium"
              >
                {loading ? 'Processing...' : 'Process Data'}
              </button>
            </div>
          </div>

          {/* Tabs and Results Section */}
          {showResults && (
            <div className="space-y-4">
              {/* Tabs */}
              <div className="flex items-center gap-2 px-6 pt-2">
                {['Data Drift', 'Model Drift','Predictions'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab.toLowerCase().replace(' ', '-'))}
                    style={activeTab === tab.toLowerCase().replace(' ', '-') ? {
                      backgroundColor: aithemestyle.tab.activeBackground,
                      borderBottom: `${aithemestyle.tab.activeBorderWidth} solid ${aithemestyle.tab.activeBorderColor}`,
                      color: aithemestyle.tab.activeTextColor,
                      fontSize: aithemestyle.tab.fontSize,
                      paddingTop: '12px',
                      paddingBottom: '6px',
                    } : {
                      fontSize: aithemestyle.tab.fontSize,
                      color: aithemestyle.tab.inactiveTextColor,
                      paddingTop: '12px',
                      paddingBottom: '6px',
                    }}
                    className={`px-4 font-medium transition-colors relative rounded-t hover:text-gray-700`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {activeTab === 'data-drift' && (
                <div className="p-2">
                  {queryResult?.data_drift?.aggregated_metrics ? (
                    <ExpandableSection
                      title="Aggregated Metrics"
                      expanded={dataDriftExpanded}
                      onToggle={() => setDataDriftExpanded(prev => !prev)}
                    >
                      <div className="overflow-x-auto border border-gray-200 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="w-1/2 px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                                Metric
                              </th>
                              <th className="w-1/2 px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                                Value
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {Object.entries(queryResult.data_drift.aggregated_metrics).map(([key, value]) => (
                              <tr key={key} className="hover:bg-gray-50 transition-colors">
                                <td className="w-1/2 px-6 py-4 text-sm font-medium text-gray-900">
                                  {key.replace(/_/g, ' ')}
                                </td>
                                <td className="w-1/2 px-6 py-4 text-sm text-gray-700">
                                  {typeof value === 'number' ? value.toFixed(6) : value}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </ExpandableSection>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No data drift data available
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'model-drift' && (
                <div className="p-2">
                  {queryResult?.model_drift ? (
                    <ModelDriftContent
                      modelDriftData={queryResult.model_drift}
                      errorProfileExpanded={errorProfileExpanded}
                      setErrorProfileExpanded={setErrorProfileExpanded}
                      confusionMatrixExpanded={confusionMatrixExpanded}
                      setConfusionMatrixExpanded={setConfusionMatrixExpanded}
                    />
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No model drift data available
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'predictions' && (
                <div className="p-2">
                  {queryResult?.predictions && queryResult.predictions.length > 0 ? (
                    <ExpandableSection
                      title="Predictions"
                      expanded={predictionsExpanded}
                      onToggle={() => setPredictionsExpanded(prev => !prev)}
                    >
                      <div className="overflow-x-auto border border-gray-200 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              {Object.keys(queryResult.predictions[0]).map((key) => (
                                <th
                                  key={key}
                                  className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                                >
                                  {key.replace(/_/g, ' ')}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {queryResult.predictions.map((row, idx) => (
                              <tr key={idx} className="hover:bg-gray-50">
                                {Object.values(row).map((val, i) => (
                                  <td key={i} className="px-4 py-3 text-sm text-gray-700">
                                    {typeof val === 'number' ? val.toLocaleString(undefined, { maximumFractionDigits: 4 }) : String(val)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </ExpandableSection>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No predictions available
                    </div>
                  )}
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