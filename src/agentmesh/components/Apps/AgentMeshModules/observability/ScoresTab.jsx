import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiRefreshCw, FiAlertTriangle, FiLoader, FiStar, FiCheckCircle, FiXCircle, FiMaximize2, FiFilter
} from 'react-icons/fi';
import { getObservabilityScores, getObservabilityFacets } from '../../../../api/agentmesh';
import {
  fmtTime, gridTemplate, gridMinWidth, HeaderRow, PaginationBar,
  PreviewCell, ContentModal, useContentModal, toText, monoCell
} from './observabilityShared';

const DEFAULT_LIMIT = 50;

const DATA_TYPES = ['', 'NUMERIC', 'BOOLEAN', 'CORRECTION', 'CATEGORICAL', 'TEXT'];
const SOURCES = ['', 'ANNOTATION', 'API', 'EVAL'];

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
  NUMERIC: { bg: '#eff6ff', fg: '#3b82f6' },
  BOOLEAN: { bg: '#f5f3ff', fg: '#8e78b7' },
  CORRECTION: { bg: '#fffbeb', fg: '#f0a500' },
  CATEGORICAL: { bg: '#f8fafc', fg: '#64748b' },
  TEXT: { bg: '#ecfeff', fg: '#0891b2' },
};

const SOURCE_STYLE = {
  ANNOTATION: { bg: '#f5f3ff', fg: '#8e78b7' },
  API: { bg: '#eff6ff', fg: '#3b82f6' },
  EVAL: { bg: '#ecfdf5', fg: '#059669' },
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
  { key: 'timestamp', label: 'Timestamp', w: 140, render: (s) => <span>{fmtTime(s.timestamp)}</span> },
  { key: 'name', label: 'Name', w: 150, render: (s) => <span style={{ fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name || '—'}</span> },
  { key: 'value', label: 'Value', w: 170, hint: 'The score value. NUMERIC = score or pass/fail on a scale; BOOLEAN = true/false; CORRECTION = edited text; CATEGORICAL = a label. JSON values can be inspected on click.', render: (s, ctx) => <ScoreValue dataType={s.dataType} value={s.value} onOpen={() => ctx.openContent && ctx.openContent(valuePayload(s))} /> },
  { key: 'dataType', label: 'Data Type', w: 120, hint: 'The type of the score value recorded in Langfuse.', render: (s) => (
    s.dataType ? <PillBadge label={s.dataType} style={DATA_TYPE_STYLE[s.dataType] || DATA_TYPE_STYLE.CATEGORICAL} /> : '—'
  ) },
  { key: 'source', label: 'Source', w: 120, hint: 'Where the score came from — a manual annotation, an API result, or an automated evaluation.', render: (s) => (
    s.source ? <PillBadge label={s.source} style={SOURCE_STYLE[s.source] || SOURCE_STYLE.ANNOTATION} /> : '—'
  ) },
  { key: 'environment', label: 'Environment', w: 110, render: (s) => <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.environment || '—'}</span> },
  { key: 'metadata', label: 'Metadata', w: 140, hint: 'Score metadata key-value pairs. Click to inspect.', render: (s, ctx) => <PreviewCell value={s.metadata} onOpen={() => ctx.openContent && ctx.openContent(metadataPayload(s))} /> },
  { key: 'traceId', label: 'Trace ID', w: 150, hint: 'The trace this score is attached to. Click to view the full ID.', render: (s, ctx) => <IdCell value={s.traceId} payload={() => ctx.openContent && ctx.openContent(idPayload(s, 'Trace ID', s.traceId))} /> },
  { key: 'observationId', label: 'Observation ID', w: 160, hint: 'The observation this score is attached to, if any. Click to view the full ID.', render: (s, ctx) => <IdCell value={s.observationId} payload={() => ctx.openContent && ctx.openContent(idPayload(s, 'Observation ID', s.observationId))} /> },
  { key: 'sessionId', label: 'Session ID', w: 140, hint: 'The session this score belongs to, if any. Click to view the full ID.', render: (s, ctx) => <IdCell value={s.sessionId} payload={() => ctx.openContent && ctx.openContent(idPayload(s, 'Session ID', s.sessionId))} /> },
  { key: 'authorUserId', label: 'Author User ID', w: 120, hint: 'The user who created this score (annotations).', render: (s) => <span title={s.authorUserId} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.authorUserId || '—'}</span> },
  { key: 'comment', label: 'Comment', w: 170, hint: 'Free-text comment left with the score. Click to inspect.', render: (s, ctx) => <PreviewCell value={s.comment} onOpen={() => ctx.openContent && ctx.openContent(commentPayload(s))} /> },
  { key: 'id', label: 'ID', w: 130, render: (s, ctx) => <IdCell value={s.id} payload={() => ctx.openContent && ctx.openContent(idPayload(s, 'Score ID', s.id))} /> },
  { key: 'createdAt', label: 'Created At', w: 140, render: (s) => <span>{fmtTime(s.createdAt)}</span> },
];

const SCORE_MINWIDTH = gridMinWidth(SCORE_COLUMNS);

