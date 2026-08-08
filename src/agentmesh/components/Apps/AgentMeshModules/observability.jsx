import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  FiGitBranch, FiBox, FiDollarSign, FiClock, FiAlertTriangle, FiRefreshCw,
  FiCpu, FiActivity
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { getObservabilityOverview, getObservabilityTimeseries, getObservabilityByModel, getObservabilitySessions, getObservabilityWorkflows, getObservabilityLatency } from '../../../api/agentmesh';
import PageHeader from '../../Common/PageHeader';
import { InfoTooltip } from './observability/observabilityShared';
import TracesTab from './observability/TracesTab';
import ScoresTab from './observability/ScoresTab';
import SessionsTab from './observability/SessionsTab';
import SystemMetricsTab from './observability/SystemMetricsTab';
import LatencyPercentiles from './observability/LatencyPercentiles';

const PERIODS = [
  { key: 7, label: '7 Days' },
  { key: 15, label: '15 Days' },
  { key: 30, label: '30 Days' },
];

const TABS = [
  { key: 'dashboard', label: 'Dashboard', enabled: true },
  { key: 'systemMetrics', label: 'System Metrics', enabled: true },
  { key: 'traces', label: 'Traces', enabled: true },
  { key: 'scores', label: 'Scores', enabled: true },
  { key: 'sessions', label: 'Sessions', enabled: true },
];

const CHART_COLORS = {
  primary: '#8e78b7',
  green: '#34c759',
  amber: '#f0a500',
  blue: '#3b82f6',
  red: '#ef4444',
  grid: 'rgba(148, 163, 184, 0.2)',
};

const fmtNumber = (n) => {
  if (n == null || isNaN(n)) return '0';
  if (Math.abs(n) >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1) + 'K';
  return Math.round(n).toString();
};

const fmtMs = (ms) => (ms == null ? '—' : (ms >= 1000 ? (ms / 1000).toFixed(2) + 's' : Math.round(ms) + 'ms'));

const fmtCost = (v) => (v == null ? '$0.00' : '$' + Number(v).toFixed(2));

const tooltipStyle = {
  background: 'rgba(15, 23, 42, 0.95)',
  border: 'none',
  borderRadius: 12,
  padding: '10px 14px',
  fontSize: 12,
  color: '#E2E8F0',
};

function KpiCard({ icon: Icon, label, value, sub, accent, hint }) {
  return (
    <div style={{
      background: 'white', border: '1px solid var(--border)', borderRadius: 14,
      padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 8,
      minWidth: 0, transition: 'all 0.2s'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 12.5, fontWeight: 600 }}>
        <Icon size={15} color={accent} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
        {hint && <div style={{ marginLeft: 'auto' }}><InfoTooltip text={hint} /></div>}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  );
}

KpiCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  sub: PropTypes.string,
  accent: PropTypes.string.isRequired,
  hint: PropTypes.string,
};

function ChartCard({ title, subtitle, height = 260, children, hint }) {
  return (
    <div style={{
      background: 'white', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 20px 12px',
      display: 'flex', flexDirection: 'column', gap: 12
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</div>}
        </div>
        {hint && <div style={{ marginTop: 2 }}><InfoTooltip text={hint} /></div>}
      </div>
      <div style={{ height, width: '100%' }}>{children}</div>
    </div>
  );
}

ChartCard.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  height: PropTypes.number,
  children: PropTypes.node.isRequired,
  hint: PropTypes.string,
};

