// AgentMesh role names can be overridden at deployment time without changing UI code.
export const AGENTMESH_ROLES = Object.freeze({
  ADMIN: (window._env_?.VITE_AGENTMESH_ADMIN_ROLE || 'admin').trim().toLowerCase(),
  USER: (window._env_?.VITE_AGENTMESH_USER_ROLE || 'user').trim().toLowerCase(),
});

const normalizeRole = (role) => String(role || '').trim().toLowerCase();

/** Read both Keycloak client roles and realm roles for future flexibility. */
export const getAgentMeshRoles = (decodedToken) => {
  if (!decodedToken) return [];

  const clientId = window._env_?.VITE_KEYCLOAK_CLIENT_ID;
  const clientRoles = clientId
    ? decodedToken?.resource_access?.[clientId]?.roles || []
    : [];
  const realmRoles = decodedToken?.realm_access?.roles || [];

  return [...new Set([...clientRoles, ...realmRoles].map(normalizeRole).filter(Boolean))];
};

export const hasAgentMeshRole = (decodedToken, role) =>
  getAgentMeshRoles(decodedToken).includes(normalizeRole(role));

export const hasAnyAgentMeshRole = (decodedToken, allowedRoles = []) => {
  const userRoles = new Set(getAgentMeshRoles(decodedToken));
  return allowedRoles.some((role) => userRoles.has(normalizeRole(role)));
};
