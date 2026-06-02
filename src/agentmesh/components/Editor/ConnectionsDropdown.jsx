import React, { useEffect } from 'react';
import { useWorkflowStore } from '../../store';
import { FiLink, FiLoader } from 'react-icons/fi';

export default function ConnectionsDropdown({ value, onChange }) {
  const { connectionsVault, isVaultLoaded, fetchConnectionsVault } = useWorkflowStore();

  useEffect(() => {
    fetchConnectionsVault();
  }, [fetchConnectionsVault]);

  if (!isVaultLoaded) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: '#F8FAFC', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text-muted)' }}>
        <FiLoader className="spin" /> Fetching Vault...
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', padding: '9px 12px', background: 'white',
          border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)',
          fontSize: 13, outline: 'none', appearance: 'none', cursor: 'pointer'
        }}
      >
        <option value="">-- Manual Authentication (No Profile) --</option>
        {connectionsVault.map(c => (
          <option key={c.id} value={c.id}>
            {c.platform_name} ({c.auth_type})
          </option>
        ))}
      </select>
      <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }}>
        <FiLink size={14} />
      </div>
    </div>
  );
}
