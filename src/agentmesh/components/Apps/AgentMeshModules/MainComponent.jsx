import React, { useEffect, Suspense } from 'react';
import { useUIStore, useWorkflowStore } from '../../../store';
import { healthCheck, listWorkflows, listNotifications } from '../../../api/agentmesh';
import { FiAlertCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationsWS } from '../../../utils/useNotificationsWS';
import { lazyWithRetry } from '../../../utils/lazyWithRetry';

// ─── Lazy-loaded pages (P2 optimisation: retry wrapper) ──────────────────────
// Each page chunk only downloads when first visited.
// WorkflowCanvas alone is ~400KB — lazy loading cuts cold-start by ~60%.
// lazyWithRetry adds 3 automatic retry attempts with exponential backoff,
// recovering silently from CDN blips or chunk-hash mismatches after a deploy.
const Navbar             = lazyWithRetry(() => import('../../Editor/Navbar'));
const WorkflowCanvas     = lazyWithRetry(() => import('../../Editor/WorkflowCanvas'));
const RunPanel           = lazyWithRetry(() => import('../../Editor/RunPanel'));
const WorkflowNotesModal = lazyWithRetry(() => import('../../Editor/WorkflowNotesModal'));
const WorkflowVariablesPanel = lazyWithRetry(() => import('../../Editor/WorkflowVariablesPanel'));
const NotificationsModal = lazyWithRetry(() => import('../../Editor/NotificationsModal'));
const DashboardPage      = lazyWithRetry(() => import('./DashboardPage'));
const WorkflowsPage      = lazyWithRetry(() => import('./WorkflowsPage'));
const LibraryPage        = lazyWithRetry(() => import('./LibraryPage'));
const LogsPage           = lazyWithRetry(() => import('./LogsPage'));
const RAGPage            = lazyWithRetry(() => import('./RAGPage'));
const Observability      = lazyWithRetry(() => import('./observability'));
const MarketplacePage    = lazyWithRetry(() => import('./MarketplacePage'));
const ConnectionsPage    = lazyWithRetry(() => import('./Admin_Sub_Pages/ConnectionsPage'));
const SettingsPage       = lazyWithRetry(() => import('./SettingsPage'));
const WorkflowPublishController  = lazyWithRetry(() => import('./Admin_Sub_Pages/WorkflowPublishController'));
const WorkflowTemplateController = lazyWithRetry(() => import('./Admin_Sub_Pages/WorkflowTemplateController'));

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
  const activePage        = useUIStore((s) => s.activePage);
  const runOpen           = useUIStore((s) => s.runOpen);
  const setRunOpen        = useUIStore((s) => s.setRunOpen);
  const showTemplates     = useUIStore((s) => s.showTemplates);
  const meshInitialized   = useUIStore((s) => s.meshInitialized);
  const setMeshInitialized = useUIStore((s) => s.setMeshInitialized);
  const [healthStatus, setHealthStatus] = React.useState(null);

  // Real-time notification badge via WebSocket
  useNotificationsWS();

  // ─── Init guard (P2: Strict Mode safe via Zustand) ───────────────────────────
  // useUIStore.meshInitialized persists in Zustand across route changes.
  // Unlike a static class property, Zustand state is NOT reset by React
  // Strict Mode's double-invoke of effects — the second run reads `true`
  // and exits cleanly, so initialization only ever runs once per session.
  useEffect(() => {
    if (meshInitialized) return;
    setMeshInitialized(true);

    // Use getState() for stable references — correct empty dep array.
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

  }, [meshInitialized, setMeshInitialized]);

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
          {activePage === 'templates'     && <TemplatesPage />}
          {activePage === 'publish-approval'  && <WorkflowPublishController />}
          {activePage === 'template-approval' && <WorkflowTemplateController />}
        </Suspense>
      </main>

      {/* Modals */}
      <Suspense fallback={null}>
        {activePage === 'canvas' && (
          <>
            <WorkflowNotesModal />
            <WorkflowVariablesPanel />
          </>
        )}
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
