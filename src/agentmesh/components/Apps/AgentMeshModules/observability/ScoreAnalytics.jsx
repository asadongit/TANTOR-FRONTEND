import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { FiBarChart2, FiLoader, FiAlertTriangle } from 'react-icons/fi';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { getObservabilityScoreMetrics } from '../../../../api/agentmesh';
import { InfoTooltip, fmtNumber } from './observabilityShared';

const DATA_TYPES = ['', 'NUMERIC', 'BOOLEAN', 'CATEGORICAL'];
const SOURCES = ['', 'API', 'ANNOTATION', 'EVAL'];
const TREND_LIMIT = 8;

const tooltipStyle = {
  background: '#0F172A',
  border: 'none',
  borderRadius: 10,
  padding: '10px 14px',
  fontSize: 12,
  color: '#F8FAFC',
  boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.3)',
};

const LINE_COLORS = ['#8E77BB', '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#06B6D4', '#8B5CF6', '#EC4899'];

const fmtValue = (v) => (typeof v === 'number' ? (Number.isInteger(v) ? v.toLocaleString() : v.toFixed(3).replace(/\.?0+$/, '')) : '—');

function fmtDay(iso) {
  if (!iso) return '—';
  return iso.slice(0, 10);
}

export default function ScoreAnalytics({ range }) {
  const [dataType, setDataType] = useState('');
  const [source, setSource] = useState('');
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getObservabilityScoreMetrics({
        fromTimestamp: range?.fromTimestamp,
        toTimestamp: range?.toTimestamp,
        granularity: 'day',
        limit: TREND_LIMIT,
        dataType: dataType || undefined,
        source: source || undefined,
      });
      setSummary(res.summary || []);
      setTrend(res.trend || []);
    } catch (err) {
      setError(err.message || 'Failed to load score analytics');
      setSummary([]);
      setTrend([]);
    } finally {
      setLoading(false);
    }
  }, [range, dataType, source]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Build chart data: one row per day, one column per score name (avg value).
  const byName = {};
  trend.forEach((t) => {
    if (!byName[t.name]) byName[t.name] = {};
    byName[t.name][t.time || ''] = t.avgValue;
  });
  const days = Array.from(new Set(trend.map((t) => t.time || '').filter(Boolean))).sort();
  const chartNames = (summary || []).slice(0, TREND_LIMIT).map((s) => s.name);
  const chartData = days.map((day) => {
    const row = { time: fmtDay(day) };
    chartNames.forEach((n) => { row[n] = byName[n]?.[day] ?? null; });
    return row;
  });

  const inputStyle = {
    padding: '8px 14px', background: '#FFFFFF', border: '1px solid #E5E7EB',
    borderRadius: 10, fontSize: 13, fontWeight: 500, color: '#111827', outline: 'none', fontFamily: 'inherit'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: '#F4F0FA', color: '#8E77BB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiBarChart2 size={16} />
          </div>
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em' }}>Score Analytics</div>
            <div style={{ fontSize: 12, color: '#64748B' }}>Average value, true-rate and volume per evaluation score</div>
          </div>
          <InfoTooltip text="Aggregates from Langfuse Metrics v2 score views. For BOOLEAN scores the average value equals the true-rate (fraction of 1s). Categorical scores only show counts." />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <select value={dataType} onChange={(e) => setDataType(e.target.value)} style={{ ...inputStyle, width: 150 }}>
            {DATA_TYPES.map((d) => <option key={d} value={d}>{d || 'All data types'}</option>)}
          </select>
          <select value={source} onChange={(e) => setSource(e.target.value)} style={{ ...inputStyle, width: 140 }}>
            {SOURCES.map((s) => <option key={s} value={s}>{s || 'All sources'}</option>)}
          </select>
        </div>
      </div>

      {error && (
        <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, color: '#E11D48', fontSize: 13, fontWeight: 500 }}>
          <FiAlertTriangle size={16} />
          {error}
        </div>
      )}

      {loading && summary === null ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32, color: '#64748B', fontSize: 13 }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ display: 'flex' }}>
            <FiLoader size={18} />
          </motion.div>
          Loading score analytics…
        </div>
      ) : summary.length === 0 ? (
        <div style={{ padding: '28px 24px', textAlign: 'center', color: '#64748B', fontSize: 13 }}>
          No scores in this period{dataType ? ` for ${dataType}` : ''}. Scores appear when workflows emit evaluations or annotations.
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 12 }}>
            {summary.map((s) => (
              <div key={s.name} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 16px', boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={s.name}>{s.name}</span>
                  <InfoTooltip text={`${fmtNumber(s.count)} score(s) in period.`} />
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 22, fontWeight: 700, color: '#8E77BB', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                    {typeof s.avgValue === 'number' ? fmtValue(s.avgValue) : '—'}
                  </span>
                  <span style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>{typeof s.avgValue === 'number' ? 'avg' : 'count only'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, fontSize: 11.5, color: '#64748B' }}>
                  <span>{fmtNumber(s.count)} scores</span>
                  {typeof s.minValue === 'number' && typeof s.maxValue === 'number' && (
                    <span>min {fmtValue(s.minValue)} · max {fmtValue(s.maxValue)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Trend chart */}
          {chartData.length > 0 && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '18px 20px 10px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em' }}>Score Trend</div>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Daily average value per score name</div>
                </div>
                <InfoTooltip text="Daily average score value (true-rate for boolean scores). Lines are the top score names by count." />
              </div>
              <div style={{ height: 260, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="#E2E8F0" vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} width={44} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => [fmtValue(v), 'avg']} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />
                    {chartNames.map((n, i) => (
                      <Line key={n} type="monotone" dataKey={n} name={n} stroke={LINE_COLORS[i % LINE_COLORS.length]} strokeWidth={2.5} dot={false} connectNulls />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

ScoreAnalytics.propTypes = {
  range: PropTypes.shape({
    fromTimestamp: PropTypes.string.isRequired,
    toTimestamp: PropTypes.string.isRequired,
  }).isRequired,
};
