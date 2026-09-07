import React, { useState, useEffect, useRef } from 'react';
import { useUIStore, useWorkflowStore, useRunStore } from '../../store';
import {
  FiX, FiTrash2, FiBell, FiCheckCircle, FiInfo, FiAlertTriangle, FiAlertCircle,
  FiArchive, FiRefreshCw, FiMessageSquare,
  FiStar, FiAlertOctagon, FiSliders, FiShield,
  FiChevronDown, FiChevronUp
} from 'react-icons/fi';
import { HugeiconsIcon } from '@hugeicons/react';
import { AiMagicIcon } from '@hugeicons/core-free-icons';
import { listNotifications, processNotifications, getWorkflow, chatArchitect } from '../../api/agentmesh';
import { formatMessage } from '../Common/messageFormatting';
import { getArchitectSecret } from '../../utils/architectSecretStore';

const STYLES = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 10000,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(28, 28, 30, 0.4)', backdropFilter: 'blur(8px)',
    animation: 'fadeIn 0.2s ease-out'
  },
  modal: {
    width: '90%', maxWidth: 1000, height: '80vh',
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

  // Infinite Scroll Pagination State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef(null);
  const limit = 15;

  // AI Architect Summary State
  const [aiSummary, setAiSummary] = useState('');
  const [summarizing, setSummarizing] = useState(false);

  // Initial load or filter change: reset pagination & summary
  useEffect(() => {
    if (showNotifications) {
      setPage(1);
      setHasMore(true);
      setAiSummary('');
      loadNotifications(1, true);
    }
  }, [showNotifications, filter, selectedType]);

  // Load next pages when page changes
  useEffect(() => {
    if (showNotifications && page > 1) {
      loadNotifications(page, false);
    }
  }, [page]);

  // Intersection Observer for sentinel element
  useEffect(() => {
    if (!showNotifications || loading || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((prev) => prev + 1);
        }
      },
      { root: null, rootMargin: '100px', threshold: 0 }
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [showNotifications, loading, hasMore]);

  const loadNotifications = async (pageNum, isInitial = false) => {
    try {
      setLoading(true);
      const params = { 
        page: pageNum, 
        limit, 
        unreadOnly: filter === 'unread' 
      };
      if (selectedType !== 'all') {
        params.type = selectedType;
      }
      const res = await listNotifications(params);
      const items = res.notifications || [];
      
      if (isInitial) {
        setNotifications(items);
      } else {
        setNotifications((prev) => [...prev, ...items]);
      }

      setHasMore(items.length === limit);

      // Update unread count based on current full pull if initial
      if (isInitial && filter === 'all' && selectedType === 'all') {
        const unread = items.filter(n => !n.is_read).length;
        setUnreadCount(unread);
      }
    } catch (e) {
      console.error('Failed to load notifications:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSummarizeAlerts = async () => {
    const unreadList = notifications.filter(n => !n.is_read).slice(0, 30);
    if (unreadList.length === 0) {
      alert('No unread notifications to summarize.');
      return;
    }

    setSummarizing(true);
    setAiSummary('');

    try {
      const listStr = unreadList
        .map((n, idx) => `${idx + 1}. [${n.type.toUpperCase()}] ${n.title}: ${n.message}`)
        .join('\n');

      const cachedProvider = localStorage.getItem('architect_provider') || 'groq';
      const cachedModel = localStorage.getItem('architect_model') || 'llama-3.3-70b-versatile';
      const cachedTemp = localStorage.getItem('architect_temperature') || '0.2';
      const cachedKey = getArchitectSecret();
      
      const activeLlm = {
        provider: cachedProvider,
        model: cachedModel,
        temperature: Number.parseFloat(cachedTemp),
        api_key_override: cachedKey
      };

      const prompt = `Summarize these unread system notifications/alerts in 1-3 short, bulleted sentences. Group by urgency or type if applicable. Keep the language direct and concise:\n\n${listStr}`;

      const res = await chatArchitect(
        { id: 'notifications', name: 'System Notifications', description: 'Real-time alert dashboard', nodes: [], edges: [] },
        {},
        [{ role: 'user', content: prompt }],
        activeLlm
      );

      if (res.status === 'success') {
        setAiSummary(res.reply);
      } else {
        alert(res.message || 'Failed to generate summary.');
      }
    } catch (e) {
      console.error(e);
      alert('Error generating summary: ' + e.message);
    } finally {
      setSummarizing(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await processNotifications({ action: 'mark_read', notification_ids: [id] });
      setPage(1);
      setHasMore(true);
      loadNotifications(1, true);
    } catch (e) {
      console.error('Failed to mark read:', e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await processNotifications({ action: 'mark_all_read' });
      setPage(1);
      setHasMore(true);
      loadNotifications(1, true);
    } catch (e) {
      console.error('Failed to mark all read:', e);
    }
  };

  const handleDelete = async (id) => {
    try {
      await processNotifications({ action: 'delete', notification_ids: [id] });
      setPage(1);
      setHasMore(true);
      loadNotifications(1, true);
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

  const unreadCountLocal = notifications.filter(n => !n.is_read).length;

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
            {unreadCountLocal > 0 && (
              <button
                onClick={handleSummarizeAlerts}
                disabled={summarizing}
                style={{ 
                  padding: '8px 16px', 
                  borderRadius: 10, 
                  background: 'var(--theme-primary-glow)', 
                  border: '1px solid var(--theme-primary-glow)', 
                  fontSize: 13, 
                  fontWeight: 600, 
                  cursor: 'pointer', 
                  color: 'var(--theme-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <HugeiconsIcon icon={AiMagicIcon} size={14} />
                {summarizing ? 'Summarizing...' : 'AI Summary'}
              </button>
            )}
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
            <Tab active={filter === 'unread'} onClick={() => setFilter('unread')} label={`Unread (${unreadCountLocal})`} />
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
          {/* AI Summary Card */}
          {aiSummary && (
            <div style={{
              background: 'var(--theme-primary-glow-light, #FAF5FF)',
              border: '1px solid var(--theme-primary-glow, #E9D5FF)',
              borderRadius: 16,
              padding: '16px 20px',
              marginBottom: 16,
              position: 'relative',
              animation: 'fadeIn 0.2s ease-out'
            }}>
              <button
                onClick={() => setAiSummary('')}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: 12,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)'
                }}
              >
                <FiX size={16} />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <HugeiconsIcon icon={AiMagicIcon} size={16} color="var(--theme-primary)" />
                <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--theme-primary)' }}>AI Executive Summary (Latest 30 Unread)</h4>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {formatMessage(aiSummary)}
              </div>
            </div>
          )}

          {notifications.map(n => (
            <NotificationItem
              key={n.id}
              notification={n}
              onMarkRead={() => handleMarkRead(n.id)}
              onDelete={() => handleDelete(n.id)}
              onOpenChat={() => handleOpenChat(n.workflow_id, n.thread_id)}
            />
          ))}

          {/* Infinite Scroll Sentinel element */}
          <div ref={sentinelRef} style={{ height: 10, margin: '5px 0' }} />

          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '15px 0', color: 'var(--text-muted)' }}>
              <FiRefreshCw size={24} className="spin" style={{ marginBottom: 12 }} />
              Loading alerts...
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', opacity: 0.5 }}>
              <FiArchive size={48} style={{ marginBottom: 16 }} />
              <p>No notifications found</p>
            </div>
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

function getMessagePreview(message) {
  if (!message) return '';
  let text = '';
  if (typeof message === 'string') {
    text = message;
  } else if (message.content || message.text) {
    text = message.content || message.text;
  } else if (Array.isArray(message)) {
    text = message.map(m => typeof m === 'string' ? m : (m.content || m.text || '')).join(' ');
  } else {
    text = JSON.stringify(message);
  }
  return text.replace(/<[^>]*>/g, '') // remove HTML tags
             .replace(/[#*`[\]()_-]/g, '') // remove markdown syntax characters
             .replace(/\s+/g, ' ')
             .trim();
}

function NotificationItem({ notification, onMarkRead, onDelete, onOpenChat }) {
  const cfg = TYPE_ICONS[notification.type] || TYPE_ICONS.info;
  const Icon = cfg.icon;
  const showChatBtn = notification.metadata_json?.show_chat_button;
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ 
      ...STYLES.item, 
      ...(notification.is_read ? {} : STYLES.itemUnread),
      display: 'flex',
      flexDirection: 'column',
      padding: '12px 20px',
      gap: expanded ? 12 : 4
    }}>
      {/* Header Row: icon, title, time, delete, arrow */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, background: cfg.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          <Icon size={16} color={cfg.color} />
        </div>
        
        <h4 style={{ 
          margin: 0, 
          fontSize: 14, 
          fontWeight: 700, 
          color: 'var(--text-primary)',
          flex: 1,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {notification.title}
        </h4>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          
          <button
            onClick={onDelete}
            style={{ width: 28, height: 28, borderRadius: 6, background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#CBD5E1' }}
            title="Delete notification"
          >
            <FiTrash2 size={14} />
          </button>
          
          <button
            onClick={() => setExpanded(!expanded)}
            style={{ width: 28, height: 28, borderRadius: 6, background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}
            title={expanded ? "Show less" : "Show more"}
          >
            {expanded ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
          </button>
        </div>
      </div>

      {/* Details Row: shown in a light color when collapsed */}
      <div style={{ 
        paddingLeft: 44, // Align details with the title (offset by icon size + gap)
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        transition: 'all 0.2s ease'
      }}>
        <div style={{ 
          margin: 0, 
          fontSize: 12, 
          color: expanded ? 'var(--text-secondary)' : '#C0C0C0', // Light grey color when collapsed
          lineHeight: 1.4,
          ...(expanded ? {} : {
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          })
        }}>
          {expanded ? formatMessage(notification.message) : getMessagePreview(notification.message)}
        </div>

        {expanded && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
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
        )}
      </div>
    </div>
  );
}
