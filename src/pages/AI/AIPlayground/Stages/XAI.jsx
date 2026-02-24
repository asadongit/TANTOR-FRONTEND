import { MoreVertical, Search, ChevronDown } from 'lucide-react';
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
  const [configuredModel, setConfiguredModel] = useState('');
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const menuDropdownRef = useRef(null);

  // Searchable dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  const filteredModels = modelsList.filter(model =>
    model.run_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuDropdownRef.current && !menuDropdownRef.current.contains(event.target)) {
        setShowMenuDropdown(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenuDropdown]);

  useEffect(() => {
    if (isDropdownOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isDropdownOpen]);

  useEffect(() => {
    if (sessionId && !readonly) {
      startPolling();
    }

    return () => stopPolling();
  }, [sessionId, readonly]);

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
          headers: { 'accept': 'application/json' }
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

  const pollingIntervalRef = useRef(null);

  const fetchLoggedModels = async () => {
    try {
      const response = await fetch(
        `${hostnameAI}/model/logged_models/${sessionId}`,
        {
          method: 'GET',
          headers: { 'accept': 'application/json' }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setModelsList(data.logged_models || []);
      } else {
        toast.error('Failed to fetch models. Please try again.', { duration: 4000, position: 'top-right' });
      }
    } catch (error) {
      console.error('Error fetching models:', error);
      toast.error(error.message || 'Failed to fetch models. Please try again.', { duration: 4000, position: 'top-right' });
    }
  };

  const fetchRunsLogged = async () => {
    if (!sessionId) {
      toast.error('Session ID not found', { duration: 4000, position: 'top-right' });
      return;
    }

    try {
      const res = await fetch(`${hostnameAI}/model/runs_logged/${sessionId}`, {
        method: 'GET',
        headers: { accept: 'application/json' },
      });

      if (!res.ok) throw new Error(`Runs logged error! status: ${res.status}`);

      const data = await res.json();

      await fetchLoggedModels();
    } catch (error) {
      console.error('Error fetching runs logged:', error);
    }
  };

  const startPolling = () => {
    fetchRunsLogged();

    pollingIntervalRef.current = setInterval(() => {
      fetchRunsLogged();
    }, 5000);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const handleModelSelect = (model) => {
    const newModel = model.run_name;
    setSelectedModel(newModel);
    setIsDropdownOpen(false);
    setSearchQuery('');
    if (newModel !== configuredModel) {
      setConfiguredModel('');
      setReportGenerated(false);
    }
  };

  const handleConfigureReport = async () => {
    if (selectedModel && sessionId) {
      if (configuredModel === selectedModel && xaiConfig) {
        setShowConfigModal(true);
        return;
      }

      setLoadingConfig(true);
      try {
        const response = await fetch(
          `${hostnameAI}/model/XAI_config?session_id=${sessionId}&model_name=${encodeURIComponent(selectedModel)}`,
          {
            method: 'GET',
            headers: { 'accept': 'application/json' }
          }
        );

        if (response.ok) {
          const config = await response.json();
          setXaiConfig(config);
          setConfiguredModel(selectedModel);
          setShowConfigModal(true);
        } else {
          toast.error('Failed to fetch XAI configuration. Please try again.', { duration: 4000, position: 'top-right' });
        }
      } catch (error) {
        console.error('Error fetching XAI configuration:', error);
        toast.error(error.message || 'Failed to fetch XAI configuration. Please try again.', { duration: 4000, position: 'top-right' });
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

      const response = await fetch(
        `${hostnameAI}/model/explain`,
        {
          method: 'POST',
          headers: { 'accept': 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      if (response.ok) {
        const result = await response.json();
        setReportData(result);
        setShowConfigModal(false);
        setReportGenerated(true);
        toast.success('Report generated successfully!', { duration: 4000, position: 'top-right' });
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to generate report. Please try again.', { duration: 4000, position: 'top-right' });
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error(error.message || 'Failed to generate report. Please try again.', { duration: 4000, position: 'top-right' });
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleSaveModelFromLayout = () => setShowSaveModal(true);

  const handleSaveModel = async (modelsToSave) => {
    if (!sessionId) {
      toast.error('Session ID not found. Please try again.', { duration: 4000, position: 'top-right' });
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
          headers: { 'accept': 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      if (response.ok) {
        const result = await response.json();
        toast.success('Models saved successfully!', { duration: 3000, position: 'top-right' });
        setShowSaveModal(false);

        if (projectState?.selectedProject) {
          try {
            const experimentResponse = await fetch(
              `${hostnameAI}/model/projects/${projectState.selectedProject}/experiment`,
              { method: 'GET', headers: { 'accept': 'application/json' } }
            );

            if (experimentResponse.ok) {
              const experimentData = await experimentResponse.json();
              setProjectState(prev => ({
                ...prev,
                mlflowExperimentId: experimentData.mlflow_experiment_id,
                projectId: experimentData.project_id,
                projectName: experimentData.project_name
              }));
            } else {
              toast.error('Failed to fetch MLflow experiment details', { duration: 4000, position: 'top-right' });
            }
          } catch (error) {
            toast.error('Error fetching MLflow experiment details', { duration: 4000, position: 'top-right' });
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
        toast.error(errorData.message || 'Failed to save models. Please try again.', { duration: 4000, position: 'top-right' });
      }
    } catch (error) {
      console.error('Error saving models:', error);
      toast.error(error.message || 'Failed to save models. Please try again.', { duration: 4000, position: 'top-right' });
    }
  };

  // Table columns
  const featureFlipColumns = [
    { key: 'id', label: 'Sno', sortable: true, width: '80px' },
    { key: 'feature', label: 'Feature', sortable: true },
    { key: 'affected', label: '% Affected', sortable: true },
    { key: 'change', label: 'Avg Change', sortable: true },
    { key: 'direction', label: 'Direction', sortable: true }
  ];

  const counterfactualColumns = [
    { key: 'id', label: 'Sno', sortable: true, width: '80px' },
    { key: 'feature', label: 'Feature', sortable: true },
    { key: 'original', label: 'Original', sortable: true },
    { key: 'counterfactual', label: 'Counterfactual', sortable: true },
    { key: 'change', label: 'Change', sortable: true }
  ];

  const limeColumns = [
    { key: 'id', label: 'Sno', sortable: true, width: '80px' },
    { key: 'rule', label: 'Rule', sortable: true },
    { key: 'contribution', label: 'Contribution', sortable: true }
  ];

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

  const getLimeData = () => {
    if (!reportData?.lime_report?.explanation_for_class) return [];
    return reportData.lime_report.explanation_for_class.map((item, index) => ({
      id: index + 1,
      rule: item[0],
      contribution: item[1].toFixed(4)
    }));
  };

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

      {/* ── Outer wrapper: #FAFAFA background ── */}
      <div className="w-full rounded-lg p-6" style={{ backgroundColor: '#FAFAFA' }}>
        <div className="flex items-center justify-between gap-6">

          {/* Left: title + description – sits directly on #FAFAFA */}
          <div className="flex-1 min-w-0">
            <h2
              className="text-gray-900 mb-3"
              style={{
                fontFamily: 'Satoshi, sans-serif',
                fontWeight: 500,
                fontSize: '18px',
                lineHeight: '100%',
                letterSpacing: '0%'
              }}
            >
              Explainability Report
            </h2>
            <p
              className="text-gray-500"
              style={{
                fontFamily: 'Satoshi, sans-serif',
                fontWeight: 400,
                fontSize: '16px',
                lineHeight: '100%',
                letterSpacing: '0%'
              }}
            >
              {readonly
                ? 'View explainability insights using SHAP, PDP, LIME, and counterfactuals.'
                : 'Select a model to generate explainability insights using SHAP, PDP, LIME, and counterfactuals.'}
            </p>
          </div>

          {/* Right: white card containing all controls */}
          <div className="bg-white rounded-lg px-5 py-4 flex items-end gap-3 flex-shrink-0">
            {readonly ? (
              <div className="min-w-[280px] max-w-[480px]">
                <label
                  className="block text-[14px] font-medium text-gray-700 mb-2 leading-none tracking-normal"
                  style={{ fontFamily: 'Satoshi, sans-serif' }}
                >
                  Model Name
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 break-words">
                  {selectedModel || 'No model selected'}
                </div>
              </div>
            ) : (
              <>
                {/* Searchable Model Selection */}
                <div>
                  <label
                    className="block text-[14px] font-medium text-gray-700 mb-2 leading-none tracking-normal"
                    style={{ fontFamily: 'Satoshi, sans-serif' }}
                  >
                    Model Selection
                  </label>
                  <div className="relative w-80" ref={dropdownRef}>

                    {/* Trigger button — highlighted when open, text truncated */}
                    <button
                      type="button"
                      onClick={() => { if (!loadingModels) setIsDropdownOpen(prev => !prev); }}
                      disabled={loadingModels}
                      style={{ overflow: 'hidden' }}
                      className={`
                        w-full flex items-center justify-between bg-white
                        px-3 py-2 text-sm rounded-lg border transition-colors
                        ${isDropdownOpen
                          ? 'border-[#8e78b7] ring-2 ring-[#8e78b7]/20'
                          : 'border-gray-300 hover:border-[#8e78b7]'}
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                    >
                      <span
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          minWidth: 0,
                          flex: 1,
                          marginRight: '8px',
                          textAlign: 'left',   // ← add this
                          color: selectedModel ? '#111827' : '#9ca3af'
                        }}
                      >
                        {selectedModel || 'Select'}
                      </span>
                      <ChevronDown
                        size={16}
                        style={{ flexShrink: 0, color: '#9ca3af', transition: 'transform 0.2s', transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                      />
                    </button>

                    {/* Dropdown panel */}
                    {isDropdownOpen && (
                      <div
                        className="absolute z-50 left-0 right-0 mt-1 bg-white border border-[#8e78b7]/40 rounded-lg"
                        style={{ boxShadow: '0 4px 16px rgba(142,120,183,0.15)', overflow: 'hidden', width: '100%' }}
                      >
                        {/* Search input — no border, no focus highlight */}
                        <div className="px-3 py-2 border-b border-gray-100">
                          <div
                            className="flex items-center gap-2 px-2 py-1.5 rounded-md"
                            style={{ backgroundColor: '#f5f3fb' }}
                          >
                            <Search size={14} className="text-[#8e78b7] flex-shrink-0" />
                            <input
                              ref={searchInputRef}
                              type="text"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="Search"
                              style={{ background: 'transparent', border: 'none', outline: 'none', boxShadow: 'none', width: '100%' }}
                              className="text-sm text-gray-700 placeholder-gray-400"
                            />
                          </div>
                        </div>

                        {/* Options list */}
                        <div style={{ maxHeight: '208px', overflowY: 'auto', overflowX: 'auto', width: '100%' }}>
                          {filteredModels.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-gray-400 text-center">
                              No models found
                            </div>
                          ) : (
                            filteredModels.map((model) => (
                              <button
                                key={model.run_id}
                                type="button"
                                onClick={() => handleModelSelect(model)}
                                style={{
                                  display: 'block',
                                  width: 'max-content',
                                  minWidth: '100%',
                                  textAlign: 'left',
                                  padding: '10px 16px',
                                  fontSize: '14px',
                                  whiteSpace: 'nowrap',
                                  background: 'transparent',
                                  color: selectedModel === model.run_name ? '#8e78b7' : '#374151',
                                  fontWeight: selectedModel === model.run_name ? '600' : '400',
                                  border: 'none',
                                  cursor: 'pointer',
                                  boxSizing: 'border-box',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.color = '#8e78b7'; }}
                                onMouseLeave={e => { e.currentTarget.style.color = selectedModel === model.run_name ? '#8e78b7' : '#374151'; }}
                              >
                                {model.run_name}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Configure & Generate Report button */}
                <button
                  onClick={handleConfigureReport}
                  disabled={!selectedModel || loadingConfig}
                  className="px-5 py-2 bg-[#8e78b7] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#7d67a6] whitespace-nowrap"
                  style={{ fontFamily: 'Satoshi, sans-serif' }}
                >
                  {loadingConfig ? 'Loading...' : (reportGenerated ? 'Reconfigure' : 'Configure & Generate Report')}
                </button>

                {/* Three-dot menu */}
                <div className="relative self-end" ref={menuDropdownRef}>
                  <button
                    onClick={() => setShowMenuDropdown(!showMenuDropdown)}
                    disabled={!selectedModel}
                    className="w-9 h-9 bg-white border border-gray-300 rounded-lg flex items-center justify-center text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#8e78b7] hover:text-[#8e78b7] transition-colors"
                  >
                    <MoreVertical size={18} />
                  </button>

                  {showMenuDropdown && (
                    <div className="absolute right-0 top-10 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      <button
                        onClick={() => { setShowMenuDropdown(false); setShowGovernanceModal(true); }}
                        className="w-full px-4 py-3 text-left text-sm text-[#8e78b7] hover:bg-[#f5f3fb] transition-colors rounded-lg"
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

      {/* Loading – view mode initial fetch */}
      {readonly && generatingReport && !initialLoadComplete && (
        <div className="w-full mt-6">
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
        <div className="w-full mt-6 space-y-6">
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
                  <PDPChart key={featureName} imageData={imageData} title={featureName} />
                ))}
              </div>
            </div>
          )}

          {reportData.feature_flip_summary && reportData.feature_flip_summary.length > 0 && (
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Feature Flip Summary</h3>
              <DataTable columns={featureFlipColumns} data={getFeatureFlipData()} isLoading={false} isError={false} />
            </div>
          )}

          {reportData.counterfactual_report && reportData.counterfactual_report.length > 0 && (
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Counterfactual Report</h3>
              <DataTable columns={counterfactualColumns} data={getCounterfactualData()} isLoading={false} isError={false} />
            </div>
          )}

          {reportData.lime_report?.explanation_for_class?.length > 0 && (
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-base font-semibold text-gray-900 mb-4">LIME Report</h3>
              <div className="mb-4 space-y-1">
                <p className="text-sm text-gray-700">
                  <strong>Predicted Class:</strong> {reportData.lime_report.predicted_class_name || 'N/A'}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Intercept:</strong>{' '}
                  {reportData.lime_report.intercept != null
                    ? reportData.lime_report.intercept.toFixed(10)
                    : 'N/A'}
                </p>
              </div>
              <DataTable columns={limeColumns} data={getLimeData()} isLoading={false} isError={false} />
            </div>
          )}
        </div>
      )}

      {/* No report – view mode after initial load */}
      {!reportGenerated && !generatingReport && readonly && initialLoadComplete && (
        <div className="w-full mt-6">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="py-12 text-center">
              <p className="text-gray-500 text-sm">XAI report was not generated while saving the model.</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading – edit mode generating */}
      {!readonly && generatingReport && (
        <div className="w-full mt-6">
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