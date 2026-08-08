import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiChevronDown, FiSearch, FiRefreshCw, FiAlertTriangle, FiLoader,
  FiUsers, FiLayers, FiFilter
} from 'react-icons/fi';
import { getObservabilitySessions, getObservabilityTraceDetail, getObservabilityFacets } from '../../../../api/agentmesh';
import {
  fmtNumber, fmtInt, fmtUsd, fmtSec, fmtTime,
  gridTemplate, gridMinWidth, HeaderRow, PaginationBar, LevelBadge,
  ContentModal, useContentModal
} from './observabilityShared';
import { buildTree, ObservationRows, OBS_COLUMNS } from './TracesTab';

const TRACE_SUB_COLUMNS = [
  { key: 'chevron', w: 30, render: (t, { expanded }) => (
    <motion.div animate={{ rotate: expanded ? 180 : 0 }} style={{ display: 'flex', color: 'var(--text-muted)' }}>
      <FiChevronDown size={14} />
    </motion.div>
  ) },
  { key: 'time', label: 'Time', w: 120, render: (t) => <span style={{ color: 'var(--text-secondary)' }}>{fmtTime(t.startTime)}</span> },
  { key: 'name', label: 'Trace', w: '1fr', render: (t) => (
    <span style={{ fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
      {t.name || '(unnamed trace)'}
    </span>
  ) },
  { key: 'level', label: 'Level', w: 70, render: (t) => <LevelBadge level={t.level} /> },
  { key: 'latency', label: 'Latency', w: 80, render: (t) => <span style={{ color: 'var(--text-secondary)' }}>{fmtSec(t.latencySec ?? t.durationSec)}</span> },
  { key: 'inputTokens', label: 'In Tok', w: 65, render: (t) => <span style={{ color: 'var(--text-secondary)' }}>{fmtInt(t.inputTokens)}</span> },
  { key: 'outputTokens', label: 'Out Tok', w: 65, render: (t) => <span style={{ color: 'var(--text-secondary)' }}>{fmtInt(t.outputTokens)}</span> },
  { key: 'totalTokens', label: 'Tokens', w: 70, render: (t) => <span style={{ color: 'var(--text-secondary)' }}>{fmtNumber(t.totalTokens)}</span> },
  { key: 'totalCost', label: 'Cost', w: 80, render: (t) => <span style={{ color: 'var(--text-secondary)' }}>{fmtUsd(t.totalCost)}</span> },
];

const TRACE_SUB_MINWIDTH = gridMinWidth(TRACE_SUB_COLUMNS);

function TraceRow({ trace, onToggle, expanded, loading, children }) {
  return (
    <div>
      <div
        onClick={onToggle}
        style={{
          display: 'grid', gridTemplateColumns: gridTemplate(TRACE_SUB_COLUMNS), minWidth: TRACE_SUB_MINWIDTH,
          alignItems: 'center', gap: 10, padding: '8px 12px', cursor: 'pointer',
          borderBottom: '1px solid var(--border-light)', background: expanded ? '#faf9ff' : 'white',
          fontSize: 12.5, transition: 'background 0.15s'
        }}
        onMouseEnter={(e) => { if (!expanded) e.currentTarget.style.background = '#f8fafc'; }}
        onMouseLeave={(e) => { if (!expanded) e.currentTarget.style.background = 'white'; }}
      >
        {TRACE_SUB_COLUMNS.map((c, i) => (
          <span key={c.key || i} style={{ minWidth: 0 }}>{c.render(trace, { expanded })}</span>
        ))}
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden', background: '#f8fafc' }}
          >
            <div style={{ padding: '10px 14px 6px' }}>
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 20, color: 'var(--text-muted)', fontSize: 12.5 }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ display: 'flex' }}>
                    <FiLoader size={15} />
                  </motion.div>
                  Loading trace…
                </div>
              ) : (
                <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 10, overflowX: 'auto' }}>
                  <HeaderRow columns={OBS_COLUMNS} />
                  {children}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

TraceRow.propTypes = {
  trace: PropTypes.object.isRequired,
  onToggle: PropTypes.func.isRequired,
  expanded: PropTypes.bool.isRequired,
  loading: PropTypes.bool,
  children: PropTypes.node,
};