export default function ScoresTab({ range }) {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [truncated, setTruncated] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [cursorChain, setCursorChain] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [name, setName] = useState('');
  const [dataType, setDataType] = useState('');
  const [source, setSource] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);
  const [extra, setExtra] = useState({ authorUserId: '', configId: '' });
  const [facets, setFacets] = useState({ authorUserId: [], configId: [] });
  const [valueOp, setValueOp] = useState('none');
  const [value1, setValue1] = useState('');
  const [value2, setValue2] = useState('');
  const { modal, open: openContent, close: closeContent } = useContentModal();

  useEffect(() => {
    let active = true;
    getObservabilityFacets({ fromTimestamp: range.fromTimestamp, toTimestamp: range.toTimestamp, entity: 'scores' })
      .then((f) => { if (active) setFacets({ authorUserId: f.authorUserId || [], configId: f.configId || [] }); })
      .catch(() => { if (active) setFacets({ authorUserId: [], configId: [] }); });
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
        fromTimestamp: range.fromTimestamp,
        toTimestamp: range.toTimestamp,
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
    } catch (e) {
      setError(e.message || 'Failed to load scores');
      setScores([]);
      setCursor(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [range, limit, name, dataType, source, extra, valueOp, value1, value2]);

  useEffect(() => {
    setPage(1);
    setCursorChain([]);
    fetchScores(1, undefined);
  }, [fetchScores]);

  const goToPage = (targetPage) => {
    if (targetPage < 1) return;
    const pageCursor = targetPage <= 1 ? undefined : cursorChain[targetPage - 2] || undefined;
    fetchScores(targetPage, pageCursor);
  };

  const handleLimitChange = (nextLimit) => {
    setLimit(nextLimit);
    setPage(1);
    setCursorChain([]);
    setCursor(null);
    fetchScores(1, undefined);
  };

  const names = [...new Set(scores.map((s) => s.name).filter(Boolean))].sort();

  const filtered = scores.filter((s) => {
    if (name && s.name !== name) return false;
    if (dataType && s.dataType !== dataType) return false;
    if (source && s.source !== source) return false;
    return true;
  });

  const valueActive = valueOp !== 'none' && value1 !== '';

  const hasFilters = name !== '' || dataType !== '' || source !== '' || Object.values(extra).some(Boolean) || valueActive;

  const selectClass = {
    padding: '9px 12px', background: 'white', border: '1px solid var(--border)',
    borderRadius: 10, fontSize: 13, color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit'
  };

  const inputStyle = selectClass;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <select value={name} onChange={(e) => setName(e.target.value)} style={{ ...selectClass, minWidth: 160 }}>
            <option value="">All names</option>
            {names.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <select value={dataType} onChange={(e) => setDataType(e.target.value)} style={selectClass}>
            <option value="">All data types</option>
            {DATA_TYPES.filter(Boolean).map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={source} onChange={(e) => setSource(e.target.value)} style={selectClass}>
            <option value="">All sources</option>
            {SOURCES.filter(Boolean).map((s) => <option key={s} value={s}>{s}</option>)}
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
            {filtered.length} score{filtered.length === 1 ? '' : 's'}
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
              {EXTRA_SCORE_FILTERS.map((f) => (
                <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{f.label}</label>
                  <select
                    value={extra[f.key]}
                    onChange={(e) => setExtra((x) => ({ ...x, [f.key]: e.target.value }))}
                    style={{ ...inputStyle, width: 170 }}
                  >
                    <option value="">All</option>
                    {(facets[f.facet] || []).map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              ))}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Value</label>
                <select value={valueOp} onChange={(e) => setValueOp(e.target.value)} style={{ ...inputStyle, width: 170 }}>
                  {VALUE_OPS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              {valueOp !== 'none' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
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
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Max</label>
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
          This page is full — use Next to keep browsing older scores.
        </div>
      )}

      {/* Table */}
      <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <HeaderRow columns={SCORE_COLUMNS} />
          {loading ? (
            <div style={{ minWidth: SCORE_MINWIDTH, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 48, color: 'var(--text-muted)', fontSize: 13 }}>
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
            <div style={{ minWidth: SCORE_MINWIDTH, padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13.5 }}>
              <FiStar size={34} style={{ marginBottom: 10, opacity: 0.35 }} />
              <div>{hasFilters ? 'No scores match the current filters.' : 'No scores in this period. Scores appear when workflows emit evaluations or annotations.'}</div>
              {hasFilters && (
                <div style={{ marginTop: 12 }}>
                  <button
                    onClick={() => { setName(''); setDataType(''); setSource(''); setExtra({ authorUserId: '', configId: '' }); setValueOp('none'); setValue1(''); setValue2(''); }}
                    style={{ border: '1px solid var(--border)', background: 'white', color: 'var(--text-secondary)', borderRadius: 8, padding: '7px 16px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
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
                  borderBottom: '1px solid var(--border-light)', fontSize: 12.5,
                  color: 'var(--text-secondary)', background: 'white', transition: 'background 0.15s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
              >
                {SCORE_COLUMNS.map((c, i) => (
                  <span key={c.key || i} style={{ minWidth: 0 }}>{c.render(s, { openContent })}</span>
                ))}
              </div>
            ))
          )}

          {!loading && (
            <PaginationBar
              page={page}
              hasNext={!!cursor}
              onPrev={() => goToPage(page - 1)}
              onNext={() => goToPage(page + 1)}
              limit={limit}
              onLimitChange={handleLimitChange}
              rangeText={`Showing ${filtered.length} score${filtered.length === 1 ? '' : 's'}${cursor ? ' · more available' : ''}`}
            />
          )}
        </div>
      </div>

      <ContentModal payload={modal} onClose={closeContent} />
    </div>
  );
}

ScoresTab.propTypes = {
  range: PropTypes.shape({
    fromTimestamp: PropTypes.string.isRequired,
    toTimestamp: PropTypes.string.isRequired,
  }).isRequired,
};
