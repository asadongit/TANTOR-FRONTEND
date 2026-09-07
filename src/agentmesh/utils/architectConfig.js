/**
 * Shared Architect LLM config.
 * Non-sensitive preferences remain in localStorage. The optional API key is
 * kept in memory only and is cleared by a browser reload.
 */
import { getArchitectSecret } from './architectSecretStore';

export const getArchitectConfig = () => ({
  provider: localStorage.getItem('architect_provider') || 'groq',
  model: localStorage.getItem('architect_model') || 'llama-3.3-70b-versatile',
  temperature: parseFloat(localStorage.getItem('architect_temperature')) || 0.2,
  api_key_override: getArchitectSecret(),
});
