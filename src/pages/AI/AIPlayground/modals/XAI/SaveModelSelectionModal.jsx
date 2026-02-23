import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useAIPlayground } from '../../../../../context/AIPlaygroundContext';

export function SaveModelSelectionModal({ isOpen, onClose, onSave, readonly, modelsList = [], sessionId }) {
  const hostnameAI = window._env_?.VITE_AI_API;
  const [selectedModels, setSelectedModels] = useState({});
  const [descriptions, setDescriptions] = useState({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [downloadingReports, setDownloadingReports] = useState(false);
  const [currentReportData, setCurrentReportData] = useState(null);
  const [currentModelName, setCurrentModelName] = useState('');
  const [alreadyStartedCount, setAlreadyStartedCount] = useState(null);
  const reportRef = useRef(null);
  const { workflowState } = useAIPlayground();

  useEffect(() => {
    if (!isOpen) {
      setSelectedModels({});
      setDescriptions({});
      setShowConfirmation(false);
      setCurrentReportData(null);
      setCurrentModelName('');
      setAlreadyStartedCount(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      cancelJob();
    }
  }, [isOpen]);

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
    if (readonly) return;
    setSelectedModels(prev => ({
      ...prev,
      [modelRunName]: !prev[modelRunName]
    }));
  };

  const handleDescriptionChange = (modelRunName, value) => {
    if (readonly) return;
    setDescriptions(prev => ({
      ...prev,
      [modelRunName]: value
    }));
  };

  const handleSaveClick = () => {
    const selectedCount = Object.values(selectedModels).filter(Boolean).length;
    if (selectedCount === 0) return;
    setShowConfirmation(true);
  };

  const handleConfirmSave = () => {
    const modelsToSave = modelsList
      .filter(model => selectedModels[model.run_name])
      .map(model => ({
        run_name: model.run_name,
        run_id: model.run_id,
        description: descriptions[model.run_name] || ''
      }));
    
    onSave(modelsToSave);
    setShowConfirmation(false);
  };

  const handleCancel = () => {
    setShowConfirmation(false);
  };

  const handleClose = () => {
    setSelectedModels({});
    setDescriptions({});
    setShowConfirmation(false);
    setCurrentReportData(null);
    setCurrentModelName('');
    onClose();
  };

  const handleDownloadGovernanceReports = async () => {
    const selectedModelNames = Object.keys(selectedModels).filter(name => selectedModels[name]);
    
    if (selectedModelNames.length === 0) {
      toast.error('Please select at least one model to download reports', {
        duration: 3000,
        position: 'top-right',
      });
      return;
    }

    if (!sessionId) {
      toast.error('Session ID not found. Please try again.', {
        duration: 4000,
        position: 'top-right',
      });
      return;
    }

    setDownloadingReports(true);

    try {
      const response = await fetch(
        `${hostnameAI}/model/download-governance-report`,
        {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            session_id: sessionId,
            model_names: selectedModelNames
          })
        }
      );

      if (!response.ok) {
        toast.error('Failed to fetch governance reports');
        setDownloadingReports(false);
        return;
      }

      const reportData = await response.json();

      for (const modelName of selectedModelNames) {
        await generatePDFForModel(modelName, reportData);
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      toast.success(`${selectedModelNames.length} report${selectedModelNames.length > 1 ? 's' : ''} downloaded successfully`, {
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

  const generatePDFForModel = async (modelName, reportData) => {
    const modelData = reportData?.models?.[modelName];
    const projectData = reportData?.project;
    const datasetData = reportData?.dataset;

    if (!modelData) {
      console.error(`No data found for model: ${modelName}`);
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

      pdf.save(`governance-report-${modelName}.pdf`);
    } catch (error) {
      console.error(`PDF Generation Error for ${modelName}:`, error);
      throw error;
    }
  };

  const selectedCount = Object.values(selectedModels).filter(Boolean).length;
  const discardedCount = modelsList.length - selectedCount;

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
                disabled={readonly || selectedCount === 0 || downloadingReports}
                className="flex items-center gap-2 px-4 py-1.5 border border-gray-400 text-gray-400 hover:text-gray-600 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={15} />
                {downloadingReports ? 'Downloading...' : 'Governance Report'}
              </button>

              {/* Close icon as SVG */}
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="#818181" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
          <div className="flex-1 overflow-y-auto p-6">
            <p className="text-sm text-gray-600 mb-4">
              Select the models you want to save and provide descriptions for each selected model.
            </p>

            {modelsList.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-500">No models available to save.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {modelsList.map((model) => (
                  <div
                    key={model.run_id}
                    className={`border rounded-lg p-4 transition-all ${
                      selectedModels[model.run_name]
                        ? 'border-[#8e78b7] bg-purple-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id={`model-${model.run_id}`}
                        checked={selectedModels[model.run_name] || false}
                        onChange={() => handleCheckboxChange(model.run_name)}
                        disabled={readonly}
                        className="mt-1 w-4 h-4 border-gray-300 rounded cursor-pointer"
                        style={{ accentColor: '#8e78b7' }}
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={`model-${model.run_id}`}
                          className="block text-sm font-medium text-gray-900 cursor-pointer"
                        >
                          {model.run_name}
                        </label>

                        {selectedModels[model.run_name] && (
                          <div className="mt-3">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Description
                            </label>
                            <textarea
                              value={descriptions[model.run_name] || ''}
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
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 shadow-[0_-2px_8px_0_rgba(0,0,0,0.06)]">
            <button
              onClick={handleClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveClick}
              disabled={readonly || selectedCount === 0}
              className="px-6 py-2 bg-[#8e78b7] text-white rounded-lg text-sm font-medium hover:bg-[#7d67a6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Model{selectedCount > 1 ? 's' : ''}
            </button>
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