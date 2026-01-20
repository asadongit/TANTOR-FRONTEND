import React, { useEffect, useState } from 'react';
import { AIPlaygroundLayout } from '../AIPlaygroundLayout';
import { useAIPlayground } from '../../../../context/AIPlaygroundContext';

function ModelDeployment() {
  const { projectState } = useAIPlayground();
  const [mlflowUrl, setMlflowUrl] = useState('');

  useEffect(() => {
    if (projectState?.mlflowExperimentId) {
      const url = `${window._env_?.VITE_ML_FLOW}/mlflow/#/experiments/${projectState.mlflowExperimentId}/`;
      setMlflowUrl(url);
    }
  }, [projectState?.mlflowExperimentId]);

  return (
    <AIPlaygroundLayout>
      <div className="flex flex-col h-full">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Model Deployment</h2>
        
        {mlflowUrl ? (
          <div className="flex-1 border border-gray-300 rounded-lg overflow-hidden">
            <iframe
              src={mlflowUrl}
              className="w-full h-full"
              title="MLflow Experiment"
              style={{ minHeight: '600px' }}
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