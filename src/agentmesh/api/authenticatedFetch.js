import { getKeycloak } from '../../services/KeycloakService';

/** Return a fresh Keycloak access token when the user is authenticated. */
export async function getAgentMeshAccessToken() {
  const keycloak = getKeycloak();
  if (!keycloak?.authenticated) return null;

  await keycloak.updateToken(30);
  return keycloak.token || null;
}

/** Fetch wrapper that adds the current Keycloak token to AgentMesh requests. */
export async function agentMeshFetch(input, init = {}) {
  const token = await getAgentMeshAccessToken();
  const headers = new Headers(init.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(input, { ...init, headers });
}
