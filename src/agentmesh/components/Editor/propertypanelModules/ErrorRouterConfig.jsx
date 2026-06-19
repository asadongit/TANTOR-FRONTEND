import React from 'react';
import { FiInfo } from 'react-icons/fi';
import { LLMConfigSection } from './SharedComponents';

export default function ErrorRouterConfig({ data, update }) {
  return (
    <>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Analysis LLM</div>
        <LLMConfigSection
          llm={data.llm || { provider: 'groq', model: 'llama-3.3-70b-versatile', temperature: 0 }}
          onChange={(llm) => update({ llm })}
        />
      </div>
      <div style={{ padding: 12, background: '#FEF2F2', borderRadius: 10, fontSize: 11, color: '#991B1B', border: '1px solid #FECACA', lineHeight: 1.5 }}>
        <FiInfo size={12} style={{ marginRight: 5 }} />
        Analyzes system failures and decides: <strong>retry</strong>, <strong>abort</strong>, or <strong>human_help</strong>.
        Connect edges with these specific labels to define recovery paths.
      </div>
    </>
  );
}
