import React, { useState, memo } from 'react';
import { FiRepeat, FiLoader, FiZap } from 'react-icons/fi';
import { Field, Select, Input, Textarea, Toggle, PROVIDERS, MODELS } from './primitives';
import { SearchableSelect } from './SearchableSelect';

export const LLMConfigSection = memo(function LLMConfigSection({ llm, onChange }) {
  const provider = llm?.provider || 'groq';
  const models = MODELS[provider] || [];
  const isSelfHosted = ['ollama', 'sglang', 'vllm'].includes(provider);

  const selectedModelInList = models.includes(llm?.model);
  const isCustomModel = !selectedModelInList || llm?.model === 'custom-model';

  return (
    <>
      <Field label="Provider">
        <Select
          value={provider}
          onChange={(v) => onChange({ ...llm, provider: v, model: MODELS[v]?.[0] || '' })}
          options={PROVIDERS}
        />
      </Field>

      <Field label="Model">
        <Select
          value={selectedModelInList ? llm.model : 'custom-model'}
          onChange={(v) => {
            if (v === 'custom-model') {
              onChange({ ...llm, model: 'custom-model' });
            } else {
              onChange({ ...llm, model: v });
            }
          }}
          options={[...models, ...(models.includes('custom-model') ? [] : ['custom-model'])]}
        />
      </Field>

      {isCustomModel && (
        <Field label="Custom Model Name" hint="Enter the exact model identifier hosted on your server (e.g., meta-llama/Llama-3.1-70B-Instruct)">
          <Input
            value={llm?.model === 'custom-model' ? '' : (llm?.model || '')}
            onChange={(v) => onChange({ ...llm, model: v || 'custom-model' })}
            placeholder="e.g. meta-llama/Llama-3.1-70B-Instruct"
          />
        </Field>
      )}

      <Field label="Temperature">
        <Input
          type="number"
          value={llm?.temperature ?? 0}
          onChange={(v) => onChange({ ...llm, temperature: Number.parseFloat(v) || 0 })}
          placeholder="0.0"
          className="w-full"
        />
      </Field>

      {/* Every model is capped on how much it may write, and a reasoning model
          spends that same allowance thinking first. Asked for a large result
          from a dense document, it can use the whole budget before writing a
          word and return nothing — with no error anywhere. */}
      <Field
        label="Maximum Answer Length"
        hint="Roughly how much the step may write, in tokens (about ¾ of a word each). Leave empty for the default. Raise it when a step must return a long or highly detailed answer — if answers come back empty or cut off mid-way, this is usually why."
      >
        <Input
          type="number"
          value={llm?.max_tokens ?? ''}
          onChange={(v) =>
            onChange({ ...llm, max_tokens: v ? Number.parseInt(v, 10) || null : null })
          }
          placeholder="Default"
          className="w-full"
        />
      </Field>

      {/* Reasoning models show their working unless told not to, and that
          working arrives inside the answer. A step expecting only a JSON
          object then receives prose wrapped around one. */}
      <Field
        label="Show Model's Reasoning"
        hint="Reasoning models only. Choose Hidden when a later step needs the answer on its own — a JSON object, a single value. Leave on Model's default for ordinary models: they reject this setting and the call fails."
      >
        <Select
          value={llm?.reasoning_format || ''}
          onChange={(v) => onChange({ ...llm, reasoning_format: v || null })}
          options={[
            { value: '', label: "Model's default" },
            { value: 'hidden', label: 'Hidden — return only the answer' },
            { value: 'parsed', label: 'Separate — kept apart from the answer' },
            { value: 'raw', label: 'Included — inside the answer' },
          ]}
        />
      </Field>

      <Field
        label="Reasoning Depth"
        hint="How long a reasoning model thinks before answering. Deeper is slower and costs more. Ignored by models that do not reason."
      >
        <Select
          value={llm?.reasoning_effort || ''}
          onChange={(v) => onChange({ ...llm, reasoning_effort: v || null })}
          options={[
            { value: '', label: "Model's default" },
            { value: 'low', label: 'Low — fastest' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High — slowest, most thorough' },
          ]}
        />
      </Field>

      {isSelfHosted ? (
        <Field label={`${provider.toUpperCase()} Base URL`} hint={provider === 'sglang' ? "e.g., http://localhost:30000/v1" : "e.g., http://localhost:11434"}>
          <Input
            value={llm?.base_url || ''}
            onChange={(v) => onChange({ ...llm, base_url: v || null })}
            placeholder={provider === 'sglang' ? "http://localhost:30000/v1" : "http://localhost:11434"}
          />
        </Field>
      ) : (
        <Field label="API Key Override" hint="Leave blank to use the backend's default key.">
          <Input
            value={llm?.api_key_override || ''}
            onChange={(v) => onChange({ ...llm, api_key_override: v || null })}
            placeholder="sk-..."
            type="password"
          />
        </Field>
      )}
    </>
  );
});

export const IterationConfigSection = memo(function IterationConfigSection({ policy, onChange }) {
  const enabled = policy?.enabled || false;
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wide flex items-center gap-1.5">
          <FiRepeat size={12} className="text-[var(--accent-btn)]" /> Iteration & Self-Correction
        </div>
        <Toggle checked={enabled} onChange={(v) => onChange({ ...policy, enabled: v })} label="" />
      </div>

      {enabled ? (
        <div className="pl-2.5 border-l-2 border-[var(--accent-glow)] pt-1">
          <div className="flex gap-2.5 mb-4">
            <div className="flex-1">
              <Field label="Max Retries" hint="Maximum number of refinement iterations allowed before stopping.">
                <Input type="number" value={policy?.max_iterations ?? 3} onChange={(v) => onChange({ ...policy, max_iterations: parseInt(v) || 3 })} placeholder="3" />
              </Field>
            </div>
            <div className="flex-1">
              <Field label="Target Score" hint="Quality goal (0.0 to 1.0). Stops early if reached.">
                <Input type="number" value={policy?.target_score ?? 0.8} onChange={(v) => onChange({ ...policy, target_score: parseFloat(v) || 0.8 })} placeholder="0.8" />
              </Field>
            </div>
          </div>

          <Field label="Evaluator Instructions" hint="Prompt used by the QC agent to critique the work.">
            <Textarea
              value={policy?.evaluator_task || ''}
              onChange={(v) => onChange({ ...policy, evaluator_task: v })}
              placeholder="e.g. Verify the output is valid JSON and contains all required keys..."
              rows={3}
            />
          </Field>

          <Field label="Feedback Injection">
            <Select
              value={policy?.inject_feedback_as || 'human'}
              onChange={(v) => onChange({ ...policy, inject_feedback_as: v })}
              options={[
                { value: 'human', label: 'As Human Feedback (Visible)' },
                { value: 'system', label: 'As System Nudge (Stealthy)' }
              ]}
            />
          </Field>
        </div>
      ) : (
        <div className="text-[11px] text-[var(--text-muted)] italic pl-2.5">
          Self-correction is disabled. Enable to allow automatic peer review.
        </div>
      )}
    </div>
  );
});

