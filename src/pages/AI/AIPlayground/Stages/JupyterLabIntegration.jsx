import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { X, AlertCircle, Loader } from 'lucide-react';
import { useAIPlayground } from '../../../../context/AIPlaygroundContext';

const JupyterLabIntegration = ({ ensembleId, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notebookUrl, setNotebookUrl] = useState(null);
  const { datasetState, projectState, setProjectState } = useAIPlayground();

  const jupyterLabServer = window._env_?.VITE_JUPYTER_LAB || 'https://darch-dev.tantor.io/jupyter/lab';
  const hostnameAI = window._env_?.VITE_AI_API;
  const notebookApiUrl = `${hostnameAI}/notebook`;

  useEffect(() => {
    const initializeNotebook = async () => {
      try {
        setLoading(true);
        setError(null);

        // Step 1: Call the notebook initialization API
        const response = await axios.post(notebookApiUrl, {
          ensemble_id: ensembleId
        }, {
          headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (response.status === 200 && response.data) {
          // Step 2: Construct JupyterLab URL using selectedProject and tableName
          const { selectedProject } = projectState;
          const { tableName } = datasetState;
          const mlflowExperimentId = response.data.mlflow_experiment_id || '';
          const constructedUrl = `${jupyterLabServer}/tree/${selectedProject}/${ensembleId}/${tableName}_${ensembleId}.ipynb`;

          setProjectState(prev => ({
            ...prev,
            mlflowExperimentId
          }));

          setNotebookUrl(constructedUrl);
          toast.success('Notebook environment initialized successfully!', {
            duration: 3000,
            position: 'top-right'
          });

          if (onSuccess) {
            onSuccess({
              url: constructedUrl,
              selectedProject,
              tableName,
              ensemble_id: ensembleId,
              mlflow_experiment_id: mlflowExperimentId
            });
          }
        }
      } catch (err) {
        console.error('Notebook initialization error:', err);
        const errorMessage = err.response?.data?.message ||
          err.message ||
          'Failed to initialize notebook environment. Please try again.';
        setError(errorMessage);
        toast.error(errorMessage, {
          duration: 4000,
          position: 'top-right'
        });
      } finally {
        setLoading(false);
      }
    };

    if (ensembleId) {
      initializeNotebook();
    }
  }, [ensembleId]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative z-10 bg-white rounded-lg shadow-xl w-[90vw] h-[90vh] mx-4 overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
          <h3 className="text-lg font-semibold text-gray-900">
            Jupyter Lab Notebook
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-gray-50 relative">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
              <Loader className="w- h-10 text-[#8e78b7] animate-spin mb-3" />
              <p className="text-gray-600 font-medium">Initializing notebook environment...</p>
              <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
                <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
                <h4 className="text-red-900 font-semibold mb-2">Error</h4>
                <p className="text-red-700 text-sm mb-4">{error}</p>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {notebookUrl && !loading && !error && (
            <div className="flex-1 border border-gray-300 rounded-lg overflow-hidden">
              <iframe
                src={notebookUrl}
                className="w-full h-full"
                title="Jupyter Lab Notebook"
                style={{ minHeight: '500px' }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JupyterLabIntegration;
