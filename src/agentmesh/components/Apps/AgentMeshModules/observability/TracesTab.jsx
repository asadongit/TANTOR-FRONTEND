import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiChevronDown, FiSearch, FiRefreshCw, FiAlertTriangle, FiLoader, FiGitBranch, FiFilter
} from 'react-icons/fi';
import { getObservabilityTraces, getObservabilityTraceDetail, getObservabilityFacets } from '../../../../api/agentmesh';
import {
  fmtNumber, fmtInt, fmtUsd, fmtTime, fmtTimeShort,
  gridTemplate, gridMinWidth, HeaderRow, PaginationBar, LevelBadge, TypeBadge, TagChips,
  PreviewCell, ContentModal, useContentModal, toText, monoCell
} from './observabilityShared';

const LEVELS = ['', 'DEFAULT', 'DEBUG', 'INFO', 'WARNING', 'ERROR'];

const KINDS = [
  { value: '', label: 'All Kinds' },
  { value: 'workflow', label: 'Workflows' },
  { value: 'evaluation', label: 'Evaluations' },
  { value: 'decision', label: 'Decisions' },
  { value: 'system', label: 'System' },
];

const EXTRA_TRACE_FILTERS = [
  { key: 'userId', label: 'User ID', facet: 'userId' },
  { key: 'sessionId', label: 'Session ID', facet: 'sessionId' },
  { key: 'tags', label: 'Tags', facet: 'tags' },
];

const sectionSize = (text) => (text ? `${text.length.toLocaleString()} chars` : 'empty');

const ioPayload = (o) => {
  const inputText = toText(o.input);
  const outputText = toText(o.output);
  return {
    title: o.name || '(unnamed observation)',
    subtitle: `${o.type || 'SPAN'}${o.modelId ? ' · ' + o.modelId : ''}`,
    sections: [
      { label: 'Input', text: inputText || '—', dark: true, size: sectionSize(inputText) },
      { label: 'Output', text: outputText || '—', dark: true, size: sectionSize(outputText) },
    ],
  };
};

const metadataPayload = (o) => {
  const text = toText(o.metadata);
  return {
    title: o.name || '(unnamed observation)',
    subtitle: 'Metadata',
    sections: [{ label: 'Metadata', text: text || '—', size: sectionSize(text) }],
  };
};

