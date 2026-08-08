import PropTypes from 'prop-types';
import { FiCpu, FiServer, FiHardDrive } from 'react-icons/fi';

const SYSTEM_METRICS = [
  { key: 'cpu', label: 'CPU Utilization', value: '42%', sub: '4.2 / 8 cores', icon: FiCpu, accent: '#3b82f6' },
  { key: 'memory', label: 'Memory Usage', value: '68%', sub: '10.9 / 16 GB', icon: FiServer, accent: '#8e78b7' },
  { key: 'disk', label: 'Disk Usage', value: '54%', sub: '223 / 410 GB', icon: FiHardDrive, accent: '#f0a500' },
];

function SystemMetricCard({ icon: Icon, label, value, sub, accent, hint }) {
  return (
    <div style={{
      background: 'white', border: '1px solid var(--border)', borderRadius: 14,
      padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 8,
      minWidth: 0, transition: 'all 0.2s'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 12.5, fontWeight: 600 }}>
        <Icon size={15} color={accent} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sub}</div>}
      {hint && <div title={hint} style={{ fontSize: 11.5, color: 'var(--text-muted)', opacity: 0.75 }}>{hint}</div>}
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
};

export default function SystemMetricsTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {SYSTEM_METRICS.map((m) => (
          <SystemMetricCard key={m.key} {...m} />
        ))}
      </div>
    </div>
  );
}
