/**
 * In-memory storage for the optional Architect API key.
 *
 * Secrets deliberately do not use localStorage/sessionStorage, so they are
 * cleared when the page is closed or reloaded and cannot be recovered by a
 * later browser session. The one-time read removes legacy plaintext storage.
 */
let architectApiKey = '';

if (typeof window !== 'undefined') {
  try {
    architectApiKey = window.localStorage.getItem('architect_api_key') || '';
    window.localStorage.removeItem('architect_api_key');
  } catch {
    architectApiKey = '';
  }
}

export const getArchitectSecret = () => architectApiKey;

export const setArchitectSecret = (value) => {
  architectApiKey = typeof value === 'string' ? value : '';
};
