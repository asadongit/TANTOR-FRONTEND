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

export const logout = () => {
  return new Promise((resolve) => {
    try {
      const logoutUrl = keycloak.createLogoutUrl({
        redirectUri: `${window.location.origin}`,
      });
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = logoutUrl;

      const timeoutId = setTimeout(() => {
        console.log('Logout iframe timeout, forcing direct navigation');
        document.body.removeChild(iframe);
        window.location.href = logoutUrl;
        resolve(false);
      }, 3000);

      iframe.onload = () => {
        clearTimeout(timeoutId);
        document.body.removeChild(iframe);

        keycloak.clearToken();
        initialized = false;

        resolve(true);

        window.location.href = `${window.location.origin}`;
      };

      document.body.appendChild(iframe);
    } catch (error) {
      console.error('Logout error:', error);

      const fallbackLogoutUrl = keycloak.createLogoutUrl({
        redirectUri: `${window.location.origin}`,
      });
      window.location.href = fallbackLogoutUrl;
      resolve(false);
    }
  });
};

export const getToken = () => keycloak.token;
export const getKeycloak = () => keycloak;