const SESSION_COLUMNS = [
  { key: 'chevron', w: 34, render: (s, { expanded }) => (
    <motion.div animate={{ rotate: expanded ? 180 : 0 }} style={{ display: 'flex', color: 'var(--text-muted)' }}>
      <FiChevronDown size={15} />
    </motion.div>
  ) },
  { key: 'workflows', label: 'Workflows', w: '1fr', hint: 'The distinct workflows executed within this session (root chain names).', render: (s) => (
    <span
      title={(s.workflows || []).join(', ')}
      style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}
    >
      {(s.workflows && s.workflows.length > 0) ? s.workflows.join(', ') : '—'}
    </span>
  ) },
  { key: 'session', label: 'Session', w: 210, hint: 'A session groups traces that share a session id (e.g. a chat thread). Traces without a session id are grouped under (no session).', render: (s) => (
    <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
      <FiLayers size={14} color="var(--theme-primary)" style={{ flexShrink: 0 }} />
      <span style={{ fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {s.sessionId || '(no session)'}
      </span>
    </span>
  ) },
  { key: 'user', label: 'User', w: 110, render: (s) => (
    <span title={s.userId} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>{s.userId || '—'}</span>
  ) },
  { key: 'traces', label: 'Traces', w: 70, hint: 'Number of root traces belonging to this session.', render: (s) => (
    <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 10, background: 'var(--theme-primary-glow)', color: 'var(--theme-primary)', fontSize: 12, fontWeight: 700 }}>{s.traceCount}</span>
  ) },
  { key: 'avgLatency', label: 'Avg Latency', w: 95, hint: "Average execution time across the session's traces.", render: (s) => <span style={{ color: 'var(--text-secondary)' }}>{fmtSec(s.avgLatencySec)}</span> },
  { key: 'inputTokens', label: 'In Tokens', w: 85, hint: 'Total input (prompt) tokens consumed by LLM calls in this session.', render: (s) => <span style={{ color: 'var(--text-secondary)' }}>{fmtInt(s.inputTokens)}</span> },
  { key: 'outputTokens', label: 'Out Tokens', w: 85, hint: 'Total output (generated) tokens produced by LLM calls in this session.', render: (s) => <span style={{ color: 'var(--text-secondary)' }}>{fmtInt(s.outputTokens)}</span> },
  { key: 'totalTokens', label: 'Tokens', w: 80, hint: 'Total tokens consumed by the session across all LLM calls.', render: (s) => <span style={{ color: 'var(--text-secondary)' }}>{fmtNumber(s.totalTokens)}</span> },
  { key: 'totalCost', label: 'Cost', w: 85, hint: 'Estimated LLM spend for the session. $0 until model pricing is configured.', render: (s) => <span style={{ color: 'var(--text-secondary)' }}>{fmtUsd(s.totalCost)}</span> },
  { key: 'lastActivity', label: 'Last Activity', w: 130, render: (s) => <span style={{ color: 'var(--text-secondary)' }}>{fmtTime(s.lastActivity)}</span> },
];

const SESSION_MINWIDTH = gridMinWidth(SESSION_COLUMNS);

const SESSION_NUMERIC_FILTERS = [
  { key: 'durationSec', label: 'Duration (s)', step: 'any' },
  { key: 'inputTokens', label: 'Input Tokens', step: 1 },
  { key: 'outputTokens', label: 'Output Tokens', step: 1 },
  { key: 'totalTokens', label: 'Total Tokens', step: 1 },
  { key: 'inputCost', label: 'Input Cost', step: 'any' },
  { key: 'outputCost', label: 'Output Cost', step: 'any' },
  { key: 'totalCost', label: 'Total Cost', step: 'any' },
];

const SESSION_VALUE_OPS = [
  { value: 'none', label: 'Any' },
  { value: 'eq', label: '=' },
  { value: 'gte', label: '≥' },
  { value: 'lte', label: '≤' },
  { value: 'range', label: 'Range' },
];

const sessionNumParam = (key, side) => `${side}${key[0].toUpperCase()}${key.slice(1)}`;

