import React, { useEffect, useState } from 'react';
import { AIPlaygroundLayout } from '../AIPlaygroundLayout';
import { useAIPlayground } from '../../../../context/AIPlaygroundContext';
import { useLocation, useNavigate } from 'react-router-dom';

function ModelDeployment() {
  const { projectState, datasetState } = useAIPlayground();
  const [mlflowUrl, setMlflowUrl] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (datasetState.sessionId == '') {
      navigate('/ai/playground')
    }
  }, []);

  useEffect(() => {
    if (projectState?.mlflowExperimentId) {
      const url = `${window._env_?.VITE_ML_FLOW}/mlflow/#/experiments/${projectState.mlflowExperimentId}/`;
      setMlflowUrl(url);
    }
  }, [projectState?.mlflowExperimentId]);

  return (
    <AIPlaygroundLayout>
      <div className="flex flex-col h-full">
        {mlflowUrl ? (
          <div className="flex-1 border border-gray-300 rounded-lg overflow-hidden">
            <iframe
              src={mlflowUrl}
              className="w-full h-full"
              title="MLflow Experiment"
              style={{ minHeight: '6000px' }}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            {projectState?.selectedProject
              ? 'Loading MLflow experiment...'
              : 'Please select a project to view MLflow experiments'}
          </div>
        )}
      </div>
    </AIPlaygroundLayout>
  );
}

export default ModelDeployment;