export const ArchitectButton = memo(function ArchitectButton({ onClick, loading, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`border-none bg-transparent cursor-pointer flex items-center gap-1 text-[11px] text-[#8B5CF6] font-semibold transition-all duration-200 px-1.5 py-0.5 rounded hover:bg-[#F5F3FF] disabled:opacity-50`}
    >
      {loading ? <FiLoader className="animate-spin" size={12} /> : <FiZap size={12} />}
      {loading ? 'Generating...' : 'Architect'}
    </button>
  );
});

export const NodeIdList = memo(function NodeIdList({ value = [], onChange, placeholder, allNodes = [] }) {
  const [input, setInput] = useState('');

  const add = () => {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setInput('');
    }
  };

  const remove = (id) => onChange(value.filter(x => x !== id));
  const available = allNodes.filter(n => !value.includes(n.id) && !['start', 'end', '__start__', '__end__'].includes(n.id));

  return (
    <div>
      <div className="flex gap-1.5 mb-2">
        <select
          value=""
          onChange={(e) => { if (e.target.value && !value.includes(e.target.value)) { onChange([...value, e.target.value]); } }}
          className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-lg text-[13px] outline-none text-[var(--text-primary)] transition-colors duration-150 box-border cursor-pointer flex-1"
        >
          <option value="">Select a node to add…</option>
          {available.map(n => (
            <option key={n.id} value={n.id}>{n.data?.label || n.id} ({n.data?.type})</option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap gap-1">
        {value.filter(id => allNodes.some(n => n.id === id)).map((id) => {
          const targetNode = allNodes.find(n => n.id === id);
          return (
            <span key={id} className="flex items-center gap-1.5 px-2.5 py-1 bg-[#EEF2FF] border border-[#C7D2FE] rounded-full text-[11px] text-[#4338CA] font-semibold">
              {targetNode?.data?.label || id}
              <button onClick={() => remove(id)} className="bg-transparent border-none text-[#6366F1] cursor-pointer text-sm leading-none p-0">&times;</button>
            </span>
          );
        })}
      </div>
    </div>
  );
});

/**
 * ErrorTargetField — shared reusable component for the "on_error" routing field.
 * Replaces the repeated SearchableSelect block that was copy-pasted across 6 config files.
 */
export const ErrorTargetField = memo(function ErrorTargetField({ value, onChange, nodes, selectedNodeId, hint }) {
  return (
    <Field
      label="Error Target (On Failure)"
      hint={hint || 'If this node fails, jump to this specific error handler node. If empty, uses the global workflow handler.'}
    >
      <SearchableSelect
        value={value || ''}
        onChange={onChange}
        placeholder="— Use Global Handler —"
        options={[
          { value: '', label: '— Use Global Handler —' },
          ...(nodes || [])
            .filter(n => n.id !== selectedNodeId && !['start', 'end'].includes(n.data?.type))
            .map(n => ({
              value: n.id,
              label: n.data?.label || n.id,
              sublabel: n.data?.type
            }))
        ]}
      />
    </Field>
  );
});
