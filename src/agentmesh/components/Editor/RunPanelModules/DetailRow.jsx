import React from 'react';

export default function DetailRow({ label, value, copyable }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'white',
        padding: '8px 12px',
        borderRadius: 6,
        border: '1px solid #E5E7EB'
      }}>
        <code style={{
          flex: 1,
          fontSize: 11,
          color: '#1F2937',
          fontWeight: 600,
          wordBreak: 'break-all',
          fontFamily: '"Monaco", "Menlo", monospace'
        }}>
          {value}
        </code>
        {copyable && (
          <button
            onClick={handleCopy}
            title="Copy to clipboard"
            style={{
              padding: '4px 8px',
              borderRadius: 4,
              border: '1px solid #E5E7EB',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 10,
              fontWeight: 600,
              color: '#6B7280',
              transition: 'all 0.15s',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#F3F4F6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            {copied ? '✓' : '📋'}
          </button>
        )}
      </div>
    </div>
  );
}