const TRACE_COLUMNS = [
  { key: 'chevron', w: 40, render: (t, { expanded }) => (
    <motion.div animate={{ rotate: expanded ? 180 : 0 }} style={{ display: 'flex', color: 'var(--text-muted)' }}>
      <FiChevronDown size={15} />
    </motion.div>
  ) },
  { key: 'level', label: 'Level', w: 70, hint: 'Highest-severity level observed anywhere in the trace.', render: (t) => <LevelBadge level={t.level} /> },
  { key: 'name', label: 'Workflow', w: 220, hint: 'Workflow executed for this trace. LangGraph names the root chain after the workflow.', render: (t) => (
    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.workflowName || t.name || '(unnamed trace)'}</span>
      {t.level === 'ERROR' && <FiAlertTriangle size={13} color="var(--red)" style={{ flexShrink: 0 }} />}
    </span>
  ) },
  { key: 'type', label: 'Type', w: 100, render: (t) => <TypeBadge type={t.type} /> },
  { key: 'id', label: 'ID', w: 120, render: (t) => <span style={monoCell} title={t.traceId}>{t.traceId ? t.traceId.slice(0, 12) + '…' : '—'}</span> },
  { key: 'timestamp', label: 'Timestamp', w: 130, render: (t) => <span>{fmtTime(t.startTime)}</span> },
  { key: 'environment', label: 'Environment', w: 110, render: (t) => <span title={t.environment}>{t.environment || '—'}</span> },
  { key: 'userId', label: 'User ID', w: 100, render: (t) => <span title={t.userId} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.userId || '—'}</span> },
  { key: 'sessionId', label: 'Session ID', w: 130, render: (t) => <span title={t.sessionId} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.sessionId || '—'}</span> },
  { key: 'input', label: 'Input', w: 150, hint: 'The trace input payload (raw content from Langfuse, often JSON). Click to inspect.', render: (t, ctx) => <PreviewCell value={t.input} onOpen={() => ctx.openContent && ctx.openContent(ioPayload(t))} /> },
  { key: 'output', label: 'Output', w: 150, hint: 'The trace output payload (raw content from Langfuse, often JSON). Click to inspect.', render: (t, ctx) => <PreviewCell value={t.output} onOpen={() => ctx.openContent && ctx.openContent(ioPayload(t))} /> },
  { key: 'metadata', label: 'Metadata', w: 120, hint: 'Trace metadata key-value pairs. Click to inspect.', render: (t, ctx) => <PreviewCell value={t.metadata} onOpen={() => ctx.openContent && ctx.openContent(metadataPayload(t))} /> },
  { key: 'tags', label: 'Tags', w: 130, hint: 'Tags attached to this trace.', render: (t) => <TagChips tags={t.tags} /> },
  { key: 'version', label: 'Version', w: 80, render: (t) => <span>{t.version || '—'}</span> },
  { key: 'latency', label: 'Duration', w: 90, hint: 'Total execution time, from earliest observation start to latest observation end.', render: (t) => <span>{fmtTimeShortToSec(t.durationSec ?? t.latencySec)}</span> },
  { key: 'totalTokens', label: 'Tokens', w: 80, hint: 'Total tokens across all LLM generations of the trace.', render: (t) => <span title={`Input ${fmtInt(t.inputTokens)} / Output ${fmtInt(t.outputTokens)}`}>{fmtNumber(t.totalTokens)}</span> },
  { key: 'inputTokens', label: 'In Tokens', w: 80, render: (t) => <span>{fmtInt(t.inputTokens)}</span> },
  { key: 'outputTokens', label: 'Out Tokens', w: 80, render: (t) => <span>{fmtInt(t.outputTokens)}</span> },
  { key: 'totalCost', label: 'Cost', w: 85, hint: 'Estimated LLM spend. $0 until model pricing is configured.', render: (t) => <span>{fmtUsd(t.totalCost)}</span> },
  { key: 'inputCost', label: 'In Cost', w: 85, render: (t) => <span>{fmtUsd(t.inputCost)}</span> },
  { key: 'outputCost', label: 'Out Cost', w: 85, render: (t) => <span>{fmtUsd(t.outputCost)}</span> },
  { key: 'errors', label: 'Errors', w: 60, hint: 'Number of ERROR-level observations in the trace.', render: (t) => <span style={{ color: (t.levelCounts?.ERROR || 0) > 0 ? 'var(--red)' : 'var(--text-secondary)' }}>{t.levelCounts?.ERROR || 0}</span> },
  { key: 'warnings', label: 'Warnings', w: 70, render: (t) => <span style={{ color: (t.levelCounts?.WARNING || 0) > 0 ? '#d97706' : 'var(--text-secondary)' }}>{t.levelCounts?.WARNING || 0}</span> },
];

const TRACE_MINWIDTH = gridMinWidth(TRACE_COLUMNS);

