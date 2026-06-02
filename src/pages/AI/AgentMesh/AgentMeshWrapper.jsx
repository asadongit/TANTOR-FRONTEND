import React from 'react';
import MainComponent from '../../../agentmesh/components/Apps/AgentMeshModules/MainComponent';
import '../../../agentmesh/agentmesh.css';

/**
 * AgentMeshWrapper
 *
 * Mounts the entire AgentMesh UI as a self-contained module inside Tantor 2.0.
 *
 * Key design decisions:
 * - The .agentmesh-root class scopes all AgentMesh CSS variables and styles,
 *   preventing any bleed into Tantor's Tailwind design system.
 * - AgentMesh uses Zustand internally — no state crosses into Tantor's context.
 * - AgentMesh has no React Router — navigation is handled via useUIStore internally.
 *   The browser URL stays at /ai/agent-mesh throughout.
 * - Tantor's Keycloak ProtectedRoute already gates this page — no extra auth needed.
 */
export default function AgentMeshWrapper() {
  return (
    <div
      className="agentmesh-root"
      style={{ height: '100%', width: '100%', overflow: 'hidden', position: 'relative' }}
    >
      <MainComponent />
    </div>
  );
}