export default function SessionsTab({ range }) {
  const [sessions, setSessions] = useState([]);
  const [totalTraces, setTotalTraces] = useState(0);
  const [truncated, setTruncated] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [facets, setFacets] = useState({ userId: [], tags: [] });
  const [moreOpen, setMoreOpen] = useState(false);
  const [tagFilter, setTagFilter] = useState('');
  const [moreInputs, setMoreInputs] = useState(() => {
    const init = { sessionId: '' };
    SESSION_NUMERIC_FILTERS.forEach((f) => { init[`${f.key}Op`] = 'none'; init[`${f.key}Val`] = ''; init[`${f.key}ValTo`] = ''; });
    return init;
  });
  const [more, setMore] = useState(moreInputs);
  const [expandedId, setExpandedId] = useState(null);
  const [expandedTrace, setExpandedTrace] = useState(null);
  const [detailCache, setDetailCache] = useState({});
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const { modal, open: openContent, close: closeContent } = useContentModal();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    const t = setTimeout(() => setMore(moreInputs), 400);
    return () => clearTimeout(t);
  }, [moreInputs]);

  useEffect(() => {
    let active = true;
    getObservabilityFacets({ fromTimestamp: range.fromTimestamp, toTimestamp: range.toTimestamp, entity: 'traces' })
      .then((f) => { if (active) setFacets({ userId: f.userId || [], tags: f.tags || [] }); })
      .catch(() => { if (active) setFacets({ userId: [], tags: [] }); });
    return () => { active = false; };
  }, [range]);

  const fetchSessions = useCallback(async (targetPage, targetLimit) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        fromTimestamp: range.fromTimestamp,
        toTimestamp: range.toTimestamp,
        page: targetPage,
        limit: targetLimit,
        search: debouncedSearch || undefined,
        userId: userFilter || undefined,
      };
      if (tagFilter) params.tags = tagFilter;
      if (more.sessionId) params.sessionId = more.sessionId;
      SESSION_NUMERIC_FILTERS.forEach((f) => {
        const op = more[`${f.key}Op`];
        const val = more[`${f.key}Val`];
        if (!op || op === 'none' || val === '') return;
        if (op === 'eq') {
          params[sessionNumParam(f.key, 'min')] = val;
          params[sessionNumParam(f.key, 'max')] = val;
        } else if (op === 'gte') {
          params[sessionNumParam(f.key, 'min')] = val;
        } else if (op === 'lte') {
          params[sessionNumParam(f.key, 'max')] = val;
        } else if (op === 'range') {
          params[sessionNumParam(f.key, 'min')] = val;
          if (more[`${f.key}ValTo`] !== '') params[sessionNumParam(f.key, 'max')] = more[`${f.key}ValTo`];
        }
      });
      const res = await getObservabilitySessions(params);
      setSessions(res.data || []);
      setTotalTraces(res.totalTraces || 0);
      setTruncated(res.truncated || false);
      setTotal(res.total || res.count || 0);
      setPage(res.page || targetPage);
    } catch (e) {
      setError(e.message || 'Failed to load sessions');
      setSessions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [range, debouncedSearch, userFilter, tagFilter, more]);

  useEffect(() => {
    setExpandedId(null);
    setExpandedTrace(null);
    fetchSessions(1, limit);
  }, [fetchSessions, limit]);

  const goToPage = (targetPage) => {
    if (targetPage < 1) return;
    fetchSessions(targetPage, limit);
  };

  const handleLimitChange = (nextLimit) => {
    setLimit(nextLimit);
    fetchSessions(1, nextLimit);
  };

  const toggleSession = (sessionId) => {
    setExpandedId((prev) => (prev === sessionId ? null : sessionId));
    setExpandedTrace(null);
  };

  const toggleTrace = async (sessionId, trace) => {
    setDetailError(null);
    if (expandedTrace === trace.traceId) {
      setExpandedTrace(null);
      return;
    }
    setExpandedTrace(trace.traceId);
    if (!detailCache[trace.traceId]) {
      setDetailLoading(true);
      try {
        const res = await getObservabilityTraceDetail(trace.traceId);
        setDetailCache((c) => ({ ...c, [trace.traceId]: res }));
      } catch (e) {
        setDetailError(e.message || 'Failed to load trace detail');
      } finally {
        setDetailLoading(false);
      }
    }
  };

  const hasFilters = debouncedSearch !== ''
    || userFilter !== ''
    || tagFilter !== ''
    || more.sessionId !== ''
    || SESSION_NUMERIC_FILTERS.some((f) => more[`${f.key}Op`] !== 'none' && more[`${f.key}Val`] !== '');

  const clearFilters = () => {
    setSearchInput('');
    setUserFilter('');
    setTagFilter('');
    setMoreInputs((prev) => {
      const next = { ...prev, sessionId: '' };
      SESSION_NUMERIC_FILTERS.forEach((f) => { next[`${f.key}Op`] = 'none'; next[`${f.key}Val`] = ''; next[`${f.key}ValTo`] = ''; });
      return next;
    });
  };

  const inputStyle = {
    padding: '9px 12px', background: 'white',
    border: '1px solid var(--border)', borderRadius: 10, fontSize: 13,
    color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <FiSearch size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search sessions by id or user…"
              style={{
                width: 280, padding: '9px 12px 9px 36px', background: 'white',
                border: '1px solid var(--border)', borderRadius: 10, fontSize: 13,
                color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit'
              }}
            />
          </div>
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            title="Filter sessions by user ID"
            style={{
              width: 160, padding: '9px 12px', background: 'white',
              border: '1px solid var(--border)', borderRadius: 10, fontSize: 13,
              color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit'
            }}
          >
            <option value="">All users</option>
            {facets.userId.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
          <button
            onClick={() => setMoreOpen((o) => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
              border: '1px solid var(--border)', borderRadius: 10, background: moreOpen ? '#f5f3ff' : 'white',
              color: moreOpen ? 'var(--theme-primary)' : 'var(--text-secondary)', fontSize: 13,
              fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
            }}
          >
            <FiFilter size={14} />
            More filters
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 600 }}>
            {sessions.length} session{sessions.length === 1 ? '' : 's'} · {totalTraces} traces
          </span>
          <button
            onClick={() => fetchSessions(page, limit)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
              border: '1px solid var(--border)', borderRadius: 20, background: 'white',
              color: 'var(--text-secondary)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit'
            }}
          >
            <FiRefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
      </div>

      <AnimatePresence>
        {moreOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap', padding: '12px 16px', background: '#faf9ff', border: '1px solid var(--border)', borderRadius: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Trace Tags</label>
                <select
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                  title="Filter sessions by any of these trace tags"
                  style={{ ...inputStyle, width: 170 }}
                >
                  <option value="">All tags</option>
                  {facets.tags.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Session ID</label>
                <input
                  value={moreInputs.sessionId}
                  onChange={(e) => setMoreInputs((x) => ({ ...x, sessionId: e.target.value }))}
                  placeholder="Contains…"
                  style={{ ...inputStyle, width: 180 }}
                />
              </div>
              {SESSION_NUMERIC_FILTERS.map((f) => {
                const op = moreInputs[`${f.key}Op`];
                return (
                  <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 10px', background: 'white', border: '1px solid var(--border)', borderRadius: 10 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{f.label}</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <select
                        value={moreInputs[`${f.key}Op`]}
                        onChange={(e) => setMoreInputs((x) => ({ ...x, [`${f.key}Op`]: e.target.value }))}
                        title={`Filter sessions by ${f.label.toLowerCase()}`}
                        style={{ ...inputStyle, width: 72, padding: '8px 8px' }}
                      >
                        {SESSION_VALUE_OPS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      {op !== 'none' && (
                        <input
                          type="number"
                          min={0}
                          step={f.step}
                          value={moreInputs[`${f.key}Val`]}
                          onChange={(e) => setMoreInputs((x) => ({ ...x, [`${f.key}Val`]: e.target.value }))}
                          placeholder={op === 'range' ? 'From' : 'Value'}
                          style={{ ...inputStyle, width: 96, padding: '8px 10px' }}
                        />
                      )}
                      {op === 'range' && (
                        <input
                          type="number"
                          min={0}
                          step={f.step}
                          value={moreInputs[`${f.key}ValTo`]}
                          onChange={(e) => setMoreInputs((x) => ({ ...x, [`${f.key}ValTo`]: e.target.value }))}
                          placeholder="To"
                          style={{ ...inputStyle, width: 96, padding: '8px 10px' }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12,
          padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10,
          color: 'var(--red)', fontSize: 13, fontWeight: 500
        }}>
          <FiAlertTriangle size={16} />
          {error}
        </div>
      )}

      {truncated && (
        <div style={{
          background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12,
          padding: '10px 16px', color: '#b45309', fontSize: 12.5, fontWeight: 500
        }}>
          The range contains more traces than can be summarized — showing the most recent sessions. Narrow the time range for a complete view.
        </div>
      )}

      {/* Sessions list */}
      <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, overflowX: 'auto' }}>
        <HeaderRow columns={SESSION_COLUMNS} />

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 48, color: 'var(--text-muted)', fontSize: 13 }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ display: 'flex' }}
            >
              <FiLoader size={20} />
            </motion.div>
            Loading sessions…
          </div>
        ) : sessions.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13.5 }}>
            <FiUsers size={34} style={{ marginBottom: 10, opacity: 0.35 }} />
            <div>{hasFilters ? 'No sessions match the current filters.' : 'No sessions in this period. Sessions appear when workflows run with a shared session or thread id.'}</div>
            {hasFilters && (
              <div style={{ marginTop: 12 }}>
                <button
                  onClick={clearFilters}
                  style={{ border: '1px solid var(--border)', background: 'white', color: 'var(--text-secondary)', borderRadius: 8, padding: '7px 16px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        ) : (
          sessions.map((s) => {
            const expanded = expandedId === s.sessionId;
            return (
              <div key={s.sessionId}>
                <div
                  onClick={() => toggleSession(s.sessionId)}
                  style={{
                    display: 'grid', gridTemplateColumns: gridTemplate(SESSION_COLUMNS), minWidth: SESSION_MINWIDTH,
                    alignItems: 'center', gap: 10, padding: '12px 16px', cursor: 'pointer',
                    borderBottom: '1px solid var(--border-light)', background: expanded ? '#faf9ff' : 'white',
                    fontSize: 12.5, transition: 'background 0.15s'
                  }}
                  onMouseEnter={(e) => { if (!expanded) e.currentTarget.style.background = '#f8fafc'; }}
                  onMouseLeave={(e) => { if (!expanded) e.currentTarget.style.background = 'white'; }}
                >
                  {SESSION_COLUMNS.map((c, i) => (
                    <span key={c.key || i} style={{ minWidth: 0 }}>{c.render(s, { expanded })}</span>
                  ))}
                </div>

                <AnimatePresence>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: 'hidden', background: '#f8fafc' }}
                    >
                      <div style={{ padding: '10px 16px', overflowX: 'auto' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', minWidth: 'max-content' }}>
                          <FiLayers size={12} />
                          Traces in this session
                        </div>
                        {detailError && (
                          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', color: 'var(--red)', fontSize: 12.5, marginBottom: 8 }}>{detailError}</div>
                        )}
                        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 10, overflowX: 'auto' }}>
                          <HeaderRow columns={TRACE_SUB_COLUMNS} />
                          {s.traces.map((t) => {
                            const traceExpanded = expandedTrace === t.traceId;
                            const detail = detailCache[t.traceId];
                            return (
                              <TraceRow
                                key={t.id}
                                trace={t}
                                expanded={traceExpanded}
                                loading={detailLoading && !detail}
                                onToggle={() => toggleTrace(s.sessionId, t)}
                              >
                                {detail ? (
                                  <ObservationRows nodes={buildTree(detail.observations)} onOpenContent={openContent} />
                                ) : null}
                              </TraceRow>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}

        {!loading && (
          <PaginationBar
            page={page}
            totalPages={Math.ceil(total / limit)}
            onPrev={() => goToPage(page - 1)}
            onNext={() => goToPage(page + 1)}
            limit={limit}
            onLimitChange={handleLimitChange}
            rangeText={`${total} session${total === 1 ? '' : 's'}`}
          />
        )}
      </div>

      <ContentModal payload={modal} onClose={closeContent} />
    </div>
  );
}

SessionsTab.propTypes = {
  range: PropTypes.shape({
    fromTimestamp: PropTypes.string.isRequired,
    toTimestamp: PropTypes.string.isRequired,
  }).isRequired,
};
