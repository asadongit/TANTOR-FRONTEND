import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { FiCpu, FiServer, FiHardDrive, FiAlertTriangle, FiActivity, FiArrowUp, FiArrowDown, FiClock, FiRefreshCw, FiTerminal } from 'react-icons/fi';
import { getObservabilitySystemMetrics } from '../../../../api/agentmesh';

const BADGE_THEMES = {
  '#3b82f6': { bg: '#EFF6FF', icon: '#2563EB' },
  '#8e78b7': { bg: '#F4F0FA', icon: '#8E77BB' },
  '#f0a500': { bg: '#FEF3C7', icon: '#D97706' },
  '#10b981': { bg: '#ECFDF5', icon: '#059669' },
  '#ef4444': { bg: '#FEF2F2', icon: '#DC2626' },
  '#0ea5e9': { bg: '#ECFEFF', icon: '#0284C7' },
};

function SystemMetricCard({ icon: Icon, label, value, sub, accent, hint, extra }) {
  const theme = BADGE_THEMES[accent] || { bg: '#F1F5F9', icon: accent };

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
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', letterSpacing: '0.01em', marginBottom: 4 }}>
          {label}
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
          {value}
        </div>
      </div>
      {sub && <div style={{ fontSize: 11.5, color: '#64748B', fontWeight: 500 }}>{sub}</div>}
      {extra}
      {hint && <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{hint}</div>}
    </div>
  );
}

SystemMetricCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  sub: PropTypes.string,
  accent: PropTypes.string.isRequired,
  hint: PropTypes.string,
  extra: PropTypes.node,
};

const fmtRate = (bps) => {
  if (bps == null || isNaN(bps)) return '—';
  if (bps >= 1048576) return (bps / 1048576).toFixed(1) + ' MB/s';
  if (bps >= 1024) return (bps / 1024).toFixed(1) + ' KB/s';
  return Math.round(bps) + ' B/s';
};

const fmtUptime = (sec) => {
  if (sec == null) return '—';
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const fmtTime = (iso) => {
  if (!iso) return '—';
  const dt = new Date(iso);
  return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

export default function SystemMetricsTab() {
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(null);

  const fetchMetrics = useCallback(async () => {
    setError(null);
    try {
      const res = await getObservabilitySystemMetrics();
      setMetrics(res);
    } catch (err) {
      setError(err.message || 'Failed to load host metrics');
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 15000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
        {metrics?.generatedAt && (
          <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5 }}>
            <FiClock size={13} />
            Updated {fmtTime(metrics.generatedAt)}
          </span>
        )}
        <button
          onClick={fetchMetrics}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
            border: '1px solid var(--border)', borderRadius: 20, background: 'white',
            color: 'var(--text-secondary)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'inherit'
          }}
        >
          <FiRefreshCw size={14} />
          Refresh
        </button>
      </div>

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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <SystemMetricCard
          icon={FiCpu}
          label="CPU Utilization"
          value={metrics ? `${Math.round(metrics.cpu.percent)}%` : '—'}
          sub={metrics ? `${metrics.cpu.usedCores} / ${metrics.cpu.cores} cores` : '…'}
          accent="#3b82f6"
          hint="Host CPU utilization of the AgentMesh backend process machine."
        />
        <SystemMetricCard
          icon={FiServer}
          label="Memory Usage"
          value={metrics ? `${Math.round(metrics.memory.percent)}%` : '—'}
          sub={metrics ? `${metrics.memory.used} / ${metrics.memory.total}` : '…'}
          accent="#8e78b7"
          hint="Host RAM utilization of the AgentMesh backend machine."
        />
        <SystemMetricCard
          icon={FiHardDrive}
          label="Disk Usage"
          value={metrics ? `${Math.round(metrics.disk.percent)}%` : '—'}
          sub={metrics ? `${metrics.disk.used} / ${metrics.disk.total}` : '…'}
          accent="#f0a500"
          hint="Disk utilization of the volume hosting the backend."
        />
        <SystemMetricCard
          icon={FiActivity}
          label="Backend Process"
          value={metrics?.process?.cpuPercent != null ? `${Math.round(metrics.process.cpuPercent)}%` : '—'}
          sub={metrics?.process ? `${metrics.process.memory} RAM · ${metrics.process.threads} threads` : '…'}
          accent="#10b981"
          hint="This AgentMesh backend process only — CPU, resident memory and thread count."
        />
        <SystemMetricCard
          icon={FiArrowDown}
          label="Network"
          value={metrics ? fmtRate(metrics.network.recvBytesPerSec) : '—'}
          sub={metrics ? `↑ ${fmtRate(metrics.network.sentBytesPerSec)} sent` : '…'}
          accent="#ef4444"
          hint="Live network throughput of the backend host. First reading shows 0 until the next poll."
          extra={metrics && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#64748B', fontWeight: 600 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <FiArrowDown size={11} color="#059669" /> recv
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <FiArrowUp size={11} color="#2563EB" /> sent
              </span>
            </div>
          )}
        />
        <SystemMetricCard
          icon={FiTerminal}
          label="Host / Uptime"
          value={metrics ? fmtUptime(metrics.uptimeSec) : '—'}
          sub={metrics?.host ? metrics.host.hostname : '…'}
          accent="#0ea5e9"
          hint="Host uptime, machine hostname and OS of the backend server."
          extra={metrics?.host?.platform && (
            <div style={{ fontSize: 10.5, color: '#94A3B8', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {metrics.host.platform}
            </div>
          )}
        />
      </div>
    </div>
  );
}
