import { MoreVertical } from 'lucide-react';
import { AIPlaygroundLayout } from '../AIPlaygroundLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, LineChart, Line, Cell } from 'recharts';
import ConfigurationModal from '../modals/XAI/ConfigurationModal';
import { SaveModelSelectionModal } from '../modals/XAI/SaveModelSelectionModal';
import GovernanceReportModal from '../modals/XAI/GovernanceReportModal';
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DataTable from '../../../../components/DataTable';
import { useAIPlayground } from '../../../../context/AIPlaygroundContext';
import toast from 'react-hot-toast';

function XAI() {
  const hostnameAI = window._env_?.VITE_AI_API;
  const location = useLocation();
  const navigate = useNavigate();
  const { workflowState, datasetState } = useAIPlayground();
  const sessionId = datasetState?.sessionId;
  const readonly = location.state?.mode === 'view';

  const [selectedModel, setSelectedModel] = useState('');
  const [modelsList, setModelsList] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showGovernanceModal, setShowGovernanceModal] = useState(false);
  const [xaiConfig, setXaiConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [configuredModel, setConfiguredModel] = useState(''); // Track which model's config we have

  // Counterfactual Data - hardcoded for now
  const counterfactualData = [
    { id: 1, feature: 'purchase_likelihood', original: '0.2000000001490162', counterfactual: '0.987178314', change: '0.787178313509884' },
    { id: 2, feature: 'days_since_last_quote', original: '140.99999701976776', counterfactual: '19.545776431999997', change: '-121.45422058776776' },
    { id: 3, feature: 'has_auto_insurance', original: '1', counterfactual: '0.5', change: '-0.5' },
    { id: 4, feature: 'marital_status_Married', original: '1', counterfactual: '0.1', change: '-0.9' }
  ];

  // Fetch logged models on component mount
  useEffect(() => {
    if (sessionId) {
      fetchLoggedModels();
    }
  }, [sessionId]);

  const fetchLoggedModels = async () => {
    setLoadingModels(true);
    try {
      const response = await fetch(
        `${hostnameAI}/model/logged_models/${sessionId}`,
        {
          method: 'GET',
          headers: {
            'accept': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setModelsList(data.logged_models || []);
      } else {
        toast.error('Failed to fetch models. Please try again.', {
          duration: 4000,
          position: 'top-right',
        });
      }
    } catch (error) {
      console.error('Error fetching models:', error);
      toast.error(error.message || 'Failed to fetch models. Please try again.', {
        duration: 4000,
        position: 'top-right',
      });
    } finally {
      setLoadingModels(false);
    }
  };

  const handleConfigureReport = async () => {
    if (selectedModel && sessionId) {
      // If we already have config for this model, just open the modal
      if (configuredModel === selectedModel && xaiConfig) {
        setShowConfigModal(true);
        return;
      }

      // Otherwise, fetch new config
      setLoadingConfig(true);
      try {
        const response = await fetch(
          `${hostnameAI}/model/XAI_config?session_id=${sessionId}&model_name=${encodeURIComponent(selectedModel)}`,
          {
            method: 'GET',
            headers: {
              'accept': 'application/json'
            }
          }
        );

        if (response.ok) {
          const config = await response.json();
          setXaiConfig(config);
          setConfiguredModel(selectedModel); // Track which model this config is for
          setShowConfigModal(true);
        } else {
          toast.error('Failed to fetch XAI configuration. Please try again.', {
            duration: 4000,
            position: 'top-right',
          });
        }
      } catch (error) {
        console.error('Error fetching XAI configuration:', error);
        toast.error(error.message || 'Failed to fetch XAI configuration. Please try again.', {
          duration: 4000,
          position: 'top-right',
        });
      } finally {
        setLoadingConfig(false);
      }
    }
  };

  const handleGenerateReport = async (configData) => {
    if (readonly) {
      setShowConfigModal(false);
      return;
    }

    setGeneratingReport(true);
    try {
      const payload = {
        session_id: sessionId,
        run_name: selectedModel,
        run_shap: true,
        run_pdp: true,
        run_feature_flip: true,
        run_counterfactuals: true,
        run_lime: true,
        pdp_features: configData.pdpFeatures,
        pdp_target_class: configData.pdpTargetClass,
        lime_instance_index: configData.limeInstanceIndex,
        cf_instance_index: configData.cfInstanceIndex,
        cf_desired_class: configData.cfDesiredClass
      };

      console.log('Generating report with payload:', payload);

      const response = await fetch(
        `${hostnameAI}/model/explain`,
        {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log('Report generated successfully:', result);
        setReportData(result);
        setShowConfigModal(false);
        setReportGenerated(true);
        toast.success('Report generated successfully!', {
          duration: 4000,
          position: 'top-right',
        });
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to generate report. Please try again.', {
          duration: 4000,
          position: 'top-right',
        });
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error(error.message || 'Failed to generate report. Please try again.', {
        duration: 4000,
        position: 'top-right',
      });
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleSaveModelFromLayout = () => {
    setShowSaveModal(true);
  };

  const handleSaveModel = async (modelsToSave) => {
    if (!sessionId) {
      toast.error('Session ID not found. Please try again.', {
        duration: 4000,
        position: 'top-right',
      });
      return;
    }

    try {
      const payload = {
        session_id: sessionId,
        run_names: modelsToSave.map(model => model.run_name),
        descriptions: modelsToSave.reduce((acc, model) => {
          acc[model.run_name] = model.description || '';
          return acc;
        }, {})
      };

      const response = await fetch(
        
        `${hostnameAI}/model/save-models`,
        {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log('Models saved successfully:', result);
        
        toast.success('Models saved successfully!', {
          duration: 3000,
          position: 'top-right',
        });

        setShowSaveModal(false);
        
        // Navigate to next step
        navigate('/ai/playground/model-deployment', {
          state: {
            mode: readonly ? 'view' : 'edit',
            savedModels: modelsToSave,
            isEnsemble: location.state?.isEnsemble,
            ensembleCount: location.state?.ensembleCount,
            activeModelIndex: location.state?.activeModelIndex
          }
        });
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to save models. Please try again.', {
          duration: 4000,
          position: 'top-right',
        });
      }
    } catch (error) {
      console.error('Error saving models:', error);
      toast.error(error.message || 'Failed to save models. Please try again.', {
        duration: 4000,
        position: 'top-right',
      });
    }
  };

  // Table columns for Feature Flip Summary
  const featureFlipColumns = [
    { key: 'id', label: 'Sno', sortable: true, width: '80px' },
    { key: 'feature', label: 'Feature', sortable: true },
    { key: 'affected', label: '% Affected', sortable: true },
    { key: 'change', label: 'Avg Change', sortable: true },
    { key: 'direction', label: 'Direction', sortable: true }
  ];

  // Table columns for Counterfactual
  const counterfactualColumns = [
    { key: 'id', label: 'Sno', sortable: true, width: '80px' },
    { key: 'feature', label: 'Feature', sortable: true },
    { key: 'original', label: 'Original', sortable: true },
    { key: 'counterfactual', label: 'Counterfactual', sortable: true },
    { key: 'change', label: 'Change', sortable: true }
  ];

  // Table columns for LIME
  const limeColumns = [
    { key: 'id', label: 'Sno', sortable: true, width: '80px' },
    { key: 'rule', label: 'Rule', sortable: true },
    { key: 'contribution', label: 'Contribution', sortable: true }
  ];

  // Transform API data for Feature Flip Summary
  const getFeatureFlipData = () => {
    if (!reportData?.feature_flip_summary) return [];
    
    return reportData.feature_flip_summary.map((item, index) => ({
      id: index + 1,
      feature: item.Feature,
      affected: item['% of Users Affected'],
      change: item['Avg Change'],
      direction: item['Common Direction']
    }));
  };

  // Transform API data for LIME Report
  const getLimeData = () => {
    if (!reportData?.lime_report?.explanation_for_class) return [];
    
    return reportData.lime_report.explanation_for_class.map((item, index) => ({
      id: index + 1,
      rule: item[0],
      contribution: item[1].toFixed(4)
    }));
  };

  // PDP Chart Component
  const PDPChart = ({ imageData, title }) => (
    <div className="bg-white border border-gray-200 rounded p-4">
      <h4 className="text-sm font-medium text-gray-900 mb-3">{title}</h4>
      <div className="w-full flex items-center justify-center" style={{ minHeight: '300px' }}>
        <img 
          src={`data:image/png;base64,${imageData}`} 
          alt={title}
          className="w-full h-auto object-contain"
          style={{ maxHeight: '400px' }}
        />
      </div>
    </div>
  );

  return (
    <AIPlaygroundLayout onSaveModel={handleSaveModelFromLayout}>
      <div className="max-w-7xl mx-auto bg-gray-50 rounded-lg p-6">
        <div className="flex items-start justify-between">
          {/* Header Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Explainability Report</h2>
            <p className="text-sm text-gray-600">
              Select a model to generate explainability insights using SHAP, PDP, LIME, and counterfactuals.
            </p>
          </div>

          {/* Controls Section */}
          <div className="flex items-end gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Model Selection</label>
              <select
                value={selectedModel}
                onChange={(e) => {
                  if (!readonly) {
                    const newModel = e.target.value;
                    setSelectedModel(newModel);
                    // Reset configured model if user changes selection
                    if (newModel !== configuredModel) {
                      setConfiguredModel('');
                      setReportGenerated(false); // Reset report generated state
                    }
                  }
                }}
                disabled={readonly || loadingModels}
                className="w-56 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:border-transparent"
              >
                <option value="">Select</option>
                {modelsList.map((model) => (
                  <option key={model.run_id} value={model.run_name}>
                    {model.run_name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleConfigureReport}
              disabled={!selectedModel || loadingConfig}
              className="px-6 py-2 bg-[#8e78b7] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#7d67a6]"
            >
              {loadingConfig ? 'Loading...' : (reportGenerated ? 'Reconfigure' : 'Configure & Generate Report')}
            </button>

            <div className="relative">
              <button 
                onClick={() => setShowMenuDropdown(!showMenuDropdown)}
                className="w-10 h-10 bg-white border border-gray-300 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <MoreVertical size={20} />
              </button>

              {showMenuDropdown && (
                <div className="absolute right-0 top-12 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <button 
                    onClick={() => {
                      setShowMenuDropdown(false);
                      setShowGovernanceModal(true);
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-[#8e78b7] hover:bg-gray-50 transition-colors"
                  >
                    Download Governance Report
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Report Results */}
      {reportGenerated && (
        <div className="max-w-7xl mx-auto mt-6 space-y-6">
          {!reportData ? (
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="py-12 text-center">
                <p className="text-gray-500 text-sm">No report data available. Please try generating the report again.</p>
              </div>
            </div>
          ) : (
            <>
              {/* SHAP Summary Plot */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Feature Importance (SHAP Summary Plot)</h3>
                <div className="bg-white border border-gray-200 rounded p-4 flex justify-center items-center min-h-[400px]">
                  {reportData.shap_summary_plot ? (
                    <img 
                      src={`data:image/png;base64,${reportData.shap_summary_plot}`} 
                      alt="SHAP Summary Plot"
                      className="w-full h-auto object-contain"
                      style={{ maxHeight: '600px' }}
                    />
                  ) : (
                    <div className="py-12 text-center">
                      <p className="text-gray-500 text-sm">SHAP Summary Plot not available</p>
                    </div>
                  )}
                </div>
              </div>

          {/* SHAP Beeswarm Plot */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Feature Importance (SHAP Beeswarm Plot)</h3>
            <div className="bg-white border border-gray-200 rounded p-4 flex justify-center items-center min-h-[400px]">
              {reportData.shap_beeswarm_plot ? (
                <img 
                  src={`data:image/png;base64,${reportData.shap_beeswarm_plot}`} 
                  alt="SHAP Beeswarm Plot"
                  className="w-full h-auto object-contain"
                  style={{ maxHeight: '600px' }}
                />
              ) : (
                <div className="py-12 text-center">
                  <p className="text-gray-500 text-sm">SHAP Beeswarm Plot not available</p>
                </div>
              )}
            </div>
          </div>

          {/* PDP Plots */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-base font-semibold text-gray-900 mb-4">PDP Plots</h3>
            {reportData.pdp_plots && Object.keys(reportData.pdp_plots).length > 0 ? (
              <div className={`grid gap-4 ${
                Object.keys(reportData.pdp_plots).length === 1 
                  ? 'grid-cols-1' 
                  : Object.keys(reportData.pdp_plots).length === 2 
                    ? 'grid-cols-2' 
                    : 'grid-cols-2 xl:grid-cols-3'
              }`}>
                {Object.entries(reportData.pdp_plots).map(([featureName, imageData]) => (
                  <PDPChart 
                    key={featureName} 
                    imageData={imageData} 
                    title={featureName} 
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded p-4">
                <div className="py-12 text-center">
                  <p className="text-gray-500 text-sm">PDP Plots not available</p>
                </div>
              </div>
            )}
          </div>

          {/* Feature Flip Summary */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Feature Flip Summary</h3>
            {reportData.feature_flip_summary && reportData.feature_flip_summary.length > 0 ? (
              <DataTable
                columns={featureFlipColumns}
                data={getFeatureFlipData()}
                isLoading={false}
                isError={false}
              />
            ) : (
              <div className="bg-white border border-gray-200 rounded p-4">
                <div className="py-12 text-center">
                  <p className="text-gray-500 text-sm">Feature Flip Summary not available</p>
                </div>
              </div>
            )}
          </div>

          {/* Counterfactual Report - Hardcoded for now */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Counterfactual Report</h3>
            <DataTable
              columns={counterfactualColumns}
              data={counterfactualData}
              isLoading={false}
              isError={false}
            />
          </div>

          {/* LIME Report */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-base font-semibold text-gray-900 mb-4">LIME Report</h3>
            {reportData.lime_report ? (
              <>
                <div className="mb-4 space-y-1">
                  <p className="text-sm text-gray-700">
                    <strong>Predicted Class:</strong> {reportData.lime_report.predicted_class_name || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Intercept:</strong> {reportData.lime_report.intercept !== undefined && reportData.lime_report.intercept !== null 
                      ? reportData.lime_report.intercept.toFixed(10) 
                      : 'N/A'}
                  </p>
                </div>
                {reportData.lime_report.explanation_for_class && reportData.lime_report.explanation_for_class.length > 0 ? (
                  <DataTable
                    columns={limeColumns}
                    data={getLimeData()}
                    isLoading={false}
                    isError={false}
                  />
                ) : (
                  <div className="bg-white border border-gray-200 rounded p-4">
                    <div className="py-8 text-center">
                      <p className="text-gray-500 text-sm">LIME explanation data not available</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white border border-gray-200 rounded p-4">
                <div className="py-12 text-center">
                  <p className="text-gray-500 text-sm">LIME Report not available</p>
                </div>
              </div>
            )}
          </div>
            </>
          )}
        </div>
      )}

      {/* Modals */}
      <ConfigurationModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        onGenerate={handleGenerateReport}
        xaiConfig={xaiConfig}
        readonly={readonly}
        isGenerating={generatingReport}
      />

      <SaveModelSelectionModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveModel}
        readonly={readonly}
        modelsList={modelsList}
        sessionId={sessionId}
      />

      <GovernanceReportModal
        isOpen={showGovernanceModal}
        onClose={() => setShowGovernanceModal(false)}
      />
    </AIPlaygroundLayout>
  );
}

export default XAI;