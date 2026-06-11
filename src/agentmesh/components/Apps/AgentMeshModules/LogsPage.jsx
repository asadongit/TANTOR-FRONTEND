import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { getExecutionLogs } from '../../../api/agentmesh';
import { useWorkflowStore, useUIStore } from '../../../store';
import { FiChevronDown, FiChevronRight, FiBarChart2, FiCopy, FiCheck, FiSearch, FiRefreshCw } from 'react-icons/fi';
import Pagination from '../../Common/Pagination';
import PageHeader from '../../Common/PageHeader';

const EVENT_COLORS = {
  success: { color: '#059669', dot: '#10B981' },
  error:   { color: '#DC2626', dot: '#EF4444' },
  running: { color: '#D97706', dot: '#F59E0B' },
  token:   { color: '#64748B', dot: '#94A3B8' },
};

const JsonView = ({ label, value, initialOpen = false, level = 0 }) => {
  const [open, setOpen] = useState(initialOpen || level === 0);
  const isObject = value !== null && typeof value === 'object';
  const isArray = Array.isArray(value);
  const keys = isObject ? Object.keys(value) : [];

  if (!isObject) {
    return (
      <div style={{ display: 'flex', gap: 8, fontSize: 12, padding: '4px 0', fontFamily: 'monospace' }}>
        {label && <span style={{ color: '#64748B', fontWeight: 600 }}>{label}:</span>}
        <span style={{ 
          color: value === null ? '#94A3B8' : typeof value === 'string' ? '#059669' : typeof value === 'number' ? '#0EA5E9' : '#D946EF',
          wordBreak: 'break-all'
        }}>
          {value === null ? 'null' : typeof value === 'string' ? `"${value}"` : String(value)}
        </span>
      </div>
    );
  }

  if (keys.length === 0) {
    return (
      <div style={{ display: 'flex', gap: 8, fontSize: 12, padding: '4px 0', fontFamily: 'monospace' }}>
        {label && <span style={{ color: '#64748B', fontWeight: 600 }}>{label}:</span>}
        <span style={{ color: '#94A3B8' }}>{isArray ? '[]' : '{}'}</span>
      </div>
    );
  }

  return (
    <div style={{ padding: '2px 0', fontFamily: 'monospace' }}>
      <div 
        onClick={() => setOpen(!open)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12 }}
      >
        <div style={{ 
            width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', 
            borderRadius: 4, background: '#F1F5F9', color: '#64748B', transition: 'all 0.2s'
        }}>
            {open ? <FiChevronDown size={12} /> : <FiChevronRight size={12} />}
        </div>
        {label && <span style={{ color: '#111827', fontWeight: 600 }}>{label}:</span>}
        <span style={{ color: '#94A3B8', fontSize: 11, fontWeight: 500 }}>
            {isArray ? `Array[${keys.length}]` : `Object {${keys.length}}`}
        </span>
        {!open && keys.length > 0 && <span style={{ color: '#CBD5E1', fontSize: 11, marginLeft: 4 }}>...</span>}
      </div>
      {open && (
        <div style={{ paddingLeft: 22, borderLeft: '1px solid #F1F5F9', marginTop: 4, marginLeft: 8 }}>
          {keys.map((k) => (
            <JsonView key={k} label={isArray ? null : k} value={value[k]} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const STYLES = {
  row: (isError) => ({
    borderBottom: '1px solid var(--border-light)',
    background: 'transparent',
    transition: 'background 0.15s ease',
    marginBottom: 0
  }),
  header: { 
    padding: '12px 16px', 
    display: 'flex', 
    alignItems: 'center', 
    gap: 16, 
    cursor: 'pointer',
    fontSize: 13
  },
  statusWrap: (ev) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: 100,
    flexShrink: 0,
    color: ev.color,
    fontWeight: 600,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.02em'
  }),
  dot: (color) => ({
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: color
  }),
  meta: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: 1, 
    flex: 1,
    minWidth: 0
  },
  wfId: { 
    fontSize: 13, 
    fontWeight: 500, 
    color: 'var(--text-primary)', 
    whiteSpace: 'nowrap', 
    overflow: 'hidden', 
    textOverflow: 'ellipsis'
  },
  threadId: { 
    fontSize: 11, 
    color: 'var(--text-muted)', 
    fontFamily: 'monospace',
    opacity: 0.8
  },
  badge: { 
    fontSize: 10, 
    background: 'var(--bg-primary)', 
    color: 'var(--text-secondary)', 
    padding: '2px 8px', 
    borderRadius: 4, 
    fontWeight: 500, 
    border: '1px solid var(--border)',
    whiteSpace: 'nowrap'
  },
  metrics: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: 4,
    color: 'var(--text-muted)',
    fontSize: 11,
    fontWeight: 500
  },
  pre: {
    fontSize: 11, 
    color: 'var(--text-primary)', 
    whiteSpace: 'pre-wrap', 
    margin: 0, 
    fontFamily: 'monospace', 
    lineHeight: 1.6,
    background: 'var(--bg-primary)', 
    padding: '20px', 
    borderRadius: 8,
    border: '1px solid var(--border)',
    borderLeft: '4px solid var(--accent-btn)'
  }
};

function LogRow({ log }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const time = new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isError = log.status === 'error';
  const ev = EVENT_COLORS[log.status] || EVENT_COLORS[log.event_type] || EVENT_COLORS.token;

  const handleCopy = (e) => {
    e.stopPropagation();
    const logText = JSON.stringify(log, null, 2);
    navigator.clipboard.writeText(logText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        borderRadius: 8,
        background: 'white',
        border: '1px solid #F1F5F9',
        marginBottom: 8,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        boxShadow: open ? '0 12px 24px -10px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.02)',
      }}
    >
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '12px 20px',
          cursor: 'pointer',
          background: open ? '#F8FAFC' : 'white',
        }}
      >
        {/* ── Status Section ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 100 }}>
          <div style={{ 
            width: 20, height: 20, borderRadius: '50%', background: ev.dot, 
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
          }}>
            {isError ? <FiCheck size={12} style={{ transform: 'rotate(45deg)' }} /> : <FiCheck size={12} />}
          </div>
          <span style={{ color: ev.color, fontWeight: 500, fontSize: 13, letterSpacing: '-0.01em' }}>
            {log.status === 'success' ? 'Success' : log.status === 'error' ? 'Error' : 'Running'}
          </span>
        </div>

        {/* ── Identity Section ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.02em' }}>
            {log.workflow_id || 'unnamed_flow'}
          </div>
          <div style={{ fontSize: 12, color: '#64748B', fontFamily: 'monospace', marginTop: 1 }}>
            Thread_{log.thread_id?.slice(0, 8)}...
          </div>
        </div>

        {/* ── Info Section ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {/* Model Badge */}
          {log.model_name && (
            <div style={{ 
              fontSize: 11, background: '#F8FAFC', color: '#64748B', 
              padding: '4px 12px', borderRadius: 20, fontWeight: 500, 
              border: '1px solid #E2E8F0', fontFamily: 'monospace' 
            }}>
              {log.model_name}
            </div>
          )}

          {/* Tokens */}
          {log.tokens_used?.total && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94A3B8', minWidth: 60 }}>
              <FiBarChart2 size={16} /> 
              <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>{log.tokens_used.total}</span>
            </div>
          )}

          {/* Time Stack */}
          <div style={{ textAlign: 'left', minWidth: 70 }}>
            <div style={{ fontSize: 13, color: '#1E293B', fontWeight: 600 }}>{time}</div>
            <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>{Math.round(log.latency_ms || 0)}ms</div>
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={handleCopy}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                color: copied ? '#10B981' : '#CBD5E1', transition: 'color 0.2s',
              }}
            >
              <FiCopy size={16} />
            </button>
            <div style={{ color: '#CBD5E1', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              <FiChevronDown size={18} />
            </div>
          </div>
        </div>
      </div>

      {open && (
        <div style={{ padding: '0 20px 20px 130px' }}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: 8,
            border: '1px dotted #E2E8F0',
            maxHeight: 500,
            overflowY: 'auto'
          }}>
            <JsonView value={log} label={`Object (${Object.keys(log).length})`} initialOpen={true} />
          </div>
        </div>
      )}
    </div>
  );
}

