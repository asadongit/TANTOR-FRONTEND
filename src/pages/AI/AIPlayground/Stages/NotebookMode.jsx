import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAIPlayground } from '../../../../context/AIPlaygroundContext';
import { toast } from 'react-hot-toast';
import { X, AlertCircle, Loader } from 'lucide-react';
import axios from 'axios';

const NotebookMode = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notebookUrl, setNotebookUrl] = useState(null);
  const hasInitialized = useRef(false);
  const { datasetState, projectState, setProjectState } = useAIPlayground();

  const jupyterLabServer = window._env_?.VITE_JUPYTER_LAB || 'https://darch-dev.tantor.io/jupyter/lab';
  const hostnameAI = window._env_?.VITE_AI_API;
  const notebookApiUrl = `${hostnameAI}/notebook`;
  const ensembleId = datasetState.ensembleId;

  useEffect(() => {
    if (!ensembleId) {
      navigate('/ai/playground');
    }
  }, [ensembleId, navigate]);

  useEffect(() => {
    if (!ensembleId || hasInitialized.current) {
      return;
    }

    hasInitialized.current = true;

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
          const mlflowExperimentId =
            response.data?.mlflow_experiment_id ||
            response.data?.data?.mlflow_experiment_id ||
            '';
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

    initializeNotebook();
  }, [ensembleId, projectState, datasetState, navigate]);

  const handleClose = () => {
    navigate('/ai/playground');
  };

  const handleGoToModelDeployment = () => {
    navigate('/ai/playground/model-deployment');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">
          Notebook Mode
        </h1>
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 flex items-center justify-center"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto relative">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-50">
            <Loader className="w-10 h-10 text-[#8e78b7] animate-spin mb-3" />
            <p className="text-gray-600 font-medium">Initializing notebook environment...</p>
            <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm z-50">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
              <h4 className="text-red-900 font-semibold mb-2">Error</h4>
              <p className="text-red-700 text-sm mb-4">{error}</p>
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {notebookUrl && !loading && !error && (
          <div className="w-250 h-250 p-6">
            <div className="w-full h-full border border-gray-300 rounded-lg overflow-hidden shadow-lg bg-white">
              <iframe
                src={notebookUrl}
                className="w-full h-full"
                title="Jupyter Lab Notebook"
                style={{ minHeight: 'calc(100vh - 150px)' }}
              />
            </div>
          </div>
        )}

        {!error && (
          <button
            onClick={handleGoToModelDeployment}
            className="absolute bottom-3 right-10 z-50 px-4 py-2 rounded-lg bg-[#8e78b7] text-white text-sm font-medium shadow-lg hover:bg-[#7c68a5] transition-colors"
          >
            Go to Model Deployment
          </button>
        )}
      </div>
    </div>
  );
};

export default NotebookMode;
