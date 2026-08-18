/**
 * Shared Architect LLM config.
 * All "Architect" AI buttons read the same architect_* localStorage keys so the
 * whole AgentMesh surface uses one consistent model/provider/temperature/key.
 */
export const getArchitectConfig = () => ({
  provider: localStorage.getItem('architect_provider') || 'groq',
  model: localStorage.getItem('architect_model') || 'llama-3.3-70b-versatile',
  temperature: parseFloat(localStorage.getItem('architect_temperature')) || 0.2,
  api_key_override: localStorage.getItem('architect_api_key') || '',
});