export const OBS_COLUMNS = [
  { key: 'time', label: 'Time', w: 80, render: (o) => <span>{fmtTimeShort(o.startTime)}</span> },
  { key: 'name', label: 'Observation', w: '1fr', render: (o, depth) => (
    <span style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: depth * 22, overflow: 'hidden' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: 10, flexShrink: 0 }}>{depth > 0 ? '└' : ''}</span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>{o.name || '(unnamed)'}</span>
    </span>
  ) },
  { key: 'type', label: 'Type', w: 90, render: (o) => <TypeBadge type={o.type} /> },
  { key: 'level', label: 'Level', w: 70, render: (o) => <LevelBadge level={o.level} /> },
  { key: 'model', label: 'Model', w: 130, render: (o) => <span title={o.modelId} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.modelId || (o.type === 'GENERATION' ? o.name : '—')}</span> },
  { key: 'latency', label: 'Duration', w: 80, render: (o) => <span>{fmtTimeShortToSec(o.latencySec)}</span> },
  { key: 'totalTokens', label: 'Tokens', w: 75, render: (o) => <span>{fmtNumber(o.totalTokens)}</span> },
  { key: 'inputTokens', label: 'In Tok', w: 75, render: (o) => <span>{fmtInt(o.inputTokens)}</span> },
  { key: 'outputTokens', label: 'Out Tok', w: 75, render: (o) => <span>{fmtInt(o.outputTokens)}</span> },
  { key: 'totalCost', label: 'Cost', w: 80, render: (o) => <span>{fmtUsd(o.totalCost)}</span> },
  { key: 'inputCost', label: 'In Cost', w: 75, render: (o) => <span>{fmtUsd(o.inputCost)}</span> },
  { key: 'outputCost', label: 'Out Cost', w: 75, render: (o) => <span>{fmtUsd(o.outputCost)}</span> },
  { key: 'input', label: 'Input', w: 140, hint: 'Observation input payload. Click to inspect.', render: (o, depth, ctx) => <PreviewCell value={o.input} onOpen={() => ctx.openContent && ctx.openContent(ioPayload(o))} /> },
  { key: 'output', label: 'Output', w: 140, hint: 'Observation output payload. Click to inspect.', render: (o, depth, ctx) => <PreviewCell value={o.output} onOpen={() => ctx.openContent && ctx.openContent(ioPayload(o))} /> },
  { key: 'metadata', label: 'Metadata', w: 110, hint: 'Observation metadata. Click to inspect.', render: (o, depth, ctx) => <PreviewCell value={o.metadata} onOpen={() => ctx.openContent && ctx.openContent(metadataPayload(o))} /> },
  { key: 'tags', label: 'Tags', w: 110, render: (o) => <TagChips tags={o.tags} /> },
  { key: 'status', label: 'Status', w: 130, render: (o) => <span title={o.statusMessage} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.statusMessage || '—'}</span> },
  { key: 'id', label: 'ID', w: 120, render: (o) => <span style={monoCell} title={o.id}>{o.id ? o.id.slice(0, 14) + '…' : '—'}</span> },
];

const OBS_MINWIDTH = gridMinWidth(OBS_COLUMNS);

function fmtTimeShortToSec(s) {
  if (s == null) return '—';
  return s >= 1 ? s.toFixed(2) + 's' : Math.round(s * 1000) + 'ms';
}

