import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  FiGitBranch, FiBox, FiDollarSign, FiClock, FiAlertTriangle, FiRefreshCw,
  FiCpu, FiActivity, FiCheckCircle, FiXCircle, FiShield, FiGrid, FiLayers, FiFilter
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  getObservabilityOverview, getObservabilityTimeseries, getObservabilityByModel,
  getObservabilitySessions, getObservabilityWorkflows, getObservabilityLatency,
  getObservabilityScoreMetrics, getObservabilityToxicity,
  listWorkflows, listTools, listMarketplaceUsecases
} from '../../../api/agentmesh';
import PageHeader from '../../Common/PageHeader';
import { InfoTooltip, fmtNumber, fmtCost } from './observability/observabilityShared';
import TracesTab from './observability/TracesTab';
import ScoresTab from './observability/ScoresTab';
import ScoreAnalytics from './observability/ScoreAnalytics';
import SessionsTab from './observability/SessionsTab';
import UsersTab from './observability/UsersTab';
import SystemMetricsTab from './observability/SystemMetricsTab';
import LatencyPercentiles from './observability/LatencyPercentiles';
import ModelLatencyChart from './observability/ModelLatencyChart';

const PERIODS = [
  { key: '5m', label: 'Past 5 min', ms: 5 * 60 * 1000 },
  { key: '30m', label: 'Past 30 min', ms: 30 * 60 * 1000 },
  { key: '1h', label: 'Past 1 hour', ms: 60 * 60 * 1000 },
  { key: '3h', label: 'Past 3 hours', ms: 3 * 60 * 60 * 1000 },
  { key: '1d', label: 'Past 1 day', ms: 24 * 60 * 60 * 1000 },
  { key: '7d', label: 'Past 7 days', ms: 7 * 24 * 60 * 60 * 1000 },
  { key: '15d', label: 'Past 15 days', ms: 15 * 24 * 60 * 60 * 1000 },
  { key: '30d', label: 'Past 30 days', ms: 30 * 24 * 60 * 60 * 1000 },
  { key: '90d', label: 'Past 90 days', ms: 90 * 24 * 60 * 60 * 1000 },
  { key: '1y', label: 'Past 1 year', ms: 365 * 24 * 60 * 60 * 1000 },
];

const TABS = [
  { key: 'dashboard', label: 'Dashboard', enabled: true },
  { key: 'users', label: 'Users', enabled: true },
  { key: 'sessions', label: 'Sessions', enabled: true },
  { key: 'traces', label: 'Traces', enabled: true },
  { key: 'scores', label: 'Scores', enabled: true },
];

const DASHBOARD_VIEWS = [
  { key: 'overview', label: 'Executive Overview', icon: FiGrid, hint: 'Summary KPI cards & system status compartments' },
  { key: 'cost', label: 'Cost & Spend', icon: FiDollarSign, hint: 'Financial spend over time & model costs breakdown' },
  { key: 'latency', label: 'Latency & Performance', icon: FiClock, hint: 'Response times, SLA percentiles & model speed trends' },
  { key: 'usage', label: 'Tokens & Usage', icon: FiCpu, hint: 'Input/output token volume & workflow execution counts' },
  { key: 'quality', label: 'Quality & Safety', icon: FiShield, hint: 'Evaluation scores & response toxicity audit' },
  { key: 'systemMetrics', label: 'System Metrics', icon: FiActivity, hint: 'Infrastructure and backend server health' },
];

const CHART_COLORS = {
  primary: '#8E77BB', // AgentMesh Platform Brand Violet (#8E77BB)
  green: '#10B981',   // Emerald
  amber: '#F59E0B',   // Amber
  blue: '#3B82F6',    // Blue
  red: '#EF4444',     // Rose Red
  teal: '#06B6D4',    // Cyan/Teal
  grid: '#E2E8F0',    // Light border grid
};

const BADGE_THEMES = {
  '#8E77BB': { bg: '#F4F0FA', icon: '#8E77BB' },
  '#10B981': { bg: '#ECFDF5', icon: '#059669' },
  '#3B82F6': { bg: '#EFF6FF', icon: '#2563EB' },
  '#F59E0B': { bg: '#FEF3C7', icon: '#D97706' },
  '#EF4444': { bg: '#FFF1F2', icon: '#E11D48' },
  '#06B6D4': { bg: '#ECFEFF', icon: '#0891B2' },
  '#8e78b7': { bg: '#F4F0FA', icon: '#8E77BB' },
  '#34c759': { bg: '#ECFDF5', icon: '#059669' },
  '#f0a500': { bg: '#FEF3C7', icon: '#D97706' },
};

const fmtMs = (ms) => (ms == null ? '—' : (ms >= 1000 ? (ms / 1000).toFixed(2) + 's' : Math.round(ms) + 'ms'));

const tooltipStyle = {
  background: '#0F172A',
  border: 'none',
  borderRadius: 10,
  padding: '10px 14px',
  fontSize: 12,
  color: '#F8FAFC',
  boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.3)',
};

