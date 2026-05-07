import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Download, Search, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useAIPlayground } from '../../../../../context/AIPlaygroundContext';

export function SaveModelSelectionModal({ isOpen, onClose, onSave, readonly, modelsList = [], modelsLoading, isInitializing, jobLoading, workflows = [] }) {
  const baseLoading = modelsLoading || isInitializing || jobLoading;
  const hostnameAI = window._env_?.VITE_AI_API;
  const [selectedModelsByWorkflow, setSelectedModelsByWorkflow] = useState({});
  const [descriptionsByWorkflow, setDescriptionsByWorkflow] = useState({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [downloadingReports, setDownloadingReports] = useState(false);
  const [currentReportData, setCurrentReportData] = useState(null);
  const [currentModelName, setCurrentModelName] = useState('');
  const [alreadyStartedCount, setAlreadyStartedCount] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [ensembleName, setEnsembleName] = useState('');
  const [selectedWorkflowId, setSelectedWorkflowId] = useState('');
  const [workflowModels, setWorkflowModels] = useState([]);
  const [workflowModelsCache, setWorkflowModelsCache] = useState({});
  const [isWorkflowModelsLoading, setIsWorkflowModelsLoading] = useState(false);
  const [isAllWorkflowModelsLoading, setIsAllWorkflowModelsLoading] = useState(false);
  const [isValidatingEnsembleName, setIsValidatingEnsembleName] = useState(false);
  const reportRef = useRef(null);
  const searchInputRef = useRef(null);
  const { workflowState, activeWorkflowId, datasetState, projectState } = useAIPlayground();

  const isEnsembleMode = workflows.length > 0;
  const isMultiWorkflowEnsemble = workflows.length > 1;
  const effectiveModelsList = isEnsembleMode ? workflowModels : modelsList;
  const isLoading = baseLoading || (isEnsembleMode && (isWorkflowModelsLoading || isAllWorkflowModelsLoading));
  const currentSelectedModels = selectedModelsByWorkflow[selectedWorkflowId] || {};
  const currentDescriptions = descriptionsByWorkflow[selectedWorkflowId] || {};

  useEffect(() => {
    if (!isOpen) {
      setSelectedModelsByWorkflow({});
      setDescriptionsByWorkflow({});
      setShowConfirmation(false);
      setCurrentReportData(null);
      setCurrentModelName('');
      setAlreadyStartedCount(null);
      setSearchQuery('');
      setEnsembleName('');
      setSelectedWorkflowId('');
      setWorkflowModels([]);
      setWorkflowModelsCache({});
    } else {
      // Set default selected workflow to current active workflow
      if (activeWorkflowId && !selectedWorkflowId) {
        setSelectedWorkflowId(activeWorkflowId);
      }
    }
  }, [isOpen, activeWorkflowId]);

  useEffect(() => {
    if (!isOpen || !isEnsembleMode || !selectedWorkflowId || !datasetState?.ensembleId) {
      return;
    }

    const fetchWorkflowModels = async () => {
      setIsWorkflowModelsLoading(true);
      try {
        if (workflowModelsCache[selectedWorkflowId]) {
          setWorkflowModels(workflowModelsCache[selectedWorkflowId]);
        } else {
          setWorkflowModels([]);
        }

        const response = await fetch(
          `${hostnameAI}/model_lifecycle/logged_models`,
          {
            method: 'POST',
            headers: {
              accept: 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              ensemble_id: datasetState.ensembleId,
              workflow_id: selectedWorkflowId
            })
          }
        );

        if (!response.ok) {
          throw new Error(`Logged models error! status: ${response.status}`);
        }

        const data = await response.json();
        const fetchedModels = data.logged_models || [];
        setWorkflowModels(fetchedModels);
        setWorkflowModelsCache(prev => ({
          ...prev,
          [selectedWorkflowId]: fetchedModels
        }));
      } catch (error) {
        console.error('Error fetching workflow models:', error);
        setWorkflowModels([]);
        toast.error(error.message || 'Failed to fetch models for selected workflow.', {
          duration: 4000,
          position: 'top-right',
        });
      } finally {
        setIsWorkflowModelsLoading(false);
      }
    };

    fetchWorkflowModels();
  }, [isOpen, isEnsembleMode, selectedWorkflowId, datasetState?.ensembleId]);

  useEffect(() => {
    if (!isOpen || !isMultiWorkflowEnsemble || !datasetState?.ensembleId) {
      return;
    }

    const missingWorkflowIds = workflows
      .map(workflow => workflow.id)
      .filter(workflowId => !workflowModelsCache[workflowId]);

    if (missingWorkflowIds.length === 0) {
      return;
    }

    let isCancelled = false;

    const fetchAllWorkflowModels = async () => {
      setIsAllWorkflowModelsLoading(true);
      try {
        const results = await Promise.all(
          missingWorkflowIds.map(async (workflowId) => {
            try {
              const response = await fetch(
                `${hostnameAI}/model_lifecycle/logged_models`,
                {
                  method: 'POST',
                  headers: {
                    accept: 'application/json',
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    ensemble_id: datasetState.ensembleId,
                    workflow_id: workflowId
                  })
                }
              );

              if (!response.ok) {
                return [workflowId, []];
              }

              const data = await response.json();
              return [workflowId, data.logged_models || []];
            } catch (error) {
              console.error(`Error fetching workflow models for ${workflowId}:`, error);
              return [workflowId, []];
            }
          })
        );

        if (isCancelled) {
          return;
        }

        setWorkflowModelsCache(prev => {
          const next = { ...prev };
          results.forEach(([workflowId, models]) => {
            next[workflowId] = models;
          });
          return next;
        });
      } finally {
        if (!isCancelled) {
          setIsAllWorkflowModelsLoading(false);
        }
      }
    };

    fetchAllWorkflowModels();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, isMultiWorkflowEnsemble, workflows, workflowModelsCache, datasetState?.ensembleId, hostnameAI]);

  const filteredModelsList = effectiveModelsList.filter(model =>
    model.run_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const cancelJob = async () => {
    const jobId = workflowState?.completedJobs?.config?.job_id;
    if (!jobId) return;

    try {
      const response = await fetch(
        `${hostnameAI}/jobs/${jobId}/cancel`,
        {
          method: 'POST',
          headers: {
            'accept': 'application/json'
          },
          body: ''
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAlreadyStartedCount(data.already_started_count ?? null);
      }
    } catch (error) {
      console.error('Error cancelling job:', error);
    }
  };

  if (!isOpen) return null;

  const handleCheckboxChange = (modelRunName) => {
    if (readonly || !selectedWorkflowId) return;
    setSelectedModelsByWorkflow(prev => ({
      ...prev,
      [selectedWorkflowId]: {
        ...(prev[selectedWorkflowId] || {}),
        [modelRunName]: !(prev[selectedWorkflowId] || {})[modelRunName]
      }
    }));
  };

  const handleDescriptionChange = (modelRunName, value) => {
    if (readonly || !selectedWorkflowId) return;
    setDescriptionsByWorkflow(prev => ({
      ...prev,
      [selectedWorkflowId]: {
        ...(prev[selectedWorkflowId] || {}),
        [modelRunName]: value
      }
    }));
  };

  const validateEnsembleNameUniqueness = async (name) => {
    const projectName = projectState?.selectedProject || projectState?.projectName || '';

    if (!projectName) {
      throw new Error('Project name not found. Please select a project and try again.');
    }

    const response = await fetch(
      `${hostnameAI}/schemas/ensemble-names?project_name=${encodeURIComponent(projectName)}`,
      {
        method: 'GET',
        headers: {
          accept: 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to validate ensemble name: ${response.status}`);
    }

    const data = await response.json();
    const existingNamesRaw = Array.isArray(data)
      ? data
      : data.ensemble_names || data.names || [];

    const existingNames = existingNamesRaw
      .map(nameItem => String(nameItem).trim().toLowerCase())
      .filter(Boolean);

    return !existingNames.includes(name.trim().toLowerCase());
  };

  const validateEnsembleNameRules = (name) => {
    const normalizedName = name.trim();

    if (!normalizedName) {
      return 'Ensemble name is required.';
    }

    if (normalizedName.length > 100) {
      return 'Ensemble name must be 100 characters or fewer.';
    }

    if (!/^[A-Za-z][A-Za-z0-9_@#&\- ]*$/.test(normalizedName)) {
      return 'Ensemble name must start with a letter and can only include letters, numbers, underscores, hyphens, spaces, @, #, and &.';
    }

    const projectName = (projectState?.selectedProject || projectState?.projectName || '').trim();

    if (projectName && normalizedName.toLowerCase() === projectName.toLowerCase()) {
      return 'Ensemble name cannot match an existing project name.';
    }

    return null;
  };

  const handleSaveClick = async () => {
    const selectedCount = Object.values(selectedModelsByWorkflow).reduce(
      (acc, workflowSelections) => acc + Object.values(workflowSelections || {}).filter(Boolean).length,
      0
    );
    if (selectedCount === 0) return;
    // if it is a multiworkflow ensemble, validate that at least one model is selected from each workflow and that the ensemble name is unique before showing confirmation
    if (isMultiWorkflowEnsemble) {
      const workflowsWithoutSelection = workflows.filter((workflow) => {
        const workflowSelections = selectedModelsByWorkflow[workflow.id] || {};
        const selectedForWorkflow = Object.values(workflowSelections).filter(Boolean).length;
        return selectedForWorkflow === 0;
      });

      if (workflowsWithoutSelection.length > 0) {
        const missingWorkflowNames = workflowsWithoutSelection
          .map((workflow) => workflow.name || `Workflow ${workflow.id.slice(0, 8)}`)
          .join(', ');

        toast.error(`Select at least one model from each workflow before saving. Missing: ${missingWorkflowNames}`, {
          duration: 5000,
          position: 'top-right',
        });
        return;
      }

      const normalizedEnsembleName = ensembleName.trim();

      const ensembleNameError = validateEnsembleNameRules(normalizedEnsembleName);

      if (ensembleNameError) {
        toast.error(ensembleNameError, {
          duration: 4000,
          position: 'top-right',
        });
        return;
      }

      setIsValidatingEnsembleName(true);
      try {
        const isUnique = await validateEnsembleNameUniqueness(normalizedEnsembleName);
        if (!isUnique) {
          toast.error('The same ensemble name already exists. Please provide a different name.', {
            duration: 4000,
            position: 'top-right',
          });
          return;
        }
      } catch (error) {
        toast.error(error.message || 'Failed to validate ensemble name. Please try again.', {
          duration: 4000,
          position: 'top-right',
        });
        return;
      } finally {
        setIsValidatingEnsembleName(false);
      }
    }

    setShowConfirmation(true);
    cancelJob();
  };

  const handleConfirmSave = () => {
    const workflowsData = Object.entries(selectedModelsByWorkflow)
      .map(([workflowId, selectionMap]) => {
        const selectedRunNames = Object.entries(selectionMap || {})
          .filter(([, isSelected]) => isSelected)
          .map(([runName]) => runName);

        const modelsForWorkflow = workflowModelsCache[workflowId] || [];
        const runs = selectedRunNames.map(runName => {
          const modelMeta = modelsForWorkflow.find(m => m.run_name === runName);
          return {
            run_name: runName,
            run_id: modelMeta?.run_id,
            description: descriptionsByWorkflow[workflowId]?.[runName] || ''
          };
        });

        return {
          workflow_id: workflowId,
          runs
        };
      })
      .filter(workflow => workflow.runs.length > 0);

    const modelsToSave = workflowsData.flatMap(workflow => workflow.runs);

    if (workflowsData.length === 0) {
      toast.error('Please select at least one model to save.', {
        duration: 3000,
        position: 'top-right',
      });
      return;
    }

    onSave({
      modelsToSave,
      ensembleName: ensembleName.trim(),
      workflows: workflowsData
    });
    setShowConfirmation(false);
  };

  const handleCancel = () => {
    setShowConfirmation(false);
  };

  const handleClose = () => {
    setSelectedModelsByWorkflow({});
    setDescriptionsByWorkflow({});
    setShowConfirmation(false);
    setCurrentReportData(null);
    setCurrentModelName('');
    setSearchQuery('');
    onClose();
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  const handleDownloadGovernanceReports = async () => {
    const workflowsPayload = Object.entries(selectedModelsByWorkflow)
      .map(([workflowId, selectionMap]) => {
        const model_names = Object.entries(selectionMap || {})
          .filter(([, isSelected]) => isSelected)
          .map(([runName]) => runName);

        return {
          workflow_id: workflowId,
          model_names
        };
      })
      .filter(workflow => workflow.model_names.length > 0);

    const selectedWorkflowModels = workflowsPayload.flatMap(workflow =>
      workflow.model_names.map(modelName => ({ workflowId: workflow.workflow_id, modelName }))
    );

    if (selectedWorkflowModels.length === 0) {
      toast.error('Please select at least one model to download reports', {
        duration: 3000,
        position: 'top-right',
      })
      return;
    }

    if (!datasetState?.ensembleId || !(selectedWorkflowId || activeWorkflowId)) {
      toast.error('Ensemble ID or Workflow ID not found. Please try again.', {
        duration: 4000,
        position: 'top-right',
      });
      return;
    }

    setDownloadingReports(true);

    try {
      const response = await fetch(
        `${hostnameAI}/governance/download-governance-report`,
        {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ensemble_id: datasetState?.ensembleId,
            workflows: workflowsPayload
          })
        }
      );

      if (!response.ok) {
        toast.error('Failed to fetch governance reports');
        setDownloadingReports(false);
        return;
      }

      const reportData = await response.json();

      for (const { workflowId, modelName } of selectedWorkflowModels) {
        await generatePDFForModel(workflowId, modelName, reportData);
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      toast.success(`${selectedWorkflowModels.length} report${selectedWorkflowModels.length > 1 ? 's' : ''} downloaded successfully`, {
        duration: 3000,
        position: 'top-right',
      });
    } catch (error) {
      console.error('Error downloading governance reports:', error);
      toast.error('Failed to download governance reports', {
        duration: 4000,
        position: 'top-right',
      });
    } finally {
      setDownloadingReports(false);
      setCurrentReportData(null);
      setCurrentModelName('');
    }
  };

  const generatePDFForModel = async (workflowId, modelName, reportData) => {
    const workflowData = reportData?.workflows?.[workflowId];
    const modelData = workflowData?.models?.[modelName];
    const projectData = reportData?.project;
    const datasetData = reportData?.dataset || reportData?.workflows?.dataset;

    if (!modelData) {
      console.error(`No data found for model: ${modelName} in workflow: ${workflowId}`);
      return;
    }

    setCurrentReportData({ models: { [modelName]: modelData }, project: projectData, dataset: datasetData });
    setCurrentModelName(modelName);

    await new Promise(resolve => setTimeout(resolve, 300));

    if (!reportRef.current) {
      console.error('Report ref not available');
      return;
    }

    try {
      const input = reportRef.current;
      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: input.scrollWidth,
        windowHeight: input.scrollHeight
      });

      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`governance-report-${workflowId}-${modelName}.pdf`);
    } catch (error) {
      console.error(`PDF Generation Error for ${modelName} in workflow ${workflowId}:`, error);
      throw error;
    }
  };

  const selectedCount = Object.values(selectedModelsByWorkflow).reduce(
    (acc, workflowSelections) => acc + Object.values(workflowSelections || {}).filter(Boolean).length,
    0
  );
  // In ensemble mode, total models count is the sum of models in all workflows. In single workflow mode, it's just the length of the effective models list.
  const totalModelsCount = isMultiWorkflowEnsemble
    ? workflows.reduce((acc, workflow) => acc + (workflowModelsCache[workflow.id]?.length || 0), 0)
    : effectiveModelsList.length;
  const currentSelectedCount = Object.values(currentSelectedModels).filter(Boolean).length;
  const discardedCount = Math.max(totalModelsCount - selectedCount, 0);

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Save Models</h2>
            <div className="flex items-center gap-3">
              {/* Governance Report button beside close icon */}
              <button
                onClick={handleDownloadGovernanceReports}
                disabled={readonly || selectedCount === 0 || downloadingReports || isLoading}
                className="flex items-center gap-2 px-4 py-1.5 border border-gray-400 text-gray-400 hover:text-gray-600 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={15} />
                {downloadingReports ? 'Downloading...' : 'Governance Report'}
              </button>

              {/* Close icon */}
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="#818181" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>

          {alreadyStartedCount !== null && alreadyStartedCount > 0 && (
            <div className="mx-6 mt-4 flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                <strong>{alreadyStartedCount}</strong> model{alreadyStartedCount > 1 ? 's are' : ' is'} still running. You can proceed now or wait for all models to finish.
              </p>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Ensemble Name Input */}
            {workflows.length > 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Ensemble Name
                </label>
                <input
                  type="text"
                  value={ensembleName}
                  onChange={(e) => setEnsembleName(e.target.value)}
                  disabled={readonly}
                  placeholder="Enter ensemble name..."
                  maxLength={100}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
                
              </div>
            )}

            {/* Workflow Selection Buttons */}
            {workflows.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  Select Workflow
                </label>
                <div className="flex flex-wrap gap-2">
                  {workflows.map((workflow) => (
                    <button
                      key={workflow.id}
                      onClick={() => {
                        setSelectedWorkflowId(workflow.id);
                        setSearchQuery('');
                      }}
                      disabled={readonly}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedWorkflowId === workflow.id
                          ? 'bg-[#8e78b7] text-white border border-[#8e78b7]'
                          : 'bg-white text-gray-700 border border-gray-300 hover:border-[#8e78b7]'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {workflow.name || `Workflow ${workflow.id.slice(0, 8)}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-2 border-[#8e78b7] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500">Loading models...</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600">
                  Select the models you want to save and provide descriptions for each selected model.
                </p>

                {/* Search Bar */}
                {effectiveModelsList.length > 0 && (
                  <div className="relative">
                    <Search
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search models..."
                      className="w-full pl-9 pr-9 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent"
                    />
                    {searchQuery && (
                      <button
                        onClick={handleClearSearch}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                )}

                {effectiveModelsList.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-sm text-gray-500">No models available to save.</p>
                  </div>
                ) : filteredModelsList.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-sm text-gray-500">No models match your search.</p>
                    <button
                      onClick={handleClearSearch}
                      className="mt-2 text-sm text-[#8e78b7] hover:underline"
                    >
                      Clear search
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredModelsList.map((model) => (
                      <div
                        key={model.run_id}
                        className={`border rounded-lg p-4 transition-all ${
                          currentSelectedModels[model.run_name]
                            ? 'border-[#8e78b7] bg-purple-50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            id={`model-${model.run_id}`}
                            checked={currentSelectedModels[model.run_name] || false}
                            onChange={() => handleCheckboxChange(model.run_name)}
                            disabled={readonly}
                            className="mt-1 w-4 h-4 border-gray-300 rounded cursor-pointer"
                            style={{ accentColor: '#8e78b7' }}
                          />
                          <div className="flex-1">
                            <label
                              htmlFor={`model-${model.run_id}`}
                              className="block text-sm font-medium text-gray-900 cursor-pointer"
                              title={model.run_name}
                            >
                              <span className="block truncate max-w-[500px]">
                                {searchQuery ? (
                                  (() => {
                                    const name = model.run_name;
                                    const idx = name.toLowerCase().indexOf(searchQuery.toLowerCase());
                                    if (idx === -1) return name;
                                    return (
                                      <>
                                        {name.slice(0, idx)}
                                        {name.slice(idx, idx + searchQuery.length)}
                                        {name.slice(idx + searchQuery.length)}
                                      </>
                                    );
                                  })()
                                ) : (
                                  model.run_name
                                )}
                              </span>
                            </label>

                            {currentSelectedModels[model.run_name] && (
                              <div className="mt-3">
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Description
                                </label>
                                <textarea
                                  value={currentDescriptions[model.run_name] || ''}
                                  onChange={(e) => handleDescriptionChange(model.run_name, e.target.value)}
                                  disabled={readonly}
                                  placeholder="Enter model description..."
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent resize-none"
                                  rows={3}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 shadow-[0_-2px_8px_0_rgba(0,0,0,0.06)]">
            <div className="flex items-center gap-3">
              <button
                onClick={handleClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveClick}
                disabled={readonly || selectedCount === 0 || isLoading || isValidatingEnsembleName}
                className="px-6 py-2 bg-[#8e78b7] text-white rounded-lg text-sm font-medium hover:bg-[#7d67a6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isValidatingEnsembleName ? 'Validating...' : `Save Model${selectedCount > 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Report Container for PDF Generation */}
      {currentReportData && currentModelName && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <div ref={reportRef} className="p-6 space-y-6 bg-white" style={{ width: '800px' }}>
            {/* AI Use Case Section */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b-2 border-[#8e78b7]">
                AI use case
              </h4>
              <div className="bg-purple-50 border border-[#8e78b7] rounded p-3 mb-3">
                <p className="text-sm text-gray-700">
                  This Model is not yet associated with any AI use case
                </p>
              </div>
            </div>

            {/* Model Section */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b-2 border-[#8e78b7]">
                Model
              </h4>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 mb-1">Name</p>
                    <p className="text-sm font-medium text-gray-900 break-words">{currentModelName || 'N/A'}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 mb-1">ID</p>
                    <p className="text-sm font-medium text-gray-900 break-all">{currentReportData.models[currentModelName]?.run_id || 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Last modified</p>
                    <p className="text-sm font-medium text-gray-900">{currentReportData.models[currentModelName]?.created_at || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Created</p>
                    <p className="text-sm font-medium text-gray-900">{currentReportData.models[currentModelName]?.created_at || 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Created by</p>
                    <p className="text-sm font-medium text-gray-900">{currentReportData.models[currentModelName]?.created_by || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Label/prediction column</p>
                    <p className="text-sm font-medium text-gray-900">{currentReportData.models[currentModelName]?.target_column || 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Model type</p>
                    <p className="text-sm font-medium text-gray-900">{currentReportData.models[currentModelName]?.model_type || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Algorithm</p>
                    <p className="text-sm font-medium text-gray-900">{currentReportData.models[currentModelName]?.algorithm || 'N/A'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Prediction Type</p>
                  <p className="text-sm font-medium text-gray-900">{currentReportData.models[currentModelName]?.prediction_type || 'N/A'}</p>
                </div>
              </div>

              {/* General Training Information */}
              <div className="mt-6 pt-4 border-t border-gray-300">
                <h5 className="text-sm font-semibold text-gray-900 mb-3 bg-gray-100 px-3 py-2 rounded">General Training Information</h5>
                <div className="space-y-3 px-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Features</p>
                    <p className="text-sm font-medium text-gray-900">{currentReportData.models[currentModelName]?.data_summary?.num_features || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Input Schema */}
              {currentReportData.dataset?.source_schema && (
                <div className="mt-6 pt-4 border-t border-gray-300">
                  <h5 className="text-sm font-semibold text-gray-900 mb-3 bg-gray-100 px-3 py-2 rounded">Input Schema</h5>
                  <div className="overflow-x-auto px-3">
                    <table className="min-w-full border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 border-b">Name</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 border-b">Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentReportData.dataset.source_schema.map((field, index) => (
                          <tr key={index} className="border-b">
                            <td className="px-4 py-2 text-sm text-gray-900">{field.column_name}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{field.data_type}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Evaluation Section */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b-2 border-[#8e78b7]">
                Evaluation
              </h4>

              {/* Development - Project Info */}
              <div className="mb-4 pt-4 border-t border-gray-300">
                <h5 className="text-sm font-semibold text-gray-900 mb-3 bg-gray-100 px-3 py-2 rounded">Development</h5>
                <div className="bg-gray-50 border border-gray-200 rounded p-4 space-y-3 mx-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-1">Project name: <span className="font-normal">{currentReportData.project?.project_name || 'N/A'}</span></p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Project ID</p>
                      <p className="text-sm text-gray-900">{currentReportData.project?.project_id || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Created by</p>
                      <p className="text-sm text-gray-900">{currentReportData.project?.owner_name || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 mb-1">Date</p>
                      <p className="text-sm text-gray-900">{currentReportData.project?.created_at || 'N/A'}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 mb-1">Asset name</p>
                      <p className="text-sm text-gray-900 break-words">{currentModelName || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Training Metrics */}
              {currentReportData.models[currentModelName]?.training_metrics && (
                <div className="mt-6 pt-4 border-t border-gray-300">
                  <h5 className="text-sm font-semibold text-gray-900 mb-3 bg-gray-100 px-3 py-2 rounded">Training Metrics</h5>
                  <div className="overflow-x-auto px-3">
                    <table className="min-w-full border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 border-b">Name</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 border-b">Training</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 border-b">Testing</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.keys(currentReportData.models[currentModelName].training_metrics.train || {}).map((metric, index) => (
                          <tr key={index} className="border-b">
                            <td className="px-4 py-2 text-sm text-gray-900 capitalize">{metric}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {typeof currentReportData.models[currentModelName].training_metrics.train[metric] === 'number'
                                ? currentReportData.models[currentModelName].training_metrics.train[metric].toFixed(6)
                                : currentReportData.models[currentModelName].training_metrics.train[metric]}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {typeof currentReportData.models[currentModelName].training_metrics.test?.[metric] === 'number'
                                ? currentReportData.models[currentModelName].training_metrics.test[metric].toFixed(6)
                                : currentReportData.models[currentModelName].training_metrics.test?.[metric] || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <AlertTriangle size={24} className="text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Confirm Save</h3>
              </div>

              <p className="text-sm text-gray-700 mb-2">
                {discardedCount > 0 ? (
                  <>
                    <strong>{discardedCount}</strong> model{discardedCount > 1 ? 's' : ''} that {discardedCount > 1 ? 'are' : 'is'} not selected will be discarded.
                  </>
                ) : (
                  'All models are selected.'
                )}
              </p>
              <p className="text-sm text-gray-700">Are you sure you want to continue?</p>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={handleCancel}
                className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSave}
                className="px-6 py-2 bg-[#8e78b7] text-white rounded-lg text-sm font-medium hover:bg-[#7d67a6] transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}