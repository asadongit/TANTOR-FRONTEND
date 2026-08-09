import { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { FiActivity, FiLoader, FiAlertTriangle, FiCheck } from 'react-icons/fi';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { getObservabilityModelLatency } from '../../../../api/agentmesh';
import { InfoTooltip } from './observabilityShared';

const PERCENTILES = [
  { key: 'p50', label: '50th Percentile' },
  { key: 'p75', label: '75th Percentile' },
  { key: 'p90', label: '90th Percentile' },
  { key: 'p95', label: '95th Percentile' },
  { key: 'p99', label: '99th Percentile' },
];

const LINE_COLORS = ['#8E77BB', '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#06B6D4', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

const tooltipStyle = {
  background: '#0F172A',
  border: 'none',
  borderRadius: 10,
  padding: '10px 14px',
  fontSize: 12,
  color: '#F8FAFC',
  boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.3)',
};

const fmtLatency = (ms) => {
  if (ms == null) return '—';
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${Math.round(ms)}ms`;
};

const fmtDay = (iso) => (iso ? iso.slice(0, 10) : '—');

function ModelFilterDropdown({ models, selected, setSelected }) {
  const [open, setOpen] = useState(false);

  const toggle = (m) => {
    if (m === '__all__') {
      setSelected(selected.length === models.length ? [] : [...models]);
    } else {
      setSelected((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
    }
  };

  const isAll = selected.length === models.length;

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
          border: '1px solid #E5E7EB', borderRadius: 10, background: '#FFFFFF',
          color: '#111827', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          fontFamily: 'inherit', transition: 'all 0.2s ease', maxWidth: 260,
        }}
      >
        <FiActivity size={14} color="#8E77BB" />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {isAll ? 'All models' : selected.length === 1 ? selected[0] : `${selected.length} models`}
        </span>
        <span style={{ fontSize: 10, color: '#64748B' }}>▾</span>
      </button>

      {open && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
            onClick={() => setOpen(false)}
          />
          <div style={{
            position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 50,
            minWidth: 240, maxWidth: 320, background: '#FFFFFF', border: '1px solid #E2E8F0',
            borderRadius: 12, boxShadow: '0 16px 40px -12px rgba(15, 23, 42, 0.25)',
            padding: 8, display: 'flex', flexDirection: 'column', gap: 2,
          }}>
            <button
              type="button"
              onClick={() => toggle('__all__')}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                border: 'none', background: 'none', borderRadius: 8, fontSize: 13,
                fontWeight: 600, color: '#0F172A', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
              }}
            >
              <span style={{ width: 16, display: 'flex', justifyContent: 'center' }}>
                {isAll && <FiCheck size={14} color="#8E77BB" />}
              </span>
              All models
            </button>
            <div style={{ height: 1, background: '#F1F5F9', margin: '4px 0' }} />
            {models.map((m) => {
              const active = selected.includes(m);
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => toggle(m)}
                  title={m}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                    border: 'none', background: active ? '#F8F6FC' : 'none', borderRadius: 8,
                    fontSize: 12.5, fontWeight: active ? 600 : 500, color: '#334155',
                    cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                  }}
                >
                  <span style={{ width: 16, display: 'flex', justifyContent: 'center' }}>
                    {active && <FiCheck size={14} color="#8E77BB" />}
                  </span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

ModelFilterDropdown.propTypes = {
  models: PropTypes.arrayOf(PropTypes.string).isRequired,
  selected: PropTypes.arrayOf(PropTypes.string).isRequired,
  setSelected: PropTypes.func.isRequired,
};

export default function ModelLatencyChart({ range }) {
  const [activePercentile, setActivePercentile] = useState('p95');
  const [series, setSeries] = useState([]);
  const [allModels, setAllModels] = useState([]);
  const [selectedModels, setSelectedModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getObservabilityModelLatency({
        fromTimestamp: range.fromTimestamp,
        toTimestamp: range.toTimestamp,
        granularity: 'day',
        limit: 20,
      });
      const models = res.models || [];
      const seriesList = res.series || [];
      setAllModels(models);
      setSelectedModels((prev) => (prev.length ? prev.filter((m) => models.includes(m)) : [...models]));
      setSeries(seriesList);
    } catch (err) {
      setError(err.message || 'Failed to load model latency data');
      setAllModels([]);
      setSelectedModels([]);
      setSeries([]);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const colorFor = useMemo(() => {
    const map = {};
    allModels.forEach((m, i) => { map[m] = LINE_COLORS[i % LINE_COLORS.length]; });
    return map;
  }, [allModels]);

  // Build one row per day, one column per selected model (latency in ms).
  const chartData = useMemo(() => {
    const byDay = {};
    series.forEach((s) => {
      if (!selectedModels.includes(s.model)) return;
      (s.points || []).forEach((p) => {
        if (!byDay[p.time]) byDay[p.time] = { time: p.time };
        byDay[p.time][s.model] = p[activePercentile];
      });
    });
    return Object.keys(byDay)
      .sort()
      .map((t) => ({ ...byDay[t], time: fmtDay(t) }));
  }, [series, selectedModels, activePercentile]);

  const hasData = chartData.length > 0 && selectedModels.length > 0;

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '20px 22px 14px', display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: '#F4F0FA', color: '#8E77BB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiActivity size={16} />
          </div>
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em' }}>Model latencies</div>
            <div style={{ fontSize: 12, color: '#64748B' }}>Latencies per LLM generation</div>
          </div>
          <InfoTooltip text="Daily latency percentiles per model from the Langfuse Metrics v2 observations view (latency is in milliseconds). Switch percentile tabs or filter models with the dropdown." />
        </div>
        <ModelFilterDropdown
          models={allModels}
          selected={selectedModels}
          setSelected={setSelectedModels}
        />
      </div>

      {/* Percentile tabs */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {PERCENTILES.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setActivePercentile(p.key)}
            style={{
              position: 'relative', padding: '8px 16px', border: '1px solid transparent',
              borderRadius: 10, fontSize: 12.5, fontWeight: activePercentile === p.key ? 700 : 600,
              color: activePercentile === p.key ? '#8E77BB' : '#64748B',
              background: activePercentile === p.key ? '#F4F0FA' : 'transparent',
              cursor: 'pointer', transition: 'all 0.15s ease', fontFamily: 'inherit',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div style={{ height: 300, width: '100%' }}>
        {loading && series.length === 0 ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#64748B', fontSize: 13 }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ display: 'flex' }}>
              <FiLoader size={18} />
            </motion.div>
            Loading model latencies…
          </div>
        ) : error ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#E11D48', fontSize: 13 }}>
            <FiAlertTriangle size={16} />
            {error}
          </div>
        ) : !hasData ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontSize: 13 }}>
            No model latency data in this period.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#E2E8F0" vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748B' }}
                tickLine={false}
                axisLine={false}
                width={48}
                tickFormatter={fmtLatency}
              />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [fmtLatency(v), 'Latency']} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />
              {selectedModels.map((m) => (
                <Line
                  key={m}
                  type="monotone"
                  dataKey={m}
                  name={m}
                  stroke={colorFor[m]}
                  strokeWidth={2.5}
                  dot={{ r: 3, strokeWidth: 0, fill: colorFor[m] }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

ModelLatencyChart.propTypes = {
  range: PropTypes.shape({
    fromTimestamp: PropTypes.string.isRequired,
    toTimestamp: PropTypes.string.isRequired,
  }).isRequired,
};
