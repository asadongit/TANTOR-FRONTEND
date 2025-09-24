import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: window._env_?.VITE_KEYCLOAK_URL,
  realm: window._env_?.VITE_KEYCLOAK_REALM,
  clientId: window._env_?.VITE_KEYCLOAK_CLIENT_ID,
});

let initialized = false;
let initPromise = null;

export const initKeycloak = async () => {
  if (initialized) return keycloak.authenticated;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const authenticated = await keycloak.init({
        onLoad: 'check-sso',
      });

      keycloak.onTokenExpired = async () => {
        try {
          await keycloak.updateToken(30);
        } catch (e) {
          keycloak.login({ redirectUri: `${window.location.origin}/dashboard` });
        }
      };

      initialized = true;
      return authenticated;
    } catch (error) {
      console.error('Keycloak init error:', error);
      return false;
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
};

export const login = (redirectToDashboard = true) =>
  keycloak.login({ redirectUri: redirectToDashboard ? `${window.location.origin}/dashboard` : window.location.href });

export const logout = () =>
  keycloak.logout({ redirectUri: `${window.location.origin}` });

export const getToken = () => keycloak.token;
export const getKeycloak = () => keycloak;