function KpiCard({ icon: Icon, label, value, sub, accent, hint }) {
  const theme = BADGE_THEMES[accent] || { bg: '#F1F5F9', icon: accent || '#475569' };

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 14,
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(15, 23, 42, 0.06)';
        e.currentTarget.style.borderColor = '#CBD5E1';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 6px rgba(15, 23, 42, 0.03)';
        e.currentTarget.style.borderColor = '#E2E8F0';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: theme.bg, color: theme.icon,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Icon size={18} />
        </div>
        {hint && <InfoTooltip text={hint} />}
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', letterSpacing: '0.01em', marginBottom: 4 }}>
          {label}
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
          {value}
        </div>
      </div>
      {sub && (
        <div style={{ fontSize: 11.5, color: '#64748B', fontWeight: 500 }}>
          {sub}
        </div>
      )}
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

function ChartCard({ title, subtitle, height = 260, children, hint, extra }) {
  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: 14,
      padding: '20px 22px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em' }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{subtitle}</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {extra}
          {hint && <InfoTooltip text={hint} />}
        </div>
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
  extra: PropTypes.node,
};

export default function Observability() {
  const [periodKey, setPeriodKey] = useState('7d');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardView, setDashboardView] = useState('overview');
  const [selectedUserFilter, setSelectedUserFilter] = useState('');
  const [selectedSessionFilter, setSelectedSessionFilter] = useState('');
  const [selectedTraceFilter, setSelectedTraceFilter] = useState('');
  const [overview, setOverview] = useState(null);
  const [timeseries, setTimeseries] = useState(null);
  const [byModel, setByModel] = useState(null);
  const [workflows, setWorkflows] = useState(null);
  const [scoreMetrics, setScoreMetrics] = useState(null);
  const [toxicity, setToxicity] = useState(null);
  const [sessionsSummary, setSessionsSummary] = useState(null);
  const [latency, setLatency] = useState(null);
  const [systemStats, setSystemStats] = useState({
    totalWorkflows: 0,
    activeWorkflows: 0,
    inactiveWorkflows: 0,
    totalTools: 0,
    marketplaceUsecases: 0,
    pendingWorkflows: 0,
    approvedWorkflows: 0,
    rejectedWorkflows: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const selectedPeriod = PERIODS.find((p) => p.key === periodKey) || PERIODS[5];

  const fetchAll = useCallback(async () => {
    const to = new Date();
    const from = new Date(to.getTime() - selectedPeriod.ms);
    const params = { fromTimestamp: from.toISOString(), toTimestamp: to.toISOString() };
    setRefreshing(true);
    try {
      const [ov, ts, bm, wf, sess, lat, sm, toxOverall, toxByUser, toxBySession, wfListRes, toolsRes, marketRes] = await Promise.all([
        getObservabilityOverview(params),
        getObservabilityTimeseries({ ...params, granularity: 'day' }),
        getObservabilityByModel(params),
        getObservabilityWorkflows(params),
        getObservabilitySessions(params),
        getObservabilityLatency({ ...params, limit: 25 }),
        getObservabilityScoreMetrics({ ...params, limit: 100 }),
        getObservabilityToxicity(params),
        getObservabilityToxicity({ ...params, groupBy: 'user', limit: 10 }),
        getObservabilityToxicity({ ...params, groupBy: 'session', limit: 10 }),
        listWorkflows({ limit: 1000 }).catch(() => null),
        listTools({ limit: 1000 }).catch(() => null),
        listMarketplaceUsecases({ limit: 1000, adminStatus: 'All' }).catch(() => null),
      ]);
      setOverview(ov);
      setTimeseries(ts);
      setByModel(bm);
      setWorkflows(wf);
      setScoreMetrics(sm);
      setToxicity({
        overall: toxOverall?.overall || null,
        byUser: toxByUser?.byUser || [],
        bySession: toxBySession?.bySession || [],
      });
      setSessionsSummary(sess ? { count: sess.total || 0, totalTraces: sess.totalTraces || 0 } : null);
      setLatency(lat);

      // Compute inventory counts
      const wfList = Array.isArray(wfListRes) ? wfListRes : wfListRes?.data || wfListRes?.workflows || [];
      const toolsList = Array.isArray(toolsRes) ? toolsRes : toolsRes?.data || toolsRes?.tools || [];
      const marketList = Array.isArray(marketRes) ? marketRes : marketRes?.data || marketRes?.usecases || [];

      const totalWf = wfList.length;
      const activeWf = wfList.filter((w) => w.is_active !== false).length;
      const inactiveWf = wfList.filter((w) => w.is_active === false).length;

      const totalToolsCount = toolsList.length;
      const marketplaceCount = marketList.length;

      const pendingCount = marketList.filter((m) => m.admin_status === 'pending').length;
      const approvedCount = marketList.filter((m) => m.admin_status === 'approved' || !m.admin_status).length;
      const rejectedCount = marketList.filter((m) => m.admin_status === 'rejected').length;

      setSystemStats({
        totalWorkflows: totalWf,
        activeWorkflows: activeWf,
        inactiveWorkflows: inactiveWf,
        totalTools: totalToolsCount,
        marketplaceUsecases: marketplaceCount,
        pendingWorkflows: pendingCount,
        approvedWorkflows: approvedCount,
        rejectedWorkflows: rejectedCount,
      });

      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load observability data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    setLoading(true);
    fetchAll();
  }, [fetchAll]);

  if (loading && !overview) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
        <motion.div
          animate={{ scale: [1, 1.15, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid #E2E8F0', borderTopColor: '#7C3AED' }}
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
    fromTimestamp: new Date(now.getTime() - selectedPeriod.ms).toISOString(),
    toTimestamp: now.toISOString(),
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#F8FAFC', fontFamily: "'Inter', 'Google Sans', system-ui, sans-serif" }}>
      {/* Standard Header */}
      <div style={{ padding: '16px 32px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFFFFF' }}>
        <PageHeader
          title="Observability"
          description="Live LLM traces, cost, latency and token usage across agent runs."
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {activeTab === 'dashboard' && (
            <select
              value={dashboardView}
              onChange={(e) => setDashboardView(e.target.value)}
              style={{
                padding: '8px 14px',
                background: '#F4F0FA',
                border: '1px solid #C4B5FD',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                color: '#8E77BB',
                outline: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.2s ease',
              }}
            >
              {DASHBOARD_VIEWS.map((v) => (
                <option key={v.key} value={v.key}>
                  {v.label}
                </option>
              ))}
            </select>
          )}
          <select
            value={periodKey}
            onChange={(e) => setPeriodKey(e.target.value)}
            style={{
              padding: '8px 14px',
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              color: '#111827',
              outline: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.2s ease',
            }}
          >
            {PERIODS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={fetchAll}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
              border: '1px solid #E5E7EB', borderRadius: 10, background: '#FFFFFF',
              color: '#111827', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', transition: 'all 0.2s ease'
            }}
          >
            <FiRefreshCw size={15} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none', color: '#8E77BB' }} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ padding: '0 40px', background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', display: 'flex', gap: 28, alignItems: 'center' }}>
        {TABS.map(({ key, label, enabled }) => (
          <button
            key={key}
            disabled={!enabled}
            onClick={() => {
              if (enabled) {
                setSelectedUserFilter('');
                setSelectedSessionFilter('');
                setSelectedTraceFilter('');
                setActiveTab(key);
              }
            }}
            style={{
              background: 'none', border: 'none', padding: '14px 4px', fontSize: 13.5, fontWeight: activeTab === key ? 700 : 600,
              color: activeTab === key ? '#8E77BB' : '#64748B',
              cursor: enabled ? 'pointer' : 'default', position: 'relative', transition: 'all 0.15s ease',
              fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8, opacity: enabled ? 1 : 0.5
            }}
          >
            {label}
            {!enabled && (
              <span style={{ fontSize: 10, fontWeight: 600, background: '#F4F0FA', color: '#8E77BB', borderRadius: 10, padding: '1px 8px' }}>
                Soon
              </span>
            )}
            {activeTab === key && (
              <motion.div
                layoutId="activeObservabilityTab"
                style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2.5, background: '#8E77BB', borderRadius: '3px 3px 0 0' }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '24px 40px 60px', overflowY: activeTab === 'dashboard' ? 'auto' : 'hidden', display: 'flex', flexDirection: 'column', gap: 20, minHeight: 0 }}>
        {activeTab === 'traces' ? (
          <TracesTab range={currentRange} initialSessionFilter={selectedSessionFilter} initialTraceFilter={selectedTraceFilter} />
        ) : activeTab === 'scores' ? (
          <ScoresTab
            range={currentRange}
            onSelectTrace={(tid) => { setSelectedTraceFilter(tid); setActiveTab('traces'); }}
            onSelectUser={(uid) => { setSelectedUserFilter(uid); setActiveTab('sessions'); }}
          />
        ) : activeTab === 'sessions' ? (
          <SessionsTab range={currentRange} initialUserFilter={selectedUserFilter} onSelectSession={(sid) => { setSelectedSessionFilter(sid); setActiveTab('traces'); }} />
        ) : activeTab === 'users' ? (
          <UsersTab range={currentRange} onSelectUser={(uid) => { setSelectedUserFilter(uid); setActiveTab('sessions'); }} />
        ) : (
          <>
            {error && (
              <div style={{
                background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: 12,
                padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12,
                color: '#E11D48', fontSize: 13.5, fontWeight: 500
              }}>
                <FiAlertTriangle size={18} />
                <span style={{ flex: 1 }}>{error}</span>
                <button onClick={() => window.location.reload()} style={{ border: '1px solid #E11D48', background: '#FFFFFF', color: '#E11D48', borderRadius: 8, padding: '6px 14px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Retry
                </button>
              </div>
            )}
            {!hasData ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#64748B', padding: '60px 0' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#F4F0FA', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8E77BB' }}>
                  <FiActivity size={32} />
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>No traces in this period</div>
                <div style={{ fontSize: 13, color: '#64748B' }}>Run a workflow with LLM nodes to start collecting telemetry.</div>
              </div>
            ) : (
              <>
                {/* Dashboard Category Segregation Selector */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 18px', background: '#FFFFFF', border: '1px solid #E2E8F0',
                  borderRadius: 14, boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)', gap: 12, flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F4F0FA', color: '#8E77BB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FiFilter size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>Dashboard View Category</div>
                      <div style={{ fontSize: 11.5, color: '#64748B' }}>
                        {DASHBOARD_VIEWS.find((v) => v.key === dashboardView)?.hint}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    {DASHBOARD_VIEWS.map((v) => {
                      const Icon = v.icon;
                      const isActive = dashboardView === v.key;
                      return (
                        <button
                          key={v.key}
                          type="button"
                          onClick={() => setDashboardView(v.key)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                            borderRadius: 10, border: isActive ? '1px solid #8E77BB' : '1px solid #E2E8F0',
                            background: isActive ? '#F4F0FA' : '#FFFFFF', color: isActive ? '#8E77BB' : '#475569',
                            fontSize: 12.5, fontWeight: isActive ? 700 : 600, cursor: 'pointer',
                            transition: 'all 0.15s ease', fontFamily: 'inherit'
                          }}
                        >
                          <Icon size={14} color={isActive ? '#8E77BB' : '#64748B'} />
                          {v.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ─────────────────────────────────────────────────────────────
                    1. EXECUTIVE OVERVIEW VIEW (Summary KPI Cards + Compartments + Volume)
                   ───────────────────────────────────────────────────────────── */}
                {dashboardView === 'overview' && (
                  <>
                    {/* KPI Cards Summary */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                      <KpiCard icon={FiGitBranch} label="Traces" value={fmtNumber(overview.traceCount)} sub={`${fmtNumber(overview.observationCount)} observations`} accent={CHART_COLORS.primary} hint="A Trace represents one complete end-to-end user request or automated workflow execution (e.g. answering a customer query). An Observation is an individual internal step inside a trace (like an LLM call or tool lookup)." />
                      <KpiCard icon={FiDollarSign} label="Total Cost" value={fmtCost(overview.totalCost)} sub="estimated spend" accent={CHART_COLORS.green} hint="Estimated financial spend on AI provider APIs (e.g. OpenAI, Anthropic) based on token usage and model prices in the selected period." />
                      <KpiCard icon={FiCpu} label="Tokens" value={fmtNumber(overview.totalTokens)} sub={`${fmtNumber(overview.inputTokens)} in / ${fmtNumber(overview.outputTokens)} out`} accent={CHART_COLORS.blue} hint="Tokens are basic text units processed by AI (~4 letters per token). Input Tokens are your prompts & context; Output Tokens are the text generated in response by the AI model." />
                      <KpiCard icon={FiClock} label="Avg Latency" value={fmtMs(overview.latencyAvgMs)} sub={`p95 ${fmtMs(overview.latencyP95Ms)}`} accent={CHART_COLORS.amber} hint="Average response speed per AI call. P95 (95th percentile) means 95% of AI calls completed faster than this time (helping spot slow responses)." />
                      <KpiCard icon={FiAlertTriangle} label="Error Rate" value={`${((overview.errorRate || 0) * 100).toFixed(1)}%`} sub={`${overview.errorCount} errors`} accent={CHART_COLORS.red} hint="Percentage of AI execution steps or model requests that encountered an error or failed to complete." />
                      <KpiCard icon={FiShield} label="Avg Toxicity" value={toxicity?.overall?.avgToxicityPercent != null ? `${toxicity.overall.avgToxicityPercent.toFixed(1)}%` : '—'} sub={`${toxicity?.overall?.toxicRate != null ? (toxicity.overall.toxicRate * 100).toFixed(1) + '% toxic' : ''} · ${fmtNumber(toxicity?.overall?.count || 0)} nodes scored`} accent={CHART_COLORS.amber} hint="Safety compliance score (0-100%) measuring potential toxicity or inappropriate language in AI responses, and the share of responses exceeding safe thresholds." />
                      <KpiCard icon={FiBox} label="Sessions" value={sessionsSummary ? fmtNumber(sessionsSummary.count) : '—'} sub={sessionsSummary ? `${fmtNumber(sessionsSummary.totalTraces)} traces` : '…'} accent={CHART_COLORS.teal} hint="A Session groups continuous multi-turn conversations or interactions over time for a single user or workflow context." />
                      <KpiCard icon={FiCpu} label="Registered Tools" value={fmtNumber(systemStats.totalTools)} sub="available integrations" accent={CHART_COLORS.blue} hint="Capability extensions and API integrations (e.g. database query, CRM lookup) available for AI agents to call." />
                    </div>

                    {/* Unified System Compartments Section */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>
                      {/* Compartment 1: Workflow Management & Executions */}
                      <div style={{
                        background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14,
                        padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16,
                        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em' }}>Workflow Overview & Executions</div>
                            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Workflow inventory, active/inactive state, and execution runs</div>
                          </div>
                          <InfoTooltip text="Live status overview of your automated business workflows, including active readiness and total execution runs during this period." />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 16px', position: 'relative' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748B', fontSize: 12, fontWeight: 600 }}>
                                <FiGitBranch size={15} color="#8E77BB" /> Total Workflows
                              </div>
                              <InfoTooltip text="Total count of all configured AI business process workflows in your organization." />
                            </div>
                            <div style={{ fontSize: 22, fontWeight: 700, color: '#0F172A' }}>{fmtNumber(systemStats.totalWorkflows)}</div>
                            <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 8 }}>All registered workflows</div>
                          </div>

                          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748B', fontSize: 12, fontWeight: 600 }}>
                                <FiActivity size={15} color="#3B82F6" /> Workflow Executions
                              </div>
                              <InfoTooltip text="How many times your workflows were triggered and executed in the selected time range." />
                            </div>
                            <div style={{ fontSize: 22, fontWeight: 700, color: '#0F172A' }}>
                              {workflows ? fmtNumber(workflows.summary.executions) : '—'}
                            </div>
                            <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 8 }}>
                              {workflows ? `${workflows.summary.workflowCount} distinct workflows executed` : 'Executions in period'}
                            </div>
                          </div>

                          <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 12, padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#047857', fontSize: 12, fontWeight: 700 }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} /> Active Workflows
                              </div>
                              <InfoTooltip text="Workflows currently published and available for users or automated agents to run." />
                            </div>
                            <div style={{ fontSize: 22, fontWeight: 700, color: '#065F46' }}>{fmtNumber(systemStats.activeWorkflows)}</div>
                            <div style={{ fontSize: 11.5, color: '#047857', marginTop: 8 }}>Enabled and runnable</div>
                          </div>

                          <div style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: 12, padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontSize: 12, fontWeight: 700 }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#94A3B8' }} /> Inactive Workflows
                              </div>
                              <InfoTooltip text="Workflows currently paused, disabled, or saved in draft state." />
                            </div>
                            <div style={{ fontSize: 22, fontWeight: 700, color: '#1E293B' }}>{fmtNumber(systemStats.inactiveWorkflows)}</div>
                            <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 8 }}>Disabled or draft state</div>
                          </div>
                        </div>
                      </div>

                      {/* Compartment 2: Marketplace Use Cases & Approval Pipeline */}
                      <div style={{
                        background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14,
                        padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16,
                        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em' }}>Marketplace Use Cases & Approval Status</div>
                            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Published use cases and review status pipeline</div>
                          </div>
                          <InfoTooltip text="Catalog of pre-built AI workflow templates published in your enterprise marketplace, broken down by administrative review stage." />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                          <div style={{ background: '#ECFEFF', border: '1px solid #CFFAFE', borderRadius: 12, padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0891B2', fontSize: 12, fontWeight: 700 }}>
                                <FiBox size={15} color="#06B6D4" /> Marketplace Use Cases
                              </div>
                              <InfoTooltip text="Total pre-packaged AI solution templates submitted to your internal app store." />
                            </div>
                            <div style={{ fontSize: 22, fontWeight: 700, color: '#155E75' }}>{fmtNumber(systemStats.marketplaceUsecases)}</div>
                            <div style={{ fontSize: 11.5, color: '#0891B2', marginTop: 8 }}>Published to store</div>
                          </div>

                          <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 12, padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#B45309', fontSize: 12, fontWeight: 700 }}>
                                <FiClock size={15} /> Pending Approval
                              </div>
                              <InfoTooltip text="New workflow submissions currently waiting for administrator review and governance clearance." />
                            </div>
                            <div style={{ fontSize: 22, fontWeight: 700, color: '#92400E' }}>{fmtNumber(systemStats.pendingWorkflows)}</div>
                            <div style={{ fontSize: 11.5, color: '#B45309', marginTop: 8 }}>Awaiting review</div>
                          </div>

                          <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 12, padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#047857', fontSize: 12, fontWeight: 700 }}>
                                <FiCheckCircle size={15} /> Approved
                              </div>
                              <InfoTooltip text="Verified workflows approved for public use across teams in the marketplace." />
                            </div>
                            <div style={{ fontSize: 22, fontWeight: 700, color: '#065F46' }}>{fmtNumber(systemStats.approvedWorkflows)}</div>
                            <div style={{ fontSize: 11.5, color: '#047857', marginTop: 8 }}>Live in marketplace</div>
                          </div>

                          <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: 12, padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#BE123C', fontSize: 12, fontWeight: 700 }}>
                                <FiXCircle size={15} /> Rejected
                              </div>
                              <InfoTooltip text="Submissions returned to authors for security, quality, or formatting revisions." />
                            </div>
                            <div style={{ fontSize: 22, fontWeight: 700, color: '#9F1239' }}>{fmtNumber(systemStats.rejectedWorkflows)}</div>
                            <div style={{ fontSize: 11.5, color: '#BE123C', marginTop: 8 }}>Requires revision</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Traces & Observations Chart */}
                    <ChartCard title="Traces & Observations" subtitle="Daily execution volume" hint="Daily volume comparing end-to-end user request runs (Traces) with internal execution steps (Observations, e.g. prompt calls, database tools).">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={merged} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="gradObs" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.35} />
                              <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0.01} />
                            </linearGradient>
                            <linearGradient id="gradTrace" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={CHART_COLORS.green} stopOpacity={0.35} />
                              <stop offset="95%" stopColor={CHART_COLORS.green} stopOpacity={0.01} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} strokeDasharray="3 3" />
                          <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} width={42} />
                          <Tooltip contentStyle={tooltipStyle} />
                          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />
                          <Area type="monotone" dataKey="observations" name="Observations (Sub-steps)" stroke={CHART_COLORS.primary} fill="url(#gradObs)" strokeWidth={2.5} />
                          <Area type="monotone" dataKey="traces" name="Traces (Full Runs)" stroke={CHART_COLORS.green} fill="url(#gradTrace)" strokeWidth={2.5} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartCard>
                  </>
                )}

                {/* ─────────────────────────────────────────────────────────────
                    2. COST & FINANCIAL SPEND VIEW
                   ───────────────────────────────────────────────────────────── */}
                {dashboardView === 'cost' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                      <KpiCard icon={FiDollarSign} label="Total Cost" value={fmtCost(overview.totalCost)} sub="estimated spend" accent={CHART_COLORS.green} hint="Estimated financial spend on AI provider APIs (e.g. OpenAI, Anthropic) based on token usage and model prices in the selected period." />
                      <KpiCard icon={FiBox} label="Active Provider Models" value={byModel?.models ? byModel.models.length : 0} sub="models utilized" accent={CHART_COLORS.teal} hint="Total distinct LLM provider models called during this period." />
                    </div>

                    <ChartCard title="Cost over Time" subtitle="Daily estimated spend" hint="Daily calculated financial spend on AI provider APIs (e.g. OpenAI, Anthropic) based on token usage and model rates.">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={merged} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="gradCost" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={CHART_COLORS.green} stopOpacity={0.4} />
                              <stop offset="95%" stopColor={CHART_COLORS.green} stopOpacity={0.01} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} strokeDasharray="3 3" />
                          <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} width={52} tickFormatter={(v) => '$' + Number(v).toFixed(2)} />
                          <Tooltip contentStyle={tooltipStyle} formatter={(v) => [fmtCost(v), 'Cost']} />
                          <Area type="monotone" dataKey="cost" name="Cost ($ USD)" stroke={CHART_COLORS.green} fill="url(#gradCost)" strokeWidth={2.5} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartCard>

                    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '20px 22px 14px', display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 6 }}>
                            Model Costs Breakdown
                            <InfoTooltip text="Total token volume processed and estimated financial API cost incurred per AI provider model (e.g. GPT-4, Claude 3)." />
                          </div>
                          <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Token usage and spend per model</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>{fmtCost((byModel?.models || []).reduce((s, m) => s + (m.cost || 0), 0))}</div>
                          <div style={{ fontSize: 11, color: '#64748B' }}>Total cost</div>
                        </div>
                      </div>
                      <div style={{ border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px', alignItems: 'center', gap: 10, padding: '9px 12px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: 10.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          <span>Model</span>
                          <span style={{ textAlign: 'right' }}>Tokens</span>
                          <span style={{ textAlign: 'right' }}>USD Spend</span>
                        </div>
                        {(byModel?.models || []).length === 0 ? (
                          <div style={{ padding: 20, textAlign: 'center', color: '#64748B', fontSize: 12.5 }}>No model usage in this period.</div>
                        ) : (
                          (byModel?.models || []).map((m, i) => (
                            <div key={m.name} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px', alignItems: 'center', gap: 10, padding: '9px 12px', borderBottom: i < (byModel?.models || []).length - 1 ? '1px solid #F1F5F9' : 'none', fontSize: 12, color: '#334155', transition: 'background 0.15s ease' }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                            >
                              <span style={{ minWidth: 0, fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={m.name}>{m.name}</span>
                              <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 500, color: '#475569' }}>{fmtNumber((m.inputTokens || 0) + (m.outputTokens || 0))}</span>
                              <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 500, color: '#475569' }}>{fmtCost(m.cost)}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* ─────────────────────────────────────────────────────────────
                    3. LATENCY & PERFORMANCE VIEW
                   ───────────────────────────────────────────────────────────── */}
                {dashboardView === 'latency' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                      <KpiCard icon={FiClock} label="Avg Latency" value={fmtMs(overview.latencyAvgMs)} sub="typical speed" accent={CHART_COLORS.amber} hint="Average response speed per AI call." />
                      <KpiCard icon={FiClock} label="P95 Latency" value={fmtMs(overview.latencyP95Ms)} sub="95% faster threshold" accent={CHART_COLORS.primary} hint="P95 means 95% of AI calls completed faster than this duration." />
                    </div>

                    <ChartCard title="Latency Trends" subtitle="Average vs p95 per day" hint="Tracks AI response speeds. Avg Latency is typical speed; P95 Latency shows the speed threshold for 95% of calls (highlighting slow outliers).">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={merged} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                          <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} strokeDasharray="3 3" />
                          <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} width={42} tickFormatter={(v) => (v >= 1000 ? (v / 1000).toFixed(1) + 's' : v + 'ms')} />
                          <Tooltip contentStyle={tooltipStyle} formatter={(v) => [fmtMs(v), 'Latency']} />
                          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />
                          <Line type="monotone" dataKey="latencyAvgMs" name="Avg Latency (Typical Speed)" stroke={CHART_COLORS.blue} strokeWidth={2.5} dot={{ r: 3, strokeWidth: 0, fill: CHART_COLORS.blue }} />
                          <Line type="monotone" dataKey="latencyP95Ms" name="P95 Latency (95% Faster Than)" stroke={CHART_COLORS.amber} strokeWidth={2.5} dot={{ r: 3, strokeWidth: 0, fill: CHART_COLORS.amber }} strokeDasharray="5 4" />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartCard>

                    <ModelLatencyChart range={currentRange} />
                    <LatencyPercentiles data={latency} />
                  </>
                )}

                {/* ─────────────────────────────────────────────────────────────
                    4. TOKENS & USAGE VIEW
                   ───────────────────────────────────────────────────────────── */}
                {dashboardView === 'usage' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                      <KpiCard icon={FiCpu} label="Total Tokens" value={fmtNumber(overview.totalTokens)} sub={`${fmtNumber(overview.inputTokens)} in / ${fmtNumber(overview.outputTokens)} out`} accent={CHART_COLORS.blue} hint="Tokens are basic text units processed by AI (~4 letters per token)." />
                      <KpiCard icon={FiActivity} label="Workflow Executions" value={workflows ? fmtNumber(workflows.summary.executions) : '—'} sub="total runs" accent={CHART_COLORS.primary} hint="How many times workflows ran during this period." />
                      <KpiCard icon={FiCpu} label="Registered Tools" value={fmtNumber(systemStats.totalTools)} sub="integrations" accent={CHART_COLORS.teal} hint="Total tools registered for AI agents." />
                    </div>

                    <ChartCard title="Token Usage" subtitle="Daily input vs output tokens" hint="Volume of text units processed daily. Input Tokens are user prompts & context sent to AI; Output Tokens are generated AI text returned.">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={merged} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="gradIn" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.35} />
                              <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0.01} />
                            </linearGradient>
                            <linearGradient id="gradOut" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={CHART_COLORS.blue} stopOpacity={0.35} />
                              <stop offset="95%" stopColor={CHART_COLORS.blue} stopOpacity={0.01} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} strokeDasharray="3 3" />
                          <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} width={42} tickFormatter={fmtNumber} />
                          <Tooltip contentStyle={tooltipStyle} formatter={(v, name) => [fmtNumber(v), name]} />
                          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />
                          <Area type="monotone" dataKey="inputTokens" name="Input Tokens (Prompts)" stroke={CHART_COLORS.primary} fill="url(#gradIn)" strokeWidth={2.5} />
                          <Area type="monotone" dataKey="outputTokens" name="Output Tokens (Responses)" stroke={CHART_COLORS.blue} fill="url(#gradOut)" strokeWidth={2.5} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartCard>

                    <ChartCard title="Workflow Breakdown" subtitle="Executions and token usage by workflow" height={Math.max(260, Math.min(380, workflowData.length * 60))} hint="Compares execution run counts (bottom axis) against total tokens consumed (top axis) for each automated workflow.">
                      {workflowData.length === 0 ? (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontSize: 13 }}>
                          No workflow runs in this period.
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={workflowData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 15 }}>
                            <CartesianGrid stroke={CHART_COLORS.grid} horizontal={false} strokeDasharray="3 3" />
                            <XAxis xAxisId="exec" type="number" orientation="bottom" tick={{ fontSize: 11, fill: CHART_COLORS.primary }} tickLine={false} axisLine={false} tickFormatter={fmtNumber} />
                            <XAxis xAxisId="tok" type="number" orientation="top" tick={{ fontSize: 11, fill: CHART_COLORS.teal }} tickLine={false} axisLine={false} tickFormatter={fmtNumber} />
                            <YAxis type="category" dataKey="name" width={230} tick={{ fontSize: 11, fill: '#0F172A' }} tickLine={false} axisLine={false} tickFormatter={(v) => (v.length > 40 ? v.slice(0, 40) + '…' : v)} />
                            <Tooltip contentStyle={tooltipStyle} formatter={(v, name) => (name.includes('Tokens') ? [fmtNumber(v), name] : [v, name])} />
                            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />
                            <Bar xAxisId="exec" dataKey="executions" name="Executions (Bottom Axis)" fill={CHART_COLORS.primary} radius={[0, 6, 6, 0]} barSize={12} />
                            <Bar xAxisId="tok" dataKey="tokens" name="Tokens (Top Axis)" fill={CHART_COLORS.teal} radius={[0, 6, 6, 0]} barSize={12} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </ChartCard>

                    <ChartCard title="Model Breakdown" subtitle="Token usage by provider model" height={modelData.length > 6 ? 360 : 280} hint="Compares total API call counts (bottom axis) and token volume (top axis) across different AI provider models (e.g. GPT-4o, Claude 3.5).">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={modelData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 15 }}>
                          <CartesianGrid stroke={CHART_COLORS.grid} horizontal={false} strokeDasharray="3 3" />
                          <XAxis xAxisId="calls" type="number" orientation="bottom" tick={{ fontSize: 11, fill: CHART_COLORS.blue }} tickLine={false} axisLine={false} tickFormatter={fmtNumber} />
                          <XAxis xAxisId="tok" type="number" orientation="top" tick={{ fontSize: 11, fill: CHART_COLORS.primary }} tickLine={false} axisLine={false} tickFormatter={fmtNumber} />
                          <YAxis type="category" dataKey="name" width={180} tick={{ fontSize: 11, fill: '#0F172A' }} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={tooltipStyle} formatter={(v, name) => (name.includes('Tokens') ? [fmtNumber(v), name] : [v, name])} />
                          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />
                          <Bar xAxisId="tok" dataKey="tokens" name="Tokens (Top Axis)" fill={CHART_COLORS.primary} radius={[0, 6, 6, 0]} barSize={14} />
                          <Bar xAxisId="calls" dataKey="count" name="Calls (Bottom Axis)" fill={CHART_COLORS.blue} radius={[0, 6, 6, 0]} barSize={14} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartCard>
                  </>
                )}

                {/* ─────────────────────────────────────────────────────────────
                    5. QUALITY & SAFETY VIEW
                   ───────────────────────────────────────────────────────────── */}
                {dashboardView === 'quality' && (
                  <>
                    {/* Top KPI Cards Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                      <KpiCard icon={FiAlertTriangle} label="Error Rate" value={`${((overview.errorRate || 0) * 100).toFixed(1)}%`} sub={`${overview.errorCount} errors`} accent={CHART_COLORS.red} hint="Percentage of AI execution steps or model requests that encountered an error or failed to complete." />
                      <KpiCard icon={FiShield} label="Avg Toxicity" value={toxicity?.overall?.avgToxicityPercent != null ? `${toxicity.overall.avgToxicityPercent.toFixed(1)}%` : '—'} sub={`${toxicity?.overall?.toxicRate != null ? (toxicity.overall.toxicRate * 100).toFixed(1) + '% toxic' : ''} · ${fmtNumber(toxicity?.overall?.count || 0)} nodes scored`} accent={CHART_COLORS.amber} hint="Safety compliance score (0-100%) measuring potential toxicity or inappropriate language in AI responses." />
                      <KpiCard icon={FiShield} label="Total Scores Tracked" value={fmtNumber((scoreMetrics?.summary || []).reduce((s, x) => s + (x.count || 0), 0))} sub={`${(scoreMetrics?.summary || []).length} metric types`} accent={CHART_COLORS.primary} hint="Total evaluation benchmark scores and safety checks recorded." />
                    </div>

                    {/* Toxicity & Safety Breakdown Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '20px 22px 14px', display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em' }}>Toxicity by User</div>
                            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Average output toxicity per user</div>
                          </div>
                          <InfoTooltip text="Average Detoxify toxicity score of node outputs per user, with the % of nodes flagged toxic at the configured threshold." />
                        </div>
                        <div style={{ border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 80px 70px', alignItems: 'center', gap: 10, padding: '9px 12px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: 10.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            <span>User</span>
                            <span style={{ textAlign: 'right' }}>Nodes</span>
                            <span style={{ textAlign: 'right' }}>Avg Tox.</span>
                            <span style={{ textAlign: 'right' }}>Toxic %</span>
                          </div>
                          {!(toxicity?.byUser || []).length ? (
                            <div style={{ padding: 20, textAlign: 'center', color: '#64748B', fontSize: 12.5 }}>No toxicity scores in this period.</div>
                          ) : (
                            (toxicity.byUser).map((u, i) => (
                              <div key={u.userId} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 80px 70px', alignItems: 'center', gap: 10, padding: '9px 12px', borderBottom: i < toxicity.byUser.length - 1 ? '1px solid #F1F5F9' : 'none', fontSize: 12, color: '#334155', transition: 'background 0.15s ease' }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                              >
                                <span
                                  style={{ minWidth: 0, fontWeight: 600, color: '#8E77BB', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer', textDecoration: 'underline dotted', textUnderlineOffset: 3, textDecorationColor: '#C4B5FD' }}
                                  title={`${u.userId} — click to view sessions`}
                                  onClick={() => { setSelectedUserFilter(u.userId); setActiveTab('sessions'); }}
                                >{u.userId}</span>
                                <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 500, color: '#475569' }}>{fmtNumber(u.count)}</span>
                                <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: (u.avgToxicityPercent || 0) > 50 ? '#E11D48' : '#8E77BB' }}>{u.avgValue != null ? (u.avgValue * 100).toFixed(1) + '%' : '—'}</span>
                                <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 500, color: (u.toxicRate || 0) > 0 ? '#E11D48' : '#475569' }}>{u.toxicRate != null ? (u.toxicRate * 100).toFixed(1) + '%' : '—'}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '20px 22px 14px', display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em' }}>Toxicity by Session</div>
                            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Average output toxicity per session</div>
                          </div>
                          <InfoTooltip text="Average Detoxify toxicity score of node outputs per session (thread), with the % of nodes flagged toxic at the configured threshold." />
                        </div>
                        <div style={{ border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 80px 70px', alignItems: 'center', gap: 10, padding: '9px 12px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: 10.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            <span>Session</span>
                            <span style={{ textAlign: 'right' }}>Nodes</span>
                            <span style={{ textAlign: 'right' }}>Avg Tox.</span>
                            <span style={{ textAlign: 'right' }}>Toxic %</span>
                          </div>
                          {!(toxicity?.bySession || []).length ? (
                            <div style={{ padding: 20, textAlign: 'center', color: '#64748B', fontSize: 12.5 }}>No toxicity scores in this period.</div>
                          ) : (
                            (toxicity.bySession).map((s, i) => (
                              <div key={s.sessionId} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 80px 70px', alignItems: 'center', gap: 10, padding: '9px 12px', borderBottom: i < toxicity.bySession.length - 1 ? '1px solid #F1F5F9' : 'none', fontSize: 12, color: '#334155', transition: 'background 0.15s ease' }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                              >
                                <span
                                  style={{ minWidth: 0, fontWeight: 600, color: '#8E77BB', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer', textDecoration: 'underline dotted', textUnderlineOffset: 3, textDecorationColor: '#C4B5FD' }}
                                  title={`${s.sessionId} — click to view traces`}
                                  onClick={() => { setSelectedSessionFilter(s.sessionId); setActiveTab('traces'); }}
                                >{s.sessionId}</span>
                                <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 500, color: '#475569' }}>{fmtNumber(s.count)}</span>
                                <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: (s.avgToxicityPercent || 0) > 50 ? '#E11D48' : '#8E77BB' }}>{s.avgValue != null ? (s.avgValue * 100).toFixed(1) + '%' : '—'}</span>
                                <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 500, color: (s.toxicRate || 0) > 0 ? '#E11D48' : '#475569' }}>{s.toxicRate != null ? (s.toxicRate * 100).toFixed(1) + '%' : '—'}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Detailed Evaluation Benchmark Analytics */}
                    <div style={{ marginTop: 24 }}>
                      <ScoreAnalytics range={currentRange} />
                    </div>
                  </>
                )}

                {/* 6. SYSTEM METRICS VIEW */}
                {dashboardView === 'systemMetrics' && (
                  <SystemMetricsTab />
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