LogRow.propTypes = {
  log: PropTypes.shape({
    id: PropTypes.string,
    workflow_id: PropTypes.string,
    thread_id: PropTypes.string,
    event_type: PropTypes.string,
    node_id: PropTypes.string,
    status: PropTypes.string,
    model_name: PropTypes.string,
    tokens_used: PropTypes.object,
    latency_ms: PropTypes.number,
    data: PropTypes.any,
    created_at: PropTypes.string,
    node_label: PropTypes.string,
  }).isRequired,
};

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalLogs, setTotalLogs] = useState(0);

  const totalPages = Math.ceil(totalLogs / pageSize);
  
  // Use specific selectors to prevent unnecessary re-renders from other UI state changes
  const managementSearch = useUIStore((s) => s.managementSearch);
  const managementWfFilter = useUIStore((s) => s.managementWfFilter);
  const refreshTrigger = useUIStore((s) => s.refreshTrigger);
  const workflows = useWorkflowStore((s) => s.workflows);
  const [searchOpen, setSearchOpen] = useState(managementSearch?.length > 0);
  const searchInputRef = React.useRef(null);

  const load = async () => {
    setLoading(true); setError(null);
    try { 
      const r = await getExecutionLogs({ 
        workflowId: managementWfFilter || undefined, 
        page: currentPage, 
        limit: pageSize 
      }); 
      setLogs(r.logs || []); 
      setTotalLogs(r.total || 0);
    }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { 
    load(); 
  }, [managementWfFilter, refreshTrigger, currentPage]);

  const filtered = logs.filter((l) => !managementSearch || JSON.stringify(l).toLowerCase().includes(managementSearch.toLowerCase()));

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-primary)', fontFamily: "'Google Sans', 'Roboto', sans-serif" }}>
      {/* ── Standard Header ── */}
      <div style={{ padding: '16px 32px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white' }}>
        <PageHeader 
          title="Execution Logs" 
          description="Analyze run outputs, token counters, LLM latency, and step-by-step traces for executed meshes." 
        />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Search bar collapsible (AgentsPage Style) */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', transition: 'all 0.2s', width: (searchOpen || managementSearch) ? 320 : 36 }}>
            {(!searchOpen && !managementSearch) && (
              <button
                onClick={() => setSearchOpen(true)}
                title="Search logs..."
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8
                }}
              >
                <FiSearch size={18} color="#6B7280" />
              </button>
            )}
            {(searchOpen || managementSearch) && (
              <div style={{ position: 'relative', width: '100%' }}>
                <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} size={16} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search logs..."
                  value={managementSearch}
                  onChange={(e) => useUIStore.getState().setManagementSearch(e.target.value)}
                  onBlur={() => { if (!managementSearch) setSearchOpen(false); }}
                  autoFocus={searchOpen && !managementSearch}
                  style={{
                    width: '100%', padding: '8px 12px 8px 36px', border: '1px solid #E5E7EB', borderRadius: 10,
                    fontSize: 14, outline: 'none', background: 'white', color: '#111827'
                  }}
                />
              </div>
            )}
          </div>

          {/* Workflow Filter */}
          <select
            value={managementWfFilter || ''}
            onChange={(e) => useUIStore.getState().setManagementWfFilter(e.target.value)}
            style={{ 
              width: 160, padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 8, 
              fontSize: 13, background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="">All Workflows</option>
            {workflows.map(wf => (
              <option key={wf.id} value={wf.id}>{wf.name}</option>
            ))}
          </select>

          {/* Refresh Button */}
          <button
            onClick={() => useUIStore.getState().setRefreshTrigger(Date.now())}
            style={{ 
              display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px',
              background: 'var(--theme-primary-glow)', color: 'var(--theme-primary)', border: 'none', borderRadius: 8,
              fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.filter = 'brightness(0.95)'}
            onMouseLeave={e => e.currentTarget.style.filter = 'none'}
          >
            <FiRefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 80, gap: 12, color: 'var(--text-muted)' }}>
            <div className="loading-spinner" /> <span style={{ fontSize: 14 }}>Fetching logs…</span>
          </div>
        )}
        {error && (
          <div style={{ padding: '16px 20px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, color: '#DC2626', fontSize: 13 }}>{error}</div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div style={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: 12,
            opacity: 0.8
          }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: '#F2F2EF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiBarChart2 size={24} color="#9898A6" strokeWidth={1.5} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)' }}>No logs yet</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, textAlign: 'center' }}>Run a workflow to start seeing execution events.</div>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 960, margin: '0 auto' }}>
          {filtered.map((log, i) => <LogRow key={log.id || i} log={log} />)}
        </div>

        {/* Pagination Controls */}
        {!loading && !error && filtered.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(p) => { setCurrentPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          />
        )}
      </div>
    </div>
  );
}