export function buildTree(observations) {
  const map = new Map();
  observations.forEach((o) => { map.set(o.id, { ...o, children: [] }); });
  const roots = [];
  observations.forEach((o) => {
    const node = map.get(o.id);
    if (o.parentObservationId && map.has(o.parentObservationId)) {
      map.get(o.parentObservationId).children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

export function ObservationRows({ nodes, depth = 0, onOpenContent }) {
  return nodes.map((node) => (
    <div key={node.id}>
      <div style={{
        display: 'grid', gridTemplateColumns: gridTemplate(OBS_COLUMNS), minWidth: OBS_MINWIDTH,
        alignItems: 'center', gap: 10, padding: '8px 12px', borderBottom: '1px solid var(--border-light)',
        fontSize: 12.5, color: 'var(--text-secondary)'
      }}>
        {OBS_COLUMNS.map((c, i) => (
          <span key={c.key || i} style={{ minWidth: 0 }}>{c.render(node, depth, { openContent: onOpenContent })}</span>
        ))}
      </div>
      {node.children.length > 0 && <ObservationRows nodes={node.children} depth={depth + 1} onOpenContent={onOpenContent} />}
    </div>
  ));
}

ObservationRows.propTypes = {
  nodes: PropTypes.array.isRequired,
  depth: PropTypes.number,
  onOpenContent: PropTypes.func,
};

export default function TracesTab({ range }) {
  const [traces, setTraces] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [cursorChain, setCursorChain] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [level, setLevel] = useState('');
  const [kind, setKind] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);
  const [extra, setExtra] = useState({ userId: '', sessionId: '', tags: '' });
  const [facets, setFacets] = useState({ userId: [], sessionId: [], tags: [] });
  const [expandedId, setExpandedId] = useState(null);
  const [detailCache, setDetailCache] = useState({});
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const { modal, open: openContent, close: closeContent } = useContentModal();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    let active = true;
    getObservabilityFacets({ fromTimestamp: range.fromTimestamp, toTimestamp: range.toTimestamp, entity: 'traces' })
      .then((f) => { if (active) setFacets({ userId: f.userId || [], sessionId: f.sessionId || [], tags: f.tags || [] }); })
      .catch(() => { if (active) setFacets({ userId: [], sessionId: [], tags: [] }); });
    return () => { active = false; };
  }, [range]);

  const fetchTraces = useCallback(async (targetPage, pageCursor) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getObservabilityTraces({
        fromTimestamp: range.fromTimestamp,
        toTimestamp: range.toTimestamp,
        limit,
        cursor: pageCursor || undefined,
        level: level || undefined,
        search: debouncedSearch || undefined,
        kind: kind || undefined,
        userId: extra.userId || undefined,
        sessionId: extra.sessionId || undefined,
        tags: extra.tags || undefined,
      });
      setTraces(res.data || []);
      setCursor(res.cursor || null);
      setPage(targetPage);
      setCursorChain((chain) => {
        const next = [...chain];
        next[targetPage - 1] = res.cursor || null;
        return next;
      });
    } catch (e) {
      setError(e.message || 'Failed to load traces');
      setTraces([]);
      setCursor(null);
    } finally {
      setLoading(false);
    }
  }, [range, limit, level, kind, debouncedSearch, extra]);

  useEffect(() => {
    setExpandedId(null);
    setPage(1);
    setCursorChain([]);
    fetchTraces(1, undefined);
  }, [fetchTraces]);

  const goToPage = (targetPage) => {
    if (targetPage < 1) return;
    const pageCursor = targetPage <= 1 ? undefined : cursorChain[targetPage - 2] || undefined;
    fetchTraces(targetPage, pageCursor);
  };

  const handleLimitChange = (nextLimit) => {
    setLimit(nextLimit);
    setPage(1);
    setCursorChain([]);
    setCursor(null);
    fetchTraces(1, undefined);
  };

  const toggleExpand = async (trace) => {
    setDetailError(null);
    if (expandedId === trace.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(trace.id);
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

  const hasFilters = debouncedSearch !== '' || level !== '' || kind !== '' || Object.values(extra).some(Boolean);

  const inputStyle = {
    padding: '9px 12px', background: 'white', border: '1px solid var(--border)',
    borderRadius: 10, fontSize: 13, color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <FiSearch size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search traces by name…"
              style={{
                width: 260, padding: '9px 12px 9px 36px', background: 'white',
                border: '1px solid var(--border)', borderRadius: 10, fontSize: 13,
                color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit'
              }}
            />
          </div>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            style={{
              padding: '9px 12px', background: 'white', border: '1px solid var(--border)',
              borderRadius: 10, fontSize: 13, color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit'
            }}
          >
            <option value="">All Levels</option>
            {LEVELS.filter(Boolean).map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            style={inputStyle}
          >
            {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
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
            {traces.length} trace{traces.length === 1 ? '' : 's'}
          </span>
          <button
            onClick={() => goToPage(page)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
              border: '1px solid var(--border)', borderRadius: 20, background: 'white',
              color: 'var(--text-secondary)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit'
            }}
          >
            <FiRefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
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
              {EXTRA_TRACE_FILTERS.map((f) => (
                <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{f.label}</label>
                  <select
                    value={extra[f.key]}
                    onChange={(e) => setExtra((x) => ({ ...x, [f.key]: e.target.value }))}
                    style={{ ...inputStyle, width: 180 }}
                  >
                    <option value="">All</option>
                    {(facets[f.facet] || []).map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              ))}
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

      {/* Table */}
      <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, overflowX: 'auto' }}>
        <HeaderRow columns={TRACE_COLUMNS} />

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 48, color: 'var(--text-muted)', fontSize: 13 }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ display: 'flex' }}
            >
              <FiLoader size={20} />
            </motion.div>
            Loading traces…
          </div>
        ) : traces.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13.5 }}>
            {hasFilters ? 'No traces match the current filters.' : 'No traces in this period. Run a workflow with LLM nodes to start collecting telemetry.'}
            {hasFilters && (
              <div style={{ marginTop: 12 }}>
                <button
                  onClick={() => { setSearchInput(''); setLevel(''); setKind(''); setExtra({ userId: '', sessionId: '', tags: '' }); }}
                  style={{ border: '1px solid var(--border)', background: 'white', color: 'var(--text-secondary)', borderRadius: 8, padding: '7px 16px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        ) : (
          traces.map((t) => {
            const expanded = expandedId === t.id;
            const detail = detailCache[t.traceId];
            return (
              <div key={t.id}>
                <div
                  onClick={() => toggleExpand(t)}
                  style={{
                    display: 'grid', gridTemplateColumns: gridTemplate(TRACE_COLUMNS), minWidth: TRACE_MINWIDTH,
                    alignItems: 'center', gap: 10, padding: '11px 16px', cursor: 'pointer',
                    borderBottom: '1px solid var(--border-light)', background: expanded ? '#faf9ff' : 'white',
                    fontSize: 12.5, transition: 'background 0.15s'
                  }}
                  onMouseEnter={(e) => { if (!expanded) e.currentTarget.style.background = '#f8fafc'; }}
                  onMouseLeave={(e) => { if (!expanded) e.currentTarget.style.background = 'white'; }}
                >
                  {TRACE_COLUMNS.map((c, i) => (
                    <span key={c.key || i} style={{ minWidth: 0 }}>{c.render(t, { expanded, openContent })}</span>
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
                      {detailLoading && !detail ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32, color: 'var(--text-muted)', fontSize: 12.5 }}>
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ display: 'flex' }}>
                            <FiLoader size={16} />
                          </motion.div>
                          Loading trace detail…
                        </div>
                      ) : detailError && !detail ? (
                        <div style={{ padding: 32, textAlign: 'center', color: 'var(--red)', fontSize: 12.5 }}>{detailError}</div>
                      ) : detail ? (
                        <div style={{ padding: '12px 16px 4px', overflowX: 'auto' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap', minWidth: 'max-content' }}>
                            <FiGitBranch size={14} color="var(--theme-primary)" />
                            <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Trace</span>
                            <span style={{ fontFamily: 'monospace' }}>{detail.traceId.slice(0, 18)}…</span>
                            <span>·</span>
                            <span>{detail.observationCount} observations</span>
                            <span>·</span>
                            <span>{fmtTime(detail.startTime)}</span>
                            {detail.tags && detail.tags.length > 0 && (
                              <>
                                <span>·</span>
                                <TagChips tags={detail.tags} />
                              </>
                            )}
                          </div>
                          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 10, overflowX: 'auto' }}>
                            <HeaderRow columns={OBS_COLUMNS} />
                            <ObservationRows nodes={buildTree(detail.observations)} onOpenContent={openContent} />
                          </div>
                        </div>
                      ) : null}
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
            hasNext={!!cursor}
            onPrev={() => goToPage(page - 1)}
            onNext={() => goToPage(page + 1)}
            limit={limit}
            onLimitChange={handleLimitChange}
            rangeText={`Showing ${traces.length} trace${traces.length === 1 ? '' : 's'}${cursor ? ' · more available' : ''}`}
          />
        )}
      </div>

      <ContentModal payload={modal} onClose={closeContent} />
    </div>
  );
}

TracesTab.propTypes = {
  range: PropTypes.shape({
    fromTimestamp: PropTypes.string.isRequired,
    toTimestamp: PropTypes.string.isRequired,
  }).isRequired,
};
