import React, { useEffect } from 'react';
import { useUIStore, useWorkflowStore } from '../../../store';
import { healthCheck, listWorkflows, listNotifications } from '../../../api/agentmesh';
import Sidebar from '../../Editor/Sidebar';
import Navbar from '../../Editor/Navbar';
import WorkflowCanvas from '../../Editor/WorkflowCanvas';
import WorkflowsPage from './WorkflowsPage';
import LogsPage from './LogsPage';
import LibraryPage from './LibraryPage';
import RAGPage from './RAGPage';
import Observability from './observability';
import MarketplacePage from './MarketplacePage';
import DashboardPage from './DashboardPage';
import ConnectionsPage from './ConnectionsPage';
import SettingsPage from './SettingsPage';
import WorkflowNotesModal from '../../Editor/WorkflowNotesModal';
import NotificationsModal from '../../Editor/NotificationsModal';
import RunPanel from '../../Editor/RunPanel';
import { FiAlertCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

import { useNotificationsWS } from '../../../utils/useNotificationsWS';

export default function MainComponent() {
  const activePage = useUIStore((s) => s.activePage);
  const runOpen = useUIStore((s) => s.runOpen);
  const setRunOpen = useUIStore((s) => s.setRunOpen);
  const { newWorkflow } = useWorkflowStore();
  const [healthStatus, setHealthStatus] = React.useState(null);

  // ✅ NEW (Industry Standard): Real-time notifications via WebSocket
  useNotificationsWS();

  useEffect(() => {
    // Initialize the canvas with a fresh workflow on first load
    newWorkflow();

    // Check backend health and prefetch ALL workflows for dropdown catalogs
    healthCheck()
      .then((r) => setHealthStatus(r.status))
      .catch(() => setHealthStatus('offline'));

    // Fetch a large-ish global catalog for dropdowns
    listWorkflows({ limit: 500 })
      .then((r) => useWorkflowStore.setState({ allWorkflows: r.workflows || [] }))
      .catch((err) => console.error('Failed to pre-fetch all workflows:', err));

    // Initial fetch of unread count (bootstrap)
    listNotifications({ unreadOnly: true, limit: 1 })
      .then(r => useUIStore.getState().setUnreadCount(r.total || 0))
      .catch(() => {});

  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-primary)', overflow: 'hidden' }}>
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Status banner */}
        {healthStatus === 'offline' && (
          <div style={{ background: '#f59e0b10', borderBottom: '1px solid #f59e0b20', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#d97706', fontWeight: 500, zIndex: 100 }}>
            <FiAlertCircle size={14} /> Backend offline — ensure FastAPI is running at <code style={{ fontFamily: 'JetBrains Mono, monospace', background: '#fff', padding: '2px 4px', borderRadius: 4 }}>localhost:8000</code>
          </div>
        )}

        <Navbar />

        <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {activePage === 'dashboard' && <DashboardPage />}
          {activePage === 'canvas' && <WorkflowCanvas />}
          {activePage === 'workflows' && <WorkflowsPage />}
          {activePage === 'marketplace' && <MarketplacePage />}
          {activePage === 'library' && <LibraryPage />}
          {activePage === 'logs' && <LogsPage />}
          {activePage === 'rag' && <RAGPage />}
          {activePage === 'observability' && <Observability />}
          {activePage === 'connections' && <ConnectionsPage />}
          {activePage === 'settings' && <SettingsPage />}
        </main>
        {activePage === 'canvas' && <WorkflowNotesModal />}
        <NotificationsModal />
        
        {/* Global Run Overlay */}
        <AnimatePresence>
          {runOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <div style={{ width: '100%', height: '100%', background: 'white', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
                <RunPanel onClose={() => setRunOpen(false)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
