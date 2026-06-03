import React, { useState, useEffect } from 'react';
import { useUIStore, useWorkflowStore, useRunStore } from '../../store';
import {
  FiX, FiTrash2, FiBell, FiCheckCircle, FiInfo, FiAlertTriangle, FiAlertCircle,
  FiArchive, FiRefreshCw, FiMessageSquare,
  FiStar, FiAlertOctagon, FiSliders, FiShield,
  FiChevronDown, FiChevronUp
} from 'react-icons/fi';
import { listNotifications, processNotifications, getWorkflow } from '../../api/agentmesh';

const STYLES = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 10000,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(28, 28, 30, 0.4)', backdropFilter: 'blur(8px)',
    animation: 'fadeIn 0.2s ease-out'
  },
  modal: {
    width: '90%', maxWidth: 600, height: '80vh',
    background: 'var(--bg-secondary)', borderRadius: 28,
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    boxShadow: 'var(--shadow-lg)',
    border: '1px solid var(--border)',
    fontFamily: "'Google Sans', 'Roboto', sans-serif"
  },
  header: {
    padding: '24px 32px', borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: 'var(--bg-canvas)'
  },
  list: {
    flex: 1, overflowY: 'auto', padding: '20px 32px'
  },
  item: {
    padding: '20px', borderRadius: 16, marginBottom: 12,
    background: 'white', border: '1px solid var(--border)',
    transition: 'all 0.2s', position: 'relative',
    display: 'flex', gap: 16
  },
  itemUnread: {
    background: '#F9FAFB',
    borderColor: 'var(--theme-primary)'
  }
};

const TYPE_ICONS = {
  info: { icon: FiInfo, color: '#3B82F6', bg: '#EFF6FF' },
  success: { icon: FiCheckCircle, color: '#10B981', bg: '#ECFDF5' },
  warning: { icon: FiAlertTriangle, color: '#F59E0B', bg: '#FFFBEB' },
  error: { icon: FiAlertCircle, color: '#EF4444', bg: '#FEF2F2' },
  important: { icon: FiStar, color: '#6366F1', bg: '#EEF2FF' },
  critical: { icon: FiAlertOctagon, color: '#B91C1C', bg: '#FEF2F2' },
  system: { icon: FiSliders, color: '#475569', bg: '#F1F5F9' },
  security: { icon: FiShield, color: '#E11D48', bg: '#FFF1F2' }
};

