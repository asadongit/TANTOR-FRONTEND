import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiAlertTriangle, FiLoader, FiStar, FiCheckCircle, FiXCircle, FiMaximize2, FiFilter, FiSearch
} from 'react-icons/fi';
import { getObservabilityScores, getObservabilityFacets } from '../../../../api/agentmesh';
import {
  fmtTime, gridTemplate, gridMinWidth, HeaderRow, PaginationBar,
  PreviewCell, ContentModal, useContentModal, toText, monoCell
} from './observabilityShared';
import ScoreAnalytics from './ScoreAnalytics';

const DEFAULT_LIMIT = 50;

const DATA_TYPES = ['', 'NUMERIC', 'BOOLEAN', 'CORRECTION', 'CATEGORICAL', 'TEXT'];
const SOURCES = ['', 'ANNOTATION', 'API', 'EVAL'];

// Only filters backed by the backend `/facets` source (authorUserId, configId)
// are offered. traceName/traceId/observationId/sessionId have no facet source
// nor a backend query param, so they would be silently ignored.
const EXTRA_SCORE_FILTERS = [
  { key: 'authorUserId', label: 'Author User ID', facet: 'authorUserId' },
  { key: 'configId', label: 'Config ID', facet: 'configId' },
];

const VALUE_OPS = [
  { value: 'none', label: 'No value filter' },
  { value: 'eq', label: '= Equal to' },
  { value: 'gte', label: '≥ Greater than or equal' },
  { value: 'lte', label: '≤ Less than or equal' },
  { value: 'range', label: 'Range (between)' },
];

const DATA_TYPE_STYLE = {
  NUMERIC: { bg: '#EFF6FF', fg: '#2563EB' },
  BOOLEAN: { bg: '#F4F0FA', fg: '#8E77BB' },
  CORRECTION: { bg: '#FEF3C7', fg: '#D97706' },
  CATEGORICAL: { bg: '#F8FAFC', fg: '#64748B' },
  TEXT: { bg: '#ECFEFF', fg: '#0891B2' },
};

const SOURCE_STYLE = {
  ANNOTATION: { bg: '#F4F0FA', fg: '#8E77BB' },
  API: { bg: '#EFF6FF', fg: '#2563EB' },
  EVAL: { bg: '#ECFDF5', fg: '#059669' },
};

const sectionSize = (text) => (text ? `${text.length.toLocaleString()} chars` : 'empty');

const idPayload = (s, label, value) => ({
  title: label,
  subtitle: `${s.name || 'Score'} · ${fmtTime(s.timestamp)}`,
  copyText: value,
  sections: [{ label, text: value || '—', dark: true, size: sectionSize(value) }],
});

const commentPayload = (s) => {
  const text = s.comment ? String(s.comment) : '';
  return {
    title: s.name || 'Score',
    subtitle: 'Comment',
    copyText: text,
    sections: [{ label: 'Comment', text: text || '—', size: sectionSize(text) }],
  };
};

const metadataPayload = (s) => {
  const text = toText(s.metadata);
  return {
    title: s.name || 'Score',
    subtitle: 'Metadata',
    copyText: text,
    sections: [{ label: 'Metadata', text: text || '—', size: sectionSize(text) }],
  };
};

const valuePayload = (s) => {
  const text = toText(s.value);
  return {
    title: s.name || 'Score',
    subtitle: `Value · ${s.dataType || '—'}`,
    copyText: text,
    sections: [{ label: 'Value', text: text || '—', dark: true, size: sectionSize(text) }],
  };
};

function IdCell({ value, payload }) {
  if (!value) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  return (
    <span
      onClick={(e) => { e.stopPropagation(); payload(); }}
      title="Click to view full ID"
      style={{ ...monoCell, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
    >
      <FiMaximize2 size={11} style={{ flexShrink: 0, color: 'var(--text-muted)', opacity: 0.7 }} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value.slice(0, 18)}{value.length > 18 ? '…' : ''}</span>
    </span>
  );
}

IdCell.propTypes = {
  value: PropTypes.string,
  payload: PropTypes.func.isRequired,
};

const fmtNumeric = (v) => (typeof v === 'number' ? (Number.isInteger(v) ? v.toLocaleString() : v.toFixed(3).replace(/\.?0+$/, '')) : String(v ?? '—'));

function PillBadge({ label, style, icon: Icon }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px',
      borderRadius: 10, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', ...style
    }}>
      {Icon && <Icon size={10} />}
      {label}
    </span>
  );
}

