import React, { useState, useRef, useMemo, memo } from 'react';
import { FiPlus, FiX, FiTrash2, FiChevronDown, FiEdit, FiTarget, FiZap, FiLoader, FiSliders } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useRunStore, useWorkflowStore } from '../../../../store';
import { chatArchitect } from '../../../../api/agentmesh';
import { Field, Input, Textarea, Select, Toggle, MiniatureToggle, CommaArrayEditor } from './primitives';
import { VariableLinker, VariableDropdown } from './VariableLinker';
import { ListAccordionItem } from './ListAccordionItem';
import { KeyValueEditor } from './KeyValueEditor';

export const DOC_TYPE_CATEGORIES = {
  '.docx': ['Letter', 'Certificate', 'Report', 'Contract', 'Invoice', 'Proposal'],
  '.pdf': ['Letter', 'Certificate', 'Report', 'Contract', 'Invoice'],
  '.xlsx': ['Report', 'Invoice', 'Tracker', 'Dashboard'],
  '.csv': ['Report', 'Tracker'],
  '.md': ['Report', 'Notes', 'Summary'],
  '.json': ['Report', 'Data Export'],
};

export const FormFieldsEditor = memo(function FormFieldsEditor({ fields = [], onChange }) {
  const [collapsedFields, setCollapsedFields] = useState({});

  const toggleCollapse = (idx) => {
    setCollapsedFields(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const addField = () => {
    const newField = { id: `field_${fields.length + 1}`, label: `New Field ${fields.length + 1}`, type: 'text', required: false, enabled: true };
    onChange([...fields, newField]);
  };

  const updateField = (idx, patch) => {
    const next = [...fields];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };

  const removeField = (idx) => {
    const next = fields.filter((_, i) => i !== idx);
    onChange(next);
    setCollapsedFields(prev => {
      const nextCollapsed = {};
      Object.keys(prev).forEach(k => {
        const kInt = parseInt(k, 10);
        if (kInt < idx) nextCollapsed[kInt] = prev[kInt];
        else if (kInt > idx) nextCollapsed[kInt - 1] = prev[kInt];
      });
      return nextCollapsed;
    });
  };

  const moveField = (idx, dir) => {
    if ((idx === 0 && dir === -1) || (idx === fields.length - 1 && dir === 1)) return;
    const next = [...fields];
    const target = idx + dir;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
    setCollapsedFields(prev => ({
      ...prev,
      [idx]: prev[target],
      [target]: prev[idx]
    }));
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wide flex items-center gap-1.5">
          <FiEdit size={12} className="text-[var(--accent-btn)]" /> Form Fields ({fields.length})
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {fields.map((f, i) => {
          const isCollapsed = !!collapsedFields[i];
          const isEnabled = f.enabled !== false;
          return (
            <ListAccordionItem
              key={i}
              index={i}
              totalItems={fields.length}
              isCollapsed={isCollapsed}
              onToggleCollapse={() => toggleCollapse(i)}
              isEnabled={isEnabled}
              onToggleEnabled={(v) => updateField(i, { enabled: v })}
              onMoveUp={() => moveField(i, -1)}
              onMoveDown={() => moveField(i, 1)}
              onDelete={() => removeField(i)}
              headerContent={
                <>
                  <span className={`text-xs font-semibold truncate ${isEnabled ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                    {f.label || f.id || `Field #${i + 1}`}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono bg-slate-200 px-1.5 py-0.5 rounded shrink-0">
                    {f.type || 'text'}
                  </span>
                </>
              }
            >
              <div>
                <Field label="Field ID (Context Key)">
                  <Input value={f.id} onChange={(v) => updateField(i, { id: v })} placeholder="e.g. user_name" />
                </Field>
              </div>
                  {f.type !== 'remark' && (
                    <div>
                      <Field label="Label">
                        <Input value={f.label} onChange={(v) => updateField(i, { label: v })} placeholder="e.g. Full Name" />
                      </Field>
                    </div>
                  )}
                  <div>
                    <Field label="Type">
                      <Select
                        value={f.type || 'text'}
                        onChange={(v) => updateField(i, { type: v })}
                        options={[
                          { value: 'text', label: 'Text Input' },
                          { value: 'email', label: 'Email' },
                          { value: 'password', label: 'Password' },
                          { value: 'number', label: 'Number' },
                          { value: 'textarea', label: 'Long Text' },
                          { value: 'select', label: 'Dropdown Select' },
                          { value: 'multiselect', label: 'Multi-Select' },
                          { value: 'date', label: 'Date Picker' },
                          { value: 'boolean', label: 'Checkbox/Toggle' },
                          { value: 'file', label: 'File Upload' },
                          { value: 'remark', label: 'Info / Remark (Static Text)' },
                        ]}
                      />
                    </Field>
                  </div>
                  {f.type !== 'remark' && (
                    <>
                      <div>
                        <Field label="Placeholder">
                          <Input value={f.placeholder || ''} onChange={(v) => updateField(i, { placeholder: v })} placeholder="e.g. Enter your name here" />
                        </Field>
                      </div>
                      <div className="flex gap-3 items-start">
                        <div className="flex-1">
                          <Toggle checked={f.required} onChange={(v) => updateField(i, { required: v })} label="Required" />
                        </div>
                      </div>
                    </>
                  )}

                  {(f.type === 'select' || f.type === 'multiselect') && (
                    <div className="mt-2">
                      <Field label="Options (One per line)" hint="Enter each option on a separate line. Use {{variable}} (e.g. {{techniques}}) to load a list from context.">
                        <textarea
                          value={Array.isArray(f.options) ? f.options.join('\n') : (f.options || '')}
                          onChange={(e) => updateField(i, { options: e.target.value.split('\n').map(s => s.trim()) })}
                          placeholder={"First Option\nSecond Option\n{{techniques}}"}
                          className="w-full min-h-[80px] p-3 rounded-lg border border-[var(--border)] bg-slate-50 text-[13px] outline-none resize-y"
                        />
                      </Field>
                    </div>
                  )}

                  {f.type === 'remark' && (
                    <div className="mt-2">
                      <Field label="Remark Content" hint="Static text to be displayed in the form (supports basic formatting).">
                        <textarea
                          value={f.content || ''}
                          onChange={(e) => updateField(i, { content: e.target.value })}
                          placeholder={"General Terms:\n1. Non-refundable\n2. Requires ID verification"}
                          className="w-full min-h-[100px] p-3 rounded-lg border border-[var(--border)] bg-slate-50 text-[13px] outline-none resize-y"
                        />
                      </Field>
                    </div>
                  )}
            </ListAccordionItem>
          );
        })}

        <button
          onClick={addField}
          className="flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-slate-300 bg-white text-slate-500 text-xs font-semibold cursor-pointer transition-colors duration-200 hover:border-[var(--accent-btn)] hover:text-[var(--accent-btn)]"
        >
          <FiPlus size={14} /> Add Form Field
        </button>
      </div>
    </div>
  );
});

export const FormDecisionsEditor = memo(function FormDecisionsEditor({ decisions = [], onChange }) {
  const [collapsedDecisions, setCollapsedDecisions] = useState({});

  const toggleCollapse = (idx) => {
    setCollapsedDecisions(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const addDecision = () => {
    const newDecision = { id: `decision_${decisions.length + 1}`, label: `Decision ${decisions.length + 1}` };
    onChange([...decisions, newDecision]);
  };

  const updateDecision = (idx, patch) => {
    const next = [...decisions];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };

  const removeDecision = (idx) => {
    const next = decisions.filter((_, i) => i !== idx);
    onChange(next);
    setCollapsedDecisions(prev => {
      const nextCollapsed = {};
      Object.keys(prev).forEach(k => {
        const kInt = parseInt(k, 10);
        if (kInt < idx) nextCollapsed[kInt] = prev[kInt];
        else if (kInt > idx) nextCollapsed[kInt - 1] = prev[kInt];
      });
      return nextCollapsed;
    });
  };

  const moveDecision = (idx, dir) => {
    if ((idx === 0 && dir === -1) || (idx === decisions.length - 1 && dir === 1)) return;
    const next = [...decisions];
    const target = idx + dir;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
    setCollapsedDecisions(prev => ({
      ...prev,
      [idx]: prev[target],
      [target]: prev[idx]
    }));
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wide flex items-center gap-1.5">
          <FiTarget size={12} className="text-[var(--accent-btn)]" /> Decision Buttons ({decisions.length})
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {decisions.map((d, i) => {
          const isCollapsed = !!collapsedDecisions[i];
          const isEnabled = d.enabled !== false;
          return (
            <div key={i} className={`p-3 bg-slate-50 rounded-xl border border-[var(--border)] relative transition-all duration-200 ${isEnabled ? 'opacity-100' : 'opacity-60'}`}>
              <div className={`flex items-center gap-1.5 ${isCollapsed ? 'mb-0' : 'mb-3'}`}>
                {/* Collapse toggle */}
                <div className="flex items-center gap-1.5 flex-1 min-w-0 cursor-pointer" onClick={() => toggleCollapse(i)}>
                  <FiChevronDown 
                    size={14} 
                    className="text-[var(--text-muted)] transition-transform duration-200 shrink-0"
                    style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }} 
                  />
                  <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
                    {d.label || d.id || `Decision #${i + 1}`}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono bg-slate-200 px-1.5 py-0.5 rounded shrink-0">
                    {d.id}
                  </span>
                </div>

                {/* Up/Down */}
                <div className="flex items-center gap-0.5 border-r border-[var(--border)] pr-1.5">
                  <button onClick={() => moveDecision(i, -1)} disabled={i === 0} className="bg-transparent border-none text-[var(--text-muted)] cursor-pointer disabled:opacity-30 p-0.5" title="Move Up"><FiChevronDown size={13} className="rotate-180" /></button>
                  <button onClick={() => moveDecision(i, 1)} disabled={i === decisions.length - 1} className="bg-transparent border-none text-[var(--text-muted)] cursor-pointer disabled:opacity-30 p-0.5" title="Move Down"><FiChevronDown size={13} /></button>
                </div>

                {/* Toggle (purple) */}
                <MiniatureToggle
                  checked={isEnabled}
                  onChange={(v) => updateDecision(i, { enabled: v })}
                />

                {/* Delete */}
                <button onClick={() => removeDecision(i)} className="bg-transparent border-none text-red-500 cursor-pointer p-0.5" title="Delete Decision"><FiTrash2 size={13} /></button>
              </div>

              {!isCollapsed && (
                <div className="flex flex-col gap-3">
                  <div>
                    <Field label="Button ID (Value in Context)">
                      <Input value={d.id} onChange={(v) => updateDecision(i, { id: v })} placeholder="e.g. approve, cancel" />
                    </Field>
                  </div>
                  <div>
                    <Field label="Button Label (Display Text)">
                      <Input value={d.label} onChange={(v) => updateDecision(i, { label: v })} placeholder="e.g. Approve, Cancel Request" />
                    </Field>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <button
          onClick={addDecision}
          className="flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-slate-300 bg-white text-slate-500 text-xs font-semibold cursor-pointer transition-colors duration-200 hover:border-[var(--accent-btn)] hover:text-[var(--accent-btn)]"
        >
          <FiPlus size={14} /> Add Decision Button
        </button>
      </div>
    </div>
  );
});

export const CustomRegexEditor = memo(function CustomRegexEditor({ value = [], onChange }) {
  const addPattern = () => {
    onChange([...value, { name: '', regex: '', flag: 'i', rule_type: 'REDACT' }]);
  };

  const updatePattern = (idx, key, val) => {
    const next = [...value];
    next[idx] = { ...next[idx], [key]: val };
    onChange(next);
  };

  const removePattern = (idx) => {
    const next = [...value];
    next.splice(idx, 1);
    onChange(next);
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2.5">
        <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wide">
          Custom PII Regex Rules
        </label>
        <button
          onClick={addPattern}
          className="bg-transparent border-none text-[var(--accent-btn)] cursor-pointer flex items-center gap-1 text-[11px] font-bold"
        >
          <FiPlus size={14} /> Add Pattern
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {value.map((pat, idx) => (
          <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-[var(--border)] relative">
            <button
              onClick={() => removePattern(idx)}
              className="absolute top-1.5 right-1.5 bg-transparent border-none text-red-500 cursor-pointer"
            >
              <FiX size={12} />
            </button>
            <div className="grid grid-cols-2 gap-1.5 mb-1.5">
              <div>
                <label className="text-[9px] font-bold text-[var(--text-muted)] block mb-0.5">RULE NAME</label>
                <Input value={pat.name} onChange={(v) => updatePattern(idx, 'name', v)} placeholder="e.g. AccountNumber" style={{ padding: '4px 8px', fontSize: 11 }} />
              </div>
              <div>
                <label className="text-[9px] font-bold text-[var(--text-muted)] block mb-0.5">ACTION TYPE</label>
                <Select
                  value={pat.rule_type}
                  onChange={(v) => updatePattern(idx, 'rule_type', v)}
                  options={[
                    { value: 'REDACT', label: 'Redact (replace)' },
                    { value: 'BLOCK', label: 'Block (error out)' }
                  ]}
                />
              </div>
            </div>
            <div>
              <label className="text-[9px] font-bold text-[var(--text-muted)] block mb-0.5">REGEX PATTERN</label>
              <Input value={pat.regex} onChange={(v) => updatePattern(idx, 'regex', v)} placeholder="e.g. \\b\\d{4}-\\d{4}\\b" style={{ padding: '4px 8px', fontSize: 11, fontFamily: 'monospace' }} />
            </div>
          </div>
        ))}
        {value.length === 0 && (
          <div className="text-[11px] text-[var(--text-muted)] italic p-1">
            No custom regex patterns defined.
          </div>
        )}
      </div>
    </div>
  );
});

export const VisualOperationsEditor = memo(function VisualOperationsEditor({ value = [], onChange }) {
  const latestContext = useRunStore(s => s.latestContext) || {};
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const activeWorkflow = useWorkflowStore.getState();
      const currentWorkflow = {
        id: activeWorkflow.workflowId,
        name: activeWorkflow.name,
        nodes: activeWorkflow.nodes,
        edges: activeWorkflow.edges
      };

      const systemPrompt = `You are the Workflow Architect AI. The user wants to configure a JSON Transform Visual Operations list.
We have the following runtime context:
${JSON.stringify(latestContext, null, 2)}

And the user wants to perform this operation:
"${aiPrompt}"

Please respond with ONLY a raw JSON array (enclosed in a \`\`\`json block) representing the list of visual operations matching the user's request.
Each operation in the array must follow the structure:
- Extract Field: { "type": "extract_field", "source_path": "nested.path", "field": "field_name", "destination": "dest_key" }
- Filter: { "type": "filter", "source_path": "list.path", "filter_field": "field_name", "filter_operator": "==", "filter_value": "value", "destination": "dest_key" }
- Map List: { "type": "map", "source_path": "list.path", "field": "field_to_extract", "destination": "dest_key" }
- Object Projection Map List: { "type": "map", "source_path": "list.path", "use_projection": true, "projections": [ { "target_path": "dest.path", "source_field": "relative.source.path" } ], "destination": "dest_key" }
- Rename: { "type": "rename", "source_path": "old_key", "destination": "new_key" }
- Set Value: { "type": "set_value", "destination": "dest.path", "static_value": "val" }
- Delete Field: { "type": "delete_field", "field": "field_name" }
- Flatten List: { "type": "flatten", "source_path": "list.path", "destination": "dest_key" }

Output ONLY the JSON list inside \`\`\`json ... \`\`\` block. No other text.`;

      const response = await chatArchitect(
        currentWorkflow,
        latestContext,
        [{ role: 'user', content: systemPrompt }],
        { provider: 'groq', model: 'llama-3.3-70b-versatile', temperature: 0.1 }
      );

      if (response && response.status === 'success' && response.reply) {
        const match = response.reply.match(/```json\s*([\s\S]*?)\s*```/) || response.reply.match(/\[\s*\{[\s\S]*?\}\s*\]/);
        const jsonStr = match ? match[1] || match[0] : response.reply;
        const parsed = JSON.parse(jsonStr.trim());
        if (Array.isArray(parsed)) {
          onChange([...value, ...parsed]);
          toast.success("Operations configured by Architect Bot!");
          setAiOpen(false);
          setAiPrompt('');
        } else {
          throw new Error("Response was not a list of operations.");
        }
      } else {
        throw new Error(response.message || "Failed to generate response.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Architect Bot failed: " + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const contextKeys = useMemo(() => {
    const keys = [];
    const recurse = (obj, prefix = '') => {
      if (!obj || typeof obj !== 'object') return;
      Object.keys(obj).forEach(k => {
        const path = prefix ? `${prefix}.${k}` : k;
        keys.push(path);
        if (typeof obj[k] === 'object' && obj[k] !== null && keys.length < 300) {
          recurse(obj[k], path);
        }
      });
    };
    recurse(latestContext);
    return keys;
  }, [latestContext]);

  const addOperation = () => {
    onChange([...value, { type: 'extract_field', source_path: '', field: '', destination: '' }]);
  };

  const updateOperation = (index, patch) => {
    const next = [...value];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const removeOperation = (index) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const moveOperation = (index, direction) => {
    const next = [...value];
    const target = index + direction;
    if (target >= 0 && target < next.length) {
      const temp = next[index];
      next[index] = next[target];
      next[target] = temp;
      onChange(next);
    }
  };

  const opTypes = [
    { value: 'extract_field', label: 'Extract Field (Nested to Key)' },
    { value: 'filter', label: 'Filter List (Condition)' },
    { value: 'map', label: 'Map List (Extract from items)' },
    { value: 'rename', label: 'Rename Key' },
    { value: 'set_value', label: 'Set Static Value' },
    { value: 'delete_field', label: 'Delete Key' },
    { value: 'flatten', label: 'Flatten Nested Lists' },
    { value: 'flatten_dict', label: 'Flatten Nested Dictionary (nested → flat keys)' },
    { value: 'pick', label: 'Pick Fields (keep only listed fields)' },
    { value: 'omit', label: 'Omit Keys (remove specific keys)' },
    { value: 'rename_map', label: 'Rename Multiple Keys' }
  ];

  return (
    <div className="flex flex-col gap-3 mt-2.5 mb-4.5">
      <div className="bg-[#F5F3FF] border border-solid border-purple-200/50 rounded-xl p-3 flex flex-col gap-2.5">
        <div 
          onClick={() => setAiOpen(!aiOpen)}
          className="flex justify-between items-center cursor-pointer"
        >
          <span className="text-[11px] font-bold text-[#7C3AED] flex items-center gap-1.5">
            <FiZap size={12} /> ASK ARCHITECT BOT (AI WIZARD)
          </span>
          <span className="text-[10px] text-[var(--text-muted)]">{aiOpen ? 'Collapse' : 'Expand'}</span>
        </div>

        {aiOpen && (
          <div className="flex flex-col gap-2.5 mt-1">
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Explain what you want to extract or modify in plain English... (e.g. 'Get run_name and test accuracy from job_status.tasks')"
              rows={3}
              className="w-full p-2 py-2.5 text-[11px] border border-[var(--border)] rounded-lg outline-none resize-none bg-white text-[var(--text-primary)]"
            />
            <button
              onClick={handleAiGenerate}
              disabled={aiLoading || !aiPrompt.trim()}
              className={`py-2 px-3 bg-[#7C3AED] text-white border-none rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all duration-200 ${aiLoading || !aiPrompt.trim() ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-purple-700'}`}
            >
              {aiLoading ? <FiLoader className="animate-spin" size={12} /> : <FiZap size={12} />}
              {aiLoading ? 'Architect Bot Thinking...' : 'Generate Steps'}
            </button>
          </div>
        )}
      </div>

      <datalist id="jt-context-keys">
        {contextKeys.map(k => <option key={k} value={k} />)}
      </datalist>

      {value.map((op, idx) => (
        <div key={idx} className={`p-3.5 bg-slate-50 border border-[var(--border)] rounded-xl flex flex-col gap-3 relative transition-all duration-200 ${op.disabled ? 'opacity-55' : 'opacity-100'}`}>
          {/* Standard accordion header: Chevron+Label | Up/Down | Toggle | Delete */}
          <div className="flex items-center gap-1.5">
            {/* Left: step label (no collapse, operations always expanded) */}
            <span className={`text-[11px] font-bold tracking-wider flex-1 ${op.disabled ? 'text-slate-400' : 'text-[var(--accent-btn)]'}`}>
              STEP {idx + 1}
            </span>

            {/* Up/Down */}
            <div className="flex items-center gap-0.5 border-r border-[var(--border)] pr-1.5">
              <button
                disabled={idx === 0}
                onClick={() => moveOperation(idx, -1)}
                className="bg-transparent border-none p-0.5 cursor-pointer disabled:cursor-not-allowed text-[var(--text-muted)] disabled:opacity-30"
                title="Move Up"
              >
                <FiChevronDown size={13} className="rotate-180" />
              </button>
              <button
                disabled={idx === value.length - 1}
                onClick={() => moveOperation(idx, 1)}
                className="bg-transparent border-none p-0.5 cursor-pointer disabled:cursor-not-allowed text-[var(--text-muted)] disabled:opacity-30"
                title="Move Down"
              >
                <FiChevronDown size={13} />
              </button>
            </div>

            {/* Toggle (purple via MiniatureToggle) */}
            <MiniatureToggle
              checked={!op.disabled}
              onChange={(v) => updateOperation(idx, { disabled: !v })}
            />

            {/* Delete */}
            <button
              onClick={() => removeOperation(idx)}
              className="bg-transparent border-none text-red-500 cursor-pointer p-0.5"
              title="Remove Operation"
            >
              <FiTrash2 size={13} />
            </button>
          </div>

          <div>
            <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">OPERATION TYPE</label>
            <select
              value={op.type}
              onChange={(e) => updateOperation(idx, { type: e.target.value })}
              className="w-full px-2 py-1.5 bg-white border border-[var(--border)] rounded-lg text-xs outline-none text-[var(--text-primary)] transition-colors duration-150 box-border"
            >
              {opTypes.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {op.type === 'extract_field' && (
            <div className="flex flex-col gap-2.5">
              <div>
                <label className="text-[9px] font-bold text-[var(--text-muted)] block mb-0.5">SOURCE PATH (NESTED DICT/LIST)</label>
                <input
                  list="jt-context-keys"
                  value={op.source_path ?? ''}
                  onChange={(e) => updateOperation(idx, { source_path: e.target.value })}
                  placeholder="e.g. data.results"
                  className="w-full px-2 py-1.5 bg-white border border-[var(--border)] rounded-lg text-xs outline-none text-[var(--text-primary)] transition-colors duration-150 box-border"
                />
              </div>
              <div className="flex gap-2.5">
                <div className="flex-1">
                  <label className="text-[9px] font-bold text-[var(--text-muted)] block mb-0.5">TARGET FIELD</label>
                  <input
                    value={op.field ?? ''}
                    onChange={(e) => updateOperation(idx, { field: e.target.value })}
                    placeholder="e.g. status"
                    className="w-full px-2 py-1.5 bg-white border border-[var(--border)] rounded-lg text-xs outline-none text-[var(--text-primary)] transition-colors duration-150 box-border"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[9px] font-bold text-[var(--text-muted)] block mb-0.5">DESTINATION KEY (ROOT)</label>
                  <input
                    value={op.destination ?? ''}
                    onChange={(e) => updateOperation(idx, { destination: e.target.value })}
                    placeholder="e.g. job_status"
                    className="w-full px-2 py-1.5 bg-white border border-[var(--border)] rounded-lg text-xs outline-none text-[var(--text-primary)] transition-colors duration-150 box-border"
                  />
                </div>
              </div>
            </div>
          )}

          {op.type === 'filter' && (
            <div className="flex flex-col gap-2.5">
              <div>
                <label className="text-[9px] font-bold text-[var(--text-muted)] block mb-0.5">SOURCE LIST PATH</label>
                <input
                  list="jt-context-keys"
                  value={op.source_path ?? ''}
                  onChange={(e) => updateOperation(idx, { source_path: e.target.value })}
                  placeholder="e.g. data.items"
                  className="w-full px-2 py-1.5 bg-white border border-[var(--border)] rounded-lg text-xs outline-none text-[var(--text-primary)] transition-colors duration-150 box-border"
                />
              </div>
              <div className="flex gap-1.5 items-end">
                <div className="flex-[1.5]">
                  <label className="text-[9px] font-bold text-[var(--text-muted)] block mb-0.5">FILTER FIELD</label>
                  <input
                    value={op.filter_field ?? ''}
                    onChange={(e) => updateOperation(idx, { filter_field: e.target.value })}
                    placeholder="e.g. status"
                    className="w-full px-2 py-1.5 bg-white border border-[var(--border)] rounded-lg text-xs outline-none text-[var(--text-primary)] transition-colors duration-150 box-border"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[9px] font-bold text-[var(--text-muted)] block mb-0.5">OP</label>
                  <select
                    value={op.filter_operator ?? '=='}
                    onChange={(e) => updateOperation(idx, { filter_operator: e.target.value })}
                    className="w-full px-2 py-1.5 bg-white border border-[var(--border)] rounded-lg text-xs outline-none text-[var(--text-primary)] transition-colors duration-150 box-border"
                  >
                    <option value="==">==</option>
                    <option value="!=">!=</option>
                    <option value="contains">contains</option>
                    <option value=">">&gt;</option>
                    <option value="<">&lt;</option>
                  </select>
                </div>
                <div className="flex-[1.5]">
                  <label className="text-[9px] font-bold text-[var(--text-muted)] block mb-0.5">VALUE</label>
                  <input
                    value={op.filter_value ?? ''}
                    onChange={(e) => updateOperation(idx, { filter_value: e.target.value })}
                    placeholder="e.g. active"
                    className="w-full px-2 py-1.5 bg-white border border-[var(--border)] rounded-lg text-xs outline-none text-[var(--text-primary)] transition-colors duration-150 box-border"
                  />
                </div>
              </div>
              <div>
                <label className="text-[9px] font-bold text-[var(--text-muted)] block mb-0.5">DESTINATION KEY (OPTIONAL)</label>
                <input
                  value={op.destination ?? ''}
                  onChange={(e) => updateOperation(idx, { destination: e.target.value })}
                  placeholder="e.g. filtered_items"
                  className="w-full px-2 py-1.5 bg-white border border-[var(--border)] rounded-lg text-xs outline-none text-[var(--text-primary)] transition-colors duration-150 box-border"
                />
              </div>
            </div>
          )}

          {op.type === 'map' && (() => {
            const projections = op.projections || [];
            const isProjection = projections.length > 0 || op.use_projection;

            const addProj = () => {
              const nextProj = [...projections, { target_path: '', source_field: '' }];
              updateOperation(idx, { projections: nextProj, use_projection: true });
            };

            const updateProj = (pIdx, patch) => {
              const nextProj = [...projections];
              nextProj[pIdx] = { ...nextProj[pIdx], ...patch };
              updateOperation(idx, { projections: nextProj });
            };

            const removeProj = (pIdx) => {
              const nextProj = projections.filter((_, i) => i !== pIdx);
              updateOperation(idx, { projections: nextProj });
            };

            const toggleProjection = (checked) => {
              if (checked) {
                updateOperation(idx, { use_projection: true, projections: projections.length > 0 ? projections : [{ target_path: '', source_field: '' }] });
              } else {
                updateOperation(idx, { use_projection: false, projections: [] });
              }
            };

            return (
              <div className="flex flex-col gap-2.5">
                <div>
                  <label className="text-[9px] font-bold text-[var(--text-muted)] block mb-0.5">SOURCE LIST PATH</label>
                  <input
                    list="jt-context-keys"
                    value={op.source_path ?? ''}
                    onChange={(e) => updateOperation(idx, { source_path: e.target.value })}
                    placeholder="e.g. job_status.tasks"
                    className="w-full px-2 py-1.5 bg-white border border-[var(--border)] rounded-lg text-xs outline-none text-[var(--text-primary)] transition-colors duration-150 box-border"
                  />
                </div>

                <div className="flex items-center gap-1.5 my-1">
                  <input
                    type="checkbox"
                    id={`jt-map-proj-${idx}`}
                    checked={isProjection}
                    onChange={(e) => toggleProjection(e.target.checked)}
                    className="cursor-pointer"
                  />
                  <label htmlFor={`jt-map-proj-${idx}`} className="text-xs font-semibold text-[var(--text-primary)] cursor-pointer">
                    Construct custom objects (Object Projection)
                  </label>
                </div>

                {isProjection ? (
                  <div className="flex flex-col gap-2 bg-slate-900/5 p-2.5 rounded-lg border border-[var(--border)]">
                    <div className="text-[10px] font-bold text-[var(--text-muted)]">FIELD MAPPINGS</div>
                    {projections.map((proj, pIdx) => (
                      <div key={pIdx} className="flex gap-1.5 items-center">
                        <input
                          value={proj.target_path}
                          onChange={(e) => updateProj(pIdx, { target_path: e.target.value })}
                          placeholder="Target path (e.g. train.accuracy)"
                          className="px-2 py-1 rounded-md border border-[var(--border)] text-xs outline-none bg-white flex-1"
                        />
                        <span className="text-xs text-[var(--text-muted)]">&larr;</span>
                        <input
                          value={proj.source_field}
                          onChange={(e) => updateProj(pIdx, { source_field: e.target.value })}
                          placeholder="Source path (relative to item)"
                          className="px-2 py-1 rounded-md border border-[var(--border)] text-xs outline-none bg-white flex-1"
                        />
                        <button
                          onClick={() => removeProj(pIdx)}
                          className="bg-transparent border-none text-red-500 cursor-pointer p-1"
                        >
                          <FiTrash2 size={11} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={addProj}
                      className="p-1.5 bg-white border border-dashed border-[var(--border)] rounded-md text-[10px] text-[var(--accent-btn)] cursor-pointer font-semibold mt-1"
                    >
                      + Add Field Mapping
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2.5">
                    <div className="flex-1">
                      <label className="text-[9px] font-bold text-[var(--text-muted)] block mb-0.5">FIELD TO EXTRACT</label>
                      <input
                        value={op.field ?? ''}
                        onChange={(e) => updateOperation(idx, { field: e.target.value })}
                        placeholder="e.g. email"
                        className="w-full px-2 py-1.5 bg-white border border-[var(--border)] rounded-lg text-xs outline-none text-[var(--text-primary)] transition-colors duration-150 box-border"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[9px] font-bold text-[var(--text-muted)] block mb-0.5">DESTINATION KEY</label>
                  <input
                    value={op.destination ?? ''}
                    onChange={(e) => updateOperation(idx, { destination: e.target.value })}
                    placeholder="e.g. user_emails"
                    className="w-full px-2 py-1.5 bg-white border border-[var(--border)] rounded-lg text-xs outline-none text-[var(--text-primary)] transition-colors duration-150 box-border"
                  />
                </div>
              </div>
            );
          })()}

          {op.type === 'rename' && (
            <div className="flex gap-2.5">
              <div className="flex-1">
                <label className="text-[9px] font-bold text-[var(--text-muted)] block mb-0.5">SOURCE KEY</label>
                <input
                  list="jt-context-keys"
                  value={op.source_path ?? ''}
                  onChange={(e) => updateOperation(idx, { source_path: e.target.value })}
                  placeholder="e.g. old_name"
                  className="w-full px-2 py-1.5 bg-white border border-[var(--border)] rounded-lg text-xs outline-none text-[var(--text-primary)] transition-colors duration-150 box-border"
                />
              </div>
              <div className="flex-1">
                <label className="text-[9px] font-bold text-[var(--text-muted)] block mb-0.5">NEW KEY NAME</label>
                <input
                  value={op.destination ?? ''}
                  onChange={(e) => updateOperation(idx, { destination: e.target.value })}
                  placeholder="e.g. new_name"
                  className="w-full px-2 py-1.5 bg-white border border-[var(--border)] rounded-lg text-xs outline-none text-[var(--text-primary)] transition-colors duration-150 box-border"
                />
              </div>
            </div>
          )}

          {op.type === 'set_value' && (
            <div className="flex gap-2.5">
              <div className="flex-1">
                <label className="text-[9px] font-bold text-[var(--text-muted)] block mb-0.5">DESTINATION PATH</label>
                <input
                  value={op.destination ?? ''}
                  onChange={(e) => updateOperation(idx, { destination: e.target.value })}
                  placeholder="e.g. config.debug"
                  className="w-full px-2 py-1.5 bg-white border border-[var(--border)] rounded-lg text-xs outline-none text-[var(--text-primary)] transition-colors duration-150 box-border"
                />
              </div>
              <div className="flex-1">
                <label className="text-[9px] font-bold text-[var(--text-muted)] block mb-0.5">STATIC VALUE</label>
                <input
                  value={op.static_value ?? ''}
                  onChange={(e) => updateOperation(idx, { static_value: e.target.value })}
                  placeholder="e.g. true"
                  className="w-full px-2 py-1.5 bg-white border border-[var(--border)] rounded-lg text-xs outline-none text-[var(--text-primary)] transition-colors duration-150 box-border"
                />
              </div>
            </div>
          )}

          {op.type === 'delete_field' && (
            <div>
              <label className="text-[9px] font-bold text-[var(--text-muted)] block mb-0.5">FIELD TO DELETE (ROOT)</label>
              <input
                list="jt-context-keys"
                value={op.field ?? ''}
                onChange={(e) => updateOperation(idx, { field: e.target.value })}
                placeholder="e.g. sensitive_field"
                className="w-full px-2 py-1.5 bg-white border border-[var(--border)] rounded-lg text-xs outline-none text-[var(--text-primary)] transition-colors duration-150 box-border"
              />
            </div>
          )}

          {op.type === 'flatten' && (
            <div className="flex gap-2.5">
              <div className="flex-1">
                <label className="text-[9px] font-bold text-[var(--text-muted)] block mb-0.5">SOURCE LIST OF LISTS</label>
                <input
                  list="jt-context-keys"
                  value={op.source_path ?? ''}
                  onChange={(e) => updateOperation(idx, { source_path: e.target.value })}
                  placeholder="e.g. nested_arrays"
                  className="w-full px-2 py-1.5 bg-white border border-[var(--border)] rounded-lg text-xs outline-none text-[var(--text-primary)] transition-colors duration-150 box-border"
                />
              </div>
              <div className="flex-1">
                <label className="text-[9px] font-bold text-[var(--text-muted)] block mb-0.5">DESTINATION KEY</label>
                <input
                  value={op.destination ?? ''}
                  onChange={(e) => updateOperation(idx, { destination: e.target.value })}
                  placeholder="e.g. flat_array"
                  className="w-full px-2 py-1.5 bg-white border border-[var(--border)] rounded-lg text-xs outline-none text-[var(--text-primary)] transition-colors duration-150 box-border"
                />
              </div>
            </div>
          )}

          {op.type === 'flatten_dict' && (
            <div>
              <label className="text-[9px] font-bold text-[var(--text-muted)] block mb-0.5">SEPARATOR (CHARACTER)</label>
              <input
                value={op.separator ?? '/'}
                onChange={(e) => updateOperation(idx, { separator: e.target.value })}
                placeholder="e.g. /"
                className="w-full px-2 py-1.5 bg-white border border-[var(--border)] rounded-lg text-xs outline-none text-[var(--text-primary)] transition-colors duration-150 box-border"
              />
            </div>
          )}

          {op.type === 'pick' && (
            <div>
              <label className="text-[9px] font-bold text-[var(--text-muted)] block mb-0.5">FIELDS TO KEEP (COMMA-SEPARATED)</label>
              <CommaArrayEditor
                value={op.fields}
                onChange={(v) => updateOperation(idx, { fields: v })}
                placeholder="name, age, address.city"
                isTextarea={true}
                rows={2}
              />
            </div>
          )}

          {op.type === 'omit' && (
            <div>
              <label className="text-[9px] font-bold text-[var(--text-muted)] block mb-0.5">KEYS TO OMIT (COMMA-SEPARATED)</label>
              <CommaArrayEditor
                value={op.keys}
                onChange={(v) => updateOperation(idx, { keys: v })}
                placeholder="ssn, password, internal_id"
                isTextarea={true}
                rows={2}
              />
            </div>
          )}

          {op.type === 'rename_map' && (
            <div>
              <KeyValueEditor
                value={op.rename_map || {}}
                onChange={(v) => updateOperation(idx, { rename_map: v })}
                label="Rename Map (Old Key → New Key)"
                hint="Left = original key name, Right = new key name"
              />
            </div>
          )}
        </div>
      ))}

      <button
        onClick={addOperation}
        className="flex items-center justify-center gap-1.5 p-2.5 bg-transparent border border-dashed border-[var(--border)] rounded-lg text-[var(--accent-btn)] text-xs font-semibold cursor-pointer transition-all duration-150 hover:border-[var(--accent-btn)] hover:bg-[var(--accent-glow)]"
      >
        <FiPlus size={13} /> Add Transform Operation
      </button>
    </div>
  );
});

export const ClassificationClassesEditor = memo(function ClassificationClassesEditor({ value = [], onChange, engine }) {
  const addClass = () => {
    onChange([...value, { class: '', description: '', regex_patterns: [] }]);
  };

  const updateClass = (idx, key, val) => {
    const next = [...value];
    next[idx] = { ...next[idx], [key]: val };
    onChange(next);
  };

  const removeClass = (idx) => {
    const next = [...value];
    next.splice(idx, 1);
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-2.5">
      {value.map((c, idx) => (
        <div key={idx} className="p-3 bg-slate-50 border border-[var(--border)] rounded-xl relative">
          <button
            onClick={() => removeClass(idx)}
            className="absolute top-2 right-2 bg-transparent border-none text-red-500 cursor-pointer"
          >
            <FiTrash2 size={13} />
          </button>
          
          <Field label="Class Name">
            <Input value={c.class} onChange={(v) => updateClass(idx, 'class', v)} placeholder="e.g. support_request" />
          </Field>

          {engine === 'regex' ? (
            <Field label="Regex Patterns (comma-separated)">
              <CommaArrayEditor
                value={c.regex_patterns}
                onChange={(v) => updateClass(idx, 'regex_patterns', v)}
                placeholder="refund, billing, cancel"
              />
            </Field>
          ) : (
            <Field label="Class Description / Hint">
              <Textarea value={c.description} onChange={(v) => updateClass(idx, 'description', v)} placeholder="Describe when to route messages to this class..." rows={2} />
            </Field>
          )}
        </div>
      ))}
      <button
        onClick={addClass}
        className="p-2 bg-slate-50 border border-dashed border-[var(--border)] rounded-lg text-[11px] text-[var(--accent-btn)] cursor-pointer font-semibold mt-1"
      >
        + Add Class
      </button>
    </div>
  );
});

export const WeightageCategoriesEditor = memo(function WeightageCategoriesEditor({ categories = [], onChange }) {
  const [collapsedCategories, setCollapsedCategories] = useState({});
  const [collapsedFields, setCollapsedFields] = useState({});
  const [conditionWidthPct, setConditionWidthPct] = useState(65);
  const dragStartRef = useRef({ x: 0, pct: 65 });

  const handleMouseDown = (e, container) => {
    e.preventDefault();
    if (!container) return;
    const rect = container.getBoundingClientRect();
    dragStartRef.current = {
      startX: e.clientX,
      startPct: conditionWidthPct,
      width: rect.width
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    const { startX, startPct, width } = dragStartRef.current;
    if (!width) return;
    const deltaX = e.clientX - startX;
    const deltaPct = (deltaX / width) * 100;
    let newPct = startPct + deltaPct;
    newPct = Math.max(20, Math.min(80, newPct));
    setConditionWidthPct(newPct);
  };

  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const sanitizeName = (val) => {
    return val.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  };

  const addCategory = () => {
    const nextName = sanitizeName(`category_${categories.length + 1}`);
    const next = [...categories, { name: nextName, fields: [], enabled: true }];
    onChange(next);
  };

  const updateCategory = (catIdx, patch) => {
    const next = [...categories];
    if (patch.name !== undefined) {
      patch.name = sanitizeName(patch.name);
    }
    next[catIdx] = { ...next[catIdx], ...patch };
    onChange(next);
  };

  const removeCategory = (catIdx) => {
    const next = categories.filter((_, i) => i !== catIdx);
    onChange(next);
  };

  const addField = (catIdx) => {
    const cat = categories[catIdx];
    const newField = { name: `new_field`, match_strategy: 'first_match', default_weight: 0.0, conditions: [], enabled: true };
    const nextFields = [...(cat.fields || []), newField];
    updateCategory(catIdx, { fields: nextFields });
  };

  const updateField = (catIdx, fieldIdx, patch) => {
    const cat = categories[catIdx];
    const nextFields = [...(cat.fields || [])];
    if (patch.name !== undefined) {
      patch.name = sanitizeName(patch.name);
    }
    nextFields[fieldIdx] = { ...nextFields[fieldIdx], ...patch };
    updateCategory(catIdx, { fields: nextFields });
  };

  const removeField = (catIdx, fieldIdx) => {
    const cat = categories[catIdx];
    const nextFields = (cat.fields || []).filter((_, i) => i !== fieldIdx);
    updateCategory(catIdx, { fields: nextFields });
  };

  const addCondition = (catIdx, fieldIdx) => {
    const field = categories[catIdx].fields[fieldIdx];
    const newCondition = { condition: 'variable > 10', weight: 10.0, enabled: true };
    const nextConditions = [...(field.conditions || []), newCondition];
    updateField(catIdx, fieldIdx, { conditions: nextConditions });
  };

  const updateCondition = (catIdx, fieldIdx, condIdx, patch) => {
    const field = categories[catIdx].fields[fieldIdx];
    const nextConditions = [...(field.conditions || [])];
    nextConditions[condIdx] = { ...nextConditions[condIdx], ...patch };
    updateField(catIdx, fieldIdx, { conditions: nextConditions });
  };

  const removeCondition = (catIdx, fieldIdx, condIdx) => {
    const field = categories[catIdx].fields[fieldIdx];
    const nextConditions = (field.conditions || []).filter((_, i) => i !== condIdx);
    updateField(catIdx, fieldIdx, { conditions: nextConditions });
  };

  const toggleCategoryCollapse = (catIdx) => {
    setCollapsedCategories(prev => ({ ...prev, [catIdx]: !prev[catIdx] }));
  };

  const toggleFieldCollapse = (catIdx, fieldIdx) => {
    const key = `${catIdx}_${fieldIdx}`;
    setCollapsedFields(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wide flex items-center gap-1.5">
          <FiSliders size={12} className="text-[var(--accent-btn)]" /> Categories & Rules
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {categories.map((cat, catIdx) => {
          const isCatCollapsed = collapsedCategories[catIdx];
          const isCatEnabled = cat.enabled !== false;
          return (
            <div key={catIdx} className={`p-3.5 bg-slate-50 rounded-xl border border-[var(--border)] flex flex-col gap-2.5 shadow-[0_2px_8px_rgba(124,58,237,0.04)] transition-all duration-200 ${isCatEnabled ? 'opacity-100' : 'opacity-60'}`}>

              {/* Category Header: Chevron+Name | Up/Down | Toggle | Delete */}
              <div className={`flex items-center gap-1.5 ${isCatCollapsed ? '' : 'border-b border-slate-200 pb-2'}`}>
                {/* Collapse toggle + name */}
                <div className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer" onClick={() => toggleCategoryCollapse(catIdx)}>
                  <FiChevronDown 
                    size={14} 
                    className="text-[var(--text-muted)] transition-transform duration-150 shrink-0"
                    style={{ transform: isCatCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }} 
                  />
                  <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                    {cat.name || `Category #${catIdx + 1}`}
                  </span>
                </div>

                {/* Up/Down */}
                <div className="flex items-center gap-0.5 border-r border-[var(--border)] pr-1.5">
                  <button
                    onClick={() => {
                      if (catIdx === 0) return;
                      const next = [...categories];
                      [next[catIdx - 1], next[catIdx]] = [next[catIdx], next[catIdx - 1]];
                      onChange(next);
                    }}
                    disabled={catIdx === 0}
                    className="bg-transparent border-none text-[var(--text-muted)] cursor-pointer disabled:opacity-30 p-0.5"
                    title="Move Up"
                  ><FiChevronDown size={13} className="rotate-180" /></button>
                  <button
                    onClick={() => {
                      if (catIdx === categories.length - 1) return;
                      const next = [...categories];
                      [next[catIdx], next[catIdx + 1]] = [next[catIdx + 1], next[catIdx]];
                      onChange(next);
                    }}
                    disabled={catIdx === categories.length - 1}
                    className="bg-transparent border-none text-[var(--text-muted)] cursor-pointer disabled:opacity-30 p-0.5"
                    title="Move Down"
                  ><FiChevronDown size={13} /></button>
                </div>

                {/* Toggle (purple) */}
                <MiniatureToggle
                  checked={isCatEnabled}
                  onChange={(v) => updateCategory(catIdx, { enabled: v })}
                />

                {/* Delete */}
                <button
                  onClick={() => removeCategory(catIdx)}
                  className="bg-transparent border-none text-red-500 cursor-pointer p-0.5"
                  title="Delete Category"
                >
                  <FiTrash2 size={13} />
                </button>
              </div>

              {/* Fields List (collapsible) */}
              {!isCatCollapsed && (
                <div className="mt-3.5 flex flex-col gap-3">
                  <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wide">Fields in {cat.name}</div>

                  {(cat.fields || []).map((field, fieldIdx) => {
                    const fieldKey = `${catIdx}_${fieldIdx}`;
                    const isFieldCollapsed = collapsedFields[fieldKey];
                    const isFieldEnabled = field.enabled !== false;
                    return (
                      <div key={fieldIdx} className={`p-3 bg-white rounded-lg border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.02)] flex flex-col gap-2.5 transition-all duration-200 ${isFieldEnabled && isCatEnabled ? 'opacity-100' : 'opacity-60'}`}>

                        {/* Field Header: Chevron+Name | Up/Down | Toggle | Delete */}
                        <div className={`flex items-center gap-1.5 ${isFieldCollapsed ? '' : 'border-b border-slate-100 pb-1.5'}`}>
                          {/* Collapse toggle + name */}
                          <div className="flex items-center gap-1.5 flex-1 min-w-0 cursor-pointer" onClick={() => toggleFieldCollapse(catIdx, fieldIdx)}>
                            <FiChevronDown 
                              size={13} 
                              className="text-[var(--text-muted)] transition-transform duration-150 shrink-0"
                              style={{ transform: isFieldCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }} 
                            />
                            <span className="text-[10px] font-bold text-[var(--text-primary)] truncate">
                              {field.name || `Field #${fieldIdx + 1}`}
                            </span>
                          </div>

                          {/* Up/Down */}
                          <div className="flex items-center gap-0.5 border-r border-[var(--border)] pr-1">
                            <button
                              onClick={() => {
                                const cat = categories[catIdx];
                                if (fieldIdx === 0) return;
                                const nextFields = [...(cat.fields || [])];
                                [nextFields[fieldIdx - 1], nextFields[fieldIdx]] = [nextFields[fieldIdx], nextFields[fieldIdx - 1]];
                                updateCategory(catIdx, { fields: nextFields });
                              }}
                              disabled={fieldIdx === 0}
                              className="bg-transparent border-none text-[var(--text-muted)] cursor-pointer disabled:opacity-30 p-0.5"
                              title="Move Up"
                            ><FiChevronDown size={12} className="rotate-180" /></button>
                            <button
                              onClick={() => {
                                const cat = categories[catIdx];
                                if (fieldIdx === (cat.fields || []).length - 1) return;
                                const nextFields = [...(cat.fields || [])];
                                [nextFields[fieldIdx], nextFields[fieldIdx + 1]] = [nextFields[fieldIdx + 1], nextFields[fieldIdx]];
                                updateCategory(catIdx, { fields: nextFields });
                              }}
                              disabled={fieldIdx === (categories[catIdx].fields || []).length - 1}
                              className="bg-transparent border-none text-[var(--text-muted)] cursor-pointer disabled:opacity-30 p-0.5"
                              title="Move Down"
                            ><FiChevronDown size={12} /></button>
                          </div>

                          {/* Toggle (purple) */}
                          <MiniatureToggle
                            checked={isFieldEnabled}
                            onChange={(v) => updateField(catIdx, fieldIdx, { enabled: v })}
                          />

                          {/* Delete */}
                          <button
                            onClick={() => removeField(catIdx, fieldIdx)}
                            className="bg-transparent border-none text-red-500 cursor-pointer p-0.5"
                            title="Delete Field"
                          >
                            <FiTrash2 size={12} />
                          </button>
                        </div>

                        {/* Field settings - collapsible */}
                        {!isFieldCollapsed && (
                          <div className="flex flex-col gap-2.5">
                            <div>
                              <Field label="Field / JSON Path" hint="Lowercase & underscores only.">
                                <Input
                                  value={field.name}
                                  onChange={(v) => updateField(catIdx, fieldIdx, { name: v })}
                                  placeholder="e.g. loan_amount"
                                  disabled={!isFieldEnabled || !isCatEnabled}
                                />
                              </Field>
                            </div>

                            <div className="flex gap-2.5 flex-wrap">
                              <div className="flex-[1_1_120px]">
                                <Field label="Strategy">
                                  <Select
                                    value={field.match_strategy || 'first_match'}
                                    onChange={(v) => updateField(catIdx, fieldIdx, { match_strategy: v })}
                                    options={[
                                      { value: 'first_match', label: 'First Match' },
                                      { value: 'sum_all', label: 'Sum All' }
                                    ]}
                                    disabled={!isFieldEnabled || !isCatEnabled}
                                  />
                                </Field>
                              </div>
                              <div className="flex-[1_1_80px]">
                                <Field label="Fallback Wt">
                                  <Input
                                    type="number"
                                    value={field.default_weight ?? 0}
                                    onChange={(v) => updateField(catIdx, fieldIdx, { default_weight: parseFloat(v) || 0 })}
                                    placeholder="0"
                                    disabled={!isFieldEnabled || !isCatEnabled}
                                  />
                                </Field>
                              </div>
                            </div>

                            {/* Conditions */}
                            <div className="border-t border-dashed border-slate-200 pt-2.5">
                              <div className="text-[10px] font-bold text-[var(--text-muted)] mb-2">Conditions & Weights</div>
                              <div className="flex flex-col gap-2">
                                {(field.conditions || []).map((cond, condIdx) => {
                                  const isCondEnabled = cond.enabled !== false;
                                  return (
                                    <div key={condIdx} className={`flex gap-0 items-center p-1.5 px-2 bg-slate-50 rounded-lg border border-slate-100 transition-all duration-200 ${isCondEnabled && isFieldEnabled && isCatEnabled ? 'opacity-100' : 'opacity-60'}`}>
                                      <div className="shrink-0 pr-1 box-border" style={{ width: `${conditionWidthPct}%` }}>
                                        <textarea
                                          value={cond.condition}
                                          onChange={(v) => updateCondition(catIdx, fieldIdx, condIdx, { condition: v.target.value })}
                                          placeholder="Condition (e.g. loan_amount > 5000)"
                                          disabled={!isCondEnabled || !isFieldEnabled || !isCatEnabled}
                                          rows={1}
                                          className="w-full min-h-[34px] px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-white text-xs outline-none resize-none box-border focus:border-[var(--accent-btn)]"
                                        />
                                      </div>

                                      {/* Drag Handle */}
                                      <div
                                        onMouseDown={(e) => handleMouseDown(e, e.currentTarget.parentNode)}
                                        className="w-3 cursor-col-resize flex justify-center items-center self-stretch select-none mx-1 relative"
                                        title="Drag to resize horizontally"
                                      >
                                        <div className="w-0.5 h-[85%] bg-slate-300 rounded-sm" />
                                      </div>

                                      <div className="flex-1 pr-2 box-border">
                                        <Input
                                          value={cond.weight}
                                          onChange={(v) => {
                                            const parsed = parseFloat(v);
                                            const val = isNaN(parsed) ? v : parsed;
                                            updateCondition(catIdx, fieldIdx, condIdx, { weight: val });
                                          }}
                                          placeholder="Weight"
                                          disabled={!isCondEnabled || !isFieldEnabled || !isCatEnabled}
                                        />
                                      </div>
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <div title="Toggle Condition Enabled" className="flex items-center">
                                          <MiniatureToggle
                                            checked={isCondEnabled}
                                            onChange={(v) => updateCondition(catIdx, fieldIdx, condIdx, { enabled: v })}
                                          />
                                        </div>
                                        <button
                                          onClick={() => removeCondition(catIdx, fieldIdx, condIdx)}
                                          className="bg-transparent border-none text-red-500 cursor-pointer p-1"
                                        >
                                          <FiTrash2 size={12} />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}

                                <button
                                  onClick={() => addCondition(catIdx, fieldIdx)}
                                  disabled={!isFieldEnabled || !isCatEnabled}
                                  className={`self-start flex items-center gap-1 p-1.5 px-2.5 rounded-md border border-dashed border-[var(--border)] bg-slate-50 text-[var(--text-secondary)] text-[10px] font-semibold transition-all duration-200 ${isFieldEnabled && isCatEnabled ? 'cursor-pointer opacity-100 hover:border-[var(--accent-btn)] hover:text-[var(--accent-btn)]' : 'cursor-not-allowed opacity-50'}`}
                                >
                                  <FiPlus size={10} /> Add Condition
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <button
                    onClick={() => addField(catIdx)}
                    className="self-start flex items-center gap-1.5 p-2 px-3 rounded-lg border border-dashed border-[var(--border)] bg-white text-[var(--text-secondary)] text-[11px] font-semibold cursor-pointer hover:border-[var(--accent-btn)] hover:text-[var(--accent-btn)]"
                  >
                    <FiPlus size={12} /> Add Field
                  </button>
                </div>
              )}
            </div>
          );
        })}

        <button
          onClick={addCategory}
          className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-[var(--border)] bg-white text-[var(--text-secondary)] text-xs font-semibold cursor-pointer transition-all duration-200 hover:border-[var(--accent-btn)] hover:text-[var(--accent-btn)]"
        >
          <FiPlus size={14} /> Add Category
        </button>
      </div>
    </div>
  );
});
