import React, { useState } from 'react';

function AIPlaygroundDashboard() {
  const [selectedExperiment, setSelectedExperiment] = useState('');

  // Dummy experiment options for demonstration
  const experimentOptions = [
    { value: '', label: 'Select' },
    { value: 'exp1', label: 'Experiment 1' },
    { value: 'exp2', label: 'Experiment 2' },
  ];

  const isDisabled = !selectedExperiment;

  return (
    <div style={{ padding: 24, background: '#fafbfc', minHeight: '100vh', borderRadius: 12 }}>
      <h2 style={{ fontWeight: 600, fontSize: 24, marginBottom: 24 }}>AI playground</h2>
      <div style={{
        background: '#fff',
        borderRadius: 12,
        padding: 32,
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        marginBottom: 24,
        maxWidth: 900,
        margin: '0 auto'
      }}>
        <div style={{ marginBottom: 16, fontWeight: 500, fontSize: 16 }}>
          Inject Your Data to Get Started
        </div>
        <div style={{ color: '#888', marginBottom: 24 }}>
          Select an experiment and upload a dataset—or fetch data from views—to begin machine learning, GenAI, analytics, and observability workflows.
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontWeight: 500, fontSize: 14, marginBottom: 8, display: 'block' }}>Experiment Name</label>
          <select
            value={selectedExperiment}
            onChange={e => setSelectedExperiment(e.target.value)}
            style={{
              width: 260,
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid #ddd',
              fontSize: 15,
              background: '#fafbfc'
            }}
          >
            {experimentOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          {/* Drag & Drop Upload */}
          <div style={{
            flex: 1,
            border: '1.5px dashed #d6d3f8',
            borderRadius: 10,
            padding: 24,
            background: isDisabled ? '#f5f5f5' : '#fafbfc',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            opacity: isDisabled ? 0.6 : 1,
            pointerEvents: isDisabled ? 'none' : 'auto'
          }}>
            <div style={{ marginBottom: 12, color: '#888', fontSize: 14 }}>
              Drag & Drop or Choose file to Upload
            </div>
            <div style={{ marginBottom: 12, color: '#b0b0b0', fontSize: 12 }}>
              Supported: Pdf, XL, XLSX | Max size: 25 MB
            </div>
            <button
              disabled={isDisabled}
              style={{
                padding: '8px 24px',
                borderRadius: 6,
                border: '1px solid #e0e0e0',
                background: isDisabled ? '#eaeaea' : '#f6f0ff',
                color: '#7c5cff',
                fontWeight: 500,
                cursor: isDisabled ? 'not-allowed' : 'pointer'
              }}
            >
              Upload
            </button>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            fontWeight: 500,
            color: '#bbb',
            fontSize: 15
          }}>
            OR
          </div>
          {/* Fetch Data from Views */}
          <div style={{
            flex: 1,
            border: '1.5px solid #eae6fa',
            borderRadius: 10,
            padding: 24,
            background: isDisabled ? '#f5f5f5' : '#fafbfc',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            opacity: isDisabled ? 0.6 : 1,
            pointerEvents: isDisabled ? 'none' : 'auto'
          }}>
            <div style={{ marginBottom: 12, color: '#888', fontSize: 14 }}>
              Fetch Data from Views
            </div>
            <div style={{ marginBottom: 12, color: '#b0b0b0', fontSize: 12 }}>
              Load data directly from available database views.
            </div>
            <button
              disabled={isDisabled}
              style={{
                padding: '8px 24px',
                borderRadius: 6,
                border: '1px solid #e0e0e0',
                background: isDisabled ? '#eaeaea' : '#f6f0ff',
                color: '#7c5cff',
                fontWeight: 500,
                cursor: isDisabled ? 'not-allowed' : 'pointer'
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

export default AIPlaygroundDashboard;