export default function Observability() {
  const [period, setPeriod] = useState(7);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [overview, setOverview] = useState(null);
  const [timeseries, setTimeseries] = useState(null);
  const [byModel, setByModel] = useState(null);
  const [workflows, setWorkflows] = useState(null);
  const [sessionsSummary, setSessionsSummary] = useState(null);
  const [latency, setLatency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    const to = new Date();
    const from = new Date(to.getTime() - period * 86400000);
    const params = { fromTimestamp: from.toISOString(), toTimestamp: to.toISOString() };
    setRefreshing(true);
    try {
      const [ov, ts, bm, wf, sess, lat] = await Promise.all([
        getObservabilityOverview(params),
        getObservabilityTimeseries({ ...params, granularity: 'day' }),
        getObservabilityByModel(params),
        getObservabilityWorkflows(params),
        getObservabilitySessions(params),
        getObservabilityLatency({ ...params, limit: 25 }),
      ]);
      setOverview(ov);
      setTimeseries(ts);
      setByModel(bm);
      setWorkflows(wf);
      setSessionsSummary(sess ? { count: sess.count || 0, totalTraces: sess.totalTraces || 0 } : null);
      setLatency(lat);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load observability data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => {
    setLoading(true);
    fetchAll();
    const interval = setInterval(fetchAll, 60000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  if (loading && !overview) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="loading-spinner"
          style={{ width: 60, height: 60, borderWidth: 4, borderColor: 'var(--theme-primary)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  const merged = (timeseries?.observations || []).map((row) => {
    const trace = (timeseries?.traces || []).find((t) => t.time === row.time);
    const err = (timeseries?.errors || []).find((e) => e.time === row.time);
    return {
      time: row.time ? row.time.slice(5, 10) : '',
      observations: row.count || 0,
      traces: trace?.count || 0,
      errors: err?.count || 0,
      cost: row.cost || 0,
      inputTokens: row.inputTokens || 0,
      outputTokens: row.outputTokens || 0,
      latencyAvgMs: row.latencyAvgMs,
      latencyP95Ms: row.latencyP95Ms,
    };
  });

  const modelData = (byModel?.models || []).filter((m) => m.count > 0).map((m) => ({
    name: m.name,
    count: m.count,
    tokens: (m.inputTokens || 0) + (m.outputTokens || 0),
    latencyAvgMs: m.latencyAvgMs,
  }));

  const workflowData = (workflows?.data || []).filter((w) => w.executions > 0).map((w) => ({
    name: w.name,
    executions: w.executions,
    tokens: w.totalTokens || 0,
    sessions: w.distinctSessions || 0,
  }));

  const hasData = overview && overview.observationCount > 0;

  const now = new Date();
  const currentRange = {
    fromTimestamp: new Date(now.getTime() - period * 86400000).toISOString(),
    toTimestamp: now.toISOString(),
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-primary)', fontFamily: "'Google Sans','Roboto',sans-serif" }}>
      {/* Standard Header */}
      <div style={{ padding: '16px 40px 8px 40px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white' }}>
        <PageHeader
          title="Observability"
          description="Live LLM traces, cost, latency and token usage across agent runs, proxied from the Langfuse instance."
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: 20, padding: 3 }}>
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                style={{
                  border: 'none', background: period === p.key ? '#8e78b7' : 'transparent',
                  color: period === p.key ? '#fff' : 'var(--text-muted)',
                  padding: '6px 16px', borderRadius: 18, fontSize: 12.5, fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button
            onClick={fetchAll}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
              border: '1px solid var(--border)', borderRadius: 20, background: 'white',
              color: 'var(--text-secondary)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', transition: 'all 0.2s'
            }}
          >
            <FiRefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ padding: '0 40px', background: 'white', borderBottom: '1px solid var(--border)', display: 'flex', gap: 24, alignItems: 'center' }}>
        {TABS.map(({ key, label, enabled }) => (
          <button
            key={key}
            disabled={!enabled}
            onClick={() => enabled && setActiveTab(key)}
            style={{
              background: 'none', border: 'none', padding: '14px 4px', fontSize: 14, fontWeight: 700,
              color: activeTab === key ? 'var(--theme-primary)' : 'var(--text-muted)',
              cursor: enabled ? 'pointer' : 'default', position: 'relative', transition: 'color 0.2s',
              fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8, opacity: enabled ? 1 : 0.5
            }}
          >
            {label}
            {!enabled && (
              <span style={{ fontSize: 10, fontWeight: 600, background: 'var(--theme-primary-glow)', color: 'var(--theme-primary)', borderRadius: 10, padding: '1px 8px' }}>
                Soon
              </span>
            )}
            {activeTab === key && (
              <motion.div
                layoutId="activeObservabilityTab"
                style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'var(--theme-primary)', borderRadius: '3px 3px 0 0' }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '24px 40px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {activeTab === 'traces' ? (
          <TracesTab range={currentRange} />
        ) : activeTab === 'scores' ? (
          <ScoresTab range={currentRange} />
        ) : activeTab === 'sessions' ? (
          <SessionsTab range={currentRange} />
        ) : activeTab === 'systemMetrics' ? (
          <SystemMetricsTab />
        ) : (
          <>
            {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12,
            padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12,
            color: 'var(--red)', fontSize: 13.5, fontWeight: 500
          }}>
            <FiAlertTriangle size={18} />
            <span style={{ flex: 1 }}>{error}</span>
            <button onClick={() => window.location.reload()} style={{ border: '1px solid var(--red)', background: 'white', color: 'var(--red)', borderRadius: 8, padding: '6px 14px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Retry
            </button>
          </div>
        )}

        {!hasData ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--text-muted)' }}>
            <FiActivity size={44} style={{ opacity: 0.35 }} />
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)' }}>No traces in this period</div>
            <div style={{ fontSize: 13 }}>Run a workflow with LLM nodes to start collecting telemetry.</div>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              <KpiCard icon={FiGitBranch} label="Traces" value={fmtNumber(overview.traceCount)} sub={`${fmtNumber(overview.observationCount)} observations`} accent={CHART_COLORS.primary} hint="A trace is one end-to-end agent run. This counts workflow executions that produced telemetry in the period." />
              <KpiCard icon={FiDollarSign} label="Total Cost" value={fmtCost(overview.totalCost)} sub="estimated spend" accent={CHART_COLORS.green} hint="Estimated spend on LLM calls from token usage x model pricing. Shows $0.00 when model pricing is not configured in Langfuse." />
              <KpiCard icon={FiCpu} label="Tokens" value={fmtNumber(overview.totalTokens)} sub={`${fmtNumber(overview.inputTokens)} in / ${fmtNumber(overview.outputTokens)} out`} accent={CHART_COLORS.blue} hint="Total tokens processed by LLM calls — input (prompt/context) vs output (model response)." />
              <KpiCard icon={FiClock} label="Avg Latency" value={fmtMs(overview.latencyAvgMs)} sub={`p95 ${fmtMs(overview.latencyP95Ms)}`} accent={CHART_COLORS.amber} hint="Average time per LLM call. P95 means 95% of calls finished faster than this value." />
              <KpiCard icon={FiAlertTriangle} label="Error Rate" value={`${((overview.errorRate || 0) * 100).toFixed(1)}%`} sub={`${overview.errorCount} errors`} accent={CHART_COLORS.red} hint="Percentage of observations that failed with an error (failed LLM calls, node exceptions)." />
              <KpiCard icon={FiBox} label="Sessions" value={sessionsSummary ? fmtNumber(sessionsSummary.count) : '—'} sub={sessionsSummary ? `${fmtNumber(sessionsSummary.totalTraces)} traces` : '…'} accent={CHART_COLORS.green} hint="Distinct sessions (shared thread/session ids) active in the period, and the total traces they produced." />
              <KpiCard icon={FiGitBranch} label="Workflow Executions" value={workflows ? fmtNumber(workflows.summary.executions) : '—'} sub={workflows ? `${fmtNumber(workflows.summary.workflowCount)} distinct workflows` : '…'} accent={CHART_COLORS.blue} hint="Total workflow runs (root chain traces) in the period, and how many distinct workflows ran. Evaluator runs and human decisions are excluded." />
            </div>

            {/* Row 1: Traces over time + Cost */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
              <ChartCard title="Traces & Observations" subtitle="Daily execution volume" hint="Daily counts of observations (LLM calls / node spans) vs traces (end-to-end runs) over the period.">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={merged} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradObs" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradTrace" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.green} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={CHART_COLORS.green} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
                    <XAxis dataKey="time" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} width={42} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area type="monotone" dataKey="observations" name="Observations" stroke={CHART_COLORS.primary} fill="url(#gradObs)" strokeWidth={2} />
                    <Area type="monotone" dataKey="traces" name="Traces" stroke={CHART_COLORS.green} fill="url(#gradTrace)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Cost over Time" subtitle="Daily estimated spend" hint="Daily estimated spend on LLM calls over the period. Stays flat at zero when model pricing is not configured.">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={merged} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradCost" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.green} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={CHART_COLORS.green} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
                    <XAxis dataKey="time" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} width={52} tickFormatter={(v) => '$' + Number(v).toFixed(2)} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => [fmtCost(v), 'Cost']} />
                    <Area type="monotone" dataKey="cost" name="Cost" stroke={CHART_COLORS.green} fill="url(#gradCost)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Row 2: Tokens + Latency */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <ChartCard title="Token Usage" subtitle="Daily input vs output tokens" hint="Daily volume of input (prompt) and output (generated) tokens processed by LLM calls.">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={merged} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradIn" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradOut" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.blue} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={CHART_COLORS.blue} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
                    <XAxis dataKey="time" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} width={42} tickFormatter={fmtNumber} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v, name) => [fmtNumber(v), name]} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area type="monotone" dataKey="inputTokens" name="Input Tokens" stroke={CHART_COLORS.primary} fill="url(#gradIn)" strokeWidth={2} />
                    <Area type="monotone" dataKey="outputTokens" name="Output Tokens" stroke={CHART_COLORS.blue} fill="url(#gradOut)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Latency" subtitle="Average vs p95 per day" hint="Daily average and P95 latency of LLM calls. A large gap between the lines signals slow, outlying calls.">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={merged} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
                    <XAxis dataKey="time" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} width={42} tickFormatter={(v) => (v >= 1000 ? (v / 1000).toFixed(1) + 's' : v + 'ms')} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => [fmtMs(v), 'Latency']} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="latencyAvgMs" name="Avg Latency" stroke={CHART_COLORS.blue} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="latencyP95Ms" name="P95 Latency" stroke={CHART_COLORS.amber} strokeWidth={2} dot={false} strokeDasharray="5 4" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Row 3: Workflow breakdown */}
            <ChartCard title="Workflow Breakdown" subtitle="Executions and token usage by workflow" height={Math.max(240, Math.min(360, workflowData.length * 56))} hint="How many times each workflow ran and the total tokens consumed per workflow in the period.">
              {workflowData.length === 0 ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  No workflow runs in this period.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={workflowData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 0 }}>
                    <CartesianGrid stroke={CHART_COLORS.grid} horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} tickFormatter={fmtNumber} />
                    <YAxis type="category" dataKey="name" width={230} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} tickLine={false} axisLine={false} tickFormatter={(v) => (v.length > 40 ? v.slice(0, 40) + '…' : v)} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v, name) => (name === 'Tokens' ? [fmtNumber(v), name] : [v, name])} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="executions" name="Executions" fill={CHART_COLORS.primary} radius={[0, 8, 8, 0]} barSize={16} />
                    <Bar dataKey="tokens" name="Tokens" fill={CHART_COLORS.blue} radius={[0, 8, 8, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            {/* Row 4: Model breakdown */}
            <ChartCard title="Model Breakdown" subtitle="Token usage by provider model" height={modelData.length > 6 ? 340 : 260} hint="Token volume and call count per provider model, to see which models are used most and their relative workload.">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modelData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 0 }}>
                  <CartesianGrid stroke={CHART_COLORS.grid} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} tickFormatter={fmtNumber} />
                  <YAxis type="category" dataKey="name" width={180} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v, name) => (name === 'Tokens' ? [fmtNumber(v), name] : [v, name])} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="tokens" name="Tokens" fill={CHART_COLORS.primary} radius={[0, 8, 8, 0]} barSize={18} />
                  <Bar dataKey="count" name="Calls" fill={CHART_COLORS.blue} radius={[0, 8, 8, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Row 5: Latency percentiles */}
            <LatencyPercentiles data={latency} />
          </>
        )}
          </>
        )}
      </div>
    </div>
  );
}