PillBadge.propTypes = {
  label: PropTypes.string.isRequired,
  style: PropTypes.object,
  icon: PropTypes.elementType,
};

function looksLikeJson(text) {
  const t = text.trim();
  if (!t) return false;
  if (t[0] !== '{' && t[0] !== '[') return false;
  try {
    JSON.parse(t);
    return true;
  } catch {
    return false;
  }
}

function ScoreValue({ dataType, value, onOpen }) {
  if (dataType === 'BOOLEAN') {
    return value === true || value === 'true' ? (
      <PillBadge label="True" style={{ background: '#ecfdf5', color: '#059669' }} icon={FiCheckCircle} />
    ) : (
      <PillBadge label="False" style={{ background: '#fef2f2', color: '#ef4444' }} icon={FiXCircle} />
    );
  }
  if (dataType === 'NUMERIC') return <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{fmtNumeric(value)}</span>;
  const text = value == null ? '' : String(value);
  if (dataType !== 'NUMERIC' && dataType !== 'BOOLEAN' && looksLikeJson(text)) {
    return <PreviewCell value={value} dark onOpen={onOpen} />;
  }
  if (!text) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  const truncated = text.length > 80 ? text.slice(0, 80) + '…' : text;
  return <span title={text} style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: 320 }}>{truncated}</span>;
}

ScoreValue.propTypes = {
  dataType: PropTypes.string,
  value: PropTypes.any,
  onOpen: PropTypes.func,
};

