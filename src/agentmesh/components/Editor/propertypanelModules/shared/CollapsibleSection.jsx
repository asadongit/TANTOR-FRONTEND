import React, { useState } from 'react';
import { FiChevronDown, FiSettings } from 'react-icons/fi';
import { FONT } from './primitives';

export default function CollapsibleSection({ title, children, defaultOpen = false, icon: Icon = FiSettings }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '12px 16px',
          background: '#F8FAFC',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: isOpen ? '1px solid var(--border)' : 'none',
          userSelect: 'none'
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, fontFamily: FONT }}>
          {Icon && <Icon size={14} color="var(--accent-btn)" />}
          {title}
        </div>
        <FiChevronDown
          size={14}
          style={{
            color: 'var(--text-muted)',
            transition: 'transform 0.2s',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
          }}
        />
      </div>

      {isOpen && (
        <div style={{ padding: '16px', background: 'var(--bg-panel, white)' }}>
          {children}
        </div>
      )}
    </div>
  );
}
