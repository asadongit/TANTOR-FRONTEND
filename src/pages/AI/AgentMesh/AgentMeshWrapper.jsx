import React from 'react';
import MainComponent from '../../../agentmesh/components/Apps/AgentMeshModules/MainComponent';
import '../../../agentmesh/agentmesh.css';

// ─── P0: Error Boundary ───────────────────────────────────────────────────────
// Catches ANY runtime error inside AgentMesh and shows a graceful fallback.
// Tantor's shell (header, sidebar, other routes) keeps working even if AgentMesh crashes.
class AgentMeshErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[AgentMesh] Runtime error:', error.message, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100%', gap: 20, padding: 48,
        background: '#FAFAFA',
      }}>
        <div style={{
          width: 60, height: 60, borderRadius: 18, background: '#FEF2F2',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30,
        }}>
          ⚠️
        </div>
        <div style={{ textAlign: 'center', maxWidth: 500 }}>
          <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: '#111827' }}>
            AgentMesh encountered an error
          </h2>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6B7280', lineHeight: 1.7 }}>
            The rest of Tantor is unaffected. Click Retry to reload AgentMesh,
            or refresh the page if the problem persists.
          </p>
          <code style={{
            display: 'block', padding: '10px 16px', background: '#FFF1F2',
            border: '1px solid #FFE4E6', borderRadius: 8, fontSize: 11,
            color: '#BE123C', textAlign: 'left', whiteSpace: 'pre-wrap',
            wordBreak: 'break-word', marginBottom: 20,
          }}>
            {this.state.error?.message || 'Unknown error'}
          </code>
          <button
            onClick={() => {
              MainComponent._initialized = false;
              this.setState({ hasError: false, error: null });
            }}
            style={{
              padding: '10px 28px', background: '#7C3AED', color: 'white',
              border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600,
              cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#6D28D9'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#7C3AED'; }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
}

/**
 * AgentMeshWrapper
 *
 * Entry point that mounts AgentMesh inside Tantor's content region.
 *
 * Design decisions:
 * - ErrorBoundary: isolates all AgentMesh crashes from Tantor (P0)
 * - .agentmesh-root: scopes all AgentMesh CSS vars, prevents bleed into Tantor's Tailwind
 * - AgentMesh's own <Sidebar> is NOT rendered — Tantor's sidebar accordion handles navigation
 * - Keycloak ProtectedRoute already gates this page — no extra auth needed inside
 */
export default function AgentMeshWrapper() {
  return (
    <AgentMeshErrorBoundary>
      <div
        className="agentmesh-root"
        style={{
          // Viewport-based height using the shared CSS token from index.css
          // Avoids height:100% which doesn't resolve reliably in overflow:auto contexts
          height: 'calc(100vh - var(--tantor-header-height))',
          width: '100%',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <MainComponent />
      </div>
    </AgentMeshErrorBoundary>
  );
}