const SCORE_COLUMNS = [
  {
    key: 'traceName',
    label: 'Trace Name',
    w: 220,
    hint: 'The workflow trace name evaluated by this score metric. Click to view in Traces tab.',
    render: (s, ctx) => (
      <span
        onClick={(e) => {
          if (s.traceId && ctx?.onSelectTrace) {
            e.stopPropagation();
            ctx.onSelectTrace(s.traceId);
          }
        }}
        title={s.traceName || (s.trace ? s.trace.name : '—')}
        style={{
          fontWeight: 600,
          color: s.traceId ? '#8E77BB' : 'var(--text-primary)',
          cursor: s.traceId ? 'pointer' : 'default',
          display: 'block',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: '100%',
        }}
      >
        {s.traceName || (s.trace ? s.trace.name : '—')}
      </span>
    )
  },
  {
    key: 'traceId',
    label: 'Trace',
    w: 150,
    hint: 'Unique ID of the trace evaluated. Click to open trace in Traces tab.',
    render: (s, ctx) => (
      <IdCell
        value={s.traceId}
        payload={() => {
          if (s.traceId && ctx?.onSelectTrace) {
            ctx.onSelectTrace(s.traceId);
          } else if (ctx?.openContent) {
            ctx.openContent(idPayload(s, 'Trace ID', s.traceId));
          }
        }}
      />
    )
  },
  { key: 'observationId', label: 'Observation', w: 160, hint: 'Specific internal sub-step ID evaluated by this score, if applicable.', render: (s, ctx) => <IdCell value={s.observationId} payload={() => ctx.openContent && ctx.openContent(idPayload(s, 'Observation ID', s.observationId))} /> },
  { key: 'experimentId', label: 'Experiment', w: 150, hint: 'Dataset benchmark or experiment ID attached to this score.', render: (s, ctx) => <IdCell value={s.experimentId} payload={() => ctx.openContent && ctx.openContent(idPayload(s, 'Experiment ID', s.experimentId))} /> },
  {
    key: 'authorUserId',
    label: 'User',
    w: 130,
    hint: 'User ID of the human evaluator or system process that created this score.',
    render: (s, ctx) => {
      const uid = s.authorUserId || s.userId;
      if (!uid) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
      return (
        <span
          onClick={(e) => {
            if (ctx?.onSelectUser) {
              e.stopPropagation();
              ctx.onSelectUser(uid);
            }
          }}
          title={`User: ${uid}. Click to view user sessions.`}
          style={{
            fontWeight: 600,
            color: ctx?.onSelectUser ? '#8E77BB' : 'var(--text-primary)',
            cursor: ctx?.onSelectUser ? 'pointer' : 'default',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            display: 'block',
            maxWidth: '100%',
          }}
        >
          {uid}
        </span>
      );
    }
  },
  { key: 'timestamp', label: 'Timestamp', w: 140, hint: 'Date and time when the score was evaluated.', render: (s) => <span>{fmtTime(s.timestamp)}</span> },
  { key: 'source', label: 'Source', w: 120, hint: 'Score origin: ANNOTATION (human reviewer), API (custom client code), or EVAL (automated AI evaluator).', render: (s) => (
    s.source ? <PillBadge label={s.source} style={SOURCE_STYLE[s.source] || SOURCE_STYLE.ANNOTATION} /> : '—'
  ) },
  { key: 'name', label: 'Name', w: 140, hint: 'Name of the metric evaluated (e.g. Accuracy, Tone, Groundedness, Toxicity).', render: (s) => <span style={{ fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name || '—'}</span> },
  { key: 'dataType', label: 'Data Type', w: 120, hint: 'Data type format of the score (NUMERIC, BOOLEAN, CATEGORICAL, TEXT, or CORRECTION).', render: (s) => (
    s.dataType ? <PillBadge label={s.dataType} style={DATA_TYPE_STYLE[s.dataType] || DATA_TYPE_STYLE.CATEGORICAL} /> : '—'
  ) },
  { key: 'value', label: 'Value', w: 170, hint: 'Actual score value assigned (e.g., numeric rating or True/False pass status). Click to inspect.', render: (s, ctx) => <ScoreValue dataType={s.dataType} value={s.value} onOpen={() => ctx.openContent && ctx.openContent(valuePayload(s))} /> },
  { key: 'metadata', label: 'Metadata', w: 140, hint: 'Additional metadata attributes associated with this evaluation score. Click to inspect.', render: (s, ctx) => <PreviewCell value={s.metadata} onOpen={() => ctx.openContent && ctx.openContent(metadataPayload(s))} /> },
  { key: 'comment', label: 'Comment', w: 170, hint: 'Free-text reviewer notes or feedback comments explaining the score. Click to inspect.', render: (s, ctx) => <PreviewCell value={s.comment} onOpen={() => ctx.openContent && ctx.openContent(commentPayload(s))} /> },
];

const SCORE_MINWIDTH = gridMinWidth(SCORE_COLUMNS);

export default function ScoresTab({ range, onSelectTrace, onSelectUser }) {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [truncated, setTruncated] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [cursorChain, setCursorChain] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [searchInput, setSearchInput] = useState('');
  const [name, setName] = useState('');
  const [dataType, setDataType] = useState('');
  const [source, setSource] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);
  const [extra, setExtra] = useState({ authorUserId: '', configId: '' });
  const [facets, setFacets] = useState({ authorUserId: [], configId: [] });
  const [valueOp, setValueOp] = useState('none');
  const [value1, setValue1] = useState('');
  const [value2, setValue2] = useState('');
  const [view, setView] = useState('analytics');
  const { modal, open: openContent, close: closeContent } = useContentModal();

  useEffect(() => {
    let active = true;
    getObservabilityFacets({ fromTimestamp: range?.fromTimestamp, toTimestamp: range?.toTimestamp, entity: 'scores' })
      .then((f) => { if (active) setFacets(f); })
      .catch(() => { if (active) setFacets({}); });
    return () => { active = false; };
  }, [range]);

  const fetchScores = useCallback(async (targetPage, pageCursor) => {
    setLoading(true);
    setError(null);
    try {
      const v1 = value1 === '' ? null : Number(value1);
      const v2 = value2 === '' ? null : Number(value2);
      const valueParams = {};
      if (valueOp === 'eq' && v1 != null) valueParams.value = v1;
      else if (valueOp === 'gte' && v1 != null) valueParams.valueMin = v1;
      else if (valueOp === 'lte' && v1 != null) valueParams.valueMax = v1;
      else if (valueOp === 'range' && v1 != null && v2 != null) { valueParams.valueMin = v1; valueParams.valueMax = v2; }
      const res = await getObservabilityScores({
        fromTimestamp: range?.fromTimestamp,
        toTimestamp: range?.toTimestamp,
        limit,
        cursor: pageCursor || undefined,
        name: name || undefined,
        dataType: dataType || undefined,
        source: source || undefined,
        authorUserId: extra.authorUserId || undefined,
        configId: extra.configId || undefined,
        ...valueParams,
      });
      setScores(res.data || []);
      setCursor(res.cursor || null);
      setTruncated(res.truncated || false);
      setPage(targetPage);
      setCursorChain((chain) => {
        const next = [...chain];
        next[targetPage - 1] = res.cursor || null;
        return next;
      });
    } catch (err) {
      setError(err.message || 'Failed to load scores');
    } finally {
      setLoading(false);
    }
  }, [range, limit, name, dataType, source, extra, valueOp, value1, value2]);

  useEffect(() => {
    setCursor(null);
    setCursorChain([]);
    setPage(1);
    fetchScores(1, undefined);
  }, [fetchScores]);

  const goToPage = (targetPage) => {
    if (targetPage < 1) return;
    const pageCursor = targetPage <= 1 ? undefined : cursorChain[targetPage - 2] || undefined;
    fetchScores(targetPage, pageCursor);
  };

  const handleLimitChange = (nextLimit) => {
    setLimit(nextLimit);
    setCursor(null);
    setCursorChain([]);
    setPage(1);
  };

  const clearFilters = () => {
    setName('');
    setDataType('');
    setSource('');
    setExtra({ authorUserId: '', configId: '' });
    setValueOp('none');
    setValue1('');
    setValue2('');
    setSearchInput('');
  };

  const hasFilters = name || dataType || source || Object.values(extra).some(Boolean) || valueOp !== 'none' || searchInput;

  const filtered = scores.filter((s) => {
    if (!searchInput.trim()) return true;
    const q = searchInput.toLowerCase().trim();
    const sName = (s.name || '').toLowerCase();
    const sId = (s.id || '').toLowerCase();
    const tId = (s.traceId || '').toLowerCase();
    const tName = (s.traceName || (s.trace ? s.trace.name : '')).toLowerCase();
    return sName.includes(q) || sId.includes(q) || tId.includes(q) || tName.includes(q);
  });

  const inputStyle = {
    padding: '8px 14px', background: '#FFFFFF', border: '1px solid #E5E7EB',
    borderRadius: 10, fontSize: 13, fontWeight: 500, color: '#111827', outline: 'none', fontFamily: 'inherit'
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, minHeight: 0 }}>
      {/* Sub-tabs: Analytics vs Table */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: 0, marginBottom: 0 }}>
        {[
          { key: 'analytics', label: 'Score Analytics' },
          { key: 'table', label: 'Scores Table' },
        ].map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setView(key)}
            style={{
              background: 'none', border: 'none', padding: '8px 2px 12px', fontSize: 13.5,
              fontWeight: view === key ? 700 : 600, color: view === key ? '#8E77BB' : '#64748B',
              cursor: 'pointer', position: 'relative', fontFamily: 'inherit', transition: 'all 0.15s ease'
            }}
          >
            {label}
            {view === key && (
              <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2.5, background: '#8E77BB', borderRadius: '3px 3px 0 0' }} />
            )}
          </button>
        ))}
      </div>

      {view === 'analytics' ? (
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: 4 }}>
          <ScoreAnalytics range={range} />
        </div>
      ) : (
        <>
      {/* Top filter toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flex: 1 }}>
          <div style={{ position: 'relative', width: 260 }}>
            <FiSearch size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input
              type="text"
              placeholder="Search scores by name or ID…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{ ...inputStyle, paddingLeft: 34, width: '100%' }}
            />
          </div>

          <select value={name} onChange={(e) => setName(e.target.value)} style={{ ...inputStyle, width: 150 }}>
            <option value="">All score names</option>
            {Array.from(new Set(scores.map((s) => s.name).filter(Boolean))).sort().map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>

          <select value={dataType} onChange={(e) => setDataType(e.target.value)} style={{ ...inputStyle, width: 140 }}>
            <option value="">All data types</option>
            {DATA_TYPES.filter(Boolean).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select value={source} onChange={(e) => setSource(e.target.value)} style={{ ...inputStyle, width: 130 }}>
            <option value="">All sources</option>
            {SOURCES.filter(Boolean).map((so) => (
              <option key={so} value={so}>{so}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setMoreOpen((o) => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
              border: `1px solid ${moreOpen ? '#8E77BB' : '#E2E8F0'}`, borderRadius: 10,
              background: moreOpen ? '#F4F0FA' : '#FFFFFF', color: moreOpen ? '#8E77BB' : '#374151',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
            }}
          >
            <FiFilter size={14} />
            Filters
            {hasFilters && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444' }} />}
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
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap', padding: '12px 16px', background: '#faf9ff', border: '1px solid #E2E8F0', borderRadius: 12 }}>
              {EXTRA_SCORE_FILTERS.map((f) => (
                <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{f.label}</label>
                  <select
                    value={extra[f.key] || ''}
                    onChange={(e) => setExtra((x) => ({ ...x, [f.key]: e.target.value }))}
                    style={{ ...inputStyle, width: 170 }}
                  >
                    <option value="">All</option>
                    {(facets[f.facet] || []).map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              ))}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Value</label>
                <select value={valueOp} onChange={(e) => setValueOp(e.target.value)} style={{ ...inputStyle, width: 170 }}>
                  {VALUE_OPS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              {valueOp !== 'none' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {valueOp === 'range' ? 'Min' : 'Value'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={value1}
                    onChange={(e) => setValue1(e.target.value)}
                    placeholder="e.g. 0.5"
                    style={{ ...inputStyle, width: 120 }}
                  />
                </div>
              )}
              {valueOp === 'range' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Max</label>
                  <input
                    type="number"
                    step="any"
                    value={value2}
                    onChange={(e) => setValue2(e.target.value)}
                    placeholder="e.g. 1"
                    style={{ ...inputStyle, width: 120 }}
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div style={{
          background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: 12,
          padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10,
          color: '#E11D48', fontSize: 13, fontWeight: 500
        }}>
          <FiAlertTriangle size={16} />
          {error}
        </div>
      )}

      {truncated && (
        <div style={{
          background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12,
          padding: '10px 16px', color: '#B45309', fontSize: 12.5, fontWeight: 500
        }}>
          This page is full — use Next to keep browsing older scores.
        </div>
      )}

      {/* Table Card */}
      <div style={{ flex: 1, minHeight: 0, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, minHeight: 0, overflowX: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ minWidth: SCORE_MINWIDTH, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <HeaderRow columns={SCORE_COLUMNS} />

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
                  Loading scores…
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', textAlign: 'center', color: '#64748B', fontSize: 13.5 }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#F1F5F9', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <FiStar size={26} />
                  </div>
                  <div style={{ maxWidth: 460, color: '#475569', fontWeight: 500, lineHeight: 1.5 }}>
                    {hasFilters ? 'No scores match the current filters.' : 'No scores in this period. Scores appear when workflows emit evaluations or annotations.'}
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
                filtered.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      display: 'grid', gridTemplateColumns: gridTemplate(SCORE_COLUMNS), minWidth: SCORE_MINWIDTH,
                      alignItems: 'center', gap: 10, padding: '11px 16px',
                      borderBottom: '1px solid #F1F5F9', fontSize: 12.5,
                      color: '#334155', background: '#FFFFFF', transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; }}
                  >
                    {SCORE_COLUMNS.map((c, i) => (
                      <span key={c.key || i} style={{ minWidth: 0 }}>{c.render(s, { openContent, onSelectTrace, onSelectUser })}</span>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {!loading && (
          <PaginationBar
            page={page}
            hasNext={!!cursor}
            onPrev={() => goToPage(page - 1)}
            onNext={() => goToPage(page + 1)}
            limit={limit}
            onLimitChange={handleLimitChange}
            pageOptions={[25, 50, 100]}
            rangeText={`Showing ${filtered.length} score${filtered.length === 1 ? '' : 's'}${cursor ? ' · more available' : ''}`}
          />
        )}
      </div>

      <ContentModal payload={modal} onClose={closeContent} />
        </>
      )}
    </div>
  );
}

ScoresTab.propTypes = {
  range: PropTypes.shape({
    fromTimestamp: PropTypes.string.isRequired,
    toTimestamp: PropTypes.string.isRequired,
  }).isRequired,
  onSelectTrace: PropTypes.func,
  onSelectUser: PropTypes.func,
};
