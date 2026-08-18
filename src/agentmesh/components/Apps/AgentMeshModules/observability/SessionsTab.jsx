import { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiChevronDown, FiSearch, FiAlertTriangle, FiLoader,
  FiUsers, FiFilter, FiShare2
} from 'react-icons/fi';
import { getObservabilitySessions, getObservabilityTraceDetail, getObservabilityFacets } from '../../../../api/agentmesh';
import {
  fmtNumber, fmtInt, fmtUsd, fmtSec, fmtTime,
  gridTemplate, gridMinWidth, HeaderRow, PaginationBar, LevelBadge,
  ContentModal, useContentModal
} from './observabilityShared';
import TraceGraphModal from './TraceGraphModal';

const SESSION_TRACE_COLUMNS = [
  { key: 'time', label: 'Time', w: 140, render: (t) => <span style={{ color: '#64748B' }}>{fmtTime(t.startTime)}</span> },
  { key: 'name', label: 'Trace', w: '1fr', render: (t) => (
    <span style={{ fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
      {t.name || '(unnamed trace)'}
    </span>
  ) },
  { key: 'level', label: 'Level', w: 80, render: (t) => <LevelBadge level={t.level} /> },
  { key: 'latency', label: 'Latency', w: 90, align: 'center', render: (t) => <span style={{ color: '#64748B', textAlign: 'center', display: 'block' }}>{fmtSec(t.latencySec ?? t.durationSec)}</span> },
  { key: 'totalTokens', label: 'Tokens', w: 80, align: 'center', render: (t) => <span style={{ color: '#64748B', textAlign: 'center', display: 'block' }}>{fmtNumber(t.totalTokens)}</span> },
  { key: 'totalCost', label: 'Cost', w: 85, align: 'center', render: (t) => <span style={{ color: '#64748B', textAlign: 'center', display: 'block' }}>{fmtUsd(t.totalCost)}</span> },
];

const SESSION_COLUMNS = [
  { key: 'chevron', w: 34, render: (s, { expanded }) => (
    <motion.div animate={{ rotate: expanded ? 180 : 0 }} style={{ display: 'flex', color: 'var(--text-muted)' }}>
      <FiChevronDown size={15} />
    </motion.div>
  ) },
  { key: 'workflows', label: 'Workflows', w: '1fr', hint: 'The distinct business workflows executed within this conversation session.', render: (s) => (
    <span
      title={(s.workflows || []).join(', ')}
      style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}
    >
      {(s.workflows && s.workflows.length > 0) ? s.workflows.join(', ') : '—'}
    </span>
  ) },
  { key: 'session', label: 'Session', w: 210, hint: 'A Session groups continuous multi-turn chat interactions for a user. Click to view traces for this session.', render: (s, { onSelectSession }) => (
    <span
      onClick={(e) => {
        if (onSelectSession && s.sessionId) {
          e.stopPropagation();
          onSelectSession(s.sessionId);
        }
      }}
      title={s.sessionId ? "Click to view traces for this session in Traces tab" : ""}
      style={{
        fontWeight: 600,
        color: s.sessionId ? '#8E77BB' : '#0F172A',
        cursor: s.sessionId ? 'pointer' : 'default',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block',
        textDecoration: s.sessionId ? 'underline' : 'none'
      }}
    >
      {s.sessionId || '(no session)'}
    </span>
  ) },
  { key: 'user', label: 'User', w: 110, hint: 'The user account or identifier associated with this session.', render: (s) => (
    <span title={s.userId} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>{s.userId || '—'}</span>
  ) },
  { key: 'traces', label: 'Traces', w: 70, align: 'center', hint: 'Number of individual AI workflow runs executed inside this session.', render: (s) => (
    <span style={{ fontSize: 12, fontWeight: 600, color: '#475569', textAlign: 'center', display: 'block' }}>{s.traceCount}</span>
  ) },
  { key: 'avgLatency', label: 'Avg Latency', w: 95, align: 'center', hint: "Average response speed per trace within this session.", render: (s) => <span style={{ color: '#475569', textAlign: 'center', display: 'block' }}>{fmtSec(s.avgLatencySec)}</span> },
  { key: 'inputTokens', label: 'In Tokens', w: 85, align: 'center', hint: 'Total prompt & context tokens sent to AI models during this session.', render: (s) => <span style={{ color: '#475569', textAlign: 'center', display: 'block' }}>{fmtInt(s.inputTokens)}</span> },
  { key: 'outputTokens', label: 'Out Tokens', w: 85, align: 'center', hint: 'Total generated answer tokens returned by AI models during this session.', render: (s) => <span style={{ color: '#475569', textAlign: 'center', display: 'block' }}>{fmtInt(s.outputTokens)}</span> },
  { key: 'totalTokens', label: 'Tokens', w: 80, align: 'center', hint: 'Total text tokens processed across all LLM steps in this session.', render: (s) => <span style={{ color: '#475569', textAlign: 'center', display: 'block' }}>{fmtNumber(s.totalTokens)}</span> },
  { key: 'totalCost', label: 'Cost', w: 85, align: 'center', hint: 'Total calculated API financial spend for this session in USD.', render: (s) => <span style={{ color: '#475569', textAlign: 'center', display: 'block' }}>{fmtUsd(s.totalCost)}</span> },
  { key: 'lastActivity', label: 'Last Activity', w: 130, hint: 'Date and time of the most recent activity in this session.', render: (s) => <span style={{ color: 'var(--text-secondary)' }}>{fmtTime(s.lastActivity)}</span> },
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

export default function SessionsTab({ range, initialUserFilter = '', onSelectSession }) {
  const [sessions, setSessions] = useState([]);
  const [totalTraces, setTotalTraces] = useState(0);
  const [truncated, setTruncated] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [userFilter, setUserFilter] = useState(initialUserFilter || '');

  useEffect(() => {
    if (initialUserFilter) {
      setUserFilter(initialUserFilter);
    }
  }, [initialUserFilter]);
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
  const { modal, open: openContent, close: closeContent } = useContentModal();
  const [sessionGraphDetail, setSessionGraphDetail] = useState(null);
  const [sessionGraphLoading, setSessionGraphLoading] = useState(false);

  const openSessionGraph = async (session) => {
    if (!session || !session.traces || session.traces.length === 0) return;
    setSessionGraphLoading(true);
    try {
      const details = await Promise.all(
        session.traces.map((t) => getObservabilityTraceDetail(t.traceId).catch(() => null))
      );
      const obsMap = new Map();
      details.forEach((d) => {
        if (d && d.observations) {
          d.observations.forEach((o) => {
            if (!o) return;
            const key = o.id || `${o.name}-${o.type}-${o.startTime}-${o.endTime || ''}`;
            if (!obsMap.has(key)) {
              obsMap.set(key, o);
            }
          });
        }
      });
      const allObs = Array.from(obsMap.values());
      setSessionGraphDetail({
        traceId: session.sessionId,
        name: `Session: ${session.sessionId}`,
        observations: allObs,
        durationSec: session.totalDurationSec || session.durationSec,
        observationCount: allObs.length,
      });
    } catch (err) {
      console.error('Failed to build session graph:', err);
    } finally {
      setSessionGraphLoading(false);
    }
  };

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
    }
  }, [range, debouncedSearch, userFilter, tagFilter, more]);

  useEffect(() => {
    setExpandedId(null);
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

  const userSummaryMetrics = useMemo(() => {
    if (!userFilter || sessions.length === 0) {
      return { obsCount: 0, sessionCount: 0, traceCount: 0, totalTokens: 0, totalCost: 0, activeRange: '—' };
    }
    let obsCount = 0;
    let traceCount = 0;
    let totalTokens = 0;
    let totalCost = 0;
    const times = [];

    sessions.forEach((s) => {
      obsCount += s.observationCount || (s.traces ? s.traces.reduce((acc, t) => acc + (t.observationCount || 1), 0) : 1);
      traceCount += s.traceCount || (s.traces ? s.traces.length : 1);
      totalTokens += s.totalTokens || 0;
      totalCost += s.totalCost || 0;
      if (s.startTime) times.push(new Date(s.startTime).getTime());
      if (s.lastActivity) times.push(new Date(s.lastActivity).getTime());
      if (s.endTime) times.push(new Date(s.endTime).getTime());
    });

    const validTimes = times.filter((t) => !Number.isNaN(t));
    const minT = validTimes.length ? new Date(Math.min(...validTimes)).toISOString() : null;
    const maxT = validTimes.length ? new Date(Math.max(...validTimes)).toISOString() : null;
    const activeRange = minT && maxT ? `${fmtTime(minT)} – ${fmtTime(maxT)}` : '—';

    return {
      obsCount,
      sessionCount: sessions.length,
      traceCount,
      totalTokens,
      totalCost,
      activeRange
    };
  }, [userFilter, sessions]);

  const toggleSession = (sessionId) => {
    setExpandedId((prev) => (prev === sessionId ? null : sessionId));
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
    padding: '8px 14px', background: '#FFFFFF',
    border: '1px solid #E5E7EB', borderRadius: 10, fontSize: 13,
    fontWeight: 500, color: '#111827', outline: 'none', fontFamily: 'inherit'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%', minHeight: 0 }}>
      {/* Overall User Summary Heading Banner (Langfuse Standard) */}
      {userFilter && (
        <div style={{
          background: '#FFFFFF', border: '1px solid #8E77BB', borderRadius: 12, padding: '14px 18px',
          boxShadow: '0 2px 8px rgba(142, 119, 187, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FiUsers size={16} color="#8E77BB" />
              User Overview: <span style={{ color: '#8E77BB', fontFamily: 'monospace' }}>{userFilter}</span>
            </div>
            <button
              type="button"
              onClick={() => setUserFilter('')}
              style={{ border: 'none', background: '#F4F0FA', color: '#8E77BB', fontSize: 11.5, fontWeight: 600, borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}
            >
              Clear user filter ✕
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12.5, color: '#475569', fontWeight: 600, flexWrap: 'wrap' }}>
            <span>Observations: <strong style={{ color: '#0F172A' }}>{fmtInt(userSummaryMetrics.obsCount)}</strong></span>
            <span>·</span>
            <span>Sessions: <strong style={{ color: '#0F172A' }}>{userSummaryMetrics.sessionCount}</strong></span>
            <span>·</span>
            <span>Traces: <strong style={{ color: '#0F172A' }}>{userSummaryMetrics.traceCount}</strong></span>
            <span>·</span>
            <span>Total Tokens: <strong style={{ color: '#0F172A' }}>{fmtInt(userSummaryMetrics.totalTokens)}</strong></span>
            <span>·</span>
            <span>Total Cost: <strong style={{ color: '#0F172A' }}>{fmtUsd(userSummaryMetrics.totalCost)}</strong></span>
            <span>·</span>
            <span>Active: <strong style={{ color: '#0F172A' }}>{userSummaryMetrics.activeRange}</strong></span>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <FiSearch size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search sessions by id or user…"
              style={{
                width: 280, padding: '8px 12px 8px 36px', background: '#FFFFFF',
                border: '1px solid #E5E7EB', borderRadius: 10, fontSize: 13.5,
                color: '#111827', outline: 'none', fontFamily: 'inherit'
              }}
            />
          </div>
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            title="Filter sessions by user ID"
            style={{
              width: 160, padding: '8px 14px', background: '#FFFFFF',
              border: '1px solid #E5E7EB', borderRadius: 10, fontSize: 13,
              fontWeight: 500, color: '#111827', outline: 'none', fontFamily: 'inherit'
            }}
          >
            <option value="">All users</option>
            {facets.userId.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
          <button
            type="button"
            onClick={() => setMoreOpen((o) => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
              border: '1px solid #E5E7EB', borderRadius: 10, background: moreOpen ? '#111827' : '#FFFFFF',
              color: moreOpen ? '#FFFFFF' : '#111827', fontSize: 13,
              fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'inherit'
            }}
          >
            <FiFilter size={16} color={moreOpen ? '#FFFFFF' : '#6B7280'} />
            Filters
            {hasFilters && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444' }} />}
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12.5, color: '#64748B', fontWeight: 600 }}>
            {sessions.length} session{sessions.length === 1 ? '' : 's'} · {totalTraces} traces
          </span>
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
      <div style={{ flex: 1, minHeight: 0, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, minHeight: 0, overflowX: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ minWidth: SESSION_MINWIDTH, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <HeaderRow columns={SESSION_COLUMNS} />

            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 48, color: '#64748B', fontSize: 13 }}>
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
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', textAlign: 'center', color: '#64748B', fontSize: 13.5 }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#F1F5F9', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <FiUsers size={26} />
                  </div>
                  <div style={{ maxWidth: 460, color: '#475569', fontWeight: 500, lineHeight: 1.5 }}>
                    {hasFilters ? 'No sessions match the current filters.' : 'No sessions in this period. Sessions appear when workflows run with a shared session or thread id.'}
                  </div>
                  {hasFilters && (
                    <div style={{ marginTop: 14 }}>
                      <button
                        type="button"
                        onClick={clearFilters}
                        style={{ border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#0F172A', borderRadius: 8, padding: '7px 16px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
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
                          borderBottom: '1px solid #F1F5F9', background: expanded ? '#FAF9FF' : '#FFFFFF',
                          fontSize: 12.5, transition: 'background 0.15s'
                        }}
                        onMouseEnter={(e) => { if (!expanded) e.currentTarget.style.background = '#F8FAFC'; }}
                        onMouseLeave={(e) => { if (!expanded) e.currentTarget.style.background = '#FFFFFF'; }}
                      >
                        {SESSION_COLUMNS.map((c, i) => (
                          <span key={c.key || i} style={{ minWidth: 0 }}>{c.render(s, { expanded, onSelectSession })}</span>
                        ))}
                      </div>

                  <AnimatePresence>
                    {expanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden', background: '#F8FAFC' }}
                      >
                        <div style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0' }}>
                          {(() => {
                            const traces = s.traces || [];
                            const traceCount = traces.length;
                            let obsCount = s.observationCount || 0;
                            let totalTokens = s.totalTokens || 0;
                            let totalCost = s.totalCost || 0;
                            let minTime = s.createdAt || s.startTime;
                            let maxTime = s.updatedAt || s.endTime;

                            if (traces.length > 0) {
                              if (!obsCount) {
                                obsCount = traces.reduce((acc, t) => acc + (t.observationCount || 1), 0);
                              }
                              if (!totalTokens) {
                                totalTokens = traces.reduce((acc, t) => acc + (t.totalTokens || 0), 0);
                              }
                              if (!totalCost) {
                                totalCost = traces.reduce((acc, t) => acc + (t.totalCost || 0), 0);
                              }
                              const times = traces.map((t) => new Date(t.startTime).getTime()).filter((t) => !Number.isNaN(t));
                              if (times.length > 0) {
                                minTime = new Date(Math.min(...times)).toISOString();
                                maxTime = new Date(Math.max(...times)).toISOString();
                              }
                            }

                            const activeRange = minTime && maxTime ? `${fmtTime(minTime)} – ${fmtTime(maxTime)}` : '—';

                            return (
                              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '12px 16px', marginBottom: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: '#475569', fontWeight: 600, flexWrap: 'wrap' }}>
                                    <span>Observations: <strong style={{ color: '#0F172A' }}>{fmtInt(obsCount)}</strong></span>
                                    <span>·</span>
                                    <span>Traces: <strong style={{ color: '#0F172A' }}>{traceCount}</strong></span>
                                    <span>·</span>
                                    <span>Total Tokens: <strong style={{ color: '#0F172A' }}>{fmtInt(totalTokens)}</strong></span>
                                    <span>·</span>
                                    <span>Total Cost: <strong style={{ color: '#0F172A' }}>{fmtUsd(totalCost)}</strong></span>
                                    <span>·</span>
                                    <span>Active: <strong style={{ color: '#0F172A' }}>{activeRange}</strong></span>
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <button
                                      type="button"
                                      disabled={sessionGraphLoading}
                                      onClick={() => openSessionGraph(s)}
                                      style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px',
                                        border: '1px solid #8E77BB', borderRadius: 6, background: '#F4F0FA',
                                        color: '#8E77BB', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
                                      }}
                                    >
                                      <FiShare2 size={13} />
                                      {sessionGraphLoading ? 'Loading Graph…' : 'View Full Session Graph'}
                                    </button>
                                    {s.sessionId && (
                                      <button
                                        type="button"
                                        onClick={() => onSelectSession && onSelectSession(s.sessionId)}
                                        style={{
                                          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px',
                                          border: '1px solid #8E77BB', borderRadius: 6, background: '#FFFFFF',
                                          color: '#8E77BB', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
                                        }}
                                      >
                                        View all in Traces tab &rarr;
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                          {s.traces && s.traces.length > 0 ? (
                            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, overflowX: 'auto' }}>
                              <HeaderRow columns={SESSION_TRACE_COLUMNS} />
                              {s.traces.map((t) => (
                                <div
                                  key={t.id || t.traceId}
                                  style={{
                                    display: 'grid', gridTemplateColumns: gridTemplate(SESSION_TRACE_COLUMNS), minWidth: 600,
                                    alignItems: 'center', gap: 10, padding: '10px 14px',
                                    borderBottom: '1px solid #F1F5F9', fontSize: 12
                                  }}
                                >
                                  {SESSION_TRACE_COLUMNS.map((c, i) => (
                                    <span key={c.key || i} style={{ minWidth: 0 }}>{c.render(t, { openContent })}</span>
                                  ))}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ fontSize: 12, color: '#64748B' }}>No trace details loaded for this session.</div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
            </div>
          </div>
        </div>

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
      {sessionGraphDetail && (
        <TraceGraphModal
          traceDetail={sessionGraphDetail}
          onClose={() => setSessionGraphDetail(null)}
          onOpenContent={openContent}
        />
      )}
    </div>
  );
}

SessionsTab.propTypes = {
  range: PropTypes.shape({
    fromTimestamp: PropTypes.string.isRequired,
    toTimestamp: PropTypes.string.isRequired,
  }).isRequired,
  initialUserFilter: PropTypes.string,
  onSelectSession: PropTypes.func,
};
