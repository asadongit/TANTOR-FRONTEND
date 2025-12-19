import React, { useState } from 'react';

export default function AIPlayground() {
  const [selectedExperiment, setSelectedExperiment] = useState('');

  const experimentOptions = [
    { value: '', label: 'Select' },
    { value: 'exp1', label: 'Experiment 1' },
    { value: 'exp2', label: 'Experiment 2' },
  ];

  const disabled = !selectedExperiment;

  return (
    <div>
    <div style={{ minHeight: '100vh', background: '#fafbfc', padding: '32px 40px', fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto' }}>

              <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 24 }}>AI playground</h1>

        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
          Inject Your Data to Get Started
        </h2>

        <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24, maxWidth: 780 }}>
          Select an experiment and upload a dataset—or fetch data from views—to begin machine learning. GenAI, analytics, and observability workflows.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
          <label style={{ fontSize: 14, fontWeight: 500, color: '#111827', minWidth: 140 }}>
            Experiment Name
          </label>
          <select
            value={selectedExperiment}
            onChange={e => setSelectedExperiment(e.target.value)}
            style={{
              width: 260,
              height: 40,
              borderRadius: 6,
              border: '1px solid #e5e7eb',
              padding: '0 12px',
              fontSize: 14,
              background: '#f9fafb'
            }}
          >
            {experimentOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: 32, alignItems: 'stretch' }}>
          {/* Upload box */}
          <div
            style={{
              border: '1px dashed #dbe0ea',
              borderRadius: 8,
              padding: '32px 24px',
              textAlign: 'center',
              background: disabled ? '#f9fafb' : '#ffffff',
              opacity: disabled ? 0.6 : 1
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 500, color: '#9ca3af', marginBottom: 8 }}>
              Drag & Drop or Choose file to Upload
            </div>
            <div style={{ fontSize: 12, color: '#c0c6d4', marginBottom: 20 }}>
              Supported: Pdf, XL, XLSX | Max size: 25 MB
            </div>
            <button
              disabled={disabled}
              style={{
                height: 36,
                padding: '0 22px',
                borderRadius: 6,
                border: '1px solid #ede9fe',
                background: '#f5f3ff',
                color: '#8b5cf6',
                fontSize: 14,
                fontWeight: 500,
                cursor: disabled ? 'not-allowed' : 'pointer'
              }}
            >
              Upload
            </button>
          </div>

          {/* divider */}
          <div style={{ width: 1, background: '#eef0f4' }} />

          {/* Fetch box */}
          <div
            style={{
              border: '1px solid #eef0f4',
              borderRadius: 8,
              padding: '32px 24px',
              textAlign: 'center',
              background: disabled ? '#f9fafb' : '#ffffff',
              opacity: disabled ? 0.6 : 1
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 500, color: '#9ca3af', marginBottom: 8 }}>
              Fetch Data from Views
            </div>
            <div style={{ fontSize: 12, color: '#c0c6d4', marginBottom: 20 }}>
              Load data directly from available database views.
            </div>
            <button
              disabled={disabled}
              style={{
                height: 36,
                padding: '0 22px',
                borderRadius: 6,
                border: '1px solid #ede9fe',
                background: '#f5f3ff',
                color: '#8b5cf6',
                fontSize: 14,
                fontWeight: 500,
                cursor: disabled ? 'not-allowed' : 'pointer'
              }}
            >
              Fetch Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
