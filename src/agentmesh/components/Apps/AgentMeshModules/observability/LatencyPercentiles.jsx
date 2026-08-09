import PropTypes from 'prop-types';
import { FiClock } from 'react-icons/fi';
import { InfoTooltip } from './observabilityShared';

const SCROLL_MAX_HEIGHT = 320;

const fmtLatency = (s) => (s == null ? '—' : s.toFixed(2) + 's');

const CARD_META = {
  trace: {
    title: 'Trace Latency Percentiles',
    hint: 'Total duration of each trace (earliest start to latest end across its observations), grouped by trace name. Traces are named after their newest root observation.',
  },
  generation: {
    title: 'Generation Latency Percentiles',
    hint: 'Latency of LLM generation calls grouped by generation name.',
  },
  observation: {
    title: 'Observation Latency Percentiles',
    hint: 'Latency of every observation grouped by observation type and name.',
  },
};

const PCOLUMNS = ['p50', 'p90', 'p95', 'p99'];

function LatencyCard({ meta, rows, showType }) {
  const headerTemplate = showType ? '84px 1fr 52px 52px 52px 52px' : '1fr 52px 52px 52px 52px';

  return (
    <div style={{
      background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14,
      padding: '18px 18px 14px', display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0,
      boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#F4F0FA', color: '#8E77BB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiClock size={15} />
          </div>
          {meta.title}
        </div>
        <InfoTooltip text={meta.hint} />
      </div>

      <div style={{ border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: headerTemplate, alignItems: 'center', gap: 12,
          padding: '9px 12px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0',
          fontSize: 10.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0
        }}>
          {showType && <span>Type</span>}
          <span>Name</span>
          {PCOLUMNS.map((c) => <span key={c} style={{ textAlign: 'right' }}>{c}</span>)}
        </div>

        {rows.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#64748B', fontSize: 12.5 }}>
            No latency data in this period.
          </div>
        ) : (
          <div style={{ maxHeight: SCROLL_MAX_HEIGHT, overflowY: 'auto' }}>
            {rows.map((row, idx) => (
              <div
                key={`${row.type || ''}-${row.name}`}
                style={{
                  display: 'grid', gridTemplateColumns: headerTemplate, alignItems: 'center', gap: 12,
                  padding: '9px 12px', borderBottom: idx < rows.length - 1 ? '1px solid #F1F5F9' : 'none',
                  fontSize: 12, color: '#334155', transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                {showType && <span style={{ minWidth: 0, overflow: 'hidden' }}><TypeBadge type={row.type} /></span>}
                <span style={{ minWidth: 0, fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.name}>
                  {row.name}
                </span>
                {PCOLUMNS.map((c) => (
                  <span key={c} style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 500, color: '#475569' }}>{fmtLatency(row[c])}</span>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

LatencyCard.propTypes = {
  meta: PropTypes.shape({
    title: PropTypes.string.isRequired,
    hint: PropTypes.string.isRequired,
  }).isRequired,
  rows: PropTypes.array.isRequired,
  showType: PropTypes.bool,
};

const TYPE_STYLE = {
  SPAN: { bg: '#F5F3FF', fg: '#7C3AED' },
  GENERATION: { bg: '#EFF6FF', fg: '#2563EB' },
  CHAIN: { bg: '#ECFDF5', fg: '#059669' },
  EVENT: { bg: '#F8FAFC', fg: '#64748B' },
  AGENT: { bg: '#FEF3C7', fg: '#D97706' },
};

function TypeBadge({ type }) {
  const s = TYPE_STYLE[type] || TYPE_STYLE.EVENT;
  return (
    <span style={{
      display: 'inline-flex', padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
      background: s.bg, color: s.fg, whiteSpace: 'nowrap', maxWidth: '100%',
      overflow: 'hidden', textOverflow: 'ellipsis', verticalAlign: 'middle'
    }}>
      {type || 'SPAN'}
    </span>
  );
}

TypeBadge.propTypes = { type: PropTypes.string };

export default function LatencyPercentiles({ data }) {
  if (!data) return null;
  const { trace = [], generation = [], observation = [] } = data;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
      <LatencyCard meta={CARD_META.trace} rows={trace} showType={false} />
      <LatencyCard meta={CARD_META.generation} rows={generation} showType={false} />
      <LatencyCard meta={CARD_META.observation} rows={observation} showType />
    </div>
  );
}

LatencyPercentiles.propTypes = {
  data: PropTypes.shape({
    trace: PropTypes.array,
    generation: PropTypes.array,
    observation: PropTypes.array,
  }),
};
