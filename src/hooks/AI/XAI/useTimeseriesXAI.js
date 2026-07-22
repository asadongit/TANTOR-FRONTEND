import axios from 'axios';

const hostnameAI = window._env_?.VITE_AI_API;

export const fetchTsXAIConfig = async ({ ensembleId, workflowId, modelName }) => {
  try {
    const response = await axios.post(
      `${hostnameAI}/model/ts_XAI_config`,
      { ensemble_id: ensembleId, workflow_id: workflowId, model_name: modelName },
      { headers: { accept: 'application/json', 'Content-Type': 'application/json' } }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching timeseries XAI config:', error);
    throw error;
  }
};

export const runTsExplain = async (payload) => {
  try {
    const response = await axios.post(
      `${hostnameAI}/model/ts_explain`,
      payload,
      { headers: { accept: 'application/json', 'Content-Type': 'application/json' } }
    );
    return response.data;
  } catch (error) {
    console.error('Error running timeseries XAI explain:', error);
    throw error;
  }
};
