import React, { useEffect, memo } from 'react';
import { FiSettings, FiX } from 'react-icons/fi';
import { Toggle, Field, Select, Input, Textarea } from './primitives';
import { LLMConfigSection } from './LlmConfigs';
import CollapsibleSection from './CollapsibleSection';

export const ToolConfigModal = memo(function ToolConfigModal({ toolName, config = {}, onChange, onClose, availableTools = [] }) {
  const toolInfo = availableTools.find(t => t.name === toolName) || { name: toolName };
  const set = (key, val) => onChange({ ...config, [key]: val });
  const toolConfigs = toolInfo.configs || [];

  useEffect(() => {
    let hasChanges = false;
    const nextConfig = { ...config };

    toolConfigs.forEach(f => {
      if (f.default !== undefined && f.default !== null && config[f.name] === undefined) {
        nextConfig[f.name] = f.default;
        hasChanges = true;
      }
    });

    if (hasChanges) {
      onChange(nextConfig);
    }
  }, [toolName]);

  const fields = (toolConfigs.length > 0
    ? toolConfigs
    : (toolName.toLowerCase().includes('rag') || toolName.toLowerCase().includes('memory'))
      ? [
        { name: 'collection_name', type: 'string', description: 'Vector collection name' },
        { name: 'k', type: 'number', description: 'Number of results to return' },
        { name: 'threshold', type: 'number', description: 'Similarity threshold (0.0 to 1.0)' }
      ]
      : []).filter(f => !(toolName === 'chart_generator' && f.name.startsWith('llm_')));

  const toolLlm = {
    provider: config.llm_provider || 'openai',
    model: config.llm_model || 'gpt-4o',
    temperature: config.llm_temperature ?? 0.1,
    api_key_override: config.llm_api_key_override || null,
    base_url: config.llm_base_url || null
  };

  const handleLlmChange = (newLlm) => {
    onChange({
      ...config,
      llm_provider: newLlm.provider,
      llm_model: newLlm.model,
      llm_temperature: newLlm.temperature,
      llm_api_key_override: newLlm.api_key_override,
      llm_base_url: newLlm.base_url
    });
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div className="w-[440px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-[var(--border)]">
        <div className="p-4 px-5 border-b border-[var(--border)] flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center gap-2.5">
            <FiSettings size={16} className="text-slate-600" />
            <div className="text-sm font-bold text-[var(--text-primary)]">{toolInfo.display_name || toolName} Settings</div>
          </div>
          <button onClick={onClose} className="bg-transparent border-none text-[var(--text-muted)] cursor-pointer"><FiX size={18} /></button>
        </div>

        <div className="p-5 max-h-[76vh] overflow-y-auto">
          <CollapsibleSection title="Advanced Options">
            <Toggle checked={config.return_direct || false} onChange={(v) => set('return_direct', v)} label="Return result direct to user" />
            <div className="h-px bg-[var(--border)] my-3" />
            <Toggle checked={config.interrupt_before || false} onChange={(v) => set('interrupt_before', v)} label="Pause before execution (Human approval)" />
          </CollapsibleSection>

          <div className="h-px bg-[var(--border)] my-4" />
          <div className="text-[11px] font-bold text-[var(--text-muted)] mb-3.5 uppercase tracking-wide">Tool Rename & Description Overrides</div>
          <Field label="Custom Tool Name (Alias)" hint="Specify a unique alias for this tool instance (e.g. hr_rag, student_rag) so the agent calls this specific name.">
            <Input
              value={config.alias_override || ''}
              onChange={(v) => set('alias_override', v)}
              placeholder="e.g. hr_rag"
            />
          </Field>
          <Field label="Custom Tool Description" hint="Provide a specific description so the agent knows when to use this instance over others.">
            <Textarea
              value={config.description_override || ''}
              onChange={(v) => set('description_override', v)}
              placeholder="e.g. Use this instance to search human resources documents."
              rows={3}
            />
          </Field>

          {toolName === 'chart_generator' && (
            <>
              <div className="h-px bg-[var(--border)] my-4" />
              <div className="text-[11px] font-bold text-[var(--text-muted)] mb-3.5 uppercase tracking-wide">Chart Generator LLM</div>
              <LLMConfigSection
                llm={toolLlm}
                onChange={handleLlmChange}
              />
            </>
          )}

          <div className="h-px bg-[var(--border)] my-4" />
          <div className="text-[11px] font-bold text-[var(--text-muted)] mb-3.5 uppercase tracking-wide">Parameter Overrides (Human-Only)</div>

          {fields.length > 0 ? (
            <div className="flex flex-col gap-3">
              {fields.map(f => (
                <Field key={f.name} label={f.name.replace(/_/g, ' ')} hint={f.description}>
                  {f.options && f.options.length > 0 ? (
                    <Select
                      value={config[f.name] || f.default}
                      onChange={(v) => set(f.name, f.type === 'number' ? parseFloat(v) : v)}
                      options={f.options.map(o => ({ value: o, label: o }))}
                    />
                  ) : (
                    <Input
                      type={
                        f.type === 'number' ? 'number' :
                          (f.type === 'password' || f.name.toLowerCase().includes('password') || f.name.toLowerCase().includes('key')) ? 'password' :
                            'text'
                      }
                      value={config[f.name]}
                      onChange={(v) => set(f.name, f.type === 'number' ? parseFloat(v) : v)}
                      placeholder={f.name === 'collection_name' ? 'default' : ''}
                    />
                  )}
                </Field>
              ))}
            </div>
          ) : (
            <div className="p-3 bg-slate-100 rounded-lg text-xs text-slate-600 text-center">
              No specific parameter overrides defined for this tool.
            </div>
          )}
        </div>

        <div className="p-4 px-5 bg-[#F8FAFC] border-t border-[var(--border)] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[var(--accent-btn)] text-white border-none rounded-lg text-xs font-semibold cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
});
