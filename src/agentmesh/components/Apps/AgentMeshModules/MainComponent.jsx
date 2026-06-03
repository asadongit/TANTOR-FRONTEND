import React, { useEffect, Suspense } from 'react';
import { useUIStore, useWorkflowStore } from '../../../store';
import { healthCheck, listWorkflows, listNotifications } from '../../../api/agentmesh';
import { FiAlertCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationsWS } from '../../../utils/useNotificationsWS';

// ─── Lazy-loaded pages (P1 optimisation) ─────────────────────────────────────
// Each page chunk only downloads when first visited.
// WorkflowCanvas alone is ~400KB — lazy loading cuts cold-start by ~60%.
const Navbar             = React.lazy(() => import('../../Editor/Navbar'));
const WorkflowCanvas     = React.lazy(() => import('../../Editor/WorkflowCanvas'));
const RunPanel           = React.lazy(() => import('../../Editor/RunPanel'));
const WorkflowNotesModal = React.lazy(() => import('../../Editor/WorkflowNotesModal'));
const NotificationsModal = React.lazy(() => import('../../Editor/NotificationsModal'));
const DashboardPage      = React.lazy(() => import('./DashboardPage'));
const WorkflowsPage      = React.lazy(() => import('./WorkflowsPage'));
const LibraryPage        = React.lazy(() => import('./LibraryPage'));
const LogsPage           = React.lazy(() => import('./LogsPage'));
const RAGPage            = React.lazy(() => import('./RAGPage'));
const Observability      = React.lazy(() => import('./observability'));
const MarketplacePage    = React.lazy(() => import('./MarketplacePage'));
const ConnectionsPage    = React.lazy(() => import('./ConnectionsPage'));
const SettingsPage       = React.lazy(() => import('./SettingsPage'));

// Minimal spinner shown while a lazy chunk is downloading
function PageLoader() {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        border: '3px solid #EDE9FE', borderTopColor: '#7C3AED',
        animation: 'am-spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes am-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/**
 * AgentMesh MainComponent — integrated inside Tantor 2.0
 *
 * ⚠️  AgentMesh's own <Sidebar /> is intentionally NOT rendered here.
 *     Navigation is driven by Tantor's Sidebar accordion (see Sidebar.jsx).
 *     The accordion calls useUIStore.setActivePage() to switch content here.
 */
export default function MainComponent() {
  const activePage    = useUIStore((s) => s.activePage);
  const runOpen       = useUIStore((s) => s.runOpen);
  const setRunOpen    = useUIStore((s) => s.setRunOpen);
  const showTemplates = useUIStore((s) => s.showTemplates);
  const [healthStatus, setHealthStatus] = React.useState(null);

  // Real-time notification badge via WebSocket
  useNotificationsWS();

  // ─── Init guard (P2 optimisation) ────────────────────────────────────────────
  // Module-level flag persists across route changes so newWorkflow() only runs
  // once per app session — not every time the user navigates to /ai/agent-mesh.
  useEffect(() => {
    if (MainComponent._initialized) return;
    MainComponent._initialized = true;

    // Use getState() to get stable references — avoids stale closures
    // and removes the need for eslint-disable on the dependency array.
    const { newWorkflow: initWorkflow } = useWorkflowStore.getState();
    initWorkflow();

    healthCheck()
      .then((r) => setHealthStatus(r.status))
      .catch(() => setHealthStatus('offline'));

    // Pre-populate the global workflow dropdown catalog.
    // Limit 100 covers most real-world deployments; pages lazy-load their own lists.
    listWorkflows({ limit: 100 })
      .then((r) => useWorkflowStore.setState({ allWorkflows: r.workflows || [] }))
      .catch((err) => console.error('[AgentMesh] Failed to pre-fetch workflows:', err));

    listNotifications({ unreadOnly: true, limit: 1 })
      .then((r) => useUIStore.getState().setUnreadCount(r.total || 0))
      .catch(() => {});

  }, []); // empty array is correct — getState() refs are always stable

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', minWidth: 0, background: 'var(--bg-primary)', overflow: 'hidden' }}>

      {/* Backend offline banner */}
      {healthStatus === 'offline' && (
        <div style={{ background: '#fffbeb', borderBottom: '1px solid #fde68a', padding: '7px 16px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#92400e', fontWeight: 500, flexShrink: 0 }}>
          <FiAlertCircle size={14} />
          AgentMesh backend offline — ensure FastAPI is running at{' '}
          <code style={{ fontFamily: 'monospace', background: '#fef3c7', padding: '1px 5px', borderRadius: 4 }}>
            {window._env_?.VITE_AGENT_MESH || 'localhost:8000'}
          </code>
        </div>
      )}

      {/* Canvas Navbar — only shown when on canvas page */}
      <Suspense fallback={null}>
        {activePage === 'canvas' && !showTemplates && (
          <div style={{ flexShrink: 0 }}>
            <Navbar />
          </div>
        )}
      </Suspense>

      {/* Main page content area */}
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Suspense fallback={<PageLoader />}>
          {activePage === 'dashboard'     && <DashboardPage />}
          {activePage === 'canvas'        && <WorkflowCanvas />}
          {activePage === 'workflows'     && <WorkflowsPage />}
          {activePage === 'library'       && <LibraryPage />}
          {activePage === 'logs'          && <LogsPage />}
          {activePage === 'rag'           && <RAGPage />}
          {activePage === 'marketplace'   && <MarketplacePage />}
          {activePage === 'observability' && <Observability />}
          {activePage === 'connections'   && <ConnectionsPage />}
          {activePage === 'settings'      && <SettingsPage />}
        </Suspense>
      </main>

      {/* Modals */}
      <Suspense fallback={null}>
        {activePage === 'canvas' && <WorkflowNotesModal />}
        <NotificationsModal />
      </Suspense>

      {/* Global Run overlay */}
      <AnimatePresence>
        {runOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <div style={{ width: '100%', height: '100%', background: 'white', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
              <Suspense fallback={<PageLoader />}>
                <RunPanel onClose={() => setRunOpen(false)} />
              </Suspense>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Module-level init flag — survives route changes, resets on hard refresh only
MainComponent._initialized = false;
