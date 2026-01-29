import { MoreVertical } from 'lucide-react';
import { AIPlaygroundLayout } from '../AIPlaygroundLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, LineChart, Line, Cell } from 'recharts';
import ConfigurationModal from '../modals/XAI/ConfigurationModal';
import { SaveModelSelectionModal } from '../modals/XAI/SaveModelSelectionModal';
import GovernanceReportModal from '../modals/XAI/GovernanceReportModal';
import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DataTable from '../../../../components/DataTable';
import { useAIPlayground } from '../../../../context/AIPlaygroundContext';
import toast from 'react-hot-toast';

function XAI() {
  const hostnameAI = window._env_?.VITE_AI_API;
  const location = useLocation();
  const navigate = useNavigate();
  const { projectState, workflowState, datasetState, setProjectState, modelState, mode } = useAIPlayground();
  const sessionId = datasetState?.sessionId;
  const readonly = mode === 'view';

  useEffect(() => {
    if (datasetState.sessionId == '') {
      navigate('/ai/playground')
    }
  }, []);

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
  const [initialLoadComplete, setInitialLoadComplete] = useState(false); // Track if initial load in view mode is done
  const menuDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuDropdownRef.current && !menuDropdownRef.current.contains(event.target)) {
        setShowMenuDropdown(false);
      }
    };

    if (showMenuDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenuDropdown]);

  useEffect(() => {
    if (sessionId && !readonly) {
      fetchLoggedModels();
    }
  }, [sessionId, readonly]);

  // Pre-select model and fetch XAI report in view mode
  useEffect(() => {
    if (readonly && modelState?.selectedModel) {
      setSelectedModel(modelState.selectedModel);
      fetchXAIReport(modelState.selectedModel);
    }
  }, [readonly, modelState?.selectedModel]);

  const fetchXAIReport = async (runName) => {
    if (!runName) return;

    setGeneratingReport(true);
    try {
      const response = await fetch(
        `${hostnameAI}/canvas/mlflow/xai-report?run_name=${encodeURIComponent(runName)}`,
        {
          method: 'GET',
          headers: {
            'accept': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.xai_report) {
          setReportData(data.xai_report);
          setReportGenerated(true);
        } else {
          setReportGenerated(false);
        }
      } else {
        setReportGenerated(false);
      }
    } catch (error) {
      console.error('Error fetching XAI report:', error);
      setReportGenerated(false);

    } finally {
      setGeneratingReport(false);
      setInitialLoadComplete(true);
    }
  };

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

        if (projectState?.selectedProject) {
          try {
            const experimentResponse = await fetch(
              `${hostnameAI}/model/projects/${projectState.selectedProject}/experiment`,
              {
                method: 'GET',
                headers: {
                  'accept': 'application/json'
                }
              }
            );

            if (experimentResponse.ok) {
              const experimentData = await experimentResponse.json();

              setProjectState(prev => ({
                ...prev,
                mlflowExperimentId: experimentData.mlflow_experiment_id,
                projectId: experimentData.project_id,
                projectName: experimentData.project_name
              }));

              console.log('Stored MLflow experiment ID in context:', experimentData.mlflow_experiment_id);
            } else {
              console.error('Failed to fetch experiment ID');
              toast.error('Failed to fetch MLflow experiment details', {
                duration: 4000,
                position: 'top-right',
              });
            }
          } catch (error) {
            console.error('Error fetching experiment ID:', error);
            toast.error('Error fetching MLflow experiment details', {
              duration: 4000,
              position: 'top-right',
            });
          }
        }

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

  // Transform API data for Counterfactual Report
  const getCounterfactualData = () => {
    if (!reportData?.counterfactual_report) return [];

    return reportData.counterfactual_report.map((item, index) => ({
      id: index + 1,
      feature: item.Feature,
      original: typeof item.Original === 'number' ? item.Original.toFixed(6) : item.Original,
      counterfactual: typeof item.Counterfactual === 'number' ? item.Counterfactual.toFixed(6) : item.Counterfactual,
      change: typeof item.Change === 'number' ? item.Change.toFixed(6) : item.Change
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
    <AIPlaygroundLayout onSaveModel={handleSaveModelFromLayout} isNextDisabled={readonly}>
      <div className="max-w-7xl mx-auto bg-gray-50 rounded-lg p-6">
        <div className="flex items-start justify-between">
          {/* Header Section */}
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Explainability Report</h2>
            <p className="text-sm text-gray-600">
              {readonly
                ? 'View explainability insights using SHAP, PDP, LIME, and counterfactuals.'
                : 'Select a model to generate explainability insights using SHAP, PDP, LIME, and counterfactuals.'}
            </p>
          </div>

          {/* Controls Section */}
          <div className="flex items-end gap-3 flex-shrink-0">
            {readonly ? (
              <div className="min-w-[400px] max-w-[600px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">Model Name</label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 break-words">
                  {selectedModel || 'No model selected'}
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Model Selection</label>
                  <select
                    value={selectedModel}
                    onChange={(e) => {
                      const newModel = e.target.value;
                      setSelectedModel(newModel);
                      // Reset configured model if user changes selection
                      if (newModel !== configuredModel) {
                        setConfiguredModel('');
                        setReportGenerated(false); // Reset report generated state
                      }
                    }}
                    disabled={loadingModels}
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

                <div className="relative" ref={menuDropdownRef}>
                  <button
                    onClick={() => setShowMenuDropdown(!showMenuDropdown)}
                    disabled={!selectedModel}
                    className="w-10 h-10 bg-white border border-gray-300 rounded-lg flex items-center justify-center text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
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
              </>
            )}
          </div>
        </div>
      </div>

      {/* Loading State for View Mode - Show during initial fetch */}
      {readonly && generatingReport && !initialLoadComplete && (
        <div className="max-w-7xl mx-auto mt-6">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="py-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#8e78b7] mb-4"></div>
              <p className="text-gray-500 text-sm">Loading XAI report...</p>
            </div>
          </div>
        </div>
      )}

      {/* Report Results */}
      {reportGenerated && reportData && !generatingReport && (
        <div className="max-w-7xl mx-auto mt-6 space-y-6">
          {/* SHAP Summary Plot */}
          {reportData.shap_summary_plot && (
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Feature Importance (SHAP Summary Plot)</h3>
              <div className="bg-white border border-gray-200 rounded p-4 flex justify-center items-center min-h-[400px]">
                <img
                  src={`data:image/png;base64,${reportData.shap_summary_plot}`}
                  alt="SHAP Summary Plot"
                  className="w-full h-auto object-contain"
                  style={{ maxHeight: '600px' }}
                />
              </div>
            </div>
          )}

          {/* SHAP Beeswarm Plot */}
          {reportData.shap_beeswarm_plot && (
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Feature Importance (SHAP Beeswarm Plot)</h3>
              <div className="bg-white border border-gray-200 rounded p-4 flex justify-center items-center min-h-[400px]">
                <img
                  src={`data:image/png;base64,${reportData.shap_beeswarm_plot}`}
                  alt="SHAP Beeswarm Plot"
                  className="w-full h-auto object-contain"
                  style={{ maxHeight: '600px' }}
                />
              </div>
            </div>
          )}

          {/* PDP Plots */}
          {reportData.pdp_plots && Object.keys(reportData.pdp_plots).length > 0 && (
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-base font-semibold text-gray-900 mb-4">PDP Plots</h3>
              <div className={`grid gap-4 ${Object.keys(reportData.pdp_plots).length === 1
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
            </div>
          )}

          {/* Feature Flip Summary */}
          {reportData.feature_flip_summary && reportData.feature_flip_summary.length > 0 && (
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Feature Flip Summary</h3>
              <DataTable
                columns={featureFlipColumns}
                data={getFeatureFlipData()}
                isLoading={false}
                isError={false}
              />
            </div>
          )}

          {/* Counterfactual Report */}
          {reportData.counterfactual_report && reportData.counterfactual_report.length > 0 && (
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Counterfactual Report</h3>
              <DataTable
                columns={counterfactualColumns}
                data={getCounterfactualData()}
                isLoading={false}
                isError={false}
              />
            </div>
          )}

          {/* LIME Report */}
          {reportData.lime_report && reportData.lime_report.explanation_for_class && reportData.lime_report.explanation_for_class.length > 0 && (
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-base font-semibold text-gray-900 mb-4">LIME Report</h3>
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
              <DataTable
                columns={limeColumns}
                data={getLimeData()}
                isLoading={false}
                isError={false}
              />
            </div>
          )}
        </div>
      )}

      {/* No Report Message - Only show after initial load is complete */}
      {!reportGenerated && !generatingReport && readonly && initialLoadComplete && (
        <div className="max-w-7xl mx-auto mt-6">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="py-12 text-center">
              <p className="text-gray-500 text-sm">XAI report was not generated while saving the model.</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State for Edit Mode */}
      {!readonly && generatingReport && (
        <div className="max-w-7xl mx-auto mt-6">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="py-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#8e78b7] mb-4"></div>
              <p className="text-gray-500 text-sm">Generating XAI report...</p>
            </div>
          </div>
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
        selectedModel={selectedModel}
        sessionId={sessionId}
      />
    </AIPlaygroundLayout>
  );
}

export default XAI;