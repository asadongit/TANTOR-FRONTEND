import React from 'react';
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
    </>
  );
}

