import PropTypes from 'prop-types';
import { FiClock } from 'react-icons/fi';
import { InfoTooltip } from './observabilityShared';

const SCROLL_MAX_HEIGHT = 320;

const fmtLatency = (s) => (s == null ? '—' : s.toFixed(2) + 's');

const CARD_META = {
  trace: {
    title: 'Trace Latency Percentiles',
    hint: 'Measures total response time of entire AI workflows from start to finish. P50 is the median speed, P95 is the speed 95% of runs achieved, and P99 captures slow outlier runs.',
  },
  generation: {
    title: 'Generation Latency Percentiles',
    hint: 'Response times specifically for AI Model prompt generations (e.g. OpenAI or Claude calls), grouped by generation name.',
  },
  observation: {
    title: 'Observation Latency Percentiles',
    hint: 'Response times for all internal workflow steps (including tool calls, data retrievals, and model generations).',
  },
};

const PCOLUMNS = [
  { key: 'p50', label: 'P50', hint: 'Median speed (50% of runs were faster than this time)' },
  { key: 'p90', label: 'P90', hint: '90% of runs finished within this time' },
  { key: 'p95', label: 'P95', hint: '95% of runs finished within this time (standard performance SLA)' },
  { key: 'p99', label: 'P99', hint: '99% of runs finished within this time (worst 1% tail latency)' },
];

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
          {PCOLUMNS.map((c) => (
            <span key={c.key} style={{ textAlign: 'right', display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3 }}>
              {c.label}
              <InfoTooltip text={c.hint} align="right" />
            </span>
          ))}
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
                  <span key={c.key} style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 500, color: '#475569' }}>{fmtLatency(row[c.key])}</span>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <LatencyCard meta={CARD_META.trace} rows={trace} showType={false} />
        <LatencyCard meta={CARD_META.generation} rows={generation} showType={false} />
      </div>
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