export default function NotificationsModal() {
  const { showNotifications, setShowNotifications, setUnreadCount } = useUIStore();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all | unread
  const [selectedType, setSelectedType] = useState('all'); // all | info | success | warning | error | important | critical | system | security

  useEffect(() => {
    if (showNotifications) {
      loadNotifications();
    }
  }, [showNotifications, filter, selectedType]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const params = { unreadOnly: filter === 'unread' };
      if (selectedType !== 'all') {
        params.type = selectedType;
      }
      const res = await listNotifications(params);
      const items = res.notifications || [];
      setNotifications(items);

      // Update unread count based on current full pull
      if (filter === 'all' && selectedType === 'all') {
        const unread = items.filter(n => !n.is_read).length;
        setUnreadCount(unread);
      }
    } catch (e) {
      console.error('Failed to load notifications:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await processNotifications({ action: 'mark_read', notification_ids: [id] });
      loadNotifications();
    } catch (e) {
      console.error('Failed to mark read:', e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await processNotifications({ action: 'mark_all_read' });
      loadNotifications();
    } catch (e) {
      console.error('Failed to mark all read:', e);
    }
  };

  const handleDelete = async (id) => {
    try {
      await processNotifications({ action: 'delete', notification_ids: [id] });
      loadNotifications();
    } catch (e) {
      console.error('Failed to delete notification:', e);
    }
  };

  const handleOpenChat = async (wfId, threadId) => {
    try {
      setLoading(true);
      const res = await getWorkflow(wfId);
      if (res && res.id) {
        useWorkflowStore.getState().loadWorkflowIntoEditor(res);
        // Set the threadId and clear previous events to trigger history loading in RunPanel
        useRunStore.setState({ 
          threadId: threadId, 
          streamEvents: [], 
          running: false,
          runOutput: null,
          runError: null
        });
        setUnreadCount(prev => Math.max(0, prev - 1));
        setShowNotifications(false);
        useUIStore.getState().setRunOpen(true);
      }
    } catch (err) {
      console.error("Failed to open chat from notification:", err);
      alert("Could not open chat session.");
    } finally {
      setLoading(false);
    }
  };

  if (!showNotifications) return null;

  return (
    <div style={STYLES.overlay} onClick={() => setShowNotifications(false)}>
      <div style={STYLES.modal} onClick={e => e.stopPropagation()}>
        <div style={STYLES.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--theme-primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiBell size={20} color="var(--theme-primary)" />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Notifications</h2>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Stay updated with your workflows</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleMarkAllRead}
              style={{ padding: '8px 16px', borderRadius: 10, background: 'var(--bg-canvas)', border: '1px solid var(--border)', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              Mark all read
            </button>
            <button
              onClick={() => setShowNotifications(false)}
              style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-canvas)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        <div style={{ 
          padding: '0 32px', 
          borderBottom: '1px solid var(--border)', 
          background: 'var(--bg-canvas)', 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', gap: 24 }}>
            <Tab active={filter === 'all'} onClick={() => setFilter('all')} label="All" />
            <Tab active={filter === 'unread'} onClick={() => setFilter('unread')} label={`Unread (${notifications.filter(n=>!n.is_read).length})`} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Type:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'white',
                color: 'var(--text-primary)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <option value="all">All Types</option>
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
              <option value="important">Important</option>
              <option value="critical">Critical</option>
              <option value="system">System</option>
              <option value="security">Security</option>
            </select>
          </div>
        </div>

        <div style={STYLES.list}>
          {loading && notifications.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
              <FiRefreshCw size={32} className="spin" style={{ marginBottom: 12 }} />
              Loading alerts...
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', opacity: 0.5 }}>
              <FiArchive size={48} style={{ marginBottom: 16 }} />
              <p>No notifications found</p>
            </div>
          ) : (
            notifications.map(n => (
              <NotificationItem
                key={n.id}
                notification={n}
                onMarkRead={() => handleMarkRead(n.id)}
                onDelete={() => handleDelete(n.id)}
                onOpenChat={() => handleOpenChat(n.workflow_id, n.thread_id)}
              />
            ))
          )}
        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}

function Tab({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '12px 4px', background: 'none', border: 'none', borderBottom: '3.5px solid',
        borderColor: active ? 'var(--theme-primary)' : 'transparent',
        color: active ? 'var(--theme-primary)' : 'var(--text-muted)',
        fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
        marginBottom: -1
      }}
    >
      {label}
    </button>
  );
}

function NotificationItem({ notification, onMarkRead, onDelete, onOpenChat }) {
  const cfg = TYPE_ICONS[notification.type] || TYPE_ICONS.info;
  const Icon = cfg.icon;
  const showChatBtn = notification.metadata_json?.show_chat_button;
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ ...STYLES.item, ...(notification.is_read ? {} : STYLES.itemUnread) }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, background: cfg.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>
        <Icon size={20} color={cfg.color} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{notification.title}</h4>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <p style={{ 
          margin: '0 0 12px 0', 
          fontSize: 13, 
          color: 'var(--text-secondary)', 
          lineHeight: 1.5,
          ...(expanded ? {} : {
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          })
        }}>
          {notification.message}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {showChatBtn && notification.thread_id && (
            <button
              onClick={onOpenChat}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 8, 
                background: '#F3E8FF', // Light purple
                color: '#7C3AED', 
                border: '1px solid #DDD6FE', 
                fontSize: 11, fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <FiMessageSquare size={12} /> Launch
            </button>
          )}

          {!notification.is_read && (
            <button
              onClick={onMarkRead}
              style={{ background: 'none', border: 'none', color: 'var(--theme-primary)', fontSize: 11, fontWeight: 700, cursor: 'pointer', padding: 0 }}
            >
              Mark as read
            </button>
          )}
          
          {notification.workflow_id && !showChatBtn && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Session: {notification.thread_id?.slice(0, 8)}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
        <button
          onClick={onDelete}
          style={{ width: 32, height: 32, borderRadius: 8, background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#CBD5E1' }}
          title="Delete notification"
        >
          <FiTrash2 size={14} />
        </button>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{ width: 32, height: 32, borderRadius: 8, background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}
          title={expanded ? "Show less" : "Show more"}
        >
          {expanded ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
        </button>
      </div>
    </div>
  );
}
